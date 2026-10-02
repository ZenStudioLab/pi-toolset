// Explicit qualification harness, not part of the pinned development-host test glob.
// Usage: node released-stock-render.mjs <released coding-agent directory> <entry.ts> <fresh evidence directory>
// Uses the released loader, AgentSession, InteractiveMode, native editor/status components and TUI.
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { networkAttempts } from "./network-sentinel.ts";

const [hostArg, entryArg, evidenceArg] = process.argv.slice(2);
assert.ok(hostArg && entryArg && evidenceArg, "Expected released host, extension entry, and evidence directory");
const host = resolve(hostArg), entry = resolve(entryArg), evidence = resolve(evidenceArg);
mkdirSync(evidence); // Refuse to overwrite a previous capture.
process.env.PI_CODING_AGENT_DIR = join(evidence, "agent");
process.env.PI_OFFLINE = "1";
delete process.env.PI_PACKAGE_DIR;
mkdirSync(process.env.PI_CODING_AGENT_DIR);
const load = (path) => import(pathToFileURL(join(host, path)).href);
const { Agent } = await load("../pi-agent-core/dist/index.js");
const { registerFauxProvider, fauxAssistantMessage, streamSimple } = await load("../pi-ai/dist/compat.js");
const { visibleWidth } = await load("../pi-tui/dist/index.js");
const { AgentSession } = await load("dist/core/agent-session.js");
const { AuthStorage } = await load("dist/core/auth-storage.js");
const { ModelRuntime } = await load("dist/core/model-runtime.js");
const { SessionManager } = await load("dist/core/session-manager.js");
const { SettingsManager } = await load("dist/core/settings-manager.js");
const { DefaultResourceLoader } = await load("dist/core/resource-loader.js");
const { convertToLlm } = await load("dist/core/messages.js");
const { InteractiveMode } = await load("dist/modes/interactive/interactive-mode.js");
const { initTheme } = await load("dist/modes/interactive/theme/theme.js");
const { stripAnsi } = await load("dist/utils/ansi.js");
const version = JSON.parse(readFileSync(join(host, "package.json"), "utf8")).version;
assert.equal(version, "0.99.2", "This explicit harness is qualified against released 0.99.2");
const words = JSON.parse(readFileSync(join(dirname(entry), "activity-words.json"), "utf8")).words;

// Terminal I/O only: all layout, ANSI generation, input routing and components are real Pi.
class RecordingTerminal {
  columns = 100; rows = 30; kittyProtocolActive = true; output = "";
  start(onInput, onResize) { this.onInput = onInput; this.onResize = onResize; }
  stop() { this.onInput = undefined; this.onResize = undefined; }
  async drainInput() {}
  write(text) { this.output += text; }
  moveBy(lines) { if (lines) this.write(`\x1b[${Math.abs(lines)}${lines > 0 ? "B" : "A"}`); }
  hideCursor() { this.write("\x1b[?25l"); }
  showCursor() { this.write("\x1b[?25h"); }
  clearLine() { this.write("\x1b[K"); }
  clearFromCursor() { this.write("\x1b[J"); }
  clearScreen() { this.write("\x1b[2J\x1b[H"); }
  setTitle() {}
  setProgress() {}
  resize(columns) { this.columns = columns; this.onResize?.(); }
}

const descriptors = [process.stdin, process.stdout].map((stream) => Object.getOwnPropertyDescriptor(stream, "isTTY"));
for (const stream of [process.stdin, process.stdout]) Object.defineProperty(stream, "isTTY", { value: true, configurable: true });
const faux = registerFauxProvider({ tokensPerSecond: 10000 });
const credentials = AuthStorage.inMemory();
const model = faux.getModel();
await credentials.modify(model.provider, async () => ({ type: "api_key", key: "offline-faux" }));
const models = await ModelRuntime.create({ credentials, modelsPath: null, modelsStorePath: join(evidence, "models-cache.json"), allowModelNetwork: false, refreshOnCreate: false });
models.registerProvider(model.provider, { baseUrl: model.baseUrl, apiKey: "offline-faux", api: faux.api, models: faux.models });
const captures = [];
const errors = [];
let mode, session;
try {
  for (const motion of ["normal", "reduced", "plain", "disabled"]) {
    const settingsManager = SettingsManager.inMemory({ compaction: { enabled: false }, retry: { enabled: false }, showTerminalProgress: false });
    const resources = new DefaultResourceLoader({ cwd: evidence, agentDir: process.env.PI_CODING_AGENT_DIR,
      settingsManager, noExtensions: true, additionalExtensionPaths: [entry], noSkills: true,
      noPromptTemplates: true, noThemes: true, noContextFiles: true });
    await resources.reload();
    assert.deepEqual(resources.getExtensions().errors, []);
    assert.equal(resources.getExtensions().extensions.length, 1);
    const agent = new Agent({ getApiKey: () => "offline-faux", streamFn: streamSimple,
      initialState: { model, systemPrompt: "Offline render qualification", tools: [] }, convertToLlm });
    session = new AgentSession({ agent, cwd: evidence, sessionManager: SessionManager.inMemory(evidence),
      settingsManager, modelRuntime: models, resourceLoader: resources, initialActiveToolNames: [] });
    initTheme("dark", false);
    const terminal = new RecordingTerminal();
    // The real mode constructor only needs these runtime-owner registration ports here.
    mode = new InteractiveMode({ session, setBeforeSessionInvalidate() {}, setRebindSession() {} }, { terminal });
    // Skip startup discovery/terminal probing, not the real UI binding or event/render paths.
    mode.isInitialized = true;
    const ui = mode.createExtensionUIContext();
    assert.equal("registerActivityDecoration" in ui, false);
    const runner = session.extensionRunner;
    if (motion === "disabled") {
      runner.setFlagValue("no-whimsical-activity", true);
      runner.setFlagValue("activity-display", "invalid");
    } else runner.setFlagValue("activity-display", motion);
    if (motion === "reduced") runner.setFlagValue("activity-ascii", true);
    await session.bindExtensions({ uiContext: ui, mode: "tui", onError: (error) => errors.push(error.error) });
    mode.subscribeToAgent();
    const events = [];
    session.subscribe((event) => { events.push(event.type); });
    const editor = mode.editor;
    editor.setText("draft input");
    const handlers = editor.actionHandlers;
    mode.ui.addChild(mode.statusContainer);
    mode.ui.addChild(mode.editorContainer);
    mode.ui.setFocus(editor);
    mode.ui.start();
    const capture = async (state, width = 100) => {
      terminal.resize(width);
      mode.ui.requestRender(true);
      await delay(35);
      const status = mode.activeStatusIndicator;
      const border = status?.renderInBorder(width) ?? "";
      const lines = [...mode.statusContainer.render(width), ...mode.editorContainer.render(width)];
      for (const line of lines) assert.ok(visibleWidth(line) <= width, `${state}: width ${width} overflow`);
      if (status) {
        assert.ok(visibleWidth(border) <= width);
        for (const line of status.render(width)) assert.ok(visibleWidth(line) <= width);
      }
      const stem = `${motion}-${state}-${width}`;
      writeFileSync(join(evidence, stem + ".render.ansi"), lines.join("\n") + "\n");
      writeFileSync(join(evidence, stem + ".render.txt"), lines.map(stripAnsi).join("\n") + "\n");
      captures.push({ motion, state, width, kind: status?.kind, border: stripAnsi(border), lines: lines.map(stripAnsi) });
      return stripAnsi(border);
    };
    // Gate the faux provider so rendering is observed in a real in-flight agent loop.
    const begin = async () => {
      let release, entered;
      const ready = new Promise((r) => { entered = r; });
      const gate = new Promise((r) => { release = r; });
      faux.setResponses([async () => { entered(); await gate; return fauxAssistantMessage("Offline done"); }]);
      const done = session.prompt("Offline qualification only", { expandPromptTemplates: false });
      await Promise.race([ready, delay(5000).then(() => { throw new Error("Faux provider was not reached"); })]);
      return { release, done };
    };
    const run = await begin();
    const first = await capture("working");
    assert.equal(mode.activeStatusIndicator.kind, "working");
    const suffix = motion === "reduced" ? "..." : "…";
    const word = words.find((word) => first.includes(word + suffix));
    if (motion === "normal" || motion === "reduced") {
      assert.ok(word, first);
      assert.ok(terminal.output.includes(word + suffix), "Real TUI ANSI stream must include the bank word");
      if (motion === "reduced") assert.equal(first, `* ${word}...`);
    } else {
      assert.ok(first.includes("Working"));
      if (motion === "plain") assert.equal(first, "Working");
    }
    await runner.emit({ type: "agent_start" });
    assert.equal(mode.workingMessage, word ? word + suffix : undefined, "Repeated start keeps text");
    for (const width of [4, 12, 18, 40]) await capture("narrow", width);
    terminal.resize(100);
    const input = ui.input("Native input prompt");
    await capture("input");
    assert.ok(mode.editorContainer.render(100).map(stripAnsi).join("\n").includes("Native input prompt"));
    terminal.onInput("answer"); terminal.onInput("\r");
    assert.equal(await input, "answer");
    assert.equal(mode.editor, editor);
    assert.equal(editor.getText(), "draft input");
    assert.equal(editor.actionHandlers, handlers);
    assert.equal(editor.focused, true);
    await capture("resumed");
    // Controlled host operation events use the real production status routing, not public setter mocks.
    await mode.handleEvent({ type: "auto_retry_start", attempt: 1, maxAttempts: 3, delayMs: 2000, errorMessage: "offline synthetic retry" });
    const retry = await capture("retry");
    assert.match(retry, /Retrying \(1\/3\).*to cancel/);
    assert.equal(mode.activeStatusIndicator.kind, "retry");
    await capture("retry-narrow", 18);
    await runner.emit({ type: "agent_end", messages: [] });
    assert.match(await capture("retry-after-cleanup"), /Retrying/);
    await mode.handleEvent({ type: "auto_retry_end", success: true, attempt: 1 });
    await mode.handleEvent({ type: "compaction_start", reason: "manual" });
    assert.match(await capture("compaction"), /Compacting context.*to cancel/);
    assert.equal(mode.activeStatusIndicator.kind, "compaction");
    await capture("compaction-narrow", 18);
    await mode.handleEvent({ type: "compaction_end", result: undefined, aborted: true });
    run.release(); await run.done;
    assert.equal(mode.activeStatusIndicator, undefined);
    assert.equal(mode.workingMessage, undefined);
    assert.equal(mode.workingIndicatorOptions, undefined);
    await capture("ended");
    assert.ok(events.includes("agent_start") && events.includes("turn_start") && events.includes("agent_end"));
    const next = await begin();
    const second = await capture("next-loop");
    if (word) assert.ok(!second.includes(word + suffix));
    // Shutdown while active restores defaults on the still-visible native indicator.
    await runner.emit({ type: "session_shutdown", reason: "reload" });
    const restored = await capture("shutdown-defaults");
    assert.match(restored, /Working/);
    assert.notEqual(restored, "Working", "Default native spinner is restored");
    assert.equal(mode.workingMessage, undefined);
    assert.equal(mode.workingIndicatorOptions, undefined);
    await runner.emit({ type: "session_shutdown", reason: "reload" });
    next.release(); await next.done;
    // Rebind after shutdown, then cancel a genuine in-flight loop.
    await session.bindExtensions({ uiContext: ui, mode: "tui", onError: (error) => errors.push(error.error) });
    const cancelled = await begin();
    await capture("before-abort");
    const abort = session.abort();
    cancelled.release();
    await Promise.all([abort, cancelled.done]);
    assert.equal(mode.workingMessage, undefined);
    assert.equal(mode.workingIndicatorOptions, undefined);
    assert.equal(mode.activeStatusIndicator, undefined);
    await capture("aborted");
    assert.equal(mode.editor, editor);
    assert.equal(editor.getText(), "draft input");
    assert.equal(mode.extensionWidgetsAbove.size, 0);
    assert.equal(mode.extensionWidgetsBelow.size, 0);
    assert.equal(mode.customFooter, undefined);
    for (const event of ["context", "before_agent_start", "before_provider_request", "tool_call", "tool_result"]) assert.equal(runner.hasHandlers(event), false);
    writeFileSync(join(evidence, motion + ".events.json"), JSON.stringify(events, null, 2));
    mode.stop();
    session.dispose();
    writeFileSync(join(evidence, motion + ".tui.ansi"), terminal.output);
    mode = undefined; session = undefined;
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(networkAttempts, []);
  writeFileSync(join(evidence, "captures.json"), JSON.stringify({ version, node: process.version, entry, captures, errors, networkAttempts }, null, 2));
  console.log(JSON.stringify({ version, node: process.version, entry, captures: captures.length, fauxCalls: faux.state.callCount, errors, networkAttempts }, null, 2));
  for (const capture of captures) console.log(`${capture.motion}/${capture.state}/${capture.width}: ${capture.border}`);
} finally {
  mode?.stop(); session?.dispose(); faux.unregister();
  for (const [i, stream] of [process.stdin, process.stdout].entries()) {
    if (descriptors[i]) Object.defineProperty(stream, "isTTY", descriptors[i]);
    else Reflect.deleteProperty(stream, "isTTY");
  }
}
