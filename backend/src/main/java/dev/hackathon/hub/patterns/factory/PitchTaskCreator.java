package dev.hackathon.hub.patterns.factory;

import dev.hackathon.hub.dto.Requests.TaskRequest;
import dev.hackathon.hub.entity.*;
import dev.hackathon.hub.entity.Types.TaskType;
import dev.hackathon.hub.exception.DomainException;
import org.springframework.stereotype.Component;

@Component
public class PitchTaskCreator extends TaskCreator {
  @Override
  public TaskType type() {
    return TaskType.PITCH;
  }

  @Override
  protected HackathonTask createTask(TaskRequest r) {
    if (r.durationMinutes() == null || r.durationMinutes() < 1 || r.durationMinutes() > 30)
      throw new DomainException("Pitch duration must be between 1 and 30 minutes.");
    PitchTask t = new PitchTask();
    t.setDurationMinutes(r.durationMinutes());
    return t;
  }
}
