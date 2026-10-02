# Proposal

## Why

Published Whimsical Activity 0.1.x does nothing on stock Pi because its only presentation path requires a private, patched-host registration API. Normal users need an extension that works after installation, while the user's selected hybrid option preserves the existing advanced host integration.

## What Changes

- Add a stock-Pi presentation path using public `setWorkingMessage` and `setWorkingIndicator` APIs. Reuse the existing word bank and selector; do not replace the editor or add a second status surface.
- Select exactly one backend per eligible session: advanced when `registerActivityDecoration` exists, stock otherwise. A declined advanced registration remains declined; it must not trigger a competing stock fallback.
- Keep stock behavior deliberately bounded: one whimsical word per agent loop, native normal spinner, static reduced indicator, literal native text with no glyph in plain mode, existing ASCII and disable flags, and idempotent cleanup. Stock adds no timers, settings persistence, or metadata estimates.
- Preserve advanced settings, 250 ms delay, timed rotation, preset/color controls, width reservation, synchronous wait precedence, and observed metadata without changing the host patch.
- Replace the ordinary stock-host warning with working behavior; explain tested host versions, feature differences, and optional advanced setup in user-facing documentation.
- Qualify stock behavior through actual public-host lifecycle/rendering and package-loader checks, alongside existing advanced regressions. Prepare changes without publishing a new npm version or modifying installed Pi.

## Capabilities

### New Capabilities

- `hybrid-activity-compatibility`: Stock-default activity presentation, exclusive advanced capability selection, lifecycle cleanup, feature disclosure, and installable package qualification.

### Modified Capabilities

None. This newly initialized public repository has no main specs. The original mixed repository's completed `add-whimsical-activity-indicator` change documents the historical advanced implementation; it is not reopened or copied into a parallel specification here. This change owns the new public-package compatibility behavior.

## Impact

Affected: `extensions/whimsical-activity/index.ts`, a bounded stock presentation module if useful, associated tests, package description, and the root/extension/host-patch READMEs. Existing native controller, bank contents, advanced patch, dependency pins, lockfile, upstream checkout, and installed packages remain unchanged unless a concrete integration blocker is returned for a scope decision.

Users are local Pi operators; this is decorative terminal presentation, not an execution or security boundary. Prompts, tools, providers, credentials, personal settings, and other extensions are not modified. Shared public UI setters cannot provide exclusive ownership over another extension's simultaneous writes; disclose that limitation rather than inspecting private state.

Routing: selected reviewer `oracle`; selected default implementation specialist `worker`; focus mode `normal`. Orchestrator owns OpenSpec/ADR/reconciliation; worker owns the coherent runtime, tests, and user documentation wave with explicit terminal-UI mode. One independent Oracle gate follows the completed numbered wave. The prior change's Grok override does not carry into this change.

ADR assessment: a short public-package compatibility ADR is required as the first apply task. It records the changed support boundary and refers to the prior native-ownership rationale without rewriting that historical decision. After proposal PASS and caller reconciliation, continue automatically with `/opsx-apply-loop add-stock-pi-activity-support` as authorized by the user. `/<name>` may refer to either a registered command or a loaded skill, depending on the active toolset.
