import assert from "node:assert/strict";
import { test } from "node:test";
import type {
  ActivityDecorationFactory as HostFactory,
  ActivityDecorationSnapshot as HostSnapshot,
} from "../../host/pi/packages/coding-agent/src/core/extensions/activity-decoration.ts";
import {
  ActivityController,
  type ActivityDecorationPresentation,
  type ActivityDecorationSnapshot,
  type ActivityDecorationUpdate,
} from "../../extensions/whimsical-activity/activity-controller.ts";
import type { ActivityIndicatorPreferences } from "../../extensions/whimsical-activity/preferences.ts";
import { ActivityWordSelector } from "../../extensions/whimsical-activity/word-bank.ts";
import {
  defaultPreferences,
  FakeActivityClock,
  seededRandom,
} from "./clock.ts";

function fixture(
  preferences: Partial<ActivityIndicatorPreferences> = {},
  invalidBank = false,
) {
  const clock = new FakeActivityClock();
  const selector = invalidBank
    ? new ActivityWordSelector(seededRandom(91), () => "invalid")
    : new ActivityWordSelector(seededRandom(91));
  const selections: string[] = [];
  const next = selector.next.bind(selector);
  selector.next = () => {
    const word = next();
    selections.push(word);
    return word;
  };
  let constructed = 0;
  const controller = new ActivityController(() => {
    constructed++;
    return selector;
  }, clock);
  // Compile-time compatibility with the actual modified source API, not published 0.87.1 types.
  const hostFactory: HostFactory = () => controller;
  assert.equal(hostFactory(), controller);
  const presentations: ActivityDecorationPresentation[] = [];
  const update: ActivityDecorationUpdate = (value) => {
    presentations.push(value);
    return true;
  };
  let state: HostSnapshot = {
    runId: Symbol("foreground"),
    ownerGeneration: 1,
    kind: "working",
    genericWorking: true,
    eligible: true,
    visible: true,
    waiting: false,
    preferences: Object.freeze({ ...defaultPreferences, ...preferences }),
  };
  const snapshot = (
    change: Partial<ActivityDecorationSnapshot> = {},
    handle = update,
  ) => {
    state = Object.freeze({ ...state, ...change });
    controller.onSnapshot(state, handle);
  };
  const label = () => presentations.at(-1)?.label;
  const preferencesUpdate = (change: Partial<ActivityIndicatorPreferences>) =>
    snapshot({
      preferences: Object.freeze({ ...state.preferences, ...change }),
    });
  return {
    controller,
    clock,
    selector,
    selections,
    presentations,
    snapshot,
    label,
    preferencesUpdate,
    constructed: () => constructed,
  };
}

test("AT08–AT10: 200ms finishes without selection; 249/250ms visibility and independent 8s rotation", () => {
  const f = fixture();
  f.snapshot();
  assert.equal(f.constructed(), 0);
  assert.deepEqual(f.presentations.at(-1), { glyph: "hidden" });
  assert.equal(f.clock.pending().length, 1);
  f.clock.advance(200);
  f.snapshot({ runId: undefined, kind: undefined, visible: false });
  f.clock.advance(1000);
  assert.equal(f.constructed(), 0);
  assert.equal(f.selections.length, 0);
  assert.equal(f.clock.pending().length, 0);
  f.snapshot({ runId: Symbol("next"), kind: "working", visible: true });
  f.clock.advance(249);
  assert.equal(f.label(), undefined);
  f.clock.advance(1);
  assert.equal(f.constructed(), 1);
  assert.equal(f.selections.length, 1);
  assert.equal(f.label(), f.selections[0] + "…");
  assert.deepEqual(f.presentations.at(-1), {
    glyph: "animated",
    label: f.label(),
    reservedWidth: 14,
  });
  f.clock.advance(7999);
  assert.equal(f.selections.length, 1);
  f.clock.advance(1);
  assert.equal(f.selections.length, 2);
  assert.equal(f.label(), f.selections[1] + "…");
  f.snapshot({ runId: undefined, kind: undefined, visible: false });
  assert.equal(f.clock.pending().length, 0);
});

test("AT07/AT12: repeated snapshots and phase transfers preserve word and deadline", () => {
  const f = fixture();
  f.snapshot();
  const display = f.clock.pending()[0];
  f.clock.advance(100);
  for (let i = 0; i < 50; i++) f.snapshot();
  assert.equal(f.clock.pending()[0], display);
  f.snapshot({ kind: "retry", genericWorking: false, ownerGeneration: 2 });
  assert.equal(f.clock.pending()[0], display);
  f.clock.advance(150);
  assert.equal(f.selections.length, 0);
  assert.equal(f.clock.pending().length, 0);
  f.snapshot({ kind: "working", genericWorking: true, ownerGeneration: 3 });
  const deadline = f.clock.pending()[0];
  const word = f.label();
  let oldCalls = 0;
  let newCalls = 0;
  f.snapshot({}, () => {
    oldCalls++;
    return true;
  });
  f.clock.advance(4000);
  f.snapshot({ kind: "compaction", ownerGeneration: 3 }, (value) => {
    newCalls++;
    f.presentations.push(value);
    return true;
  });
  assert.equal(f.clock.pending()[0], deadline);
  assert.equal(f.label(), word);
  const oldCallsBeforeRotation = oldCalls;
  f.clock.advance(3999);
  assert.equal(f.selections.length, 1);
  f.clock.advance(1);
  assert.equal(f.selections.length, 2);
  assert.equal(oldCalls, oldCallsBeforeRotation);
  assert.ok(newCalls >= 2);
  f.controller.dispose();
  assert.equal(f.clock.pending().length, 0);
});

for (const suppression of [
  { waiting: true, visible: false },
  { visible: false },
  { eligible: false },
]) {
  test(`AT13: visible run suppression ${JSON.stringify(suppression)} retains word and resumes with a fresh deadline`, () => {
    const f = fixture();
    f.snapshot();
    f.clock.advance(250);
    const word = f.label();
    f.clock.advance(3500);
    const stale = f.clock.pending()[0];
    f.snapshot(suppression);
    assert.equal(f.clock.pending().length, 0);
    f.clock.advance(20000);
    f.clock.deliver(stale);
    assert.equal(f.selections.length, 1);
    f.snapshot({ waiting: false, visible: true, eligible: true });
    assert.equal(f.label(), word);
    assert.equal(f.clock.pending()[0].deadline, f.clock.time + 8000);
    f.clock.advance(7999);
    assert.equal(f.selections.length, 1);
    f.clock.advance(1);
    assert.equal(f.selections.length, 2);
    f.controller.dispose();
  });
}

test("AT13: never-visible resume restarts 250ms; idle prompt dismissal cannot start activity", () => {
  const f = fixture();
  f.snapshot();
  f.clock.advance(200);
  const stale = f.clock.pending()[0];
  f.snapshot({ waiting: true, visible: false });
  f.clock.advance(10000);
  f.snapshot({ waiting: false, visible: true });
  f.clock.deliver(stale);
  f.clock.advance(249);
  assert.equal(f.selections.length, 0);
  f.clock.advance(1);
  assert.equal(f.selections.length, 1);
  f.snapshot({
    runId: undefined,
    kind: undefined,
    visible: false,
    waiting: true,
  });
  f.snapshot({ waiting: false });
  f.clock.advance(20000);
  assert.equal(f.clock.pending().length, 0);
  assert.equal(f.selections.length, 1);
});

for (const visible of [false, true]) {
  test(`AT14–AT15: replacement/disposal revoke queued callbacks (${visible ? "visible" : "pending delay"})`, () => {
    const f = fixture();
    f.snapshot();
    if (visible) f.clock.advance(250);
    const before = f.selections.length;
    const stale = f.clock.pending()[0];
    f.snapshot({ runId: Symbol("replacement") });
    const replacementTimer = f.clock.pending()[0];
    f.clock.deliver(stale);
    assert.equal(f.selections.length, before);
    assert.equal(f.clock.pending()[0], replacementTimer);
    f.clock.advance(250);
    assert.equal(f.selections.length, before + 1);
    const queued = f.clock.pending()[0];
    const count = f.presentations.length;
    f.controller.dispose();
    f.controller.dispose();
    f.clock.deliver(queued);
    f.snapshot({ runId: Symbol("after disposal") });
    assert.equal(f.selections.length, before + 1);
    assert.equal(f.presentations.length, count);
    assert.equal(f.clock.pending().length, 0);
  });
}

for (const visible of [false, true]) {
  test(`AT14–AT15: authoritative terminal snapshot cancels ${visible ? "rotation" : "display delay"} and queued work`, () => {
    const f = fixture();
    f.snapshot();
    if (visible) f.clock.advance(250);
    const stale = f.clock.pending()[0];
    const selected = f.selections.length;
    const updates = f.presentations.length;
    // Settlement, cancellation and errors share this host-owned terminal state; E3 tests their native producers.
    f.snapshot({ runId: undefined, kind: undefined, visible: false });
    assert.equal(f.clock.pending().length, 0);
    f.clock.advance(20000);
    f.clock.deliver(stale);
    assert.equal(f.selections.length, selected);
    assert.equal(f.presentations.length, updates);
    f.controller.dispose();
  });
}

test("AT15: rejected scoped handle cancels resources before consuming a word", () => {
  const f = fixture();
  let accepted = true;
  f.snapshot({}, () => accepted);
  accepted = false;
  f.clock.advance(250);
  assert.equal(f.selections.length, 0);
  assert.equal(f.constructed(), 0);
  assert.equal(f.clock.pending().length, 0);
  f.snapshot();
  f.clock.advance(250);
  assert.equal(f.selections.length, 1);
  const pending = f.clock.pending()[0];
  f.snapshot({}, () => false);
  f.clock.deliver(pending);
  assert.equal(f.selections.length, 1);
  assert.equal(f.clock.pending().length, 0);
});

test("AT17: late callback selects at most once and schedules from now; replay cannot burst", () => {
  const f = fixture();
  f.snapshot();
  f.clock.advance(250);
  const due = f.clock.pending()[0];
  f.clock.time += 50000;
  f.clock.deliver(due);
  assert.equal(f.selections.length, 2);
  assert.equal(f.clock.pending().length, 1);
  assert.equal(f.clock.pending()[0].deadline, f.clock.time + 8000);
  f.clock.deliver(due);
  assert.equal(f.selections.length, 2);
  f.controller.dispose();
});

test("monotonic deadline tolerates early delivery without selecting or shifting its deadline", () => {
  const f = fixture();
  f.snapshot();
  const early = f.clock.pending()[0];
  f.clock.advance(100);
  f.clock.deliver(early);
  assert.equal(f.clock.pending()[0].deadline, 250);
  f.clock.deliver(early);
  assert.equal(f.clock.pending().length, 1);
  f.clock.advance(150);
  assert.equal(f.selections.length, 1);
  f.controller.dispose();
});

test("AT19: reduced is static, retains one word through phases and resume, and has no recurring timers", () => {
  const f = fixture({ motion: "reduced", ascii: false });
  f.snapshot();
  f.clock.advance(250);
  const word = f.label();
  assert.equal(f.presentations.at(-1)?.glyph, "static");
  assert.equal(f.clock.pending().length, 0);
  f.clock.advance(60000);
  f.snapshot({ kind: "branchSummary", ownerGeneration: 2 });
  f.snapshot({ waiting: true, visible: false });
  f.snapshot({ waiting: false, visible: true });
  assert.equal(f.label(), word);
  assert.equal(f.selections.length, 1);
  assert.equal(f.clock.pending().length, 0);
  f.snapshot({ runId: Symbol("new") });
  f.clock.advance(250);
  assert.equal(f.selections.length, 2);
  assert.equal(f.clock.pending().length, 0);
  f.controller.dispose();
});

test("AT20: plain exposes hidden native glyph only, without bank construction or deadlines", () => {
  const f = fixture({ motion: "plain", ascii: false });
  f.snapshot();
  f.clock.advance(60000);
  f.snapshot({ kind: "retry", ownerGeneration: 2 });
  assert.deepEqual(f.presentations, [{ glyph: "hidden" }, { glyph: "hidden" }]);
  assert.equal(f.constructed(), 0);
  assert.equal(f.selections.length, 0);
  assert.equal(f.clock.pending().length, 0);
  f.controller.dispose();
});

test("AT02/AT18: ASCII supplies one suffix and fixed 16-cell reservation across rotations", () => {
  const f = fixture({ motion: "normal", ascii: true });
  f.snapshot();
  f.clock.advance(250);
  assert.equal(f.label(), f.selections[0] + "...");
  assert.equal(f.presentations.at(-1)?.reservedWidth, 16);
  f.clock.advance(8000);
  assert.equal(f.label(), f.selections[1] + "...");
  assert.equal(f.presentations.at(-1)?.reservedWidth, 16);
  f.controller.dispose();
});

for (const kind of [
  "working",
  "retry",
  "compaction",
  "branchSummary",
] as const) {
  test(`AM01/AM10: meaningful ${kind} defers first bank draw, not glyph or earned visibility`, () => {
    const f = fixture();
    f.snapshot({ kind, genericWorking: false });
    f.clock.advance(249);
    assert.deepEqual(f.presentations.at(-1), { glyph: "hidden" });
    f.clock.advance(1);
    assert.deepEqual(f.presentations.at(-1), { glyph: "animated" });
    assert.equal(f.constructed(), 0);
    assert.equal(f.clock.pending().length, 0);
    f.clock.advance(10000);
    f.snapshot({ kind: "working", genericWorking: true, ownerGeneration: 2 });
    assert.equal(f.selections.length, 1);
    assert.equal(f.label(), f.selections[0] + "…");
    assert.equal(f.clock.pending()[0].deadline, f.clock.time + 8000);
    f.controller.dispose();
  });
}

test("AM02/AM09: Operational gates glyph once, owns no bank/rotation, and gives a never-shown word a fresh delay", () => {
  const f = fixture({ text: "operational" });
  f.snapshot();
  const gate = f.clock.pending()[0];
  f.clock.advance(200);
  f.preferencesUpdate({ animation: "bounce", color: "claude" });
  assert.equal(f.clock.pending()[0], gate);
  f.clock.advance(50);
  assert.deepEqual(f.presentations.at(-1), { glyph: "animated" });
  assert.equal(f.clock.pending().length, 0);
  assert.equal(f.constructed(), 0);
  f.clock.advance(30000);
  f.preferencesUpdate({ text: "both" });
  assert.equal(f.clock.pending()[0].deadline, f.clock.time + 250);
  f.clock.advance(249);
  assert.equal(f.selections.length, 0);
  f.clock.advance(1);
  assert.equal(f.selections.length, 1);
  f.controller.dispose();
});

test("AM02/AM10: live text, motion, enable and ASCII updates retain the word/bag and restart only suspended deadlines", () => {
  const f = fixture();
  f.snapshot();
  f.clock.advance(250);
  const word = f.selections[0];
  const deadline = f.clock.pending()[0];
  f.clock.advance(3000);
  f.preferencesUpdate({
    text: "both",
    animation: "random",
    color: "claude",
    randomTiming: "periodically",
    ascii: true,
  });
  assert.equal(f.clock.pending()[0], deadline);
  assert.equal(f.label(), word + "...");
  f.preferencesUpdate({ text: "operational" });
  assert.deepEqual(f.presentations.at(-1), { glyph: "animated" });
  assert.equal(f.clock.pending().length, 0);
  f.clock.deliver(deadline);
  assert.equal(f.selections.length, 1);
  f.clock.advance(20000);
  f.preferencesUpdate({ text: "whimsical" });
  assert.equal(f.label(), word + "...");
  assert.equal(f.clock.pending()[0].deadline, f.clock.time + 8000);
  f.preferencesUpdate({ motion: "reduced" });
  assert.equal(f.presentations.at(-1)?.glyph, "static");
  assert.equal(f.clock.pending().length, 0);
  f.clock.advance(20000);
  f.preferencesUpdate({ animation: "diamond" });
  assert.equal(f.label(), word + "...");
  f.preferencesUpdate({ motion: "plain" });
  assert.deepEqual(f.presentations.at(-1), { glyph: "hidden" });
  assert.equal(f.clock.pending().length, 0);
  f.preferencesUpdate({ motion: "normal", enabled: false });
  assert.equal(f.clock.pending().length, 0);
  f.clock.advance(20000);
  f.preferencesUpdate({ enabled: true });
  assert.equal(f.label(), word + "...");
  assert.equal(f.clock.pending()[0].deadline, f.clock.time + 8000);
  assert.equal(f.constructed(), 1);
  assert.equal(f.selections.length, 1);
  f.clock.advance(8000);
  assert.equal(f.selections.length, 2);
  f.controller.dispose();
});

for (const preferences of [{ motion: "plain" as const }, { enabled: false }]) {
  test(`AM09: initial ${JSON.stringify(preferences)} allocates nothing and reactivation uses current run authority`, () => {
    const f = fixture(preferences);
    f.snapshot();
    f.clock.advance(20000);
    assert.equal(f.constructed(), 0);
    assert.equal(f.clock.pending().length, 0);
    f.snapshot({ runId: Symbol("current") });
    f.preferencesUpdate({ enabled: true, motion: "normal" });
    f.clock.advance(249);
    assert.equal(f.selections.length, 0);
    f.clock.advance(1);
    assert.equal(f.selections.length, 1);
    f.controller.dispose();
  });
}

test("AM10: animation/color/timing changes and render-like snapshots preserve the initial gate and visible deadline", () => {
  const f = fixture();
  f.snapshot();
  const gate = f.clock.pending()[0];
  f.clock.advance(200);
  for (const animation of ["bounce", "dots", "random", "classic"] as const) {
    f.preferencesUpdate({
      animation,
      color: "claude",
      randomTiming: "periodically",
    });
    assert.equal(f.clock.pending()[0], gate);
    assert.equal(f.constructed(), 0);
  }
  f.clock.advance(50);
  const word = f.label();
  const deadline = f.clock.pending()[0];
  f.clock.advance(4000);
  for (let i = 0; i < 30; i++) f.snapshot();
  f.preferencesUpdate({ animation: "asterisk", color: "theme" });
  assert.equal(f.label(), word);
  assert.equal(f.clock.pending()[0], deadline);
  assert.equal(f.selections.length, 1);
  f.clock.advance(4000);
  assert.equal(f.selections.length, 2);
  f.controller.dispose();
});

test("AM01/AT06: invalid-bank provenance emits typed native fallback, never a decorative Working or useless rotation", () => {
  const f = fixture({}, true);
  f.snapshot();
  f.clock.advance(250);
  assert.deepEqual(f.presentations.at(-1), {
    glyph: "animated",
    nativeTextFallback: true,
  });
  assert.equal(f.selections.length, 0);
  assert.equal(f.constructed(), 1);
  assert.equal(f.clock.pending().length, 0);
  f.preferencesUpdate({ ascii: true, text: "both" });
  assert.deepEqual(f.presentations.at(-1), {
    glyph: "animated",
    nativeTextFallback: true,
  });
  f.snapshot({ kind: "retry", genericWorking: false, ownerGeneration: 2 });
  f.snapshot({ waiting: true, visible: false });
  f.clock.advance(20000);
  f.snapshot({ waiting: false, visible: true });
  assert.deepEqual(f.presentations.at(-1), {
    glyph: "animated",
    nativeTextFallback: true,
  });
  assert.equal(f.clock.pending().length, 0);
  f.preferencesUpdate({ text: "operational" });
  assert.deepEqual(f.presentations.at(-1), { glyph: "animated" });
  f.preferencesUpdate({ motion: "plain" });
  assert.deepEqual(f.presentations.at(-1), { glyph: "hidden" });
  f.controller.dispose();
});

test("MD05/08: host metadata toggles are structural only; they never change word identity or deadlines", () => {
  const f = fixture();
  f.snapshot();
  const gate = f.clock.pending()[0];
  f.preferencesUpdate({
    showElapsed: false,
    showAction: false,
    showOutputTokens: false,
  });
  assert.equal(f.clock.pending()[0], gate);
  f.clock.advance(250);
  const word = f.label();
  const deadline = f.clock.pending()[0];
  f.preferencesUpdate({
    showElapsed: true,
    showAction: true,
    showOutputTokens: true,
  });
  assert.equal(f.label(), word);
  assert.equal(f.clock.pending()[0], deadline);
  assert.equal(f.selections.length, 1);
  f.controller.dispose();
});

test("AT06: valid literal Working is still a bank label, never inferred fallback", () => {
  const clock = new FakeActivityClock();
  const selector = new ActivityWordSelector(
    () => 0,
    () =>
      JSON.stringify({ schemaVersion: 1, locale: "en", words: ["Working"] }),
  );
  const controller = new ActivityController(() => selector, clock);
  const values: ActivityDecorationPresentation[] = [];
  controller.onSnapshot(
    Object.freeze({
      runId: Symbol(),
      ownerGeneration: 1,
      kind: "working",
      genericWorking: true,
      eligible: true,
      visible: true,
      waiting: false,
      preferences: defaultPreferences,
    }),
    (value) => {
      values.push(value);
      return true;
    },
  );
  clock.advance(250);
  assert.deepEqual(values.at(-1), {
    glyph: "animated",
    label: "Working…",
    reservedWidth: 8,
  });
  assert.equal(clock.pending().length, 1);
  controller.dispose();
});

for (const accepted of [true, false]) {
  test(`AT15/AM10: reentrant scoped update (accepted=${accepted}) cannot draw for or suspend a replacement run`, () => {
    const f = fixture();
    let replace = false;
    f.snapshot({}, () => {
      if (replace) {
        replace = false;
        f.snapshot({ runId: Symbol("new") });
        return accepted;
      }
      return true;
    });
    replace = true;
    f.clock.advance(250);
    assert.equal(f.constructed(), 0);
    assert.equal(f.selections.length, 0);
    assert.equal(f.clock.pending()[0].deadline, 500);
    f.clock.advance(250);
    assert.equal(f.selections.length, 1);
    f.controller.dispose();
  });
}
