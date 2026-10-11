import type { Theme } from "@earendil-works/pi-coding-agent";
import {
  Box,
  type Component,
  type TuiMouseEvent,
  type TuiMouseEventResult,
} from "@earendil-works/pi-tui";

type Appearance = {
  theme: Pick<Theme, "fg" | "bg">;
  isPartial: boolean;
  isError: boolean;
};

/** Presentation only: the native child continues to own layout and interaction. */
export class LeftRail implements Component {
  child: Component;
  appearance: Appearance;
  private box: Box;

  constructor(child: Component, appearance: Appearance) {
    this.child = child;
    this.appearance = appearance;
    this.box = new Box(0, 0, (text) => {
      const { theme, isPartial, isError } = this.appearance;
      return theme.bg(isPartial ? "toolPendingBg" : isError ? "toolErrorBg" : "toolSuccessBg", text);
    });
    this.box.addChild({
      render: (width) => {
        const { theme, isError } = this.appearance;
        const rail = theme.fg(isError ? "error" : "borderAccent", "┃");
        return this.child.render(width - 2).map((line) => `${rail} ${line}`);
      },
      invalidate: () => this.child.invalidate(),
    });
  }

  render(width: number): string[] {
    if (width <= 0) return [];
    // Leave at least two cells for content, including wide Unicode characters.
    if (width < 4) return this.child.render(width);
    return this.box.render(width);
  }

  invalidate(): void {
    this.box.invalidate();
  }

  handleInput(data: string): void {
    this.child.handleInput?.(data);
  }

  get wantsKeyRelease(): boolean | undefined {
    return this.child.wantsKeyRelease;
  }

  handleMouse(event: TuiMouseEvent): TuiMouseEventResult | undefined {
    const offset = event.width >= 4 ? 2 : 0;
    if (event.x < offset) return undefined;
    return this.child.handleMouse?.({ ...event, x: event.x - offset, width: event.width - offset });
  }
}
