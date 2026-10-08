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
