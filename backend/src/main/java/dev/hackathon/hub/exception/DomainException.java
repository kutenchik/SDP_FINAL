package dev.hackathon.hub.exception;

import lombok.Getter;

@Getter
public class DomainException extends RuntimeException {
  private final int status;

  public DomainException(String message) {
    this(400, message);
  }

  public DomainException(int status, String message) {
    super(message);
    this.status = status;
  }
}
