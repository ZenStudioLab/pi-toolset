# Implementation Review: add-speak-voice-input

Workflow: `/opsx-apply-loop add-speak-voice-input` (started after proposal review `REVIEW_ACTION=PASS`, see `add-speak-voice-input-review.md`).

selected reviewer: oracle (project-configured model `openai-codex/gpt-6.1-sol`; claude-bridge cannot run agents that replace their system prompt)
selected default implementation specialist: worker (project-configured model `openai-codex/gpt-5.6-luna`)
focus mode: focus
orchestrator mode: normal

The user restricted delegation to `worker` and `oracle`.

Baseline commit before Wave 1: `be10210` (proposal), on top of `617acac` (10,000-character limit) and `9534147` (archive of add-manual-speak-extension).

## Wave 1 Review Sequence

## Round 1 - Implementation Assignments

Wave handled: 1. Final gate reserved: task 1.7 [Oracle gate: `oracle`], the Wave 1 review gate, run once after 1.1–1.6.

Ordered task and slice owners:

| Assignment | Tasks | Owner | Bounded responsibility | Files and topics |
| --- | --- | --- | --- | --- |
| W1-A | 1.1 | orchestrator | ADR-0004 | `docs/adr/0004-voice-input-and-provider-choice.md` |
| W1-B | 1.2 | orchestrator | Verify provider facts, amend design | `openspec/changes/add-speak-voice-input/design.md` (Verified Provider Facts, D9, D10, Risks) |
| W1-C | 1.3, 1.4, 1.5, 1.6 | worker | Config shape and its consumers (F4 note); `/speak provider` and `/talk provider` session overrides with status; the shared bounded-request helper; the dual-key child-environment helper | `extensions/speak/config.ts`, `index.ts`, `speech-job.ts`, `elevenlabs.ts`, `audio.ts`, a new bounded-request helper module, `test/speak/*` |

### W1-A and W1-B (orchestrator) evidence

- **1.1:** wrote `docs/adr/0004-voice-input-and-provider-choice.md`. It links the change design, ADR-0002 (superseded only for the single speech destination), and ADR-0003. ADR-0002 is not edited.
- **1.2:** every fact is recorded with its source in `design.md` under "Verified Provider Facts":
  - Aura limit of 2,000 characters (`text-to-speech.md`, `errors.md`);
  - `detect_language` with Nova-3 on recorded audio supported, with fallback (`language-detection`);
  - `vi` listed for Nova-3;
  - `scribe_v2` in ElevenLabs' request example;
  - `alt+t` user-confirmed.

  No spec value changed. The D9, D10 and Risks wording is updated. `openspec validate add-speak-voice-input --strict` passes.

### W1-C (worker) evidence

Tasks 1.3–1.6.

Files:

- Modified: `extensions/speak/config.ts`, `index.ts`, `speech-job.ts`, `elevenlabs.ts`, `audio.ts`.
- New: `extensions/speak/bounded-request.ts`.
- Tests: `test/speak/config.test.ts`, `command.test.ts`, `audio.test.ts`, `harness.ts`, `job.test.ts`, `silence.test.ts`, `translation.test.ts`.
- Unchanged as required: `quota.ts`, `test/speak/provider.test.ts`, the README, and every OpenSpec artifact.

Caller re-verification:

- `node --experimental-strip-types --test test/speak/*.test.ts` gives 249 tests, 249 pass, 0 fail (baseline 239).
- `npx tsc --noEmit | grep -E 'extensions/speak|test/speak'` prints nothing.
- No files are staged.

Worker caveat: speech synthesis in Wave 1 remains ElevenLabs-only; Deepgram routing is Wave 2.

## Round 1 - Oracle Review

### Gate and reviewed ownership

**Mode: FULL.** Loaded `review-convergence`. Reviewed the entire Wave 1 candidate against `be10210`, including both specified untracked implementation artifacts.

    1.7 [Oracle gate: `oracle`] Review gate for Wave 1, run once after 1.1–1.6 are complete. (Full gate text in tasks.md.)

| Assignment | Tasks | Owner | Reviewed slice |
|---|---|---|---|
| W1-A | 1.1 | orchestrator | ADR-0004, its links, preservation of ADR-0002 |
| W1-B | 1.2 | orchestrator | Recorded provider facts, sources, design amendments, strict validation |
| W1-C | 1.3 | worker | Nested configuration, defaults, validation, migration messages, every existing consumer and fixture |
| W1-C | 1.4 | worker | Speech/input override parsing, reporting, reset, lifecycle, status |
| W1-C | 1.5 | worker | Bounded-request extraction and ElevenLabs compatibility |
| W1-C | 1.6 | worker | Shared dual-key child-environment filtering and playback tests |
| Final gate | 1.7 | oracle | Whole-wave review; advisory findings only |

**Candidate identity:** tracked diff SHA-256 `56537419650a80bafafa360b3c82d98b119fa40e009129e226e1863597307caf`; ADR-0004 SHA-256 `fb0e28d094c2ad68246ea288bb6c889f016c8b678ec84c718722c6e17a3d61ea`; bounded-request SHA-256 `675617f381a3fd5065909ea920a2858d4fa415611efbe0277686f5379936c787`.

### Inherited decisions and coverage

Preserved: manual-only speech, explicit-send microphone egress, composer-only transcripts, exactly two direct providers, environment-only keys, overrides surviving until restart/reload/reset, and no configuration writes.

Reviewed all touched source/test files, applicable specs, design, ADRs, and both review logs. Inventoried flat-key consumers and child-environment usage. F4’s consumer migration is implemented; F6’s playback termination barrier remains Wave 3 work.

Verification:

- Speak suite: **249 passed, 0 failed**.
- Speak-filtered typecheck: **no diagnostics**; repository-wide TypeScript still exits 2.
- Strict OpenSpec validation: **passes**.
- Provider tests are unchanged, but omit the response-body failure regression below.
- No repository files modified, no staged files, no network requests.

### Findings — highest priority first

#### W1-F1 — P1: Selecting Deepgram still sends speech to ElevenLabs

- **Family / root:** `provider-egress / unsupported-provider-fallthrough`
- **In scope:** Yes; standalone Wave 1 safety, not a demand to implement Wave 2 synthesis now.
- **Governing source:** `openspec/changes/add-speak-voice-input/specs/manual-speech/spec.md:7,137,161–162` requires provider isolation and no ElevenLabs synthesis when Deepgram is selected.
- **Exact evidence:** `extensions/speak/speech-job.ts:367–375` applies Deepgram selection; `396–405` accepts configured Deepgram settings; `467–487` nevertheless reads the ElevenLabs key and invokes ElevenLabs synthesis. Cache identity at `451–461` labels this ElevenLabs audio as Deepgram.
- **Reproduction:** With both provider blocks configured and `provider: "deepgram"`, mocked execution requested `https://api.elevenlabs.io/v1/text-to-speech/voice123456?output_format=mp3_44100_128`.
- **Impact:** Text reaches the wrong service and can be cached under the wrong provider. Localized speech can also incur translation spend before this incorrect routing.
- **SUGGESTED_CORRECTION:** Until Wave 2 implements routing, explicitly refuse Deepgram generation before translation or synthesis, with a truthful unavailable message. Test file selection and command override, both provider blocks/keys present, and zero translation/TTS calls. Keep complete Deepgram synthesis in Wave 2.

#### W1-F2 — P1: Extraction drops response-body timeout/error handling

- **Family / root:** `bounded-request / body-consumption-error-boundary`
- **In scope:** Yes; task 1.5 requires unchanged behavior.
- **Governing source:** Task 1.5 and `openspec/changes/add-speak-voice-input/specs/manual-speech/spec.md:137` require bounded requests and sanitized timeout failures.
- **Exact evidence:** `extensions/speak/bounded-request.ts:19–33` catches only the initial fetch. `extensions/speak/elevenlabs.ts:127–143` consumes the body outside that catch; `bounded-request.ts:46` can reject.
- **Reproduction:** A mocked audio response whose body errors when the deadline fires returns structured `kind: "timeout"` with billing uncertainty at `be10210`; the candidate rejects with raw `AbortError: body aborted`.
- **Impact:** Post-header timeouts, cancellation, and stream failures escape the provider result contract. The controller then renders generic/raw exception text rather than the previous sanitized failure and billing uncertainty.
- **SUGGESTED_CORRECTION:** Keep body consumption within the same deadline-aware exception boundary as fetch, preserving timeout/cancelled/network classification. Add mocked tests for timeout, cancellation, and stream failure after headers; retain existing provider tests unchanged.

#### W1-F3 — P1: Ordinary session navigation silently clears both overrides

- **Family / root:** `provider-selection / override-lifetime`
- **In scope:** Yes; task 1.4.
- **Governing source:** `openspec/changes/add-speak-voice-input/specs/manual-speech/spec.md:7` and `specs/voice-input/spec.md:139` specify restart, reload, or explicit reset—not branch/session navigation.
- **Exact evidence:** `extensions/speak/speech-job.ts:147–148` clears both overrides in `resetSession`; `extensions/speak/index.ts:140–144` invokes it before session switch, before fork, and on tree navigation.
- **Reproduction:** After setting both overrides to ElevenLabs against Deepgram defaults, session cleanup reports both providers as Deepgram without an override.
- **Impact:** Subsequent operations can use a different egress destination without a provider reset or reload.
- **SUGGESTED_CORRECTION:** Separate session/job cleanup from extension-lifetime provider choices. Preserve overrides across switching, forking, and tree navigation; clear them through explicit reset or factory reconstruction. Test setting/reporting/resetting both commands and persistence across all navigation callbacks.

#### W1-F4 — P2: A provider change can affect an already-started job

- **Family / root:** `provider-selection / invocation-snapshot`
- **In scope:** Yes; newly introduced override behavior.
- **Governing source:** `openspec/changes/add-speak-voice-input/specs/manual-speech/spec.md:7,209` requires running-job isolation and per-invocation provider capture.
- **Exact evidence:** `extensions/speak/speech-job.ts:102–105,262–269` starts the job synchronously, but `357–367` reads the mutable override only after asynchronous configuration loading. `160–162` can change it meanwhile.
- **Reproduction:** Start speech with ElevenLabs selected, defer the configuration read, then select Deepgram. The original job refuses because Deepgram is unconfigured, proving that the later override changed its provider.
- **SUGGESTED_CORRECTION:** Snapshot the speech override when claiming the job, and combine that snapshot with its loaded configuration. Add a deferred-read test proving a later override affects only the next invocation.

#### W1-F5 — P2: Deepgram status reveals the full voice and reports the transcription model as speech model

- **Family / root:** `status-reporting / selected-provider-metadata`
- **In scope:** Yes; task 1.4 explicitly implements expanded status.
- **Governing source:** `openspec/changes/add-speak-voice-input/specs/manual-speech/spec.md:114` requires the selected speech voice’s suffix only and speech model.
- **Exact evidence:** `extensions/speak/config.ts:479–486` redacts ElevenLabs voices but prints the entire Deepgram voice and uses `providers.deepgram.sttModel`, normally `nova-3`, as the speech model.
- **Impact:** Status violates the redaction contract and misleadingly identifies transcription configuration as Aura synthesis configuration.
- **SUGGESTED_CORRECTION:** Apply suffix-only voice rendering to both providers and report the Aura synthesis selector separately from transcription settings. Extend status assertions to reject the full Deepgram voice and `nova-3` as the speech model.

### Diagnosis and deferred boundaries

- Old flat keys are rejected with their correct new paths; all four migration-message cases pass.
- Both API keys are represented by presence only in tested status output.
- The child-environment helper removes both keys while retaining `PULSE_SERVER`; playback uses it.
- ADR-0004 is consistent with the consent/provider specs and retains manual-only speech. ADR-0002 is unchanged.
- Provider facts have recorded source URLs and the shortcut’s inherited user confirmation. Their external correctness was not independently rechecked because this review prohibits network requests.
- Full Deepgram synthesis, provider-aware progress/cache behavior, Aura language preflight, README migration, recording, transcription, and F6’s termination barrier belong to Waves 2–3. Their absence is not itself a Wave 1 finding. Unsafe fallthrough is.

### Recommendation and residual risks

**Patch the five bounded issues; no architectural rebuild is warranted.** The green suite misses the reproduced integration and post-header failure cases.

No product decision is needed. No executor handoff is authorized by this review; the caller must reconcile findings first. Real provider behavior, microphones, and linguistic fidelity remain unverified.

PROPOSED_REVIEW_ACTION=PATCH

---

## Caller Assessment — Wave 1, Round 1

I checked every finding against the code. For W1-F2, the pre-extraction `elevenlabs.ts` at `be10210` read the body inside the same `try` as `fetch`; it now reads it outside.

#### W1-F1 — Selecting Deepgram still sends speech to ElevenLabs
- **Oracle Severity:** P1
- **Family:** `provider-egress / unsupported-provider-fallthrough`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** Modified requirement "ElevenLabs synthesis request", scenario "Deepgram selected" (no ElevenLabs request), and ADR-0004 (no fallback between providers). Text is sent to an unselected provider, a concrete egress risk.
- **Decision:** `ACCEPT_BLOCKING`
- **CORRECTION:** Until Wave 2 adds Deepgram synthesis, refuse speech whenever the effective provider is Deepgram, before any translation, synthesis, or cache write. Use a truthful message, for example that Deepgram speech is not available yet, nothing was sent, and `/speak provider elevenlabs` works. Add tests for config selection and command override with both keys and blocks present, asserting zero translation and zero TTS calls.

#### W1-F2 — Extraction drops response-body timeout/error handling
- **Oracle Severity:** P1
- **Family:** `bounded-request / body-consumption-error-boundary`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** Task 1.5 ("without changing behavior") and the "ElevenLabs synthesis request" requirement (timeouts are reported sanitized, without claiming the attempt was free). This is a regression from `be10210`.
- **Decision:** `ACCEPT_BLOCKING`
- **CORRECTION:** Read the body within the same deadline-aware error boundary as the fetch, preserving timeout, cancelled, and network classification and the billing-uncertainty message. Add mocked tests for a timeout, a cancellation, and a stream error after headers, each producing the sanitized structured failure. Keep `provider.test.ts`'s existing cases unchanged; add new cases in a new block or file if needed.

#### W1-F3 — Ordinary session navigation silently clears both overrides
- **Oracle Severity:** P1
- **Family:** `provider-selection / override-lifetime`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** "Speech provider selection" (manual-speech) and "Input provider selection" (voice-input): overrides last until restart, reload, or `reset`.
- **Decision:** `ACCEPT_BLOCKING`
- **CORRECTION:** Keep both overrides out of `resetSession()`. They live for the extension instance and are cleared only by `reset` or factory reconstruction on reload. Test that switch, fork, tree navigation, and shutdown-driven session cleanup preserve them, and that `reset` clears them.

#### W1-F4 — A provider change can affect an already-started job
- **Oracle Severity:** P2 (caller re-grades P1)
- **Family:** `provider-selection / invocation-snapshot`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** "Speech provider selection": changing the provider SHALL NOT affect a job that is already running. Oracle reproduced it, and it decides where the job's text is sent, an egress concern.
- **Decision:** `ACCEPT_BLOCKING`
- **CORRECTION:** Snapshot the effective speech override when the job is claimed and combine it with that job's loaded config. Add a deferred-config-read test in which a later `/speak provider` affects only the next invocation.

#### W1-F5 — Deepgram status reveals the full voice and reports the transcription model as speech model
- **Oracle Severity:** P2
- **Family:** `status-reporting / selected-provider-metadata`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** None reaches the blocking threshold. A Deepgram voice is a public stock name, not a secret, and the mislabeled model is cosmetic until Wave 2 enables Deepgram speech.
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** No Wave 1 edit. Carried into Wave 2 task 2.2 as an implementation note: status renders the Deepgram voice suffix only (per the Status reporting requirement), labels the speech model as the Aura voice model, and shows `sttModel` only under input. Status tests assert neither the full Deepgram voice nor `nova-3` appears as the speech model.

### Summary
- **Issues accepted blocking:** 4 (W1-F1, W1-F2, W1-F3, W1-F4)
- **Issues accepted nonblocking:** 1 (W1-F5, carried to Wave 2)
- **Issues deferred out of scope:** 0
- **Issues rejected:** 0

### Caller Result

REVIEW_ACTION=PATCH
CONSENSUS_STATUS=NEEDS_REVISION

The accepted blockers go to the same owner, worker (W1-C). That is a replacement worker session, because the first run completed in foreground and is not resumable. Gate 1.7 is reused in PATCH mode after remediation.

## Round 2 - Implementation Assignments

Wave handled: 1 (remediation). Final gate reserved: task 1.7, reused in PATCH mode.

| Assignment | Findings | Owner | Files and topics |
| --- | --- | --- | --- |
| W1-C (round 2) | W1-F1, W1-F2, W1-F3, W1-F4 | worker (replacement session, same owner type) | `extensions/speak/speech-job.ts`, `elevenlabs.ts`, `bounded-request.ts`, `test/speak/*`, new `test/speak/provider-body.test.ts` |

Worker summary:

- **W1-F1:** Deepgram speech is refused before translation, cache, or TTS, with tests for config selection and the override.
- **W1-F2:** body reads are back inside the bounded error boundary, with timeout, cancellation, and stream-error tests in `provider-body.test.ts`.
- **W1-F3:** session cleanup preserves overrides, explicit reset clears them, and lifecycle tests cover both.
- **W1-F4:** a job snapshots the override when it is claimed, with a deferred-config test.

Caller re-verification:

- The speak suite gives 256 tests, 256 pass, 0 fail.
- The filtered type check prints nothing.
- `provider.test.ts` and `quota.ts` are unchanged since `be10210`.
- `resetSession()` no longer touches the overrides.

PATCH_BASELINE_REVISION=sha256:851b5b60d4013b558d43deb75d1d95462077668c5093841245f1555c650cb161 (SHA-256 over `git diff be10210`, then path + NUL + bytes of the untracked candidate files docs/adr/0004-voice-input-and-provider-choice.md, extensions/speak/bounded-request.ts, test/speak/provider-body.test.ts)

## Round 2 - Oracle Review

### Gate, baseline, and ownership

**Mode: PATCH.** Loaded `review-convergence`.

Reviewed gate **1.7**, reused after remediation of tasks 1.1–1.6.

| Assignment | Tasks/findings | Owner | Reviewed responsibility |
|---|---|---|---|
| W1-A | 1.1 | orchestrator | ADR-0004 |
| W1-B | 1.2 | orchestrator | Provider facts and design amendments |
| W1-C | 1.3–1.6 | worker | Configuration, overrides/status, bounded requests, child environment |
| W1-C remediation | W1-F1–F4 | worker | Accepted blocker fixes and regression tests |
| Gate | 1.7 | oracle | Whole-wave advisory review |

The prescribed SHA-256 computation matched `PATCH_BASELINE_REVISION` before review and after verification:

`sha256:851b5b60d4013b558d43deb75d1d95462077668c5093841245f1555c650cb161`

### Inherited decisions

Preserved manual-only speech, explicit-send microphone egress, composer-only transcripts, exactly two direct providers, environment-only keys, invocation-fixed provider selection, and no configuration writes. Full Deepgram synthesis remains Wave 2; recording remains Wave 3. W1-F5 remains caller-accepted nonblocking work deferred to Wave 2.

### Accepted blocker verification

| Finding | Result | Exact evidence |
|---|---|---|
| W1-F1 | Fixed | `extensions/speak/speech-job.ts:366–372` refuses Deepgram before translation, synthesis, or cache access. `test/speak/job.test.ts:276–311` verifies configured selection and override with both provider blocks/keys and zero translation/TTS/cache writes. |
| W1-F2 | Fixed | `extensions/speak/bounded-request.ts:20–34` catches body consumption; `extensions/speak/elevenlabs.ts:105–109` consumes audio within that boundary. `test/speak/provider-body.test.ts:17–95` covers post-header timeout, cancellation, and stream failure with sanitized classifications. |
| W1-F3 | Fixed | `extensions/speak/speech-job.ts:141–147` preserves overrides during cleanup; explicit reset remains at `158–160`. `test/speak/command.test.ts:358–382` covers switch, fork, tree, shutdown, and explicit reset for both overrides. |
| W1-F4 | Fixed | `extensions/speak/speech-job.ts:260–262,366` snapshots and applies the invocation’s override. `test/speak/job.test.ts:314–343` proves a later override affects only the next invocation. |

### Whole-wave regression sweep

Reviewed configuration/defaults/validation and migrated consumers, both command parsers, override lifecycle, status, request caps/deadlines/redirects/sanitization, playback environment, ADR links, and recorded provider facts—not just remediation lines.

- Speak suite: **256 passed, 0 failed**.
- Speak-filtered typecheck: **no diagnostics**. Repository-wide TypeScript exits **2** on unrelated existing `extensions/pi-voicekit` errors.
- Both provider keys are removed from playback’s environment; unrelated audio settings remain.
- ADR links resolve; ADR-0002, `quota.ts`, and existing `provider.test.ts` are unchanged.
- No repository files modified, no staged files, no network requests.
- External provider facts and prior strict OpenSpec validation were reviewed as recorded evidence, not independently rerun.

### Findings — highest priority first

#### W1-F5 — P2: Deepgram status metadata remains incorrect

- **Family / root:** `status-reporting / selected-provider-metadata`
- **In scope:** Yes; unchanged, previously accepted nonblocking.
- **Exact evidence:** `extensions/speak/config.ts:479–486` prints the complete Deepgram voice and uses its transcription model as the speech model.
- **DEFERRED_REASON:** Caller explicitly deferred this existing cosmetic issue to Wave 2 task 2.2; it is not a Wave 1 blocker.

#### W1-F6 — P2: Deepgram’s generation refusal also blocks cached replay

- **Family / root:** `replay-contract / generation-only-preflight`
- **In scope:** Yes; introduced by the W1-F1 remediation’s shared preflight guard.
- **Governing source:** `openspec/specs/manual-speech/spec.md:251` requires replay of the current session/branch’s last valid cached clip without provider/model calls.
- **Exact evidence:** `extensions/speak/speech-job.ts:366–372` rejects Deepgram in shared preflight; `496–498` invokes that preflight for replay.
- **Reproduction:** Generate and finish an ElevenLabs clip, select Deepgram, then replay. The clip remains cached, but playback is refused with “Deepgram speech is not available yet”; fetch and spawn counts remain one.
- **Impact:** Recoverable replay failure; selecting ElevenLabs restores access. No wrong-provider egress occurs.
- **SUGGESTED_CORRECTION:** Separate generation-only provider availability checks from replay preflight, retaining player/cache validation. Add a regression proving provider selection does not prevent replay of the existing clip; this can accompany Wave 2 routing work.

### Recommendation and residual risks

**PASS at the Wave 1 blocking threshold:** all four accepted blockers are fixed; no P0/P1 finding remains. Reconcile the new P2 replay finding without reopening the resolved egress family.

No architectural pivot, product decision, or executor handoff is warranted. Real provider behavior, microphone operation, and recognition quality remain unverified.

PROPOSED_REVIEW_ACTION=PASS

---

## Caller Assessment — Wave 1, Round 2

#### W1-F1 – W1-F4 (accepted blockers from Round 1)
- **Decision:** verified fixed. Oracle's evidence matches my re-run: 256/256 tests pass, the filtered type check is clean, and `resetSession()` no longer clears the overrides.

#### W1-F5 — Deepgram status metadata
- **Oracle Severity:** P2
- **Family:** `status-reporting / selected-provider-metadata`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** None reaching the blocking threshold (unchanged from Round 1).
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** Carried into Wave 2 task 2.2, as recorded in Round 1.

#### W1-F6 — Deepgram's generation refusal also blocks cached replay
- **Oracle Severity:** P2
- **Family:** `replay-contract / generation-only-preflight`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** None reaching the blocking threshold. The "Replay never regenerates" requirement is affected, but the failure is safe: nothing reaches any provider, and selecting ElevenLabs restores replay. Wave 2 removes the temporary refusal when it adds Deepgram routing.
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** Carried into Wave 2 task 2.2 as an implementation note. Provider availability and configuration checks apply only to generation, never to `/speak replay`, which keeps only its player and cache checks. Add a regression test where provider selection does not prevent replaying an existing clip.

### Terminal Baseline Validation

- The current candidate equals the latest `PATCH_BASELINE_REVISION`: `sha256:851b5b60d4013b558d43deb75d1d95462077668c5093841245f1555c650cb161`, recomputed by the caller.
- Wave 1 boundary (tasks 1.1–1.6, files listed in Rounds 1–2): unchanged.

### Summary
- **Issues accepted blocking:** 0 this round (4 fixed from Round 1)
- **Issues accepted nonblocking:** 2 (W1-F5, W1-F6, both carried to Wave 2 task 2.2)
- **Issues deferred out of scope:** 0
- **Issues rejected:** 0

### Caller Result

REVIEW_ACTION=PASS
CONSENSUS_STATUS=MOSTLY_GOOD

Wave 1 is complete. Tasks 1.1–1.7 are marked done.

## Wave 2 Review Sequence

## Round 1 - Implementation Assignments

Wave handled: 2. Final gate reserved: task 2.4 [Oracle gate: `oracle`], the Wave 2 review gate, run once after 2.1–2.3.

| Assignment | Tasks | Owner | Bounded responsibility | Files and topics |
| --- | --- | --- | --- | --- |
| W2-A | 2.1, 2.2, 2.3 | worker | Deepgram synthesis client; provider routing (limit, preflight, Aura language check, cache key, progress, translation-failure wording); W1-F5 status display; W1-F6 replay not gated; README | new `extensions/speak/deepgram.ts`; `speech-job.ts`, `config.ts`, `translation.ts`, `README.md`; `test/speak/{provider,job,progress,command}.test.ts`, `harness.ts` |

Caller re-verification (Wave 2 base `4a921fa`):

- The speak suite gives 267 tests, 267 pass, 0 fail.
- The filtered type check prints nothing.
- `quota.ts` is unchanged.
- The Wave 1 "not available yet" refusal is removed.
- `deepgram.ts` uses the fixed origin `https://api.deepgram.com`.
- The README has one JSON config example (the full shape), which parses with `parseConfig`. The two earlier examples (minimal, and translation-only) were merged into it. The worker reports 9/9 documented commands match the usage text.

## Round 1 - Oracle Review

Oracle's full Wave 2 Round 1 section is reproduced below, as indented evidence.

    Mode: FULL. Gate 2.4 consumed once. Mapping reviewed: W2-A (2.1–2.3, worker); gate 2.4 (oracle).
    Candidate identity: sha256:c0c3b10eb2e38a378a347b7f443adc05a25c8d6031f4438cc8a88b02ace54faf
      (git diff 4a921fa bytes, then extensions/speak/deepgram.ts + NUL + bytes).
    Verification: 267 passed / 0 failed; speak-filtered typecheck clean; README JSON parses; no files modified.

    W2-F1 — P1 — secret-redaction / structured-result-notification-bypass — in scope.
      Evidence: deepgram.ts:46–52 embeds providerStatus in messages; bounded-request.ts:69–71 permits
      lowercase token-shaped values; speech-job.ts:540–541 displays result.message without the dual-key
      redaction at 342–350. Reproduced: 401 with detail.status equal to either configured key displayed it.
      SUGGESTED_CORRECTION: client errors cannot echo the request key; apply dual-key redaction before
      displaying structured synthesis failures; token-shaped-key regressions for both keys.

    W2-F2 — P2 — provider-errors / http-body-deadline-classification — in scope.
      Evidence: deepgram.ts:107–111 and 136 read error bodies outside the bounded boundary;
      bounded-request.ts:62–74 swallows body failures. Reproduced: 401 whose body errors at the deadline
      returns kind "auth", not "timeout".
      SUGGESTED_CORRECTION: consume HTTP error bodies inside the bounded boundary; add post-header
      error-body timeout/cancellation tests.

    W2-F3 — P2 — provider-preflight / placeholder-voice-validation — in scope.
      Evidence: config.ts:319–325 generic validation only; speech-job.ts:417–423 checks presence only.
      Reproduced: placeholder `SET-VOICE-en` with locale en entered one mocked translation request.
      SUGGESTED_CORRECTION: reject recognized placeholder voices before translation or synthesis; tests
      for original/literal and localized refusal with zero inference/TTS calls.

    W2-F4 — P2 — documentation / consolidated-setup-guidance-loss — in scope.
      Evidence: README.md:17–57 labels explicit translation choices as "defaults" and drops instructions
      for an authorized voice, Pi-authenticated translation, omitting translation for original/literal
      use, and incrementing voiceRevision after re-cloning.
      SUGGESTED_CORRECTION: restore those instructions; distinguish defaults from illustrative choices.

    W2-F5 — P2 — provider-selection / documented-override-lifetime — in scope.
      Evidence: README.md:85 says overrides change "only the current session".
      SUGGESTED_CORRECTION: document survival across switch/fork/navigation and ending on restart,
      reload, or reset.

    W2-F6 — P3 — provider-selection / invocation-snapshot-test-retention — in scope.
      Evidence: the deferred-config snapshot test formerly at test/speak/job.test.ts:314 was replaced;
      no equivalent remains. Runtime snapshotting (speech-job.ts:265–266,379) is intact.
      SUGGESTED_CORRECTION: restore the deferred-config regression, expecting real Deepgram routing.

    Confirmed sound: fixed Deepgram origin, headers, MP3, text-only body, redirect rejection, 20 MiB cap,
    no retry/fallback, 413 mapping, both ceilings on source and translated text, key checks before
    translation, Aura language check before translation (localized only), provider-separated cache with
    revision 0, provider-named progress and failure wording, W1-F5 fixed, W1-F6 fixed, ElevenLabs and
    quota unchanged.

PROPOSED_REVIEW_ACTION=PATCH

---

## Caller Assessment — Wave 2, Round 1

I checked each finding against the code. W2-F1 is confirmed: `speech-job.ts:540` shows `result.message` unredacted, while `describeError` (342–350) redacts both keys.

#### W2-F1 — Structured provider errors can disclose either API key
- **Oracle Severity:** P1
- **Family:** `secret-redaction / structured-result-notification-bypass`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** Modified requirement "Secret and privacy handling": neither key in notifications. This is a concrete secret-exposure risk.
- **Decision:** `ACCEPT_BLOCKING`
- **CORRECTION:** Pass every provider failure message through the existing two-key redaction before it is shown, at one shared point. The Deepgram client also redacts its own request key. Add regressions with token-shaped keys for both `DEEPGRAM_API_KEY` and `ELEVENLABS_API_KEY` echoed in `detail.status`.

#### W2-F2 — HTTP error-body deadline failures bypass bounded classification
- **Oracle Severity:** P2
- **Family:** `provider-errors / http-body-deadline-classification`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** None reaching the blocking threshold. The HTTP status was received and the message is sanitized; only the timeout and auth classification differs.
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** Carried into Wave 3 task 3.2, whose transcription clients reuse the same error-body path. Consume HTTP error bodies inside the bounded boundary for all clients (Deepgram speech, Deepgram transcription, ElevenLabs transcription), with post-header error-body timeout and cancellation tests.

#### W2-F3 — Deepgram placeholder voices pass generation preflight
- **Oracle Severity:** P2 (caller re-grades P1)
- **Family:** `provider-preflight / placeholder-voice-validation`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** Modified requirement "Preflight before any billable request": the selected provider's voice must be set and not a placeholder before any billable translation or speech request. Oracle reproduced a billable translation call made with a placeholder voice.
- **Decision:** `ACCEPT_BLOCKING`
- **CORRECTION:** Refuse the shipped placeholder (`SET_YOUR_AUTHORIZED_VOICE_ID`) and any Deepgram voice without a language suffix (the `-xx` final segment of `aura-...` ids) before translation or synthesis. There is no voice catalogue. Tests cover original/literal and localized refusal with zero inference and zero TTS calls.

#### W2-F4 — README consolidation lost necessary setup guidance
- **Oracle Severity:** P2
- **Family:** `documentation / consolidated-setup-guidance-loss`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** None reaching the blocking threshold. The user's config migration (task 4.2) is done with the orchestrator, not from the README.
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** Carried into Wave 3 task 3.4, the README owner in Wave 3. Restore the authorized-voice, Pi-authenticated translation, translation-optional, and `voiceRevision` instructions, and separate defaults from illustrative choices.

#### W2-F5 — README misstates override lifetime
- **Oracle Severity:** P2
- **Family:** `provider-selection / documented-override-lifetime`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** None reaching the blocking threshold. The runtime behavior is correct; only the wording is wrong.
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** Carried into Wave 3 task 3.4. Document that overrides survive session switching, forking, and navigation, and end on restart, reload, or `reset`.

#### W2-F6 — Invocation-snapshot regression coverage was removed
- **Oracle Severity:** P3 (caller re-grades P1)
- **Family:** `provider-selection / invocation-snapshot-test-retention`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** The Wave 1 caller correction for W1-F4 required this test as evidence for the "Speech provider selection" requirement (a running job is not affected by a change). Removing it leaves an accepted blocker fix unprotected.
- **Decision:** `ACCEPT_BLOCKING`
- **CORRECTION:** Restore the deferred-config-read regression, with the second invocation now expecting real Deepgram routing.

### Summary
- **Issues accepted blocking:** 3 (W2-F1, W2-F3, W2-F6)
- **Issues accepted nonblocking:** 3 (W2-F2 to task 3.2; W2-F4 and W2-F5 to task 3.4)
- **Issues deferred out of scope:** 0
- **Issues rejected:** 0

### Caller Result

REVIEW_ACTION=PATCH
CONSENSUS_STATUS=NEEDS_REVISION

## Round 2 - Implementation Assignments

Wave handled: 2 (remediation). Final gate reserved: task 2.4, reused in PATCH mode.

| Assignment | Findings | Owner | Files and topics |
| --- | --- | --- | --- |
| W2-A (round 2) | W2-F1, W2-F3, W2-F6 | worker (replacement session) | `extensions/speak/speech-job.ts`, `deepgram.ts`, `test/speak/job.test.ts` |

The worker session was aborted by the user before it returned a result. I reconciled its partial writes from the session transcript:

- **W2-F1:** structured failure messages now go through one shared two-key redaction (`redactFailureMessage`) before display, and `deepgram.ts` redacts its own request key in every status message. Token-shaped key regressions cover both providers.
- **W2-F3:** a Deepgram voice equal to the shipped placeholder, or without a two-letter language suffix, is refused before translation or synthesis. Tests cover both cases.
- **W2-F6:** the deferred-config regression is restored, and its second invocation now expects real Deepgram routing.

Its last actions were the final test and type-check runs. Caller verification of the partial writes:

- The speak suite gives 276 tests, 276 pass, 0 fail.
- The filtered type check prints nothing.
- `git diff --check` is clean.

I accept the writes as the complete Round 2 remediation.

PATCH_BASELINE_REVISION=sha256:bf4f3271f24db78568e71bfb83e0baaba270d6d227b95260c14df03cb9bec694 (SHA-256 over `git diff 4a921fa -- extensions test openspec`, then path + NUL + bytes of extensions/speak/deepgram.ts)

The digest is scoped to `extensions test openspec`. An unscoped `git diff` also covers this review log and `.pi/settings.json`, so it changes whenever either file is edited. That is why an earlier unscoped value (`sha256:92938e7a…`) was replaced before any Oracle run used it.

Routing change from this point (user, 2026-10-09): use the claude-bridge preset for subagents, with only `worker` and `oracle` allowed. `worker` runs on `claude-bridge/claude-sonnet-5-5` (thinking high) and `oracle` on `claude-bridge/claude-opus-5-5` (thinking high). Earlier rounds ran on the project-configured `openai-codex` models.

## Round 2 - Oracle Review

Run `273fe546` (`claude-bridge/claude-opus-5-5`, thinking high, background). Entry appended verbatim by the caller.

Mode: PATCH. Gate task 2.4 [Oracle gate: `oracle`] reused after the caller's PATCH. Owner mapping reviewed: W2-A (tasks 2.1–2.3, worker), plus the Round 2 remediation of W2-F1, W2-F3 and W2-F6 (worker replacement session, partial writes reconciled by the caller). Gate 2.4 is owned by `oracle`.

**Baseline:**
- I recomputed the digest with the recorded method: `git diff 4a921fa -- extensions test openspec`, then `extensions/speak/deepgram.ts`, a NUL byte, and that file's bytes.
- It gives `sha256:bf4f3271f24db78568e71bfb83e0baaba270d6d227b95260c14df03cb9bec694`. This equals the latest `PATCH_BASELINE_REVISION`, both before and after the review.

**Verification:**
- `node --experimental-strip-types --test test/speak/*.test.ts`: 276 tests, 276 pass, 0 fail.
- The filtered `npx tsc --noEmit` printed nothing.
- `git diff --check -- extensions test openspec` is clean.
- Extra checks ran only in a throwaway copy under `/tmp`, which was then deleted. They were one mutation run and one ad-hoc missing-key test. No repository file was modified and no network request was made.

**Accepted blockers, verified fixed:**

- **W2-F1 — `secret-redaction / structured-result-notification-bypass` — fixed.**
  - `speech-job.ts:342–350` (`redactFailureMessage`) redacts both keys. `describeError` (352–355) and the display of structured synthesis failures (`speech-job.ts:552–553`) both go through it.
  - `deepgram.ts:52–85` also redacts its own request key in every status message that includes provider detail.
  - Tests at `test/speak/job.test.ts:207–234` use token-shaped keys (`elevenlabs_token`, `deepgram_token`) that pass the `/^[a-z_]{3,40}$/` filter in `bounded-request.ts:70`.
  - Mutation check: with the shared redaction removed at `speech-job.ts:553`, the ElevenLabs token test fails. That test therefore protects the shared redaction point.

- **W2-F3 — `provider-preflight / placeholder-voice-validation` — fixed to the caller's bar.**
  - `speech-job.ts:420–432` refuses an empty voice, `SET_YOUR_AUTHORIZED_VOICE_ID`, and any voice without a `-[a-z]{2}` suffix. This runs inside generation preflight, before translation, cache lookup or synthesis.
  - Tests at `test/speak/job.test.ts:305–336` cover both cases across `text`, `original` and localized speech. Each expects zero translation calls, zero fetches, zero player starts and no cache files.

- **W2-F6 — `provider-selection / invocation-snapshot-test-retention` — fixed.**
  - `test/speak/job.test.ts:376–408` brings back the deferred-config-read regression.
  - An override set while the config read is held does not change the running job, which sends its request to `api.elevenlabs.io`. The next run sends its request to `api.deepgram.com`.

**Whole-wave regression sweep:**

- **Deepgram client:** confirmed sound.
  - The origin is fixed; the request uses `/v1/speak?model=<voice>&encoding=mp3`, `Authorization: Token`, and a text-only JSON body (`deepgram.ts:96–117`).
  - Redirects are rejected, there are no retries, and the audio is capped at 20 MiB.
  - 413 maps to `too-long`, and 5xx and timeout messages say billing is unknown.
- **Routing:** confirmed sound. ElevenLabs and Deepgram are chosen per job (`speech-job.ts:528–550`), and `job.test.ts:410–427` confirms no ElevenLabs request when Deepgram is selected.
- **Limits:** confirmed sound. The provider ceiling is applied before length checks (`speech-job.ts:384–390`). It is shared by the source check and the translation output check (`translation.ts`, `validateLength`).
- **Preflight:** confirmed sound.
  - For localized speech the key is checked before translation (`speech-job.ts:402–409`). For other speech it is checked after the cache lookup and before synthesis (`speech-job.ts:517–524`).
  - An ad-hoc test in the `/tmp` copy confirmed `DEEPGRAM_API_KEY is not set` with zero translation calls and zero fetches, for both `text` and localized speech.
- **Aura language check:** confirmed sound. It applies only to localized speech, before translation (`speech-job.ts:434–445`), and `/speak original` skips it (`job.test.ts:429–439`).
- **Cache key:** confirmed sound. Deepgram uses provider `deepgram`, its voice, model `aura`, `mp3`, and revision `0` (`speech-job.ts:487–512`). `job.test.ts:458` covers not reusing an ElevenLabs clip.
- **Progress:** confirmed sound. The synthesis phase is labelled from `job.provider` (`speech-job.ts:278–286`), and `progress.test.ts:31` covers Deepgram.
- **Translation-failure wording:** confirmed sound. `noSpeech` names the job's provider in every failure branch (`translation.ts:64–65`), and `job.test.ts:441–456` covers Deepgram.
- **Status:** confirmed sound. The Deepgram voice is shown by suffix only, the model as `Aura voice model`, plus the input model and both key presences (`config.ts:479–503`).
- **Replay:** confirmed sound. Replay runs preflight with generation checks off (`speech-job.ts:563`), and `job.test.ts:473` covers replay after selecting Deepgram.
- **README:** no new defect beyond the carried-over W2-F4 and W2-F5. One P3 is recorded below.
- **Unchanged:** ElevenLabs synthesis and `quota.ts` are unchanged.

**Findings:**

- **W2-F7 — P3 — `provider-preflight / selected-provider-key-test-coverage` — in scope.**
  - Evidence: the spec's "Missing key for the selected provider" scenario (Deepgram selected, `DEEPGRAM_API_KEY` unset) has no Deepgram test. The only `DEEPGRAM_API_KEY is not set` checks in the code are `speech-job.ts:402–409` and `517–524`, and no file in `test/speak/` checks that message.
  - The runtime behavior is correct: an ad-hoc test in the `/tmp` copy passed for both `text` and localized speech.
  - SUGGESTED_CORRECTION: add a `job.test.ts` case with Deepgram selected and no `deepgramKey`, for both `text` and localized speech. It should expect the `DEEPGRAM_API_KEY is not set` message, zero translation calls and zero fetches. This can be folded into task 3.2's tests; it is not a Wave 2 blocker.

- **W2-F8 — P3 — `documentation / consolidated-setup-guidance-loss` (W2-F4 family, evidence update) — not in Wave 2 scope.**
  - Evidence: `extensions/speak/README.md:24` gives `"voiceId": "YOUR_VOICE_ID"` as the example ElevenLabs voice. `config.ts:159–165` rejects only `SET_YOUR_AUTHORIZED_VOICE_ID` and other `SET_` values, so a config copied from the README passes validation and preflight. Localized speech could then pay for a translation before ElevenLabs rejects the voice.
  - This was already in the README at the Wave 2 base `4a921fa`.
  - DEFERRED_REASON: this was already there before Wave 2 and is only a documentation problem, so it belongs with the carried-over W2-F4. In task 3.4, use the recognized placeholder `SET_YOUR_AUTHORIZED_VOICE_ID` in the example (or explain how to choose an authorized voice) when the setup guidance is restored.

**Carried items, not re-graded:** W2-F2 (task 3.2), W2-F4 and W2-F5 (task 3.4) remain outside Wave 2 blocking scope. No new instance of them appeared.

PROPOSED_REVIEW_ACTION=PASS

## Caller Assessment — Wave 2, Round 2

#### W2-F1, W2-F3, W2-F6 (accepted blockers from Round 1)
- **Decision:** verified fixed. Oracle's evidence matches my re-run before dispatch: 276/276 tests pass, the filtered type check is clean, and `git diff --check` is clean.

#### W2-F7 — No Deepgram missing-key test
- **Oracle Severity:** P3
- **Family:** `provider-preflight / selected-provider-key-test-coverage`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** None reaching the blocking threshold. The runtime behavior matches the "Missing key for the selected provider" scenario, and only the regression test is missing.
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** Carried into Wave 3 task 3.2. Add a `job.test.ts` case with Deepgram selected and no `deepgramKey`, for both `text` and localized speech, that expects `DEEPGRAM_API_KEY is not set`, zero translation calls and zero fetches.

#### W2-F8 — README example voice passes validation
- **Oracle Severity:** P3
- **Family:** `documentation / consolidated-setup-guidance-loss` (W2-F4 family)
- **In-scope:** `NO` (already at the Wave 2 base `4a921fa`)
- **GOVERNING_SOURCE:** None reaching the blocking threshold.
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** Carried into Wave 3 task 3.4 with W2-F4. The README config example uses the recognized placeholder `SET_YOUR_AUTHORIZED_VOICE_ID` for both providers' voices.

### Terminal Baseline Validation

- The current candidate equals the latest `PATCH_BASELINE_REVISION`: `sha256:bf4f3271f24db78568e71bfb83e0baaba270d6d227b95260c14df03cb9bec694`, recomputed by the caller after the Oracle run.
- Wave 2 boundary (tasks 2.1–2.3, files listed in Rounds 1–2): unchanged.

### Routing Policy Confirmed

`claude-bridge` subagents run in the background only. A foreground child runs inside the parent Pi process without the parent's extensions, so `pi-claude-bridge` never records the child's replaced system prompt and every request fails with `prompt-capture: no capture for this … system prompt` (two failed foreground Oracle runs this round). A background child is its own Pi process, loads `pi-claude-bridge`, and records its own prompt; run `273fe546` completed this way. Steering still works for background runs.

### Summary
- **Issues accepted blocking:** 0 this round (3 fixed from Round 1)
- **Issues accepted nonblocking:** 2 (W2-F7 to task 3.2; W2-F8 to task 3.4)
- **Issues deferred out of scope:** 0
- **Issues rejected:** 0

### Caller Result

REVIEW_ACTION=PASS
CONSENSUS_STATUS=MOSTLY_GOOD

Wave 2 is complete. Tasks 2.1–2.4 are marked done.

## Wave 3 Review Sequence

Base commit: `a0f85e2` (Wave 2 committed).

## Round 1 - Implementation Assignments

Wave handled: 3. Final gate reserved: task 3.5.

| Assignment | Tasks | Owner | Files and topics |
| --- | --- | --- | --- |
| W3-A | 3.1–3.4, plus the Wave 2 carry-overs W2-F2, W2-F4, W2-F5, W2-F7, W2-F8 and the earlier F6 implementation note | worker (`claude-bridge/claude-sonnet-5-5`, thinking high, background) | `extensions/speak/record.ts` (new), `deepgram.ts`, `elevenlabs.ts`, `bounded-request.ts`, `index.ts`, a new push-to-talk controller module, `README.md`; `test/speak/record.test.ts` and `talk.test.ts` (new), `provider.test.ts`, `job.test.ts`, `silence.test.ts` |

One worker session owns the whole wave: 3.3 builds directly on 3.1 and 3.2, and 3.4 documents what 3.3 registers.

### W3-A result (worker run `de0f136c`)

The worker reported tasks 3.1–3.4 and the carry-overs (W2-F2, W2-F4, W2-F5, W2-F7, W2-F8, F6) as done. New files: `extensions/speak/record.ts`, `talk.ts`, `transcription.ts`, `test/speak/record.test.ts`, `talk.test.ts`. It changed 12 tracked files under `extensions/speak/` and `test/speak/`.

Caller verification:

- The speak suite gives 358 tests, 358 pass, 0 fail, 0 cancelled.
- The filtered type check prints nothing.
- `git diff --check` is clean.

Deviations the worker reported, passed to the Oracle for judgement:

- The default export is now async, because it reads `input.shortcut` at load.
- The time cap is a byte cap (`maxSeconds × 32000`), not a wall-clock timer.
- The elapsed time refreshes on each audio chunk.
- `session_tree` also discards a recording.
- If the config fails to load, `alt+t` is registered.
- `input.language` is sent to ElevenLabs `language_code` as a BCP-47 tag.

`speech-job.ts` is now 616 lines. It was already 538 at the Wave 1 base.

CANDIDATE_REVISION=sha256:573bbdb38aa5fb5bd9a209a36889996786a6a7f83a40d967bdf65146f1f0dca7 (SHA-256 over `git diff a0f85e2 -- extensions test openspec`, then, for each of extensions/speak/record.ts, extensions/speak/talk.ts, extensions/speak/transcription.ts, test/speak/record.test.ts, test/speak/talk.test.ts in that order, path + NUL + bytes)

## Round 1 - Oracle Review

Run `1c8ce64f` (`claude-bridge/claude-opus-5-5`, thinking high, background). Entry appended verbatim by the caller.

Mode: FULL (INITIAL, whole wave). Gate task 3.5 [Oracle gate: `oracle`] was used once. I reviewed the work assigned as W3-A: tasks 3.1–3.4 by `worker`, plus the carry-overs W2-F2 and W2-F7 (task 3.2), W2-F4, W2-F5 and W2-F8 (task 3.4), and the F6 note (task 3.3). Gate 3.5 belongs to `oracle`. I loaded the review-convergence skill.

**Baseline:**
- I recomputed the digest with the recorded method and got `sha256:573bbdb38aa5fb5bd9a209a36889996786a6a7f83a40d967bdf65146f1f0dca7`.
- It equals the recorded `CANDIDATE_REVISION` both before and after the review.

**Verification:**
- The speak suite ran 49 times. The first run gave 357 passed and 1 failed; the other 48 runs, including 16 run 8 at a time, all gave 358 passed. I could not identify which test failed in that first run (see residual risks).
- The filtered `npx tsc --noEmit` printed nothing.
- `git diff --check -- extensions test openspec` is clean.
- I ran 16 mutations in a throwaway copy under `/tmp`, which I then deleted. The tests caught every one: Escape not consumed; audio sent automatically at the cap; the player's exit not awaited; a late transcript not dropped; the recorder given the keys; the composer replaced instead of appended; no 0.5 s minimum; the session override ignored; the provider read at send time instead of at start; recording allowed outside the terminal; a recorder's own exit not treated as a failure; W2-F2 error-body failures swallowed; `/speak` not blocked while recording; session reset doing nothing; `tag_audio_events` dropped; the 1 MiB cap removed.
- I ran three Node experiments on a recorder's last output (findings below). No repository file was modified and no network request was made.

**Confirmed sound against `specs/voice-input/spec.md`, the manual-speech delta, D1–D10 and ADR-0004:**

- **Recorder (`record.ts`):** lookup order rec, arecord, ffmpeg (`:39–74`) with the D3 arguments and `shell: false` (`:130–134`); environment from `childEnvironment`; audio in memory, capped at `maxSeconds × 32000` bytes (`:135–191`); WAV header built in memory (`:91–111`); SIGINT then SIGKILL after 2 s (`:168–178`); a requested or capped stop keeps its audio, while an own exit or no audio is a failure (`:149–161`); MIT notice kept (`:1–21`).
- **Transcription clients:** Deepgram `/v1/listen` with `model`, `smart_format=true`, `language` or `detect_language=true`, `Authorization: Token` (`deepgram.ts:177–225`); ElevenLabs multipart `/v1/speech-to-text` with `model_id`, `tag_audio_events=false`, optional `language_code`, `xi-api-key` (`elevenlabs.ts:170–211`); both reject redirects, apply deadline and cancellation, cap responses at 1 MiB (`transcription.ts:127–137`), map failures to sanitized classes, and redact their own key.
- **W2-F2 fixed:** `boundedRequest` reads HTTP error bodies inside its deadline and cancellation boundary (`bounded-request.ts:40–41,79–81`) for all four clients; `provider-body.test.ts` checks post-header timeout and cancellation for each.
- **Controller (`talk.ts`):** start, stop and transcribe, held-audio transcription, 0.5 s minimum, refusal while transcribing (`:79–112`); Escape consumed only while recording or held, every other key passes through (`:188–193`); held at the cap, sent only on a later press (`:206–212`); provider, model, language, key and timeout fixed at start (`:137–184`); transcript only appended, never submitted (`:253–257`); late transcript dropped via `this.active !== rec`; status line for recording, held and transcribing, cleared on every exit path (`:260–289`); interactive terminal only (`:81–87`); F6 met — a recording waits for the player's real exit (`speech-job.ts:141–144`, `talk.test.ts:257–279`) and `/speak`, including replay, is refused while recording or held (`speech-job.ts:262–266`).
- **Wiring (`index.ts`):** `/talk` argument parsing (`:129–141`); shortcut read at load (`:142–145,172–178`); the four lifecycle hooks only cancel or discard this extension's own work; `silence.test.ts` covers load, reload and lifecycle events with no process started and no request made.
- **README:** voice-input section with setup, controls including the held state, the never-submitted rule and privacy statement (`README.md:98–118`); W2-F4 (`:9, :60–66`), W2-F8 (`:20–36`), W2-F5 (`:96`).
- **W2-F7 fixed:** `job.test.ts:338–353`.
- **Earlier waves not broken:** redaction holds (`talk.ts:291–296`, `redactFailureMessage` unchanged); speech routing, provider-separated cache, replay without generation checks, status and `quota.ts` unchanged.

**Worker deviations:**
- **Async default export:** conforming. The host awaits the extension factory (`pi-coding-agent` 1.1.0 `dist/core/extensions/loader.js:514`; 0.87.1 `:449`). D10 allows the one local read at load.
- **Byte cap instead of a wall-clock timer:** conforming. It counts captured audio, which both providers bill; a stalled recorder never reaches the cap, but nothing is sent without a user action, and Escape and stop still work.
- **Elapsed time per audio chunk:** conforming.
- **`session_tree` also discards a recording:** conforming. It was already a cancel-only hook at `a0f85e2` (`index.ts:144`); a discard sends nothing; documented at `README.md:114`.
- **`alt+t` when the config fails to load:** conforming, word for word with D10; the problem is reported on first use (`talk.ts:134–135`).
- **BCP-47 `language_code`:** conforming to the spec's wording; residual risk below.

### Findings

**W3-F1 — P3 — `recorder / exit-before-stdout-drain` — in scope.**
- Evidence: `record.ts:163` finishes on the child's `exit` event and builds the audio at `record.ts:160`. Node documents that stdio may still be open when `exit` fires, so audio written after SIGINT could arrive too late and the end of the dictation could be cut off; in the edge case a stop could be reported as "recorded no audio". Not reproduced: 0 of 70 runs across three experiments.
- SUGGESTED_CORRECTION: finish on `close` instead (same code and signal, fires after stdio closes), keep `error` for spawn failures, make `FakeChild.finish` emit `close`, and add one test where a chunk arrives after `exit` but before `close`.

**W3-F2 — P3 — `audio-coordination / asynchronous-stop-barrier` (F6 note family) — in scope.**
- Evidence: the controller waits for the old player to exit during its starting phase (`talk.ts:145`), up to the player's 2 s kill grace (`audio.ts:7`). A press then is refused with "still starting" (`talk.ts:90–91`), and Escape is not caught because it is subscribed only at `talk.ts:188`, so Escape reaches the editor. The spec requires catching Escape only while recording or held, so this does not break the spec.
- SUGGESTED_CORRECTION: let a press during the starting phase cancel the attempt by clearing `this.active`, so the checks at `:133,146,159` end it; or record that the bounded 2 s wait satisfies the note.

**W3-F3 — P3 — `documentation / config-example-verification` — in scope.**
- Evidence: the README example uses `SET_YOUR_AUTHORIZED_VOICE_ID` for both voices (`README.md:27,34`), and `config.ts:159–165` rejects the ElevenLabs placeholder, so the example as shipped returns `providers.elevenlabs.voiceId is still the placeholder`, contradicting task 3.4's "the config example parses". With both placeholders replaced it parses. A user who copies the example cannot use voice input (`talk.ts:134–135`) until they replace or remove that line, even for Deepgram-only use. `README.md:20` says the placeholder is refused.
- SUGGESTED_CORRECTION: no code change; record 3.4's parse check as "parses once the placeholders are replaced; refused as shipped on purpose, per W2-F8". Optionally add a README sentence that dictation-only users may leave out `providers.elevenlabs.voiceId`.

**W3-F4 — P3 — `documentation / stale-load-comment` — in scope.**
- Evidence: the `loadConfig` comment says nothing is read at load (`config.ts:423`), but `index.ts:172` reads the config at load for the shortcut.
- SUGGESTED_CORRECTION: say the config is read on demand, plus once at load for `input.shortcut`.

**W3-F5 — P3 — `structure / large-module-decomposition` — not in Wave 3 scope.**
- Evidence: `speech-job.ts` is 616 lines (604 at `a0f85e2`; Wave 3 added 12); `config.ts` is 508 lines, unchanged in this wave. Both exceed the global 500-line split guidance.
- DEFERRED_REASON: both were over the limit before Wave 3; splitting is a refactor outside tasks 3.1–3.4 and can be scheduled after Wave 4.

### Residual risks

- 1 of 49 suite runs failed on the first cold run and the test could not be identified; the likeliest cause is the 3 s timeout in the harness `until()` helper (`harness.ts:320`).
- ElevenLabs documents ISO-639 `language_code` values, and Deepgram may also reject a region tag such as `vi-VN`; the user would see a sanitized `invalid` error only after the upload. `README.md:66` warns that a valid tag does not prove support.
- Real microphones, the shortcut reaching the extension in the terminal, and recognition quality stay unverified until task 4.3.

PROPOSED_REVIEW_ACTION=PASS

## Caller Assessment — Wave 3, Round 1

#### Worker deviations
- **Decision:** accepted as conforming, matching Oracle's judgement. The BCP-47 risk is added to the task 4.3 live checks.

#### W3-F1 — Recorder finishes on `exit`, before its output closes
- **Oracle Severity:** P3
- **Family:** `recorder / exit-before-stdout-drain`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** None reaching the blocking threshold; not reproduced in 70 runs.
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** Carried into Wave 4 task 4.1. Finish the recording on `close`, keep `error` for spawn failures, make `FakeChild.finish` emit `close`, and add one test with a chunk between `exit` and `close`.

#### W3-F2 — Escape is not caught while a recording is starting
- **Oracle Severity:** P3
- **Family:** `audio-coordination / asynchronous-stop-barrier`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** None reaching the blocking threshold; the spec requires catching Escape only while recording or held. The window is at most 2 s and only when `/speak` audio was playing, but an Escape that reaches the editor can interrupt a running agent turn, which the user did not intend.
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** Carried into Wave 4 task 4.1. Treat Escape or a second press during the starting phase as cancelling the attempt, by clearing `this.active` so the existing checks end it.

#### W3-F3 — README example is refused as shipped
- **Oracle Severity:** P3
- **Family:** `documentation / config-example-verification`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** None. Refusing the placeholder is the intended W2-F8 behaviour.
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** Task 3.4's parse check is recorded as "parses once the placeholders are replaced; refused as shipped on purpose, per W2-F8". Carried into Wave 4 task 4.1: add one README sentence that dictation-only users may leave out `providers.elevenlabs.voiceId`.

#### W3-F4 — Stale `loadConfig` comment
- **Oracle Severity:** P3
- **Family:** `documentation / stale-load-comment`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** None.
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** Carried into Wave 4 task 4.1. Say the config is read on demand, plus once at load for `input.shortcut`.

#### W3-F5 — `speech-job.ts` and `config.ts` exceed 500 lines
- **Oracle Severity:** P3
- **Family:** `structure / large-module-decomposition`
- **In-scope:** `NO`
- **GOVERNING_SOURCE:** None for this change.
- **Decision:** `DEFER_OUT_OF_SCOPE`
- **CORRECTION:** None in this change. A responsibility-based split of both files is a follow-up after archive.

#### Residual: one unexplained cold-run test failure
- Carried into Wave 4 task 4.1: rerun the suite cold several times, and if a failure recurs, identify the test and fix its timing (likely the `until()` timeout in `harness.ts`).

### Terminal Baseline Validation

- The current candidate equals the recorded `CANDIDATE_REVISION`: `sha256:573bbdb38aa5fb5bd9a209a36889996786a6a7f83a40d967bdf65146f1f0dca7`, recomputed by the caller after the Oracle run.
- Wave 3 boundary (tasks 3.1–3.4, files listed in the W3-A result): unchanged.

### Summary
- **Issues accepted blocking:** 0
- **Issues accepted nonblocking:** 4 (W3-F1, W3-F2, W3-F3, W3-F4, all carried to Wave 4 task 4.1)
- **Issues deferred out of scope:** 1 (W3-F5)
- **Issues rejected:** 0

### Caller Result

REVIEW_ACTION=PASS
CONSENSUS_STATUS=MOSTLY_GOOD

Wave 3 is complete. Tasks 3.1–3.5 are marked done.

## Wave 4 Review Sequence

Base commit: `9cba1a0` (Wave 3 committed). Note: the first Wave 3 commit (`928d759`) carried a truncated `tasks.md` after an `sed -i` failure on this mount; it was amended before any push, and the committed file was checked at 83 lines with 16 tasks done.

## Round 1 - Implementation Assignments

Wave handled: 4. Final gate reserved: task 4.4.

| Assignment | Tasks | Owner | Files and topics |
| --- | --- | --- | --- |
| W4-A | 4.1 carry-overs W3-F1, W3-F2, W3-F3, W3-F4, cold-run check | worker (`claude-bridge/claude-sonnet-5-5`, thinking high, background) | `extensions/speak/record.ts`, `talk.ts`, `config.ts`, `README.md`; `test/speak/record.test.ts`, `talk.test.ts`, `harness.ts` |
| W4-B | 4.1 integration check, 4.2 config migration | orchestrator | `~/.config/pi-speak/config.json` only with user approval |
| W4-C | 4.3 live checks | user | — |

### W4-A result (worker run `584ac931`)

The worker reported all five items done with no deviation.

- **W3-F1:** the recorder finishes on `close`, and the finish runs once. `FakeChild` emits `exit` then `close`. A new test keeps a chunk that arrives between them.
- **W3-F2:** an Escape listener is held during the starting phase. Escape or a second press cancels the attempt with "Recording cancelled. Nothing was recorded or sent." Two new tests cover this.
- **W3-F3:** the README sentence is added, after a `parseConfig` check that a config without `providers.elevenlabs.voiceId` parses.
- **W3-F4:** the comment is corrected.
- **Cold-run check:** five runs of 361/361 pass, so `until()` is unchanged.

The worker reported one remaining risk. If Escape arrives during the recorder lookup, after the player has exited, the recorder is still spawned and then stopped at once. Nothing is sent.

Caller verification:

- The speak suite gives 361 tests, 361 pass, 0 fail, 0 cancelled.
- The filtered type check prints nothing.
- `git diff --check` is clean.

### Task 4.1 integration check (orchestrator)

Command: `strace -f -e trace=openat,execve,connect pi --offline -ne -ns -nc --no-session -e extensions/speak/index.ts --list-models zzz-no-match`. It was run twice, the first time tracing only `execve` and `connect`.

- The exit code is 0, stderr is empty, and stdout is `No models matching "zzz-no-match"`.
- The extension loaded. All 17 `extensions/speak/*.ts` modules were opened, and `~/.config/pi-speak/config.json` was read once, for `input.shortcut`.
- There was no network use: 0 `connect` calls.
- No recorder or player was started. The only `execve` calls were `pi` and `node`.
- The live config is still in the old flat format, so it is rejected. Load stays silent, as D10 requires: the problem is reported on first use.

### Task 4.2 config migration (orchestrator, user-approved 2026-10-09)

The user chose ElevenLabs for voice input, a fixed voice-input language, and `anthropic/claude-haiku-5-5` with thinking high for translation. The old flat file is kept as `~/.config/pi-speak/config.json.flat-backup`. The new file has these settings:

- `provider: elevenlabs`.
- `providers.elevenlabs`: the voice ID and `modelId` carried over unchanged.
- `input`: `provider: elevenlabs`, `language: vi`.
- `locale: vi`.
- `translation`: `anthropic/claude-haiku-5-5`, thinking high.

`parseConfig` accepts the file. The defaults it resolves are `maxSeconds` 60, shortcut `alt+t`, `sttModel` `scribe_v2`, output `mp3_44100_128` and `voiceRevision` 1. `pi --list-models` lists `anthropic/claude-haiku-5-5`.

Not yet verified: `/speak status` after `/reload`. It needs the user's interactive session.

### Task 4.2 and 4.3 user results (2026-10-09)

The user reloaded Pi with the migrated config and reported the following:

- `/speak` on an answer played correctly, translated to Vietnamese by `anthropic/claude-haiku-5-5`.
- `/talk` voice input with ElevenLabs transcribed correctly into the composer.
- `/speak text Hello there` played correctly.
- No errors were shown.

This completes the 4.2 check that the config loads after `/reload` with no configuration error. For 4.3, these items were not run:

- The optional Deepgram checks: `DEEPGRAM_API_KEY` is not set, and the user chose ElevenLabs for both directions.
- An explicit Escape-discard report.
- A region-tag check: `input.language` is the plain tag `vi`, not a region tag.

CANDIDATE_REVISION=sha256:ae7e6be861a7a5e1981d4cb9ca883b5358d17e6b282fa2c60cfa39f8a19fe365 (SHA-256 over `git diff 9cba1a0 -- extensions test openspec`; Wave 4 adds no new files)

## Round 1 - Oracle Review

Run `e5a3a850` (`claude-bridge/claude-opus-5-5`, thinking high, background). The caller appended this entry, condensed from the returned text without changing any finding.

Mode: FULL (INITIAL, whole wave), plus a whole-change readiness check as the final gate. Gate task 4.4 [Oracle gate: `oracle`] was used once. Owners reviewed: W4-A (`worker`, run `584ac931`), W4-B (orchestrator), W4-C (user). Gate 4.4 is owned by `oracle`.

**Baseline:** `git diff 9cba1a0 -- extensions test openspec | sha256sum` gives `ae7e6be861a7a5e1981d4cb9ca883b5358d17e6b282fa2c60cfa39f8a19fe365`, which equals the recorded `CANDIDATE_REVISION`. Wave 4 adds no new files.

**Verification:**
- The speak suite ran 3 times, each 361/361 pass.
- The filtered type check printed nothing.
- `openspec validate add-speak-voice-input --strict` passes.
- `git diff --check` is clean.
- 7 mutations ran in `/tmp`. Five were caught. Two survived, neither changing behaviour that matters: a redundant once-guard, and an over-broad starting listener that only matters before `begin` returns.

**Carry-overs:**
- W3-F1 is closed (`record.ts:150,163,165`; `harness.ts:44–54`; `record.test.ts:136–147`).
- W3-F2 is closed (`talk.ts:90–91,125–134`; `talk.test.ts:293–318`).
- W3-F3 is closed (`README.md:102`).
- W3-F4 is closed (`config.ts:423`).
- The cold-run check is closed: 8 runs in total, no recurrence.

**Worker's residual risk:** acceptable. An Escape during `findRecorder` spawns a recorder that is stopped at once. Its audio is never read, and no request or status line follows.

**Task evidence:**
- 4.1 is satisfied.
- 4.2: the migration is recorded, backed up, and accepted by `parseConfig`. `/speak status` itself was not reported (W4-F2).
- 4.3 was run in part. ElevenLabs input, ElevenLabs speech and the `vi` language tag were verified. The rest is acceptable as explicitly unverified: the Deepgram speech and input checks, the Deepgram language tag, and a real-terminal Escape discard.

**Whole-change readiness:** the code and tests are ready.
- All 10 voice-input requirements and 11 manual-speech delta requirements have implementation and scenario tests.
- No conflict with the main spec.
- All carry-overs are closed.
- W3-F5 stays deferred and has not grown.
- ADR-0004 is still accurate.

### Findings

**W4-F1 — P3 — `documentation / escape-window-text` — in scope.**
- Evidence: the code consumes Escape, and cancels on a second press, while a recording is starting (`talk.ts:90–91,125–129`). The text still says "only while a recording is in progress or held" in three places: `design.md:71`, `design.md:138` and `README.md:114`. The README controls table has no row for the starting state (`README.md:107–112`). The spec sets a minimum, not an exclusive window (`specs/voice-input/spec.md:48`), so it is not contradicted.
- SUGGESTED_CORRECTION: text-only orchestrator edits to `design.md:71,138`, `README.md:114`, and one new README table row for the starting state. Then record a new candidate revision before the terminal action.

**W4-F2 — P3 — `verification / live-evidence-vs-task-wording` — in scope.**
- Evidence: task 4.2 asks for `/speak status` after `/reload`, but only working `/speak` and `/talk` use was reported. Task 4.3 was run in part. The log says the region-tag check was not run, yet ElevenLabs accepted `vi` as written.
- SUGGESTED_CORRECTION: for 4.2, ask the user for `/speak status`, or record that the working use stands in for it. For 4.3, record what was verified and what was not, and decide whether to check it with that note.

**W3-F5 — P3 — `structure / large-module-decomposition` — not in scope (carried).**
- DEFERRED_REASON: deferred after archive. Neither file changed in Wave 4.

### Residual risks

- Deepgram is untested against the real service.
- Escape in a real terminal is unconfirmed: it is covered by the test harness only.
- The controller would stick in "Transcribing…" if a recording tool's stdout never closed. The three supported tools do not do that.
- The integration check may have exited before lifecycle events fired. `silence.test.ts` covers those events.
- `.pi/settings.json` is modified and out of scope, so it stays out of the change commit.

PROPOSED_REVIEW_ACTION=PASS

## Caller Assessment — Wave 4, Round 1

#### W4-F1 — Escape-window text lags the W3-F2 fix
- **Oracle Severity:** P3
- **Family:** `documentation / escape-window-text`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** None reaching the blocking threshold. The spec is not contradicted, and the behaviour is correct and tested.
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** Carried into the approved follow-up change (working name `add-speak-locale-help-and-send`). That change rewrites the README controls table and the push-to-talk key handling for the new `Alt+T` (transcribe and send) and `Alt+Shift+T` (transcribe only) shortcuts. Its README and design will describe Escape and a second press as cancelling a recording that is still starting. Editing the text here would invalidate this PASS for wording the follow-up change replaces anyway. This change's `design.md` is archived as history, so its own text is left as written.

#### W4-F2 — Live evidence versus the task wording
- **Oracle Severity:** P3
- **Family:** `verification / live-evidence-vs-task-wording`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** Gate 4.4 accepts 4.3 as "complete or explicitly reported as unverified".
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:**
  - **4.2:** `/speak status` was not run. Instead, `/speak` with translation, `/speak text` and `/talk` all worked after `/reload` with no error. Each of them loads and validates the migrated config, so that stands in for the status check.
  - **4.3:** checked, with this note.
    - Verified by the user: ElevenLabs speech with Vietnamese translation, `/speak text`, ElevenLabs voice input, and `input.language: vi` accepted by ElevenLabs.
    - Explicitly unverified: Deepgram speech and Deepgram voice input (no `DEEPGRAM_API_KEY`, by the user's choice), Deepgram's handling of the language tag, and a real-terminal Escape discard.

#### W3-F5 — Large modules
- **Decision:** `DEFER_OUT_OF_SCOPE` (unchanged). Split `speech-job.ts` and `config.ts` along their responsibilities after archive.

### Terminal Baseline Validation

- The current candidate equals the recorded `CANDIDATE_REVISION`, `sha256:ae7e6be861a7a5e1981d4cb9ca883b5358d17e6b282fa2c60cfa39f8a19fe365`. The caller recomputed it after the Oracle run.
- The Wave 4 boundary is unchanged: the files listed in the W4-A result, plus the user config outside the repository.

### Summary
- **Issues accepted blocking:** 0
- **Issues accepted nonblocking:** 2. W4-F1 goes to the follow-up change; W4-F2 is recorded here.
- **Issues deferred out of scope:** 1 (W3-F5)
- **Issues rejected:** 0

### Caller Result

REVIEW_ACTION=PASS
CONSENSUS_STATUS=MOSTLY_GOOD

Wave 4 is complete, and tasks 4.1–4.4 are marked done. All 20 tasks of `add-speak-voice-input` are complete.

## Wave 5 Review Sequence (amendment of 2026-10-09)

After the Wave 4 live checks, the user asked to amend this change instead of archiving it. They asked for:

- **Send key:** `alt+t` transcribes and sends, and `alt+shift+t` transcribes only. The control that stops a recording decides which. `/talk` stays transcribe-only, and `/talk send` is added.
- **Busy agent:** when the agent is working, a sent message interrupts its current turn by default, and `input.sendWhenBusy: "wait"` queues it instead.
- **Recording length:** the default rises to 120 seconds, and it stays configurable. It is our own cap: Deepgram accepts up to 2 GB per request and ElevenLabs up to 3 GB or 10 hours.
- **Speech locale:** `/speak locale <tag|reset>` sets it for the session, and `/speak in <tag>` sets it for one command.
- **Help:** `/speak help` and `/talk help` show one combined list.

The user accepted every recommendation for Q3–Q5.

Task 5.1 (orchestrator) covers the artifact amendments:

- ADR-0005 is added, and ADR-0004's status now marks its delivery rule as superseded.
- `proposal.md` gains an amendment section.
- In `design.md`, D4, D5, D6, D10 and Risks are updated. D11–D14 and two provider-limit facts are added. This includes the W4-F1 text fix.
- `specs/voice-input/spec.md` changes: the talk contract, lifecycle, indicator, the "Transcript delivery" requirement (renamed), and privacy.
- The manual-speech delta adds the combined-help requirement, and changes the command contract, status reporting, and the configurable-locale requirement (now MODIFIED).
- `openspec validate add-speak-voice-input --strict` passes.

Base commit for Wave 5 code: the amendment commit that follows `ff04491`.

Base commit: `c904c58`.

## Round 1 - Implementation Assignments

Wave handled: 5. Final gate reserved: task 5.8.

| Assignment | Tasks | Owner | Files and topics |
| --- | --- | --- | --- |
| W5-A | 5.2–5.6 | worker (`claude-bridge/claude-sonnet-5-5`, thinking high, background) | `extensions/speak/config.ts`, `talk.ts`, `index.ts`, `speech-job.ts`, `README.md`; `test/speak/config.test.ts`, `talk.test.ts`, `silence.test.ts`, `command.test.ts`, `job.test.ts`, `localized-job.test.ts` |
| W5-B | 5.7 | user | live checks |

### W5-A result (worker run `879098ff`)

The worker reported tasks 5.2–5.6 done. In the middle of the run, the user added `?` as a short form of `help` for both commands. That reached the worker as a steering message and is implemented and tested.

Files:

- New: `extensions/speak/help.ts` (53 lines).
- Changed source files: `config.ts`, `index.ts`, `speech-job.ts`, `talk.ts`, `README.md`.
- Changed tests: `harness.ts`, `config.test.ts`, `silence.test.ts`, `talk.test.ts`, `command.test.ts`, `job.test.ts`, `localized-job.test.ts`.
- `speech-job.ts` is now 653 lines and `config.ts` 539 (the W3-F5 family).

Deviations the worker reported, passed to the Oracle for judgement:

1. If reading `sendWhenBusy` fails at send time, the transcript is appended, nothing is sent, and the error is shown.
2. Every unknown argument now prints the combined help, including bad provider names.
3. Help reads the shortcuts from the file on demand. After an edit without `/reload`, help can name a key that is not registered yet.
4. `/speak in` validates its tag before the run-mode check.

Caller verification:

- **First run:** 401 tests, 400 pass, 1 fail. I did not capture which test failed.
- **Reruns:** 6 runs in a row each gave 401/401. So did 4 concurrent runs under load.
- **Pattern:** this is the second time an unidentified failure has happened on the first run after a code change (Wave 3: 1 of 49).
- The filtered type check prints nothing, `git diff --check` is clean, and `openspec validate --strict` passes.

CANDIDATE_REVISION=sha256:ce1e35ace08431cd0d6d54fc17a27b8fb6f168181a07326bed0a76800b5cfff0 (SHA-256 over `git diff c904c58 -- extensions test openspec`, then path + NUL + bytes of extensions/speak/help.ts)

### Wave 6 decisions recorded (user, 2026-10-09; to be specified after Wave 5 is committed)

The user asked for a spoken stop phrase. When it is heard, the recording stops and is sent. This reverses two decisions:

- **Design D2:** audio was uploaded once, after the stop.
- **ADR-0004/0005 on voice triggers:** they ruled them out.

A new ADR will record the reversal. Decisions:

- **Q1:** stream to ElevenLabs first. Deepgram may come later, or never.
- **Q2:** the stop phrase acts like `alt+t`, which transcribes and sends.
- **Q3:** the phrase is removed from the end of the text before sending.
- **Q5:** off by default and turned on in config. When on, every recording streams.
- **Q6:** Wave 6 of this change, after Wave 5 is committed.
- **Q4 (phrase list and config):** awaiting the user's answer.

Provider facts were checked on 2026-10-09. Sources: https://elevenlabs.io/docs/api-reference/speech-to-text/v-1-speech-to-text-realtime.md and https://elevenlabs.io/docs/overview/models.md.

- **Endpoint and auth:** `wss://api.elevenlabs.io/v1/speech-to-text/realtime`, model `scribe_v2_realtime`, authenticated with the `xi-api-key` header or a single-use `token` query parameter.
- **Audio in:** the `audio_format` enum includes `pcm_16000`, which is the default and matches our recorder. Audio is sent as `input_audio_chunk` messages carrying `audio_base_64`, `commit` and `sample_rate`.
- **Text out:** `partial_transcript` and `committed_transcript` messages.
- **Commit strategies:** `manual`, `vad` (commits on silence, tuned with `vad_silence_threshold_secs`) and `turn_prediction`.
- **Language:** `language_code` takes ISO 639-1 or 639-3 codes.
- **Errors:** `auth_error`, `resource_exhausted`, `chunk_size_exceeded`, session time limit, and `error`.
- **Languages:** the models page lists "90+ languages" for Scribe v2 Realtime but does not name Vietnamese.
- **Node:** Node v22.19.0's built-in `WebSocket` sends a custom `xi-api-key` header. I checked this against a local test server, with no network use.

- **Q4 (user, 2026-10-09):** stop phrases come from a config list, `input.stopPhrases`, defaulting to `["let's go"]`. The user adds their own, including Vietnamese ones. The user confirmed the pause-commit approach (ElevenLabs `commit_strategy: "vad"`) and asked to proceed.

### Wave 5 gate with task 5.7 unverified

The user asked to proceed to Wave 6 without running the Wave 5 live checks first. Gate 5.8 accepts 5.7 as "complete or explicitly reported as unverified", so the gate runs now with 5.7 reported as **unverified, not run**. Its items are carried into the Wave 6 live checks so they run once, after both waves.

## Round 1 - Oracle Review (Wave 5)

Run `8f42ec69` (`claude-bridge/claude-opus-5-5`, thinking high, background). The caller condensed the returned text without changing any finding.

**Gate and baseline:** gate task 5.8, INITIAL mode. The baseline `ce1e35ace08431cd0d6d54fc17a27b8fb6f168181a07326bed0a76800b5cfff0` matches, before and after the review.

**Owners reviewed:**
- Task 5.1: orchestrator, `c904c58`, plus the uncommitted `?` amendments.
- W5-A: worker, tasks 5.2–5.6 and `?`.
- W5-B: user, task 5.7, unverified and not run.

**Checks:**
- Tests 401/401, the filtered type check is clean, `openspec validate --strict` passes, and `git diff --check` is clean.
- 76 suite runs ran in `/tmp` (40 one after another, then 36 concurrent) to find the flaky test.

**Confirmed sound:**
- **Config:** the new keys and defaults; equal keys rejected without regard to case (`config.ts:383-384`).
- **Send mode:** the stopping control decides the mode (`talk.ts:115,125`); `expandPromptTemplates: false`; steer or follow-up chosen from `isIdle()` at send time (`talk.ts:315-321`); nothing sent for an empty or dropped transcript; either key cancels a starting recording (`talk.ts:107-108`); both status lines name both keys.
- **Locale:** validation, lifetime and precedence, fixed at job start (`speech-job.ts:309,432`); the Aura check runs before translation; both cache keys and the status mark use it.
- **Help:** `help` and `?` for both commands, in every run mode.
- **README.**
- **Host API signatures:** `types.d.ts:1243-1246,236`.
- **No regressions** from Waves 1–4.

**Findings:**

- **W5-F1 — P1 — `send-failure-host-contract` — in scope.**
  - `pi.sendUserMessage` returns at once and reports an asynchronous `prompt()` failure only through `runner.emitError` (`agent-session.js:2712-2719`).
  - `prompt()` refuses during compaction (`:1534-1536`), and with no model or no credentials (`:1567-1579`).
  - `isIdle()` is false during compaction (`:1053-1055`), so the default `interrupt` path sends, and `setEditorText("")` clears the draft plus the transcript.
  - Pi's own Enter queues the message during compaction (`interactive-mode.js:2703-2712`).
  - The harness fake throws synchronously (`harness.ts:173`), which the host never does. D11 (`design.md:127`) assumed it would.
  - SUGGESTED_CORRECTION:
    - Code: refuse before sending, keeping the text and showing a message, when `ctx.model` is undefined or compaction is in progress. Track compaction with `session_before_compact`, `session_compact` and `session_compact_failed`, and tell the user to press Enter.
    - Artifacts: narrow the guarantee to refusals the extension can detect before sending, and document that refusals Pi reports later are shown by Pi after the composer is cleared.
    - Tests: make the fake fail asynchronously, and add cases for compaction and for no model.
- **W5-F2 — P3 — `registered-vs-file-shortcuts` — in scope (worker deviation 3).**
  - Help and the status lines name the shortcuts read from the file now (`help.ts:15-19`, `talk.ts:218-219`), while Pi registers them only at load (`index.ts:178-192`).
  - SUGGESTED_CORRECTION: pass the registered `shortcuts` into help and `TalkController`, and keep reading the file for the locale and the config-error line only. Amend D14 and the help rule to "the registered shortcuts".
- **W5-F3 — P3 — `test-determinism` — in scope, but the test predates Wave 5.**
  - The flaky test is `diagnostics.test.ts:117`. Its negative pattern `/401|.../` (`:136-139`) can match a random `randomUUID()` diagnostic ID (`speech-job.ts:366`) or the timestamp, so it fails in about 1–1.5 % of runs.
  - It failed once in 76 runs, on an ID containing `401`, and failed every time with a fixed ID containing `401`.
  - SUGGESTED_CORRECTION: remove the ID and the timestamp from the text before matching, or narrow the pattern.
- **W3-F5 — P3 — recurrence update — deferred.** `speech-job.ts` is 653 lines and `config.ts` 539.

**Worker deviations:**
- Deviation 1 (keep the text unsent when the config read fails) is accepted.
- Deviation 2 (every unknown argument prints the combined help) is accepted.
- Deviation 3 (help reads shortcuts from the file) is not accepted; see W5-F2.
- Deviation 4 (`/speak in` validates before the run-mode check) is accepted.

PROPOSED_REVIEW_ACTION=PATCH

## Caller Assessment — Wave 5, Round 1

I checked the W5-F1 host evidence myself in Pi 1.1.0 `dist/core/agent-session.js`. Lines 2712–2719 wrap `sendUserMessage` in `.catch(runner.emitError)`. Lines 1534–1536 throw during compaction. Lines 1052–1055 show `isIdle` is false while compacting.

#### W5-F1 — A failed send clears the composer
- **Oracle Severity:** P1
- **Family:** `send-failure-host-contract`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** `specs/voice-input/spec.md` "Transcript delivery": "If the send fails, the composer SHALL keep the draft plus transcript and the error SHALL be shown". ADR-0005: "as if the user had pressed Enter".
- **Decision:** `ACCEPT_BLOCKING`
- **CORRECTION:**
  - **Before sending:** refuse, keep the composer text, and show a message when `ctx.model` is undefined, or while compaction is in progress. Compaction is tracked through the compaction events. The message tells the user to press Enter, which Pi queues.
  - **Test fake:** it fails asynchronously, like the host. Add tests for compaction and for no model.
  - **Artifacts (orchestrator, below):** D11 and the "Transcript delivery" requirement now limit the keep-the-text guarantee to refusals detectable before sending. They state that a refusal Pi reports only after accepting the call, such as missing credentials, is shown by Pi as an error after the composer was cleared.
  - **README:** worker, in the same batch.
  - This clarifies the guarantee to match the host API. It does not change scope, so no user decision is needed.

#### W5-F2 — Help and status lines name file shortcuts, not registered ones
- **Oracle Severity:** P3
- **Family:** `registered-vs-file-shortcuts`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** None reaching the blocking threshold.
- **Decision:** `ACCEPT_NONBLOCKING`, fixed in the same patch batch because it is small and touches the same files.
- **CORRECTION:** show the registered shortcuts, and keep reading the file only for the locale and the config-error line. D14 and the help requirement are amended below.

#### W5-F3 — Flaky diagnostics test
- **Oracle Severity:** P3
- **Family:** `test-determinism`
- **In-scope:** `YES` (test quality; the test predates Wave 5)
- **GOVERNING_SOURCE:** None reaching the blocking threshold. It explains both unidentified first-run failures.
- **Decision:** `ACCEPT_NONBLOCKING`, fixed in the same batch.
- **CORRECTION:** remove the diagnostic ID and the timestamp from the text before the negative match.

#### W3-F5 — Large modules
- **Decision:** `DEFER_OUT_OF_SCOPE` (unchanged).

### Summary
- **Issues accepted blocking:** 1 (W5-F1)
- **Issues accepted nonblocking:** 2 (W5-F2, W5-F3, fixed in the same batch)
- **Issues deferred out of scope:** 1 (W3-F5)
- **Issues rejected:** 0

### Caller Result

REVIEW_ACTION=PATCH
CONSENSUS_STATUS=NEEDS_REVISION

## Round 2 - Implementation Assignments (Wave 5)

The orchestrator amended the artifacts for W5-F1 and W5-F2. `openspec validate --strict` passes.

- **`design.md` D11:** the extension checks what it can before sending. With no model selected, or during compaction, it keeps the text and shows a message. A refusal Pi reports later is shown by Pi after the composer was cleared.
- **`design.md` D14:** help names the shortcuts registered at load.
- **voice-input "Transcript delivery":** narrowed accordingly, with a new scenario, "Send during compaction".
- **manual-speech help requirement:** names the registered shortcuts.

| Assignment | Findings | Owner | Files and topics |
| --- | --- | --- | --- |
| W5-A (round 2) | W5-F1, W5-F2, W5-F3 | worker (`claude-bridge/claude-sonnet-5-5`, thinking high, background) | `extensions/speak/talk.ts`, `index.ts`, `help.ts`, `speech-job.ts`, `README.md`; `test/speak/harness.ts`, `talk.test.ts`, `command.test.ts`, `diagnostics.test.ts` |

### W5-A round 2 result (worker run `3d92d9f8`)

The worker reported all three findings fixed.

- **W5-F1:**
  - Before sending, the extension refuses when `ctx.model` is undefined or compaction is in progress. It keeps the draft and the transcript, and says to press Enter during compaction.
  - `index.ts` tracks compaction with `session_before_compact`, `session_compact` and `session_compact_failed`. None of these handlers returns a result.
  - The harness fake now fails asynchronously.
  - Tests added: sending during compaction (`interrupt` and `wait`), the compaction block ending, no model, and an async host refusal that is not seen.
  - The README is updated.
- **W5-F2:** both controllers take the registered shortcuts from `index.ts`, and help reads the file only for the locale and the error line. Tests cover an unreloaded edit and an unreadable file.
- **W5-F3:** `diagnostics.test.ts` removes the diagnostic ID, `timestamp` and `elapsedMs` before the negative match. It was proved with a forced ID containing `401` in `/tmp`.

The worker reported these API changes:
- The harness options gain `shortcuts`, `sendThrows`, `hostErrors` and `noModel`.
- The controllers now require a `shortcuts` argument.
- `Shortcuts` is a new exported type in `config.ts`.

Caller verification:
- The worker's runs: 409/409 in each of 5 runs.
- Caller rerun: 409 tests, 409 pass, 0 fail.
- The filtered type check prints nothing, `git diff --check` is clean, and `openspec validate --strict` passes.

PATCH_BASELINE_REVISION=sha256:6ad07d4a277daccde08c189c00e6dc9f8e36abf96150b23f1cc4b70ec7474184 (same method as CANDIDATE_REVISION: `git diff c904c58 -- extensions test openspec`, then path + NUL + bytes of extensions/speak/help.ts)

## Round 2 - Oracle Review (Wave 5)

Run `05ee7b25` (`claude-bridge/claude-opus-5-5`, thinking high, background). The caller condensed the returned text without changing any finding.

**Gate and baseline:** gate task 5.8, PATCH mode, Oracle round 2 of 4. The candidate `sha256:6ad07d4a277daccde08c189c00e6dc9f8e36abf96150b23f1cc4b70ec7474184` equals the latest `PATCH_BASELINE_REVISION`.

**Owners reviewed:**
- Task 5.1: orchestrator, `c904c58` plus the uncommitted amendments.
- W5-A: worker runs `879098ff` and `3d92d9f8`.
- W5-B: user, task 5.7, unverified and carried into Wave 6.

**Checks:**
- 409/409 in each of 6 runs; the filtered type check is clean; `openspec validate --strict` passes; `git diff --check` is clean.
- 7 mutations in `/tmp`, each caught by 1–6 tests: compaction refusal removed, no-model refusal removed, either clearing event ignored, a cancelling before-compact handler, help naming the file's shortcut, and the composer not cleared.

**Fixes verified:**
- **W5-F1:**
  - The send refusal (`talk.ts:326-335`) uses the live `context.model` getter (`runner.js:642-645`).
  - The Enter hint is accurate (`interactive-mode.js:2703-2712`), and the synchronous-throw path is kept (`talk.ts:336-351`).
  - The fake fails asynchronously (`harness.ts:183-193`), and the tests fire the registered handlers (`talk.test.ts:554-609`).
  - D11, the spec (`voice-input/spec.md:137`) and the README do not over-promise.
- **W5-F2:** one `shortcuts` object goes to registration and to both controllers (`index.ts:190-206`, `help.ts:9-46`, `talk.ts:384-386`), with tests at `command.test.ts:204-227` and `talk.test.ts:611`.
- **W5-F3:** the ID, `timestamp` and `elapsedMs` are removed before the match (`diagnostics.test.ts:136-142`). They are the only random or clock values.

**Compaction flag against Pi 1.1.0 (`agent-session.js`):**
- **Manual `/compact`:** every exit after `session_before_compact` emits `session_compact` or `session_compact_failed` (`:2193`, `:2243`, `:2282`).
- **Auto-compaction:** the `if (started)` guard covers every started failure (`:2477`, `:2532`, `:2557`, `:2571`). A stray `session_compact_failed` only clears the flag.
- **Cancel by another extension:** emit stops before our handler (`runner.js:819-823`).
- **No behaviour added:** our handlers return `undefined`.
- **During auto-compaction:** refusing is stricter than Pi requires, and harmless.

**Regression sweep:** config, send mode, locale, help and README are sound, and the invariants from Waves 1–4 hold.

**Findings:**
- **W5-F4 — P3 — `send-failure-host-contract` (residual) — in scope.**
  - During manual compaction there are two gaps: before our flag is set, while earlier extensions' `session_before_compact` handlers run (`:2170` vs `:2193`); and after it is cleared, before `_clearManualCompactionState()` (`:2243` vs `:2259`). A send in either gap is refused by Pi after the composer was cleared.
  - DEFERRED_REASON: Pi 1.1.0 exposes no way to read whether it is compacting (`types.d.ts:587-616`). The amended spec, D11 and the README already put refusals the extension cannot see in the "shown by Pi after the composer was cleared" category. Revisit if Pi adds one.
- **W3-F5 — P3 — recurrence update — deferred.** `speech-job.ts` is 656 lines and `config.ts` 545.

**Notes (not findings):**
- Tick tasks 5.2–5.6.
- Keep `.pi/settings.json` out of the commit.
- Local type checking uses pi-coding-agent 0.87.1 from `node_modules`, while Pi runs 1.1.0. This predates the round.

PROPOSED_REVIEW_ACTION=PASS

## Caller Assessment — Wave 5, Round 2

#### W5-F1, W5-F2, W5-F3 (accepted from Round 1)
- **Decision:** verified fixed. Oracle's evidence matches my re-run: 409/409 tests pass, the filtered type check is clean, `git diff --check` is clean, and `openspec validate --strict` passes.

#### W5-F4 — Gaps between the flag and Pi's own compaction state
- **Oracle Severity:** P3
- **Family:** `send-failure-host-contract` (residual of W5-F1)
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** None reaching the blocking threshold. The amended "Transcript delivery" requirement already covers refusals the extension cannot detect.
- **Decision:** `DEFER_OUT_OF_SCOPE`
- **CORRECTION:** None now. Pi 1.1.0 offers no way to read whether it is compacting. Revisit if one is added.

#### W3-F5 — Large modules
- **Decision:** `DEFER_OUT_OF_SCOPE` (unchanged).

### Terminal Baseline Validation

- The current candidate equals the latest `PATCH_BASELINE_REVISION`, `sha256:6ad07d4a277daccde08c189c00e6dc9f8e36abf96150b23f1cc4b70ec7474184`. The caller recomputed it after the Oracle run.
- The Wave 5 boundary is unchanged: tasks 5.2–5.6, plus the orchestrator's amendments for `?`, W5-F1 and W5-F2.

### Summary
- **Issues accepted blocking:** 0 this round (W5-F1 fixed from Round 1)
- **Issues accepted nonblocking:** 0 this round (W5-F2, W5-F3 fixed from Round 1)
- **Issues deferred out of scope:** 2 (W5-F4, W3-F5)
- **Issues rejected:** 0

### Caller Result

REVIEW_ACTION=PASS
CONSENSUS_STATUS=MOSTLY_GOOD

Wave 5 is complete. Tasks 5.2–5.6 and 5.8 are marked done. Task 5.7 stays unchecked, because the user has not run it; its live checks are carried into Wave 6 and will be ticked there.

## Wave 6 Review Sequence (spoken stop phrase)

Task 6.1 (orchestrator) covers these artifact amendments:

- **ADRs:** ADR-0006 is added, and the status lines of ADR-0004 and ADR-0005 now name the parts it supersedes.
- **`proposal.md`:** a Wave 6 amendment, and a narrower out-of-scope list.
- **`design.md`:** Non-Goals, D2, the D6 example and Risks are updated; D15 is added, along with the realtime and Node `WebSocket` facts.
- **`specs/voice-input/spec.md`:** a "Spoken stop phrase" requirement with 8 scenarios is added, and the lifecycle and privacy requirements are adjusted.
- **`tasks.md`:** Wave 6, tasks 6.1–6.7. Task 6.6 carries the 5.7 checks.

`openspec validate --strict` passes. Base commit: the amendment commit after `780db19`.

Base commit: `f15526d`.

## Round 1 - Implementation Assignments (Wave 6)

| Assignment | Tasks | Owner | Files and topics |
| --- | --- | --- | --- |
| W6-A | 6.2–6.5 | worker (`claude-bridge/claude-sonnet-5-5`, thinking high, background) | `extensions/speak/config.ts`, new `realtime.ts`, `talk.ts`, `index.ts`, `help.ts`, `README.md`; `test/speak/config.test.ts`, `command.test.ts`, new `realtime.test.ts`, `talk.test.ts`, `silence.test.ts`, `harness.ts` |
| W6-B | 6.6 | user | live checks for Waves 5 and 6 |

### W6-A result (worker run `267adbfa`)

The worker reported tasks 6.2–6.5 done.

**Files:**
- New: `extensions/speak/realtime.ts` (330 lines; the client and `matchStopPhrase`), `talk-state.ts` (56 lines; types moved out of `talk.ts`), `test/speak/realtime.test.ts`.
- Changed source files: `config.ts`, `help.ts`, `record.ts` (an `onChunk` hook and `SAMPLE_RATE`), `speech-job.ts` (an optional `webSocketFn` dependency), `talk.ts`, `README.md`.
- Changed tests: `harness.ts`, `config.test.ts`, `command.test.ts`, `silence.test.ts`, `talk.test.ts`.

**Line counts:** `talk.ts` 478, `config.ts` 567, `speech-job.ts` 659, `talk.test.ts` 1084.

**Deviations reported, for Oracle judgement:**
1. **`talk-state.ts`:** a new file, created to keep `talk.ts` under 500 lines.
2. **Final-commit timeout:** treated as a failure. The text already committed is appended and nothing is sent; D15 does not cover this case.
3. **Phrase removal:** it also removes the punctuation before the phrase, so "Is it done? let's go" sends "Is it done".
4. **README:** it now calls the stop phrase "the one spoken command".
5. **Recorder dying during a streamed recording:** reported, and the committed text is discarded. D15 covers only provider errors and closes.

**Risks reported:**
- `insufficient_audio_activity` or `commit_throttled` answering a key stop's final commit right after a pause commit would show an error.
- Vietnamese support in the live model is unverified.

**Caller verification:**
- 510 tests, 510 pass, 0 fail, in 2 runs.
- The filtered type check prints nothing, and `git diff --check` is clean.
- The key goes only in the WebSocket `headers` (`realtime.ts:287`), and the URL never contains a token.

CANDIDATE_REVISION=sha256:ca3a4c04f062f2af7cd741ee202ffed9fe0a5fd941d68d1d8b03a308f85f9a55 (SHA-256 over `git diff f15526d -- extensions test openspec`, then, for each of extensions/speak/realtime.ts, extensions/speak/talk-state.ts, test/speak/realtime.test.ts in that order, path + NUL + bytes)

## Round 1 - Oracle Review (Wave 6)

Run `45514a8a` (`claude-bridge/claude-opus-5-5`, thinking high, background). The caller condensed the returned text without changing any finding.

**Gate and baseline:** gate task 6.7, INITIAL mode, Oracle round 1 of 4. The baseline `ca3a4c04…5a55` matches.

**Owners reviewed:**
- Task 6.1: orchestrator, `f15526d`.
- W6-A: worker run `267adbfa`.
- W6-B: user, task 6.6, unverified this round.

**Checks:**
- 510/510 in 3 runs; the filtered type check is clean; `openspec validate --strict` passes; `git diff --check` is clean.
- 10 mutations in `/tmp`: 7 caught, 3 survived (W6-F3).

**Provider page:** one read-only fetch, no API calls.
- The query names, the `InputAudioChunk` shape, the empty-chunk final commit and every mapped error type match the page (`realtime.ts:78-119`).
- The page does not say how the server answers a manual commit after a VAD commit (W6-F1).

**Node:** Pi 1.1.0 runs on the system Node v22.19.0 (`engines >=22.19.0`), where `WebSocket` with `{ headers }` is available.

**Confirmed sound:**
- **Config:** `config.ts:359-368,394-395,426,560`; `help.ts:18-22,47-48`.
- **Client:** `realtime.ts:96-111,154-174,214-234,259-288`. The key goes only in the header, and there is no retry.
- **Matcher:** `:303-330`; removing the punctuation before the phrase is D15-literal.
- **Controller:** `talk.ts:169-223,246-251,270-342,384-426`.
- **Feature off:** the path is unchanged.
- **Waves 1–5:** no regressions.

**Worker deviations:**
- Accepted: 1 (the `talk-state.ts` split), 3 (punctuation removal) and 4 (README wording).
- Deviation 2 (a final-commit timeout as a failure) is accepted; see W6-F1.
- Deviation 5 (recorder death discards the committed text) is not accepted; see W6-F2.

**Findings:**
- **W6-F1 — P2 — `final-commit-settlement` — in scope.**
  - The final commit settles on the next message (`realtime.ts:154-174`), and every error fails it, including `insufficient_audio_activity` (`:90`) and `commit_throttled` (`:84`), which lead to `failStream` (`talk.ts:299`).
  - After a pause, VAD has usually committed everything already, so the send key can show an error and send nothing, or wait up to 45 s.
  - Residual risk: an in-flight VAD commit can settle `finish()` early (`:235-237`).
  - SUGGESTED_CORRECTION: an orchestrator sentence in D15; in `onMessage`, settle those two types as `{ ok: true, text }` while a commit is pending; add tests; add a 6.6 check that pauses and then presses `alt+t`.
- **W6-F2 — P3 — `stream-failure-text-preservation` — in scope.**
  - When the recorder fails during streaming, the committed text is discarded (`talk.ts:264-269`), unlike a provider failure (`:334-342`). This contradicts ADR-0006's "so speech is not lost".
  - SUGGESTED_CORRECTION: append the committed text unsent, plus one test.
- **W6-F3 — P3 — `test-coverage/mutation-survivors` — in scope.**
  - These mutations survived: the `rec.phase !== "recording"` guard (`talk.ts:309`), the open timer not cleared (`realtime.ts:261`), and the finish timer not cleared (`:169`).
  - SUGGESTED_CORRECTION:
    - add tests for a phrase segment that arrives after a transcribe-only key stop (appended, not sent, phrase kept) and after the cap (held);
    - assert that no timer is left after a successful open and after a settled finish.
- **W6-F4 — P3 — `docs-accuracy` — in scope.**
  - `README.md:162` says the status line shows the stop phrase, and it does not.
  - SUGGESTED_CORRECTION: remove "The status line,".
- **W3-F5 — P3 — recurrence update.**
  - `talk.test.ts` grew from 638 to 1085 lines, with the streaming cases at `:671-1056`. `config.ts` is 567, `speech-job.ts` 659, `talk.ts` 478.
  - SUGGESTED_CORRECTION: move the streaming cases to `test/speak/talk-stream.test.ts`. Keep the source modules deferred.

**Notes:**
- Tick tasks 6.2–6.5.
- Keep `.pi/settings.json` out of the commit.
- Task 6.6 should cover Vietnamese, and pausing before a key stop.
- No status line is shown while the connection opens.

PROPOSED_REVIEW_ACTION=PATCH

## Caller Assessment — Wave 6, Round 1

#### W6-F1 — The final commit after a pause can fail or stall
- **Oracle Severity:** P2
- **Family:** `final-commit-settlement`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** `specs/voice-input/spec.md` "Spoken stop phrase": a key stop "SHALL request a final commit, wait up to the request deadline for it, and deliver the text in that control's mode". Failing on a "nothing left to commit" answer breaks the delivery.
- **Decision:** `ACCEPT_BLOCKING`
- **CORRECTION:**
  - **Orchestrator, done:** D15 and the spec now say that an `insufficient_audio_activity` or `commit_throttled` answer to a pending final commit means the text so far is final. The spec gains a "Pause, then send key" scenario, and task 6.6 gains the pause-then-`alt+t` live check.
  - **Worker:** in `Session.onMessage`, while a commit is pending, settle those two types as success with the current text. Add realtime and talk send-mode tests.
  - **Not addressed by this fix:** the in-flight VAD race and the unanswered-commit wait stay residual risks for the live check.

#### W6-F2 — A recorder failure discards the committed text
- **Oracle Severity:** P3
- **Family:** `stream-failure-text-preservation`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** ADR-0006, "so speech is not lost".
- **Decision:** `ACCEPT_NONBLOCKING`, fixed in this batch.
- **CORRECTION:** append the committed text unsent with the failure message, as for a provider failure, and add one test. The orchestrator has already added recorder failure and an unanswered final commit to the D15 and spec failure lists.

#### W6-F3 — Mutation survivors
- **Oracle Severity:** P3
- **Family:** `test-coverage/mutation-survivors`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** None reaching the blocking threshold. The behaviour is correct, but the guard is spec-governed and unprotected.
- **Decision:** `ACCEPT_NONBLOCKING`, fixed in this batch.
- **CORRECTION:** as suggested: the two late-phrase tests (after a transcribe-only key stop, and after the cap) and the timer-cleanup assertions.

#### W6-F4 — README says the status line shows the stop phrase
- **Decision:** `ACCEPT_NONBLOCKING`, fixed in this batch by removing "The status line,".

#### W3-F5 — Large files
- **Decision:**
  - The test file split is `ACCEPT_NONBLOCKING`, done in this batch: the streaming cases move to `test/speak/talk-stream.test.ts`.
  - The source modules stay `DEFER_OUT_OF_SCOPE`.

### Summary
- **Issues accepted blocking:** 1 (W6-F1)
- **Issues accepted nonblocking:** 4 (W6-F2, W6-F3, W6-F4, the W3-F5 test split)
- **Issues deferred out of scope:** 1 (W3-F5 source modules)
- **Issues rejected:** 0

### Caller Result

REVIEW_ACTION=PATCH
CONSENSUS_STATUS=NEEDS_REVISION

## Round 2 - Implementation Assignments (Wave 6)

| Assignment | Findings | Owner | Files and topics |
| --- | --- | --- | --- |
| W6-A (round 2) | W6-F1, W6-F2, W6-F3, W6-F4, W3-F5 test split | worker (`claude-bridge/claude-sonnet-5-5`, thinking high, background) | `extensions/speak/realtime.ts`, `talk.ts`, `README.md`; `test/speak/realtime.test.ts`, `talk.test.ts`, new `talk-stream.test.ts` |

### Supervisor decision during W6-A round 2 (run `b7105751`)

While writing the W6-F3(b) test, the worker found a real defect. At the time cap, `record.ts` stops the recorder from inside the chunk handler, but the controller sets phase `"held"` only when the recorder exits. A committed stop-phrase segment that arrives in that window, tens of milliseconds after SIGINT, passes the `rec.phase !== "recording"` guard and **sends** the message. That breaks the spec ("At the time cap the text SHALL be held"). The worker reproduced it in a throwaway test.

**Decision:** the caller approved the minimal fix: an optional `onCapped` callback in `startRecorder` that marks the recording held at once. It came with these conditions:

- It fires at most once.
- A control pressed between the cap and the recorder exit waits for the exit or the final commit, then delivers once, in that control's mode.
- Escape, session replacement and shutdown in that window still discard.
- It applies to both paths, and the observable results of the off path are unchanged.
- A test (b) is added, plus a test for the cap-to-exit window, and the guard mutation is proved killed.

**Governing source:** the "Spoken stop phrase" requirement and the lifecycle rule that reaching the cap never sends a message. This is in scope for W6-F3, under the W6 `stream-failure`/cap family.

### W6-A round 2 result (worker run `b7105751`)

The worker reported every item done.

- **W6-F1:** while a final commit is pending, `insufficient_audio_activity` and `commit_throttled` settle it with the text committed so far. Tests: 2 realtime tests, and 1 controller test for "Pause, then send key".
- **W6-F2:** a recorder failure while streaming goes through `failStream`, so the committed text is appended unsent.
- **W6-F3:** new tests (a) and (b), plus a timer-count test. They kill the three survivors.
- **W6-F4:** the README sentence is fixed.
- **W3-F5 split:** the streaming cases moved to `test/speak/talk-stream.test.ts`, with shared helpers in the new `test/speak/talk-harness.ts`. Counts: `talk.test.ts` went from 86 to 53 tests, `talk-stream.test.ts` has 39, `realtime.test.ts` went from 52 to 55, and the suite from 510 to 519. None were lost: 52 + 34 moved, 9 are new.

**Approved deviation:** `record.ts` gains an optional `onCapped` callback, which fires once. `talk.ts` marks the recording held at the cap, and a press between the cap and the recorder exit now waits for the exit, then delivers once. Without the fix, the one-shot path would also have uploaded undefined audio in that window. Escape and lifecycle events still discard. New window tests: 2 in `talk-stream.test.ts` and 1 in `talk.test.ts`.

**Mutation proofs (7):**

| Mutation | Effect |
| --- | --- |
| Phase guard removed | 2 failures |
| Open timer not cleared | 1 failure |
| Finish timer not cleared | 1 failure |
| `NOTHING_TO_COMMIT` removed | 3 failures |
| Recorder-failure branch removed | 1 failure |
| `onCapped` held removed | 3 failures |
| `&& active.pcm` removed | 1 failure |

**Line counts:** `talk.ts` 482, `realtime.ts` 336, `talk.test.ts` 613, `talk-stream.test.ts` 573, `talk-harness.ts` 74.

**Caller verification:**
- 519 tests, 519 pass, 0 fail, in 2 runs.
- The filtered type check prints nothing, `git diff --check` is clean, and `openspec validate --strict` passes.

PATCH_BASELINE_REVISION=sha256:6325fbf5f1cc388336e7491d31eca78ee54e6967ad7edddb37189cd059cf31f8 (SHA-256 over `git diff f15526d -- extensions test openspec`, then, for each of extensions/speak/realtime.ts, extensions/speak/talk-state.ts, test/speak/realtime.test.ts, test/speak/talk-harness.ts, test/speak/talk-stream.test.ts in that order, path + NUL + bytes)

## Round 2 - Oracle Review (Wave 6)

Run `9d145a91` (`claude-bridge/claude-opus-5-5`, thinking high, background). The caller condensed the returned text without changing any finding.

**Gate and baseline:** gate task 6.7, PATCH mode, Oracle round 2 of 4. The candidate `sha256:6325fbf5f1cc388336e7491d31eca78ee54e6967ad7edddb37189cd059cf31f8` equals the latest `PATCH_BASELINE_REVISION`.

**Owners reviewed:**
- Task 6.1 and its round-1 amendments: orchestrator.
- W6-A and its round-2 fixes: worker run `b7105751`, including the approved `onCapped` change.
- W6-B: user, task 6.6, unverified.

**Checks:**
- 519/519 in 3 runs; the filtered type check is clean; `openspec validate --strict` passes; `git diff --check` is clean.
- 17 mutations in `/tmp`: 11 caught. Of the 6 survivors, 4 cannot change behaviour, 1 gap predates this wave and 1 is new (W6-F5).
- 9 temporary tests of the window between the cap and the recorder exit, all passing.

**Fixes verified:**
- **W6-F1:** `realtime.ts:113,229`, scoped to a pending commit (`:230-232`); `talk-stream.test.ts:464`. The residual in-flight VAD race (`:242`) is accepted.
- **W6-F2:** `talk.ts:271,327-335`; `talk-stream.test.ts:482`.
- **W6-F3:** `talk-stream.test.ts:510,530`; `realtime.test.ts:212`.
- **W6-F4:** fixed; see the omission below.
- **W3-F5 split:** counts 53 / 39 / 55 = 519. No test name was lost, and no assert line was removed.

**`onCapped` change:** every condition the supervisor set was verified.
- It fires at most once (`record.ts:194-198,186`; `talk.ts:207-210`).
- Holding at the cap cannot send (`talk.ts:309,302`).
- A press between the cap and the exit delivers once, in its mode, on both paths (`:92-97,280-282,300-302`).
- Escape, `session_before_switch` and `session_shutdown` in that window discard.
- The off path's results are unchanged; the old flow gave the same outcome. The `phase = "held"` assignments at `:278,284` are now dead code, but harmless.
- No new race.

**Regression sweep:** Wave 6 and the invariants of Waves 1–5 hold.

**Findings:**
- **W6-F5 — P3 — `cap-held-status` — in scope.**
  - `onCapped` sets held without redrawing the status line (`talk.ts:207-210`), so it reads "● Recording …" until the recorder exits, which can take up to the 2 s kill grace (`record.ts:36`). Spec `voice-input/spec.md:109` says the held line names the reached limit.
  - SUGGESTED_CORRECTION: call `this.render(recording)` after setting held, and add status assertions to `talk.test.ts:172` and `talk-stream.test.ts:553`.
- **W6-F4 — P3 — `docs-accuracy` — recurs as an omission.**
  - The README failure list (`README.md:166`) does not name a recorder failure, which D15 and the spec now include.
  - SUGGESTED_CORRECTION: add "a recorder that fails while recording".
- **W3-F5 — P3 — status update.** `config.ts` is 567 lines and `speech-job.ts` 659, deferred.

**Residual risks:**
- the in-flight VAD commit race, and `commit_throttled` with audio still uncommitted (observe both in the 6.6 pause-then-`alt+t` check);
- no test of recorder-failure redaction, which is extra protection only;
- Vietnamese in the live model is unverified.

PROPOSED_REVIEW_ACTION=PASS

## Caller Assessment — Wave 6, Round 2

#### W6-F1, W6-F2, W6-F3, W6-F4 (round 1), W3-F5 test split, `onCapped`
- **Decision:** verified fixed. Oracle's evidence matches my re-run: 519/519 in 2 runs, the filtered type check is clean, `git diff --check` is clean, and `openspec validate --strict` passes.

#### W6-F5 — Status line during the cap-to-exit window
- **Oracle Severity:** P3
- **Family:** `cap-held-status`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** None reaching the blocking threshold. The window is at most the 2 s kill grace, and nothing can be sent in it.
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** Carried into the post-live-check patch, together with W6-F4 and any fixes the task 6.6 live checks require: call `this.render(recording)` in `onCapped`, plus the two status assertions. Applying it now would invalidate this PASS for a one-line display fix. The change cannot be archived before 6.6 anyway.

#### W6-F4 (omission) — README failure list
- **Decision:** `ACCEPT_NONBLOCKING`, carried into the same post-live-check patch.

#### W3-F5 — Source module size
- **Decision:** `DEFER_OUT_OF_SCOPE` (unchanged).

### Terminal Baseline Validation

- The current candidate equals the latest `PATCH_BASELINE_REVISION`, `sha256:6325fbf5f1cc388336e7491d31eca78ee54e6967ad7edddb37189cd059cf31f8`. The caller recomputed it after the Oracle run.
- The Wave 6 boundary is unchanged: tasks 6.2–6.5, the round-1 artifact amendments, and the approved `record.ts` change.

### Summary
- **Issues accepted blocking:** 0 this round (W6-F1 fixed from round 1)
- **Issues accepted nonblocking:** 2 (W6-F5, the W6-F4 omission), both carried to the post-live-check patch
- **Issues deferred out of scope:** 1 (W3-F5 source modules)
- **Issues rejected:** 0

### Caller Result

REVIEW_ACTION=PASS
CONSENSUS_STATUS=MOSTLY_GOOD

Wave 6 code is complete. Tasks 6.2–6.5 and 6.7 are marked done. Task 6.6, and task 5.7 carried into it, stay unchecked until the user runs them. The post-live-check patch for W6-F5, the W6-F4 omission and any live-check fixes gets its own short Oracle check before archive.

## Wave 7 Review Sequence (extra shortcut keys; Wave 6 carry-overs)

The user asked for `alt+y` (send) and `alt+shift+y` (transcribe only) in addition to the T keys, and chose option (a): shortcut lists in the config, set in their own config. The defaults are unchanged.

Host fact, checked in Pi 1.1.0:
- `alt+y` is the editor action `tui.editor.yankPop` (`pi-tui/dist/keybindings.d.ts:147-148`).
- It is not in `RESERVED_KEYBINDINGS_FOR_EXTENSION_CONFLICTS` (`core/extensions/runner.js:9-28`), so an extension shortcut wins, with a startup conflict notice (`runner.js:468`).
- `alt+shift+y` has no built-in binding.

Task 7.1 (orchestrator): D10, the talk contract (with an "Extra keys per mode" scenario), the indicator requirement (the W6-F5 wording) and the help requirement are amended, and Wave 7 is added to `tasks.md`. `openspec validate --strict` passes.

| Assignment | Tasks | Owner | Files and topics |
| --- | --- | --- | --- |
| W7-A | 7.2, 7.3 | worker (`claude-bridge/claude-sonnet-5-5`, thinking high, background) | `extensions/speak/config.ts`, `index.ts`, `help.ts`, `talk.ts`, `README.md`; `test/speak/config.test.ts`, `silence.test.ts`, `talk.test.ts`, `talk-stream.test.ts`, `command.test.ts` |
| W7-B | 7.4 | orchestrator | user config, with approval and a backup |
| W7-C | 7.5 | user | live checks for Waves 5–7 |

### W7-A result (worker run `8da8d64b`)

The worker reported tasks 7.2 and 7.3 done.

- **Config:** both shortcut settings accept a string or a list of 1–4 keys, stored as arrays (`Shortcuts` is `{send: string[]; transcribe: string[]}`). A key repeated within a list or across both, ignoring case, is an error that names the key.
- **Registration:** `index.ts` registers every key, and only the defaults on a config error.
- **Help and status lines:** they name every key, joined by `formatKeys`.
- **W6-F5:** `onCapped` now redraws the status line, so the held line shows before the recorder exits. One mutation proves it: removing the call fails 3 new assertions.
- **W6-F4:** the README failure list now names a recorder failure.
- **README:** a new "Extra shortcut keys" section warns about yank-pop and the conflict notice. All 3 JSON blocks parse.

**Deviation:** one existing stream test now waits for the final commit chunk instead of the "limit reached" status, which now appears earlier because of W6-F5. A separate assertion for the status was kept.

**Size:** `talk.ts` is 484 lines and `config.ts` 579 (W3-F5, deferred).

**Caller verification:** 538 tests, 538 pass, 0 fail (519 before). The filtered type check prints nothing, and `git diff --check` is clean.

### Task 7.4 (orchestrator)

Under the user's approval (option a), `~/.config/pi-speak/config.json` now sets `input.shortcut` to `["alt+t","alt+y"]` and `input.transcribeShortcut` to `["alt+shift+t","alt+shift+y"]`. The backup is `config.json.bak-20261009-090304`. `parseConfig` accepts the file.

CANDIDATE_REVISION=sha256:56f07a934fb011ddae33127989f0732c64cbf8bd94119c7a6a41ddc9e2e14c3f (SHA-256 over `git diff 9ee7cc3 -- extensions test openspec`; Wave 7 adds no new files)

Task 7.5, the user live checks, has not been run yet. The gate runs now with 7.5 reported as unverified. Any live-check failure reopens this wave as a patch.

## Round 1 - Oracle Review (Wave 7)

Run `56651773` (`claude-bridge/claude-opus-5-5`, thinking high, background). The caller condensed the returned text without changing any finding.

**Gate and baseline:** gate task 7.6, INITIAL mode, plus a whole-change readiness check. The candidate `sha256:56f07a934fb011ddae33127989f0732c64cbf8bd94119c7a6a41ddc9e2e14c3f` matches, before and after the review.

**Owners reviewed:**
- Task 7.1: orchestrator, `9ee7cc3`.
- W7-A: worker run `8da8d64b`.
- W7-B: orchestrator, the user config. It was not read.
- W7-C: user, task 7.5, unverified.

**Checks:**
- 538/538 in 3 runs; the filtered type check is clean; `openspec validate --strict` passes; `git diff --check` is clean.
- 12 mutations in `/tmp`: 9 caught. Of the 3 survivors, 1 is equivalent (the `onCapped` phase guard) and 2 are real gaps (W7-F1).

**Pi 1.1.0:**
- `tui.editor.yankPop` is bound to `alt+y` (`pi-tui/dist/keybindings.js:72`) and is not reserved (`runner.js:9-28`).
- On a conflict, the extension wins with a diagnostic (`runner.js:468`), shown at startup (`interactive-mode.js:1456-1457`).
- `alt+t`, `alt+shift+t` and `alt+shift+y` have no built-in binding. The README is accurate.

**Confirmed sound:**
- **Config:** `config.ts:376-383,390-391,411-421`.
- **Registration:** `index.ts:13,145-154,191-197`.
- **Help:** `help.ts:42-44`.
- **Scenario test:** `talk.test.ts:199-215`.
- **W6-F5:** `talk.ts:208-212`, with assertions before the exit.
- **W6-F4:** `README.md:175`.
- **README extra keys:** `README.md:120-127`.
- **Worker deviation** (the stream test now waits for the final commit chunk): accepted.

**Whole-change readiness:**
- All voice-input requirements, 10 of them including "Spoken stop phrase", and the manual-speech delta (3 added and 9 modified) have implementation and test evidence.
- The carry-overs are closed, and W3-F5 and W5-F4 are deferred.
- The ADR statuses are consistent. ADR-0006 stays "runtime qualification pending" until 7.5.

**Findings:**
- **W7-F1 — P3 — `test-coverage/mutation-survivors` — in scope.**
  - The recording and held status lines name every key (`talk.ts:465,467`), but no test checks them with two-key lists. Reducing either line to the first key passes.
  - SUGGESTED_CORRECTION: assert the two-key recording line in `talk.test.ts:199`, and the two-key held line in one more case. Show that both mutations then fail.
- **W7-F2 — P3 — `docs-accuracy` — in scope.**
  - Three places still describe the old single-key setup: `design.md:144` ("the two shortcuts"), `README.md:143` ("both stop keys (which one sends)") and `config.ts:492` ("the two shortcuts").
  - SUGGESTED_CORRECTION: reword each to cover every key.
- **W3-F5 — P3 — deferred.** `config.ts` 579 lines, `speech-job.ts` 659, `talk.ts` 484.
- **W5-F4 — P3 — deferred.** Pi still offers no way to read whether it is compacting.

**Residual risks:**
- Task 7.5 is unverified: whether the terminal delivers `alt+shift+y`, whether the startup notice names only `alt+y`, the VAD race and `commit_throttled` after a pause, and Vietnamese in the live model.
- Uniqueness ignores case but not modifier order, as Pi itself does.
- ADR-0006 must lose its "pending" status before archive.

PROPOSED_REVIEW_ACTION=PASS

## Caller Assessment — Wave 7, Round 1

#### W7-F1 — Multi-key status lines are not tested
- **Oracle Severity:** P3
- **Family:** `test-coverage/mutation-survivors`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** None reaching the blocking threshold. The behaviour is correct, and only the assertion is missing.
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** Carried into the post-live-check patch: the two status assertions and the mutation proof.

#### W7-F2 — Text that still describes a single key per mode
- **Oracle Severity:** P3
- **Family:** `docs-accuracy`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** None reaching the blocking threshold.
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** Carried into the post-live-check patch: `design.md` D14 (orchestrator), `README.md:143` and the `config.ts:492` comment.

#### W3-F5, W5-F4
- **Decision:** `DEFER_OUT_OF_SCOPE` (unchanged). Both are recorded for an archive note, so they outlive this log.

### Terminal Baseline Validation

- The current candidate equals the recorded `CANDIDATE_REVISION`, `sha256:56f07a934fb011ddae33127989f0732c64cbf8bd94119c7a6a41ddc9e2e14c3f`. The caller recomputed it after the Oracle run.
- The Wave 7 boundary is unchanged: tasks 7.2 and 7.3, plus 7.4 outside the repository.

### Summary
- **Issues accepted blocking:** 0
- **Issues accepted nonblocking:** 2 (W7-F1, W7-F2), carried to the post-live-check patch
- **Issues deferred out of scope:** 2 (W3-F5, W5-F4)
- **Issues rejected:** 0

### Caller Result

REVIEW_ACTION=PASS
CONSENSUS_STATUS=MOSTLY_GOOD

Wave 7 code is complete. Tasks 7.2–7.4 and 7.6 are marked done.

**Before archive, these remain:**
1. The user runs the live checks 7.5, which carry 6.6 and 5.7.
2. A post-live-check patch for W7-F1, W7-F2 and any live-check findings, followed by a short Oracle check.
3. ADR-0006's status is changed to accepted once the checks pass.

## Post-Live-Check Patch (Wave 7, orchestrator)

**User report, 2026-10-09:**
- After a `/speak provider deepgram` session override, the user restarted Pi with `DEEPGRAM_API_KEY` loaded and reported "test: work. approve."
- That confirms Deepgram speech (`/speak text`). The other 7.5 items were not reported one by one and stay unverified until the user confirms them.

**W7-F1:** done in `test/speak/talk.test.ts`, inside the "Extra keys per mode" test.
- The recording line is now asserted with two keys per mode.
- A capped two-key harness asserts the held line.
- Mutations in a `/tmp` copy, deleted afterwards: reducing the recording line to the first key fails 1 test, and reducing the held line fails 1 test.

**W7-F2:** done.
- D14 now names every shortcut and which ones send (`design.md:144`).
- `README.md:143` now reads "the stop keys of each mode (which ones send)".
- The `config.ts` load comment now says "for the shortcuts".

**Verification:** 538/538 in 2 runs; the filtered type check prints nothing; `git diff --check` is clean; `openspec validate --strict` passes.

PATCH_BASELINE_REVISION=sha256:d56c15de6d6d7ca35f1b28b4aa30f72bf20132bb8e9fb11f3cf19debb54187cb (SHA-256 over `git diff 0a0e6b2 -- extensions test openspec`; no new files)

## Round 2 - Oracle Review (Wave 7)

Run `6a9c1eb8` (`claude-bridge/claude-opus-5-5`, thinking high, background). The caller condensed the returned text without changing any finding.

**Gate and baseline:** gate task 7.6, PATCH mode. The candidate `sha256:d56c15de6d6d7ca35f1b28b4aa30f72bf20132bb8e9fb11f3cf19debb54187cb` equals the recorded `PATCH_BASELINE_REVISION`, before and after the review.

**W7-F1:** fixed. The assertions are at `talk.test.ts:210,216-222`, in the test "a recording started with a transcribe key and stopped with the second send key is sent, and every key is registered" (`:199`). Each of the four first-key reductions in `render()` (`talk.ts:465,467`, send and transcribe keys) fails one test, and the unchanged copy fails none.

**W7-F2:** the three rewordings are in place (`design.md:144`, `README.md:143`, `config.ts:492`). No single-key wording is left in the README, `help.ts` or D14.

**Regression sweep:** 538/538 in 2 runs; the filtered type check is clean; `git diff --check` is clean; `openspec validate --strict` passes. Only assertions and wording changed.

**Findings:**
- **W7-F2 (recurrence) — P3 — `docs-accuracy` — in scope.**
  - `specs/voice-input/spec.md:51` says "`/talk` and the shortcut SHALL report…", and `talk.ts:42` says "presses the shortcut". The behaviour is correct (`index.ts:145-154`). The wording predates Wave 7.
  - SUGGESTED_CORRECTION: say "every push-to-talk shortcut" and "a push-to-talk shortcut".
- **W3-F5, W5-F4 — P3 — deferred, unchanged.**

**Not findings:** the completed records of task 5.3, ADR-0004:18 and ADR-0005:30 are history and are left unchanged.

**Residual risks:**
- Task 7.5 is only partly verified (Deepgram speech is confirmed).
- ADR-0006 must lose its "pending" status before archive.
- Uniqueness ignores case but not modifier order.

PROPOSED_REVIEW_ACTION=PASS

## Caller Assessment — Wave 7, Round 2

#### W7-F1, W7-F2 (round 1)
- **Decision:** verified fixed.

#### W7-F2 (recurrence) — `spec.md:51`, `talk.ts:42`
- **Oracle Severity:** P3
- **Family:** `docs-accuracy`
- **In-scope:** `YES`
- **GOVERNING_SOURCE:** None reaching the blocking threshold.
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** applied after this PASS, as wording only, in the same commit (`ae87557`) as the reviewed candidate. The two edits ran in parallel with the commit, and the caller chose to describe that commit accurately rather than rewrite it. The spec sentence will merge into the main spec at archive, so it should not carry the singular. It was verified by `openspec validate --strict` and the suite, not by another Oracle round, because it changes 2 lines of prose and no behaviour.

#### W3-F5, W5-F4
- **Decision:** `DEFER_OUT_OF_SCOPE` (unchanged); both are recorded for the archive note.

### Terminal Baseline Validation

The current candidate equals `PATCH_BASELINE_REVISION=sha256:d56c15de6d6d7ca35f1b28b4aa30f72bf20132bb8e9fb11f3cf19debb54187cb`, recomputed by the caller after the Oracle run. `git diff 0a0e6b2 ae87557` minus the two corrected files (`specs/voice-input/spec.md`, `extensions/speak/talk.ts`) hashes to the same `d56c15de…`, so the commit is the reviewed candidate plus exactly the 2-line correction. After the correction: `openspec validate --strict` passes, 538/538 tests pass, and the filtered type check is clean.

### Caller Result

REVIEW_ACTION=PASS
CONSENSUS_STATUS=MOSTLY_GOOD

The Wave 7 code review is closed. Before archive, two things remain:
1. The user's answer on which 7.5 checks ran (Deepgram speech is confirmed).
2. The ADR-0006 status change, once the checks are confirmed.

## Wave 8 Review Sequence

The `/opsx-apply-loop add-speak-voice-input` run is in focus mode, as the user requested. The proposal review passed in `docs/plans/reviews/add-speak-voice-input-wave8-review.md` (REVIEW_ACTION=PASS, `fc2fae0`).

The wave adds the command and skill keys (ADR-0007, D16) and hold Space to talk (ADR-0008, D17). Task 8.1 (orchestrator) is complete through the amendment commits `8f537c2` … `fc2fae0`.

## Round 1 - Implementation Assignments

- **Wave and reserved gate:** Wave 8. Gate task 8.8 [Oracle gate: `oracle`] is reserved and excluded from implementation dispatch.
- **Ordered assignments:**
  - **W8-A:** tasks 8.2, 8.3, 8.4 and 8.5. Owner `worker` (`claude-bridge/claude-sonnet-5-5:high`, background). This is one focus group: settings and keys, then the matcher and delivery, then the README, then the hold-Space detector.
    - **Files:** `extensions/speak/` (`config.ts` plus a new input-settings module, `index.ts`, `help.ts`, `talk.ts`, `talk-state.ts`, the new `voice-command.ts`, a new hold-Space module, `README.md`) and `test/speak/` (`config`, `silence`, `command`, `talk`, `talk-stream`, and the new `voice-command` and `hold-space` tests, with the harnesses).
  - **W8-B:** task 8.6. Owner: orchestrator, after W8-A and with the user's approval.
  - **W8-C:** task 8.7. Owner: the user.
- **Base commit:** `fc2fae0`. `.pi/settings.json` holds foreign changes and is excluded.

### W8-A (worker)

**Status:** tasks 8.2, 8.3, 8.4 and 8.5 are implemented in that order. `tasks.md` is not ticked, nothing is committed, and nothing is staged.

**Checks (final tree):**
- `node --experimental-strip-types --test test/speak/*.test.ts`, three runs: 666 pass, 0 fail; 666 pass, 0 fail; 666 pass, 0 fail (538 before the wave).
- `npx tsc --noEmit 2>&1 | grep -E 'extensions/speak|test/speak'` prints nothing; `git diff --check` is clean.
- README: all five `json` blocks parse with `parseConfig` (the full example with its placeholder voice IDs replaced, the extra-keys fragment, the aliases fragment, and the two `holdSpace`/stop-phrase blocks wrapped in `input`). The one-off script was not committed.
- Source line counts: `config.ts` 462 (was 579), `talk.ts` 469 (was 484), `index.ts` 242, `hold-space.ts` 201, `input-settings.ts` 161, `talk-delivery.ts` 148, `voice-command.ts` 73, `config-validation.ts` 44, `talk-status.ts` 21, `help.ts` 63, `talk-state.ts` 78; tests `hold-space.test.ts` 478, `hold-clock.ts` 46, `voice-command.test.ts` 57. `talk.test.ts` is 762 lines (641 before; already over 500).

**Mutations** (throwaway copy under `/tmp`, deleted afterwards; each run on the test files named):
1. Hold ending with no check that the hold's recording is still the active one: `hold-space.test.ts` fails 3 of 35 (Escape during a hold, refused start, nothing touches the context after shutdown).
2. A release of any key treated as the Space release: fails 1 (release of an arrow key or Escape, cell-size reply).
3. Other input sending instead of discarding: fails 8 (each other-input case, stop phrase on, held at the cap).
4. A second hold recognized inside the spent hold, and its Spaces typed: fails 18.
5. Matcher with a name beating an alias: `voice-command.test.ts` fails 2 (an alias beating a name, an alias settling an ambiguity).

**Scenario → test.** "Voice command and skill keys" (`talk.test.ts` unless noted; every row also asserts nothing is sent or run):
- Spoken command goes into the editor → `voice command: a spoken command goes to the start of the editor, before the draft`
- Spoken skill → `voice command: a spoken skill becomes /skill:<name>`
- Alias to an interactive command → `voice command: an alias reaches a command that Pi does not list, in an empty editor`
- Interactive alias with a draft → `voice command: an interactive alias with a draft is appended, with a warning`
- No match → `voice command: words that match no command are appended, with a warning` (and the skill variant)
- Ambiguous names → `voice command: two different names with one spelling are appended, with a warning naming both`, plus the matcher case in `voice-command.test.ts`
- Mode decided at the stop → `the key that stops the recording decides the mode: a send-key start stopped with the skill key matches skills and sends nothing`
- Command key with the stop phrase on → `talk-stream.test.ts`: `a recording started with the command or skill key never streams, even with the stop phrase on and Deepgram, which cannot stream` (and the ElevenLabs variant)

"Hold Space to talk" (`hold-space.test.ts`):
- Tap types a space → `a tap types a space and starts nothing`
- Hold records and release sends → `holding Space records from the fourth Space, removes the typed Spaces once the recorder runs, and letting go sends`
- Release while starting → `letting go while the recording is still starting cancels it and the typed Spaces stay`
- Escape while Space is held → `Escape during a hold discards the recording, later Spaces are consumed, and nothing starts or is sent`
- Recording already ended → `a hold whose recording the stop phrase already sent does nothing more…` and `…a key already stopped and transcribed…`
- Refused start → `a refused start is reported once, the Spaces stay, later Spaces are consumed, and no further attempt is made`
- Busy hold → `a hold during recording begun with a key is busy…` and `…during a recording attempt that is still starting…`
- Stalled event loop → `a stall where the release timer and queued Spaces are due together keeps the hold going`
- Release of another key → `the release of an arrow key or of Escape, and the terminal's cell-size reply, are ignored during a hold`
- Send key during a hold → `the send key as an escape sequence during a hold sends once, and letting go adds nothing`
- Other key during a hold → `a letter during a hold reaches the editor and discards the recording…` (editor "Draftx"), plus the stop-phrase-on, starting, and held-at-the-cap variants
- Text in another script → `a Vietnamese letter during a hold…` and `bracketed paste during a hold…`
- Terminal reply during a hold → the ignored-input test above
- Undecodable key → `a key that cannot be decoded during a hold…`
- Session replaced → `a session change during a hold discards the recording and clears the timers; repeats stay consumed, and the first input after the quiet gap types`
- Cursor in the middle → `with the cursor inside the text the typed Spaces stay and are sent with the draft`
- Off by default → `with the setting off, no listener exists and every Space reaches the editor`, and the `silence.test.ts` cases

**Deviations and decisions:**
1. The spent-hold state lives on the `HoldSpace` instance that the extension factory creates once per load, not in a module-level variable. It survives session resets as required; a module-level singleton would leak between tests.
2. `talk.ts` now ignores a reported Escape *release* in its two Escape listeners (`isEscapePress`). Without it, the release of Escape during a hold would discard the recording, which contradicts "Release of another key".
3. Extra files, to keep every file under 500 lines and avoid an import cycle: `config-validation.ts` (shared checks), `talk-delivery.ts` (append, send and voice-command delivery moved out of `talk.ts`), `talk-status.ts` (status lines), and the test helper `hold-clock.ts`.
4. `Shortcuts` gained `command`, `skill` and `holdSpace` (help reads `holdSpace` from the load-time value); the harness `shortcuts` option is now `Partial<Shortcuts>`. The duplicate-key error now names all four settings, and the three tests that matched the old text were updated.
5. A repeat is a Space at most 120 ms after the previous one (inclusive). `reset()` keeps the listener (`session_tree` does not replace the session); only `session_shutdown` drops the context (`detach()`).
6. Details the artifacts leave open: with an unreadable configuration at the stop, a command or skill recording is appended with a warning; a blank draft is dropped from a listed command; `/talk command` and `/talk skill` take no arguments; status lines read `… stop, command · … stop, skill`.

**Not verified:** nothing was run against a live Pi, terminal or provider (task 8.7).

### W8-A Reconciliation (orchestrator)

The worker run `ac80de27` is terminal and completed.

- **Write scope:** `extensions/speak/` and `test/speak/`, plus the worker's own subsection in this log. No other paths changed; `.pi/settings.json` holds foreign changes.
- **New files:**
  - source: `config-validation.ts`, `input-settings.ts`, `voice-command.ts`, `talk-delivery.ts`, `talk-status.ts`, `hold-space.ts`;
  - tests: `test/speak/hold-clock.ts`, `hold-space.test.ts`, `voice-command.test.ts`.
- **Caller verification:**
  - 666 tests pass and 0 fail, in 2 runs (538 before).
  - The filtered type check prints nothing, and `git diff --check` is clean.
  - Every source file is under 500 lines. `talk.test.ts` has 762 lines, under the 800-line review trigger for test files.
- **Runtime import check:** the new runtime import of `@earendil-works/pi-tui` in `hold-space.ts` matches the import `talk.ts` already had. Pi's extension loader aliases that package (`core/extensions/loader.js:55-72`).
- **Accepted deviations:**
  - The spent state lives on the `HoldSpace` instance created once per load. It survives resets and does not leak between tests.
  - Escape listeners ignore reported Escape releases, which the "Release of another key" scenario requires.
  - `session_shutdown` calls `detach()`.
  - `Shortcuts` is extended.
  - Defaults were chosen where the artifacts are silent:
    - a repeat is a Space at most 120 ms after the previous one, inclusive;
    - with an unreadable config at the stop, the transcript is appended with a warning;
    - a blank draft is dropped;
    - `/talk command` and `/talk skill` take no arguments.
- **Remaining tasks:**
  - 8.6 waits for the user's approval of the config change;
  - 8.7 is unverified;
  - gate 8.8 runs after 8.6.

### W8-B (orchestrator), task 8.6

- **Approval:** the user approved the change ("setup this for me").
- **Backup:** `~/.config/pi-speak/config.json.bak-20261009-141700`.
- **Change:** `input.holdSpace: true` was added. The diff is the single added key; formatting is kept at a two-space indent.
- **Check with `parseConfig`:**
  - the result is `ok`, with `holdSpace: true`;
  - the shortcut lists are unchanged;
  - the command key is `["alt+m"]` and the skill key is `["alt+i"]`;
  - `stopOnPhrase: true`, language `vi`;
  - no keys or voice IDs were printed.
- **Tasks:** 8.2–8.6 are ticked. 8.7 (the user's live checks) and the 8.8 gate remain.

## Round 1 - Oracle Review

Gate task 8.8, mode FULL, first round of the Wave 8 sequence. Loaded `code-review-expert` and `review-convergence`.

**Frozen baseline:**
- `BASELINE_TARGET`: Wave 8 implementation (tasks 8.2–8.6) of `add-speak-voice-input`.
- `BASELINE_TARGET_REVISION`: HEAD `2452591`; candidate `sha256:d6012bfbe90f9b7337f1844dd672cca2560a6004617fd63f4ba27814c5571150`, verified before and after the review.
- `BASELINE_SOURCE`: `git diff fc2fae0 -- extensions test openspec` at `2452591`.
- `BASELINE_INCLUSION_PREDICATE`: the Wave 8 changes under `extensions/speak/`, `test/speak/` and `openspec/changes/add-speak-voice-input/tasks.md`, judged against D10, D11, D15, D16 and D17, the voice-input and manual-speech deltas, and ADR-0007 and ADR-0008.
- `BASELINE_EXCLUSIONS`: `.pi/settings.json` (foreign work) and `extensions/pi-voicekit` (existing tsc errors). The user config was not read.

**Checks:**
- `node --experimental-strip-types --test test/speak/*.test.ts`: 666 pass, 0 fail.
- The filtered tsc check prints nothing, `git diff --check` is clean, and `openspec validate add-speak-voice-input --strict` passes.
- Every source file in scope is under 500 lines (`talk.ts` 469, `config.ts` 462). `speech-job.ts` has 659 lines, which is the existing deferred finding W3-F5.
- I ran 30 mutations in a throwaway copy under `/tmp`, since deleted. 27 were caught. Three survived:
  - removing the session guard on Space removal (`hold-space.ts:150`) is equivalent, because a reset cancels the claim before `onRecorderRunning` can fire;
  - changing `endHold`'s identity check to "any active recording" is equivalent, because every later step acts on `hold.target` and not on `this.active`;
  - letting command mode also match skills shows a real test gap, recorded under W8-F4.
- A probe that modelled Pi re-running the extension factory showed that a second `HoldSpace` recognizes a hold the first one had spent (W8-F1).

**Confirmed sound:**
- **Consent and egress.**
  - Command and skill starts never stream (`talk.ts:206`), and the stream test proves it.
  - Command and skill delivery never calls `sendMessage` (`talk-delivery.ts:103-147`).
  - Other input calls `endHold(handle, "discard")` only (`hold-space.ts:115-118`).
  - The ignored list is the closed list the spec gives: releases of keys other than Space, and `CELL_SIZE_REPLY` (`hold-space.ts:122-128`).
  - A paste is detected first, and anything misclassified ends in a discard.
- **`endHold`** acts only when `this.active === hold.target`, and does nothing while transcribing (`talk.ts:135-142`). That matches the D17 table, including the 0.5 s minimum on a send.
- **Detector.** All of these match D17:
  - recognition on the second repeat in a row, within 120 ms, inclusive;
  - an engaged hold is fully idle only, and a refused start still returns a handle, so Spaces stay consumed and the refusal is reported once;
  - the counted run is removed only at the end of the text, once the recorder runs;
  - the hold ends on a Space release or on the 300 ms quiet gap, decided after a deferral;
  - the spent hold ends only after the arrival-time quiet gap, measured after a reset;
  - shutdown leaves no context access (the Proxy test).
- **Matcher** (`voice-command.ts`):
  - it compares collapsed forms (NFKC, lowercased, letters and digits only);
  - it takes the longest leading run of up to 8 tokens, and an alias beats a name;
  - two different names are ambiguous, after removing duplicates;
  - listed and unlisted delivery follow D16, and warnings never repeat the transcript.
- **Config** (`input-settings.ts`):
  - every key is unique across all four shortcut settings, ignoring case;
  - the alias rules hold: at most 50, 1 to 40 characters, at most 8 tokens, a non-empty form that no other phrase shares, and a one-line target of 2 to 200 characters starting with `/`;
  - `holdSpace` is a boolean read at load, and a config error registers the four defaults with `holdSpace` off (`index.ts:14-20,227-236`).
- **Pi 1.1.0 feasibility:**
  - `onTerminalInput`: `interactive-mode.js:2017-2023,2059`;
  - `getEditorText` and `setEditorText`: `interactive-mode.js:2076-2077`;
  - `getCommands` sources `extension`, `prompt` and `skill:<name>`: `agent-session.js:2681-2700`;
  - `isKeyRelease`: `keys.js:363`; `matchesKey("space")` covers Kitty release events: `keys.js:655-670`;
  - `StdinBuffer` splits queued Spaces into single `" "` events: `stdin-buffer.js:212-216`;
  - the loader aliases `pi-tui`: `loader.js:63`;
  - the context reads `model` and `isIdle` at call time: `runner.js:613-660`.
- **Worker deviations:**
  - 2 (Escape release ignored), 3 (file splits), 4 (`Shortcuts` extended), 5 (the 120 ms bound is inclusive; `session_tree` keeps the listener) and 6 (defaults) are sound.
  - Deviation 1 is not sound; see W8-F1.

### Findings — highest priority first

**W8-F1 — P1 — `hold-lifecycle/spent-state-scope` — in scope.**
- **Evidence:**
  - The spent hold is an instance field (`hold-space.ts:66`). `new HoldSpace(...)` runs inside the extension factory (`index.ts:240`).
  - Pi 1.1.0 builds a new runtime for `/new`, `/resume` and `/fork`: `agent-session-runtime.js:102-112,147-166` with `createRuntime`, then `main.js:587-599` and `resource-loader.js:507`.
  - `initializeExtension` calls the factory again for each runtime (`loader.js:509-516`). The module stays cached on the same cwd (`loader.js:461-466`), but the instance is new.
  - Repeats that keep arriving after a session replacement therefore reach a fresh detector. It recognizes them as a new hold on the third repeat 30 ms apart, starts a recording in the new session, removes the typed Spaces, and sends on release.
  - The probe confirmed this: the second instance started one recording, consumed 3 Spaces, and cleared the editor.
  - This violates "Session replaced during a hold": the scenario says "no recording starts on the later repeats", and the requirement says the hold "SHALL stay unrecognizable until it ends".
  - It also contradicts D17 (`design.md:212`, "lives at module level") and task 8.5 (`tasks.md:245`).
  - The test `hold-space.test.ts:402` passes only because the harness reuses one factory instance across the replacement. The caller accepted deviation 1 on the premise "created once per load", which does not hold for session replacement in Pi 1.1.0.
  - Likelihood is low, because replacement needs a non-keyboard trigger while Space is held. The consequence is an unrequested recording and send.
- **SUGGESTED_CORRECTION:**
  - Keep the spent hold in a module-level holder in `hold-space.ts`, as D17 states.
  - Let the constructor take an optional state object that defaults to the module holder, so tests stay isolated.
  - The ending already does nothing for a handle that belongs to an earlier controller (`talk.ts:137`).
  - Add a test that builds two `HoldSpace` instances on one shared holder. The first recognizes a hold and resets, the second attaches, and repeats 30 ms apart start nothing and stay consumed. Then the first input more than 300 ms later types.
  - Show that the test fails with an instance-level field.

**W8-F2 — P2 — `runtime-premise/fullscreen-input-precedence` — in scope (contract and docs).**
- **Evidence:**
  - Pi 1.1.0 runs in fullscreen by default (`settings-manager.js:974-975`; `--tui-mode` "fullscreen (default)", `cli/args.js:333`; `tui-renderer.js:8-10`). The user's settings do not set `tuiMode`.
  - `TuiAltScreen` turns on mouse reporting, including all motion, and focus reporting (`tui-alt-screen.js:16-17,194`).
  - Its viewport listener is added in the constructor, ahead of every extension listener (`tui-alt-screen.js:105`, `tui.js:572-576,686-692`). It consumes these keys: PageUp, PageDown, `ctrl+shift+up` and `ctrl+shift+down`, `ctrl+shift+f`, `ctrl+home` and `ctrl+end` (`tui-alt-screen.js:528-600`, `keybindings.js:91-140`).
  - It also consumes focus events and mouse events (`tui-alt-screen.js:475-526`). A right-click paste goes to the editor directly.
  - The detector never sees any of these. A navigation key pressed during a hold stops Space's key repeat, so the quiet gap **sends** the recording instead of discarding it.
  - This contradicts "Typing another key during a Space hold SHALL discard". It is the very partial-send hole that ADR-0008's "another key discards" was meant to close.
  - The inherited premise "Pi enables no focus reporting or mouse reporting" (`design.md:252`; proposal review `wave8-review.md:196`, citing `terminal.js:128`) holds only for `--tui-mode regular`.
  - The extension cannot run before Pi's viewport listener, so a code fix is not available.
- **SUGGESTED_CORRECTION:**
  - Amend the "Hold Space to talk" requirement or D17 with a limit: in fullscreen mode, keys Pi's viewport takes first, and right-click paste, are not seen and count as letting go.
  - Correct `design.md:252` to say that focus events are consumed by Pi in fullscreen mode, which leaves the conclusion that focus loss sends unchanged.
  - Add the limit to the README "Limits" list (`README.md:206-213`) and to the ADR-0008 consequences.
  - Add "PageUp while holding Space" to the 8.7 live checks.

**W8-F3 — P3 — `delivery/spacing` — in scope.**
- **Evidence:** `talk-delivery.ts:138` joins the untrimmed draft. A draft with leading or trailing whitespace produces doubled or trailing spaces, but D16 says the parts are "joined by single spaces".
- **SUGGESTED_CORRECTION:** use `draft.trim()` in `parts`, and add one table case.

**W8-F4 — P3 — `test-coverage/removal` — in scope.**
- **Evidence:**
  - No test checks that command mode excludes skills. The mutation that added `source === "skill"` to the command candidates (`talk-delivery.ts:122`) survived.
  - `HoldHandle.recorderRunning` is written (`talk.ts:292`) but never read (`talk-state.ts:28`).
- **SUGGESTED_CORRECTION:**
  - Add a talk case where the command key and a spoken skill name give no match.
  - Remove the dead field.

**W3-F5 — P3 — deferred.**
- **DEFERRED_REASON:** `speech-job.ts` is 659 lines and was not touched by Wave 8. The earlier deferral stands.

### Residual risks and live-check notes for 8.7 (outside this gate)

- The user runs Pi in fullscreen mode, so PageUp and the other viewport keys during a hold send the recording (W8-F2). Focus loss also sends.
- In the user's config, `stopOnPhrase` is on. Every hold, including an accidental one, streams to ElevenLabs from the fourth Space. If the input provider is Deepgram, every hold is refused with a message.
- Between Pi clearing the listeners and the new `session_start`, Space repeats reach the editor directly. This is a Pi lifecycle gap, and the spent-state fix does not close it.
- `/reload` re-imports the module (`moduleCache: false`, `loader.js:478`), so a hold that spans a reload loses its spent state. That is practically unreachable.
- A hold in a dialog removes trailing Spaces from the main editor if its text ends with that many Spaces. This sits under the documented dialog limit.
- These remain unverified until 8.7: Ghostty without release events, the 300 ms latency of letting go, a terminal hiccup longer than 300 ms (which would end the hold early and start a busy follow-up hold), and how Vietnamese command names transcribe.

PROPOSED_REVIEW_ACTION=PATCH

---

## Caller Assessment — Wave 8 Round 1

### Review Mode
- `implementation`, convergence mode `FULL`. The candidate `sha256:d6012bfb…5571150` at `2452591` was verified by the Oracle (run `57f0af3d`).

### Per-Issue Evaluation

#### W8-F1 — The spent hold does not survive the extension being loaded again
- **Severity:** P1
- **Family:** `hold-space / detector-controller-identity`. This is the code-level counterpart of the proposal family, recurring as an implementation deviation, not a design gap: D17 already said "module level".
- **In-scope:** `YES`
- **GOVERNING_SOURCE:**
  - D17 "Listener lifecycle": the spent state lives at module level.
  - The spec, "Hold Space to talk": the hold stays unrecognizable after a session replacement.
  - The caller confirmed the factory reruns per runtime (`loader.js:509-516`).
- **Decision:** `ACCEPT_BLOCKING`. Accepting worker deviation 1 was a caller error.
- **CORRECTION:** the routing is as follows.
  - Keep the spent state at module level, with a test seam to reset it.
  - Add a test with two detector instances, one before and one after replacement.
  - D17 and the spec now name the reload of the factory explicitly.

#### W8-F2 — Keys Pi's fullscreen mode takes before extensions end a hold through the quiet gap and send
- **Severity:** P2
- **Family:** `hold-space / release-inference`
- **In-scope:** `YES`
- **GOVERNING_SOURCE for blocking:** none.
  - The extension cannot run before Pi's handler.
  - The harm matches the documented focus-loss limit: an early send of a dictation the user started.
  - The caller confirmed that fullscreen is the default (`settings-manager.js:975`, `cli/args.js:333`).
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:**
  - Documented as a limit in D17, the spec ("Keys Pi handles first"), ADR-0008, the README list in task 8.5, and a live check in task 8.7.
  - The incorrect claim "Pi enables no focus reporting" is removed.

#### W8-F3 — Double or trailing spaces when the draft has edge whitespace
- **Severity:** P3
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** routed to the worker: trim the draft edges before joining, with a test.

#### W8-F4 — Command mode ignoring skills is untested, and `HoldHandle.recorderRunning` is unused
- **Severity:** P3
- **Decision:** `ACCEPT_NONBLOCKING`
- **CORRECTION:** routed to the worker: add the test case, and remove the unused field or make it read.

#### W3-F5 — `speech-job.ts` is 659 lines
- **Decision:** `DEFER_OUT_OF_SCOPE`. It is recorded for the archive note, together with W5-F4.

### User-directed scope change (not an Oracle finding)

During the 8.7 live check, "LLM online interactive" did not match `online-llm-interactive`. The user chose to have word order not matter (option b). The change is made as follows:
- **Artifacts:**
  - D16 "Words in another order", a fallback pass only, so every existing ordered match is unchanged;
  - the spec "Comparison", with the scenarios "Words in another order" and "Order kept when it matches";
  - ADR-0007;
  - the task 8.3 test list and the task 8.7 live check.
- **Code:** routed to the worker in the same patch.
- **User config:** `input.language` was set to `en` at the user's request. Backup: `config.json.bak-20261009-142351`.

### Caller Result

REVIEW_ACTION=PATCH
CONSENSUS_STATUS=NEEDS_REVISION

The next round is Round 2, with one PATCH assignment to `worker`: W8-F1, F3, F4, the word-order pass, and the README for F2 and word order.

### W8-A-R2 (worker)

- **W8-F1:** `hold-space.ts` keeps the spent hold in a module variable (`spentHold`), reset by the test seam `resetSpentHold()` (called in `beforeEach` of `hold-space.test.ts`). New test: two `HoldSpace` instances, the first spent and reset, the second attached; its repeats are consumed and start nothing; after a second reset and 400 ms the first input types, and the earlier handle ends once through the second instance.
- **Word-order pass (D16):** `voice-command.ts` runs the in-order comparison, then, only if it found nothing, a comparison of the leading tokens' collapsed forms against each candidate's words as a multiset. Same winner rules (alias, one name, 2+ ambiguous). Nine table cases added in `voice-command.test.ts`, one in `talk.test.ts`.
- **W8-F3:** the draft is trimmed before joining (`talk-delivery.ts`); one `talk.test.ts` case.
- **W8-F4:** `talk.test.ts` case "a skill name does not match in command mode"; `HoldHandle.recorderRunning` removed (`talk-state.ts`, `talk.ts`).
- **README:** "Words in another order" paragraph (and the "no fuzzy matching" sentence reworded to say exact words only); Hold Space limit "Keys Pi's fullscreen mode takes first".
- **Checks:** `node --experimental-strip-types --test test/speak/*.test.ts` twice: 679 pass, 0 fail (666 before). Mutations in a /tmp copy: (a) spent state on the instance fails the two-instance test; (b) word-order pass first fails 6 voice-command cases; (c) set instead of multiset fails "a word spoken twice…", ignoring ambiguity in the second pass fails "two names with the same words in another order are ambiguous".
- **Deviation:** the two-instance test uses a stub target and context instead of the talk harness, because the harness builds one `HoldSpace` per harness.

### W8-A-R2 Reconciliation (orchestrator)

The worker run `143fed16` is terminal and completed.

- **Write scope:** `extensions/speak/` and `test/speak/`, plus the worker's own subsection in this log.
- **Caller verification:**
  - 679 tests pass and 0 fail (666 before).
  - The filtered type check prints nothing, and `git diff --check` is clean.
  - The spent state is now the module-level `spentHold` (`hold-space.ts:58`), with the `resetSpentHold()` test seam.
  - The real matcher maps "LLM online interactive, check the spec." to `/skill:online-llm-interactive`, with the arguments `check the spec`.
- **Accepted deviation:** the two-instance test uses a stub target instead of the talk harness. It still exercises the real module state.
