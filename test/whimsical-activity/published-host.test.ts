import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { ModelRegistry, ModelRuntime, SessionManager } from "@earendil-works/pi-coding-agent";
import { AuthStorage } from "../../node_modules/@earendil-works/pi-coding-agent/dist/core/auth-storage.js";
import { createEventBus } from "../../node_modules/@earendil-works/pi-coding-agent/dist/core/event-bus.js";
import { loadExtensions } from "../../node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/loader.js";
import { ExtensionRunner } from "../../node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/runner.js";
import { tty } from "./tty.ts";

test("actual pinned 0.87.1 loader/runner loads the entry and decorates stock loops without execution hooks", async () => {
  const root = mkdtempSync(join(tmpdir(), "whimsical-published-"));
  const restore = tty();
  try {
    const entry = fileURLToPath(new URL("../../extensions/whimsical-activity/index.ts", import.meta.url));
    const loaded = await loadExtensions([entry], root, createEventBus());
    assert.deepEqual(loaded.errors, []);
    assert.equal(loaded.extensions.length, 1);
    const models = await ModelRuntime.create({ credentials: AuthStorage.inMemory(), modelsPath: null,
      modelsStorePath: join(root, "models-cache.json"), allowModelNetwork: false, refreshOnCreate: false });
    const runner = new ExtensionRunner(loaded.extensions, loaded.runtime, root, SessionManager.inMemory(), new ModelRegistry(models));
    const warnings: string[] = [];
    const errors: string[] = [];
    let working = "Working";
    runner.onError((error) => errors.push(error.error));
    const ui = { ...runner.getUIContext(),
      notify: (message: string) => { warnings.push(message); },
      setWorkingMessage: (message?: string) => { working = message ?? "Working"; },
      setWorkingIndicator: () => assert.fail("Normal mode leaves native spinner untouched"),
    };
    assert.equal("registerActivityDecoration" in ui, false);
    runner.setUIContext(ui, "tui");
    await runner.emit({ type: "session_start", reason: "startup" });
    await runner.emit({ type: "agent_start" });
    const bank = JSON.parse(readFileSync(new URL("../../extensions/whimsical-activity/activity-words.json", import.meta.url), "utf8")) as { words: string[] };
    assert.ok(bank.words.some((word) => working === word + "…"));
    const first = working;
    await runner.emit({ type: "agent_start" });
    assert.equal(working, first);
    await runner.emit({ type: "agent_end", messages: [] });
    assert.equal(working, "Working");
    await runner.emit({ type: "session_start", reason: "new" });
    await runner.emit({ type: "agent_start" });
    assert.ok(bank.words.some((word) => working === word + "…"));
    assert.notEqual(working, first);
    await runner.emit({ type: "session_shutdown", reason: "quit" });
    assert.equal(working, "Working");
    await runner.emit({ type: "agent_end", messages: [] });
    assert.deepEqual(errors, []);
    assert.deepEqual(warnings, []);
    for (const event of ["context", "before_agent_start", "before_provider_request", "tool_call", "tool_result"]) {
      assert.equal(runner.hasHandlers(event), false);
    }
    runner.invalidate();
  } finally {
    restore();
    rmSync(root, { recursive: true, force: true });
  }
});
