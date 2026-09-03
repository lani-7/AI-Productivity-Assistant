import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Calculator, Brain, Binary, TriangleAlert, Table2, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/brand/network-backdrop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  calculateSubnet,
  cidrForHosts,
  cidrForSubnets,
  enumerateSubnets,
  explainSteps,
  ipToBinary,
  type SubnetResult,
  type Step,
  type SubnetRow,
} from "@/lib/subnet";
import { aiExplain } from "@/lib/ai.functions";

export const Route = createFileRoute("/calculator")({
  head: () => ({
    meta: [
      { title: "IPv4 Subnet Calculator — SubnetAI" },
      {
        name: "description",
        content:
          "Calculate network address, broadcast address, subnet mask, wildcard mask and usable host ranges, with step-by-step explanations.",
      },
      { property: "og:title", content: "IPv4 Subnet Calculator — SubnetAI" },
      {
        property: "og:description",
        content: "Deterministic IPv4 subnetting with AI-powered step-by-step teaching.",
      },
    ],
  }),
  component: CalculatorPage,
});

function ResultCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-4 transition-shadow hover:shadow-[var(--shadow-card)] ${
        accent ? "border-destructive/30 bg-destructive/5" : "border-border bg-card"
      }`}
    >
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={`mono-tech mt-1.5 text-lg font-semibold break-all ${accent ? "text-destructive" : "text-primary"}`}
      >
        {value}
      </div>
    </div>
  );
}

function BinaryLine({ ip, cidr, label }: { ip: string; cidr: number; label: string }) {
  const bits = ipToBinary(ip).replace(/\./g, "");
  const groups: React.ReactNode[] = [];
  for (let i = 0; i < 32; i++) {
    const isNetwork = i < cidr;
    groups.push(
      <span
        key={i}
        className={
          isNetwork ? "text-primary-foreground/95" : "text-primary-foreground/45 line-through/0"
        }
      >
        {bits[i]}
      </span>,
    );
    if ((i + 1) % 8 === 0 && i !== 31)
      groups.push(
        <span key={`d${i}`} className="text-primary-foreground/40">
          .
        </span>,
      );
  }
  return (
    <div className="space-y-1">
      <div className="text-[11px] uppercase tracking-wider text-primary-foreground/60">{label}</div>
      <div className="mono-tech overflow-x-auto whitespace-nowrap text-sm sm:text-base">
        {groups}
      </div>
    </div>
  );
}

function CalculatorPage() {
  const [ip, setIp] = useState("192.168.10.0");
  const [cidr, setCidr] = useState("26");
  const [hosts, setHosts] = useState("");
  const [subnets, setSubnets] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubnetResult | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [rows, setRows] = useState<SubnetRow[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [showSteps, setShowSteps] = useState(false);
  const [showBinary, setShowBinary] = useState(false);

  const explainFn = useServerFn(aiExplain);
  const explain = useMutation({
    mutationFn: (facts: string) =>
      explainFn({
        data: {
          facts,
          ask: "Explain this calculation to a networking student in a few short paragraphs. Cover why the prefix produces this many hosts, how the block size determines the range, and one practical tip. Do not restate every number as a list.",
        },
      }),
  });

  function onCalculate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    explain.reset();
    try {
      const prefix = Number(cidr);
      if (!ip.trim()) throw new Error("Please enter an IPv4 address.");
      if (cidr.trim() === "") throw new Error("Please enter a CIDR prefix.");
      const base = calculateSubnet(ip, prefix);
      const localNotes: string[] = [];
      let childCidr = prefix;

      if (hosts.trim()) {
        const h = Number(hosts);
        if (!Number.isInteger(h) || h < 1)
          throw new Error("Required hosts must be a whole number of 1 or more.");
        const needed = cidrForHosts(h);
        if (needed < prefix)
          throw new Error(
            `⚠️ ${h} hosts cannot fit inside a /${prefix}. You would need at least a /${needed}.`,
          );
        childCidr = Math.max(childCidr, needed);
        localNotes.push(
          `${h} required hosts need a /${needed} (${Math.pow(2, 32 - needed) - 2} usable addresses).`,
        );
      }
      if (subnets.trim()) {
        const s = Number(subnets);
        if (!Number.isInteger(s) || s < 1)
          throw new Error("Required subnets must be a whole number of 1 or more.");
        const needed = cidrForSubnets(prefix, s);
        childCidr = Math.max(childCidr, needed);
        localNotes.push(
          `${s} required subnets need ${needed - prefix} borrowed bits → /${needed} subnets of ${Math.pow(2, 32 - needed)} addresses each.`,
        );
      }
      if (hosts.trim() && subnets.trim()) {
        const hCidr = cidrForHosts(Number(hosts));
        const sCidr = cidrForSubnets(prefix, Number(subnets));
        if (sCidr > hCidr)
          throw new Error(
            `⚠️ ${subnets} subnets each with ${hosts} hosts cannot fit inside ${base.networkAddress}/${prefix}. Try a larger network or fewer subnets.`,
          );
        childCidr = hCidr;
      }

      setResult(base);
      setSteps(explainSteps(base));
      setNotes(localNotes);
      const tableCidr = childCidr > prefix ? childCidr : Math.min(prefix + 2, 32);
      setRows(prefix < 32 ? enumerateSubnets(base.networkAddress, prefix, tableCidr, 32) : []);
      setShowSteps(false);
      setShowBinary(false);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  const facts = result
    ? `Input: ${result.ip}/${result.cidr}
Network address: ${result.networkAddress}
Broadcast address: ${result.broadcastAddress}
Subnet mask: ${result.subnetMask}
Wildcard mask: ${result.wildcardMask}
Total addresses: ${result.totalAddresses}
Usable hosts: ${result.usableHosts}
Usable range: ${result.firstUsable} - ${result.lastUsable}
Host bits: ${result.hostBits}, block size: ${result.blockSize}, class ${result.ipClass}, ${result.isPrivate ? "private (RFC1918)" : "public"}`
    : "";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Deterministic subnetting engine"
        title="Subnet Calculator"
        subtitle="Calculate network addresses, broadcast addresses, subnet masks and host ranges — then learn exactly how the answer was derived."
        icon={<Calculator className="h-7 w-7" />}
      />

      <form
        onSubmit={onCalculate}
        className="gradient-panel rounded-2xl border border-border p-5 shadow-[var(--shadow-card)] sm:p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="ip">IPv4 Address</Label>
            <Input
              id="ip"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="192.168.10.0"
              className="mono-tech bg-card"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cidr">CIDR Prefix</Label>
            <select
              id="cidr"
              value={cidr}
              onChange={(e) => setCidr(e.target.value)}
              className="mono-tech h-9 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {Array.from({ length: 33 }, (_, i) => i).map((n) => (
                <option key={n} value={String(n)}>
                  /{n}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hosts">Required Hosts (optional)</Label>
            <Input
              id="hosts"
              value={hosts}
              inputMode="numeric"
              onChange={(e) => setHosts(e.target.value)}
              placeholder="50"
              className="mono-tech bg-card"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="subnets">Required Subnets (optional)</Label>
            <Input
              id="subnets"
              value={subnets}
              inputMode="numeric"
              onChange={(e) => setSubnets(e.target.value)}
              placeholder="4"
              className="mono-tech bg-card"
            />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" className="font-semibold tracking-wide">
            CALCULATE SUBNET
          </Button>
          <span className="text-xs text-muted-foreground">
            Works for any valid IPv4 address and prefix — nothing is hard-coded.
          </span>
        </div>
        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </form>

      {result && (
        <div className="animate-rise space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-primary">Subnet Information</h2>
              <span className="mono-tech rounded-full bg-primary-soft px-3 py-1 text-xs text-primary">
                Class {result.ipClass} · {result.isPrivate ? "Private" : "Public"}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <ResultCard label="Network Address" value={result.networkAddress} />
              <ResultCard label="CIDR" value={`/${result.cidr}`} />
              <ResultCard label="Subnet Mask" value={result.subnetMask} />
              <ResultCard label="Wildcard Mask" value={result.wildcardMask} />
              <ResultCard label="Total Addresses" value={String(result.totalAddresses)} />
              <ResultCard label="Usable Hosts" value={String(result.usableHosts)} />
              <ResultCard label="First Usable Address" value={result.firstUsable ?? "—"} />
              <ResultCard label="Last Usable Address" value={result.lastUsable ?? "—"} />
              <ResultCard label="Broadcast Address" value={result.broadcastAddress} accent />
            </div>
            {notes.length > 0 && (
              <ul className="mt-4 space-y-1 rounded-lg bg-primary-soft p-4 text-sm text-primary">
                {notes.map((n) => (
                  <li key={n}>• {n}</li>
                ))}
              </ul>
            )}
            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={() => setShowSteps((v) => !v)} variant="default">
                <Brain className="mr-1 h-4 w-4" /> Explain This Calculation
              </Button>
              <Button onClick={() => setShowBinary((v) => !v)} variant="outline">
                <Binary className="mr-1 h-4 w-4" /> View in Binary
              </Button>
              <Button asChild variant="ghost">
                <Link to="/practice">Practice This Topic →</Link>
              </Button>
            </div>
          </section>

          {showSteps && (
            <section className="animate-rise rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-primary">
                <Brain className="h-5 w-5" /> Step-by-step calculation
              </h2>
              <ol className="space-y-3">
                {steps.map((s, i) => (
                  <li
                    key={s.title}
                    className="relative rounded-xl border border-border bg-secondary/60 p-4 pl-12"
                  >
                    <span className="mono-tech absolute left-4 top-4 flex h-6 w-6 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
                      {i + 1}
                    </span>
                    <div className="font-semibold text-foreground">{s.title}</div>
                    <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                      {s.lines.map((l) => (
                        <p key={l} className="mono-tech text-[13px] leading-relaxed">
                          {l}
                        </p>
                      ))}
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-5 rounded-xl border border-primary/20 bg-primary-soft p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Sparkles className="h-4 w-4" /> AI deepening
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={explain.isPending}
                    onClick={() => explain.mutate(facts)}
                  >
                    {explain.isPending ? "SubnetAI is thinking…" : "Ask SubnetAI to elaborate"}
                  </Button>
                </div>
                {explain.isError && (
                  <p className="mt-3 text-sm text-destructive">{explain.error.message}</p>
                )}
                {explain.data && (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {explain.data.text}
                  </p>
                )}
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Numbers above come from the deterministic engine; the AI only explains them.
                </p>
              </div>
            </section>
          )}

          {showBinary && (
            <section className="gradient-hero animate-rise relative overflow-hidden rounded-2xl p-5 text-primary-foreground shadow-[var(--shadow-elevated)] sm:p-6">
              <div className="surface-grid-dark absolute inset-0 opacity-50" />
              <div className="relative space-y-4">
                <h2 className="text-lg font-semibold">
                  Binary view — {result.ip}/{result.cidr}
                </h2>
                <div className="flex flex-wrap gap-4 text-[11px] uppercase tracking-wider">
                  <span className="rounded-full bg-primary-foreground/20 px-3 py-1">
                    Network bits ({result.networkBits})
                  </span>
                  <span className="rounded-full bg-primary-foreground/10 px-3 py-1 opacity-70">
                    Host bits ({result.hostBits})
                  </span>
                </div>
                <BinaryLine ip={result.ip} cidr={result.cidr} label="IP address" />
                <BinaryLine ip={result.subnetMask} cidr={32} label="Subnet mask" />
                <BinaryLine ip={result.networkAddress} cidr={result.cidr} label="Network address" />
                <BinaryLine
                  ip={result.broadcastAddress}
                  cidr={result.cidr}
                  label="Broadcast address"
                />
                <p className="text-xs opacity-75">
                  Bright digits are the network portion fixed by the /{result.cidr} prefix; dimmed
                  digits are host bits that vary inside the subnet.
                </p>
              </div>
            </section>
          )}

          {rows.length > 0 && (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
              <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-primary">
                <Table2 className="h-5 w-5" /> Subnet range table
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Subnets generated inside {result.networkAddress}/{result.cidr} (showing the first{" "}
                {rows.length}).
              </p>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[620px] text-sm">
                  <thead className="bg-primary-soft text-primary">
                    <tr className="text-left">
                      {["Subnet", "Network", "First Host", "Last Host", "Broadcast"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-xs font-semibold uppercase">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="mono-tech">
                    {rows.map((r) => (
                      <tr key={r.index} className="border-t border-border even:bg-secondary/50">
                        <td className="px-4 py-2 font-semibold text-destructive">{r.index}</td>
                        <td className="px-4 py-2">{r.network}</td>
                        <td className="px-4 py-2">{r.firstHost}</td>
                        <td className="px-4 py-2">{r.lastHost}</td>
                        <td className="px-4 py-2">{r.broadcast}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
