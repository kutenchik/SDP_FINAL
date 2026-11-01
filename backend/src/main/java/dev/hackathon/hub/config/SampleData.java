package dev.hackathon.hub.config;

import dev.hackathon.hub.dto.Requests.*;
import dev.hackathon.hub.dto.Views.*;
import dev.hackathon.hub.entity.Types.*;
import dev.hackathon.hub.patterns.facade.HackathonEvaluationFacade;
import dev.hackathon.hub.repository.HackathonRepository;
import dev.hackathon.hub.service.*;
import java.time.*;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "hub.seed", havingValue = "true")
public class SampleData implements ApplicationRunner {
  private final HackathonRepository repository;
  private final CatalogService catalog;
  private final QueryService queries;
  private final SubmissionService submissions;
  private final HackathonEvaluationFacade facade;

  @Override
  @Transactional
  public void run(ApplicationArguments args) {
    if (repository.count() > 0) return;
    Instant now = Instant.now();
    HackathonView first =
        catalog.createHackathon(
            new HackathonRequest(
                "Build for tomorrow",
                "48 hours. Bold ideas. Real impact. Build technology that makes a more sustainable"
                    + " world possible.",
                now.minus(Duration.ofDays(1)),
                now.plus(Duration.ofDays(4)),
                now.plus(Duration.ofDays(2)),
                HackathonStatus.ACTIVE));
    HackathonView second =
        catalog.createHackathon(
            new HackathonRequest(
                "Campus innovation sprint",
                "Reimagine campus life through thoughtful, inclusive digital experiences.",
                now.minus(Duration.ofDays(2)),
                now.plus(Duration.ofDays(5)),
                now.plus(Duration.ofDays(3)),
                HackathonStatus.ACTIVE));
    for (HackathonView h : List.of(first, second)) {
      catalog.replaceCriteria(
          h.id(),
          new CriteriaRequest(
              List.of(
                  new CriterionRequest(
                      "Innovation", "Original thinking and a clear point of difference", 0.35, 10),
                  new CriterionRequest(
                      "Technical execution",
                      "Implementation quality and engineering depth",
                      0.30,
                      10),
                  new CriterionRequest(
                      "Impact", "Value for the people who will use the project", 0.20, 10),
                  new CriterionRequest(
                      "Presentation", "A compelling, well-articulated story", 0.15, 10))));
      catalog.createTask(
          h.id(),
          new TaskRequest(
              "Build a working prototype",
              "Develop a functional solution and document your technical decisions.",
              TaskType.CODING,
              h.submissionDeadline(),
              null,
              null));
      catalog.createTask(
          h.id(),
          new TaskRequest(
              "Tell your story",
              "Present the problem, solution, and what comes next.",
              TaskType.PITCH,
              h.submissionDeadline(),
              5,
              null));
      catalog.createTask(
          h.id(),
          new TaskRequest(
              "Engineering essentials",
              "Test your team's understanding of core engineering principles.",
              TaskType.QUIZ,
              h.submissionDeadline(),
              null,
              10));
    }
    String[] names = {
      "Terra Collective",
      "Byte by Byte",
      "The Good Loop",
      "Northstar",
      "Open Campus",
      "Syntax Society"
    };
    String[] titles = {
      "Terra / a greener everyday",
      "Flowstate",
      "Re:Purpose",
      "Wayfinder",
      "Campus Connect",
      "Study Circle"
    };
    String[] descriptions = {
      "A personal carbon companion that turns everyday choices into measurable climate action.",
      "An accessible focus workspace for people who think differently.",
      "A circular marketplace connecting surplus resources with people who need them.",
      "Community-powered navigation for more accessible cities.",
      "One welcoming place for campus clubs, events, and shared experiences.",
      "Find your people, build better study habits, and learn together."
    };
    for (int i = 0; i < 6; i++) {
      HackathonView h = i < 4 ? first : second;
      TeamView team =
          catalog.saveTeam(
              null,
              new TeamRequest(
                  names[i],
                  descriptions[i],
                  i % 2 == 0 ? "React, TypeScript, Spring Boot" : "Python, FastAPI, PostgreSQL",
                  h.id(),
                  TeamStatus.ACTIVE));
      catalog.addParticipant(
          team.id(),
          new ParticipantRequest(
              new String[] {
                    "Amina Sadykova",
                    "Daniel Kim",
                    "Maya Chen",
                    "Arman Tulegen",
                    "Sofia Park",
                    "Alex Morgan"
                  }
                  [i],
              "member" + i + "@example.com",
              "Team lead"));
      catalog.addParticipant(
          team.id(),
          new ParticipantRequest(
              "Sample Developer " + (i + 1), "developer" + i + "@example.com", "Developer"));
      if (i == 3) continue;
      SubmissionView s =
          submissions.save(
              null,
              new SubmissionRequest(
                  titles[i],
                  descriptions[i],
                  "https://github.com/topics/hackathon",
                  null,
                  "https://example.com",
                  team.id(),
                  queries.tasks(h.id()).getFirst().id()));
      if (i == 2) continue;
      List<CriterionView> cs = queries.criteria(h.id());
      double[][] values = {{9.5, 9, 8.5, 9}, {8, 8.5, 9, 8}, {6, 7, 7.5, 8}};
      for (int j = 0; j < 3; j++) {
        Map<Long, Double> scores = new LinkedHashMap<>();
        for (int k = 0; k < cs.size(); k++)
          scores.put(cs.get(k).id(), Math.min(10, values[j][k] + (i % 3) * 0.3));
        facade.evaluateSubmission(
            new EvaluationRequest(
                s.id(),
                new String[] {"Dr. Sarah Mitchell", "James Okafor", "Elena Petrova"}[j],
                scores,
                "Thoughtful problem framing and a promising implementation. Keep refining the user"
                    + " experience."));
      }
      if (i == 0) facade.changeModifiers(s.id(), new ModifiersRequest(false, true, true));
    }
    facade.changeStrategy(first.id(), StrategyType.WEIGHTED);
    catalog.updateHackathon(
        second.id(),
        new HackathonRequest(
            second.name(),
            second.description(),
            second.startDate(),
            second.endDate(),
            second.submissionDeadline(),
            HackathonStatus.JUDGING));
  }
}
