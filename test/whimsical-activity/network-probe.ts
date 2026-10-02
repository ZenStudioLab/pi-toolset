import assert from "node:assert/strict";
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
assert.deepEqual(networkAttempts, []);
console.log(
  JSON.stringify({
    first,
    second,
    networkAttempts,
    pending: clock.pending().length,
  }),
);
