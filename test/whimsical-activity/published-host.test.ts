import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { ModelRegistry, ModelRuntime, SessionManager } from "@earendil-works/pi-coding-agent";
import { AuthStorage } from "../../node_modules/@earendil-works/pi-coding-agent/dist/core/auth-storage.js";
import { createEventBus } from "../../node_modules/@earendil-works/pi-coding-agent/dist/core/event-bus.js";
import { createExtensionRuntime, loadExtensionFromFactory } from "../../node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/loader.js";
import { ExtensionRunner } from "../../node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/runner.js";
import whimsicalActivity from "../../extensions/whimsical-activity/index.ts";
import { FakeActivityClock } from "./clock.ts";

test("AT22: actual pinned 0.87.1 loader/runner lacks native decoration API; entry warns once and changes no UI ports", async () => {
  const root = mkdtempSync(join(tmpdir(), "whimsical-published-"));
  const input = Object.getOwnPropertyDescriptor(process.stdin, "isTTY");
  const output = Object.getOwnPropertyDescriptor(process.stdout, "isTTY");
  Object.defineProperty(process.stdin, "isTTY", { value: true, configurable: true });
  Object.defineProperty(process.stdout, "isTTY", { value: true, configurable: true });
  try {
    const runtime = createExtensionRuntime();
    const clock = new FakeActivityClock();
    let banks = 0;
    const extension = await loadExtensionFromFactory((pi) => whimsicalActivity(pi, () => {
      banks++;
      throw new Error("Unsupported host must not create a bank");
    }, clock), root, createEventBus(), runtime);
    const models = await ModelRuntime.create({ credentials: AuthStorage.inMemory(), modelsPath: null,
      modelsStorePath: join(root, "models-cache.json"), allowModelNetwork: false, refreshOnCreate: false });
    const runner = new ExtensionRunner([extension], runtime, root, SessionManager.inMemory(), new ModelRegistry(models));
    const warnings: string[] = [];
    const errors: string[] = [];
    runner.onError((error) => errors.push(error.error));
    const ui = { ...runner.getUIContext(), notify: (message: string) => { warnings.push(message); } };
    assert.equal("registerActivityDecoration" in ui, false);
    const nativePorts = Object.getOwnPropertyDescriptors(ui);
    runner.setUIContext(ui, "tui");
    await runner.emit({ type: "session_start", reason: "startup" });
    await runner.emit({ type: "session_start", reason: "new" });
    await runner.emit({ type: "session_shutdown", reason: "quit" });
    assert.deepEqual(errors, []);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /registerActivityDecoration; native UI is unchanged/);
    assert.deepEqual(Object.getOwnPropertyDescriptors(ui), nativePorts);
    assert.equal(banks, 0);
    assert.equal(clock.pending().length, 0);
    for (const event of ["context", "before_agent_start", "before_provider_request"]) assert.equal(runner.hasHandlers(event), false);
    runner.invalidate();
  } finally {
    if (input) Object.defineProperty(process.stdin, "isTTY", input); else Reflect.deleteProperty(process.stdin, "isTTY");
    if (output) Object.defineProperty(process.stdout, "isTTY", output); else Reflect.deleteProperty(process.stdout, "isTTY");
    rmSync(root, { recursive: true, force: true });
  }
});
