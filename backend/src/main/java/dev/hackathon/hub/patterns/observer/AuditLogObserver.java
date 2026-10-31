package dev.hackathon.hub.patterns.observer;

import dev.hackathon.hub.entity.AuditLog;
import dev.hackathon.hub.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuditLogObserver implements HackathonEventListener {
  private final AuditLogRepository repository;

  @Override
  public void onEvent(HackathonEvent event) {
    AuditLog item = new AuditLog();
    item.setHackathonId(event.hackathonId());
    item.setEventType(event.type());
    item.setMessage(event.message());
    repository.save(item);
  }
}
