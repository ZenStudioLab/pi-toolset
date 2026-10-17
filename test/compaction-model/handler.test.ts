import assert from "node:assert/strict";
import { test } from "node:test";
import type { ExtensionContext, SessionBeforeCompactEvent } from "@earendil-works/pi-coding-agent";
import { createCompactionHandler, type CompactionDeps } from "../../extensions/compaction-model/index.ts";
import { preparation } from "./fixtures.ts";

const haiku55 = { provider: "anthropic", id: "claude-haiku-5-5", api: "anthropic-messages", reasoning: true, contextWindow: 1_000_000, maxTokens: 128_000 };
const haiku45 = { ...haiku55, id: "claude-haiku-4-5", contextWindow: 200_000, maxTokens: 64_000 };
const sonnet55 = { ...haiku55, id: "claude-sonnet-5-5" };
// Like the catalog's Opus 5.5: thinking cannot be disabled and there is no `max` effort.
const bridgeHaiku = { ...haiku55, provider: "claude-bridge", api: "claude-bridge", thinkingLevelMap: { off: null, minimal: null, max: null } };
const plain = { ...haiku55, id: "plain", reasoning: false };
const virtual = { ...haiku55, id: "auto", api: "pi-virtual" };
const models = [haiku55, haiku45, sonnet55, bridgeHaiku, plain, virtual];

type Options = {
  configs?: (string | undefined)[];
  readError?: Error;
  sessionProvider?: string;
  sessionLevel?: string;
  auth?: object;
  classify?: (signal: AbortSignal) => Promise<object>;
  compact?: (signal: AbortSignal, model: { id: string }) => Promise<object>;
};

function setup(options: Options = {}) {
  const notes: { message: string; type?: string }[] = [];
  const compactCalls: unknown[][] = [];
  const classifyCalls: unknown[] = [];
  const sessionChanges: string[] = [];
  const streamed: unknown[][] = [];
  const configs = [...(options.configs ?? ['{"models":[{"model":"anthropic/claude-haiku-5-5","thinkingLevel":"low"}]}'])];
  const deps: CompactionDeps = {
    readConfig: async () => {
      if (options.readError) throw options.readError;
      return configs.length > 1 ? configs.shift() : configs[0];
    },
    compact: (async (...args: unknown[]) => {
      compactCalls.push(args);
      if (options.compact) return options.compact(args[5] as AbortSignal, args[1] as { id: string });
      return { summary: "summary", firstKeptEntryId: "kept", tokensBefore: 1000 };
    }) as unknown as CompactionDeps["compact"],
  };
  const pi = {
    getThinkingLevel: () => options.sessionLevel ?? "high",
    setModel: async () => { sessionChanges.push("model"); return true; },
    setThinkingLevel: () => { sessionChanges.push("thinking"); },
  };
  const registry: Record<string, unknown> = {
    find: (provider: string, id: string) => models.find((m) => m.provider === provider && m.id === id),
    streamSimple: (...args: unknown[]) => { streamed.push(args); return "stream"; },
    getApiKeyAndHeaders: async () => options.auth ?? { ok: true, apiKey: "key", headers: { "x-keep": "1", "x-drop": null }, baseUrl: "https://proxy.test", env: { A: "1" } },
  };
  if (options.classify) {
    registry.findOfType = (_type: string, provider: string, id: string) => ({ provider, id });
    registry.classify = async (_model: unknown, context: unknown, opts: { signal: AbortSignal }) => {
      classifyCalls.push(context);
      return options.classify!(opts.signal);
    };
  }
  const ctx = {
    model: { provider: options.sessionProvider ?? "anthropic", id: "claude-opus-5-5" },
    modelRegistry: registry,
    ui: { notify: (message: string, type?: string) => notes.push({ message, type }) },
  } as unknown as ExtensionContext;
  const handler = createCompactionHandler(pi as never, deps);
  const run = (overrides: Partial<SessionBeforeCompactEvent> = {}, controller = new AbortController()) => {
    const event = {
      type: "session_before_compact", preparation: preparation(), branchEntries: [], customInstructions: "focus on the migration",
      reason: "manual", willRetry: false, signal: controller.signal, ...overrides,
    } as SessionBeforeCompactEvent;
    return { event, result: handler(event, ctx) };
  };
  const starts = () => notes.filter((n) => n.message.startsWith("The conversation is being compacted"));
  const outcomes = () => notes.filter((n) => n.message.startsWith("Compacted with"));
  const warnings = () => notes.filter((n) => n.type === "warning");
  return { run, notes, starts, outcomes, warnings, compactCalls, classifyCalls, sessionChanges, streamed };
}

test("Codex sessions and a missing config file are left to Pi without a word", async () => {
  for (const options of [{ sessionProvider: "openai-codex" }, { configs: [undefined] }]) {
    const t = setup(options);
    assert.equal(await t.run().result, undefined);
    assert.equal(t.compactCalls.length, 0);
    assert.deepEqual(t.notes, []);
  }
});

test("each fallback hands compaction back to Pi with one warning naming the reason", async () => {
  const huge = preparation("x".repeat(2_400_000), { settings: { enabled: true, reserveTokens: 500_000, keepRecentTokens: 20_000 } });
  const cases: [Options, RegExp, Partial<SessionBeforeCompactEvent>?][] = [
    [{ configs: ["{oops"] }, /invalid config, the file is not valid JSON/],
    [{ readError: new Error("EACCES: permission denied") }, /cannot read the config file: EACCES/],
    [{ configs: ['{"models":[{"model":"anthropic/nope"}]}'] }, /anthropic\/nope is not in the model registry/],
    [{ configs: ['{"models":[{"model":"anthropic/auto"}]}'] }, /virtual model/],
    [{ auth: { ok: false, error: "no API key" } }, /no credentials for anthropic\/claude-haiku-5-5: no API key/],
    [{ configs: ['{"models":[{"model":"anthropic/claude-haiku-4-5"}]}'] }, /does not fit anthropic\/claude-haiku-4-5's 200000-token/, { preparation: huge }],
    // A 200K-token previous summary or turn prefix alone exceeds the 200K window.
    [{ configs: ['{"models":[{"model":"anthropic/claude-haiku-4-5"}]}'] }, /does not fit/, { preparation: preparation("hi", { previousSummary: "x".repeat(800_000) }) }],
    [{ configs: ['{"models":[{"model":"anthropic/claude-haiku-4-5"}]}'] }, /does not fit/, { preparation: preparation("hi", { turnPrefixMessages: [{ role: "user", content: "x".repeat(800_000), timestamp: 2 }] as never }) }],
  ];
  for (const [options, reason, event] of cases) {
    const t = setup(options);
    assert.equal(await t.run(event).result, undefined);
    assert.equal(t.compactCalls.length, 0);
    assert.equal(t.notes.length, 1);
    assert.match(t.warnings()[0].message, reason);
  }
});

test("the size guard uses the capped output limit, so a 1M model fits material a 200K model does not", async () => {
  const material = preparation("x".repeat(2_400_000), { settings: { enabled: true, reserveTokens: 500_000, keepRecentTokens: 20_000 } });
  const t = setup();
  assert.ok((await t.run({ preparation: material }).result)?.compaction);
});

test("a summary passes Pi's preparation, auth, instructions, signal, and level to compact()", async () => {
  const t = setup();
  const controller = new AbortController();
  const { event, result } = t.run({}, controller);
  assert.deepEqual(await result, { compaction: { summary: "summary", firstKeptEntryId: "kept", tokensBefore: 1000 } });
  const [prep, model, apiKey, headers, instructions, signal, level, streamFn, env, retry] = t.compactCalls[0];
  assert.equal(prep, event.preparation);
  assert.deepEqual(model, { ...haiku55, baseUrl: "https://proxy.test" });
  assert.equal(apiKey, "key");
  assert.deepEqual(headers, { "x-keep": "1" });
  assert.equal(instructions, "focus on the migration");
  assert.equal(signal, controller.signal);
  assert.equal(level, "low");
  // Requests go through the registry, which resolves extension providers such as claude-bridge.
  assert.equal((streamFn as (...args: unknown[]) => unknown)("m", "context", "options"), "stream");
  assert.deepEqual(t.streamed, [["m", "context", "options"]]);
  assert.deepEqual(env, { A: "1" });
  assert.deepEqual(retry, { enabled: true, maxRetries: 2, baseDelayMs: 2000 });
  assert.deepEqual(t.outcomes().map((n) => n.message), ["Compacted with anthropic/claude-haiku-5-5, thinking low."]);
  assert.deepEqual(t.sessionChanges, []);
});

test("the user is told the compaction is under way before the summary request starts, then told the outcome", async () => {
  const seen: string[] = [];
  let notes: { message: string }[] = [];
  const t = setup({ compact: async () => { seen.push(...notes.map((n) => n.message)); return { summary: "s", firstKeptEntryId: "kept", tokensBefore: 1 }; } });
  notes = t.notes;
  await t.run().result;
  assert.deepEqual(seen, ["The conversation is being compacted with anthropic/claude-haiku-5-5, thinking low, by the compaction-model extension…"]);
  assert.deepEqual(t.notes.map((n) => n.message), [...seen, "Compacted with anthropic/claude-haiku-5-5, thinking low."]);
});

test("a threshold compaction without instructions passes none", async () => {
  const t = setup();
  await t.run({ reason: "threshold", customInstructions: undefined }).result;
  assert.equal(t.compactCalls[0][4], undefined);
});

test("the level comes from the config, the session, Jev, or nowhere for a non-reasoning model", async () => {
  const levelOf = async (options: Options) => {
    const t = setup(options);
    await t.run().result;
    return { level: t.compactCalls[0][6], note: t.outcomes()[0].message, notes: t.outcomes().length, jevCalls: t.classifyCalls.length };
  };
  const jevAnswer = (choice: string) => async () => ({ stopReason: "stop", answers: { thinkingLevel: { type: "choice", choice, probabilities: {}, confidence: 1 } } });

  assert.equal((await levelOf({ configs: ['{"models":[{"model":"anthropic/claude-haiku-5-5"}]}'], sessionLevel: "medium" })).level, "medium");

  const chosen = await levelOf({ configs: ['{"models":[{"model":"anthropic/claude-haiku-5-5","thinkingLevel":"auto"}]}'], classify: jevAnswer("high") });
  assert.equal(chosen.level, "high");
  assert.match(chosen.note, /thinking high, chosen by Jev/);

  const unavailable = await levelOf({ configs: ['{"models":[{"model":"anthropic/claude-haiku-5-5","thinkingLevel":"auto"}]}'], sessionLevel: "medium" });
  assert.equal(unavailable.level, "medium");
  assert.match(unavailable.note, /session level because Jev was unavailable \(this Pi host has no classifier support\)/);

  const failed = await levelOf({ configs: ['{"models":[{"model":"anthropic/claude-haiku-5-5","thinkingLevel":"auto"}]}'], sessionLevel: "low", classify: async () => ({ stopReason: "error", errorMessage: "quota" }) });
  assert.equal(failed.level, "low");
  assert.match(failed.note, /Jev was unavailable \(quota\)/);

  const noReasoning = await levelOf({ configs: ['{"models":[{"model":"anthropic/plain","thinkingLevel":"auto"}]}'], classify: jevAnswer("high") });
  assert.equal(noReasoning.level, undefined);
  assert.equal(noReasoning.jevCalls, 0);
  assert.match(noReasoning.note, /thinking no reasoning\./);

  const bridgeOff = await levelOf({ configs: ['{"models":[{"model":"claude-bridge/claude-haiku-5-5","thinkingLevel":"off"}]}'] });
  assert.equal(bridgeOff.level, "off");
  assert.match(bridgeOff.note, /thinking off \(Claude Code default effort\)/);
  assert.equal(bridgeOff.notes, 1);

  const capped = await levelOf({ configs: ['{"models":[{"model":"claude-bridge/claude-haiku-5-5"}]}'], sessionLevel: "max" });
  assert.equal(capped.level, "high");
  assert.match(capped.note, /thinking high\./);
});

test("a failed summary request falls back with its message and is not retried by the handler", async () => {
  const t = setup({ compact: async () => { throw new Error("529 overloaded"); } });
  assert.equal(await t.run().result, undefined);
  assert.equal(t.compactCalls.length, 1);
  assert.deepEqual(t.outcomes(), []);
  assert.equal(t.starts().length, 1);
  assert.match(t.warnings()[0].message, /summary request to anthropic\/claude-haiku-5-5 failed: 529 overloaded/);
});

test("cancelling during Jev, during the summary, or after it returns cancels with no outcome notification", async () => {
  const auto = '{"models":[{"model":"anthropic/claude-haiku-5-5","thinkingLevel":"auto"}]}';
  const scenarios: [string, (controller: AbortController) => Options][] = [
    ["before the request", (c) => { c.abort(); return {}; }],
    ["during Jev", (c) => ({ configs: [auto], classify: async () => { c.abort(); return { stopReason: "aborted" }; } })],
    ["during the summary", (c) => ({ compact: async () => { c.abort(); throw new Error("Request was aborted"); } })],
    ["after the summary", (c) => ({ compact: async () => { c.abort(); return { summary: "s", firstKeptEntryId: "kept", tokensBefore: 1 }; } })],
  ];
  for (const [label, options] of scenarios) {
    const controller = new AbortController();
    const t = setup(options(controller));
    assert.deepEqual(await t.run({}, controller).result, { cancel: true }, label);
    const requestStarted = label !== "during Jev" && label !== "before the request";
    assert.deepEqual([...t.outcomes(), ...t.warnings()], [], label);
    assert.equal(t.starts().length, requestStarted ? 1 : 0, label);
    assert.equal(t.compactCalls.length, requestStarted ? 1 : 0, label);
  }
});

test("the config is read at each compaction", async () => {
  const t = setup({ configs: ['{"models":[{"model":"anthropic/claude-haiku-5-5"}]}', '{"models":[{"model":"anthropic/claude-sonnet-5-5"}]}'] });
  await t.run().result;
  await t.run().result;
  assert.deepEqual(t.compactCalls.map((args) => (args[1] as { id: string }).id), ["claude-haiku-5-5", "claude-sonnet-5-5"]);
});

test("an unrecognized key still summarizes, with a separate warning", async () => {
  const t = setup({ configs: ['{"models":[{"model":"anthropic/claude-haiku-5-5","thinkinglevel":"low"}]}'] });
  assert.ok((await t.run().result)?.compaction);
  assert.match(t.warnings()[0].message, /unrecognized config key\(s\) models\[0\]\.thinkinglevel/);
  assert.equal(t.outcomes().length, 1);
});

test("file lists carry over from an extension-written compaction only, even when the request then fails", async () => {
  const compaction = (fromHook: boolean) => ({ type: "compaction", id: "c1", fromHook, details: { readFiles: ["old-read.ts"], modifiedFiles: ["old-edit.ts"] } });
  const filesAfter = async (fromHook: boolean, options: Options = {}) => {
    const t = setup(options);
    const { event, result } = t.run({ branchEntries: [compaction(fromHook), { type: "message", id: "m1" }] as never });
    await result;
    return { read: [...event.preparation.fileOps.read].sort(), edited: [...event.preparation.fileOps.edited].sort() };
  };
  assert.deepEqual(await filesAfter(true), { read: ["a.ts", "old-read.ts"], edited: ["b.ts", "c.ts", "old-edit.ts"] });
  assert.deepEqual(await filesAfter(false), { read: ["a.ts"], edited: ["b.ts", "c.ts"] });
  assert.deepEqual((await filesAfter(true, { compact: async () => { throw new Error("boom"); } })).read, ["a.ts", "old-read.ts"]);
});

const priority = (...entries: string[]) => `{"models":[${entries.map((e) => `{"model":"${e}","thinkingLevel":"low"}`).join(",")}]}`;
const modelsTried = (t: { compactCalls: unknown[][] }) => t.compactCalls.map((args) => (args[1] as { id: string }).id);

test("when a model's summary request fails, the next configured model writes the summary", async () => {
  const t = setup({
    configs: [priority("anthropic/claude-haiku-5-5", "anthropic/claude-sonnet-5-5")],
    compact: async (_signal, model) => {
      if (model.id === "claude-haiku-5-5") throw new Error("You've hit your session limit");
      return { summary: "second", firstKeptEntryId: "kept", tokensBefore: 1 };
    },
  });
  assert.deepEqual(await t.run().result, { compaction: { summary: "second", firstKeptEntryId: "kept", tokensBefore: 1 } });
  assert.deepEqual(modelsTried(t), ["claude-haiku-5-5", "claude-sonnet-5-5"]);
  assert.deepEqual(t.notes.map((n) => n.message), [
    "The conversation is being compacted with anthropic/claude-haiku-5-5, thinking low, by the compaction-model extension…",
    "Compaction model: the summary request to anthropic/claude-haiku-5-5 failed: You've hit your session limit. Trying anthropic/claude-sonnet-5-5.",
    "The conversation is being compacted with anthropic/claude-sonnet-5-5, thinking low, by the compaction-model extension…",
    "Compacted with anthropic/claude-sonnet-5-5, thinking low.",
  ]);
  assert.deepEqual(t.sessionChanges, []);
});

test("a model that cannot be used is skipped without a request, so a later model can still be used", async () => {
  const material = preparation("x".repeat(2_400_000), { settings: { enabled: true, reserveTokens: 500_000, keepRecentTokens: 20_000 } });
  const t = setup({ configs: [priority("anthropic/nope", "anthropic/auto", "anthropic/claude-haiku-4-5", "anthropic/claude-sonnet-5-5")] });
  assert.ok((await t.run({ preparation: material }).result)?.compaction);
  assert.deepEqual(modelsTried(t), ["claude-sonnet-5-5"]);
  assert.deepEqual(t.warnings().map((n) => n.message.replace(/ \(about.*?\)/, "")), [
    "Compaction model: anthropic/nope is not in the model registry. Trying anthropic/auto.",
    "Compaction model: anthropic/auto is a virtual model, which is not supported for summaries. Trying anthropic/claude-haiku-4-5.",
    "Compaction model: the material does not fit anthropic/claude-haiku-4-5's 200000-token context window. Trying anthropic/claude-sonnet-5-5.",
  ]);
});

test("when every configured model fails, Pi's default compaction runs and the last warning says so", async () => {
  const t = setup({ configs: [priority("anthropic/claude-haiku-5-5", "anthropic/claude-sonnet-5-5")], compact: async () => { throw new Error("529 overloaded"); } });
  assert.equal(await t.run().result, undefined);
  assert.deepEqual(modelsTried(t), ["claude-haiku-5-5", "claude-sonnet-5-5"]);
  assert.deepEqual(t.outcomes(), []);
  assert.deepEqual(t.warnings().map((n) => n.message.endsWith("Trying anthropic/claude-sonnet-5-5.") || n.message.endsWith("Compacting with the session model.")), [true, true]);
  assert.match(t.warnings()[1].message, /sonnet-5-5 failed: 529 overloaded\. Compacting with the session model\.$/);
});

test("cancelling while a model is summarizing does not move on to the next model", async () => {
  const controller = new AbortController();
  const t = setup({
    configs: [priority("anthropic/claude-haiku-5-5", "anthropic/claude-sonnet-5-5")],
    compact: async () => { controller.abort(); throw new Error("Request was aborted"); },
  });
  assert.deepEqual(await t.run({}, controller).result, { cancel: true });
  assert.deepEqual(modelsTried(t), ["claude-haiku-5-5"]);
  assert.deepEqual(t.warnings(), []);
});

test("each configured model has its own level, and Jev is asked once however many models use auto", async () => {
  const jev = async () => ({ stopReason: "stop", answers: { thinkingLevel: { type: "choice", choice: "medium", probabilities: {}, confidence: 1 } } });
  const t = setup({
    configs: ['{"models":[{"model":"anthropic/claude-haiku-5-5","thinkingLevel":"auto"},{"model":"anthropic/claude-sonnet-5-5","thinkingLevel":"auto"},{"model":"claude-bridge/claude-haiku-5-5","thinkingLevel":"high"}]}'],
    classify: jev,
    compact: async () => { throw new Error("down"); },
  });
  await t.run().result;
  assert.deepEqual(t.compactCalls.map((args) => args[6]), ["medium", "medium", "high"]);
  assert.equal(t.classifyCalls.length, 1);
});
