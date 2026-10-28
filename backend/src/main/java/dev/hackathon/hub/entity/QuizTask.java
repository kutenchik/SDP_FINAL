package dev.hackathon.hub.entity;

import dev.hackathon.hub.entity.Types.TaskType;
import jakarta.persistence.*;

@Entity
@DiscriminatorValue("QUIZ")
public class QuizTask extends HackathonTask {
  @Override
  public TaskType getTaskType() {
    return TaskType.QUIZ;
  }
}
