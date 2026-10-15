# Spec Delta

## Purpose

Lets a Pi user hold a hands-free spoken conversation with Pi: while live mode is on, what the user says reaches Pi as messages after each pause, and Pi speaks short acknowledgements, progress, and summaries back in the user's own ElevenLabs voice, with Pi's full context and tools behind every answer.

## ADDED Requirements

### Requirement: Live mode starts and ends only by user action or a stop condition

The extension SHALL start live mode only when the user runs `/talk live` while live mode is off, and SHALL end it when the user runs `/talk live` while it is on, when the user says a live stop phrase as "Live stop phrase" defines, or on a stop condition in "Live mode ends cleanly". Loading, reloading, session start, prompts, tool execution, agent completion, and every other lifecycle event SHALL NOT start live mode. Live mode SHALL NOT survive a reload, a restart, or a session replacement. Live mode SHALL be available only in the interactive terminal.

#### Scenario: Toggle on and off

- **WHEN** the user runs `/talk live`, speaks with Pi, and then runs `/talk live` again
- **THEN** live mode starts on the first command and ends on the second, and the microphone is closed afterwards

#### Scenario: Not restored after reload

- **WHEN** live mode is on and the user runs `/reload`
- **THEN** live mode is off after the reload and no recorder or connection is open

#### Scenario: Silent agent activity

- **WHEN** live mode was never started and the user submits prompts that complete with answers and tool calls
- **THEN** no live connection is opened, no recorder starts, and nothing is spoken

### Requirement: Starting live mode

When `/talk live` starts live mode, the extension SHALL first check that the configuration is valid, that `ELEVENLABS_API_KEY` is set, and that a recording tool is available. It SHALL refuse with a message that names the problem, and start nothing, when any check fails, or when a recording, a recording held at the time cap, or a transcription is active. It SHALL stop this extension's own speech before opening the microphone. It SHALL then open one connection to `wss://api.elevenlabs.io/v1/speech-to-text/realtime` with model `scribe_v2_realtime`, 16 kHz PCM, pause-based commits after `input.livePauseSeconds` of silence, the language list that "Live pause and languages" defines, the key only in the `xi-api-key` header, and `language_code` set to the primary subtag of `input.language` only when `input.language` is set. The recorder SHALL start only after the connection opens within the request deadline. If the connection does not open, the extension SHALL show a sanitized message, start no recorder, and SHALL NOT retry.

Live mode SHALL use ElevenLabs for listening and for speaking, whatever `input.provider`, the configured speech provider, and their session overrides select. The message shown when live mode starts SHALL say that it uses ElevenLabs, which spoken languages it listens for (detected per turn among any language, fixed to `input.language`, or limited as "Live pause and languages" defines), the key that cuts Pi off, and that `/talk live` ends it.

#### Scenario: Missing key

- **WHEN** `ELEVENLABS_API_KEY` is not set and the user runs `/talk live`
- **THEN** the extension names the missing environment variable, opens no connection, and starts no recorder

#### Scenario: Recording already active

- **WHEN** a push-to-talk recording is in progress and the user runs `/talk live`
- **THEN** live mode does not start, a message says why, and the recording continues unchanged

#### Scenario: Deepgram selected elsewhere

- **WHEN** `input.provider` is `deepgram`, the speech provider is `deepgram`, and the user runs `/talk live`
- **THEN** live mode listens and speaks with ElevenLabs, and the start message says so

#### Scenario: Connection fails to open

- **WHEN** the live connection does not open within the request deadline
- **THEN** a sanitized message is shown, no recorder is started, no retry is made, and live mode is off

### Requirement: Live turn delivery

While live mode is on, each segment the provider commits after a pause of `input.livePauseSeconds` SHALL be one turn. A turn whose text contains no letter or digit SHALL be dropped without a message. Every turn with at least one letter or digit, however short, SHALL be sent to Pi as one plain user message, with no expansion: slash commands, prompt templates, and skill commands in it SHALL NOT run. The extension SHALL NOT read, change, or send the composer's text when sending a turn. When the agent is idle, the turn SHALL start a new agent run. When the agent is working, `input.sendWhenBusy`, read at send time, SHALL decide: `interrupt` (default) delivers the turn to the running turn at once, and `wait` queues it until the run ends. When the extension can tell before sending that Pi would refuse the message (no model selected, or the conversation is being compacted), or when the send call fails, it SHALL append the turn to the composer instead, show a message saying why it was not sent, and keep live mode on. The push-to-talk stop phrases (`input.stopPhrases`) SHALL have no effect in live mode: a turn is sent with its words unchanged. A turn that matches a live stop phrase is not sent; "Live stop phrase" defines it. A segment committed after live mode ended or after the session was replaced SHALL be dropped.

#### Scenario: Turn sent while a draft is typed

- **WHEN** the composer contains `Refactor the loader`, the agent is idle, and the user says "what does the config loader do" and pauses
- **THEN** one user message `what does the config loader do` is sent and the composer still contains `Refactor the loader`

#### Scenario: Turn while Pi is working

- **WHEN** the agent is working, `input.sendWhenBusy` is omitted, and the user says "also check the tests" and pauses
- **THEN** the message is delivered to the running turn at once

#### Scenario: Segment without words dropped

- **WHEN** the provider commits the text `...`
- **THEN** nothing is sent, the composer is unchanged, and no message is shown

#### Scenario: Short answer sent

- **WHEN** Pi has asked a question and the user answers `Ừ.` or `yes.` and pauses
- **THEN** that answer is sent as one user message

#### Scenario: Slash command spoken

- **WHEN** a committed turn reads `/compact now please`
- **THEN** it is sent as an ordinary user message and no command runs

#### Scenario: Turn during compaction

- **WHEN** Pi is compacting the conversation and a turn is committed
- **THEN** nothing is sent, the turn is appended to the composer, a message says why, and live mode stays on

### Requirement: Spoken updates tool

The extension SHALL register a `speak_aloud` tool that takes one `text` parameter. The tool SHALL be registered with `defaultActive: false` and SHALL be declared to the model only while live mode is on: it SHALL be added to the active tools when live mode starts and removed when live mode ends, leaving the other active tools unchanged. Because the host can restore a session's recorded tool set, and a host that ignores `defaultActive` activates every tool on registration, the extension SHALL also remove it, leaving the other active tools unchanged, when an agent run started by a prompt begins while live mode is off and the tool is active. A run that another extension starts with a message skips that check and may still declare the tool; its result then says live mode is off, and nothing is spoken. The extension SHALL NOT change the active tools when the tool's state would not change, so loading, reloading, and resuming without live mode leave the tool set, including tools still being restored, untouched. Its description and guidance SHALL tell the model that the user is talking by voice; that it should call the tool to speak a short acknowledgement when it starts on a request, brief progress during long work, and a short summary when it finishes; that it should write the spoken text in the language of the user's latest spoken message; that spoken text stays short and speakable, without code blocks, tables, or long paths; and that the written answer remains the full record. The tool SHALL return promptly once the update is queued, without waiting for synthesis or playback. Its result SHALL say that the update was queued, or why nothing will be spoken: live mode is off, the text is empty, or the text exceeds the speech length limit. The text SHALL be spoken exactly as written, with no translation, summarization, or answer selection.

#### Scenario: Tool absent when live mode is off

- **WHEN** live mode is off and the user submits a prompt
- **THEN** `speak_aloud` is not among the tools declared to the model in that run

#### Scenario: Resumed session does not bring the tool back

- **WHEN** a session whose last run was made in live mode is resumed, or the user navigates the tree to such a point, and the user then submits a prompt with live mode off
- **THEN** `speak_aloud` is not among the tools declared to the model in that run, and the other active tools are unchanged

#### Scenario: Loading leaves the tool set alone

- **WHEN** Pi starts, reloads, or resumes a session that never used live mode, while other tools are still being restored
- **THEN** the extension makes no change to the active tools

#### Scenario: Tool available while live

- **WHEN** live mode is on and the model calls `speak_aloud` with `Đang kiểm tra các bài test.`
- **THEN** the tool returns at once with a result saying the update was queued, and that exact text is spoken

#### Scenario: Call after live mode ended

- **WHEN** a model call to `speak_aloud` arrives after live mode has ended
- **THEN** nothing is synthesized or played and the result says live mode is off

### Requirement: Speaking live updates

Each queued update SHALL be synthesized with ElevenLabs using the configured voice, model, and output format, and SHALL follow the same preflight, hard length limit, cache, playback, and progress-line rules as `/speak text`. Updates SHALL play in the order the tool received them; while one is being synthesized or played, later updates SHALL wait. When an update fails, the extension SHALL show a sanitized message, SHALL NOT retry it, SHALL continue with the next update, and SHALL keep live mode on.

#### Scenario: Updates play in order

- **WHEN** the model queues an acknowledgement and, while it plays, a progress update
- **THEN** the progress update starts only after the acknowledgement finishes

#### Scenario: Failed update does not stop the next

- **WHEN** the synthesis request for one update fails and another update is waiting
- **THEN** a sanitized message is shown, the failed update is not retried, and the waiting update is spoken

### Requirement: Microphone muted while Pi speaks

When `input.liveListenWhileSpeaking` is off (default), from the moment this extension's player starts until 500 ms after it exits, the extension SHALL send silence of the same length in place of microphone audio, so that no sound from the room, including Pi's own voice still in the output and recorder buffers, reaches the provider, and the connection stays open. Listening SHALL resume after that tail.

#### Scenario: Pi's voice is not transcribed

- **WHEN** live mode is on with speakers, and an update is played
- **THEN** no turn containing the update's words is committed or sent

#### Scenario: Audio arriving just after playback is muted

- **WHEN** the player exits and recorder audio arrives 300 ms later
- **THEN** silence is sent in its place, and microphone audio is sent again only from 500 ms after the player exited

### Requirement: Cutting Pi off

While live mode is on, the send shortcuts from `input.shortcut` and `/speak stop` SHALL stop the update being synthesized or played, drop every waiting update, and resume listening, without ending live mode and without aborting the agent. When nothing is being spoken, the send shortcut SHALL change nothing and SHALL show that nothing is being spoken.

When `input.liveListenWhileSpeaking` is on, microphone audio SHALL keep being sent during playback, and when the provider reports any non-empty partial transcript while an update is being synthesized or played, the extension SHALL cut Pi off as above. The speech that interrupted SHALL be delivered as a normal turn once committed. Help and documentation SHALL state that this setting needs headphones or system echo cancellation, because otherwise Pi's own voice can cut it off or be sent as a turn.

#### Scenario: Key cuts Pi off

- **WHEN** an update is playing, another is waiting, and the user presses the send shortcut
- **THEN** playback stops, the waiting update is dropped, the agent keeps working, and live mode stays on

#### Scenario: Voice cuts Pi off with the setting on

- **WHEN** `input.liveListenWhileSpeaking` is on, an update is playing, and the user starts speaking
- **THEN** playback stops on the first partial transcript, waiting updates are dropped, and the user's words are sent as a turn after the pause

#### Scenario: Voice does not cut Pi off by default

- **WHEN** `input.liveListenWhileSpeaking` is off and the user speaks while an update plays
- **THEN** playback continues and nothing the user said during playback is sent

### Requirement: Other voice controls during live mode

While live mode is on or starting, the transcribe-only, command, and skill shortcuts, `/talk`, `/talk send`, `/talk command`, and `/talk skill`, and, while live mode is starting, the send shortcuts too, SHALL be refused with a message that names `/talk live` as the way to end live mode. A Space hold SHALL be treated as busy: Spaces keep typing and nothing starts. `/speak` with no argument, `/speak original`, `/speak in`, `/speak text`, and `/speak replay` SHALL be refused with a message and make no request. `/speak stop`, `/speak status`, `/speak quota`, `/speak provider`, `/speak locale`, `/talk provider`, and help SHALL keep working; a provider change applies to push-to-talk and `/speak` after live mode ends. Live mode SHALL NOT intercept Escape, which reaches Pi as usual.

#### Scenario: Transcribe key during live mode

- **WHEN** live mode is on and the user presses the transcribe-only shortcut
- **THEN** no recording starts and a message names `/talk live` to end live mode

#### Scenario: Speak command during live mode

- **WHEN** live mode is on and the user runs `/speak text hello`
- **THEN** nothing is synthesized or played and a message says `/speak` is unavailable during live mode

#### Scenario: Escape during live mode

- **WHEN** live mode is on, the agent is working, and the user presses Escape
- **THEN** Pi handles Escape as usual and live mode stays on

### Requirement: Live stop phrase

The configuration SHALL accept `input.liveStopPhrases`, a list of 0 to 10 phrases, each a string of 1 to 40 characters after trimming that contains at least one letter or digit, defaulting to `["Dừng cuộc hội thoại", "Stop the conversation"]`. Any other value SHALL be a configuration error reported when the user runs `/talk live`. An empty list SHALL turn the feature off. These phrases are separate from the push-to-talk `input.stopPhrases`.

While live mode is on, each committed turn SHALL be compared with every live stop phrase before any other turn rule applies. A turn SHALL match only when its whole text, compared word by word, equals a phrase: case, whitespace, and punctuation SHALL be ignored, curly apostrophes SHALL count as straight ones, and diacritics SHALL be ignored, with `đ` counting as `d`. A turn that contains a phrase together with other words SHALL NOT match and SHALL be delivered as a normal turn.

A matched turn SHALL NOT be sent to Pi, added to the composer, or stored. Turns committed before it SHALL still be delivered in order; then live mode SHALL end through the same path as `/talk live`, as "Live mode ends cleanly" defines, and a message SHALL say that live mode ended because the stop phrase was said, without repeating any transcript text. Segments committed after a match SHALL be dropped. Ending this way SHALL NOT abort the agent. While `input.liveListenWhileSpeaking` is off, the microphone is muted during Pi's speech, so a phrase said then is not heard; documentation SHALL say so.

#### Scenario: Vietnamese stop phrase

- **WHEN** live mode is on with the default phrases and the user says "Dừng cuộc hội thoại." and pauses
- **THEN** nothing is sent to Pi, live mode ends, the microphone closes, and a message says it ended because of the stop phrase

#### Scenario: Case, punctuation, and diacritics ignored

- **WHEN** a committed turn reads `stop the conversation!` or `dung cuoc hoi thoai`
- **THEN** it matches a default phrase and live mode ends

#### Scenario: Phrase inside a longer turn

- **WHEN** a committed turn reads `Okay, stop the conversation about tests and look at the loader`
- **THEN** it is sent to Pi as a normal turn and live mode stays on

#### Scenario: Earlier turn still delivered

- **WHEN** a turn is committed and, before it has been sent, the next committed turn is a stop phrase
- **THEN** the first turn is sent, the stop-phrase turn is not, and live mode then ends

#### Scenario: Feature turned off

- **WHEN** `input.liveStopPhrases` is `[]` and the user says "Stop the conversation"
- **THEN** the turn is sent to Pi and live mode stays on

#### Scenario: Invalid live stop phrases

- **WHEN** `input.liveStopPhrases` is `"stop"` or contains `"..."`, and the user runs `/talk live`
- **THEN** the configuration error is reported and live mode does not start

### Requirement: Live pause and languages

The configuration SHALL accept `input.livePauseSeconds`, a number from 0.3 to 3 inclusive, defaulting to 2, and `input.liveLanguages`, a list of 0 to 10 language tags, each valid as `input.language` is, defaulting to `[]`. Any other value SHALL be a configuration error reported when the user runs `/talk live`.

Live mode's transcription connection SHALL ask the provider to end a segment after `input.livePauseSeconds` of silence. When `input.liveLanguages` is not empty, the connection SHALL send the primary subtag of each tag, each distinct subtag once, as a separate `secondary_languages` value, and SHALL still send `language_code` when `input.language` is set. The provider then recognises only those languages and `input.language`; speech in another language is not transcribed. Neither setting SHALL change push-to-talk, whose connection keeps a 1-second pause and sends no `secondary_languages`. The connection URL SHALL never contain the API key.

#### Scenario: Thinking pause

- **WHEN** `input.livePauseSeconds` is omitted and the user pauses for 1.5 seconds in the middle of a sentence
- **THEN** the whole sentence is one turn

#### Scenario: Vietnamese and English only

- **WHEN** `input.liveLanguages` is `["vi", "en"]` and `input.language` is omitted
- **THEN** the connection sends `secondary_languages=vi` and `secondary_languages=en` and no `language_code`

#### Scenario: Main language plus another

- **WHEN** `input.language` is `vi` and `input.liveLanguages` is `["en-US"]`
- **THEN** the connection sends `language_code=vi` and `secondary_languages=en`

#### Scenario: Push-to-talk unchanged

- **WHEN** both settings are set and push-to-talk listens for its spoken stop phrase
- **THEN** its connection uses a 1-second pause and sends no `secondary_languages`

#### Scenario: Invalid pause or languages

- **WHEN** `input.livePauseSeconds` is `3.5` or `"2"`, or `input.liveLanguages` is `"vi"` or contains an invalid tag, and the user runs `/talk live`
- **THEN** the configuration error is reported and live mode does not start

### Requirement: Live idle limit

The configuration SHALL accept `input.liveIdleMinutes`, an integer from 1 to 60, defaulting to 5; an invalid value SHALL be a configuration error reported when the user runs `/talk live`. Live mode SHALL end when, for that many minutes in a row, the agent has been idle, no update has been synthesized or played, and no turn has been sent. A message SHALL say that live mode ended because it was idle.

#### Scenario: Ends after silence

- **WHEN** live mode is on with the default limit, the agent is idle, and the user says nothing for five minutes
- **THEN** live mode ends and a message says it ended because it was idle

#### Scenario: Long agent work does not count

- **WHEN** the agent works for ten minutes on a spoken request while the user stays silent
- **THEN** live mode stays on, and the idle limit counts only from when the agent becomes idle and nothing is being spoken

### Requirement: Live mode ends cleanly

Live mode SHALL end on `/talk live`, on a live stop phrase, on the idle limit, on a provider error or an unexpected close of the connection, when the recorder exits on its own, and on session replacement, fork, tree navigation, reload, and shutdown. Ending SHALL stop the recorder, close the connection, stop the update being synthesized or played, drop waiting updates, remove `speak_aloud` from the active tools, and clear the status line. Except on shutdown and session changes, a message SHALL name why live mode ended. The extension SHALL NOT retry, reconnect, or fall back to another provider. Ending SHALL be idempotent.

#### Scenario: Connection lost

- **WHEN** the live connection closes unexpectedly
- **THEN** live mode ends, a sanitized message says so, the recorder stops, and no reconnect is attempted

#### Scenario: Session switched while Pi speaks

- **WHEN** an update is playing and the user starts a new session
- **THEN** playback stops, live mode is off in the new session, and `speak_aloud` is not declared to the model

### Requirement: Live mode status, help, and settings

While live mode is on, a status line SHALL show whether the extension is listening or Pi is speaking, the key that cuts Pi off, and that `/talk live` ends live mode, together with the first live stop phrase when any is configured. `/speak status` SHALL show whether live mode is on and the effective `input.liveIdleMinutes`, `input.liveListenWhileSpeaking`, `input.livePauseSeconds`, and `input.liveLanguages`. Help SHALL describe `/talk live`, the key that cuts Pi off, the live settings, including `input.liveStopPhrases` and its whole-turn rule, `input.livePauseSeconds`, and `input.liveLanguages` and what it limits, and that live mode uses ElevenLabs for listening and speaking. The configuration SHALL accept `input.liveListenWhileSpeaking` as a boolean defaulting to `false`; any other value SHALL be a configuration error. Other unknown keys SHALL still be rejected.

#### Scenario: Status line follows playback

- **WHEN** live mode is on, an update plays, and playback ends
- **THEN** the status line says Pi is speaking with the cut-off key during playback, and says listening afterwards

#### Scenario: Invalid setting

- **WHEN** `input.liveListenWhileSpeaking` is `"yes"` and the user runs `/talk live`
- **THEN** the configuration error is reported and live mode does not start

### Requirement: Live mode privacy

The extension SHALL read `ELEVENLABS_API_KEY` only from the environment and SHALL NOT write it to configuration, cache, logs, notifications, process arguments, or the recorder's or player's environment. It SHALL NOT log or persist microphone audio, and SHALL NOT store transcripts anywhere other than the user messages it sends and the composer fallback of "Live turn delivery"; warnings SHALL NOT repeat transcript text. Documentation SHALL state that while live mode is on, everything the microphone hears, except during muted playback, streams to ElevenLabs; that each turn becomes a user message saved in the session like a typed one; that the text Pi chooses to speak is sent to ElevenLabs for synthesis and its audio is cached like `/speak` clips; that this is not a zero-retention guarantee; and that ending live mode is the way to stop streaming.

#### Scenario: Error output redaction

- **WHEN** a live connection or synthesis failure message would include the key or an authorization header
- **THEN** the displayed message omits it
