import { existsSync } from "node:fs";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { captureSession, requireTrash, trashSession, type SessionTarget } from "./session-file.ts";

export default function sessionDelete(pi: ExtensionAPI): void {
  pi.registerCommand("delete-session", {
    description: "Confirm, start a fresh session, and move the old transcript to system trash",
    handler: async (args, ctx) => {
      if (!ctx.hasUI) throw new Error("Session deletion requires an interactive Pi session or an RPC client that supports confirmation dialogs.");
      if (args.trim()) {
        ctx.ui.notify("This command takes no arguments and always requires confirmation.", "warning");
        return;
      }
      if (!ctx.isIdle()) {
        ctx.ui.notify("Stop the current response first, then retry session deletion. Nothing was deleted.", "warning");
        return;
      }
      await ctx.waitForIdle();
      const file = ctx.sessionManager.getSessionFile();
      if (!file || !existsSync(file)) {
        ctx.ui.notify("This session has no saved transcript yet. Nothing was deleted; use Pi's new-session command to clear it.", "info");
        return;
      }
      let target: SessionTarget;
      try {
        target = await captureSession(file, ctx.sessionManager.getSessionId());
        await requireTrash();
      } catch (error) {
        ctx.ui.notify(`Cannot delete this session: ${error instanceof Error ? error.message : String(error)}`, "error");
        return;
      }
      if (!await ctx.ui.confirm("Trash the current session?",
        `A fresh session will open, then this saved transcript will move to system trash.\n\nSession: ${target.id}\nFile: ${target.path}\n\nCancel keeps the current session. No permanent deletion is used.`)) return;
      if (!ctx.isIdle() || ctx.sessionManager.getSessionId() !== target.id || ctx.sessionManager.getSessionFile() !== file) {
        ctx.ui.notify("The current session changed or became busy. Nothing was deleted; retry when idle.", "warning");
        return;
      }
      const result = await ctx.newSession({
        // Replacement invalidates the old extension context: use only this fresh one.
        withSession: async (fresh) => {
          try {
            await trashSession(target, fresh.sessionManager.getSessionFile(), fresh.sessionManager.getSessionId());
          } catch (error) {
            const location = existsSync(target.path)
              ? `The old file still exists at ${target.path}.`
              : `The source path is no longer accessible; inspect system trash for ${target.id}.`;
            fresh.ui.notify(`A fresh session is open, but trashing failed. ${location}\n${error instanceof Error ? error.message : String(error)}\nNo permanent-delete fallback was attempted.`, "error");
            return;
          }
          fresh.ui.notify("Previous session moved to system trash. You are now in a fresh session.", "info");
        },
      });
      // Cancellation never replaces the session, so the original context remains valid.
      if (result.cancelled) ctx.ui.notify("Session switching was cancelled. Nothing was deleted.", "info");
    },
  });
}
