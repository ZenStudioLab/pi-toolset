import type { createBashToolDefinition, Theme } from "@earendil-works/pi-coding-agent";
import type { Component } from "@earendil-works/pi-tui";
import { LeftRail } from "./left-rail.ts";

type BashDefinition = ReturnType<typeof createBashToolDefinition>;

function frame(
  child: Component,
  previous: LeftRail | undefined,
  theme: Theme,
  context: { isPartial: boolean; isError: boolean },
): LeftRail {
  const appearance = { theme, isPartial: context.isPartial, isError: context.isError };
  if (!previous) return new LeftRail(child, appearance);
  previous.child = child;
  previous.appearance = appearance;
  return previous;
}

export function frameBash(native: BashDefinition): BashDefinition {
  const { renderCall, renderResult } = native;
  if (!renderCall || !renderResult) {
    throw new Error("The tool-block-borders extension requires Pi 0.87.1 native Bash renderers; unload it on unsupported hosts.");
  }
  return {
    ...native,
    renderShell: "self",
    renderCall(args, theme, context) {
      const previous = context.lastComponent instanceof LeftRail ? context.lastComponent : undefined;
      // Native renderers reuse concrete Text/Container instances, never the decorator.
      const child = renderCall(args, theme, { ...context, lastComponent: previous?.child });
      return frame(child, previous, theme, context);
    },
    renderResult(result, options, theme, context) {
      const previous = context.lastComponent instanceof LeftRail ? context.lastComponent : undefined;
      const child = renderResult(result, options, theme, { ...context, lastComponent: previous?.child });
      return frame(child, previous, theme, { ...context, isPartial: options.isPartial });
    },
  };
}
