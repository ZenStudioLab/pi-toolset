# Proposal

## Why

The speak extension only goes one way: `/speak` reads an answer aloud in the user's ElevenLabs voice. The user also wants to dictate prompts into Pi, and wants Deepgram as a second provider for both directions, called directly with their own keys. privateer-speak 0.8.0 (MIT) shows how to do this. Its riskier parts are left out: answers spoken automatically, a microphone that sends on its own, spoken commands, and keys stored in a config file.

## What Changes

- **Push-to-talk voice input.** `alt+t` (configurable) or `/talk` starts recording, the same key stops it, and Escape discards it without sending anything. The recording is transcribed in one request and the text is appended to the composer. The extension never submits it; the user presses Enter.
- **Two transcription providers.** Deepgram Nova-3 (`POST /v1/listen`) and ElevenLabs Scribe (`POST /v1/speech-to-text`), each called at a fixed address with a key read from `DEEPGRAM_API_KEY` or `ELEVENLABS_API_KEY`.
- **Deepgram Aura as a second speech provider.** `/speak` can use a Deepgram Aura voice instead of the ElevenLabs voice. An Aura voice speaks only its own language, so localized speech whose target language has no Aura voice (for example Vietnamese) is refused before any request.
- **Choosing a provider.** The config file sets the default speech provider and input provider. `/speak provider <name>` and `/talk provider <name>` switch them until Pi restarts or reloads, and `reset` returns to the file's choice. The extension never writes the config file.
- **A length limit per provider.** The 10,000-character limit stays for ElevenLabs. Deepgram gets its own lower documented limit. Text is still never split.
- **BREAKING (local config only):** the ElevenLabs settings (`voiceId`, `modelId`, `outputFormat`, `voiceRevision`) move under `providers.elevenlabs`, and Deepgram settings go under `providers.deepgram`. The old flat format is not read. The single existing config file is migrated by hand.

Out of scope: speaking answers automatically, dictation modes that send by themselves, "send it" or "interrupt" voice triggers, spoken slash commands, silence-based auto-stop, real-time streaming transcription, any provider other than Deepgram and ElevenLabs, and keys stored in files.

## Capabilities

### New Capabilities

- `voice-input`: push-to-talk capture, transcription by Deepgram or ElevenLabs, appending the transcript to the composer, input provider selection, and the privacy and secret rules for microphone audio.

### Modified Capabilities

- `manual-speech`: the speech provider can be ElevenLabs or Deepgram, chosen in config or for the session; a Deepgram synthesis request is added; the ElevenLabs request applies only when ElevenLabs is selected; the length limit, preflight checks, status, progress line, audio cache key, translation routing and failure messages, and secret handling cover both providers.

## Impact

- **Code:** `extensions/speak/` gains a recorder, a push-to-talk controller, and a Deepgram client. `config.ts`, `speech-job.ts`, `index.ts`, and the README change. New and changed tests go in `test/speak/`.
- **Network:** a new destination, `https://api.deepgram.com`, and the existing ElevenLabs origin also receives microphone audio for transcription.
- **Local tools:** recording needs `rec` (SoX), `arecord`, or `ffmpeg` on the machine.
- **Decision record:** a new ADR-0004 covers microphone audio leaving the machine and the choice between providers. ADR-0002's manual-only rule for speech output still holds.
- **Dependencies:** no new npm packages.
