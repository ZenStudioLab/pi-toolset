import assert from "node:assert/strict";
import { test } from "node:test";
import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";
import speak, { SPEAK_USAGE } from "../../extensions/speak/index.ts";

type Handler = (args: string, ctx: ExtensionCommandContext) => Promise<void>;

function load() {
  const commands = new Map<string, Handler>();
  const events: string[] = [];
  // SAFETY: Only registerCommand and on are exercised; the entry must use nothing else at load.
  const api = {
    registerCommand: (name: string, options: { handler: Handler }) =>
      commands.set(name, options.handler),
    on: (event: string) => {
      events.push(event);
      return () => undefined;
    },
  } as unknown as ExtensionAPI;
  speak(api);
  return { commands, events };
}

test("loading registers only /speak and performs no network call", () => {
  const realFetch = globalThis.fetch;
  let fetches = 0;
  globalThis.fetch = (async () => {
    fetches++;
    throw new Error("network forbidden");
  }) as typeof fetch;
  try {
    const { commands } = load();
    assert.deepEqual([...commands.keys()], ["speak"]);
  } finally {
    globalThis.fetch = realFetch;
  }
  assert.equal(fetches, 0);
});

test("the scaffold command only shows usage", async () => {
  const { commands } = load();
  const notices: string[] = [];
  // SAFETY: The handler reads only ctx.ui.notify.
  const ctx = {
    ui: { notify: (message: string) => notices.push(message) },
  } as unknown as ExtensionCommandContext;
  await commands.get("speak")!("anything", ctx);
  assert.deepEqual(notices, [SPEAK_USAGE]);
});
