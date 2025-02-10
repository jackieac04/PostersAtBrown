package edu.brown.cs.student.main;

import edu.brown.cs.student.main.ocr.OCRAsyncTask;
import edu.brown.cs.student.main.responses.ServiceResponse;
import edu.brown.cs.student.main.types.Draft;
import edu.brown.cs.student.main.types.Poster;
import edu.brown.cs.student.main.user.User;
import edu.brown.cs.student.main.user.UserService;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class DraftService {

  private final DraftRepository draftRepository;

  private final UserService userService;

  @Autowired private OCRAsyncTask task;

  @Autowired
  public DraftService(DraftRepository draftRepository, UserService userService) {
    this.draftRepository = draftRepository;
    this.userService = userService;
  }

  public CompletableFuture<ServiceResponse<Poster>> getDraftById(String id) {
    return this.getDrafts()
        .thenCompose(
            posters ->
                posters.stream()
                    .filter(poster -> id.equals(poster.getID()))
                    .findFirst()
                    .map(
                        poster ->
                            CompletableFuture.completedFuture(
                                new ServiceResponse<Poster>(poster, "poster found")))
                    .orElseGet(
                        () ->
                            CompletableFuture.completedFuture(
                                new ServiceResponse<Poster>("Poster with id " + id + " not found"))));
  }

  @Async
  public CompletableFuture<List<Draft>> getDrafts() {
    return CompletableFuture.completedFuture(draftRepository.findAll());
  }

  public ServiceResponse<Draft> createDraft(Draft poster, String userID) {
    ServiceResponse<Draft> response;
    // Associate the poster with the user
    CompletableFuture<ServiceResponse<User>> associateResponse =
        userService.associatePosterWithUser(userID, poster, true);

    try {
      associateResponse.get(); // Wait for the completion of the asynchronous task
    } catch (InterruptedException | ExecutionException e) {
      System.err.println("Error: " + e.getMessage());
    }

    if (!associateResponse.isCompletedExceptionally()) {
      System.out.println(associateResponse);
      System.out.println("associateResponse.isCompletedExceptionally() == false");
      // Save the Poster object to the database
      try {
        HashMap<String, Object> suggestedFields = this.task.sendPost(poster.getContent());
        if (suggestedFields.get("title") == null) {
          poster.setTitle("Untitled");
        } else {
          poster.setTitle((String) suggestedFields.get("title"));
        }
        poster.setDescription((String) suggestedFields.get("description"));
        poster.setLink((String) suggestedFields.get("link"));
        poster.setTags((HashSet<String>) suggestedFields.get("tags"));

      } catch (Exception e) {
        System.err.println("Error reading text on image file: " + e.getMessage());
      }

      if (poster.isPoster()) {
        if (draftRepository
            .findById(poster.getID())
            .isEmpty()) { // check if already exists in database
          System.out.println("Saving to mongo now");
          Draft savedPoster = draftRepository.insert(poster);
          // Create a response object
          response = new ServiceResponse<>(savedPoster, "added to database");
        } else {
          System.out.println("Saving to mongo now");
          Draft savedPoster = draftRepository.save(poster);
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

  @Async
  public void deleteAll() {
    this.draftRepository.deleteAll();
  }

  @Async
  public CompletableFuture<ServiceResponse<Poster>> updateDraft(Poster existingDraft, Poster updatedDraft) {
    if (existingDraft != null) {
      return this.getDraftById(existingDraft.getID())
              .thenApply(
                      oldPosterResponse -> {
                        Draft oldPoster = (Draft) oldPosterResponse.getData();
                        if (oldPoster != null) {
                          if (updatedDraft.getStartDate() != null)
                            oldPoster.setStartDate(updatedDraft.getStartDate());
                          if (updatedDraft.getEndDate() != null)
                            oldPoster.setEndDate(updatedDraft.getEndDate());
                          if (updatedDraft.getContent() != null)
                            oldPoster.setContent(updatedDraft.getContent());
                          oldPoster.setIsRecurring(updatedDraft.getIsRecurring());
                          if (updatedDraft.getTitle() != null)
                            oldPoster.setTitle((updatedDraft.getTitle()));
                          if (updatedDraft.getDescription() != null)
                            oldPoster.setDescription(updatedDraft.getDescription());
                          if (updatedDraft.getLocation() != null)
                            oldPoster.setLocation(updatedDraft.getLocation());
                          if (updatedDraft.getLink() != null) oldPoster.setLink(updatedDraft.getLink());
                          if (updatedDraft.getTags() != null) oldPoster.setTags(updatedDraft.getTags());
                          draftRepository.save(oldPoster);
                          return new ServiceResponse<>(oldPoster, "Poster updated");
                        } else {
                          return new ServiceResponse<>("Failed to update poster - Poster not found");
                        }
                      });
    } else {
      return CompletableFuture.completedFuture(
              new ServiceResponse<>("Failed to update poster - existing draft with provided ID does not exist"));
    }
  }

  @Async
  public CompletableFuture<ServiceResponse<String>> removeDraftFromDatabase(String id) {
    Optional<Draft> draftToDelete = draftRepository.findById(id);

    if (draftToDelete.isPresent()) {
      draftRepository.deleteById(id);
      return CompletableFuture.completedFuture(
          new ServiceResponse<>(
              "Draft with ID " + id + " has been removed from the drafts collection"));
    } else {
      return CompletableFuture.completedFuture(new ServiceResponse<>("Poster not found"));
    }
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
                          Set<Poster> userDrafts = user.getData().getDrafts();
                          userDrafts.removeIf(poster -> poster.getID().equals(id));
                          user.getData().setDrafts(userDrafts);
                          // Update the user entity in the database
                          return userService
                                  .updateUser(user.getData())
                                  .thenApply(
                                          updatedUser -> {
                                            System.out.println(updatedUser);
                                            if (updatedUser.getData() != null) {
                                              return new ServiceResponse<>(
                                                      "Draft with id "
                                                              + id
                                                              + " removed from user's created drafts");
                                            } else {
                                              return new ServiceResponse<>(
                                                      "Failed to remove draft from user's created drafts");
                                            }
                                          });
                        } else {
                          return CompletableFuture.completedFuture(
                                  new ServiceResponse<>(
                                          "Draft with id "
                                                  + id
                                                  + " not removed from users created drafts"));
                        }
                      });
      return this
              .removeDraftFromDatabase(id)
              .thenApply(
                      deleted -> new ServiceResponse<>("Draft with id " + id + " deleted"));
    } else {
      return CompletableFuture.completedFuture(
              new ServiceResponse<>("Draft with id " + id + " not found"));
    }

  }
}
