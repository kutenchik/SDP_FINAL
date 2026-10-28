package dev.hackathon.hub.repository;

import dev.hackathon.hub.entity.EvaluationCriterion;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EvaluationCriterionRepository extends JpaRepository<EvaluationCriterion, Long> {
  List<EvaluationCriterion> findByHackathonIdOrderById(Long hackathonId);
}
