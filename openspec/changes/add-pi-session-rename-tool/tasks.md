# Tasks

## 1. Extension tool

- [x] 1.1 Create `extensions/session-rename/index.ts` with `session_rename({name})` closing over factory `pi`, empty-guard error, `setSessionName` + `getSessionName` verify echo, plain `direct` default-active, and verify `pi --extension` lists the tool
- [x] 1.2 Verify empty-name guard and newline sanitize by calling tool with `""` (errors, no change) and `"a\nb"` (stores `"a b"`), checking `getSessionName()` echo

## 2. Prompt integration

- [x] 2.1 Add claim + re-affirm `session_rename` calls to `.pi/prompts/opsx-propose.md` (after name-final and after artifacts done) and verify prompt text names the tool and kebab-case rule
- [x] 2.2 Add entry `session_rename` call to `.pi/prompts/opsx-apply.md` (after change resolved) and verify prompt text names the tool and Step 0 parity
- [x] 2.3 Verify tool is listed active in an opsx run via `getActiveTools()` and prompt text carries kebab-case guidance (no tool regex)

## 3. Integration checks

- [ ] 3.1 Verify end-to-end TUI: type `/name explore-probe` shows `Session name set: explore-probe`, then agent `session_rename({name:"explore-probe"})` echoes same title
- [x] 3.2 Run `openspec validate add-pi-session-rename-tool --type change --strict` and verify zero errors
