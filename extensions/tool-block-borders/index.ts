import {
  createBashToolDefinition,
  getAgentDir,
  SettingsManager,
  type ExtensionAPI,
} from "@earendil-works/pi-coding-agent";
import { frameBash } from "./bash-framing.ts";

export default function toolBlockBorders(pi: ExtensionAPI): void {
  pi.on("session_start", (_event, ctx) => {
    const bash = pi.getAllTools().find((tool) => tool.name === "bash");
    if (bash && bash.sourceInfo.source !== "builtin") {
      const message = `tool-block-borders skipped: Bash is already customized by ${bash.sourceInfo.path}. Unload that override before using Bash framing.`;
      if (ctx.hasUI) ctx.ui.notify(message, "warning");
      else console.warn(message);
      return;
    }
    // Respect the same file-backed settings and project-trust boundary as the CLI.
    const settings = SettingsManager.create(ctx.cwd, getAgentDir(), { projectTrusted: ctx.isProjectTrusted() });
    pi.registerTool(frameBash(createBashToolDefinition(ctx.cwd, {
      commandPrefix: settings.getShellCommandPrefix(),
      shellPath: settings.getShellPath(),
    })));
  });
}
