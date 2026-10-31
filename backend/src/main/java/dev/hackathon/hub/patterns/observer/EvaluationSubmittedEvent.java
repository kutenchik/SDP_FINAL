package dev.hackathon.hub.patterns.observer;

public record EvaluationSubmittedEvent(Long hackathonId, String message)
    implements HackathonEvent {}
