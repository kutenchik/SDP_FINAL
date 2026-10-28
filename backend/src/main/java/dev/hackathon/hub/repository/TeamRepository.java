package dev.hackathon.hub.repository;

import dev.hackathon.hub.entity.Team;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamRepository extends JpaRepository<Team, Long> {
  List<Team> findByHackathonId(Long hackathonId);

  boolean existsByHackathonIdAndNameKeyAndIdNot(Long hackathonId, String nameKey, Long id);
}
