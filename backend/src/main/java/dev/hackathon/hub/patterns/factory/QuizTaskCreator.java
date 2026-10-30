package dev.hackathon.hub.patterns.factory;

import dev.hackathon.hub.dto.Requests.TaskRequest;
import dev.hackathon.hub.entity.*;
import dev.hackathon.hub.entity.Types.TaskType;
import dev.hackathon.hub.exception.DomainException;
import org.springframework.stereotype.Component;

@Component
public class QuizTaskCreator extends TaskCreator {
  @Override
  public TaskType type() {
    return TaskType.QUIZ;
  }

  @Override
  protected HackathonTask createTask(TaskRequest r) {
    if (r.questionCount() == null || r.questionCount() < 1 || r.questionCount() > 100)
      throw new DomainException("Quiz must contain between 1 and 100 questions.");
    QuizTask t = new QuizTask();
    t.setQuestionCount(r.questionCount());
    return t;
  }
}
