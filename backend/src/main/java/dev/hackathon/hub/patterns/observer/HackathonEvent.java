package dev.hackathon.hub.patterns.observer;

public interface HackathonEvent {
  Long hackathonId();

  String message();

  default String type() {
    return getClass().getSimpleName().replace("Event", "");
  }
}
