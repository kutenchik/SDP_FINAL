package dev.hackathon.hub.patterns.builder;

import dev.hackathon.hub.entity.*;
import java.net.URI;

public class SubmissionBuilder {
  private final Submission submission = new Submission();

  public SubmissionBuilder title(String value) {
    submission.setTitle(value == null ? null : value.trim());
    return this;
  }

  public SubmissionBuilder description(String value) {
    submission.setDescription(value);
    return this;
  }

  public SubmissionBuilder repositoryUrl(String value) {
    submission.setRepositoryUrl(value);
    return this;
  }

  public SubmissionBuilder presentationUrl(String value) {
    submission.setPresentationUrl(blankToNull(value));
    return this;
  }

  public SubmissionBuilder demoUrl(String value) {
    submission.setDemoUrl(blankToNull(value));
    return this;
  }

  public SubmissionBuilder team(Team value) {
    submission.setTeam(value);
    return this;
  }

  public SubmissionBuilder task(HackathonTask value) {
    submission.setTask(value);
    return this;
  }

  private String blankToNull(String s) {
    return s == null || s.isBlank() ? null : s.trim();
  }

  private void validateUrl(String value, String name, boolean required) {
    if (value == null || value.isBlank()) {
      if (required) throw new SubmissionValidationException(name + " is required.");
      return;
    }
    try {
      URI uri = URI.create(value);
      if (!("https".equalsIgnoreCase(uri.getScheme()) || "http".equalsIgnoreCase(uri.getScheme()))
          || uri.getHost() == null
          || uri.getUserInfo() != null) throw new IllegalArgumentException();
    } catch (IllegalArgumentException ex) {
      throw new SubmissionValidationException(name + " must be a valid HTTP or HTTPS URL.");
    }
  }

  public Submission build() {
    if (submission.getTitle() == null || submission.getTitle().isBlank())
      throw new SubmissionValidationException("Project title is required.");
    if (submission.getDescription() == null || submission.getDescription().isBlank())
      throw new SubmissionValidationException("Project description is required.");
    if (submission.getTeam() == null)
      throw new SubmissionValidationException("A team is required.");
    validateUrl(submission.getRepositoryUrl(), "Repository URL", true);
    validateUrl(submission.getPresentationUrl(), "Presentation URL", false);
    validateUrl(submission.getDemoUrl(), "Demo URL", false);
    return submission;
  }
}
