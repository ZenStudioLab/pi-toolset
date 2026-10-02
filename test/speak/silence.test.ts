import assert from "node:assert/strict";
import { test } from "node:test";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import speak from "../../extensions/speak/index.ts";

/** Loads the real default export with fetch, spawn, and the filesystem all rigged to count use. */
function load() {
  const commands: string[] = [];
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
    throw new Error("filesystem forbidden");
  };
  // SAFETY: The entry may use only registerCommand and on; anything else throws and fails the test.
  const api = {
    registerCommand: (name: string) => commands.push(name),
    on: (event: string, handler: () => void) => {
      events.set(event, handler);
      return () => undefined;
    },
  } as unknown as ExtensionAPI;
  speak(api, { fetchFn, spawnFn, readFile, env: {} });
  return { commands, events, used };
}

test("loading registers only /speak and four cancel-only lifecycle handlers, using nothing", () => {
  const realFetch = globalThis.fetch;
  let globalFetches = 0;
  globalThis.fetch = (async () => {
    globalFetches++;
    throw new Error("network forbidden");
  }) as typeof fetch;
  try {
    const { commands, events, used } = load();
    assert.deepEqual(commands, ["speak"]);
    assert.deepEqual([...events.keys()].sort(), [
      "session_before_fork",
      "session_before_switch",
      "session_shutdown",
      "session_tree",
    ]);
    assert.deepEqual(used, []);
  } finally {
    globalThis.fetch = realFetch;
  }
  assert.equal(globalFetches, 0);
});

test("the extension subscribes to no agent, turn, tool, or message event, so ordinary activity cannot reach it", () => {
  const { events } = load();
  for (const event of ["session_start", "agent_start", "agent_end", "turn_start", "turn_end", "message_end", "tool_call", "tool_result", "before_agent_start"])
    assert.ok(!events.has(event), event);
});

test("firing every lifecycle handler with nothing active starts no request, process, or file read", () => {
  const { events, used } = load();
  for (const handler of events.values()) handler();
  assert.deepEqual(used, []);
});
