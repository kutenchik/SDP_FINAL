package dev.hackathon.hub.repository;

import dev.hackathon.hub.entity.AuditLog;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
  List<AuditLog> findTop100ByOrderByCreatedAtDesc();
}
