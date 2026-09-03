import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarChart3, Sparkles, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/brand/network-backdrop";
import { Button } from "@/components/ui/button";
import {
  loadAttempts,
  summarise,
  recommendation,
  clearAttempts,
  type ProgressSummary,
} from "@/lib/progress";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Your Subnetting Progress — SubnetAI" },
      {
        name: "description",
        content:
          "Track subnetting accuracy by topic, review your practice history and get AI recommendations on what to study next.",
      },
      { property: "og:title", content: "Your Subnetting Progress — SubnetAI" },
      {
        property: "og:description",
        content: "Topic-level accuracy tracking and personalised study recommendations.",
      },
    ],
  }),
  component: ProgressPage,
});

export function useProgress(): ProgressSummary {
  const [summary, setSummary] = useState<ProgressSummary>(() => summarise([]));
  useEffect(() => {
    const refresh = () => setSummary(summarise(loadAttempts()));
    refresh();
    window.addEventListener("subnetai:progress", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("subnetai:progress", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return summary;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mono-tech mt-1 text-2xl font-bold text-primary">{value}</div>
    </div>
  );
}

function ProgressPage() {
  const s = useProgress();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learning analytics"
        title="Progress"
        subtitle="Every practice attempt is scored against the deterministic engine and tracked per topic so you can see exactly where to focus."
        icon={<BarChart3 className="h-7 w-7" />}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Questions Attempted" value={String(s.attempted)} />
        <Stat label="Correct" value={String(s.correct)} />
        <Stat label="Accuracy" value={`${s.accuracy}%`} />
        <Stat label="Topics Mastered" value={`${s.mastered}/${s.totalTopics}`} />
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-primary">Topic performance</h2>
        <div className="space-y-3">
          {s.topicStats.map((t) => (
            <div key={t.topic}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">{t.topic}</span>
                <span className="mono-tech text-xs text-muted-foreground">
                  {t.attempted ? `${t.correct}/${t.attempted} · ${t.accuracy}%` : "not attempted"}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    t.accuracy >= 80
                      ? "bg-primary"
                      : t.accuracy >= 60
                        ? "bg-chart-2"
                        : "bg-destructive"
                  }`}
                  style={{ width: `${t.attempted ? t.accuracy : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-primary/20 bg-primary-soft p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-primary">
          <Sparkles className="h-5 w-5" /> AI Recommendation
        </h2>
        <p className="mt-2 text-sm leading-relaxed">{recommendation(s)}</p>
        <Button asChild className="mt-4">
          <Link to="/practice">Practise {s.weakest?.topic ?? "Subnetting"}</Link>
        </Button>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary">Practice history</h2>
          {s.attempted > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => clearAttempts()}
            >
              <Trash2 className="mr-1 h-4 w-4" /> Reset
            </Button>
          )}
        </div>
        {s.recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No attempts yet — generate a practice set to start building your history.
          </p>
        ) : (
          <ul className="space-y-2">
            {s.recent.map((a) => (
              <li
                key={a.id + a.at}
                className="flex items-start gap-3 rounded-xl border border-border bg-secondary/40 p-3 text-sm"
              >
                {a.correct ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                )}
                <div className="min-w-0">
                  <p className="mono-tech truncate text-[13px]">{a.question}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {a.topic} · {a.difficulty} · your answer:{" "}
                    <span className="mono-tech">{a.userAnswer}</span>
                    {!a.correct && (
                      <>
                        {" "}
                        · correct: <span className="mono-tech">{a.correctAnswer}</span>
                      </>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
