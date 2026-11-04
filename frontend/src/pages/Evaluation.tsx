import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Send } from "lucide-react";
import { api } from "../api/client";
import { useHub } from "../hooks/useHub";
import { useResource } from "../hooks/useResource";
import type {
  Criterion,
  Evaluation as EvaluationType,
  Leaderboard,
  Submission,
} from "../types";
import {
  Badge,
  Button,
  Empty,
  ErrorState,
  FormError,
  Input,
  Loading,
  PageHeading,
  SubmitForm,
  Textarea,
  useMutation,
} from "../components/ui";
import { EventPicker, useSelectedEvent } from "../components/EventPicker";
import { ModifierPanel, StrategyPanel } from "../components/ScoringControls";
import { ProjectLinks } from "./Submissions";
import { dateTime, score } from "../utils/format";
function JudgeForm({
  submission,
  criteria,
  weighted,
  onSaved,
  disabled,
}: {
  submission: Submission;
  criteria: Criterion[];
  weighted: boolean;
  onSaved: () => Promise<void>;
  disabled: boolean;
}) {
  const hub = useHub();
  const [judgeName, setJudgeName] = useState("");
  const [comment, setComment] = useState("");
  const previouslyDisabled = useRef(disabled);
  useEffect(() => {
    if (previouslyDisabled.current && !disabled)
      document
        .querySelector<HTMLInputElement>('input[name="judgeName"]')
        ?.focus();
    previouslyDisabled.current = disabled;
  }, [disabled]);
  const [scores, setScores] = useState<Record<string, number | "">>({});
  const preview = criteria.reduce(
    (n, c) =>
      n +
      (Number(scores[c.id] || 0) / c.maxScore) *
        100 *
        (weighted ? c.weight : 1 / criteria.length),
    0,
  );
  const mutation = useMutation(async () => {
    await hub.refresh();
    await onSaved();
    hub.toast("Evaluation submitted.");
    setScores({});
    setJudgeName("");
    setComment("");
  });
  return (
    <SubmitForm
      onSubmit={() =>
        void mutation.run(() =>
          api.post("/evaluations", {
            submissionId: submission.id,
            judgeName,
            comment,
            scores,
          }),
        )
      }
    >
      <FormError error={mutation.error} />
      <fieldset
        disabled={disabled || mutation.busy}
        style={{ border: 0, padding: 0, margin: 0 }}
      >
        <legend className="sr-only">Judge evaluation</legend>
        <Input
          label="Judge name"
          name="judgeName"
          required
          maxLength={100}
          placeholder="Your full name"
          autoComplete="name"
          value={judgeName}
          error={mutation.error?.errors.judgeName}
          onChange={(e) => setJudgeName(e.target.value)}
          hint="Each judge can review a project once. Use a distinct name for each judge in this demo."
        />
        {criteria.map((c) => (
          <div className="evaluation-score" key={c.id}>
            <div className="evaluation-score-top">
              <div>
                <label htmlFor={`criterion-${c.id}`}>{c.name}</label>
                <p>
                  {c.description} · {Math.round(c.weight * 100)}% weight
                </p>
              </div>
              <div className="score-number">
                <input
                  id={`criterion-${c.id}`}
                  type="number"
                  aria-label={`${c.name} score`}
                  min={0}
                  max={c.maxScore}
                  step="0.1"
                  required
                  value={scores[c.id] ?? ""}
                  onChange={(e) =>
                    setScores((s) => ({
                      ...s,
                      [c.id]:
                        e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                />
                <span>/ {c.maxScore}</span>
              </div>
            </div>
            <input
              type="range"
              aria-label={`Adjust ${c.name} score`}
              min={0}
              max={c.maxScore}
              step="0.1"
              value={scores[c.id] || 0}
              onChange={(e) =>
                setScores((s) => ({ ...s, [c.id]: Number(e.target.value) }))
              }
            />
          </div>
        ))}
        <div className="score-preview">
          <span>{weighted ? "Weighted" : "Standard"} Score Preview</span>
          <strong>
            {score(preview)}
            <small>/ 100</small>
          </strong>
        </div>
        <Textarea
          label="Constructive feedback"
          maxLength={3000}
          placeholder="Enter evaluation feedback."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <Button
          type="submit"
          busy={mutation.busy}
          disabled={criteria.length === 0}
          style={{ width: "100%" }}
        >
          <Send size={16} aria-hidden="true" />
          Submit evaluation
        </Button>
      </fieldset>
    </SubmitForm>
  );
}

import { can } from "../utils/permissions";
import {
  FilterTabs,
  Pagination,
  Table,
  usePagination,
} from "../components/DataTable";

export default function Evaluation() {
  const hub = useHub();
  const event = useSelectedEvent();
  const [params, setParams] = useSearchParams();
  const requested = hub.submissions.find(
    (submission) => submission.id === Number(params.get("submissionId")),
  );
  const requestedEventId = requested?.hackathonId;
  const setEventId = hub.setEventId;
  useEffect(() => {
    if (requestedEventId && requestedEventId !== event?.id)
      setEventId(requestedEventId);
  }, [requestedEventId, event?.id, setEventId]);
  const [tab, setTab] = useState(
    params.get("submissionId") ? "all" : "pending",
  );
  const projects = hub.submissions.filter(
    (submission) => submission.hackathonId === event?.id,
  );
  const filtered = projects.filter(
    (submission) =>
      tab === "all" ||
      (tab === "pending"
        ? submission.evaluationCount === 0
        : submission.evaluationCount > 0),
  );
  const selected =
    filtered.find(
      (submission) => submission.id === Number(params.get("submissionId")),
    ) || filtered[0];
  const pagination = usePagination(filtered, `${event?.id}-${tab}`);
  const resource = useResource(
    async () => {
      if (!event) return null;
      const [criteria, board, evaluations] = await Promise.all([
        api.get<Criterion[]>(`/hackathons/${event.id}/criteria`),
        api.get<Leaderboard>(`/hackathons/${event.id}/leaderboard`),
        selected
          ? api.get<EvaluationType[]>(`/submissions/${selected.id}/evaluations`)
          : Promise.resolve({ data: [] }),
      ]);
      return {
        criteria: criteria.data,
        board: board.data,
        evaluations: evaluations.data,
      };
    },
    [event?.id, selected?.id],
    hub.revision,
  );
  const rank = resource.data?.board.rankings.find(
    (row) => row.submissionId === selected?.id,
  );
  const withdrawn =
    hub.teams.find((team) => team.id === selected?.teamId)?.status ===
    "WITHDRAWN";
  const closed = event?.status !== "ACTIVE" && event?.status !== "JUDGING";
  return (
    <>
      <PageHeading
        title="Evaluation"
        description="Review submissions and record criterion scores."
      />
      <FilterTabs
        label="Evaluation status"
        value={tab}
        onChange={setTab}
        items={[
          {
            value: "pending",
            label: "Pending",
            count: projects.filter((s) => s.evaluationCount === 0).length,
          },
          {
            value: "completed",
            label: "Completed",
            count: projects.filter((s) => s.evaluationCount > 0).length,
          },
          { value: "all", label: "All", count: projects.length },
        ]}
      />
      <div className="toolbar">
        <EventPicker onChange={() => setParams({})} />
        <span className="result-count">{filtered.length} submissions</span>
      </div>
      {hub.loading ? (
        <Loading />
      ) : !event ? (
        <Empty
          title="No hackathons"
          description="Create a hackathon before evaluating submissions."
        />
      ) : (
        <>
          <section className="evaluation-list">
            <Table label="Evaluation submissions">
              <thead>
                <tr>
                  <th scope="col">Project</th>
                  <th scope="col">Team</th>
                  <th scope="col" className="text-right">
                    Evaluations
                  </th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagination.rows.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <Empty
                        title={
                          tab === "pending"
                            ? "No pending submissions"
                            : "No submissions found"
                        }
                        description="Change the status filter or select another hackathon."
                        action={
                          tab !== "all" ? (
                            <Button
                              variant="secondary"
                              onClick={() => setTab("all")}
                            >
                              Show All
                            </Button>
                          ) : undefined
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  pagination.rows.map((submission) => (
                    <tr
                      key={submission.id}
                      className={
                        selected?.id === submission.id ? "selected-row" : ""
                      }
                    >
                      <td>{submission.title}</td>
                      <td>{submission.teamName}</td>
                      <td className="text-right mono">
                        {submission.evaluationCount}
                      </td>
                      <td>
                        <Badge value={submission.status} />
                      </td>
                      <td>
                        <Button
                          variant="ghost"
                          aria-pressed={selected?.id === submission.id}
                          onClick={() =>
                            setParams({ submissionId: String(submission.id) })
                          }
                        >
                          {can(hub.role, "evaluations.submit")
                            ? "Review"
                            : "View"}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
            <Pagination {...pagination} />
          </section>
          {resource.error ? (
            <ErrorState
              message={resource.error}
              retry={() => void resource.reload()}
            />
          ) : resource.loading ? (
            <Loading />
          ) : (
            selected &&
            resource.data && (
              <>
                <section className="panel dashboard-section">
                  <div className="panel-heading">
                    <div>
                      <h2>{selected.title}</h2>
                      <p>
                        {selected.teamName} · Submitted{" "}
                        {dateTime(selected.submittedAt)}
                      </p>
                    </div>
                    <Badge value={selected.status} />
                  </div>
                  <div className="panel-body">
                    <p className="selected-project-description">
                      {selected.description}
                    </p>
                    <ProjectLinks submission={selected} />
                    <p className="small muted">
                      Scoring strategy:{" "}
                      {event.scoringStrategy.charAt(0) +
                        event.scoringStrategy.slice(1).toLowerCase()}
                    </p>
                  </div>
                </section>
                <div className="evaluation-workspace">
                  <div>
                    {can(hub.role, "evaluations.submit") && (
                      <section className="panel evaluation-form">
                        <div className="panel-heading">
                          <h2>Submit Evaluation</h2>
                        </div>
                        <div className="panel-body">
                          {closed || withdrawn ? (
                            <div className="info-box">
                              {withdrawn
                                ? "This team has withdrawn. Evaluations are closed."
                                : "This hackathon is closed for evaluations."}
                            </div>
                          ) : (
                            <JudgeForm
                              key={selected.id}
                              submission={selected}
                              criteria={resource.data.criteria}
                              weighted={event.scoringStrategy === "WEIGHTED"}
                              onSaved={resource.reload}
                              disabled={false}
                            />
                          )}
                        </div>
                      </section>
                    )}
                    <section
                      className={`panel ${can(hub.role, "evaluations.submit") ? "evaluation-history" : ""}`}
                    >
                      <div className="panel-heading">
                        <h2>Recorded Evaluations</h2>
                        <span className="result-count">
                          {resource.data.evaluations.length} evaluations
                        </span>
                      </div>
                      <div className="panel-body">
                        {resource.data.evaluations.length === 0 ? (
                          <Empty
                            title="No evaluations"
                            description="Submitted judge evaluations appear here."
                          />
                        ) : (
                          resource.data.evaluations.map((evaluation) => (
                            <article
                              className="judge-review"
                              key={evaluation.id}
                            >
                              <div className="judge-review-top">
                                <strong>{evaluation.judgeName}</strong>
                                <time dateTime={evaluation.evaluatedAt}>
                                  {dateTime(evaluation.evaluatedAt)}
                                </time>
                              </div>
                              <p>
                                {evaluation.comment || "No feedback provided."}
                              </p>
                              <div className="judge-scores">
                                {resource.data!.criteria.map((criterion) => (
                                  <span className="tag" key={criterion.id}>
                                    {criterion.name}:{" "}
                                    {evaluation.scores[criterion.id]} /{" "}
                                    {criterion.maxScore}
                                  </span>
                                ))}
                              </div>
                            </article>
                          ))
                        )}
                      </div>
                    </section>
                  </div>
                  <div className="side-stack">
                    <section className="panel">
                      <div className="panel-heading">
                        <h2>Score Breakdown</h2>
                        <span className="result-count">
                          {resource.data.evaluations.length} evaluations
                        </span>
                      </div>
                      <div className="panel-body">
                        {rank?.scored ? (
                          <>
                            <div className="score-preview">
                              <span>Final Score</span>
                              <strong>
                                {score(rank.finalScore)}
                                <small>/ 100</small>
                              </strong>
                            </div>
                            <div className="breakdown-list">
                              <span>Base: {score(rank.baseScore)}</span>
                              {rank.adjustments.map((adjustment, index) => (
                                <span key={index}>
                                  {adjustment.label}:{" "}
                                  {adjustment.amount > 0 ? "+" : ""}
                                  {score(adjustment.amount)}
                                </span>
                              ))}
                            </div>
                          </>
                        ) : (
                          <p className="muted small">
                            {withdrawn
                              ? "Withdrawn teams are not ranked."
                              : resource.data.evaluations.length === 0
                                ? "No evaluations recorded."
                                : "Score unavailable."}
                          </p>
                        )}
                      </div>
                    </section>
                    {can(hub.role, "scoring.manage") && (
                      <>
                        <StrategyPanel
                          event={event}
                          onSaved={resource.reload}
                        />
                        <ModifierPanel
                          key={`${selected.id}-${selected.earlyBonus}-${selected.latePenalty}-${selected.originalityBonus}`}
                          submission={selected}
                          event={event}
                          onSaved={resource.reload}
                        />
                      </>
                    )}
                  </div>
                </div>
              </>
            )
          )}
        </>
      )}
    </>
  );
}
