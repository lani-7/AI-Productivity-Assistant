import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Network, Plus, Trash2, TriangleAlert, Bot, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/brand/network-backdrop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateVlsmPlan, explainVlsm, type VlsmPlan } from "@/lib/vlsm";
import { aiExplain } from "@/lib/ai.functions";

export const Route = createFileRoute("/vlsm")({
  head: () => ({
    meta: [
      { title: "VLSM Network Planner — SubnetAI" },
      {
        name: "description",
        content:
          "Design an efficient IPv4 network with VLSM: allocate non-overlapping subnets from host requirements and learn the reasoning behind each allocation.",
      },
      { property: "og:title", content: "VLSM Network Planner — SubnetAI" },
      {
        property: "og:description",
        content: "Allocate subnets by host requirement with a verified VLSM engine.",
      },
    ],
  }),
  component: VlsmPage,
});

type Row = { id: number; name: string; hosts: string };

const DEMO: Row[] = [
  { id: 1, name: "Engineering", hosts: "100" },
  { id: 2, name: "Business", hosts: "50" },
  { id: 3, name: "Administration", hosts: "25" },
  { id: 4, name: "IT", hosts: "10" },
];

function VlsmPage() {
  const [baseIp, setBaseIp] = useState("192.168.1.0");
  const [baseCidr, setBaseCidr] = useState("24");
  const [rows, setRows] = useState<Row[]>(DEMO);
  const [plan, setPlan] = useState<VlsmPlan | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const explainFn = useServerFn(aiExplain);
  const ai = useMutation({
    mutationFn: (facts: string) =>
      explainFn({
        data: {
          facts,
          ask: "Explain to a student why SubnetAI chose these subnet sizes and this order of allocation. Teach the logic (sorting largest first, choosing the smallest prefix that fits, avoiding overlap, leaving growth room) rather than restating the table.",
        },
      }),
  });

  function update(id: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function generate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    ai.reset();
    try {
      const reqs = rows.map((r) => {
        const hosts = Number(r.hosts);
        if (!r.name.trim()) throw new Error("Every network requirement needs a name.");
        if (!r.hosts.trim() || !Number.isInteger(hosts) || hosts < 1)
          throw new Error(`"${r.name || "Unnamed"}" needs a whole host count of 1 or more.`);
        return { name: r.name, hosts };
      });
      const p = generateVlsmPlan(baseIp, Number(baseCidr), reqs);
      setPlan(p);
      setReasons(explainVlsm(p));
    } catch (err) {
      setPlan(null);
      setError(err instanceof Error ? err.message : "Could not generate the plan.");
    }
  }

  const facts = plan
    ? `Base network: ${plan.base.networkAddress}/${plan.base.cidr} (${plan.base.totalAddresses} addresses)\n` +
      plan.allocations
        .map(
          (a) =>
            `${a.name}: needs ${a.requiredHosts} hosts -> ${a.network}/${a.cidr}, mask ${a.mask}, ${a.usableHosts} usable, range ${a.firstHost}-${a.lastHost}, broadcast ${a.broadcast}`,
        )
        .join("\n") +
      `\nUtilisation: ${plan.utilisation}% (${plan.freeAddresses} addresses free).`
    : "";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Variable Length Subnet Masking"
        title="VLSM Network Planner"
        subtitle="Design an efficient network by allocating subnets according to host requirements — no overlaps, no wasted address space."
        icon={<Network className="h-7 w-7" />}
      />

      <form
        onSubmit={generate}
        className="gradient-panel rounded-2xl border border-border p-5 shadow-[var(--shadow-card)] sm:p-6"
      >
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <div className="space-y-1.5">
            <Label htmlFor="base">Base Network</Label>
            <Input
              id="base"
              value={baseIp}
              onChange={(e) => setBaseIp(e.target.value)}
              className="mono-tech bg-card"
              placeholder="192.168.1.0"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="basecidr">Base Prefix</Label>
            <select
              id="basecidr"
              value={baseCidr}
              onChange={(e) => setBaseCidr(e.target.value)}
              className="mono-tech h-9 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {Array.from({ length: 25 }, (_, i) => i + 8).map((n) => (
                <option key={n} value={String(n)}>
                  /{n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">
              Network requirements
            </h2>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setRows((rs) => [...rs, { id: Date.now(), name: "", hosts: "" }])
              }
            >
              <Plus className="mr-1 h-4 w-4" /> Add Network
            </Button>
          </div>
          {rows.map((r) => (
            <div key={r.id} className="flex gap-2">
              <Input
                value={r.name}
                onChange={(e) => update(r.id, { name: e.target.value })}
                placeholder="Department name"
                className="bg-card"
              />
              <Input
                value={r.hosts}
                inputMode="numeric"
                onChange={(e) => update(r.id, { hosts: e.target.value })}
                placeholder="Hosts"
                className="mono-tech w-28 bg-card sm:w-36"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${r.name || "requirement"}`}
                onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button type="submit" size="lg" className="font-semibold tracking-wide">
            GENERATE VLSM PLAN
          </Button>
          <Button type="button" variant="outline" onClick={() => setRows(DEMO)}>
            Load demo scenario
          </Button>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </form>

      {plan && (
        <div className="animate-rise space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-primary">Allocation plan</h2>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="mono-tech rounded-full bg-primary-soft px-3 py-1 text-primary">
                  {plan.base.networkAddress}/{plan.base.cidr}
                </span>
                <span className="mono-tech rounded-full bg-secondary px-3 py-1">
                  {plan.utilisation}% utilised
                </span>
                <span className="mono-tech rounded-full bg-secondary px-3 py-1">
                  {plan.freeAddresses} free
                </span>
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-primary-soft text-primary">
                  <tr className="text-left">
                    {[
                      "Department",
                      "Required",
                      "Network",
                      "CIDR",
                      "Mask",
                      "Usable",
                      "Host Range",
                      "Broadcast",
                    ].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-xs font-semibold uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plan.allocations.map((a) => (
                    <tr key={a.name} className="border-t border-border even:bg-secondary/50">
                      <td className="px-4 py-2 font-medium">{a.name}</td>
                      <td className="mono-tech px-4 py-2">{a.requiredHosts}</td>
                      <td className="mono-tech px-4 py-2">{a.network}</td>
                      <td className="mono-tech px-4 py-2 font-semibold text-destructive">
                        /{a.cidr}
                      </td>
                      <td className="mono-tech px-4 py-2">{a.mask}</td>
                      <td className="mono-tech px-4 py-2">{a.usableHosts}</td>
                      <td className="mono-tech px-4 py-2 whitespace-nowrap">
                        {a.firstHost} – {a.lastHost}
                      </td>
                      <td className="mono-tech px-4 py-2">{a.broadcast}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-secondary">
              {plan.allocations.map((a, i) => (
                <div
                  key={a.name}
                  title={`${a.name} — ${a.totalAddresses} addresses`}
                  style={{
                    width: `${(a.totalAddresses / plan.base.totalAddresses) * 100}%`,
                    opacity: 1 - i * 0.14,
                  }}
                  className="bg-primary"
                />
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-primary/20 bg-primary-soft p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-primary">
              <Bot className="h-5 w-5" /> Why did SubnetAI choose these subnets?
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-foreground">
              {reasons.map((r, i) => (
                <li key={i} className="rounded-lg bg-card/80 p-3">
                  {r}
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={ai.isPending}
                onClick={() => ai.mutate(facts)}
              >
                <Sparkles className="mr-1 h-4 w-4" />
                {ai.isPending ? "SubnetAI is thinking…" : "Teach me the VLSM logic"}
              </Button>
              {ai.isError && <p className="mt-3 text-sm text-destructive">{ai.error.message}</p>}
              {ai.data && (
                <p className="mt-3 whitespace-pre-wrap rounded-lg bg-card/80 p-4 text-sm leading-relaxed">
                  {ai.data.text}
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
