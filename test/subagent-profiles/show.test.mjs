import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { formatProfile, listProfileNames, readProfile } from "../../extensions/subagent-profiles/format.ts";

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
