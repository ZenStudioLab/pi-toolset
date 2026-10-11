# Design

## Context

The user approved source scope A after Oracle found the extension-only approach infeasible. The owning source is `host/pi` at Pi v0.99.2, base `005af57d88ee23b33778f343a9595b32e67ff788`; the local extension remains a separate package. Published 0.87.1 and installed 0.99.2 are not source-qualified hosts. No installed package will be patched.

`setCustomEditorComponent` migrates only raw text, losing collapsed-paste expansion and cursor state. It provides no detach callback, and `ui_prompt_start/end` can be observed in reverse order. Therefore editor replacement, focus probing, and asynchronous notification counting are rejected as integration authority. Native status rendering and synchronous prompt depth are the appropriate owners.

## Goals / Non-Goals

**Goals:** Preserve the full behavior contract and original 24 acceptance checks, extend it with the approved configurable-presentation amendment, decorate one native surface without touching editing state, reuse native animation, and keep the static selector independent of conversation/model data.

**Non-Goals:** New execution lifecycle, UI framework, model/network integration, dependency updates, live installation, release/publish, persistent history, unrelated editor fixes, or a generalized plugin compositor. Existing custom UI must not be silently replaced.

## Decisions

### 1. Add one host-owned activity-decoration registration

Add `registerActivityDecoration` to the supported interactive extension UI context, with exported typed contracts. The registration connects one presentation controller to the existing native status owner. It does not accept an editor factory, arbitrary operational message replacement, or a caller-authored busy flag. The amendment permits only host-controlled replacement of its own generic Working label through a typed text preference; meaningful operational messages remain authoritative.

The contract has three bounded responsibilities:

- The host synchronously supplies an initial snapshot and subsequent updates containing opaque foreground-run identity, current native-owner generation/kind, host visibility eligibility, and authoritative waiting state. It supplies no prompt/conversation contents. Run identity lasts until actual settlement; native phase replacement changes owner generation, not the run identity. Standalone compaction/summary gets an identity from its native lifetime. Foreground metadata described in decision 11 stays host-owned and out of selector/controller inputs.
- The controller supplies presentation only: optional complete label, reserved terminal-cell width, and animated/static/hidden glyph preference. A registration/owner-scoped update handle requests native redraw; the host rejects updates from disposed registrations or obsolete owners. It cannot replace/hide meaningful operational text, change execution, restart disposed loaders, or acquire a background surface. The host renders the approved text mode only for host-marked generic Working, preserving any separately owned interrupt hint.
- The host owns registration cleanup and revocation. Removal/reset/shutdown disposes the controller and its callbacks exactly once, restores native presentation, and invalidates queued update handles. Registration must not replace the editor on install or unload. A competing registration is left intact and rejected through existing diagnostics rather than overwritten.

Exact TypeScript signature details may follow existing API style, but these ownership and ordering guarantees are mandatory. Registration failure/noninteractive registration must allocate no controller or timers. This boundary has a present consumer: the whimsical extension; it protects the evidenced status/prompt lifecycle rather than adding a general framework.

Keep the new presentation responsibility in a small coherent host module, integrated by narrow calls from InteractiveMode. Native status constructors/disposal remain authoritative. Attach presentation to the status itself so both border and status-container rendering agree; do not mutate CustomEditor instances or borrow loader controls into the extension.

### 2. Publish synchronous wait state from its producer

Extend `ExtensionRunner.withUIPrompt` with a read-only current wait snapshot and synchronous subscription used by the native presentation owner. Update depth and a monotonic revision before calling the UI operation and in every finish path (resolution, rejection, synchronous throw). Send an initial snapshot when subscribing, and revoke listeners on runner invalidation/replacement. Delayed completion from an old runner cannot resume the current host.

Existing asynchronous `ui_prompt_start/end` events retain their behavior for other extensions; this feature does not depend on their order. Snapshot listeners do not await extension handlers. An observer failure is isolated through existing diagnostics and must not prevent the prompt from opening/finishing.

The host combines runner-owned waits with native blocking-input UI ownership at actual open/close transitions. This includes native selectors/editors/dialogs and custom UI waiting promises, including noncapturing/hidden overlays and the period before an asynchronous factory mounts. Use the producers' ownership/depth, not `focused`, `hasOverlay`, titles, or rendered text. Nested/overlapping waits suppress until all authoritative waits end. Enumerate the actual host blocking UI entry/exit paths in tests; do not invent signals for arbitrary third-party code outside those paths.

The host gates presentation synchronously before prompts become usable: stop animated glyph and decorative callbacks, hide decoration, retain operational status/prompt/focus. It resumes only an eligible still-current unfinished owner/run. A pending legacy notification never overrides the snapshot.

### 3. Preserve host run and status authority

Reuse `showStatusIndicator`/`clearStatusIndicator`, real native kinds, and the existing foreground activity lifecycle. Integrate `agent_start`, `agent_end`, `agent_settled`, retry/compaction/branch-summary transitions, session replacement/reload, and shutdown at their existing host handling points. Do not reconstruct ownership from extension tool events or newest background messages.

`agent_end` suspends ordinary working presentation but does not discard the retained word until actual `agent_settled`; retry/compaction/queued continuation can remain part of the same unfinished run. Standalone native activity gets only its actual attachment lifetime. Owner replacement invalidates old update handles before disposal/transfer; it cannot restart an obsolete loader. A phase replacement retains the word and unsuppressed rotation deadline. Waiting or host-hidden presentation stops owned recurring updates; same-run resume keeps its word and restarts the eight-second interval.

Never call `setWorkingVisible(true)` from a decorative callback. The current host streaming policy, native retry countdown, cancellation actions, and real operational text are unchanged. Native countdowns are execution information, not owned decorative timers.

### 4. Keep bank and controller local and independent

Copy the supplied proposal JSON unchanged to `extensions/whimsical-activity/activity-words.json` and load it directly. Do not transcribe a TypeScript array or generate/fetch bank contents. The proposal copy is historical authority, not another runtime bank.

Validate once. The selector owns a Fisher–Yates shuffled index bag, cursor, and last selection, with injected test randomness. Persist that selector across ordinary runs in the same application UI runtime; no disk history. Invalid/unavailable data yields literal `Working` and at most one existing diagnostic; a singleton works without retry loops.

The presentation controller owns only a retained word, visibility/rotation deadlines, and scoped callback tokens. Its inputs are the host snapshots and output preferences, never prompts or source data. Select at actual display after 250 ms, not at status construction. A short operation consumes nothing. Rendering/resize/theme/frame updates do not select or schedule.

Use one visibility callback and one label deadline callback. Hidden/waiting/terminal states own no recurring callbacks. A visible resume skips the display delay and starts a fresh eight-second deadline; a never-visible resume starts a fresh 250 ms delay. Delayed execution selects at most one due word and schedules from now rather than replaying rotations. Registration revocation disposes these resources synchronously and idempotently.

### 5. Reuse native animation with clock-derived frames

Modify native Loader frame advancement to derive the frame from monotonic elapsed time and its configured interval, preserving the existing 80 ms default and frame set. Keep start/stop/setIndicator semantics and zero/one-frame timer suppression. Test delayed ticks, restart, and indicator replacement with an injected/faked clock; do not expose private frame state or add an independent spinner.

The native presentation owner, not the extension, applies animated/static/hidden preference to the current loader. Before initial visibility and during waiting/host hiding, the busy glyph and decoration are absent while truthful operational information stays available. Reduced mode supplies a static glyph and one word per run. Plain mode supplies stable literal native text with no animated glyph or decoration. Registration removal restores current native glyph settings without resetting countdowns or operational messages.

### 6. Fit decoration after truthful native information

Use StatusIndicator's native render paths and ANSI/Unicode terminal-width helpers. Fit a fixed decorative column only after allocating native operational text and critical hints. Reserve 14 cells for the initial bank plus Unicode ellipsis, or 16 in ASCII mode; use the validated maximum for other valid banks. The amendment supersedes the ordinary native-text-first default: Whimsical mode shows the chosen glyph and complete word without generic Working, while Operational and Both remain selectable. Meaningful native text and critical hints always take priority.

Drop optional metadata (tokens, elapsed, then action) before omitting the complete decorative column or truncating native status. CustomEditor must retry its width allocation without optional content before reducing native status to a glyph for the existing overflow hint. Preserve existing overflow/input priorities. Decision 11 supersedes the earlier no-new-elapsed-counter restriction with one bounded foreground-run elapsed display; native retry countdowns remain in their original location and are not replaced. Theme changes render fresh native colors; layout cannot mutate input or steal focus.

### 7. Make output eligibility and reversibility explicit

Retain `--no-whimsical-activity`, `--activity-display normal|reduced|plain`, and `--activity-ascii` as explicit invocation overrides, not registered defaults that mask persisted choices. Normal is enabled by default on eligible interactive terminals. The approved amendment adds native settings and a typed effective-preference snapshot; the extension does not read settings files itself. Document `--` before positional prompts following boolean extension flags because the existing CLI parser otherwise consumes that argument; do not refactor the parser.

Print/JSON/RPC/redirected/non-TTY modes never construct the decorator/controller or allocate feature timers. `hasUI` alone is insufficient. The new API is unavailable/no-op in these modes according to existing UI-context conventions, without changing protocol output.

The local extension checks for the new registration API. Unmodified hosts leave native UI untouched and report unsupported host once; do not fall back to the rejected CustomEditor seam. Keep the existing package dependency pins/lockfile unchanged, use structural typing where needed for the new supported API, and verify against source rather than claiming those pins implement it.

An existing custom editor that consumes native status can receive the decorated native object without editor replacement. If a custom renderer cannot preserve truth/width precedence or does not use the native surface, leave it intact and decline decoration once. Test coexistence, later editor changes, and unload with live text, cursor, collapsed paste, autocomplete, actions, and focus.

### 8. Persist presentation preferences in native settings

Waves 1–2 were implemented at root `90151f0` and host `04ef561`; the settings/presets work in wave 3 has since completed its whole-wave gate. Decision 11 adds pending wave 4; prior PASS is not evidence for foreground metadata. Inspected SettingsManager already merges global/project/override layers and persists modified fields; SettingsSelectorComponent already supports nested settings. Add a typed `activityIndicator` preference object through these paths, with per-field validation/defaults and nested-field writes that preserve unrelated settings.

| Preference | Values | Default |
| --- | --- | --- |
| enabled | true, false | true |
| text | whimsical, operational, both | whimsical |
| animation | ten preset ids below, random | asterisk |
| randomTiming | once-per-run, periodically | once-per-run |
| color | theme, claude | theme |
| motion | normal, reduced, plain | normal |
| ascii | ASCII punctuation enabled/disabled | disabled |
| showElapsed | true, false | true |
| showAction | true, false | true |
| showOutputTokens | true, false | true |

Use existing global/project precedence. Native picker writes use the existing global-setting convention; display effective merged values and any explicit CLI override rather than misleadingly claiming that a shadowed saved value is active. Invalid/missing fields fall back individually, without discarding valid sibling values or rewriting files just by reading them. Defaults take effect in memory; tests use in-memory or disposable storage, never real operator settings.

Extend the supported decoration boundary to deliver a normalized content-free preference snapshot alongside lifecycle state and accept bounded optional registration overrides for the existing flags. Additive structural types keep the root's published-package pins unchanged. Settings changes refresh the existing controller through current scoped handles; do not unregister/recreate it or lose run/word/bag identity. `--no-whimsical-activity` is a hard invocation opt-out. Explicit motion/ASCII flags override only those fields; absent flags must inherit settings. Registration unload still restores unmodified native presentation. Native settings are inert without a compatible registered decorator; the picker must make extension availability clear.

Add an Activity indicator submenu to the existing settings picker rather than a separate extension command/file. Show all text/color/motion choices and the ten named presets plus Random; random timing is relevant only for Random. A compact preview follows the highlighted preset, uses the same frame registry and terminal-width helpers, and does not select a run preset or consume a word. Only confirmed selection persists; cancelling a preview changes nothing. Preview animation owns at most one native-cadence redraw resource, allocated only while that picker is active and cleaned on selection, cancellation, selector replacement, reset and teardown. Reduced/Plain preferences use a static preview. Opening settings remains an authoritative host wait; the preview is a settings affordance, never a competing busy-status owner.

### 9. Native presets, random timing and color

Keep one small static host preset registry shared by native rendering and the settings preview; the extension still supplies only bank labels. All presets use the existing 80 ms default cadence, with a declared representative glyph for Reduced. Exact proposed frames are:

| Id / name | Frames | Representative |
| --- | --- | --- |
| asterisk / Asterisk | `✻`, `✽`, `✶`, `✳`, `✢`, `✳`, `✶`, `✽` | `✻` |
| braille / Braille | `⠋`, `⠙`, `⠹`, `⠸`, `⠼`, `⠴`, `⠦`, `⠧`, `⠇`, `⠏` | `⠋` |
| dots / Dots | `.`, `..`, `...`, `..` | `...` |
| orbit / Orbit | `◴`, `◷`, `◶`, `◵` | `◴` |
| arc / Arc | `◜`, `◝`, `◞`, `◟` | `◜` |
| diamond / Diamond | `◇`, `◈`, `◆`, `◈` | `◆` |
| pulse / Pulse | `·`, `•`, `●`, `•` | `●` |
| blocks / Blocks | `▁`, `▂`, `▃`, `▄`, `▅`, `▆`, `▇`, `█`, `▇`, `▆`, `▅`, `▄`, `▃`, `▂` | `▄` |
| classic / Classic | `\|`, `/`, `-`, `\` | `*` |
| bounce / Bounce | `[●··]`, `[·●·]`, `[··●]`, `[·●·]` | `[·●·]` |

These are local proposed sequences, not an exact Claude Code animation claim. Pad each preset to its maximum terminal-cell width. Random reserves the largest width among its candidates so switching a one-cell glyph to Bounce cannot shift text. Reuse Loader's clock-derived frames; preset changes update native frames/cadence only, never create another busy animation interval or alter retry countdowns.

NativeActivityDecoration owns locally selected run-preset identity, independently of the extension's word selector. Inject random selection for tests. Random selects at first actual eligible display, retains the preset across phase changes/waits, and avoids immediate repeats when periodically selecting from the ten candidates. No persistent random history. The default once-per-run mode allocates no switching timer. Periodically selects at most one new preset after each 8,000 visible-busy milliseconds, schedules the next deadline from now after late delivery, and restarts a fresh interval after a wait/hidden resume while retaining the current preset. Unsuppressed phase/frame/resize/theme updates never reset this deadline. Use the same run/generation ownership checks as existing decoration; old callbacks cannot select or redraw. Hidden/waiting/idle/disposed states own no preset-switching timer.

Normal word and preset deadlines are independent even though both use eight seconds. Operational text mode has no word selection/rotation resources but may still animate/switch presets. Reduced cancels both recurring resources and keeps one word and representative preset per run; Plain renders literal native status with no decorative glyph/word/switching. Switching to Reduced freezes the current word/preset; explicit user animation changes may replace that static glyph without selecting a new word. Changing animation, color or random timing alone does not reset the word, run or bag; changing timing starts the newly selected periodic interval from the change. Changing text away from whimsical/both retains any word but suspends its rotation; changing back restores it with a fresh interval, or applies the initial delay if no word has appeared yet.

Theme color resolves the existing accent token at render time. Claude uses the verified local Claude Code 2.1.287 `rgb(215,119,87)` (`#D77757`) terracotta literal; the same binary includes an alternate `rgb(255,153,51)` theme, so document the selected swatch rather than claiming universal exact Claude appearance. Use existing terminal color conversion/fallback. Color preference applies only to ordinary decorative glyph/word; retry warning and other semantic native colors stay native. No binary inspection, fetching, model call or color generation is part of runtime/build.

### 10. Replace only host-marked generic Working

The host currently constructs WorkingStatusIndicator from `workingMessage ?? defaultWorkingMessage`, and can add a separately meaningful interrupt hint or accept `setWorkingMessage` overrides. Track generic-versus-explicit message provenance at that native producer; never recognize generic status by regex, rendered text, translated text or kind alone. A kind-working custom message is still authoritative.

For ordinary generic Working after the initial delay: Whimsical renders glyph + complete word; Operational renders glyph + native Working; Both renders glyph + native Working + word. Preserve native interrupt hints separately in every mode. Before a usable word exists or on invalid-bank fallback, native Working remains available. In insufficient width, restore native Working if the full whimsical replacement cannot fit; critical hints and actual status are never dropped merely to make room for a preset or label.

Retry, compaction, branch summaries and explicit/custom working messages render their native text with no appended whimsical word in any text mode. Retain the controller's run word and existing visible-busy deadline across these native phase changes; rendering omits the label without mutating selection. Waiting is different: it suppresses owned callbacks and resumes a fresh interval, as before. Presentation toggles, previews and settings changes never synthesize lifecycle events or restart activity.

### 11. Observe foreground metadata without changing execution

For roomy ordinary activity, compose the existing glyph/word with optional host metadata, for example `✻ Noodling… (39s · Running bash · ↓913 tokens)`. The example does not add Pollinating to the immutable bank. Metadata is independent of Whimsical/Operational/Both selection and never chooses a word or random preset. Add the three booleans from decision 8 to existing normalization, nested persistence and native submenu; keep current explicit CLI overrides unchanged and add no new CLI flags. A confirmed change updates presentation without restarting the run or changing word/preset deadlines; opening settings retains existing wait/resume semantics.

Keep these observations in the native presentation responsibility, not the local word controller or a parallel lifecycle. Reuse NativeActivityDecoration's existing foreground/native run identity and scoped renderer updates. InteractiveMode forwards scalar tool names and assistant output-usage observations from its current session event handling; do not forward prompts, thinking/text deltas, arguments, results, command strings or transcripts. Preserve native explicit Working/retry/summary/compaction text and hints; when a meaningful native message already states the action, omit the optional action instead of duplicating it.

**Elapsed:** Capture a monotonic start when the existing run identity is created, including standalone native activity. Include the initial display delay, tools, retry gaps and permission waits. Preserve that origin until actual settlement/reset; phase changes and repeated agent_start within the same retained run do not reset it. Render floored whole seconds. Normal mode reuses native redraws and requests an elapsed refresh no more than once per second; if animation is absent, allow at most one run-scoped one-second refresh callback while metadata is visible and enabled. Rendering itself allocates no callback. Reduced mode still updates elapsed at most once per second, but owns no animation, word or preset-switch callback. Plain mode omits all optional metadata and owns no feature timer. Hidden/waiting/disabled/unloaded/headless states cancel refresh callbacks; resume derives time from the original start rather than replaying missed seconds. The elapsed callback does not acquire or resurrect a native status owner.

**Action:** Use existing foreground `tool_execution_start/end` identity/name events. Track only active top-level calls for the current run: one call shows `Running <tool name>`, multiple calls show `Running N tools`; when one finishes, recompute from those still active. Nested calls remain represented by their parent. During an actual assistant stream, when no tool is active, `Receiving response` is allowed; otherwise omit the action unless the native producer already supplies a meaningful status. Do not infer Thinking from silence or summarize output with an LLM. Sanitize tool names to one printable terminal line and use ANSI/Unicode cell-width helpers. A GitNexus-specific label is shown only if the host actually knows that tool/action; generic bash or MCP wrappers are not relabeled from their arguments. Late/foreign/background events cannot change current foreground metadata. These observations describe activity, not determine whether the run is busy.

**Output tokens:** Reuse host `AssistantMessage.usage.output`, whose provider semantics can include reasoning and tool-call generation. Show only the subtotal reported for main foreground assistant responses in this run, not session totals, input/cache tokens, tool results, summaries/compaction, child/subagent usage or cost. For each response lifetime established by existing message_start/end, replace its current observed usage on update rather than summing snapshots; finalize it once on message_end. Include reported retry/aborted-attempt output without counting it twice, and reset only for a new run. Current adapters report at different times (Anthropic message usage events, OpenAI response usage, or final completion chunks); no provider changes or tokenizer estimates are authorized. Initial all-zero placeholder usage is not evidence of a live count. Omit the token segment until positive reported output is available; then show `↓N tokens` as the reported subtotal, possibly unchanged while another response is unreported. Document that it is neither a final full-run total nor a continuously measured stream rate. Use `out N tokens` in ASCII mode. Unavailable reporting must not hide elapsed/action or fail the UI.

Preserve the existing footer's cumulative session totals and billing semantics; this distinct run-scoped subtotal is labeled in settings/documentation. Do not create a second counter in the footer or include metadata in protocol/transcript output. Reserve the whimsical column as before; fit the optional parenthesized metadata after critical native text/hints, dropping tokens, then elapsed, then action, and finally whimsy as width shrinks. Separators disappear with omitted fields. Both native border and status-container render paths must follow this rule without changing cursor/paste/autocomplete/focus.

## Risks / Trade-offs

The source-host API creates a cross-repository integration dependency. Document the exact qualified source revision and source launch/loading instructions; the untouched installed release will not gain this feature automatically. Do not silently update dependency pins or install a modified release.

Native wait producers and status transitions are enumerable and need real tests, not notification/focus proxies. Any newly discovered missing producer is reported to the orchestrator as an integration gap before changing the specification. Clock-derived Loader behavior affects other native consumers, so focused Loader regressions are part of the host wave.

The source-host implementation and offline test setup are present, and settings/preset wave 3 passed its gate; new metadata behavior is unimplemented and unqualified. Verification must follow host AGENTS instructions, reuse its focused test facilities, isolate package/runtime environment, and report missing prerequisites rather than claiming PASS. Existing foreign/untracked files, including `temp/` and `openspec/config.yaml`, remain untouched. Preview resource cleanup, explicit CLI precedence, stable random widths, custom Working messages, and live settings retention need focused real-source checks.

## Migration Plan

No transcript/database migration or automatic settings rewrite. Existing installations gain in-memory defaults for absent activity preferences; only user-confirmed native settings edits persist. Implement and qualify foreground metadata plus native preference/rendering integration as one coherent pending wave 4. Preserve completed waves 1–3 and the unchanged local bank/controller; extend its types only if preference compatibility requires it. Keep separate source/extension diffs and evidence; no install/publish/live-package edit occurs. Disabling/unloading removes decoration without editor migration; reverting the separate scoped source change removes the API only after the extension is disabled.

## Architecture Decision Assessment

The original cross-repository integration is recorded in accepted `docs/adr/0009-native-activity-decoration.md`. The settings/presets and foreground-metadata amendments remain within that same host-owned boundary, not a new framework, persistence mechanism, or lifecycle authority. No additional ADR or edit to the accepted historical record is needed. The owning proposal/design/specs describe the newly authorized native preference persistence and generic-text presentation; original personal-settings protections continue for implementation/testing and unrelated fields.
