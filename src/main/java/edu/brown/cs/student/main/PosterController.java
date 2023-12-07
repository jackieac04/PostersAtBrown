package edu.brown.cs.student.main;

import edu.brown.cs.student.main.imgur.ImgurService;

import edu.brown.cs.student.main.responses.ServiceResponse;
import edu.brown.cs.student.main.types.Poster;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/** This class defines the mappings and endpoints for poster management */
@RestController
@RequestMapping(value = "/posters") // maps the controller to the "/posters" endpoint.
public class PosterController {

    private final PosterService posterService; // instance of the class that does all the dirty work
    private final ImgurService imgurService;

    public PosterController(PosterService posterService, ImgurService imgurService) {
        this.posterService = posterService;
        this.imgurService = imgurService;
    }

    /**
     * Sends a GET request
     *
     * @return all posters (JSONified)
     */
    @GetMapping("/")
    public CompletableFuture<ResponseEntity<List<Poster>>> getAllPosters() {
        return posterService
                .getPosters()
                .thenApply(ResponseEntity::ok)
                .exceptionally(ex -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
    }

    /**
     * sends a GET request for one specific poster
     *
     * @param id the id (string) for the poster
     * @return a JSONified ServiceResponse instance that contains a "message" (string) field and, if
     *     poster with id exists, a "data" (JSON) field that contains the data associated with that
     *     poster
     */
    @GetMapping("/{id}") // params like id should be enclosed in squiggly brackets
    public CompletableFuture<ResponseEntity<ServiceResponse<Poster>>> getPosterById(
            @PathVariable String id) {
        return posterService
                .getPosterById(id)
                .thenApply(ResponseEntity::ok)
                .exceptionally(ex -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
    }

    /**
     * sends a GET request to filter by tag(s)
     * @param tag an array of tags (strings)
     * @return a list of all posters matching the requested tags
     */
    @GetMapping("/tag/{tag}")
    public CompletableFuture<ResponseEntity<List<Poster>>> getPosterByTag(@PathVariable String[] tag) {
        if (tag.length == 1) {
            // If there is only one tag, use the searchByTag method
            return posterService
                    .searchByTag(tag[0])
                    .thenApply(ResponseEntity::ok)
                    .exceptionally(ex -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
        } else {
            // If there are multiple tags, use the searchByMultipleTags method
            return posterService
                    .searchByMultipleTags(tag)
                    .thenApply(ResponseEntity::ok)
                    .exceptionally(ex -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
        }
    }

    /**
     * sends a GET request for filtering by organization name
     * @param org name of the organization (string)
     * @return a list of all posters by the requested organization
     */
    @GetMapping("/org/{org}")
    public CompletableFuture<ResponseEntity<List<Poster>>> getPosterByOrg(@PathVariable String org){
        return posterService
                .searchByOrganization(org)
                .thenApply(ResponseEntity::ok)
                .exceptionally(ex -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
    }

    @GetMapping("/term")
    public CompletableFuture<ResponseEntity<List<Poster>>> getPosterByTerm(@RequestParam String term, @RequestParam(required = false) String[] tags){
        return posterService
                .searchByTerm(term,tags)
                .thenApply(ResponseEntity::ok)
                .exceptionally(ex -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
    }

    /**
     * sends a POST request to the mapping /poster/create
     *

     * @return a JSONified ServiceResponse instance that contains a "message" (string) field and a
     *     "data" (JSON) field that contains the data of the poster that was just created
     */
    @PostMapping(value = "/create")
    public CompletableFuture<ResponseEntity<ServiceResponse<Poster>>> createPoster(
            @RequestPart(value = "title", required = true) String title,
            @RequestPart(value = "description", required = false) String description,
            @RequestPart(value = "tags", required = false) HashSet<String> tags,
            @RequestPart(value = "isRecurring", required = false) Boolean isRecurring,
            @RequestPart(value = "content") MultipartFile content) {
        Poster poster = new Poster(title, description);
        poster.setTags(tags);
        poster.setIsRecurring(isRecurring);

        ServiceResponse imgurResponse = imgurService.uploadToImgur(content);
        poster.setContent(imgurResponse.getData().toString());
        return this.posterService
                .createPoster(poster)
                .thenApply(response -> ResponseEntity.ok(response)) // good response
                .exceptionally(
                        ex ->
                                ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(new ServiceResponse<>(poster, ex.getMessage())));
    }

    /**
     * sends a DELETE request to delete a poster
     *
     * @param id the id (string) of the poster to be deleted
     * @return a JSONified ServiceResponse instance that contains a "message" (string) field and a
     *     "data" (JSON) field that contains the data of the poster that was just deleted
     */
    @DeleteMapping("/delete/{id}")
    public CompletableFuture<ResponseEntity<ServiceResponse<Object>>> deletePoster(
            @PathVariable String id) {

        return posterService
                .getPosterById(id)
                .thenCompose(
                        existingPoster -> {
                            if (existingPoster.getData() != null) {
                                return posterService
                                        .deletePosterById(id)
                                        .thenApply(
                                                deleted -> new ServiceResponse<>("Poster with id " + id + "deleted"));
                            } else {
                                return CompletableFuture.completedFuture(
                                        new ServiceResponse<>("Poster with id " + id + "not found"));
                            }
                        })
                .thenApply(response -> ResponseEntity.ok(response))
                .exceptionally(ex -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
    }

    /**
     * sends a PUT request to update an existing poster. When integrated with the frontend, usage of
     * this endpoint will likely entail getting the details of an existing poster, then creating a
     * JSON object that contains some old data mixed with new data (since users will likely only want
     * to update 1 field at a time)
     *
     * @param id the id of the poster to be updated
     * @param updatedPoster the new poster filled in with fields that you want (see fields expected in
     *     Poster class) expected in JSON format in the request body
     * @return instance that contains a "message" (string) field and, if successful (the id is found),
     *     a "data" (JSON) field that contains the data of the poster that was just deleted
     */
    @PutMapping("/update/{id}")
    public CompletableFuture<ResponseEntity<ServiceResponse<Poster>>> updatePoster(
            @PathVariable String id, @RequestBody Poster updatedPoster) {
        return posterService
                .getPosterById(id)
                .thenCompose(
                        existingPoster -> {
                            if (existingPoster.getData() != null) {
                                updatedPoster.setID(id); // Ensure ID consistency
                                return posterService.updatePoster(updatedPoster);
                            } else {
                                return CompletableFuture.completedFuture(
                                        new ServiceResponse<>("Poster with id " + id + " not found"));
                            }
                        })
                .thenApply(response -> ResponseEntity.ok(response))
                .exceptionally(ex -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
    }
}

