# Proposal

## Why

Parallel OpenSpec sessions are unnavigable without session titles. Opencode loops solve this with `/rename <name>` at fixed steps, but pi prompts have no rename step and the pi agent in chat cannot invoke `/name` (renders as text, never hits interactive-mode routing). Sessions need an agent-callable rename primitive.

## What Changes

- Add extension `extensions/session-rename/index.ts` exposing minimal model-callable tool `session_rename({name})` closing over factory `pi.setSessionName` + `pi.getSessionName` verify.
- Add rename calls to pi prompts, mirroring opencode exactly:
  - `opsx-propose.md`: claim after name-final (Step 2.5 equiv) + re-affirm after artifacts done (Step 4.5 equiv).
  - `opsx-apply.md`: once after change resolved (Step 0 equiv).
- Opencode commands untouched (`~/.config/opencode/commands/opsx-*-loop.md` reference only).
- Tool scope minimal: `session_rename` only, no `/rename` alias (B3 discarded). Exposure plain `direct` default-active, no scoping wiring; kebab-case stays as prompt guidance.

## Capabilities

### New Capabilities

- `pi-session-rename`: agent-callable session rename via extension tool + prompt integration points (claim, re-affirm, apply-entry).

### Modified Capabilities

None — no existing specs exist (`openspec list --specs` empty); no prior requirement changes.

## Impact

- New: `extensions/session-rename/index.ts` (single file, no deps, no network; full-OS-perm surface per `docs/security.md`, needs trust review).
- Modified: `.pi/prompts/opsx-propose.md`, `.pi/prompts/opsx-apply.md` (prompt deltas only, no harness changes).
- Runtime: `session_info` entries via `sessionManager.appendSessionInfo` (sanitize newline→space, latest-wins); persisted title survives compaction in file (`session_info` never becomes model messages). Re-affirm guards mid-flow retitling and yields a fresh tool-result acknowledgement.
- Out of scope: B2 silent event-driven auto-rename, opencode edits, harness `interactive-mode.ts` / `agent-session.ts` changes.
