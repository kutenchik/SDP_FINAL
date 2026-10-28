package dev.hackathon.hub.entity;

import dev.hackathon.hub.entity.Types.*;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "submissions")
@Getter
@Setter
public class Submission extends BaseEntity {

  @Column(nullable = false, length = 160)
  private String title;

  @Column(nullable = false, length = 5000)
  private String description;

  @Column(nullable = false, length = 1000)
  private String repositoryUrl;

  @Column(length = 1000)
  private String presentationUrl;

  @Column(length = 1000)
  private String demoUrl;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "team_id")
  private Team team;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "task_id")
  private HackathonTask task;

  @Column(nullable = false)
  private Instant submittedAt = Instant.now();

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private SubmissionStatus status = SubmissionStatus.SUBMITTED;

  @Column(nullable = false)
  private boolean latePenalty;

  @Column(nullable = false)
  private boolean earlyBonus;

  @Column(nullable = false)
  private boolean originalityBonus;
}
