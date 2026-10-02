import assert from "node:assert/strict";
import { test } from "node:test";
import type { ExtensionAPI, ExtensionContext, ExtensionUIContext } from "@earendil-works/pi-coding-agent";
import whimsicalActivity from "../../extensions/whimsical-activity/index.ts";
import { ActivityWordSelector } from "../../extensions/whimsical-activity/word-bank.ts";
import { FakeActivityClock, seededRandom } from "./clock.ts";
import { tty } from "./tty.ts";

function fixture(invalidBank = false) {
  const flags = new Map<string, boolean | string>();
  const handlers = new Map<string, (event: unknown, ctx: ExtensionContext) => unknown>();
  const warnings: string[] = [];
  let banks = 0;
  let message = "Working";
  let indicator: Parameters<ExtensionUIContext["setWorkingIndicator"]>[0];
  const writes: string[] = [];
  const clock = new FakeActivityClock();
  // Only the entry's registration ports are supplied; unexpected execution API use fails.
  whimsicalActivity({
    registerFlag() {},
    getFlag: (name: string) => flags.get(name),
    on: (event: string, handler: (event: unknown, ctx: ExtensionContext) => unknown) => handlers.set(event, handler),
  } as unknown as ExtensionAPI, () => {
    banks++;
    return new ActivityWordSelector(seededRandom(31), invalidBank ? () => "invalid" : undefined);
  }, clock);
  const ui = {
    notify: (text: string) => warnings.push(text),
    setWorkingMessage: (text?: string) => { message = text ?? "Working"; writes.push("message"); },
    setWorkingIndicator: (options?: typeof indicator) => { indicator = options; writes.push("indicator"); },
  };
  const ctx = { mode: "tui", hasUI: true, ui } as unknown as ExtensionContext;
  const emit = (type: string) => {
    assert.equal(handlers.get(type)!({ type }, ctx), undefined, "Notification handlers must not transform execution");
  };
  return { flags, handlers, warnings, clock, ui, ctx, emit, writes,
    banks: () => banks, message: () => message, indicator: () => indicator };
}

test("stock keeps one bank word per loop, no timers, and a shared bag across session replacement", () => {
  const restore = tty();
  try {
    const f = fixture();
    assert.deepEqual([...f.handlers.keys()], ["session_start", "agent_start", "agent_end", "session_shutdown"]);
    f.emit("agent_start"); // No eligible session yet.
    f.emit("session_start");
    assert.equal(f.banks(), 0);
    assert.deepEqual(f.writes, []);
    const reference = new ActivityWordSelector(seededRandom(31));
    for (const reset of ["agent_end", "session_start", "session_shutdown"]) {
      f.emit("agent_start");
      const word = reference.next() + "…";
      assert.equal(f.message(), word);
      f.emit("agent_start");
      f.clock.advance(60000);
      assert.equal(f.message(), word);
      assert.deepEqual(f.clock.pending(), []);
      assert.equal(f.indicator(), undefined);
      f.emit(reset);
      assert.equal(f.message(), "Working");
      assert.deepEqual(f.writes, ["message", "message"]);
      f.writes.length = 0;
      f.emit("agent_end");
      assert.deepEqual(f.writes, []);
    }
    f.emit("session_shutdown");
    f.emit("agent_start");
    assert.deepEqual(f.writes, []);
    assert.equal(f.banks(), 1);
    assert.deepEqual(f.warnings, []);
  } finally { restore(); }
});

for (const motion of ["normal", "reduced", "plain"] as const) {
  test(`stock ${motion}/ASCII sets only owned ports and restores defaults on abort/end`, () => {
    const restore = tty();
    try {
      const f = fixture();
      f.flags.set("activity-display", motion);
      f.flags.set("activity-ascii", true);
      f.emit("session_start");
      f.emit("agent_start");
      assert.equal(f.banks(), motion === "plain" ? 0 : 1);
      if (motion === "plain") assert.equal(f.message(), "Working");
      else assert.equal(f.message(), new ActivityWordSelector(seededRandom(31)).next() + "...");
      assert.deepEqual(f.indicator(), motion === "normal" ? undefined : { frames: motion === "reduced" ? ["*"] : [] });
      assert.deepEqual(f.clock.pending(), []);
      const changed = motion === "normal" ? ["message"] : motion === "plain" ? ["indicator"] : ["indicator", "message"];
      assert.deepEqual(f.writes, changed);
      f.emit("agent_end"); // Pi sends agent_end for cancellation too.
      assert.equal(f.message(), "Working");
      assert.equal(f.indicator(), undefined);
      assert.deepEqual(f.writes.slice(changed.length), motion === "reduced" ? ["message", "indicator"] : changed);
      f.writes.length = 0;
      f.emit("agent_end");
      f.emit("session_start");
      f.emit("session_shutdown");
      f.emit("session_shutdown");
      assert.deepEqual(f.writes, []);
    } finally { restore(); }
  });
}

for (const motion of ["normal", "reduced", "plain"] as const) {
  test(`malformed bank keeps native text in ${motion}, warns once, and never retries the asset`, () => {
    const restore = tty();
    try {
      const f = fixture(true);
      f.flags.set("activity-display", motion);
      for (let i = 0; i < 3; i++) {
        f.emit("session_start");
        f.emit("agent_start");
        assert.equal(f.message(), "Working");
        assert.deepEqual(f.indicator(), motion === "normal" ? undefined : { frames: motion === "plain" ? [] : ["*"] });
        assert.equal(f.writes.includes("message"), false);
        f.emit("agent_end");
      }
      assert.equal(f.banks(), motion === "plain" ? 0 : 1);
      assert.equal(f.warnings.length, motion === "plain" ? 0 : 1);
      assert.deepEqual(f.clock.pending(), []);
    } finally { restore(); }
  });
}

for (const missing of ["setWorkingMessage", "setWorkingIndicator"] as const) {
  test(`missing public ${missing} leaves native UI and warns once with recovery guidance`, () => {
    const restore = tty();
    try {
      const f = fixture();
      Reflect.deleteProperty(f.ui, missing);
      f.emit("session_start"); f.emit("agent_start"); f.emit("agent_end");
      f.emit("session_start"); f.emit("session_shutdown");
      assert.deepEqual(f.writes, []);
      assert.equal(f.banks(), 0);
      assert.equal(f.warnings.length, 1);
      assert.match(f.warnings[0], /Update Pi/);
    } finally { restore(); }
  });
}

for (const disabled of [false, true]) {
  test(`invalid display ${disabled ? "with hard disable is silent" : "warns once"} and never allocates`, () => {
    const restore = tty();
    try {
      const f = fixture();
      f.flags.set("activity-display", "invalid");
      f.flags.set("no-whimsical-activity", disabled);
      f.emit("session_start"); f.emit("agent_start"); f.emit("agent_end");
      f.emit("session_start"); f.emit("session_shutdown");
      assert.deepEqual(f.writes, []);
      assert.equal(f.banks(), 0);
      assert.equal(f.warnings.length, disabled ? 0 : 1);
      if (!disabled) assert.match(f.warnings[0], /expected normal, reduced, or plain/);
    } finally { restore(); }
  });
}

for (const [mode, hasUI, input, output] of [
  ["print", true, true, true], ["json", true, true, true], ["rpc", true, true, true],
  ["tui", false, true, true], ["tui", true, false, true], ["tui", true, true, false],
] as const) {
  test(`stock no-op in ${mode}, hasUI=${hasUI}, TTY=${input}/${output}`, () => {
    const restore = tty(input, output);
    try {
      const f = fixture(true);
      f.ctx.mode = mode; f.ctx.hasUI = hasUI;
      f.emit("session_start"); f.emit("agent_start"); f.emit("agent_end"); f.emit("session_shutdown");
      assert.deepEqual(f.writes, []);
      assert.deepEqual(f.warnings, []);
      assert.equal(f.banks(), 0);
      assert.deepEqual(f.clock.pending(), []);
    } finally { restore(); }
  });
}

test("session replacement resets the old UI before binding a new one, including ineligible replacements", () => {
  const restore = tty();
  try {
    const f = fixture();
    f.flags.set("activity-display", "reduced");
    f.emit("session_start"); f.emit("agent_start");
    f.ctx.ui = { ...f.ctx.ui, setWorkingMessage: () => assert.fail("Ineligible replacement must not write") };
    f.ctx.mode = "rpc";
    f.emit("session_start");
    assert.equal(f.message(), "Working");
    assert.equal(f.indicator(), undefined);
    f.writes.length = 0;
    f.emit("agent_end"); f.emit("agent_start"); f.emit("session_shutdown");
    assert.deepEqual(f.writes, []);
  } finally { restore(); }
});
