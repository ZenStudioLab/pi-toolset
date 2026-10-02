import type {
  ExtensionAPI,
  ExtensionUIContext,
} from "@earendil-works/pi-coding-agent";
import {
  ActivityController,
  type ActivityDecorationUI,
  type ActivityScheduler,
} from "./activity-controller.ts";
import { activityOverrides } from "./preferences.ts";
import { ActivityWordSelector } from "./word-bank.ts";
import { StockPresentation } from "./stock-presentation.ts";

export default function whimsicalActivity(
  pi: ExtensionAPI,
  createSelector: () => ActivityWordSelector = () => new ActivityWordSelector(),
  scheduler?: ActivityScheduler,
): void {
  pi.registerFlag("no-whimsical-activity", {
    type: "boolean",
    description: "Disable native activity decoration",
  });
  pi.registerFlag("activity-display", {
    type: "string",
    description: "Override saved activity motion: normal, reduced, or plain",
  });
  pi.registerFlag("activity-ascii", {
    type: "boolean",
    description: "Use ASCII activity label punctuation",
  });
  let selector: ActivityWordSelector | undefined;
  let backend:
    | { kind: "advanced"; remove: (() => void) | undefined }
    | { kind: "stock"; presentation: StockPresentation }
    | undefined;
  const reported = new Set<string>();
  const dispose = () => {
    if (backend?.kind === "advanced") backend.remove?.();
    else if (backend?.kind === "stock") backend.presentation.reset();
    backend = undefined;
  };

  pi.on("session_start", (_event, ctx) => {
    dispose();
    if (
      ctx.mode !== "tui" ||
      !ctx.hasUI ||
      !process.stdin.isTTY ||
      !process.stdout.isTTY
    )
      return;
    const disabled = pi.getFlag("no-whimsical-activity");
    const report = (message: string) => {
      if (reported.has(message)) return;
      reported.add(message);
      ctx.ui.notify(message, "warning");
    };
    const overrides = activityOverrides(
      disabled,
      pi.getFlag("activity-display"),
      pi.getFlag("activity-ascii"),
    );
    if (!overrides) {
      report(
        "Invalid --activity-display; expected normal, reduced, or plain. Activity decoration is disabled.",
      );
      return;
    }
    // The modified source API extends this published UI type without changing the pinned package.
    const ui = ctx.ui as ExtensionUIContext & Partial<ActivityDecorationUI>;
    const getSelector = () => {
      selector ??= createSelector();
      if (selector.diagnostic) report(selector.diagnostic);
      return selector;
    };
    if (typeof ui.registerActivityDecoration === "function") {
      // A declined registration is authoritative; never fall through to a stock writer.
      backend = {
        kind: "advanced",
        remove: ui.registerActivityDecoration(
          () => new ActivityController(getSelector, scheduler),
          overrides,
        ),
      };
      return;
    }
    if (overrides.enabled === false) return;
    if (
      typeof ui.setWorkingMessage !== "function" ||
      typeof ui.setWorkingIndicator !== "function"
    ) {
      report(
        "Whimsical activity needs Pi's public working-message and indicator APIs. Update Pi; native UI is unchanged.",
      );
      return;
    }
    backend = {
      kind: "stock",
      presentation: new StockPresentation(ui, overrides, getSelector),
    };
  });

  pi.on("agent_start", () => {
    if (backend?.kind === "stock") backend.presentation.start();
  });
  pi.on("agent_end", () => {
    if (backend?.kind === "stock") backend.presentation.reset();
  });
  pi.on("session_shutdown", dispose);
}
