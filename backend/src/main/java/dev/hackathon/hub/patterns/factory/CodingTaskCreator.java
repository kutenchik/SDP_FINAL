package dev.hackathon.hub.patterns.factory;

import dev.hackathon.hub.dto.Requests.TaskRequest;
import dev.hackathon.hub.entity.*;
import dev.hackathon.hub.entity.Types.TaskType;
import dev.hackathon.hub.exception.DomainException;
import org.springframework.stereotype.Component;

@Component
public class CodingTaskCreator extends TaskCreator {
  @Override
  public TaskType type() {
    return TaskType.CODING;
  }

  @Override
  protected HackathonTask createTask(TaskRequest r) {
    if (r.description().trim().length() < 20)
      throw new DomainException("Coding tasks need a brief of at least 20 characters.");
    return new CodingTask();
  }
}
