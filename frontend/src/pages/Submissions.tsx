import { useDeferredValue, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ExternalLink,
  GitBranch,
  Monitor,
  Plus,
  Presentation,
} from "lucide-react";
import { api } from "../api/client";
import { useHub } from "../hooks/useHub";
import { useBoards } from "../hooks/useBoards";
import { useResource } from "../hooks/useResource";
import type { Criterion, Evaluation, Submission, Task } from "../types";
import { can } from "../utils/permissions";
import { dateTime, score } from "../utils/format";
import {
  Badge,
  Button,
  Empty,
  ErrorState,
  Loading,
  Modal,
  PageHeading,
  SearchInput,
} from "../components/ui";
import {
  FilterTabs,
  Pagination,
  Table,
  usePagination,
} from "../components/DataTable";
import { EventPicker } from "../components/EventPicker";
import { SubmissionForm } from "../components/SubmissionForm";
export function ProjectLinks({ submission }: { submission: Submission }) {
  return (
    <div className="project-links">
      {[
        { url: submission.repositoryUrl, name: "Repository", icon: GitBranch },
        {
          url: submission.presentationUrl,
          name: "Presentation",
          icon: Presentation,
        },
        { url: submission.demoUrl, name: "Demo", icon: Monitor },
      ]
        .filter((link) => link.url)
        .map(({ url, name, icon: Icon }) => (
          <a
            key={name}
            href={url!}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${name} for ${submission.title} (opens in new tab)`}
          >
            <Icon size={14} aria-hidden="true" />
            {name}
            <ExternalLink size={11} aria-hidden="true" />
          </a>
        ))}
    </div>
  );
}
function SubmissionDetails({
  submission,
  onClose,
  onEdit,
}: {
  submission: Submission;
  onClose: () => void;
  onEdit: () => void;
}) {
  const hub = useHub();
  const navigate = useNavigate();
  const event = hub.hackathons.find((h) => h.id === submission.hackathonId);
  const details = useResource(
    async () => {
      const [tasks, evaluations, criteria] = await Promise.all([
        api.get<Task[]>(`/hackathons/${submission.hackathonId}/tasks`),
        api.get<Evaluation[]>(`/submissions/${submission.id}/evaluations`),
        api.get<Criterion[]>(`/hackathons/${submission.hackathonId}/criteria`),
      ]);
      return {
        tasks: tasks.data,
        evaluations: evaluations.data,
        criteria: criteria.data,
      };
    },
    [submission.id],
    hub.revision,
  );
  const task = details.data?.tasks.find((t) => t.id === submission.taskId);
  const deadline = task?.deadline || event?.submissionDeadline;
  const editable =
    can(hub.role, "submissions.manage") &&
    event?.status === "ACTIVE" &&
    hub.teams.find((t) => t.id === submission.teamId)?.status !== "WITHDRAWN" &&
    submission.evaluationCount === 0 &&
    !!deadline &&
    Date.parse(deadline) > Date.now() &&
    !details.loading &&
    !details.error;
  return (
    <Modal
      title={submission.title}
      description={`${submission.teamName} · ${event?.name || "Hackathon"}`}
      wide
      onClose={onClose}
    >
      <Badge value={submission.status} />
      <p
        className="detail-description"
        style={{ marginTop: 16, whiteSpace: "pre-wrap" }}
      >
        {submission.description}
      </p>
      <ProjectLinks submission={submission} />
      <div className="info-box">
        Submitted: {dateTime(submission.submittedAt)}
        <br />
        Evaluations: {submission.evaluationCount}
        {deadline && (
          <>
            <br />
            Deadline: {dateTime(deadline)}
          </>
        )}
      </div>
      {details.loading ? (
        <Loading />
      ) : details.error ? (
        <ErrorState
          message={details.error}
          retry={() => void details.reload()}
        />
      ) : (
        <section>
          <h3>Evaluations</h3>
          {details.data?.evaluations.length ? (
            details.data.evaluations.map((evaluation) => (
              <article className="judge-review" key={evaluation.id}>
                <div className="judge-review-top">
                  <strong>{evaluation.judgeName}</strong>
                  <time dateTime={evaluation.evaluatedAt}>
                    {dateTime(evaluation.evaluatedAt)}
                  </time>
                </div>
                <p>{evaluation.comment || "No feedback provided."}</p>
                <div className="judge-scores">
                  {details.data!.criteria.map((criterion) => (
                    <span className="tag" key={criterion.id}>
                      {criterion.name}: {evaluation.scores[criterion.id]} /{" "}
                      {criterion.maxScore}
                    </span>
                  ))}
                </div>
              </article>
            ))
          ) : (
            <p className="muted small" style={{ marginTop: 12 }}>
              No evaluations recorded.
            </p>
          )}
        </section>
      )}
      <div className="form-footer">
        {can(hub.role, "evaluations.read") && (
          <Button
            variant="secondary"
            onClick={() => {
              onClose();
              hub.setEventId(submission.hackathonId);
              navigate(`/evaluation?submissionId=${submission.id}`);
            }}
          >
            Open Evaluation
          </Button>
        )}
        {editable && <Button onClick={onEdit}>Edit Submission</Button>}
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}
export default function Submissions() {
  const hub = useHub();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const query = useDeferredValue(search).trim().toLowerCase();
  const [status, setStatus] = useState("ALL");
  const [editing, setEditing] = useState<Submission>();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const manage = can(hub.role, "submissions.manage");
  const teamId = Number(params.get("teamId")) || null;
  const selected = hub.submissions.find(
    (s) => s.id === (selectedId || Number(params.get("submissionId"))),
  );
  const boards = useBoards(
    hub.submissions.map((s) => s.hackathonId),
    hub.revision,
  );
  const filtered = hub.submissions
    .filter(
      (s) =>
        (!hub.eventId || s.hackathonId === hub.eventId) &&
        (!teamId || s.teamId === teamId) &&
        (status === "ALL" || s.status === status) &&
        `${s.title} ${s.teamName} ${s.description}`
          .toLowerCase()
          .includes(query),
    )
    .sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt));
  const pagination = usePagination(
    filtered,
    `${query}-${status}-${teamId}-${hub.eventId}`,
  );
  const closeDetails = () => {
    setSelectedId(null);
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete("submissionId");
        return next;
      },
      { replace: true },
    );
  };
  return (
    <>
      <PageHeading
        title="Submissions"
        description="Project submissions, evaluation status, and scores."
        action={
          manage && (
            <Button onClick={() => setParams({ create: "true" })}>
              <Plus size={15} aria-hidden="true" />
              Submit Project
            </Button>
          )
        }
      />
      <FilterTabs
        label="Submission status"
        value={status}
        onChange={setStatus}
        items={[
          { value: "ALL", label: "All" },
          { value: "SUBMITTED", label: "Pending" },
          { value: "EVALUATED", label: "Evaluated" },
        ]}
      />
      <div className="filters-row">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search projects or teams…"
        />
        <EventPicker
          all
          onChange={() =>
            setParams((previous) => {
              const next = new URLSearchParams(previous);
              next.delete("teamId");
              return next;
            })
          }
        />
        <select
          className="filter-select"
          aria-label="Filter submissions by team"
          value={teamId || ""}
          onChange={(e) => {
            const next = new URLSearchParams(params);
            if (e.target.value) next.set("teamId", e.target.value);
            else next.delete("teamId");
            setParams(next);
          }}
        >
          <option value="">All teams</option>
          {hub.teams
            .filter((t) => !hub.eventId || t.hackathonId === hub.eventId)
            .map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
        </select>
      </div>
      {boards.data && Object.keys(boards.data.errors).length > 0 && (
        <div className="info-box">
          Some scores could not be loaded.{" "}
          <button className="text-link" onClick={() => void boards.reload()}>
            Retry Scores
          </button>
        </div>
      )}
      {hub.loading ? (
        <Loading />
      ) : (
        <>
          <Table label="Submissions">
            <thead>
              <tr>
                <th scope="col">Project</th>
                <th scope="col">Team</th>
                <th scope="col">Hackathon</th>
                <th scope="col">Submitted At</th>
                <th scope="col">Status</th>
                <th scope="col" className="text-right">
                  Score
                </th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagination.rows.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <Empty
                      title="No submissions found"
                      description="No submissions match the selected filters."
                      action={
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setSearch("");
                            setStatus("ALL");
                            hub.setEventId(null);
                            setParams({});
                          }}
                        >
                          Clear Filters
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                pagination.rows.map((submission) => {
                  const rank = boards.data?.boards[
                    submission.hackathonId
                  ]?.rankings.find((row) => row.submissionId === submission.id);
                  return (
                    <tr key={submission.id}>
                      <td>
                        <button
                          className="record-link"
                          onClick={() => setSelectedId(submission.id)}
                        >
                          {submission.title}
                        </button>
                      </td>
                      <td>{submission.teamName}</td>
                      <td>
                        <Link
                          className="record-link"
                          to={`/hackathons/${submission.hackathonId}`}
                        >
                          {hub.hackathons.find(
                            (event) => event.id === submission.hackathonId,
                          )?.name || `Hackathon #${submission.hackathonId}`}
                        </Link>
                      </td>
                      <td className="timestamp">
                        {dateTime(submission.submittedAt)}
                      </td>
                      <td>
                        <Badge value={submission.status} />
                      </td>
                      <td className="text-right mono">
                        {boards.loading
                          ? "Loading…"
                          : boards.data?.errors[submission.hackathonId]
                            ? "Unavailable"
                            : rank?.scored
                              ? score(rank.finalScore)
                              : rank
                                ? "Pending"
                                : "Not ranked"}
                      </td>
                      <td>
                        <Button
                          variant="ghost"
                          onClick={() => setSelectedId(submission.id)}
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
          <Pagination {...pagination} />
        </>
      )}
      {manage && (params.get("create") === "true" || editing) && (
        <SubmissionForm
          submission={editing}
          onClose={() => {
            setEditing(undefined);
            setParams({});
          }}
        />
      )}
      {selected && !editing && (
        <SubmissionDetails
          submission={selected}
          onClose={closeDetails}
          onEdit={() => {
            setEditing(selected);
            closeDetails();
          }}
        />
      )}
    </>
  );
}
