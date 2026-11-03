import { Flag } from "lucide-react";
import { useHub } from "../hooks/useHub";
export function EventPicker({
  all = false,
  onChange,
}: {
  all?: boolean;
  onChange?: () => void;
}) {
  const hub = useHub();
  const selected = hub.hackathons.some((h) => h.id === hub.eventId)
    ? hub.eventId
    : null;
  return (
    <div className="event-picker">
      <Flag size={16} aria-hidden="true" />
      <select
        aria-label="Filter by hackathon"
        value={selected ?? (all ? "" : (hub.hackathons[0]?.id ?? ""))}
        onChange={(e) => {
          hub.setEventId(e.target.value ? Number(e.target.value) : null);
          onChange?.();
        }}
      >
        {all && <option value="">All hackathons</option>}
        {!all && !hub.hackathons.length && (
          <option value="">No hackathons yet</option>
        )}
        {hub.hackathons.map((h) => (
          <option key={h.id} value={h.id}>
            {h.name}
          </option>
        ))}
      </select>
    </div>
  );
}
export function useSelectedEvent() {
  const hub = useHub();
  return hub.hackathons.find((h) => h.id === hub.eventId) || hub.hackathons[0];
}
