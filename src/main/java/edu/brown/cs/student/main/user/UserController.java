package edu.brown.cs.student.main.user;

import edu.brown.cs.student.main.PosterService;
import edu.brown.cs.student.main.responses.ServiceResponse;
import edu.brown.cs.student.main.types.Poster;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value = "/users")
@CrossOrigin(origins = "*")
public class UserController {
  private final UserService userService;
  private final PosterService posterService;

  public UserController(UserService userService, PosterService posterService) {
    this.userService = userService;
    this.posterService = posterService;
  }

  @GetMapping("/")
  public CompletableFuture<ResponseEntity<List<User>>> getAllUsers() {
    return userService.getAllUsers().thenApply(ResponseEntity::ok);
  }

  @GetMapping("/{id}")
  public CompletableFuture<ResponseEntity<ServiceResponse<User>>> getUserById(
      @PathVariable String id) {
    return userService.getUserById(id).thenApply(ResponseEntity::ok);
  }

  @GetMapping("/savedPosters/{id}")
  public CompletableFuture<ResponseEntity<ServiceResponse<Set<Poster>>>> getSavedPosters(
      @PathVariable String id) {
    return userService
        .getUserById(id)
        .thenCompose(
            userServiceResponse -> {
              Set<Poster> savedPosters = userServiceResponse.getData().getSavedPosters();
              ServiceResponse<Set<Poster>> serviceResponse =
                  new ServiceResponse<>(savedPosters, "Retrieved saved posters");
              return CompletableFuture.completedFuture(serviceResponse);
            })
        .thenApply(response -> ResponseEntity.ok(response))
        .exceptionally(ex -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
  }

  @GetMapping("/drafts/{id}")
  public CompletableFuture<ResponseEntity<ServiceResponse<Set<Poster>>>> getDrafts(
      @PathVariable String id) {
    return userService
        .getUserById(id)
        .thenCompose(
            userServiceResponse -> {
              Set<Poster> drafts = userServiceResponse.getData().getDrafts();
              ServiceResponse<Set<Poster>> serviceResponse =
                  new ServiceResponse<>(drafts, "Retrieved saved posters");
              return CompletableFuture.completedFuture(serviceResponse);
            })
        .thenApply(response -> ResponseEntity.ok(response))
        .exceptionally(ex -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
  }

  @GetMapping("/createdPosters/{id}")
  public CompletableFuture<ResponseEntity<ServiceResponse<Set<Poster>>>> getCreatedPosters(
      @PathVariable String id) {
    return userService
        .getUserById(id)
        .thenCompose(
            userServiceResponse -> {
              Set<Poster> createdPosters = userServiceResponse.getData().getCreatedPosters();
              ServiceResponse<Set<Poster>> serviceResponse =
                  new ServiceResponse<>(createdPosters, "Retrieved saved posters");
              return CompletableFuture.completedFuture(serviceResponse);
            })
        .thenApply(response -> ResponseEntity.ok(response))
        .exceptionally(ex -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
  }

  @PostMapping(value = "/create", produces = "application/json")
  public CompletableFuture<ResponseEntity<ServiceResponse<User>>> createUser(
      @RequestBody User user) {
    return userService.createUser(user).thenApply(response -> ResponseEntity.ok(response));
  }

  @RequestMapping(value = "/create", method = RequestMethod.OPTIONS)
  public ResponseEntity<?> handleOptionsRequest() {
    HttpHeaders headers = new HttpHeaders();
    headers.add("Access-Control-Allow-Origin", "http://localhost:5173");
    headers.add("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
    headers.add("Access-Control-Allow-Headers", "Content-Type");
    headers.add("Access-Control-Allow-Credentials", "true");
    headers.add(
        "Access-Control-Max-Age", "3600"); // Optional, sets preflight request cache duration

    return new ResponseEntity<>(headers, HttpStatus.OK);
  }

  @DeleteMapping("/delete/{id}")
  public CompletableFuture<ResponseEntity<ServiceResponse<Object>>> deleteUser(
      @PathVariable String id) {
    return userService
        .getUserById(id)
        .thenCompose(
            existingUser -> {
              if (existingUser.getData() != null) {
                return userService
                    .deleteUserById(id)
                    .thenApply(deleted -> new ServiceResponse<>("User with id " + id + " deleted"));
              } else {
                return CompletableFuture.completedFuture(
                    new ServiceResponse<>("User with id " + id + " not found"));
              }
            })
        .thenApply(response -> ResponseEntity.ok(response))
        .exceptionally(ex -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
  }

  @PutMapping("/update/{id}")
  public CompletableFuture<ResponseEntity<ServiceResponse<User>>> updateUser(
      @PathVariable String id, @RequestBody User updatedUser) {
    return userService
        .getUserById(id)
        .thenCompose(
            existingUser -> {
              if (existingUser.getData() != null) {
                updatedUser.setId(id); // Ensure ID consistency
                return userService.updateUser(updatedUser);
              } else {
                return CompletableFuture.completedFuture(
                    new ServiceResponse<>("User with id " + id + " not found"));
              }
            })
        .thenApply(response -> ResponseEntity.ok(response))
        .exceptionally(ex -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
  }

  @PutMapping("/savePoster")
  public CompletableFuture<ResponseEntity<ServiceResponse<User>>> savePoster(
      @RequestParam(required = false) String posterId,
      @RequestParam(required = false) String userId) {
    return posterService
        .getPosterById(posterId)
        .thenCompose(
            poster -> {
              return userService
                  .getUserById(userId)
                  .thenCompose(
                      user -> {
                        if (user.getData() != null) {
                          if (poster.getData() != null) {
                            return userService.savePoster(userId, poster.getData());
                          } else {
                            return CompletableFuture.completedFuture(
                                new ServiceResponse<>("poster not found " + posterId));
                          }
                        } else {
                          return CompletableFuture.completedFuture(
                              new ServiceResponse<>("user not found " + userId));
                        }
                      });
            })
        .thenApply(response -> ResponseEntity.ok(response))
        .exceptionally(ex -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
  }

  @PutMapping("/unsavePoster")
  public CompletableFuture<ResponseEntity<ServiceResponse<User>>> unsavePoster(
      @RequestParam(required = false) String posterId,
      @RequestParam(required = false) String userId) {
    return posterService
        .getPosterById(posterId)
        .thenCompose(
            poster -> {
              return userService
                  .getUserById(userId)
                  .thenCompose(
                      user -> {
                        if (user.getData() != null) {
                          if (poster.getData() != null) {
                            System.out.println(posterId);
                            return userService.unsavePoster(userId, posterId);
                          } else {
                            return CompletableFuture.completedFuture(
                                new ServiceResponse<>("poster not found " + posterId));
                          }
                        } else {
                          return CompletableFuture.completedFuture(
                              new ServiceResponse<>("user not found " + userId));
                        }
                      });
            })
        .thenApply(response -> ResponseEntity.ok(response))
        .exceptionally(ex -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
  }

  @PutMapping("/addInterest")
  public CompletableFuture<ResponseEntity<ServiceResponse<User>>> addInterests(
      @RequestParam String userId, @RequestParam HashSet<String> interests) {
    return this.userService
        .addInterests(userId, interests)
        .thenApply(response -> ResponseEntity.ok(response))
        .exceptionally(ex -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
  }

  @PutMapping("/removeInterest")
  public CompletableFuture<ResponseEntity<ServiceResponse<User>>> removeInterests(
      @RequestParam String userId, @RequestParam HashSet<String> interests) {
    return this.userService
        .removeInterests(userId, interests)
        .thenApply(response -> ResponseEntity.ok(response))
        .exceptionally(ex -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
  }
}
