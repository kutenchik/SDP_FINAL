import { useDeferredValue, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  FolderGit2,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
} from "lucide-react";
import { api } from "../api/client";
import { useHub } from "../hooks/useHub";
import type { Participant, Team } from "../types";
import {
  Avatar,
  Badge,
  Button,
  Empty,
  FormError,
  Input,
  Loading,
  Modal,
  PageHeading,
  SearchInput,
  SubmitForm,
  useMutation,
} from "../components/ui";
import { EventPicker } from "../components/EventPicker";
import { TeamForm } from "../components/TeamForm";
function TeamMembers({
  team,
  onClose,
  onEdit,
}: {
  team: Team;
  onClose: () => void;
  onEdit: () => void;
}) {
  const hub = useHub();
  const navigate = useNavigate();
  const editable =
    can(hub.role, "teams.manage") &&
    hub.hackathons.some(
      (h) =>
        h.id === team.hackathonId &&
        h.status !== "COMPLETED" &&
        h.status !== "CANCELLED",
    );
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<Participant | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    role: "Developer",
  });
  const mutation = useMutation(async () => {
    await hub.refresh();
    hub.toast("Participant added.");
    setForm({ fullName: "", email: "", role: "Developer" });
    setAdding(false);
  });
  const deletion = useMutation(async () => {
    await hub.refresh();
    hub.toast("Participant removed.");
    setRemoving(null);
  });
  if (removing)
    return (
      <Modal title="Remove this participant?" onClose={() => setRemoving(null)}>
        <p className="confirmation-text">
          {removing.fullName} will be removed from {team.name}. Their membership
          can be added again later.
        </p>
        <FormError error={deletion.error} />
        <div className="form-footer">
          <Button variant="secondary" onClick={() => setRemoving(null)}>
            Keep participant
          </Button>
          <Button
            variant="danger"
            busy={deletion.busy}
            onClick={() =>
              void deletion.run(() =>
                api.delete(`/teams/${team.id}/participants/${removing.id}`),
              )
            }
          >
            Remove participant
          </Button>
        </div>
      </Modal>
    );
  return (
    <Modal
      title={team.name}
      description={hub.hackathons.find((h) => h.id === team.hackathonId)?.name}
      onClose={onClose}
    >
      <p className="detail-description">
        {team.description || "No team description."}
      </p>
      <div className="heading-actions">
        <Badge value={team.status} />
        {editable && (
          <Button variant="ghost" onClick={onEdit}>
            <Pencil size={14} aria-hidden="true" />
            Edit team
          </Button>
        )}
      </div>
      {team.technologyStack && (
        <div className="tags">
          {team.technologyStack.split(",").map((t, i) => (
            <span className="tag" key={i}>
              {t.trim()}
            </span>
          ))}
        </div>
      )}
      <div className="divider" />
      <div className="section-heading">
        <h3>
          Participants{" "}
          <span className="count-pill">{team.participants.length}</span>
        </h3>
        {editable && !adding && (
          <Button variant="secondary" onClick={() => setAdding(true)}>
            <UserPlus size={15} aria-hidden="true" />
            Add member
          </Button>
        )}
      </div>
      <div className="member-list">
        {team.participants.length === 0 ? (
          <p className="muted small">No participants have been added.</p>
        ) : (
          team.participants.map((p, i) => (
            <div className="member-row" key={p.id}>
              <Avatar name={p.fullName} index={i} />
              <div>
                <strong>{p.fullName}</strong>
                <p>{p.email}</p>
              </div>
              <span className="badge">{p.role}</span>
              {editable && (
                <button
                  className="icon-btn danger"
                  aria-label={`Remove ${p.fullName}`}
                  onClick={() => setRemoving(p)}
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
      {adding && (
        <SubmitForm
          onSubmit={() =>
            void mutation.run(() =>
              api.post(`/teams/${team.id}/participants`, form),
            )
          }
        >
          <h3 style={{ marginBottom: 16 }}>Add a participant</h3>
          <FormError error={mutation.error} />
          <Input
            label="Full name"
            autoFocus
            required
            maxLength={100}
            autoComplete="name"
            value={form.fullName}
            error={mutation.error?.errors.fullName}
            onChange={(e) =>
              setForm((f) => ({ ...f, fullName: e.target.value }))
            }
          />
          <Input
            label="Email address"
            required
            type="email"
            maxLength={254}
            autoComplete="email"
            value={form.email}
            error={mutation.error?.errors.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <Input
            label="Team role"
            required
            maxLength={80}
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          />
          <div className="form-footer">
            <Button variant="secondary" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button type="submit" busy={mutation.busy}>
              Add member
            </Button>
          </div>
        </SubmitForm>
      )}
      <div className="divider" />
      <Button
        variant="secondary"
        onClick={() => {
          hub.setEventId(team.hackathonId);
          navigate(`/submissions?teamId=${team.id}`);
          onClose();
        }}
      >
        <FolderGit2 size={15} aria-hidden="true" />
        View team’s projects <ArrowRight size={14} aria-hidden="true" />
      </Button>
    </Modal>
  );
}

import { can } from "../utils/permissions";
import {
  FilterTabs,
  Pagination,
  Table,
  usePagination,
} from "../components/DataTable";

export default function Teams() {
  const hub = useHub();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const query = useDeferredValue(search).trim().toLowerCase();
  const [status, setStatus] = useState("ALL");
  const [editing, setEditing] = useState<Team>();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const manage = can(hub.role, "teams.manage");
  const selected = hub.teams.find((t) => t.id === selectedId);
  const filtered = hub.teams.filter(
    (t) =>
      (!hub.eventId || t.hackathonId === hub.eventId) &&
      (status === "ALL" || t.status === status) &&
      (params.get("members") !== "empty" || t.participants.length === 0) &&
      (params.get("members") !== "populated" || t.participants.length > 0) &&
      `${t.name} ${t.description} ${t.technologyStack}`
        .toLowerCase()
        .includes(query),
  );
  const pagination = usePagination(
    filtered,
    `${query}-${status}-${hub.eventId}-${params.get("members")}`,
  );
  return (
    <>
      <PageHeading
        title="Teams"
        description="Team membership, projects, and participation status."
        action={
          manage && (
            <Button onClick={() => setParams({ create: "true" })}>
              <Plus size={15} aria-hidden="true" />
              Create Team
            </Button>
          )
        }
      />
      <FilterTabs
        label="Team status"
        value={status}
        onChange={setStatus}
        items={[
          { value: "ALL", label: "All" },
          { value: "ACTIVE", label: "Active" },
          { value: "FINALIST", label: "Finalists" },
          { value: "WITHDRAWN", label: "Withdrawn" },
        ]}
      />
      <div className="filters-row">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search teams or technologies…"
        />
        <EventPicker all />
        <select
          className="filter-select"
          aria-label="Filter team membership size"
          value={params.get("members") || "all"}
          onChange={(e) => {
            const next = new URLSearchParams(params);
            if (e.target.value === "all") next.delete("members");
            else next.set("members", e.target.value);
            setParams(next);
          }}
        >
          <option value="all">All team sizes</option>
          <option value="empty">No members</option>
          <option value="populated">With members</option>
        </select>
      </div>
      {hub.loading ? (
        <Loading />
      ) : (
        <>
          <TeamDirectory
            rows={pagination.rows}
            manage={manage}
            onView={setSelectedId}
            onClear={() => {
              setSearch("");
              setStatus("ALL");
              hub.setEventId(null);
              setParams({});
            }}
          />
          <Pagination {...pagination} />
        </>
      )}
      {manage && (params.get("create") === "true" || editing) && (
        <TeamForm
          team={editing}
          onClose={() => {
            setEditing(undefined);
            setParams({});
          }}
        />
      )}
      {selected && !editing && (
        <TeamMembers
          team={selected}
          onClose={() => setSelectedId(null)}
          onEdit={() => {
            setSelectedId(null);
            setEditing(selected);
          }}
        />
      )}
    </>
  );
}
function TeamDirectory({
  rows,
  manage,
  onView,
  onClear,
}: {
  rows: Team[];
  manage: boolean;
  onView: (id: number) => void;
  onClear: () => void;
}) {
  const hub = useHub();
  return (
    <Table label="Teams">
      <thead>
        <tr>
          <th scope="col">Team Name</th>
          <th scope="col">Hackathon</th>
          <th scope="col" className="text-right">
            Members
          </th>
          <th scope="col">Project</th>
          <th scope="col">Status</th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={6}>
              <Empty
                title="No teams found"
                description="No teams match the selected filters."
                action={
                  <Button variant="secondary" onClick={onClear}>
                    Clear Filters
                  </Button>
                }
              />
            </td>
          </tr>
        ) : (
          rows.map((team) => {
            const projects = hub.submissions.filter(
              (s) => s.teamId === team.id,
            );
            return (
              <tr key={team.id}>
                <td>
                  <div className="table-title">
                    <Avatar name={team.name} />
                    <strong>{team.name}</strong>
                  </div>
                </td>
                <td>
                  <Link
                    className="record-link"
                    to={`/hackathons/${team.hackathonId}`}
                  >
                    {hub.hackathons.find((h) => h.id === team.hackathonId)
                      ?.name || `Hackathon #${team.hackathonId}`}
                  </Link>
                </td>
                <td className="text-right mono">{team.participants.length}</td>
                <td>
                  {projects.length ? (
                    projects.map((project) => (
                      <Link
                        className="record-link cell-secondary"
                        key={project.id}
                        to={`/submissions?submissionId=${project.id}`}
                      >
                        {project.title}
                      </Link>
                    ))
                  ) : (
                    <span className="muted">No submission</span>
                  )}
                </td>
                <td>
                  <Badge value={team.status} />
                </td>
                <td>
                  <Button variant="ghost" onClick={() => onView(team.id)}>
                    {manage ? "Manage" : "View"}
                  </Button>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </Table>
  );
}
