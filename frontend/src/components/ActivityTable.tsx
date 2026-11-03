import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { api, failure } from "../api/client";
import { useHub } from "../hooks/useHub";
import type { Activity } from "../types";
import { activityDetails } from "../utils/activity";
import { dateTime } from "../utils/format";
import { Table } from "./DataTable";
import { Empty } from "./ui";
export function ActivityTable({
  activities,
  markRead = false,
  onNavigate,
}: {
  activities: Activity[];
  markRead?: boolean;
  onNavigate?: () => void;
}) {
  const hub = useHub();
  return (
    <Table label="Recent activity">
      <thead>
        <tr>
          <th scope="col">Actor</th>
          <th scope="col">Action</th>
          <th scope="col">Project / Hackathon</th>
          <th scope="col">Timestamp</th>
          {markRead && (
            <th scope="col">
              <span className="sr-only">Read status</span>
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {activities.length === 0 ? (
          <tr>
            <td colSpan={markRead ? 5 : 4}>
              <Empty
                title="No activity"
                description="Recorded team, submission, and evaluation events appear here."
              />
            </td>
          </tr>
        ) : (
          activities.map((activity) => {
            const detail = activityDetails(
              activity,
              hub.hackathons,
              hub.submissions,
            );
            return (
              <tr
                key={activity.id}
                className={markRead && !activity.read ? "unread" : ""}
              >
                <td>{detail.actor}</td>
                <td>{detail.action}</td>
                <td>
                  <Link
                    className="record-link"
                    to={detail.href}
                    onClick={onNavigate}
                  >
                    {detail.subject}
                  </Link>
                  {detail.hackathon && detail.subject !== detail.hackathon && (
                    <small className="cell-secondary">{detail.hackathon}</small>
                  )}
                </td>
                <td className="timestamp">
                  <time dateTime={activity.createdAt}>
                    {dateTime(activity.createdAt)}
                  </time>
                </td>
                {markRead && (
                  <td>
                    {activity.read ? (
                      <span className="muted">Read</span>
                    ) : (
                      <button
                        className="icon-btn"
                        aria-label={`Mark as read: ${activity.message}`}
                        title="Mark as read"
                        onClick={async () => {
                          try {
                            await api.put(`/notifications/${activity.id}/read`);
                            await hub.refresh();
                          } catch (error) {
                            hub.toast(failure(error).message);
                          }
                        }}
                      >
                        <Check size={16} aria-hidden="true" />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
          })
        )}
      </tbody>
    </Table>
  );
}
