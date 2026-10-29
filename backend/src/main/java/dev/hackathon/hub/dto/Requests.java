package dev.hackathon.hub.dto;

import dev.hackathon.hub.entity.Types.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.*;

public final class Requests {
  private Requests() {}

  public record HackathonRequest(
      @NotBlank @Size(max = 120) String name,
      @NotBlank @Size(max = 4000) String description,
      @NotNull Instant startDate,
      @NotNull Instant endDate,
      @NotNull Instant submissionDeadline,
      @NotNull HackathonStatus status) {}

  public record TeamRequest(
      @NotBlank @Size(max = 100) String name,
      @Size(max = 2000) @NotNull String description,
      @Size(max = 500) @NotNull String technologyStack,
      @NotNull Long hackathonId,
      @NotNull TeamStatus status) {}

  public record ParticipantRequest(
      @NotBlank @Size(max = 100) String fullName,
      @NotBlank @Email @Size(max = 254) String email,
      @NotBlank @Size(max = 80) String role) {}

  public record SubmissionRequest(
      @NotBlank @Size(max = 160) String title,
      @NotBlank @Size(max = 5000) String description,
      @NotBlank @Size(max = 1000) String repositoryUrl,
      @Size(max = 1000) String presentationUrl,
      @Size(max = 1000) String demoUrl,
      @NotNull Long teamId,
      Long taskId) {}

  public record TaskRequest(
      @NotBlank @Size(max = 160) String title,
      @NotBlank @Size(max = 3000) String description,
      @NotNull TaskType taskType,
      @NotNull Instant deadline,
      Integer durationMinutes,
      Integer questionCount) {}

  public record CriterionRequest(
      @NotBlank @Size(max = 100) String name,
      @NotNull @Size(max = 1000) String description,
      @Positive double weight,
      @Positive double maxScore) {}

  public record CriteriaRequest(@NotEmpty @Size(max = 12) List<@Valid CriterionRequest> criteria) {}

  public record EvaluationRequest(
      @NotNull Long submissionId,
      @NotBlank @Size(max = 100) String judgeName,
      @NotEmpty Map<Long, @NotNull Double> scores,
      @NotNull @Size(max = 3000) String comment) {}

  public record StrategyRequest(@NotNull StrategyType strategy) {}

  public record ModifiersRequest(
      boolean latePenalty, boolean earlyBonus, boolean originalityBonus) {}
}
