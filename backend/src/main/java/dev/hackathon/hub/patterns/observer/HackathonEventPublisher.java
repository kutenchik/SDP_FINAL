package dev.hackathon.hub.patterns.observer;

import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.stereotype.Component;

@Component
public class HackathonEventPublisher {
  private final List<HackathonEventListener> listeners = new CopyOnWriteArrayList<>();

  public HackathonEventPublisher(List<HackathonEventListener> initialListeners) {
    initialListeners.forEach(this::register);
  }

  public void register(HackathonEventListener listener) {
    if (!listeners.contains(listener)) listeners.add(listener);
  }

  public void remove(HackathonEventListener listener) {
    listeners.remove(listener);
  }

  public void publish(HackathonEvent event) {
    listeners.forEach(listener -> listener.onEvent(event));
  }
}
