# Spec Delta

## Purpose

Lets pi agents set the visible session title from opsx prompts so parallel proposal and apply sessions stay navigable.

## ADDED Requirements

### Requirement: Agent-callable session rename tool
The system SHALL provide a model-callable tool `session_rename` that sets the session display name to the supplied kebab-case change name.

#### Scenario: Rename succeeds
- **WHEN** agent calls `session_rename` with name `add-foo-bar`
- **THEN** `pi.getSessionName()` returns `add-foo-bar` and tool result contains `Session name set: add-foo-bar`

#### Scenario: Empty name rejected
- **WHEN** agent calls `session_rename` with empty or whitespace-only name
- **THEN** tool returns an error, session name is unchanged, and no `session_info` entry is appended

#### Scenario: Newlines sanitized
- **WHEN** agent calls `session_rename` with embedded CR/LF
- **THEN** stored name has newlines replaced with space and trimmed, matching `appendSessionInfo` behavior

### Requirement: Opsx prompt rename points mirror opencode
The system SHALL invoke `session_rename` at three points: propose claim after name-final, propose re-affirm after artifacts done, and apply entry after change resolved.

#### Scenario: Propose claims title
- **WHEN** `opsx-propose` finalizes a new or reused change name
- **THEN** agent calls `session_rename` with that name before generating artifacts

#### Scenario: Propose re-affirms title
- **WHEN** `opsx-propose` finishes all artifacts
- **THEN** agent calls `session_rename` again with the same change name

#### Scenario: Apply sets title on entry
- **WHEN** `opsx-apply` resolves the target change name
- **THEN** agent calls `session_rename` with that name before implementing tasks

### Requirement: Tool availability default-active
The system SHALL register `session_rename` as a `direct` default-active tool so it is callable from opsx prompts without extra activation wiring. Kebab-case remains prompt guidance, not tool-enforced validation.

#### Scenario: Opsx availability
- **WHEN** opsx propose or apply runs
- **THEN** `session_rename` is in the active tool set and callable for that run
