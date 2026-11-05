import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useState } from "react";
import { api } from "../api/client";
import { HubProvider } from "../hooks/useHub";
import { Layout } from "../components/Layout";
import { RequirePermission } from "../components/RequirePermission";
import { Pagination, usePagination } from "../components/DataTable";
import { activityDetails } from "../utils/activity";
import Submissions from "../pages/Submissions";
import Dashboard from "../pages/Dashboard";
import HackathonDetail from "../pages/HackathonDetail";
import type { Activity, Hackathon, Role, Submission } from "../types";
vi.mock("../api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/client")>()),
  api: { get: vi.fn(), put: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));
beforeEach(() => {
  vi.mocked(api.get).mockResolvedValue({ data: [] });
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});
function workspace(role: Role, path = "/") {
  localStorage.setItem("hub-role", role);
  return render(
    <MemoryRouter initialEntries={[path]}>
      <HubProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<h1>Dashboard content</h1>} />
            <Route
              path="evaluation"
              element={
                <RequirePermission permission="evaluations.read">
                  <h1>Evaluation content</h1>
                </RequirePermission>
              }
            />
            <Route
              path="teams"
              element={
                <RequirePermission permission="teams.read">
                  <h1>Teams content</h1>
                </RequirePermission>
              }
            />
          </Route>
        </Routes>
      </HubProvider>
    </MemoryRouter>,
  );
}
describe("Role-restricted navigation and direct routes", () => {
  it.each([
    ["Organizer", true, true],
    ["Participant", true, false],
    ["Judge", false, true],
  ] as const)("shows authorized sections for %s", (role, teams, evaluation) => {
    workspace(role);
    const nav = within(
      screen.getByRole("navigation", { name: "Main navigation" }),
    );
    expect(!!nav.queryByRole("link", { name: "Teams" })).toBe(teams);
    expect(!!nav.queryByRole("link", { name: "Evaluation" })).toBe(evaluation);
    expect(nav.getByRole("link", { name: "Leaderboard" })).toBeInTheDocument();
  });
  it.each([
    ["Participant", "/evaluation"],
    ["Judge", "/teams"],
  ] as const)("redirects %s from %s", async (role, path) => {
    workspace(role, path);
    expect(
      await screen.findByRole("heading", { name: "Dashboard content" }),
    ).toBeInTheDocument();
  });
  it("updates navigation after role switching and persists theme and collapse preferences", async () => {
    const user = userEvent.setup();
    workspace("Organizer");
    await user.selectOptions(screen.getByLabelText("Switch role"), "Judge");
    expect(
      screen.queryByRole("link", { name: "Teams" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Use dark theme" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("hub-theme")).toBe("dark");
    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(localStorage.getItem("hub-sidebar-collapsed")).toBe("true");
    await user.click(screen.getByRole("button", { name: "Expand sidebar" }));
    expect(localStorage.getItem("hub-sidebar-collapsed")).toBe("false");
  });
});
describe("Recorded activity without invented actors", () => {
  const event = { id: 1, name: "API event" } as Hackathon;
  const submission = {
    id: 9,
    hackathonId: 1,
    title: "Access Portal",
  } as Submission;
  const activity = {
    id: 1,
    hackathonId: 1,
    createdAt: "2026-11-08T10:00:00Z",
    read: false,
  } as Activity;
  it("extracts the actual judge and links the stored project", () => {
    expect(
      activityDetails(
        {
          ...activity,
          eventType: "EvaluationSubmitted",
          message: "Alex evaluated Access Portal.",
        },
        [event],
        [submission],
      ),
    ).toMatchObject({
      actor: "Alex",
      action: "Submitted evaluation",
      subject: "Access Portal",
      href: "/submissions?submissionId=9",
    });
  });
  it("retains historical project titles and never invents a missing actor", () => {
    expect(
      activityDetails(
        {
          ...activity,
          eventType: "SubmissionCreated",
          message: "Team One submitted Original title.",
        },
        [event],
        [submission],
      ),
    ).toMatchObject({
      actor: "Team One",
      subject: "Original title",
      href: "/hackathons/1",
    });
    expect(
      activityDetails(
        {
          ...activity,
          eventType: "TeamStatusChanged",
          message: "Team One is now finalist.",
        },
        [event],
        [submission],
      ).actor,
    ).toBe("Not recorded");
  });
  it("does not confuse an action word in the actor name with the project delimiter", () => {
    expect(
      activityDetails(
        {
          ...activity,
          eventType: "EvaluationSubmitted",
          message: "Previously evaluated judge evaluated Access Portal.",
        },
        [event],
        [submission],
      ).actor,
    ).toBe("Previously evaluated judge");
  });
});
it("opens the selected submission in Evaluation without modal cleanup overriding navigation", async () => {
  const user = userEvent.setup();
  const submission = {
    id: 9,
    hackathonId: 1,
    teamId: 4,
    teamName: "API team",
    title: "API project",
    description: "Stored description",
    submittedAt: "2026-11-08T10:00:00Z",
    status: "SUBMITTED",
    evaluationCount: 0,
  };
  vi.mocked(api.get).mockImplementation(async (url) => ({
    data:
      url === "/hackathons"
        ? [{ id: 1, name: "API event", status: "ACTIVE" }]
        : url === "/submissions"
          ? [submission]
          : String(url).endsWith("/leaderboard")
            ? { hackathonId: 1, strategy: "STANDARD", rankings: [] }
            : [],
  }));
  render(
    <MemoryRouter initialEntries={["/submissions?submissionId=9"]}>
      <HubProvider>
        <Routes>
          <Route path="submissions" element={<Submissions />} />
          <Route path="evaluation" element={<h1>Evaluation destination</h1>} />
        </Routes>
      </HubProvider>
    </MemoryRouter>,
  );
  await user.click(
    await screen.findByRole("button", { name: "Open Evaluation" }),
  );
  expect(
    await screen.findByRole("heading", { name: "Evaluation destination" }),
  ).toBeInTheDocument();
});
it("paginates actual rows and resets when a filter or page size changes", async () => {
  const user = userEvent.setup();
  function List() {
    const [query, setQuery] = useState("");
    const rows = Array.from(
      { length: 31 },
      (_, index) => `Record ${index + 1}`,
    ).filter((row) => row.includes(query));
    const pagination = usePagination(rows, query);
    return (
      <>
        <label>
          Search records
          <input value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <ul>
          {pagination.rows.map((row) => (
            <li key={row}>{row}</li>
          ))}
        </ul>
        <Pagination {...pagination} />
      </>
    );
  }
  render(<List />);
  await user.click(screen.getByRole("button", { name: "Next page" }));
  expect(screen.getByText("Record 11")).toBeInTheDocument();
  expect(screen.queryByText("Record 1")).not.toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText("Rows per page"), "25");
  await waitFor(() => expect(screen.getByText("Record 1")).toBeInTheDocument());
  expect(screen.getAllByRole("listitem")).toHaveLength(25);
  await user.type(screen.getByLabelText("Search records"), "31");
  expect(screen.getAllByRole("listitem")).toHaveLength(1);
  expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  expect(screen.getByRole("status")).toHaveTextContent("1–1 of 1");
});
it("shows backend scores, keeps pending distinct, and filters the returned submissions", async () => {
  const user = userEvent.setup();
  const submitted = "2026-11-08T10:00:00Z";
  vi.mocked(api.get).mockImplementation(async (url) => ({
    data:
      url === "/hackathons"
        ? [{ id: 1, name: "Stored event", status: "ACTIVE" }]
        : url === "/submissions"
          ? [
              {
                id: 1,
                title: "Recorded scored project",
                teamName: "Recorded team",
                hackathonId: 1,
                status: "EVALUATED",
                submittedAt: submitted,
                evaluationCount: 1,
              },
              {
                id: 2,
                title: "Recorded pending project",
                teamName: "Pending team",
                hackathonId: 1,
                status: "SUBMITTED",
                submittedAt: submitted,
                evaluationCount: 0,
              },
            ]
          : String(url).endsWith("/leaderboard")
            ? {
                rankings: [
                  { submissionId: 1, scored: true, finalScore: 42.37 },
                  { submissionId: 2, scored: false, finalScore: 0 },
                ],
              }
            : [],
  }));
  render(
    <MemoryRouter>
      <HubProvider>
        <Submissions />
      </HubProvider>
    </MemoryRouter>,
  );
  expect(await screen.findByText("42.37")).toBeInTheDocument();
  const table = within(screen.getByRole("table", { name: "Submissions" }));
  expect(table.getByText("Pending")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Pending" }));
  expect(table.queryByText("Recorded scored project")).not.toBeInTheDocument();
  expect(table.getByText("Recorded pending project")).toBeInTheDocument();
  expect(table.getAllByRole("row")).toHaveLength(2);
});
it("shows connection failure without presenting zero statistics as loaded data", async () => {
  const user = userEvent.setup();
  vi.mocked(api.get).mockRejectedValue(new Error("Backend unavailable"));
  render(
    <MemoryRouter>
      <HubProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
          </Route>
        </Routes>
      </HubProvider>
    </MemoryRouter>,
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Backend unavailable",
  );
  expect(screen.queryByText("Pending Evaluations")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
  let finishRetry: (result: { data: never[] }) => void = () => {};
  const retry = new Promise<{ data: never[] }>((resolve) => {
    finishRetry = resolve;
  });
  vi.mocked(api.get).mockReturnValue(retry);
  await user.click(screen.getByRole("button", { name: "Try again" }));
  expect(
    screen.getByRole("status", { name: "Loading workspace" }),
  ).toBeInTheDocument();
  expect(screen.queryByText("Pending Evaluations")).not.toBeInTheDocument();
  finishRetry({ data: [] });
  expect(await screen.findByText("Pending Evaluations")).toBeInTheDocument();
});
function detailWorkspace(role: Role) {
  localStorage.setItem("hub-role", role);
  const now = Date.now();
  const event = {
    id: 1,
    name: "Stored event",
    description: "Stored requirements",
    status: "ACTIVE",
    scoringStrategy: "STANDARD",
    startDate: new Date(now - 86400000).toISOString(),
    endDate: new Date(now + 3 * 86400000).toISOString(),
    submissionDeadline: new Date(now + 2 * 86400000).toISOString(),
  };
  vi.mocked(api.get).mockImplementation(async (url) => ({
    data: url === "/hackathons" ? [event] : [],
  }));
  return render(
    <MemoryRouter initialEntries={["/hackathons/1"]}>
      <HubProvider>
        <Routes>
          <Route path="hackathons/:id" element={<HackathonDetail />} />
        </Routes>
      </HubProvider>
    </MemoryRouter>,
  );
}
it("opens organizer management dialogs and cancels deletion without writing", async () => {
  const user = userEvent.setup();
  detailWorkspace("Organizer");
  await user.click(await screen.findByRole("button", { name: "Edit" }));
  expect(
    screen.getByRole("dialog", { name: "Edit Hackathon" }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  await user.click(await screen.findByRole("button", { name: "Create Task" }));
  expect(
    screen.getByRole("dialog", { name: "Create Task" }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  await user.click(screen.getByRole("tab", { name: "Evaluation Criteria" }));
  await user.click(screen.getByRole("button", { name: "Edit Criteria" }));
  expect(
    screen.getByRole("dialog", { name: "Evaluation Criteria" }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  await user.click(screen.getByRole("button", { name: "Delete hackathon" }));
  expect(
    screen.getByRole("dialog", { name: "Delete Hackathon" }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(api.delete).not.toHaveBeenCalled();
  expect(api.post).not.toHaveBeenCalled();
  expect(api.put).not.toHaveBeenCalled();
});
it.each(["Participant", "Judge"] as const)(
  "hides hackathon management actions from %s",
  async (role) => {
    const user = userEvent.setup();
    detailWorkspace(role);
    await screen.findByRole("heading", { name: "Stored event" });
    expect(
      screen.queryByRole("button", { name: "Edit" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Create Task" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete hackathon" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Evaluation Criteria" }));
    expect(
      screen.queryByRole("button", { name: "Edit Criteria" }),
    ).not.toBeInTheDocument();
    expect(!!screen.queryByRole("tab", { name: "Teams" })).toBe(
      role === "Participant",
    );
  },
);
