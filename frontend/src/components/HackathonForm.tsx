import { useState } from "react";
import { api } from "../api/client";
import { useHub } from "../hooks/useHub";
import type { Hackathon, HackathonStatus } from "../types";
import { iso, label, localInput } from "../utils/format";
import {
  FormError,
  FormFooter,
  Input,
  Modal,
  Select,
  SubmitForm,
  Textarea,
  useMutation,
} from "./ui";
export function HackathonForm({
  event,
  onClose,
}: {
  event?: Hackathon;
  onClose: () => void;
}) {
  const hub = useHub();
  const now = Date.now();
  const [form, setForm] = useState({
    name: event?.name || "",
    description: event?.description || "",
    startDate: localInput(event?.startDate || new Date(now).toISOString()),
    endDate: localInput(
      event?.endDate || new Date(now + 3 * 86400000).toISOString(),
    ),
    submissionDeadline: localInput(
      event?.submissionDeadline || new Date(now + 2 * 86400000).toISOString(),
    ),
    status: event?.status || ("ACTIVE" as HackathonStatus),
  });
  const change = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));
  const mutation = useMutation(async () => {
    await hub.refresh();
    hub.toast(event ? "Hackathon updated." : "Hackathon created.");
    onClose();
  });
  const states: Record<HackathonStatus, HackathonStatus[]> = {
    DRAFT: ["DRAFT", "ACTIVE", "CANCELLED"],
    ACTIVE: ["ACTIVE", "JUDGING", "CANCELLED"],
    JUDGING: ["JUDGING", "COMPLETED", "CANCELLED"],
    COMPLETED: ["COMPLETED"],
    CANCELLED: ["CANCELLED"],
  };
  return (
    <Modal
      title={event ? "Edit Hackathon" : "Create Hackathon"}
      description={
        event
          ? "Update hackathon details and dates."
          : "Configure the hackathon, dates, and status."
      }
      onClose={onClose}
    >
      <SubmitForm
        onSubmit={() =>
          void mutation.run(() =>
            api[event ? "put" : "post"](
              event ? `/hackathons/${event.id}` : "/hackathons",
              {
                ...form,
                startDate: iso(form.startDate),
                endDate: iso(form.endDate),
                submissionDeadline: iso(form.submissionDeadline),
              },
            ),
          )
        }
      >
        <FormError error={mutation.error} />
        <Input
          label="Hackathon name"
          required
          maxLength={120}
          placeholder="Hackathon name"
          value={form.name}
          onChange={(e) => change("name", e.target.value)}
          error={mutation.error?.errors.name}
        />
        <Textarea
          label="Description"
          required
          maxLength={4000}
          placeholder="Describe the hackathon requirements."
          value={form.description}
          onChange={(e) => change("description", e.target.value)}
          error={mutation.error?.errors.description}
        />
        <div className="form-grid">
          <Input
            label="Starts"
            type="datetime-local"
            required
            value={form.startDate}
            onChange={(e) => change("startDate", e.target.value)}
          />
          <Input
            label="Ends"
            type="datetime-local"
            required
            min={form.startDate}
            value={form.endDate}
            onChange={(e) => change("endDate", e.target.value)}
          />
        </div>
        <Input
          label="Submission deadline"
          type="datetime-local"
          required
          min={form.startDate}
          max={form.endDate}
          value={form.submissionDeadline}
          onChange={(e) => change("submissionDeadline", e.target.value)}
          hint="Dates use your local time zone and are saved in UTC."
        />
        <Select
          label="Event status"
          hint={
            form.status === "COMPLETED" || form.status === "CANCELLED"
              ? "Closing an event locks its details, submissions, and judging."
              : undefined
          }
          value={form.status}
          onChange={(e) => change("status", e.target.value)}
        >
          {(event ? states[event.status] : ["ACTIVE", "DRAFT"]).map((s) => (
            <option value={s} key={s}>
              {label(s)}
            </option>
          ))}
        </Select>
        {!event && (
          <div className="info-box">
            Four default evaluation criteria are created. Edit them before the
            first evaluation is submitted.
          </div>
        )}
        <FormFooter
          busy={mutation.busy}
          onClose={onClose}
          label={event ? "Save changes" : "Create hackathon"}
        />
      </SubmitForm>
    </Modal>
  );
}
