# Spec Delta

## Purpose

Lets a Pi user explicitly ask for a completed assistant answer, or text they supply, to be spoken in their own authorized cloned voice, while keeping every other part of Pi silent, offline, and free of provider spend.

## ADDED Requirements

### Requirement: Speech occurs only on explicit request

The extension SHALL start speech generation, summarization, or playback only as the direct result of the user running a `/speak` subcommand that produces speech. Loading, reloading, session start, ordinary prompts, tool execution, agent completion, and any other lifecycle event SHALL NOT initiate a provider request, a model call, or playback. Lifecycle events MAY cancel or clean up this extension's own work.

#### Scenario: Silent startup and agent activity

- **WHEN** Pi starts or reloads with the extension loaded, and the user then submits prompts that complete with assistant answers and tool calls
- **THEN** no ElevenLabs request is made, no model call is made by the extension, and no audio is played

#### Scenario: Missing configuration does not block Pi

- **WHEN** the configuration file or API key is absent at startup
- **THEN** Pi starts normally and the problem is reported only when the user runs `/speak` or `/speak status`

### Requirement: Command contract

The extension SHALL register one `/speak` command with these subcommands: no argument (speak the latest eligible answer), `text <text>`, `stop`, `replay`, and `status`. Everything after `text` SHALL be treated as data, not as command syntax or shell input. An unknown subcommand SHALL display usage without any provider request.

#### Scenario: Unknown subcommand

- **WHEN** the user runs `/speak frobnicate`
- **THEN** the extension displays usage help and makes no provider request and starts no playback

#### Scenario: Text subcommand without content

- **WHEN** the user runs `/speak text` with no text or only whitespace
- **THEN** the extension displays usage help and makes no provider request and starts no playback

#### Scenario: Shell-looking text is data

- **WHEN** the user runs `/speak text $(touch /tmp/x); echo "hi" | cat`
- **THEN** the supplied characters are the text prepared for speech and no shell command is executed

### Requirement: Supported run mode

The extension SHALL perform speech only in an interactive terminal session. In any other Pi run mode it SHALL report that speech is unsupported without making a provider request or starting playback.

#### Scenario: Non-terminal mode

- **WHEN** `/speak` is invoked in a Pi run mode that is not the interactive terminal
- **THEN** the extension reports the mode is unsupported and neither synthesizes nor plays audio

### Requirement: Answer selection from the active branch

For `/speak` with no argument, the extension SHALL require the main agent to be idle with no queued work, and SHALL select the text of the latest finalized assistant answer belonging to the most recent user turn on the effective active branch. It SHALL use only the answer's text blocks, in order. It SHALL exclude thinking, tool calls and results, images, system messages, compaction summaries, and content from abandoned branches. It SHALL NOT fall back to an older answer when the latest turn has no eligible answer.

#### Scenario: Agent still working

- **WHEN** the user runs `/speak` while the agent is streaming or has queued messages
- **THEN** the extension reports that the agent is busy, makes no provider request, and does not later speak a different answer on its own

#### Scenario: Latest turn ended without an eligible answer

- **WHEN** the most recent user turn's assistant message is aborted, errored, or only a tool call
- **THEN** the extension reports that there is no eligible answer and does not read an earlier turn's answer

#### Scenario: Mixed assistant content

- **WHEN** the latest answer contains thinking blocks, tool calls, and text blocks
- **THEN** only the text blocks, in order, are used

#### Scenario: Branch navigation

- **WHEN** the user navigates to a different branch and runs `/speak`
- **THEN** only content on the newly active branch is eligible

### Requirement: Deterministic text preparation for answers

For answer-based speech the extension SHALL prepare text without a model call: remove fenced and indented code blocks, image syntax, and HTML markup; keep link labels and omit destinations; keep readable inline identifiers; strip terminal escape sequences without damaging ordinary Unicode; and preserve numbers, dates, versions, negation, and qualifications. It SHALL NOT summarize or reinterpret content. If no speakable prose remains it SHALL report that and make no provider request.

#### Scenario: Code-only answer

- **WHEN** the selected answer consists only of a fenced code block
- **THEN** the extension reports there is nothing speakable and makes no provider request

#### Scenario: Meaning-sensitive content is preserved

- **WHEN** the answer says "the test did not pass on version 1.2.3 on 2026-10-02"
- **THEN** the prepared text still contains the negation, the version, and the date unchanged

### Requirement: Explicit text preserves wording

For `/speak text <text>` the extension SHALL send the supplied wording unchanged apart from documented whitespace and control-character normalization, and SHALL NOT apply answer cleanup rules.

#### Scenario: Supplied markdown is not rewritten

- **WHEN** the user runs `/speak text Use **bold** here`
- **THEN** the text sent for synthesis equals the supplied wording after normalization only

### Requirement: Single hard length limit

The extension SHALL refuse to synthesize prepared text longer than 4000 characters, SHALL state the length and the limit, and SHALL NOT truncate it, split it across several requests, or substitute a summary. Text at or below the limit SHALL proceed without a confirmation prompt.

#### Scenario: Oversized answer

- **WHEN** the prepared text is 4001 characters
- **THEN** the extension refuses, reports the length and limit, suggests supplying shorter text with `/speak text`, and makes no provider request

#### Scenario: Within limit

- **WHEN** the prepared text is 4000 characters
- **THEN** the extension proceeds to preflight checks with no extra confirmation

### Requirement: Preflight before any billable request

Before any provider request the extension SHALL validate that the configuration is present and valid, the voice identifier and model are explicitly set and not placeholders, `ELEVENLABS_API_KEY` is available, and the configured player command is executable. A failed check SHALL produce a specific sanitized message and no provider request.

#### Scenario: Player missing

- **WHEN** the configured player command cannot be found
- **THEN** the extension reports the missing player and makes no provider request

#### Scenario: Placeholder voice

- **WHEN** the configured voice identifier is the shipped placeholder value
- **THEN** the extension reports the configuration is incomplete and makes no provider request

### Requirement: ElevenLabs synthesis request

On a cache miss the extension SHALL send one HTTPS request to the fixed production ElevenLabs text-to-speech endpoint using the configured voice, an explicitly named model, and an explicit audio output format, authenticated with the API key from the environment. The destination and headers SHALL NOT be influenced by assistant or user text. Redirects SHALL be rejected. The request SHALL be bounded by a total deadline and a maximum response size, and the result SHALL be accepted only if it is nonempty audio and not an error document. The extension SHALL NOT retry a synthesis request automatically, SHALL NOT substitute another model, voice, or provider, and SHALL show sanitized errors for authentication, permission, voice or model, rate-limit, timeout, and server failures.

#### Scenario: Successful synthesis

- **WHEN** a valid request completes within the deadline with nonempty audio
- **THEN** the audio is stored in the cache and played

#### Scenario: Timeout is not retried

- **WHEN** the provider does not answer within the deadline
- **THEN** the request is aborted, a timeout error is shown, no retry or fallback occurs, and the message does not claim the attempt was free

#### Scenario: Provider returns an error document

- **WHEN** the provider responds with a JSON error body instead of audio
- **THEN** the body is not played or cached and a sanitized error is shown without echoing the API key

#### Scenario: Redirect rejected

- **WHEN** the provider endpoint responds with a redirect
- **THEN** the extension does not follow it and reports a failure

### Requirement: Single job and responsive stop

The extension SHALL allow at most one speech job per Pi process; a second speak request while a job is active SHALL be rejected with a message and SHALL NOT queue or start another provider request. The `/speak` handler SHALL return control to Pi promptly after starting the job rather than waiting for playback to finish, so that `/speak stop` can run during generation and during playback. `/speak stop` SHALL cancel only this extension's in-flight generation and terminate only its own tracked player process, and SHALL NOT abort the coding agent or affect other audio processes. A cancelled job SHALL NOT later start playback or alter the state of a newer job.

#### Scenario: Stop during generation

- **WHEN** a synthesis request is in flight and the user runs `/speak stop`
- **THEN** the request is aborted, no playback starts when the cancelled request would have completed, no partial or temporary audio remains in the cache, and the coding agent is not aborted

#### Scenario: Stop during playback

- **WHEN** audio is playing and the user runs `/speak stop`
- **THEN** only the extension's player process ends and unrelated audio continues

#### Scenario: Duplicate request

- **WHEN** a job is active and the user runs `/speak` again
- **THEN** the extension reports that speech is already active and starts no second job

### Requirement: Playback without shell or terminal interference

The extension SHALL start the player as a child process from an argument array with no shell, SHALL give the player the cached audio file path as data, SHALL prevent the player from reading Pi's terminal input or writing over its interface, SHALL NOT pass the ElevenLabs API key to the player's environment, and SHALL retain only bounded, sanitized player diagnostics.

#### Scenario: Hostile file name characters

- **WHEN** the audio path contains spaces or shell metacharacters
- **THEN** the player receives the path as a single argument and nothing is interpreted by a shell

### Requirement: Lifecycle cancellation

The extension SHALL cancel its own generation and playback on shutdown, reload, session replacement, and branch navigation, SHALL make that cleanup idempotent, and SHALL clear any replay reference tied to the previous session or branch. It SHALL NOT reuse a replaced session's context after replacement.

#### Scenario: Session replaced during playback

- **WHEN** the user starts a new session while audio is playing
- **THEN** the player is terminated and `/speak replay` in the new session does not play the previous session's clip

### Requirement: Content-addressed audio cache

The extension SHALL cache generated audio under a key derived from the canonical combination of the final outbound text, provider, voice identifier, model, output format, voice settings (none are sent in this version), a text-normalizer version, and a user-controlled voice revision. The API key SHALL NOT be part of the key. The cache SHALL live in a private per-user directory outside any repository, with owner-only permissions, atomic completion of files, rejection of non-regular or symlinked entries, a retention period of seven days, and a total size cap of 100 MiB with eviction that never removes a clip currently playing. The extension SHALL NOT keep source text in a plaintext index.

#### Scenario: Cache hit makes no provider call

- **WHEN** the same prepared text is spoken again with an unchanged voice, model, format, and settings
- **THEN** the cached audio is played and no provider request is made

#### Scenario: Changed voice or model misses

- **WHEN** the configured voice, model, output format, or voice revision changes
- **THEN** the previous clip is not reused and a new synthesis is required

#### Scenario: Eviction spares active clip

- **WHEN** the size cap is exceeded while a clip is playing
- **THEN** eviction removes other clips and never the playing clip

### Requirement: Replay never regenerates

`/speak replay` SHALL play the last valid cached clip for the current session and branch and SHALL make no provider or model call. If no valid clip exists it SHALL report that and SHALL NOT synthesize.

#### Scenario: Replay after cache expiry

- **WHEN** the last clip has been evicted and the user runs `/speak replay`
- **THEN** the extension reports nothing to replay and makes no provider request

### Requirement: Status reporting

`/speak status` SHALL show the redacted configuration (voice identifier suffix only, model, format, player, limits), whether the API key is present without showing it, the current job state, and the cache location and size. It SHALL NOT make a provider request.

#### Scenario: Status shows no secret

- **WHEN** the user runs `/speak status` with an API key set
- **THEN** the output states the key is present and contains no part of its value

### Requirement: Secret and privacy handling

The extension SHALL read the API key only from the environment variable and SHALL NOT write it to configuration, cache, logs, notifications, process arguments, or the player's environment. Documentation SHALL state that prepared text is sent to ElevenLabs on each cache miss, that this tier is not a zero-retention guarantee, and that same-user processes and other Pi extensions run with the Pi process's permissions.

#### Scenario: Error output redaction

- **WHEN** a provider failure message would include the key or an authorization header
- **THEN** the displayed and logged message omits it

### Requirement: Deferred features are unavailable in this version

This version SHALL NOT provide `/speak summary`, `/speak cache-clear`, confirmation prompts for long text, secret-pattern blocking before transmission, or usage accounting. Running `/speak summary` or `/speak cache-clear` SHALL report that the feature is not available in this version and SHALL make no provider or model call and delete no files.

#### Scenario: Summary requested

- **WHEN** the user runs `/speak summary`
- **THEN** the extension reports the feature is unavailable in this version and makes no provider or model call

#### Scenario: Cache clear requested

- **WHEN** the user runs `/speak cache-clear`
- **THEN** the extension reports the feature is unavailable and deletes nothing
