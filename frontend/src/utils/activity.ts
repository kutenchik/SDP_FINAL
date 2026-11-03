import type { Activity, Hackathon, Submission } from "../types";
export interface ActivityDetails {
  actor: string;
  action: string;
  subject: string;
  href: string;
  hackathon: string;
}
export function activityDetails(
  activity: Activity,
  hackathons: Hackathon[],
  submissions: Submission[],
): ActivityDetails {
  const event = hackathons.find((h) => h.id === activity.hackathonId);
  const base = {
    actor: "Not recorded",
    action: activity.message,
    subject: event?.name || `Hackathon #${activity.hackathonId}`,
    href: `/hackathons/${activity.hackathonId}`,
    hackathon: event?.name || "",
  };
  const separator =
    activity.eventType === "SubmissionCreated"
      ? " submitted "
      : activity.eventType === "EvaluationSubmitted"
        ? " evaluated "
        : null;
  if (separator) {
    const project = submissions
      .filter((s) => s.hackathonId === activity.hackathonId)
      .sort((a, b) => b.title.length - a.title.length)
      .find((s) => activity.message.endsWith(`${separator}${s.title}.`));
    if (project) {
      const suffix = `${separator}${project.title}.`;
      return {
        ...base,
        actor: activity.message.slice(0, -suffix.length),
        action:
          activity.eventType === "SubmissionCreated"
            ? "Submitted project"
            : "Submitted evaluation",
        subject: project.title,
        href: `/submissions?submissionId=${project.id}`,
      };
    }
    // Historical messages remain visible when the related project has been renamed.
    const pieces = activity.message.split(separator);
    if (pieces.length === 2)
      return {
        ...base,
        actor: pieces[0],
        action:
          activity.eventType === "SubmissionCreated"
            ? "Submitted project"
            : "Submitted evaluation",
        subject: pieces[1].replace(/\.$/, ""),
      };
  }
  if (activity.eventType === "TeamStatusChanged")
    return {
      ...base,
      action: "Changed team status",
      subject: activity.message,
    };
  return base;
}
