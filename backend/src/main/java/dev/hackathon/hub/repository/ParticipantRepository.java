package dev.hackathon.hub.repository;

import dev.hackathon.hub.entity.Participant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ParticipantRepository extends JpaRepository<Participant, Long> {
  List<Participant> findByTeamIdOrderById(Long teamId);
}
