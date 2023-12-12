package edu.brown.cs.student.main.types;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.UUID;

import edu.brown.cs.student.main.user.User;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * The Poster model defines the necessary set of properties for a poster object and contains getters
 * and setters used to validate and change data
 */
@Document(collection = "poster")
public class Poster {

  // TODO: should probably update fields to include support for tags?
  @Id private String id; // or some identifier
  private String title; // req
  private String content; // url or image path
  private String description;
  private HashSet<String> tags;

  private LocalDateTime createdAt;

  private LocalDateTime startDate;

  private LocalDateTime endDate;

  private boolean isRecurring;
  private String organization;

  private String userId;

  @JsonPropertyOrder({"id", "title", "description"})
  public Poster(String title, String content, String description) {
    this.id = UUID.randomUUID().toString(); // so that IDs are randomly generated and unique
    this.title = title;
    this.content = content;
    this.description = description;
    this.tags = new HashSet<>();
  }

  /**
   * allows user to input tags and organization, which i'm using to test search
   */
  @JsonPropertyOrder({"id", "title", "description","tags","org"})

  public Poster(String title, String content, String description, HashSet<String> tags, String org) {
    // i turned ID to a string
    this.id = UUID.randomUUID().toString(); // so that IDs are randomly generated and unique
    this.title = title;
    this.content = content;
    this.description = description;
    this.tags = tags;
    this.organization = org;
  }
  /** Allows user to create poster w/o description of event */
  public Poster(String title, String content) {
    this.id = UUID.randomUUID().toString(); // so that IDs are randomly generated and unique
    this.title = title;
    this.content = content;
    this.tags = new HashSet<>();
    this.organization = "";
  }

  /** a no argument constructor so that Jackson can deserialize the json */
  public Poster() {
    this.id = UUID.randomUUID().toString();
    this.tags = new HashSet<>();
    this.createdAt = LocalDateTime.now();
  }

  @JsonProperty("id")
  public String getID() {
    return this.id;
  }

  public void setID(String newID) {
    this.id = newID;
  }

  /** validates necessary fields */
  public Boolean isPoster() {
    return this.id != null && this.title != null;
  }

  @JsonProperty("title")
  public String getTitle() {
    return this.title;
  }

  /**
   * Allows user to change title of the poster
   *
   * @param newTitle the new title to set the title to
   */
  public void setTitle(String newTitle) {
    this.title = newTitle;
  }

  /**
   * Allows user to change image of the poster
   *
   * @param newContent the new title to set the title to
   */
  public void setContent(String newContent) {
    this.content = newContent;
  }

  @JsonProperty("content")
  public String getContent() {
    return this.content;
  }

  // TODO: possibly implement tip tap so you don't have to
  // resend the whole desc, you can just edit a couple characters
  /**
   * Allows user to edit description of the poster
   *
   * @param newDesc the new title to set the title to
   */
  public void setDescription(String newDesc) {
    this.description = newDesc;
  }

  @JsonProperty("description")
  public String getDescription() {
    return this.description;
  }

  public HashSet<String> getTags() {
    return tags;
  }

  public void setTags(HashSet<String> tags) {
    this.tags = tags;
  }

  public void setTag(String tag) {
    this.tags.add(tag);
  }

  public void deleteTag(String tag) {
    this.tags.remove(tag);
  }

  public boolean getIsRecurring() {
    return isRecurring;
  }

  public void setIsRecurring(boolean recurring) {
    isRecurring = recurring;
  }

  public String getOrganization() {
    return organization;
  }

  public void setOrganization(String organization) {
    this.organization = organization;
  }


  public LocalDateTime getCreatedAt() {

    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public LocalDateTime getStartDate() {
    return startDate;
  }

  public void setStartDate(LocalDateTime startDate) {
    this.startDate = startDate;
  }

  public LocalDateTime getEndDate() {
    return this.endDate;
  }

  public void setEndDate(LocalDateTime endDate) {
    this.endDate = endDate;
  }

  public String getHaystack(){
    StringBuilder haystack = new StringBuilder(this.title);
    if (this.description != ""){
      haystack.append(this.description);
    }
    if (!this.tags.isEmpty()){
      for (String tag: this.tags){
        haystack.append(tag);
      }
    }
    if (this.organization != "") {
      haystack.append(this.organization);
    }
    return haystack.toString();
  }


  public String getUserId() {
    return userId;
  }

  public void setUserId(String userId) {
    this.userId = userId;
  }
}
