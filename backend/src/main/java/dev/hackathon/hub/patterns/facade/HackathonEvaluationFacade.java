package dev.hackathon.hub.patterns.facade;

import dev.hackathon.hub.dto.Requests.*;
import dev.hackathon.hub.dto.Views.*;
import dev.hackathon.hub.entity.Evaluation;
import dev.hackathon.hub.entity.Types.StrategyType;
import dev.hackathon.hub.patterns.observer.*;
import dev.hackathon.hub.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class HackathonEvaluationFacade {
  private final EvaluationService evaluations;
  private final LeaderboardService leaderboard;
  private final HackathonEventPublisher publisher;

  public Leaderboard evaluateSubmission(EvaluationRequest request) {
    Evaluation saved = evaluations.validateAndSave(request);
    Long hackathonId = saved.getSubmission().getTeam().getHackathon().getId();
    Leaderboard result = leaderboard.calculate(hackathonId);
    publisher.publish(
        new EvaluationSubmittedEvent(
            hackathonId,
            saved.getJudgeName() + " evaluated " + saved.getSubmission().getTitle() + "."));
    return result;
  }

  public Leaderboard changeStrategy(Long hackathonId, StrategyType strategy) {
    leaderboard.setStrategy(hackathonId, strategy);
    return leaderboard.calculate(hackathonId);
  }

  public Leaderboard changeModifiers(Long submissionId, ModifiersRequest request) {
    return leaderboard.calculate(leaderboard.setModifiers(submissionId, request));
  }
}
