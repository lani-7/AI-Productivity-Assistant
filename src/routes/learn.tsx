import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, ChevronDown, Lightbulb, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/brand/network-backdrop";
import { Button } from "@/components/ui/button";
import { calculateSubnet, ipToBinary } from "@/lib/subnet";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Learn IPv4 Subnetting — SubnetAI" },
      {
        name: "description",
        content:
          "Structured beginner to advanced lessons on IPv4 addressing, binary, CIDR, subnet masks, host ranges and VLSM with worked examples.",
      },
      { property: "og:title", content: "Learn IPv4 Subnetting — SubnetAI" },
      {
        property: "og:description",
        content: "Beginner to advanced subnetting lessons with visualisations and mini questions.",
      },
    ],
  }),
  component: LearnPage,
});

type Lesson = {
  level: "Beginner" | "Intermediate" | "Advanced";
  title: string;
  explanation: string;
  example: string;
  visual: React.ReactNode;
  question: string;
  answer: string;
  activity: string;
};

function BinaryStrip({ ip, cidr }: { ip: string; cidr: number }) {
  const bits = ipToBinary(ip).replace(/\./g, "");
  return (
    <div className="mono-tech flex flex-wrap gap-0.5 text-[11px]">
      {bits.split("").map((b, i) => (
        <span
          key={i}
          className={`flex h-6 w-5 items-center justify-center rounded ${
            i < cidr ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
          }`}
        >
          {b}
        </span>
      ))}
    </div>
  );
}

function OctetDiagram() {
  const r = calculateSubnet("192.168.10.0", 24);
  return (
    <div className="mono-tech grid grid-cols-4 gap-2 text-center text-sm">
      {r.networkAddress.split(".").map((o, i) => (
        <div key={i} className="rounded-lg border border-primary/20 bg-primary-soft p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Octet {i + 1}
          </div>
          <div className="text-lg font-semibold text-primary">{o}</div>
          <div className="text-[10px] text-muted-foreground">
            {Number(o).toString(2).padStart(8, "0")}
          </div>
        </div>
      ))}
    </div>
  );
}

function RangeBar({ cidr }: { cidr: number }) {
  const r = calculateSubnet("192.168.10.0", cidr);
  return (
    <div className="space-y-2">
      <div className="flex h-8 overflow-hidden rounded-lg border border-border">
        <div className="flex w-12 items-center justify-center bg-primary text-[10px] text-primary-foreground">
          NET
        </div>
        <div className="mono-tech flex flex-1 items-center justify-center bg-primary-soft text-xs text-primary">
          {r.firstUsable} – {r.lastUsable} ({r.usableHosts} usable)
        </div>
        <div className="flex w-12 items-center justify-center bg-destructive text-[10px] text-destructive-foreground">
          BC
        </div>
      </div>
      <div className="mono-tech flex justify-between text-[11px] text-muted-foreground">
        <span>{r.networkAddress}</span>
        <span>{r.broadcastAddress}</span>
      </div>
    </div>
  );
}

const LESSONS: Lesson[] = [
  {
    level: "Beginner",
    title: "What is an IP address?",
    explanation:
      "An IPv4 address is a 32-bit logical identifier assigned to a network interface. It is written as four decimal octets separated by dots, each octet ranging from 0 to 255. Every address has two parts: a network portion (which network the device belongs to) and a host portion (which device it is on that network).",
    example: "192.168.10.25 — the device number 25 on the network 192.168.10.0.",
    visual: <OctetDiagram />,
    question: "How many bits are there in an IPv4 address?",
    answer: "32 bits — four octets of 8 bits each.",
    activity: "Open the Subnet Calculator and enter your own device's IP address with /24.",
  },
  {
    level: "Beginner",
    title: "IPv4 structure and binary basics",
    explanation:
      "Computers see addresses in binary. Each octet is 8 bits with place values 128, 64, 32, 16, 8, 4, 2, 1. Converting between decimal and binary is the core skill in subnetting: 192 = 11000000 because 128 + 64 = 192.",
    example: "192.168.10.0 → 11000000.10101000.00001010.00000000",
    visual: <BinaryStrip ip="192.168.10.0" cidr={24} />,
    question: "What is 200 in binary?",
    answer: "11001000 (128 + 64 + 8 = 200).",
    activity: "Use 'View in Binary' on the calculator and watch the network bits highlight.",
  },
  {
    level: "Beginner",
    title: "CIDR notation",
    explanation:
      "CIDR (Classless Inter-Domain Routing) notation appends a prefix length to the address. The prefix is the number of leading bits reserved for the network. Everything left over is available for hosts, so a larger prefix means a smaller network.",
    example: "192.168.10.0/26 → 26 network bits, 6 host bits, 64 addresses.",
    visual: <BinaryStrip ip="192.168.10.0" cidr={26} />,
    question: "How many host bits does a /29 have?",
    answer: "3 host bits (32 − 29), giving 8 addresses and 6 usable hosts.",
    activity: "Change the CIDR dropdown from /24 to /30 and watch the usable hosts shrink.",
  },
  {
    level: "Beginner",
    title: "Subnet masks",
    explanation:
      "A subnet mask expresses the same information as the CIDR prefix in dotted-decimal form: all network bits are 1, all host bits are 0. The wildcard mask is the inverse and is used in ACLs and OSPF.",
    example: "/26 → 255.255.255.192, wildcard 0.0.0.63.",
    visual: <BinaryStrip ip="255.255.255.192" cidr={26} />,
    question: "Which mask corresponds to /27?",
    answer: "255.255.255.224 (256 − 32 = 224, block size 32).",
    activity: "Calculate 10.0.0.0/27 and compare the mask with the binary view.",
  },
  {
    level: "Intermediate",
    title: "Network and broadcast addresses",
    explanation:
      "The network address is the first address of the block (all host bits 0) and identifies the subnet itself. The broadcast address is the last address (all host bits 1) and reaches every host in the subnet. Neither can be assigned to a device.",
    example: "In 192.168.10.0/26 the network is 192.168.10.0 and the broadcast is 192.168.10.63.",
    visual: <RangeBar cidr={26} />,
    question: "What is the broadcast address of 172.16.4.0/22?",
    answer: "172.16.7.255 — the block size in the third octet is 4, so the block spans 4.0–7.255.",
    activity: "Enter 172.16.4.0/22 in the calculator and check your answer.",
  },
  {
    level: "Intermediate",
    title: "Usable host ranges and host counts",
    explanation:
      "Total addresses = 2^host bits. Usable hosts = total − 2, because the network and broadcast addresses are reserved. The exceptions are /31 (point-to-point links, RFC 3021) and /32 (single host routes).",
    example: "/26 → 2^6 = 64 total, 62 usable, range .1 to .62.",
    visual: <RangeBar cidr={28} />,
    question: "How many usable hosts does a /28 provide?",
    answer: "14 usable hosts (2^4 = 16, minus network and broadcast).",
    activity: "Enter 50 in 'Required Hosts' and see which prefix SubnetAI recommends.",
  },
  {
    level: "Intermediate",
    title: "Number of subnets and borrowed bits",
    explanation:
      "To split a network you borrow bits from the host portion. Borrowing n bits creates 2^n subnets, each with 2^(remaining host bits) addresses. Block size (256 − the interesting mask octet) tells you where each subnet starts.",
    example: "192.168.10.0/24 split into /26 → 2 borrowed bits → 4 subnets of 64 addresses.",
    visual: (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[0, 64, 128, 192].map((n) => (
          <div key={n} className="mono-tech rounded-lg bg-primary-soft p-3 text-center text-xs">
            <div className="font-semibold text-primary">192.168.10.{n}</div>
            <div className="text-muted-foreground">/26 · 62 hosts</div>
          </div>
        ))}
      </div>
    ),
    question: "How many subnets does /28 create from a /24?",
    answer: "16 subnets (4 borrowed bits, 2^4 = 16), each with 14 usable hosts.",
    activity: "Set Required Subnets to 8 on a /24 and read the generated subnet range table.",
  },
  {
    level: "Advanced",
    title: "VLSM — Variable Length Subnet Masking",
    explanation:
      "VLSM allocates different subnet sizes inside one network so that address space matches real demand. Sort requirements from largest to smallest, choose the smallest prefix that satisfies each requirement, then allocate sequentially on correct block boundaries so subnets never overlap.",
    example:
      "192.168.1.0/24 → Engineering 100 hosts gets /25, Business 50 gets /26, Admin 25 gets /27, IT 10 gets /28.",
    visual: (
      <div className="flex h-8 overflow-hidden rounded-lg text-[10px] text-primary-foreground">
        <div className="flex w-1/2 items-center justify-center bg-primary">/25 Engineering</div>
        <div className="flex w-1/4 items-center justify-center bg-primary/85">/26 Business</div>
        <div className="flex w-[12.5%] items-center justify-center bg-primary/70">/27</div>
        <div className="flex w-[6.25%] items-center justify-center bg-primary/55">/28</div>
        <div className="flex flex-1 items-center justify-center bg-secondary text-muted-foreground">
          free
        </div>
      </div>
    ),
    question: "Why must you allocate the largest requirement first?",
    answer:
      "Because large blocks must start on their own block boundary. Allocating small subnets first fragments the space and can leave no aligned room for the large block.",
    activity: "Run the demo scenario in the VLSM Planner and read the AI explanation.",
  },
  {
    level: "Advanced",
    title: "Network design and efficient allocation",
    explanation:
      "Good design leaves growth headroom (typically 20–30%), reserves point-to-point WAN links as /30 or /31, keeps allocations summarisable (contiguous blocks that can be advertised as one route) and documents every subnet. Efficient allocation reduces routing table size as well as address waste.",
    example: "Reserving 10.10.0.0/16 per campus keeps summarisation simple across a WAN.",
    visual: (
      <div className="mono-tech grid grid-cols-3 gap-2 text-center text-xs">
        {["10.10.0.0/16", "10.20.0.0/16", "10.30.0.0/16"].map((n) => (
          <div key={n} className="rounded-lg border border-primary/20 bg-primary-soft p-3">
            <div className="font-semibold text-primary">{n}</div>
            <div className="text-muted-foreground">campus block</div>
          </div>
        ))}
      </div>
    ),
    question: "Which prefix is best for a router-to-router link?",
    answer: "/30 (2 usable hosts) or /31 on modern equipment supporting RFC 3021.",
    activity: "Add a 2-host 'WAN Link' requirement to the VLSM planner and inspect the result.",
  },
];

function LessonCard({ lesson }: { lesson: Lesson }) {
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="flex items-center gap-3">
          <span className="mono-tech rounded-md bg-primary-soft px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
            {lesson.level}
          </span>
          <span className="font-semibold text-foreground">{lesson.title}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-primary transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="animate-rise space-y-4 border-t border-border px-5 py-5">
          <p className="text-sm leading-relaxed text-muted-foreground">{lesson.explanation}</p>
          <div className="mono-tech rounded-lg bg-secondary p-3 text-[13px] text-primary">
            {lesson.example}
          </div>
          <div className="rounded-xl border border-border p-4">{lesson.visual}</div>
          <div className="rounded-xl border border-primary/20 bg-primary-soft p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Lightbulb className="h-4 w-4" /> Mini question
            </div>
            <p className="mt-1.5 text-sm">{lesson.question}</p>
            {revealed ? (
              <p className="mt-2 flex gap-2 text-sm text-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                {lesson.answer}
              </p>
            ) : (
              <Button size="sm" variant="outline" className="mt-3" onClick={() => setRevealed(true)}>
                Reveal answer
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Try it yourself: </span>
            {lesson.activity}
          </p>
        </div>
      )}
    </div>
  );
}

function LearnPage() {
  const levels = ["Beginner", "Intermediate", "Advanced"] as const;
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Structured curriculum"
        title="Learn Subnetting"
        subtitle="Work from IPv4 fundamentals through to VLSM network design. Every lesson has an explanation, a worked example, a visualisation and a question to test yourself."
        icon={<BookOpen className="h-7 w-7" />}
      />
      {levels.map((level) => (
        <section key={level} className="space-y-3">
          <h2 className="flex items-center gap-3 text-sm font-semibold uppercase tracking-wider text-primary">
            {level}
            <span className="h-px flex-1 bg-border" />
          </h2>
          {LESSONS.filter((l) => l.level === level).map((l) => (
            <LessonCard key={l.title} lesson={l} />
          ))}
        </section>
      ))}
      <div className="gradient-panel flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border p-6">
        <p className="text-sm text-muted-foreground">
          Ready to test what you've learned? Generate a practice set targeted at any of these
          topics.
        </p>
        <Button asChild>
          <Link to="/practice">Start Practice</Link>
        </Button>
      </div>
    </div>
  );
}
