export const TOPICS = [
  "CIDR",
  "Subnet Masks",
  "Network Addresses",
  "Broadcast Addresses",
  "Host Ranges",
  "Number of Hosts",
  "Number of Subnets",
  "VLSM",
] as const;

export type Topic = (typeof TOPICS)[number];

export type Attempt = {
  id: string;
  topic: string;
  difficulty: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  correct: boolean;
  at: number;
};

const KEY = "subnetai.progress.v1";

export function loadAttempts(): Attempt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Attempt[]) : [];
  } catch {
    return [];
  }
}

export function saveAttempt(attempt: Attempt) {
  if (typeof window === "undefined") return;
  const all = [...loadAttempts(), attempt].slice(-500);
  window.localStorage.setItem(KEY, JSON.stringify(all));
  window.dispatchEvent(new Event("subnetai:progress"));
}

export function clearAttempts() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("subnetai:progress"));
}

export type TopicStat = { topic: string; attempted: number; correct: number; accuracy: number };

export type ProgressSummary = {
  attempted: number;
  correct: number;
  accuracy: number;
  topicStats: TopicStat[];
  mastered: number;
  totalTopics: number;
  weakest: TopicStat | null;
  strongest: TopicStat | null;
  recent: Attempt[];
};

export function summarise(attempts: Attempt[]): ProgressSummary {
  const attempted = attempts.length;
  const correct = attempts.filter((a) => a.correct).length;
  const topicStats: TopicStat[] = TOPICS.map((topic) => {
    const rows = attempts.filter((a) => a.topic === topic);
    const c = rows.filter((a) => a.correct).length;
    return {
      topic,
      attempted: rows.length,
      correct: c,
      accuracy: rows.length ? Math.round((c / rows.length) * 100) : 0,
    };
  });
  const practised = topicStats.filter((t) => t.attempted > 0);
  const mastered = topicStats.filter((t) => t.attempted >= 3 && t.accuracy >= 80).length;
  const sorted = [...practised].sort((a, b) => a.accuracy - b.accuracy);
  return {
    attempted,
    correct,
    accuracy: attempted ? Math.round((correct / attempted) * 100) : 0,
    topicStats,
    mastered,
    totalTopics: TOPICS.length,
    weakest: sorted[0] ?? null,
    strongest: sorted[sorted.length - 1] ?? null,
    recent: [...attempts].reverse().slice(0, 8),
  };
}

export function recommendation(s: ProgressSummary): string {
  if (s.attempted === 0)
    return "You haven't attempted any practice yet. Start with a Beginner CIDR set to build your foundation, then move on to network and broadcast addresses.";
  if (s.weakest && s.weakest.accuracy < 70)
    return `Your ${s.strongest?.topic ?? "overall"} accuracy is holding up, but ${s.weakest.topic} is at ${s.weakest.accuracy}% — that is where you'll gain the most marks. Run a focused practice set on ${s.weakest.topic}.`;
  if (s.accuracy >= 85)
    return "Strong performance across the board. Push into Advanced VLSM and network-design scenarios to stretch your understanding.";
  return `You're at ${s.accuracy}% overall. Keep drilling ${s.weakest?.topic ?? "mixed topics"} and try an Intermediate mixed set to consolidate.`;
}
