# Proposal

## Why

Pi output is text-only, and the user wants to hear a Pi answer in their own authorized cloned ElevenLabs voice without turning the terminal into a voice assistant. Speech must be strictly opt-in: a cloud synthesis call spends paid allowance and sends text to a third party, so nothing may be spoken or transmitted unless the user explicitly asks.

## What Changes

Locale amendment (implemented and offline-qualified; live translation quality unverified): keep Pi's written answers unchanged while `/speak` renders the selected answer in a configurable speech `locale`, default `vi`. Add an isolated, explicitly configured translation-model call before ElevenLabs, with `/speak original` bypassing translation and `/speak text` retaining literal wording. The default locale is not permission to select a paid translation model automatically. The locale wave passed offline checks and authorized caller self-review; use `/speak original` to retain the base release's untranslated-answer behavior until translation setup is complete.

- Add a small, manual-only Pi extension at `extensions/speak/` that registers one `/speak` command: `/speak` (latest completed assistant answer), `/speak text <text>`, `/speak original` (same selected answer without translation), `/speak stop`, `/speak replay`, `/speak status`, and `/speak quota` (explicit account lookup, not speech).
- Support an optional translation-only thinking level, pass it to the isolated inference request, and include it in translation-cache identity and status. The user selected `openai-codex/gpt-6-luna` at `medium` and approved updating their non-secret speech config; returned thinking is discarded, never spoken. This setup does not authorize paid tests.
- Validate a speech-only locale (default `vi`) independently of the conversation language, preserve meaning rather than summarize, and keep translation bounded, cancellable, and tool-free. Cache translations in session memory and audio on disk; replay never translates or synthesizes. Missing translation configuration or translation failure must report an error, never silently speak the wrong language.
- Diagnostics amendment (implemented and offline-qualified by authorized caller self-review; live failure diagnosis unverified): distinguish translation setup/provider/transport/timeout/result-validation failures in the existing notification and correlate each active-job failure with a bounded metadata-only `speak-translation-failure` custom session entry. Record observed status/stop reason and structural counts, not source/translation text, reasoning, credentials, or raw provider errors. Unknown causes stay unknown; no retry or fallback is introduced.
- Synthesize speech through the ElevenLabs create-speech HTTPS endpoint with a user-configured voice ID and an explicit model, cache the audio locally under a content-addressed key, and play it through a configurable local player (no shell).
- Progress amendment (implemented and offline-qualified with independent Oracle review): show a dedicated, transient speech-progress line above the terminal editor even while the main agent is idle, with Preparing, Translating, ElevenLabs, and Playing phases as applicable. Clear it on completion, failure, stop, and session cleanup; stale jobs cannot overwrite a newer line. Use the existing widget API, without changing Pi or Whimsical.
- Quota amendment (implemented and offline-qualified with independent Oracle review; live account verification unperformed): `/speak quota` reads ElevenLabs subscription allowance and reports used/remaining credits, usage percentage, reset date, and provider-reported overage/next invoice when available. It is account-level, not extension-only usage; no PAYG-total or per-speech-price estimate is claimed. No automatic polling, purchase, speech, translation, billing mutation, or account-data persistence.
- Compaction/resume amendment (implemented and offline-qualified by caller self-verification): select the latest answer from the current session's active-branch transcript even when compaction has removed its user turn or answer from model context. Restrict selection to the same project and active session; never search other session files or abandoned branches, speak a summary, or skip a failed/aborted/latest unanswered turn. Persisted offline fixtures qualify resumed-session selection in both checked Pi versions; live-provider quality and billing remain unverified. The user requests Orchestrator implementation and self-verification, with no Oracle in this amendment's apply phase.
- Run at most one speech job per Pi process. `/speak stop` cancels only this extension's generation and playback and must work while a job is active.
- Make loading, reloading, prompts, tools, and agent completion silent: no ElevenLabs request, no model call, no playback unless `/speak` is invoked.
- Document, as deferred future capabilities with enough detail to write their own specs later, exactly what v1 omits: `/speak summary`, confirmation tiers for long text, secret-pattern blocking, `/speak cache-clear`, and local usage accounting (distinct from the explicit provider quota lookup). v1 only enforces a single hard length limit and reports these subcommands as unavailable. Details live in `design.md` under "Deferred Capabilities".
- Out of scope: microphone input, wake words, automatic narration, a model-callable speech tool, a local TTS model, streaming playback, a Pi fork, speech in RPC/print/json modes (informational status/quota are separate), multi-provider support (Google Instant Custom Voice is a possible later alternative), voice creation or upload, and any change to the existing `whimsical-activity` extension.

## Capabilities

### New Capabilities

- `manual-speech`: explicit-only speech for Pi answers and supplied text, covering the `/speak` command contract, answer selection, text preparation, ElevenLabs synthesis, audio cache and replay, playback and cancellation, secret handling, and silence guarantees.

### Modified Capabilities

None. `openspec/specs/` is empty and the existing `whimsical-activity` behavior does not change.

## Impact

- New code under `extensions/speak/` and tests under `test/speak/`; `README` documentation for setup, use, and removal. No change to `extensions/whimsical-activity/`.
- `package.json` changes only by extending the `test` script glob to include `test/speak/*.test.ts`. `pi.extensions` and `files` stay unchanged: whether `extensions/speak/` joins the published `@zenstudiolab/pi-toolset` package is an open decision, and v1 is loadable with `pi -e extensions/speak/index.ts` and is not published.
- Locale amendment adds an isolated translation call through an explicitly chosen authenticated Pi registry model; only the cleaned selected answer is sent, and no main-session messages, tools, or settings are mutated. A superseding ADR for this additional egress boundary is the first pending locale-wave task.
- Original outbound network boundary: assistant text leaves the machine for `api.elevenlabs.io` only on explicit request. The package had no network egress before the base speech release; ADR-0002 records that original boundary decision.
- Runtime needs `ELEVENLABS_API_KEY` in the environment, an authorized voice ID in `~/.config/pi-speak/config.json`, and an audio player. `mpv` is not installed on this machine; `ffplay` is, so the player command is configurable.
- Exploration confirmed against Pi 0.99.2 (installed) and 0.87.1 (repo dev dependency): `registerCommand`, `ctx.mode`, `ctx.isIdle()`, `ctx.hasPendingMessages()`, `buildSessionProjection()`, and the `session_shutdown`, `session_before_switch`, `session_tree` events exist. These are leads; the apply phase re-verifies them and ElevenLabs API, model, and pricing claims, none of which are treated as accepted facts.
