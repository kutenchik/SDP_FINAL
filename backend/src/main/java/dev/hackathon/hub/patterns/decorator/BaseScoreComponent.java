package dev.hackathon.hub.patterns.decorator;

import dev.hackathon.hub.dto.Views.ScoreAdjustment;
import java.util.List;

public record BaseScoreComponent(double score) implements ScoreComponent {
  @Override
  public List<ScoreAdjustment> adjustments() {
    return List.of();
  }
}
