# Spec Delta

## ADDED Requirements

### Requirement: Speech provider selection

The configuration SHALL select the speech provider with a top-level `provider`, either `elevenlabs` or `deepgram`, defaulting to `elevenlabs` when omitted. Each provider's voice and model settings SHALL be read only from its own block, `providers.elevenlabs` or `providers.deepgram`, so a voice configured for one provider is never sent to the other. `/speak provider <name>` SHALL override the configured provider until Pi restarts or reloads, or until `/speak provider reset`; `/speak provider` with no name SHALL report the effective provider and whether it is a session override. The extension SHALL NOT write the configuration file. Changing the provider SHALL NOT affect a job that is already running.

#### Scenario: Session override is not persisted

- **WHEN** the configuration selects `elevenlabs`, the user runs `/speak provider deepgram` and then `/speak text Hello`, and later restarts Pi
- **THEN** the speech before the restart uses the configured Deepgram voice, speech after the restart uses ElevenLabs, and the configuration file is unchanged

#### Scenario: Unknown provider name

- **WHEN** the user runs `/speak provider openai`
- **THEN** usage is shown, the effective provider is unchanged, and no request is made

#### Scenario: Reset returns to the file

- **WHEN** a session override is active and the user runs `/speak provider reset`
- **THEN** the next speech uses the provider named in the configuration file

### Requirement: Deepgram synthesis request

When Deepgram is the speech provider, on a cache miss the extension SHALL send one HTTPS request to the fixed production endpoint `https://api.deepgram.com/v1/speak` with the configured voice as `model`, MP3 encoding, a JSON body containing only the prepared text, and the header `Authorization: Token` carrying the key from `DEEPGRAM_API_KEY`. The destination and headers SHALL NOT be influenced by assistant or user text. Redirects SHALL be rejected. The request SHALL be bounded by the configured request deadline and the same maximum response size as ElevenLabs synthesis, and the result SHALL be accepted only if it is non-empty audio and not an error document. The extension SHALL NOT retry automatically, SHALL NOT substitute another voice or provider, and SHALL show sanitized errors for authentication, permission, voice, rate-limit, timeout, and server failures.

#### Scenario: Successful Deepgram synthesis

- **WHEN** Deepgram is selected and a valid request completes within the deadline with non-empty audio
- **THEN** the audio is stored in the cache under a key that includes the provider, and played

#### Scenario: Deepgram error document

- **WHEN** Deepgram responds with a JSON error body instead of audio
- **THEN** the body is not played or cached and a sanitized error is shown without the key

#### Scenario: No fallback to ElevenLabs

- **WHEN** a Deepgram request fails or times out
- **THEN** no ElevenLabs request is made and no retry occurs

### Requirement: Combined help for speak and voice input

`/speak help`, `/speak ?`, `/talk help`, and `/talk ?` SHALL show the same help: every `/speak` and `/talk` form, the two push-to-talk shortcuts registered at load and which one sends, what Escape does while a recording is starting, in progress, or held, and the effective speech locale (the session override when set, otherwise the configured value). Help SHALL read the configuration only from the local file, SHALL make no provider or model request, and SHALL work in every Pi run mode. If the configuration cannot be read, help SHALL still name the registered shortcuts and say the configuration has an error. An unknown `/speak` or `/talk` argument SHALL show this help.

#### Scenario: Help names the real shortcuts and locale

- **WHEN** the configuration sets `locale` to `ja` and `input.transcribeShortcut` to `ctrl+alt+t`, and the user runs `/speak help`
- **THEN** the help names `alt+t` as the send key, `ctrl+alt+t` as the transcribe-only key, and `ja` as the speech locale, and no request is made

#### Scenario: Talk help equals speak help

- **WHEN** the user runs `/talk help` and then `/speak help`
- **THEN** both show the same text, listing both commands' forms

#### Scenario: Question mark is help

- **WHEN** the user runs `/speak ?` or `/talk ?`
- **THEN** the combined help is shown, nothing is spoken or recorded, and no request is made

## MODIFIED Requirements

### Requirement: Command contract

The extension SHALL register one `/speak` command with these subcommands: no argument (speak the latest eligible answer in the effective locale), `original` (speak that answer without translation), `in <tag>` (speak that answer in the given locale, for this command only), `text <text>`, `stop`, `replay`, `status`, `quota` (read-only account lookup, not speech), `provider` with an optional `elevenlabs`, `deepgram`, or `reset` argument (session provider selection, not speech), `locale` with an optional tag or `reset` (session locale selection, not speech), and `help` or `?` (the combined help, not speech). Everything after `text` SHALL be treated as data, not as command syntax or shell input. An unknown subcommand SHALL display the combined help without any provider request.

#### Scenario: Unknown subcommand

- **WHEN** the user runs `/speak frobnicate`
- **THEN** the extension displays usage help and makes no provider request and starts no playback

#### Scenario: Text subcommand without content

- **WHEN** the user runs `/speak text` with no text or only whitespace
- **THEN** the extension displays usage help and makes no provider request and starts no playback

#### Scenario: Shell-looking text is data

- **WHEN** the user runs `/speak text $(touch /tmp/x); echo "hi" | cat`
- **THEN** the supplied characters are the text prepared for speech and no shell command is executed

#### Scenario: Provider subcommand makes no request

- **WHEN** the user runs `/speak provider deepgram`
- **THEN** the session override is set, no provider request is made, and no playback starts

#### Scenario: Locale subcommand makes no request

- **WHEN** the user runs `/speak locale en`, `/speak locale`, or `/speak locale reset`
- **THEN** the session locale is set, reported, or cleared, no provider or model request is made, and no playback starts

### Requirement: Configurable speech locale without changing the conversation

The extension SHALL accept a top-level speech `locale` setting defaulting to `vi` when omitted, canonicalize valid non-empty BCP-47 tags, and reject malformed values before network use. `/speak locale <tag>` SHALL set a session locale with the same validation and the same lifetime as the session provider overrides: it survives session switching, forking, and navigation, and ends on restart, reload, or `/speak locale reset`. The extension SHALL NOT write the configuration file. `/speak in <tag>` SHALL use a validated tag for that one invocation only. The effective locale of a job SHALL be the one-command tag, otherwise the session locale, otherwise the configured `locale`, fixed when the job starts. A malformed tag given to `locale` or `in` SHALL change nothing and make no request. `/speak` SHALL render the cleaned selected answer faithfully in the effective locale; it SHALL NOT modify Pi's displayed answer, conversation, system prompt, tools, or selected coding model. `/speak original` SHALL bypass translation. `/speak text` SHALL retain literal wording regardless of locale. Locale support depends on the configured models; no voice, model, or locale substitution is permitted on rejection.

#### Scenario: Default Vietnamese narration of English output

- **WHEN** locale is omitted and the user invokes `/speak` on an eligible English answer with translation configured
- **THEN** the speech text is faithfully rendered in Vietnamese while the displayed English answer and main session remain unchanged

#### Scenario: Explicit locale and invalid locale

- **WHEN** the user sets locale to a valid tag such as `en` or `vi-VN`
- **THEN** localized speech uses that canonical target; a malformed or empty locale instead fails before any request

#### Scenario: Original and literal escape paths

- **WHEN** translation is unconfigured and the user invokes `/speak original` or `/speak text Hello`
- **THEN** normal TTS preflight applies and no translation call is made; the locale does not rewrite the supplied or selected wording

#### Scenario: Session locale is not persisted

- **WHEN** the configuration sets `locale` to `vi`, the user runs `/speak locale en`, speaks an answer, and Pi is restarted
- **THEN** speech before the restart targets English, speech after it targets Vietnamese, and the configuration file is unchanged

#### Scenario: One-command locale

- **WHEN** the session locale is `en` and the user runs `/speak in ja`, then `/speak`
- **THEN** the first answer is spoken in Japanese and the second in English

#### Scenario: Malformed one-command locale

- **WHEN** the user runs `/speak in not_a_tag`
- **THEN** an error names the malformed tag, and no translation or speech request is made

### Requirement: Single hard length limit

The extension SHALL refuse to synthesize prepared text longer than the selected speech provider's ceiling: 10000 characters for ElevenLabs and 2000 characters for Deepgram. It SHALL state the length, the limit, and the provider, and SHALL NOT truncate the text, split it across several requests, substitute a summary, or switch provider. The configured `hardLimitChars` MAY lower either ceiling. For localized speech, the same effective limit applies separately to the cleaned source before translation and to the translated result before TTS, counting Unicode code points. Text at or below the limit SHALL proceed to remaining preflight checks without a confirmation prompt.

#### Scenario: Oversized answer

- **WHEN** ElevenLabs is selected and the prepared text is 10001 characters
- **THEN** the extension refuses, reports the length, limit, and provider, suggests supplying shorter text with `/speak text`, and makes no provider request

#### Scenario: Within limit

- **WHEN** ElevenLabs is selected and the prepared text is 10000 characters
- **THEN** the extension proceeds to preflight checks with no extra confirmation

#### Scenario: Deepgram ceiling

- **WHEN** Deepgram is selected and the prepared text is 2001 characters
- **THEN** the extension refuses with the Deepgram limit and makes no provider request

### Requirement: Preflight before any billable request

Before any billable speech or translation request the extension SHALL validate that the configuration is present and valid; that the selected provider's voice and model are explicitly set and not placeholders; that the selected provider's key (`ELEVENLABS_API_KEY` or `DEEPGRAM_API_KEY`) is available; and that the configured player command is executable. For localized speech with Deepgram, the language named by the voice identifier's final segment (for example `en` in `aura-2-thalia-en`) SHALL match the primary language of the target locale; otherwise the request SHALL be refused with a message naming both. A failed check SHALL produce a specific sanitized message and no provider or translation request.

#### Scenario: Player missing

- **WHEN** the configured player command cannot be found
- **THEN** the extension reports the missing player and makes no provider request

#### Scenario: Placeholder voice

- **WHEN** the configured voice identifier is the shipped placeholder value
- **THEN** the extension reports the configuration is incomplete and makes no provider request

#### Scenario: Missing key for the selected provider

- **WHEN** Deepgram is selected and `DEEPGRAM_API_KEY` is not set
- **THEN** the extension names that variable and makes no provider or translation request

#### Scenario: Deepgram voice cannot speak the target language

- **WHEN** Deepgram is selected with voice `aura-2-thalia-en`, the locale is `vi`, and the user runs `/speak`
- **THEN** the extension refuses before translating, names the voice language and the target locale, and suggests `/speak original` or another provider

### Requirement: Status reporting

`/speak status` SHALL show the redacted configuration (the effective speech provider and whether it is a session override, that provider's voice identifier suffix only, model, format, player, and limit), the effective input provider and whether it is a session override, the input language, whether each of `ELEVENLABS_API_KEY` and `DEEPGRAM_API_KEY` is present without showing it, whether a recording tool was found, the current job state, and the cache location and size. It SHALL also show the effective speech locale and whether it is a session override, the configured translation provider and model or their absence, and the configured translation thinking level or host default, without credentials. It SHALL NOT make a provider or model request.

#### Scenario: Status shows no secret

- **WHEN** the user runs `/speak status` with both API keys set
- **THEN** the output states both keys are present and contains no part of either value

#### Scenario: Status shows an override

- **WHEN** the user has run `/speak provider deepgram` and then runs `/speak status`
- **THEN** the output shows Deepgram as the speech provider and marks it as a session override

### Requirement: Secret and privacy handling

The extension SHALL read provider keys only from `ELEVENLABS_API_KEY` and `DEEPGRAM_API_KEY` and SHALL NOT write them to configuration, cache, logs, notifications, process arguments, or the player's environment. Documentation SHALL state that prepared text is sent to the selected speech provider on each cache miss, that neither provider's standard tier is a zero-retention guarantee, and that same-user processes and other Pi extensions run with the Pi process's permissions.

#### Scenario: Error output redaction

- **WHEN** a provider failure message would include either key or an authorization header
- **THEN** the displayed and logged message omits it

### Requirement: ElevenLabs synthesis request

When ElevenLabs is the speech provider, on a cache miss the extension SHALL send one HTTPS request to the fixed production ElevenLabs text-to-speech endpoint using the configured voice, an explicitly named model, and an explicit audio output format, authenticated with the API key from the environment. The destination and headers SHALL NOT be influenced by assistant or user text. Redirects SHALL be rejected. The request SHALL be bounded by a total deadline and a maximum response size, and the result SHALL be accepted only if it is nonempty audio and not an error document. The extension SHALL NOT retry a synthesis request automatically, SHALL NOT substitute another model, voice, or provider, and SHALL show sanitized errors for authentication, permission, voice or model, rate-limit, timeout, and server failures.

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

#### Scenario: Deepgram selected

- **WHEN** Deepgram is the speech provider
- **THEN** no ElevenLabs text-to-speech request is made

### Requirement: Idle-visible speech progress

During an active speech job in the interactive terminal, the extension SHALL display a separate, transient progress line near the editor even when the main agent is idle. It SHALL identify the current phase as Preparing, Translating, the name of the job's speech provider (ElevenLabs or Deepgram) during synthesis, or Playing, showing only phases actually entered. It SHALL preserve command responsiveness and SHALL NOT change the native Working/Whimsical indicator or persist progress in the conversation. It SHALL clear the line on completion, preflight refusal, failure, stop, and session/lifecycle cancellation. Late results from an old job SHALL NOT overwrite or clear a newer job's line. Rendering failures SHALL NOT prevent speech execution or cancellation.

#### Scenario: Waiting while the agent is idle

- **WHEN** the user starts localized speech with uncached translation and audio while the main agent is idle
- **THEN** the line shows Preparing, Translating, the job's speech provider name, and Playing as the corresponding work begins, without requiring an agent turn

#### Scenario: Bypass and cache paths

- **WHEN** original/literal speech, replay, or a cache hit skips translation or synthesis
- **THEN** the line omits phases for skipped work and clears when playback ends

#### Scenario: Terminal cleanup and stale jobs

- **WHEN** a job completes, is refused, fails, is stopped, or is cancelled by session navigation, and its pending result later settles
- **THEN** its progress line is removed and that old result cannot disturb a newer job's line

### Requirement: Content-addressed audio cache

The extension SHALL cache generated audio under a key derived from the canonical combination of the final outbound text, provider, voice identifier, model, output format, voice settings (none are sent in this version), a text-normalizer version, the provider's voice revision (the user-controlled `voiceRevision` for ElevenLabs; Deepgram has no voice revision and contributes a fixed value), and the canonical speech locale (or an `original` discriminator for original/explicit-text modes). The API key SHALL NOT be part of the key. The cache SHALL live in a private per-user directory outside any repository, with owner-only permissions, atomic completion of files, rejection of non-regular or symlinked entries, a retention period of seven days, and a total size cap of 100 MiB with eviction that never removes a clip currently playing. The extension SHALL NOT keep source text in a plaintext index.

#### Scenario: Cache hit makes no provider call

- **WHEN** the same prepared text is spoken again with an unchanged voice, model, format, and settings
- **THEN** the cached audio is played and no TTS request is made; localized requests also skip inference when their translation-cache entry exists

#### Scenario: Changed voice or model misses

- **WHEN** the configured voice, model, output format, or voice revision changes
- **THEN** the previous clip is not reused and a new synthesis is required

#### Scenario: Provider change misses

- **WHEN** the same text was cached with ElevenLabs and is then spoken with Deepgram
- **THEN** the ElevenLabs clip is not reused and Deepgram synthesis is required

#### Scenario: Eviction spares active clip

- **WHEN** the size cap is exceeded while a clip is playing
- **THEN** eviction removes other clips and never the playing clip

### Requirement: Bounded cancellable translation

Translation SHALL belong to the existing single speech job, with a 45-second total deadline, a finite output-token cap no greater than 8192, and at most one model request per translation-cache miss. Empty, errored, aborted, truncated, tool-call, or unsupported content SHALL be rejected, as SHALL output above the effective hard character limit for the job's speech provider. Normally completed responses MAY contain thinking alongside text: only the text blocks in order SHALL be used, and thinking/signatures SHALL NOT be logged, cached, persisted, or sent to TTS. Thinking-only results SHALL be rejected. Failure SHALL produce a sanitized error without TTS, retry, model substitution, or original-language fallback. `/speak stop` and lifecycle cancellation SHALL abort translation without aborting the coding agent. Late responses SHALL NOT cache text, initiate TTS/playback, or mutate newer jobs. Configuration, including the speech provider, SHALL be captured per invocation.

#### Scenario: Translation fails or expands beyond the limit

- **WHEN** translation times out, returns an invalid result, or exceeds the hard character limit
- **THEN** the extension reports failure and makes zero TTS calls, without splitting, truncating, retrying, or summarizing

#### Scenario: Reasoning is never spoken

- **WHEN** a normally completed translation contains thinking blocks and translated text blocks
- **THEN** only the translated text reaches the translation cache and the job's speech provider; a result containing only thinking instead fails without TTS

#### Scenario: Stop or branch navigation during translation

- **WHEN** a translation is in progress and the user stops speech or navigates branches
- **THEN** it is aborted; any late result is ignored and cannot start synthesis or alter the new context

### Requirement: Evidence-backed translation failure reporting

For a failure of the active localized speech job, the extension SHALL display one sanitized notification distinguishing observed setup, deadline, provider-reported error/abort, truncation, unsupported content, missing usable text, code markup, or output-length failure. When reliable evidence does not establish a cause, it SHALL report an unknown failure rather than guessing authentication, rate limit, offline state, or transport failure. It SHALL state that no text was sent to the job's speech provider, naming it, and preserve inference-billing uncertainty when inference may have started. It SHALL NOT retry, switch models, or change configuration automatically.

The extension SHALL attempt to store exactly one bounded, metadata-only failure record in the originating Pi session, correlated to that notification by a diagnostic ID. Records SHALL contain a stable category and operation stage, timing, configured model/locale/settings identifiers, whether inference started, and observed stop reason and structural content counts when available. HTTP status SHALL be included only when available as reliable structured evidence. Records SHALL NOT contain source or translated text, source hashes, reasoning/signatures, credentials, headers, raw errors, or provider payloads. They SHALL NOT enter the main model conversation or start an agent turn. Failed persistence SHALL NOT hide or replace the original failure or claim a record was saved. Stopped, cancelled, stale, and session-replaced jobs SHALL produce no failure notification or record.

#### Scenario: Truncated translation is identifiable

- **WHEN** the active translation returns a token-limit stop reason
- **THEN** the notification identifies incomplete output, the correlated record contains the observed stop reason and available structural counts, and zero TTS calls, retries, or model changes occur

#### Scenario: Provider error versus unknown exception

- **WHEN** translation returns a provider-reported error or throws an exception without reliable structured cause
- **THEN** the notification and record distinguish the observed provider error from an unknown failure, omit raw error text and payloads, preserve possible inference-billing uncertainty, and make no TTS call

#### Scenario: Empty or unsupported result

- **WHEN** translation completes with no usable text, thinking-only output, code markup, or unsupported/tool content
- **THEN** the notification identifies the corresponding validation failure and the record retains structural counts without storing any text, reasoning, or tool arguments

#### Scenario: Failure recording is best effort

- **WHEN** saving a failure entry throws
- **THEN** the original sanitized failure remains visible once, no saved-record claim appears, and no additional provider call or agent turn starts

#### Scenario: Cancellation and session replacement stay silent

- **WHEN** speech is stopped or its session is replaced before a translation failure or late result settles
- **THEN** no failure notification or diagnostic record is emitted in either session and newer jobs are not affected

#### Scenario: Failure names the selected provider

- **WHEN** Deepgram is the speech provider and translation fails
- **THEN** the notification states that no text was sent to Deepgram
