import { convertToLlm, estimateTokens, serializeConversation, type SessionBeforeCompactEvent } from "@earendil-works/pi-coding-agent";
import { formatModelRef, type ModelRef } from "./config.ts";

export type CompactionPreparation = SessionBeforeCompactEvent["preparation"];

export const JEV_LEVELS = ["low", "medium", "high"] as const;
export type JevLevel = typeof JEV_LEVELS[number];

export type ThinkingDecision =
  | { kind: "chosen"; level: JevLevel }
  | { kind: "unavailable"; reason: string }
  | { kind: "cancelled" };

/** Last characters of the serialized conversation sent to Jev. */
export const EXCERPT_CHARS = 16_000;

// The classifier methods exist only in the patched host, not in the stock 0.87.1 type
// declarations; this mirrors host/pi/packages/ai/src/types.ts and is checked at runtime.
type ClassifierResult = {
  stopReason: "stop" | "error" | "aborted";
  errorMessage?: string;
  answers: Record<string, { type: string; choice?: string }>;
};
type ClassifierRegistry = {
  findOfType(type: "classifier", provider: string, modelId: string): unknown;
  classify(
    model: unknown,
    context: { state: Record<string, unknown>; questions: Record<string, { type: "choice"; instructions: string; criteria: Record<string, string> }> },
    options?: { signal?: AbortSignal },
  ): Promise<ClassifierResult>;
};

function hasClassifier(registry: unknown): registry is ClassifierRegistry {
  const candidate = registry as Partial<ClassifierRegistry> | undefined;
  return typeof candidate?.findOfType === "function" && typeof candidate.classify === "function";
}

/** Bounded description of the material to summarize; never the whole conversation. */
export function describeMaterial(preparation: CompactionPreparation): Record<string, unknown> {
  const messages = [...preparation.messagesToSummarize, ...preparation.turnPrefixMessages];
  const serialized = serializeConversation(convertToLlm(messages));
  return {
    estimatedTokens: messages.reduce((sum, message) => sum + estimateTokens(message), 0),
    messagesToSummarize: preparation.messagesToSummarize.length,
    turnPrefixMessages: preparation.turnPrefixMessages.length,
    hasPreviousSummary: Boolean(preparation.previousSummary),
    isSplitTurn: preparation.isSplitTurn,
    filesRead: preparation.fileOps.read.size,
    filesModified: new Set([...preparation.fileOps.written, ...preparation.fileOps.edited]).size,
    conversationTail: serialized.slice(-EXCERPT_CHARS),
  };
}

const QUESTION = {
  type: "choice" as const,
  instructions:
    "Choose how much reasoning effort a model should spend writing a compaction summary of this coding-agent conversation. " +
    "The summary must preserve goals, decisions, file changes, errors, and next steps so the agent can continue the work.",
  criteria: {
    low: "Routine or repetitive work with few decisions; a straightforward summary suffices.",
    medium: "A typical working session with several decisions, files, or threads to track.",
    high: "Dense, intricate work: many interdependent decisions, subtle debugging state, or a long previous summary to reconcile.",
  },
};

export async function decideThinkingLevel(
  registry: unknown,
  decisionModel: ModelRef,
  preparation: CompactionPreparation,
  signal: AbortSignal,
): Promise<ThinkingDecision> {
  if (!hasClassifier(registry)) return { kind: "unavailable", reason: "this Pi host has no classifier support" };
  const model = registry.findOfType("classifier", decisionModel.provider, decisionModel.id);
  if (!model) return { kind: "unavailable", reason: `classifier ${formatModelRef(decisionModel)} was not found` };

  let result: ClassifierResult | undefined;
  let failure: string | undefined;
  try {
    result = await registry.classify(model, { state: describeMaterial(preparation), questions: { thinkingLevel: QUESTION } }, { signal });
  } catch (error) {
    failure = error instanceof Error ? error.message : String(error);
  }
  if (signal.aborted) return { kind: "cancelled" };
  if (!result) return { kind: "unavailable", reason: failure ?? "the classifier failed" };
  if (result.stopReason !== "stop") return { kind: "unavailable", reason: result.errorMessage ?? `the classifier stopped with "${result.stopReason}"` };

  const answer = result.answers.thinkingLevel;
  const choice = answer?.type === "choice" ? answer.choice : undefined;
  if (!JEV_LEVELS.includes(choice as JevLevel)) return { kind: "unavailable", reason: "the classifier gave no usable choice" };
  return { kind: "chosen", level: choice as JevLevel };
}
