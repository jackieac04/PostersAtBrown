package edu.brown.cs.student.main.ocr;

import com.google.cloud.vision.v1.ImageAnnotatorClient;
import com.google.cloud.vision.v1.ImageAnnotatorSettings;
import org.springframework.cloud.gcp.vision.CloudVisionTemplate;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.io.IOException;

@Configuration
public class VisionConfig {

    @Bean
    public ImageAnnotatorClient imageAnnotatorClient() throws IOException {
        ImageAnnotatorSettings settings = ImageAnnotatorSettings.newBuilder()
                .setEndpoint("vision.googleapis.com:443") // Set the endpoint explicitly
                .build();
        return ImageAnnotatorClient.create(settings);
    }

    @Bean
    public CloudVisionTemplate cloudVisionTemplate(ImageAnnotatorClient imageAnnotatorClient) {
        return new CloudVisionTemplate(imageAnnotatorClient);
    }
}
