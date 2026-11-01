package dev.hackathon.hub.controller;

import dev.hackathon.hub.dto.Requests.*;
import dev.hackathon.hub.dto.Views.*;
import dev.hackathon.hub.patterns.facade.HackathonEvaluationFacade;
import dev.hackathon.hub.service.*;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class HubController {
  private final CatalogService catalog;
  private final QueryService queries;
  private final SubmissionService submissions;
  private final LeaderboardService leaderboard;
  private final HackathonEvaluationFacade facade;
  private final ExportService exports;

  @GetMapping("/health")
  public java.util.Map<String, String> health() {
    return java.util.Map.of("status", "UP");
  }

  @GetMapping("/dashboard")
  public Dashboard dashboard() {
    return queries.dashboard();
  }

  @GetMapping("/hackathons")
  public List<HackathonView> hackathons() {
    return queries.hackathons();
  }

  @GetMapping("/hackathons/{id}")
  public HackathonView hackathon(@PathVariable Long id) {
    return queries.hackathon(id);
  }

  @PostMapping("/hackathons")
  @ResponseStatus(HttpStatus.CREATED)
  public HackathonView createHackathon(@Valid @RequestBody HackathonRequest r) {
    return catalog.createHackathon(r);
  }

  @PutMapping("/hackathons/{id}")
  public HackathonView updateHackathon(
      @PathVariable Long id, @Valid @RequestBody HackathonRequest r) {
    return catalog.updateHackathon(id, r);
  }

  @DeleteMapping("/hackathons/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteHackathon(@PathVariable Long id) {
    catalog.deleteHackathon(id);
  }

  @GetMapping("/hackathons/{id}/tasks")
  public List<TaskView> tasks(@PathVariable Long id) {
    return queries.tasks(id);
  }

  @PostMapping("/hackathons/{id}/tasks")
  @ResponseStatus(HttpStatus.CREATED)
  public TaskView createTask(@PathVariable Long id, @Valid @RequestBody TaskRequest r) {
    return catalog.createTask(id, r);
  }

  @GetMapping("/hackathons/{id}/criteria")
  public List<CriterionView> criteria(@PathVariable Long id) {
    return queries.criteria(id);
  }

  @PutMapping("/hackathons/{id}/criteria")
  public List<CriterionView> criteria(
      @PathVariable Long id, @Valid @RequestBody CriteriaRequest r) {
    return catalog.replaceCriteria(id, r);
  }

  @GetMapping("/teams")
  public List<TeamView> teams(@RequestParam(required = false) Long hackathonId) {
    return queries.teams(hackathonId);
  }

  @PostMapping("/teams")
  @ResponseStatus(HttpStatus.CREATED)
  public TeamView createTeam(@Valid @RequestBody TeamRequest r) {
    return catalog.saveTeam(null, r);
  }

  @PutMapping("/teams/{id}")
  public TeamView updateTeam(@PathVariable Long id, @Valid @RequestBody TeamRequest r) {
    return catalog.saveTeam(id, r);
  }

  @PostMapping("/teams/{id}/participants")
  @ResponseStatus(HttpStatus.CREATED)
  public ParticipantView participant(
      @PathVariable Long id, @Valid @RequestBody ParticipantRequest r) {
    return catalog.addParticipant(id, r);
  }

  @DeleteMapping("/teams/{id}/participants/{participantId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void removeParticipant(@PathVariable Long id, @PathVariable Long participantId) {
    catalog.removeParticipant(id, participantId);
  }

  @GetMapping("/submissions")
  public List<SubmissionView> submissions(@RequestParam(required = false) Long hackathonId) {
    return queries.submissions(hackathonId);
  }

  @PostMapping("/submissions")
  @ResponseStatus(HttpStatus.CREATED)
  public SubmissionView createSubmission(@Valid @RequestBody SubmissionRequest r) {
    return submissions.save(null, r);
  }

  @PutMapping("/submissions/{id}")
  public SubmissionView updateSubmission(
      @PathVariable Long id, @Valid @RequestBody SubmissionRequest r) {
    return submissions.save(id, r);
  }

  @GetMapping("/submissions/{id}/evaluations")
  public List<EvaluationView> evaluations(@PathVariable Long id) {
    return queries.evaluations(id);
  }

  @PostMapping("/evaluations")
  @ResponseStatus(HttpStatus.CREATED)
  public Leaderboard evaluate(@Valid @RequestBody EvaluationRequest r) {
    return facade.evaluateSubmission(r);
  }

  @PutMapping("/submissions/{id}/modifiers")
  public Leaderboard modifiers(@PathVariable Long id, @Valid @RequestBody ModifiersRequest r) {
    return facade.changeModifiers(id, r);
  }

  @GetMapping("/hackathons/{id}/leaderboard")
  public Leaderboard leaderboard(@PathVariable Long id) {
    return leaderboard.calculate(id);
  }

  @PutMapping("/hackathons/{id}/strategy")
  public Leaderboard strategy(@PathVariable Long id, @Valid @RequestBody StrategyRequest r) {
    return facade.changeStrategy(id, r.strategy());
  }

  @GetMapping("/notifications")
  public List<ActivityView> notifications() {
    return queries.notifications();
  }

  @PutMapping("/notifications/{id}/read")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void read(@PathVariable Long id) {
    queries.markRead(id);
  }

  @GetMapping("/audit")
  public List<ActivityView> audit() {
    return queries.audit();
  }

  @GetMapping("/hackathons/{id}/export/json")
  public ResponseEntity<ExportReport> json(@PathVariable Long id) {
    return ResponseEntity.ok()
        .header(
            HttpHeaders.CONTENT_DISPOSITION,
            "attachment; filename=hackathon-" + id + "-results.json")
        .body(queries.report(id));
  }

  @GetMapping("/hackathons/{id}/export/pdf")
  public ResponseEntity<byte[]> pdf(@PathVariable Long id) {
    return ResponseEntity.ok()
        .contentType(MediaType.APPLICATION_PDF)
        .header(
            HttpHeaders.CONTENT_DISPOSITION,
            "attachment; filename=hackathon-" + id + "-results.pdf")
        .body(exports.pdf(queries.report(id)));
  }
}
