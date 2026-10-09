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
