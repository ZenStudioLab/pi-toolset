## Why

Pi's existing busy indicator can gain personality without involving a model. The host owns activity and truthful operational status; a local shuffled-bag selector supplies decoration from the supplied 100-word JSON bank. The approved amendment makes ordinary activity cleaner and configurable: `✻ Noodling…` replaces generic Working by default, with native settings for text, animation, random timing, color, and motion.

The authority is `temp/implementation-spec.md` and the user's supplied JSON/constraints. Proposal review disproved the extension-only CustomEditor approach: replacing editors loses paste/cursor state, attachment is not a detach lifecycle, and asynchronous prompt notifications can arrive out of order. The user selected scope **A**: preserve the full contract by adding narrow hooks in the owning Pi source, not by patching the installed release or accepting reduced guarantees.

## What Changes

- Add a supported native activity-decoration registration boundary in Pi source. Keep rendering, status ownership, animation control, and synchronous wait precedence host-owned; never replace the editor to install or unload decoration.
- Supply labels through a local extension using the exact bundled JSON, session-local shuffled bags, a 250 ms initial display delay, and eight-second visible-busy rotation.
- Preserve meaningful native status text, cancellation hints, retry countdowns, streaming policy, foreground ownership, input state, and focus. Only the host-marked generic Working label may be replaced; decoration must not create a second status system.
- Add persisted native Activity indicator settings: Activity text (Whimsical default, Operational, Both), Animation (ten presets plus Random; Asterisk default), Random timing (Once per run default, Periodically), Color (Theme default, Claude terracotta), and Motion (Normal default, Reduced, Plain), plus the existing disable and ASCII-punctuation behavior.
- Preview animations in the native settings picker, reserve stable terminal-cell width, and apply saved changes without restarting activity or selecting another word. Random periodic selection changes presets every eight visible-busy seconds; waits pause switching and reduced motion retains one static preset per run.
- Make native animation clock-derived after delayed ticks while retaining its existing 80 ms cadence. Add reduced/static and plain output behavior without a new spinner implementation.
- Verify the full 24 acceptance checks, including lossless enable/unload, reordered prompt notifications, stale callbacks, narrow layouts, and zero indicator-originated model/network calls.
- Add optional foreground-run metadata to the existing activity line: elapsed seconds, the current host-reported tool/action name, and reported output-token usage. All three native settings default to enabled; unavailable usage is omitted rather than estimated. Preserve meaningful host messages, existing footer session totals, and narrow-layout priority.
- Leave agent/tool/provider execution, prompts, installed packages, unrelated settings, and unrelated extensions unchanged. Implementation/tests do not alter the operator's personal settings; the implemented native picker persists only explicit user changes through the existing settings manager.

## Capabilities

### New Capabilities

- `whimsical-activity-indicator`: Static decorative labels on the existing native foreground activity surface, with repeat avoidance, truthful status, and lifecycle-safe presentation.

### Modified Capabilities

None of the existing local OpenSpec capabilities change. The host gains a narrow UI integration API; its execution/protocol behavior remains unchanged.

## Source Ownership and Evidence

This repository is `pi-local-extensions`, with Pi development/peer packages pinned to **0.87.1**. The approved host source is a separate nested Git checkout at `host/pi`, sourced from `https://github.com/earendil-works/pi.git`, tag **v0.99.2**, base commit `005af57d88ee23b33778f343a9595b32e67ff788`. It is ignored by the outer repository, not a vendored dependency or installed-release edit. Both repositories are explicit implementation targets; release/install/publish is not authorized by this proposal.

| Inspected source under `host/pi/` | Consequence |
| --- | --- |
| `packages/coding-agent/src/modes/interactive/interactive-mode.ts`: `showStatusIndicator`, `clearStatusIndicator`, `setEditorWorkingStatusIndicator`, `resetExtensionUI` | One native status owner already serves editor-border and status-container paths. Attach decoration here, without changing editor instances. |
| `packages/coding-agent/src/modes/interactive/components/status-indicator.ts` | Working, retry, compaction, and branch summary share a renderer and disposal contract; countdowns remain operational resources. |
| `packages/coding-agent/src/modes/interactive/components/custom-editor.ts`: `renderTopBorder` | Width allocation must omit decoration before collapsing truthful native text for overflow hints. |
| `packages/coding-agent/src/core/extensions/runner.ts`: `withUIPrompt`, `emitUIPromptEvent` | Prompt depth changes synchronously before UI invocation/finally, but current extension notifications are asynchronous. Expose the synchronous state to the host presentation owner. |
| `packages/tui/src/components/loader.ts` | Reuse the native animation; replace tick-count frame advancement with monotonic-clock frame selection. |
| `packages/coding-agent/test/{extensions-runner,interactive-mode-status,status-indicator}.test.ts` and local `test/fixtures/` | Existing host/offline fixtures can cover actual integration; mocks alone cannot qualify native lifecycle/rendering. |

The published 0.87.1 and installed 0.99.2 APIs do not contain the proposed hooks. The extension requires the modified source host; on an unmodified host it leaves UI untouched with one compatibility diagnostic. No speculative legacy compositor or dependency update is planned.

## Impact

Host changes are limited to the coding-agent UI types/exports, prompt-state observation, interactive status integration, native status/border rendering, Loader animation, focused tests, and API documentation. A distinct presentation-lifecycle helper is appropriate rather than expanding the already-large interactive-mode implementation. The local extension belongs under `extensions/whimsical-activity/`, with focused tests under `test/whimsical-activity/` and user documentation in `README.md`.

The proposal's `activity-words.json` is the supplied immutable handoff asset. Implementation copies it byte-for-byte to the runtime bank and loads that JSON directly; there is no generated array, fetched content, dictionary package, new framework, or persistence.

Disable with the native Activity indicator setting, `--no-whimsical-activity`, or extension unloading. Existing CLI controls remain explicit invocation overrides of saved native preferences; defaults must not mask persistence. Older published hosts are not claimed to implement the feature. Source-host qualification and installation instructions must distinguish tested source from the untouched live release.

## Amendment Status and Evidence

The original host/extension feature completed waves 1–2 with caller-reconciled PASS (root `90151f0`, host `04ef561`); the settings/presets amendment completed wave 3 and its independent whole-wave gate. Pending wave 4 adds foreground metadata in the same owning change. Completed tasks and review history remain intact; earlier qualification does not qualify the new metadata behavior.

The source already has persisted SettingsManager preferences, SettingsSelectorComponent submenus, configurable Loader frames/cadence, and host-owned NativeActivityDecoration. Extend those existing responsibilities rather than creating extension-owned configuration files, another animation loop, or a second settings system. Text replacement must be native-semantic, not inferred from rendered strings. The Claude color option uses the observed `rgb(215,119,87)` literal in local Claude Code 2.1.287; it is a specific verified terracotta swatch, not a claim that every Claude theme, terminal, or animation is identical.

The amendment supersedes the earlier generic-native-text-plus-decoration default and CLI-only/no-settings-panel restriction. It does not change the static bank, word timing, source-host boundary, or execution-neutral requirements. ADR-0009's native-ownership decision remains applicable; settings and presets extend it without a new architectural pattern, so no additional ADR is required.

The registered `worker` is the implementation owner, explicitly assigned coherent logic and terminal-UI modes; the user selected `oracle` with the invocation-only model `xai/grok-4.7:high` as the independent reviewer for pending wave 4 after `oracle1` was unavailable. This override applies only to this OpenSpec change; historical reviews and global agent settings remain unchanged. The orchestrator owns specifications, ADR assessment, and caller reconciliation. This metadata request authorizes artifact amendment and proposal review, not implementation; a new apply request is required after the reviewed bundle is presented. Implementation uses `/opsx-apply-loop`. `/<name>` may refer to either a registered command or a loaded skill, depending on the active toolset.

The metadata amendment supersedes only the earlier prohibition on adding an ordinary-activity elapsed counter. The static bank, eight-second word timing, native run/wait authority, and no-extra-model/network-call constraints remain. Current source already receives `message_start/update/end` and `tool_execution_start/update/end` in InteractiveMode; its footer separately totals persisted session usage. Existing provider adapters report usage at different times, so continuously increasing exact live token counts are not promised. The host derives metadata from those existing observations without passing message bodies, tool arguments/results, or usage into the word selector. No provider adapter, tokenizer, extra API request, new lifecycle system, or new dependency is needed. ADR-0009 remains applicable; no additional ADR is required.
