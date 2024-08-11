package edu.brown.cs.student.main;

import edu.brown.cs.student.main.imgur.ImgurService;
import edu.brown.cs.student.main.responses.ServiceResponse;
import edu.brown.cs.student.main.types.Draft;
import edu.brown.cs.student.main.types.Poster;
import edu.brown.cs.student.main.user.UserService;
import java.time.LocalDateTime;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/** This class defines the mappings and endpoints for poster management */
@RestController
@RequestMapping(value = "/drafts") // maps the controller to the "/posters" endpoint.
@CrossOrigin(origins = {"http://localhost:5173", "https://posters-at-brown.vercel.app/","https://postersatbrown.com", "http://postersatbrown.com",
        "www.postersatbrown.com","postersatbrown.com"})
public class DraftController {

  private final DraftService draftService; // instance of the class that does all the dirty work
  private final ImgurService imgurService;
  private final UserService userService;

  public DraftController(
      DraftService draftService, ImgurService imgurService, UserService userService) {
    this.draftService = draftService;
    this.imgurService = imgurService;
    this.userService = userService;
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
  public CompletionStage<ResponseEntity<ServiceResponse<Poster>>> getPosterById(
      @PathVariable String id) {
    return draftService
        .getDraftById(id)
        .thenApply(ResponseEntity::ok)
        .exceptionally(ex -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
  }

  // TODO: have some error checking (on frontend) to display an error if the link is corrupted
  @PostMapping(value = "/draft/fromlink")
  public CompletableFuture<ServiceResponse<Draft>> createFromLink(
      @RequestBody Content content,
      @RequestParam(required = true) String userId,
      @RequestParam(required = true) String startDate) {
    Draft poster = new Draft();
    poster.setContent(content.getContent());
    poster.setStartDate(LocalDateTime.parse(startDate));
    poster.setUserId(userId);
    System.out.println("Start date: " + startDate);
    this.draftService.createDraft(poster, userId);
    return CompletableFuture.completedFuture(
        new ServiceResponse<Draft>(poster, "created new draft using existing link"));
  }

  @PostMapping(value = "/uploadToImgur")
  public CompletableFuture<ServiceResponse<String>> uploadToImgur(
      @RequestBody MultipartFile content, @RequestParam(required = false) String userId) {
    ServiceResponse<String> imgurResponse = imgurService.uploadToImgur(content);

    return CompletableFuture.completedFuture(
        new ServiceResponse<String>(imgurResponse.getData(), "uploaded to imgur"));
  }

  /**
   * sends a POST request to the mapping /poster/create
   *
   * @return a JSONified ServiceResponse instance that contains a "message" (string) field and a
   *     "data" (JSON) field that contains the data ofi the poster that was just created
   */
  @PostMapping(value = "/draft/imgur")
  public CompletableFuture<ServiceResponse<Draft>> createImgurLink(
      @RequestBody MultipartFile content,
      @RequestParam(required = true) String userId,
      @RequestParam(required = true) String startDate) {
    Draft poster = new Draft();
    ServiceResponse<String> imgurResponse = imgurService.uploadToImgur(content);
    poster.setContent(imgurResponse.getData());
    poster.setStartDate(LocalDateTime.parse(startDate));
    poster.setUserId(userId);
    this.draftService.createDraft(poster, userId);
    return CompletableFuture.completedFuture(
        new ServiceResponse<Draft>(poster, "created new draft using imgur"));
  }

  /**
   * sends a POST request to the mapping /poster/create
   *
   * @return a JSONified ServiceResponse instance that contains a "message" (string) field and a
   *     "data" (JSON) field that contains the data of the poster that was just created
   */

  /** JUST FOR MONGO. DO NOT USE IN CODE. */
  @DeleteMapping("/delete")
  public void deleteAll() {
    draftService.deleteAll();
  }

  /**
   * sends a DELETE request to delete a poster
   *
   * @param id the id (string) of the poster to be deleted
   * @return a JSONified ServiceResponse instance that contains a "message" (string) field and a
   *     "data" (JSON) field that contains the data of the poster that was just deleted
   */
  @DeleteMapping("/delete/{id}")
  public CompletableFuture<ResponseEntity<ServiceResponse<String>>> deletePoster(
      @PathVariable String id) {
    return draftService
        .getDraftById(id)
        .thenCompose(
            existingDraft -> {
              if (existingDraft.getData() != null) {
                if (existingDraft.getData().getStartDate() == null) {
                  return CompletableFuture.completedFuture(
                      new ServiceResponse<>(
                          "Poster with id "
                              + id
                              + " cannot be created because it does not have a start date")); // also check if existingDraft.getData().getStartDate() is null
                }

                this.userService.removeFromDrafts(
                    existingDraft.getData().getUserId(), existingDraft.getData());
                return this.draftService.removeDraftFromDatabase(existingDraft.getData().getID());
              } else {
                return CompletableFuture.completedFuture(
                    new ServiceResponse<>("Draft with id " + id + " not found"));
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
      @PathVariable String id, @RequestBody Draft updatedPoster) {
    return draftService
        .getDraftById(id)
        .thenCompose(
            existingPoster -> {
              if (existingPoster.getData() != null) {
                updatedPoster.setID(id); // Ensure ID consistency
                return draftService.updateDraft(existingPoster.getData(), updatedPoster);
              } else {
                return CompletableFuture.completedFuture(
                    new ServiceResponse<>("Poster with id " + id + " not found"));
              }
            })
        .thenApply(response -> ResponseEntity.ok(response))
        .exceptionally(ex -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
  }
}
