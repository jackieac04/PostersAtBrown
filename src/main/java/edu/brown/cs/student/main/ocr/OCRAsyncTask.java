package edu.brown.cs.student.main.ocr;

import com.google.cloud.vision.v1.AnnotateImageResponse;
import com.google.cloud.vision.v1.EntityAnnotation;
import com.google.cloud.vision.v1.Feature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cloud.gcp.vision.CloudVisionTemplate;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;

@Service
public class OCRAsyncTask {

  @Autowired
  private CloudVisionTemplate cloudVisionTemplate;

  @Qualifier("gridFsTemplate")
  @Autowired
  private ResourceLoader resourceLoader;

  public HashMap<String, Object> sendPost(String imageUrl) throws Exception {
    GCVParser parser = new GCVParser();

    // Use the CloudVisionTemplate to annotate the image
    AnnotateImageResponse response = this.cloudVisionTemplate.analyzeImage(
            this.resourceLoader.getResource(imageUrl), Feature.Type.TEXT_DETECTION);

    if (response.hasError()) {
      System.out.println("Error: " + response.getError().getMessage());
      System.out.println( response.getError().getCode());
      System.out.println( response.getError().getDetails(0));


      return new HashMap<>();
    }

    // If text was detected, process the response
    if (!response.getTextAnnotationsList().isEmpty()) {
      List<EntityAnnotation> toParse = response.getTextAnnotationsList();
        return (HashMap<String, Object>) parser.parseResult(toParse);
    }


    return new HashMap<>();
  }
}
