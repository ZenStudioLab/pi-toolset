# manual-speech Specification

## Purpose
Lets a Pi user explicitly ask for a completed assistant answer, or text they supply, to be spoken in their own authorized cloned voice, while keeping the speech extension silent and free of provider spend during all other Pi activity. The locale amendment renders answer-based speech in a configurable target language without changing Pi's written conversation.

## Requirements

### Requirement: Speech occurs only on explicit request

The extension SHALL start translation, speech generation, summarization, or playback only as the direct result of the user running a `/speak` subcommand that produces speech, or, while the user has live mode on, of the model calling the `speak_aloud` tool or of an agent run ending, whose answer is then read aloud, as the `voice-conversation` capability defines. Loading, reloading, session start, ordinary prompts, execution of any tool other than `speak_aloud` in live mode, agent completion while live mode is off, and any other lifecycle event SHALL NOT initiate a provider request, a model call, or playback. Lifecycle events MAY cancel or clean up this extension's own work.

#### Scenario: Silent startup and agent activity

- **WHEN** Pi starts or reloads with the extension loaded, and the user then submits prompts that complete with assistant answers and tool calls
- **THEN** no ElevenLabs request is made, no model call is made by the extension, and no audio is played

#### Scenario: Missing configuration does not block Pi

- **WHEN** the configuration file or API key is absent at startup
- **THEN** Pi starts normally and the problem is reported only when the user runs `/speak` or `/speak status`

#### Scenario: Speech without live mode

- **WHEN** live mode is off and an agent run completes with an answer
- **THEN** nothing is synthesized or played until the user runs a `/speak` subcommand that produces speech

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

### Requirement: Supported run mode

The extension SHALL perform speech only in an interactive terminal session. In any other Pi run mode it SHALL report that speech is unsupported without making a provider request or starting playback.

#### Scenario: Non-terminal mode

- **WHEN** `/speak` is invoked in a Pi run mode that is not the interactive terminal
- **THEN** the extension reports the mode is unsupported and neither synthesizes nor plays audio

### Requirement: Answer selection from the active branch

For `/speak` with no argument and `/speak original`, the extension SHALL require the main agent to be idle with no queued work, and SHALL select the text of the latest finalized assistant answer belonging to the most recent user turn on the current session's active transcript branch. Selection SHALL remain available after compaction or resuming that session, including when model context no longer contains the original user turn or answer; only original transcript answer text SHALL be spoken, never a generated summary or context-only replacement. Selection SHALL remain within both the current project (session working directory) and current session; a resumed session from another project SHALL be refused. It SHALL use only the answer's text blocks, in order. It SHALL exclude thinking, tool calls and results, images, system messages, compaction summaries, and content from abandoned branches. It SHALL NOT search another session or fall back to an older answer when the latest turn is unanswered, failed, aborted, truncated, or otherwise has no eligible answer.

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

#### Scenario: Compaction retains only a suffix or summary

- **WHEN** the current session's latest completed turn remains in its active transcript branch but compaction omits its user message, its answer, or both from model context
- **THEN** an explicit idle `/speak` or `/speak original` selects that original completed answer, not the compaction summary

#### Scenario: Resume a compacted session without a new turn

- **WHEN** the user resumes the same project's saved session and requests speech while idle before submitting another prompt
- **THEN** selection uses that resumed session's active branch and latest completed answer, without relying on an in-memory answer saved before restart

#### Scenario: Failed latest turn survives only in transcript history

- **WHEN** compaction hides a latest aborted, errored, truncated, or tool-only answer, or a latest unanswered user turn, while an older successful answer remains in history
- **THEN** the extension reports the latest turn's ineligibility and speaks nothing; it does not skip to the older answer

#### Scenario: Empty session and project mismatch

- **WHEN** the current session has no user turn, or the resumed session belongs to a different project working directory
- **THEN** the extension reports the corresponding refusal and makes no speech or translation request; it does not locate another session

### Requirement: Deterministic text preparation for answers

For answer-based speech the extension SHALL perform the cleanup stage without a model call, before any optional translation stage: remove fenced and indented code blocks, unfenced command output (shell prompt lines, diffs, stack frames, and one-line JSON objects), commit hashes, image syntax, and HTML markup; keep link labels and omit destinations; keep readable inline identifiers; strip terminal escape sequences without damaging ordinary Unicode; and preserve numbers, dates, versions, negation, and qualifications. It SHALL NOT summarize or reinterpret content. If no speakable prose remains it SHALL report that and make no provider request.

#### Scenario: Code-only answer

- **WHEN** the selected answer consists only of a fenced code block
- **THEN** the extension reports there is nothing speakable and makes no provider request

#### Scenario: Unfenced command output and hashes are not spoken

- **WHEN** the answer contains a line starting `$ yarn test`, an unfenced diff, a stack frame ending in `path:line:column`, a one-line JSON object, or a 7-40 character hexadecimal hash containing both a digit and a letter
- **THEN** the prepared text omits them while keeping dollar amounts, plain words made of hexadecimal letters, all-digit numbers, and indented times after `at`

#### Scenario: Meaning-sensitive content is preserved

- **WHEN** the answer says "the test did not pass on version 1.2.3 on 2026-10-02"
- **THEN** the prepared text still contains the negation, the version, and the date unchanged

### Requirement: Explicit text preserves wording

For `/speak text <text>` the extension SHALL send the supplied wording unchanged apart from documented whitespace and control-character normalization, and SHALL NOT apply answer cleanup rules.

#### Scenario: Supplied markdown is not rewritten

- **WHEN** the user runs `/speak text Use **bold** here`
- **THEN** the text sent for synthesis equals the supplied wording after normalization only

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

### Requirement: Single job and responsive stop

The extension SHALL allow at most one speech job per Pi process; a second speak request while a job is active SHALL be rejected with a message and SHALL NOT queue or start another provider request. Live-mode updates from the `speak_aloud` tool, and the parts of an answer read aloud, are the one exception: they wait in order behind the update being spoken, as the `voice-conversation` capability defines, and `/speak` requests that produce speech are refused while live mode is on. The `/speak` handler SHALL return control to Pi promptly after starting the job rather than waiting for playback to finish, so that `/speak stop` can run during generation and during playback. `/speak stop` SHALL cancel only this extension's in-flight generation and terminate only its own tracked player process, and SHALL NOT abort the coding agent or affect other audio processes; while live mode is on it SHALL also drop every waiting live update. A cancelled job SHALL NOT later start playback or alter the state of a newer job.

#### Scenario: Stop during generation

- **WHEN** a synthesis request is in flight and the user runs `/speak stop`
- **THEN** the request is aborted, no playback starts when the cancelled request would have completed, no partial or temporary audio remains in the cache, and the coding agent is not aborted

#### Scenario: Stop during playback

- **WHEN** audio is playing and the user runs `/speak stop`
- **THEN** only the extension's player process ends and unrelated audio continues

#### Scenario: Duplicate request

- **WHEN** a job is active and the user runs `/speak` again
- **THEN** the extension reports that speech is already active and starts no second job

#### Scenario: Stop during live mode

- **WHEN** live mode is on, an update is playing, another is waiting, and the user runs `/speak stop`
- **THEN** playback ends, the waiting update is dropped, and live mode stays on

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

### Requirement: Replay never regenerates

`/speak replay` SHALL play the last valid cached clip for the current session and branch and SHALL make no provider or model call. If no valid clip exists it SHALL report that and SHALL NOT synthesize.

#### Scenario: Replay after cache expiry

- **WHEN** the last clip has been evicted and the user runs `/speak replay`
- **THEN** the extension reports nothing to replay and makes no provider request

### Requirement: Status reporting

`/speak status` SHALL show the redacted configuration (the effective speech provider and whether it is a session override, that provider's voice identifier suffix only, model, format, player, and limit), the effective input provider and whether it is a session override, the input language, whether each of `ELEVENLABS_API_KEY` and `DEEPGRAM_API_KEY` is present without showing it, whether a recording tool was found, the current job state, and the cache location and size. It SHALL also show the effective speech locale and whether it is a session override, the configured translation provider and model or their absence, and the configured translation thinking level or host default, without credentials. It SHALL NOT make a provider or model request.

#### Scenario: Status shows no secret

- **WHEN** the user runs `/speak status` with both API keys set
- **THEN** the output states both keys are present and contains no part of either value

#### Scenario: Status shows an override

- **WHEN** the user has run `/speak provider deepgram` and then runs `/speak status`
- **THEN** the output shows Deepgram as the speech provider and marks it as a session override

### Requirement: Provider quota and cost visibility

On explicit `/speak quota`, the extension SHALL make one authenticated GET to the fixed ElevenLabs `/v1/user/subscription` endpoint and report account-wide credits used, allowance, remaining credits, usage percentage when defined, and reset date in UTC when available. It SHALL show valid provider-reported current overage and next invoice with their currencies, label missing optional values unavailable, and SHALL NOT estimate per-speech prices, PAYG balance/total spend, or extension-only usage. Required allowance fields SHALL be nonnegative safe integers; invalid data SHALL fail rather than invent figures. Remaining credits SHALL be clamped to zero with any excess usage separately reported.

The query SHALL require only the environment API key, not speech configuration, a player, translation setup, or an idle agent. It SHALL work independently of speech in modes with notification support, leave speech/progress untouched, return control promptly, suppress duplicate lookups, and cancel/silence stale results on session cleanup. It SHALL have a 10-second total deadline, a 64 KiB response cap, reject redirects, and perform no retries. Missing keys and provider/transport failures SHALL produce sanitized feedback without raw response/error bodies or credentials. HTTP failures SHALL retain the HTTP status and MAY show only bounded token-shaped `detail.type`, `detail.code` and legacy `detail.status` from at most 4 KiB of error JSON, excluding the API key. Known structured codes SHALL distinguish missing endpoint access from authentication failure; HTTP 401 alone SHALL NOT assert an invalid key. Invalid, oversized or unreadable error bodies SHALL retain HTTP evidence with an unconfirmed cause. It SHALL NOT synthesize, translate, play, poll, mutate billing, access the audio cache, or persist account data. Loading and `/speak status` SHALL remain network-free.

#### Scenario: Account quota and billing figures

- **WHEN** the provider returns valid allowance, reset, overage and next-invoice fields
- **THEN** the command shows derived remaining credits and usage percentage plus those provider-reported billing figures without attributing usage to this extension or estimating per-speech cost

#### Scenario: Missing optional billing fields or zero allowance

- **WHEN** the response omits billing/reset data or reports a zero allowance
- **THEN** missing values and undefined usage percentage are labeled unavailable, not guessed as zero; excess usage is still reported

#### Scenario: Missing key or failed lookup

- **WHEN** the key is absent, or the lookup fails, times out, redirects, exceeds the response cap, or contains invalid allowance fields
- **THEN** sanitized feedback appears with no retry, guessed quota, raw provider data, speech or billing mutation

#### Scenario: Structured quota rejection versus unexplained 401

- **WHEN** a quota request returns HTTP 401 with a structured missing-permissions or invalid-key code, or with an absent/invalid error body
- **THEN** the notification shows the safe provider identifiers and code-specific guidance when available; otherwise it retains HTTP 401 with an unconfirmed cause, never echoing provider message text, credentials or raw payloads

#### Scenario: Independent lookup and cleanup

- **WHEN** quota is requested during speech or outside TUI mode, repeated while pending, or its session is replaced before completion
- **THEN** speech remains unchanged and commands stay responsive; only one quota request runs, and replaced-session results are silent

### Requirement: Secret and privacy handling

The extension SHALL read provider keys only from `ELEVENLABS_API_KEY` and `DEEPGRAM_API_KEY` and SHALL NOT write them to configuration, cache, logs, notifications, process arguments, or the player's environment. Documentation SHALL state that prepared text is sent to the selected speech provider on each cache miss, that neither provider's standard tier is a zero-retention guarantee, and that same-user processes and other Pi extensions run with the Pi process's permissions.

#### Scenario: Error output redaction

- **WHEN** a provider failure message would include either key or an authorization header
- **THEN** the displayed and logged message omits it

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

### Requirement: Explicitly configured isolated translation

Localized speech SHALL require an explicitly configured translation provider/model resolved through Pi's authenticated model registry. There SHALL be no implicit use of the main coding model. Optional `translation.thinking` SHALL accept only the host's native `minimal`, `low`, `medium`, `high`, `xhigh`, or `max` levels and be passed as the isolated request's `reasoning` option; omission SHALL retain the host default and SHALL NOT inherit the main session's thinking. Invalid values SHALL fail before any request. Before inference, validate source length, TTS configuration/key, player, locale, and translation model/authentication. Only the cleaned selected answer and translation instructions SHALL enter a separate tool-free call; source content is data, not instructions. Preserve meaning, negation, uncertainty, numbers, versions, identifiers, and qualifications without summarizing or inventing claims. Even already-target-language input MAY use this single rendering call; no separate detection request is made. Credentials SHALL NOT enter config, notifications, cache, or player arguments.

#### Scenario: Missing model is not an English fallback

- **WHEN** `/speak` is invoked without a configured or authenticated translation model
- **THEN** the extension reports translation setup is missing, suggests the original/literal paths, and performs neither inference nor TTS

#### Scenario: Source isolation and faithful translation

- **WHEN** a selected answer contains negation, version numbers, and instructions to inspect the repository
- **THEN** the model receives only that cleaned answer as data and the translation instruction, has no tools, preserves the qualifications and identifiers, and receives no other session or repository content

#### Scenario: Explicit translation thinking

- **WHEN** translation is configured as `openai-codex/gpt-6-luna` with thinking `medium`
- **THEN** the isolated model call uses reasoning `medium`, status reports that setting, and neither Pi's coding model nor its thinking setting changes

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

### Requirement: Session-scoped translation cache

The extension SHALL retain at most 32 valid completed translations in session memory, evicting the oldest entry when full. Keys SHALL include cleaned-source hash, canonical locale, translation provider/model, generation settings (including configured thinking), prompt version, and normalizer version. No source or translation text SHALL be persisted. Session replacement or branch navigation SHALL clear this cache. Canceled or invalid results SHALL NOT be stored; a valid completed translation MAY be reused after a later TTS failure. Audio identity SHALL include final outbound text and speech locale alongside existing TTS inputs. `/speak replay` SHALL play the previous clip unchanged even after locale edits, without any model or TTS call.

#### Scenario: Same-context repeat avoids both charges

- **WHEN** source, locale, model/settings, and TTS inputs are unchanged and both translation and audio entries are available
- **THEN** the repeated `/speak` uses them with zero model and TTS calls

#### Scenario: Locale or translation model changes

- **WHEN** locale or translation model/settings changes
- **THEN** the prior translation is not reused; localized audio for a different locale is not reused, while explicit replay still plays the last valid clip without a request

#### Scenario: Translation entry no longer available

- **WHEN** its translation entry is evicted or the session restarts
- **THEN** a fresh explicit `/speak` may require one new translation call before audio lookup; no cross-restart zero-inference guarantee is claimed and no automatic call occurs

### Requirement: Deferred features are unavailable in this version

This version SHALL NOT provide `/speak summary`, `/speak cache-clear`, confirmation prompts for long text, secret-pattern blocking before transmission, or local usage accounting (the explicit provider quota lookup is separate). Running `/speak summary` or `/speak cache-clear` SHALL report that the feature is not available in this version and SHALL make no provider or model call and delete no files.

#### Scenario: Summary requested

- **WHEN** the user runs `/speak summary`
- **THEN** the extension reports the feature is unavailable in this version and makes no provider or model call

#### Scenario: Cache clear requested

- **WHEN** the user runs `/speak cache-clear`
- **THEN** the extension reports the feature is unavailable and deletes nothing

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

`/speak help`, `/speak ?`, `/talk help`, and `/talk ?` SHALL show the same help: every `/speak` and `/talk` form, every push-to-talk shortcut registered at load and its mode (send, transcribe only, command, or skill), Space when `input.holdSpace` is on (and that typing another key during a hold discards the recording), that a spoken command's result goes into the editor with the draft as its arguments and that Pi's interactive commands need an alias and an empty editor, what Escape does while a recording is starting, in progress, or held, and the effective speech locale (the session override when set, otherwise the configured value). Help SHALL read the configuration only from the local file, SHALL make no provider or model request, and SHALL work in every Pi run mode. If the configuration cannot be read, help SHALL still name the registered shortcuts and say the configuration has an error. An unknown `/speak` or `/talk` argument SHALL show this help.

#### Scenario: Help names the real shortcuts and locale

- **WHEN** the configuration sets `locale` to `ja` and `input.transcribeShortcut` to `ctrl+alt+t`, and the user runs `/speak help`
- **THEN** the help names `alt+t` as the send key, `ctrl+alt+t` as the transcribe-only key, and `ja` as the speech locale, and no request is made

#### Scenario: Talk help equals speak help

- **WHEN** the user runs `/talk help` and then `/speak help`
- **THEN** both show the same text, listing both commands' forms

#### Scenario: Question mark is help

- **WHEN** the user runs `/speak ?` or `/talk ?`
- **THEN** the combined help is shown, nothing is spoken or recorded, and no request is made
