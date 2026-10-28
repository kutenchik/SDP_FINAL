package dev.hackathon.hub.repository;

import dev.hackathon.hub.entity.Submission;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {
  List<Submission> findByTeamHackathonIdOrderBySubmittedAtDesc(Long hackathonId);

  boolean existsByTeamHackathonId(Long hackathonId);
}
