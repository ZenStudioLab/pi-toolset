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
  let remove: (() => void) | undefined;
  const reported = new Set<string>();

  pi.on("session_start", (_event, ctx) => {
    remove?.();
    remove = undefined;
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
    if (typeof ui.registerActivityDecoration !== "function") {
      if (overrides.enabled !== false)
        report(
          "Whimsical activity requires a source host with registerActivityDecoration; native UI is unchanged.",
        );
      return;
    }
    remove = ui.registerActivityDecoration(
      () =>
        new ActivityController(() => {
          selector ??= createSelector();
          if (selector.diagnostic) report(selector.diagnostic);
          return selector;
        }, scheduler),
      overrides,
    );
  });

  pi.on("session_shutdown", () => {
    remove?.();
    remove = undefined;
  });
}
