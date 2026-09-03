import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const LOVABLE_AIG_RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

export function createLovableAiGatewayRunIdFetch(initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  let resolveRunId: (value: string | undefined) => void = () => {};
  let runIdResolved = false;
  const runIdReady = new Promise<string | undefined>((resolve) => {
    resolveRunId = resolve;
  });

  const publishRunId = (value?: string) => {
    const nextRunId = value?.trim() || undefined;
    if (!runId && nextRunId) runId = nextRunId;
    if (!runIdResolved) {
      runIdResolved = true;
      resolveRunId(runId);
    }
  };
  if (runId) publishRunId(runId);

  return {
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(LOVABLE_AIG_RUN_ID_HEADER)) {
        headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
      }
      try {
        const response = await fetch(input, { ...init, headers });
        publishRunId(response.headers.get(LOVABLE_AIG_RUN_ID_HEADER) ?? undefined);
        return response;
      } catch (error) {
        publishRunId(undefined);
        throw error;
      }
    },
    getRunId: () => runId,
    waitForRunId: () => (runId ? Promise.resolve(runId) : runIdReady),
  };
}

export function createLovableAiGatewayProvider(
  lovableApiKey: string,
  initialRunId?: string,
  options?: { structuredOutputs?: boolean },
) {
  const runIdFetch = createLovableAiGatewayRunIdFetch(initialRunId);

  const provider = createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    supportsStructuredOutputs: options?.structuredOutputs ?? false,
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
    fetch: runIdFetch.fetch as unknown as typeof fetch,
  });

  return Object.assign(provider, {
    getRunId: runIdFetch.getRunId,
    waitForRunId: runIdFetch.waitForRunId,
  });
}

export const AI_MODEL = "google/gemini-3.7-flash";

export function requireApiKey(): string {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured (missing LOVABLE_API_KEY).");
  return key;
}

export const SUBNETAI_SYSTEM_PROMPT = `You are SubnetAI, an educational IPv4 networking tutor for university students.

Your primary goal is to help students UNDERSTAND subnetting rather than simply provide answers.

When solving subnetting problems, work in this order:
1. Identify the IPv4 address.
2. Identify the CIDR prefix.
3. Determine the subnet mask.
4. Determine network and host bits.
5. Calculate total addresses (2^host bits).
6. Calculate usable hosts (total - 2, except /31 and /32).
7. Determine the network address.
8. Determine the broadcast address.
9. Determine the usable host range.
10. Explain the reasoning clearly.

When teaching: start with the simplest explanation, use examples, break calculations into small steps, and ask the student a question where appropriate.

When a student makes a mistake: never just say "wrong". Identify the specific error, explain why it is incorrect, show the correct approach, then give a similar problem to try.

For VLSM: sort requirements from largest to smallest, select the smallest suitable subnet for each requirement, prevent overlapping networks, verify the address space is sufficient, and explain the reasoning behind each allocation.

Never invent networking calculations. Where the application supplies deterministic engine results, treat those numbers as authoritative and explain them; never contradict them. If uncertain, clearly state that the result should be verified.

Formatting: concise markdown-ish plain text, short paragraphs, use "Step 1 —" style headings for calculations, and show IPv4 values plainly (e.g. 192.168.10.0/26). Keep answers focused; avoid walls of text.`;
