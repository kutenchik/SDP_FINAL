package dev.hackathon.hub.entity;

import dev.hackathon.hub.entity.Types.TaskType;
import jakarta.persistence.*;

@Entity
@DiscriminatorValue("PITCH")
public class PitchTask extends HackathonTask {
  @Override
  public TaskType getTaskType() {
    return TaskType.PITCH;
  }
}
