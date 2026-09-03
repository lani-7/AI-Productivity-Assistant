type Props = { className?: string; variant?: "dark" | "light" };

/** Subtle topology / packet-flow illustration used behind headers and heroes. */
export function NetworkBackdrop({ className = "", variant = "dark" }: Props) {
  const stroke = variant === "dark" ? "#FFFFFF" : "#003B7A";
  const nodes = [
    [80, 60],
    [220, 120],
    [360, 55],
    [500, 140],
    [640, 70],
    [760, 150],
    [150, 210],
    [330, 245],
    [520, 225],
    [700, 250],
  ] as const;
  const links: Array<[number, number]> = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [0, 6],
    [6, 7],
    [1, 7],
    [7, 8],
    [3, 8],
    [8, 9],
    [5, 9],
  ];

  return (
    <svg
      viewBox="0 0 800 300"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    >
      <g stroke={stroke} strokeWidth="1" opacity={variant === "dark" ? 0.28 : 0.18}>
        {links.map(([a, b], i) => {
          const na = nodes[a]!;
          const nb = nodes[b]!;
          return <line key={i} x1={na[0]} y1={na[1]} x2={nb[0]} y2={nb[1]} />;
        })}
      </g>
      <g stroke="#C8102E" strokeWidth="1.6" strokeLinecap="round" opacity="0.75">
        {[
          [0, 1],
          [3, 8],
          [4, 5],
        ].map(([a, b], i) => {
          const na = nodes[a as number]!;
          const nb = nodes[b as number]!;
          return (
            <line
              key={i}
              x1={na[0]}
              y1={na[1]}
              x2={nb[0]}
              y2={nb[1]}
              strokeDasharray="6 234"
              style={{ animation: `packet-flow ${4 + i}s linear infinite` }}
            />
          );
        })}
      </g>
      <g fill={stroke}>
        {nodes.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={3}
            opacity={0.5}
            style={{ animation: `node-pulse ${3 + (i % 4)}s ease-in-out ${i * 0.3}s infinite` }}
          />
        ))}
      </g>
      <g
        fill={stroke}
        opacity={variant === "dark" ? 0.3 : 0.22}
        fontSize="11"
        fontFamily="ui-monospace, monospace"
      >
        <text x="96" y="48">
          10.0.0.0/8
        </text>
        <text x="374" y="42">
          192.168.10.0/26
        </text>
        <text x="654" y="58">
          172.16.4.0/22
        </text>
        <text x="160" y="232">
          255.255.255.192
        </text>
        <text x="536" y="248">
          /30 · p2p link
        </text>
      </g>
      <g
        fill={stroke}
        opacity={variant === "dark" ? 0.14 : 0.1}
        fontSize="10"
        fontFamily="ui-monospace, monospace"
      >
        <text x="24" y="288">
          11000000.10101000.00001010.00000000
        </text>
        <text x="470" y="288">
          11111111.11111111.11111111.11000000
        </text>
      </g>
      <g stroke={stroke} opacity={variant === "dark" ? 0.22 : 0.14} strokeWidth="1" fill="none">
        <rect x="600" y="180" width="26" height="16" rx="3" />
        <rect x="632" y="180" width="26" height="16" rx="3" />
        <rect x="664" y="180" width="26" height="16" rx="3" />
        <rect x="696" y="180" width="26" height="16" rx="3" />
      </g>
    </svg>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  icon,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="gradient-hero relative overflow-hidden rounded-2xl px-6 py-8 text-primary-foreground shadow-[var(--shadow-elevated)] sm:px-9 sm:py-10">
      <div className="surface-grid-dark absolute inset-0 opacity-60" />
      <NetworkBackdrop />
      <div className="relative">
        {eyebrow && (
          <div className="mono-tech mb-2 text-[11px] uppercase tracking-[0.22em] opacity-75">
            {eyebrow}
          </div>
        )}
        <h1 className="flex items-center gap-3 text-2xl font-bold sm:text-3xl">
          {icon}
          {title}
        </h1>
        {subtitle && <p className="mt-2 max-w-2xl text-sm opacity-85 sm:text-base">{subtitle}</p>}
        {children}
      </div>
    </header>
  );
}
