import type { Role } from "../types";

export type Permission =
  | "teams.read"
  | "teams.manage"
  | "hackathons.manage"
  | "submissions.manage"
  | "evaluations.read"
  | "evaluations.submit"
  | "scoring.manage";
const grants: Record<Role, readonly Permission[]> = {
  Organizer: [
    "teams.read",
    "teams.manage",
    "hackathons.manage",
    "submissions.manage",
    "evaluations.read",
    "scoring.manage",
  ],
  Participant: ["teams.read", "teams.manage", "submissions.manage"],
  Judge: ["evaluations.read", "evaluations.submit"],
};
export const can = (role: Role, permission: Permission) =>
  grants[role].includes(permission);
