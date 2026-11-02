package dev.hackathon.hub;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.*;
import dev.hackathon.hub.dto.Requests.*;
import dev.hackathon.hub.dto.Views.*;
import dev.hackathon.hub.entity.Types.*;
import dev.hackathon.hub.patterns.facade.HackathonEvaluationFacade;
import dev.hackathon.hub.repository.*;
import dev.hackathon.hub.service.*;
import jakarta.persistence.EntityManager;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.*;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class WorkflowTests {
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired CatalogService catalog;
  @Autowired QueryService queries;
  @Autowired SubmissionService submissions;
  @Autowired HackathonEvaluationFacade facade;
  @Autowired EvaluationRepository evaluations;
  @Autowired NotificationRepository notifications;
  @Autowired AuditLogRepository audit;
  @Autowired EntityManager em;

  record Fixture(HackathonView hackathon, TeamView team, SubmissionView submission) {}

  HackathonRequest event(Instant deadline) {
    Instant now = Instant.now();
    return new HackathonRequest(
        "Integration sprint",
        "A real event",
        now.minus(Duration.ofDays(2)),
        now.plus(Duration.ofDays(4)),
        deadline,
        HackathonStatus.ACTIVE);
  }

  Fixture fixture() {
    var h = catalog.createHackathon(event(Instant.now().plus(Duration.ofDays(2))));
    var t =
        catalog.saveTeam(
            null,
            new TeamRequest(
                "Integration team", "Description", "Java, React", h.id(), TeamStatus.ACTIVE));
    var s =
        submissions.save(
            null,
            new SubmissionRequest(
                "Integration project",
                "A project",
                "https://github.com/example/project",
                null,
                null,
                t.id(),
                null));
    return new Fixture(h, t, s);
  }

  Map<Long, Double> scores(Long id, double score) {
    Map<Long, Double> m = new LinkedHashMap<>();
    queries.criteria(id).forEach(c -> m.put(c.id(), score));
    return m;
  }

  ResultActions postJson(String url, Object body) throws Exception {
    return mvc.perform(
        post(url).contentType("application/json").content(json.writeValueAsBytes(body)));
  }

  JsonNode body(ResultActions action) throws Exception {
    return json.readTree(action.andReturn().getResponse().getContentAsString());
  }

  @Test
  void developmentOriginCanCreateAnEventAndUnknownOriginsAreRejected() throws Exception {
    byte[] request = json.writeValueAsBytes(event(Instant.now().plus(Duration.ofDays(2))));
    mvc.perform(
            post("/api/hackathons")
                .header("Origin", "http://127.0.0.1:5173")
                .contentType("application/json")
                .content(request))
        .andExpect(status().isCreated());
    mvc.perform(
            post("/api/hackathons")
                .header("Origin", "https://untrusted.example")
                .contentType("application/json")
                .content(request))
        .andExpect(status().isForbidden());
  }

  @Test
  void completeSuccessfulJourneyThroughHttpAndBothExports() throws Exception {
    long h =
        body(postJson("/api/hackathons", event(Instant.now().plus(Duration.ofDays(2))))
                .andExpect(status().isCreated()))
            .get("id")
            .asLong();
    long t =
        body(postJson(
                    "/api/teams",
                    new TeamRequest(
                        "Journey team", "Description", "React, Java", h, TeamStatus.ACTIVE))
                .andExpect(status().isCreated()))
            .get("id")
            .asLong();
    postJson(
            "/api/teams/" + t + "/participants",
            new ParticipantRequest("Amina", "amina@example.com", "Lead"))
        .andExpect(status().isCreated());
    long task =
        body(postJson(
                    "/api/hackathons/" + h + "/tasks",
                    new TaskRequest(
                        "Demo pitch",
                        "Explain the solution",
                        TaskType.PITCH,
                        Instant.now().plus(Duration.ofDays(1)),
                        5,
                        null))
                .andExpect(status().isCreated()))
            .get("id")
            .asLong();
    long s =
        body(postJson(
                    "/api/submissions",
                    new SubmissionRequest(
                        "Journey project",
                        "A working project",
                        "https://github.com/example/project",
                        "https://example.com/slides",
                        "https://example.com/demo",
                        t,
                        task))
                .andExpect(status().isCreated()))
            .get("id")
            .asLong();
    postJson("/api/evaluations", new EvaluationRequest(s, "Judge A", scores(h, 8), "Good work"))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.rankings[0].finalScore").value(80));
    mvc.perform(
            put("/api/hackathons/" + h + "/strategy")
                .contentType("application/json")
                .content("{\"strategy\":\"WEIGHTED\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.strategy").value("WEIGHTED"));
    mvc.perform(
            put("/api/submissions/" + s + "/modifiers")
                .contentType("application/json")
                .content("{\"earlyBonus\":true,\"originalityBonus\":true,\"latePenalty\":false}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.rankings[0].finalScore").value(90));
    mvc.perform(get("/api/hackathons/" + h + "/export/json"))
        .andExpect(status().isOk())
        .andExpect(
            header()
                .string(
                    "Content-Disposition", "attachment; filename=hackathon-" + h + "-results.json"))
        .andExpect(jsonPath("$.teams[0].participants[0].fullName").value("Amina"))
        .andExpect(jsonPath("$.leaderboard.rankings[0].adjustments.length()").value(2));
    byte[] pdf =
        mvc.perform(get("/api/hackathons/" + h + "/export/pdf"))
            .andExpect(status().isOk())
            .andExpect(content().contentType("application/pdf"))
            .andReturn()
            .getResponse()
            .getContentAsByteArray();
    assertThat(new String(pdf, 0, 4, java.nio.charset.StandardCharsets.US_ASCII)).isEqualTo("%PDF");
  }

  @Test
  void switchingStrategiesRecalculatesWithoutMutatingEvaluations() {
    var f = fixture();
    var cs = queries.criteria(f.hackathon.id());
    catalog.replaceCriteria(
        f.hackathon.id(),
        new CriteriaRequest(
            List.of(
                new CriterionRequest("Innovation", "", .75, 10),
                new CriterionRequest("Execution", "", .25, 10))));
    cs = queries.criteria(f.hackathon.id());
    long a = cs.get(0).id(), b = cs.get(1).id();
    facade.evaluateSubmission(
        new EvaluationRequest(f.submission.id(), "A", Map.of(a, 10.0, b, 0.0), ""));
    facade.evaluateSubmission(
        new EvaluationRequest(f.submission.id(), "B", Map.of(a, 8.0, b, 8.0), ""));
    facade.evaluateSubmission(
        new EvaluationRequest(f.submission.id(), "C", Map.of(a, 0.0, b, 0.0), ""));
    assertThat(
            facade
                .changeStrategy(f.hackathon.id(), StrategyType.STANDARD)
                .rankings()
                .getFirst()
                .baseScore())
        .isEqualTo(43.33);
    assertThat(
            facade
                .changeStrategy(f.hackathon.id(), StrategyType.OLYMPIC)
                .rankings()
                .getFirst()
                .baseScore())
        .isEqualTo(50);
    assertThat(
            facade
                .changeStrategy(f.hackathon.id(), StrategyType.WEIGHTED)
                .rankings()
                .getFirst()
                .baseScore())
        .isEqualTo(51.67);
    assertThat(queries.evaluations(f.submission.id())).hasSize(3);
    assertThat(
            queries.evaluations(f.submission.id()).stream()
                .filter(e -> e.judgeName().equals("A"))
                .findFirst()
                .orElseThrow()
                .scores())
        .containsEntry(a, 10.0);
  }

  @Test
  void submissionNotifiesBothPersistentObservers() {
    var f = fixture();
    assertThat(queries.notifications())
        .anyMatch(
            n ->
                n.eventType().equals("SubmissionCreated")
                    && n.hackathonId().equals(f.hackathon.id()));
    assertThat(audit.count()).isEqualTo(notifications.count());
  }

  @Test
  void savingFlushingAndReloadingPreservesRelationsAndScores() {
    var f = fixture();
    facade.evaluateSubmission(
        new EvaluationRequest(f.submission.id(), "Judge", scores(f.hackathon.id(), 7), "Saved"));
    em.flush();
    em.clear();
    assertThat(queries.submissions(f.hackathon.id()).getFirst().teamName())
        .isEqualTo("Integration team");
    assertThat(queries.evaluations(f.submission.id()).getFirst().scores())
        .hasSize(4)
        .containsValue(7.0);
  }

  @Test
  void missingTitleProducesFieldValidation() throws Exception {
    var f = fixture();
    postJson(
            "/api/submissions",
            new SubmissionRequest(
                "", "Description", "https://example.com", null, null, f.team.id(), null))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.title").exists());
  }

  @Test
  void invalidScoreIsRejectedWithoutPersistingEvaluationOrNotification() throws Exception {
    var f = fixture();
    long count = notifications.count();
    postJson(
            "/api/evaluations",
            new EvaluationRequest(f.submission.id(), "Judge", scores(f.hackathon.id(), 11), ""))
        .andExpect(status().isBadRequest());
    assertThat(evaluations.count()).isZero();
    assertThat(notifications.count()).isEqualTo(count);
  }

  @Test
  void duplicateTeamNamesAreCaseInsensitiveWithinAnEvent() throws Exception {
    var f = fixture();
    postJson(
            "/api/teams",
            new TeamRequest("INTEGRATION TEAM", "", "", f.hackathon.id(), TeamStatus.ACTIVE))
        .andExpect(status().isConflict());
  }

  @Test
  void submissionAfterDeadlineIsRejected() throws Exception {
    var h = catalog.createHackathon(event(Instant.now().minus(Duration.ofHours(1))));
    var t = catalog.saveTeam(null, new TeamRequest("Late team", "", "", h.id(), TeamStatus.ACTIVE));
    postJson(
            "/api/submissions",
            new SubmissionRequest(
                "Late project", "Description", "https://example.com", null, null, t.id(), null))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("The submission deadline has passed."));
  }

  @Test
  void unsafeUrlsAndInvalidEmailsAreRejected() throws Exception {
    var f = fixture();
    postJson(
            "/api/submissions",
            new SubmissionRequest(
                "Project", "Description", "javascript:alert(1)", null, null, f.team.id(), null))
        .andExpect(status().isBadRequest());
    postJson(
            "/api/teams/" + f.team.id() + "/participants",
            new ParticipantRequest("User", "bad-email", "Lead"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.email").exists());
  }

  @Test
  void conflictingModifiersAreRejectedAndFinalScoreIsClamped() throws Exception {
    var f = fixture();
    facade.evaluateSubmission(
        new EvaluationRequest(f.submission.id(), "Judge", scores(f.hackathon.id(), 10), ""));
    assertThat(
            facade
                .changeModifiers(f.submission.id(), new ModifiersRequest(false, true, true))
                .rankings()
                .getFirst()
                .finalScore())
        .isEqualTo(100);
    mvc.perform(
            put("/api/submissions/" + f.submission.id() + "/modifiers")
                .contentType("application/json")
                .content("{\"earlyBonus\":true,\"latePenalty\":true,\"originalityBonus\":false}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void invalidStateTransitionsAndMissingEntitiesReturnMeaningfulErrors() throws Exception {
    var f = fixture();
    var r = event(Instant.now().plus(Duration.ofDays(2)));
    mvc.perform(
            put("/api/hackathons/" + f.hackathon.id())
                .contentType("application/json")
                .content(
                    json.writeValueAsBytes(
                        new HackathonRequest(
                            r.name(),
                            r.description(),
                            r.startDate(),
                            r.endDate(),
                            r.submissionDeadline(),
                            HackathonStatus.COMPLETED))))
        .andExpect(status().isBadRequest());
    postJson("/api/evaluations", new EvaluationRequest(999999L, "Judge", Map.of(1L, 5.0), ""))
        .andExpect(status().isNotFound());
  }

  @Test
  void criteriaLockOnceJudgingStartsAndDuplicateJudgesAreRejected() throws Exception {
    var f = fixture();
    var r = new EvaluationRequest(f.submission.id(), "Judge", scores(f.hackathon.id(), 8), "");
    facade.evaluateSubmission(r);
    postJson("/api/evaluations", r).andExpect(status().isConflict());
    mvc.perform(
            put("/api/hackathons/" + f.hackathon.id() + "/criteria")
                .contentType("application/json")
                .content(
                    json.writeValueAsBytes(
                        new CriteriaRequest(List.of(new CriterionRequest("New", "", 1, 10))))))
        .andExpect(status().isBadRequest());
  }
}
