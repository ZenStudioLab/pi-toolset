# Compaction Model

Writes every compaction summary — manual `/compact`, the context threshold, and overflow recovery — with a model and thinking level you choose, while the chat keeps its own model and thinking level. A cheaper model such as Haiku 5.5 can summarize an Opus session, and the next reply still comes from Opus.

It reuses Pi's own summary code, so the summary prompt, the recent messages Pi keeps, your `/compact` instructions, the update of the previous summary, and the read and modified file lists are the same as Pi's default compaction. Only the model and thinking level differ.

## Configure

Create `~/.pi/agent/compaction-model.json`:

```json
{
  "models": [
    { "model": "claude-bridge/claude-sonnet-5-5", "thinkingLevel": "medium" },
    { "model": "claude-bridge/claude-haiku-5-5", "thinkingLevel": "low" }
  ]
}
```

`models` is a priority list: the first model that works writes the summary. If it fails — a usage limit, an outage, no credentials, material too large for it — the extension tries the next one, and so on. Only when every listed model has failed does Pi summarize with the session model.

| Field | Required | Meaning |
| --- | --- | --- |
| `models` | Yes | A non-empty array, highest priority first. |
| `models[].model` | Yes | `provider/modelId` of a summarizing model, e.g. `anthropic/claude-haiku-5-5`, `anthropic/claude-sonnet-5-5`, or `claude-bridge/claude-haiku-5-5`. Everything after the first `/` is the model id. |
| `models[].thinkingLevel` | No | `off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`, or `auto`, for this model. When omitted, the session's current thinking level is used. |
| `decisionModel` | No | The classifier used by `auto`; default `typesafe/jev-latest`. |

The file is read at the start of each compaction, so edits apply at the next one without restarting Pi. Without the file, the extension does nothing. Unrecognized keys produce a warning and are ignored. A file in the earlier single-model shape (`"model"` at the top level) is rejected with a warning that names `"models"`.

With `auto`, the Jev decision model picks `low`, `medium`, or `high` from a short description of the material: token and message counts, whether a previous summary exists, file counts, and the last 16,000 characters of the conversation. That is one extra classifier request per compaction, however many listed models use `auto`. Jev never sees the request to write the summary. If Jev is unavailable — for example on a Pi build without classifier support — the model still summarizes at the session's thinking level. If the summarizing model has no reasoning, no level is applied and Jev is not asked. On a `claude-bridge` model, `off` means Claude Code's default effort, not less thinking.

When it starts a summary request, the extension says so — `The conversation is being compacted with <model>, thinking <level>, by the compaction-model extension…` — and after the summary is stored it shows one notice with the model, the level applied, and whether Jev chose it. When a model is skipped you see one warning with the reason and the model tried next, for example `Compaction model: the summary request to claude-bridge/claude-sonnet-5-5 failed: … Trying claude-bridge/claude-haiku-5-5.`, followed by a new "is being compacted" line for the next model.

## When Pi's default compaction runs instead

A model is skipped, with one warning naming the reason, when it is unknown or virtual, its credentials cannot be resolved, the material does not fit it, or its summary request still fails after two retries. The extension steps aside, and Pi summarizes with the session model as usual, when the config is invalid or every listed model was skipped; the last warning then says "Compacting with the session model". Pressing Escape cancels the compaction outright; no request to a later model or to the session model starts.

The fit check, run for each listed model, adds the estimated size of the material to the summary's output limit, which Pi caps at `min(0.8 × reserveTokens, model.maxTokens)`, and compares the sum with the model's context window. With a `reserveTokens` of 500,000, a 1M-token session compacts at about 500K tokens, so Haiku 5.5 and Sonnet 5.5 (1M context) fit while Haiku 4.5 (200K) will usually be skipped. Overflow recovery summarizes close to a full session window, so a model is usually skipped unless its window is larger than the session's.

## Load it

Add the path as the **last** entry of the `extensions` list in `~/.pi/agent/settings.json`:

```json
"extensions": ["/path/to/pi-toolset/extensions/compaction-model/index.ts"]
```

Pi loads `packages` before `extensions`, so this runs after `pi-claude-bridge` and `@tian.zuo/pi-compact`: the bridge's hook records the compaction's abort signal first, and `pi-compact` can cancel before this extension pays for a summary. Use `pi -e <path>` only for ad-hoc tests. Running Pi sessions pick up the changed settings only after a restart.

- **Claude bridge sessions** need the bridge from this repo's `extensions/pi-claude-bridge` submodule (0.9.3 or later) instead of `npm:pi-claude-bridge@latest` 0.9.1, which writes its own summary with the session model. After cloning or updating the submodule, run `npm ci --ignore-scripts` inside it before starting Pi, because the bridge now runs from that working tree.
- **`openai-codex` sessions** are left alone: `@tian.zuo/pi-compact` compacts those on its own configured model.

Remove the path or the config file to return to Pi's default compaction. Design: OpenSpec change `add-compaction-model`.
