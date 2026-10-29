package dev.hackathon.hub.patterns.builder;

import dev.hackathon.hub.exception.DomainException;

public class SubmissionValidationException extends DomainException {
  public SubmissionValidationException(String message) {
    super(message);
  }
}
