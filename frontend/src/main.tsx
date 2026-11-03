import React, { Component, lazy, Suspense } from "react";
import type { ReactNode } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { HubProvider } from "./hooks/useHub";
import { Layout } from "./components/Layout";
import { Loading } from "./components/ui";
import { RequirePermission } from "./components/RequirePermission";
import "./styles.css";
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Hackathons = lazy(() => import("./pages/Hackathons"));
const HackathonDetail = lazy(() => import("./pages/HackathonDetail"));
const Teams = lazy(() => import("./pages/Teams"));
const Submissions = lazy(() => import("./pages/Submissions"));
const Evaluation = lazy(() => import("./pages/Evaluation"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="fatal-error">
        <h1>Unable to load page</h1>
        <p>Reload the application to try again.</p>
        <button
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          Reload workspace
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
const root: ReturnType<typeof ReactDOM.createRoot> =
  import.meta.hot?.data.root ??
  ReactDOM.createRoot(document.getElementById("root")!);
if (import.meta.hot) import.meta.hot.data.root = root;
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <HubProvider>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="hackathons" element={<Hackathons />} />
                <Route path="hackathons/:id" element={<HackathonDetail />} />
                <Route
                  path="teams"
                  element={
                    <RequirePermission permission="teams.read">
                      <Teams />
                    </RequirePermission>
                  }
                />
                <Route path="submissions" element={<Submissions />} />
                <Route
                  path="evaluation"
                  element={
                    <RequirePermission permission="evaluations.read">
                      <Evaluation />
                    </RequirePermission>
                  }
                />
                <Route path="leaderboard" element={<Leaderboard />} />
                <Route
                  path="*"
                  element={
                    <div className="empty-state">
                      <h1>Page not found</h1>
                      <p>The requested page does not exist.</p>
                      <Link className="btn btn-primary" to="/">
                        Back to Dashboard
                      </Link>
                    </div>
                  }
                />
              </Route>
            </Routes>
          </Suspense>
        </HubProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
