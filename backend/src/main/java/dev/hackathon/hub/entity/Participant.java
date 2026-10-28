package dev.hackathon.hub.entity;

import dev.hackathon.hub.entity.Types.*;
import jakarta.persistence.*;
import java.util.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "participants")
@Getter
@Setter
public class Participant extends BaseEntity {

  @Column(nullable = false, length = 100)
  private String fullName;

  @Column(nullable = false, length = 254)
  private String email;

  @Column(nullable = false, length = 254)
  private String emailKey;

  @Column(nullable = false, length = 80)
  private String role;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "team_id")
  private Team team;
}
