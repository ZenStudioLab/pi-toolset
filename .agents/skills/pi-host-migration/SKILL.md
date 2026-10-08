---
name: pi-host-migration
description: Upgrade Pi Toolset's patched source host while preserving local changes, or diagnose migration-related test and background-subagent startup failures under pix.
---

# Migrate the patched Pi host

Use this workflow for the local source host, not as a reason to reinstall an already-current managed Pi package. Read the target checkout's `AGENTS.md` before commands. Treat version numbers and resolver behavior below as migration evidence to recheck against the installed versions, not permanent upstream contracts.

Resolve the toolset root from this skill directory (`../../..`). Read the [advanced host guide](../../../extensions/whimsical-activity/host-patch/README.md) for exact patch bases, preparation commands, verification results, and known limits. Keep release-specific status there rather than copying a migration transcript into this skill.

## Establish which Pi is running

The shell command, foreground host, and background child SDK can come from different installations. Trace them separately before changing anything.

- Inspect the actual `pix` executable and its environment overrides. In this migration, `~/.local/bin/pix` invokes `host/pi/pi-test.sh`, which executes TypeScript source.
- Inspect the managed install's `current-version` and resolved release directory separately. Updating it does not update `host/pi`.
- Identify where the installed `pi-subagents` resolves its host package and SDK. A version printout proves CLI startup, not background-child readiness.
- Check configured extension/package declarations for duplicate Whimsical entries. The observed setup excludes `extensions/whimsical-activity/index.ts` from the older `Src/Tools/pi` package and loads the Pi Toolset copy. Native host activity support and the extension are complementary, not duplicate extension registrations.

## Preserve and migrate local changes

The host is ignored by the toolset repository, so its changes need both a recoverable checkout and a distributable patch.

1. Inspect status, HEAD, upstream tag, and repository health. Record modified and untracked paths; do not overwrite concurrent work. Use one-command `git -c safe.directory=<path>` when needed rather than changing global Git configuration.
2. Back up the tracked diff, untracked files, and working tree before replacement. Include checksums and the base revision. Temporary storage is suitable for scratch work, but keep the original checkout or another durable backup before swapping.
3. If Git history is damaged, use a fresh clone at the verified target tag instead of attempting an in-place reset. The old v0.99.2 checkout had a missing parent object; the v1.1.0 migration used a fresh clone.
4. Keep the repository-relative layout intact. Native Whimsical tests reach the toolset's `extensions/` and `test/` directories from `host/pi/packages/coding-agent/test`. A scratch layout with the wrong depth produces misleading import failures.
5. Check patch applicability before applying. Review rejected hunks against both upstream behavior and the local feature. Preserve upstream dialog blocking/cleanup alongside activity wait handling; a clean typecheck does not prove all rejected hunks were merged. In this migration, publishing a replacement dialog's blocked status before disposing the old dialog let cross-kind cleanup erase the new status. Publish after disposal and test terminal status as well as focus and activity waiting.
6. Update prototype-based test fixtures when a patch adds required instance members. Do not weaken production invariants merely to accommodate incomplete fake objects. Preserve the assertions that exercise shutdown ordering, reload, and event handling.
7. Generate the new patch against its exact upstream base, including new source and test files. Prefer a scratch index or tree rather than disturbing the user's staging area. Verify application on a pristine base and compare resulting files; reverse-check the installed tree as a separate check.
8. Replace the checkout only within the user's approved scope, retaining the original directory for rollback. Do not commit, push, delete backups, or overwrite unrelated files without authorization.

After copying between filesystems, check status again. This migration moved from `/tmp` to a mounted volume that reported executable modes differently: thousands of apparent changes reduced to the expected set with repo-local `core.filemode=false`, matching the original checkout. Confirm mode-only differences before applying that setting; do not hide real content changes.

## Run tests in the intended environment

A pristine baseline reproducing a failure does not establish an upstream bug if both runs inherit the same contaminated environment.

- Use the host repository's `./test.sh` for the full non-provider test run. Inspect that script first: v1.1.0 isolates home, credentials, temporary files, and tool configuration.
- Follow the current host guidance for focused tests. `packages/coding-agent` uses Vitest; `packages/tui` uses Node's test runner. Running TUI tests with Vitest produces “No test suite found,” not evidence of broken TUI behavior.
- Capture output to a fresh log and preserve the command's exit status. Distinguish failures, skips, missing build prerequisites, and suites that never ran.
- Run the host's full `npm run check`, not only its build typecheck. Vitest can pass fixtures that no longer satisfy TypeScript: v1.1.0 required `aborted` on settlement events, and the build-only typecheck excluded the affected tests.
- Do not run real-provider tests with inherited credentials as an accidental consequence of a broad test command.

### Selector failures caused by real home-directory skills

The tests “toggles built-in extensions in config global mode” and “cycles project built-in extension overrides in config local mode” failed in a direct Vitest run. Expected values included `Built-in` and `+builtin:mcp`.

The resolver discovered the operator's real `~/.agents/skills`. Those entries came before built-in extensions, so the tests rendered or toggled the wrong selected item. Both tests passed through `./test.sh` without changing code or assertions. Check home-directory isolation and rendered selection before modifying the selector or accepting these as baseline defects.

## Prepare the SDK for background subagents

The foreground source launcher can work while detached children fail with:

```text
Background children require the host npm package (@earendil-works/pi-coding-agent) with its dependencies; .../packages/coding-agent does not provide @earendil-works/pi-coding-agent.
```

For the installed extension examined during this migration, discovery prefers the running Pi package, then `PI_SUBAGENTS_PI_CODING_AGENT_PACKAGE_ROOT`, then the extension's install-tree fallback. Merely setting a managed-install override does not replace a detected source host.

- `PI_CODING_AGENT_PACKAGE_ROOT` was an obsolete, unrecognized launcher variable. The supported fallback variable is `PI_SUBAGENTS_PI_CODING_AGENT_PACKAGE_ROOT`.
- `PI_SUBAGENT_PI_BINARY` serves profile probes/project panes and supported binary-host cases; it does not redirect npm background children away from the detected source SDK.
- The source package exports `dist/index.js`. A successful `pi-test.sh --version` or `tsc --noEmit` does not create that entry.
- Once workspace dependencies are compiled, run `npm run build:unbundled` from `host/pi/packages/coding-agent` to emit the SDK and copy runtime assets. For a clean checkout, consult the guide's offline workspace-build preparation.
- Rebuild after source changes. Do not link another installation's SDK into this checkout or patch installed `pi-subagents` merely to bypass its missing-dependency check.

Validate the actual failing boundary: use the installed extension's `resolveHostPeerAliases` against the selected package, then load that SDK in a separate Node process with the runner's peer loader. The repaired v1.1.0 host resolved all 12 required aliases and loaded successfully. This proves SDK readiness, not a completed live oracle task; report those separately. Reconcile any failed run before retrying it, and retry only after the missing prerequisite has changed.

## Keep generated assets reproducible

Provider catalog data is ignored by Git but needed at runtime. Check its presence, compatibility, and provenance separately from the patch.

Prefer the matching pinned publisher assets and offline builds described in the host guide. The AI package's normal build invokes catalog generation; its offline build checks and copies existing data. A manifest timestamp alone does not establish which command generated it. Do not label freshly generated catalog values as release-pinned or change pricing assertions just to make them pass.

The migration regenerated Sonnet 5.5 cache-read pricing as `0.1` instead of the release's `0.2`, alongside changes in two other provider files. Restoring the matching managed release's catalog and manifest, validating their hashes, and rebuilding offline resolved the AI regression without changing its assertion. Compare source and compiled assets; changing only one leaves foreground and background runtimes inconsistent.

## Close out with precise evidence

Report the active host version/base, preserved backup, patch verification, focused/full test results, SDK readiness, and remaining limits. Keep unrelated submodule/typecheck failures separate from host regressions. Do not call the whole monorepo green when only coding-agent passed, or claim interactive/live-provider verification from a version check or SDK import.

After review fixes, v1.1.0 passed the full host check, 2,918 coding-agent tests (50 skipped), and 1,317 AI tests (864 skipped). The wider test run still lacked native-daemon prerequisites; the toolset root also had unrelated `pi-voicekit` type errors. Consult and update the advanced guide when those conditions change.
