# Proposal

## Why

The speak extension handles one voice action at a time: push-to-talk in, `/speak` out. The user wants to talk with Pi back and forth hands-free, with Pi's real context, tools, and repository behind every answer, rather than switching to a separate voice agent that lacks that context. `transcendr/pi-realtime` showed a workable shape: the voice side only listens and speaks, and Pi does all the thinking. That project is OpenAI-only, records from the terminal only on macOS, and has no license, so this change adopts the idea, not the code, and builds it on the ElevenLabs live transcription and speech this extension already uses.

## What Changes

- **Live mode, switched on and off by the user.** `/talk live` starts it and `/talk live` again ends it. While it is on, the microphone streams to ElevenLabs live transcription, and each stretch of speech that ends with a pause is sent to Pi as one user message. The composer and any typed draft are left alone. When Pi is busy, `input.sendWhenBusy` decides as it does today (`interrupt` steers the running turn, `wait` queues it). Segments with no letter or digit are dropped; short answers such as "yes" or "ừ" are sent.
- **Pi decides what to say aloud.** A new `speak_aloud` tool is active only while live mode is on. Its guidance asks Pi to speak a short acknowledgement when it starts a request, brief progress during long work, and a short summary at the end, in the language of the user's latest spoken message. The text is spoken as written in the user's ElevenLabs voice, with no translation step. Updates play in order, and the written answer remains the full record.
- **The microphone is muted while Pi speaks (default).** During playback the extension sends silence instead of microphone audio, so Pi never hears itself. The send key or `/speak stop` cuts Pi off and resumes listening.
- **Optional voice barge-in.** `input.liveListenWhileSpeaking` (default `false`) keeps the microphone live during playback, so speaking cuts Pi off. It is meant for headphones or system echo cancellation.
- **Idle limit.** `input.liveIdleMinutes` (default `5`) ends live mode after that long with no speech, no spoken update, and Pi idle, so a forgotten session does not keep streaming.
- **ElevenLabs in both directions.** Live mode always uses ElevenLabs for listening and speaking, whatever the input and speech providers are set to. It is the only provider here with both live transcription and voices that follow the user between languages.
- **Ending live mode by voice (amendment of 2026-10-15).** Saying a configured phrase as a whole turn, by default "Dừng cuộc hội thoại" or "Stop the conversation" (`input.liveStopPhrases`), ends live mode exactly as `/talk live` does. The extension handles the phrase itself and never sends it to Pi. Case, punctuation, and diacritics are ignored. A sentence that contains the phrase among other words is sent as usual.
- **Thinking pauses and live languages (amendment of 2026-10-15).** A turn ends after `input.livePauseSeconds` of silence, 2 s by default and at most 3 s, so a thinking pause no longer sends half a sentence. `input.liveLanguages`, for example `["vi", "en"]`, limits live recognition to those languages, plus `input.language` when set. Push-to-talk is unchanged.
- **A live key, words as you speak, and spoken replies (amendment of 2026-10-15).**
  - `input.liveShortcut` (default `alt+l`) starts and ends live mode exactly as `/talk live` does.
  - The words heard so far are shown above the editor while the user speaks, and they are never stored.
  - When Pi finishes a request in live mode, its answer is cleaned as for `/speak original` and read aloud in parts, up to the speech length limit.
- **Clear boundaries while live.** Other push-to-talk controls, Space holds, and the speech-producing `/speak` forms are refused with a message. Session replacement, reload, shutdown, a connection or recorder failure, and the idle limit all end live mode cleanly, without retry or reconnect.
- **A new ADR (ADR-0010)** replaces, for live mode only, the "no automatic speech" and "no open microphone" decisions recorded in ADR-0002 and ADR-0004. Outside live mode those decisions stand unchanged.

### Non-goals

OpenAI Realtime, WebRTC, or a browser helper; Deepgram live streaming; hosted voice agents that run their own model; automatic setup of PipeWire echo cancellation; reconnecting after a dropped connection; speaking answers automatically outside live mode; running slash commands or skills from live speech; wake words; splitting long `speak_aloud` updates into chunks.

## Capabilities

### New Capabilities

- `voice-conversation`: live mode: starting and ending it, including by a spoken stop phrase or a live key, turn delivery, the words heard so far, spoken replies, the `speak_aloud` tool and spoken updates, muting and cutting Pi off, optional barge-in, the idle limit, its settings, status and help, and its privacy rules.

### Modified Capabilities

- `manual-speech`: "Speech occurs only on explicit request" admits live-mode spoken updates the model requests, and the reading of answers that finish, while the user has live mode on. "Single job and responsive stop" lets live updates wait in order and makes `/speak stop` also drop waiting updates.
- `voice-input`: "Recording starts only on an explicit action" adds `/talk live`. "Talk command contract" adds the `live` form. "Push-to-talk recording lifecycle" defers to live mode's rules while it is on. These requirements are introduced by the unarchived change `add-speak-voice-input`, so this change must be archived after that one.

## Impact

- **Code (`extensions/speak/`):** a new live-mode module; `realtime.ts` (an optional partial-transcript handler); `talk.ts` and `index.ts` (the `live` form, routing keys while live, lifecycle); `speech-job.ts` (a small ElevenLabs-pinned entry point for live updates); `input-settings.ts` (two settings); `help.ts`; `README.md`; tests under `test/`.
- **Docs:** ADR-0010 in `docs/adr/`.
- **External services and cost:** ElevenLabs live transcription stays open for as long as live mode is on, and every spoken update and every answer read aloud is an ElevenLabs synthesis request.
- **Dependencies:** none new.
- **Model prompt:** the system prompt changes whenever live mode is switched on or off, because the tool and its guidance are added and removed.
