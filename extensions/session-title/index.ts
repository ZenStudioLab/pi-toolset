import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { currentHerdrTab, normalizeName, renameHerdrTab } from "./title.ts";

export default function sessionTitle(pi: ExtensionAPI): void {
  pi.registerCommand("title", {
    description: "Set this session's name, and the Herdr tab label when running inside Herdr",
    handler: async (args, ctx) => {
      if (!ctx.hasUI) throw new Error("Setting a session title requires an interactive Pi session or an RPC client with dialog support.");
      const typed = args.trim();
      const raw = typed || await ctx.ui.input("Session name", pi.getSessionName() ?? "");
      if (raw === undefined) return; // dialog cancelled
      const name = normalizeName(raw);
      if (!name) {
        ctx.ui.notify(`A session name is required. Current name: ${pi.getSessionName() || "(none)"}`, "warning");
        return;
      }
      if (raw !== name) {
        ctx.ui.notify(`Newlines and control characters are not allowed, and names are limited to ${120} characters. Using: ${name}`, "info");
      }
      // Pi persists the name and refreshes the terminal title via session_info_changed.
      pi.setSessionName(name);
      const result = await renameHerdrTab(currentHerdrTab(), name);
      if (result.ok) {
        ctx.ui.notify(`Session name set to "${name}". Herdr tab ${result.tabId} relabeled.`, "info");
        return;
      }
      if (result.reason === "not-inside-herdr") {
        ctx.ui.notify(`Session name set to "${name}". No Herdr tab detected, so no tab label changed.`, "info");
        return;
      }
      if (result.reason === "herdr-cli-missing") {
        ctx.ui.notify(`Session name set to "${name}", but the herdr command is not on PATH, so the tab label is unchanged.`, "warning");
        return;
      }
      ctx.ui.notify(`Session name set to "${name}", but the Herdr tab rename failed: ${result.reason}`, "warning");
    },
  });
}
