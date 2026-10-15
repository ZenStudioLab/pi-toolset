# ADR-0004: Push-to-Talk Voice Input and a Choice of Two Direct Providers

**Status:** Accepted; its delivery rule (the extension never submits a prompt or interrupts the agent) is superseded by [ADR-0005](0005-voice-send-and-session-locale.md); its upload-after-stop rule and voice-trigger exclusion are superseded by [ADR-0006](0006-spoken-stop-phrase.md) when the stop phrase is turned on; its exclusion of an open microphone and of automatic speech, and its provider choice, are superseded by [ADR-0010](0010-live-voice-conversation.md) while live mode is on.
**Owner:** Orchestrator.
**Change:** [add-speak-voice-input](../../openspec/changes/add-speak-voice-input/design.md).
**Supersedes:** [ADR-0002](0002-manual-speech-egress-boundary.md) only in its restriction to ElevenLabs as the single speech destination. ADR-0002's manual-only rule for speech output, and every other decision in ADR-0002 and [ADR-0003](0003-localized-speech-translation.md), remain in force.

## Context

The speak extension sends text out only on an explicit `/speak` command, to ElevenLabs alone (ADR-0002), plus the translation model added by ADR-0003. The user now wants to dictate prompts by voice, and wants Deepgram as a second provider in both directions, called directly with their own keys. Voice input adds a new kind of data leaving the machine: microphone audio. It also adds a new risk: a misheard phrase that acts on the user's behalf.

The trust boundary is unchanged: one user's own machine and the services that user chose. Safeguards are sized to that boundary.

## Decision

Add push-to-talk input to `extensions/speak/`:

- **Recording:** one key (`alt+t` by default) or `/talk` starts and stops recording. Escape discards.
- **Upload:** microphone audio leaves the machine only after an explicit user action sends it, either stopping a recording or sending one held at the time cap. When a recording reaches the cap, the recorder stops and the audio waits, unsent, until the user sends or discards it. A discarded recording, or one dropped on session replacement or shutdown, is never sent.
- **Delivery:** the transcript is appended to the composer. The extension never submits a prompt, runs a command, or interrupts the agent. There are no spoken commands, no open microphone, and no automatic speech of answers.
- **Storage:** audio is held in memory only. It is never written to disk, logged, or persisted, and is released after the request.

Allow exactly two providers, each at a fixed production origin with no redirects and no fallback between them:

- **Deepgram** (`api.deepgram.com`): Nova-3 transcription and Aura speech.
- **ElevenLabs** (`api.elevenlabs.io`): Scribe transcription and the existing cloned-voice speech.

Keys come only from `DEEPGRAM_API_KEY` and `ELEVENLABS_API_KEY`. They are never stored, and never passed to the player or recorder processes. No intermediary service, generic endpoint, or plugin registry is supported.

The config file is the only permanent provider choice. `/speak provider` and `/talk provider` override it only until Pi restarts or reloads, and the extension never writes the config file. A recording or speech job keeps the provider that was effective when it started.

## Consequences

Users who dictate accept that each recording they send goes to the selected provider. Neither provider's standard tier is a zero-retention guarantee. Sent audio cannot be recalled, but nothing is sent without a user action, and a discard is always free. Recording needs `rec`, `arecord`, or `ffmpeg` on the machine.

Deepgram voices speak only their own language. Localized speech with a Deepgram voice whose language differs from the target locale (for example Vietnamese) is refused before translation. Deepgram also accepts at most 2,000 characters per request, and text is still never split.

The extension still never writes the config file, so changing a provider permanently means editing it by hand. The config moves to per-provider blocks, and the old flat layout is rejected rather than read. The only existing config is the user's own local file, which is migrated once with their approval.

Mocked tests cannot prove real microphones, accounts, or recognition quality. A user-run live check qualifies those.

## Alternatives

- **Automatic speech of answers, open-mic dictation, "send it" and "interrupt" triggers, and spoken slash commands.** All of these let a recognition error act. The user ruled them out.
- **Uploading automatically at the time cap.** A forgotten recording would leave the machine with no user action, so the audio is held instead.
- **Streaming transcription over WebSocket.** It shows partial text while you speak, but only Deepgram offers it, and it multiplies the paths that need cancelling.
- **A generic or OpenAI-compatible provider layer, or routing through an intermediary account.** Requests could then go somewhere the user didn't choose, and the extra abstraction has no second real consumer.
- **Writing provider changes back to the config file.** Persisting keys or settings brings back the file-permission and formatting risks that environment-only keys avoid.
