package edu.brown.cs.student.main;

import edu.brown.cs.student.main.responses.ServiceResponse;
import edu.brown.cs.student.main.types.Poster;
import edu.brown.cs.student.main.types.PosterRepository;
import edu.brown.cs.student.main.user.User;
import edu.brown.cs.student.main.user.UserService;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * This class handles the logic of creating a poster. This involves validating the input data and
 * interacting with the database to persist the Poster object. Used by PosterController
 */
@Service
public class PosterService {

  private final PosterRepository posterRepository;

  private final UserService userService;

  @Autowired // annotation so Spring will automatically wire (inject) into dependent objects, in
  // this case PosterController
  public PosterService(PosterRepository posterRepository, UserService userService) {
    this.posterRepository = posterRepository;
    this.userService = userService;
  }

  // @Async
  public ServiceResponse<Poster> createPoster(Poster poster, String userID) {
    System.out.println("start of create poster");
    ServiceResponse<Poster> response;
    // Associate the poster with the user
    CompletableFuture<ServiceResponse<User>> associateResponse =
        userService.associatePosterWithUser(userID, poster, false);

    try {
      associateResponse.get(); // Wait for the completion of associate to avoid race condition
    } catch (InterruptedException | ExecutionException e) {

      System.err.println("Error when creating: " + e.getMessage());
    }
    userService.removeFromDrafts(userID, poster);

    if (!associateResponse.isCompletedExceptionally()) {
      System.out.println(associateResponse);


      // Save the Poster object to the database


      if (poster.isPoster()) {

        if (posterRepository
            .findById(poster.getID())
            .isEmpty()) { // check if already exists in database
          System.out.println("Saving to mongo now");
          Poster savedPoster = posterRepository.insert(poster);
          // Create a response object
          response = new ServiceResponse<>(savedPoster, "added to database");
        } else {
          System.out.println("Saving to mongo now");
          Poster savedPoster = posterRepository.save(poster);
          // Create a response object
          response = new ServiceResponse<>(savedPoster, "saved to database");
        }
      } else {
        response = new ServiceResponse<>(poster, "not added to database");
      }
      //  }
      response = new ServiceResponse<>(poster, "not added to database");
      // CompletableFuture is basically a Promise
      return (response);
    }

    return (new ServiceResponse<>(poster, "Invalid user ID provided"));
  }

  //  @Async
  //  public CompletableFuture<ServiceResponse<Poster>> updatePoster(Poster updatedPoster) {
  //
  //    //Poster updated = posterRepository.save(updatedPoster);
  //
  //    if (updatedPoster != null) {
  //      ServiceResponse<Poster> oldPoster = this.getPosterById(updatedPoster.getID());
  //      return CompletableFuture.completedFuture(new ServiceResponse<>(updatedPoster, "Poster
  // updated"));
  //    } else {
  //      return CompletableFuture.completedFuture(new ServiceResponse<>("Failed to update
  // poster"));
  //    }
  //  }
  //  @Async
  //  public CompletableFuture<ServiceResponse<Poster>> updatePoster(Poster updatedPoster) {
  //    if (updatedPoster != null) {
  //      return this.getPosterById(updatedPoster.getID())
  //          .thenApply(
  //              oldPosterResponse -> {
  //                Poster oldPoster = oldPosterResponse.getData();
  //                if (oldPoster != null) {
  //                  if (updatedPoster.getStartDate() != null)
  //                    oldPoster.setStartDate(updatedPoster.getStartDate());
  //                  if (updatedPoster.getEndDate() != null)
  //                    oldPoster.setEndDate(updatedPoster.getEndDate());
  //                  oldPoster.setIsRecurring(updatedPoster.getIsRecurring());
  //                  if (updatedPoster.getTitle() != null)
  //                    oldPoster.setTitle((updatedPoster.getTitle()));
  //                  if (updatedPoster.getDescription() != null)
  //                    oldPoster.setDescription(updatedPoster.getDescription());
  //                  if (updatedPoster.getLocation() != null)
  //                    oldPoster.setLocation(updatedPoster.getLocation());
  //                  if (updatedPoster.getLink() != null)
  // oldPoster.setLink(updatedPoster.getLink());
  //                  if (updatedPoster.getTags() != null)
  // oldPoster.setTags(updatedPoster.getTags());
  //                  posterRepository.save(oldPoster);
  //                  return new ServiceResponse<>(oldPoster, "Poster updated");
  //                } else {
  //                  return new ServiceResponse<>("Failed to update poster - Poster not found");
  //                }
  //              });
  //    } else {
  //      return CompletableFuture.completedFuture(
  //          new ServiceResponse<>("Failed to update poster - Invalid data"));
  //    }
  //  }

  @Async
  public CompletableFuture<ServiceResponse<Poster>> updatePoster(
      Poster existingPoster, Poster updatedPoster) {
    if (existingPoster != null) {
      return this.getPosterById(existingPoster.getID())
          .thenApply(
              oldPosterResponse -> {
                Poster oldPoster = oldPosterResponse.getData();
                if (oldPoster != null) {
                  if (updatedPoster.getStartDate() != null)
                    oldPoster.setStartDate(updatedPoster.getStartDate());
                  if (updatedPoster.getEndDate() != null)
                    oldPoster.setEndDate(updatedPoster.getEndDate());
                  if (updatedPoster.getContent() != null)
                    oldPoster.setContent(updatedPoster.getContent());
                  oldPoster.setIsRecurring(updatedPoster.getIsRecurring());
                  if (updatedPoster.getTitle() != null)
                    oldPoster.setTitle((updatedPoster.getTitle()));
                  if (updatedPoster.getDescription() != null)
                    oldPoster.setDescription(updatedPoster.getDescription());
                  if (updatedPoster.getLocation() != null)
                    oldPoster.setLocation(updatedPoster.getLocation());
                  if (updatedPoster.getLink() != null) oldPoster.setLink(updatedPoster.getLink());
                  if (updatedPoster.getTags() != null) oldPoster.setTags(updatedPoster.getTags());
                  posterRepository.save(oldPoster);
                  return new ServiceResponse<>(oldPoster, "Poster updated");
                } else {
                  return new ServiceResponse<>("Failed to update poster - Poster not found");
                }
              });
    } else {
      return CompletableFuture.completedFuture(
          new ServiceResponse<>("Failed to update poster - existing poster with provided ID does not exist"));
    }
  }

  @Async
  public CompletableFuture<List<Poster>> getPosters() {
    return CompletableFuture.completedFuture(posterRepository.findAll());
  }

  public CompletableFuture<ServiceResponse<Poster>> getPosterById(String id) {
    return this.getPosters()
        .thenCompose(
            posters ->
                posters.stream()
                    .filter(poster -> id.equals(poster.getID()))
                    .findFirst()
                    .map(
                        poster ->
                            CompletableFuture.completedFuture(
                                new ServiceResponse<Poster>(poster, "poster with id found")))
                    .orElseGet(
                        () ->
                            CompletableFuture.completedFuture(
                                new ServiceResponse<Poster>("Poster not found"))));
  }

  @Async
  public CompletableFuture<ServiceResponse<String>> removePosterFromDatabase(String id) {
    Optional<Poster> posterToDelete = posterRepository.findById(id);

    if (posterToDelete.isPresent()) {
      posterRepository.deleteById(id);
      return CompletableFuture.completedFuture(new ServiceResponse<>("Poster deleted"));
    } else {
      return CompletableFuture.completedFuture(new ServiceResponse<>("Poster not found"));
    }
  }

  @Async
  public CompletableFuture<List<Poster>> searchByTag(String tag) {
    return this.getPosters()
        .thenApply(
            posters ->
                posters.stream()
                    .filter(poster -> poster.getTags().contains(tag))
                    .collect(Collectors.toList()));
  }

  @Async
  public CompletableFuture<List<Poster>> searchByMultipleTags(String[] tags) {
    return this.getPosters()
        .thenApply(
            posters ->
                posters.stream()
                    .filter(poster -> this.containsAllTags(poster, tags))
                    .collect(Collectors.toList()));
  }

  @Async
  public CompletableFuture<List<Poster>> sortByRelevance(HashSet<String> interests) {
    return this.getPosters()
        .thenApply(
            posters ->
                posters.stream()
                    .filter(poster -> poster.getStartDate().isAfter(LocalDateTime.now()))
                    .sorted(Comparator.nullsLast(Comparator.comparing(Poster::getStartDate)))
                    .sorted(
                        Comparator.<Poster>comparingInt(poster -> poster.numRelevantTags(interests))
                            .reversed())
                    .collect(Collectors.toList()));
  }

  @Async
  public CompletableFuture<HashSet<Object>> getAllFields(String field) {
    return this.getPosters()
        .thenApply(
            posters -> {
              switch (field) {
                case "tags":
                  return posters.stream()
                      .flatMap(poster -> poster.getTags().stream())
                      .collect(Collectors.toCollection(HashSet::new));
                  //                        case "organization":
                  //                          return posters.stream()
                  //                                  .map(Poster::getOrganization)
                  //
                  // .collect(Collectors.toCollection(HashSet::new));
                case "title":
                  return posters.stream()
                      .map(Poster::getTitle)
                      .collect(Collectors.toCollection(HashSet::new));
                  //        case "createdAt":
                  //          return posters.stream()
                  //                  .map(poster -> poster.getCreatedAt().toString())
                  //                  .collect(Collectors.toCollection(HashSet::new));
                  //        case "startDate":
                  //          return posters.stream()
                  //                  .map(poster -> poster.getStartDate().toString())
                  //                  .collect(Collectors.toCollection(HashSet::new));
                  //        case "endDate":
                  //          return posters.stream()
                  //                  .map(poster -> poster.getEndDate().toString())
                  //                  .collect(Collectors.toCollection(HashSet::new));
                default:
                  return new HashSet<>();
              }
            });
  }

  @Async
  public CompletableFuture<List<Poster>> searchByName(String name) {
    return this.getPosters()
        .thenCompose(
            posters ->
                CompletableFuture.allOf(
                        posters.stream()
                            .map(
                                poster ->
                                    userService
                                        .getUserById(poster.getUserId())
                                        .thenApply(
                                            userResponse -> {
                                              if (userResponse.getData() != null
                                                  && userResponse
                                                      .getData()
                                                      .getName()
                                                      .equals(name)) {
                                                return poster;
                                              }
                                              return null;
                                            }))
                            .toArray(CompletableFuture<?>[]::new))
                    .thenApply(
                        __ ->
                            posters.stream()
                                .filter(Objects::nonNull)
                                .collect(Collectors.toList())));
  }

  @Async
  public CompletableFuture<List<Poster>> searchByTerm(String term, String[] tags) {
    if (tags.length == 0) {
      return this.getPosters()
          .thenApply(
              posters ->
                  posters.stream()
                      .filter(poster -> this.searchTermHelper(poster, term))
                      .collect(Collectors.toList()));
    } else {
      return this.getPosters()
          .thenApply(
              posters ->
                  posters.stream()
                      .filter(poster -> this.containsAllTags(poster, tags))
                      .filter(poster -> this.searchTermHelper(poster, term))
                      .collect(Collectors.toList()));
    }
  }

  @Async
  public void deleteAll() {
    this.posterRepository.deleteAll();
  }

  @Async
  public CompletableFuture<ServiceResponse<String>> deleteById(String id, String userId, Poster posterToDelete){

                      if (posterToDelete.getID().equals(id)
                              && posterToDelete.getUserId().equals(userId)) {
                        // remove from user's createdposters
                        userService
                                .getUserById(userId)
                                .thenCompose(
                                        user -> {
                                          if (user.getData() != null) {
                                            Set<Poster> userPosters = user.getData().getCreatedPosters();
                                            userPosters.removeIf(poster -> poster.getID().equals(id));
                                            user.getData().setCreatedPosters(userPosters);
                                            // Update the user entity in the database
                                            return userService
                                                    .updateUser(user.getData())
                                                    .thenApply(
                                                            updatedUser -> {
                                                              System.out.println(updatedUser);
                                                              if (updatedUser.getData() != null) {
                                                                return new ServiceResponse<>(
                                                                        "Poster with id "
                                                                                + id
                                                                                + " removed from user's created posters");
                                                              } else {
                                                                return new ServiceResponse<>(
                                                                        "Failed to remove poster from user's created posters");
                                                              }
                                                            });
                                          } else {
                                            return CompletableFuture.completedFuture(
                                                    new ServiceResponse<>(
                                                            "Poster with id "
                                                                    + id
                                                                    + " not removed from users created posters"));
                                          }
                                        });
                        return this
                                .removePosterFromDatabase(id)
                                .thenApply(
                                        deleted -> new ServiceResponse<>("Poster with id " + id + " deleted"));
                      } else {
                        return CompletableFuture.completedFuture(
                                new ServiceResponse<>("Poster with id " + id + " not found"));
                      }

  }

  private boolean containsAllTags(Poster poster, String[] tags) {
    HashSet<String> posterTags = poster.getTags();
    return posterTags.containsAll(Arrays.asList(tags));
  }

  private boolean searchTermHelper(Poster poster, String term) {
    String haystack = poster.returnHaystack(userService);
    BMSearch searcher = new BMSearch();

    boolean result = searcher.getSearchResult(term, haystack);
    return result;
  }
}
