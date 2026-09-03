import {
  calculateSubnet,
  cidrForHosts,
  ipToLong,
  longToIp,
  type SubnetResult,
} from "./subnet";

export type VlsmRequirement = { name: string; hosts: number };

export type VlsmAllocation = {
  name: string;
  requiredHosts: number;
  network: string;
  cidr: number;
  mask: string;
  usableHosts: number;
  firstHost: string;
  lastHost: string;
  broadcast: string;
  totalAddresses: number;
  wasted: number;
};

export type VlsmPlan = {
  base: SubnetResult;
  allocations: VlsmAllocation[];
  usedAddresses: number;
  freeAddresses: number;
  utilisation: number;
  nextFreeAddress: string | null;
};

export function generateVlsmPlan(
  baseIp: string,
  baseCidr: number,
  requirements: VlsmRequirement[],
): VlsmPlan {
  const base = calculateSubnet(baseIp, baseCidr);

  if (requirements.length === 0) throw new Error("Add at least one network requirement.");
  for (const r of requirements) {
    if (!r.name.trim()) throw new Error("Every network requirement needs a name.");
    if (!Number.isInteger(r.hosts) || r.hosts < 1)
      throw new Error(`"${r.name}" must require at least 1 host.`);
    if (r.hosts > 2147483646) throw new Error(`"${r.name}" requires too many hosts for IPv4.`);
  }

  const sorted = [...requirements].sort((a, b) => b.hosts - a.hosts);
  const baseStart = ipToLong(base.networkAddress);
  const baseEnd = ipToLong(base.broadcastAddress);

  let cursor = baseStart;
  const allocations: VlsmAllocation[] = [];

  for (const req of sorted) {
    const cidr = cidrForHosts(req.hosts);
    const size = Math.pow(2, 32 - cidr);
    // align cursor to the block boundary (prevents overlapping allocations)
    const aligned = Math.ceil(cursor / size) * size;
    if (aligned + size - 1 > baseEnd) {
      throw new Error(
        `⚠️ These host requirements cannot fit inside ${base.networkAddress}/${base.cidr}. "${req.name}" needs a /${cidr} (${size} addresses) but the remaining space is too small. Try a larger network.`,
      );
    }
    const sub = calculateSubnet(longToIp(aligned), cidr);
    allocations.push({
      name: req.name.trim(),
      requiredHosts: req.hosts,
      network: sub.networkAddress,
      cidr,
      mask: sub.subnetMask,
      usableHosts: sub.usableHosts,
      firstHost: sub.firstUsable ?? "-",
      lastHost: sub.lastUsable ?? "-",
      broadcast: sub.broadcastAddress,
      totalAddresses: sub.totalAddresses,
      wasted: Math.max(0, sub.usableHosts - req.hosts),
    });
    cursor = aligned + size;
  }

  const used = cursor - baseStart;
  const total = base.totalAddresses;
  return {
    base,
    allocations,
    usedAddresses: used,
    freeAddresses: total - used,
    utilisation: Math.round((used / total) * 100),
    nextFreeAddress: cursor <= baseEnd ? longToIp(cursor) : null,
  };
}

export function explainVlsm(plan: VlsmPlan): string[] {
  const lines: string[] = [
    `Requirements are sorted from largest to smallest so that big blocks are placed first — this prevents fragmentation of ${plan.base.networkAddress}/${plan.base.cidr}.`,
  ];
  for (const a of plan.allocations) {
    const smaller = a.cidr + 1;
    const smallerUsable = Math.pow(2, 32 - smaller) - 2;
    lines.push(
      `${a.name} requires ${a.requiredHosts} hosts. A /${smaller} provides only ${smallerUsable} usable addresses, so a /${a.cidr} is required because it provides ${a.usableHosts} usable addresses. It was allocated ${a.network}/${a.cidr} (${a.firstHost} – ${a.lastHost}, broadcast ${a.broadcast}), leaving ${a.wasted} spare addresses for growth.`,
    );
  }
  lines.push(
    `Total allocated: ${plan.usedAddresses} of ${plan.base.totalAddresses} addresses (${plan.utilisation}% utilisation). ${
      plan.nextFreeAddress
        ? `The next free address is ${plan.nextFreeAddress}.`
        : "The address space is fully allocated."
    }`,
  );
  return lines;
}
