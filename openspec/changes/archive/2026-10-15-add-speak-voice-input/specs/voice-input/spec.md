# Spec Delta

## Purpose

Lets a Pi user dictate a prompt by push-to-talk, have it transcribed by Deepgram or ElevenLabs, and either find the text in the composer to review, or send it with one key press, without the extension ever sending anything the user did not ask it to send.

## ADDED Requirements

### Requirement: Recording starts only on an explicit action

The extension SHALL open the microphone only when the user presses a push-to-talk shortcut, runs `/talk`, `/talk send`, `/talk command` or `/talk skill`, or, with `input.holdSpace` on, holds Space as the "Hold Space to talk" requirement defines. Loading, reloading, session start, ordinary prompts, tool execution, agent completion, and every other lifecycle event SHALL NOT start a recorder or make a transcription request. A missing configuration, key, or recording tool SHALL NOT block Pi from starting; it SHALL be reported only when the user tries to record.

#### Scenario: Silent startup and agent activity

- **WHEN** Pi starts or reloads with the extension loaded, and the user submits prompts that complete with answers and tool calls
- **THEN** no recorder process is started and no transcription request is made

#### Scenario: Missing key reported on use

- **WHEN** the selected input provider's key is not set and the user presses the push-to-talk shortcut
- **THEN** the extension names the missing environment variable, starts no recorder, and makes no request

### Requirement: Talk command contract

The extension SHALL register a `/talk` command with these forms: no argument (start recording; or stop and transcribe only; or transcribe only a recording held at the time cap), `send` (start recording; or stop, transcribe, and send; or transcribe and send a held recording), `command` and `skill` (start recording; or stop, or release a held recording, in command or skill mode, as in "Voice command and skill keys"), `help` or `?` (show the combined help), `provider` (report the effective input provider and whether it is a session override), `provider <name>` (select `deepgram` or `elevenlabs` for this session), and `provider reset` (return to the configured provider). An unknown argument or provider name SHALL display the combined help, change nothing, and make no request.

The extension SHALL register push-to-talk shortcuts when it loads: the send shortcuts from `input.shortcut` (default `alt+t`), each equivalent to `/talk send`, the transcribe-only shortcuts from `input.transcribeShortcut` (default `alt+shift+t`), each equivalent to `/talk`, the command shortcuts from `input.commandShortcut` (default `alt+m`), each equivalent to `/talk command`, and the skill shortcuts from `input.skillShortcut` (default `alt+i`), each equivalent to `/talk skill`. Each setting SHALL accept one key or a list of 1 to 4 keys. Every key across all four settings SHALL be different, ignoring case; a repeated key SHALL be a configuration error. A changed shortcut takes effect after a reload. If the configuration cannot be read at load, or has such an error, only the four defaults SHALL be registered and the error reported on first use.

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

### Requirement: Supported run mode for voice input

The extension SHALL record only in an interactive terminal session. In any other Pi run mode, `/talk` and every push-to-talk shortcut SHALL report that voice input is unsupported without starting a recorder or making a request.

#### Scenario: Non-terminal mode

- **WHEN** `/talk` is invoked in a Pi run mode that is not the interactive terminal
- **THEN** the extension reports that voice input is unsupported and records nothing

### Requirement: Push-to-talk recording lifecycle

The first press of any push-to-talk shortcut, or `/talk`, `/talk send`, `/talk command` or `/talk skill`, SHALL start recording; a recognized Space hold also starts one. The next press or command SHALL stop recording and transcribe it, in the mode of that stopping control: send for the send shortcut and `/talk send`, transcribe only for the transcribe-only shortcut and `/talk`, and command or skill for those keys and commands. Letting go of a Space hold SHALL stop the recording it started in send mode. Escape during recording SHALL stop the recorder and discard the audio without sending anything, and the Escape key SHALL NOT reach the editor. When the spoken stop phrase is off, audio SHALL leave the machine only after an explicit user action that sends it: stopping a recording, sending a recording held at the time cap, or letting go of a Space hold. Typing another key during a Space hold SHALL discard the hold's recording without sending it. When it is on, audio streams while recording, as the "Spoken stop phrase" requirement states. Escape SHALL be intercepted, and SHALL NOT reach the editor, whenever a recording is starting (waiting for this extension's playback to stop), in progress, or held. Escape or a second press while a recording is starting SHALL cancel it: no recorder keeps running, nothing is recorded, and nothing is sent. When a recording reaches `input.maxSeconds` (default 120, at most 300), the recorder SHALL stop and the captured audio SHALL be held unsent: the next press or command SHALL transcribe it in that control's mode, and Escape, session replacement, or shutdown SHALL discard it without sending anything. A recording shorter than 0.5 seconds SHALL be discarded with a message and not sent. Only one recording or transcription SHALL be active at a time; a press while a transcription is in flight SHALL be refused with a message. Starting a recording SHALL first stop this extension's own speech job and playback, so the microphone does not capture them.

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

### Requirement: Recording indicator

While recording, the extension SHALL show a status line stating that the microphone is recording, the elapsed time, a coarse input level, and the stop and discard keys. From the moment a recording reaches the time cap, including before the recorder has exited, and while it is held, it SHALL state that the limit was reached and show the send, transcribe-only, command, skill, and discard keys. The recording line SHALL name the stop keys of every mode and which ones send. While transcribing, it SHALL state that transcription is in progress. The indicator SHALL be cleared when the transcript is delivered or sent, the recording is discarded, or an error is reported.

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

### Requirement: Transcript delivery

In send and transcribe-only modes (command and skill delivery follow "Voice command and skill keys"), a non-empty transcript SHALL be appended to the composer's current text, separated by one space when the existing text is non-empty and does not end with whitespace. In transcribe-only mode the extension SHALL NOT submit the composer. In send mode it SHALL then send the whole composer text as one user message, as if the user had pressed Enter, and clear the composer. The sent text SHALL be plain: slash commands, prompt templates, and skill commands in it SHALL NOT be run. When the extension can tell before sending that Pi would refuse the message (no model selected, or the conversation is being compacted), it SHALL NOT send, the composer SHALL keep the draft plus transcript, and a message SHALL say why. If the send call itself fails, the composer SHALL keep the draft plus transcript and the error SHALL be shown. A refusal Pi reports only after accepting the message is shown by Pi; the composer has then already been cleared. When the agent is working, `input.sendWhenBusy` SHALL decide the delivery: `interrupt` (default) delivers the message to the running turn at once, and `wait` queues it until the turn ends. The extension SHALL NOT replace the composer's text or send the transcript anywhere else. An empty transcript SHALL leave the composer unchanged, send nothing, and show a message. A transcript that arrives after its recording was cancelled, or after the session was replaced, SHALL be dropped without changing the composer or sending anything.

#### Scenario: Append to a half-written prompt

- **WHEN** the composer contains `Refactor the loader` and the transcript is `and add a test`
- **THEN** the composer contains `Refactor the loader and add a test` and nothing is submitted

#### Scenario: Send the draft and the transcript

- **WHEN** the composer contains `Refactor the loader`, the agent is idle, and the user stops a recording of `and add a test` with the send shortcut
- **THEN** one user message `Refactor the loader and add a test` is sent and the composer is empty

#### Scenario: Send while the agent is working

- **WHEN** the agent is working and the user sends a recording with `input.sendWhenBusy` omitted, then again with it set to `wait`
- **THEN** the first message is delivered to the running turn at once, and the second is queued until the turn ends

#### Scenario: Send during compaction

- **WHEN** Pi is compacting the conversation and the user stops a recording with the send shortcut
- **THEN** nothing is sent, the composer keeps the draft plus transcript, and the message tells the user to press Enter to queue it

#### Scenario: Slash command in a sent transcript

- **WHEN** the sent composer text begins with `/compact`
- **THEN** it is sent as an ordinary user message and no command runs

#### Scenario: Empty transcript in send mode

- **WHEN** the provider returns no words for a recording stopped with the send shortcut
- **THEN** nothing is sent, the composer is unchanged, and the user is told nothing was recognized

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

### Requirement: Spoken stop phrase

The configuration SHALL accept `input.stopOnPhrase` (boolean, default `false`) and `input.stopPhrases` (1 to 10 phrases, each 1 to 40 characters after trimming, default `["let's go"]`). An invalid value SHALL be a configuration error reported on use. When `input.stopOnPhrase` is on and the input provider fixed at recording start is ElevenLabs, a recording not started with the command or skill key SHALL stream to `wss://api.elevenlabs.io/v1/speech-to-text/realtime` with model `scribe_v2_realtime`, 16 kHz PCM, pause-based commits after 1 second of silence, the key only in the `xi-api-key` header, and `language_code` set to the primary subtag of `input.language` when it is set. The recorder SHALL start only after the connection opens within the request deadline. When it is on and the input provider is Deepgram, a press of any other control SHALL report that the stop phrase needs ElevenLabs and SHALL record nothing.

After each committed segment, when the recording's committed text ends, as whole words and ignoring case, punctuation, and apostrophe style, with a configured stop phrase, the extension SHALL stop the recording, remove that phrase from the end, and deliver the remaining text in send mode. If nothing remains, nothing SHALL be sent. A key or command that stops a streamed recording SHALL request a final commit, wait up to the request deadline for it, and deliver the text in that control's mode without removing any phrase. If the provider answers the final commit by reporting that there is no further audio to commit, the text committed so far SHALL be delivered as final. Escape SHALL end the stream and send no message. At the time cap the text SHALL be held until the next press or command, as for an unstreamed recording. A provider error, an unexpected close, an unanswered final commit, or a recorder failure during a streamed recording SHALL end the recording with a sanitized message, append the text already committed to the composer without sending it, and SHALL NOT retry, reconnect, or fall back to the one-shot upload. Streamed audio SHALL NOT be uploaded a second time.

#### Scenario: Stop phrase sends the dictation

- **WHEN** the stop phrase is on, the composer contains `Refactor the loader`, and the user says "and add a test, let's go" and pauses
- **THEN** the recording stops and one user message `Refactor the loader and add a test` is sent

#### Scenario: Phrase in the middle does not stop

- **WHEN** the user says "let's go through the loader" and keeps speaking
- **THEN** the recording continues, because the phrase is not at the end of a committed segment

#### Scenario: Off by default

- **WHEN** `input.stopOnPhrase` is not set and the user records and stops with a key
- **THEN** no streaming connection is opened and the recording is uploaded once after the stop

#### Scenario: Deepgram selected

- **WHEN** the stop phrase is on, the input provider is Deepgram, and the user presses a shortcut
- **THEN** the extension says the stop phrase needs ElevenLabs, records nothing, and makes no request

#### Scenario: Key stop while streaming

- **WHEN** the stop phrase is on and the user stops a recording with the transcribe-only key
- **THEN** the final text is appended to the composer, nothing is sent, and no phrase is removed

#### Scenario: Escape while streaming

- **WHEN** the stop phrase is on and the user presses Escape while recording
- **THEN** the stream ends, the composer is unchanged, and no message is sent

#### Scenario: Connection lost mid-recording

- **WHEN** the streaming connection closes unexpectedly after some text was committed
- **THEN** the recording ends with a sanitized error, the committed text is appended to the composer, and nothing is sent or retried

#### Scenario: Pause, then send key

- **WHEN** the stop phrase is on, the user speaks, pauses for 2 seconds so the speech is already committed, and presses the send key, and the provider answers the final commit with `insufficient_audio_activity`
- **THEN** the committed text is sent with no error

#### Scenario: Only the phrase was said

- **WHEN** the user says only "let's go" and pauses
- **THEN** the recording stops, nothing is sent, and the composer is unchanged

### Requirement: Voice command and skill keys

When the command or skill key, or `/talk command` or `/talk skill`, stops a recording or releases a held one, the extension SHALL transcribe it as in transcribe-only mode and then match the transcript at that moment.

**Candidates.**
- In command mode, the candidates SHALL be Pi's extension commands and prompt templates from `pi.getCommands()`, under the names Pi lists, plus the command aliases.
- In skill mode, the candidates SHALL be Pi's skills, without the `skill:` prefix, plus the skill aliases, which are targets starting with `/skill:`.

**Comparison.**
- A token SHALL be a run of non-whitespace characters.
- Texts SHALL be compared in collapsed form: NFKC, lowercased, keeping only `\p{L}` and `\p{N}` characters.
- The longest run of leading tokens, from 1 to 8, whose collapsed form equals a candidate's collapsed form SHALL match. An alias with that form SHALL win over names.
- Only when no run matches in order, the longest run of leading tokens, from 1 to 8, whose collapsed tokens equal a candidate's words in any order SHALL match, where a candidate's words are its NFKC, lowercased form split on characters other than `\p{L}` and `\p{N}`. An alias SHALL again win over names, and two or more names with the same words SHALL be ambiguous.
- The remaining tokens, joined by single spaces with leading and trailing whitespace and punctuation removed, SHALL be the arguments.

**Delivery.**
- **Listed target:** the match is a command, template or skill in Pi's list, or an alias whose target's first token, without its `/`, is a listed command or template name, or `skill:` plus a listed skill. The editor text SHALL become the target (`/<name>`, `/skill:<name>`, or the alias target), then the arguments, then the previous draft, joined by single spaces.
- **Unlisted alias target:** the target SHALL be placed alone, and only when the editor is empty after trimming whitespace and no tokens follow it.
- **In every other case**, including no match and two different names equally matched, the transcript SHALL be appended as in transcribe-only mode, with a warning that does not repeat the transcript.
- Nothing SHALL be sent, and no command SHALL run, until the user presses Enter.

**Streaming.** A recording started with the command or skill key SHALL NOT stream, even with the stop phrase on.

**Aliases.** `input.commandAliases` SHALL hold at most 50 entries. Each entry maps a phrase of 1 to 40 characters and at most 8 tokens, with a non-empty collapsed form that no other phrase shares, to a one-line target of 2 to 200 characters starting with `/`. Any other value SHALL be a configuration error.

#### Scenario: Spoken command goes into the editor

- **WHEN** the editor holds "fix the login bug", the user presses the command key, says "op sx apply loop, add speak voice input." and presses the command key again
- **THEN** the editor holds `/opsx-apply-loop add speak voice input fix the login bug`, and nothing is sent or run

#### Scenario: Spoken skill

- **WHEN** the user records "Review convergence." and stops with the skill key
- **THEN** the editor holds `/skill:review-convergence`

#### Scenario: Alias to an interactive command

- **WHEN** `input.commandAliases` maps "model" to `/model`, the editor is empty, and the user records "model" and stops with the command key
- **THEN** the editor holds `/model`, although `/model` is not in Pi's command list

#### Scenario: Interactive alias with a draft

- **WHEN** `input.commandAliases` maps "new session" to `/new`, the editor holds "fix the login bug", and the user records "new session" and stops with the command key
- **THEN** the editor holds "fix the login bug new session", and a warning says the command needs an empty editor

#### Scenario: No match

- **WHEN** the user records "order a pizza" and stops with the command key
- **THEN** the words are appended as with the transcribe-only key, a warning says no command matched without repeating the words, and nothing runs

#### Scenario: Words in another order

- **WHEN** the listed skill is `online-llm-interactive`, and the user records "LLM online interactive check the spec" and stops with the skill key
- **THEN** the editor holds `/skill:online-llm-interactive check the spec`

#### Scenario: Order kept when it matches

- **WHEN** a name matches the leading words in order and another name matches a longer run only in another order
- **THEN** the name that matches in order wins

#### Scenario: Ambiguous names

- **WHEN** two different listed names have the same collapsed form, and the user says it
- **THEN** the words are appended unchanged and a warning names both

#### Scenario: Mode decided at the stop

- **WHEN** the user starts with the send key and stops with the skill key
- **THEN** the transcript is matched against skills and nothing is sent

#### Scenario: Command key with the stop phrase on

- **WHEN** `input.stopOnPhrase` is on, the input provider is Deepgram, and the user starts a recording with the command key
- **THEN** the recording starts without streaming, and it is uploaded once at the stop

### Requirement: Hold Space to talk

**Setting.** The configuration SHALL accept `input.holdSpace` (boolean, default `false`). It SHALL be read at load with the shortcuts, and a configuration error SHALL count as off. When it is off, Space SHALL reach the editor unchanged.

**Listener.** When it is on, the extension SHALL subscribe one raw terminal input listener on each interactive session start.

**Recognizing a hold.**
- A single-space input SHALL count as a Space press.
- A Space within 120 ms of the previous one SHALL be a repeat, and the second repeat in a row SHALL recognize a hold.
- Spaces before recognition SHALL reach the editor.
- After recognition the hold SHALL NOT be recognized again until it ends.

**Engaged hold.** If, at recognition, no recording attempt, recording, held recording or transcription exists, a recording SHALL start as the send key starts one. While it does:
- every Space SHALL be consumed until the hold ends;
- once the recorder is running, the Spaces this listener passed to the editor since the last input that was not a Space SHALL be removed from the end of the editor text, if the text still ends with them.

**Busy hold.** If, at recognition, any recording attempt, recording, held recording or transcription exists, nothing SHALL change and Spaces SHALL keep reaching the editor.

**Ending.**
- The hold SHALL end on a key-release event for Space, or when no Space has arrived for 300 ms. The quiet gap SHALL be confirmed only after pending input has been read.
- Release events of keys other than Space, and the terminal's cell-size reply (`CSI 6;<h>;<w> t`), SHALL be ignored. Every other input SHALL count as other input.
- Ending an engaged hold SHALL act only on the recording that hold started:
  - **starting:** cancel it;
  - **recording or held:** send it, exactly as the send key does;
  - **otherwise:** nothing.

**Keys Pi handles first.** Keys and events that Pi consumes before extension listeners, such as PageUp in Pi's fullscreen mode, are not seen by the hold. They end it through the quiet gap, which sends; this SHALL be documented as a limit.

**Other input during an engaged hold.** Escape and the registered push-to-talk keys, including the command and skill keys, SHALL behave as usual. Any other input, including text in any script and bracketed paste, SHALL reach the editor and discard the hold's recording, exactly as Escape does. The hold SHALL stay spent and consume Spaces until it ends, and its ending SHALL then do nothing.

Session replacement and shutdown SHALL discard the hold's recording and clear its timers, and the hold SHALL stay unrecognizable until it ends, even when Pi loads the extension again for the new session. A hold whose timer was cleared SHALL end at the first input arriving more than 300 ms after its last Space, and that input SHALL be handled normally.

**Status line.** The recording status line of a hold-started recording, and its held line at the time cap, SHALL say that releasing Space sends.

#### Scenario: Tap types a space

- **WHEN** `input.holdSpace` is on and the user taps Space
- **THEN** one space is typed and no recording starts

#### Scenario: Hold records and release sends

- **WHEN** `input.holdSpace` is on, the editor holds "Draft", and the user holds Space (a press, an auto-repeat after 500 ms, then repeats every 30 ms), says "xin chào", and lets go
- **THEN** the recording starts at the fourth Space, the editor holds "Draft" again once the recorder runs, and after the release "Draft xin chào" is sent as with the send key

#### Scenario: Release while starting

- **WHEN** the user lets go of Space while the recording is still starting
- **THEN** the attempt is cancelled, nothing is recorded or sent, and the editor holds "Draft   " (the three Spaces stay)

#### Scenario: Escape while Space is held

- **WHEN** the user presses Escape during a hold-started recording and keeps holding Space, then lets go
- **THEN** the recording is discarded, later Spaces are consumed, no new recording starts, and nothing is sent

#### Scenario: Recording already ended before the release

- **WHEN** the stop phrase sends a hold-started recording, or a push-to-talk key stops it and its transcription finishes, while Space is still held, and the user then lets go
- **THEN** nothing more happens: no new recording starts and nothing else is sent

#### Scenario: Refused start

- **WHEN** the editor holds "Draft", a hold is recognized, and the recording cannot start because the key is missing
- **THEN** the reason is reported once, the editor holds "Draft   ", later Spaces are consumed until the release, and no further attempt is made

#### Scenario: Busy hold

- **WHEN** a recording, or a recording attempt that is still starting, was begun with a key, and the user holds Space
- **THEN** every Space is typed, that recording is unaffected, and no recording starts when it ends while Space is still held

#### Scenario: Stalled event loop

- **WHEN** Pi is busy for longer than 300 ms during a hold, so the release timer and queued Spaces are due together
- **THEN** the queued Spaces keep the hold going, and nothing is sent

#### Scenario: Release of another key

- **WHEN** the terminal reports the release of an arrow key or Escape during an engaged hold
- **THEN** the hold continues and nothing is sent

#### Scenario: Send key during a hold

- **WHEN** the user presses the send key, encoded as an escape sequence, during an engaged hold, then lets go of Space
- **THEN** the recording is sent once, with no warning

#### Scenario: Other key during a hold

- **WHEN** the editor held "Draft", a hold-started recording is running (the hold's Spaces already removed), and the user types "x" while holding Space, then lets go
- **THEN** the editor holds "Draftx", the recording is discarded, the remaining Spaces are consumed, nothing is sent, and the release does nothing. With the stop phrase on, audio already streamed is not recalled

#### Scenario: Text in another script during a hold

- **WHEN** the user types a Vietnamese letter or pastes text during a hold-started recording
- **THEN** it is treated as other input: it reaches the editor and the recording is discarded

#### Scenario: Terminal reply during a hold

- **WHEN** the terminal's cell-size reply arrives during a hold
- **THEN** it is ignored and the hold continues

#### Scenario: Undecodable key during a hold

- **WHEN** the user presses a key Pi cannot decode, such as Ctrl+F5, during a hold-started recording
- **THEN** it counts as other input and the recording is discarded, not sent

#### Scenario: Session replaced during a hold

- **WHEN** the session is replaced while Space is held
- **THEN** the recording is discarded, the hold timers are cleared, nothing is sent, and no recording starts on the later repeats

#### Scenario: Cursor in the middle of the text

- **WHEN** the cursor is inside the draft when the hold is recognized
- **THEN** the typed Spaces stay in the draft and the recording proceeds

#### Scenario: Off by default

- **WHEN** `input.holdSpace` is not set and the user holds Space
- **THEN** every space reaches the editor and no recording starts

### Requirement: Voice input secret and privacy handling

The extension SHALL read `DEEPGRAM_API_KEY` and `ELEVENLABS_API_KEY` only from the environment and SHALL NOT write them to configuration, cache, logs, notifications, process arguments, or the recorder's environment. The extension SHALL NOT log or persist audio or transcripts; a transcript exists only in the composer or in the user message the user chose to send, and warnings never repeat it. Documentation SHALL state that each recording the user sends goes to the selected provider, that this is not a zero-retention guarantee, and that a discarded recording, or one held at the time cap and not sent, never leaves the machine while the stop phrase is off. It SHALL state that while the stop phrase is on, audio of every recording not started with the command or skill key streams to ElevenLabs as the user speaks, and that discarding a recording stops the message but cannot recall audio already sent. Help and `/speak status` SHALL show whether the stop phrase is on and which phrases count.

#### Scenario: Error output redaction

- **WHEN** a transcription failure message would include a key or an authorization header
- **THEN** the displayed message omits it
