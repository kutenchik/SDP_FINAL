package dev.hackathon.hub;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import dev.hackathon.hub.dto.Requests.*;
import dev.hackathon.hub.dto.Views.*;
import dev.hackathon.hub.entity.*;
import dev.hackathon.hub.entity.Types.*;
import dev.hackathon.hub.exception.DomainException;
import dev.hackathon.hub.patterns.builder.*;
import dev.hackathon.hub.patterns.decorator.*;
import dev.hackathon.hub.patterns.facade.*;
import dev.hackathon.hub.patterns.factory.*;
import dev.hackathon.hub.patterns.observer.*;
import dev.hackathon.hub.patterns.strategy.*;
import dev.hackathon.hub.service.*;
import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.Test;

class PatternTests {
  private List<EvaluationCriterion> criteria() {
    EvaluationCriterion a = new EvaluationCriterion();
    a.setId(1L);
    a.setMaxScore(10);
    a.setWeight(0.75);
    EvaluationCriterion b = new EvaluationCriterion();
    b.setId(2L);
    b.setMaxScore(20);
    b.setWeight(0.25);
    return List.of(a, b);
  }

  private Evaluation evaluation(double a, double b) {
    Evaluation e = new Evaluation();
    e.setScores(Map.of(1L, a, 2L, b));
    return e;
  }

  @Test
  void builderConstructsSubmissionAndRejectsMissingTitleAndUnsafeUrls() {
    Team team = new Team();
    Submission s =
        new SubmissionBuilder()
            .title(" Project ")
            .description("A real project")
            .repositoryUrl("https://github.com/example/project")
            .team(team)
            .build();
    assertThat(s.getTitle()).isEqualTo("Project");
    assertThat(s.getTeam()).isSameAs(team);
    assertThatThrownBy(() -> new SubmissionBuilder().description("Description").team(team).build())
        .isInstanceOf(SubmissionValidationException.class)
        .hasMessageContaining("title");
    assertThatThrownBy(
            () ->
                new SubmissionBuilder()
                    .title("X")
                    .description("Description")
                    .team(team)
                    .repositoryUrl("javascript:alert(1)")
                    .build())
        .isInstanceOf(SubmissionValidationException.class);
  }

  @Test
  void factorySubclassesCreateDistinctTypesAndValidateTheirOwnRules() {
    Hackathon h = new Hackathon();
    h.setStartDate(Instant.now().minusSeconds(60));
    h.setSubmissionDeadline(Instant.now().plusSeconds(3600));
    TaskRequest r =
        new TaskRequest(
            "Task",
            "A sufficiently detailed coding task description",
            TaskType.CODING,
            Instant.now().plusSeconds(60),
            5,
            10);
    assertThat(new CodingTaskCreator().create(r, h)).isInstanceOf(CodingTask.class);
    assertThat(new PitchTaskCreator().create(r, h))
        .isInstanceOf(PitchTask.class)
        .extracting(HackathonTask::getDurationMinutes)
        .isEqualTo(5);
    assertThat(new QuizTaskCreator().create(r, h))
        .isInstanceOf(QuizTask.class)
        .extracting(HackathonTask::getQuestionCount)
        .isEqualTo(10);
    assertThatThrownBy(
            () ->
                new PitchTaskCreator()
                    .create(
                        new TaskRequest("Pitch", "Brief", TaskType.PITCH, r.deadline(), 31, null),
                        h))
        .isInstanceOf(DomainException.class);
    assertThatThrownBy(
            () ->
                new QuizTaskCreator()
                    .create(
                        new TaskRequest("Quiz", "Brief", TaskType.QUIZ, r.deadline(), null, 0), h))
        .isInstanceOf(DomainException.class);
  }

  @Test
  void strategiesUseNormalizedCriteriaAndLeaveOriginalsUntouched() {
    var es = List.of(evaluation(10, 0), evaluation(8, 16), evaluation(2, 4));
    assertThat(new StandardScoringStrategy().calculate(es, criteria()))
        .isCloseTo(50, within(0.0001));
    assertThat(new OlympicScoringStrategy().calculate(es, criteria()))
        .isCloseTo(50, within(0.0001));
    assertThat(new WeightedScoringStrategy().calculate(es, criteria()))
        .isCloseTo(175.0 / 3, within(0.0001));
    assertThat(es.getFirst().getScores()).containsEntry(1L, 10.0);
  }

  @Test
  void olympicFallsBackToMeanForFewerThanThreeAndTrimsExactlyOneEach() {
    var scoring = new OlympicScoringStrategy();
    assertThat(scoring.calculate(List.of(), criteria())).isZero();
    assertThat(scoring.calculate(List.of(evaluation(10, 20)), criteria())).isEqualTo(100);
    assertThat(scoring.calculate(List.of(evaluation(10, 20), evaluation(0, 0)), criteria()))
        .isEqualTo(50);
    assertThat(
            scoring.calculate(
                List.of(evaluation(10, 20), evaluation(8, 16), evaluation(0, 0)), criteria()))
        .isEqualTo(80);
  }

  @Test
  void weightedRejectsNonNormalizedWeights() {
    var cs = criteria();
    cs.getFirst().setWeight(1);
    assertThatThrownBy(() -> new WeightedScoringStrategy().calculate(List.of(), cs))
        .isInstanceOf(DomainException.class)
        .hasMessageContaining("100%");
  }

  @Test
  void decoratorsWrapTheSameInterfaceAndComposeWithoutChangingBase() {
    ScoreComponent base = new BaseScoreComponent(85);
    ScoreComponent decorated = new LatePenaltyDecorator(new EarlySubmissionBonusDecorator(base));
    assertThat(decorated.score()).isEqualTo(80);
    assertThat(decorated.adjustments()).hasSize(2);
    assertThat(base.score()).isEqualTo(85);
    assertThat(new OriginalityBonusDecorator(decorated).score()).isEqualTo(85);
  }

  @Test
  void observerExplicitlyRegistersRemovesAndNotifiesEachListenerOnce() {
    HackathonEventListener first = mock(HackathonEventListener.class),
        second = mock(HackathonEventListener.class);
    var publisher = new HackathonEventPublisher(List.of(first));
    publisher.register(second);
    publisher.register(second);
    publisher.remove(first);
    var event = new SubmissionCreatedEvent(1L, "New submission");
    publisher.publish(event);
    verifyNoInteractions(first);
    verify(second, times(1)).onEvent(event);
  }

  @Test
  void facadeCoordinatesPersistenceRecalculationThenNotification() {
    EvaluationService evaluationService = mock(EvaluationService.class);
    LeaderboardService leaderboard = mock(LeaderboardService.class);
    HackathonEventPublisher publisher = mock(HackathonEventPublisher.class);
    Hackathon h = new Hackathon();
    h.setId(1L);
    Team team = new Team();
    team.setHackathon(h);
    Submission s = new Submission();
    s.setTeam(team);
    s.setTitle("Project");
    Evaluation e = new Evaluation();
    e.setSubmission(s);
    e.setJudgeName("Judge");
    var request = new EvaluationRequest(1L, "Judge", Map.of(1L, 8.0), "");
    var expected = new Leaderboard(1L, StrategyType.STANDARD, List.of());
    when(evaluationService.validateAndSave(request)).thenReturn(e);
    when(leaderboard.calculate(1L)).thenReturn(expected);
    var facade = new HackathonEvaluationFacade(evaluationService, leaderboard, publisher);
    assertThat(facade.evaluateSubmission(request)).isSameAs(expected);
    var order = inOrder(evaluationService, leaderboard, publisher);
    order.verify(evaluationService).validateAndSave(request);
    order.verify(leaderboard).calculate(1L);
    order.verify(publisher).publish(any(EvaluationSubmittedEvent.class));
  }
}
