import { useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "../api/client";
import { useHub } from "../hooks/useHub";
import { useResource } from "../hooks/useResource";
import type { Criterion, Task } from "../types";
import { can } from "../utils/permissions";
import { dateTime } from "../utils/format";
import {
  Avatar,
  Badge,
  Button,
  Empty,
  ErrorState,
  FormError,
  Loading,
  Modal,
  PageHeading,
  useMutation,
} from "../components/ui";
import { Table } from "../components/DataTable";
import { HackathonForm } from "../components/HackathonForm";
import { CriteriaEditor } from "../components/CriteriaEditor";
import { TaskForm } from "../components/TaskForm";
export default function HackathonDetail() {
  const hub = useHub();
  const { id } = useParams();
  const eventId = Number(id);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [dialog, setDialog] = useState<
    "edit" | "criteria" | "task" | "delete" | null
  >(null);
  const event = hub.hackathons.find((item) => item.id === eventId);
  const manage =
    can(hub.role, "hackathons.manage") &&
    !!event &&
    !["COMPLETED", "CANCELLED"].includes(event.status);
  const tabs = [
    { key: "tasks", label: "Tasks" },
    { key: "criteria", label: "Evaluation Criteria" },
    ...(can(hub.role, "teams.read") ? [{ key: "teams", label: "Teams" }] : []),
  ];
  const tab =
    tabs.find((item) => item.key === params.get("tab"))?.key || "tasks";
  const resource = useResource(
    async () => {
      const [tasks, criteria] = await Promise.all([
        api.get<Task[]>(`/hackathons/${eventId}/tasks`),
        api.get<Criterion[]>(`/hackathons/${eventId}/criteria`),
      ]);
      return { tasks: tasks.data, criteria: criteria.data };
    },
    [eventId],
    hub.revision,
  );
  const deletion = useMutation(async () => {
    hub.setEventId(null);
    await hub.refresh();
    hub.toast("Hackathon deleted.");
    navigate("/hackathons");
  });
  if (hub.loading) return <Loading />;
  if (!event)
    return (
      <Empty
        title="Hackathon not found"
        description="The requested hackathon is unavailable."
        action={
          <Link className="btn btn-secondary" to="/hackathons">
            Back to Hackathons
          </Link>
        }
      />
    );
  const teams = hub.teams.filter((team) => team.hackathonId === eventId);
  const locked = hub.submissions.some(
    (submission) =>
      submission.hackathonId === eventId && submission.evaluationCount > 0,
  );
  return (
    <>
      <Link className="back-link" to="/hackathons">
        <ArrowLeft size={14} aria-hidden="true" />
        Hackathons
      </Link>
      <PageHeading
        title={event.name}
        description={event.description}
        action={
          <div className="heading-actions">
            {manage && (
              <Button variant="secondary" onClick={() => setDialog("edit")}>
                <Pencil size={14} aria-hidden="true" />
                Edit
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => {
                hub.setEventId(eventId);
                navigate("/leaderboard");
              }}
            >
              Leaderboard
            </Button>
            {manage && teams.length === 0 && (
              <button
                className="icon-btn danger"
                aria-label="Delete hackathon"
                title="Delete hackathon"
                onClick={() => setDialog("delete")}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        }
      />
      <div className="detail-banner">
        <div className="detail-dates">
          <div>
            <small>Start Date</small>
            <strong>{dateTime(event.startDate)}</strong>
          </div>
          <div>
            <small>Submission Deadline</small>
            <strong>{dateTime(event.submissionDeadline)}</strong>
          </div>
          <div>
            <small>End Date</small>
            <strong>{dateTime(event.endDate)}</strong>
          </div>
        </div>
        <Badge value={event.status} />
      </div>
      <div className="tabs" role="tablist" aria-label="Hackathon details">
        {tabs.map((item) => (
          <button
            key={item.key}
            id={`tab-${item.key}`}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            tabIndex={tab === item.key ? 0 : -1}
            aria-controls="event-panel"
            onClick={() => setParams({ tab: item.key })}
            onKeyDown={(key) => {
              if (key.key === "ArrowRight" || key.key === "ArrowLeft") {
                key.preventDefault();
                const position = tabs.findIndex((t) => t.key === tab);
                const next =
                  tabs[
                    (position +
                      (key.key === "ArrowRight" ? 1 : tabs.length - 1)) %
                      tabs.length
                  ].key;
                setParams({ tab: next });
                requestAnimationFrame(() =>
                  document.getElementById(`tab-${next}`)?.focus(),
                );
              }
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      {resource.error ? (
        <ErrorState
          message={resource.error}
          retry={() => void resource.reload()}
        />
      ) : resource.loading ? (
        <Loading />
      ) : (
        <div
          id="event-panel"
          role="tabpanel"
          aria-labelledby={`tab-${tab}`}
          tabIndex={0}
        >
          {tab === "tasks" && (
            <section className="panel">
              <div className="panel-heading">
                <h2>Tasks</h2>
                {manage && (
                  <Button variant="secondary" onClick={() => setDialog("task")}>
                    <Plus size={14} aria-hidden="true" />
                    Create Task
                  </Button>
                )}
              </div>
              <Table label="Hackathon tasks">
                <thead>
                  <tr>
                    <th scope="col">Task</th>
                    <th scope="col">Type</th>
                    <th scope="col">Deadline</th>
                    <th scope="col">Requirements</th>
                  </tr>
                </thead>
                <tbody>
                  {resource.data?.tasks.length ? (
                    resource.data.tasks.map((task) => (
                      <tr key={task.id}>
                        <td>
                          <strong>{task.title}</strong>
                          <small className="cell-secondary">
                            {task.description}
                          </small>
                        </td>
                        <td>
                          <Badge value={task.taskType} />
                        </td>
                        <td className="timestamp">{dateTime(task.deadline)}</td>
                        <td>
                          {task.durationMinutes
                            ? `${task.durationMinutes} minutes`
                            : task.questionCount
                              ? `${task.questionCount} questions`
                              : "Working implementation"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4}>
                        <Empty
                          title="No tasks"
                          description="Create a coding, pitch, or quiz task."
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </section>
          )}
          {tab === "criteria" && (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Evaluation Criteria</h2>
                  <p>
                    {locked
                      ? "Criteria are locked because evaluations have been recorded."
                      : "Weights must total 100%."}
                  </p>
                </div>
                {manage && !locked && (
                  <Button
                    variant="secondary"
                    onClick={() => setDialog("criteria")}
                  >
                    Edit Criteria
                  </Button>
                )}
              </div>
              <Table label="Evaluation criteria">
                <thead>
                  <tr>
                    <th scope="col">Criterion</th>
                    <th scope="col">Description</th>
                    <th scope="col" className="text-right">
                      Weight
                    </th>
                    <th scope="col" className="text-right">
                      Maximum Score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {resource.data?.criteria.map((criterion) => (
                    <tr key={criterion.id}>
                      <td>{criterion.name}</td>
                      <td>{criterion.description || "—"}</td>
                      <td className="text-right mono">
                        {Number((criterion.weight * 100).toFixed(2))}%
                      </td>
                      <td className="text-right mono">{criterion.maxScore}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </section>
          )}
          {tab === "teams" && can(hub.role, "teams.read") && (
            <section className="panel">
              <div className="panel-heading">
                <h2>Teams</h2>
                <Button
                  variant="secondary"
                  onClick={() => {
                    hub.setEventId(eventId);
                    navigate("/teams");
                  }}
                >
                  Open Teams
                </Button>
              </div>
              <Table label="Hackathon teams">
                <thead>
                  <tr>
                    <th scope="col">Team</th>
                    <th scope="col" className="text-right">
                      Members
                    </th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.length ? (
                    teams.map((team) => (
                      <tr key={team.id}>
                        <td>
                          <div className="table-title">
                            <Avatar name={team.name} />
                            {team.name}
                          </div>
                        </td>
                        <td className="text-right mono">
                          {team.participants.length}
                        </td>
                        <td>
                          <Badge value={team.status} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3}>
                        <Empty
                          title="No teams"
                          description="Teams registered for this hackathon appear here."
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </section>
          )}
        </div>
      )}
      {dialog === "edit" && manage && (
        <HackathonForm event={event} onClose={() => setDialog(null)} />
      )}
      {dialog === "task" && manage && (
        <TaskForm
          event={event}
          onSaved={resource.reload}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "criteria" && manage && resource.data && (
        <CriteriaEditor
          eventId={eventId}
          criteria={resource.data.criteria}
          onSaved={resource.reload}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "delete" && manage && (
        <Modal title="Delete Hackathon" onClose={() => setDialog(null)}>
          <p className="confirmation-text">
            Delete “{event.name}” and its tasks and criteria? This action cannot
            be undone.
          </p>
          <FormError error={deletion.error} />
          <div className="form-footer">
            <Button variant="secondary" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              busy={deletion.busy}
              onClick={() =>
                void deletion.run(() => api.delete(`/hackathons/${eventId}`))
              }
            >
              Delete Hackathon
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
