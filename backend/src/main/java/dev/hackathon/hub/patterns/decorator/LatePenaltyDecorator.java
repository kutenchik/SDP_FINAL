package dev.hackathon.hub.patterns.decorator;

public class LatePenaltyDecorator extends ScoreDecorator {
  public LatePenaltyDecorator(ScoreComponent wrapped) {
    super(wrapped);
  }

  @Override
  protected String label() {
    return "Late penalty";
  }

  @Override
  protected double amount() {
    return -10;
  }
}
