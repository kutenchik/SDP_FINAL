package dev.hackathon.hub.mapper;

import dev.hackathon.hub.dto.Views.*;
import dev.hackathon.hub.entity.*;
import dev.hackathon.hub.repository.*;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ViewMapper {
  private final ParticipantRepository participants;
  private final EvaluationRepository evaluations;

  public HackathonView hackathon(Hackathon h) {
    return new HackathonView(
        h.getId(),
        h.getName(),
        h.getDescription(),
        h.getStartDate(),
        h.getEndDate(),
        h.getSubmissionDeadline(),
        h.getStatus(),
        h.getScoringStrategy(),
        h.getCreatedAt());
  }

  public ParticipantView participant(Participant p) {
    return new ParticipantView(p.getId(), p.getFullName(), p.getEmail(), p.getRole());
  }

  public TeamView team(Team t) {
    return new TeamView(
        t.getId(),
        t.getName(),
        t.getDescription(),
        t.getTechnologyStack(),
        t.getHackathon().getId(),
        t.getStatus(),
        t.getCreatedAt(),
        participants.findByTeamIdOrderById(t.getId()).stream().map(this::participant).toList());
  }

  public TaskView task(HackathonTask t) {
    return new TaskView(
        t.getId(),
        t.getTitle(),
        t.getDescription(),
        t.getTaskType(),
        t.getDeadline(),
        t.getHackathon().getId(),
        t.getDurationMinutes(),
        t.getQuestionCount());
  }

  public CriterionView criterion(EvaluationCriterion c) {
    return new CriterionView(
        c.getId(), c.getName(), c.getDescription(), c.getWeight(), c.getMaxScore());
  }

  public SubmissionView submission(Submission s) {
    return new SubmissionView(
        s.getId(),
        s.getTitle(),
        s.getDescription(),
        s.getRepositoryUrl(),
        s.getPresentationUrl(),
        s.getDemoUrl(),
        s.getTeam().getId(),
        s.getTeam().getName(),
        s.getTeam().getHackathon().getId(),
        s.getTask() == null ? null : s.getTask().getId(),
        s.getSubmittedAt(),
        s.getStatus(),
        s.isLatePenalty(),
        s.isEarlyBonus(),
        s.isOriginalityBonus(),
        evaluations.findBySubmissionIdOrderByEvaluatedAtDesc(s.getId()).size());
  }

  public EvaluationView evaluation(Evaluation e) {
    return new EvaluationView(
        e.getId(),
        e.getSubmission().getId(),
        e.getJudgeName(),
        Map.copyOf(e.getScores()),
        e.getComment(),
        e.getEvaluatedAt());
  }

  public ActivityView notification(Notification n) {
    return new ActivityView(
        n.getId(),
        n.getEventType(),
        n.getMessage(),
        n.getHackathonId(),
        n.getCreatedAt(),
        n.isRead());
  }

  public ActivityView audit(AuditLog n) {
    return new ActivityView(
        n.getId(), n.getEventType(), n.getMessage(), n.getHackathonId(), n.getCreatedAt(), true);
  }
}
