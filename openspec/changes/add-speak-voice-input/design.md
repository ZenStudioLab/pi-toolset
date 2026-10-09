# Design

## Context

`extensions/speak/` (2,282 lines) speaks answers through one ElevenLabs client (`elevenlabs.ts`), driven by `speech-job.ts`, configured by a flat `config.ts` that is re-read on every command, and played through a configurable player started without a shell (`audio.ts`). The archived `manual-speech` spec and ADR-0002 keep speech output manual. See `proposal.md` for motivation, and `specs/` for the requirements this design implements.

Two outside sources were reviewed statically and are used as reference only. Neither is installed or run:

- **privateer-speak v0.8.0** (MIT, commit `714b712`): its recorder table, in-memory capture, and ElevenLabs Scribe request shape. Any copied code keeps its MIT notice.
- **`extensions/pi-voicekit`**: its Deepgram request shapes and failure classes.

The host extension API already offers everything push-to-talk needs: `registerShortcut`, `ctx.ui.getEditorText`/`setEditorText`, `ctx.ui.onTerminalInput` (which can consume a key), and `setStatus`. The amendment's send key also uses `pi.sendUserMessage(content, { deliverAs: "steer" | "followUp" })` and `ctx.isIdle()`.

## Goals / Non-Goals

**Goals:**

- Push-to-talk input whose only effects are text appended to the composer and, with the send key, that composer text sent as one plain user message.
- Deepgram as a second provider in both directions, with fixed origins and keys read from the environment.
- One config file as the only permanent setting, plus session-only overrides.

**Non-Goals:**

- Detecting speech, streaming partial transcripts, or hold-to-talk with key-release detection.
- A provider registry, plugin interface, or any third provider.
- Writing to the config file, or storing keys anywhere.
- Windows recording support (the recorder table is Linux/macOS).

## Decisions

### D1. Press to start, press again to stop; no silence detection

The same key (or `/talk`) starts and stops recording. Escape discards. A time cap backs this up: at the cap the recorder stops and the audio is held, unsent, until the next press sends it or Escape discards it. A forgotten recording therefore never uploads by itself, and a long dictation that hits the cap is not lost. Held audio is dropped on session replacement and shutdown.

- **Alternative: privateer's pitch-based silence detector** (`audio.ts`, 361 lines with tuned thresholds). It removes one keypress but adds tuning, can cut a user off mid-thought, and is the largest piece of logic in privateer. Push-to-talk already implies an explicit stop.
- **Alternative: voicekit's hold-Space with release detection.** Key-release events depend on the terminal (only Kitty-protocol terminals send them), so behavior would vary by terminal.

### D2. Record, then upload once; no streaming

Audio collects in memory and goes up in one HTTPS request after the stop. Both providers accept that shape, it reuses the bounded `fetch` pattern speak already has, and nothing leaves the machine until the user stops.

- **Alternative: Deepgram's WebSocket streaming.** It gives live partial text, but only for Deepgram, and needs a socket client plus cancellation on several more paths. Most of voicekit's 12k lines are this kind of machinery.

### D3. Recorder

The extension looks up the first available tool in order and runs it with fixed arguments, no shell, writing raw 16 kHz mono signed 16-bit PCM to stdout:

| Tool | Arguments |
| --- | --- |
| `rec` | `-q -t raw -r 16000 -c 1 -e signed -b 16 -` |
| `arecord` | `-q -f S16_LE -r 16000 -c 1 -t raw -` |
| `ffmpeg` | `-hide_banner -loglevel error -f pulse -i default -ar 16000 -ac 1 -f s16le -` |

These arguments come from privateer's `record.ts`. The lookup reuses `resolveExecutable` from `audio.ts`. One child-environment helper, replacing today's `playerEnvironment` (which removes only `ELEVENLABS_API_KEY`), removes both `ELEVENLABS_API_KEY` and `DEEPGRAM_API_KEY` and is used for both the player and the recorder. Provider keys therefore never reach either child, while audio variables (for example `PULSE_SERVER`) stay. Stop sends SIGINT, then SIGKILL after a short grace period, matching the player.

The audio buffer is capped at `maxSeconds × 32,000` bytes. A WAV header (44 bytes) is built in memory before upload. A coarse input level, the RMS (average loudness) of the latest chunk shown as an 8-step bar, gives the user a way to see that the microphone works.

There is no configurable recorder command. The table covers the user's machine, and a configurable command would need validation for a case nobody needs yet.

### D4. Transcript delivery

The transcript is delivered with `getEditorText` + `setEditorText` (existing text, plus a space when needed, plus the transcript).

- **Not `pasteToEditor`:** it collapses large pastes into a placeholder.
- **Not a plain replace, as privateer does:** that would erase a half-written prompt.

The transcript is tied to the recording that produced it and to the session. If the recording was cancelled or the session replaced while the request was in flight, the transcript is dropped.

The send mode (D11) builds on this: it appends first, then sends the resulting composer text.

### D5. Keys while recording

`onTerminalInput` is subscribed while a recording is starting (waiting for this extension's player to exit before the recorder spawns), in progress, or held at the time cap, and only consumes Escape. Escape, or a second press of either shortcut, while starting cancels the attempt: nothing is recorded or sent. Every other key passes through, so the user can keep editing. Reaching the cap is not a terminal transition: the subscription stays so Escape can still discard the held audio. It is released when the controller enters transcription or returns to idle: user stop-and-send, sending a held recording, discard, error, session replacement, and shutdown. Enter is not intercepted, so recording never triggers a send; only the send key or `/talk send` does (D11).

The recorder distinguishes a stop the controller requested (user stop, discard, or the time cap) from an exit on its own. Only an exit on its own, or no audio, is a failure. A capped recording keeps its audio and moves to the held state.

### D6. Config shape and migration

Only the first two lines below are new top-level keys:

```json
{
  "provider": "elevenlabs",
  "input": { "provider": "deepgram", "language": "vi", "maxSeconds": 120, "shortcut": "alt+t", "transcribeShortcut": "alt+shift+t", "sendWhenBusy": "interrupt" },
  "providers": {
    "elevenlabs": { "voiceId": "…", "modelId": "eleven_flash_v2_5", "outputFormat": "mp3_44100_128", "voiceRevision": 1, "sttModel": "scribe_v2" },
    "deepgram": { "voice": "aura-2-thalia-en", "sttModel": "nova-3" }
  },
  "locale": "vi",
  "translation": { "provider": "…", "model": "…", "thinking": "medium" },
  "hardLimitChars": 10000,
  "requestTimeoutMs": 45000,
  "player": { "command": "ffplay", "args": ["…", "{file}"] },
  "cache": { "maxBytes": 104857600, "ttlDays": 7 }
}
```

Shared settings (`locale`, `translation`, limits, `player`, `cache`) stay at the top level, so the locale requirement is unchanged. The translation requirements change only where they named ElevenLabs as the destination: they now refer to the job's speech provider. The old flat ElevenLabs keys are rejected with a message naming the new location. There is no loader for the old format. The only existing file is the user's own local config, which is migrated by hand. `voiceRevision` stays ElevenLabs-only, because it exists to invalidate cached clips after re-cloning a voice. A Deepgram block is needed only when Deepgram is used.

### D7. Session overrides

The override is two fields in the extension factory's closure, `speechProvider` and `inputProvider`, each `undefined` or a provider name. The config is re-read on every command and the override is applied on top. A reload rebuilds the factory, which clears the overrides. This meets "until restart or reload" with no persistence code.

Each job fixes its provider settings when it starts. A speech job captures its configuration per invocation, as it already does. A recording fixes the input provider, transcription model, and language at the moment it starts, so an override or config edit mid-recording affects only the next recording, and audio goes only to the provider that was effective when recording began.

### D8. Provider clients

- **Speech, Deepgram:** `deepgram.ts` holds Deepgram speech (`/v1/speak`) and transcription (`/v1/listen`).
- **Transcription, ElevenLabs:** Scribe (`/v1/speech-to-text`) goes into `elevenlabs.ts` next to synthesis.
- **Shared request helper:** the redirect rejection, deadline, response cap, and error-body sanitizing currently inside `elevenlabs.ts` move into one bounded-request helper. That helper then has four real callers: ElevenLabs speech and transcription, and Deepgram speech and transcription. Quota keeps its own smaller cap and is not changed.
- **Error classes:** Deepgram failures map to the same sanitized classes speak already shows for ElevenLabs (authentication, permission, voice or model, rate limit, timeout, server), redacting the key.

### D9. Aura language and limit

A Deepgram voice's language is the segment after its last hyphen (`aura-2-thalia-en` gives `en`). For localized `/speak`, this check runs before translation, so a mismatch costs nothing. `/speak original` and `/speak text` are not checked, because the extension doesn't know the language of that text.

The Deepgram ceiling of 2,000 characters is confirmed in the documentation (see Verified Provider Facts).

### D10. Shortcut

`input.shortcut` (the send key, default `alt+t`) and `input.transcribeShortcut` (the transcribe-only key, default `alt+shift+t`) are read once when the extension loads (a local file read, no network). If the config can't be read at load, both defaults are registered and the error is reported on first use. The two values must differ; equal values are a configuration error. The user confirmed `alt+t` is free in Pi (see Verified Provider Facts); `alt+shift+t` has no built-in Pi binding, and whether the terminal delivers it is a live check.

### D11. Send mode, decided at the stop

Each stop action carries a mode. The send key and `/talk send` mean *send*; the transcribe-only key and `/talk` mean *transcribe only*. A recording can be started by any of them. The action that stops it, or that sends a recording held at the time cap, decides the mode, so the user can change their mind while speaking. A press that only starts a recording carries no decision.

In send mode the transcript is appended exactly as in D4. Then the whole composer text is passed to `pi.sendUserMessage` as plain text with prompt-template expansion off, so a slash command in the draft or the transcript is sent as words rather than run. `pi.sendUserMessage` returns at once and reports a later refusal only as an extension error (Pi 1.1.0 `agent-session.js:2712`), so the extension checks what it can before calling it. With no model selected (`ctx.model` undefined), or while Pi is compacting the conversation (tracked with the `session_before_compact`, `session_compact` and `session_compact_failed` events), it does not send: the composer keeps the draft plus transcript, and a message says why (during compaction, that pressing Enter queues the message). The composer is cleared only after the call returns; if the call itself throws, the composer keeps the text and the error is shown. A refusal Pi reports only after accepting the call (for example, missing credentials) is shown by Pi as an error, after the composer was cleared. An empty transcript sends nothing and leaves the composer unchanged, as in transcribe-only mode. A transcript dropped by D4 is never sent.

When `ctx.isIdle()` is false, `input.sendWhenBusy` picks the delivery: `"interrupt"` (default) uses `deliverAs: "steer"`, `"wait"` uses `deliverAs: "followUp"`. It is read when the send happens, like every other command reading the config.

- **Alternative: decide at the start.** It locks the choice before the user has spoken.
- **Alternative: send only the transcript and keep the draft.** The user asked for Enter-equivalent behaviour, which sends the whole composer.

### D12. Recording length

`input.maxSeconds` defaults to 120 and stays capped at 300. The cap is ours, not the providers': Deepgram accepts up to 2 GB per pre-recorded request and ElevenLabs up to 3 GB or 10 hours (Verified Provider Facts). At 32,000 bytes per second, 300 seconds is about 9.6 MB in memory and in the upload. The request deadline (`requestTimeoutMs`, default 45 s) also bounds transcription; a long recording on a slow link may need a larger value.

### D13. Session and one-command speech locale

A third closure field, `speechLocale`, joins the D7 overrides with the same lifetime: it survives session switching, forking, and navigation, and ends on restart, reload, or `/speak locale reset`. `/speak locale <tag>` validates and canonicalizes the tag with the existing locale rules before storing it; a malformed tag changes nothing. `/speak in <tag>` applies a validated tag to that one invocation only. The effective locale for a job is, in order, the one-command tag, the session override, then the config `locale`. It is fixed at job start like the provider, so it feeds the Aura language check, the translation request, the translation cache key, and the audio cache key unchanged. `/speak original` and `/speak text` still never translate, and `/speak in <tag> original` is not a form.

### D14. Combined help

`/speak help` and `/talk help`, and their short forms `/speak ?` and `/talk ?`, print the same text: every `/speak` and `/talk` form, the two shortcuts registered at load with their modes, what Escape does while starting, recording, and held, and the effective speech locale (config value, or the session override when set). Help reads the config file on demand (a local read, no network) for the locale only; the shortcuts it names, like those in the recording status lines, are the ones registered at load, so an edited but not yet reloaded shortcut is never shown. If the file can't be read, help still names the registered shortcuts and says the configuration has an error. Unknown arguments still print this help. Help works in every run mode and makes no request.

## Verified Provider Facts

Checked for task 1.2 on 2026-10-08. None of the results changed a spec value.

| Fact | Result | Source |
| --- | --- | --- |
| Deepgram Aura per-request text limit | 2,000 characters for Aura-2 and Aura-1; longer input returns HTTP 413 "Input Text Exceeded Character Limit" | https://developers.deepgram.com/docs/text-to-speech.md ("Input Text Limit"), https://developers.deepgram.com/docs/errors.md |
| `detect_language` with Nova-3 on recorded audio | Supported for pre-recorded audio. With `model=nova-3`, Deepgram uses Nova-3 when it supports the detected language and otherwise falls back to the next model (Nova-2, then older) | https://developers.deepgram.com/docs/language-detection ("Model Selection") |
| Vietnamese with Nova-3 | `vi` is listed for `nova-3` | https://developers.deepgram.com/docs/models-languages-overview |
| ElevenLabs Scribe model id | `scribe_v2` is the model in ElevenLabs' own request example | https://elevenlabs.io/docs/api-reference/speech-to-text/convert |
| `alt+t` free in Pi | Confirmed by the user | Review log `docs/plans/reviews/add-speak-voice-input-review.md` |
| Deepgram pre-recorded limits (checked 2026-10-09) | Maximum file size 2 GB; requests over 10 minutes of processing (Nova) return HTTP 504 | https://developers.deepgram.com/docs/pre-recorded-audio ("Limits") |
| ElevenLabs transcription limits (checked 2026-10-09) | Maximum file size 3 GB; maximum duration 10 hours (standard mode) | https://elevenlabs.io/docs/capabilities/speech-to-text ("Key facts") |

## Risks / Trade-offs

- **Wrong or muted input device.** A recording can capture silence that is still uploaded and billed. → The level bar shows a flat line before the user stops, and Escape discards for free.
- **Audio can't be recalled once sent.** → Nothing is sent without an explicit send (stopping a recording, or sending a held one), and a discard is always free.
- **A misheard send reaches the agent unreviewed** (ADR-0005), and with `"interrupt"` can redirect a running turn. → The transcribe-only key, `/talk`, and `"wait"` remain; help and the README say which key sends; slash commands in a sent message are never run.
- **Provider facts can change after verification** (the speech character limit, language detection, model ids). → They were checked against current documentation on 2026-10-08 (Verified Provider Facts). Provider errors are surfaced sanitized rather than assumed away, and task 4.3's live check exercises them.
- **Key conflicts:** `alt+t` may be taken by the terminal or by Pi, and Escape is shared with the editor. → The shortcut is configurable and checked in 1.2. Escape is consumed only while a recording is starting, in progress, or held.
- **`PULSE_SERVER` can point at a remote audio server.** → It is kept, because local audio needs it. The README says audio routing is the operator's setting.
- **Breaking config change.** → It affects only the user's own local file. The loader names the new location for every old key, and task 4.2 migrates the file with the user's approval.
- **Cost:** Deepgram and ElevenLabs bill per audio second. → The time cap (120 s by default, at most 300) bounds a recording's length, and a recording held at the cap is never sent without a press.

## Migration Plan

1. After code waves 1–3 land, the orchestrator shows the user the old and new versions of `~/.config/pi-speak/config.json` and rewrites it only with their approval.
2. The user runs `/reload`.
3. Rollback: revert the commits and restore the old config shape. There is no other persisted state, because the audio cache key already includes the provider.
