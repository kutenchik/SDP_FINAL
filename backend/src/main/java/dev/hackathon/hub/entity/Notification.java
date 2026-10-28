package dev.hackathon.hub.entity;

import dev.hackathon.hub.entity.Types.*;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "notifications")
@Getter
@Setter
public class Notification extends BaseEntity {

  @Column(nullable = false, length = 80)
  private String eventType;

  @Column(nullable = false, length = 500)
  private String message;

  @Column(nullable = false)
  private Long hackathonId;

  @Column(nullable = false)
  private Instant createdAt = Instant.now();

  @Column(name = "is_read", nullable = false)
  private boolean read;
}
