package dev.hackathon.hub.patterns.strategy;

import dev.hackathon.hub.entity.*;
import dev.hackathon.hub.exception.DomainException;
import java.util.*;

public final class ScoringMath {
  private ScoringMath() {}

  public static void validateCriteria(List<EvaluationCriterion> criteria, boolean weighted) {
    if (criteria.isEmpty()) throw new DomainException("Configure evaluation criteria first.");
    if (criteria.stream()
        .anyMatch(
            c ->
                !Double.isFinite(c.getMaxScore())
                    || c.getMaxScore() <= 0
                    || !Double.isFinite(c.getWeight())
                    || c.getWeight() <= 0))
      throw new DomainException("Criterion maximums and weights must be positive finite numbers.");
    if (weighted
        && Math.abs(criteria.stream().mapToDouble(EvaluationCriterion::getWeight).sum() - 1)
            > 0.000001) throw new DomainException("Criterion weights must total 100%.");
  }

  public static double judgeScore(
      Evaluation e, List<EvaluationCriterion> criteria, boolean weighted) {
    return criteria.stream()
        .mapToDouble(
            c -> {
              Double score = e.getScores().get(c.getId());
              if (score == null || !Double.isFinite(score) || score < 0 || score > c.getMaxScore())
                throw new DomainException("An evaluation has an invalid criterion score.");
              return score
                  / c.getMaxScore()
                  * 100
                  * (weighted ? c.getWeight() : 1.0 / criteria.size());
            })
        .sum();
  }
}
