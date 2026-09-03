// Deterministic IPv4 subnetting engine. No AI, no hard-coded results.

export type SubnetResult = {
  ip: string;
  cidr: number;
  networkAddress: string;
  broadcastAddress: string;
  subnetMask: string;
  wildcardMask: string;
  totalAddresses: number;
  usableHosts: number;
  firstUsable: string | null;
  lastUsable: string | null;
  hostBits: number;
  networkBits: number;
  blockSize: number;
  ipClass: string;
  isPrivate: boolean;
};

export function isValidIPv4(ip: string): boolean {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return false;
  return parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) >= 0 && Number(p) <= 255);
}

export function ipToLong(ip: string): number {
  return ip
    .trim()
    .split(".")
    .reduce((acc, oct) => acc * 256 + Number(oct), 0);
}

export function longToIp(long: number): string {
  const n = long >>> 0;
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}

export function maskFromCidr(cidr: number): number {
  return cidr === 0 ? 0 : (0xffffffff << (32 - cidr)) >>> 0;
}

export function ipToBinary(ip: string): string {
  return ip
    .trim()
    .split(".")
    .map((o) => Number(o).toString(2).padStart(8, "0"))
    .join(".");
}

export function ipClassOf(ip: string): string {
  const first = Number(ip.split(".")[0] ?? 0);
  if (first < 128) return "A";
  if (first < 192) return "B";
  if (first < 224) return "C";
  if (first < 240) return "D (Multicast)";
  return "E (Experimental)";
}

export function isPrivateIp(ip: string): boolean {
  const n = ipToLong(ip);
  return (
    (n >= ipToLong("10.0.0.0") && n <= ipToLong("10.255.255.255")) ||
    (n >= ipToLong("172.16.0.0") && n <= ipToLong("172.31.255.255")) ||
    (n >= ipToLong("192.168.0.0") && n <= ipToLong("192.168.255.255"))
  );
}

export function calculateSubnet(ip: string, cidr: number): SubnetResult {
  if (!isValidIPv4(ip)) throw new Error(`"${ip}" is not a valid IPv4 address.`);
  if (!Number.isInteger(cidr) || cidr < 0 || cidr > 32)
    throw new Error("CIDR prefix must be a whole number between /0 and /32.");

  const mask = maskFromCidr(cidr);
  const ipLong = ipToLong(ip);
  const network = (ipLong & mask) >>> 0;
  const total = Math.pow(2, 32 - cidr);
  const broadcast = (network + total - 1) >>> 0;
  const usable = cidr >= 31 ? (cidr === 31 ? 2 : 1) : total - 2;
  const hostBits = 32 - cidr;
  const maskOctets = longToIp(mask).split(".").map(Number);
  // block size = increment in the "interesting" octet
  let blockSize = 256;
  for (let i = 3; i >= 0; i--) {
    const octet = maskOctets[i] ?? 0;
    if (octet !== 0) {
      blockSize = 256 - octet;
      break;
    }
  }
  if (cidr === 0) blockSize = 256;

  return {
    ip: ip.trim(),
    cidr,
    networkAddress: longToIp(network),
    broadcastAddress: longToIp(broadcast),
    subnetMask: longToIp(mask),
    wildcardMask: longToIp(~mask >>> 0),
    totalAddresses: total,
    usableHosts: usable,
    firstUsable: cidr >= 31 ? longToIp(network) : longToIp(network + 1),
    lastUsable: cidr >= 31 ? longToIp(broadcast) : longToIp(broadcast - 1),
    hostBits,
    networkBits: cidr,
    blockSize,
    ipClass: ipClassOf(ip),
    isPrivate: isPrivateIp(ip),
  };
}

export type SubnetRow = {
  index: number;
  network: string;
  firstHost: string;
  lastHost: string;
  broadcast: string;
};

/** Enumerate the subnets of `newCidr` size inside the parent block of `baseCidr`. */
export function enumerateSubnets(
  ip: string,
  baseCidr: number,
  newCidr: number,
  limit = 64,
): SubnetRow[] {
  const base = calculateSubnet(ip, baseCidr);
  if (newCidr < baseCidr) return [];
  const start = ipToLong(base.networkAddress);
  const size = Math.pow(2, 32 - newCidr);
  const count = Math.min(Math.pow(2, newCidr - baseCidr), limit);
  const rows: SubnetRow[] = [];
  for (let i = 0; i < count; i++) {
    const net = start + i * size;
    const bcast = net + size - 1;
    rows.push({
      index: i + 1,
      network: longToIp(net),
      firstHost: newCidr >= 31 ? longToIp(net) : longToIp(net + 1),
      lastHost: newCidr >= 31 ? longToIp(bcast) : longToIp(bcast - 1),
      broadcast: longToIp(bcast),
    });
  }
  return rows;
}

/** Smallest prefix (largest block) that fits `hosts` usable hosts. */
export function cidrForHosts(hosts: number): number {
  if (hosts <= 0) throw new Error("Host requirement must be at least 1.");
  for (let cidr = 30; cidr >= 0; cidr--) {
    if (Math.pow(2, 32 - cidr) - 2 >= hosts) return cidr;
  }
  throw new Error("Host requirement is too large for IPv4.");
}

/** Prefix needed to create at least `n` subnets from a base prefix. */
export function cidrForSubnets(baseCidr: number, n: number): number {
  if (n <= 0) throw new Error("Subnet requirement must be at least 1.");
  const bits = Math.ceil(Math.log2(n));
  const cidr = baseCidr + bits;
  if (cidr > 32) throw new Error(`Cannot create ${n} subnets inside a /${baseCidr} network.`);
  return cidr;
}

export type Step = { title: string; lines: string[] };

export function explainSteps(r: SubnetResult): Step[] {
  return [
    {
      title: "Step 1 — Identify the CIDR prefix",
      lines: [
        `The address ${r.ip}/${r.cidr} uses a /${r.cidr} prefix.`,
        `This means ${r.cidr} bits are allocated to the network portion.`,
      ],
    },
    {
      title: "Step 2 — Determine the host bits",
      lines: [`IPv4 addresses are 32 bits long.`, `32 − ${r.cidr} = ${r.hostBits} host bits.`],
    },
    {
      title: "Step 3 — Calculate total addresses",
      lines: [`2^${r.hostBits} = ${r.totalAddresses} total addresses in this block.`],
    },
    {
      title: "Step 4 — Calculate usable hosts",
      lines:
        r.cidr >= 31
          ? [
              r.cidr === 31
                ? "A /31 is a point-to-point link (RFC 3021): both addresses are usable, so 2 usable hosts."
                : "A /32 is a single host route: 1 usable address.",
            ]
          : [
              `${r.totalAddresses} − 2 = ${r.usableHosts} usable hosts.`,
              `The two reserved addresses are the network address (${r.networkAddress}) and the broadcast address (${r.broadcastAddress}).`,
            ],
    },
    {
      title: "Step 5 — Calculate the subnet mask and block size",
      lines: [
        `Subnet mask: ${r.subnetMask} (wildcard ${r.wildcardMask}).`,
        `Block size = 256 − ${r.subnetMask.split(".").filter((o) => o !== "0").pop() ?? "0"} = ${r.blockSize} in the interesting octet.`,
      ],
    },
    {
      title: "Step 6 — Determine the address range",
      lines: [
        `Network address: ${r.networkAddress}`,
        `Usable range: ${r.firstUsable} – ${r.lastUsable}`,
        `Broadcast address: ${r.broadcastAddress}`,
      ],
    },
  ];
}
