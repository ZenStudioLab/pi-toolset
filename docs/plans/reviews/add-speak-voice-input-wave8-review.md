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
