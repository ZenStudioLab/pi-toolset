# Proposal Review — add-speak-voice-input, Wave 8 (separate sequence)

**Why this log exists:** the user authorized it on 2026-10-09 (option a). The first log, `docs/plans/reviews/add-speak-voice-input-review.md`, reached its four-round cap. Its Round 4 found two High findings: H1 (the hold reused the toggle path) and H2 (a release inferred from silence). The caller fixed them in commit `aaa5b73` and recorded `REVIEW_ACTION=HUMAN_DECISION`. This log reviews the corrected bundle.

## Frozen Baseline

BASELINE_TARGET=openspec change add-speak-voice-input (apply-ready bundle, Wave 8 amendment after the Round 4 correction batch)
BASELINE_TARGET_REVISION=sha256:cb51ddca8efcf103b05dabb29945b3c277a90b08aa7b530125585dceef86ac79
BASELINE_SOURCE=openspec/changes/add-speak-voice-input and docs/adr/0007, 0008; governing context: ADR-0002 to ADR-0006, Pi 1.1.0 host sources, the space probe and user decisions recorded in the first log's "Amendment Review — Wave 8" section, extensions/speak (current implementation, read-only context)
BASELINE_INCLUSION_PREDICATE=openspec/changes/add-speak-voice-input/proposal.md; openspec/changes/add-speak-voice-input/specs/manual-speech/spec.md; openspec/changes/add-speak-voice-input/specs/voice-input/spec.md; openspec/changes/add-speak-voice-input/design.md; openspec/changes/add-speak-voice-input/tasks.md; docs/adr/0007-voice-command-and-skill-keys.md; docs/adr/0008-hold-space-to-talk.md
BASELINE_EXCLUSIONS=implementation source and tests (Waves 1–7 reviewed by implementation gates; Wave 8 not yet written); Wave 1–7 artifact content already implemented and gate-reviewed, except where Wave 8 changes or contradicts it; unrelated extensions including extensions/pi-voicekit (reference only)

**Revision digest:** SHA-256 over UTF-8 relative path + NUL + file bytes, in the inclusion predicate's order.

**Convergence mode for Round 1:** `FULL` (a new sequence). It verifies the Round 4 corrections of the first log (H1, H2, M1–M5, L1, L2) and sweeps the whole Wave 8 bundle.

**Routing:**
- Selected reviewer: `oracle`, on `claude-bridge/claude-opus-5-5:high`, run in the background.
- Selected default implementation specialist: `worker`, on `claude-bridge/claude-sonnet-5-5:high`, run in the background.
- Focus mode: `focus`. Orchestrator mode: `normal`.

---

## Round 1 - Oracle Review

### Baseline and mode

**Mode: FULL; Round 1 of at most 4 in this sequence.** I recomputed the SHA-256 over UTF-8 relative path + NUL + file bytes, in the inclusion predicate's seven-file order:

    sha256:cb51ddca8efcf103b05dabb29945b3c277a90b08aa7b530125585dceef86ac79

It matches `BASELINE_TARGET_REVISION` and the first log's `PATCH_BASELINE_REVISION`. I took the target, source, inclusion predicate and exclusions literally and did not widen them. I read implementation code and Pi 1.1.0 only as evidence of what is feasible.

**Inherited decisions I kept:**
- Voice commands use dedicated keys (`alt+m`, `alt+i`), not a spoken trigger word.
- Matching runs against Pi's live list plus user aliases.
- A match goes into the editor and runs only on Enter.
- Hold Space is off by default, and letting go acts like the send key.
- Nothing uploads without an explicit action, and Escape always discards for free.
- The space probe stands: Ghostty with Kitty flags 1+2+4 sends a plain `" "`, repeats every 30 ms after about 0.5 s, and sends no release event.
- The Round 4 decisions stand: H1 and H2 were blocking, and M1–M5, L1 and L2 were nonblocking.

**Coverage:**
- Read all seven baseline files, plus the first log's Wave 8 amendment, its Round 4 review and its Caller Assessment.
- Pi 1.1.0 `pi-tui`:
  - `tui.js`: 678–747, covering the listener loop, cell-size consumption after the listeners, and release filtering only for the focused component; and 596–603.
  - `terminal.js`: 117–195 (bracketed paste on, no focus or mouse reporting) and 295–300.
  - `stdin-buffer.js`: 241–335, which emits complete sequences synchronously.
  - `keys.js`: `isKeyRelease`, 363–383.
- Pi 1.1.0 `pi-coding-agent`:
  - `interactive-mode.js`: 366–368, 705 and 1898–1909, and reload at 5366;
  - `agent-session.js:2966`, and `agent-session-runtime.js` for the `session_start` reasons;
  - `runner.js:613–656`, where `model` is a lazy getter, so a ctx captured at `session_start` sees later model changes.
- Speak extension: `extensions/speak/talk.ts` (484 lines), `talk-state.ts` and `index.ts`.

No network was used, the config file was not read, and no tests were run. The only file changed is this log.

### Round 4 corrections: verification

Every accepted correction is present in the bundle:

| Round 4 item | Where it is now applied | Status |
| --- | --- | --- |
| H1 (handle, idle-only start, consume, no second recognition, scenarios) | D17 `design.md:219–234`; spec `voice-input/spec.md:353–363, 384–402`; `ADR-0008:18–23`; task 8.5 `tasks.md:242–243` | Applied. The core fix is sound, but one scenario contradicts it (R1-M1). |
| H2 (`setImmediate` with arrival times, other input does not send, egress sentence, focus-loss limit, risk text, tests) | D17 `design.md:226–238, 246`; spec `:60, 359, 365, 404–412`; `ADR-0008:20, 25, 34`; risk `design.md:279` | Applied. "Other input" and "Space release" are not yet defined against Pi's input stream (R1-M2). |
| M1 (read at load, subscribe per `session_start`, clear on session change, tests) | `design.md:210–212`; spec `:344–346`; `ADR-0008:27`; `tasks.md:241, 252–254` | Applied. Feasible: Pi resets extension listeners before session invalidation and reload, then emits `session_start`. |
| M2 (propagation) | spec `:11, 27, 60, 114, 426`; D10 `:121`; D15 `:150, 152`; D16 `:173`; `manual-speech/spec.md:45`; `proposal.md:5, 35–36, 44, 52` | Applied. Two small leftovers remain (R1-L1). |
| M3 (listed vs unlisted, ADR claim, scenario) | D16 `design.md:190–197`; spec `:293–295, 317–320`; `ADR-0007:18` | Applied. |
| M4 (matcher definitions, alias errors, table cases) | D16 `design.md:180–186`; spec `:286–290, 300`; `tasks.md:220–229` | Applied. A few loose ends remain (R1-L2). |
| M5 (one count, removal, softened claim, exact text) | `design.md:215–217, 248`; spec `:350, 355, 376–377`; `ADR-0008:18, 35` | Applied. The softened claim is still wrong in one configuration (R1-M3). |
| L1 (split `config.ts`) | `tasks.md:203` | Applied. |
| L2 (four live checks, README points) | `tasks.md:261–273, 232–237, 256–259` | Applied. |

### Findings

#### R1-M1 — Medium: what a hold does when `startHold()` yields no live handle is contradictory

- **Family / root:** `hold-space / detector-controller-identity`. This is a recurrence variant of Round 4 H1. It is not structural: the handle model is sound, but the detector's behaviour when the controller is busy, refuses the start, or is reset is defined differently in different places.
- **In scope:** Yes (D17, the "Hold Space to talk" requirement, ADR-0008, tasks 8.5 and 8.7).
- **Evidence:**
  - **Spaces while busy disagree four ways:**
    - `spec.md:354` starts a recording only if nothing is active.
    - `spec.md:356` says every Space after recognition "SHALL be consumed, whether or not a recording started".
    - `design.md:224` says "Whatever happened at recognition, every further Space is consumed".
    - The scenario "Hold during another recording" (`spec.md:399–402`) expects "spaces are typed as usual".
    - `ADR-0008:18` removes "the Spaces typed since the last other input" without the "when a handle is returned" condition that `design.md:222` and `spec.md:355` add.
    - The live check "holding Space during an `alt+shift+t` recording" (`tasks.md:273`) has no expected result.
    - Task 8.5 asks for "every scenario of the requirement, stating the exact editor text" (`tasks.md:248`), so the test cannot satisfy both texts.
  - **Refusals happen after a handle exists:**
    - `design.md:220–221` lists the refused-start causes (missing key, config error, Deepgram with the stop phrase on, no recording tool) as outcomes of `startHold()`.
    - In the controller, though, all four are found inside the async `begin()`, after `this.active = claim` (`talk.ts:128–129, 160–178, 225–229`).
    - So a handle is returned first and the refusal comes later. That means the Spaces are removed under `design.md:222`, but the "Refused start" scenario (`spec.md:394–397`) states no editor text.
  - **A busy start is silent, a busy press is not:** `spec.md:60` refuses a press during a transcription "with a message". `design.md:220` says a busy `startHold()` "changes nothing", and the bundle does not say whether a recognized hold counts as a press for that rule.
  - **A session reset re-arms recognition:**
    - `design.md:212` and `spec.md:346` clear "the hold state and its timers" on `session_tree`, session switches and replacement.
    - With Space still physically held, later repeats rebuild the count, either in the same listener (`session_tree` does not drop listeners) or in the new session's listener.
    - A second recording then starts, and the release sends it. That breaks H1's "no second recognition within the same physical hold".
    - The scenario "Session replaced during a hold" (`spec.md:414–417`) promises "nothing is sent" but does not cover it. The trigger is rare (no user keystroke can cause it mid-hold), but the consent boundary is the same.
- **SUGGESTED_CORRECTION:**
  1. **Give a recognized hold one rule for each outcome.** Whether it gets a handle, is busy, is refused or is reset, the hold becomes "spent" until a release or quiet gap, and no recognition happens before then.
  2. **Choose what Spaces do while busy.** I recommend the following, which matches D5's "every other key passes through" during a key-started recording:
     - with a handle, Spaces are consumed;
     - with no handle because the controller is busy, Spaces keep reaching the editor;
     - in both cases, there is no second recognition.

     Then align `spec.md:356`, `design.md:224`, `ADR-0008:18`, the scenario and `tasks.md:273`. The other choice is to keep "consumed" and fix the scenario; this is a caller or user decision.
  3. **State the refusal timing.** Async refusals arrive after the handle, so the Spaces are already removed. Either accept and state that, or restore them. Add the exact editor text to "Refused start". Say whether a busy recognition shows the transcription-in-progress message.
  4. **Keep the "spent" state across resets.** A reset clears the recording and timers but leaves the detector consuming or passing Spaces until a quiet gap. Make the scenario "Session replaced during a hold" add: "if Space is still held, no new recording starts on the later repeats".

#### R1-M2 — Medium: "other input" and "Space release" are not defined for Pi's raw input stream or the controller's states

- **Family / root:** `hold-space / release-inference`. This is a recurrence variant of Round 4 H2. It is not structural: the corrected rules are sound in principle but too imprecise to implement or test.
- **In scope:** Yes.
- **Evidence:**
  - **Listeners see everything:** extension listeners receive all input, including Kitty release events of every key, before Pi filters releases. Pi filters releases only for the focused component (`pi-tui/dist/tui.js:685–699` versus `:743`). They also see terminal replies that Pi consumes only after the listeners, such as the cell-size reply (`tui.js:701`, queried at start when images are supported, `:596–603`).
  - **`isKeyRelease` is not Space-specific:** it matches the release of any key (`keys.js:371–381`). D17 ends a hold on "a Space release (`isKeyRelease`)" (`design.md:227`), and task 8.5 tests "a Space release from `isKeyRelease`" (`tasks.md:249`). An implementation that follows that parenthetical literally would take the release of any non-text key (arrows, Escape, alt+letter) as letting go, which **sends**.
  - **"Any other input" stops the recording:** `design.md:238`, `spec.md:365` and `ADR-0008:25` stop the hold's recording on any other input. Read literally, a release event or terminal reply after a key the user pressed counts as "other input" too.
  - **Push-to-talk keys need a key list:** push-to-talk keys "behave as usual" (`spec.md:365`). Under Kitty they arrive as CSI-u sequences, so the detector needs the registered key list and `matchesKey`. Without it, the detector first treats them as "other input" (a transcribe-only stop), and Pi's shortcut then calls `press()` on a transcribing recording, which shows a spurious "transcription in progress" warning (`talk.ts:87–91`). Nothing in D17 or task 8.5 gives the detector that list (`index.ts:145–153` holds it today).
  - **No state matrix for other input:** the bundle defines what other input does only for "recording". Unlike `releaseHold`, it says nothing for "still starting" (cancel?), "held at the cap" (upload in transcribe-only mode?), or "transcribing" (nothing, not a mode change?).
  - **No entry point for other input:** `design.md:212` says the detector reaches the controller "only through the two entry points", `startHold()` and `releaseHold(handle)`. `releaseHold` sends, so the transcribe-only stop has no entry point.
  - **The egress rule omits it:** `spec.md:60` lists "stopping a recording, sending a recording held at the time cap, or letting go of a Space hold". A transcribe-only stop triggered by typing a key during a hold uploads audio, including held audio, and is not named.
- **SUGGESTED_CORRECTION:**
  1. **Classify each input during a hold:**
     - A Space release is a release event whose key is Space. Release events of other keys, and terminal replies, are ignored: they do not count, end or stop anything.
     - Escape and the registered push-to-talk keys, matched with `matchesKey` against the load-time list given to the detector, pass through unchanged.
     - Any other key press or repeat event, and any bracketed paste, is "other input".
  2. **Use one state matrix for both endings:** replace the two entry points with `endHold(handle, "send" | "transcribe")`, or add a third, and apply the same matrix to both:
     - starting: cancel;
     - recording or held: stop in that mode;
     - otherwise: nothing.
  3. **Name the egress case:** add "typing during a Space hold" to the egress list at `spec.md:60`.
  4. **Add tests:**
     - an arrow-key release and an Escape release during a hold: no send;
     - `alt+t` as CSI-u during a hold: one send and no warning;
     - other input while the hold's recording is still starting, and while it is held.

#### R1-M3 — Medium: "letting go within 0.5 s discards it without any upload" is false when the stop phrase is on; removal ignores the cursor

- **Family / root:** `hold-space / recognition-precision`. This is a recurrence variant of Round 4 M5: the false-positive consequence it asked to record is recorded inaccurately.
- **In scope:** Yes.
- **Evidence:**
  - **The claim:** `ADR-0008:35` and `design.md:248` say three fast Spaces start a recording, and "letting go within 0.5 s discards it without any upload".
  - **Streaming starts at once:** a hold starts "as the send key would" (`design.md:220`). With `input.stopOnPhrase` on and ElevenLabs selected, that start opens the realtime WebSocket. The recorder then streams every chunk as it arrives (`design.md:152–154`; `talk.ts:185–206`, where `onChunk` calls `session.sendAudio`).
  - **The 0.5 s rule does not stop it:** that rule (`talk.ts:100–105`) discards the *message*, not audio already streamed. If the connection opens before the roughly 300 ms quiet gap, a false-positive hold from three typed Spaces sends microphone audio that the user never deliberately recorded.
  - **The privacy text does not cover it:** the privacy requirement (`spec.md:426`) covers streaming of recordings in general, but not this accidental one.
  - **Removal ignores the cursor:**
    - Spaces are inserted at the cursor, but removal works "from the end of the editor text" (`design.md:222`, `spec.md:355`).
    - With the cursor mid-draft, the hold's Spaces stay in the middle, and the release then **sends** the draft with them.
    - If the draft happened to end with that many Spaces, the wrong ones are removed.
    - The bundle does not state this.
- **SUGGESTED_CORRECTION:**
  1. **Qualify the claim** in `ADR-0008:35`, `design.md:248` and the README text of task 8.5: "without any upload while the stop phrase is off; with it on, audio captured before the release may already have streamed". Alternatively, a hold-started streamed recording could hold back its chunks until 0.5 s have passed. That is a caller or user choice.
  2. **State the cursor limit:** removal applies only when the Spaces are at the end of the text, and otherwise they stay. Add one fake-editor test with the cursor mid-text.

#### R1-L1 — Low: two Wave 8 propagation leftovers

- **Family / root:** `wave8-propagation / entry-points-modes-and-privacy`. This is a recurrence of Round 4 M2, small leftovers only.
- **In scope:** Yes.
- **Evidence:**
  - **Transcript delivery:** "Transcript delivery" (`spec.md:142`) says "The extension SHALL NOT replace the composer's text", without any scope. Command and skill delivery rewrites the editor as target, then arguments, then draft (`spec.md:293`, `design.md:195`). The specific requirement wins, but the archived general SHALL contradicts it.
  - **Help:** the help requirement (`manual-speech/spec.md:45`) names Space but not D17's help text "typing another key ends the recording without sending" (`design.md:240`).
- **SUGGESTED_CORRECTION:**
  1. Scope `spec.md:142` to the send and transcribe-only modes, pointing to "Voice command and skill keys" for command and skill delivery.
  2. Add the other-key sentence to the help requirement.

#### R1-L2 — Low: matcher loose ends

- **Family / root:** `voice-command / matcher-precision`. This is a recurrence of Round 4 M4, minor.
- **In scope:** Yes.
- **Evidence:**
  - **No expected result:** the table case "Vietnamese diacritics" (`tasks.md:225`) does not say what it should produce. For example, does "ốp" fail to match `op`?
  - **Looser spec wording:** the spec's "an alias whose target names one" (`spec.md:293`) is looser than D16's first-token rule (`design.md:193`).
  - **"Empty editor" undefined:** the unlisted-target rule (`design.md:196`, `spec.md:294`) does not say whether whitespace-only text counts as empty.
- **SUGGESTED_CORRECTION:**
  1. State the expected outcome of the diacritics case.
  2. Copy D16's first-token rule into `spec.md:293`.
  3. Define "empty" as empty after trimming whitespace.

#### R1-L3 — Low: task 8.5 omits the controller seams the design requires

- **Family / root:** `task-structure / wave8-controller-seams` (new).
- **In scope:** Yes (task text).
- **Evidence:**
  - **The handle must survive a swap:** the starting claim is replaced by a new `Recording` object (`talk.ts:128–129` versus `232–251`). The task does not say that the handle must survive this swap.
  - **The stall test needs an injected scheduler:** the "Stalled event loop" test needs the post-input `setImmediate` step to be injected, beside the clock and timers. `design.md:212` mentions only "clock and timers".
  - **The detector needs the key list:** see R1-M2.
  - **No size cap in 8.5:** task 8.3 caps `talk.ts` at 500 lines (`tasks.md:218`). Task 8.5 adds entry points and the hold status to the same file (484 lines now) without restating the cap.
- **SUGGESTED_CORRECTION:** add these four points to task 8.5.

### Checked and found sound

- **H1 core:** an idle-only `startHold()` that returns a handle, plus a `releaseHold(handle)` that does nothing once the recording has ended. This closes the toggle re-entry from Round 4.
- **H2 core:** Pi's `StdinBuffer` emits complete sequences synchronously in the `stdin` data callback (`stdin-buffer.js:311–335`), and the listener runs inside that callback.
  - A timer that fires after a stall is therefore followed by the poll phase, which reads the queued Spaces, and then by the `setImmediate` check.
  - Comparing the last Space's arrival time with the current time is a correct and testable rule.
- **Focus loss:** Pi enables bracketed paste but no focus reporting or mouse reporting (`terminal.js:128`). Focus loss therefore produces no input, and the documented limit "counts as letting go, which sends" is accurate.
- **Listener lifecycle:** Pi resets extension listeners before invalidation and reload, then emits `session_start` with the UI already started (`interactive-mode.js:366–368, 705`). A ctx captured at `session_start` reads `model` lazily (`runner.js:642`), so a hold send sees the current model.
- **Command and skill delivery:** the listed and unlisted rules, the empty-editor rule for interactive commands, the alias errors, and the "no streaming for command or skill starts" rule are consistent across ADR-0007, D15, D16 and the spec.
- **Proposal and ADRs:** both reflect Wave 8 accurately.

### Recommendation

Every Round 4 correction is applied, and the H1 and H2 fixes hold. The three Medium findings are local text precision fixes in the hold-Space families. R1-M1 is the one to fix before `/opsx-apply-loop`, because task 8.5 cannot write a test for "Hold during another recording" that satisfies both the requirement text and the scenario. R1-M2 decides how the detector reads Pi's raw input, which is the main risk for an implementation that drifts from the spec. R1-M3 corrects a privacy claim.

No finding is Critical or High, and none needs a rebuild. Whether any of them blocks is the caller's call. No implementation handoff is warranted from this review.

### Residual risks

- Key-repeat behaviour on terminals other than the probed Ghostty setup (tmux, SSH, macOS, and terminals that encode Space repeats as CSI-u) is not verified. On those terminals a hold may never be recognized.
- A Vietnamese input method (ibus or fcitx Unikey) may commit text together with a Space in one chunk. That chunk does not count as a Space, so recognition and removal there have not been probed.
- If Space is pressed again within 300 ms of letting go, the two holds merge into one recording. This is not documented.
- The frequency of event-loop stalls while the agent streams is still unmeasured.

PROPOSED_REVIEW_ACTION=PATCH

---

## Caller Assessment — Round 1

### Review Mode
- `change_bundle`

### Convergence Mode
- `FULL`

### Review Subject
- `add-speak-voice-input`, Wave 8, baseline `sha256:cb51ddca…ac79`. Oracle run `ebe45c3f`.

### Per-Issue Evaluation

#### R1-M1 — Contradictory behaviour when a hold gets no live handle
- **Oracle Severity:** Medium. **Caller severity:** High.
- **Family:** `hold-space / detector-controller-identity` (a Round 4 H1 variant, fixable in text; not structural, because the handle model holds).
- **In-scope:** `YES`
- **GOVERNING_SOURCE:**
  - "Recording starts only on an explicit action" (`specs/voice-input/spec.md:11`). A still-held Space after a session reset could start a second recording that the release sends.
  - The task 8.5 exact-text tests cannot satisfy both texts as written.
- **Decision:** `ACCEPT_BLOCKING`
- **CORRECTION:** applied as follows.
  - A recognized hold is always spent until it ends, and the spent state survives resets.
  - **Engaged hold:** Spaces are consumed.
  - **Busy hold:** Spaces keep typing, with no message.
  - The Spaces are removed only once the recorder runs, and only at the end of the text. A refused or cancelled start leaves them, and states the exact editor text.
  - ADR-0008, D17, the spec and the scenarios are aligned. Scenarios "Busy hold", "Refused start" (exact text), "Release while starting" (exact text) and "Session replaced" (no restart) are added or updated.

#### R1-M2 — "Other input" and "Space release" undefined against Pi's input
- **Oracle Severity:** Medium. **Caller severity:** High.
- **Family:** `hold-space / release-inference` (a Round 4 H2 variant).
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** the explicit-action egress rule (`spec.md:60`). As written, the release of an arrow key would end the hold and send. Concrete unintended-send risk.
- **Decision:** `ACCEPT_BLOCKING`
- **CORRECTION:** applied as follows.
  - **Input classes:**
    - a Space release must be a release event whose key is Space;
    - other releases and terminal replies are ignored;
    - Escape and the registered push-to-talk keys pass through, matched against the load-time list;
    - other presses and pastes are "other input".
  - **One entry point:** `endHold(handle, "send" | "hold")` with a state table.
  - **Other input holds the recording unsent, as at the cap,** instead of transcribing it. This is a caller choice: it adds no new egress path, so the egress list needs only the sentence that typing keeps the recording unsent.
  - Scenarios added: "Release of another key", "Send key during a hold", and an updated "Other key during a hold".

#### R1-M3 — The "without any upload" claim is false with the stop phrase on; the cursor is ignored
- **Oracle Severity:** Medium
- **Family:** `hold-space / recognition-precision` (the Round 4 M5 family)
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** None reaching the blocking threshold. The privacy documentation must be accurate (`spec.md` privacy requirement), and the fix is wording.
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** applied as follows.
  - The claim is qualified in ADR-0008 and D17, and the README streaming limit is added to task 8.5.
  - The cursor limit is stated, with the scenario "Cursor in the middle of the text".
  - The 300 ms merge of two holds is documented.

#### R1-L1 — Propagation leftovers
- **Family:** `wave8-propagation / entry-points-modes-and-privacy`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** None reaching the blocking threshold.
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** "Transcript delivery" is scoped to the send and transcribe-only modes, and the help requirement gains the other-key sentence.

#### R1-L2 — Matcher loose ends
- **Family:** `voice-command / matcher-precision`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** None reaching the blocking threshold.
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** applied as follows.
  - The expected result of the diacritics case is stated in task 8.3: precomposed and decomposed text both match.
  - The first-token rule is copied into the spec.
  - "Empty" now means empty after trimming whitespace.

#### R1-L3 — Task 8.5 seams
- **Family:** `task-structure / file-size` (with `verification-coverage`)
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** None reaching the blocking threshold.
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** task 8.5 now lists:
  - the handle's lifetime;
  - an injectable deferral;
  - the key list given to the detector;
  - the cap of 500 lines for `talk.ts`;
  - the extra tests.

### Summary
- **Issues accepted blocking:** 2 (R1-M1, R1-M2, raised to High)
- **Issues accepted nonblocking:** 4 (R1-M3, R1-L1, R1-L2, R1-L3)
- **Issues deferred out of scope:** 0
- **Issues rejected:** 0

### Caller Result

REVIEW_ACTION=PATCH
CONSENSUS_STATUS=NEEDS_REVISION

PATCH_BASELINE_REVISION=sha256:cab7f412480579e133f093a19ea3ae134e5b044bf2404b3943f845eb09b4846f (same digest method and inclusion predicate)

### Notes for Oracle (next round)
- **Fixed:** the D17 sections from Reading input to Limits were rewritten; the "Hold Space to talk" requirement and its scenarios were rewritten; the ADR-0008 Decision and Consequences were updated; task 8.5 was expanded; small edits were made to the spec's delivery, listed-target, empty-editor and egress text, the help requirement, the D16 empty-editor wording, the risk line, and the diacritics case in task 8.3.
- **Design change for your judgment:** other input during an engaged hold now holds the recording unsent, instead of transcribing it.
- **Focus:**
  - whether the spent and engaged/busy model, plus the `endHold` table, are consistent across every artifact and testable;
  - whether the new held-unsent path fits D1 and D12 (time-cap hold);
  - a bounded whole-bundle regression sweep.

---

## Round 2 - Oracle Review

### Baseline and mode

**Mode: PATCH; Round 2 of at most 4 in this sequence.** I recomputed the SHA-256 over UTF-8 relative path + NUL + file bytes, in the inclusion predicate's seven-file order:

    sha256:cab7f412480579e133f093a19ea3ae134e5b044bf2404b3943f845eb09b4846f

It equals the caller's recorded `PATCH_BASELINE_REVISION`. The target, source, inclusion predicate and exclusions are unchanged, and I did not widen them.

**Coverage:**
- Read all seven baseline files in full where hold, held state, egress, the indicator or help are involved.
- Pi 1.1.0 `pi-tui`:
  - `stdin-buffer.js:163–222` (plain text is split into one-character sequences) and `:311–315` (all of them are emitted synchronously in one data callback);
  - `terminal.js:150–178` (paste is re-wrapped and passed to the same input handler);
  - `tui.js:678–747` (listener loop, cell-size reply consumed after the listeners) and `:806–809`;
  - `keys.js` exports `isKeyRelease`, `isKeyRepeat`, `matchesKey` and `parseKey`.
- Speak extension, read-only: `talk.ts:64–67, 84–109, 120–330, 455–468` and `talk-state.ts`.

No network was used, the config file was not read, and no tests were run. The only file changed is this log.

### Round 1 corrections: verification

| Round 1 item | Where it is now | Status |
| --- | --- | --- |
| R1-M1 (spent model; engaged versus busy; refusal timing; reset) | D17 `design.md:212, 225–229`; spec `:354–358, 373`; scenarios "Refused start", "Busy hold" and "Session replaced during a hold" (`spec.md:401–410, 432–435`); `ADR-0008:18–20, 29` | **Fixed** for every case Round 1 named. Busy Spaces are typed with no message in every artifact; the refusal text is exact; the spent state survives resets. The caller's new "hold" path reopens the same root in one place (R2-H1). |
| R1-M2 (input classes; one entry point; egress; tests) | D17 `design.md:214–221, 237–244`; spec `:60, 361–371`; scenarios "Release of another key" and "Send key during a hold" (`spec.md:417–425`); task 8.5 `tasks.md:246–262` | **Fixed.** A release now has to be a Space release, other releases and replies are ignored, and push-to-talk keys pass through on the load-time list. |
| R1-M3 (claim qualified; cursor; 300 ms merge) | `design.md:229, 233, 254`; `ADR-0008:37–39`; scenario "Cursor in the middle of the text"; README items in task 8.5 | **Fixed.** One leftover on the merge wording (R2-L2). |
| R1-L1 (delivery scope; help) | `spec.md:142`; `manual-speech/spec.md:45` | **Fixed.** The help wording is ambiguous (R2-M1). |
| R1-L2 (diacritics; first token; empty) | task 8.3 `tasks.md:225`; `spec.md:293–294`; `design.md:193, 196` | **Fixed.** |
| R1-L3 (task 8.5 seams) | `tasks.md:241–256` | **Fixed.** One seam is still missing (R2-L1). |

### The caller's design change: typing during a hold keeps the recording unsent

I judge the change **sound in direction, and safer than transcribing**. The reason is about which mistakes are safe:
- Under the new rule, wrongly treating some input as "other input" only holds the recording. That is the safe direction, so an imperfect "terminal reply" check can no longer cause a send.
- The only input that can send is now a Space release, which is pinned to Space.
- No new path for audio to leave the machine is added. `ADR-0008:27` is accurate on that point.

It fits **D1, D5 and D12** in substance: the time-cap held state already exists, keeps Escape intercepted, and is never sent without a press. It is also feasible against the current controller:
- Stopping a recorder while its phase is "recording" already ends in the held state, for both an uploaded recording and a streamed one (`talk.ts:278–289`).
- A press on a held recording already transcribes it in that press's mode (`talk.ts:92–99`).

The change does, however, create four gaps, described below:
- **R2-H1:** the detector's state after "hold" is contradictory, with a send at the end of one reading.
- **R2-M1:** "held" is still defined as cap-only across the bundle, including the indicator, egress and help text.
- **R2-M2:** the 0.5 s rule and accidental holds.
- **R2-M3:** the streamed-recording meaning of "hold unsent".

### Findings

#### R2-H1 — High: after typing during a hold, the detector's next step is contradictory, and one reading sends the held recording

- **Family / root:** `hold-space / detector-controller-identity`. This recurs from Round 4 H1 and R1-M1: what the hold's ending acts on, and for how long. The recurrence was introduced by the new "hold" mode, not by a flaw in the handle and spent model. I judge it **not structural**, because one missing transition fixes it. If the caller instead counts it as a structural repeat after one accepted revision, the contract calls for `REBUILD`.
- **In scope:** Yes.
- **Evidence:**
  - **The prose ends the hold:** D17 says other input "ends the hold, and calls `controller.endHold(handle, "hold")`" (`design.md:235`). The spec says it reaches the editor "and end[s] the hold" (`spec.md:368`).
  - **The scenario keeps it going:** "Other key during a hold" (`spec.md:428–430`) expects "the remaining Spaces are consumed until the release". A hold that consumes Spaces until the release is a hold that is still running.
  - **Reading 1 sends:** suppose an implementation follows the scenario and keeps the hold, with its handle, until the release.
    - The release, usually the 300 ms quiet gap after the typed key stopped the repeat, calls `endHold(handle, "send")`, as "On ending, an engaged hold calls…" requires (`design.md:233`).
    - The table row `held | send it` (`design.md:243`; `spec.md:365`, "recording or held: send it") then **sends the recording about 300 ms after the user typed**. That is exactly what the "hold" mode exists to prevent.
    - The handle is still valid, because it "stays valid from starting through recording and held, until that recording ends" (`design.md:226`).
  - **Reading 2 can record again:** suppose the implementation follows the prose and ends the hold.
    - The spent state clears ("never recognized again until it ends", `design.md:225`).
    - If the terminal resumes Space's repeat after the other key is released, the repeats are counted from zero and recognized again. The controller is now "held", so this is a busy hold and the Spaces are typed. That contradicts the scenario.
    - Whether the repeat resumes depends on the platform and has not been probed.
  - **Tests and checks miss it:**
    - Task 8.5 tests "other input … while recording" (`tasks.md:261`) but does not test that the later quiet gap sends nothing.
    - Live check 8.7 (`tasks.md:291`) does not ask the user to wait past the gap.
- **SUGGESTED_CORRECTION:**
  1. **Add one transition.** After `endHold(handle, "hold")`, the detector **drops the handle**. The hold stays spent and keeps consuming Spaces until a Space release or quiet gap. That ending then calls nothing.
  2. **Use "detaches", not "ends".** In `design.md:235`, `spec.md:368` and `ADR-0008:27`, say "detaches the recording from the hold" instead of "ends the hold".
  3. **Add a detector state table to D17,** so the detector's states are no longer spread across prose in four files. The states are:
     - counting;
     - spent with a handle;
     - spent and detached;
     - spent and busy.

     For each state, give what Spaces do and what the ending calls. This is the second round in which this family's blocker came from a transition that was implied but never stated.
  4. **Add tests and checks:**
     - task 8.5: "another key during a hold, then no Space for 300 ms or more: nothing is sent and the recording stays held";
     - a control test: "time cap reached while Space is still held, then release: it is sent";
     - live check 8.7: "…held unsent; wait a second; nothing is sent".

#### R2-M1 — Medium: "held" is still defined as cap-only across the bundle

- **Family / root:** `wave8-propagation / entry-points-modes-and-privacy`. This recurs from Round 4 M2 and R1-L1: the "hold" path was added in D17 and the hold requirement, but not carried into the general requirements.
- **In scope:** Yes.
- **Evidence:**
  - **Indicator:** the "Recording indicator" requirement SHALL "state that the limit was reached" for a held recording (`spec.md:114`).
    - The current held line reads "Recording limit reached (N s), not sent" (`talk.ts:461–462`).
    - The scenario asks for "the held status line" after typing (`spec.md:430`).
    - Followed literally, typing a key during a hold shows a false "limit reached".
  - **Egress and talk contract:** the egress list allows "sending a recording held at the time cap" (`spec.md:60`), and the `/talk` forms say "a recording held at the time cap" (`spec.md:25`).
    - Read literally, neither permits sending a recording held because the user typed.
    - The only link is "as at the time cap" in `spec.md:370`.
  - **Design and privacy text:** these name only the cap:
    - D1 (`design.md:33`), D5 (`:73`) and D11 (`:125`);
    - the risk lines (`:277, 288`);
    - the privacy requirement (`spec.md:449`, "one held at the time cap and not sent").
  - **Help wording:**
    - "keeps the recording unsent until a key is pressed" (`manual-speech/spec.md:45`, `design.md:246`) is self-contradictory, because typing another key is itself a key press.
    - `ADR-0008:27` lists the send key, the transcribe-only key and Escape, and leaves out the command and skill keys, which also release a held recording (`spec.md:280`).
  - **No release hint at the cap:** a recording that reaches the cap while Space is still held shows the held line, which has no "release Space to send" hint, yet letting go sends it (`ADR-0008:23`).
- **SUGGESTED_CORRECTION:**
  1. **Define "held" once,** in the lifecycle requirement and D1: "held unsent, at the time cap or after typing during a Space hold". Use that term in `spec.md:25, 60, 114, 449` and `design.md:33, 73, 125, 277, 288`.
  2. **Give the indicator two held lines:**
     - "limit reached" for the cap;
     - "kept unsent" after typing.

     Both name the send, transcribe-only, command, skill and discard keys. The cap line during a hold that is still going also says "release Space to send".
  3. **Fix the help wording** to "…keeps the recording unsent until the send, transcribe-only, command or skill key, or Escape, is pressed". Add the command and skill keys to `ADR-0008:27`.

#### R2-M2 — Medium: a "hold" can keep a recording shorter than 0.5 s, and accidental holds now usually end held

- **Family / root:** `hold-space / recognition-precision`. This recurs from Round 4 M5 and R1-M3.
- **In scope:** Yes.
- **Evidence:**
  - **The 0.5 s rule does not cover the new path:**
    - The lifecycle rule discards "a recording shorter than 0.5 seconds" (`spec.md:60`).
    - In the controller, that check runs only when a press stops a recording (`talk.ts:100–105`). A press on a held recording uploads it whatever its length (`talk.ts:92–99`).
    - The D17 `hold` column says only "stop and hold unsent" (`design.md:242`).
  - **The most likely accidental hold ends this way:**
    - The ADR accepts that three Spaces typed quickly count as a hold (`design.md:254`; `ADR-0008:39`).
    - The most likely next event after such a hold is the user typing the next letter, which is "other input". The accidental recording then becomes **held**.
  - **A held accidental recording keeps blocking things:**
    - Escape is consumed, so the user's next Escape discards the held clip instead of reaching Pi.
    - `/speak` is refused (`talk.ts:64–67`).
    - The user's next push-to-talk press uploads the fragment and, if it transcribes to any words, **sends the composer** (`talk.ts:92–99`, then `deliver`). The user meant that press to start a new recording.
    - A false "limit reached" line (R2-M1) tells the user nothing useful about why.
  - **Accidental holds are more likely than the ADR says:**
    - Pi splits plain text into one-character sequences and emits all of them in the same data callback (`stdin-buffer.js:216–219, 311–315`).
    - So Spaces typed by hand during an event-loop stall arrive with the same arrival time, and count as repeats regardless of how fast they were typed.
    - The limit text, "typed within 120 ms" (`design.md:254`), understates this.
- **SUGGESTED_CORRECTION:**
  1. **Apply the 0.5 s rule to the hold path.** In the `hold` column, a recording younger than 0.5 s is discarded, not held, with the accidental-tap message, and its Spaces stay. Add a scenario and a task 8.5 case.
  2. **Extend the limit text** in `design.md:254` and `ADR-0008:39` with: "…or Spaces typed while Pi was briefly unresponsive".

#### R2-M3 — Medium: for a streamed recording, "hold unsent" must freeze the stop phrase at once, and "nothing is uploaded" is false

- **Family / root:** `stop-phrase / streamed-hold` (new). It covers how the D17 "hold" mode maps onto D15.
- **In scope:** Yes.
- **Evidence:**
  - **The table points to the wrong rule:** the `hold` cell cites D1 only (`design.md:242`). D1 describes an uploaded recording.
  - **D15's cap rule has to be reused exactly:**
    - For a streamed recording, D15's time-cap rule (`design.md:160`) applies: request the final commit and hold the text.
    - The controller marks the recording held *before* the recorder exits, so that "a late phrase cannot send it" (`talk.ts:207–212`).
    - A committed segment is acted on only while the phase is "recording" (`talk.ts:313–324`).
  - **A naive `hold` sends:** an implementation of `hold` as "stop the recorder; it becomes held when it exits" keeps the phase at "recording" during the stop window. A stop phrase committed in that window then **sends**, after the user typed. Only the spec's phrase "as at the time cap" (`spec.md:370`) covers this, and the design table does not repeat it.
  - **The scenario overstates privacy:** "nothing is uploaded until the user presses a key" (`spec.md:430`) is false with the stop phrase on.
    - The audio has already streamed.
    - The hold itself sends the final-commit message.
  - **Failure path unstated:** if that final commit fails while the recording is held, D15 appends the committed text to the composer (`design.md:162`). D17 does not say this happens to a recording held by typing.
- **SUGGESTED_CORRECTION:**
  1. Change the `hold` cell to "stop and hold unsent, exactly as at the time cap (D1; D15 for a streamed recording: held at once, final commit requested, text held)".
  2. Change the scenario to "…and nothing is sent until the user presses a key; with the stop phrase on, audio already streamed is not recalled".
  3. Add a task 8.5 case to `talk-stream.test.ts`: other input during a streamed hold, then a committed segment ending in a stop phrase. Expected result: nothing is sent, and the recording is held.

#### R2-L1 — Low: task 8.5 still lacks one seam and one predicate

- **Family / root:** `task-structure / wave8-controller-seams`. This recurs from R1-L3.
- **In scope:** Yes.
- **Evidence:**
  - **Removal needs a reverse signal:**
    - The Spaces are removed "when the recorder is actually running" (`design.md:229`; `spec.md:356`).
    - Only the controller knows when that happens.
    - Yet the detector reaches the controller "only through the two entry points" (`design.md:214`), and neither entry point reports back.
    - Neither D17 nor task 8.5 says who performs the removal, or how the detector learns that the recorder is running.
  - **"Terminal replies" has no test:** D17 ignores terminal replies (`design.md:220`), but gives no test that tells one from a key. `parseKey(data) === undefined` is available in Pi 1.1.0 (`keys.js:999`). This matters less now, because a misclassified reply only holds the recording.
  - **Two definitions of the counted run disagree:**
    - `design.md:223` says Spaces "since the last input that was not a Space", which counts an ignored release.
    - `spec.md:356` says "since the last other input", which does not.
- **SUGGESTED_CORRECTION:**
  1. **Pick the removal seam:** either a "recorder running" callback on the handle, or the controller removes a count supplied by `startHold(count)`. Name the choice in task 8.5.
  2. **Name the reply predicate.**
  3. **Align `design.md:223` with the spec:** only "other input" resets the count.

#### R2-L2 — Low: two statements are unreachable or only partly true

- **Family / root:** `hold-space / release-inference`, minor.
- **In scope:** Yes.
- **Evidence:**
  - **The 300 ms merge:** "A Space pressed again within 300 ms of letting go continues the same hold" (`design.md:233`; `ADR-0008:38`) holds only for a hold that ends by the quiet gap. After a reported Space release, the hold has already ended and sent.
  - **The chunk rule:** "A chunk of *n* spaces counts as *n* Spaces" (`design.md:217`) is never exercised in Pi 1.1.0, because `StdinBuffer` emits plain text one character at a time (`stdin-buffer.js:216–219`).
- **SUGGESTED_CORRECTION:**
  1. Qualify the merge with "when the release was inferred from the quiet gap".
  2. Keep the chunk rule as a defensive rule, but note that Pi currently delivers single characters.

### Regression sweep: checked and found sound

- **Engaged and busy holds are consistent everywhere:**
  - D17 `design.md:225–227`;
  - spec `:354–358`;
  - `ADR-0008:19–20`;
  - the "Busy hold" scenario;
  - live check 8.7, "holding Space during an `alt+shift+t` recording".
- **The `endHold` `send` column matches ADR-0008:22–25 and spec `:361–366`.** "Ended any other way" covers transcription that another control started.
- **Escape and the push-to-talk keys during a hold:**
  - Pi calls the listeners in order (`tui.js:685–699`), and the detector passes these keys on.
  - The controller's own Escape listener (`talk.ts:130–134, 252–256`) and Pi's shortcut dispatch therefore still act on them.
  - "Escape while Space is held" and "Send key during a hold" are consistent with the table.
- **Space removal timing:**
  - Removal happens only after the recorder runs.
  - The streaming connection opens before the recorder (`talk.ts:160–176`), so a refused or cancelled start, including a failed connection, leaves the Spaces.
  - That matches "Refused start" and "Release while starting".
  - Recognition happens on the fourth Space and three Spaces are typed, consistent with the `"Draft   "` text.
- **ADR-0008, D17 and the spec agree** on inputs, ending, lifecycle, limits and the alternatives, apart from the items above.
- **The proposal and ADR-0007 are unaffected** by the Round 1 edits.

### Recommendation

Every Round 1 correction is in place, and the caller's "hold" design is the safer choice. R2-H1 is the one blocker:
- The scenario and the prose disagree on whether the hold survives typing.
- Under the scenario's reading, the existing `held → send` row sends the recording about 300 ms after the user typed.

The fix is one transition (drop the handle and stay spent) plus one test. A small detector state table would stop this family from recurring a third time. R2-M1 to R2-M3 are local propagation and wording fixes, and R2-M2 and R2-M3 each add one row or one cell.

No implementation handoff is warranted from this review.

### Residual risks

- **Repeat after another key:** whether a terminal resumes Space's repeat after the other key is released is unprobed. R2-H1's correction makes this harmless either way.
- **Unmeasured inputs:** the frequency of stalls while the agent streams, and how input methods commit text, remain unmeasured, as in Round 1.
- **Escape semantics:** a held recording intercepts Escape. With "hold" now a common outcome, users who press Escape to interrupt the agent will discard the held clip first. This is documented behaviour for the cap, not a new defect, but it is now reached more often.

PROPOSED_REVIEW_ACTION=PATCH

---

## Caller Assessment — Round 2

### Review Mode
- `change_bundle`

### Convergence Mode
- `PATCH` (Round 2). The candidate `sha256:cab7f412…846f` was verified by the Oracle.

### Review Subject
- `add-speak-voice-input`, Wave 8. Oracle run `75854bbd`.

### Per-Issue Evaluation

#### R2-H1 — A hold that goes on after typing sends 300 ms later
- **Oracle Severity:** High
- **Family:** `hold-space / detector-controller-identity`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:**
  - The explicit-action egress rule (`specs/voice-input/spec.md:60`).
  - The user's requirement that only letting go of Space sends.
- **Decision:** `ACCEPT_BLOCKING`
- **Structural judgment:** this family was revised in Round 4 of the first log (H1) and again in Round 1 here (R1-M1), and it recurs. Its root is the caller's own Round 1 choice to keep a recording "held unsent" after other input. That added a third hold outcome, and its safeguards spread across D1, D5, D11, D12, D15, the indicator, help and egress (R2-M1, R2-M2, R2-M3). This is a structural recurrence, so the caller rebuilds instead of patching. The global kernel also requires narrowing the owning specification when safeguards grow more complex than the feature they protect.
- **CORRECTION:** see the rebuild batch below.

#### R2-M1 — "Held" described as cap-only in many places
- **Family:** `wave8-propagation / entry-points-modes-and-privacy`
- **Decision:** `ACCEPT_NONBLOCKING`. The rebuild makes it moot: no held state is created by other input, so the cap-only texts stay correct. The help sentence and the ADR-0008 wording for push-to-talk keys are corrected in the batch.

#### R2-M2 — The 0.5 s minimum on the "hold" path, and freeze-queued Spaces
- **Family:** `hold-space / recognition-precision`
- **Decision:** `ACCEPT_NONBLOCKING`. The rebuild makes the held clip moot. Freeze-queued Spaces counting as a hold is documented as a limit: a release within 0.5 s sends nothing.

#### R2-M3 — "Hold" for a streamed recording
- **Family:** `hold-space / release-inference`
- **Decision:** `ACCEPT_NONBLOCKING`. Moot after the rebuild: discarding a streamed recording follows the existing Escape path (D15), which closes the connection and sends nothing.

#### R2-L1 — Recorder-start signal, terminal replies, and the counted-run definition
- **Family:** `task-structure / file-size` (with `verification-coverage`)
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** in the batch:
  - the handle reports when the recorder runs;
  - "ignored" means input that pi-tui's `parseKey` cannot decode and that is not printable text;
  - one definition of the counted run, used in D17 and the spec.

#### R2-L2 — The 300 ms merge, and the n-space chunk
- **Family:** `hold-space / recognition-precision`
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** in the batch: the merge is stated only for terminals that report no release, and a Space is a single-space input.

### Rebuild

The prior incremental worklist is invalidated. The baseline is re-derived from the same authoritative sources. Target, source, inclusion predicate and exclusions are unchanged from the Frozen Baseline above. The prior baseline is invalid because the design choice "other input holds the recording unsent" is withdrawn. That changes the hold model the previous revisions assumed.

BASELINE_TARGET=openspec change add-speak-voice-input (apply-ready bundle, Wave 8 amendment after the Round 4 correction batch)
BASELINE_TARGET_REVISION=sha256:cab7f412480579e133f093a19ea3ae134e5b044bf2404b3943f845eb09b4846f (pre-rebuild; the rebuilt candidate is recorded below)
BASELINE_SOURCE=unchanged
BASELINE_INCLUSION_PREDICATE=unchanged
BASELINE_EXCLUSIONS=unchanged

**Complete correction batch** (accepted blocking: R2-H1; nonblocking items folded in):

1. **Other input discards.**
   - Any key press, printable text or paste, other than Space, Escape and the registered push-to-talk keys, during an engaged hold reaches the editor and calls `endHold(handle, "discard")`.
   - The recording is discarded exactly as Escape discards it (D1, D15): a streamed recording closes its connection, and nothing is sent.
   - The hold stays spent and consumes Spaces until it ends, and its ending then does nothing.
   - The `endHold` table becomes `send` / `discard`. The `hold` mode is removed.
2. **Propagation:**
   - the egress sentence (`spec.md`, lifecycle);
   - the help requirement;
   - the ADR-0008 decision, naming the command and skill keys among the push-to-talk keys;
   - the D17 Display section;
   - the risk line;
   - the "Other key during a hold" scenario;
   - tasks 8.5 and 8.7.
3. **Input classes** (R2-L1):
   - "ignored" is input that pi-tui's `parseKey` cannot decode and that is not printable text;
   - "other input" is a decodable press or repeat, printable text, or a paste;
   - a Space press is a single-space input (R2-L2).
4. **Counted run and recorder signal** (R2-L1): one counted-run definition in D17 and the spec, and the handle reports when the recorder runs (task 8.5).
5. **The 300 ms merge** is stated only for terminals that report no Space release (R2-L2).
6. **Freeze-queued Spaces** count as a hold; this is added to the accidental-hold limit (R2-M2).

BASELINE_REBUILD_COMPLETE=YES

### Caller Result

REVIEW_ACTION=REBUILD
CONSENSUS_STATUS=NEEDS_REVISION

This is the single permitted rebuild. If the `hold-space / detector-controller-identity` family recurs after it, the caller emits `HUMAN_DECISION`. The next review is Round 3, in `FULL` mode.

### Rebuilt Candidate

The correction batch above was applied by the caller. `openspec validate add-speak-voice-input --strict` passes.

BASELINE_TARGET_REVISION=sha256:647cbcc98d7b599c8d1f0acdac53a7147109abc05b5b934d79b1cadc584669f0 (rebuilt candidate for Round 3, in `FULL` mode)

---

## Round 3 - Oracle Review

### Baseline and mode

**Mode: FULL (after the caller's rebuild); Round 3 of at most 4 in this sequence.** I recomputed the SHA-256 over UTF-8 relative path + NUL + file bytes, in the inclusion predicate's seven-file order:

    sha256:647cbcc98d7b599c8d1f0acdac53a7147109abc05b5b934d79b1cadc584669f0

It equals the "Rebuilt Candidate" revision. The rebuild recorded the target, source, inclusion predicate and exclusions as unchanged, and I did not widen them.

**Coverage:**
- All seven baseline files, read in full, and this log's Rounds 1–2 with both caller assessments.
- Pi 1.1.0 `pi-tui`: `keys.js` `isKeyRelease` (363–384), `parseKittySequence` (417–476), `parseKey` (999–1112, ASCII-only single characters at 1095), `decodePrintableKey` (1171); `components/editor.js:804–811` (how the editor inserts raw text) and `:1070–1074` (paste filtering).
- Pi 1.1.0 `pi-coding-agent`: `core/agent-session.js:2680–2700` (`getCommands` sources) and `:2966`; `core/agent-session-runtime.js` (`session_start` reasons); a search for built-in `alt+m` and `alt+i` bindings (none found).
- Speak extension, read-only: `talk.ts:32, 64–67, 84–148, 209–233, 461–466`.

No network was used, the config file was not read, and no tests were run. The only file changed is this log.

### Rebuild correction batch: verification

| Batch item | Where it is now | Status |
| --- | --- | --- |
| 1. Other input discards; `send`/`discard` table; spent hold consumes Spaces and its ending does nothing | D17 `design.md:235, 237–244`; spec `:60, 363–368`; `ADR-0008:27`; scenario "Other key during a hold" (`spec.md:424–427`) | **Applied and consistent.** The `hold` mode is gone from every artifact. One wording leftover on uploads (R3-L2). |
| 2. Propagation: egress, help, ADR push-to-talk keys, Display, risk line, scenario, tasks 8.5 and 8.7 | spec `:60`; `manual-speech/spec.md:45`; `ADR-0008:27`; `design.md:246, 285`; `tasks.md:262, 280, 292` | **Applied.** The held status line during a hold is still unaddressed (R3-L4). |
| 3. Input classes with `parseKey`; single-space press | D17 `design.md:216–221`; spec `:349, 362, 368`; `tasks.md:246` | **Applied, but the residual class is unsafe.** "Printable text" has no predicate, `parseKey` decodes only ASCII, and paste fits two classes (R3-M1). |
| 4. One counted-run definition; handle reports the recorder running | `design.md:223, 229`; spec `:356`; `tasks.md:250` | **Applied in D17 and the spec.** `ADR-0008:19` still uses the old wording (R3-L1). |
| 5. 300 ms merge only without a reported release | `design.md:233` | **Applied in D17 only.** `ADR-0008:38` is unqualified (R3-L1). |
| 6. Freeze-queued Spaces in the accidental-hold limit | `design.md:254` | **Applied in D17 only.** `ADR-0008:39` and the README list of task 8.5 omit it (R3-L1). |

### Family check: `hold-space / detector-controller-identity`

**It does not recur.** I checked what each ending acts on and for how long, which is the family's root as Round 2 framed it:
- **One handle, one recording.** Every detector-to-controller call carries the handle of the recording that hold started (`design.md:227, 237`). The table is total: every recording state has a cell in both columns, and the row "ended any other way … an earlier `discard`" (`design.md:244`) makes the ending after a discard a no-op even if an implementation calls `endHold(handle, "send")` there.
- **The four detector states R2-H1 asked about are now derivable without contradiction:**
  - counting: Spaces reach the editor; no ending;
  - spent with a live handle: Spaces consumed; the ending calls `endHold(handle, "send")`;
  - spent with an ended handle (after `discard`, Escape, a refusal, a push-to-talk stop, the stop phrase or a reset): Spaces consumed; the ending changes nothing;
  - spent and busy: Spaces typed; no handle, so the ending calls nothing.
- **Prose and scenarios agree.** "ends the hold" no longer appears for other input; `design.md:235`, `spec.md:368`, `ADR-0008:27` and the scenario at `spec.md:424–427` all keep the hold spent until the release or quiet gap.
- **The busy hold and refusals** match the controller: a refusal is detected after the claim (`talk.ts:128–148`), so an idle `startHold()` always returns a handle, consistent with "Refused start" (`spec.md:399–402`).

Two findings below touch neighbours of this family. I classify them elsewhere, on purpose:
- **R3-M1** can produce R2-H1's harm (a send after typing), but its cause is which class an input falls into, not what the ending acts on. That is `hold-space / release-inference`, the family of R1-M2, where the input classes originated.
- **R3-L3(a)** concerns how a spent hold ends after a reset cleared its timer, which is the lifetime question of R1-M1 item 4. The artifacts agree with each other (the end condition is defined by arrival times), and the worst wrong implementation swallows one typed Space; nothing records or sends. I count it as verification coverage, not a recurrence.

### Findings

#### R3-M1 — Medium: the "ignored" input class is the residual default, and "printable text" is undefined, so typed Vietnamese text or a paste can be ignored and the release then sends

- **Family / root:** `hold-space / release-inference` (the R1-M2 lineage: classifying Pi's raw input during a hold). Not `detector-controller-identity`; not structural: one predicate and one ordering rule fix it.
- **In scope:** Yes (D17 Reading input, the "Hold Space to talk" requirement, task 8.5).
- **Evidence:**
  - **The classes:** Ignored is "input that pi-tui's `parseKey` cannot decode and that is not printable text" (`design.md:219`; `spec.md:362`). Other input is "any printable text, and any bracketed paste" (`design.md:221`; `spec.md:368`). No artifact defines "printable text".
  - **`parseKey` decodes only ASCII text:** a single character is returned only for codes 32–126 (`keys.js:1095`). A Vietnamese letter typed or committed by an input method ("ố", "ư") is not decodable. The obvious Pi helper, `decodePrintableKey` (`keys.js:1171`), decodes only CSI-u and modifyOtherKeys sequences and also returns nothing for raw text. Pi's editor inserts such input through its own fallback, the first character's code being 32 or more (`editor.js:804–811`).
  - **The consequence:** an implementation that reads "printable" through these helpers treats a Vietnamese letter typed during an engaged hold as ignored. The recording continues; the keystroke stops Space's repeat (`design.md:235`); the quiet gap ends the hold about 300 ms later; and `endHold(handle, "send")` sends the draft with the typed letter and the transcript. That is the send after typing that `spec.md:60` forbids ("Typing another key during a Space hold SHALL discard") and that the rebuild exists to prevent. The user's input language is Vietnamese (ADR-0007 Context), so this is ordinary typing, not an edge case.
  - **Paste fits both classes:** `isKeyRelease` rejects paste (`keys.js:367–369`), `parseKey` cannot decode the `\x1b[200~…` chunk, and the chunk starts with ESC, so it is "not decodable and not printable" (ignored) and also "a bracketed paste" (other input). Task 8.5 lists "bracketed paste" with no expected result (`tasks.md:264`).
  - **No test catches it:** the task 8.5 list (`tasks.md:258–269`) has no non-ASCII typed-text case.
  - **The default points the wrong way:** since the rebuild, wrongly calling an input "other" only discards, which is safe; wrongly calling it "ignored" can send. The residual class should therefore be "other input", not "ignored".
- **SUGGESTED_CORRECTION:**
  1. Make "ignored" a closed list and "other input" the default: ignored is a key-release event of a key other than Space, or input that starts with ESC, is not a bracketed paste, and that `parseKey` cannot decode (terminal replies). Any other input that is not a Space, a Space release, Escape or a registered push-to-talk key is other input.
  2. If the term "printable text" stays, define it as Pi's editor does: `decodePrintableKey(data)` is defined, or the first character's code is 32 or more (`editor.js:804–811`).
  3. State the order: a bracketed paste is checked before the ignored class.
  4. Add task 8.5 cases: a Vietnamese letter during an engaged hold, then the quiet gap (discarded, nothing sent, exact editor text); a bracketed paste (discarded, the paste reaches the editor); an undecodable ESC reply such as the cell-size reply (ignored, the hold continues).
- **Severity note:** I rate it Medium because the contract's intent is right (printable text discards) and only the predicate and default are missing. Given the consequence, the caller may reasonably treat it as High.

#### R3-L1 — Low: batch items 4–6 were applied in D17 but not in ADR-0008 or the README list

- **Family / root:** `hold-space / recognition-precision` (R1-M3, R2-M2, R2-L2).
- **In scope:** Yes.
- **Evidence:**
  - `ADR-0008:19` removes "the Spaces typed since the last other input". D17 and the spec now say "since the last input that was not a Space" (`design.md:223`; `spec.md:356`). "Other input" is now a defined class that excludes ignored input, Escape and push-to-talk keys, so the ADR states a different rule.
  - `ADR-0008:38`: "Pressing Space again within 300 ms of letting go continues the same hold" is unqualified; batch item 5 and `design.md:233` limit it to terminals that report no Space release.
  - `ADR-0008:39` names only "three Spaces typed by hand"; the freeze-queued case (batch item 6) is only in `design.md:254`, although D17 says the limits are "stated in ADR-0008 and the README" (`design.md:250`).
  - The README limit list of task 8.5 (`tasks.md:273–279`) omits accidental holds entirely.
- **SUGGESTED_CORRECTION:** copy the wording of `design.md:223, 233, 254` into `ADR-0008:19, 38, 39`, and add "accidental holds, including Spaces that arrive together after a pause in Pi" to the README list of task 8.5.

#### R3-L2 — Low: "nothing is uploaded" is false for a streamed hold

- **Family / root:** `stop-phrase / streamed-hold` (R2-M3).
- **In scope:** Yes.
- **Evidence:**
  - `ADR-0008:27` says "nothing is uploaded or sent", and the scenario "Other key during a hold" (`spec.md:427`) says "nothing is uploaded or sent".
  - With the stop phrase on and ElevenLabs selected, a hold-started recording streams from the moment the recorder runs (D15 Streaming; `ADR-0008:23`, "including the stop phrase rules"), and a discard cannot recall that audio (`spec.md:446`).
  - `design.md:235` is correct ("nothing is sent"). Task 8.5 asks for a streamed case of this scenario (`tasks.md:262`), which cannot satisfy "nothing is uploaded" literally.
- **SUGGESTED_CORRECTION:** say "nothing is sent and no further audio is uploaded; with the stop phrase on, audio already streamed is not recalled" in `ADR-0008:27`, and use "nothing is sent" in the scenario.

#### R3-L3 — Low: two hold cases lack an expected result

- **Family / root:** `task-structure / wave8-controller-seams` (verification coverage; R1-L3, R2-L1).
- **In scope:** Yes.
- **Evidence:**
  - **(a) Ending after a reset:** a reset clears the hold's timers and keeps the spent state (`design.md:212`; `spec.md:370`), and a spent hold ends on a quiet gap judged by arrival times (`design.md:231`). Nothing says how the spent hold ends when Space was released during the reset and the timer that would have seen the gap is gone. A literal implementation stays spent until the next Space, so the first Space typed after the session change is consumed. Nothing records or sends. The test "re-subscription after a session replacement" (`tasks.md:267`) has no expected result.
  - **(b) Exact text after a discard:** "Other key during a hold" (`spec.md:424–427`) gives no editor text, although task 8.5 requires it (`tasks.md:259`). Once the recorder ran, the hold's Spaces were removed and a discard does not restore them, as with Escape: "Draft", a hold, then "x" gives `Draftx`.
- **SUGGESTED_CORRECTION:** (a) state that a Space arriving more than 300 ms after the previous Space starts a new run even if no timer fired, and add a test: session replaced during a hold, Space released, a tap one second later types one space. (b) Add the exact editor text to the scenario.

#### R3-L4 — Low: at the time cap during a hold, the held line says "not sent" while letting go sends

- **Family / root:** `wave8-propagation / entry-points-modes-and-privacy` (the last bullet of R2-M1; the caller's "moot" reasoning covered typed holds, but cap holds still exist).
- **In scope:** Yes.
- **Evidence:** the "releasing Space sends" text is required on the recording line only (`spec.md:372`; `design.md:246`). The held line states the limit and the keys (`spec.md:114`); today it reads "Recording limit reached (N s), not sent" (`talk.ts:465`). A recording that hits the cap while Space is held is sent on release (`design.md:243`; `ADR-0008:23`), so the screen says "not sent" right before the release sends it.
- **SUGGESTED_CORRECTION:** require both the recording and the held line of a hold-started recording to say that releasing Space sends (`spec.md:372`, `design.md:246`), and add a task 8.5 case.

### Checked and found sound

- **Hold identity and table:** see the family check above.
- **Pass-through keys:** Escape and the push-to-talk keys reach their handlers through Pi's ordered listeners; "Escape while Space is held" and "Send key during a hold" agree with the table.
- **The 0.5 s rule on the send path:** `endHold(handle, "send")` on a recording follows the send key, which discards a recording younger than 500 ms (`talk.ts:32, 100–105`). "Letting go within 0.5 s sends nothing" therefore holds, and an accidental hold followed by typing now ends in the free Escape discard. R2-M2's concern is resolved.
- **Engaged and busy holds, refusals and cancellations** are consistent across D17, the spec, ADR-0008 and live check 8.7.
- **Command and skill keys (D16, ADR-0007):**
  - `pi.getCommands()` returns the sources `extension`, `prompt` and `skill`, with skills as `skill:<name>` (`agent-session.js:2680–2700`).
  - No built-in `alt+m` or `alt+i` binding exists in the Pi 1.1.0 `pi-tui` or `pi-coding-agent` builds.
  - The scenario "Spoken command goes into the editor" works out exactly under the collapsed-form and argument rules.
  - Listed and unlisted targets, the empty-after-trimming rule, the alias errors and the no-streaming rule agree across D16, `spec.md:278–300`, ADR-0007 and tasks 8.2–8.4.
- **Propagation into Waves 1–7:** the talk contract (`spec.md:25, 27`), the indicator (`:114`), the delivery scope (`:142`), stop-phrase streaming (`:229`), privacy (`:446`), D10, D11, D15, the help requirement and the proposal all reflect Wave 8.
- **Listener lifecycle:** `session_start` fires for startup, new, resume, fork and reload, and not for tree navigation (`agent-session-runtime.js`; `agent-session.js:2966`), so "one listener per session start" never stacks a second listener.

### Recommendation

The rebuild batch is applied in D17, the spec, the help requirement and the tasks, and the `hold-space / detector-controller-identity` family does not recur. The handle, the total `send`/`discard` table and the spent state now give every ending a single, safe meaning.

R3-M1 is the one to fix before `/opsx-apply-loop`. Since the rebuild, only misclassification toward "ignored" can send, and the current text makes "ignored" the default for anything `parseKey` cannot decode, which includes ordinary Vietnamese typing. The fix is a closed ignored list plus three tests. R3-L1 to R3-L4 are wording and test-coverage items, mostly the rebuild batch not yet copied into ADR-0008.

No finding is structural, and none needs another rebuild. No implementation handoff is warranted from this review.

### Residual risks

- **Repeat resuming after another key:** if a terminal resumes Space's repeat after the other key is released and more than 300 ms have passed, a new hold is recognized and, because the discard left the controller idle, a new recording starts that the next release sends. This is spec-consistent (Space is physically held and the status line shows the recording), but unprobed.
- **Unmeasured inputs:** event-loop stall frequency while the agent streams, input-method commits, and terminals other than the probed Ghostty setup remain unverified.
- **Focus loss** still counts as letting go, which sends; this is an accepted, documented limit.

PROPOSED_REVIEW_ACTION=PATCH

---

## Caller Assessment — Round 3

### Review Mode
- `change_bundle`

### Convergence Mode
- `FULL`, after the rebuild. The candidate `sha256:647cbcc9…69f0` was verified by the Oracle.

### Review Subject
- `add-speak-voice-input`, Wave 8. Oracle run `dca2bd8e`.

### Per-Issue Evaluation

#### R3-M1 — "Printable text" undefined, so a Vietnamese letter could be ignored and then sent
- **Oracle Severity:** Medium (Oracle notes it could be High). **Caller severity:** High.
- **Family:** `hold-space / release-inference`. This is a local definition gap in input classification, not a structural recurrence. The rebuilt hold model and the `endHold` table are untouched, and the `detector-controller-identity` family does not recur, as the Oracle confirmed.
- **In-scope:** `YES`
- **GOVERNING_SOURCE:**
  - The explicit-action egress rule (`specs/voice-input/spec.md:60`).
  - The user's input language is Vietnamese (`input.language: vi`), so this path is likely, not theoretical.
- **Decision:** `ACCEPT_BLOCKING`
- **CORRECTION:** applied as follows.
  - "Ignored" is now a closed list: releases of keys other than Space, and undecodable ESC-led input that is not a paste.
  - Everything else is other input, including any script and pastes, with paste recognized first. A misclassification can now only discard, never send.
  - The change is made in D17, the spec and ADR-0008.
  - Scenarios added: "Text in another script during a hold" and "Terminal reply during a hold". The matching tests are added to task 8.5.

#### R3-L1 — ADR-0008 and README leftovers
- **Family:** `hold-space / recognition-precision`
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** ADR-0008 now matches D17 on the Spaces removed, the merge only on terminals without a release event, and freeze-queued Spaces. Freeze-queued Spaces are added to the README list in task 8.5.

#### R3-L2 — "Nothing is uploaded" while streaming
- **Family:** `stop-phrase / streamed-hold`
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** ADR-0008 and the scenario now say that nothing is sent, and that audio already streamed while the stop phrase is on is not recalled.

#### R3-L3 — Missing expected results
- **Family:** `verification-coverage / wave8-live-and-docs`
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** applied as follows.
  - After a reset, the spent hold ends at the first input arriving more than 300 ms after its last Space, and that input is handled normally (D17 and spec). A test is added to task 8.5.
  - The scenario for typing during a hold now states the exact text, "Draftx".

#### R3-L4 — Held line at the cap for a hold-started recording
- **Family:** `wave8-propagation / entry-points-modes-and-privacy`
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** the held line of a hold-started recording also says that releasing Space sends (D17 Display and spec Status line).

### Summary
- **Issues accepted blocking:** 1 (R3-M1, raised to High)
- **Issues accepted nonblocking:** 4
- **Issues deferred out of scope:** 0
- **Issues rejected:** 0

### Caller Result

REVIEW_ACTION=PATCH
CONSENSUS_STATUS=NEEDS_REVISION

PATCH_BASELINE_REVISION=sha256:0d77fe153ebaca8c48dd0acc055d87446bd4fabea684d727b4769a07a7c53ebf (same method and predicate)

### Notes for Oracle (next round)
- **What changed:**
  - D17: the input classes, the reset-ending rule and Display.
  - Spec "Hold Space to talk": the ignored list, other input, the reset rule, the status line, and the scenarios "Other key during a hold", "Text in another script" and "Terminal reply".
  - ADR-0008: the removal wording, the upload claim, the merge, freeze-queued Spaces and the input classes.
  - Task 8.5: tests and the README list.
- **This is Round 4, the last of this sequence.** The caller will emit `PASS` if no accepted blocker remains, otherwise `HUMAN_DECISION`.

---

## Round 4 - Oracle Review

### Baseline and mode

**Mode: PATCH; Round 4 of at most 4 in this sequence.** I recomputed the SHA-256 over UTF-8 relative path + NUL + file bytes, in the inclusion predicate's seven-file order:

    sha256:0d77fe153ebaca8c48dd0acc055d87446bd4fabea684d727b4769a07a7c53ebf

It equals the caller's Round 3 `PATCH_BASELINE_REVISION`. The target, source, inclusion predicate and exclusions are unchanged, and I did not widen them. `git diff 47446d8 80cb230` shows that only `design.md`, the voice-input spec, `tasks.md` and ADR-0008 changed; the proposal, the manual-speech spec and ADR-0007 are byte-identical to the Round 3 candidate.

**Coverage:**
- All four changed files, read in full where Wave 8 is concerned (D17 and Risks, "Hold Space to talk" and the lifecycle requirement, task 8.5–8.8, ADR-0008). The unchanged files were swept again only for Wave 8 statements that the Round 3 edits could contradict.
- Pi 1.1.0 `pi-tui`, read and exercised locally with `node` (no network):
  - `keys.js`: `parseKey` (999), `parseKittySequence` (417, with `funcCodes` at 453 covering only 2, 3, 5, 6, 7 and 8), `isKeyRelease` (363);
  - `tui.js:675–746`, the input path: color replies and color-scheme reports are consumed before the listeners (679, 682); the listeners run at 687; the cell-size reply is consumed only afterwards (702, queried at 603);
  - `terminal.js`: keyboard flags 7 (12–14), the paste re-wrapped as one `\x1b[200~…\x1b[201~` chunk (174–176), program-status and keyboard-negotiation replies consumed before input (153–160, 246–257), and no focus or mouse reporting;
  - `stdin-buffer.js:163–220`: input that does not start with ESC is split into single characters.

No network was used, the config file was not read, and no repository tests were run. The only file changed is this log.

### Round 3 corrections: verification

| Item | Where it is now | Status |
| --- | --- | --- |
| R3-M1: closed ignored list, everything else is other input, paste first | D17 `design.md:219, 221`; spec `:362, 368`; scenarios `spec.md:429–437`; `ADR-0008:27`; tests `tasks.md:261` | **Applied in D17, the spec and ADR-0008, with tests.** It is not carried into task 8.5's class list (`tasks.md:246`). The closed list's second part still covers real keys that Pi cannot decode. Both points are tracked as the recurring R3-M1 below. |
| R3-L1: ADR-0008 removal wording, merge, freeze-queued Spaces; README | `ADR-0008:19, 38, 39`; `tasks.md:281` | **Applied.** The README list still leaves out the hand-typed accidental hold (R4-L1). |
| R3-L2: "nothing is uploaded" while streaming | `ADR-0008:27`; `spec.md:426–427` | **Applied and consistent** with `spec.md:446`. |
| R3-L3: reset ending; "Draftx" | `design.md:233`; `spec.md:370`; scenario `:424–427`; test `tasks.md:262` | **Applied.** The test still has no expected result, and `ADR-0008:29` keeps the older wording (R4-L2). |
| R3-L4: held line at the cap says releasing Space sends | `design.md:246`; `spec.md:372` | **Applied.** No task 8.5 case checks it, and one risk line still says "never sent without a press" (R4-L2). |

**Feasibility of the closed list against Pi 1.1.0.** Every class can be implemented exactly as written:
- A paste reaches the listener as one chunk starting with `\x1b[200~` (`terminal.js:174–176`). `parseKey` returns `undefined` for it and `isKeyRelease` returns `false`, so checking for paste first is both possible and necessary.
- A Vietnamese letter typed as plain text reaches the listener as one character that does not start with ESC (`stdin-buffer.js`). It falls outside the ignored list and is therefore other input.
- Under flags 7 its release reports as `\x1b[7889;1:3u`. `isKeyRelease` returns `true` for that, so it is correctly ignored.
- The cell-size reply `\x1b[6;20;10t` starts with ESC and `parseKey` cannot decode it, so it is ignored.

### Family check: `hold-space / detector-controller-identity`

**It does not recur.** The Round 3 edits leave the handle, the `send`/`discard` table (`design.md:237–244`) and the spent state untouched. The one new rule, the reset ending (`design.md:233`; `spec.md:370`), runs only after a reset, and a reset has already ended the handle's recording (the table's last row). That ending therefore calls nothing, or acts on a recording that is already over, and "that input is then handled normally" begins an ordinary new count. No ending can act on a different recording, or on the same recording twice.

### Findings

#### R3-M1 (recurring variant) — Medium: the "ignored" class still covers real keys that Pi cannot decode, and task 8.5 still states the old predicate

- **Family / root:** `hold-space / release-inference`, the same root as R3-M1 (the ignored class captures real user input, so a keypress can end in a send). I track it as the same issue, not a new one. It is not structural: one predicate and one task line fix it. It is not `detector-controller-identity`.
- **In scope:** Yes (D17 Reading input, the "Hold Space to talk" requirement, task 8.5).
- **Evidence:**
  - **(a) Real keys inside the closed list.** Ignored includes "input that starts with ESC, is not a bracketed paste, and that pi-tui's `parseKey` cannot decode" (`design.md:219`; `spec.md:362`). Run against Pi 1.1.0's `parseKey` with the Kitty protocol active, these real key presses return `undefined`:
    - modified function keys, `\x1b[15;2~` and `\x1b[15;5~` (Shift or Ctrl+F5), because `funcCodes` covers only 2, 3, 5, 6, 7 and 8 (`keys.js:453`);
    - `\x1b[1;5P` (Ctrl+F1) and the Kitty F1/F2 forms `\x1b[P` and `\x1b[Q`;
    - F13 and above (`\x1b[57376u`), Menu, Pause and Print Screen (57361–57363), and media and volume keys (57428 and up);
    - Ctrl or Alt with a non-Latin letter (`\x1b[7889;5u`).

    Each is ignored and the editor inserts nothing, but pressing it stops Space's key repeat. The quiet gap then ends the hold about 300 ms later, and `endHold(handle, "send")` sends the dictation while Space is still held. That contradicts the rationale at `design.md:235` and `ADR-0008:27` (another key stops the repeat, so the recording is discarded). It also falsifies the new guarantee at `design.md:221`: "anything misclassified ends in a discard, never in a send". This is a gap in my own Round 3 suggestion, which used the `parseKey` test as a stand-in for "terminal reply".
  - **What actually reaches the listener:** in Pi 1.1.0 the only terminal reply that reaches an extension input listener during normal use is the cell-size reply `CSI 6;<h>;<w>t`. It is queried at `tui.js:603` and consumed only after the listeners, at `tui.js:702`. Color replies and scheme reports are consumed before the listeners (`tui.js:679, 682`), and program-status and keyboard-negotiation replies in `terminal.js:153–160, 246–257`. Pi turns on no focus or mouse reporting. The broad `parseKey` test therefore buys nothing beyond that one reply.
  - **(b) Task 8.5 still has the pre-fix predicate.** `tasks.md:246` reads "ignored (not decodable by `parseKey` and not printable)". That is the wording R3-M1 rejected, in the artifact the worker carries out. The test at `tasks.md:261` would catch the Vietnamese-letter case, but the task's own class list contradicts D17 and the spec. "bracketed paste" also appears twice in the test list (`tasks.md:261, 266`).
  - **Consequence and calibration:** no typed text is changed and nothing is sent that the user was not already dictating to send. The harm is an early send of a possibly partial dictation, the same class as the documented focus-loss limit (`design.md:252`). The keys involved are rare during dictation, and many media keys are taken by the desktop before they reach the terminal. That puts it below High. Under `"interrupt"`, though, a partial message can redirect a running turn (`design.md:285`), so it is more than wording.
- **SUGGESTED_CORRECTION:**
  1. Narrow the ignored list to what Pi actually delivers. Ignored is release events of keys other than Space, plus the cell-size reply `CSI 6;<h>;<w>t`; everything else is other input. Unknown replies then discard, which is the safe direction. Apply this in `design.md:219`, `spec.md:362` and `ADR-0008:27`, and delete or qualify the "never in a send" sentence at `design.md:221`.
  2. Name the cell-size reply in the scenario at `spec.md:434–437`.
  3. Replace `tasks.md:246` with the D17 classes. Add a test: a modified function key (`\x1b[15;5~`) during an engaged hold, then the quiet gap, discards and sends nothing. Drop the duplicate "bracketed paste" at `tasks.md:266`.
  4. If the caller would rather keep the `parseKey` test, list instead "keys Pi cannot decode (modified function keys, F13 and above, media keys) act like focus loss: the hold sends after 300 ms" among the limits in D17, ADR-0008 and the README. Then remove the "never in a send" sentence, and fix `tasks.md:246` all the same.

#### R4-L1 — Low: the README list in task 8.5 leaves out the hand-typed accidental hold

- **Family / root:** `hold-space / recognition-precision` (R3-L1 lineage).
- **In scope:** Yes.
- **Evidence:** D17 says the limits are "stated in ADR-0008 and the README" (`design.md:250`). Its accidental-hold limit has two cases: three Spaces typed within 120 ms, and Spaces arriving together after a pause (`design.md:254`; `ADR-0008:39`). The README list in task 8.5 names only the pause case (`tasks.md:281`), and it also leaves out "letting go within 0.5 s sends nothing" with the streaming caveat.
- **SUGGESTED_CORRECTION:** replace `tasks.md:281` with "accidental holds: three fast Spaces typed by hand, or Spaces that arrive together after a pause in Pi; letting go within 0.5 s sends nothing, but with the stop phrase on the audio may already have streamed".

#### R4-L2 — Low: three small leftovers from R3-L3 and R3-L4

- **Family / root:** `verification-coverage / wave8-live-and-docs` (R3-L3), with `wave8-propagation / entry-points-modes-and-privacy` (R3-L4).
- **In scope:** Yes.
- **Evidence:**
  - The test "a hold ended by arrival time after a session reset" (`tasks.md:262`) has no expected result, and the scenario "Session replaced during a hold" (`spec.md:439–442`) does not say what a later tap does. `ADR-0008:29` still says the spent hold "stays unrecognizable until Space is released". That is true on terminals that report a release, but it is not the arrival-time rule of `design.md:233` and `spec.md:370`.
  - The held line saying "release Space to send" (`design.md:246`; `spec.md:372`) has no task 8.5 case; "Display: the status line and help" (`tasks.md:255`) is generic.
  - The Cost risk says "a recording held at the cap is never sent without a press" (`design.md:288`). With the setting on, letting go of Space sends a held recording that a hold started (`design.md:243`; `ADR-0008:23`). That is still an explicit action, but it is not a press.
- **SUGGESTED_CORRECTION:**
  - Add the expected result to `tasks.md:262`: the session is replaced during a hold, Space is released, and a tap one second later types one space.
  - Align `ADR-0008:29` with `design.md:233`.
  - Add a task 8.5 case: a hold-started recording reaches the cap, the held line says releasing Space sends, and the release sends it.
  - Say "never sent without an explicit press or Space release" at `design.md:288`.

### Regression sweep: checked and found sound

- **Paste first, then releases, then the cell-size reply.** The order is implementable. `isKeyRelease` already refuses paste chunks (`keys.js:367–369`), so a paste containing ":3u" cannot be read as a release.
- **Text in any script:** non-ESC input reaches the listener one character at a time (`stdin-buffer.js:212–215`), so a Vietnamese letter, a decomposed letter's combining marks, and a letter committed by an input method are each other input and discard. "Text in another script during a hold" holds as written.
- **Send key during a hold:** CSI-u push-to-talk presses such as `\x1b[116;3u` decode, and their releases are releases. Neither falls into the parseKey leg, so suggestion 1 does not affect "Send key during a hold".
- **Egress sentence and privacy:** `spec.md:60`, the Round 3 wording at `ADR-0008:27` and `spec.md:426–427`, and the privacy requirement at `spec.md:446` agree that a discard sends nothing and, with the stop phrase on, cannot recall audio already streamed.
- **Reset ending:** "that input is handled normally" never consumes a typed character after a reset. A Space more than 300 ms later starts a new count, and Space still held across a reset (repeats every 30 ms) keeps the hold spent, matching "no recording starts on the later repeats" (`spec.md:441–442`).
- **Unchanged files:** the proposal, the manual-speech help requirement and ADR-0007 are byte-identical to the candidate Round 3 found sound. Nothing in the Round 3 edits contradicts them.

### Recommendation

R3-M1's fix is right where the contract is decided: D17, the spec and ADR-0008 now make "other input" the default, and a Vietnamese letter or a paste discards. Two things are left, both cheap.
- **The ignored list is still too broad.** Its `parseKey` test also catches real keys that Pi cannot decode. These are rare keys, and the harm is an early send of the user's own dictation rather than typed text being sent, so I keep it at Medium. Narrowing the list to the one reply Pi actually delivers, the cell-size reply, makes the "never in a send" guarantee true and removes the special case.
- **Task 8.5's class list still carries the old predicate.** It is a one-line fix.

R4-L1 and R4-L2 are documentation and test-coverage items. No finding is Critical or High, the `detector-controller-identity` family does not recur, and nothing is structural. If the caller applies these suggestions as nonblocking corrections, the candidate changes and its new revision needs to be recorded before any terminal action. No fifth review is needed for edits of this size. No implementation handoff is warranted from this review.

### Residual risks

- **Terminals other than the probed Ghostty setup** may send Space repeats or text differently. The contract fails safe (no hold is recognized, or the input discards), but this is not verified live.
- **Repeat resuming after another key** (Round 3 residual) is unchanged and not probed.
- **The cell-size reply as the only listener-visible reply** is true of Pi 1.1.0 as read here. A later Pi that adds new replies would make them other input, which discards and does not send.

PROPOSED_REVIEW_ACTION=PASS

---

## Caller Assessment — Round 4

### Review Mode
- `change_bundle`

### Convergence Mode
- `PATCH` (Round 4 of 4). The candidate `sha256:0d77fe15…3ebf` was verified by the Oracle.

### Review Subject
- `add-speak-voice-input`, Wave 8. Oracle run `d2751b56`.

### Per-Issue Evaluation

#### R4-M1 — Real keys could still be "ignored" (an R3-M1 leftover), and task 8.5 kept the old rule
- **Oracle Severity:** Medium
- **Family:** `hold-space / release-inference`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** None reaching the blocking threshold. The harm is an early send of a dictation the user started to send, with no typed text sent, comparable to the documented focus-loss limit.
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** applied as follows.
  - "Ignored" is now only the releases of keys other than Space plus the cell-size reply `CSI 6;<h>;<w> t`, the only reply Pi 1.1.0 passes to extension listeners (`tui.js:603,702`, per the Oracle's local check).
  - Undecodable keys are other input, so the design's statement that a misclassification can only discard now holds.
  - The change is made in D17, the spec and ADR-0008.
  - Scenarios: "Terminal reply" is updated, and "Undecodable key during a hold" is added.
  - The task 8.5 rule and its tests are corrected, and the duplicate paste case is removed.

#### R4-L1 — README list misses hand-typed holds
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** added to the README list in task 8.5.

#### R4-L2 — Small gaps
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** applied as follows.
  - The after-reset test now states its expected result.
  - The ADR-0008 lifecycle wording matches the rule that a spent hold ends at the first input arriving more than 300 ms after its last Space.
  - A test of the held line at the time cap is added to task 8.5.
  - The cost risk now covers sending on Space release.

### Summary
- **Issues accepted blocking:** 0
- **Issues accepted nonblocking:** 3
- **Issues deferred out of scope:** 0
- **Issues rejected:** 0
- **Sequence total:**
  - accepted blocking: 4, all fixed (R1-M1 and R1-M2 raised to High, R2-H1 through the single rebuild, R3-M1 raised to High);
  - the `hold-space / detector-controller-identity` family did not recur after the rebuild (Rounds 3 and 4).

### Terminal Baseline Validation

- The nonblocking corrections above changed the candidate after Round 4. As the Oracle advised, the new revision is recorded before the terminal action:

  PATCH_BASELINE_REVISION=sha256:c84c80670a4bb06a8fae903d602a6a7ffb7a4787123d9087241face167d2d803

- **Unchanged boundary:** `BASELINE_TARGET`, `BASELINE_SOURCE`, `BASELINE_INCLUSION_PREDICATE` and `BASELINE_EXCLUSIONS` are unchanged from the Frozen Baseline and the rebuild record.
- **Current candidate:** it equals the latest recorded revision above, as the caller recomputed after the edits.
- **Validation:** `openspec validate add-speak-voice-input --strict` passes.
- **No fifth review:** the post-review edits are wording and test lists in families already reviewed. No accepted blocking finding remains, and the cap allows no Round 5.

### Caller Result

REVIEW_ACTION=PASS
CONSENSUS_STATUS=MOSTLY_GOOD

### Carry-forward for `/opsx-apply-loop`

- **Routing:**
  - Selected reviewer: `oracle`, on `claude-bridge/claude-opus-5-5:high`.
  - Default implementation specialist: `worker`, on `claude-bridge/claude-sonnet-5-5:high`.
  - Both run only in the background.
  - Focus mode: `focus`. Orchestrator mode: `normal`.
  - The user limits delegation to `worker` and `oracle`.
- **Wave 8 owners:**
  - tasks 8.2–8.5: `worker`, grouped as one focus assignment;
  - task 8.6: orchestrator, with the user's approval;
  - task 8.7: the user;
  - task 8.8: the `oracle` gate.
- **Residual risks, for the live checks:**
  - a terminal that resumes Space's repeat after another key is released can start a new hold;
  - key-repeat behaviour outside the probed Ghostty setup is unknown;
  - Vietnamese input methods are unknown.

## Task 8.7 result (user, 2026-10-15)

The user reported "this work. -> pass" in English, after a dictated test message. It answered the orchestrator's request to report 8.7 as tested, as seen in daily use, or as unverified.

- **Recorded as:** a pass of the whole 8.7 list, reported together rather than item by item.
- **Not separately confirmed:** the residual risks above remain unconfirmed one by one: Space repeat resuming after another key, other terminals, and Vietnamese input methods.

All 49 tasks of `add-speak-voice-input` are now complete.
