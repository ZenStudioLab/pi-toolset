# Whimsical Activity Indicator

## Purpose

Give Pi's existing foreground busy indicator a locally selected decorative word while preserving authoritative activity, operational information, input controls, and output modes. This is a static-bank UI feature, not a model feature.

## ADDED Requirements

### Requirement: Native source hooks preserve decoration ownership

The approved Pi source host SHALL provide a supported native activity-decoration registration lifecycle. Registration and removal SHALL NOT replace the editor or migrate its text/state. The native foreground owner SHALL supply current run identity, owner generation, visibility, and authoritative waiting state synchronously, without exposing prompt/conversation content to selection. Disposed registrations and obsolete owner update handles SHALL have no effect.

Wait state SHALL originate at the host/runner blocking UI producers, before opening/invoking the prompt, and clear on every completion path. Nested waits, custom asynchronous factories, and noncapturing or hidden overlays SHALL remain authoritative until their waiting operation ends. Existing asynchronous extension events SHALL NOT be used as the wait authority. No new execution state system SHALL be introduced.

#### Scenario: Enable and unload with live editor state

- **WHEN** decoration is registered or removed while the editor has text, a nonterminal cursor, collapsed paste, autocomplete, or focus
- **THEN** the same editor state remains intact without raw-text migration
- **AND** disposal stops owned callbacks and restores native status presentation

#### Scenario: Reordered notifications and ownership changes

- **WHEN** legacy prompt-end notification arrives before prompt-start, or an editor changes while native status remains active
- **THEN** synchronous producer state still controls suppression and resume
- **AND** obsolete registrations/owner handles cannot mutate the current surface or native loader

### Requirement: Decorative words come only from the supplied static bank

The indicator SHALL load the bundled `activity-words.json` directly and validate it once. The initial asset SHALL contain the supplied schema version 1, locale `en`, and exactly 100 case-insensitively unique words, in their supplied order and spelling, without ellipses. It SHALL NOT generate combinations, infer words from prompts/conversation/code, change model prompts, invoke model clients, retrieve dictionaries, execute commands to obtain words, or fetch word content at runtime or build time. These restrictions SHALL NOT block the host's legitimate model/tool/network activity.

Validation SHALL reject unsupported schema/locale, empty arrays, nonstrings, duplicates, edge whitespace, entries over 24 characters, and characters other than ASCII letters with optional single interior spaces or hyphens. Invalid or unavailable data SHALL fall back to literal `Working`, without crashing or repeated transcript diagnostics. A valid single-entry bank SHALL work without an infinite loop. Rendering SHALL add exactly one Unicode ellipsis, or ASCII `...` in explicit ASCII mode.

#### Scenario: Shipped bank and punctuation

- **WHEN** the initial asset is validated and a label is rendered
- **THEN** the bank contains the complete supplied 100 entries, each at most 13 characters
- **AND** the selected text is an exact bank entry and its ellipsis is added only by rendering

#### Scenario: Indicator runs without model or network calls

- **WHEN** the indicator is imported, displayed, rotated, and disposed with model/network entry points monitored
- **THEN** those indicator operations make zero model/network calls and do not inspect prompt or conversation bodies
- **AND** host-reported action names and scalar usage metadata never influence decorative selection

#### Scenario: Invalid and minimal banks

- **WHEN** a supplied bank is malformed, empty, unavailable, or contains one valid word
- **THEN** invalid data uses `Working…` and the single-word bank reuses that word safely

### Requirement: Selection provides repeat-avoiding local variety

The selector SHALL shuffle the entire validated bank locally, consume each entry once per bag, and reshuffle only after exhaustion. With at least two entries, a new bag's first selection SHALL differ from the last displayed selection. Selection SHALL accept injected randomness for deterministic tests and retain bag position across runs in the same application UI runtime. It SHALL NOT persist history to disk. A full-bank gap between all repeats across different bags is not guaranteed.

#### Scenario: Reproducible cycles

- **WHEN** two selectors use the same test seed and consume multiple bags
- **THEN** their sequences match, every bag visits all entries exactly once, and adjacent bag boundaries do not immediately repeat

#### Scenario: Rendering does not select words

- **WHEN** spinner frames, resizes, theme changes, operational phase changes, or paused-run resumes occur
- **THEN** they do not consume a new bank entry solely because of that event

### Requirement: Visibility and label timing are independent

A newly busy stretch that has never displayed its indicator SHALL wait 250 ms before display and select its first word only at actual display. An operation finishing before that delay SHALL neither flash nor consume a word. The label SHALL change every 8,000 ms while visible and busy, measured from first visibility or resume, independently of the native spinner's animation clock. There SHALL be no forced minimum visible duration. Native animation SHALL be reused at its existing configured cadence (80 ms by default on the approved source host). Frames SHALL be derived from monotonic elapsed time rather than the number of callbacks. This requires a narrow native Loader change, not a new animation facility.

#### Scenario: Short and long work

- **WHEN** one run ends at 200 ms and another remains busy through 250 ms
- **THEN** the first consumes no word and never appears
- **AND** the second is hidden at 249 ms and visible at 250 ms

#### Scenario: Separate frame and word clocks

- **WHEN** a visible run animates for eight seconds
- **THEN** frame changes leave its word unchanged until 8,000 ms after visibility, when one new word is selected

#### Scenario: Late callbacks

- **WHEN** a scheduled update arrives late after a suspended process resumes
- **THEN** missed rotations are not replayed, at most one due word is selected, and the next rotation is scheduled from now
- **AND** the native frame reflects elapsed time without replaying missed animation ticks

### Requirement: The native lifecycle and foreground owner remain authoritative

The indicator SHALL decorate the existing native foreground status surface and SHALL NOT create a second spinner, tool/subagent status system, transcript message, or footer animation. The host's supplied foreground status SHALL determine whether activity is unfinished and which operational text is displayed. Whimsical labels SHALL NOT determine activity, invent phases, percentages, progress, ETA, or success.

Meaningful operational labels and critical hints SHALL remain visible in their existing native location or the decorated surface, without duplication. The host's generic Working label alone MAY be replaced by the complete whimsical label in the selected Whimsical text mode; an explicit/custom working message SHALL remain authoritative regardless of its status kind. Native interrupt hints SHALL remain intact. Tool completion SHALL NOT terminate decoration while the host's parent run remains busy. Background children SHALL NOT acquire the foreground surface merely by emitting the latest event. Streaming SHALL retain the host's existing visibility policy.

#### Scenario: Phase change and concurrent tools

- **WHEN** the native foreground owner moves from ordinary working to tool execution or compaction, or one of several tools finishes
- **THEN** verified native operational information updates immediately, the retained word does not change solely because of the transition, and unfinished parent activity remains indicated

#### Scenario: Background activity

- **WHEN** a background child reports activity while another run owns the native foreground surface
- **THEN** the child does not replace, hide, or relabel that surface

#### Scenario: Native recovery information

- **WHEN** Pi displays retry, context-overflow, compaction, or branch-summary information
- **THEN** its native label, countdown, and cancellation hints take precedence over decoration
- **AND** a decoration callback cannot replace the native status owner

### Requirement: User waits and terminal outcomes take precedence

On an authoritative blocking prompt/wait, the indicator SHALL immediately suspend animation and label callbacks, hide decoration, and preserve the real prompt and focus. It SHALL retain the word for the same run. Resume SHALL restore that word and start a fresh eight-second interval without replaying missed rotations. A previously visible run SHALL resume without a new display delay; a never-visible run SHALL observe a fresh 250 ms delay. An idle prompt SHALL NOT start activity on dismissal. Overlapping prompts SHALL remain suppressed until the host reports the wait is over.

Terminal run error, cancellation, completion, or teardown SHALL remove the busy decoration immediately. A failed child tool is not necessarily a terminal parent error. Automatic retry/compaction/queued continuation SHALL follow the host's real status; an intermediate agent-loop end SHALL NOT be treated as final application settlement.

#### Scenario: Permission wait and resume

- **WHEN** a visible run requests confirmation, waits more than eight seconds, and then resumes
- **THEN** its real prompt remains usable, it consumes no word while waiting, and it resumes with the retained word and a fresh rotation interval

#### Scenario: Completion during a pending wait or delay

- **WHEN** the run ends, is cancelled, errors, or is replaced before a scheduled callback or prompt-end event runs
- **THEN** the old callback/event cannot resurrect it, consume a word for it, or overwrite a newer foreground run

### Requirement: Scheduled work is lifecycle safe

Callbacks SHALL be associated with a run/generation and current native status owner. Hidden, waiting, idle, completed, replaced, and disposed indicators SHALL own no recurring timers. A not-yet-visible busy stretch SHALL own at most its single visibility callback. Timer/subscription cleanup SHALL be idempotent on run end, session replacement, reload, and shutdown. Rendering SHALL NOT start timers or select words. Cleanup SHALL NOT cancel agent execution, tools, or unrelated host resources.

#### Scenario: Stale generation

- **WHEN** a queued callback from a cancelled run executes after a new run starts
- **THEN** it has no effect on either run's rendered state or selection

#### Scenario: Lifecycle cleanup

- **WHEN** completion, cancellation, error, waiting, unmount, reload, or session replacement occurs
- **THEN** owned callbacks cannot redraw hidden or obsolete content and subscriptions owned by a disposed instance are removed

### Requirement: Layout preserves real status and editing behavior

In sufficient width, the word SHALL occupy a stable terminal-cell width based on the longest bank entry and active ellipsis. Width calculations SHALL respect ANSI sequences and Unicode operational labels. In narrow layouts, optional output-token metadata SHALL be removed first, elapsed second, action third, and whimsy fourth, before native operational information is truncated. Omitted fields SHALL leave no dangling separators or empty parentheses. The native editor's overflow hint and input space SHALL retain their existing priority. The indicator SHALL NOT wrap into the prompt, mutate the editing buffer, change keybindings, or steal focus.

#### Scenario: Resize and narrow output

- **WHEN** the terminal narrows, contains wide/ANSI operational text, or displays the editor's overflow hint
- **THEN** every line fits the available width, optional decoration disappears before real status is sacrificed, and input text, cursor, prompt focus, and cancellation controls remain unchanged

#### Scenario: Stable label column

- **WHEN** different-length bank entries rotate in a roomy layout
- **THEN** adjacent native metadata does not shift horizontally

### Requirement: Motion and output preferences are respected

Reduced-motion mode SHALL use the selected preset's static representative glyph, retain one unchanged word/preset per run absent an explicit user preference change, and create no animation, word-rotation or preset-switching timer. Plain/screen-reader mode SHALL use stable literal operational text with no decorative announcements or elapsed-time announcements. Native persisted preferences SHALL be inherited unless explicitly overridden by existing invocation controls. The approved amendment SHALL provide a native settings submenu without a separate extension settings system or OS-detection machinery.

Print, JSON, RPC, redirected, and non-TTY output SHALL emit no indicator animations, carriage-return redraws, rotating-word logs, or new indicator timers, while preserving host protocol output. Interactive eligibility SHALL depend on terminal mode/output, not merely availability of dialogs.

#### Scenario: Reduced motion

- **WHEN** reduced motion is enabled for a long busy run and it waits and resumes
- **THEN** the glyph is static, its word remains unchanged, and no animation or label-rotation timer runs

#### Scenario: Literal and machine-readable output

- **WHEN** Pi is in plain/screen-reader mode or a non-interactive output mode
- **THEN** decorative output and announcement spam are absent and real operational/protocol output remains intact

### Requirement: Foreground elapsed time is truthful and bounded

When enabled and the native activity indicator is visible, elapsed metadata SHALL show floored whole seconds since the current foreground run began, using a monotonic origin. The origin SHALL include initial delay, tools, retry gaps and user waits; same-run phase changes, word/preset rotation, settings changes and resume SHALL NOT reset it. Standalone native activity SHALL use its own host-owned lifetime. Actual settlement or run replacement SHALL remove the old metadata; a new run SHALL have a new origin. This amendment authorizes the ordinary-activity elapsed counter that the earlier contract excluded.

Elapsed SHALL refresh no more than once per second and SHALL reuse existing native redraw facilities where possible. At most one elapsed-refresh callback SHALL exist while the counter is visible and enabled, including in Reduced motion. Hidden/waiting/disabled/idle/disposed states SHALL own no elapsed-refresh callback; resume SHALL display current elapsed time without replaying missed ticks. Elapsed SHALL NOT duplicate an existing elapsed display or replace a retry countdown. Plain/screen-reader and noninteractive output SHALL omit this optional metadata and allocate no refresh callback.

#### Scenario: Elapsed origin

- **WHEN** a run passes through initial delay, tool execution, retry, rotation and a long permission wait, then resumes
- **THEN** its counter measures the same foreground run from its start, including wait time, without resetting
- **AND** the wait owns no elapsed-refresh callback and resume does not replay missed seconds

#### Scenario: Reduced and stale elapsed updates

- **WHEN** Reduced motion is active with elapsed enabled, or a callback queued for an old run executes after cancellation and replacement
- **THEN** Reduced keeps its word and glyph static while elapsed refreshes at most once per second
- **AND** the old callback cannot redraw or modify the current run

### Requirement: Current action comes from foreground host observations

When enabled, the optional action segment SHALL describe only a current foreground action known by the host. One active top-level tool SHALL show its reported name; several concurrent tools SHALL show their active count rather than an arbitrary latest tool. Finishing one tool SHALL preserve the remaining active actions and SHALL NOT decide whether the parent is busy. Nested tools SHALL remain represented by their top-level parent, and background/obsolete events SHALL NOT relabel the foreground surface. No active tool name SHALL remain after that tool finishes.

A response-reception label SHALL appear only during an actual assistant stream. With no verified specific action, the segment SHALL be omitted rather than inventing a phase. Action labels SHALL NOT be generated from prompt/conversation text, thinking content, raw command arguments, tool results or inferred intentions, and SHALL make no new model/network call. Tool names SHALL be sanitized to a single printable terminal line. Metadata changes SHALL update presentation without consuming words/presets or resetting their existing deadlines. Important native status and critical hints SHALL retain priority; an action already conveyed by meaningful native text SHALL NOT be duplicated.

#### Scenario: Concurrent foreground tools

- **WHEN** two foreground tools are active and one finishes
- **THEN** the action changes from the active-tool count to the remaining tool's actual name
- **AND** the parent indicator, elapsed origin and retained whimsical word remain governed by the existing host lifecycle

#### Scenario: No inferred context or background takeover

- **WHEN** the host runs a generic wrapper, receives streamed assistant text, or observes unrelated background work
- **THEN** it does not infer a more specific tool/action from arguments or text
- **AND** only verified foreground observations can change the optional action segment

### Requirement: Output tokens represent reported foreground usage

When enabled, the token segment SHALL show the reported output-token subtotal for the current run's main assistant responses, including reported retry/aborted-attempt output. It SHALL use host/provider output-usage semantics, including reasoning or tool-call generation where that provider includes them. It SHALL NOT represent cumulative session usage, input/cache tokens, tool-result or subagent usage, compaction/summary usage, a budget, percentage, stream rate or final complete-run total. Existing footer session usage and billing SHALL remain unchanged.

Repeated snapshots for one response SHALL replace its current usage contribution rather than accumulate it again; finalization SHALL count that response only once. A new run SHALL reset the subtotal, while native phase changes and waits SHALL retain it. Metadata SHALL not be attributed to a different foreground run after reset/replacement. The count SHALL use provider reports only: no tokenizer estimates, character-based estimates, provider modifications or additional requests. Initial zero placeholder fields SHALL NOT be presented as measured live usage. Until positive reported output exists, the segment SHALL be omitted; afterward it SHALL show the latest reported subtotal even when the current response has not yet reported usage. Settings/help SHALL explain that reports may arrive only at response completion and the displayed subtotal may be incomplete or unchanged while work continues. Unicode presentation SHALL use `↓N tokens`; ASCII presentation SHALL use `out N tokens`.

#### Scenario: Incremental snapshots and final report

- **WHEN** one response reports 100 output tokens, later 150, then ends with 150, and a second response reports 40
- **THEN** the run subtotal progresses to 100, 150 and 190 rather than double-counting snapshots or finalization
- **AND** word/preset timing and existing session totals are unaffected

#### Scenario: Usage unavailable or delayed

- **WHEN** a provider has supplied no positive output count, or reports only at response completion
- **THEN** unavailable output is not displayed as zero or estimated from text
- **AND** elapsed/action remain independently available, and any displayed subtotal is documented as reported usage rather than a continuously exact full-run count

### Requirement: The feature is reversible and execution neutral

Whimsical labels SHALL default to enabled for eligible interactive use, with a documented disable setting and extension unloading path. Disabling SHALL restore native literal status without hiding errors/prompts. The implementation SHALL add narrow supported hooks in the approved `host/pi` source checkout and consume them through existing UI facilities, add no model/network/spinner dependency, and leave installed Pi packages, dependency pins/lockfiles, unrelated settings/editor implementations, and other extensions unchanged. Only explicit user settings changes SHALL persist activity preferences through the host's existing settings facility; implementation and tests SHALL NOT modify the operator's real personal settings. Unmodified published/installed hosts SHALL retain their native UI with one unsupported-host diagnostic; they SHALL NOT use the rejected editor-replacement fallback. Source qualification SHALL NOT be presented as live-release qualification. A competing editor/status customization SHALL be reported rather than silently overwritten; unsupported composition SHALL leave the native/custom host UI intact.

#### Scenario: Disable or incompatible customization

- **WHEN** the feature is disabled, unloaded, or cannot compose with an existing editor/status customization
- **THEN** native/custom operational information and execution remain intact, no decorative timers remain, and the limitation is reported once through existing diagnostics where applicable

### Requirement: Native activity settings persist user choices

The native settings UI SHALL offer an Activity indicator submenu with enabled/disabled, Activity text (Whimsical, Operational, Both), Animation (ten named presets plus Random), Random timing (Once per run, Periodically), Color (Theme, Claude terracotta), Motion (Normal, Reduced, Plain), existing ASCII-punctuation control, and independent Elapsed time, Current action and Output tokens toggles. Defaults SHALL be enabled, Whimsical, Asterisk, Once per run, Theme, Normal, Unicode punctuation, and all three metadata toggles enabled. Metadata SHALL obey each toggle in Whimsical, Operational and Both text modes; Plain and noninteractive suppression SHALL take precedence. Random timing SHALL be clearly relevant only when Random is selected.

The host's normal settings layering/persistence SHALL apply. Invalid or missing fields SHALL use their individual defaults without rewriting settings on read or discarding valid siblings. Only confirmed choices SHALL persist; cancelling a preview SHALL NOT change preferences. Existing explicitly supplied CLI controls SHALL override only their corresponding saved fields; absent flags SHALL NOT mask persisted settings. Invocation overrides and unavailable decoration support SHALL be accurately shown or explained. Saved preferences SHALL NOT create a spinner or word source without a compatible registered decorator.

#### Scenario: Persisted choices and explicit overrides

- **WHEN** a user saves Reduced motion and Random animation, starts another session, and supplies no related CLI override
- **THEN** the saved choices are effective
- **AND** an explicit motion override affects only that invocation and does not overwrite saved fields

#### Scenario: Invalid preference and unsupported host

- **WHEN** one persisted field is invalid or the decorator is unavailable
- **THEN** valid sibling preferences and unrelated settings remain intact
- **AND** unsupported use keeps native UI without new animation or word resources

### Requirement: Text mode changes only generic activity wording

For ordinary generic activity, Whimsical mode SHALL show the chosen glyph and complete whimsical word without generic Working; Operational SHALL show native Working without a whimsical word; Both SHALL show both. This choice SHALL NOT remove native interrupt/cancellation hints. Before initial word visibility, or if a complete replacement cannot fit, native Working SHALL remain available. Invalid-bank fallback SHALL remain truthful literal Working.

Retry, compaction, branch-summary and explicit/custom working messages SHALL take priority, with their real text and semantic colors retained and no appended whimsical word in any text mode. Their phase changes SHALL retain the same run/word identity and existing visible-busy word deadline; they SHALL NOT choose a word merely by changing phase. Render decisions SHALL NOT inspect prompts/conversations or infer authority from message spelling.

#### Scenario: Ordinary wording and meaningful recovery status

- **WHEN** a long ordinary run uses default preferences and then the host enters retry
- **THEN** ordinary activity shows the Asterisk preset and whimsical word after its delay, without duplicate Working
- **AND** retry shows its actual attempt/countdown/cancel information instead, without changing run identity or selecting a word solely for the transition

#### Scenario: Custom working text and narrow replacement

- **WHEN** a host customization supplies an explicit working message, or a complete whimsical replacement cannot fit alongside critical hints
- **THEN** actual host wording and hints remain available rather than being silently replaced or truncated for whimsy

### Requirement: Animation presets have stable width and local previews

The selectable named presets SHALL be Asterisk, Braille, Dots, Orbit, Arc, Diamond, Pulse, Blocks, Classic and Bounce. Asterisk SHALL be the default, with `✻` as its static representative. Each preset SHALL have a fixed local frame sequence and representative glyph. Normal animation SHALL use the native animation clock/cadence, not a second busy animation loop. Presets SHALL reserve their maximum terminal-cell width; Random SHALL reserve the maximum of its candidates so its label does not jump when switching presets. ANSI/Unicode and narrow native-status priority SHALL remain respected.

The native animation picker SHALL preview its highlighted preset without changing run state, persisted selection, run-preset choice or word/bag position. Reduced/Plain settings SHALL use static previews. Closing, replacing or disposing the picker SHALL synchronously release preview resources. Changing a confirmed animation/color choice SHALL update the existing presentation without restarting the host run or selecting another word. Only changing animation SHALL NOT reset the word deadline; a legitimate settings wait/resume SHALL retain its existing lifecycle semantics.

#### Scenario: Preset selection and preview cancellation

- **WHEN** a user previews Bounce then cancels the picker during an active run
- **THEN** the saved preset, retained word and run identity are unchanged
- **AND** the preview leaves no timer or obsolete redraw callback

#### Scenario: Variable-width frames and live changes

- **WHEN** Dots animates or Random switches between Asterisk and Bounce, or a user confirms a different preset
- **THEN** the text's reserved column remains stable and all lines obey native width priority
- **AND** the animation change alone does not consume a word or restart activity

### Requirement: Random animation timing is configurable and lifecycle safe

Random SHALL select locally from the ten presets, independently of word selection and without reading conversation/code or making network/model calls. Once per run SHALL be the default: select at first actual eligible display and retain the choice through phase changes, waits and resumes. Periodically SHALL select a different preset every 8,000 ms while the native indicator is visible and busy. Rendering, frame updates, resize, theme changes and phase changes SHALL NOT trigger random selection or restart its deadline.

Waits/host hiding SHALL pause switching; same-run resume SHALL retain its preset and start a fresh eight-second interval. Late callbacks SHALL select at most one due preset rather than replaying missed switches. Switching timers SHALL be run/generation-owned and absent while waiting, hidden, idle, disabled or disposed. Reduced mode SHALL override periodic behavior with one static preset/word per run; Plain SHALL have no decorative animation/word/preset resources. Operational text mode SHALL allocate no word-selection/rotation resources while still supporting the selected animation. Tests SHALL permit deterministic random injection without persistent history.

#### Scenario: Default Random and periodic switching

- **WHEN** Random is enabled for a long run using Once per run, or using Periodically
- **THEN** Once per run retains its first choice, while Periodically changes to a different preset after eight visible-busy seconds
- **AND** word deadlines remain independent and the next run has its own local choice

#### Scenario: Wait, reduced motion and stale callbacks

- **WHEN** a periodically randomized run waits, resumes, changes to Reduced, or is cancelled before a queued callback runs
- **THEN** waiting consumes no preset choice, resume retains its preset with a fresh interval, Reduced has no recurring resource, and stale work cannot affect the new/current run

### Requirement: Color choices preserve semantic host colors

Theme SHALL be the default and resolve the host accent token on rendering. Claude SHALL use the verified Claude Code 2.1.287 terracotta swatch `rgb(215,119,87)` (`#D77757`), using existing terminal color capabilities/fallback. Documentation SHALL identify that observed swatch/version and SHALL NOT claim identical appearance across Claude themes, fonts or terminals, or exact Claude animation. Runtime/build SHALL NOT fetch, inspect an installed Claude binary, or generate colors.

Color preference SHALL apply only to ordinary decorative glyph/word. Meaningful retry/warning/native colors SHALL retain their operational meaning. Theme/color changes SHALL NOT consume words, select Random presets or restart activity.

#### Scenario: Theme updates and warning precedence

- **WHEN** the theme changes or Claude color is selected and then the host displays a retry warning
- **THEN** ordinary decorative output uses the chosen color, retry retains native semantic colors, and selected words/presets remain unchanged

## Acceptance Coverage

Implementation SHALL verify these 24 checks with deterministic randomness and fake clocks where applicable; numbering describes coverage, not a requirement for exactly 24 test functions.

| ID | Observable check |
| --- | --- |
| AT01 | Shipped JSON equals the supplied 100-word bank; schema, locale, uniqueness, and 13-character initial maximum are valid. |
| AT02 | Selected labels are exact entries and punctuation is added only by rendering. |
| AT03 | Each bag visits every entry once. |
| AT04 | New-bag boundaries do not immediately repeat with at least two entries. |
| AT05 | Equal seeds produce equal sequences. |
| AT06 | Invalid/empty/unavailable banks fall back safely; a single-word bank does not loop. |
| AT07 | Frames, phase changes, resize, themes, and resumes do not consume extra entries. |
| AT08 | Completion at 200 ms neither displays nor consumes a word. |
| AT09 | A long run is hidden at 249 ms and visible at 250 ms. |
| AT10 | First rotation occurs 8,000 ms after visibility, independently of spinner frames. |
| AT11 | Foreground elapsed metadata uses its monotonic run-start origin through delay/phases/waits; refresh is at most once per second without duplicate counters. |
| AT12 | Real phase/status changes immediately without resetting the word or elapsed origin; unsuppressed phase changes retain the label deadline. |
| AT13 | Producer-owned synchronous permission/native/custom wait state retains the word, pauses timers, handles overlaps and reordered legacy events, and starts a fresh interval only for an active run. |
| AT14 | Error/cancellation/completion/disposal/reload/session replacement remove decoration and clean up owned resources. |
| AT15 | Stale callbacks/prompt-end events cannot resurrect old work or overwrite a new owner. |
| AT16 | Child completion/background activity cannot hijack unfinished foreground work; compaction/retry/summary status is preserved. |
| AT17 | Late updates do not burst through missed rotations; native frames follow monotonic elapsed time. |
| AT18 | Narrow/ANSI/wide-character layouts prioritize real state and preserve buffer, cursor, overflow hints, and focus. |
| AT19 | Reduced motion uses a static glyph and one word per run without recurring animation/word timers. |
| AT20 | Plain/screen-reader output exposes literal native status without repeated decorative announcements. |
| AT21 | Non-TTY/print/JSON/RPC output has no animation, word log spam, or owned indicator timers. |
| AT22 | Registration/disable/unload restores native status without editor migration; live cursor/paste/focus survive, incompatible customization is not overwritten, and old source hosts stay untouched. |
| AT23 | Import/display/rotation/disposal make zero indicator-originated model/network calls and do not change prompts. |
| AT24 | Existing execution, tools, cancellation, prompt, and rendering regressions pass; no new dependencies or unjustified lockfile changes occur. |

The approved settings/presets amendment additionally SHALL verify the following observable checks. Original AT01–AT24 remain applicable with the updated generic-text and native-settings requirements above; prior qualification is not evidence for the amendment.

| ID | Observable check |
| --- | --- |
| AM01 | Default ordinary display is Asterisk plus complete word without generic Working; meaningful/custom messages and critical hints always win. |
| AM02 | Whimsical/Operational/Both choices render correctly; Operational owns no word timer, and switching modes retains existing words/bag position. |
| AM03 | Native settings offer all choices, persist through disposable storage/reload, respect layering/explicit flags, and never touch real user files. |
| AM04 | Missing/invalid fields fall back individually; absent flags inherit saved values; overridden/unavailable settings are presented truthfully. |
| AM05 | All ten local presets and static representatives work at native cadence with stable terminal-cell widths, including Random's cross-preset width. |
| AM06 | Preview/confirm/cancel use real native settings paths; preview consumes no words/run random choices and leaves no resources after every close/reset path. |
| AM07 | Once-per-run Random retains its preset through phases/waits; deterministic injection verifies independent random selection. |
| AM08 | Periodic Random switches once every eight visible-busy seconds without immediate repeats; late ticks do not burst; waits/hidden states pause with retained-preset resume. |
| AM09 | Reduced/Plain override periodic switching and suppress recurring resources; idle/disabled/noninteractive/unloaded states remain resource-free. |
| AM10 | Live animation/color/timing updates preserve run/word/bag identity and do not reset the word deadline solely for animation changes; stale callbacks cannot resurrect prior state. |
| AM11 | Theme/default and verified Claude swatch render through terminal capabilities; meaningful semantic colors, ANSI/Unicode narrow layout, buffer/cursor/paste/focus remain intact. |
| AM12 | Actual source-host settings/renderer/controller composition and existing AT regressions pass; import/preview/change/rotate/dispose remain model/network/prompt neutral without dependency or installed-release edits. |

The foreground-metadata amendment additionally SHALL verify these observable checks. Prior AT/AM qualification does not qualify this pending amendment.

| ID | Observable check |
| --- | --- |
| MD01 | Monotonic whole-second elapsed includes delay/tool/retry/wait time, survives same-run transitions, resets only on a new run and refreshes at most once per second. |
| MD02 | Real foreground tool names/counts update on start/end; nested/background/stale events do not hijack ownership, and meaningful host messages/hints are not duplicated or displaced. |
| MD03 | Reported per-response output snapshots are replaced/finalized once, multiple responses/reported retries aggregate without double-counting, and new runs reset; tool/subagent/session/input/cache/summary usage is excluded. |
| MD04 | Delayed/unavailable usage is omitted until positive reported output, with no invented zero or estimate; provider-final-only reports and ASCII punctuation are accurately documented/rendered. |
| MD05 | The three native toggles default to on, validate independently, persist through disposable settings storage/layering, and change live presentation without disturbing run/word/preset identity. |
| MD06 | Both native render paths preserve stable word columns and ANSI/Unicode cell width; narrowing removes tokens, elapsed, action, then whimsy before native information/hints, with no empty separators or input-state changes. |
| MD07 | Hidden/waiting/idle/disabled/unloaded/reset states release metadata callbacks; stale callbacks cannot resurrect them; Reduced keeps decoration static while optionally refreshing elapsed, and Plain/headless output has no metadata or feature timers. |
| MD08 | Actual source-host event/settings/renderer composition proves metadata neutrality with existing execution and AT/AM regressions; no provider, tokenizer, model/network, dependency, bank, prompt or installed-release changes occur. |
