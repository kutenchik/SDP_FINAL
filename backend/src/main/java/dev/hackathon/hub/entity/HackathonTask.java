package dev.hackathon.hub.entity;

import dev.hackathon.hub.entity.Types.TaskType;
import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "hackathon_tasks")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "task_type")
@Getter
@Setter
public abstract class HackathonTask extends BaseEntity {
  @Column(nullable = false, length = 160)
  private String title;

  @Column(nullable = false, length = 3000)
  private String description;

  @Column(nullable = false)
  private Instant deadline;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "hackathon_id")
  private Hackathon hackathon;

  private Integer durationMinutes;
  private Integer questionCount;

  public abstract TaskType getTaskType();
}
