package edu.brown.cs.student.main;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync
@SpringBootApplication
@ComponentScan(basePackages = "edu.brown.cs.student.main.ocr")
@ComponentScan(basePackages = "edu.brown.cs.student.main.user")
@ComponentScan(basePackages = "edu.brown.cs.student.main.imgur")
@ComponentScan(basePackages = "edu.brown.cs.student.main.types")
@ComponentScan(basePackages = "edu.brown.cs.student.main.responses")
public class App {
  public static void main(String[] args) throws Exception {
    SpringApplication.run(App.class, args);
  }
}
