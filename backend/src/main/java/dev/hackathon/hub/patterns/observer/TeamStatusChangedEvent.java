package dev.hackathon.hub.patterns.observer;

public record TeamStatusChangedEvent(Long hackathonId, String message) implements HackathonEvent {}
