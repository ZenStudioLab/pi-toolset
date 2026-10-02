import assert from "node:assert/strict";
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import { tty } from "./tty.ts";
import { loadExtensions } from "../../node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/loader.js";
import { fileURLToPath } from "node:url";
import {
  ActivityController,
  type ActivityDecorationPresentation,
} from "../../extensions/whimsical-activity/activity-controller.ts";
import { ActivityWordSelector } from "../../extensions/whimsical-activity/word-bank.ts";
import {
  defaultPreferences,
  FakeActivityClock,
  seededRandom,
} from "./clock.ts";
import { networkAttempts } from "./network-sentinel.ts";

const loaded = await loadExtensions(
  [
    fileURLToPath(
      new URL("../../extensions/whimsical-activity/index.ts", import.meta.url),
    ),
  ],
  process.cwd(),
);
assert.deepEqual(loaded.errors, []);
assert.equal(loaded.extensions.length, 1);
assert.deepEqual([...loaded.extensions[0].handlers.keys()].sort(), [
  "agent_end",
  "agent_start",
  "session_shutdown",
  "session_start",
]);
const clock = new FakeActivityClock();
const selector = new ActivityWordSelector(seededRandom(71));
const controller = new ActivityController(() => selector, clock);
const presentations: ActivityDecorationPresentation[] = [];
controller.onSnapshot(
  {
    runId: Symbol("local probe"),
    ownerGeneration: 1,
    kind: "working",
    genericWorking: true,
    preferences: defaultPreferences,
    eligible: true,
    visible: true,
    waiting: false,
  },
  (value) => {
    presentations.push(value);
    return true;
  },
);
clock.advance(250);
const first = presentations.at(-1)!.label!;
assert.ok(selector.words.includes(first.slice(0, -1)));
clock.advance(8000);
const second = presentations.at(-1)!.label!;
assert.notEqual(first, second);
controller.dispose();
assert.equal(clock.pending().length, 0);
const restore = tty();
const timeout = globalThis.setTimeout;
const interval = globalThis.setInterval;
try {
  globalThis.setTimeout = Object.assign(() => assert.fail("Stock must not schedule delayed writes"), { __promisify__: timeout.__promisify__ });
  globalThis.setInterval = (() => assert.fail("Stock must not schedule rotation")) as typeof setInterval;
  let working = "Working";
  const ctx = { mode: "tui", hasUI: true, ui: {
    notify: () => assert.fail("Stock has the required public capabilities"),
    setWorkingMessage: (message?: string) => { working = message ?? "Working"; },
    setWorkingIndicator: () => assert.fail("Normal stock must leave native animation alone"),
  } } as unknown as ExtensionContext;
  for (const type of ["session_start", "agent_start", "agent_end", "session_shutdown"] as const) {
    for (const handler of loaded.extensions[0].handlers.get(type) ?? []) {
      await handler({ type }, ctx);
    }
    if (type === "agent_start") assert.ok(selector.words.includes(working.slice(0, -1)));
    if (type === "agent_end") assert.equal(working, "Working");
  }
} finally {
  globalThis.setTimeout = timeout;
  globalThis.setInterval = interval;
  restore();
}
assert.deepEqual(networkAttempts, []);
console.log(
  JSON.stringify({
    first,
    second,
    networkAttempts,
    pending: clock.pending().length,
  }),
);
