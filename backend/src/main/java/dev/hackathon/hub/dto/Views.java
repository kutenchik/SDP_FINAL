package dev.hackathon.hub.dto;

import dev.hackathon.hub.entity.Types.*;
import java.time.Instant;
import java.util.*;

public final class Views {
  private Views() {}

  public record HackathonView(
      Long id,
      String name,
      String description,
      Instant startDate,
      Instant endDate,
      Instant submissionDeadline,
      HackathonStatus status,
      StrategyType scoringStrategy,
      Instant createdAt) {}

  public record ParticipantView(Long id, String fullName, String email, String role) {}

  public record TeamView(
      Long id,
      String name,
      String description,
      String technologyStack,
      Long hackathonId,
      TeamStatus status,
      Instant createdAt,
      List<ParticipantView> participants) {}

  public record TaskView(
      Long id,
      String title,
      String description,
      TaskType taskType,
      Instant deadline,
      Long hackathonId,
      Integer durationMinutes,
      Integer questionCount) {}

  public record CriterionView(
      Long id, String name, String description, double weight, double maxScore) {}

  public record SubmissionView(
      Long id,
      String title,
      String description,
      String repositoryUrl,
      String presentationUrl,
      String demoUrl,
      Long teamId,
      String teamName,
      Long hackathonId,
      Long taskId,
      Instant submittedAt,
      SubmissionStatus status,
      boolean latePenalty,
      boolean earlyBonus,
      boolean originalityBonus,
      int evaluationCount) {}

  public record EvaluationView(
      Long id,
      Long submissionId,
      String judgeName,
      Map<Long, Double> scores,
      String comment,
      Instant evaluatedAt) {}

  public record ActivityView(
      Long id,
      String eventType,
      String message,
      Long hackathonId,
      Instant createdAt,
      boolean read) {}

  public record ScoreAdjustment(String label, double amount) {}

  public record Ranking(
      int rank,
      Long submissionId,
      Long teamId,
      String teamName,
      String title,
      int judgeCount,
      double baseScore,
      List<ScoreAdjustment> adjustments,
      double finalScore,
      boolean scored) {}

  public record Leaderboard(Long hackathonId, StrategyType strategy, List<Ranking> rankings) {}

  public record Dashboard(
      long activeHackathons,
      long teams,
      long submissions,
      long pendingEvaluations,
      List<HackathonView> hackathons,
      List<ActivityView> activity) {}

  public record ExportReport(
      Instant generatedAt,
      HackathonView hackathon,
      List<TeamView> teams,
      List<CriterionView> criteria,
      List<SubmissionView> submissions,
      Leaderboard leaderboard) {}
}
