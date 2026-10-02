import type { ExtensionUIContext } from "@earendil-works/pi-coding-agent";
import type { ActivityDecorationOverrides } from "./preferences.ts";
import type { ActivityWordSelector } from "./word-bank.ts";

/** Public setters have no ownership handle or previous-value getter: reset only changed ports. */
export class StockPresentation {
  private active = false;
  private changedMessage = false;
  private changedIndicator = false;
  private readonly ui: Pick<
    ExtensionUIContext,
    "setWorkingMessage" | "setWorkingIndicator"
  >;
  private readonly overrides: ActivityDecorationOverrides;
  private readonly getSelector: () => ActivityWordSelector;

  constructor(
    ui: Pick<ExtensionUIContext, "setWorkingMessage" | "setWorkingIndicator">,
    overrides: ActivityDecorationOverrides,
    getSelector: () => ActivityWordSelector,
  ) {
    this.ui = ui;
    this.overrides = overrides;
    this.getSelector = getSelector;
  }

  start(): void {
    if (this.active || this.overrides.enabled === false) return;
    this.active = true;
    if (
      this.overrides.motion === "plain" ||
      this.overrides.motion === "reduced"
    ) {
      this.ui.setWorkingIndicator({
        frames: this.overrides.motion === "plain" ? [] : ["*"],
      });
      this.changedIndicator = true;
    }
    if (this.overrides.motion === "plain") return;
    const selector = this.getSelector();
    if (selector.diagnostic) return;
    this.ui.setWorkingMessage(
      selector.next() + (this.overrides.ascii ? "..." : "…"),
    );
    this.changedMessage = true;
  }

  reset(): void {
    this.active = false;
    if (this.changedMessage) {
      this.ui.setWorkingMessage();
      this.changedMessage = false;
    }
    if (this.changedIndicator) {
      this.ui.setWorkingIndicator();
      this.changedIndicator = false;
    }
  }
}
