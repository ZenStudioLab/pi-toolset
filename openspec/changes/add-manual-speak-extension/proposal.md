# Proposal

## Why

Pi output is text-only, and the user wants to hear a Pi answer in their own authorized cloned ElevenLabs voice without turning the terminal into a voice assistant. Speech must be strictly opt-in: a cloud synthesis call spends paid allowance and sends text to a third party, so nothing may be spoken or transmitted unless the user explicitly asks.

## What Changes

- Add a small, manual-only Pi extension at `extensions/speak/` that registers one `/speak` command: `/speak` (latest completed assistant answer), `/speak text <text>`, `/speak stop`, `/speak replay`, `/speak status`.
- Synthesize speech through the ElevenLabs create-speech HTTPS endpoint with a user-configured voice ID and an explicit model, cache the audio locally under a content-addressed key, and play it through a configurable local player (no shell).
- Run at most one speech job per Pi process. `/speak stop` cancels only this extension's generation and playback and must work while a job is active.
- Make loading, reloading, prompts, tools, and agent completion silent: no ElevenLabs request, no model call, no playback unless `/speak` is invoked.
- Document, as deferred future capabilities with enough detail to write their own specs later, exactly what v1 omits: `/speak summary`, confirmation tiers for long text, secret-pattern blocking, `/speak cache-clear`, and usage accounting. v1 only enforces a single hard length limit and reports these subcommands as unavailable. Details live in `design.md` under "Deferred Capabilities".
- Out of scope: microphone input, wake words, automatic narration, a model-callable speech tool, a local TTS model, streaming playback, a Pi fork, RPC/print/json modes, multi-provider support (Google Instant Custom Voice is a possible later alternative), voice creation or upload, and any change to the existing `whimsical-activity` extension.

## Capabilities

### New Capabilities

- `manual-speech`: explicit-only speech for Pi answers and supplied text, covering the `/speak` command contract, answer selection, text preparation, ElevenLabs synthesis, audio cache and replay, playback and cancellation, secret handling, and silence guarantees.

### Modified Capabilities

None. `openspec/specs/` is empty and the existing `whimsical-activity` behavior does not change.

## Impact

- New code under `extensions/speak/` and tests under `test/speak/`; `README` documentation for setup, use, and removal. No change to `extensions/whimsical-activity/`.
- `package.json` changes only by extending the `test` script glob to include `test/speak/*.test.ts`. `pi.extensions` and `files` stay unchanged: whether `extensions/speak/` joins the published `@zenstudiolab/pi-toolset` package is an open decision, and v1 is loadable with `pi -e extensions/speak/index.ts` and is not published.
- New outbound network boundary: assistant text leaves the machine for `api.elevenlabs.io` only on explicit request. The package currently has no network egress, so an ADR records this boundary decision.
- Runtime needs `ELEVENLABS_API_KEY` in the environment, an authorized voice ID in `~/.config/pi-speak/config.json`, and an audio player. `mpv` is not installed on this machine; `ffplay` is, so the player command is configurable.
- Exploration confirmed against Pi 0.99.2 (installed) and 0.87.1 (repo dev dependency): `registerCommand`, `ctx.mode`, `ctx.isIdle()`, `ctx.hasPendingMessages()`, `buildSessionProjection()`, and the `session_shutdown`, `session_before_switch`, `session_tree` events exist. These are leads; the apply phase re-verifies them and ElevenLabs API, model, and pricing claims, none of which are treated as accepted facts.
