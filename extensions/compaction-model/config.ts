export const THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh", "max"] as const;
export type ThinkingLevel = typeof THINKING_LEVELS[number];

export type ModelRef = { provider: string; id: string };

export type CompactionModelConfig = {
  model: ModelRef;
  /** Absent means the session's thinking level. */
  thinkingLevel?: ThinkingLevel | "auto";
  decisionModel: ModelRef;
};

export type ParsedConfig =
  | { ok: true; config: CompactionModelConfig; unknownKeys: string[] }
  | { ok: false; error: string };

export const DEFAULT_DECISION_MODEL: ModelRef = { provider: "typesafe", id: "jev-latest" };

const KNOWN_KEYS = new Set(["model", "thinkingLevel", "decisionModel"]);

/** Splits on the first `/` only: model ids such as OpenRouter's contain `/` themselves. */
export function parseModelRef(value: unknown): ModelRef | undefined {
  if (typeof value !== "string") return undefined;
  const slash = value.indexOf("/");
  if (slash <= 0 || slash === value.length - 1) return undefined;
  return { provider: value.slice(0, slash), id: value.slice(slash + 1) };
}

export function formatModelRef(ref: ModelRef): string {
  return `${ref.provider}/${ref.id}`;
}

export function parseConfig(raw: string): ParsedConfig {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, error: "the file is not valid JSON" };
  }
  if (typeof json !== "object" || json === null || Array.isArray(json)) return { ok: false, error: "the file must contain a JSON object" };
  const fields = json as Record<string, unknown>;

  const model = parseModelRef(fields.model);
  if (!model) return { ok: false, error: '"model" must be a "provider/modelId" string' };

  const thinkingLevel = fields.thinkingLevel;
  if (thinkingLevel !== undefined && thinkingLevel !== "auto" && !THINKING_LEVELS.includes(thinkingLevel as ThinkingLevel)) {
    return { ok: false, error: `"thinkingLevel" must be one of ${THINKING_LEVELS.join(", ")}, or auto` };
  }

  let decisionModel = DEFAULT_DECISION_MODEL;
  if (fields.decisionModel !== undefined) {
    const parsed = parseModelRef(fields.decisionModel);
    if (!parsed) return { ok: false, error: '"decisionModel" must be a "provider/modelId" string' };
    decisionModel = parsed;
  }

  return {
    ok: true,
    config: { model, thinkingLevel: thinkingLevel as CompactionModelConfig["thinkingLevel"], decisionModel },
    unknownKeys: Object.keys(fields).filter((key) => !KNOWN_KEYS.has(key)),
  };
}
