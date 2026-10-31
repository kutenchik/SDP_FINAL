package dev.hackathon.hub.patterns.observer;

public record SubmissionCreatedEvent(Long hackathonId, String message) implements HackathonEvent {}
