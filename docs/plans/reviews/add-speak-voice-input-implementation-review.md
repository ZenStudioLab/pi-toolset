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
