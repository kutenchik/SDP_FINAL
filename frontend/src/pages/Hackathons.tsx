import { useDeferredValue, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { useHub } from "../hooks/useHub";
import type { Hackathon } from "../types";
import { can } from "../utils/permissions";
import { date } from "../utils/format";
import {
  Badge,
  Button,
  Empty,
  Loading,
  PageHeading,
  SearchInput,
} from "../components/ui";
import {
  FilterTabs,
  Pagination,
  Table,
  usePagination,
} from "../components/DataTable";
import { HackathonForm } from "../components/HackathonForm";
const tabs = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "active", label: "Active" },
  { value: "judging", label: "Judging" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;
type Tab = (typeof tabs)[number]["value"];
export default function Hackathons() {
  const hub = useHub();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const query = useDeferredValue(search).trim().toLowerCase();
  const [tab, setTab] = useState<Tab>("all");
  const [editing, setEditing] = useState<Hackathon>();
  const manage = can(hub.role, "hackathons.manage");
  const filtered = hub.hackathons.filter((h) => {
    const upcoming =
      h.status === "DRAFT" ||
      (h.status === "ACTIVE" && Date.parse(h.startDate) > Date.now());
    return (
      (tab === "all" ||
        (tab === "upcoming"
          ? upcoming
          : tab === "active"
            ? h.status === "ACTIVE" && !upcoming
            : h.status === tab.toUpperCase())) &&
      `${h.name} ${h.description}`.toLowerCase().includes(query)
    );
  });
  const pagination = usePagination(filtered, `${query}-${tab}`);
  return (
    <>
      <PageHeading
        title="Hackathons"
        description="Manage competitions and submission deadlines."
        action={
          manage && (
            <Button onClick={() => setParams({ create: "true" })}>
              <Plus size={15} aria-hidden="true" />
              Create Hackathon
            </Button>
          )
        }
      />
      <FilterTabs
        label="Hackathon status"
        value={tab}
        onChange={setTab}
        items={tabs}
      />
      <div className="toolbar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search hackathons…"
        />
        <span className="result-count">{filtered.length} hackathons</span>
      </div>
      {hub.loading ? (
        <Loading />
      ) : (
        <>
          <Table label="Hackathons">
            <thead>
              <tr>
                <th scope="col">Hackathon</th>
                <th scope="col">Status</th>
                <th scope="col">Start Date</th>
                <th scope="col">End Date</th>
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
              {pagination.rows.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <Empty
                      title="No hackathons found"
                      description="No records match the selected status and search."
                      action={
                        query || tab !== "all" ? (
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setSearch("");
                              setTab("all");
                            }}
                          >
                            Clear Filters
                          </Button>
                        ) : undefined
                      }
                    />
                  </td>
                </tr>
              ) : (
                pagination.rows.map((event) => (
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
                    <td className="nowrap">{date(event.endDate)}</td>
                    <td className="text-right mono">
                      {
                        hub.teams.filter((t) => t.hackathonId === event.id)
                          .length
                      }
                    </td>
                    <td className="text-right mono">
                      {
                        hub.submissions.filter(
                          (s) => s.hackathonId === event.id,
                        ).length
                      }
                    </td>
                    <td>
                      <div className="row-actions">
                        <Link
                          className="text-link"
                          to={`/hackathons/${event.id}`}
                        >
                          View
                        </Link>
                        {manage &&
                          !["CANCELLED", "COMPLETED"].includes(
                            event.status,
                          ) && (
                            <Button
                              variant="ghost"
                              onClick={() => setEditing(event)}
                            >
                              Edit
                            </Button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
          <Pagination {...pagination} />
        </>
      )}
      {manage && (params.get("create") === "true" || editing) && (
        <HackathonForm
          event={editing}
          onClose={() => {
            setEditing(undefined);
            setParams({});
          }}
        />
      )}
    </>
  );
}
