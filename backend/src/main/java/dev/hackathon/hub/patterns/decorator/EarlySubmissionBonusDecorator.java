package dev.hackathon.hub.patterns.decorator;

public class EarlySubmissionBonusDecorator extends ScoreDecorator {
  public EarlySubmissionBonusDecorator(ScoreComponent wrapped) {
    super(wrapped);
  }

  @Override
  protected String label() {
    return "Early submission bonus";
  }

  @Override
  protected double amount() {
    return 5;
  }
}
