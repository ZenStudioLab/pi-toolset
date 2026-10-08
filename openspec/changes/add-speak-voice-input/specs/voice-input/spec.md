# Spec Delta

## Purpose

Lets a Pi user dictate a prompt by push-to-talk, have it transcribed by Deepgram or ElevenLabs, and find the text in the composer to review and send, without the extension ever sending a prompt itself.

## ADDED Requirements

### Requirement: Recording starts only on an explicit action

The extension SHALL open the microphone only when the user presses the push-to-talk shortcut or runs `/talk`. Loading, reloading, session start, ordinary prompts, tool execution, agent completion, and every other lifecycle event SHALL NOT start a recorder or make a transcription request. A missing configuration, key, or recording tool SHALL NOT block Pi from starting; it SHALL be reported only when the user tries to record.

#### Scenario: Silent startup and agent activity

- **WHEN** Pi starts or reloads with the extension loaded, and the user submits prompts that complete with answers and tool calls
- **THEN** no recorder process is started and no transcription request is made

#### Scenario: Missing key reported on use

- **WHEN** the selected input provider's key is not set and the user presses the push-to-talk shortcut
- **THEN** the extension names the missing environment variable, starts no recorder, and makes no request

### Requirement: Talk command contract

The extension SHALL register a `/talk` command with these forms: no argument (start recording; stop and transcribe if recording; or transcribe a recording held at the time cap), `provider` (report the effective input provider and whether it is a session override), `provider <name>` (select `deepgram` or `elevenlabs` for this session), and `provider reset` (return to the configured provider). An unknown argument or provider name SHALL display usage, change nothing, and make no request. The push-to-talk shortcut SHALL be read from `input.shortcut` when the extension loads, defaulting to `alt+t`; a changed shortcut takes effect after a reload.

#### Scenario: Unknown provider name

- **WHEN** the user runs `/talk provider whisper`
- **THEN** usage is shown, the effective input provider is unchanged, and no request is made

#### Scenario: Command and shortcut are equivalent

- **WHEN** the user starts recording with `/talk` and stops it with the push-to-talk shortcut
- **THEN** the recording is transcribed exactly as if both actions had used the same control

### Requirement: Supported run mode for voice input

The extension SHALL record only in an interactive terminal session. In any other Pi run mode, `/talk` and the shortcut SHALL report that voice input is unsupported without starting a recorder or making a request.

#### Scenario: Non-terminal mode

- **WHEN** `/talk` is invoked in a Pi run mode that is not the interactive terminal
- **THEN** the extension reports that voice input is unsupported and records nothing

### Requirement: Push-to-talk recording lifecycle

The first press of the shortcut, or `/talk`, SHALL start recording. The next press or `/talk` SHALL stop recording and transcribe it. Escape during recording SHALL stop the recorder and discard the audio without sending anything, and the Escape key SHALL NOT reach the editor. Audio SHALL leave the machine only after an explicit user action that sends it: stopping a recording, or sending a recording held at the time cap. Escape SHALL be intercepted, and SHALL NOT reach the editor, whenever a recording is in progress or held. When a recording reaches `input.maxSeconds` (default 60, at most 300), the recorder SHALL stop and the captured audio SHALL be held unsent: the next press or `/talk` SHALL transcribe it, and Escape, session replacement, or shutdown SHALL discard it without sending anything. A recording shorter than 0.5 seconds SHALL be discarded with a message and not sent. Only one recording or transcription SHALL be active at a time; a press while a transcription is in flight SHALL be refused with a message. Starting a recording SHALL first stop this extension's own speech job and playback, so the microphone does not capture them.

#### Scenario: Record and transcribe

- **WHEN** the user presses the shortcut, speaks, and presses it again
- **THEN** the recorder stops and exactly one transcription request is made with that audio

#### Scenario: Escape discards without sending

- **WHEN** the user presses Escape while recording
- **THEN** the recorder stops, the audio is dropped, no request is made, and the editor does not receive the Escape key

#### Scenario: Time cap stops and holds

- **WHEN** a recording reaches the configured maximum length
- **THEN** recording stops, no request is made, and the audio is transcribed once only when the user next presses the shortcut or runs `/talk`

#### Scenario: Held recording discarded

- **WHEN** a recording stopped at the time cap is waiting and the user presses Escape, or the session is replaced
- **THEN** the audio is dropped, no request is made, and the Escape key does not reach the editor

#### Scenario: Shortcut after discarding a held recording

- **WHEN** a held recording was discarded with Escape and the user then presses the shortcut
- **THEN** a new recording starts and the discarded audio is never sent

#### Scenario: Accidental tap

- **WHEN** the user stops a recording less than 0.5 seconds after starting it
- **THEN** the audio is discarded with a message and no request is made

#### Scenario: Press during transcription

- **WHEN** the user presses the shortcut while a transcription request is in flight
- **THEN** the press is refused with a message and no new recording starts

#### Scenario: Recording stops own playback

- **WHEN** `/speak` audio is playing and the user starts a recording
- **THEN** this extension's playback stops before the recorder starts, and other audio processes are unaffected

### Requirement: Recording indicator

While recording, the extension SHALL show a status line stating that the microphone is recording, the elapsed time, a coarse input level, and the stop and discard keys. While a recording stopped at the time cap is held, it SHALL state that the limit was reached and show the transcribe and discard keys. While transcribing, it SHALL state that transcription is in progress. The indicator SHALL be cleared when the transcript is delivered, the recording is discarded, or an error is reported.

#### Scenario: Indicator follows the recording

- **WHEN** the user records, stops, and the transcript arrives
- **THEN** the status line shows recording with elapsed time and level, then transcribing, then nothing

### Requirement: Local audio capture

The extension SHALL capture 16 kHz mono 16-bit audio from the first available recording tool among `rec`, `arecord`, and `ffmpeg`, started with an argument list and no shell. Audio SHALL be held in memory only, never written to disk, and released after the request finishes or the recording is discarded. The recorder SHALL run without the provider keys in its environment. If no recording tool is found, the extension SHALL say which tools it looked for and make no request. If the recorder exits on its own before the user stops it or the time cap is reached, or produces no audio, the extension SHALL report it and make no request. A recorder the extension stops, at the user's request or at the time cap, SHALL NOT be reported as a failure. A recorder started by the extension SHALL be stopped on stop, discard, error, session replacement, and shutdown.

#### Scenario: No recording tool

- **WHEN** none of `rec`, `arecord`, or `ffmpeg` is available and the user presses the shortcut
- **THEN** the extension names the tools it looked for, starts nothing, and makes no request

#### Scenario: Recorder fails

- **WHEN** the recorder exits unexpectedly before the user stops it or the time cap is reached, or produces no audio
- **THEN** the failure is reported and no request is made

#### Scenario: Shutdown during recording

- **WHEN** Pi shuts down or the session is replaced while recording
- **THEN** the recorder is stopped, no request is made, and no audio file exists on disk

### Requirement: Transcript goes to the composer only

A non-empty transcript SHALL be appended to the composer's current text, separated by one space when the existing text is non-empty and does not end with whitespace. The extension SHALL NOT submit the composer, replace its text, or send the transcript anywhere else. An empty transcript SHALL leave the composer unchanged and show a message. A transcript that arrives after its recording was cancelled, or after the session was replaced, SHALL be dropped without changing the composer.

#### Scenario: Append to a half-written prompt

- **WHEN** the composer contains `Refactor the loader` and the transcript is `and add a test`
- **THEN** the composer contains `Refactor the loader and add a test` and nothing is submitted

#### Scenario: Empty transcript

- **WHEN** the provider returns no words
- **THEN** the composer is unchanged and the user is told nothing was recognized

#### Scenario: Late transcript after session change

- **WHEN** the session is replaced while a transcription request is in flight
- **THEN** the late transcript is discarded and the new session's composer is unchanged

### Requirement: Input provider selection

The configuration SHALL select the input provider with `input.provider`, either `deepgram` or `elevenlabs`, defaulting to `deepgram` when omitted. `/talk provider <name>` SHALL override it until Pi restarts or reloads, or until `/talk provider reset`. The extension SHALL NOT write the configuration file. The effective input provider, its transcription model, and the input language SHALL be fixed when a recording starts; a later override or configuration change SHALL apply only to the next recording, and the recording's audio SHALL be sent only to the provider fixed at its start. An optional `input.language` SHALL be a valid BCP-47 tag, canonicalized, independent of the speech `locale`; a malformed value SHALL fail before recording. When `input.language` is omitted, the provider detects the language.

#### Scenario: Session override is not persisted

- **WHEN** the configuration selects `deepgram`, the user runs `/talk provider elevenlabs`, and Pi is restarted
- **THEN** recordings before the restart use ElevenLabs, recordings after it use Deepgram, and the configuration file is unchanged

#### Scenario: Provider change during a recording

- **WHEN** a recording starts with Deepgram selected and the user runs `/talk provider elevenlabs` before stopping it
- **THEN** that recording is sent only to Deepgram, and the next recording uses ElevenLabs

#### Scenario: Malformed language

- **WHEN** `input.language` is malformed and the user presses the shortcut
- **THEN** the configuration error is reported and no recording starts

### Requirement: Fixed-destination transcription request

A recording the user sends SHALL be sent as one WAV upload to the fixed production endpoint of the provider fixed when that recording started, authenticated with the key read from the environment:

- Deepgram: `POST https://api.deepgram.com/v1/listen`, with header `Authorization: Token` and `DEEPGRAM_API_KEY`, the model from `providers.deepgram.sttModel` (default `nova-3`), `smart_format=true`, and `language` when `input.language` is set, otherwise `detect_language=true`.
- ElevenLabs: `POST https://api.elevenlabs.io/v1/speech-to-text` as multipart form data, with header `xi-api-key` and `ELEVENLABS_API_KEY`, the model from `providers.elevenlabs.sttModel` (default `scribe_v2`), `tag_audio_events=false`, and `language_code` when `input.language` is set.

Redirects SHALL be rejected. The request SHALL be bounded by the configured request deadline and a 1 MiB response cap. The extension SHALL NOT retry automatically, SHALL NOT fall back to the other provider, and SHALL show sanitized errors for authentication, permission, model, rate-limit, timeout, and server failures, without echoing keys or raw response bodies.

#### Scenario: Deepgram transcription

- **WHEN** the input provider is Deepgram, `input.language` is `vi`, and a recording completes
- **THEN** one request goes to the Deepgram listen endpoint with model `nova-3` and language `vi`, and the first alternative's transcript is delivered

#### Scenario: ElevenLabs transcription omits audio-event tags

- **WHEN** the input provider is ElevenLabs and a recording completes
- **THEN** one multipart request goes to the ElevenLabs speech-to-text endpoint with `tag_audio_events=false`, and the returned text is delivered

#### Scenario: Failure is not retried or rerouted

- **WHEN** the provider times out, redirects, or returns an error
- **THEN** a sanitized error is shown, the audio is released, and no retry or other-provider request is made

### Requirement: Voice input secret and privacy handling

The extension SHALL read `DEEPGRAM_API_KEY` and `ELEVENLABS_API_KEY` only from the environment and SHALL NOT write them to configuration, cache, logs, notifications, process arguments, or the recorder's environment. The extension SHALL NOT log or persist audio or transcripts; a transcript exists only in the composer. Documentation SHALL state that each recording the user sends goes to the selected provider, that this is not a zero-retention guarantee, and that a discarded recording, or one held at the time cap and not sent, never leaves the machine.

#### Scenario: Error output redaction

- **WHEN** a transcription failure message would include a key or an authorization header
- **THEN** the displayed message omits it
