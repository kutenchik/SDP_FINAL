import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import { api } from "../api/client";
import { useHub } from "../hooks/useHub";
import { useResource } from "../hooks/useResource";
import type { Submission, Task } from "../types";
import { dateTime } from "../utils/format";
import {
  Button,
  FormError,
  Input,
  Modal,
  Select,
  SubmitForm,
  Textarea,
  useMutation,
} from "./ui";
export function SubmissionForm({
  submission,
  onClose,
}: {
  submission?: Submission;
  onClose: () => void;
}) {
  const hub = useHub();
  const eligible = hub.teams.filter(
    (t) =>
      t.status !== "WITHDRAWN" &&
      hub.hackathons.some(
        (h) =>
          h.id === t.hackathonId &&
          h.status === "ACTIVE" &&
          new Date(h.submissionDeadline).getTime() > Date.now(),
      ),
  );
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: submission?.title || "",
    description: submission?.description || "",
    repositoryUrl: submission?.repositoryUrl || "",
    presentationUrl: submission?.presentationUrl || "",
    demoUrl: submission?.demoUrl || "",
    teamId:
      submission?.teamId ||
      (eligible.find((t) => t.hackathonId === hub.eventId)?.id ??
        eligible[0]?.id ??
        ""),
    taskId: submission?.taskId ?? "",
  });
  const team = hub.teams.find((t) => t.id === Number(form.teamId));
  const event = hub.hackathons.find((h) => h.id === team?.hackathonId);
  const tasks = useResource(
    async () =>
      event
        ? (await api.get<Task[]>(`/hackathons/${event.id}/tasks`)).data
        : [],
    [event?.id],
  );
  useEffect(() => {
    if (!submission) setForm((f) => ({ ...f, taskId: "" }));
  }, [form.teamId, submission]);
  const mutation = useMutation(async () => {
    await hub.refresh();
    hub.toast(submission ? "Project updated." : "Project submitted.");
    onClose();
  });
  const chosenTask = tasks.data?.find((t) => t.id === Number(form.taskId));
  const deadline = chosenTask?.deadline || event?.submissionDeadline;
  return (
    <Modal
      title={submission ? "Edit Submission" : "Submit Project"}
      description="Enter project details, links, and an optional task."
      onClose={onClose}
    >
      <div className="form-steps">
        <span
          className={`form-step ${step === 1 ? "active" : ""}`}
          aria-current={step === 1 ? "step" : undefined}
        >
          <span>1</span>Project
        </span>
        <span className="form-step-line" />
        <span
          className={`form-step ${step === 2 ? "active" : ""}`}
          aria-current={step === 2 ? "step" : undefined}
        >
          <span>2</span>Links and task
        </span>
      </div>
      <SubmitForm
        onSubmit={() => {
          if (step === 1) {
            setStep(2);
            requestAnimationFrame(() =>
              document
                .querySelector<HTMLDialogElement>("dialog[open]")
                ?.querySelector<HTMLInputElement>("input")
                ?.focus(),
            );
          } else
            void mutation.run(() =>
              api[submission ? "put" : "post"](
                submission ? `/submissions/${submission.id}` : "/submissions",
                {
                  ...form,
                  teamId: Number(form.teamId),
                  taskId: form.taskId ? Number(form.taskId) : null,
                },
              ),
            );
        }}
      >
        <FormError error={mutation.error} />
        {step === 1 ? (
          <>
            <Select
              label="Team"
              hint={
                !eligible.length && !submission
                  ? "Create a team in an active hackathon with an open submission deadline first."
                  : undefined
              }
              required
              value={form.teamId}
              disabled={!!submission}
              onChange={(e) =>
                setForm((f) => ({ ...f, teamId: Number(e.target.value) }))
              }
            >
              <option value="" disabled>
                Select a team
              </option>
              {(submission
                ? hub.teams.filter((t) => t.id === submission.teamId)
                : eligible
              ).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ·{" "}
                  {hub.hackathons.find((h) => h.id === t.hackathonId)?.name}
                </option>
              ))}
            </Select>
            <Input
              label="Project title"
              required
              maxLength={160}
              value={form.title}
              error={mutation.error?.errors.title}
              placeholder="Project title"
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
            />
            <Textarea
              label="Project description"
              required
              maxLength={5000}
              value={form.description}
              placeholder="Describe the project and implementation."
              error={mutation.error?.errors.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
            {event && (
              <div className="info-box">
                <strong>{event.name}</strong>Submission deadline:{" "}
                {dateTime(event.submissionDeadline)}
              </div>
            )}
            <div className="form-footer">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                Continue <ArrowRight size={16} aria-hidden="true" />
              </Button>
            </div>
          </>
        ) : (
          <>
            <Input
              label="Repository URL"
              autoFocus
              required
              type="url"
              maxLength={1000}
              value={form.repositoryUrl}
              error={mutation.error?.errors.repositoryUrl}
              placeholder="https://github.com/your-team/your-project"
              hint="A public or accessible HTTP/HTTPS link to your project’s source code."
              onChange={(e) =>
                setForm((f) => ({ ...f, repositoryUrl: e.target.value }))
              }
            />
            <Input
              label="Presentation URL"
              type="url"
              maxLength={1000}
              value={form.presentationUrl}
              placeholder="https://…"
              onChange={(e) =>
                setForm((f) => ({ ...f, presentationUrl: e.target.value }))
              }
            />
            <Input
              label="Live demo URL"
              type="url"
              maxLength={1000}
              value={form.demoUrl}
              placeholder="https://…"
              onChange={(e) =>
                setForm((f) => ({ ...f, demoUrl: e.target.value }))
              }
            />
            <Select
              label="Task"
              value={form.taskId}
              onChange={(e) =>
                setForm((f) => ({ ...f, taskId: e.target.value }))
              }
              hint={
                tasks.error || "Optional. Select the task for this project."
              }
            >
              <option value="">General submission</option>
              {tasks.data?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </Select>
            {deadline && (
              <div className="info-box">
                Submit before {dateTime(deadline)}. You can edit the project
                until its deadline or first evaluation, whichever comes first.
              </div>
            )}
            <div className="form-footer">
              <Button variant="secondary" onClick={() => setStep(1)}>
                <ArrowLeft size={15} aria-hidden="true" />
                Back
              </Button>
              <Button type="submit" busy={mutation.busy}>
                <Send size={15} aria-hidden="true" />
                {submission ? "Save project" : "Submit project"}
              </Button>
            </div>
          </>
        )}
      </SubmitForm>
    </Modal>
  );
}
