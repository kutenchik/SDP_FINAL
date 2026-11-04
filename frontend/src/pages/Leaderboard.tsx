import { Fragment, useDeferredValue, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Download,
  FileJson,
  RefreshCw,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api, downloadReport, failure } from "../api/client";
import { useHub } from "../hooks/useHub";
import { useResource } from "../hooks/useResource";
import type { Leaderboard as Board, Strategy } from "../types";
import { can } from "../utils/permissions";
import { score } from "../utils/format";
import {
  Avatar,
  Button,
  Empty,
  ErrorState,
  FormError,
  Loading,
  PageHeading,
  SearchInput,
  useMutation,
} from "../components/ui";
import {
  FilterTabs,
  Pagination,
  Table,
  usePagination,
} from "../components/DataTable";
import { EventPicker, useSelectedEvent } from "../components/EventPicker";
export default function Leaderboard() {
  const hub = useHub();
  const event = useSelectedEvent();
  const [search, setSearch] = useState("");
  const query = useDeferredValue(search).trim().toLowerCase();
  const [tab, setTab] = useState("all");
  const [order, setOrder] = useState("rank");
  const [expanded, setExpanded] = useState<number[]>([]);
  const [exporting, setExporting] = useState<"json" | "pdf" | null>(null);
  const [exportError, setExportError] = useState("");
  const resource = useResource(
    async () =>
      event
        ? (await api.get<Board>(`/hackathons/${event.id}/leaderboard`)).data
        : null,
    [event?.id],
    hub.revision,
  );
  const strategyMutation = useMutation(async () => {
    await hub.refresh();
    await resource.reload();
    hub.toast("Scoring strategy updated.");
  });
  const rows = (resource.data?.rankings || [])
    .filter(
      (row) =>
        (tab === "all" || (tab === "evaluated" ? row.scored : !row.scored)) &&
        `${row.teamName} ${row.title}`.toLowerCase().includes(query),
    )
    .sort((a, b) =>
      order === "team-asc"
        ? a.teamName.localeCompare(b.teamName)
        : order === "team-desc"
          ? b.teamName.localeCompare(a.teamName)
          : Number(b.scored) - Number(a.scored) ||
            (order === "score-asc"
              ? a.finalScore - b.finalScore
              : order === "score-desc"
                ? b.finalScore - a.finalScore
                : a.rank - b.rank),
    );
  const pagination = usePagination(
    rows,
    `${event?.id}-${query}-${tab}-${order}`,
  );
  const evaluated = (resource.data?.rankings || []).filter((row) => row.scored);
  const chart = rows
    .filter((row) => row.scored)
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 8)
    .map((row) => ({ name: row.teamName, score: row.finalScore }));
  async function download(format: "json" | "pdf") {
    if (!event) return;
    setExportError("");
    setExporting(format);
    try {
      await downloadReport(event.id, format);
      hub.toast(`${format.toUpperCase()} report downloaded.`);
    } catch (error) {
      setExportError(failure(error).message);
    } finally {
      setExporting(null);
    }
  }
  const ascending = order === "score-asc";
  const editable =
    can(hub.role, "scoring.manage") &&
    event &&
    !["COMPLETED", "CANCELLED"].includes(event.status);
  return (
    <>
      <PageHeading
        title="Leaderboard"
        description="Submission rankings and final scores."
        action={
          <div className="export-buttons">
            <Button
              variant="secondary"
              disabled={!event || !!exporting}
              busy={exporting === "json"}
              onClick={() => void download("json")}
            >
              <FileJson size={15} aria-hidden="true" />
              Export JSON
            </Button>
            <Button
              disabled={!event || !!exporting}
              busy={exporting === "pdf"}
              onClick={() => void download("pdf")}
            >
              <Download size={15} aria-hidden="true" />
              Export PDF
            </Button>
          </div>
        }
      />
      <FilterTabs
        label="Leaderboard status"
        value={tab}
        onChange={setTab}
        items={[
          { value: "all", label: "All Projects" },
          { value: "evaluated", label: "Evaluated" },
          { value: "pending", label: "Pending" },
        ]}
      />
      <div className="filters-row">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search teams or projects…"
        />
        <EventPicker />
        <select
          className="filter-select"
          aria-label="Sort leaderboard"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
        >
          <option value="rank">Rank</option>
          <option value="score-desc">Score: Highest First</option>
          <option value="score-asc">Score: Lowest First</option>
          <option value="team-asc">Team: A–Z</option>
          <option value="team-desc">Team: Z–A</option>
        </select>
      </div>
      {exportError && (
        <div className="form-error" role="alert">
          {exportError}
        </div>
      )}
      <FormError error={strategyMutation.error} />
      {hub.loading ? (
        <Loading />
      ) : !event ? (
        <Empty
          title="No hackathons"
          description="Create a hackathon to view its leaderboard."
        />
      ) : resource.error ? (
        <ErrorState
          message={resource.error}
          retry={() => void resource.reload()}
        />
      ) : resource.loading || !resource.data ? (
        <Loading />
      ) : (
        <>
          <div className="board-toolbar">
            {can(hub.role, "scoring.manage") ? (
              <label className="role-control">
                <span>Scoring Strategy</span>
                <select
                  aria-label="Scoring strategy"
                  value={event.scoringStrategy}
                  disabled={!editable || strategyMutation.busy}
                  onChange={(e) =>
                    void strategyMutation.run(() =>
                      api.put(`/hackathons/${event.id}/strategy`, {
                        strategy: e.target.value as Strategy,
                      }),
                    )
                  }
                >
                  <option value="STANDARD">Standard</option>
                  <option value="OLYMPIC">Olympic</option>
                  <option value="WEIGHTED">Weighted</option>
                </select>
              </label>
            ) : (
              <span className="board-summary">
                Scoring strategy:{" "}
                {event.scoringStrategy.charAt(0) +
                  event.scoringStrategy.slice(1).toLowerCase()}
              </span>
            )}
            <Button variant="ghost" onClick={() => void resource.reload()}>
              <RefreshCw size={14} aria-hidden="true" />
              Refresh
            </Button>
          </div>
          <Table label="Leaderboard" className="leaderboard-table">
            <thead>
              <tr>
                <th
                  scope="col"
                  aria-sort={order === "rank" ? "ascending" : "none"}
                >
                  <button
                    className="sort-button"
                    onClick={() => setOrder("rank")}
                  >
                    #
                  </button>
                </th>
                <th
                  scope="col"
                  aria-sort={
                    order === "team-asc"
                      ? "ascending"
                      : order === "team-desc"
                        ? "descending"
                        : "none"
                  }
                >
                  <button
                    className="sort-button"
                    onClick={() =>
                      setOrder((value) =>
                        value === "team-asc" ? "team-desc" : "team-asc",
                      )
                    }
                  >
                    Team / Project
                    {order.startsWith("team-") &&
                      (order === "team-asc" ? (
                        <ArrowUp size={12} aria-hidden="true" />
                      ) : (
                        <ArrowDown size={12} aria-hidden="true" />
                      ))}
                  </button>
                </th>
                <th scope="col">Hackathon</th>
                <th scope="col" className="text-right">
                  Judges
                </th>
                <th
                  scope="col"
                  className="text-right"
                  aria-sort={
                    order === "score-asc"
                      ? "ascending"
                      : order === "score-desc" || order === "rank"
                        ? "descending"
                        : "none"
                  }
                >
                  <button
                    className="sort-button"
                    onClick={() =>
                      setOrder(ascending ? "score-desc" : "score-asc")
                    }
                  >
                    Final Score
                    {ascending ? (
                      <ArrowUp size={12} aria-hidden="true" />
                    ) : (
                      <ArrowDown size={12} aria-hidden="true" />
                    )}
                  </button>
                </th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagination.rows.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <Empty
                      title="No results"
                      description="No submissions match the selected filters."
                      action={
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setSearch("");
                            setTab("all");
                          }}
                        >
                          Clear Filters
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                pagination.rows.map((row) => (
                  <Fragment key={row.submissionId}>
                    <tr>
                      <td className="rank">{row.scored ? row.rank : "—"}</td>
                      <td>
                        <div className="table-title">
                          <Avatar name={row.teamName} />
                          <div>
                            <strong>{row.teamName}</strong>
                            <small>{row.title}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Link
                          className="record-link"
                          to={`/hackathons/${event.id}`}
                        >
                          {event.name}
                        </Link>
                      </td>
                      <td className="text-right mono">{row.judgeCount}</td>
                      <td className="text-right">
                        <span className="score-total">
                          {row.scored ? score(row.finalScore) : "Pending"}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <Link
                            className="text-link"
                            to={`/submissions?submissionId=${row.submissionId}`}
                          >
                            View
                          </Link>
                          {row.scored && (
                            <button
                              className="icon-btn"
                              aria-label={`Score breakdown for ${row.title}`}
                              title="Score breakdown"
                              aria-controls={`breakdown-${row.submissionId}`}
                              aria-expanded={expanded.includes(
                                row.submissionId,
                              )}
                              onClick={() =>
                                setExpanded((value) =>
                                  value.includes(row.submissionId)
                                    ? value.filter(
                                        (id) => id !== row.submissionId,
                                      )
                                    : [...value, row.submissionId],
                                )
                              }
                            >
                              {expanded.includes(row.submissionId) ? (
                                <ChevronUp size={15} aria-hidden="true" />
                              ) : (
                                <ChevronDown size={15} aria-hidden="true" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expanded.includes(row.submissionId) && (
                      <tr
                        className="table-detail-row"
                        id={`breakdown-${row.submissionId}`}
                      >
                        <td colSpan={6}>
                          <div className="breakdown-list">
                            <span>Base: {score(row.baseScore)}</span>
                            {row.adjustments.map((adjustment, index) => (
                              <span key={index}>
                                {adjustment.label}:{" "}
                                {adjustment.amount > 0 ? "+" : ""}
                                {score(adjustment.amount)}
                              </span>
                            ))}
                            <span>Final: {score(row.finalScore)}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </Table>
          <Pagination {...pagination} />
          <p className="leaderboard-note">
            {evaluated.length} of {resource.data.rankings.length} submissions
            evaluated. Scores are out of 100. Tied scores share a rank. Pending
            submissions and withdrawn teams are not ranked.
          </p>
          <details className="chart-section">
            <summary>Score Distribution</summary>
            {chart.length ? (
              <>
                <div
                  className="chart-container"
                  role="img"
                  aria-label={`Final scores: ${chart.map((item) => `${item.name}: ${item.score} out of 100`).join("; ")}. Values are also available in the leaderboard table.`}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chart}
                      layout="vertical"
                      margin={{ top: 0, left: 0, right: 42, bottom: 0 }}
                      accessibilityLayer
                    >
                      <CartesianGrid
                        horizontal={false}
                        stroke="var(--chart-grid)"
                        strokeDasharray="3 4"
                      />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        ticks={[0, 25, 50, 75, 100]}
                        tick={{ fontSize: 12, fill: "var(--chart-text)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={115}
                        tick={{ fontSize: 12, fill: "var(--chart-text)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "var(--subtle)" }}
                        contentStyle={{
                          background: "var(--surface)",
                          color: "var(--foreground)",
                          border: "1px solid var(--border)",
                          fontSize: 12,
                        }}
                      />
                      <Bar
                        dataKey="score"
                        fill="var(--chart-bar)"
                        radius={[0, 2, 2, 0]}
                        barSize={18}
                        isAnimationActive={false}
                      >
                        <LabelList
                          dataKey="score"
                          position="right"
                          style={{ fontSize: 12, fill: "var(--foreground)" }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="chart-note">
                  Up to eight scored submissions matching the current filters.
                </p>
              </>
            ) : (
              <Empty
                title="No scored submissions"
                description="Select evaluated submissions to view the chart."
              />
            )}
          </details>
        </>
      )}
    </>
  );
}
