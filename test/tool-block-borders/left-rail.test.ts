import assert from "node:assert/strict";
import test from "node:test";
import { Text, stripTerminalSequences, visibleWidth, type TuiMouseEvent } from "@earendil-works/pi-tui";
import { LeftRail } from "../../extensions/tool-block-borders/left-rail.ts";

const theme = {
  fg: (_role: string, text: string) => `\x1b[38;2;255;100;0m${text}\x1b[39m`,
  bg: (_role: string, text: string) => `\x1b[48;2;255;255;255m${text}\x1b[49m`,
};

test("native ANSI/wide-character layout survives framing and successive resizes", () => {
  const child = new Text("\x1b[31m你好\x1b[0m é 🎹 abc def\nsecond line", 0, 0);
  const rail = new LeftRail(child, { theme, isPartial: true, isError: false });
  for (const width of [40, 8, 4, 15]) {
    const lines = rail.render(width);
    assert(lines.every((line) => visibleWidth(line) === width));
    assert.deepEqual(lines.map((line) => stripTerminalSequences(line).slice(2).trimEnd()),
      child.render(width - 2).map((line) => stripTerminalSequences(line).trimEnd()));
    assert(lines.every((line) => stripTerminalSequences(line).startsWith("┃ ")));
  }
  // Keep native output escapes intact rather than rewriting its ANSI styling.
  assert(rail.render(40)[0]!.includes("\x1b[31m你好\x1b[0m"));
});

test("empty and narrow viewports do not manufacture cards or negative child widths", () => {
  const child = new Text("abc", 0, 0);
  const rail = new LeftRail(child, { theme, isPartial: false, isError: false });
  assert.deepEqual(rail.render(0), []);
  for (const width of [1, 2, 3]) assert.deepEqual(rail.render(width), child.render(width));
  assert.deepEqual(new LeftRail({ render: () => [], invalidate() {} }, rail.appearance).render(30), []);
});

test("render-time theme and pending/success/error roles update cached backgrounds", () => {
  const roles: string[] = [];
  const tracked = {
    fg: (role: string, text: string) => { roles.push(role); return theme.fg(role, text); },
    bg: (role: string, text: string) => { roles.push(role); return theme.bg(role, text); },
  };
  const rail = new LeftRail(new Text("output", 0, 0), { theme: tracked, isPartial: true, isError: false });
  rail.render(20);
  assert(roles.includes("borderAccent") && roles.includes("toolPendingBg"));
  roles.length = 0;
  rail.appearance.isPartial = false;
  rail.render(20);
  assert(roles.includes("toolSuccessBg"));
  roles.length = 0;
  rail.appearance.isError = true;
  rail.render(20);
  assert(roles.includes("error") && roles.includes("toolErrorBg"));
  rail.appearance.theme = { ...theme, fg: (_role, text) => `\x1b[32m${text}\x1b[39m` };
  rail.invalidate();
  assert(rail.render(20)[0]!.includes("\x1b[32m┃"));
});

test("child mouse coordinates exclude decoration; keyboard and invalidation still reach child", () => {
  const received: TuiMouseEvent[] = [];
  const inputs: string[] = [];
  let invalidated = false;
  const rail = new LeftRail({
    render: () => ["click"], invalidate() { invalidated = true; },
    handleMouse(event) { received.push(event); return { handled: true }; },
    handleInput(data) { inputs.push(data); }, wantsKeyRelease: true,
  }, { theme, isPartial: false, isError: false });
  const event: TuiMouseEvent = {
    type: "click", button: "left", x: 5, y: 1, width: 20, height: 2,
    screenX: 50, screenY: 10, shift: false, alt: false, ctrl: false,
  };
  assert.deepEqual(rail.handleMouse(event), { handled: true });
  assert.deepEqual(received[0], { ...event, x: 3, width: 18 });
  assert.equal(rail.handleMouse({ ...event, x: 0 }), undefined);
  rail.handleMouse({ ...event, x: 1, width: 3 });
  assert.deepEqual(received[1], { ...event, x: 1, width: 3 });
  rail.handleInput("key");
  rail.invalidate();
  assert.deepEqual(inputs, ["key"]);
  assert(invalidated && rail.wantsKeyRelease);
});
