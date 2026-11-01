package dev.hackathon.hub.service;

import dev.hackathon.hub.dto.Requests.*;
import dev.hackathon.hub.dto.Views.*;
import dev.hackathon.hub.entity.*;
import dev.hackathon.hub.entity.Types.*;
import dev.hackathon.hub.exception.DomainException;
import dev.hackathon.hub.mapper.ViewMapper;
import dev.hackathon.hub.patterns.factory.TaskCreator;
import dev.hackathon.hub.patterns.observer.*;
import dev.hackathon.hub.patterns.strategy.ScoringMath;
import dev.hackathon.hub.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class CatalogService {
  private final HackathonRepository hackathons;
  private final TeamRepository teams;
  private final ParticipantRepository participants;
  private final HackathonTaskRepository tasks;
  private final EvaluationCriterionRepository criteria;
  private final EvaluationRepository evaluations;
  private final NotificationRepository notifications;
  private final AuditLogRepository audit;
  private final List<TaskCreator> taskCreators;
  private final HackathonEventPublisher publisher;
  private final ViewMapper mapper;
  private final EntityManager entityManager;

  public Hackathon hackathon(Long id) {
    return hackathons
        .findById(id)
        .orElseThrow(() -> new DomainException(404, "Hackathon not found."));
  }

  public Hackathon lockHackathon(Long id) {
    Hackathon h = hackathon(id);
    entityManager.lock(h, LockModeType.PESSIMISTIC_WRITE);
    return h;
  }

  public Team team(Long id) {
    return teams.findById(id).orElseThrow(() -> new DomainException(404, "Team not found."));
  }

  public void editable(Hackathon h) {
    if (h.getStatus() == HackathonStatus.COMPLETED || h.getStatus() == HackathonStatus.CANCELLED)
      throw new DomainException("This event is closed for changes.");
  }

  private String key(String text) {
    return text.trim().toLowerCase(Locale.ROOT);
  }

  private void dates(HackathonRequest r) {
    if (!r.startDate().isBefore(r.endDate())
        || r.submissionDeadline().isBefore(r.startDate())
        || r.submissionDeadline().isAfter(r.endDate()))
      throw new DomainException(
          "Dates must follow: start ≤ submission deadline ≤ end, with start before end.");
  }

  public HackathonView createHackathon(HackathonRequest r) {
    dates(r);
    if (r.status() != HackathonStatus.DRAFT && r.status() != HackathonStatus.ACTIVE)
      throw new DomainException("New events must start as draft or active.");
    Hackathon h = new Hackathon();
    applyHackathon(h, r);
    hackathons.save(h);
    String[] names = {"Innovation", "Technical execution", "Impact", "Presentation"};
    for (String name : names) {
      EvaluationCriterion c = new EvaluationCriterion();
      c.setHackathon(h);
      c.setName(name);
      c.setDescription("Quality of " + name.toLowerCase(Locale.ROOT));
      c.setWeight(0.25);
      c.setMaxScore(10);
      criteria.save(c);
    }
    return mapper.hackathon(h);
  }

  private void applyHackathon(Hackathon h, HackathonRequest r) {
    h.setName(r.name().trim());
    h.setDescription(r.description());
    h.setStartDate(r.startDate());
    h.setEndDate(r.endDate());
    h.setSubmissionDeadline(r.submissionDeadline());
    h.setStatus(r.status());
  }

  public HackathonView updateHackathon(Long id, HackathonRequest r) {
    Hackathon h = lockHackathon(id);
    dates(r);
    Map<HackathonStatus, Set<HackathonStatus>> transitions =
        Map.of(
            HackathonStatus.DRAFT,
            Set.of(HackathonStatus.ACTIVE, HackathonStatus.CANCELLED),
            HackathonStatus.ACTIVE,
            Set.of(HackathonStatus.JUDGING, HackathonStatus.CANCELLED),
            HackathonStatus.JUDGING,
            Set.of(HackathonStatus.COMPLETED, HackathonStatus.CANCELLED),
            HackathonStatus.COMPLETED,
            Set.of(),
            HackathonStatus.CANCELLED,
            Set.of());
    if (h.getStatus() != r.status() && !transitions.get(h.getStatus()).contains(r.status()))
      throw new DomainException("That event status transition is not allowed.");
    if (h.getStatus() == HackathonStatus.COMPLETED || h.getStatus() == HackathonStatus.CANCELLED)
      throw new DomainException("Closed events cannot be edited.");
    if (tasks.findByHackathonIdOrderById(id).stream()
        .anyMatch(
            t ->
                t.getDeadline().isBefore(r.startDate())
                    || t.getDeadline().isAfter(r.submissionDeadline())))
      throw new DomainException("Update task deadlines before moving event dates past them.");
    applyHackathon(h, r);
    return mapper.hackathon(h);
  }

  public void deleteHackathon(Long id) {
    Hackathon h = lockHackathon(id);
    if (!teams.findByHackathonId(id).isEmpty())
      throw new DomainException(409, "This event has teams. Cancel it to preserve their work.");
    tasks.deleteAll(tasks.findByHackathonIdOrderById(id));
    criteria.deleteAll(criteria.findByHackathonIdOrderById(id));
    notifications.deleteAll(
        notifications.findAll().stream().filter(n -> n.getHackathonId().equals(id)).toList());
    audit.deleteAll(audit.findAll().stream().filter(n -> n.getHackathonId().equals(id)).toList());
    hackathons.delete(h);
  }

  public TeamView saveTeam(Long id, TeamRequest r) {
    Hackathon h = lockHackathon(r.hackathonId());
    editable(h);
    if (id == null
        && h.getStatus() != HackathonStatus.ACTIVE
        && h.getStatus() != HackathonStatus.DRAFT)
      throw new DomainException("Team registration is closed.");
    if (teams.existsByHackathonIdAndNameKeyAndIdNot(
        h.getId(), key(r.name()), id == null ? -1L : id))
      throw new DomainException(409, "A team with this name already exists in this event.");
    Team t = id == null ? new Team() : team(id);
    if (id != null && !t.getHackathon().getId().equals(h.getId()))
      throw new DomainException("Teams cannot move between events.");
    TeamStatus previous = id == null ? null : t.getStatus();
    t.setName(r.name().trim());
    t.setNameKey(key(r.name()));
    t.setDescription(r.description());
    t.setTechnologyStack(r.technologyStack());
    t.setHackathon(h);
    t.setStatus(r.status());
    teams.save(t);
    if (previous != r.status())
      publisher.publish(
          new TeamStatusChangedEvent(
              h.getId(),
              t.getName() + " is now " + r.status().name().toLowerCase(Locale.ROOT) + "."));
    return mapper.team(t);
  }

  public ParticipantView addParticipant(Long teamId, ParticipantRequest r) {
    Team t = team(teamId);
    editable(lockHackathon(t.getHackathon().getId()));
    Participant p = new Participant();
    p.setTeam(t);
    p.setFullName(r.fullName().trim());
    p.setEmail(r.email().trim());
    p.setEmailKey(key(r.email()));
    p.setRole(r.role().trim());
    return mapper.participant(participants.saveAndFlush(p));
  }

  public void removeParticipant(Long teamId, Long participantId) {
    Team t = team(teamId);
    editable(lockHackathon(t.getHackathon().getId()));
    Participant p =
        participants
            .findById(participantId)
            .orElseThrow(() -> new DomainException(404, "Participant not found."));
    if (!p.getTeam().getId().equals(teamId))
      throw new DomainException(404, "Participant not found in this team.");
    participants.delete(p);
  }

  public TaskView createTask(Long hackathonId, TaskRequest r) {
    Hackathon h = lockHackathon(hackathonId);
    editable(h);
    TaskCreator creator =
        taskCreators.stream()
            .filter(c -> c.type() == r.taskType())
            .findFirst()
            .orElseThrow(() -> new DomainException("Unsupported task type."));
    return mapper.task(tasks.save(creator.create(r, h)));
  }

  public List<CriterionView> replaceCriteria(Long hackathonId, CriteriaRequest r) {
    Hackathon h = lockHackathon(hackathonId);
    editable(h);
    if (evaluations.existsBySubmissionTeamHackathonId(hackathonId))
      throw new DomainException(
          "Criteria are locked once judging begins to preserve score meaning.");
    List<EvaluationCriterion> replacement =
        r.criteria().stream()
            .map(
                x -> {
                  EvaluationCriterion c = new EvaluationCriterion();
                  c.setName(x.name().trim());
                  c.setDescription(x.description());
                  c.setWeight(x.weight());
                  c.setMaxScore(x.maxScore());
                  c.setHackathon(h);
                  return c;
                })
            .toList();
    ScoringMath.validateCriteria(replacement, true);
    if (replacement.stream().map(c -> key(c.getName())).distinct().count() != replacement.size())
      throw new DomainException("Criterion names must be unique.");
    criteria.deleteAll(criteria.findByHackathonIdOrderById(hackathonId));
    criteria.flush();
    return criteria.saveAll(replacement).stream().map(mapper::criterion).toList();
  }
}
