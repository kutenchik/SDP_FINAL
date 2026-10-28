package dev.hackathon.hub.repository;

import dev.hackathon.hub.entity.Evaluation;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EvaluationRepository extends JpaRepository<Evaluation, Long> {
  List<Evaluation> findBySubmissionIdOrderByEvaluatedAtDesc(Long submissionId);

  boolean existsBySubmissionTeamHackathonId(Long hackathonId);

  boolean existsBySubmissionIdAndJudgeKey(Long submissionId, String judgeKey);
}
