package dev.hackathon.hub.entity;

import dev.hackathon.hub.entity.Types.*;
import jakarta.persistence.*;
import java.util.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "evaluation_criteria")
@Getter
@Setter
public class EvaluationCriterion extends BaseEntity {

  @Column(nullable = false, length = 100)
  private String name;

  @Column(nullable = false, length = 1000)
  private String description;

  @Column(nullable = false)
  private double weight;

  @Column(nullable = false)
  private double maxScore;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "hackathon_id")
  private Hackathon hackathon;
}
