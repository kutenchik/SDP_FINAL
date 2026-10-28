package dev.hackathon.hub.entity;

import dev.hackathon.hub.entity.Types.*;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "hackathons")
@Getter
@Setter
public class Hackathon extends BaseEntity {

  @Column(nullable = false, length = 120)
  private String name;

  @Column(nullable = false, length = 4000)
  private String description;

  @Column(nullable = false)
  private Instant startDate;

  @Column(nullable = false)
  private Instant endDate;

  @Column(nullable = false)
  private Instant submissionDeadline;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private HackathonStatus status = HackathonStatus.DRAFT;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private StrategyType scoringStrategy = StrategyType.STANDARD;

  @Column(nullable = false)
  private Instant createdAt = Instant.now();
}
