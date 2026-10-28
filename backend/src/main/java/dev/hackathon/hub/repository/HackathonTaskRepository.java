package dev.hackathon.hub.repository;

import dev.hackathon.hub.entity.HackathonTask;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HackathonTaskRepository extends JpaRepository<HackathonTask, Long> {
  List<HackathonTask> findByHackathonIdOrderById(Long hackathonId);
}
