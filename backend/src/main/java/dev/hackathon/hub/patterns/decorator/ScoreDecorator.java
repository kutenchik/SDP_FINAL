package dev.hackathon.hub.patterns.decorator;

import dev.hackathon.hub.dto.Views.ScoreAdjustment;
import java.util.*;

public abstract class ScoreDecorator implements ScoreComponent {
  protected final ScoreComponent wrapped;

  protected ScoreDecorator(ScoreComponent wrapped) {
    this.wrapped = wrapped;
  }

  protected abstract String label();

  protected abstract double amount();

  @Override
  public double score() {
    return wrapped.score() + amount();
  }

  @Override
  public List<ScoreAdjustment> adjustments() {
    List<ScoreAdjustment> result = new ArrayList<>(wrapped.adjustments());
    result.add(new ScoreAdjustment(label(), amount()));
    return List.copyOf(result);
  }
}
