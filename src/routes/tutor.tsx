import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Bot, Send, User, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/brand/network-backdrop";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { aiTutor } from "@/lib/ai.functions";

export const Route = createFileRoute("/tutor")({
  head: () => ({
    meta: [
      { title: "Ask SubnetAI — Your Networking Tutor" },
      {
        name: "description",
        content:
          "Chat with SubnetAI, an IPv4 networking tutor that explains CIDR, subnet masks, broadcast addresses and VLSM step by step.",
      },
      { property: "og:title", content: "Ask SubnetAI — Your Networking Tutor" },
      {
        property: "og:description",
        content: "Step-by-step IPv4 subnetting explanations from an AI tutor built for students.",
      },
    ],
  }),
  component: TutorPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const PROMPTS = [
  "Why does /26 have 62 usable hosts?",
  "Explain CIDR notation.",
  "How do I calculate a broadcast address?",
  "Explain subnetting like I'm a beginner.",
  "Why is my answer wrong?",
  "Teach me VLSM.",
  "Give me a subnetting example.",
];

function TutorPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm SubnetAI, your networking tutor. Ask me anything about IPv4 addressing, CIDR, subnet masks or VLSM — I'll walk you through the reasoning step by step rather than just handing over an answer.\n\nWhat would you like to work on today?",
    },
  ]);
  const [input, setInput] = useState("");

  const tutorFn = useServerFn(aiTutor);
  const ask = useMutation({
    mutationFn: (msgs: Msg[]) => tutorFn({ data: { messages: msgs } }),
    onSuccess: (d) => setMessages((m) => [...m, { role: "assistant", content: d.text }]),
  });

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || ask.isPending) return;
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    ask.mutate(next);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Conversational networking tutor"
        title="Ask SubnetAI"
        subtitle="Your networking tutor. Step-by-step explanations, worked examples and honest feedback on your mistakes."
        icon={<Bot className="h-7 w-7" />}
      />

      <div className="flex flex-wrap gap-2">
        {PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => send(p)}
            className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-primary transition-colors hover:border-primary/50 hover:bg-primary-soft"
          >
            {p}
          </button>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="surface-dots max-h-[60vh] space-y-4 overflow-y-auto p-4 sm:p-6">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`animate-rise flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  m.role === "user"
                    ? "bg-secondary text-foreground"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {ask.isPending && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-4">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}
          {ask.isError && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {ask.error.message}
            </p>
          )}
        </div>

        <div className="border-t border-border bg-secondary/50 p-3 sm:p-4">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={2}
              placeholder="Ask about CIDR, masks, broadcast addresses, VLSM…"
              className="resize-none bg-card"
            />
            <Button
              onClick={() => send(input)}
              disabled={ask.isPending || !input.trim()}
              className="h-auto px-4"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
            SubnetAI explains and teaches; the calculator and VLSM engine perform the verified
            calculations. Always verify configurations before production deployment.
          </p>
        </div>
      </section>
    </div>
  );
}
