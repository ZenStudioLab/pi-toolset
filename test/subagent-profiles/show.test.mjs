import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { formatProfile, listProfileNames, readProfile } from "../../extensions/subagent-profiles/format.ts";
import { parseShowArgs, runOverridesFor } from "../../extensions/subagent-profiles/load.ts";

test("formatProfile lists default model, then each agent with model and thinking, aligned by name", () => {
  const text = formatProfile("claude-bridge", {
    subagents: {
      defaultModel: "claude-bridge/claude-sonnet-5-5",
      asyncByDefault: false,
      agentOverrides: {
        oracle: { model: "claude-bridge/claude-opus-5-5", thinking: "high" },
        scout: { model: "claude-bridge/claude-haiku-4-5", thinking: "medium", fast: true },
      },
    },
  });
  assert.equal(
    text,
    [
      "claude-bridge  default=claude-bridge/claude-sonnet-5-5  asyncByDefault=false",
      "  oracle  claude-bridge/claude-opus-5-5  thinking=high",
      "  scout   claude-bridge/claude-haiku-4-5  thinking=medium  fast",
    ].join("\n"),
  );
});

test("listProfileNames returns sorted JSON profile names and ignores other files", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "show-profile-"));
  try {
    for (const file of ["b.json", "a.json", "notes.md"]) fs.writeFileSync(path.join(dir, file), "{}");
    assert.deepEqual(listProfileNames(dir), ["a", "b"]);
    assert.deepEqual(readProfile(dir, "a"), {});
    assert.deepEqual(listProfileNames(path.join(dir, "missing")), []);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("parseShowArgs separates the profile name from --load / -l in any position", () => {
  assert.deepEqual(parseShowArgs(""), { name: "", load: false });
  assert.deepEqual(parseShowArgs("openai-6"), { name: "openai-6", load: false });
  assert.deepEqual(parseShowArgs("--load openai-6"), { name: "openai-6", load: true });
  assert.deepEqual(parseShowArgs("openai-6 -l"), { name: "openai-6", load: true });
});

test("runOverridesFor gives the per-run model with thinking suffix and fast, falling back to the default model", () => {
  const profile = {
    subagents: {
      defaultModel: "p/default",
      agentOverrides: {
        scout: { model: "p/small", thinking: "xhigh", fast: true },
        worker: { model: "p/big" },
      },
    },
  };
  assert.deepEqual(runOverridesFor(profile, "scout"), { model: "p/small:xhigh", fast: true });
  assert.deepEqual(runOverridesFor(profile, "worker"), { model: "p/big" });
  assert.deepEqual(runOverridesFor(profile, "reviewer"), { model: "p/default" });
  assert.deepEqual(runOverridesFor({}, "scout"), {});
});
