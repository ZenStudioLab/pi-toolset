# Spec Delta

## MODIFIED Requirements

### Requirement: Recording starts only on an explicit action

The extension SHALL open the microphone only when the user presses a push-to-talk shortcut, runs `/talk`, `/talk send`, `/talk command` or `/talk skill`, or, with `input.holdSpace` on, holds Space as the "Hold Space to talk" requirement defines, or runs `/talk live`, which keeps the microphone open until live mode ends as the `voice-conversation` capability defines. Loading, reloading, session start, ordinary prompts, tool execution, agent completion, and every other lifecycle event SHALL NOT start a recorder or make a transcription request. A missing configuration, key, or recording tool SHALL NOT block Pi from starting; it SHALL be reported only when the user tries to record.

#### Scenario: Silent startup and agent activity

- **WHEN** Pi starts or reloads with the extension loaded, and the user submits prompts that complete with answers and tool calls
- **THEN** no recorder process is started and no transcription request is made

#### Scenario: Missing key reported on use

- **WHEN** the selected input provider's key is not set and the user presses the push-to-talk shortcut
- **THEN** the extension names the missing environment variable, starts no recorder, and makes no request

### Requirement: Talk command contract

The extension SHALL register a `/talk` command with these forms: no argument (start recording; or stop and transcribe only; or transcribe only a recording held at the time cap), `send` (start recording; or stop, transcribe, and send; or transcribe and send a held recording), `command` and `skill` (start recording; or stop, or release a held recording, in command or skill mode, as in "Voice command and skill keys"), `live` (start live mode, or end it when it is on, as the `voice-conversation` capability defines), `help` or `?` (show the combined help), `provider` (report the effective input provider and whether it is a session override), `provider <name>` (select `deepgram` or `elevenlabs` for this session), and `provider reset` (return to the configured provider). An unknown argument or provider name SHALL display the combined help, change nothing, and make no request.

The extension SHALL register push-to-talk shortcuts when it loads: the send shortcuts from `input.shortcut` (default `alt+t`), each equivalent to `/talk send` except while live mode is on or starting, when they behave as the `voice-conversation` requirements "Cutting Pi off" and "Other voice controls during live mode" state, the transcribe-only shortcuts from `input.transcribeShortcut` (default `alt+shift+t`), each equivalent to `/talk`, the command shortcuts from `input.commandShortcut` (default `alt+m`), each equivalent to `/talk command`, and the skill shortcuts from `input.skillShortcut` (default `alt+i`), each equivalent to `/talk skill`. Each setting SHALL accept one key or a list of 1 to 4 keys. Every key across all four settings SHALL be different, ignoring case; a repeated key SHALL be a configuration error. A changed shortcut takes effect after a reload. If the configuration cannot be read at load, or has such an error, only the four defaults SHALL be registered and the error reported on first use.

#### Scenario: Unknown provider name

- **WHEN** the user runs `/talk provider whisper`
- **THEN** usage is shown, the effective input provider is unchanged, and no request is made

#### Scenario: Command and shortcut are equivalent

- **WHEN** the user starts recording with `/talk` and stops it with the transcribe-only shortcut
- **THEN** the recording is transcribed exactly as if both actions had used the same control

#### Scenario: Equal shortcuts

- **WHEN** `input.shortcut` and `input.transcribeShortcut` are the same key, or one key appears twice across them, and the user presses a shortcut
- **THEN** the configuration error is reported and no recording starts

#### Scenario: Extra keys per mode

- **WHEN** `input.shortcut` is `["alt+t", "alt+y"]` and `input.transcribeShortcut` is `["alt+shift+t", "alt+shift+y"]`, and the user starts a recording with `alt+shift+y` and stops it with `alt+y`
- **THEN** all four keys are registered, the transcript is sent, and help lists both keys of each mode

#### Scenario: Live form toggles live mode

- **WHEN** the user runs `/talk live` twice
- **THEN** the first run starts live mode and the second ends it

### Requirement: Push-to-talk recording lifecycle

The first press of any push-to-talk shortcut, or `/talk`, `/talk send`, `/talk command` or `/talk skill`, SHALL start recording; a recognized Space hold also starts one. The next press or command SHALL stop recording and transcribe it, in the mode of that stopping control: send for the send shortcut and `/talk send`, transcribe only for the transcribe-only shortcut and `/talk`, and command or skill for those keys and commands. Letting go of a Space hold SHALL stop the recording it started in send mode. Escape during recording SHALL stop the recorder and discard the audio without sending anything, and the Escape key SHALL NOT reach the editor. When the spoken stop phrase is off, audio SHALL leave the machine only after an explicit user action that sends it: stopping a recording, sending a recording held at the time cap, or letting go of a Space hold. Typing another key during a Space hold SHALL discard the hold's recording without sending it. When it is on, audio streams while recording, as the "Spoken stop phrase" requirement states. Escape SHALL be intercepted, and SHALL NOT reach the editor, whenever a recording is starting (waiting for this extension's playback to stop), in progress, or held. Escape or a second press while a recording is starting SHALL cancel it: no recorder keeps running, nothing is recorded, and nothing is sent. When a recording reaches `input.maxSeconds` (default 120, at most 300), the recorder SHALL stop and the captured audio SHALL be held unsent: the next press or command SHALL transcribe it in that control's mode, and Escape, session replacement, or shutdown SHALL discard it without sending anything. A recording shorter than 0.5 seconds SHALL be discarded with a message and not sent. Only one recording or transcription SHALL be active at a time; a press while a transcription is in flight SHALL be refused with a message. Starting a recording SHALL first stop this extension's own speech job and playback, so the microphone does not capture them. While live mode is on or starting, these controls and Space holds SHALL NOT start or stop a recording; they SHALL behave as the `voice-conversation` requirements "Cutting Pi off" and "Other voice controls during live mode" state.

#### Scenario: Record and transcribe

- **WHEN** the user presses the shortcut, speaks, and presses it again
- **THEN** the recorder stops and exactly one transcription request is made with that audio

#### Scenario: Escape discards without sending

- **WHEN** the user presses Escape while recording
- **THEN** the recorder stops, the audio is dropped, no request is made, and the editor does not receive the Escape key

#### Scenario: The stopping control decides the mode

- **WHEN** the user starts a recording with the send shortcut and stops it with the transcribe-only shortcut
- **THEN** the transcript is appended to the composer and nothing is sent

#### Scenario: Cancel while starting

- **WHEN** `/speak` audio is still stopping after the user pressed a shortcut, and the user presses Escape or a shortcut again
- **THEN** the attempt is cancelled, no audio is recorded or sent, and the Escape key does not reach the editor

#### Scenario: Time cap stops and holds

- **WHEN** a recording reaches the configured maximum length
- **THEN** recording stops, no request is made, and the audio is transcribed once only when the user next presses a shortcut or runs `/talk` or `/talk send`, in that control's mode

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

#### Scenario: Shortcut during live mode

- **WHEN** live mode is on and the user presses the send shortcut while nothing is being spoken
- **THEN** no recording starts and the extension shows that nothing is being spoken
