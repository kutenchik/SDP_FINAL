import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Bell,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Code2,
  Flag,
  FolderGit2,
  Gavel,
  LayoutDashboard,
  Menu,
  Moon,
  Sun,
  Trophy,
  Users,
} from "lucide-react";
import { useHub } from "../hooks/useHub";
import { can } from "../utils/permissions";
import type { Permission } from "../utils/permissions";
import type { Role } from "../types";
import { ActivityTable } from "./ActivityTable";
import { Button, ErrorState, Modal } from "./ui";
const links: {
  to: string;
  name: string;
  icon: typeof Bell;
  permission?: Permission;
}[] = [
  { to: "/", name: "Dashboard", icon: LayoutDashboard },
  { to: "/hackathons", name: "Hackathons", icon: Flag },
  { to: "/teams", name: "Teams", icon: Users, permission: "teams.read" },
  { to: "/submissions", name: "Submissions", icon: FolderGit2 },
  {
    to: "/evaluation",
    name: "Evaluation",
    icon: Gavel,
    permission: "evaluations.read",
  },
  { to: "/leaderboard", name: "Leaderboard", icon: Trophy },
];
const instructions: Record<Role, { title: string; description: string }[]> = {
  Organizer: [
    {
      title: "Create a Hackathon",
      description:
        "Configure dates, submission deadlines, tasks, and evaluation criteria.",
    },
    {
      title: "Manage Teams and Submissions",
      description:
        "Review team membership, project details, and submission status.",
    },
    {
      title: "Configure Scoring",
      description:
        "Select a scoring strategy, apply score adjustments, and export the leaderboard.",
    },
  ],
  Participant: [
    {
      title: "Create a Team",
      description:
        "Select a hackathon, enter team details, and add participants.",
    },
    {
      title: "Submit a Project",
      description:
        "Add project details and repository links before the deadline.",
    },
    {
      title: "View Results",
      description: "Check submission status and the leaderboard.",
    },
  ],
  Judge: [
    {
      title: "Select a Submission",
      description:
        "Open Evaluation and select a pending or completed submission.",
    },
    {
      title: "Submit an Evaluation",
      description:
        "Enter your judge name, score every criterion, and add feedback.",
    },
    {
      title: "View Results",
      description: "Review recorded evaluations and the leaderboard.",
    },
  ],
};
export function Layout() {
  const hub = useHub();
  const location = useLocation();
  const [dialog, setDialog] = useState<
    "navigation" | "guide" | "notifications" | null
  >(null);
  const [dark, setDark] = useState(
    () => localStorage.getItem("hub-theme") === "dark",
  );
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("hub-sidebar-collapsed") === "true",
  );
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("hub-theme", dark ? "dark" : "light");
  }, [dark]);
  useEffect(
    () => localStorage.setItem("hub-sidebar-collapsed", String(collapsed)),
    [collapsed],
  );
  useEffect(() => {
    setDialog(null);
    document.getElementById("main-content")?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [location.pathname]);
  const available = links.filter(
    (link) => !link.permission || can(hub.role, link.permission),
  );
  const current = links.find((link) =>
    link.to === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(link.to),
  );
  const unread = hub.activity.filter((item) => !item.read).length;
  const navigation = (
    <nav aria-label="Main navigation">
      {available.map(({ to, name, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          title={collapsed ? name : undefined}
          aria-label={name}
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          onClick={() => setDialog(null)}
        >
          <Icon size={17} aria-hidden="true" />
          <span className="nav-label">{name}</span>
        </NavLink>
      ))}
    </nav>
  );
  const themeControl = (
    <button
      className="nav-item sidebar-control"
      onClick={() => setDark((value) => !value)}
      aria-label={dark ? "Use light theme" : "Use dark theme"}
      title={dark ? "Use light theme" : "Use dark theme"}
    >
      {dark ? (
        <Sun size={17} aria-hidden="true" />
      ) : (
        <Moon size={17} aria-hidden="true" />
      )}
      <span className="nav-label">Theme</span>
      <small className="nav-label">{dark ? "Dark" : "Light"}</small>
    </button>
  );
  const ownsData =
    location.pathname.startsWith("/hackathons/") ||
    location.pathname === "/evaluation" ||
    location.pathname === "/leaderboard";
  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <aside className="sidebar">
        <div className="sidebar-header">
          <NavLink className="brand" to="/" aria-label="Hackathon Hub home">
            <Code2 size={26} aria-hidden="true" />
            <span className="brand-name">
              hackathon<span>hub</span>
            </span>
          </NavLink>
          <button
            className="sidebar-toggle"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? (
              <ChevronRight size={16} aria-hidden="true" />
            ) : (
              <ChevronLeft size={16} aria-hidden="true" />
            )}
          </button>
        </div>
        {navigation}
        <div className="sidebar-bottom">
          {themeControl}
          <button
            className="nav-item sidebar-control"
            title="Quick Start"
            onClick={() => setDialog("guide")}
            aria-label="Quick Start"
          >
            <BookOpen size={17} aria-hidden="true" />
            <span className="nav-label">Quick Start</span>
          </button>
          <div className="workspace-label nav-label">
            Hackathon Hub · {hub.role}
          </div>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-btn mobile-menu"
              aria-label="Open navigation"
              onClick={() => setDialog("navigation")}
            >
              <Menu size={20} aria-hidden="true" />
            </button>
            <span>Workspace</span>
            <ChevronRight size={13} aria-hidden="true" />
            <strong>{current?.name || "Page not found"}</strong>
          </div>
          <div className="topbar-actions">
            <label className="role-control">
              <span>Role</span>
              <select
                aria-label="Switch role"
                value={hub.role}
                onChange={(e) => hub.setRole(e.target.value as Role)}
              >
                {(["Organizer", "Participant", "Judge"] as Role[]).map(
                  (role) => (
                    <option key={role}>{role}</option>
                  ),
                )}
              </select>
            </label>
            <button
              className="icon-btn notification-button"
              aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
              onClick={() => setDialog("notifications")}
            >
              <Bell size={19} aria-hidden="true" />
              {unread > 0 && <span className="notification-dot" />}
            </button>
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="main-content">
          {hub.error && (!ownsData || hub.hackathons.length === 0) && (
            <ErrorState message={hub.error} retry={() => void hub.refresh()} />
          )}
          {(!hub.error || hub.hackathons.length > 0) && <Outlet />}
        </main>
      </div>
      {dialog === "navigation" && (
        <Modal title="Navigation" onClose={() => setDialog(null)}>
          {navigation}
          <div className="mobile-theme">
            {themeControl}
            <Button variant="secondary" onClick={() => setDialog("guide")}>
              Quick Start
            </Button>
          </div>
        </Modal>
      )}
      {dialog === "guide" && (
        <Modal
          title="Quick Start"
          description={`${hub.role} workspace`}
          onClose={() => setDialog(null)}
        >
          <ol className="guide-list">
            {instructions[hub.role].map((step) => (
              <li key={step.title}>
                <strong>{step.title}</strong>
                <p>{step.description}</p>
              </li>
            ))}
          </ol>
          <div className="form-footer">
            <Button onClick={() => setDialog(null)}>Close</Button>
          </div>
        </Modal>
      )}
      {dialog === "notifications" && (
        <Modal
          title="Recent Activity"
          description="Recorded team, submission, and evaluation events. Updated every 15 seconds."
          wide
          onClose={() => setDialog(null)}
        >
          {hub.error ? (
            <ErrorState message={hub.error} retry={() => void hub.refresh()} />
          ) : (
            <ActivityTable
              activities={hub.activity}
              markRead
              onNavigate={() => setDialog(null)}
            />
          )}
        </Modal>
      )}
    </div>
  );
}
