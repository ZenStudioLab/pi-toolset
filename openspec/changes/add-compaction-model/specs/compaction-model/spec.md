# Spec Delta

## Purpose

Lets a Pi user choose which model and thinking level write compaction summaries, optionally letting the Jev decision model choose the thinking level, while the chat session keeps its own model.

## ADDED Requirements

### Requirement: Configured model writes compaction summaries
When the compaction config names a valid model and the material fits that model, the system SHALL write the summary for every compaction trigger — manual `/compact`, the context threshold, and overflow recovery — with that model instead of the session model. Exactly one handler SHALL produce the summary, through one summarization, and every summary request it makes (one, or two when the cut point splits a turn, plus any retries) SHALL go to the configured model. Summary content rules, the kept recent messages, custom `/compact` instructions, previous-summary updating, and the read and modified file lists carried from earlier compactions SHALL be the same as Pi's default compaction.

#### Scenario: Manual compaction uses the configured model
- **WHEN** the config sets `model` to `anthropic/claude-haiku-5-5`, the session model is `anthropic/claude-opus-5-5`, and the user runs `/compact`
- **THEN** every summary request goes to `anthropic/claude-haiku-5-5`, none goes to `anthropic/claude-opus-5-5`, and the resulting compaction entry keeps the same recent messages Pi's default compaction would keep

#### Scenario: Automatic compaction uses the configured model
- **WHEN** the context crosses the compaction threshold or overflows, the config names a valid model, and the material fits that model
- **THEN** every summary request goes to the configured model

#### Scenario: Custom instructions are preserved
- **WHEN** the user runs `/compact focus on the database migration`
- **THEN** the summary request to the configured model includes those instructions

#### Scenario: File lists carry across extension-written compactions
- **WHEN** an earlier compaction in the session was written by this extension and recorded read and modified files, and the extension summarizes a second compaction
- **THEN** the second compaction's read and modified file lists include the files recorded by the first, as Pi's default compaction would

### Requirement: Session model and thinking level stay unchanged
The system SHALL NOT change the session's model or thinking level before, during, or after compaction, including when compaction fails or is cancelled.

#### Scenario: Next turn uses the session model
- **WHEN** a session on `anthropic/claude-opus-5-5` at `high` thinking compacts with a configured `anthropic/claude-sonnet-5-5`
- **THEN** after compaction the session model is still `anthropic/claude-opus-5-5`, the thinking level is still `high`, and the next prompt is answered by `anthropic/claude-opus-5-5`

#### Scenario: Failed compaction leaves the session unchanged
- **WHEN** the configured model's request fails or the user cancels compaction
- **THEN** the session model and thinking level are the same as before compaction started

### Requirement: Configurable summary thinking level
The system SHALL use the config's `thinkingLevel` for the summary request when it names a Pi thinking level (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`). When `thinkingLevel` is absent, the system SHALL use the session's current thinking level. When the configured model does not support reasoning, no thinking level SHALL be applied and the notification SHALL say so.

#### Scenario: Explicit level
- **WHEN** the config sets `thinkingLevel` to `low` and the session thinking level is `high`
- **THEN** the summary request uses thinking level `low`

#### Scenario: Level omitted
- **WHEN** the config sets `model` but no `thinkingLevel`, and the session thinking level is `medium`
- **THEN** the summary request uses thinking level `medium`

#### Scenario: Non-reasoning summarizer
- **WHEN** the configured model does not support reasoning
- **THEN** the summary request carries no thinking level, no Jev request is made in `auto` mode, and the notification says no reasoning was applied

### Requirement: Jev chooses the thinking level in auto mode
When `thinkingLevel` is `auto` and the configured model supports reasoning, the system SHALL ask the configured decision model (default `typesafe/jev-latest`) to choose one of `low`, `medium`, or `high` for the summary request, based on a bounded description of the material being summarized. The decision model SHALL NOT receive the request to write the summary. If the decision model is unavailable, unauthenticated, unsupported by the running Pi host, or does not finish successfully for a reason other than cancellation, the system SHALL compact with the configured model at the session's thinking level.

#### Scenario: Jev picks a level
- **WHEN** `thinkingLevel` is `auto` and Jev answers `medium`
- **THEN** the summary request to the configured model uses thinking level `medium`

#### Scenario: Jev unavailable
- **WHEN** `thinkingLevel` is `auto` and the classifier request fails or the host lacks classifier support
- **THEN** the summary request still goes to the configured model, at the session's thinking level, and the notification says Jev was unavailable

### Requirement: Fallback to default compaction
The system SHALL leave compaction to Pi's default behavior (session model and thinking level) when any of these holds: the config file is absent; the config is invalid; the configured model is not in Pi's model registry or is a virtual model; credentials for the configured model cannot be resolved; the estimated size of the material to summarize plus the summary's output limit on the configured model exceeds that model's context window; or the configured model's summary request fails after a small number of retries. Every fallback except an absent config file SHALL show a notification naming the reason.

#### Scenario: No config file
- **WHEN** `~/.pi/agent/compaction-model.json` does not exist
- **THEN** compaction behaves exactly as Pi's default and no notification is shown by the extension

#### Scenario: Invalid config
- **WHEN** the config is not valid JSON, `model` is not a `provider/modelId` string, `decisionModel` is not a `provider/modelId` string, or `thinkingLevel` is not a Pi thinking level or `auto`
- **THEN** Pi's default compaction runs and a warning names the invalid field

#### Scenario: Unknown config key
- **WHEN** the config is otherwise valid but contains an unrecognized key such as `thinkinglevel`
- **THEN** compaction uses the configured model and a warning names the unrecognized key

#### Scenario: Unknown, virtual, or unauthenticated model
- **WHEN** the configured model is not in Pi's model registry, is a virtual model, or has no usable credentials
- **THEN** Pi's default compaction runs and a warning names the model and the reason

#### Scenario: Material too large for the configured model
- **WHEN** the session model has a 1M-token context, the material to summarize is estimated at 600K tokens, and the configured model is `anthropic/claude-haiku-4-5` with a 200K-token context
- **THEN** Pi's default compaction runs with the session model and a notification says the material does not fit the configured model

#### Scenario: Summary request fails
- **WHEN** the configured model's request still returns an error that is not a cancellation after its retries
- **THEN** Pi's default compaction runs and a warning includes the error message

### Requirement: Claude bridge sessions are supported
The system SHALL apply the configured model to sessions whose model is served by `pi-claude-bridge`, including when the configured model is itself a `claude-bridge/...` model. When the bridge is loaded from the `extensions/pi-claude-bridge` submodule, the bridge SHALL NOT produce a second summary, and a compaction the configured model summarizes successfully SHALL send no summary request to the session model.

#### Scenario: Bridge session compacts with a bridge model
- **WHEN** the session model is `claude-bridge/claude-opus-5-5`, the config sets `model` to `claude-bridge/claude-haiku-5-5`, and the user runs `/compact`
- **THEN** every summary request goes to `claude-bridge/claude-haiku-5-5`, none goes to `claude-bridge/claude-opus-5-5`, and the session model is still `claude-bridge/claude-opus-5-5` afterwards

### Requirement: Codex sessions are left to pi-compact
The system SHALL NOT handle compaction for sessions whose model provider is `openai-codex`; those compactions SHALL proceed exactly as they would without this extension.

#### Scenario: Codex session
- **WHEN** the session model is `openai-codex/gpt-5.6-terra` and a valid config exists
- **THEN** the extension sends no summary or classifier request and shows no notification

### Requirement: Cancellation stops compaction
When the user cancels compaction while the extension is choosing a thinking level or the configured model is summarizing, or before a finished summary is handed back, the system SHALL cancel the compaction and SHALL NOT start a fallback summary request.

#### Scenario: User cancels during summary
- **WHEN** the user presses Escape while the configured model is writing the summary
- **THEN** compaction is cancelled, no compaction entry is appended, and no request is sent to the session model

#### Scenario: User cancels during the Jev decision
- **WHEN** the user presses Escape while Jev is choosing the thinking level
- **THEN** compaction is cancelled and no summary request is sent to any model

### Requirement: Compaction outcome notification
For each compaction the extension summarizes, the system SHALL show one outcome notification, separate from any config warning, naming the summarizing model and the thinking level actually applied, and whether Jev chose it. No success notification SHALL be shown for a cancelled compaction.

#### Scenario: Notification for auto mode
- **WHEN** compaction uses `anthropic/claude-haiku-5-5` with Jev choosing `low`
- **THEN** exactly one outcome notification names `anthropic/claude-haiku-5-5`, thinking `low`, and that Jev chose it

### Requirement: Config is read at each compaction
The system SHALL read the config file when each compaction starts, so edits take effect at the next compaction without restarting Pi.

#### Scenario: Edit between compactions
- **WHEN** the user changes `model` from Haiku 5.5 to Sonnet 5.5 in the config file between two compactions in one session
- **THEN** the first compaction uses Haiku 5.5 and the second uses Sonnet 5.5
