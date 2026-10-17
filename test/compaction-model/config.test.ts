import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_DECISION_MODEL, parseConfig } from "../../extensions/compaction-model/config.ts";

test("a valid config keeps the models in priority order, with the default decision model", () => {
  assert.deepEqual(parseConfig('{"models":[{"model":"anthropic/claude-haiku-5-5","thinkingLevel":"auto"},{"model":"claude-bridge/claude-sonnet-5-5"}]}'), {
    ok: true,
    config: {
      models: [
        { model: { provider: "anthropic", id: "claude-haiku-5-5" }, thinkingLevel: "auto" },
        { model: { provider: "claude-bridge", id: "claude-sonnet-5-5" }, thinkingLevel: undefined },
      ],
      decisionModel: DEFAULT_DECISION_MODEL,
    },
    unknownKeys: [],
  });
  const explicit = parseConfig('{"models":[{"model":"a/b","thinkingLevel":"low"}],"decisionModel":"typesafe/jev-2"}');
  assert.ok(explicit.ok);
  assert.equal(explicit.config.models[0].thinkingLevel, "low");
  assert.deepEqual(explicit.config.decisionModel, { provider: "typesafe", id: "jev-2" });
});

test("model ids split on the first slash only", () => {
  const parsed = parseConfig('{"models":[{"model":"openrouter/anthropic/claude-haiku-5-5"}]}');
  assert.ok(parsed.ok);
  assert.deepEqual(parsed.config.models[0].model, { provider: "openrouter", id: "anthropic/claude-haiku-5-5" });
  assert.equal(parsed.config.models[0].thinkingLevel, undefined);
});

test("each invalid field is named, including which entry is wrong", () => {
  const error = (raw: string) => {
    const parsed = parseConfig(raw);
    assert.equal(parsed.ok, false);
    return parsed.ok ? "" : parsed.error;
  };
  assert.match(error("{not json"), /not valid JSON/);
  assert.match(error("[]"), /JSON object/);
  assert.match(error("{}"), /"models"/);
  assert.match(error('{"models":[]}'), /"models" must be a non-empty array/);
  // The single-model shape from before the priority list is not accepted.
  assert.match(error('{"model":"a/b"}'), /"models"/);
  assert.match(error('{"models":["a/b"]}'), /models\[0\] must be an object/);
  assert.match(error('{"models":[{"model":"claude-haiku-5-5"}]}'), /models\[0\]\.model/);
  assert.match(error('{"models":[{"model":"a/b"},{"model":"anthropic/"}]}'), /models\[1\]\.model/);
  assert.match(error('{"models":[{"model":"a/b","thinkingLevel":"extreme"}]}'), /models\[0\]\.thinkingLevel/);
  assert.match(error('{"models":[{"model":"a/b"}],"decisionModel":"jev"}'), /"decisionModel"/);
});

test("unrecognized keys are reported without rejecting the config", () => {
  const parsed = parseConfig('{"models":[{"model":"a/b"},{"model":"c/d","thinkinglevel":"low"}],"decisionmodel":"x/y"}');
  assert.ok(parsed.ok);
  assert.deepEqual(parsed.unknownKeys, ["decisionmodel", "models[1].thinkinglevel"]);
});
