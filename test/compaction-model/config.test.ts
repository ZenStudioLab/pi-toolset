import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_DECISION_MODEL, parseConfig } from "../../extensions/compaction-model/config.ts";

test("a valid config parses, with the default decision model", () => {
  assert.deepEqual(parseConfig('{"model":"anthropic/claude-haiku-5-5","thinkingLevel":"auto"}'), {
    ok: true,
    config: { model: { provider: "anthropic", id: "claude-haiku-5-5" }, thinkingLevel: "auto", decisionModel: DEFAULT_DECISION_MODEL },
    unknownKeys: [],
  });
  const explicit = parseConfig('{"model":"claude-bridge/claude-sonnet-5-5","thinkingLevel":"low","decisionModel":"typesafe/jev-2"}');
  assert.ok(explicit.ok);
  assert.equal(explicit.config.thinkingLevel, "low");
  assert.deepEqual(explicit.config.decisionModel, { provider: "typesafe", id: "jev-2" });
});

test("model ids split on the first slash only", () => {
  const parsed = parseConfig('{"model":"openrouter/anthropic/claude-haiku-5-5"}');
  assert.ok(parsed.ok);
  assert.deepEqual(parsed.config.model, { provider: "openrouter", id: "anthropic/claude-haiku-5-5" });
  assert.equal(parsed.config.thinkingLevel, undefined);
});

test("each invalid field is named", () => {
  const error = (raw: string) => {
    const parsed = parseConfig(raw);
    assert.equal(parsed.ok, false);
    return parsed.ok ? "" : parsed.error;
  };
  assert.match(error("{not json"), /not valid JSON/);
  assert.match(error("[]"), /JSON object/);
  assert.match(error("{}"), /"model"/);
  assert.match(error('{"model":"claude-haiku-5-5"}'), /"model"/);
  assert.match(error('{"model":"anthropic/"}'), /"model"/);
  assert.match(error('{"model":"a/b","thinkingLevel":"extreme"}'), /"thinkingLevel"/);
  assert.match(error('{"model":"a/b","decisionModel":"jev"}'), /"decisionModel"/);
});

test("unrecognized keys are reported without rejecting the config", () => {
  const parsed = parseConfig('{"model":"a/b","thinkinglevel":"low"}');
  assert.ok(parsed.ok);
  assert.deepEqual(parsed.unknownKeys, ["thinkinglevel"]);
});
