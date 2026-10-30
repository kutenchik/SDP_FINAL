package dev.hackathon.hub.patterns.strategy;

import dev.hackathon.hub.entity.*;
import dev.hackathon.hub.entity.Types.StrategyType;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class StandardScoringStrategy implements ScoringStrategy {
  @Override
  public StrategyType type() {
    return StrategyType.STANDARD;
  }

  @Override
  public double calculate(List<Evaluation> evaluations, List<EvaluationCriterion> criteria) {
    ScoringMath.validateCriteria(criteria, false);
    return evaluations.stream()
        .mapToDouble(e -> ScoringMath.judgeScore(e, criteria, false))
        .average()
        .orElse(0);
  }
}
