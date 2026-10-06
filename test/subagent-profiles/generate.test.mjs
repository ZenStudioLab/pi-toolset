import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { loadSeed, renderAll } from "../../tools/subagent-profiles/generate.mjs";

const render = (presets) =>
  Object.fromEntries(renderAll({ presets }).map(([file, text]) => [file, JSON.parse(text).subagents]));

test("a child merges parent roles per field and binds unset models to its own defaultModel", () => {
  const out = render({
    base: {
      defaultModel: "p/a",
      agents: { oracle: { model: "p/x", thinking: "high" }, worker: { thinking: "low", fast: true } },
    },
    child: { extends: "base", defaultModel: "p/b", agents: { worker: { fast: false } } },
  });
  assert.equal(out["base.json"].agentOverrides.worker.model, "p/a");
  assert.equal(out["child.json"].defaultModel, "p/b");
  assert.deepEqual(out["child.json"].agentOverrides, {
    oracle: { model: "p/x", thinking: "high" },
    worker: { model: "p/b", thinking: "low", fast: false },
  });
});

test("invalid seeds fail before any profile is emitted", () => {
  const cases = [
    [{ a: { extends: "missing", defaultModel: "p/a" } }, /unknown preset 'missing' \(extended by 'a'\)/],
    [{ a: { extends: "b" }, b: { extends: "a" } }, /extends cycle: a -> b -> a/],
    [{ a: { agents: {} } }, /preset 'a': defaultModel is required/],
    [{ "../a": { defaultModel: "p/a" } }, /invalid preset name/],
  ];
  for (const [presets, message] of cases) {
    assert.throws(() => renderAll({ presets }), message);
  }
});

test("a seed loads from either a .mjs module or a .json file", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "subagent-seed-"));
  try {
    const mjs = path.join(dir, "seed.mjs");
    const json = path.join(dir, "seed.json");
    fs.writeFileSync(mjs, `export default { presets: { a: { defaultModel: "p/" + "js" } } };\n`);
    fs.writeFileSync(json, JSON.stringify({ presets: { a: { defaultModel: "p/json" } } }));
    assert.equal(JSON.parse(renderAll(await loadSeed(mjs))[0][1]).subagents.defaultModel, "p/js");
    assert.equal(JSON.parse(renderAll(await loadSeed(json))[0][1]).subagents.defaultModel, "p/json");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
