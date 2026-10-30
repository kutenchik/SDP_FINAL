package dev.hackathon.hub.patterns.factory;

import dev.hackathon.hub.dto.Requests.TaskRequest;
import dev.hackathon.hub.entity.*;
import dev.hackathon.hub.entity.Types.TaskType;
import dev.hackathon.hub.exception.DomainException;

public abstract class TaskCreator {
  public abstract TaskType type();

  protected abstract HackathonTask createTask(TaskRequest request);

  public final HackathonTask create(TaskRequest request, Hackathon hackathon) {
    if (request.deadline().isBefore(hackathon.getStartDate())
        || request.deadline().isAfter(hackathon.getSubmissionDeadline()))
      throw new DomainException(
          "Task deadline must fall between the event start and submission deadline.");
    HackathonTask task = createTask(request);
    task.setTitle(request.title().trim());
    task.setDescription(request.description());
    task.setDeadline(request.deadline());
    task.setHackathon(hackathon);
    return task;
  }
}
