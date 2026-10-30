package dev.hackathon.hub.patterns.strategy;

import dev.hackathon.hub.entity.*;
import dev.hackathon.hub.entity.Types.StrategyType;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class OlympicScoringStrategy implements ScoringStrategy {
  @Override
  public StrategyType type() {
    return StrategyType.OLYMPIC;
  }

  @Override
  public double calculate(List<Evaluation> evaluations, List<EvaluationCriterion> criteria) {
    ScoringMath.validateCriteria(criteria, false);
    var scores =
        evaluations.stream()
            .mapToDouble(e -> ScoringMath.judgeScore(e, criteria, false))
            .sorted()
            .toArray();
    return java.util.Arrays.stream(
            scores,
            scores.length >= 3 ? 1 : 0,
            scores.length >= 3 ? scores.length - 1 : scores.length)
        .average()
        .orElse(0);
  }
}
