package dev.hackathon.hub.entity;

import dev.hackathon.hub.entity.Types.TaskType;
import jakarta.persistence.*;

@Entity
@DiscriminatorValue("CODING")
public class CodingTask extends HackathonTask {
  @Override
  public TaskType getTaskType() {
    return TaskType.CODING;
  }
}
