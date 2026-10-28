package dev.hackathon.hub.entity;

import dev.hackathon.hub.entity.Types.*;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "teams")
@Getter
@Setter
public class Team extends BaseEntity {

  @Column(nullable = false, length = 100)
  private String name;

  @Column(nullable = false, length = 100)
  private String nameKey;

  @Column(nullable = false, length = 2000)
  private String description;

  @Column(nullable = false, length = 500)
  private String technologyStack;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "hackathon_id")
  private Hackathon hackathon;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private TeamStatus status = TeamStatus.ACTIVE;

  @Column(nullable = false)
  private Instant createdAt = Instant.now();
}
