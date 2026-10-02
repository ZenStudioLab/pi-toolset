# Design

## Context

See proposal.md for motivation and specs/hybrid-activity-compatibility/spec.md for observable requirements. The public repository starts at `06ce7daa28889905eaa27bcc5f14e5389130fa51` on `main` with version 0.1.1. OpenSpec has just been initialized here by user approval; no local ADRs or main specs existed.

Current source evidence:

- `extensions/whimsical-activity/index.ts` only registers on `session_start`, checks TUI/TTY flags, and warns when `registerActivityDecoration` is absent. Its saved removal callback handles shutdown and session replacement.
- `activity-controller.ts` consumes advanced host snapshots, scoped update handles, and the scheduler. `preferences.ts` forwards three invocation controls without reading or persisting settings.
- Published 0.87.1 development types and installed stock 0.99.2 types both expose `setWorkingMessage(message?)` and `setWorkingIndicator({ frames?, intervalMs? }?)`. Both support `agent_start`, `agent_end`, and session lifecycle events.
- Stock 0.99.2 `dist/modes/interactive/interactive-mode.js` applies these setters only to a `working` indicator; retry/compaction use separate native indicators. `turn_start` shows the working surface and `agent_end` clears it. This allows extension text without editor replacement or a second renderer.
- Public setters expose no previous-value getter, scoped ownership handle, authoritative wait/visibility snapshot, native activity preferences, or fixed-width decoration slot. Their limits are different from the advanced API; extension event counting cannot recreate that authority.
- `test/whimsical-activity/published-host.test.ts` already uses the real 0.87.1 loader/runner, but currently asserts the warning/no-op. `activity-controller.test.ts` imports actual patched-host types, so full developer typechecking still requires the optional source checkout. Ordinary package loading must not.
- Historical rationale: original mixed repository `docs/adr/0001-native-activity-decoration.md` chose host ownership to satisfy stronger UI invariants. That accepted historical record remains unchanged. This public-package change explicitly adds weaker, documented stock behavior at the user's request.

## Goals / Non-Goals

**Goals:** Supply a small stock path and preserve the stronger advanced contract without mixing their ownership models. Keep UI effects synchronous and presentation-only. Ensure clean-install users do not need the source checkout.

**Non-Goals:** Host patch changes, upstream contribution, native settings parity on stock, new animation catalogs, metadata reconstruction, private-host introspection, editor/footer/widget replacement, dependency upgrades, global configuration changes, npm publishing, tags, pushes, and word-bank changes. No live-provider calls or broad host build/test suite.

## Decisions

### 1. Capability selection rather than a user-configured backend

At each eligible `session_start`, dispose the prior backend, parse existing flags, and select once. A callable `registerActivityDecoration` selects the unchanged advanced controller even when registration returns undefined. Otherwise the stock branch requires callable public working-message and indicator setters. Genuinely unsupported hosts get a deduplicated actionable warning; stock hosts with these APIs do not.

Do not catch advanced refusal/errors and bypass them through stock writes. Do not introduce backend flags, version parsers, a plugin registry, or a generic adapter hierarchy. An explicit backend-discriminated local state and a small stock controller/module are sufficient. A separate stock module is justified by different lifecycle and cleanup ownership, not code reuse theatre.

### 2. Stock uses one word per agent loop and no extension timers

Keep the selector lazy and shared across session replacements in the loaded extension runtime, as today. The stock branch's `agent_start` chooses one word, sets the native working message with Unicode or ASCII punctuation, and remains stable until `agent_end`. A repeated start while already active is idempotent. An end with no active stock loop does nothing. Session replacement/shutdown reset the old branch before reinitialization.

Normal mode leaves the native spinner alone. Reduced mode sets one static `*` frame. Plain mode changes only indicator frames to `[]`, leaving the literal native working message and bank untouched. Track which public setters this backend actually changed and reset just those controls on cleanup. When disabled, stock does not write anything or allocate a selector.

An invalid bank follows existing warning deduplication and native-text fallback; normal mode must not schedule rotation or repeatedly retry the malformed bank. Reduced/plain indicator preferences can still be applied without invented word content.

A stock delay/rotation timer was considered but rejected: the public API cannot prove current visibility or authoritative prompt wait state. One word per loop sacrifices automatic rotation while avoiding stale timed writes and hidden work. Native spinner animation remains host-owned. Asynchronous wait events are not used to create synthetic foreground ownership. Different words on subsequent loops retain the existing shuffled-bag behavior.

### 3. Preserve advanced behavior as a separate, unchanged integration

Keep `ActivityController`, preferences, the 100-entry bank, and `host-patch/pi-v0.99.2.patch` unchanged. Advanced events remain driven by host snapshots, not stock event handlers. Existing saved settings and disable semantics remain intact; the stock branch must never act when advanced registration was selected, accepted or not.

The difference is a documented capability boundary, not emulation:

| Feature | Stock path | Advanced patched host |
| --- | --- | --- |
| Working text | One bank word per loop | Native-owned whimsical/operational/both |
| Normal animation | Pi native spinner | Existing preset/random choices |
| Reduced/plain/ASCII/disable | Existing invocation flags | Flags plus native saved preferences |
| Word delay/rotation | None | 250 ms and eight visible-busy seconds |
| Settings/presets/colors | No added settings or palette | Existing native submenu |
| Elapsed/action/output tokens | Not added | Existing observed metadata |
| Width reservation | Pi's normal text rendering | Fixed slot and omission priority |
| Wait/ownership arbitration | Pi retains its surfaces; no extra guarantees | Existing synchronous scoped contract |

### 4. Publication and developer context remain honest

The next release can expose the same entry and package name; no migration writes are needed. Version 0.1.1 on npm remains host-only until a separately approved publication. Documentation must label this compatibility work unreleased, provide a local `pi -e` checkout trial, and explain the post-release normal install path without claiming it works from today's registry artifact. Advanced patch instructions move behind an optional heading; upstream license/attribution and duplicate-install guidance remain.

Update the package description but do not bump version or lockfile in this implementation. Tests may use the already installed 0.87.1 development package and stock installed 0.99.2 read-only. Keep peer ranges in the gallery-recommended `*` form; document exact tested versions instead of claiming universal version support. Existing host-dependent developer checks can remain explicitly documented, separate from package installation requirements.

### 5. Qualify behavior at the actual host boundary

Use the existing Node test suite for flags, backend exclusivity, idempotent loop/reset cleanup, malformed-bank fallback, headless no-ops, and neutrality. Replace the old released-host warning assertion with stock behavior through the real loader/runner. Avoid duplicating the selector and advanced-controller tests.

For stock 0.99.2, exercise the actual released interactive UI wiring and native WorkingStatusIndicator/TUI renderer using an offline controlled provider or equivalent real lifecycle harness, preserving rendered/ANSI output. Confirm the word is visible during work, native text/indicator defaults return afterward, operational surfaces remain native, and narrow output stays within width. Do not count a fake UI that merely records setter calls as rendering evidence. Use temporary agent config/session directories; never patch installed files or load personal extensions for this qualification.

Run `npm run check` at the public root and focused existing advanced source lifecycle/render/preference suites from the existing `host/pi/packages/coding-agent` workspace. Preserve full stdout/stderr and exit codes under a fresh `/tmp` directory. Pack with scripts disabled into a temporary directory and load the packed entry from outside the repo, without any host checkout in the artifact. Inspect the tarball to confirm the bank, stock implementation, optional patch, licenses, and explicit entry are included; OpenSpec, tests, credentials, and host checkout are excluded. No install/publish to personal Pi is needed.

## Risks / Trade-offs

- Shared setters can conflict with another working-message extension → document single-owner use; reset only ports this backend changed. No impossible promise to restore an unobservable previous value.
- Stock does not have advanced wait/visibility authority → no stock callbacks/timers or UI-prompt counters; native host owns operational surfaces. Advanced retains the stronger contract.
- Event ordering is not demonstrated by interface declarations → require real released-host runtime/render qualification before PASS.
- A future upstream host could expose an incompatible private advanced method → support only the documented patched base; report concrete incompatibility instead of creating speculative version machinery.
- User docs can get ahead of npm publication → mark unreleased stock support and keep 0.1.x caveats until a separately approved release.

## Migration Plan

Record the compatibility ADR first, then implement runtime/tests/docs as one coherent numbered wave, independently review the completed wave, and commit only after caller-owned PASS. The user authorized automatic apply after proposal review; they did not authorize publication here. Existing advanced installations continue selecting the advanced capability. Stock users can test the checkout before release; after a separately approved release they update the package normally. Disabling or removing the extension and restarting restores native behavior without changing the host checkout.
