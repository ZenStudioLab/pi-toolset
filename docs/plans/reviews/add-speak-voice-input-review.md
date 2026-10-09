# Review: add-speak-voice-input

Review mode: `change_bundle` (`/omo-plan-review`, invoked from `/opsx-propose-loop --focus`).

selected reviewer: oracle
selected default implementation specialist: worker
focus mode: focus
orchestrator mode: normal

Agent restriction from the user: only `worker` and `oracle`.

ADR check: required. Task 1.1 (Orchestrator) writes `docs/adr/0004-voice-input-and-provider-choice.md` before any implementation; ADR-0002 stays in force for speech output.

## Frozen Baseline

BASELINE_TARGET=openspec change add-speak-voice-input (apply-ready bundle)
BASELINE_TARGET_REVISION=sha256:d32907426f0e9a482ff3388967dcec327b8d28afa0faed9f4867f558702a4039
BASELINE_SOURCE=openspec/changes/add-speak-voice-input; governing context openspec/specs/manual-speech/spec.md, docs/adr/0002-manual-speech-egress-boundary.md, docs/adr/0003-localized-speech-translation.md, extensions/speak/
BASELINE_INCLUSION_PREDICATE=openspec/changes/add-speak-voice-input/proposal.md; openspec/changes/add-speak-voice-input/specs/manual-speech/spec.md; openspec/changes/add-speak-voice-input/specs/voice-input/spec.md; openspec/changes/add-speak-voice-input/design.md; openspec/changes/add-speak-voice-input/tasks.md
BASELINE_EXCLUSIONS=implementation source and tests (not yet written); unrelated extensions including extensions/pi-voicekit; the archived add-manual-speak-extension change except as governing context

Revision digest: SHA-256 over UTF-8 relative path + NUL + file bytes, in the inclusion predicate's order.

User decisions carried into the bundle (governing sources for reconciliation):

- Grow `extensions/speak` in both directions; voicekit and privateer-speak are reference only.
- Live (automatic) speech is out of scope.
- Deepgram and ElevenLabs only, called directly; no intermediary service.
- Input is push-to-talk into the composer only; the user always submits.
- The design may improve on the privateer reference where justified.
- Deepgram Aura is also a speech-output provider.
- Provider choice comes from the config file or a session-only command override; the extension never writes the config.

User-confirmed facts (resolve parts of task 1.2):

- `alt+t` is free in Pi's default key bindings (user, 2026-10-08).

Reviewer model note: a first dispatch on `claude-bridge/claude-opus-5-5` failed before review (claude-bridge rejects the `oracle` agent's replaced system prompt). Round 1 ran on the project-configured `oracle` model, `openai-codex/gpt-6.1-sol`.

---

## Round 1 - Oracle Review

### Inherited decisions

- Preserve the five-file frozen target and its exclusions. Implementation and tests are evidence, not review targets.
- Grow `extensions/speak`; retain manual-only speech, composer-only dictation, direct Deepgram/ElevenLabs calls, environment-only keys, and non-persistent provider overrides.
- Treat `alt+t` availability as user-confirmed, not an unresolved decision.
- Review only; no implementation handoff or file changes are authorized.

### Diagnosis and coverage

**Assessment: targeted amendments are needed before implementation.**

The candidate digest matches the frozen revision: `sha256:d32907426f0e9a482ff3388967dcec327b8d28afa0faed9f4867f558702a4039`. `openspec validate add-speak-voice-input --strict` passes, but structural validation does not resolve the contradictions below.

Coverage:

- Read all five target artifacts, the review log, both governing ADRs, and the current main specification.
- Compared all **five MODIFIED requirement headers** with the main specification: every header matches exactly. All **nine original scenarios** remain present, with their behavior preserved or intentionally generalized.
- Swept all **24 main requirements** for effects of adding a speech provider. This exposed requirements omitted from the delta.
- Inventoried the voice-input boundary: **10 requirements and 24 scenarios**. Tasks assign scenario coverage through recording, provider, command/controller, and silence tests; missing cross-operation cases appear below.
- Checked feasibility against configuration, speech-job, playback, cache, translation, registration, relevant test fixtures, and the named host APIs. The host supports the proposed shortcut, Escape interception, editor append, status, and explicit `tui` mode guard.

Uncovered: live microphone behavior, provider documentation/account qualification, actual network behavior, linguistic fidelity, and unrelated implementations. No extension or tests were run.

### Drift / contradiction check — findings

#### F1 — High: Provider expansion leaves incompatible requirements in the archived specification

- **Family / root:** `spec-delta-completeness / omitted-provider-impact`
- **In scope:** Yes.
- **Evidence:** `specs/manual-speech/spec.md:24–41,43–133` adds Deepgram synthesis but modifies only five existing requirements. The unchanged governing `openspec/specs/manual-speech/spec.md` still:
  - requires an ElevenLabs request on a cache miss, without a provider condition (`ElevenLabs synthesis request`, lines 150–172);
  - names ElevenLabs as the synthesis progress phase (`Idle-visible speech progress`, lines 193–210);
  - requires a user-controlled voice revision in every audio identity (`Content-addressed audio cache`, lines 230–242), while `design.md:94` makes that setting ElevenLabs-only;
  - routes translated text specifically to ElevenLabs (`Bounded cancellable translation`, lines 354–357);
  - requires translation failures to say no text was sent to ElevenLabs (`Evidence-backed translation failure reporting`, line 366).
- **Risk:** Archiving preserves these requirements unchanged. Deepgram implementation must then contradict the merged specification or retain misleading provider reporting. `design.md:94` incorrectly assumes translation requirements need no amendment.
- **SUGGESTED_CORRECTION:** Add complete MODIFIED blocks for these affected requirements, preserving their existing scenarios and safeguards. Scope ElevenLabs synthesis to ElevenLabs selection; identify the effective synthesis provider in progress and translation reporting; define Deepgram’s cache revision discriminator without borrowing ElevenLabs settings. Assign corresponding implementation and regression tests.

#### F2 — High: Explicit-stop privacy promise contradicts timed automatic upload

- **Family / root:** `egress-consent / stop-trigger-contract`
- **In scope:** Yes.
- **Evidence:** `tasks.md:12` requires ADR-0004 to record audio sent **only on an explicit stop**. `design.md:40` promises nothing leaves until the user stops. However, `specs/voice-input/spec.md:48,60–63` mandates automatic transcription at `maxSeconds`; `tasks.md:44` implements that timer behavior.
- **Risk:** Following the specification uploads a forgotten recording without a second user action, violating the promised ADR boundary. Following the ADR task violates the timer scenario. Composer non-submission does not resolve microphone egress consent.
- **SUGGESTED_CORRECTION:** Reconcile the upload-trigger contract across the bundle before writing ADR-0004. To retain the currently specified cap-to-transcribe behavior, explicitly document that starting recording authorizes upload on either manual stop or the time cap, and remove the exclusive explicit-stop promises. Describe this timed upload in controls/privacy documentation. Do not silently equate automatic timeout with an explicit stop.

#### F3 — High: The expanded secret boundary lacks a playback implementation task

- **Family / root:** `secret-boundary / child-environment-propagation`
- **In scope:** Yes.
- **Evidence:** `specs/manual-speech/spec.md:128` prohibits either provider key in the player environment. Existing `extensions/speak/audio.ts:52–56,75–82` copies the environment and removes only `ELEVENLABS_API_KEY`. `design.md:54` references this filtering approach; `tasks.md:40` assigns dual-key filtering and tests only for the recorder. Existing `test/speak/audio.test.ts:43–53` verifies only ElevenLabs removal.
- **Risk:** The assigned recorder work can pass while playback still inherits `DEEPGRAM_API_KEY`, directly violating the expanded secret requirement.
- **SUGGESTED_CORRECTION:** Explicitly assign dual-key filtering for **both** playback and recording, preferably through the same small helper. Extend playback environment tests with both keys present and verify unrelated audio-routing variables remain available.

#### F4 — Medium: Configuration migration prerequisites are not assigned to Wave 1

- **Family / root:** `wave-dependencies / configuration-consumer-migration`
- **In scope:** Yes.
- **Evidence:** `tasks.md:20–22` changes the configuration representation and requires passing speak tests/type checks in Wave 1. Existing `extensions/speak/speech-job.ts:375–385` consumes flat `voiceId`, `modelId`, `outputFormat`, and `voiceRevision`; `test/speak/harness.ts:24–28` supplies the rejected flat file format. Speech-job changes are assigned later at `tasks.md:28–34`.
- **Risk:** A literal config-only implementation breaks existing speech and shared test fixtures before the first gate. Implementers must discover and move prerequisite work across waves.
- **SUGGESTED_CORRECTION:** Assign configuration-consumer and shared-fixture migration to Wave 1, preserving ElevenLabs behavior and green regression tests there. Keep new Deepgram synthesis routing in Wave 2. Specify any normalized internal configuration representation used to bridge the two waves.

#### F5 — Medium: Input provider changes during capture have no destination contract

- **Family / root:** `input-job-identity / provider-snapshot`
- **In scope:** Yes.
- **Evidence:** `design.md:98` re-reads configuration and applies overrides on every command. `specs/voice-input/spec.md:25,129` permits input-provider changes without an active-recording exception; lines 143–146 send completed audio to the “selected provider.” Unlike speech selection (`specs/manual-speech/spec.md:7`), input selection never specifies whether a running recording retains its original provider.
- **Risk:** Start with Deepgram, change the override or config, then stop: the bundle does not determine which service receives the captured audio or which preflight remains valid.
- **SUGGESTED_CORRECTION:** Capture the input provider and relevant request settings at recording start, with changes affecting only subsequent recordings. Alternatively, explicitly reject provider changes while capture/transcription is active. Add tests for override and configuration changes between start and stop.

#### F6 — Medium: Playback termination must complete before microphone capture begins

- **Family / root:** `audio-coordination / asynchronous-stop-barrier`
- **In scope:** Yes.
- **Evidence:** `specs/voice-input/spec.md:48,75–78` requires playback to stop **before** recorder startup. `tasks.md:45` assigns stopping speech, but the existing `SpeechController.stop` only initiates cancellation. `extensions/speak/audio.ts:110–121` sends SIGTERM and allows a two-second grace period before SIGKILL; it returns immediately.
- **Risk:** Reusing the current stop method and immediately spawning the recorder captures still-playing speech. The existing “recording stops own playback” scenario does not specify a delayed-exit test.
- **SUGGESTED_CORRECTION:** Assign an awaitable termination barrier before recorder spawn, while keeping controls responsive and allowing cancellation during that wait. Test a player that ignores its first signal. Also clarify the treatment of a new `/speak` request during capture so concurrent playback behavior is intentional.

### Recommendation

**PATCH** the bounded bundle, not rebuild its architecture. The approach is feasible; the blocking issues concern merged-spec consistency, truthful upload authorization, and propagation of an explicit secret boundary.

No confirmed user decision needs reopening. No implementation handoff is warranted from this review.

### Residual risks / need from main agent

- Task 1.2 still needs evidence for provider limits, language detection, and the Scribe model identifier. Its shortcut item should recognize the already-confirmed fact.
- Provider-specific language-code compatibility and recording-device availability remain unqualified by static inspection.
- The caller must reconcile every finding and record any accepted candidate revision before another review. No additional clarification is needed to complete this review.

PROPOSED_REVIEW_ACTION=PATCH

---

## Caller Assessment — Round 1

### Review Mode
- `change_bundle`

### Convergence Mode
- `FULL`

### Review Subject
- OpenSpec change `add-speak-voice-input`

### Per-Issue Evaluation

Every cited location was checked against the files before deciding.

#### Issue F1 — Provider expansion leaves incompatible requirements in the archived specification
- **Oracle Severity:** High
- **Family:** `spec-delta-completeness / omitted-provider-impact`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** User decision "Deepgram Aura is also a speech-output provider" (this log), together with the unconditional ElevenLabs wording in `openspec/specs/manual-speech/spec.md` (ElevenLabs synthesis request; Idle-visible speech progress; Content-addressed audio cache; Bounded cancellable translation; Evidence-backed translation failure reporting). Archiving the delta as written would merge requirements that the Deepgram path must violate: a concrete correctness risk.
- **Decision:** `ACCEPT_BLOCKING`
- **CORRECTION:** Added full MODIFIED blocks for all five requirements, keeping every original scenario and adding one provider scenario each. The ElevenLabs request applies only when ElevenLabs is selected. The progress phase names the job's provider. The cache key uses ElevenLabs `voiceRevision`, or a fixed value for Deepgram, plus a provider-change miss scenario. Translation routes to the job's provider. Failure messages name that provider. Updated the `design.md` D6 sentence and the proposal summary, and widened task 2.2 scope and tests (`job`, `localized-job`, `progress`).

#### Issue F2 — Explicit-stop privacy promise contradicts timed automatic upload
- **Oracle Severity:** High
- **Family:** `egress-consent / stop-trigger-contract`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** User decision "Input is push-to-talk into the composer only; the user always submits" (the accepted option read "nothing acts without you"). The spec's cap-to-upload sent microphone audio without a user action, which is a concrete privacy risk.
- **Decision:** `ACCEPT_BLOCKING`
- **CORRECTION:** I chose Oracle's alternative direction, not cap-to-upload. At the time cap the recorder stops and the audio is held unsent. The next press or `/talk` sends it, and Escape, session replacement, or shutdown discard it. Applied to `specs/voice-input/spec.md` (lifecycle text; the time-cap scenario replaced by "stops and holds"; a new held-discard scenario; indicator held state; transcription and privacy wording) and to `design.md` D1 and Risks. Task 1.1's ADR wording and task 3.3's scope now include the held state.

#### Issue F3 — The expanded secret boundary lacks a playback implementation task
- **Oracle Severity:** High
- **Family:** `secret-boundary / child-environment-propagation`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** Modified requirement "Secret and privacy handling" (`specs/manual-speech/spec.md`): neither key in the player environment. Confirmed `extensions/speak/audio.ts:52-56` removes only `ELEVENLABS_API_KEY`, a concrete secret-exposure risk.
- **Decision:** `ACCEPT_BLOCKING`
- **CORRECTION:** Added task 1.6 [worker]: one child-environment helper removing both keys, used by the player now and the recorder in 3.1, with `audio.test.ts` extended for both keys and `PULSE_SERVER` kept. The Wave 1 gate moved to 1.7, and later gates now reference "same rules as 1.7". Design D3 updated. Task 3.1 now uses the 1.6 helper.

#### Issue F4 — Configuration migration prerequisites are not assigned to Wave 1
- **Oracle Severity:** Medium
- **Family:** `wave-dependencies / configuration-consumer-migration`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** None reaches the blocking threshold. Task 1.3's own verification ("passing speak tests") already requires migrating `speech-job.ts` and `test/speak/harness.ts` within Wave 1, so the plan is feasible as written.
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** No target edit. Implementation note for `/opsx-apply-loop`: task 1.3 includes moving every current reader of the flat keys (`speech-job.ts`, `test/speak/harness.ts`, and any other fixture) to the new shape, keeping ElevenLabs behavior and all speak tests green. Deepgram routing stays in Wave 2.

#### Issue F5 — Input provider changes during capture have no destination contract
- **Oracle Severity:** Medium (caller re-grades High)
- **Family:** `input-job-identity / provider-snapshot`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** User decision "Deepgram and ElevenLabs only, called directly" and the voice-input secret/privacy requirement. Which provider receives microphone audio is an egress contract, and leaving it undefined is a concrete privacy risk.
- **Decision:** `ACCEPT_BLOCKING`
- **CORRECTION:** Input provider, transcription model, and language are fixed at recording start; changes apply to the next recording; audio goes only to the provider fixed at start. Added to the "Input provider selection" requirement with a new "Provider change during a recording" scenario, to the transcription-request wording, to design D7, and to task 3.3 scope.

#### Issue F6 — Playback termination must complete before microphone capture begins
- **Oracle Severity:** Medium
- **Family:** `audio-coordination / asynchronous-stop-barrier`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** None reaches the blocking threshold. The spec already requires playback to stop before the recorder starts (`specs/voice-input/spec.md`, scenario "Recording stops own playback"), so the requirement is clear. The gap is implementation technique.
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** No target edit. Implementation note for `/opsx-apply-loop` task 3.3: await the player's actual exit (the `done` promise) before spawning the recorder, keep Escape/stop responsive during that wait, and test a fake player that ignores SIGTERM. While recording or holding, refuse new `/speak` speech with a message so the microphone never captures it.

### Summary
- **Issues accepted blocking:** 4 (F1, F2, F3, F5)
- **Issues accepted nonblocking:** 2 (F4, F6)
- **Issues deferred out of scope:** 0
- **Issues rejected:** 0

### Caller Result

REVIEW_ACTION=PATCH
CONSENSUS_STATUS=NEEDS_REVISION

PATCH_BASELINE_REVISION=sha256:792920a88c1a1f7249de69b7429eb50843902740e0bca9c963c01a5419404035

The boundary fields (target, source, inclusion predicate, exclusions) are unchanged; only the candidate revision moved. `openspec validate add-speak-voice-input --strict` passes on the patched bundle.

### Notes for Oracle (next round)
- Fixed since Round 1: F1 (five full MODIFIED blocks plus proposal and design alignment, task 2.2), F2 (hold at the cap instead of uploading), F3 (task 1.6 shared child-environment helper, gate renumbered to 1.7), F5 (provider, model, and language fixed at recording start).
- F4 and F6 were accepted as nonblocking and recorded as implementation notes above. They intentionally have no artifact edit.
- Focus: verify the F1 MODIFIED blocks preserve every original scenario verbatim apart from the provider wording, that the held-at-cap state is consistent across spec, design, and tasks, and run a bounded whole-bundle regression sweep.

---

## Round 2 - Oracle Review

### Baseline and coverage

**Mode: PATCH.** The current bundle digest is `sha256:792920a88c1a1f7249de69b7429eb50843902740e0bca9c963c01a5419404035`, exactly matching the recorded patch revision. The frozen target, source, inclusion predicate, and exclusions remain unchanged.

Read all five apply-ready artifacts and the previous review/reconciliation. Compared the delta with all 24 main-spec requirements and checked relevant source, tests, host APIs, and both governing ADRs. Implementation remains evidence, not the review target.

Preserved decisions: manual-only output, composer-only input, direct Deepgram/ElevenLabs requests, environment-only keys, session-only overrides, and **no automatic upload at the recording cap**.

### Accepted-fix verification

- **F1 — Fixed.** All five newly added MODIFIED headers match the main specification exactly. All **18 original scenarios** remain. Sixteen are verbatim; the other two change only ElevenLabs destination/progress wording to the job’s provider. No safeguard was removed. The complete delta now contains ten MODIFIED requirements, retaining all 27 original scenarios across them. Provider-aware cache identity, translation limits/routing, progress, failure reporting, and task 2.2 are aligned.
- **F2 — Partially fixed.** The timed-upload contradiction is removed: the lifecycle specification, D1, indicator, privacy requirement, ADR task, and controller task now require unsent holding. However, discard handling and surrounding state contracts were not fully migrated; see the recurring finding below.
- **F3 — Fixed.** `tasks.md:23` assigns the shared dual-key environment filter to playback with both-key and preserved-audio-variable tests. `tasks.md:43` assigns that helper to recording; `design.md:54` agrees.
- **F5 — Fixed.** `specs/voice-input/spec.md:134,141–144,153`, `design.md:100`, and `tasks.md:49` consistently snapshot provider, transcription model, and language at recording start. Later changes affect subsequent recordings, including when the current recording is held.

**Gate references are correct:** task 1.7 follows tasks 1.1–1.6; gates 2.4, 3.5, and 4.4 reference 1.7. Recorder task 3.1 correctly references helper task 1.6.

### Nonblocking-decision check

- **F4 — `wave-dependencies / configuration-consumer-migration`:** The original task wording remains implicit, but the caller explicitly assigns consumer and fixture migration to task 1.3. Its green-test/typecheck requirement prevents treating a config-only migration as complete. No new blocker; ensure that implementation receives this recorded note.
- **F6 — `audio-coordination / asynchronous-stop-barrier`:** The caller’s note supplies the missing implementation technique and delayed-exit test. Existing `SpeechController.stop()` returns immediately (`extensions/speak/speech-job.ts:123–130`), while the player exposes an awaitable `done` promise (`extensions/speak/audio.ts:14–17`). Implementation must connect that barrier to recorder startup rather than reuse `stop()` alone. The recorded refusal of new speech during recording/holding also resolves the coordination choice. No new blocker if this note accompanies task 3.3.

### Findings

#### F2 — High: Held-audio discard contradicts the terminal-input subscription lifetime

- **Family / root:** `egress-consent / stop-trigger-contract`
- **In scope:** Yes; recurrence through incomplete propagation of the accepted hold-at-cap remedy.
- **Governing source:** The accepted explicit-action/discard boundary and `specs/voice-input/spec.md:48,65–68`, requiring Escape to discard held audio without sending.
- **Exact evidence:** `design.md:33` promises Escape discard after the cap, but D5 (`design.md:71`) subscribes `onTerminalInput` **only while recording** and releases it on **stop**. The Risks section repeats recording-only Escape consumption (`design.md:124`). Task 3.3 references both D5 and held-audio discard (`tasks.md:47–48`), leaving incompatible implementation instructions.
- **Risk:** Following D5 removes the discard handler when the cap stops recording. Escape then fails to discard held audio and reaches normal terminal handling. A subsequent shortcut press can upload audio the user believed they had discarded.
- **Additional alignment gap:** The general upload rule still requires an action that “ends a recording” (`specs/voice-input/spec.md:48`; `tasks.md:12`), although sending held audio happens after capture has already ended. The `/talk` command summary (`specs/voice-input/spec.md:25`) likewise omits its held-state operation.
- **SUGGESTED_CORRECTION:** Keep Escape interception active during both recording and holding; cap-stop is not a terminal controller transition. Release interception when entering transcription or idle, and on discard/error/lifecycle cleanup. Explicitly define upload authorization as manual stop-and-send **or** explicit send of held audio, and update `/talk` usage and task 3.4’s controls/privacy documentation accordingly. Test cap → Escape → shortcut: zero requests from the discarded recording, Escape consumed, and the shortcut starts a fresh recording.

#### F7 — Medium: The recorder-failure scenario classifies intentional cap termination as failure

- **Family / root:** `recording-lifecycle / intentional-exit-classification`
- **In scope:** Yes; newly exposed by the held-at-cap state.
- **Governing source:** The required successful cap-to-held transition in `specs/voice-input/spec.md:60–63`.
- **Exact evidence:** The “Recorder fails” scenario (`specs/voice-input/spec.md:103–106`) treats a recorder exiting **before the user stops** as failure. At the cap, the controller intentionally terminates the recorder before any user stop (`specs/voice-input/spec.md:48,60–63`; `tasks.md:48`). Both scenarios therefore apply to the same intended event but require different outcomes.
- **Risk:** An implementation following the failure scenario can report an error instead of retaining the capped recording, defeating the promised held state.
- **SUGGESTED_CORRECTION:** Limit recorder failure to an **unexpected** exit before a controller-requested stop or cap termination; retain the no-audio failure case. Distinguish requested termination from unexpected exit in the recorder/controller contract. Test intentional cap termination retaining audio and the held indicator, alongside unexpected early-exit failure.

### Recommendation and residual risks

A narrow **PATCH** is warranted. F1, F3, and F5 are resolved; F2’s chosen privacy policy is sound but its held-state implementation instructions remain contradictory. These are local lifecycle amendments, not a structural-family recurrence requiring a rebuild.

No user decision needs reopening. No implementation handoff is warranted from this review.

Residual risks: provider limits/model/language-detection facts still require task 1.2 qualification; microphone availability, real requests, and linguistic fidelity remain unverified. The confirmed default `alt+t` availability should not be reopened as an unresolved product decision.

    acceptance-report (Oracle's structured run summary, indented as evidence): criteria satisfied;
    no files changed; digest matched; all ten MODIFIED headers match with all original scenarios retained;
    gate renumbering correct; findings High F2 (design.md:71) and Medium F7 (voice-input/spec.md:103-106).

PROPOSED_REVIEW_ACTION=PATCH

---

## Caller Assessment — Round 2

### Review Mode
- `change_bundle`

### Convergence Mode
- `PATCH`

### Review Subject
- OpenSpec change `add-speak-voice-input`

### Per-Issue Evaluation

#### Issue F2 (recurrence) — Held-audio discard contradicts the terminal-input subscription lifetime
- **Oracle Severity:** High
- **Family:** `egress-consent / stop-trigger-contract` (same root as Round 1 F2)
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** Accepted Round 1 F2 correction and the user decision "the user always submits" / "nothing acts without you". Following the old D5 would let a held recording be uploaded after the user believed they had discarded it, which is a concrete privacy risk. Confirmed at `design.md:71` and `design.md:124`.
- **Decision:** `ACCEPT_BLOCKING`
- **Rebuild check:** This is the same family recurring after one revision. I am not classifying it as a structural recurrence. The hold-at-cap structure stands, and Oracle agrees. The recurrence is incomplete propagation of the accepted remedy into D5, Risks, the `/talk` summary, and the upload-authorization sentence. The baseline and structural assumptions remain valid, so `PATCH` applies. Any further recurrence of this family will be treated as structural (`REBUILD`).
- **CORRECTION:**
  - `specs/voice-input/spec.md`:
    - upload authorization is now "stopping a recording, or sending a recording held at the time cap";
    - Escape is intercepted whenever a recording is in progress or held;
    - the `/talk` no-argument form covers transcribing a held recording;
    - the "Held recording discarded" scenario now also requires Escape to be consumed;
    - new scenario "Shortcut after discarding a held recording".
  - `design.md`:
    - D5's subscription lifetime covers recording and held, and is released only on entering transcription or idle;
    - Risks wording updated.
  - `tasks.md`:
    - task 1.1's ADR wording;
    - task 3.4's documentation includes the held state.

#### Issue F7 — The recorder-failure scenario classifies intentional cap termination as failure
- **Oracle Severity:** Medium (caller re-grades High)
- **Family:** `recording-lifecycle / intentional-exit-classification`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** Internal contradiction between two requirements of the same spec ("Push-to-talk recording lifecycle" cap-hold versus "Local audio capture" recorder-failure), which cannot both be satisfied for the same event. That is a concrete correctness risk, of the same kind as Round 1 F1.
- **Decision:** `ACCEPT_BLOCKING`
- **CORRECTION:**
  - `specs/voice-input/spec.md` "Local audio capture":
    - failure is only an exit on its own before a user stop or the time cap, or no audio;
    - a recorder the extension stops is never reported as a failure;
    - the scenario wording is narrowed to "exits unexpectedly".
  - `design.md` D5: a requested stop is distinguished from an exit on its own.
  - Task 3.1's verification: unexpected exit versus requested stop.

### Summary
- **Issues accepted blocking:** 2 (F2 recurrence, F7)
- **Issues accepted nonblocking:** 0 new (F4 and F6 reconfirmed nonblocking by Oracle)
- **Issues deferred out of scope:** 0
- **Issues rejected:** 0

### Caller Result

REVIEW_ACTION=PATCH
CONSENSUS_STATUS=NEEDS_REVISION

PATCH_BASELINE_REVISION=sha256:f3f0a6f2a290fa1e61f8caca89aa16bf682eb156d267cf8c659daf6c853bc11c

Boundary fields unchanged. `openspec validate add-speak-voice-input --strict` passes.

### Notes for Oracle (next round)
- Fixed since Round 2: F2 propagation (D5 lifetime, upload authorization, `/talk` summary, scenarios, task 3.4) and F7 (requested stop versus unexpected exit in spec, design, and task 3.1).
- Focus: verify the held state is now consistent end to end (spec lifecycle, indicator, capture, transcription, privacy; design D1, D5, Risks; tasks 1.1, 3.1, 3.3, 3.4), then run a bounded whole-bundle regression sweep.

---

## Round 3 - Oracle Review

### Baseline and inherited decisions

**Mode: PATCH; round 3 of at most 4.**

Recomputed SHA-256 using UTF-8 relative path + NUL + file bytes, in the frozen inclusion order:

`sha256:f3f0a6f2a290fa1e61f8caca89aa16bf682eb156d267cf8c659daf6c853bc11c`

This exactly matches the latest recorded patch revision. Target, source, inclusion predicate, and exclusions remain unchanged.

Preserved decisions: manual-only speech output, composer-only dictation without submission, direct Deepgram/ElevenLabs requests, environment-only keys, session-only provider overrides, and **no automatic upload at the recording cap**.

### Accepted-fix verification

Paths below are relative to `openspec/changes/add-speak-voice-input/`.

- **F2 — Fixed** (`egress-consent / stop-trigger-contract`; previously High, in scope).
  - `specs/voice-input/spec.md:25,48` explicitly covers sending held audio and distinguishes that authorization from stop-and-send.
  - `design.md:71` retains Escape interception throughout recording **and holding**. Cap-stop no longer releases the subscription; transcription, idle, discard, error, and lifecycle cleanup release it.
  - `specs/voice-input/spec.md:65–73` requires held Escape discard without egress, consumes Escape, and makes the next shortcut start a fresh recording.
  - `design.md:124,126,129` consistently describes explicit-send authorization, held-state Escape interception, and unsent holding.
  - `tasks.md:12,47–55,56` propagates these contracts into ADR preparation, controller implementation/scenario tests, and controls/privacy documentation.

- **F7 — Fixed** (`recording-lifecycle / intentional-exit-classification`; originally Medium, caller re-graded High; in scope).
  - `specs/voice-input/spec.md:101,108–111` distinguishes unexpected exit from extension-requested termination, including the cap.
  - `design.md:73` explicitly preserves capped audio and enters holding rather than reporting intentional termination as failure.
  - `tasks.md:43` assigns separate fake-spawn tests for unexpected exit/no audio and successful requested stops. No-audio rejection remains required.

### Held-state consistency and regression sweep

Read every target artifact and the prior reviews/reconciliations; checked the governing specification, ADRs, relevant speech source/tests, and host APIs statically.

The held state is aligned end to end:

| Boundary | Evidence |
|---|---|
| Capture stops without upload | Voice-input specification, lines 48,60–63; design D1 |
| Held indicator exposes send/discard controls | Voice-input specification, line 92; task 3.3 |
| Audio remains memory-only until send/discard | Voice-input specification, line 101; design D3 |
| Explicit send uses the start-time provider snapshot | Voice-input specification, lines 139,158; design D7 |
| Escape remains intercepted while held | Voice-input specification, line 48; design D5 |
| Discard/lifecycle cleanup never uploads held audio | Voice-input specification, lines 48,68,182; design D1; task 3.3 |
| ADR and README communicate the same authorization | Tasks 1.1 and 3.4 |

Bounded regression checks:

- All **10 MODIFIED manual-speech requirement headers** match the governing specification; all **27 original scenarios** remain present.
- Swept the **24 governing manual-speech requirements** for provider-impact contradictions. F1’s provider-aware routing, limits, cache identity, progress, and translation reporting remain resolved.
- Checked all **10 voice-input requirements and 27 scenarios**, including silent startup, single-operation ownership, composer preservation, late-result rejection, fixed destinations, request bounds, and secret handling.
- F3’s shared dual-key child-environment filtering remains assigned to playback and recording.
- Wave dependencies, gate numbering, documentation, migration approval, and user-owned live qualification remain coherent.

### Findings

**No new findings. No unresolved Critical or High finding remains.** No further F2 recurrence or structural invalidation was identified.

### Recommendation and residual risks

**PASS** the bounded change bundle. No implementation handoff is warranted from this review.

Carry the already accepted F4/F6 implementation notes forward: migrate existing configuration consumers/fixtures in task 1.3; await actual playback termination before recorder startup and refuse new speech during recording/holding.

Residual risks remain unchanged: task 1.2 must qualify provider limits, model identifiers, and language behavior; microphone operation, real requests, and linguistic fidelity remain unverified. Default `alt+t` availability is already user-confirmed.

No files were modified, no network requests were made, and neither the extension nor its tests were run.

PROPOSED_REVIEW_ACTION=PASS

---

## Caller Assessment — Round 3

### Review Mode
- `change_bundle`

### Convergence Mode
- `PATCH`

### Review Subject
- OpenSpec change `add-speak-voice-input`

### Per-Issue Evaluation

Round 3 reported no findings. I confirmed Oracle's verification of the Round 2 blockers:

- **F2:** Escape lifetime covers recording and held; upload authorization is "stopping, or sending a held recording"; the `/talk` summary is updated.
- **F7:** a requested stop is distinguished from an exit on its own.

### Terminal Baseline Validation

- The current bundle digest `sha256:f3f0a6f2a290fa1e61f8caca89aa16bf682eb156d267cf8c659daf6c853bc11c` equals the latest `PATCH_BASELINE_REVISION`.
- `BASELINE_TARGET`, `BASELINE_SOURCE`, `BASELINE_INCLUSION_PREDICATE`, and `BASELINE_EXCLUSIONS` are unchanged; the inclusion predicate matches the bundle files literally.
- `openspec validate add-speak-voice-input --strict` passes.

### Summary
- **Issues accepted blocking:** 0 this round (6 across the sequence: Round 1 F1, F2, F3, F5; Round 2 F2 recurrence, F7. All fixed.)
- **Issues accepted nonblocking:** F4 and F6, carried forward as implementation notes
- **Issues deferred out of scope:** 0
- **Issues rejected:** 0

### Caller Result

REVIEW_ACTION=PASS
CONSENSUS_STATUS=APPROVED

### Carry-forward for `/opsx-apply-loop`

Routing:

- Selected reviewer: `oracle`. The project-configured model is `openai-codex/gpt-6.1-sol`; claude-bridge cannot run this agent.
- Default implementation specialist: `worker`.
- Modes: focus mode, normal orchestrator mode.
- The user restricted delegation to `worker` and `oracle`.

Implementation notes:

- **Task 1.2:** record `alt+t` as user-confirmed. Still verify the Aura character limit, Nova-3 `detect_language` for recorded audio, and the ElevenLabs `scribe_v2` id.
- **Task 1.3 (F4):** migrate every flat-key consumer (`speech-job.ts`, `test/speak/harness.ts`, and fixtures) within Wave 1, keeping ElevenLabs behavior green.
- **Task 3.3 (F6):** await the player's real exit before spawning the recorder, keep controls responsive during the wait, and test a player that ignores SIGTERM. Refuse new `/speak` speech while a recording is in progress or held.

---

## Amendment Review — Wave 8 (2026-10-09)

The user invoked `/opsx-propose-loop` ("please proceed with this") for the Wave 8 amendment, which covers the command and skill keys (ADR-0007) and hold Space to talk (ADR-0008). The change `add-speak-voice-input` already owns this work, so the amendment lives in its artifacts (commits `8f537c2`, `a4b8bba`). All artifacts are done; the apply state is `ready`, with 42 of 49 tasks complete.

**Terminal baseline check:** the last `REVIEW_ACTION=PASS` was recorded against `sha256:d32907…4039`. The bundle has since been amended for Waves 5–8, so the target revision and inclusion predicate differ.

BASELINE_INVALIDATED=YES

**Mismatch:**
- **Target revision:** the bundle content changed.
- **Inclusion predicate:** it gains ADR-0007 and ADR-0008.
- **Exclusions:** implementation source and tests now exist for Waves 1–7. They were reviewed through the implementation gates in `add-speak-voice-input-implementation-review.md`, so they are excluded here.

The new frozen baseline:

BASELINE_TARGET=openspec change add-speak-voice-input (apply-ready bundle, Wave 8 amendment)
BASELINE_TARGET_REVISION=sha256:1d8a3c8ccc626ad87dc845fc63f5a3a636f67460c5188808249a3dc393868c47
BASELINE_SOURCE=openspec/changes/add-speak-voice-input and docs/adr/0007, 0008; governing context: ADR-0002 to ADR-0006, Pi 1.1.0 host sources (agent-session.js getCommands/prompt; pi-tui terminal.js, tui.js, keys.js), the space-probe result below, extensions/speak (current implementation, read-only context)
BASELINE_INCLUSION_PREDICATE=openspec/changes/add-speak-voice-input/proposal.md; openspec/changes/add-speak-voice-input/specs/manual-speech/spec.md; openspec/changes/add-speak-voice-input/specs/voice-input/spec.md; openspec/changes/add-speak-voice-input/design.md; openspec/changes/add-speak-voice-input/tasks.md; docs/adr/0007-voice-command-and-skill-keys.md; docs/adr/0008-hold-space-to-talk.md
BASELINE_EXCLUSIONS=implementation source and tests (Waves 1–7 reviewed by implementation gates; Wave 8 not yet written); Wave 1–7 artifact content already implemented and gate-reviewed, except where Wave 8 changes or contradicts it; unrelated extensions including extensions/pi-voicekit (reference only)

**Revision digest:** SHA-256 over UTF-8 relative path + NUL + file bytes, in the inclusion predicate's order.

**Convergence mode:** `FULL` (stale terminal baseline, material scope change). This log already holds 3 Oracle rounds, so the next round is Round 4, the last of this sequence. After it, the caller emits `PASS` if no accepted blocker remains, otherwise `HUMAN_DECISION`.

**User decisions for Wave 8** (governing sources):
- **Command and skill keys:** voice commands use a dedicated key, not a spoken trigger word: `alt+m` for commands and `alt+i` for skills.
- **Matching:** spoken words are matched against Pi's live list, and the user can add aliases.
- **Nothing runs by itself:** a recognized command goes into the editor and runs only when the user presses Enter.
- **Hold Space to talk:** an option to hold Space to record, where letting go acts like `alt+t` (send), similar to Claude Code's voice mode.
- **Routing:** after this review, `/opsx-apply-loop` in focus mode.

**Space probe (user's terminal, 2026-10-09):** Ghostty on Linux with Kitty flags 1, 2 and 4 (the flags Pi requests).
- A tap sent one `" "`.
- A hold sent `" "`, then after about 0.5 s a `" "` every 30 ms (72 chunks), and no release event.

**Routing:**
- Selected reviewer: `oracle`, on `claude-bridge/claude-opus-5-5:high`.
- Selected default implementation specialist: `worker`, on `claude-bridge/claude-sonnet-5-5:high`.
- Focus mode: `focus`. Orchestrator mode: `normal`.
- Both run in the background only: foreground children fail claude-bridge prompt capture (see the implementation log).
- The user limits delegation to `worker` and `oracle`.

**ADR check (Step 7):** ADR-0007 and ADR-0008 were written by the orchestrator in task 8.1 (done) and are in the bundle. Implementation tasks 8.2–8.5 follow them.

---

## Round 4 - Oracle Review

### Baseline and mode

**Mode: FULL; Round 4 of at most 4 in this sequence.** Recomputed SHA-256 over UTF-8 relative path + NUL + file bytes, in the inclusion predicate's seven-file order:

    sha256:1d8a3c8ccc626ad87dc845fc63f5a3a636f67460c5188808249a3dc393868c47

This matches the recorded Wave 8 `BASELINE_TARGET_REVISION` exactly. Target, source, inclusion predicate, and exclusions are taken literally from the Wave 8 amendment section and were not widened. Implementation code was read only as feasibility evidence.

Inherited decisions I kept: voice commands use dedicated keys, not a spoken trigger word; matching runs against Pi's live list plus user aliases; a matched command goes into the editor and runs only on Enter; hold Space is optional, and letting go acts like the send key; the user always submits, and nothing uploads without an explicit action; Escape discards for free. The space probe stands as evidence: Ghostty with Kitty flags 1+2+4 sends plain `" "` repeats every 30 ms after about 0.5 s, and no release event.

Coverage:

- Read all seven baseline files, the earlier rounds, and the Wave 8 amendment record.
- Checked the Pi 1.1.0 host sources:
  - `agent-session.js`: `getCommands` 2681–2700, `prompt` 1517, `_expandSkillCommand` 1665;
  - `interactive-mode.js`: editor submit handler 2540–2680, `resetExtensionUI` 367/1898–1909, reload 5366, stop 5945;
  - `runner.js`: `invocationName` 570, ctx invalidation 482–491;
  - `types.d.ts`: `TerminalInputHandler` 54–57, `onTerminalInput` 82, `setEditorText`/`getEditorText` 135–137;
  - `pi-tui`: `tui.js` 678–699, `keys.js` `isKeyRelease` 363, `terminal.js` 186–195, `stdin-buffer.js` (one sequence per character).
- Read `extensions/speak/talk.ts`, `talk-state.ts`, `index.ts`, `help.ts`, and the `config.ts` exports.

The host checks settle five questions:

- **Feasible:** `setEditorText` can write `/<name> …`.
- **Feasible:** `pi.getCommands()` gives extension, prompt, and `skill:` entries.
- **Feasible:** an input listener sees raw single-space input before the editor and can consume it.
- **Feasible:** splitting `talk.ts` (484 lines today) under 500 is practical.
- **Not safe as written:** routing hold start and release literally "through the send-key path" is unsafe; see H1.

No network, no config file read, no tests run. The only file modified is this log.

### Findings

#### H1 — High: hold-end and hold-recognition re-enter the toggle path without recording identity

- **Family / root:** `hold-space / detector-controller-identity` (new root). It sits next to the closed `egress-consent / stop-trigger-contract` family but is not a recurrence of it.
- **In scope:** Yes (Wave 8 D17, the "Hold Space to talk" requirement, task 8.5).
- **Evidence:**
  - `tasks.md:221` says "start, release and cancel through the send-key path".
  - `design.md:195` says "Ending stops the recording in send mode through the same path as the send key".
  - `specs/voice-input/spec.md:319` says "Ending SHALL stop the recording in send mode, exactly as the send key does".
  - The send-key path is a toggle. `extensions/speak/talk.ts:84` reads `if (!active) return this.start(ctx);` and `talk.ts:85–86` cancels a `starting` attempt.
  - The bundle never says what a pending hold-end does when the recording it started is gone. That can happen through:
    - Escape discard during the hold (`ADR-0008:20`, "Escape discards, as always");
    - the stop phrase sending a streamed hold-started recording (D15 applies, `design.md:195`);
    - another push-to-talk key stopping it, followed by a transcription that finishes before the 300 ms timer (`spec.md:346–349`);
    - a start that was refused: missing key, config error, Deepgram with the stop phrase on, or no recorder tool.
  - In each case the controller is idle when the hold ends, so the "same path as the send key" **starts a new recording**.
  - Recognition has the same gap. The spec checks "no recording, held recording, or transcription" (`spec.md:319`, `design.md:193`) but omits the `starting` phase, so a hold during a key-started attempt that is still starting would cancel it (`talk.ts:85`).
  - Nothing stops recognition from firing again within the same physical hold. After an Escape discard, the next two 30 ms repeats satisfy "two repeats in a row" again, and a second recording starts while Space is still down. Its release then sends it.
- **Risk:**
  - The microphone opens without an explicit action, violating "Recording starts only on an explicit action" (`spec.md:11`).
  - A recording the user just discarded with Escape can be followed by a send in the same gesture. This is the consent boundary this log has defended since Round 1.
  - A spurious "transcription in progress" warning can appear.
  - Implementers will diverge.
- **SUGGESTED_CORRECTION:**
  1. Specify a hold as an object with identity. Recognition calls a controller entry point that starts a recording only when the controller is fully idle (no `starting`, recording, held, or transcribing) and returns a handle.
  2. Hold-end acts only on that handle: it cancels the handle if it is still starting, or stops it in send mode if it is still recording or held. Otherwise it does nothing.
  3. Once a physical hold has been recognized, whatever the outcome (started, refused, discarded, stopped by another control, or sent by the stop phrase), consume Spaces until a 300 ms quiet gap. Never recognize a second hold within that run.
  4. Add scenarios and fake-clock tests for:
     - Escape while Space is still held: no new recording, and later repeats are consumed;
     - the stop phrase sends during the hold, then release: nothing more happens;
     - a key stop with transcription done before the timer: no new recording;
     - a refused start: one message, no retry per repeat;
     - a hold during a key-started `starting` attempt: Space is typed normally and the attempt is unaffected.

#### H2 — High: release is inferred from silence, so stalls and other keys can send unreviewed partial dictation

- **Family / root:** `hold-space / release-inference`.
- **In scope:** Yes.
- **Evidence:**
  - `ADR-0008:20` and `design.md:195` end the hold "when no Space has arrived for 300 ms", implemented as a timer that each repeat restarts.
  - Ending sends: `input.sendWhenBusy` defaults to `interrupt`, which steers the running turn (`design.md:129`).
  - The input listener is synchronous and runs on stdin `data` events (`pi-tui/dist/tui.js:678–699`, `stdin-buffer.js` emits one sequence per character).
  - Node runs expired timers before polling I/O. Any event-loop stall over 300 ms (for example a heavy render while the agent streams) fires the timer before the queued Spaces are read. The result is a false "release" and a send while the user is still holding Space. The backlog of Spaces then lands in the editor or starts the H1 re-trigger.
  - Pressing any other key during a hold stops Space's key repeat on X11 and Wayland, so it is detected as a release and sends. "Other keys pass through" (`design.md:195`), so that key's character is also in the sent text.
  - Losing window focus while holding has the same effect.
  - The scenario "Other key stops a held-Space recording" (`spec.md:346–349`) assumes repeats keep arriving after another key. Typical autorepeat does not behave that way.
  - The stated mitigation, "the status line and Escape make it visible and free to discard" (`design.md:230`, `ADR-0008:29`), works only before the inferred release. After it, the message is already sent.
  - The explicit-action egress sentence (`spec.md:60`) does not mention hold release at all.
- **Risk:** half-dictated text, plus any stray key, is sent to the agent and can redirect a running turn. That breaks "letting go sends" as the user approved it: they approved letting go, not a timer misfire.
- **SUGGESTED_CORRECTION:**
  1. Confirm a release only after pending input has been drained. For example, when the timer fires, re-check in `setImmediate` (after the I/O poll) and compare arrival timestamps rather than timer firing time; ignore the release if a Space arrived in between.
  2. Define any input other than Space, Escape, or a push-to-talk key during a hold as ending it **without sending**, as transcribe-only. Repeats stop at that point, so a real release can no longer be observed. Whether this is transcribe-only or discard is a caller or user choice. It does not touch the "release sends" decision.
  3. Name hold release in the explicit-action sentence of `spec.md:60`, and record focus loss as a known limit in ADR-0008 Consequences.
  4. Correct the Risks mitigation text.
  5. Add tests:
     - a stalled clock where the timer and buffered Spaces become due together: no send;
     - another key during a hold: transcript appended, nothing sent.

#### M1 — Medium: the persistent hold listener has no lifecycle, and "read on use" cannot work in a synchronous handler

- **Family / root:** `hold-space / listener-lifecycle-and-config-read`.
- **In scope:** Yes; this is about feasibility and testability.
- **Evidence:**
  - `design.md:191` says `input.holdSpace` is "read on use like the other input settings" and that "one `ctx.ui.onTerminalInput` listener watches for Space".
  - `TerminalInputHandler` must return `{consume}` synchronously (`types.d.ts:54–57`), but `loadConfig` is async (`extensions/speak/config.ts:493`).
  - The host clears every extension terminal listener on session invalidation and on reload (`interactive-mode.js:367` → `resetExtensionUI` 1898–1909; reload 5366; stop 5945).
  - There is no `ctx` at load, and `index.ts:156–163` registers no `session_start` handler.
  - A captured ctx throws after replacement (`runner.js:482–491`).
  - Nothing in the bundle says when the listener subscribes, that it re-subscribes per session, or that its 300 ms timer is cancelled on `session_shutdown`. If the timer is not cancelled, a pending hold-end calls the stale ctx or starts a recording in the old instance.
  - "A configuration error reported on use" (`spec.md:319`) is undefined for a listener that never "uses" anything when the value is unknown.
- **SUGGESTED_CORRECTION:**
  1. Specify that the listener subscribes on `session_start` in `tui` mode only.
  2. Specify that `session_shutdown`, `session_before_switch`, `session_before_fork`, and `session_tree` clear the hold state and timers, beside `talk.resetSession()`.
  3. Pick one config-read mechanism:
     - read `holdSpace` at load and apply it after `/reload`, like the shortcuts; or
     - keep a cached value that an async read refreshes at the first Space after a quiet gap. Recognition needs at least 500 ms more, so the read completes in time.
  4. On a config error, treat the setting as off and let Space type.
  5. Add tests: re-subscription after replacement, no call on a stale ctx after shutdown, and a config error meaning the setting is off.

#### M2 — Medium: Wave 8 is not carried into the Wave 1–7 requirements and decisions it changes

- **Family / root:** `wave8-propagation / entry-points-modes-and-privacy`. It is analogous to Round 1 F1 (`spec-delta-completeness`), but internal to the bundle.
- **In scope:** Yes; these are the places where Wave 8 contradicts or leaves Waves 1–7 inconsistent.
- **Evidence:**
  - `spec.md:11` says the microphone opens "only when the user presses a push-to-talk shortcut or runs `/talk` or `/talk send`". This leaves out `/talk command`, `/talk skill`, and holding Space.
  - `spec.md:60` (lifecycle) names only "either shortcut, `/talk`, or `/talk send`" and two stop modes.
  - `design.md:150,152` (D15): every press with Deepgram selected is refused, and every recording streams. Neither statement exempts command or skill starts, although `spec.md:229` and `design.md:173` do.
  - `design.md:121` (D10) still says "only the two defaults are registered", against "the four defaults" (`design.md:171`, `spec.md:27`).
  - The privacy text in `spec.md:353` says that while the stop phrase is on, "audio streams to ElevenLabs as the user speaks". That is no longer true for command or skill starts, which also upload to Deepgram. The same paragraph says "a transcript exists only in the composer or in the user message", while D16 warnings name the transcribed words (`design.md:182`).
  - The held-state indicator in `spec.md:114` lists only send, transcribe-only, and discard keys, but `design.md:184` says held lines name the command and skill keys.
  - The help requirement in `specs/manual-speech/spec.md:45` lacks the Space entry (`design.md:197`) and the "interactive commands need an alias" note (`design.md:184`).
  - `proposal.md:5` still lists "spoken commands" among the parts left out. `proposal.md:44` (Capabilities) and `proposal.md:52` (Impact: new modules) are not updated.
  - `design.md:173` says "a press that only starts a recording carries no decision", yet the start key now decides whether the recording streams.
- **Risk:** archiving merges a voice-input spec whose first requirement forbids the Wave 8 entry points. The privacy text also states something false.
- **SUGGESTED_CORRECTION:** update each cited sentence to cover the command and skill keys, `/talk command|skill`, and hold Space, with the start-key streaming exception spelled out. Then re-run `openspec validate --strict`.

#### M3 — Medium: command delivery folds the draft into the command's arguments, which breaks Pi's interactive commands

- **Family / root:** `voice-command / draft-splice-and-interactive-alias`.
- **In scope:** Yes.
- **Evidence:**
  - The editor becomes `/<name> <spoken args> <previous draft>` (`design.md:182`, `spec.md:280`, scenario `spec.md:285`).
  - Prompt templates and skills therefore receive the draft as `$ARGUMENTS`; skills get it as the text after the skill block (`agent-session.js:1665–1678`).
  - Pi's interactive commands are matched on the trimmed whole editor text (`interactive-mode.js:2546–2671`), in two kinds:
    - exact-only: `/settings`, `/new`, `/reload`, `/copy`, `/fork`, `/tree`, `/session`, `/hotkeys`, …;
    - prefix: `/model`, `/compact`, `/name`, `/export`, `/login`, `/bug`, `/thinking`.
  - With any spoken words or draft, an exact-only alias target is not recognized, so pressing Enter sends `/new fix the login bug` to the model as a plain message.
  - A prefix target takes the draft as its argument and clears the editor. For example, `/export fix the login bug` writes an export file named after the draft.
  - So `ADR-0007:18`'s claim "This also lets an alias reach Pi's interactive commands" holds only when the editor is empty and nothing follows the name.
- **Risk:** Enter is still required, so nothing runs by itself. But the visible result routinely does something other than what the user meant, and the draft is lost.
- **SUGGESTED_CORRECTION:**
  1. Keep the splice for commands and skills in the list.
  2. For alias targets not in `pi.getCommands()`, put the target alone with nothing after it. Leave the draft untouched (append rule) and warn when spoken words or a draft could not be attached.
  3. Correct the ADR-0007 claim, and state in the spec that the draft becomes the command's arguments.
  4. Add a scenario for an alias to `/new` with a draft.

#### M4 — Medium: the matcher rules are not precise enough to test

- **Family / root:** `voice-command / matcher-precision`.
- **In scope:** Yes.
- **Evidence:**
  - `design.md:178–180` and `spec.md:280` leave these points undefined:
    - what a "word" is (whitespace-separated token? "loop,add" is one token);
    - whether "letters and digits" means `\p{L}\p{N}`, and how combining marks are handled after NFKC (the user dictates in Vietnamese);
    - alias phrases whose collapsed forms are equal, such as JSON keys `"Model"` and `"model"` with different targets: which wins?
    - alias phrases that collapse to the empty string (punctuation only), or that have more than 8 words and so can never match;
    - "at equal length", which can only mean an equal collapsed form;
    - argument cleanup beyond "a final period": `?`, `!`, `…`, `。`, closing quotes, leading punctuation;
    - duplicate extension commands, which Pi exposes as `name:1` and `name:2` (`runner.js:570`).
  - The requirement text writes `/<name>`, while the skill scenario expects `/skill:<name>` (`spec.md:290`).
  - Task 8.3 (`tasks.md:210–215`) asks for "matcher table cases" without listing them.
- **SUGGESTED_CORRECTION:**
  1. Define a token as a run of non-whitespace and the collapsed form as NFKC, then lowercase, then keep only `\p{L}\p{N}`.
  2. Make these configuration errors: alias phrases that are duplicates after collapsing, that collapse to empty, or that exceed 8 words.
  3. Strip leading and trailing Unicode punctuation from the argument text, and state the skill output form `/skill:<name>`.
  4. Enumerate in task 8.3 the table cases for longest match, alias-over-name, ambiguity, the 8-token limit, Vietnamese diacritics, punctuation in arguments, `name:2`, and an empty transcript.

#### M5 — Medium: the hold-recognition count, the spaces removed, and the "cannot be typed by hand" claim disagree

- **Family / root:** `hold-space / recognition-precision`.
- **In scope:** Yes.
- **Evidence:**
  - `ADR-0008:18` requires "three Spaces in a row, each arriving within 120 ms of the one before", which is three gaps. `design.md:193` and `spec.md:319` require "two repeats in a row (three Spaces)", which is two gaps.
  - The first autorepeat arrives about 500 ms after the press, so it is not a "repeat" by the 120 ms rule. "The Spaces typed since the hold began" (`spec.md:319`, `design.md:193`) therefore has no defined start. Is it the press Space, the first autorepeat, or a deliberate separator Space typed just before?
  - As a result, the exact editor text in the scenario "Hold records and release sends" (`spec.md:326–329`) cannot be tested.
  - Three taps 100 ms apart (about 8–10 Hz) are possible by hand, so the claim "which a person cannot type by hand" (`ADR-0008:18`) is overstated.
  - A false recognition deletes typed Spaces and stops `/speak` playback (`spec.md:60`, last sentence), although the 0.5 s minimum prevents any upload.
- **SUGGESTED_CORRECTION:**
  1. Pick one count and use it in all three artifacts.
  2. Define removal as the trailing run of Spaces this listener passed to the editor since the last non-Space input.
  3. Soften the ADR claim and record the false-positive consequence. Optionally tighten the threshold (fewer milliseconds or one more repeat), which is a caller or user choice.
  4. Make the task 8.5 boundary tests state exact editor text.

#### L1 — Low: `config.ts` grows past the size rule without a split task

- **Family / root:** `task-structure / file-size`.
- **In scope:** Yes (task text).
- **Evidence:** `extensions/speak/config.ts` is already 579 lines. Tasks 8.2 and 8.5 (`tasks.md:201–204,218`) add five settings there, but only `talk.ts` gets a 500-line cap (`tasks.md:215`). The governing rule is the global AGENTS.md: at 500+ lines, split along responsibility boundaries.
- **SUGGESTED_CORRECTION:** add to task 8.2 a split of input-setting parsing into its own module, verified with `wc -l`.

#### L2 — Low: live checks and README miss the riskiest hold and alias paths

- **Family / root:** `verification-coverage / wave8-live-and-docs`.
- **In scope:** Yes.
- **Evidence:**
  - Task 8.7 (`tasks.md:232–241`) lacks:
    - Escape while Space is held;
    - holding Space in a selector or dialog (`ADR-0008:29`);
    - another key during a hold;
    - an interactive-command alias with a non-empty draft.
  - Tasks 8.4 and 8.5 do not require the README to state the hold-Space limits: key repeat must be on and faster than 120 ms, the dialog behavior, and the other-key behavior.
- **SUGGESTED_CORRECTION:** add those four checks to 8.7, and those three README points to 8.5.

### Checked and found sound

- `alt+m` and `alt+i` have no built-in binding in Pi 1.1.0, and neither is a reserved key.
- A dictated `/skill:<name> args` expands through Pi's own skill expansion on Enter.
- `pi.getCommands()` provides exactly the three sources D16 names.
- The rule that command and skill starts never stream is consistent between `spec.md:229`, `design.md:173`, and `ADR-0007:22`. It is safe, because only a key or command can then stop the recording.
- Sending a held-at-cap recording on hold release matches the explicit-send rule.
- Bracketed paste can never count as a hold, because it arrives wrapped in `\x1b[200~`.
- With `isKeyRelease`, a real release on terminals that report text-key releases is harmless.

### Recommendation

The Wave 8 direction is sound, and every finding can be fixed with local text changes; no rebuild is needed. The two High findings concern the same consent boundary as earlier rounds:

- **H1:** the hold detector reuses a toggle without knowing which recording it started.
- **H2:** "release" is inferred from silence in ways the user did not approve.

Because this is Oracle Round 4, the cap rules out another automatic patch-and-review cycle. The caller cannot get a further automatic review of corrections to H1, H2, and M1–M5. If the caller accepts any of them as blocking, a human needs to decide: either authorize a fresh review sequence after the patch, or approve applying the patch without another Oracle round. No implementation handoff is warranted from this review.

### Residual risks

- Key-repeat timing on terminals other than the probed Ghostty setup (macOS, tmux, SSH) is still unverified.
- The real frequency of event-loop stalls in Pi while the agent streams is not measured.
- Vietnamese transcription of English command names may rarely match without aliases.
- Holding Space in overlays remains an accepted, documented limit even after H1/H2.

PROPOSED_REVIEW_ACTION=HUMAN_DECISION

---

## Caller Assessment — Round 4

### Review Mode
- `change_bundle`

### Convergence Mode
- `FULL`

### Review Subject
- `add-speak-voice-input`, Wave 8 amendment, baseline `sha256:1d8a3c8c…8c47`. Oracle run `3e304faf`, `claude-bridge/claude-opus-5-5`, thinking high, background.

### Per-Issue Evaluation

#### Issue H1 — Hold end and recognition re-enter the toggle path
- **Oracle Severity:** High
- **Family:** `hold-space / detector-controller-identity`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:**
  - The requirement "Recording starts only on an explicit action" (`specs/voice-input/spec.md:11`).
  - The user's requirement that letting go of Space acts like `alt+t`. That covers sending the user's own recording, not opening the microphone.
  - Concrete correctness risk: `talk.ts:84` starts a recording when idle.
- **Decision:** `ACCEPT_BLOCKING`
- **CORRECTION:** applied as follows.
  - A hold gets a handle from `controller.startHold()`, which works only when the controller is fully idle, including the `starting` phase.
  - `releaseHold(handle)` cancels or sends only that recording; otherwise it does nothing.
  - Spaces are consumed from recognition to release, and there is no second recognition.
  - Scenarios added: Escape while held; the recording already ended before the release; a refused start; a hold during a key-started recording or starting attempt (D17, spec).

#### Issue H2 — A release is inferred from silence
- **Oracle Severity:** High
- **Family:** `hold-space / release-inference`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:**
  - The user's requirement that letting go sends. A timer misfire or another key is not letting go.
  - The explicit-action egress rule (`spec.md:60`).
  - Concrete correctness risk: a partial dictation sent with `sendWhenBusy: interrupt`.
- **Decision:** `ACCEPT_BLOCKING`
- **CORRECTION:** applied as follows.
  - A quiet gap is confirmed in `setImmediate`, after pending input, by arrival times.
  - Any other input ends the hold's recording in transcribe-only mode, with nothing sent.
  - Hold release is named in the egress sentence.
  - Focus loss is recorded as a limit in ADR-0008, D17 and the risks.
  - The risk mitigation text is corrected.
  - Scenarios added: "Stalled event loop" and "Other key during a hold".

#### Issue M1 — Listener lifecycle and the read-on-use setting
- **Oracle Severity:** Medium
- **Family:** `hold-space / listener-lifecycle-and-config-read`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** None reaching the blocking threshold. Feasibility evidence: `types.d.ts:54-57`; `interactive-mode.js:1898-1909`.
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** applied as follows.
  - `input.holdSpace` is read at load with the shortcuts, and takes effect after `/reload`. A config error means off.
  - The listener subscribes on each interactive `session_start`, and its state and timers are cleared on shutdown and session changes.
  - A test list is added to task 8.5.

#### Issue M2 — Wave 8 not carried into the earlier text
- **Oracle Severity:** Medium
- **Family:** `wave8-propagation / entry-points-modes-and-privacy`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** None reaching the blocking threshold.
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** applied in these places:
  - `spec.md`: the explicit-action entry points; the lifecycle start and stop modes, and the egress rule; the held line keys; privacy (streaming exception, warnings never repeat the transcript).
  - `design.md`: D10 defaults, D15 refusal and connection exceptions, and D16 modes.
  - The manual-speech help requirement.
  - `proposal.md`: why, capabilities and impact.

#### Issue M3 — The draft is spliced into interactive-command aliases
- **Oracle Severity:** Medium
- **Family:** `voice-command / draft-splice-and-interactive-alias`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** None reaching the blocking threshold. Nothing runs without Enter.
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** applied as follows.
  - Listed targets keep the splice, and the draft is stated to become the arguments.
  - Unlisted alias targets are placed alone, and only into an empty editor with nothing spoken after them; otherwise the words are appended with a warning.
  - The ADR-0007 claim is corrected.
  - Scenario "Interactive alias with a draft" added.

#### Issue M4 — Matcher precision
- **Oracle Severity:** Medium
- **Family:** `voice-command / matcher-precision`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** None reaching the blocking threshold.
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** applied as follows.
  - Defined: tokens; the collapsed form (NFKC, lowercase, `\p{L}\p{N}`); an alias winning at the same collapsed form; argument trimming of `\p{P}`; `name:2` used as listed; the `/skill:<name>` output.
  - Alias errors added: an empty collapsed form, more than 8 tokens, a duplicate collapsed form.
  - The task 8.3 table cases are enumerated.

#### Issue M5 — Hold count, removed spaces and the "by hand" claim
- **Oracle Severity:** Medium
- **Family:** `hold-space / recognition-precision`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** None reaching the blocking threshold.
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** applied as follows.
  - The count is one rule everywhere: the second repeat in a row, which is the fourth Space in the probed terminal.
  - Removal covers the run of Spaces passed since the last other input.
  - The ADR claim is softened, and the false-positive consequence recorded.
  - The scenario now states exact editor text.

#### Issue L1 — `config.ts` size
- **Oracle Severity:** Low
- **Family:** `task-structure / file-size`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** the global AGENTS.md rule to split files of 500+ lines (nonblocking).
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** task 8.2 first splits the parsing of the `input` settings out of `config.ts`, verified with `wc -l`.

#### Issue L2 — Live checks and README gaps
- **Oracle Severity:** Low
- **Family:** `verification-coverage / wave8-live-and-docs`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** None reaching the blocking threshold.
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** the four checks are added to 8.7, and the README points to 8.4 and 8.5.

### Summary
- **Issues accepted blocking:** 2 (H1, H2)
- **Issues accepted nonblocking:** 7 (M1–M5, L1, L2)
- **Issues deferred out of scope:** 0
- **Issues rejected:** 0

### Correction batch applied after this round

The caller applied the corrections above to the bundle. The two blockers are fixed in text, but no Oracle round has reviewed the fix, and the four-round cap forbids an automatic Round 5.

PATCH_BASELINE_REVISION=sha256:cb51ddca8efcf103b05dabb29945b3c277a90b08aa7b530125585dceef86ac79 (same digest method and inclusion predicate as the Wave 8 baseline)

`openspec validate add-speak-voice-input --strict` passes.

### Caller Result

REVIEW_ACTION=HUMAN_DECISION
CONSENSUS_STATUS=NEEDS_REVISION

**Decision needed from the user**, recorded verbatim when given:
- (a) Authorize a separate one-sequence review log, `add-speak-voice-input-wave8-review.md`, with a fresh baseline at the patched revision, before `/opsx-apply-loop`.
- (b) Accept the patched bundle without another proposal review and proceed to `/opsx-apply-loop` in focus mode. The Wave 8 implementation gate (task 8.8) still reviews the code against these artifacts.

### User Decision (2026-10-09)

The user's reply, verbatim: "approve. (a)".

They authorized a separate one-sequence review log, `docs/plans/reviews/add-speak-voice-input-wave8-review.md`, with a fresh baseline at `PATCH_BASELINE_REVISION=sha256:cb51ddca…ac79`, before `/opsx-apply-loop` in focus mode. This log's sequence ends here.
