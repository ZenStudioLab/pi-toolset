import fs from "node:fs";
import path from "node:path";

export type AgentOverride = { model?: string; thinking?: string; fast?: boolean };

export type SubagentProfile = {
  subagents?: {
    defaultModel?: string;
    asyncByDefault?: boolean;
    agentOverrides?: Record<string, AgentOverride>;
  };
};

export function listProfileNames(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.slice(0, -".json".length))
    .sort();
}

export function readProfile(dir: string, name: string): SubagentProfile {
  return JSON.parse(fs.readFileSync(path.join(dir, `${name}.json`), "utf8"));
}

export function formatProfile(name: string, profile: SubagentProfile): string {
  const subagents = profile.subagents ?? {};
  const overrides = Object.entries(subagents.agentOverrides ?? {});
  const width = Math.max(0, ...overrides.map(([agent]) => agent.length));
  const header = `${name}  default=${subagents.defaultModel ?? "-"}  asyncByDefault=${subagents.asyncByDefault ?? false}`;
  const rows = overrides.map(
    ([agent, override]) =>
      `  ${agent.padEnd(width)}  ${override.model ?? "-"}  thinking=${override.thinking ?? "-"}${override.fast ? "  fast" : ""}`,
  );
  return [header, ...rows].join("\n");
}
