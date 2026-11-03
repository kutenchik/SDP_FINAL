import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import { api } from "../api/client";
import { useResource } from "./useResource";
import type { Activity, Hackathon, Role, Team, Submission } from "../types";
interface HubContext {
  hackathons: Hackathon[];
  teams: Team[];
  submissions: Submission[];
  activity: Activity[];
  role: Role;
  setRole: (r: Role) => void;
  eventId: number | null;
  setEventId: (id: number | null) => void;
  refresh: () => Promise<void>;
  revision: number;
  loading: boolean;
  error: string;
  toast: (message: string) => void;
}
const Context = createContext<HubContext | null>(null);
export function HubProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => {
    const saved = localStorage.getItem("hub-role");
    return saved === "Judge" || saved === "Participant" ? saved : "Organizer";
  });
  const [eventId, setEventIdState] = useState<number | null>(
    () => Number(localStorage.getItem("hub-event")) || null,
  );
  const [revision, setRevision] = useState(0);
  const [message, setMessage] = useState("");
  const resource = useResource(async () => {
    const [h, t, s, a] = await Promise.all([
      api.get<Hackathon[]>("/hackathons"),
      api.get<Team[]>("/teams"),
      api.get<Submission[]>("/submissions"),
      api.get<Activity[]>("/notifications"),
    ]);
    return {
      hackathons: h.data,
      teams: t.data,
      submissions: s.data,
      activity: a.data,
    };
  });
  useEffect(() => {
    const timer = setInterval(() => {
      void resource.reload().then(() => setRevision((value) => value + 1));
    }, 15000);
    return () => clearInterval(timer);
  }, [resource.reload]);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 4500);
    return () => clearTimeout(timer);
  }, [message]);
  const refresh = useCallback(async () => {
    await resource.reload();
    setRevision((x) => x + 1);
  }, [resource.reload]);
  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    localStorage.setItem("hub-role", r);
  }, []);
  const setEventId = useCallback((id: number | null) => {
    setEventIdState(id);
    if (id) localStorage.setItem("hub-event", String(id));
    else localStorage.removeItem("hub-event");
  }, []);
  return (
    <Context.Provider
      value={{
        hackathons: resource.data?.hackathons || [],
        teams: resource.data?.teams || [],
        submissions: resource.data?.submissions || [],
        activity: resource.data?.activity || [],
        role,
        setRole,
        eventId,
        setEventId,
        refresh,
        revision,
        loading: resource.loading,
        error: resource.error,
        toast: setMessage,
      }}
    >
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {message && (
          <div className="toast">
            <span className="toast-dot" />
            {message}
            <button
              aria-label="Dismiss notification"
              onClick={() => setMessage("")}
            >
              ×
            </button>
          </div>
        )}
      </div>
    </Context.Provider>
  );
}
export function useHub() {
  const value = useContext(Context);
  if (!value) throw new Error("Hub context is missing");
  return value;
}
