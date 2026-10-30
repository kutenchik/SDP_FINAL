package dev.hackathon.hub.patterns.strategy;

import dev.hackathon.hub.entity.*;
import dev.hackathon.hub.entity.Types.StrategyType;
import java.util.List;

public interface ScoringStrategy {
  StrategyType type();

  double calculate(List<Evaluation> evaluations, List<EvaluationCriterion> criteria);
}
