package dev.hackathon.hub.entity;

import dev.hackathon.hub.entity.Types.*;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "evaluations")
@Getter
@Setter
public class Evaluation extends BaseEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "submission_id")
  private Submission submission;

  @Column(nullable = false, length = 100)
  private String judgeName;

  @Column(nullable = false, length = 100)
  private String judgeKey;

  @ElementCollection
  @CollectionTable(name = "evaluation_scores", joinColumns = @JoinColumn(name = "evaluation_id"))
  @MapKeyColumn(name = "criterion_id")
  @Column(name = "score", nullable = false)
  private Map<Long, Double> scores = new LinkedHashMap<>();

  @Column(nullable = false, length = 3000)
  private String comment;

  @Column(nullable = false)
  private Instant evaluatedAt = Instant.now();
}
