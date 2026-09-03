import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { PencilRuler, CheckCircle2, XCircle, TriangleAlert, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/brand/network-backdrop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { aiGeneratePractice, aiFeedback, type PracticeQuestion } from "@/lib/ai.functions";
import { saveAttempt, TOPICS } from "@/lib/progress";

export const Route = createFileRoute("/practice")({
  head: () => ({
    meta: [
      { title: "Subnetting Practice Generator — SubnetAI" },
      {
        name: "description",
        content:
          "Generate personalised IPv4 subnetting practice questions by topic and difficulty, then get AI feedback that explains your mistakes.",
      },
      { property: "og:title", content: "Subnetting Practice Generator — SubnetAI" },
      {
        property: "og:description",
        content: "AI-generated subnetting questions with step-by-step mistake analysis.",
      },
    ],
  }),
  component: PracticePage,
});

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"] as const;

function normalise(v: string) {
  return v.trim().toLowerCase().replace(/\s+/g, "");
}

function PracticePage() {
  const [difficulty, setDifficulty] = useState<string>("Beginner");
  const [topic, setTopic] = useState<string>("Mixed");
  const [count, setCount] = useState("5");
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState<null | { correct: boolean }>(null);

  const genFn = useServerFn(aiGeneratePractice);
  const fbFn = useServerFn(aiFeedback);

  const gen = useMutation({
    mutationFn: () =>
      genFn({ data: { topic, difficulty, count: Number(count) } }),
    onSuccess: (d) => {
      setQuestions(d.questions);
      setIndex(0);
      setAnswer("");
      setChecked(null);
      feedback.reset();
    },
  });

  const feedback = useMutation({
    mutationFn: (vars: {
      question: string;
      userAnswer: string;
      correctAnswer: string;
      correct: boolean;
    }) => fbFn({ data: vars }),
  });

  const q = questions[index];

  function submit() {
    if (!q || !answer.trim()) return;
    const correct = normalise(answer) === normalise(q.answer);
    setChecked({ correct });
    saveAttempt({
      id: q.id,
      topic: q.topic,
      difficulty,
      question: q.question,
      userAnswer: answer,
      correctAnswer: q.answer,
      correct,
      at: Date.now(),
    });
    feedback.mutate({
      question: q.question,
      userAnswer: answer,
      correctAnswer: q.answer,
      correct,
    });
  }

  function next() {
    setAnswer("");
    setChecked(null);
    feedback.reset();
    if (index + 1 < questions.length) setIndex(index + 1);
    else gen.mutate();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI practice generator"
        title="Practice"
        subtitle="Generate subnetting questions targeted at your weak topics, then get feedback that explains exactly where your reasoning went wrong."
        icon={<PencilRuler className="h-7 w-7" />}
      />

      <section className="gradient-panel rounded-2xl border border-border p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Difficulty</Label>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                    difficulty === d
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="topic">Topic</Label>
            <select
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {["Mixed", ...TOPICS].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="count">Number of Questions</Label>
            <select
              id="count"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {["5", "10", "15", "20"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-5">
          <Button
            size="lg"
            className="font-semibold tracking-wide"
            disabled={gen.isPending}
            onClick={() => gen.mutate()}
          >
            {gen.isPending ? "GENERATING…" : "GENERATE PRACTICE"}
          </Button>
        </div>
        {gen.isError && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{gen.error.message}</span>
          </div>
        )}
      </section>

      {gen.isPending && (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          <div className="mx-auto mb-3 h-1.5 w-40 overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
          </div>
          SubnetAI is writing your questions…
        </div>
      )}

      {q && (
        <section className="animate-rise rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-primary px-3 py-1 font-medium text-primary-foreground">
              Question {index + 1} / {questions.length}
            </span>
            <span className="rounded-full bg-primary-soft px-3 py-1 text-primary">{q.topic}</span>
            <span className="rounded-full bg-secondary px-3 py-1">{difficulty}</span>
          </div>
          <p className="mono-tech text-base leading-relaxed text-foreground">{q.question}</p>

          <div className="mt-4 space-y-2">
            {q.options.length > 0 ? (
              q.options.map((opt, i) => (
                <button
                  key={opt + i}
                  disabled={!!checked}
                  onClick={() => setAnswer(opt)}
                  className={`mono-tech flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                    answer === opt
                      ? "border-primary bg-primary-soft"
                      : "border-border bg-card hover:border-primary/40"
                  } ${checked && normalise(opt) === normalise(q.answer) ? "!border-success !bg-success/10" : ""}`}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary text-xs font-semibold">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              ))
            ) : (
              <Input
                value={answer}
                disabled={!!checked}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer (e.g. 62 or 192.168.10.63)"
                className="mono-tech"
              />
            )}
          </div>

          {!checked ? (
            <Button className="mt-4" onClick={submit} disabled={!answer.trim()}>
              Submit Answer
            </Button>
          ) : (
            <div className="mt-5 space-y-4">
              <div
                className={`flex items-start gap-3 rounded-xl border p-4 ${
                  checked.correct
                    ? "border-success/40 bg-success/10"
                    : "border-destructive/30 bg-destructive/5"
                }`}
              >
                {checked.correct ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                ) : (
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                )}
                <div className="text-sm">
                  <div className="font-semibold">
                    {checked.correct ? "Correct!" : "Not quite."}
                  </div>
                  {!checked.correct && (
                    <div className="mono-tech mt-1 space-y-0.5 text-[13px]">
                      <div>Your answer: {answer}</div>
                      <div>Correct answer: {q.answer}</div>
                    </div>
                  )}
                  <p className="mt-2 leading-relaxed text-muted-foreground">{q.explanation}</p>
                </div>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary-soft p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Sparkles className="h-4 w-4" /> SubnetAI feedback
                </h3>
                {feedback.isPending && (
                  <p className="mt-2 text-sm text-muted-foreground">Analysing your reasoning…</p>
                )}
                {feedback.isError && (
                  <p className="mt-2 text-sm text-destructive">{feedback.error.message}</p>
                )}
                {feedback.data && (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                    {feedback.data.text}
                  </p>
                )}
              </div>

              <Button onClick={next}>
                {index + 1 < questions.length ? "Next Question" : "Try Another Set"}
              </Button>
            </div>
          )}
        </section>
      )}

      {!q && !gen.isPending && (
        <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-10 text-center">
          <div className="surface-dots absolute inset-0 opacity-60" />
          <div className="relative">
            <PencilRuler className="mx-auto h-8 w-8 text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">
              Choose a topic and difficulty, then generate a set to begin. Every attempt feeds your
              progress tracking.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
