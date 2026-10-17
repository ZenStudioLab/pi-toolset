export const THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh", "max"] as const;
export type ThinkingLevel = typeof THINKING_LEVELS[number];

export type ModelRef = { provider: string; id: string };

/** One summarizing model and the thinking level to use with it. */
export type SummaryModelEntry = {
  model: ModelRef;
  /** Absent means the session's thinking level. */
  thinkingLevel?: ThinkingLevel | "auto";
};

export type CompactionModelConfig = {
  /** In priority order: the first that works writes the summary. */
  models: SummaryModelEntry[];
  decisionModel: ModelRef;
};

export type ParsedConfig =
  | { ok: true; config: CompactionModelConfig; unknownKeys: string[] }
  | { ok: false; error: string };

export const DEFAULT_DECISION_MODEL: ModelRef = { provider: "typesafe", id: "jev-latest" };

const KNOWN_KEYS = new Set(["models", "decisionModel"]);
const KNOWN_ENTRY_KEYS = new Set(["model", "thinkingLevel"]);

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

  if (!Array.isArray(fields.models) || fields.models.length === 0) {
    return { ok: false, error: '"models" must be a non-empty array of { "model", "thinkingLevel" } objects' };
  }
  const models: SummaryModelEntry[] = [];
  const unknownKeys = Object.keys(fields).filter((key) => !KNOWN_KEYS.has(key));
  for (const [index, item] of fields.models.entries()) {
    const where = `models[${index}]`;
    if (typeof item !== "object" || item === null || Array.isArray(item)) return { ok: false, error: `${where} must be an object` };
    const entry = item as Record<string, unknown>;
    const model = parseModelRef(entry.model);
    if (!model) return { ok: false, error: `${where}.model must be a "provider/modelId" string` };
    const thinkingLevel = entry.thinkingLevel;
    if (thinkingLevel !== undefined && thinkingLevel !== "auto" && !THINKING_LEVELS.includes(thinkingLevel as ThinkingLevel)) {
      return { ok: false, error: `${where}.thinkingLevel must be one of ${THINKING_LEVELS.join(", ")}, or auto` };
    }
    models.push({ model, thinkingLevel: thinkingLevel as SummaryModelEntry["thinkingLevel"] });
    unknownKeys.push(...Object.keys(entry).filter((key) => !KNOWN_ENTRY_KEYS.has(key)).map((key) => `${where}.${key}`));
  }

  let decisionModel = DEFAULT_DECISION_MODEL;
  if (fields.decisionModel !== undefined) {
    const parsed = parseModelRef(fields.decisionModel);
    if (!parsed) return { ok: false, error: '"decisionModel" must be a "provider/modelId" string' };
    decisionModel = parsed;
  }

  return { ok: true, config: { models, decisionModel }, unknownKeys };
}
