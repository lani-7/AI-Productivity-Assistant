import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Calculator,
  Network,
  BookOpen,
  PencilRuler,
  Bot,
  BarChart3,
  Menu,
  X,
  ShieldAlert,
} from "lucide-react";
import { BrandMark } from "@/components/brand/logo";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/calculator", label: "Subnet Calculator", icon: Calculator },
  { to: "/vlsm", label: "VLSM Planner", icon: Network },
  { to: "/learn", label: "Learn Subnetting", icon: BookOpen },
  { to: "/practice", label: "Practice", icon: PencilRuler },
  { to: "/tutor", label: "AI Tutor", icon: Bot },
  { to: "/progress", label: "Progress", icon: BarChart3 },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  return (
    <nav className="space-y-1">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact: to === "/" }}
          className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
          activeProps={{
            className:
              "!bg-sidebar-accent !text-sidebar-accent-foreground relative before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1 before:rounded-full before:bg-destructive",
          }}
        >
          <Icon className="h-4.5 w-4.5 shrink-0" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function SidebarInner({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  return (
    <div className="relative flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="surface-grid-dark pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative border-b border-sidebar-border px-5 py-5 text-sidebar-primary">
        <BrandMark />
      </div>
      <div className="relative flex-1 overflow-y-auto px-3 py-4">
        <NavLinks onNavigate={onNavigate} />
      </div>
      <div className="relative border-t border-sidebar-border px-5 py-4">
        <p className="flex gap-2 text-[11px] leading-relaxed text-sidebar-foreground/70">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          SubnetAI is an educational tool. Always verify network configurations before deploying
          them in a production environment.
        </p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-secondary/60">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <SidebarInner />
      </aside>

      <div className="flex items-center justify-between border-b border-border bg-sidebar px-4 py-3 text-sidebar-primary lg:hidden">
        <BrandMark compact />
        <button
          aria-label="Open navigation"
          onClick={() => setOpen(true)}
          className="rounded-lg p-2 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/50"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-72 shadow-[var(--shadow-elevated)]">
            <button
              aria-label="Close navigation"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 z-10 rounded-lg p-2 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarInner onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
        <footer className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
          <p className="rounded-xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
            SubnetAI is an educational tool. All calculations are produced by a deterministic
            subnetting engine; AI is used only to explain, teach and generate practice. Always
            verify network configurations before deploying them in a production environment.
          </p>
        </footer>
      </main>
    </div>
  );
}
