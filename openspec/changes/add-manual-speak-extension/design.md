# Design

## Context

See `proposal.md` for motivation and `specs/manual-speech/spec.md` for the behavior contract. This adds a small, manual-only extension to the existing Pi extension package; it is not a voice assistant, a local speech stack, or a Pi fork.

Historical base-release discovery, verified read-only during the original exploration (current qualification is recorded in `extensions/speak/COMPATIBILITY.md`):

| Fact | Evidence | Consequence |
| --- | --- | --- |
| Package already ships a Pi extension and declares Pi packages as peers, with `pi.extensions` listing one entry. | `package.json`, `extensions/whimsical-activity/index.ts` | `extensions/speak/` follows the same shape. Its factory accepts injected dependencies, which is the pattern to reuse for testing. |
| Repo dev dependency is Pi 0.87.1; installed launcher runs 0.99.2. | `node_modules/@earendil-works/pi-coding-agent`, `~/.pi/agent/install/releases/` | Every host API used must exist in both. Typecheck against 0.87.1; qualify behavior against 0.99.2. |
| `registerCommand(name, { handler(args, ctx) })`, `ctx.mode` (`"tui"`, `"rpc"`, `"json"`, `"print"`), `ctx.isIdle()`, `ctx.hasPendingMessages()`, `ctx.sessionManager.buildSessionProjection()`, and events `session_shutdown` (reason `quit | reload | new | resume | fork`),`session_before_switch`,`session_before_fork`,`session_tree` exist. | `dist/core/extensions/types.d.ts`, `session-manager.d.ts` in 0.99.2; the same symbols were found in 0.87.1 | Enough surface for the contract. Exact `SessionProjection.messages` content shape is still to be inspected during apply. |
| Docs do not say whether an awaited command handler blocks other commands. | `docs/extensions.md` | Design assumes it might; the handler returns immediately and the job runs as an owned async task. A real-terminal check on Pi 0.99.2 confirmed that `/speak status` and `/speak stop` are accepted during playback (see `extensions/speak/COMPATIBILITY.md`). |
| `mpv` is not installed; `ffplay` and `pw-play` are. | `command -v` | Player is configuration, not hardcoded. |
| Test helpers `network-sentinel.ts` and `network-probe.ts` exist. | `test/whimsical-activity/` | Reuse the idea to prove silent load makes zero network calls. |
| `docs/adr/0001-hybrid-activity-compatibility.md` exists. | `docs/adr/` | New ADR-0002 records the new egress boundary. |

Unverified leads, to be re-established at apply time and never treated as passed: the ElevenLabs endpoint path, `xi-api-key` header, `eleven_flash_v2_5` model and its language coverage, `mp3_44100_128` format, redirect and error behavior, and all pricing and entitlement figures. The user also has not confirmed how their subscription covers API use of a cloned voice.

The trust boundary is concrete and small: the user's own Pi answers go to a service the user chose, only on explicit request. Safeguards are sized to that boundary, which is why several guide features are deferred.

## Goals / Non-Goals

**Goals:**

- A trustworthy `/speak` that is silent unless asked, cheap to reason about, and always stoppable.
- Zero TTS calls on audio-cache hit; zero translation calls on translation-cache hit; zero model or provider calls on replay.
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
idle --> preparing --> translating --> generating --> playing --> idle
stop/error from any active phase --> idle
original/text: skip translating
translation cache hit: skip inference
audio cache hit: skip generating
replay: cache-only playback
```

### 3. Select answers from the active transcript branch (implemented and offline-qualified)

The earlier selector read `buildSessionProjection().messages`. A read-only reproduction with the repo's real SessionManager showed that keeping only the final assistant message or retaining no messages after compaction both returned `no-turn`, even though the original user and answer remained in `getBranch()`. Wave 11 replaces that input with original active-branch messages and qualifies real compaction, context replacement/omission and persisted resume against Pi 0.87.1 and 0.99.2. The existing synthetic summary-role fixture alone did not qualify this behavior. Verification is caller-owned, not independent Oracle approval; live providers, language fidelity and billing remain unverified.

For answer-based speech, use the current `ctx.sessionManager.getBranch()` and extract only original `message` entries for the current leaf's ancestor path. Apply the existing latest-user/latest-assistant and normal-stop/text-only rules to these messages. This recovers the transcript rather than skipping an ineligible latest turn: an unanswered, aborted, errored, truncated or tool-only latest turn still produces the existing refusal. Require the persisted session header's `cwd` to match `ctx.cwd` after ordinary absolute-path normalization; a mismatched or unavailable project identity is a refusal before any paid work. Working-directory identity is the project's scope here, not repository-root discovery or scanning neighboring worktrees.

`getBranch()` and `getHeader()` are exposed in ReadonlySessionManager in both checked Pi versions. The current manager supplies session identity on every invocation, including after resume/restart; no remembered-answer pointer, session search, JSONL parsing, new persistence or resume-time provider work is needed. `getEntries()` remains rejected because it includes abandoned branches. Summaries, custom entries, tools, reasoning and context-edit entries are not answers. Context edits change future model context, not the displayed transcript; speech uses the original displayed answer rather than a context-only replacement. Keep existing idle/pending-work and lifecycle guards, translation/cleanup, cache/replay and diagnostic boundaries unchanged.

ADR assessment: no new ADR is needed. ADR-0002/0003 govern manual-only answer egress, not a model-context projection requirement; the recipients, disclosed unit (one selected answer), storage and explicit-request boundary remain unchanged. This supersedes only the earlier selection decision in this change's design. Alternatives rejected: scanning saved sessions (violates same-session scope), speaking a compaction summary (not the original answer), or retaining a last-answer pointer (fails after resume and risks stale branch/session content). Deploy with `/reload`; rollback restores projection-based selection and its known compacted-history limitation.

### 4. Deterministic cleanup, no new runtime dependency

A conservative line-oriented cleaner removes fenced and indented code, images, and HTML, reduces links to their labels, and strips escape sequences, with Unicode-safe handling. It never rewrites meaning. Explicit `text` bypasses cleanup. A Markdown parser would be more exact but adds the package's first runtime dependency; revisit if fixture tests show the cleaner is unreliable.

### 5. One ElevenLabs request, full file, then play

Plain `fetch` with a fixed origin, `redirect: "manual"` (Node returns the 3xx response itself, which is reported as a failure and never followed), an `AbortSignal` combining the job controller and a 45 s deadline, and a streamed read capped at 10 MiB. Accept only a successful response whose body is nonempty and whose content type is audio. Write to a unique private temp file and rename into the cache. Zero retries. Streaming playback is deferred until real latency is measured.

### 6. Configurable player, no shell

Config holds `player.command` and `player.args` (with a `{file}` placeholder). Launch with `child_process.spawn(command, args, { shell: false, stdio: ["ignore", "ignore", "pipe"] })`, an environment copy without `ELEVENLABS_API_KEY`, and bounded stderr capture. Preflight resolves the executable before any billable call. Documented examples: `ffplay -nodisp -autoexit -loglevel quiet {file}` (present on this machine) and `mpv --no-config --no-video --really-quiet {file}`. `ffplay` exits with code 123 when terminated by `SIGTERM`, so a job that has been asked to stop treats any player exit as cancellation, and `-nostdin` must not be used (invalid in ffplay 6.1.1; see `extensions/speak/COMPATIBILITY.md`). Which one ships as the default is deferred; both are examples, not claims about this environment's audio session until a spike confirms them.

### 7. Cache key is a hash of canonical JSON

`sha256(canonicalJson({ text, provider, voiceId, modelId, outputFormat, voiceSettings: null, normalizerVersion, voiceRevision }))`. v1 sends no `voice_settings` override, so the field is fixed to `null`; the provider's saved voice settings apply, and `voiceRevision` is the manual lever when they change. A future per-voice settings option must put the sent values in this field. Files `0600` in a `0700` directory under `$XDG_CACHE_HOME/pi-speak` (fallback `~/.cache/pi-speak`). Eviction by age (7 days, counted from the clip's last use because a cache hit refreshes its modification time) then oldest-first to the 100 MiB cap, skipping the playing file. Eviction uses file metadata only (name, size, mtime) and no sidecar index. The replay reference is an in-memory pointer to the last played clip's cache key, cleared on session replacement or branch navigation, so replay after a Pi restart reports nothing to replay. Cancelled or failed generations delete their temporary file.

### 8. Configuration and secrets

Config at `$XDG_CONFIG_HOME/pi-speak/config.json` (fallback `~/.config/pi-speak/config.json`), validated on use, never at load. Placeholders (`SET_YOUR_AUTHORIZED_VOICE_ID`) are rejected. The API key comes only from `ELEVENLABS_API_KEY`. Base configuration (not a Pi settings schema); pending locale/translation additions are specified in decision 8a:

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

### 8a. Speech locale and isolated translation (offline-qualified amendment)

The user prefers English written answers and Vietnamese speech. Add top-level `locale`, default `"vi"`, to the extension's non-secret config. It is a speech target, never a Pi conversation-language setting or a voice-ID replacement. Canonicalize a non-empty BCP-47 language tag (for example `vi`, `vi-VN`, or `en`) and reject malformed tags before network calls. A syntactically valid locale is not a guarantee of support by a selected model/voice: document checking ElevenLabs language support; explicit provider rejection fails without substitution. Missing locale uses `vi`; an explicit invalid value is an error.

Additional non-secret translation fields; the user selected `openai-codex/gpt-6-luna` with thinking `medium` and authorized updating their existing speech config in Wave 6:

```json
{
  "locale": "vi",
  "translation": {
    "provider": "openai-codex",
    "model": "gpt-6-luna",
    "thinking": "medium"
  }
}
```

`translation` is optional for loading and for literal/original/replay modes, but required for localized `/speak`. Its provider and model must resolve to an authenticated concrete Pi registry model (virtual routing models are rejected because they can choose another model/provider at request time); never inherit the coding model silently or persist credentials here. Configuring that model opts into translation inference cost and disclosure. Optional `translation.thinking` accepts Pi's native `minimal`, `low`, `medium`, `high`, `xhigh`, or `max` levels and maps to the isolated call's `reasoning` option, never Pi's coding-model thinking. Omission leaves the provider/host default unchanged. Effective thinking enters translation-cache identity and redacted status. Changing it requires new inference on a translation-cache miss but may reuse identical final audio.

Command behavior:

- `/speak`: capture the eligible answer and config, clean deterministically, enforce the existing configured hard limit on the cleaned source, then render faithfully in the target locale through one isolated model call (or the session translation cache). Even already-target-language input follows this path on a miss; instruct the model to return it unchanged if already suitable, instead of adding a separate language-detection call or heuristic.
- `/speak original`: select and clean the same eligible answer with the same idle/branch rules, but bypass translation and use the original language. It works without a configured translation model.
- `/speak text <text>`: retains its literal wording contract regardless of locale. No translation call.
- `/speak replay`: replay the last clip as generated, even if locale has since changed; no translation, no synthesis. Session/branch navigation still clears the pointer.
- `/speak status`: show effective locale and configured translation provider/model or `not configured`, without credentials or network requests.

Translation uses a separate tool-free call through the host's model registry/authentication interface. Reverify the installed interfaces before implementation rather than starting a Pi agent turn. Send only the cleaned answer and the translation instruction; no repository, session history, tool logs, or hidden reasoning. Preserve meaning, negation, uncertainty, numbers, versions, technical identifiers, and qualifications; do not summarize, follow embedded instructions, or add claims. Return plain speech text. Translation is distinct from deferred `/speak summary`.

Preflight the voice, TTS key, player, locale, source length, and selected translation model/authentication before inference. A source or result exceeding `hardLimitChars` (ceiling 4000 Unicode code points) is refused, not truncated, summarized, or split. Bound translation by a 45-second total deadline and a finite output-token cap supported by the host adapter (at most 8192); reject empty, errored, aborted, truncated, tool-call, or unsupported content before TTS. A normally completed result may contain thinking alongside translated text: extract only text blocks in order and discard reasoning and signatures without logging, caching, persisting, or sending them to ElevenLabs. Thinking-only results are invalid. At most one inference request per translation cache miss, with no application retry, automatic model switch, or source-language fallback. Structural validation does not prove translation fidelity; bilingual fixtures and optional user listening assess that limitation.

The existing single job owns translation as well as synthesis and playback. Add `translating` before `generating`; stop and lifecycle cancellation abort the isolated call, and generation identity checks prevent late results from being cached, synthesized, played, or applied to a newer job. Snapshot configuration at invocation so an edit cannot mix one locale/model with another job's cache identity.

Keep at most 32 completed translations in memory with oldest-entry eviction, keyed by cleaned-source hash, canonical locale, translation provider/model, fixed generation settings, prompt version, and normalizer version. Clear on session replacement/branch navigation. Do not persist source or translated text. Cache a valid completed translation independently of TTS success so a subsequent explicit retry need not rerun inference. A canceled or invalid translation is not cached.

Extend audio cache identity with an explicit speech-locale discriminator (`canonical locale` for localized output; `original` for original/explicit-text modes) in addition to the final outbound text and existing TTS inputs. Translation settings enter the translation key; identical final text with identical speech locale and TTS settings can safely reuse audio. Repeated same-context localized requests with both entries cached make zero model and TTS calls. After restart/translation-cache eviction, inference may be required to recover final text before an audio lookup; do not claim cross-restart zero-inference reuse. Replay remains memory-scoped and always makes zero calls.

Rollout preserves an existing config file without adding keys automatically. With a missing locale, `/speak` defaults to Vietnamese but reports missing translation setup if no model is configured; it does not silently retain English narration. `/speak original` and `/speak text` remain available. Document this intentional behavior change before rollout. Do not edit the user's live config without separate setup approval or infer that previous TTS-only approval covers translation testing. The user separately approved preserving the existing voice/TTS settings while adding locale `vi` and the selected translation model/thinking in Wave 6; no paid requests are authorized by that approval.

### 8b. Translation failure evidence (implemented and offline-qualified)

The intermittent failure currently converges on one message for non-stop completion, empty content, or unsupported blocks. It establishes that ElevenLabs was not called, not why translation failed. Do not change model/thinking settings or add retries based on that message.

Carry a small structured descriptor on translation failures, separate from notification rendering. Distinguish setup failure, deadline, provider-reported error/abort, output truncation, unsupported content, absent usable text, code markup, output length, and an unknown request failure. A thrown exception without reliable typed evidence remains unknown; never infer authentication, rate limit, offline state, or transport cause from an arbitrary error string. Record the operation stage (setup/authentication/request/result validation), whether inference was started, and whether billing is uncertain. Intentional cancellation is not a failure notification or failure record.

The active speech job owns exactly one best-effort `speak-translation-failure` custom session entry per translation failure using Pi's existing `appendEntry` API, verified in repo peer types and host source as not sent to the LLM. No separate log file, transcript message, agent turn, success-event stream, or new logging dependency. A random diagnostic ID correlates that entry with the existing failure notification. If persistence throws, retain the original failure message and do not claim the entry was saved. Guard both emission and notification with the current job identity; stopped/replaced-session jobs and late results emit nothing.

Persist only an explicitly constructed, versioned metadata object: diagnostic ID, stable failure code/stage, timestamp and elapsed milliseconds, bounded configured provider/model/locale/thinking identifiers, inference-started state, finite output-token limit, known stop reason, and text/thinking/tool/other block counts when a response exists. Optional HTTP status requires a verified structured adapter field; absent status is omitted, never reconstructed from payload text. Unknown stop/content values map to `unknown`/`other`. Do not persist source/translated text, source hashes, thinking/signatures, credentials, headers, URLs, raw error messages, provider response bodies, or arbitrary error properties. Counts do not contain block content.

The existing notification states the observed failure category and that nothing was sent to ElevenLabs, with the diagnostic reference when saved. Truncation describes incomplete output rather than prescribing an unverified token/model change; setup guidance uses the existing original/literal escape paths. Deadline/unknown request outcomes retain inference-billing uncertainty. README explains where the custom entry is stored in the Pi session JSONL and that the next failure supplies evidence rather than diagnosing the earlier incident retrospectively.

ADR assessment: no new ADR is required. This is bounded metadata-only observability within the existing speech extension and Pi persistence API; ADR-0002/0003's egress, privacy, manual-only, no-retry and no-session-conversation-mutation boundaries remain unchanged. Rollback is removing the diagnostics amendment; existing entries remain harmless historical metadata. Whimsical activity, user runtime config, packaging, TTS and playback are unchanged.

### 8c. Idle-visible speech progress (implemented and offline-qualified)

Footer status alone does not supply the requested separate waiting line, and native Working/Whimsical is tied to main-agent streaming. Use Pi's existing `ctx.ui.setWidget` string-array API for one extension-owned `speak-progress` line above the editor. Display only the current phase: `Speech: Preparing...`, `Speech: Translating...`, `Speech: ElevenLabs...`, or `Speech: Playing...`. Retain the existing footer status; do not call shared Working setters, replace the editor/footer, or modify Whimsical or the host. Plain ASCII text needs no animation, timer, new dependency, source-text disclosure, or transcript persistence.

Show Preparing synchronously when claiming a job. Only show Translating when inference starts, ElevenLabs when synthesis starts, and Playing when playback starts; original/literal/replay and cache hits skip work they do not perform. The existing current-job guard owns updates and clearing. Stop/lifecycle cleanup clears immediately; completion, preflight refusal and failure clear in final cleanup. A late cancelled job cannot update or clear a newer job's line. Widget errors are cosmetic and cannot block speech or stop. No idle/startup widget is installed.

Verify phase transitions and cleanup offline, plus actual idle visibility and responsive stop in installed Pi's terminal with controlled translation/TTS/player dependencies; no paid calls are authorized. ADR assessment: no new ADR is needed because this uses an existing extension UI surface without changing egress, state storage, or host ownership. Reload activates the change; rollback removes the widget calls.

### 8d. Provider quota and billing visibility (approved amendment)

`/speak quota` performs one explicit, read-only `GET https://api.elevenlabs.io/v1/user/subscription` with the environment API key. It needs no speech configuration, player, model, or idle agent and can run in any Pi mode with notification support. Loading and `/speak status` remain network-free. No polling, purchase, billing mutation, speech, translation, cache access, or account-data persistence is added.

Report the provider's `character_count` and `character_limit` as account-level credits, remaining allowance (clamped to zero, with excess usage shown), usage percentage when the limit is nonzero, and `next_character_count_reset_unix` in UTC when supplied. These are not extension-only usage or a guarantee of future speech characters. Cost analysis is limited to valid provider-reported `current_overage.amount`/currency and `next_invoice.amount_due_cents` with subscription currency. Missing or invalid optional data says unavailable, not zero. Do not calculate per-speech price, infer PAYG balance/total spend, combine the next invoice with overage, or attribute account activity to this extension.

Use the existing fixed ElevenLabs origin, manual redirects, a 10-second total deadline, a 64 KiB response cap and no retry. Invalid required allowance fields fail without guessed figures; failures show safe HTTP/auth/permission/rate-limit/timeout or unknown-request messages without raw errors, payloads or credentials. Keep the query separate from speech state and progress; return promptly, suppress duplicate queries, cancel on session cleanup and ignore stale completions. No API-key scope is expanded automatically; insufficient permission asks the user to check their key's subscription access.

After the user observed HTTP 401, the diagnostic correction preserves HTTP status and reads at most 4 KiB of error JSON. Show only bounded token-shaped `detail.type`, `detail.code` and legacy `detail.status`, excluding the API key. Never display provider message/request data or persist the body. Known structured authorization/missing-permissions codes guide subscription-read access; known authentication/invalid-key codes guide key validity. An unexplained 401 remains unconfirmed, not a declaration that the key is invalid. Invalid, oversized or unreadable error bodies retain the HTTP evidence without inventing a cause. Existing deadline, no-retry, lifecycle and no-live-request boundaries remain unchanged.

Official API field evidence is recorded in COMPATIBILITY; offline mocked tests qualify behavior, not the user's actual account or bill. ADR assessment: no new ADR is needed for a read-only request to the same already-approved provider with no new recipient or persistence. Existing egress/privacy records remain authoritative. Rollback removes the subcommand and quota module.

### 9. Test strategy

`node --test --experimental-strip-types` as in the repo, with the factory taking injected `fetch`, `spawn`, clock, and filesystem root. Cover: silent load with a network sentinel; answer selection fixtures; cleanup fixtures; length limit boundaries (4000 and 4001); preflight failures; cache hit, miss on each key field, and replay miss; duplicate and stop-during-generation/playback; late-callback guard; lifecycle cancellation; deferred subcommands reporting unavailable. Mocked tests do not prove the real account, voice, or audio session; one live test of a non-sensitive sentence of at most 200 characters runs only after explicit user authorization and records provider-visible usage.

### 10. ADR for the egress boundary

The locale amendment records Orchestrator-owned ADR-0003 before implementation, superseding only ADR-0002's one-origin/no-inference scope. Preserve the original accepted record and its manual-only, secret, publication, cancellation, and cache boundaries; record the additional explicitly configured translation provider and costs. The deferred summary feature remains deferred.

ADR-0002 records that the package gains an explicit-request outbound network path to a third-party paid service, why it is manual-only, and the secret, cache, and privacy boundaries. It is the first task so later work follows a recorded decision.

## Risks / Trade-offs

- [Command handler blocking behavior is undocumented] → Return immediately by design; qualify in a real terminal before relying on `stop`.
- [Compaction hides original turns from model context] → Use only the current session's active transcript branch, enforce project identity and latest-turn eligibility, and qualify real compaction plus persisted resume fixtures in both supported Pi versions. Never scan other sessions or speak summaries.
- [Cleaner mangles meaning] → Preserve numerals, negation, and qualifications by construction, fixture-test them, and keep `/speak text` as the exact-wording path.
- [Timeout leaves billing uncertain] → No retry, no claim of "free"; message says the outcome is unknown.
- [ffplay or other player writes to the terminal or grabs input] → `-nodisp`, ignored stdin, bounded stderr, and a real-terminal spike before declaring playback done.
- [ElevenLabs facts in the guide are stale or wrong] → Re-fetch current docs during apply and record what was verified; stop on a mismatch rather than coding to the guide.
- [Subscription may not include cloned-voice API use] → User confirms entitlement before the live test; no purchase or upload by the agent.
- [Other same-user processes or extensions can read the environment, cache, or config] → Stated in the README; not mitigated further for a single-user local tool.
- [Cache holds sensitive audio] → Private permissions and short retention; hashes are not encryption, and the README says so.

## Open Questions

- Should `extensions/speak/` be added to the published package (`pi.extensions` and `files`) once it works, or stay a local-only extension?
- Player default was resolved during base-release qualification: `ffplay` ships as default; `mpv` remains configurable but untested on this machine.
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

### D5. Local usage accounting

The explicit provider quota lookup in decision 8d is implemented separately; the counters below remain deferred.

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
