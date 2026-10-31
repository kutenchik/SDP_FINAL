package dev.hackathon.hub.patterns.observer;

import dev.hackathon.hub.entity.Notification;
import dev.hackathon.hub.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DashboardNotificationObserver implements HackathonEventListener {
  private final NotificationRepository repository;

  @Override
  public void onEvent(HackathonEvent event) {
    Notification item = new Notification();
    item.setHackathonId(event.hackathonId());
    item.setEventType(event.type());
    item.setMessage(event.message());
    repository.save(item);
  }
}
