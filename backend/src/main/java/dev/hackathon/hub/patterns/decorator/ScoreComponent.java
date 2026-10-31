package dev.hackathon.hub.patterns.decorator;

import dev.hackathon.hub.dto.Views.ScoreAdjustment;
import java.util.List;

public interface ScoreComponent {
  double score();

  List<ScoreAdjustment> adjustments();
}
