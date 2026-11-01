package dev.hackathon.hub.service;

import dev.hackathon.hub.dto.Requests.SubmissionRequest;
import dev.hackathon.hub.dto.Views.SubmissionView;
import dev.hackathon.hub.entity.*;
import dev.hackathon.hub.entity.Types.*;
import dev.hackathon.hub.exception.DomainException;
import dev.hackathon.hub.mapper.ViewMapper;
import dev.hackathon.hub.patterns.builder.SubmissionBuilder;
import dev.hackathon.hub.patterns.observer.*;
import dev.hackathon.hub.repository.*;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class SubmissionService {
  private final SubmissionRepository submissions;
  private final HackathonTaskRepository tasks;
  private final EvaluationRepository evaluations;
  private final CatalogService catalog;
  private final ViewMapper mapper;
  private final HackathonEventPublisher publisher;

  public Submission get(Long id) {
    return submissions
        .findById(id)
        .orElseThrow(() -> new DomainException(404, "Submission not found."));
  }

  public Instant deadline(Submission s) {
    Instant h = s.getTeam().getHackathon().getSubmissionDeadline();
    return s.getTask() != null && s.getTask().getDeadline().isBefore(h)
        ? s.getTask().getDeadline()
        : h;
  }

  public SubmissionView save(Long id, SubmissionRequest r) {
    Team team = catalog.team(r.teamId());
    Hackathon h = catalog.lockHackathon(team.getHackathon().getId());
    if (h.getStatus() != HackathonStatus.ACTIVE)
      throw new DomainException("Submissions are open only while an event is active.");
    if (team.getStatus() == TeamStatus.WITHDRAWN)
      throw new DomainException("Withdrawn teams cannot submit projects.");
    HackathonTask task =
        r.taskId() == null
            ? null
            : tasks
                .findById(r.taskId())
                .orElseThrow(() -> new DomainException(404, "Task not found."));
    if (task != null && !task.getHackathon().getId().equals(h.getId()))
      throw new DomainException("The task must belong to the team's event.");
    Submission built =
        new SubmissionBuilder()
            .title(r.title())
            .description(r.description())
            .repositoryUrl(r.repositoryUrl())
            .presentationUrl(r.presentationUrl())
            .demoUrl(r.demoUrl())
            .team(team)
            .task(task)
            .build();
    if (Instant.now().isAfter(deadline(built)))
      throw new DomainException("The submission deadline has passed.");
    if (id == null) {
      submissions.save(built);
      publisher.publish(
          new SubmissionCreatedEvent(
              h.getId(), team.getName() + " submitted " + built.getTitle() + "."));
      return mapper.submission(built);
    }
    Submission existing = get(id);
    if (!existing.getTeam().getId().equals(team.getId()))
      throw new DomainException("Submission ownership cannot change.");
    if (Instant.now().isAfter(deadline(existing)))
      throw new DomainException("The submission deadline has passed.");
    if (!evaluations.findBySubmissionIdOrderByEvaluatedAtDesc(id).isEmpty())
      throw new DomainException("Evaluated submissions are locked.");
    existing.setTitle(built.getTitle());
    existing.setDescription(built.getDescription());
    existing.setRepositoryUrl(built.getRepositoryUrl());
    existing.setPresentationUrl(built.getPresentationUrl());
    existing.setDemoUrl(built.getDemoUrl());
    existing.setTask(task);
    return mapper.submission(existing);
  }
}
