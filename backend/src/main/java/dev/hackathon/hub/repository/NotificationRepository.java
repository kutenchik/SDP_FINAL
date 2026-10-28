package dev.hackathon.hub.repository;

import dev.hackathon.hub.entity.Notification;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
  List<Notification> findTop50ByOrderByCreatedAtDesc();
}
