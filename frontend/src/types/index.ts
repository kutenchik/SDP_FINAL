export type HackathonStatus =
  | "DRAFT"
  | "ACTIVE"
  | "JUDGING"
  | "COMPLETED"
  | "CANCELLED";
export type Strategy = "STANDARD" | "OLYMPIC" | "WEIGHTED";
export type Role = "Organizer" | "Participant" | "Judge";
export interface Hackathon {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  submissionDeadline: string;
  status: HackathonStatus;
  scoringStrategy: Strategy;
  createdAt: string;
}
export interface Participant {
  id: number;
  fullName: string;
  email: string;
  role: string;
}
export interface Team {
  id: number;
  name: string;
  description: string;
  technologyStack: string;
  hackathonId: number;
  status: "ACTIVE" | "FINALIST" | "WITHDRAWN";
  createdAt: string;
  participants: Participant[];
}
export interface Task {
  id: number;
  title: string;
  description: string;
  taskType: "CODING" | "PITCH" | "QUIZ";
  deadline: string;
  hackathonId: number;
  durationMinutes: number | null;
  questionCount: number | null;
}
export interface Criterion {
  id: number;
  name: string;
  description: string;
  weight: number;
  maxScore: number;
}
export interface Submission {
  id: number;
  title: string;
  description: string;
  repositoryUrl: string;
  presentationUrl: string | null;
  demoUrl: string | null;
  teamId: number;
  teamName: string;
  hackathonId: number;
  taskId: number | null;
  submittedAt: string;
  status: "SUBMITTED" | "EVALUATED";
  latePenalty: boolean;
  earlyBonus: boolean;
  originalityBonus: boolean;
  evaluationCount: number;
}
export interface Evaluation {
  id: number;
  submissionId: number;
  judgeName: string;
  scores: Record<string, number>;
  comment: string;
  evaluatedAt: string;
}
export interface Activity {
  id: number;
  eventType: string;
  message: string;
  hackathonId: number;
  createdAt: string;
  read: boolean;
}
export interface Ranking {
  rank: number;
  submissionId: number;
  teamId: number;
  teamName: string;
  title: string;
  judgeCount: number;
  baseScore: number;
  adjustments: { label: string; amount: number }[];
  finalScore: number;
  scored: boolean;
}
export interface Leaderboard {
  hackathonId: number;
  strategy: Strategy;
  rankings: Ranking[];
}
export interface Dashboard {
  activeHackathons: number;
  teams: number;
  submissions: number;
  pendingEvaluations: number;
  hackathons: Hackathon[];
  activity: Activity[];
}
