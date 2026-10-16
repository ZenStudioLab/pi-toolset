import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { clampThinkingLevel } from "@earendil-works/pi-ai";
import {
  compact,
  estimateTokens,
  getAgentDir,
  type ExtensionAPI,
  type ExtensionContext,
  type SessionBeforeCompactEvent,
  type SessionBeforeCompactResult,
} from "@earendil-works/pi-coding-agent";
import { formatModelRef, parseConfig, THINKING_LEVELS, type ThinkingLevel } from "./config.ts";
import { decideThinkingLevel, type CompactionPreparation } from "./thinking.ts";

export type CompactionDeps = {
  compact: typeof compact;
  /** Raw config text, or undefined when the file does not exist. */
  readConfig: () => Promise<string | undefined>;
};

// Pi's retry settings are not reachable from an extension; a request that still fails falls back.
const RETRY = { enabled: true, maxRetries: 2, baseDelayMs: 2000 };

/** Estimated input plus the summary output limit `compact()` applies to the configured model. */
export function requiredContext(preparation: CompactionPreparation, maxTokens: number): number {
  const messages = [...preparation.messagesToSummarize, ...preparation.turnPrefixMessages];
  const input = messages.reduce((sum, message) => sum + estimateTokens(message), 0)
    + Math.ceil((preparation.previousSummary?.length ?? 0) / 4);
  return input + Math.min(Math.floor(0.8 * preparation.settings.reserveTokens), maxTokens > 0 ? maxTokens : Number.POSITIVE_INFINITY);
}

/** Pi carries file lists forward only from compactions it wrote itself, so restore ours. */
export function restoreCarriedFileOps(event: SessionBeforeCompactEvent): void {
  const previous = event.branchEntries.findLast((entry) => entry.type === "compaction");
  if (previous?.type !== "compaction" || !previous.fromHook) return;
  const details = previous.details as { readFiles?: unknown; modifiedFiles?: unknown } | undefined;
  const { fileOps } = event.preparation;
  if (Array.isArray(details?.readFiles)) for (const file of details.readFiles) fileOps.read.add(String(file));
  if (Array.isArray(details?.modifiedFiles)) for (const file of details.modifiedFiles) fileOps.edited.add(String(file));
}

export function createCompactionHandler(pi: Pick<ExtensionAPI, "getThinkingLevel">, deps: CompactionDeps) {
  return async (event: SessionBeforeCompactEvent, ctx: ExtensionContext): Promise<SessionBeforeCompactResult | undefined> => {
    // @tian.zuo/pi-compact compacts Codex sessions on its own model.
    if (ctx.model?.provider === "openai-codex") return;
    const fallBack = (reason: string): undefined => {
      ctx.ui.notify(`Compaction model: ${reason}. Compacting with the session model.`, "warning");
      return undefined;
    };
    let raw: string | undefined;
    try {
      raw = await deps.readConfig();
    } catch (error) {
      return fallBack(`cannot read the config file: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (raw === undefined) return;

    const parsed = parseConfig(raw);
    if (!parsed.ok) return fallBack(`invalid config, ${parsed.error}`);
    const { config } = parsed;
    if (parsed.unknownKeys.length > 0) {
      ctx.ui.notify(`Compaction model: ignoring unrecognized config key(s) ${parsed.unknownKeys.join(", ")}.`, "warning");
    }

    const name = formatModelRef(config.model);
    const model = ctx.modelRegistry.find(config.model.provider, config.model.id);
    if (!model) return fallBack(`${name} is not in the model registry`);
    if (model.api === "pi-virtual") return fallBack(`${name} is a virtual model, which is not supported for summaries`);
    const auth = await ctx.modelRegistry.getApiKeyAndHeaders(model);
    if (!auth.ok) return fallBack(`no credentials for ${name}: ${auth.error}`);
    const { preparation, signal } = event;
    const needed = requiredContext(preparation, model.maxTokens);
    if (needed > model.contextWindow) {
      return fallBack(`the material (about ${needed} tokens with the summary) does not fit ${name}'s ${model.contextWindow}-token context window`);
    }

    let level: ThinkingLevel | undefined;
    let source = "";
    if (!model.reasoning) {
      level = undefined;
    } else if (config.thinkingLevel === "auto") {
      const decision = await decideThinkingLevel(ctx.modelRegistry, config.decisionModel, preparation, signal);
      if (decision.kind === "cancelled") return { cancel: true };
      if (decision.kind === "chosen") {
        level = decision.level;
        source = ", chosen by Jev";
      } else {
        level = pi.getThinkingLevel();
        source = `, session level because Jev was unavailable (${decision.reason})`;
      }
    } else {
      level = config.thinkingLevel ?? pi.getThinkingLevel();
    }
    if (signal.aborted) return { cancel: true };
    // Report the cap a provider applies to `xhigh`/`max`. Never raise a level: like Pi's own path,
    // `off` (or an unmapped `minimal`) must still mean no level is sent.
    if (level !== undefined) {
      const clamped = clampThinkingLevel(model, level);
      if (THINKING_LEVELS.indexOf(clamped) < THINKING_LEVELS.indexOf(level)) level = clamped;
    }

    restoreCarriedFileOps(event);
    // Same as Pi's own summary request: a `null` header value means "delete this header".
    const headers = auth.headers
      ? Object.fromEntries(Object.entries(auth.headers).filter((entry): entry is [string, string] => entry[1] !== null))
      : undefined;
    const requestModel = auth.baseUrl ? { ...model, baseUrl: auth.baseUrl } : model;
    let compaction;
    try {
      // Send through the registry like Pi's own summary request, so extension providers such as claude-bridge resolve.
      const streamFn = ctx.modelRegistry.streamSimple.bind(ctx.modelRegistry);
      compaction = await deps.compact(preparation, requestModel, auth.apiKey, headers, event.customInstructions, signal, level, streamFn, auth.env, RETRY);
    } catch (error) {
      if (signal.aborted) return { cancel: true };
      return fallBack(`the summary request to ${name} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (signal.aborted) return { cancel: true };

    const shown = level === undefined ? "no reasoning"
      : level === "off" && model.provider === "claude-bridge" ? "off (Claude Code default effort)"
      : level;
    ctx.ui.notify(`Compacted with ${name}, thinking ${shown}${source}.`, "info");
    return { compaction };
  };
}

async function readConfigFile(): Promise<string | undefined> {
  try {
    return await readFile(join(getAgentDir(), "compaction-model.json"), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

export default function compactionModel(pi: ExtensionAPI): void {
  pi.on("session_before_compact", createCompactionHandler(pi, { compact, readConfig: readConfigFile }));
}
