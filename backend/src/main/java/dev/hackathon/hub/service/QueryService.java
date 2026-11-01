package dev.hackathon.hub.service;

import dev.hackathon.hub.dto.Views.*;
import dev.hackathon.hub.entity.Types.*;
import dev.hackathon.hub.exception.DomainException;
import dev.hackathon.hub.mapper.ViewMapper;
import dev.hackathon.hub.repository.*;
import java.time.Instant;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class QueryService {
  private final HackathonRepository hackathons;
  private final TeamRepository teams;
  private final SubmissionRepository submissions;
  private final EvaluationRepository evaluations;
  private final HackathonTaskRepository tasks;
  private final EvaluationCriterionRepository criteria;
  private final NotificationRepository notifications;
  private final AuditLogRepository audit;
  private final CatalogService catalog;
  private final SubmissionService submissionService;
  private final ViewMapper mapper;
  private final LeaderboardService leaderboard;

  public List<HackathonView> hackathons() {
    return hackathons.findAll().stream().map(mapper::hackathon).toList();
  }

  public HackathonView hackathon(Long id) {
    return mapper.hackathon(catalog.hackathon(id));
  }

  public List<TeamView> teams(Long id) {
    if (id != null) catalog.hackathon(id);
    return (id == null ? teams.findAll() : teams.findByHackathonId(id))
        .stream().map(mapper::team).toList();
  }

  public List<SubmissionView> submissions(Long id) {
    if (id != null) catalog.hackathon(id);
    return (id == null
            ? submissions.findAll()
            : submissions.findByTeamHackathonIdOrderBySubmittedAtDesc(id))
        .stream().map(mapper::submission).toList();
  }

  public List<TaskView> tasks(Long id) {
    catalog.hackathon(id);
    return tasks.findByHackathonIdOrderById(id).stream().map(mapper::task).toList();
  }

  public List<CriterionView> criteria(Long id) {
    catalog.hackathon(id);
    return criteria.findByHackathonIdOrderById(id).stream().map(mapper::criterion).toList();
  }

  public List<EvaluationView> evaluations(Long id) {
    submissionService.get(id);
    return evaluations.findBySubmissionIdOrderByEvaluatedAtDesc(id).stream()
        .map(mapper::evaluation)
        .toList();
  }

  public List<ActivityView> notifications() {
    return notifications.findTop50ByOrderByCreatedAtDesc().stream()
        .map(mapper::notification)
        .toList();
  }

  public List<ActivityView> audit() {
    return audit.findTop100ByOrderByCreatedAtDesc().stream().map(mapper::audit).toList();
  }

  @Transactional
  public void markRead(Long id) {
    notifications
        .findById(id)
        .orElseThrow(() -> new DomainException(404, "Notification not found."))
        .setRead(true);
  }

  public Dashboard dashboard() {
    var hs = hackathons();
    var ss = submissions(null);
    return new Dashboard(
        hs.stream()
            .filter(
                h -> h.status() == HackathonStatus.ACTIVE || h.status() == HackathonStatus.JUDGING)
            .count(),
        teams.count(),
        ss.size(),
        ss.stream().filter(s -> s.evaluationCount() == 0).count(),
        hs,
        notifications());
  }

  public ExportReport report(Long id) {
    return new ExportReport(
        Instant.now(),
        hackathon(id),
        teams(id),
        criteria(id),
        submissions(id),
        leaderboard.calculate(id));
  }
}
