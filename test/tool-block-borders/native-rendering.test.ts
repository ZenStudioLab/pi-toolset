import assert from "node:assert/strict";
import test from "node:test";
import { createBashToolDefinition, initTheme, ToolExecutionComponent } from "@earendil-works/pi-coding-agent";
import { stripTerminalSequences, visibleWidth, type TUI, type TuiMouseEvent } from "@earendil-works/pi-tui";
import { frameBash } from "../../extensions/tool-block-borders/bash-framing.ts";
import { LeftRail } from "../../extensions/tool-block-borders/left-rail.ts";

const ui = { requestRender() {} } as TUI;
const text = (block: ToolExecutionComponent, width = 60) => block.render(width).map(stripTerminalSequences).join("\n");

test("real host streaming reuses unwrapped native components, finishes timing, and recolors both slots", () => {
  initTheme("dark", false);
  const native = createBashToolDefinition(process.cwd());
  const renderCall = native.renderCall!;
  const renderResult = native.renderResult!;
  let state: Parameters<typeof renderCall>[2]["state"] | undefined;
  const callChildren = new Set();
  const resultChildren = new Set();
  native.renderCall = (args, theme, context) => {
    assert(!(context.lastComponent instanceof LeftRail));
    state = context.state;
    const child = renderCall(args, theme, context);
    callChildren.add(child);
    return child;
  };
  native.renderResult = (result, options, theme, context) => {
    assert(!(context.lastComponent instanceof LeftRail));
    assert.equal(context.state, state);
    const child = renderResult(result, options, theme, context);
    resultChildren.add(child);
    return child;
  };
  const block = new ToolExecutionComponent("bash", "stream", { command: "demo" }, {}, frameBash(native), ui, process.cwd());
  block.markExecutionStarted();
  try {
    for (const output of ["one", "one\ntwo", "one\ntwo\nthree"]) {
      block.updateResult({ content: [{ type: "text", text: output }], isError: false }, true);
      assert.equal((text(block).match(/\$ demo/g) ?? []).length, 1);
      assert(text(block).includes(output.split("\n").at(-1)!));
    }
    assert(state?.interval);
    assert(text(block).includes("Elapsed"));
    block.updateResult({ content: [{ type: "text", text: "one\ntwo\nthree" }], isError: false });
    assert.equal(state?.interval, undefined);
    assert(text(block).includes("Took"));
    assert.equal(callChildren.size, 1);
    assert.equal(resultChildren.size, 1);
    const dark = block.render(60);
    assert(dark.slice(1).every((line) => stripTerminalSequences(line).startsWith("┃ ")));
    initTheme("light", false);
    block.invalidate();
    const light = block.render(60);
    assert.notEqual(light[1], dark[1]);
    assert.deepEqual(light.map(stripTerminalSequences), dark.map(stripTerminalSequences));
    block.updateResult({ content: [{ type: "text", text: "Command exited with code 1" }], isError: true });
    assert(text(block).includes("Command exited with code 1"));
    assert.notEqual(block.render(60)[1], light[1]);
  } finally {
    // Native completion owns timer cleanup even if a preceding assertion fails.
    block.updateResult({ content: [], isError: false });
  }
});

test("real host preview/truncation, expand/collapse, resize, and fullscreen click region remain usable", () => {
  initTheme("dark", false);
  const block = new ToolExecutionComponent("bash", "long", { command: "seq 1 20" }, {},
    frameBash(createBashToolDefinition(process.cwd())), ui, process.cwd());
  const output = Array.from({ length: 20 }, (_, i) => `line-${i + 1}`).join("\n");
  block.updateResult({
    content: [{ type: "text", text: output }], isError: false,
    details: { fullOutputPath: "/tmp/native-output", truncation: {
      truncated: true, truncatedBy: "lines", outputLines: 20, totalLines: 25,
    } },
  });
  const collapsed = text(block);
  assert(collapsed.includes("earlier lines") && collapsed.includes("Full output: /tmp/native-output"));
  assert(!collapsed.includes("line-1\n"));
  block.setExpanded(true);
  assert(text(block).includes("┃ line-1 "));
  assert(text(block, 120).includes("Truncated: showing 20 of 25 lines"));
  for (const width of [80, 12, 4, 30]) {
    assert(block.render(width).every((line) => visibleWidth(line) <= width));
  }
  const event: TuiMouseEvent = {
    type: "click", button: "left", x: 3, y: 1, width: 60, height: block.render(60).length,
    screenX: 3, screenY: 1, shift: false, alt: false, ctrl: false,
  };
  assert(block.handleMouse(event)?.handled);
  assert(text(block).includes("earlier lines"));
  assert(block.handleMouse(event)?.handled);
  assert(text(block).includes("┃ line-1 "));
});
