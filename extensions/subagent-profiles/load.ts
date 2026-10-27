import type { SubagentProfile } from "./format.ts";

export type ShowArgs = { name: string; load: boolean };

export function parseShowArgs(args: string): ShowArgs {
  const tokens = args.split(/\s+/).filter(Boolean);
  const load = tokens.some((token) => token === "--load" || token === "-l");
  return { name: tokens.filter((token) => token !== "--load" && token !== "-l").join(" "), load };
}

/** Per-run `model` (with thinking suffix) and `fast` that make `agent` behave as the profile says. */
export function runOverridesFor(profile: SubagentProfile, agent: string): { model?: string; fast?: true } {
  const subagents = profile.subagents ?? {};
  const override = subagents.agentOverrides?.[agent];
  const model = override?.model ?? subagents.defaultModel;
  if (!model) return {};
  return {
    model: override?.thinking ? `${model}:${override.thinking}` : model,
    ...(override?.fast ? { fast: true as const } : {}),
  };
}
