# Whimsical activity indicator — local-agent implementation spec

**Status:** Proposed implementation handoff. No host repository has been inspected or modified in preparing this spec.

**Target:** The existing activity/status surface in the local coding-agent application. Determine the actual host and integration APIs from the repository; do not assume a particular Pi, herdr, web, or terminal API exists.

**Companion asset:** `activity-words.json`, containing the complete, fixed English word bank: 100 unique entries, each 13 ASCII characters or fewer in this revision.

## 1. Objective

Replace a generic indeterminate label such as `Working…` with a calm animated indicator and a whimsical label selected from a bundled, static bank.

Illustrative terminal presentation, not a pixel-perfect layout requirement:

```text
⠋ Noodling…        Thinking · 12s
⠙ Percolating…     Running a tool · 20s
⠹ Combobulating…   Compacting context · 28s
```

The operational labels in these examples are allowed only when supported by host lifecycle events. Different word choices are decoration, not different execution states.

The indicator means **the host reports an unfinished activity**, not that the model has made measurable progress. It must not imply a completion percentage, successful result, or that the remote provider is definitely advancing.

## 2. Non-negotiable constraints

- Use only complete entries from the committed `activity-words.json` for whimsical content. Select locally; never compose, rewrite, expand, or infer labels from a prompt.
- Do not use an LLM, internet search, HTTP request, remote configuration, downloaded dictionary, generated synonym list, or external command to obtain words. No runtime or build-time word generation or fetching.
- The build may validate and embed/copy the existing JSON. Future additions are explicit, reviewed source edits, not an automatic generation feature.
- Do not add spinner instructions to system/user prompts. Do not consume model tokens for this feature or inspect conversation content to choose words.
- Keep presentation separate from real lifecycle state. Labels may not dispatch tools, change state, determine whether an agent is busy, or keep a completed activity alive.
- Errors, cancellation, permission prompts, and requests for user input take precedence over whimsical content.
- Reuse the host renderer, lifecycle, configuration, clock, and scheduler facilities where appropriate. Do not introduce a new UI framework or a network/LLM dependency.

These restrictions apply to **the indicator and its word selection**, not to legitimate model or network operations performed by the host agent itself.

## 3. Scope

### Included in version 1

A fixed English word bank; local repeat-avoiding selection; integration with one existing foreground activity surface; independent animation and word-update intervals; optional elapsed time; narrow-terminal fallback; reduced-motion/plain-output behavior; lifecycle cleanup; and tests.

### Explicitly excluded

LLM-authored status sentences, context-dependent phrase generation, loading tips, typing/typewriter effects, speculative progress percentages, ETA calculation, remote personalization, user-editable word-bank UIs, background word fetching, telemetry added for this feature, and redesigning the application.

Do not duplicate an existing spinner or create extra animated rows for every tool or subagent. A larger multi-agent dashboard is outside this spec.

## 4. Repository discovery before implementation

Inspect the actual repository and briefly record:

1. Where the current busy indicator and status text are rendered.
2. Which events or authoritative state expose foreground run start/end, tool execution, waiting for input, errors, cancellation, output streaming, and teardown.
3. Whether existing controls already handle screen-reader/plain-output mode, motion, Unicode, non-TTY output, elapsed time, configuration, and testing.
4. Which component owns the visible foreground status when multiple tools or runs exist.

Map these findings to concrete files and symbols before editing. Reuse an existing implementation where possible. Do not invent APIs from product names or this document's conceptual names. If essential lifecycle signals are unavailable, describe the gap rather than simulate truthful state by reading model prose.

## 5. Presentation model and state rules

### Separate three concerns

- **Host activity:** Authoritative busy/waiting/error/finished state and any verified operational label.
- **Word selection:** Chooses one decorative entry from the local bank.
- **Rendering:** Shows the glyph, selected word, and any host-provided metadata without changing host behavior.

A component name such as `WhimsicalActivityIndicator` is proposed naming only.

### State contract

| Host condition | Indicator behavior |
| --- | --- |
| Idle / no foreground activity | Hidden; no owned recurring timers. |
| Busy, before visibility delay expires | Hidden; only the pending visibility callback is allowed. |
| Busy, visible | Animate and show the current whimsical word. Preserve actual status information. |
| Host-supported thinking / tool / compaction phase changes | Update the real state immediately. Do not reset elapsed time or change the word solely because the phase changed. |
| Output streaming | Follow the existing host's visibility policy. Replace its label only if it already displays a busy indicator during streaming; do not add a duplicate. |
| Waiting for input or permission | Remove the animated/flavor row, suspend owned timers, and preserve the host's actual prompt/status. Retain the current word in memory for a possible resume. |
| Error, cancellation, or completion | Remove the busy indicator immediately and dispose its scheduled callbacks. Preserve the host's error/result rendering. |
| Unmount, host shutdown, or replacement by another foreground run | Dispose scheduled callbacks and subscriptions owned by this component. |

If a known busy run has no more specific phase, use the generic real label `Working`, not an invented `Thinking` or tool description. If the host has no evidence of an active run at all, do not show a spinner.

Operational information may live on the same row or in an existing nearby host status surface. Do not duplicate it, overwrite it, or hide it behind the whimsical text. `Compiling`, `Searching`, `Testing`, and `Deploying` are not part of the decorative bank; such labels require actual host activity evidence.

## 6. Timing and animation

Use these version-1 defaults as constants unless the host already has equivalent settings:

| Property | Default |
| --- | --- |
| Initial visibility delay | 250 ms |
| Spinner frame interval | 100 ms, or reuse a compatible existing host animation |
| Word replacement interval | 8,000 ms after the label becomes visible |
| Elapsed text refresh | At most once per second |
| Forced minimum visible duration | None |

The word is not tied to spinner frames. A frame tick must not select a new word. Phase changes must not select a new word either.

At normal motion, choose the first word when the delayed indicator actually becomes visible. Work that ends before visibility must never flash an indicator or consume a bank entry. Advance the word after eight visible seconds of the current busy stretch.

When waiting or otherwise hidden by the host, suspend the label schedule. On resuming the same run, retain the word and give it a fresh eight-second interval; do not replay missed rotations. An already-visible run may resume immediately without another anti-flicker delay. A run that has never become visible still observes the initial visibility delay for its new busy stretch.

Keep elapsed time anchored to the foreground run start, not to frame ticks or the current word. If the host already tracks elapsed time, reuse it. Otherwise use a monotonic clock. Label this as elapsed time, not thinking time: it can include tool time and user-wait time within the same run. Hide/suspend the indicator's own elapsed updates while waiting. Never add a second elapsed counter beside an existing equivalent one.

After a delayed callback or suspended process resumes, derive the current frame and elapsed time from the clock, advance the label at most once if due, and schedule the next label change from now. Never loop through all missed frames or words.

For a new renderer only, suggested Unicode frames are:

```text
⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠇ ⠏
```

Use the host's established ASCII fallback, or `| / - \\`. Do not attempt to animate multiple glyphs at once. No shimmer, bouncing layout, letter-by-letter typing, or randomized text scrambling.

## 7. Word bank contract

The companion JSON has this shape:

```json
{
  "schemaVersion": 1,
  "locale": "en",
  "words": ["Pondering", "Noodling", "Mulling"]
}
```

This snippet illustrates the shape only. **Use the complete companion file, not the three-entry illustration.**

Each entry is display text without an ellipsis. The renderer adds exactly one ellipsis: Unicode `…`, or ASCII `...` in plain-character mode. Do not store punctuation variants as separate entries.

Validate the committed asset in tests/build tooling: supported schema and locale, nonempty array, string entries, no leading/trailing whitespace, no case-insensitive duplicates, maximum 24 characters, and no control characters, ANSI escape sequences, bidi controls, newlines, or markup. Version 1 permits ASCII letters, with optional single interior spaces or hyphens; there is no reason to support executable formatting.

Load/validate the bank once, not on every frame. Treat the loaded array as immutable. A malformed bank must not break the agent: use the literal fallback `Working` and report at most one diagnostic through an existing developer diagnostic mechanism, if available. Do not put repeated diagnostic messages into the user transcript.

`Working` is the generic fallback, not an extra entry in the shipped 100-word bank.

### Complete version-1 bank

```text
Pondering, Noodling, Mulling, Musing, Ruminating
Contemplating, Cogitating, Deliberating, Reflecting, Considering
Imagining, Ideating, Puzzling, Wondering, Woolgathering
Percolating, Simmering, Brewing, Steeping, Bubbling
Frothing, Marinating, Kneading, Whisking, Stirring
Blending, Sifting, Seasoning, Toasting, Caramelizing
Tinkering, Fiddling, Finessing, Polishing, Buffing
Smoothing, Shaping, Sculpting, Carving, Whittling
Weaving, Stitching, Threading, Knitting, Crocheting
Braiding, Folding, Unfolding, Embroidering, Dovetailing
Sketching, Doodling, Scribbling, Coloring, Shading
Swirling, Twirling, Spiraling, Meandering, Wandering
Waltzing, Tiptoeing, Ambling, Pottering, Puttering
Riffing, Humming, Harmonizing, Resonating, Warbling
Fluttering, Flitting, Drifting, Gliding, Wafting
Glimmering, Shimmering, Twinkling, Sparkling, Sprinkling
Rippling, Undulating, Billowing, Effervescing, Crystallizing
Coalescing, Germinating, Sprouting, Blossoming, Blooming
Unfurling, Fermenting, Untangling, Unspooling, Rambling
Frolicking, Cavorting, Gallivanting, Reticulating, Combobulating
```

These are decorative metaphors. They are not categories from which the implementation should infer tasks or phases.

## 8. Selection algorithm

Use a **shuffled bag**, not repeated independent random picks.

1. Make an index array for all entries in the validated bank.
2. Shuffle the index array locally using Fisher–Yates and an injectable random source.
3. Consume entries sequentially until the bag is exhausted.
4. Refill and reshuffle. When the bank contains at least two entries and the next first entry equals the previously displayed entry, swap it with a different entry.
5. Retain bag position and last-displayed entry across runs for the lifetime of this UI instance. No disk history or cross-session persistence is needed.

This gives one use of each entry per bag cycle and prevents immediate repeats at cycle boundaries. It does **not** guarantee a full bank-length gap between all repeats across two different cycles. State the guarantee accurately in tests and documentation.

Resuming a paused run with the same retained word is not a new selection and does not consume a bag entry. Re-rendering, a theme change, a resize, or a spinner-frame tick must not consume one either.

If the bank contains a single valid entry, reuse it without looping or failing. An empty or invalid bank uses the fallback.

Inject a seeded random source in tests. Production may use the host language's ordinary local randomness; cryptographic randomness is unnecessary. Do not add an RNG package solely for this feature.

## 9. Layout, accessibility, and output modes

**Stable layout.** In a roomy terminal, reserve enough cell width for the longest bank entry plus the active ellipsis so rotating words do not push adjacent metadata back and forth. Reuse the host's terminal-width/truncation utilities. Do not use raw string length for arbitrary Unicode operational labels. For a browser renderer, use equivalent stable inline sizing within the existing design system.

**Narrow layouts.** Operational state takes precedence over whimsy. First omit duplicate or optional elapsed metadata, then omit the whimsical column. Fall back to a compact native-style row such as `⠋ Working…` or a verified real phase. Apply the host's normal safe truncation if even that does not fit. Never wrap into the input prompt or corrupt scrollback.

**Reduced motion.** When the host's reduced-motion setting is active, use a static glyph and keep one word for that run; do not rotate words automatically. Do not create an animation timer. The optional elapsed field may still refresh no more than once per second. If no host preference exists, use the smallest existing configuration mechanism rather than adding platform-detection machinery.

**Screen-reader/plain-output mode.** Use stable, literal operational text; suppress whimsical rotation and frame-by-frame announcements. Where the host has an accessibility layer, expose real state changes, not changing decorations. Do not announce the elapsed timer every second.

**Non-interactive output.** In non-TTY output, redirected logs, or an existing machine-readable mode, do not emit spinner frames, carriage-return redraws, ANSI animation, whimsical word logs, or new recurring timers. Preserve the host's normal lifecycle output.

**Theme and focus.** Reuse the existing status color/typography; do not depend on color alone. Never steal keyboard focus, change keybindings, obscure permission controls, or alter the editing buffer.

## 10. Configuration

Prefer existing controls. Add only the equivalents of these settings if genuinely needed:

| Conceptual setting | Default | Meaning |
| --- | --- | --- |
| Whimsical labels | Enabled | Disabled restores the literal/native host label while retaining its ordinary busy indicator. |
| Motion | Inherit host | Reduced motion uses a static glyph and no automatic label rotation. |

The names are conceptual, not claims about existing configuration APIs. Do not create a settings panel or expose every timing constant. Keep essential waiting/error/permission status visible regardless of whimsical-label preferences.

## 11. Lifecycle and concurrency safety

- There is one indicator owner for the existing foreground activity surface. Reuse the host's definition of that foreground run.
- Multiple tools in one run do not each own the top-level indicator. One tool finishing must not hide a parent run that the host still reports as busy.
- A background run must not replace the foreground status merely because it emitted the latest event.
- Associate scheduled callbacks with their run/generation identity. On cancellation, replacement, or disposal, invalidate that identity before clearing callbacks. A callback that was already queued must check that it still belongs to the active, visible busy run.
- Waiting/error/result updates must be applied immediately; do not wait for the next eight-second word boundary.
- Do not start timers inside render functions. Use the host's scheduler where possible; otherwise prefer one controller-owned scheduler for frame, elapsed, and label deadlines.
- While idle, terminally finished, waiting, or suppressed by non-interactive output, there must be zero recurring timers owned by this indicator. A currently busy but not-yet-visible run may own its single visibility-delay callback.
- Dispose only subscriptions/timers owned by this component, never the host's actual agent execution resources.
- Handle indicator errors locally: fall back to the host's plain status without crashing or blocking work.

## 12. Suggested implementation boundaries

Use equivalent existing modules instead of creating redundant abstractions. Proposed new files, only if the host does not already have these responsibilities:

```text
activity-words.json           fixed data asset
word-bank.<host language>     validation + shuffled-bag selector
activity-indicator.<host>     controller/render integration in existing UI
word-bank.test.<host>         deterministic selector/data tests
activity-indicator.test.<host> lifecycle, rendering, and cleanup tests
```

The host adapter should supply only run identity, authoritative lifecycle/phase, optional verified operational text, output-mode preferences, and existing elapsed data. It should not send prompts, source files, model reasoning, or conversation text to the selector.

Avoid a new state-management framework, an unrelated architectural migration, a third-party spinner library, or a custom event bus. A narrow patch to an existing status component may be all that is needed.

## 13. Acceptance tests

Use fake clocks and deterministic random inputs where possible; do not make tests sleep for real intervals.

### Bank and selection

1. The shipped bank has exactly 100 unique, valid entries. Changing the committed count later is an explicit asset/test update.
2. Every successful selection is an exact member of the bank; punctuation is added only by rendering.
3. One full bag cycle visits every entry exactly once.
4. The first selection of a new bag does not repeat the previous cycle's final selection when at least two entries exist.
5. Two selectors with the same test seed produce the same sequence.
6. Empty/malformed banks safely fall back to `Working`; a one-entry bank never loops.
7. Frames, phase changes, resizes, and paused-run resumes do not consume bank entries.

### Timing and host behavior

8. A run ending at 200 ms never displays the indicator or consumes a word.
9. A still-busy run is hidden at 249 ms and becomes visible at 250 ms under the default fake clock.
10. Its first word remains unchanged until 8,000 ms after first visibility, and then changes once. Spinner frames may advance without changing it.
11. Elapsed time is measured from host run start rather than visibility or the last label change.
12. A phase change updates real status immediately without resetting the word, label deadline, or elapsed origin.
13. A wait/permission event suppresses the flavor row immediately. The same run's resume keeps its previous word and starts a fresh label interval.
14. Error, cancellation, completion, and unmount remove the busy indicator immediately and leave no owned callbacks/subscriptions able to redraw it.
15. A stale queued callback cannot resurrect a completed indicator or overwrite a newer foreground run.
16. One child tool finishing does not hide a still-busy parent; background events do not hijack the foreground row.
17. A late callback skips missed animation/rotation steps rather than replaying a burst.

### Output and integration

18. Narrow layouts keep real state readable, remain within available width, and leave the editing buffer untouched.
19. Reduced-motion mode has a static glyph and no automatic word changes or animation timer.
20. Screen-reader/plain-output mode exposes literal state without repeated decorative announcements.
21. Non-TTY/machine-readable output produces no animation control output, word-rotation log spam, or owned timers.
22. Disabling whimsical labels restores the host's ordinary status without hiding important prompts/errors.
23. Exercise the indicator with network/model-client entry points spied or stubbed: importing, mounting, rotating, and disposing it must make zero such calls. Do not block the host agent's unrelated legitimate traffic.
24. Existing agent, cancellation, prompt, tool, and rendering tests still pass. No new dependency or lockfile changes unless justified by a real pre-existing host requirement.

## 14. Implementation sequence and handoff

**Step 1 — Inspect and map.** Identify actual files, status ownership, and lifecycle events. Report any missing integration signal before replacing truthful UI with guessed behavior.

**Step 2 — Add data and selector.** Commit the supplied bank unchanged, add validation and shuffled-bag selection, and prove the selection rules with deterministic tests.

**Step 3 — Integrate narrowly.** Connect the existing busy renderer to selection and timing while retaining host lifecycle authority, real status, cancellation, prompts, and streaming policy.

**Step 4 — Add mode handling and cleanup.** Cover reduced motion, non-TTY output, layout constraints, stale callbacks, and concurrency without redesigning the host.

**Step 5 — Verify and report.** Run automated tests and manually inspect fast completion, a long busy run, tool transitions, permission wait/resume, cancellation, an error, narrow output, and non-interactive output. Report actual results, not hypothetical passes.

The final coding-agent handoff must include changed files and why, the exact lifecycle events used, test commands/results, any actual dependency change, known limitations, and how to turn off whimsical labels. Do not claim implementation or API compatibility that was not verified in the checkout.

## 15. Copyable instruction for the local coding LLM

> Implement the attached `implementation-spec.md` in the current repository using the complete attached `activity-words.json`. First inspect and map the actual status renderer, authoritative activity lifecycle, and existing UI/test facilities; summarize the concrete integration plan before editing. Then make the smallest compatible patch and test it. The indicator must select complete labels only from the bundled static bank, with no runtime or build-time LLM calls, network word retrieval, generated word combinations, or prompt changes. Use a shuffled bag, an eight-second label interval, lifecycle-safe cleanup, truthful operational state, and the output/accessibility behavior in the spec. Do not add a new UI framework or redesign unrelated UI. Preserve the host agent's normal model/tool behavior. Finish with changed files, tests actually run, limitations, and the disable setting.
