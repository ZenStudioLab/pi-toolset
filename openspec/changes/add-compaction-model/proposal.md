# Proposal

## Why

Pi always summarizes a session during compaction with the session's own chat model and thinking level, so an Opus session pays Opus prices and latency for every `/compact` and every automatic compaction. Pi has no setting for a separate compaction model: `compaction.modelOverrides` only tunes token budgets. The user wants compaction summaries written by a cheaper, configurable model such as Sonnet or Haiku, with a configurable thinking level, without the chat session ever leaving its own model.

## What Changes

- Add a Pi extension `extensions/compaction-model/` that handles `session_before_compact` for every compaction trigger (manual `/compact`, threshold, and overflow recovery). It calls Pi's own exported `compact()` with the configured model, so Pi's summary prompt, cut point, kept recent messages, and previous-summary handling stay unchanged; only the summarizing model and thinking level differ.
- Read a user-owned JSON config `~/.pi/agent/compaction-model.json` (resolved through Pi's `getAgentDir()`) at each compaction:
  - `models`: a priority list. Each entry has `model`, the `provider/modelId` of a summarizing model (e.g. `anthropic/claude-haiku-5-5`, `anthropic/claude-sonnet-5-5`, or `claude-bridge/claude-haiku-5-5`), and an optional `thinkingLevel`: a Pi thinking level for that model's summary call, or `auto`. When omitted, the session's current thinking level is used. The first entry that works writes the summary; if it fails, the next is tried.
  - `decisionModel` (optional, used only with `auto`): `provider/modelId` of a classifier model; defaults to `typesafe/jev-latest`.
- With `thinkingLevel: "auto"`, ask the Jev decision model to choose the summary call's thinking level from a compact description of the material being summarized. Jev only picks the level; it never writes the summary.
- Leave the chat session's model and thinking level untouched: the extension passes the summarizing model to one `compact()` call and returns the result; it never calls `setModel` or `setThinkingLevel`.
- Skip a listed model, and try the next, when it is unknown, is a virtual model, lacks credentials, the material to summarize does not fit its context window, or its summary call still fails after a small number of retries. Fall back to Pi's default compaction (session model) when the config is absent or invalid, or every listed model was skipped. When only the Jev decision is unavailable, compact with the configured model at the session thinking level instead.
- Show a notification when each summary request starts and one outcome notification per compaction naming the model and thinking level used, or the reason for skipping a model or falling back.
- Support `claude-bridge` sessions, the user's main provider. The bridge is now forked to `ZenStudioLab/pi-claude-bridge` and added as the submodule `extensions/pi-claude-bridge` (at upstream `v0.9.3`). Since `v0.9.3` the bridge no longer takes over compaction: Pi compacts natively and the bridge routes summary requests to an isolated Claude Code process, passing the requested reasoning level as effort. The installed npm copy (`0.9.1`) still has the takeover, which would race this extension, so Pi must load the bridge from the submodule instead of `npm:pi-claude-bridge@latest`.
- Leave `openai-codex` sessions to `@tian.zuo/pi-compact`, which already compacts them remotely on its own configurable model; this extension does nothing for that provider so that no compaction is summarized twice.

## Capabilities

### New Capabilities

- `compaction-model`: configurable summarizing model and thinking level for Pi compaction, optional Jev-chosen thinking level, unchanged session model, and fallback to default compaction.

### Modified Capabilities

None. Existing specs (`manual-speech`, `voice-conversation`, `voice-input`) cover the speech extension only.

## Impact

- New: `extensions/compaction-model/` (TypeScript, no new dependencies; uses `compact`, `getAgentDir`, `estimateTokens`, `serializeConversation`, and `convertToLlm` from `@earendil-works/pi-coding-agent`).
- New tests under `test/compaction-model/`, added to the root `npm test` script.
- `README.md`: an entry for the extension, its config file, and how to load it as the last entry of the user's `settings.json` `extensions` list (`pi -e` only for ad-hoc tests, since its order relative to packages is not established). The extension is not added to the published package `files`.
- New submodule `extensions/pi-claude-bridge` (already added, `.gitmodules` staged). The user's `~/.pi/agent/settings.json` changes its `npm:pi-claude-bridge@latest` package entry to the submodule path, and the submodule's dependencies are installed with `npm ci` (it ships `package-lock.json`). No bridge source change is planned; the fork exists so the user can patch the bridge without waiting for upstream.
- Runtime: compaction summary requests move from the session model to the configured provider; `auto` mode adds one classifier request; a summary that still fails after retries is followed by Pi's default session-model summary. Prompt cache of the chat session is unaffected because the session model and thinking level never change.
- Host compatibility: the Jev decision needs `modelRegistry.findOfType` and `modelRegistry.classify`, which exist in the patched host under `host/pi` but not in the stock `0.87.1` dev dependency; on stock Pi, `auto` falls back to the session thinking level.
- Out of scope: patching Pi's host source to add a native `compaction.model` setting, a slash command for switching the compaction model, branch summarization (`/tree`) model selection, changes to Pi's summary prompt, and changes to `pi-claude-bridge` or `@tian.zuo/pi-compact` source.
