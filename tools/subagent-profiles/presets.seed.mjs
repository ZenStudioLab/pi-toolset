// Subagent preset seed. Plain JS, so presets can be built with spreads and helpers.
// `extends` inherits a preset; `agents.<role>` merges per field; a role without
// `model` uses the resolved preset's defaultModel. Run generate.mjs to emit the JSON.
const MODEL = {
  luna: "openai-codex/gpt-5.6-luna",
  astra: "openai-codex/gpt-6-astra",
  sol: "openai-codex/gpt-6.1-sol",
  grok: "xai/grok-4.7",
};

const WORKERS = ["scout", "researcher", "worker", "delegate"];
const workers = (fields) => Object.fromEntries(WORKERS.map((role) => [role, fields]));
const oracle = { model: MODEL.grok, thinking: "high" };

export default {
  presets: {
    openai: {
      defaultModel: MODEL.luna,
      agents: {
        oracle,
        ...workers({ thinking: "high", fast: true }),
        scout: { thinking: "xhigh", fast: true },
      },
    },
    "openai-6": { extends: "openai" },
    "openai-6-premium": { extends: "openai-6", agents: { worker: { model: MODEL.sol } } },
    "openai-non": { extends: "openai", agents: { scout: { thinking: "high" } } },
    "openai-max": {
      defaultModel: MODEL.astra,
      agents: { oracle, ...workers({ thinking: "xhigh" }) },
    },
    "openai-max-fast": { extends: "openai-max", agents: workers({ fast: true }) },
  },
};
