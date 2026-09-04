import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Calculator,
  Network,
  PencilRuler,
  Bot,
  ArrowRight,
  Sparkles,
  Activity,
} from "lucide-react";
import { NetworkBackdrop } from "@/components/brand/network-backdrop";
import { SubnetLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { recommendation } from "@/lib/progress";
import { useProgress } from "./progress";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SubnetAI — AI-Powered IPv4 Subnetting Tutor" },
      {
        name: "description",
        content:
          "SubnetAI combines a deterministic IPv4 subnetting engine with an AI networking tutor: calculate subnets, plan VLSM networks, practise and track progress.",
      },
      { property: "og:title", content: "SubnetAI — AI-Powered IPv4 Subnetting Tutor" },
      {
        property: "og:description",
        content: "Simplify.Subnet.Connect — calculate, understand, practise and improve.",
      },
    ],
  }),
  component: Dashboard,
});

const FEATURES = [
  {
    to: "/calculator",
    icon: Calculator,
    title: "Subnet Calculator",
    text: "Calculate network addresses, broadcast addresses, subnet masks and host ranges.",
    cta: "Calculate Now",
  },
  {
    to: "/vlsm",
    icon: Network,
    title: "VLSM Planner",
    text: "Design efficient networks based on different host requirements.",
    cta: "Plan Network",
  },
  {
    to: "/practice",
    icon: PencilRuler,
    title: "Practice",
    text: "Generate subnetting questions and test your knowledge.",
    cta: "Start Practice",
  },
  {
    to: "/tutor",
    icon: Bot,
    title: "AI Tutor",
    text: "Ask questions and get step-by-step networking explanations.",
    cta: "Ask SubnetAI",
  },
] as const;

function Dashboard() {
  const s = useProgress();

  return (
    <div className="space-y-6">
      <section className="gradient-hero relative overflow-hidden rounded-3xl px-6 py-12 text-primary-foreground shadow-[var(--shadow-elevated)] sm:px-10 sm:py-16">
        <div className="surface-grid-dark absolute inset-0 opacity-60" />
        <NetworkBackdrop />
        <div className="relative max-w-2xl">
          <div className="mb-5 flex items-center gap-3">
            <SubnetLogo className="h-12 w-12" />
            <span className="mono-tech rounded-full border border-primary-foreground/25 px-3 py-1 text-[11px] uppercase tracking-[0.2em]">
              IPv4 · CIDR · VLSM · AI
            </span>
          </div>
          <h1 className="text-3xl font-bold leading-tight sm:text-5xl">Welcome to SubnetAI</h1>
          <p className="mono-tech mt-3 text-base tracking-wide text-primary-foreground/85 sm:text-lg">
            Simplify.Subnet.Connect
          </p>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-primary-foreground/80 sm:text-base">
            A deterministic subnetting engine paired with an AI networking tutor. Calculate the
            answer, understand the reasoning, practise the concept and track your improvement.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to="/calculator">
                Open Calculator <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link to="/tutor">Ask SubnetAI</Link>
            </Button>
          </div>
          <p className="mono-tech mt-6 text-[11px] uppercase tracking-[0.18em] text-primary-foreground/60">
            Calculate → Understand → Practise → Improve
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map(({ to, icon: Icon, title, text, cta }) => (
          <Link
            key={to}
            to={to}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-elevated)]"
          >
            <div className="surface-dots absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-primary">{title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-destructive">
                {cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-primary">
            <Activity className="h-5 w-5" /> Your Progress
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Questions Attempted", String(s.attempted)],
              ["Correct", String(s.correct)],
              ["Accuracy", `${s.accuracy}%`],
              ["Topics Mastered", `${s.mastered}/${s.totalTopics}`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-secondary p-3">
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {label}
                </div>
                <div className="mono-tech mt-1 text-xl font-bold text-primary">{value}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-2.5">
            {s.topicStats.slice(0, 5).map((t) => (
              <div key={t.topic}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium">{t.topic}</span>
                  <span className="mono-tech text-muted-foreground">
                    {t.attempted ? `${t.accuracy}%` : "—"}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700"
                    style={{ width: `${t.attempted ? t.accuracy : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <Button asChild variant="ghost" className="mt-4 px-0 text-primary">
            <Link to="/progress">
              View full progress <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary-soft p-5 sm:p-6">
          <NetworkBackdrop variant="light" className="opacity-40" />
          <div className="relative">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-primary">
              <Sparkles className="h-5 w-5" /> Recommended For You
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-foreground">{recommendation(s)}</p>
            <Button asChild className="mt-5">
              <Link to="/practice">Practise {s.weakest?.topic ?? "Subnetting"}</Link>
            </Button>
            <p className="mt-4 text-[11px] text-muted-foreground">
              Recommendations are derived from your own practice performance, stored on this
              device.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
