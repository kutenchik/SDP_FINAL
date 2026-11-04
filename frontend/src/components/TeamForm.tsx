import { useState } from "react";
import { api } from "../api/client";
import { useHub } from "../hooks/useHub";
import type { Team } from "../types";
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
export function TeamForm({
  team,
  onClose,
}: {
  team?: Team;
  onClose: () => void;
}) {
  const hub = useHub();
  const available = hub.hackathons.filter(
    (h) => h.status === "ACTIVE" || h.status === "DRAFT",
  );
  const [form, setForm] = useState({
    name: team?.name || "",
    description: team?.description || "",
    technologyStack: team?.technologyStack || "",
    hackathonId:
      team?.hackathonId ||
      (available.find((h) => h.id === hub.eventId)?.id ??
        available[0]?.id ??
        ""),
    status: team?.status || ("ACTIVE" as Team["status"]),
  });
  const mutation = useMutation(async () => {
    await hub.refresh();
    hub.toast(team ? "Team details updated." : "Team created.");
    onClose();
  });
  return (
    <Modal
      title={team ? "Edit Team" : "Create Team"}
      description={
        team
          ? "Update team details and status."
          : "Enter team details and select a hackathon."
      }
      onClose={onClose}
    >
      <SubmitForm
        onSubmit={() =>
          void mutation.run(() =>
            api[team ? "put" : "post"](team ? `/teams/${team.id}` : "/teams", {
              ...form,
              hackathonId: Number(form.hackathonId),
            }),
          )
        }
      >
        <FormError error={mutation.error} />
        <Select
          label="Hackathon"
          hint={
            !available.length && !team
              ? "Create an active or draft hackathon before registering a team."
              : undefined
          }
          required
          value={form.hackathonId}
          disabled={!!team}
          onChange={(e) =>
            setForm((f) => ({ ...f, hackathonId: Number(e.target.value) }))
          }
        >
          <option value="" disabled>
            Select a hackathon
          </option>
          {(team ? hub.hackathons : available).map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </Select>
        <Input
          label="Team name"
          required
          maxLength={100}
          placeholder="Team name"
          value={form.name}
          error={mutation.error?.errors.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <Textarea
          label="Team description"
          maxLength={2000}
          placeholder="Team description"
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
        />
        <Input
          label="Technology stack"
          maxLength={500}
          placeholder="React, TypeScript, Spring Boot"
          hint="Separate technologies with commas."
          value={form.technologyStack}
          onChange={(e) =>
            setForm((f) => ({ ...f, technologyStack: e.target.value }))
          }
        />
        {team && (
          <Select
            label="Team status"
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                status: e.target.value as Team["status"],
              }))
            }
            hint="Withdrawn teams are kept in the workspace and excluded from rankings."
          >
            <option value="ACTIVE">Active</option>
            <option value="FINALIST">Finalist</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </Select>
        )}
        <FormFooter
          busy={mutation.busy}
          onClose={onClose}
          label={team ? "Save changes" : "Create team"}
        />
      </SubmitForm>
    </Modal>
  );
}
