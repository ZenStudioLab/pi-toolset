# Design

## Context

See `proposal.md` for motivation and `specs/manual-speech/spec.md` for the behavior contract. This adds a small, manual-only extension to the existing Pi extension package; it is not a voice assistant, a local speech stack, or a Pi fork.

Current state, verified read-only during exploration:

| Fact | Evidence | Consequence |
| --- | --- | --- |
| Package already ships a Pi extension and declares Pi packages as peers, with `pi.extensions` listing one entry. | `package.json`, `extensions/whimsical-activity/index.ts` | `extensions/speak/` follows the same shape. Its factory accepts injected dependencies, which is the pattern to reuse for testing. |
| Repo dev dependency is Pi 0.87.1; installed launcher runs 0.99.2. | `node_modules/@earendil-works/pi-coding-agent`, `~/.pi/agent/install/releases/` | Every host API used must exist in both. Typecheck against 0.87.1; qualify behavior against 0.99.2. |
| `registerCommand(name, { handler(args, ctx) })`, `ctx.mode` (`"tui"`, `"rpc"`, `"json"`, `"print"`), `ctx.isIdle()`, `ctx.hasPendingMessages()`, `ctx.sessionManager.buildSessionProjection()`, and events `session_shutdown` (reason `quit | reload | new | resume | fork`),`session_before_switch`,`session_before_fork`,`session_tree` exist. | `dist/core/extensions/types.d.ts`, `session-manager.d.ts` in 0.99.2; the same symbols were found in 0.87.1 | Enough surface for the contract. Exact `SessionProjection.messages` content shape is still to be inspected during apply. |
| Docs do not say whether an awaited command handler blocks other commands. | `docs/extensions.md` | Design assumes it might; the handler returns immediately and the job runs as an owned async task. A real-terminal check qualifies this. |
| `mpv` is not installed; `ffplay` and `pw-play` are. | `command -v` | Player is configuration, not hardcoded. |
| Test helpers `network-sentinel.ts` and `network-probe.ts` exist. | `test/whimsical-activity/` | Reuse the idea to prove silent load makes zero network calls. |
| `docs/adr/0001-hybrid-activity-compatibility.md` exists. | `docs/adr/` | New ADR-0002 records the new egress boundary. |

Unverified leads, to be re-established at apply time and never treated as passed: the ElevenLabs endpoint path, `xi-api-key` header, `eleven_flash_v2_5` model and its language coverage, `mp3_44100_128` format, redirect and error behavior, and all pricing and entitlement figures. The user also has not confirmed how their subscription covers API use of a cloned voice.

The trust boundary is concrete and small: the user's own Pi answers go to a service the user chose, only on explicit request. Safeguards are sized to that boundary, which is why several guide features are deferred.

## Goals / Non-Goals

**Goals:**

- A trustworthy `/speak` that is silent unless asked, cheap to reason about, and always stoppable.
- Zero provider calls on cache hit and on replay.
- Behavior testable offline with mocked HTTP and player processes.

**Non-Goals:**

- Anything listed under Deferred Capabilities below, streaming playback, a second provider, and voice creation.
- Hardening against hostile multi-user or other-extension threats; the README states the limits instead.
- Changing `whimsical-activity` or Pi.

## Decisions

### 1. Place the extension in this repository, unpublished for now

Add `extensions/speak/` beside `whimsical-activity/`. Do not edit `package.json` `files` or `pi.extensions` in this change; load with `pi -e extensions/speak/index.ts` for development. Publishing it inside `@zenstudiolab/pi-toolset` would silently add a `/speak` command and a network-capable component to everyone who installs the package, a decision the user has not made.

Alternatives: a separate repo or npm package (more setup, no benefit now); registering it in `pi.extensions` immediately (changes published behavior).

### 2. Handler returns immediately; the job is an owned async task

`/speak` validates, then starts a job and returns. The job record owns an `AbortController`, a temp file path, the player handle, and a generation token. `/speak stop` aborts the controller and kills only that handle. Every async continuation checks its token before starting playback or touching state, so a cancelled job cannot revive or overwrite a newer one. Awaiting playback inside the handler is rejected because it may make `stop` unreachable.

State machine:

```text
idle --speak--> generating --audio ok--> playing --exit--> idle
  ^                 |                       |
  +---- stop/err ---+------- stop/err ------+
cache hit: idle --speak--> playing
```

### 3. Select answers from the session projection

Use `ctx.sessionManager.buildSessionProjection().messages` (active branch with compaction applied), find the latest user message, then the finalized assistant message after it, and join its text blocks. A message with an aborted or error stop reason, or only tool calls, yields "no eligible answer" rather than an earlier turn. Raw `getEntries()` is rejected because it includes abandoned branches. Terminal scraping and session-file parsing are rejected.

### 4. Deterministic cleanup, no new runtime dependency

A conservative line-oriented cleaner removes fenced and indented code, images, and HTML, reduces links to their labels, and strips escape sequences, with Unicode-safe handling. It never rewrites meaning. Explicit `text` bypasses cleanup. A Markdown parser would be more exact but adds the package's first runtime dependency; revisit if fixture tests show the cleaner is unreliable.

### 5. One ElevenLabs request, full file, then play

Plain `fetch` with a fixed origin, `redirect: "error"`, an `AbortSignal` combining the job controller and a 45 s deadline, and a streamed read capped at 10 MiB. Accept only a successful response whose body is nonempty and whose content type is audio. Write to a unique private temp file and rename into the cache. Zero retries. Streaming playback is deferred until real latency is measured.

### 6. Configurable player, no shell

Config holds `player.command` and `player.args` (with a `{file}` placeholder). Launch with `child_process.spawn(command, args, { shell: false, stdio: ["ignore", "ignore", "pipe"] })`, an environment copy without `ELEVENLABS_API_KEY`, and bounded stderr capture. Preflight resolves the executable before any billable call. Documented examples: `ffplay -nodisp -autoexit -loglevel quiet {file}` (present on this machine) and `mpv --no-config --no-video --really-quiet {file}`. `ffplay` exits with code 123 when terminated by `SIGTERM`, so a job that has been asked to stop treats any player exit as cancellation, and `-nostdin` must not be used (invalid in ffplay 6.1.1; see `extensions/speak/COMPATIBILITY.md`). Which one ships as the default is deferred; both are examples, not claims about this environment's audio session until a spike confirms them.

### 7. Cache key is a hash of canonical JSON

`sha256(canonicalJson({ text, provider, voiceId, modelId, outputFormat, voiceSettings: null, normalizerVersion, voiceRevision }))`. v1 sends no `voice_settings` override, so the field is fixed to `null`; the provider's saved voice settings apply, and `voiceRevision` is the manual lever when they change. A future per-voice settings option must put the sent values in this field. Files `0600` in a `0700` directory under `$XDG_CACHE_HOME/pi-speak` (fallback `~/.cache/pi-speak`). Eviction by age (7 days) then oldest-first to the 100 MiB cap, skipping the playing file. Eviction uses file metadata only (name, size, mtime) and no sidecar index. The replay reference is an in-memory pointer to the last played clip's cache key, cleared on session replacement or branch navigation, so replay after a Pi restart reports nothing to replay. Cancelled or failed generations delete their temporary file.

### 8. Configuration and secrets

Config at `$XDG_CONFIG_HOME/pi-speak/config.json` (fallback `~/.config/pi-speak/config.json`), validated on use, never at load. Placeholders (`SET_YOUR_AUTHORIZED_VOICE_ID`) are rejected. The API key comes only from `ELEVENLABS_API_KEY`. Proposed shape (not an existing Pi schema):

```json
{
  "provider": "elevenlabs",
  "voiceId": "SET_YOUR_AUTHORIZED_VOICE_ID",
  "modelId": "eleven_flash_v2_5",
  "outputFormat": "mp3_44100_128",
  "voiceRevision": 1,
  "hardLimitChars": 4000,
  "requestTimeoutMs": 45000,
  "player": { "command": "ffplay", "args": ["-nodisp", "-autoexit", "-loglevel", "quiet", "{file}"] },
  "cache": { "maxBytes": 104857600, "ttlDays": 7 }
}
```

### 9. Test strategy

`node --test --experimental-strip-types` as in the repo, with the factory taking injected `fetch`, `spawn`, clock, and filesystem root. Cover: silent load with a network sentinel; answer selection fixtures; cleanup fixtures; length limit boundaries (4000 and 4001); preflight failures; cache hit, miss on each key field, and replay miss; duplicate and stop-during-generation/playback; late-callback guard; lifecycle cancellation; deferred subcommands reporting unavailable. Mocked tests do not prove the real account, voice, or audio session; one live test of a non-sensitive sentence of at most 200 characters runs only after explicit user authorization and records provider-visible usage.

### 10. ADR for the egress boundary

ADR-0002 records that the package gains an explicit-request outbound network path to a third-party paid service, why it is manual-only, and the secret, cache, and privacy boundaries. It is the first task so later work follows a recorded decision.

## Risks / Trade-offs

- [Command handler blocking behavior is undocumented] → Return immediately by design; qualify in a real terminal before relying on `stop`.
- [`SessionProjection.messages` shape or compaction behavior differs between 0.87.1 and 0.99.2] → Inspect both and fixture-test; if unsafe, keep `/speak text` working and report the limit rather than reading raw history.
- [Cleaner mangles meaning] → Preserve numerals, negation, and qualifications by construction, fixture-test them, and keep `/speak text` as the exact-wording path.
- [Timeout leaves billing uncertain] → No retry, no claim of "free"; message says the outcome is unknown.
- [ffplay or other player writes to the terminal or grabs input] → `-nodisp`, ignored stdin, bounded stderr, and a real-terminal spike before declaring playback done.
- [ElevenLabs facts in the guide are stale or wrong] → Re-fetch current docs during apply and record what was verified; stop on a mismatch rather than coding to the guide.
- [Subscription may not include cloned-voice API use] → User confirms entitlement before the live test; no purchase or upload by the agent.
- [Other same-user processes or extensions can read the environment, cache, or config] → Stated in the README; not mitigated further for a single-user local tool.
- [Cache holds sensitive audio] → Private permissions and short retention; hashes are not encryption, and the README says so.

## Open Questions

- Should `extensions/speak/` be added to the published package (`pi.extensions` and `files`) once it works, or stay a local-only extension?
- Which player command ships as the documented default, `ffplay` or `mpv`?
- How should `voiceRevision` be bumped when a voice changes upstream under the same voice ID: manual edit only, or prompt in `/speak status`?

## Deferred Capabilities

Each item below is intentionally absent from v1 (the spec requires v1 to report the first two as unavailable). The details are kept so each can become its own future spec without redoing research. Each future spec starts by re-verifying the cited Pi and provider interfaces.

### D1. `/speak summary`

- Purpose: speak a short summary of a long answer instead of refusing it at the length limit.
- Disabled until the user explicitly configures a summary provider and model and accepts the extra inference cost; never auto-select an expensive coding model.
- Input: only the cleaned selected answer. No repository, conversation, tool logs, or reasoning. Separate input cap of 12,000 characters; above it, ask for a shorter passage rather than silently dropping content.
- Call: a separate, tool-free, bounded model call using the Pi model registry and auth (`modelRegistry.find`, `getApiKeyAndHeaders`, and the `pi-ai` `completeSimple` function, all present in 0.99.2) with low reasoning. Do not use `pi.sendUserMessage()` (it starts an agent turn). Do not change the session's system prompt, active tools, model, or conversation.
- Prompt intent: brief spoken summary; treat the answer as data not instructions; preserve language, uncertainty, negation, and qualifications; state completed work, unresolved issues, and next actions only when supported; invent no passing tests, deployments, fixes, or approvals; plain prose, 2-4 sentences, target 250-600 characters, no code blocks.
- Output: validate and cap at 800 characters. On model failure, tool-call output, or unsuitable text, show an error. Never fall back to speaking the original long answer.
- Cache summaries in memory by source hash, summary model and settings, and prompt version. `/speak replay` never calls a model, including after restart.
- Reporting: summary model usage counted separately from speech characters (see D5). Do not claim it is in Pi's own totals unless verified.
- Open for that spec: which model, its cost, and whether summaries are cached on disk.

### D2. Confirmation tiers for long text

- Purpose: let moderately long text through with an explicit check instead of a single hard refusal.
- Tiers: up to 1,500 characters proceed; 1,501-4,000 show the prepared text and length and require confirmation before sending; above 4,000 refuse and suggest shorter `/speak text` or summary. The 4,000 hard limit matches v1, so tiers are purely additive.
- Confirmation uses the terminal UI confirm dialog, available only in the interactive terminal mode, consistent with the v1 mode restriction.
- Never silently truncate, split into several paid requests, or auto-summarize. Limits are extension limits, not ElevenLabs model limits.
- Open for that spec: whether the soft limit should be configurable and whether replay of a confirmed text skips re-confirmation.

### D3. Secret-pattern blocking

- Purpose: reduce accidental transmission of credentials to a third party.
- Scope: the final outbound text after cleanup, for both answer and explicit-text modes. Detect private-key blocks (`-----BEGIN ... PRIVATE KEY-----`), common token shapes (for example provider API-key prefixes, GitHub tokens, AWS access key IDs, JWT-like three-part strings), `Authorization`/`xi-api-key` style header text, and long high-entropy strings.
- Behavior: block transmission and tell the user which category matched without echoing the value; the user supplies edited text through `/speak text`. No override flag unless the future spec decides one is needed.
- Framing: a precaution, not a guarantee that confidential content was removed. Expect false positives; keep the pattern list versioned and fixture-tested with both positive and benign samples.
- Open for that spec: entropy threshold, whether to allow an explicit one-time override, and how matches are logged without leaking.

### D4. `/speak cache-clear`

- Purpose: let the user delete cached audio on demand (it is sensitive content).
- Behavior: ask for confirmation with the terminal UI confirm dialog, then delete only this extension's cache directory contents. Resolve and verify the path is the extension's own cache root, refuse symlinks and non-regular entries, and refuse or stop the job first if a clip is playing. Report the count and bytes removed.
- Must not erase usage records (D5) or imply that provider allowance was restored.
- Open for that spec: whether to also support clearing by age or by session.

### D5. Usage accounting

- Purpose: show locally observed activity so the user can sanity-check spend.
- Track separately: characters submitted to the provider, completed generations, cache hits, and uncertain submissions (timeouts and cancellations whose billing outcome is unknown). Summary-model usage (D1) is tracked separately from speech.
- Store counters in a private file beside the cache, not removed by `cache-clear`. Show them in `/speak status` labeled as local estimates, not the provider's bill or remaining quota.
- Financial safeguard is provider-side: use a dedicated, restricted API key with account or key limits after confirming the units the account shows. Published rates quoted in the guide ($0.04 per 1,000 characters, 150,000 Flash/Turbo characters on a $6 tier) are unverified and must be re-checked; they are usage values, not necessarily extra charges on top of an included allowance.
- Open for that spec: reset period (daily, monthly, manual), and whether to warn at a user-set threshold.

### D6. Other deferred items

- Streaming playback while downloading, only if measured full-file latency is unacceptable.
- Keyboard shortcut and terminal-selection capture.
- An optional natural-language speech tool with per-call confirmation; unrestricted model-callable speech is out of scope.
- A second provider (Google Instant Custom Voice is listed at $60 per million characters and is restricted to allow-listed users, per the guide; unverified).
- Cross-process playback coordination; multiple Pi processes remain independent.
