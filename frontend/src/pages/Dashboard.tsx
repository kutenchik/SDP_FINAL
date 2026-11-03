import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useHub } from "../hooks/useHub";
import { can } from "../utils/permissions";
import { date, dateTime } from "../utils/format";
import { Badge, Button, Empty, Loading, PageHeading } from "../components/ui";
import { Table } from "../components/DataTable";
import { ActivityTable } from "../components/ActivityTable";
export default function Dashboard() {
  const hub = useHub();
  const navigate = useNavigate();
  if (hub.loading) return <Loading />;
  const active = hub.hackathons.filter(
    (h) => h.status === "ACTIVE" || h.status === "JUDGING",
  );
  const reviewed = hub.submissions.filter((s) => s.evaluationCount > 0).length;
  const deadlines = hub.hackathons
    .filter(
      (h) =>
        !["CANCELLED", "COMPLETED"].includes(h.status) &&
        new Date(h.submissionDeadline).getTime() > Date.now(),
    )
    .sort(
      (a, b) =>
        Date.parse(a.submissionDeadline) - Date.parse(b.submissionDeadline),
    );
  const stats = [
    {
      label: "Active Hackathons",
      value: active.length,
      detail: "Active or judging",
    },
    {
      label: "Teams",
      value: hub.teams.length,
      detail: `${hub.teams.reduce((sum, team) => sum + team.participants.length, 0)} participants`,
    },
    {
      label: "Submissions",
      value: hub.submissions.length,
      detail: `${reviewed} evaluated`,
    },
    {
      label: "Pending Evaluations",
      value: hub.submissions.length - reviewed,
      detail: "Submissions without evaluations",
    },
  ];
  return (
    <>
      <PageHeading
        title="Dashboard"
        description="Hackathons, submissions, and recent activity."
        action={
          can(hub.role, "hackathons.manage") ? (
            <Button onClick={() => navigate("/hackathons?create=true")}>
              <Plus size={15} aria-hidden="true" />
              Create Hackathon
            </Button>
          ) : can(hub.role, "evaluations.submit") ? (
            <Button onClick={() => navigate("/evaluation")}>
              Evaluate Submissions
            </Button>
          ) : (
            <Button onClick={() => navigate("/submissions?create=true")}>
              Submit Project
            </Button>
          )
        }
      />
      <div className="stats-grid">
        {stats.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <span className="stat-top">{stat.label}</span>
            <strong>{stat.value}</strong>
            <p>{stat.detail}</p>
          </div>
        ))}
      </div>
      <section className="panel dashboard-section">
        <div className="panel-heading">
          <h2>Active Hackathons</h2>
          <Link className="text-link" to="/hackathons">
            View All
          </Link>
        </div>
        <Table label="Active hackathons">
          <thead>
            <tr>
              <th scope="col">Hackathon</th>
              <th scope="col">Status</th>
              <th scope="col">Start Date</th>
              <th scope="col">Submission Deadline</th>
              <th scope="col" className="text-right">
                Teams
              </th>
              <th scope="col" className="text-right">
                Submissions
              </th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {active.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <Empty
                    title="No active hackathons"
                    description="Active and judging hackathons appear here."
                  />
                </td>
              </tr>
            ) : (
              active.map((event) => (
                <tr key={event.id}>
                  <td>
                    <Link
                      className="record-link"
                      to={`/hackathons/${event.id}`}
                    >
                      {event.name}
                    </Link>
                  </td>
                  <td>
                    <Badge value={event.status} />
                  </td>
                  <td className="nowrap">{date(event.startDate)}</td>
                  <td className="timestamp">
                    {dateTime(event.submissionDeadline)}
                  </td>
                  <td className="text-right mono">
                    {hub.teams.filter((t) => t.hackathonId === event.id).length}
                  </td>
                  <td className="text-right mono">
                    {
                      hub.submissions.filter((s) => s.hackathonId === event.id)
                        .length
                    }
                  </td>
                  <td>
                    <Link className="text-link" to={`/hackathons/${event.id}`}>
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </section>
      <div className="dashboard-bottom-grid">
        <section className="panel activity-panel">
          <div className="panel-heading">
            <h2>Recent Activity</h2>
            <span className="result-count">
              Latest {Math.min(5, hub.activity.length)} events
            </span>
          </div>
          <ActivityTable activities={hub.activity.slice(0, 5)} />
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>Upcoming Deadlines</h2>
          </div>
          {deadlines.length === 0 ? (
            <Empty
              title="No upcoming deadlines"
              description="Future submission deadlines appear here."
            />
          ) : (
            <ul className="deadline-list">
              {deadlines.slice(0, 5).map((event) => (
                <li key={event.id}>
                  <Link className="record-link" to={`/hackathons/${event.id}`}>
                    {event.name}
                  </Link>
                  <time dateTime={event.submissionDeadline}>
                    {dateTime(event.submissionDeadline)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <p className="workspace-status">
        {hub.error
          ? "Updates paused. Retry the connection above."
          : "Activity updates every 15 seconds."}
      </p>
    </>
  );
}
