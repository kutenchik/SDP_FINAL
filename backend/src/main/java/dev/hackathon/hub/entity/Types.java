package dev.hackathon.hub.entity;

public final class Types {
  private Types() {}

  public enum HackathonStatus {
    DRAFT,
    ACTIVE,
    JUDGING,
    COMPLETED,
    CANCELLED
  }

  public enum TeamStatus {
    ACTIVE,
    FINALIST,
    WITHDRAWN
  }

  public enum SubmissionStatus {
    SUBMITTED,
    EVALUATED
  }

  public enum StrategyType {
    STANDARD,
    OLYMPIC,
    WEIGHTED
  }

  public enum TaskType {
    CODING,
    PITCH,
    QUIZ
  }
}
