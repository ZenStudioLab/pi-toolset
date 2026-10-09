import assert from "node:assert/strict";
import { test } from "node:test";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import speak from "../../extensions/speak/index.ts";

/**
 * Loads the real default export with fetch and spawn rigged to count use. The one file read is the
 * configuration, for the shortcut; `config` is its text, or undefined for a file that cannot be read.
 */
async function load(config?: string) {
  const commands: string[] = [];
  const shortcuts: string[] = [];
  const events = new Map<string, () => void>();
  const used: string[] = [];
  const fetchFn = (async () => {
    used.push("fetch");
    throw new Error("network forbidden");
  }) as typeof fetch;
  const spawnFn = (() => {
    used.push("spawn");
    throw new Error("process forbidden");
  }) as never;
  const readFile = async () => {
    used.push("readFile");
    if (config === undefined) throw new Error("no configuration file");
    return config;
  };
  // SAFETY: The entry may use only registerCommand and on; anything else throws and fails the test.
  const api = {
    registerCommand: (name: string) => commands.push(name),
    registerShortcut: (key: string) => shortcuts.push(key),
    on: (event: string, handler: () => void) => {
      events.set(event, handler);
      return () => undefined;
    },
  } as unknown as ExtensionAPI;
  await speak(api, { fetchFn, spawnFn, readFile, env: {} });
  return { commands, shortcuts, events, used };
}

test("loading registers /speak, /talk, both shortcuts, four cancel-only lifecycle handlers, and three compaction-state handlers, starting no process or request", async () => {
  const realFetch = globalThis.fetch;
  let globalFetches = 0;
  globalThis.fetch = (async () => {
    globalFetches++;
    throw new Error("network forbidden");
  }) as typeof fetch;
  try {
    const { commands, shortcuts, events, used } = await load();
    assert.deepEqual(commands, ["speak", "talk"]);
    assert.deepEqual(shortcuts, ["alt+t", "alt+shift+t"]);
    assert.deepEqual([...events.keys()].sort(), [
      "session_before_compact",
      "session_before_fork",
      "session_before_switch",
      "session_compact",
      "session_compact_failed",
      "session_shutdown",
      "session_tree",
    ]);
    assert.deepEqual(used, ["readFile"]);
  } finally {
    globalThis.fetch = realFetch;
  }
  assert.equal(globalFetches, 0);
});

for (const [name, input, expected] of [
  ["both come from the configuration", { shortcut: "ctrl+alt+m", transcribeShortcut: "ctrl+alt+n" }, ["ctrl+alt+m", "ctrl+alt+n"]],
  ["one set key keeps the other's default", { shortcut: "ctrl+alt+m" }, ["ctrl+alt+m", "alt+shift+t"]],
  ["equal keys register both defaults", { shortcut: "alt+x", transcribeShortcut: "alt+x" }, ["alt+t", "alt+shift+t"]],
] as const)
  test(`the shortcuts at load: ${name}`, async () => {
    const { shortcuts, used } = await load(JSON.stringify({ input }));
    assert.deepEqual(shortcuts, expected);
    assert.deepEqual(used, ["readFile"]);
  });

test("a configuration that cannot be read at load registers both default shortcuts", async () => {
  const { shortcuts } = await load("{ not json");
  assert.deepEqual(shortcuts, ["alt+t", "alt+shift+t"]);
});

test("the extension subscribes to no agent, turn, tool, or message event, so ordinary activity cannot reach it", async () => {
  const { events } = await load();
  for (const event of [
    "session_start",
    "agent_start",
    "agent_end",
    "turn_start",
    "turn_end",
    "message_end",
    "tool_call",
    "tool_result",
    "before_agent_start",
  ])
    assert.ok(!events.has(event), event);
});

test("firing every lifecycle handler with nothing active starts no request, process, or file read", async () => {
  const { events, used } = await load();
  const afterLoad = [...used];
  for (const handler of events.values()) handler();
  assert.deepEqual(used, afterLoad);
  assert.ok(!used.includes("spawn") && !used.includes("fetch"));
});

test("a reload rebuilds the extension and still starts no recorder or request", async () => {
  for (const reload of [await load(), await load()]) {
    for (const handler of reload.events.values()) handler();
    assert.deepEqual(reload.used, ["readFile"]);
  }
});
