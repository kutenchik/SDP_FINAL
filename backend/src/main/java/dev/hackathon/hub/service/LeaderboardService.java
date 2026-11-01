package dev.hackathon.hub.service;

import dev.hackathon.hub.dto.Requests.ModifiersRequest;
import dev.hackathon.hub.dto.Views.*;
import dev.hackathon.hub.entity.*;
import dev.hackathon.hub.entity.Types.*;
import dev.hackathon.hub.exception.DomainException;
import dev.hackathon.hub.patterns.decorator.*;
import dev.hackathon.hub.patterns.strategy.*;
import dev.hackathon.hub.repository.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class LeaderboardService {
  private final List<ScoringStrategy> strategies;
  private final EvaluationRepository evaluations;
  private final EvaluationCriterionRepository criteria;
  private final SubmissionRepository submissions;
  private final CatalogService catalog;
  private final SubmissionService submissionService;

  public ScoringStrategy strategy(StrategyType type) {
    return strategies.stream()
        .filter(s -> s.type() == type)
        .findFirst()
        .orElseThrow(() -> new DomainException("Unsupported scoring strategy."));
  }

  @Transactional
  public void setStrategy(Long hackathonId, StrategyType type) {
    Hackathon h = catalog.lockHackathon(hackathonId);
    catalog.editable(h);
    ScoringMath.validateCriteria(
        criteria.findByHackathonIdOrderById(hackathonId), type == StrategyType.WEIGHTED);
    strategy(type);
    h.setScoringStrategy(type);
  }

  @Transactional
  public Long setModifiers(Long submissionId, ModifiersRequest r) {
    Submission s = submissionService.get(submissionId);
    Hackathon h = catalog.lockHackathon(s.getTeam().getHackathon().getId());
    catalog.editable(h);
    if (r.latePenalty() && r.earlyBonus())
      throw new DomainException("Early bonus and late penalty cannot be combined.");
    if (r.earlyBonus()
        && s.getSubmittedAt().isAfter(submissionService.deadline(s).minus(6, ChronoUnit.HOURS)))
      throw new DomainException(
          "Early bonus requires submission at least six hours before the deadline.");
    s.setLatePenalty(r.latePenalty());
    s.setEarlyBonus(r.earlyBonus());
    s.setOriginalityBonus(r.originalityBonus());
    return h.getId();
  }

  private double rounded(double n) {
    return Math.round(n * 100.0) / 100.0;
  }

  public Leaderboard calculate(Long hackathonId) {
    Hackathon h = catalog.hackathon(hackathonId);
    List<EvaluationCriterion> cs = criteria.findByHackathonIdOrderById(hackathonId);
    ScoringStrategy scoring = strategy(h.getScoringStrategy());
    ScoringMath.validateCriteria(cs, h.getScoringStrategy() == StrategyType.WEIGHTED);
    List<Ranking> rows = new ArrayList<>();
    for (Submission s : submissions.findByTeamHackathonIdOrderBySubmittedAtDesc(hackathonId)) {
      if (s.getTeam().getStatus() == TeamStatus.WITHDRAWN) continue;
      List<Evaluation> es = evaluations.findBySubmissionIdOrderByEvaluatedAtDesc(s.getId());
      double base = scoring.calculate(es, cs);
      ScoreComponent component = new BaseScoreComponent(base);
      if (!es.isEmpty()) {
        if (s.isEarlyBonus()) component = new EarlySubmissionBonusDecorator(component);
        if (s.isLatePenalty()) component = new LatePenaltyDecorator(component);
        if (s.isOriginalityBonus()) component = new OriginalityBonusDecorator(component);
      }
      double value = Math.max(0, Math.min(100, component.score()));
      List<ScoreAdjustment> adjustments = new ArrayList<>(component.adjustments());
      if (value != component.score())
        adjustments.add(
            new ScoreAdjustment("Score bounded to 0–100", rounded(value - component.score())));
      rows.add(
          new Ranking(
              0,
              s.getId(),
              s.getTeam().getId(),
              s.getTeam().getName(),
              s.getTitle(),
              es.size(),
              rounded(base),
              adjustments,
              rounded(value),
              !es.isEmpty()));
    }
    rows.sort(
        Comparator.comparing(Ranking::scored)
            .reversed()
            .thenComparing(Comparator.comparingDouble(Ranking::finalScore).reversed())
            .thenComparing(Ranking::teamName)
            .thenComparing(Ranking::submissionId));
    List<Ranking> ranked = new ArrayList<>();
    int rank = 0, position = 0;
    Double previous = null;
    for (Ranking r : rows) {
      position++;
      if (r.scored() && (previous == null || Double.compare(previous, r.finalScore()) != 0))
        rank = position;
      ranked.add(
          new Ranking(
              r.scored() ? rank : 0,
              r.submissionId(),
              r.teamId(),
              r.teamName(),
              r.title(),
              r.judgeCount(),
              r.baseScore(),
              r.adjustments(),
              r.finalScore(),
              r.scored()));
      if (r.scored()) previous = r.finalScore();
    }
    return new Leaderboard(hackathonId, h.getScoringStrategy(), ranked);
  }
}
