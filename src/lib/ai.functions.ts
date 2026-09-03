import { createServerFn } from "@tanstack/react-start";
import { generateText, streamText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import {
  AI_MODEL,
  SUBNETAI_SYSTEM_PROMPT,
  createLovableAiGatewayProvider,
  requireApiKey,
} from "./ai-gateway.server";

function friendlyError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("402"))
    return new Error("AI credits have run out for this workspace. Add credits to continue.");
  if (message.includes("429"))
    return new Error("SubnetAI is receiving a lot of requests right now. Please retry shortly.");
  if (message.includes("403"))
    return new Error("AI access is currently blocked for this workspace.");
  return new Error(message || "The AI tutor could not be reached.");
}

async function runText(prompt: string, system = SUBNETAI_SYSTEM_PROMPT) {
  const gateway = createLovableAiGatewayProvider(requireApiKey());
  const result = streamText({ model: gateway(AI_MODEL), system, prompt });
  return await result.text;
}

/** Narrative explanation layered on top of the deterministic engine output. */
export const aiExplain = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ facts: z.string().min(1), ask: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    try {
      const text = await runText(
        `The application's deterministic subnetting engine produced these verified results. Treat every number as authoritative and never contradict it.\n\n${data.facts}\n\nTask: ${data.ask}`,
      );
      return { text };
    } catch (error) {
      throw friendlyError(error);
    }
  });

const QuestionSchema = z.object({
  question: z.string(),
  type: z.enum(["multiple-choice", "numeric", "ip", "scenario"]),
  options: z.array(z.string()),
  answer: z.string(),
  explanation: z.string(),
  topic: z.string(),
});

export type PracticeQuestion = z.infer<typeof QuestionSchema> & { id: string };

export const aiGeneratePractice = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        topic: z.string(),
        difficulty: z.string(),
        count: z.number().int().min(1).max(20),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const gateway = createLovableAiGatewayProvider(requireApiKey());
    const prompt = `Generate exactly ${data.count} ${data.difficulty} IPv4 subnetting practice questions on the topic: ${data.topic}.

Rules:
- Every calculation must be arithmetically correct; verify each answer before writing it.
- Mix multiple-choice with short numeric/IP answer questions (at least half multiple-choice).
- For multiple-choice, provide exactly 4 plausible options and make "answer" match one option EXACTLY.
- For numeric answers, "answer" is just the number (e.g. "62"). For IP answers use dotted decimal (e.g. "192.168.10.63"). "options" must be an empty array for non multiple-choice.
- "explanation" is a short step-by-step reason for the correct answer.
- "topic" must be one of: CIDR, Subnet Masks, Network Addresses, Broadcast Addresses, Host Ranges, Number of Hosts, Number of Subnets, VLSM.
- Use varied, realistic private and public IPv4 addresses. Do not repeat questions.`;

    try {
      const result = streamText({
        model: gateway(AI_MODEL),
        system: SUBNETAI_SYSTEM_PROMPT,
        prompt,
        output: Output.object({ schema: z.object({ questions: z.array(QuestionSchema) }) }),
      });
      const output = await result.output;
      return {
        questions: output.questions.slice(0, data.count).map((q, i) => ({
          ...q,
          id: `${Date.now()}-${i}`,
        })),
      };
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error("SubnetAI could not generate valid questions. Please try again.");
      }
      throw friendlyError(error);
    }
  });

export const aiFeedback = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        question: z.string(),
        userAnswer: z.string(),
        correctAnswer: z.string(),
        correct: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    try {
      const text = await runText(
        data.correct
          ? `The student answered this practice question correctly.\nQuestion: ${data.question}\nTheir answer: ${data.userAnswer}\nConfirm briefly (3-4 sentences) WHY that answer is right, showing the key calculation step.`
          : `The student answered this practice question incorrectly.\nQuestion: ${data.question}\nTheir answer: ${data.userAnswer}\nCorrect answer: ${data.correctAnswer}\nIdentify the exact mistake they most likely made, explain why it is incorrect, show the correct step-by-step reasoning, and finish with one similar question for them to attempt (do not answer it).`,
      );
      return { text };
    } catch (error) {
      throw friendlyError(error);
    }
  });

export const aiTutor = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        messages: z.array(
          z.object({ role: z.enum(["user", "assistant"]), content: z.string() }),
        ),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    try {
      const gateway = createLovableAiGatewayProvider(requireApiKey());
      const result = streamText({
        model: gateway(AI_MODEL),
        system: SUBNETAI_SYSTEM_PROMPT,
        messages: data.messages,
      });
      return { text: await result.text };
    } catch (error) {
      throw friendlyError(error);
    }
  });

void generateText;
