import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_DECISION_MODEL } from "../../extensions/compaction-model/config.ts";
import { describeMaterial, decideThinkingLevel, EXCERPT_CHARS } from "../../extensions/compaction-model/thinking.ts";
import { preparation } from "./fixtures.ts";

type Call = { model: unknown; state: Record<string, unknown>; signal?: AbortSignal };

/** Resolves like the patched host's `classify`, which never rejects. */
function registry(result: object, options: { found?: boolean; onClassify?: () => void } = {}) {
  const calls: Call[] = [];
  return {
    calls,
    findOfType: (type: string, provider: string, id: string) => (options.found === false ? undefined : { type, provider, id }),
    classify: async (model: unknown, context: { state: Record<string, unknown> }, opts?: { signal?: AbortSignal }) => {
      calls.push({ model, state: context.state, signal: opts?.signal });
      options.onClassify?.();
      return { answers: {}, ...result };
    },
  };
}

const choice = (level: string) => ({ stopReason: "stop", answers: { thinkingLevel: { type: "choice", choice: level, probabilities: { [level]: 0.9 }, confidence: 0.9 } } });

test("Jev's choice becomes the level, asked of the configured classifier with the abort signal", async () => {
  const fake = registry(choice("medium"));
  const signal = new AbortController().signal;
  assert.deepEqual(await decideThinkingLevel(fake, DEFAULT_DECISION_MODEL, preparation(), signal), { kind: "chosen", level: "medium" });
  assert.deepEqual(fake.calls[0].model, { type: "classifier", provider: "typesafe", id: "jev-latest" });
  assert.equal(fake.calls[0].signal, signal);
});

test("Jev is unavailable on a stock host, an unknown classifier, an error, or an unusable answer", async () => {
  const signal = new AbortController().signal;
  const reason = async (reg: unknown) => {
    const decision = await decideThinkingLevel(reg, DEFAULT_DECISION_MODEL, preparation(), signal);
    assert.equal(decision.kind, "unavailable");
    return decision.kind === "unavailable" ? decision.reason : "";
  };
  assert.match(await reason({ find: () => undefined }), /no classifier support/);
  assert.match(await reason(registry(choice("low"), { found: false })), /typesafe\/jev-latest was not found/);
  assert.match(await reason(registry({ stopReason: "error", errorMessage: "401 unauthorized" })), /401 unauthorized/);
  assert.match(await reason(registry(choice("xhigh"))), /no usable choice/);
  assert.match(await reason(registry({ stopReason: "stop", answers: { thinkingLevel: { type: "score", score: 1 } } })), /no usable choice/);
});

test("an abort during the decision cancels instead of falling back", async () => {
  const controller = new AbortController();
  const fake = registry({ stopReason: "aborted" }, { onClassify: () => controller.abort() });
  assert.deepEqual(await decideThinkingLevel(fake, DEFAULT_DECISION_MODEL, preparation(), controller.signal), { kind: "cancelled" });
});

test("the state sent to Jev is bounded and counts the material", () => {
  const state = describeMaterial(preparation("x".repeat(100_000), { previousSummary: "earlier", isSplitTurn: true }));
  assert.ok((state.conversationTail as string).length <= EXCERPT_CHARS);
  assert.ok((state.estimatedTokens as number) >= 25_000);
  assert.equal(state.hasPreviousSummary, true);
  assert.equal(state.isSplitTurn, true);
  assert.equal(state.filesRead, 1);
  assert.equal(state.filesModified, 2);
});
