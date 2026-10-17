# compaction-model Specification

## Purpose
Lets a Pi user choose, as a priority list, which models and thinking levels write compaction summaries, optionally letting the Jev decision model choose the thinking level, while the chat session keeps its own model.

## Requirements

### Requirement: Configured model writes compaction summaries
The compaction config SHALL list one or more summarizing models in priority order, each with its own optional thinking level. When at least one listed model can be used for the material, the system SHALL write the summary for every compaction trigger — manual `/compact`, the context threshold, and overflow recovery — with the first such model instead of the session model. Exactly one handler SHALL produce the summary, through one summarization, and every summary request it makes with that model (one, or two when the cut point splits a turn, plus any retries) SHALL go to that model. Summary content rules, the kept recent messages, custom `/compact` instructions, previous-summary updating, and the read and modified file lists carried from earlier compactions SHALL be the same as Pi's default compaction.

#### Scenario: Manual compaction uses the configured model
- **WHEN** the config lists `anthropic/claude-haiku-5-5` as its only model, the session model is `anthropic/claude-opus-5-5`, and the user runs `/compact`
- **THEN** every summary request goes to `anthropic/claude-haiku-5-5`, none goes to `anthropic/claude-opus-5-5`, and the resulting compaction entry keeps the same recent messages Pi's default compaction would keep

#### Scenario: Automatic compaction uses the configured model
- **WHEN** the context crosses the compaction threshold or overflows, the config lists a usable model, and the material fits that model
- **THEN** every summary request goes to that model

#### Scenario: Custom instructions are preserved
- **WHEN** the user runs `/compact focus on the database migration`
- **THEN** the summary request to the configured model includes those instructions

#### Scenario: File lists carry across extension-written compactions
- **WHEN** an earlier compaction in the session was written by this extension and recorded read and modified files, and the extension summarizes a second compaction
- **THEN** the second compaction's read and modified file lists include the files recorded by the first, as Pi's default compaction would

### Requirement: Session model and thinking level stay unchanged
The system SHALL NOT change the session's model or thinking level before, during, or after compaction, including when compaction fails or is cancelled.

#### Scenario: Next turn uses the session model
- **WHEN** a session on `anthropic/claude-opus-5-5` at `high` thinking compacts with a configured `anthropic/claude-sonnet-5-5`, or with a second listed model after the first failed
- **THEN** after compaction the session model is still `anthropic/claude-opus-5-5`, the thinking level is still `high`, and the next prompt is answered by `anthropic/claude-opus-5-5`

#### Scenario: Failed compaction leaves the session unchanged
- **WHEN** a configured model's request fails, every configured model fails, or the user cancels compaction
- **THEN** the session model and thinking level are the same as before compaction started

### Requirement: Configurable summary thinking level
The system SHALL use a model entry's `thinkingLevel` for the summary request to that model when it names a Pi thinking level (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`). When an entry's `thinkingLevel` is absent, the system SHALL use the session's current thinking level for that model. When the configured model does not support reasoning, no thinking level SHALL be applied and the notification SHALL say so.

#### Scenario: Explicit level
- **WHEN** the entry sets `thinkingLevel` to `low` and the session thinking level is `high`
- **THEN** the summary request uses thinking level `low`

#### Scenario: Level omitted
- **WHEN** the entry sets `model` but no `thinkingLevel`, and the session thinking level is `medium`
- **THEN** the summary request uses thinking level `medium`

#### Scenario: Each model has its own level
- **WHEN** the config lists Sonnet 5.5 at `medium` first and Haiku 5.5 at `low` second, and the second model is the one used
- **THEN** the summary request uses thinking level `low`

#### Scenario: Non-reasoning summarizer
- **WHEN** the model being used does not support reasoning
- **THEN** the summary request carries no thinking level, no Jev request is made in `auto` mode, and the notification says no reasoning was applied

### Requirement: Jev chooses the thinking level in auto mode
When an entry's `thinkingLevel` is `auto` and its model supports reasoning, the system SHALL ask the configured decision model (default `typesafe/jev-latest`) to choose one of `low`, `medium`, or `high` for the summary request, based on a bounded description of the material being summarized. The decision model SHALL be asked at most once per compaction, however many listed models use `auto`. The decision model SHALL NOT receive the request to write the summary. If the decision model is unavailable, unauthenticated, unsupported by the running Pi host, or does not finish successfully for a reason other than cancellation, the system SHALL compact with that entry's model at the session's thinking level.

#### Scenario: Jev picks a level
- **WHEN** the entry's `thinkingLevel` is `auto` and Jev answers `medium`
- **THEN** the summary request to that entry's model uses thinking level `medium`

#### Scenario: Jev unavailable
- **WHEN** the entry's `thinkingLevel` is `auto` and the classifier request fails or the host lacks classifier support
- **THEN** the summary request still goes to that entry's model, at the session's thinking level, and the notification says Jev was unavailable

### Requirement: Fallback through the priority list to default compaction
The system SHALL try the listed models in order. A model SHALL be skipped, and the next one tried, when it is not in Pi's model registry or is a virtual model; when credentials for it cannot be resolved; when the estimated size of the material to summarize plus the summary's output limit on that model exceeds its context window; or when its summary request fails after a small number of retries. Each skipped model SHALL show one notification naming the reason and the model tried next. The system SHALL leave compaction to Pi's default behavior (session model and thinking level) when the config file is absent, when the config is invalid, or when every listed model has been skipped. Every such fallback except an absent config file SHALL show a notification naming the reason.

#### Scenario: No config file
- **WHEN** `~/.pi/agent/compaction-model.json` does not exist
- **THEN** compaction behaves exactly as Pi's default and no notification is shown by the extension

#### Scenario: Invalid config
- **WHEN** the config is not valid JSON, `models` is not a non-empty array, an entry's `model` is not a `provider/modelId` string, `decisionModel` is not a `provider/modelId` string, or an entry's `thinkingLevel` is not a Pi thinking level or `auto`
- **THEN** Pi's default compaction runs and a warning names the invalid field, including which entry is wrong

#### Scenario: Unknown config key
- **WHEN** the config is otherwise valid but contains an unrecognized key such as `thinkinglevel`, at the top level or in an entry
- **THEN** compaction uses the listed models and a warning names the unrecognized key

#### Scenario: First model's request fails
- **WHEN** the first listed model's request still returns an error that is not a cancellation after its retries, and the second listed model is usable
- **THEN** a warning includes the error message and says the second model is tried next, and the second model writes the summary

#### Scenario: Unknown, virtual, or unauthenticated model is skipped
- **WHEN** a listed model is not in Pi's model registry, is a virtual model, or has no usable credentials, and a later listed model is usable
- **THEN** no request is sent to the skipped model, a warning names it and the reason, and the later model writes the summary

#### Scenario: Material too large for one model
- **WHEN** the session model has a 1M-token context, the material to summarize is estimated at 600K tokens, and the first listed model is `anthropic/claude-haiku-4-5` with a 200K-token context while the second has a 1M-token context
- **THEN** the first model is skipped with a notification that the material does not fit it, and the second model writes the summary

#### Scenario: Every listed model fails
- **WHEN** every listed model is skipped
- **THEN** Pi's default compaction runs with the session model, and the last warning says so

### Requirement: Claude bridge sessions are supported
The system SHALL apply the configured model to sessions whose model is served by `pi-claude-bridge`, including when the configured model is itself a `claude-bridge/...` model. When the bridge is loaded from the `extensions/pi-claude-bridge` submodule, the bridge SHALL NOT produce a second summary, and a compaction the configured model summarizes successfully SHALL send no summary request to the session model.

#### Scenario: Bridge session compacts with a bridge model
- **WHEN** the session model is `claude-bridge/claude-opus-5-5`, the config lists `claude-bridge/claude-haiku-5-5` as its first usable model, and the user runs `/compact`
- **THEN** every summary request goes to `claude-bridge/claude-haiku-5-5`, none goes to `claude-bridge/claude-opus-5-5`, and the session model is still `claude-bridge/claude-opus-5-5` afterwards

### Requirement: Codex sessions are left to pi-compact
The system SHALL NOT handle compaction for sessions whose model provider is `openai-codex`; those compactions SHALL proceed exactly as they would without this extension.

#### Scenario: Codex session
- **WHEN** the session model is `openai-codex/gpt-5.6-terra` and a valid config exists
- **THEN** the extension sends no summary or classifier request and shows no notification

### Requirement: Cancellation stops compaction
When the user cancels compaction while the extension is choosing a thinking level or the configured model is summarizing, or before a finished summary is handed back, the system SHALL cancel the compaction and SHALL NOT start a fallback summary request, including a request to the next listed model.

#### Scenario: User cancels during summary
- **WHEN** the user presses Escape while the configured model is writing the summary
- **THEN** compaction is cancelled, no compaction entry is appended, and no request is sent to the session model

#### Scenario: Cancelling does not try the next model
- **WHEN** the user presses Escape while the first listed model is writing the summary and a second model is listed
- **THEN** compaction is cancelled and no request is sent to the second model

#### Scenario: User cancels during the Jev decision
- **WHEN** the user presses Escape while Jev is choosing the thinking level
- **THEN** compaction is cancelled and no summary request is sent to any model

### Requirement: Compaction progress notification
Before the extension sends each summary request, the system SHALL show one notification saying the conversation is being compacted, naming the summarizing model, the thinking level that will be applied, whether Jev chose it, and that the compaction-model extension is doing it. It SHALL NOT be shown for a model that is skipped before its request, when compaction falls back to Pi's default, or when compaction is cancelled before the request starts. When the first model's request fails and the second is tried, the notification is shown again for the second request.

#### Scenario: Progress is announced before the summary request
- **WHEN** compaction uses `anthropic/claude-haiku-5-5` at `low`
- **THEN** the progress notification is shown before the summary request starts and names `anthropic/claude-haiku-5-5`, thinking `low`, and the compaction-model extension

#### Scenario: No progress notification when compaction falls back first
- **WHEN** the config is invalid, or the material does not fit any listed model
- **THEN** only the fallback warnings is shown, with no progress notification

### Requirement: Compaction outcome notification
For each compaction the extension summarizes, the system SHALL show one outcome notification, separate from any config warning, naming the summarizing model and the thinking level actually applied, and whether Jev chose it. No success notification SHALL be shown for a cancelled compaction.

#### Scenario: Notification for auto mode
- **WHEN** compaction uses `anthropic/claude-haiku-5-5` with Jev choosing `low`
- **THEN** exactly one outcome notification names `anthropic/claude-haiku-5-5`, thinking `low`, and that Jev chose it

### Requirement: Config is read at each compaction
The system SHALL read the config file when each compaction starts, so edits take effect at the next compaction without restarting Pi.

#### Scenario: Edit between compactions
- **WHEN** the user changes the first listed model from Haiku 5.5 to Sonnet 5.5 in the config file between two compactions in one session
- **THEN** the first compaction uses Haiku 5.5 and the second uses Sonnet 5.5
