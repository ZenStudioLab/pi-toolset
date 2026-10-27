import os from "node:os";
import path from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { formatProfile, listProfileNames, readProfile, type SubagentProfile } from "./format.ts";
import { parseShowArgs, runOverridesFor } from "./load.ts";

const PROFILE_DIR = path.join(os.homedir(), ".pi", "agent", "profiles", "pi-subagents");
const LOADED_ENTRY = "subagent-profile-loaded";

type LoadedProfile = { name: string; profile: SubagentProfile };

export default function subagentProfiles(pi: ExtensionAPI) {
  // Held in memory and recorded in the session file, so it follows this conversation and nothing else.
  let loaded: LoadedProfile | undefined;

  pi.on("session_start", (_event, ctx) => {
    const entries = ctx.sessionManager.getEntries();
    const last = entries.findLast((entry) => entry.type === "custom" && entry.customType === LOADED_ENTRY);
    loaded = last?.type === "custom" ? (last.data as LoadedProfile | undefined) : undefined;
  });

  // Per-run overrides outrank settings, so direct delegations follow the loaded profile without touching any settings file.
  pi.on("tool_call", (event) => {
    const input = event.input as Record<string, unknown>;
    if (!loaded || event.toolName !== "subagent" || typeof input.agent !== "string") return;
    const { model, fast } = runOverridesFor(loaded.profile, input.agent);
    if (model !== undefined && input.model === undefined) input.model = model;
    if (fast !== undefined && input.fast === undefined) input.fast = fast;
  });

  pi.registerCommand("subagents-show-profile", {
    description: "Show a saved subagent profile; with --load (-l) <name>, apply it to this conversation only",
    getArgumentCompletions: (prefix) => {
      if (prefix.includes(" ")) return null;
      return listProfileNames(PROFILE_DIR)
        .filter((name) => name.startsWith(prefix))
        .map((name) => ({ value: name, label: name }));
    },
    handler: async (args, ctx) => {
      const { name, load } = parseShowArgs(args);
      const names = listProfileNames(PROFILE_DIR);
      if (load && name === "") {
        ctx.ui.notify("Usage: /subagents-show-profile --load <name>", "error");
        return;
      }
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
      const profile = readProfile(PROFILE_DIR, name);
      if (load) {
        loaded = { name, profile };
        pi.appendEntry(LOADED_ENTRY, loaded);
      }
      ctx.ui.notify(
        `${load ? `Loaded '${name}' for this conversation only; delegated subagent calls now use it.\n\n` : ""}${formatProfile(name, profile)}`,
        "info",
      );
    },
  });
}
