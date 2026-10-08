import os from "node:os";
import path from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { formatProfile, listProfileNames, readProfile } from "./format.ts";

const PROFILE_DIR = path.join(os.homedir(), ".pi", "agent", "profiles", "pi-subagents");

export default function subagentProfiles(pi: ExtensionAPI) {
  pi.registerCommand("subagents-show-profile", {
    description: "Show agents, models, and thinking levels of a saved subagent profile",
    getArgumentCompletions: (prefix) => {
      if (prefix.includes(" ")) return null;
      return listProfileNames(PROFILE_DIR)
        .filter((name) => name.startsWith(prefix))
        .map((name) => ({ value: name, label: name }));
    },
    handler: async (args, ctx) => {
      const name = args.trim();
      const names = listProfileNames(PROFILE_DIR);
      if (name === "") {
        ctx.ui.notify(
          names.length === 0
            ? `No subagent profiles found in ${PROFILE_DIR}`
            : names.map((profile) => formatProfile(profile, readProfile(PROFILE_DIR, profile))).join("\n\n"),
          "info",
        );
        return;
      }
      if (!names.includes(name)) {
        ctx.ui.notify(`Unknown profile '${name}'. Available: ${names.join(", ") || "none"}`, "error");
        return;
      }
      ctx.ui.notify(formatProfile(name, readProfile(PROFILE_DIR, name)), "info");
    },
  });
}
