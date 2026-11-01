package dev.hackathon.hub.service;

import dev.hackathon.hub.dto.Requests.EvaluationRequest;
import dev.hackathon.hub.entity.*;
import dev.hackathon.hub.entity.Types.*;
import dev.hackathon.hub.exception.DomainException;
import dev.hackathon.hub.patterns.strategy.ScoringMath;
import dev.hackathon.hub.repository.*;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EvaluationService {
  private final EvaluationRepository evaluations;
  private final EvaluationCriterionRepository criteria;
  private final CatalogService catalog;
  private final SubmissionService submissions;

  public Evaluation validateAndSave(EvaluationRequest r) {
    Submission s = submissions.get(r.submissionId());
    Hackathon h = catalog.lockHackathon(s.getTeam().getHackathon().getId());
    if (h.getStatus() != HackathonStatus.ACTIVE && h.getStatus() != HackathonStatus.JUDGING)
      throw new DomainException(
          "Judging is available only for active events or events in judging.");
    if (s.getTeam().getStatus() == TeamStatus.WITHDRAWN)
      throw new DomainException("Withdrawn teams cannot be evaluated.");
    List<EvaluationCriterion> cs = criteria.findByHackathonIdOrderById(h.getId());
    ScoringMath.validateCriteria(cs, h.getScoringStrategy() == StrategyType.WEIGHTED);
    if (!r.scores()
        .keySet()
        .equals(new HashSet<>(cs.stream().map(EvaluationCriterion::getId).toList())))
      throw new DomainException("Provide exactly one score for every criterion in this event.");
    String judgeKey = r.judgeName().trim().toLowerCase(Locale.ROOT);
    if (evaluations.existsBySubmissionIdAndJudgeKey(s.getId(), judgeKey))
      throw new DomainException(409, "This judge has already evaluated this project.");
    Evaluation e = new Evaluation();
    e.setSubmission(s);
    e.setJudgeName(r.judgeName().trim());
    e.setJudgeKey(judgeKey);
    e.setScores(new LinkedHashMap<>(r.scores()));
    e.setComment(r.comment());
    ScoringMath.judgeScore(e, cs, false);
    s.setStatus(SubmissionStatus.EVALUATED);
    return evaluations.saveAndFlush(e);
  }
}
