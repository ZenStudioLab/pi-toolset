# Design

## Context

See `proposal.md` for motivation and `specs/compaction-model/spec.md` for the required behavior.

Pi's host already exposes the pieces this needs:

- `session_before_compact` fires for manual, threshold, and overflow compaction (`host/pi/packages/coding-agent/src/core/agent-session.ts`, manual path near line 2792, automatic path near line 3124). Its event carries `preparation` (messages to summarize, turn prefix, previous summary, first kept entry, file operations, resolved compaction settings), `branchEntries`, `customInstructions`, `reason`, and an abort `signal`. A handler may return `{ compaction }` to supply the summary, `{ cancel: true }` to cancel, or nothing to let Pi summarize with the session model. A returned compaction is stored with `fromHook: true`.
- Pi's default path, `_runDefaultCompaction`, resolves request auth for the session model and calls the exported `compact(preparation, model, apiKey, headers, customInstructions, signal, thinkingLevel, streamFn, env, retry, callbacks, sessionId)`. Nothing in the compaction code calls `setModel` or `setThinkingLevel`. On a split turn, `compact()` makes two summary requests (history and turn prefix) to the model it is given.
- `prepareCompaction` carries the previous compaction's `readFiles`/`modifiedFiles` forward only when that entry is not `fromHook` (`compaction/compaction.ts:67-79`). Extension-written compactions therefore lose the carried file lists at the next compaction unless the extension restores them.
- `ctx.modelRegistry.find(provider, id)` and `ctx.modelRegistry.getApiKeyAndHeaders(model)` resolve a chat model and its credentials in both the stock `0.87.1` package and the patched host. Virtual models have `api === "pi-virtual"` (`virtual-models.ts:29`).
- `ctx.modelRegistry.findOfType("classifier", ...)` and `ctx.modelRegistry.classify(...)` exist only in the patched host. `classify` never rejects; it resolves with a `stopReason` of `stop`, `error`, or `aborted`. A `choice` answer carries `choice` and `probabilities` (`host/pi/packages/ai/src/types.ts:679-684`).

Pi's runner (`host/pi/packages/coding-agent/src/core/extensions/runner.ts`, `emit`) awaits every `session_before_compact` handler in load order. A later truthy result replaces an earlier one, `{ cancel: true }` stops immediately, and no handler sees another's result. Pi resolves settings `packages` before top-level settings `extensions` (`package-manager.ts:925-966`). The handlers among the user's loaded packages and extensions, found by searching each for `session_before_compact`:

- `pi-claude-bridge` `0.9.1` (installed from npm) takes over compaction for `claude-bridge` sessions with the session model and cancels on failure. Upstream `0.9.3` removed that takeover (#189): its hook now only records the operation's abort signal against the session id, and the bridge's provider stream sends one-off summary requests (`cacheRetention: "none"`) to an isolated Claude Code process, passing `reasoning` as effort (#184) and resolving the session's cwd from that signal, else from `process.cwd()`. The fork `ZenStudioLab/pi-claude-bridge` is now the submodule `extensions/pi-claude-bridge`, at upstream `v0.9.3`.
- `@tian.zuo/pi-compact` compacts `openai-codex` sessions remotely on its own configurable model. For other providers its `nativeFallbackOrCancel` returns `undefined`, or `{ cancel: true }` only when an existing remote checkpoint would be lost.
- `context-mode`, `pi-subagents`, and this repo's `speak` extension (`extensions/speak/index.ts:227`, which only marks talk mode as compacting) use the hook for side effects and return nothing.
- No other loaded package or extension registers the hook: pi-lens, pi-gitnexus, pi-image-tools, pi-mcp-adapter, pi-web-access, pi-opencode-bridge, pi-subscription-usage, pi-bookmark, whimsical-activity, subagent-profiles, session-delete, session-title, session-rename, and tool-block-borders.

The user's `compaction.modelOverrides` sets `reserveTokens: 500000` for Claude models, so `preparation.settings.reserveTokens` can be far larger than a summarizing model's output limit. `compact()` caps each summary request's `maxTokens` at `min(0.8 × reserveTokens, model.maxTokens)`. With that reserve, a 1M-token session compacts at about 500K tokens and summarizes up to about 480K; Haiku 5.5 and Sonnet 5.5 (1M context) fit, while Haiku 4.5 (200K) will usually fall back.

Extensions in this repo are plain TypeScript loaded by path (`pi -e <path>` or the user's `settings.json` `extensions` list), typechecked by the root `tsconfig.json` (which excludes `extensions/pi-*`, so the bridge submodule is not typechecked by the root), and tested with `node --test` under `test/<extension>/`.

## Goals / Non-Goals

**Goals:**

- Reuse Pi's own `compact()` so only the model and thinking level differ from default compaction.
- Keep every failure path on Pi's default compaction rather than losing the compaction.
- Keep the extension small: one hook, one config file, no new dependencies.

**Non-Goals:**

- No host patch and no new Pi setting.
- No slash command or interactive picker for the compaction model.
- No change to branch summarization (`/tree`).
- No support for virtual models as the summarizing model.

## Decisions

### Hook `session_before_compact` and call `compact()` directly

For each listed model in turn the handler resolves the model and credentials, then calls `compact(preparation, model, apiKey, headers, customInstructions, signal, thinkingLevel, streamFn, env, retry)` and returns `{ compaction }`. `streamFn` is `ctx.modelRegistry.streamSimple`, the same route Pi's default path uses (`this.agent.streamFunction`); without it `compact()` falls back to `completeSimple`, which knows only built-in APIs, so extension providers such as `claude-bridge` would never be reached. When `clampThinkingLevel` would lower the level (a model without `xhigh` or `max`), the lowered level is sent and reported, so the notification names the level the provider applies; a level is never raised, so an explicit `off` still sends no level, as on Pi's own path. Passing the model as an argument is what keeps the session model untouched: no session state is switched and restored, so a failure or cancellation cannot leave the session on the wrong model. No `sessionId` is passed, matching Pi's own call.

Alternatives considered:

- Temporarily switching the session model with `pi.setModel`, compacting, then switching back. Rejected: a failure, cancellation, or crash between the two switches strands the session on the compaction model, and model switches emit session events and change footer state.
- A custom summary prompt, as in `examples/extensions/custom-compaction.ts`. Rejected: it changes summary content and drops Pi's kept-recent-messages and split-turn handling.
- Patching `host/pi` to add `compaction.model`. Rejected: every host upgrade would have to carry the patch, and the Jev choice does not belong in Pi's core.

When the summarizing model's auth result includes `baseUrl`, the model passed to `compact()` carries that `baseUrl`, mirroring `_getSummarizationRequestAuth`. Pi's helper that drops headers marked for deletion (`withoutDeletedHeaders`) is not exported, and the registry's headers may hold `null` values that `compact()` does not accept, so the extension drops `null` entries the same way. Pi's retry settings are not reachable from an extension, so the call passes a small fixed retry policy (`{ enabled: true, maxRetries: 2, baseDelayMs: 2000 }`); a request that still fails moves on to the next listed model, and to Pi's default compaction after the last.

### Priority list of models

The config holds `models`, an array of `{ "model", "thinkingLevel" }` entries in priority order, so one model hitting a usage limit or an outage does not send the compaction to the (expensive) session model. The handler tries the entries in order. An entry is skipped when its model is missing from the registry or virtual, has no credentials, does not fit the material, or its summary request fails after the fixed retries; each skip shows one warning naming the reason and the next model. Pi's default compaction runs only when the config is absent or invalid, or when every entry was skipped; the last warning then says so. Each entry carries its own thinking level, because the right level differs between, say, Sonnet and Haiku. The Jev decision is asked at most once per compaction and its answer reused, since it describes the material, not the model; a failed Jev answer is likewise not asked again.

A user cancel makes the request fail too, so after every skip the handler checks `signal.aborted` and returns `{ cancel: true }` instead of trying the next model. The retries inside `compact()` stay as they are: a transient error is retried on the same model before the next one is tried, and a limit error that cannot succeed costs two short retries before the handler moves on.

The earlier single-model shape (`model`, `thinkingLevel` at the top level) is replaced, not kept as an alias: the file is user-owned, nothing else reads it, and a second accepted shape would be a parallel path to test. A file in the old shape fails validation with a warning that names `"models"`.

### Carry file lists across extension-written compactions

Because Pi skips `fromHook` compactions when carrying file lists forward, the handler restores them itself just before the first summary request it makes (valid config, non-Codex session, a model that resolved with credentials and fits the material); repeating it for a later model is harmless because the lists are sets: it finds the latest `compaction` entry in `event.branchEntries` and, if that entry has `fromHook: true` and `details.readFiles`/`details.modifiedFiles` arrays, adds them to `event.preparation.fileOps`. This mirrors `reinjectPriorCompactionFileOps` from bridge `0.9.1`. It runs after every pre-request fallback check, so those fallbacks hand Pi exactly the preparation Pi built. If the summary request itself fails after retries, the fallback keeps the restored lists, which is the better outcome for Pi's default summary.

### Config file in Pi's agent directory, read per compaction

The config lives at `join(getAgentDir(), "compaction-model.json")`, next to Pi's own `settings.json`, and is read with `readFile` at the start of each compaction. A missing file means "not configured" and returns silently; any other read error falls back with a warning. Parsing and validation are a pure function that returns either a config, plus any unrecognized keys to warn about (top-level and per entry, such as `models[1].thinkinglevel`), or the name of the invalid field with the offending entry's index, so it is unit-testable without Pi. A `provider/modelId` value splits on the first `/` only, because model ids such as OpenRouter's contain `/`.

Alternatives considered: an XDG path like the speak extension's `~/.config/pi-speak/config.json` (rejected: this setting is Pi-specific and belongs with Pi's agent config); reading Pi's `settings.json` (rejected: extensions have no settings API for custom keys, and writing unknown keys into Pi's file invites conflicts).

### Context-window guard before the summary request

Before calling `compact()`, the handler estimates the summarized material with the exported `estimateTokens` over `messagesToSummarize` and `turnPrefixMessages`, adds the previous summary's estimated size and the summary's output limit on the configured model — `min(0.8 × preparation.settings.reserveTokens, model.maxTokens)`, the same cap `compact()` applies — and compares the sum with the configured model's `contextWindow`. Using the raw `reserveTokens` would make every check fail under the user's 500,000-token reserve. If it does not fit, the handler skips that model before spending a request and tries the next one. The estimate deliberately sums both message groups even though a split turn summarizes them in two requests; the conservative check costs at most an unnecessary skip of that model, never a failed compaction. Overflow recovery usually summarizes close to a full session window, so a model is skipped unless its window is larger than the material.

### Thinking level and the Jev decision in `auto` mode

The applied level is the entry's explicit `thinkingLevel`, else the session level from `pi.getThinkingLevel()`. When the entry's model has `reasoning: false`, `compact()` sends no level, so the handler skips Jev and reports "no reasoning". An explicit `off` is passed through as the user's choice; on a `claude-bridge` summarizer it means Claude Code's default effort, which the notification states.

With an entry's `thinkingLevel: "auto"` and a reasoning model, the handler feature-detects `findOfType` and `classify` on `ctx.modelRegistry`, finds the configured classifier (default `typesafe/jev-latest`), and asks one `choice` question with options `low`, `medium`, `high`. `off` is excluded because on a bridge summarizer it does not mean less thinking, and `xhigh`/`max` are excluded because summaries do not justify their cost; a user who wants either sets the level explicitly. The state it sends is bounded: estimated token count, message counts, whether a previous summary exists, whether the turn is split, counts of read and modified files from `preparation.fileOps`, and the last 16,000 characters of the serialized conversation (`serializeConversation(convertToLlm(...))`).

After `classify()` resolves, the handler checks `signal.aborted` first and returns `{ cancel: true }` if set. Otherwise it requires `stopReason === "stop"` and a `choice` answer whose `choice` is one of the three options. Any other outcome — missing methods on a stock host, model not found, a non-`stop` result, or an unexpected answer — uses the session thinking level and continues with that entry's model, and the notification says Jev was unavailable.

Because the patched-host classifier methods are absent from the stock `0.87.1` type declarations, the handler reads them through a minimal local structural type matching `host/pi/packages/ai/src/types.ts` and a runtime `typeof === "function"` check. This is the boundary between stock and patched hosts, not a general abstraction.

### Claude bridge sessions: load the bridge from the submodule, no bridge patch

With bridge `0.9.3`, Pi compacts `claude-bridge` sessions natively, so this extension's `{ compaction }` is the only summary. Its `compact()` call goes through the registry's `streamSimple`, which resolves the bridge's provider stream for a `claude-bridge/...` model; the bridge recognizes the one-off summary request and runs it in an isolated Claude Code process with the requested effort. The bridge's hook records `event.signal` against the session id, and `compact()` receives that same signal. For an `anthropic/...` configured model in a bridge session, the request goes straight to Anthropic and the bridge is not involved.

Load order matters for that signal lookup: the bridge's hook must run before this extension's. The extension is therefore loaded through the top-level `settings.extensions` list, as its last entry, which Pi resolves after all `packages`, including the bridge and pi-compact. `pi -e` is for ad-hoc tests only, because its order relative to packages is not established here. If it ever ran first, the lookup would miss and the bridge would fall back to `process.cwd()`, which in the pi CLI is still the session's cwd.

The remaining step is operational: the user's `settings.json` package entry `npm:pi-claude-bridge@latest` (which resolved to `0.9.1`, still taking over) is replaced with the submodule path, after `npm ci` in the submodule. The fork carries no patch; it gives the user a place to change the bridge later without waiting for upstream.

Alternatives considered: patching the bridge to read this extension's config (rejected: `0.9.3` already removed the conflict, and two copies of the config logic would drift); keeping the npm install and running `pi update` (workable, but the user asked to work from the fork); passing Pi's session id as `sessionId` to make the bridge lookup order-independent (rejected: Pi deliberately omits it for summaries, and the load order already provides the association).

### Skip `openai-codex` sessions

The handler returns immediately when `ctx.model?.provider === "openai-codex"`. `@tian.zuo/pi-compact` already compacts those sessions remotely on its own configured model, and both handlers answering would mean two summarizations per compaction, with load order picking the winner. A general opt-out list was rejected because no second provider needs it today.

### Cancellation returns `{ cancel: true }`

The handler checks `signal.aborted` after the Jev decision, after any skipped model (a cancelled request fails like any other, and cancelling must not start the next model's request), and after `compact()` resolves, and returns `{ cancel: true }` in each case, with no success notification. Returning nothing would hand an already-cancelled compaction to Pi's default path, which on the manual path does not re-check the signal before summarizing; cancelling explicitly guarantees no fallback request starts.

### Notification

A progress notification is shown just before each summary request starts ("The conversation is being compacted with <model>, thinking <level>, by the compaction-model extension…"), after the level is settled, so a Jev decision runs first and a cancel during it shows nothing; if the first model fails and the second is tried, it is shown again for the second request. It uses the same model-and-level text as the outcome notification. A summary can take minutes, and Pi shows only its generic compaction indicator. One outcome notification per compaction the extension summarizes, shown just before returning `{ compaction }`; a config warning such as an unrecognized key is separate and does not count as the outcome notification. The outcome notification states the model, the applied level (or "no reasoning", or "Claude Code default effort" for `off` on a bridge model), and whether Jev chose it or was unavailable. Each skipped model shows one warning naming the reason and the model tried next, and the last one names the session model as the fallback. Proof that the extension's summary was the one stored comes from the compaction entry's `fromHook: true`, checked in the live verification tasks.

### File layout

- `extensions/compaction-model/index.ts` — registers the hook; reads the file, then for each listed model resolves model and auth, applies the guard, restores carried file lists, calls `compact()`, notifies, and moves to the next model on failure.
- `extensions/compaction-model/config.ts` — pure parsing and validation of the config JSON.
- `extensions/compaction-model/thinking.ts` — the Jev question, the bounded state, and mapping the answer to a level.

The split follows responsibilities that are tested separately: config validation and the Jev decision are unit-tested with plain inputs and a fake registry. `index.ts` exports a handler factory that takes `compact` and the config reader as parameters, so its skip, fallback, cancel, pass-through, file-list, and no-model-switch rules are tested with a fake `ctx` without calling a model; the default export wires in the real ones. A real compaction in an Anthropic session and in a bridge session verifies the end-to-end path.

## Risks / Trade-offs

- [Haiku-class models write weaker summaries than Opus] → The user chooses the model; Sonnet 5.5 is a supported option, and the extension reuses Pi's summary prompt unchanged.
- [Token estimate is heuristic (characters / 4)] → The guard is conservative by summing both message groups and adding the summary's output limit; a request that still overflows fails and falls back to the session model.
- [A transient error or usage limit on the first model] → Two fixed retries on that model, then the next listed model; the session model summarizes only when the whole list is exhausted.
- [Classifier methods are patched-host only] → Runtime feature detection; `auto` degrades to the session thinking level with a notification on stock Pi.
- [Another extension also returns a summary from `session_before_compact`] → The known handlers are inventoried above: the bridge submodule at `0.9.3` no longer returns one, and Codex sessions are skipped for `pi-compact`. If the user loads the npm bridge `0.9.1` again, bridge sessions would make two summarizations; the README states the submodule requirement.
- [The bridge's isolated summary path changes upstream] → The fork pins `v0.9.3`; updating the submodule is a deliberate step, verified by a real bridge compaction.
- [Claude Code may not accept a very large summary through the bridge, depending on its long-context mapping] → 2.4 runs one bridge compaction with more than about 200K tokens of material; if that cannot be arranged, it stays a recorded residual risk, and a failure shows up as a fallback warning, not a lost compaction.

## Migration Plan

No migration. Loading the extension without a config file changes nothing. Removing it, or deleting the config file, restores Pi's default compaction.
