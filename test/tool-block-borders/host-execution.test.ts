import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import {
  createAgentSession, createBashToolDefinition, DefaultResourceLoader, SessionManager, SettingsManager,
  type AgentSession, type ExtensionContext, type ExtensionFactory,
} from "@earendil-works/pi-coding-agent";
import { frameBash } from "../../extensions/tool-block-borders/bash-framing.ts";
import scriptedProvider from "../fixtures/scripted-provider.ts";
import { disposableHost, extensionPath } from "../fixtures/host.ts";

const entry = extensionPath("tool-block-borders");

async function withHost(
  framed: boolean,
  run: (session: AgentSession, context: ExtensionContext, hooks: string[], cwd: string) => Promise<void>,
  { trusted = true, extra = [] }: { trusted?: boolean; extra?: ExtensionFactory[] } = {},
): Promise<void> {
  const host = await disposableHost({ shellPath: "/bin/bash", shellCommandPrefix: "export BORDER_VALUE=global" });
  const { cwd, agentDir, env } = host;
  const oldAgentDir = process.env.PI_CODING_AGENT_DIR;
  Object.assign(process.env, env);
  const hooks: string[] = [];
  let context: ExtensionContext | undefined;
  let session: AgentSession | undefined;
  try {
    await mkdir(join(cwd, ".pi"), { recursive: true });
    await writeFile(join(cwd, ".pi/settings.json"), JSON.stringify({ shellCommandPrefix: "export BORDER_VALUE=project" }));
    const settings = SettingsManager.create(cwd, agentDir, { projectTrusted: trusted });
    const loader = new DefaultResourceLoader({
      cwd, agentDir, settingsManager: settings, noExtensions: true, noSkills: true,
      noPromptTemplates: true, noThemes: true, noContextFiles: true,
      additionalExtensionPaths: framed ? [entry] : [],
      extensionFactories: [scriptedProvider, ...extra, (pi) => {
        pi.on("session_start", (_event, ctx) => { context = ctx; });
        pi.on("tool_call", (event) => { hooks.push(`call:${event.toolName}`); });
        pi.on("tool_result", (event) => {
          hooks.push(`result:${event.toolName}`);
          return { content: [...event.content, { type: "text", text: "HOOK_RESULT" }] };
        });
      }],
    });
    await loader.reload();
    assert.deepEqual(loader.getExtensions().errors, []);
    ({ session } = await createAgentSession({ cwd, agentDir, resourceLoader: loader,
      settingsManager: settings, sessionManager: SessionManager.inMemory(), tools: ["bash"] }));
    await session.bindExtensions({ mode: "json" });
    await session.setModel(session.modelRuntime.getModel("border-test", "scripted")!);
    assert(context);
    await run(session, context, hooks, cwd);
  } finally {
    session?.dispose();
    if (oldAgentDir === undefined) delete process.env.PI_CODING_AGENT_DIR;
    else process.env.PI_CODING_AGENT_DIR = oldAgentDir;
    await host.cleanup();
  }
}

test("explicitly loaded extension preserves real host hooks, cwd, shell settings, trust and error classification", async () => {
  for (const trusted of [true, false]) {
    const results: unknown[] = [];
    for (const framed of [false, true]) {
      await withHost(framed, async (session, _context, hooks, cwd) => {
        const definition = session.getToolDefinition("bash")!;
        assert.equal(definition.renderShell, framed ? "self" : undefined);
        await session.prompt(JSON.stringify({ command: "printf '%s\\n' \"$BORDER_VALUE\"; pwd; printf 'stderr\\n' >&2" }));
        await session.prompt(JSON.stringify({ command: "printf 'failure\\n'; exit 7" }));
        const output = session.messages.filter((message) => message.role === "toolResult");
        assert.equal(output.length, 2);
        assert.deepEqual(hooks, ["call:bash", "result:bash", "call:bash", "result:bash"]);
        assert.equal(output[0]!.isError, false);
        assert.equal(output[1]!.isError, true);
        assert(output[0]!.content.some((part) => part.type === "text" && part.text.includes(trusted ? "project" : "global")));
        assert(output[0]!.content.some((part) => part.type === "text" && part.text.includes(cwd)));
        assert(output[1]!.content.some((part) => part.type === "text" && part.text.includes("Command exited with code 7")));
        results.push(output.map(({ content, details, isError }) => ({
          content: content.map((part) => part.type === "text" ? { ...part, text: part.text.replaceAll(cwd, "<cwd>") } : part),
          details, isError,
        })));
      }, { trusted });
    }
    assert.deepEqual(results[0], results[1]);
  }
});

test("decoration retains native execution identity, partial updates, cancellation and timeout", async () => {
  await withHost(true, async (_session, context) => {
    const native = createBashToolDefinition(context.cwd, { shellPath: "/bin/bash", commandPrefix: "export BORDER_VALUE=prefix" });
    const framed = frameBash(native);
    assert.equal(framed.execute, native.execute);
    assert.equal(framed.parameters, native.parameters);
    assert.equal(framed.description, native.description);
    assert.deepEqual(framed.promptGuidelines, native.promptGuidelines);
    for (const tool of [native, framed]) {
      const updates: string[] = [];
      const result = await tool.execute("stream", { command: "printf '%s' \"$BORDER_VALUE\"; sleep 0.15; printf ':done'" },
        undefined, (update) => updates.push(update.content.map((part) => part.type === "text" ? part.text : "").join("")), context);
      assert.deepEqual(result.content, [{ type: "text", text: "prefix:done" }]);
      assert(updates.includes("prefix") && updates.includes("prefix:done"));
      const controller = new AbortController();
      const pending = tool.execute("abort", { command: "printf 'before-abort'; sleep 5" }, controller.signal, undefined, context);
      const timer = setTimeout(() => controller.abort(), 50);
      try { await assert.rejects(pending, /Command aborted/); } finally { clearTimeout(timer); }
      await assert.rejects(tool.execute("timeout", { command: "sleep 5", timeout: 0.05 }, undefined, undefined, context), /Command timed out after 0.05 seconds/);
    }
  });
});

test("an existing custom Bash stays registered and produces an actionable diagnostic", async () => {
  const warnings: string[] = [];
  const previousWarn = console.warn;
  console.warn = (message) => { warnings.push(String(message)); };
  try {
    await withHost(true, async (session) => {
      assert.equal(session.getToolDefinition("bash")!.description, "Existing customized Bash");
      assert(warnings.some((message) => message.includes("skipped") && message.includes("Unload that override")));
    }, { extra: [(pi) => pi.registerTool({ ...createBashToolDefinition(process.cwd()), description: "Existing customized Bash" })] });
  } finally { console.warn = previousWarn; }
});
