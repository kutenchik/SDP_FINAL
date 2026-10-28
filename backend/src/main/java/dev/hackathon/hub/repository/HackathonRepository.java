package dev.hackathon.hub.repository;

import dev.hackathon.hub.entity.Hackathon;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HackathonRepository extends JpaRepository<Hackathon, Long> {}
