package dev.hackathon.hub.patterns.decorator;

public class OriginalityBonusDecorator extends ScoreDecorator {
  public OriginalityBonusDecorator(ScoreComponent wrapped) {
    super(wrapped);
  }

  @Override
  protected String label() {
    return "Originality bonus";
  }

  @Override
  protected double amount() {
    return 5;
  }
}
