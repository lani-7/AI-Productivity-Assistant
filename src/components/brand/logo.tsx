export function SubnetLogo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="SubnetAI logo">
      <rect x="1" y="1" width="46" height="46" rx="12" fill="currentColor" opacity="0.12" />
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.85">
        <path d="M24 14v8M24 26v8M24 24H13v6M24 24h11v6" />
      </g>
      <rect x="17" y="7" width="14" height="8" rx="2.5" fill="currentColor" />
      <rect x="7" y="30" width="12" height="8" rx="2.5" fill="currentColor" opacity="0.7" />
      <rect x="29" y="30" width="12" height="8" rx="2.5" fill="var(--destructive)" />
      <circle cx="24" cy="24" r="3.2" fill="var(--destructive)" />
    </svg>
  );
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <SubnetLogo className="h-9 w-9 shrink-0" />
      <div className="leading-tight">
        <div className="text-base font-bold tracking-tight">
          Subnet<span className="text-destructive">AI</span>
        </div>
        {!compact && (
          <div className="mono-tech text-[10px] uppercase tracking-[0.18em] opacity-70">
            Simplify.Subnet.Connect
          </div>
        )}
      </div>
    </div>
  );
}
