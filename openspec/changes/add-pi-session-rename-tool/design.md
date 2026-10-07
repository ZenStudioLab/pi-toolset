# Design

## Context

See proposal.md Why. Verified chain: `/name` in TUI → `interactive-mode.ts:6639 handleNameCommand` → `agent-session.ts:3866 setSessionName` → `session-manager.ts:1304 appendSessionInfo` (newline→space, trim) + `:1318 getSessionName` latest-wins, footer reads `fileEntries` directly. Assistant in chat cannot hit `:3220`; `ExtensionToolContext` (types.ts:405) lacks `setSessionName`, factory `pi` has it (types.ts:1731, loader.ts:389). Pattern precedent: `examples/extensions/session-name.ts` (command + `pi.setSessionName`), `bookmark.ts` (closure over `pi.setLabel`), `hello.ts` (`defineTool` + `pi.registerTool`). No `.pi/extensions/` exists today; docs: `configuration.md:34` project dir, `extensions.md` lifecycle + tool exposure, `security.md:41` sensitive paths, `session-format.md` compaction. `session_info` entries never become model messages (`sessionEntryToContextMessages`); persisted title survives compaction in file.

## Goals / Non-Goals

**Goals:**
- Minimal B1 explicit tool closing over factory `pi`, visible in transcript.
- Mirror opencode rename points exactly (propose x2 + apply x1).
- Always-available minimal tool, no activation wiring.

**Non-Goals:**
- B2 silent event-driven auto-rename (future layer).
- `/rename` alias for muscle-memory (B3 discarded).
- Harness changes to interactive-mode / agent-session / session-manager.
- Opencode command edits.

## Decisions

- **Tool shape: `defineTool` + closure (hybrid of hello.ts + bookmark.ts).** `defineTool({name: session_rename, parameters: {name: string}})` with `execute()` closing over factory `pi`: `pi.setSessionName(trimmed)` then `pi.getSessionName()` verify, return `Session name set: <actual>`. Alternative `registerCommand /rename` rejected — commands are user-initiated, not model-callable; B1 needs tool path.
- **Name `session_rename` over `session_name` / `set_session_name`.** Distinct from `/session-name` example, greppable, prompt reads `call session_rename({name})`. Alternative verbatim API name is noisier and collides conceptually with getter.
- **Validation split: tool guards empty, manager sanitizes newlines, prompt guides kebab (not tool-enforced).** Tool returns error on empty (mirrors `/name` usage path, never clears). Manager already does `[\\r\\n]→space` + trim. Prompt instructs kebab-case softly like opencode; no regex in tool to avoid hard failures. Alternative hard regex rejected — prompt drift cheaper than tool errors.
- **Exposure plain `direct` default-active.** No `defaultActive:false`, no `setActiveTools`/`defaultTools` wiring — prompt templates expand text only (`prompt-templates.ts:304`) and cannot invoke activation APIs, and no opsx loader exists. Alternative scoped activation rejected — unspecified runtime path outside approved minimal scope.
- **Rename points (a) mirror exactly.** Propose claim restores navigability from start; re-affirm is cheap (append, latest-wins) and guards mid-flow retitling with a fresh tool-result acknowledgement. Alternative simplify-to-once saves one call but loses re-affirm after long artifact generation.
- **Single file `.pi/extensions/session-rename.ts`, no deps.** Smallest trust surface for full-OS-perm runtime; supply-chain review proportional.

## Risks / Trade-offs

- [Project-local extension runs with full OS perms] → Mitigation: single file, no imports beyond pi types + ai TypeBox, no network/process, explicit trust review.
- [Persisted title vs model visibility] → Mitigation: re-affirm call after artifacts guards retitling; fileEntries footer still shows title.
- [Tool always active] → Mitigation: single-purpose rename, harmless if called elsewhere; kebab-case stays prompt guidance, no tool regex.
- [Kebab drift (agent passes Title Case)] → Mitigation: prompt wording + echo of normalized name surfaces drift like `:6660` warning; no hard fail.

## Migration Plan

Additive only. Create extension file + prompt deltas. No data migration, no rollback beyond deleting file / reverting prompt lines. Verify via `/name explore-probe` manual TUI check then tool call echo.

## Open Questions

None blocking specs or tasks. B2 event shapes deferred.
