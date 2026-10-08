#!/usr/bin/env node
// Generates pi-subagents profile JSON from one seed with `extends` inheritance.
//
// Seed: a .mjs/.js module (default export) or a .json file shaped { presets: { <name>: Preset } }.
// Preset: { extends?, defaultModel?, asyncByDefault?, agents?: { <role>: { model?, thinking?, fast? } } }
// `agents` merge per role and per field. A role without `model` binds to the resolved
// preset's defaultModel, so every emitted override is explicit.
//
// Usage: node generate.mjs [--seed <file>] [--out <dir>] [--check]
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";

const NAME = /^[A-Za-z0-9][\w.-]*$/;
const DEFAULT_SEED = path.join(import.meta.dirname, "presets.seed.mjs");
const DEFAULT_OUT = path.join(os.homedir(), ".pi", "agent", "profiles", "pi-subagents");
const GENERATED = "tools/subagent-profiles: edit the seed, not this file";

function resolvePreset(name, presets, trail = []) {
  if (trail.includes(name)) throw new Error(`extends cycle: ${[...trail, name].join(" -> ")}`);
  const preset = presets[name];
  if (!preset) {
    const by = trail.length ? ` (extended by '${trail.at(-1)}')` : "";
    throw new Error(`unknown preset '${name}'${by}`);
  }
  const base = preset.extends ? resolvePreset(preset.extends, presets, [...trail, name]) : { agents: {} };
  const agents = { ...base.agents };
  for (const [role, fields] of Object.entries(preset.agents ?? {})) {
    agents[role] = { ...agents[role], ...fields };
  }
  const { extends: _parent, agents: _agents, ...own } = preset;
  return { ...base, ...own, agents };
}

const CLAUDE_PROVIDERS = ["claude-bridge/", "anthropic/"];

function assertNoClaudeMix(name, models) {
  const used = CLAUDE_PROVIDERS.filter((prefix) => models.some((model) => model?.startsWith(prefix)));
  if (used.length > 1) throw new Error(`preset '${name}': mixes ${used.join(" and ")} models`);
}

function renderProfile(name, { defaultModel, asyncByDefault = false, agents }) {
  if (typeof defaultModel !== "string" || !defaultModel) {
    throw new Error(`preset '${name}': defaultModel is required`);
  }
  assertNoClaudeMix(name, [defaultModel, ...Object.values(agents).map(({ model }) => model)]);
  const agentOverrides = {};
  for (const [role, { model = defaultModel, thinking, fast }] of Object.entries(agents)) {
    agentOverrides[role] = { model, thinking, fast };
  }
  const profile = { $generatedBy: GENERATED, subagents: { asyncByDefault, defaultModel, agentOverrides } };
  return `${JSON.stringify(profile, null, 2)}\n`;
}

export function renderAll(seed) {
  return Object.keys(seed.presets).map((name) => {
    if (!NAME.test(name)) throw new Error(`invalid preset name '${name}'`);
    return [`${name}.json`, renderProfile(name, resolvePreset(name, seed.presets))];
  });
}

export async function loadSeed(file) {
  const abs = path.resolve(file);
  const seed = abs.endsWith(".json")
    ? JSON.parse(fs.readFileSync(abs, "utf8"))
    : (await import(pathToFileURL(abs).href)).default;
  if (!seed?.presets || typeof seed.presets !== "object") {
    throw new Error(`${file}: expected { presets: { ... } }`);
  }
  return seed;
}

async function main(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      seed: { type: "string", default: DEFAULT_SEED },
      out: { type: "string", default: DEFAULT_OUT },
      check: { type: "boolean", default: false },
    },
  });
  const files = renderAll(await loadSeed(values.seed));
  const stale = [];
  for (const [file, text] of files) {
    const target = path.join(values.out, file);
    if (fs.existsSync(target) && fs.readFileSync(target, "utf8") === text) continue;
    stale.push(file);
    if (!values.check) {
      fs.mkdirSync(values.out, { recursive: true });
      fs.writeFileSync(target, text);
    }
  }
  const managed = new Set(files.map(([file]) => file));
  const unmanaged = fs.existsSync(values.out)
    ? fs.readdirSync(values.out).filter((f) => f.endsWith(".json") && !managed.has(f))
    : [];
  const verb = values.check ? "stale" : "written";
  console.log(stale.length ? `${verb}: ${stale.join(", ")}` : `up to date: ${files.length} profiles`);
  if (unmanaged.length) console.log(`unmanaged (not in seed): ${unmanaged.join(", ")}`);
  if (values.check && stale.length) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
