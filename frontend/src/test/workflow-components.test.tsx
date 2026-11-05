import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HubProvider } from "../hooks/useHub";
import { useState } from "react";
import { useResource } from "../hooks/useResource";
import { FormError, Input } from "../components/ui";
import { SubmissionForm } from "../components/SubmissionForm";
import { TeamForm } from "../components/TeamForm";
import { CriteriaEditor } from "../components/CriteriaEditor";
import { ModifierPanel } from "../components/ScoringControls";
import { api } from "../api/client";
import type { Criterion, Hackathon, Submission } from "../types";
vi.mock("../api/client", async (importOriginal) => {
  const original = await importOriginal<typeof import("../api/client")>();
  return {
    ...original,
    api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  };
});
const now = Date.now();
const event: Hackathon = {
  id: 1,
  name: "Test sprint",
  description: "A meaningful challenge",
  startDate: new Date(now - 86400000).toISOString(),
  endDate: new Date(now + 3 * 86400000).toISOString(),
  submissionDeadline: new Date(now + 2 * 86400000).toISOString(),
  status: "ACTIVE",
  scoringStrategy: "STANDARD",
  createdAt: new Date(now).toISOString(),
};
const team = {
  id: 10,
  name: "Test team",
  description: "Building together",
  technologyStack: "React",
  hackathonId: 1,
  status: "ACTIVE",
  createdAt: event.createdAt,
  participants: [],
};
const criteria: Criterion[] = [
  {
    id: 1,
    name: "Innovation",
    description: "Originality",
    weight: 0.5,
    maxScore: 10,
  },
  {
    id: 2,
    name: "Execution",
    description: "Quality",
    weight: 0.5,
    maxScore: 10,
  },
];
beforeEach(() => {
  vi.mocked(api.get).mockImplementation(async (url) => ({
    data:
      url === "/hackathons"
        ? [event]
        : url === "/teams"
          ? [team]
          : url === "/submissions" || url === "/notifications"
            ? []
            : [],
  }));
  vi.mocked(api.post).mockResolvedValue({ data: { id: 42 } });
  vi.mocked(api.put).mockResolvedValue({ data: {} });
});
describe("Real workflow controls", () => {
  it("requires the project idea, then sends all submission details to the backend", async () => {
    const user = userEvent.setup();
    const close = vi.fn();
    render(
      <HubProvider>
        <SubmissionForm onClose={close} />
      </HubProvider>,
    );
    await waitFor(() =>
      expect(
        screen.getByRole("option", { name: /Test team/ }),
      ).toBeInTheDocument(),
    );
    await user.selectOptions(screen.getByLabelText(/^Team/), "10");
    await user.click(screen.getByRole("button", { name: /Continue/ }));
    expect(screen.queryByLabelText(/Repository URL/)).not.toBeInTheDocument();
    await user.type(
      screen.getByLabelText(/Project title/),
      "Meaningful project",
    );
    await user.type(
      screen.getByLabelText(/Project description/),
      "A real solution to a real problem.",
    );
    await user.click(screen.getByRole("button", { name: /Continue/ }));
    await user.type(
      screen.getByLabelText(/Repository URL/),
      "https://github.com/example/project",
    );
    await user.click(screen.getByRole("button", { name: /Submit project/ }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        "/submissions",
        expect.objectContaining({
          title: "Meaningful project",
          teamId: 10,
          taskId: null,
          repositoryUrl: "https://github.com/example/project",
        }),
      ),
    );
    expect(close).toHaveBeenCalled();
  });
  it("retains entered team data and announces a server conflict", async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockRejectedValue(
      new Error("A team with this name already exists in this event."),
    );
    render(
      <HubProvider>
        <TeamForm onClose={vi.fn()} />
      </HubProvider>,
    );
    await waitFor(() =>
      expect(
        screen.getByRole("option", { name: "Test sprint" }),
      ).toBeInTheDocument(),
    );
    await user.selectOptions(screen.getByLabelText(/Hackathon/), "1");
    await user.type(screen.getByLabelText(/Team name/), "Existing team");
    await user.click(screen.getByRole("button", { name: "Create team" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "already exists",
    );
    expect(screen.getByLabelText(/Team name/)).toHaveValue("Existing team");
    expect(screen.getByRole("button", { name: "Create team" })).toBeEnabled();
  });
  it("prevents saving non-normalized criterion weights and sends normalized decimals", async () => {
    const user = userEvent.setup();
    render(
      <HubProvider>
        <CriteriaEditor
          eventId={1}
          criteria={criteria}
          onClose={vi.fn()}
          onSaved={async () => {}}
        />
      </HubProvider>,
    );
    const weights = screen.getAllByLabelText(/Weight/);
    await user.clear(weights[0]);
    await user.type(weights[0], "25");
    expect(
      screen.getByRole("button", { name: "Save criteria" }),
    ).toBeDisabled();
    await user.clear(weights[1]);
    await user.type(weights[1], "75");
    expect(screen.getByRole("button", { name: "Save criteria" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Save criteria" }));
    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith("/hackathons/1/criteria", {
        criteria: expect.arrayContaining([
          expect.objectContaining({ weight: 0.25 }),
          expect.objectContaining({ weight: 0.75 }),
        ]),
      }),
    );
  });
  it("turns off an incompatible modifier before persisting the chosen combination", async () => {
    const user = userEvent.setup();
    const submission = {
      id: 20,
      earlyBonus: true,
      latePenalty: false,
      originalityBonus: false,
    } as Submission;
    render(
      <HubProvider>
        <ModifierPanel
          event={event}
          submission={submission}
          onSaved={async () => {}}
        />
      </HubProvider>,
    );
    await user.click(
      screen.getByRole("checkbox", { name: "Late deliverables" }),
    );
    expect(
      screen.getByRole("checkbox", { name: "Early submission" }),
    ).not.toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Late deliverables" }),
    ).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Apply adjustments" }));
    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith("/submissions/20/modifiers", {
        earlyBonus: false,
        latePenalty: true,
        originalityBonus: false,
      }),
    );
  });
  it("moves back in a guided submission without discarding the idea", async () => {
    const user = userEvent.setup();
    render(
      <HubProvider>
        <SubmissionForm onClose={vi.fn()} />
      </HubProvider>,
    );
    await waitFor(() =>
      expect(
        screen.getByRole("option", { name: /Test team/ }),
      ).toBeInTheDocument(),
    );
    await user.selectOptions(screen.getByLabelText(/^Team/), "10");
    await user.type(screen.getByLabelText(/Project title/), "Keep this idea");
    await user.type(
      screen.getByLabelText(/Project description/),
      "Keep this description",
    );
    await user.click(screen.getByRole("button", { name: /Continue/ }));
    await user.click(screen.getByRole("button", { name: "Back" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByLabelText(/Project title/)).toHaveValue(
      "Keep this idea",
    );
  });
});

describe("Accessible refresh and error recovery", () => {
  it("preserves a draft form while revalidating an unchanged resource", async () => {
    const user = userEvent.setup();
    let resolveRefresh: (value: string) => void = () => {};
    const loader = vi
      .fn()
      .mockResolvedValueOnce("ready")
      .mockImplementationOnce(
        () =>
          new Promise<string>((resolve) => {
            resolveRefresh = resolve;
          }),
      );
    function Workspace({ revision }: { revision: number }) {
      const result = useResource(loader, [], revision);
      const [draft, setDraft] = useState("");
      if (result.loading) return <p>Loading resource</p>;
      return (
        <Input
          label="Draft feedback"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      );
    }
    const view = render(<Workspace revision={0} />);
    await screen.findByLabelText("Draft feedback");
    await user.type(
      screen.getByLabelText("Draft feedback"),
      "Keep this thought",
    );
    view.rerender(<Workspace revision={1} />);
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(2));
    expect(screen.queryByText("Loading resource")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Draft feedback")).toHaveValue(
      "Keep this thought",
    );
    resolveRefresh("updated");
  });
  it("focuses the failed-submit summary and links an error to its field", async () => {
    const user = userEvent.setup();
    render(
      <form>
        <FormError
          error={{
            message: "Check your details.",
            errors: { email: "Enter a valid email." },
          }}
        />
        <Input
          label="Email"
          error="Enter a valid email."
          value="invalid"
          onChange={() => {}}
        />
      </form>,
    );
    expect(screen.getByRole("alert")).toHaveFocus();
    await user.click(
      screen.getByRole("link", { name: "Email: Enter a valid email." }),
    );
    expect(screen.getByLabelText("Email")).toHaveFocus();
    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
});
