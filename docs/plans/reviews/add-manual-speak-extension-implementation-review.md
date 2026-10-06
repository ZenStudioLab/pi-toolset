# Manual Speak Extension Implementation Review

## Review handoff

Invocation: `/opsx-apply-loop` resolved to change `add-manual-speak-extension` (schema `spec-driven`), after the proposal review recorded in `docs/plans/reviews/add-manual-speak-extension-review.md`.
Selected reviewer: `oracle` (not dispatchable: the host did not expose the `subagent` tool). The user authorized caller self-review in that case; every review section below is labelled a caller self-review and is not an Oracle review.
Selected default implementation specialist: `worker` (unused; the user permits only the `oracle` subagent, so the Orchestrator owns all implementation).
Focus mode: `normal`.

## Wave 1 Review Sequence

BASELINE_TARGET=Wave 1 deliverables of add-manual-speak-extension (tasks 1.1-1.5)
BASELINE_TARGET_REVISION=sha256:66078a0c579933cb456d90dbad34612ff56c6ed322be7d915844cd0c53bf25db
BASELINE_SOURCE=openspec/changes/add-manual-speak-extension (revision sha256:9eebf857b95ca770c34879f5327b5441130df655e89aa6675a78c88413d31a4b plus the design.md and COMPATIBILITY.md clarifications made during this wave); pi-toolset HEAD a25e2b904fefb53cf1d9d4b208bbaaefcf18c0a5
BASELINE_INCLUSION_PREDICATE=docs/adr/0002-manual-speech-egress-boundary.md; extensions/speak/COMPATIBILITY.md; extensions/speak/index.ts; test/speak/silence.test.ts; consistency of those files with the spec and design
BASELINE_EXCLUSIONS=Waves 2-4; package.json; extensions/whimsical-activity; live provider use; pricing or entitlement; the scratch spike in /tmp/speak-spike (outside the repository)

The revision is SHA-256 over UTF-8 relative path + NUL + file bytes, in the order of the inclusion predicate.

## Round 1 - Implementation Assignments

Wave handled: 1. Final gate task reserved: `1.6 [Oracle gate: oracle]`.

Owner mapping (all Orchestrator, no overrides):

- 1.1 ADR-0002: `docs/adr/0002-manual-speech-egress-boundary.md`.
- 1.2 Pi API inspection: `extensions/speak/COMPATIBILITY.md` (host section).
- 1.3 Provider documentation check: `extensions/speak/COMPATIBILITY.md` (provider section).
- 1.4 Player spike: `extensions/speak/COMPATIBILITY.md` (player section); scratch outside the repository.
- 1.5 Scaffold: `extensions/speak/index.ts`, `test/speak/silence.test.ts`.

Validation evidence:

- 1.1: the ADR follows the section structure of ADR-0001 (Status, Owner, Change, Context, Decision, Consequences, Alternatives) and links the change.
- 1.2: both Pi releases (0.87.1 and 0.99.2) inspected from their `.d.ts` files; every needed symbol present and identical; one documented unknown (command-handler blocking) carried to task 4.4.
- 1.3: ElevenLabs endpoint, header, body fields, default output format, zero-retention restriction, and Flash v2.5 Vietnamese support verified from the fetched pages; response content type, error bodies, and redirect behavior recorded as unverified.
- 1.4: with the design's own arguments the player exited 0 on completion, exited 123 on SIGTERM, and left no process behind. The first run failed because the spike itself passed the invalid option `-nostdin`; the cause was identified and the result recorded.
- 1.5: `npx tsc --noEmit` rc=0; `node --experimental-strip-types --test test/speak/*.test.ts` passes 2 of 2; with a deliberate load-time `fetch` injected the load test fails and with the file restored it passes; `npm test` still passes all 114 existing tests.

Summary: Wave 1 records the decision, replaces unverified guide claims with checked facts, and adds an inert `/speak` scaffold. Two findings changed the design inputs: ffplay's exit code 123 on termination, and the invalid `-nostdin` option.

---

## Round 1 - Oracle Review

REVIEWER=caller self-review (NOT an Oracle review). Mode: FULL. Weaker independence than an Oracle review because the same agent produced the wave; claims were re-checked by command.

Coverage: all five Wave 1 deliverables read; the ADR cross-checked against ADR-0001 and against `monitoring.test.ts`/`network-probe.ts` for the "no network egress so far" claim; COMPATIBILITY.md cross-checked against the spike output and the fetched documentation; git status confirmed only new files and no tracked-file change. Not covered: real-terminal behavior (task 4.4), anything in Waves 2-4.

Findings:

1. P2, family `doc-accuracy`, in scope. COMPATIBILITY.md said an audio session "exists (a 1 s tone played)", which overstates an inferred fact (exit code 0 shows an output was opened, not that sound was heard). SUGGESTED_CORRECTION: state exactly what was observed.
2. P2, family `spec-design-consistency`, in scope. The design accepts only `audio/*` responses while COMPATIBILITY.md described the content type as unverified and hinted at a looser check. SUGGESTED_CORRECTION: state that the design keeps `audio/*` and that a mismatch is resolved by amending the artifacts, not by loosening the check.
3. P3, family `design-completeness`, in scope. Design decision 6 did not carry the two spike findings that change implementation (exit 123, no `-nostdin`). SUGGESTED_CORRECTION: add them to decision 6.
4. P3, family `test-value`, in scope. The second scaffold test (handler shows usage) is superseded by Wave 3 command-router tests. DEFERRED_REASON: it guards the wiring until Wave 3 replaces it; remove it when 3.3 lands.

No P0 or P1 finding.

PROPOSED_REVIEW_ACTION=PASS

---

## Caller Assessment - Round 1

### Per-Issue Evaluation

Findings 1-3: `ACCEPT_NONBLOCKING`, in scope YES; `GOVERNING_SOURCE` is the spec/design consistency of this change and the task 1.2-1.4 requirement to record verified versus unverified facts accurately. CORRECTION applied: COMPATIBILITY.md (findings 1 and 2) and design.md decision 6 (finding 3), then `openspec validate --strict` passed. Finding 4: `DEFER_OUT_OF_SCOPE`, reason above; carried into task 3.3.

### Summary

- **Issues accepted blocking:** 0
- **Issues accepted nonblocking:** 3
- **Issues deferred out of scope:** 1
- **Issues rejected:** 0

### Candidate revision check

The corrections touched COMPATIBILITY.md and design.md. Both were made before `BASELINE_TARGET_REVISION` was computed, so the recorded revision covers the corrected COMPATIBILITY.md bytes; design.md is outside the inclusion predicate's file list. Target, source, inclusion predicate, and exclusions are unchanged, so the baseline is valid.

### Caller Result

- `REVIEW_ACTION=PASS`
- `CONSENSUS_STATUS=MOSTLY_GOOD`

## Wave 2 Review Sequence

BASELINE_TARGET=Wave 2 deliverables of add-manual-speak-extension (tasks 2.1-2.4)
BASELINE_TARGET_REVISION=sha256:ce1b20464fd89f2973685641fee5fc53906ce341c032eb3beea749101af9e82d
BASELINE_SOURCE=openspec/changes/add-manual-speak-extension spec and design; Wave 1 commit 0510a06
BASELINE_INCLUSION_PREDICATE=extensions/speak/config.ts; session.ts; text.ts; cache.ts; test/speak/config.test.ts; session.test.ts; text.test.ts; cache.test.ts; the package.json test-script glob; consistency with the spec requirements for configuration, answer selection, text preparation, length limit, and cache
BASELINE_EXCLUSIONS=Wave 3-4 behavior (command router, idle check, provider request, playback, job control, replay pointer); network or process use; extensions/whimsical-activity; live provider use

The revision is SHA-256 over UTF-8 relative path + NUL + file bytes, in the order of the inclusion predicate.

## Round 1 - Implementation Assignments

Wave handled: 2. Final gate task reserved: `2.5 [Oracle gate: oracle]`.

Owner mapping (all Orchestrator, no overrides):

- 2.1 config: `extensions/speak/config.ts`, `test/speak/config.test.ts`, `package.json` test glob only.
- 2.2 answer selection: `extensions/speak/session.ts`, `test/speak/session.test.ts`.
- 2.3 text preparation: `extensions/speak/text.ts`, `test/speak/text.test.ts`.
- 2.4 cache: `extensions/speak/cache.ts`, `test/speak/cache.test.ts`.

Scope adjustment: the in-memory replay pointer was listed in task 2.4 but the design makes it command-layer state, so it moved to task 3.3 in tasks.md. No requirement was dropped.

Validation evidence:

- `npx tsc --noEmit` rc=0; `npm test` passes 179 of 179 (114 existing plus 65 new).
- Mutation check: 13 deliberate breakages were applied one at a time, each confirmed to fail the suite and then restored. They were: inclusive length limit; bare-URL removal; list-continuation guard; stop-reason gate; unanswered-turn guard; voice and revision in the cache key; protected-clip sparing; hit validity check; file permissions; placeholder rejection; status redaction; and the one-line triple-backtick fix.
- The first run failed in Node's strip-types mode because a TypeScript parameter property (`constructor(private readonly options)`) is not supported at runtime; `tsc` had accepted it. Fixed with a plain field; no other unsupported syntax remains (grep for parameter properties, enums, namespaces: none).
- A mutation check showed the first regression test for the one-line triple-backtick case did not exercise the fix (the line did not start with the fence). The test was corrected and the mutant is now caught.
- Real Pi `SessionManager.inMemory()` with `branch()` is used to confirm that only the active branch reaches answer selection.

Summary: configuration validation and redacted view, active-branch answer selection, deterministic cleanup with the 4000-character check, and the private content-addressed cache with eviction. None of it performs network or process work.

---

## Round 1 - Oracle Review

REVIEWER=caller self-review (NOT an Oracle review). Mode: FULL. Weaker independence than an Oracle review because the same agent wrote and reviewed the wave; claims were re-derived by running the code and mutants, not by memory.

Coverage: every Wave 2 source and test file re-read; each Wave 2 spec requirement traced to code and a test (answer selection scenarios except the busy-agent one, text preparation, explicit text, length limit, content-addressed cache, status redaction inputs); adversarial inputs tried against the cleaner. Not covered: Wave 3 behavior and anything needing a real terminal or provider.

Findings:

1. P2, family `silent-content-loss`, in scope. A line beginning with ```` ```code``` ```` followed by text was treated as an opening fence and removed the rest of the answer. SUGGESTED_CORRECTION: accept a backtick fence only when no backtick follows on the line, and add a regression test.
2. P3, family `design-completeness`, in scope. The retention period's reference point (creation versus last use) was unspecified. SUGGESTED_CORRECTION: record that age counts from last use because a hit refreshes the modification time.
3. P3, family `robustness`, in scope. `loadConfig` reads the whole file before applying its 64 KiB limit. DEFERRED_REASON: the file is the user's own configuration on a single-user machine; a bounded read adds code with no current failing scenario.
4. P3, family `spec-boundary`, in scope. The spec's "agent still working" scenario and the "refuse with length and limit" message are not implemented here because they belong to the command layer. DEFERRED_REASON: scheduled in task 3.3; this wave supplies `checkLength` and `selectLatestAnswer` only.

No P0 or P1 finding.

PROPOSED_REVIEW_ACTION=PASS

---

## Caller Assessment - Round 1

Findings 1-2: `ACCEPT_NONBLOCKING`, in scope YES. `GOVERNING_SOURCE`: the spec's "Deterministic text preparation for answers" requirement (finding 1) and design decision 7 (finding 2). CORRECTION applied and verified: finding 1 in `text.ts` with a regression test confirmed by mutation; finding 2 in `design.md`. Findings 3-4: `DEFER_OUT_OF_SCOPE`, reasons above.

### Summary

- **Issues accepted blocking:** 0
- **Issues accepted nonblocking:** 2
- **Issues deferred out of scope:** 2
- **Issues rejected:** 0

### Candidate revision check

`BASELINE_TARGET_REVISION` was computed after the corrections above, over the final bytes of every file in the inclusion predicate. Target, source, inclusion predicate, and exclusions are unchanged, so the baseline is valid.

### Caller Result

- `REVIEW_ACTION=PASS`
- `CONSENSUS_STATUS=MOSTLY_GOOD`

## Wave 3 Review Sequence

BASELINE_TARGET=Wave 3 deliverables of add-manual-speak-extension (tasks 3.1-3.4)
BASELINE_TARGET_REVISION=sha256:51e7f3c754aa7b6a5d0287945d47162e20d34f50490cd4b6ca243b4efd92a833
BASELINE_SOURCE=openspec/changes/add-manual-speak-extension spec and design; Wave 2 commit c354881
BASELINE_INCLUSION_PREDICATE=extensions/speak/elevenlabs.ts; audio.ts; speech-job.ts; index.ts; the `usage()` addition in cache.ts; test/speak/harness.ts; provider.test.ts; audio.test.ts; command.test.ts; job.test.ts; silence.test.ts; consistency with the spec requirements for the command contract, run mode, answer selection use, preflight, provider request, single job and stop, playback, lifecycle cancellation, replay, status, secrets, and deferred features
BASELINE_EXCLUSIONS=README and packaging checks (Wave 4); real-terminal and live-provider behavior (task 4.4); Waves 1-2 files except the named `usage()` addition; extensions/whimsical-activity

The revision is SHA-256 over UTF-8 relative path + NUL + file bytes, in the order of the inclusion predicate.

## Round 1 - Implementation Assignments

Wave handled: 3. Final gate task reserved: `3.5 [Oracle gate: oracle]`.

Owner mapping (all Orchestrator, no overrides):

- 3.1 provider: `extensions/speak/elevenlabs.ts`, `test/speak/provider.test.ts`.
- 3.2 player: `extensions/speak/audio.ts`, `test/speak/audio.test.ts`.
- 3.3 job control and command router: `extensions/speak/speech-job.ts`, `extensions/speak/index.ts`, `test/speak/harness.ts`, `command.test.ts`, `job.test.ts`; `usage()` in `cache.ts`.
- 3.4 silence: `test/speak/silence.test.ts` (rewritten; the superseded usage-only test from the scaffold is gone).

Validation evidence:

- `npx tsc --noEmit` rc=0; `npm test` result: # tests 234; # pass 234; # fail 0.
- Mutation check: 21 deliberate breakages were applied one at a time and each was caught by the suite before being restored: single-job claim; live guard after synthesis; stop aborting generation; stop ending the player; session reset forgetting the clip; length limit; player preflight; key removal from the player environment; stop not reported as failure; no shell; redirects not followed; audio content type; terminal-only mode; busy agent; branch-navigation and fork handlers; replay clearing a missing clip; a load-time request; an agent-event subscription; a lifecycle handler reading configuration; and a stale job clearing a newer job's status.
- Real behavior was observed where a fake could hide it: real child processes for SIGTERM, exit codes, argument passing, key-free environment, and diagnostics bounding; real Node `fetch` with `redirect: "manual"` returns the 302 response (the redirect rejection depends on that); real Pi `SessionManager` for branch selection (Wave 2).
- Two test-process artifacts were diagnosed and fixed in tests only: Node's `AbortSignal.timeout` and the player kill timer are unref'd by design, so a bare test process exits before they fire; tests hold the loop open. Timing-based waits were replaced with a condition poll (`until`) and `whenIdle()` after the first runs raced real file I/O.
- A lint rule flagged `run(...)` with an interpolated string as SQL injection (no database exists); the test input is now built before the call.

Summary: the explicit-request command with bounded provider request, key-free shell-free playback, single-job control with responsive stop, replay, status, lifecycle cancellation, and tests proving silence at load. All behavior is exercised against fake `fetch` and `spawn`; nothing here touched the real provider or an audio device.

---

## Round 1 - Oracle Review

REVIEWER=caller self-review (NOT an Oracle review). Mode: FULL. Weaker independence than an Oracle review because the same agent wrote and reviewed the wave; the evidence is the mutation sweep and observed real-process behavior above, not recollection.

Coverage: every Wave 3 source and test file re-read against each spec requirement from "Speech occurs only on explicit request" through "Deferred features are unavailable"; stale-callback and cancellation interleavings traced by hand; error paths traced for key disclosure. Not covered: real-terminal handler responsiveness, real ElevenLabs responses (content type, error bodies), real audio output (task 4.4); README and packaging (Wave 4).

Findings:

1. P2, family `stale-callback`, in scope. A cancelled job's `finally` cleared the status line even after a newer job had started, so a stale job could alter a newer job's state. SUGGESTED_CORRECTION: release the claim and clear status only while the job is still current. Found during this review, fixed, and covered by an assertion plus a mutation check.
2. P3, family `robustness`, in scope. `/speak status` rejected when the cache directory was unreadable. SUGGESTED_CORRECTION: report the cache as unreadable and still answer. Fixed with a test.
3. P3, family `unverified-assumption`, in scope. The `audio/*` content-type requirement and the provider error body shapes rest on documentation that does not state them. DEFERRED_REASON: only a real response can settle it; task 4.4 and `COMPATIBILITY.md` already record it as unverified.
4. P3, family `unverified-assumption`, in scope. That an awaited command handler does not block `/speak stop` in the real terminal is unproven; the design returns from the handler immediately and fake-driven tests show stop working while a job is active. DEFERRED_REASON: needs a real terminal; task 4.4.

No P0 or P1 finding.

PROPOSED_REVIEW_ACTION=PASS

---

## Caller Assessment - Round 1

Findings 1-2: `ACCEPT_NONBLOCKING`, in scope YES. `GOVERNING_SOURCE`: the spec requirement "Single job and responsive stop" ("A cancelled job SHALL NOT ... alter the state of a newer job") for finding 1, and the requirement "Status reporting" for finding 2. CORRECTION applied and verified (finding 1 confirmed by mutation). Findings 3-4: `DEFER_OUT_OF_SCOPE`, reasons above.

### Summary

- **Issues accepted blocking:** 0
- **Issues accepted nonblocking:** 2
- **Issues deferred out of scope:** 2
- **Issues rejected:** 0

### Candidate revision check

`BASELINE_TARGET_REVISION` was computed after the corrections above, over the final bytes of every file in the inclusion predicate. Target, source, inclusion predicate, and exclusions are unchanged, so the baseline is valid.

### Caller Result

- `REVIEW_ACTION=PASS`
- `CONSENSUS_STATUS=MOSTLY_GOOD`

## Wave 4 Review Sequence

BASELINE_TARGET=Wave 4 deliverables of add-manual-speak-extension (tasks 4.1-4.4) and the whole change at its latest revision
BASELINE_TARGET_REVISION=sha256:8ba605db6f6d9637a935d0742625b7df742f13e2b336c9c6e9fc47c367ed01c7
BASELINE_SOURCE=openspec/changes/add-manual-speak-extension spec and design; Wave 3 commit 86a0848
BASELINE_INCLUSION_PREDICATE=extensions/speak/README.md; extensions/speak/COMPATIBILITY.md; design.md; the packaging boundary (package.json, npm pack contents, untouched whimsical-activity); the real-host checks on Pi 0.99.2; every spec requirement traced to code and tests; the Deferred Capabilities boundary; the two files edited after the Wave 3 gate (cache.ts, speech-job.ts)
BASELINE_EXCLUSIONS=The live ElevenLabs request, a real assistant answer spoken in the terminal, and audibility confirmed by a person (task 4.5, user-owned); publication; extensions/whimsical-activity

The revision is SHA-256 over UTF-8 relative path + NUL + file bytes, in the order of the inclusion predicate.

## Round 1 - Implementation Assignments

Wave handled: 4. Final gate task reserved: `4.6 [Oracle gate: oracle]`. Task 4.4 was split during this wave: the real-terminal part that needs no provider stayed 4.4 (done); the live provider check became 4.5 (user-owned, unchecked).

Owner mapping (all Orchestrator, no overrides; 4.5 is the user's):

- 4.1 README: `extensions/speak/README.md`.
- 4.2 packaging boundary, 4.3 check and real-host load, 4.4 real-terminal qualification: evidence recorded in `COMPATIBILITY.md`.

Validation evidence:

- Packaging boundary: `package.json` differs from the pre-change baseline only in the `test` script glob; `files`, `pi`, peer and dev dependencies, name, and version are unchanged; `npm pack --dry-run` lists 14 files and none under `extensions/speak`; `extensions/whimsical-activity` and its tests are unchanged since the baseline commit.
- `npm run check`: typecheck clean and 234 of 234 tests pass.
- README: both JSON examples parse with the real validator; the documented defaults equal the real defaults; the `mpv` example is a valid configuration; every command in the README table is in the extension's usage text.
- Real Pi 0.99.2, RPC mode: `speak` registered as an extension command; `status`, unsupported-mode, usage, summary-unavailable, and stop all answered; no agent or model events; nothing written; clean exit.
- Real Pi 0.99.2, interactive terminal through a pseudo-terminal, using a locally generated clip pre-seeded in the cache (cache hit, no key, no network): the real `ffplay` played; `/speak status` answered during playback (`job: playing`); a duplicate request was refused; `/speak stop` ended only the player with no failure message; `/speak replay` played from the cache; no `ffplay` process remained; the captured screen had no player output.
- Oversized-file audit (advisory, Step 14): no maintained handwritten file in this change exceeds 1,000 lines; the largest is `speech-job.ts` at 293. None found.

Post-gate edits to earlier-wave files (behavior-neutral): `AudioCache.usage()` was renamed `stats()` so it cannot be mistaken for the deferred usage-accounting feature; the full suite was rerun after the rename (234 of 234).

Summary: documentation and boundary checks complete, and the extension is qualified in the real Pi terminal everywhere except the provider.

---

## Round 1 - Oracle Review

REVIEWER=caller self-review (NOT an Oracle review). Mode: FULL, whole change. Weaker independence than an Oracle review because the same agent wrote and reviewed the change; claims were re-derived by command, by running the real host, and by mutation, not by memory.

Spec trace (requirement: code, tests):

1. Speech only on explicit request: `index.ts` registration; `silence.test.ts` (3 tests, 3 mutants); real RPC and TUI loads.
2. Command contract: `index.ts`; `command.test.ts`.
3. Supported run mode: `index.ts`; `command.test.ts`; real RPC (`ctx.mode` is `rpc`).
4. Answer selection: `session.ts`; `session.test.ts` including a real `SessionManager` branch; busy-agent cases in `command.test.ts`.
5. Deterministic text preparation, 6. explicit text, 7. single length limit: `text.ts`; `text.test.ts` (including 4000 and 4001) and `command.test.ts`.
6. Preflight: `speech-job.ts`; `command.test.ts` table of six failures.
7. ElevenLabs request: `elevenlabs.ts`; `provider.test.ts`; `job.test.ts`. The real service is unverified (task 4.5).
8. Single job and responsive stop: `speech-job.ts`; `job.test.ts`; real TUI.
9. Playback without shell or terminal interference: `audio.ts`; `audio.test.ts` with real processes; real TUI screen capture.
10. Lifecycle cancellation: `index.ts`; `job.test.ts` over four events.
11. Content-addressed cache and 14. replay: `cache.ts`; `cache.test.ts`; `job.test.ts`; real TUI replay.
12. Status: `speech-job.ts`; `job.test.ts`; real RPC and TUI.
13. Secret and privacy handling: redaction tests in `provider.test.ts`, `job.test.ts`, `audio.test.ts`, `config.test.ts`; README statements checked against the documentation and the code.
14. Deferred features unavailable: `index.ts`; `command.test.ts`; real RPC. A source search found no implementation of summary, confirmation tiers, secret scanning, cache clearing, or usage accounting.

Coverage: all deliverables re-read; README claims checked one by one against code or an observation; design re-read against the final code. Not covered: the live provider, an assistant answer spoken through the TUI, audibility to a person, non-Linux platforms.

Findings:

1. P2, family `doc-claim-exceeds-evidence`, in scope. The README said `mpv` works with the shown arguments, but `mpv` is not installed here. SUGGESTED_CORRECTION: say it was not available to test. Fixed.
2. P2, family `doc-claim-exceeds-evidence`, in scope. The README said cancelling does not restore allowance, which is an unverified provider behavior. SUGGESTED_CORRECTION: say it is not known to restore any. Fixed.
3. P2, family `spec-design-code-consistency`, in scope. The design said `redirect: "error"` while the code uses `"manual"` and treats a 3xx as failure. SUGGESTED_CORRECTION: correct the design and explain the choice. Fixed; real Node `fetch` confirms the 3xx is returned.
4. P3, family `doc-accuracy`, in scope. `COMPATIBILITY.md` pointed at task 4.4 for items that moved to 4.5. Fixed.
5. P3, family `naming`, in scope. `AudioCache.usage()` could be confused with the deferred usage-accounting feature. Renamed to `stats()`; suite rerun.
6. P3, family `unverified-at-completion`, in scope. The live provider path (content type, error bodies, voice and model acceptance, billing), a real assistant answer in the TUI, and audibility to a person are unverified. DEFERRED_REASON: they need the user's key and voice or a model turn; task 4.5 stays unchecked and the README and `COMPATIBILITY.md` say so.

No P0 or P1 finding.

PROPOSED_REVIEW_ACTION=PASS

---

## Caller Assessment - Round 1

Findings 1-5: `ACCEPT_NONBLOCKING`, in scope YES. `GOVERNING_SOURCE`: the user's standing instruction that no claim exceed the evidence (report exactly what was verified and what was not) for findings 1, 2, 4; the spec and design consistency of this change for findings 3 and 5. CORRECTION applied for each. Finding 6: `DEFER_OUT_OF_SCOPE`, reason above.

### Summary

- **Issues accepted blocking:** 0
- **Issues accepted nonblocking:** 5
- **Issues deferred out of scope:** 1
- **Issues rejected:** 0

### Candidate revision check

`BASELINE_TARGET_REVISION` was computed after the corrections above, over the final bytes of every file in the inclusion predicate. Target, source, inclusion predicate, and exclusions are unchanged, so the baseline is valid.

### Caller Result

- `REVIEW_ACTION=PASS`
- `CONSENSUS_STATUS=MOSTLY_GOOD`

Task 4.5 (live provider check) remains open and is the user's; the change is not fully complete until it is run or explicitly waived.

## Wave 5 Review Sequence

BASELINE_TARGET=Wave 5 locale/translation deliverables of add-manual-speak-extension, tasks 5.1-5.5
BASELINE_SOURCE=Current four-artifact bundle; user speech locale default vi and unchanged English Pi output; ADR-0002; primary-worktree HEAD 8df9fac5471bd1fb3d2ff013bdbcbde80d8d7c51
BASELINE_INCLUSION_PREDICATE=ADR-0003; speech config/router/translation/job/cache changes and tests; README and compatibility evidence; consistency with locale amendment and preserved original/text/replay/silence boundaries
BASELINE_EXCLUSIONS=Live paid requests; user's config/profile/settings; actual translation model selection; deferred features; other extensions; pre-existing unrelated code/test formatting changes

## Round 1 - Implementation Assignments

Selected reviewer: oracle. Selected default implementation specialist: worker, overridden by Orchestrator for all writing per oracle-only delegation restriction. Focus mode: normal. Reserve 5.6 as the single whole-Wave-5 gate; do not consume or check tasks until caller PASS.

Ordered owners (all Orchestrator): 5.1 ADR-0003; 5.2 config/router/status and tests; 5.3 isolated translation and host-interface evidence; 5.4 job integration/cache/race tests; 5.5 README, offline checks and terminal responsiveness. Existing primary-worktree differences captured in `/tmp/pi-speak-wave5-baseline/preexisting.diff` before any implementation; preserve `.pi/` and `.playwright-mcp/`. Session naming is not available through this tool surface, and Herdr is not applicable.

Oracle infrastructure failure from the preceding proposal review is reconciled in the proposal review log: workflow 080b6354-7b98-4d0e-ad07-c36b86283947 failed before child startup because the source host lacks installed runtime packages. No prerequisite has changed; do not repeat that launch. The authorized self-review fallback consumes the final gate below; it is not independent Oracle review.

### Assignment outcomes and evidence

- 5.1: ADR-0003 preserves ADR-0002 verbatim and supersedes only its one-origin/no-inference scope; it records separate translation costs, disclosure, isolation, explicit model choice, and the original publication boundary.
- 5.2: `config.ts` defaults omitted locale to vi and canonicalizes valid tags; optional translation setup is validated/redacted. Router adds original-mode selection with identical idle/branch rules. No user runtime config, environment file, or Pi settings changed. Original/text/replay work without translation setup.
- 5.3: new `translation.ts` calls the command context's registry with a fresh answer-only, tool-free transcript; it bounds auth and inference via cancellation/deadline, caps output, rejects invalid results, sanitizes errors, and never retries or chooses another model. Type declarations for both 0.87.1 and 0.99.2 and installed runtime implementation were inspected; exact interfaces are recorded in COMPATIBILITY.md. Virtual routing models are rejected based on observed host behavior that can select another provider/model.
- 5.4: `speech-job.ts` snapshots loaded config for each job, preflights key/player/source before inference, owns the translating phase and cancellation, and uses bounded memory translations plus locale-specific audio identity. Offline tests cover stale responses after stop/navigation, newer-job status, two-cache hits, changed locale/model, replay after locale edit, cache eviction/clearing, failed TTS followed by translation reuse, and lowered output limits applied to cached translations.
- 5.5: README documents setup, migration, literal/original exceptions, extra cost/disclosure, limits, strict text-only model requirement, voice/model language support, and cache scope. Historical base-release wording was clarified in proposal/design. Installed Pi 0.99.2 TUI through a pseudo-terminal accepted status, duplicate, and stop during a controlled pending translation; the signal aborted; a next request played a locally seeded MP3 through real ffplay; status/stop/replay stayed responsive. Exactly two mocked inference calls occurred (first canceled), zero TTS calls, Pi exited 0, no matching ffplay remained. This is mock-registry/answer-fixture integration evidence, not live model fidelity.

Verification: `npm run check` exit 0, typecheck clean, 272/272 tests pass; strict OpenSpec validation passes; primary LSP diagnostics clean on the changed code/tests, session lens has no blocking errors. First full run found one bad test expectation: identical final audio text reused its existing cache instead of issuing a third TTS request; the assertion was corrected to match the specified audio identity, with no product code workaround.

Current-wave files (candidate digest order): docs/adr/0003-localized-speech-translation.md; extensions/speak/config.ts; index.ts; translation.ts; speech-job.ts; cache.ts; README.md; COMPATIBILITY.md; test/speak/config.test.ts; command.test.ts; cache.test.ts; harness.ts; translation-fixture.ts; translation.test.ts; localized-job.test.ts. Paths after each full path retain its directory prefix. Digest uses relative path plus NUL plus bytes, as in earlier waves.

BASELINE_TARGET_REVISION=sha256:80d523c07721f766dd373cdebc51b05660826e7b24e0ed5f7a88fbdd2bd8246e

## Round 1 - Caller Self-Review (Oracle unavailable)

Final gate consumed: 5.6, one review of all tasks 5.1-5.5 after completion; no per-task/slice gates. Reviewer: Orchestrator, not Oracle. Mode FULL; independence is weaker because the writer reviews its own work. All assignments retain Orchestrator ownership; selected worker is not dispatched and no other child is used.

Coverage: traced each locale requirement through config/router/translation/job/cache and tests, plus original/text/replay compatibility, active-branch source, silent startup, per-job snapshot, preflight-before-inference, limits both sides, error redaction, no retries/fallback, cancellation and late continuations, both cache identities/eviction, documentation and ADR scope. The explicit model metadata is distinct from Pi's main model, and no session mutation or agent-turn API is called. The strict plain-text result check is documented rather than pretending all reasoning models are compatible. No generic translation framework or runtime dependency was added.

Findings:

1. P2, family `live-translation-fidelity`, root `offline-evidence-limit`, in scope NO for this offline-qualified wave. Evidence: translation fixture returns predetermined Vietnamese text; COMPATIBILITY.md explicitly leaves user-selected model fidelity and billing unverified. DEFERRED_REASON: live quality/billing require explicit model selection and separate paid-test approval; Wave 5 excludes paid tests and cannot establish semantic fidelity through mocks. Preserve the limitation, not a fabricated pass.
2. P3, family `base-live-qualification`, root `voice-heard-and-provider-usage`, in scope NO for Wave 5. Evidence: task 4.5 remains open; prior authorized TTS call returned HTTP 200 audio/mpeg with technical playback/replay success, but user-confirmed cloned voice and provider-visible accounting are absent. DEFERRED_REASON: user-owned remaining verification, not permission for another charge or to mark 4.5 complete.

No apparent P0/P1 blocker. No Oracle proposal is emitted: its known infrastructure prerequisite failure was not retried or replaced with another subagent protocol.

## Caller Assessment - Wave 5 Round 1

Finding 1: DEFER_OUT_OF_SCOPE, exact Wave 5 exclusion of live paid verification and actual translation model selection; documentation retains the limitation. Finding 2: DEFER_OUT_OF_SCOPE, task 4.5's user-owned acoustic/provider-usage verification remains incomplete. No accepted blockers or nonblocking corrections remain. One observed host routing risk was addressed before this review by rejecting pi-virtual and adding a pre-inference regression case.

Terminal validation: frozen target/source/inclusion/exclusion fields still match literally; recomputed candidate SHA-256 is 80d523c07721f766dd373cdebc51b05660826e7b24e0ed5f7a88fbdd2bd8246e. One final gate exists for Wave 5. The unchanged test/dependency/package publication boundary was preserved. Source/test files touched by the wave remain below 500 lines (largest speech-job.ts: 368 physical lines). This is a local size observation, not the final whole-change audit, which awaits task 4.5 completion or explicit waiver.

REVIEW_ACTION=PASS
CONSENSUS_STATUS=MOSTLY_GOOD

Authorize checking tasks 5.1-5.6 complete from this whole-wave caller PASS. This is offline implementation qualification with an explicitly authorized self-review fallback, not independent Oracle approval, live language-quality approval, or completion of task 4.5. Next-wave routing remains oracle-only; no host installation repair was performed.

## Wave 6 Review Sequence

BASELINE_TARGET=Wave 6 translation thinking and explicitly approved runtime setup, tasks 6.1-6.2
BASELINE_TARGET_REVISION=sha256:1080ab400160b7464e93ee32cc53691f93e9620eca258c34dbb4fd966b0c2d50
BASELINE_SOURCE=Owning add-manual-speak-extension bundle; user's selected openai-codex/gpt-6-luna at medium; explicit Q2 setup approval
BASELINE_INCLUSION_PREDICATE=extensions/speak/config.ts; extensions/speak/translation.ts; test/speak/config.test.ts; test/speak/translation.test.ts; test/speak/localized-job.test.ts; extensions/speak/README.md; extensions/speak/COMPATIBILITY.md; owning proposal.md, design.md, specs/manual-speech/spec.md; /home/zenji/.config/pi-speak/config.json; consistency with Wave 6 task/gate text
BASELINE_EXCLUSIONS=Paid/live inference or TTS; authentication refresh; Pi coding model/settings; environment/profile; all deferred features; task 4.5; other extensions; pre-existing working-tree changes

Digest: UTF-8 path + NUL + bytes in the inclusion list's file order; the three abbreviated artifact paths use prefix openspec/changes/add-manual-speak-extension/. Task checkboxes and this review log are bookkeeping, not digest inputs.

## Round 1 - Implementation Assignments

All assignments are Orchestrator-owned under the user's oracle-only delegation restriction. Final gate 6.3 is reserved until both implementation tasks and their evidence are complete. The reconciled Oracle startup failure (workflow 080b6354-7b98-4d0e-ad07-c36b86283947) has no changed prerequisite; no retry, host repair, or other child launch was attempted. The user-authorized self-review fallback applies.

- 6.1: `config.ts` accepts optional typed native thinking levels, rejects unknown/null/numeric values, reports the configured level or host default, and does not inherit Pi's coding thinking. `translation.ts` passes reasoning into the isolated options/cache key and discards thinking/signatures from successful text results. Thinking-only, tools, truncated/error/aborted output still fails. Tests exercise exact medium options, cache separation by medium/high, text-only cached and TTS output, and unchanged main-session input.
- 6.2: README/compatibility and owning proposal/design/spec/tasks describe this amendment. Installed offline listing and the provider's static model metadata confirm the exact concrete model and medium support. The approved user config gained locale vi and translation provider/model/thinking while preserving its existing voice and ElevenLabs model. Its production parser validates it; no credentials, profile, or Pi settings were edited and no paid call was made.

Validation: primary LSP clean on five changed source/test files; `npm run check` exit 0, typecheck clean, 278/278 tests pass; strict OpenSpec validation exit 0; actual user config parser validation exit 0; session lens has no blocking errors. A first config-validation eval failed from a literal newline inside a quoted string; correcting the check script made it pass without any product-code change. The initial static metadata probe used a nonexistent getModel export; declarations corrected that probe to the installed provider factory. Neither failure issued inference.

## Round 1 - Caller Self-Review (Oracle unavailable)

Gate consumed: 6.3, one FULL review of the entire completed Wave 6. This is writer self-review, not independent Oracle review. Coverage: all listed code/test/document/config changes against the amended contract; native request typing in Pi 0.87.1/0.99.2; omitted and configured reasoning; invalid config before requests; effective settings in cache identity; normally completed text with reasoning; rejection of reasoning-only/tools/incomplete output; limits, cancellation, replay, silence, preserved user TTS config and main-model isolation. Existing regression suite exercises unchanged paths. No new runtime dependencies, new service, or unrelated implementation changes are required.

Finding: P2, family live-translation-qualification, root account-and-language-evidence, in scope NO. Evidence: offline registry metadata and mocked medium-thinking tests do not verify real account auth, Vietnamese fidelity, latency, or billing; COMPATIBILITY.md retains those limits. DEFERRED_REASON: the approved scope excludes paid tests, and task 4.5 remains user-owned and open.

## Caller Assessment - Wave 6 Round 1

Finding: DEFER_OUT_OF_SCOPE under explicit no-paid-test approval; retain documented verification limits. No accepted in-scope P0/P1 blockers remain. Terminal check: target/source/inclusion/exclusion are unchanged and the final candidate (including the README command/skill clarification) was rechecked and matches sha256:1080ab400160b7464e93ee32cc53691f93e9620eca258c34dbb4fd966b0c2d50. That final documentation-only clarification does not alter the boundary or invalidate code/test evidence. Exactly one final Wave 6 gate exists. Source/test files remain below 500 lines. This does not replace the whole-change advisory size audit, which awaits completion or waiver of task 4.5.

REVIEW_ACTION=PASS
CONSENSUS_STATUS=MOSTLY_GOOD

Authorize completion of 6.1-6.3 from this whole-wave caller PASS; live translation and task 4.5 are not claimed complete.

## Wave 7 Review Sequence

BASELINE_TARGET=Wave 7 evidence-backed translation failures, tasks 7.1-7.3
BASELINE_TARGET_REVISION=sha256:4f2d5c1686181e51be55546e8c192a6658916529461664a2884003aa8dd7180d
BASELINE_SOURCE=Owning add-manual-speak-extension diagnostics requirement and design 8b; user request for logs/messages rather than guessed intermittent causes; explicit approval to edit existing untracked translation source/tests
BASELINE_INCLUSION_PREDICATE=extensions/speak/translation-failure.ts; extensions/speak/translation.ts; extensions/speak/speech-job.ts; extensions/speak/index.ts; test/speak/harness.ts; test/speak/translation.test.ts; test/speak/localized-job.test.ts; test/speak/diagnostics.test.ts; extensions/speak/README.md; extensions/speak/COMPATIBILITY.md; consistency with the diagnostics requirement and preserved original/text/replay/silence boundaries
BASELINE_EXCLUSIONS=Live paid calls and past-incident root-cause claims; user configuration or model/thinking/locale changes; raw provider payload logging; other extensions or working indicators; publication/dependencies; unrelated pre-existing changes; task 4.5

Digest is UTF-8 relative path + NUL + bytes over the ten files in inclusion order. OpenSpec progress/status prose and this review log are bookkeeping, not candidate digest inputs. Preserve the single final gate 7.4 for the whole numbered wave.

## Round 1 - Implementation Assignments

Selected reviewer: oracle. Selected default implementation specialist: worker, overridden to Orchestrator for all non-gate assignments under the user's existing ownership restriction. Focus mode: normal. User approval clears the prior untracked-file edit blocker; no unrelated untracked paths were touched. The reconciled Oracle launch failure has unchanged missing host-package prerequisites, so no launch retry, foreground/CLI substitution or host repair was attempted. Existing explicit caller self-review authorization applies, not independent review.

Ordered assignments, all Orchestrator-owned:

- 7.1: translation.ts plus the small translation-failure.ts schema/error module and translation.test.ts. Failures retain observed stage, known stop reason, structural counts, bounded identifiers and timing; unknown exceptions discard payloads. Normal thinking-plus-text behavior remains unchanged. Cached output-length validation now runs inside the translator so it can emit the same diagnostic without new inference.
- 7.2: index.ts routes native appendEntry into each localized job; speech-job.ts records once only while current, and appends the random diagnostic ID to the existing notification only after the sink returns successfully. Harness/diagnostics tests cover routing, privacy, counts, unknown exceptions, distinct explicit attempts, failure of the sink, no TTS/player calls, no conversation mutation, and native persistence/reopen. Existing lifecycle tests now assert no failure entries from stopped/stale jobs.
- 7.3: README/COMPATIBILITY document labels, metadata, finding the record, session-retention/no-session limits, missing structured HTTP status, best-effort persistence and unverified live behavior. Packaging, whimsical activity and user config are unchanged.

Verification: final primary LSP checks clean on all eight source/test files; npm run check exit 0, typecheck clean and 290/290 tests pass (including the existing whimsical suite); strict OpenSpec validation exit 0. Native Pi 0.87.1 persistence is exercised in the committed-style test suite; the installed 0.99.2 SessionManager check persisted/reopened the production failure record while preserving model context, with one mocked inference and zero TTS/player calls. The first 0.99.2 check compared serialized data with an object containing an undefined optional field; correcting the check to JSON semantics made it pass without a product workaround. No live provider request was made.

## Round 1 - Caller Self-Review (Oracle unavailable)

Gate consumed: 7.4, one FULL review after all non-gate assignments 7.1-7.3 and evidence completed. Reviewer: Orchestrator, not Oracle. Coverage: descriptor construction and all failure branches; auth/request deadlines; stop reasons and content counts; empty/thinking-only/unsupported/tool/markup/oversize output; unknown exceptions; cached validation; original/literal/replay bypass; current-job guards; sink failure; one correlated record/notification; no raw content/credentials; no agent-turn/message API; registry and native appendEntry compatibility; documentation and unchanged packaging/whimsical behavior. The isolated schema module owns the metadata contract rather than adding a general logging framework. Source/tests are below 500 lines; largest is speech-job.ts at 414 lines. This is a wave-local size observation, not the final whole-change audit, which still awaits task 4.5 completion or waiver.

No apparent P0/P1 blocker. Finding P2, family live-diagnostics-qualification, root past-incident-and-provider-evidence, in scope NO: the record pipeline and native storage are offline-qualified, but no new real TUI/provider failure was provoked and no evidence establishes the earlier incident's underlying cause. Evidence: COMPATIBILITY Wave 7 and the mock-registry test boundaries. DEFERRED_REASON: live paid verification and retrospective root-cause claims are excluded; HTTP status and raw payloads are intentionally not invented or logged.

## Caller Assessment - Wave 7 Round 1

Finding: DEFER_OUT_OF_SCOPE under the frozen live/past-cause exclusions; retain the explicit README/compatibility limitations. Zero accepted blocking/nonblocking or rejected findings. Writer self-review is weaker than independent Oracle review and is recorded accurately. Lens has no blocking errors; render complexity/fan-out/class-size and existing filter-map/non-null style advisories are nonblocking and do not justify speculative machinery or an unrelated refactor.

Terminal validation: the four boundary fields above remain unchanged; recomputed current candidate matches sha256:4f2d5c1686181e51be55546e8c192a6658916529461664a2884003aa8dd7180d. Exactly one final Wave 7 gate exists. Current-wave implementation and offline evidence pass; no source/config/paid-call scope was widened.

REVIEW_ACTION=PASS
CONSENSUS_STATUS=MOSTLY_GOOD

Authorize checking 7.1-7.4 complete from this whole-wave PASS. Task 4.5 remains user-owned and unverified. Runtime activation requires reloading the speech extension.

Commit step deferred: HEAD 8df9fac5471bd1fb3d2ff013bdbcbde80d8d7c51 lacks the earlier locale-wave SpeakConfig.translation and speakLocalized dependencies, which are pre-existing uncommitted work. A Wave-7-only commit would omit required prerequisites; staging whole files would also commit earlier-wave edits outside this bounded amendment. No staging/commit or cleanup was performed, and no next implementation wave was dispatched. Preserve the full working tree until its earlier-wave commit scope is explicitly resolved.

## Wave 8 Review Sequence

BASELINE_TARGET=Wave 8 idle-visible speech progress, tasks 8.1-8.2
BASELINE_TARGET_REVISION=sha256:e5b36fde194b3565541f6200e8794cfd6f8e10c0c27cfaba3a4412733307e5ff
BASELINE_SOURCE=User-approved separate progress line and continuation through /opsx-apply-loop; owning manual-speech Idle-visible speech progress requirement and design 8c
BASELINE_INCLUSION_PREDICATE=extensions/speak/speech-job.ts; test/speak/harness.ts; test/speak/progress.test.ts; extensions/speak/README.md; extensions/speak/COMPATIBILITY.md; consistency with the progress requirement and existing cancellation/cache/diagnostics boundaries
BASELINE_EXCLUSIONS=Whimsical/native Working/host changes; configuration/paid calls; additional logging/animation; packaging/dependency changes; task 4.5; unrelated and earlier-wave working-tree changes

Digest: UTF-8 relative path + NUL + bytes over the five inclusion files in listed order. Artifact status/checklists and this review log are bookkeeping, not digest inputs. One final gate: 8.3. First whole-wave review mode FULL; at most four Oracle rounds and one rebuild.

## Round 1 - Implementation Assignments

Selected reviewer oracle; selected default specialist worker overridden to Orchestrator under the existing user restriction; focus normal. All implementation is context-local main work. The user separately approved capturing this amendment and applying it; no other writers were launched. Earlier-wave dependencies remain uncommitted, so the same commit-scope limitation remains; no broad staging is authorized.

- 8.1, Orchestrator: `speech-job.ts` adds the existing native string-array widget API to its UI boundary and maps the four actual phases to a separate above-editor line. Existing current-job lifecycle owns clearing and prevents stale updates. Footer status remains. `harness.ts` exposes widget calls and optional failure; `progress.test.ts` owns 13 observable progress cases. No timers, host modifications, new runtime imports or generic UI layer.
- 8.2, Orchestrator: README documents location/phases/skips/cleanup/reload. COMPATIBILITY records identical widget APIs in Pi 0.87.1/0.99.2 and installed-terminal verification with controlled dependencies. A 100x32 pseudo-terminal ran installed Pi 0.99.2 offline/no-session with only a scratch wrapper of the production extension. Real UI widget events were idle=true in every phase; decoded screens showed each phase on row 20 above the editor, distinct from footer row 26. Status answered job: playing, stop cleared the row and ended the fake tracked player; Pi exit 0. Scratch `/tmp/pi-speak-progress-UXwow8/` holds ANSI captures and metadata, not repository artifacts. No live translation/TTS/acoustic check was made.

Verification: primary LSP clean for all three changed TS files; `npm run check` exit 0, typecheck and 303/303 tests pass; strict OpenSpec validation exit 0. Git diff for host, Whimsical and package.json is empty. Source/test sizes: speech-job.ts 430 lines, progress.test.ts 145 lines. The scope remains local UI-only, with existing egress/persistence and ADR decisions unchanged.

Oracle prerequisites changed since the reconciled prior launch failure: `@earendil-works/pi-coding-agent` now resolves from host/pi and a direct package import succeeds. Current executable-agent discovery lists oracle and worker. A fresh same-protocol read-only oracle review is therefore eligible; the old failed session is not reused. No host repair or install was performed by this task.

BASELINE_INVALIDATED=YES
Oracle's independent digest check found that progress.test.ts changed formatting after the original freeze (now 194 lines, mtime 2026-10-03T02:54:05.195Z). The caller re-read the complete test: the same assertions/scenarios remain; no production file changed. The actor responsible for formatting is not established. Do not restore or overwrite concurrent formatting. Target/source/inclusion/exclusions remain literally unchanged; this is a candidate-revision refresh, not a scope rebuild. Continue the first FULL whole-wave review against current bytes.
BASELINE_TARGET_REVISION=sha256:d06353e88b49e488673105b80c2c627c1f0bea5ce13610e9c11ba73aedd70bd6

## Round 1 - Oracle Review

Gate consumed: 8.3, the complete Wave 8 after both Orchestrator assignments 8.1-8.2. Independent read-only oracle run 520c3811-dae9-401f-966a-6ba2ba75c8e4 completed; durable output is `/home/zenji/.pi/agent/sessions/--mnt-8CE085C2E085B2CE-Src-Tools-ZenStudioLab-pi-toolset--/subagent-artifacts/outputs/520c3811-dae9-401f-966a-6ba2ba75c8e4/wave8-review.md`. No project/source writes, staging, commits or paid calls. FULL review of the current refreshed candidate, not a new round.

No concrete P0-P3 findings. Oracle verified synchronous Preparing, actual-phase updates, cache/bypass/replay skips, current-job cleanup, duplicate/stale isolation, and independent widget/footer error handling. It independently ran typecheck and 40 interaction/regression tests successfully, decoded all supplied ANSI captures (phase row 20, footer row 26; no speech row/footer after stop), and checked real idle=true widget updates in the wrapper evidence. Host/Whimsical/package diffs are empty. It independently confirmed the refreshed candidate digest at completion.

Limits retained: terminal captures were independently decoded rather than newly generated by Oracle; live provider latency/fidelity/billing/acoustics are excluded. Oracle had no LSP tool and used independent typecheck alongside the supplied parent LSP evidence. No broader architecture or implementation handoff is warranted.

PROPOSED_REVIEW_ACTION=PASS

## Caller Assessment - Wave 8 Round 1

Reconciled terminal oracle run: completed read-only output, zero project/source writes, successful typecheck plus 40 interaction tests, no findings and no blocker. There are no findings requiring disposition or remediation. Parent re-ran typecheck and all 13 progress cases after the formatting refresh; both passed. The earlier full 303-test check and real terminal evidence remain behaviorally current because only formatting changed.

Terminal baseline validation: literal target/source/inclusion/exclusions remain as frozen above; current recomputed candidate equals the latest recorded and Oracle-reviewed sha256:d06353e88b49e488673105b80c2c627c1f0bea5ce13610e9c11ba73aedd70bd6. Exactly one final Wave 8 gate exists. Current source/test sizes are speech-job.ts 430 lines and progress.test.ts 194 lines. No new semantic or scope changes occurred during review.

REVIEW_ACTION=PASS
CONSENSUS_STATUS=APPROVED

Authorize completion of tasks 8.1-8.3 from this same whole-wave caller PASS. Task 4.5 remains user-owned and unverified; do not claim the full change complete or archive it. Runtime activation requires `/reload`. Commit remains deferred for the previously recorded earlier-wave uncommitted dependencies: no broad staging, source cleanup, or additional implementation wave is performed. All foreign working-tree files are preserved.

## Wave 9 Review Sequence

BASELINE_TARGET=Wave 9 provider quota and cost visibility, tasks 9.1-9.2
BASELINE_TARGET_REVISION=sha256:b8c18821ccf73385b574ce7bed4f4aa34a04639d903072f3c963a9cecd3238b2
BASELINE_SOURCE=User request for /speak quota and explicit approval; owning manual-speech Provider quota and cost visibility requirement and design 8d
BASELINE_INCLUSION_PREDICATE=extensions/speak/quota.ts; extensions/speak/index.ts; extensions/speak/speech-job.ts; test/speak/quota.test.ts; extensions/speak/README.md; extensions/speak/COMPATIBILITY.md; openspec/changes/add-manual-speak-extension/design.md; openspec/changes/add-manual-speak-extension/specs/manual-speech/spec.md; consistency with existing speech/cancellation/privacy boundaries
BASELINE_EXCLUSIONS=Live account or paid requests; guessed per-speech prices/PAYG total; local accounting; billing mutation/polling; host/Whimsical/configuration/packaging/dependency changes; task 4.5; unrelated and earlier-wave changes

Digest: UTF-8 relative path + NUL + file bytes over the eight inclusion files in listed order. Proposal/checklist status and this review log are bookkeeping, not digest inputs. Exactly one final gate 9.3; first FULL whole-wave review, at most four Oracle rounds and one rebuild.

## Round 1 - Implementation Assignments

Selected reviewer oracle; default specialist worker overridden to Orchestrator under the existing user restriction; focus normal. Implementation stays context-local; no implementation subagents. No new ADR (design 8d: same provider/read-only/no persistence). Commit remains deferred under the existing earlier-wave prerequisite limitation; do not stage their files as quota work.

- 9.1, Orchestrator: new `quota.ts` owns the fixed-origin authenticated subscription GET, deadline/body limit, sanitized errors, allowance calculations and provider-reported billing output. `index.ts` routes quota before the speech-mode restriction. `speech-job.ts` owns an independent pending-request identity, immediate feedback/prompt return, duplicate suppression, lifecycle abort and stale silence without touching speech widgets/state. `quota.test.ts` contains 17 observable provider/command cases including coexistence with speech and responsive stop. Only the environment key is required; no voice/config/player/cache/model prerequisites.
- 9.2, Orchestrator: owning proposal/design/spec/tasks amended in place; README and COMPATIBILITY document account-wide credits, separate overage/invoice, optional-data limitations, privacy and reload. Official subscription/billing docs were fetched without credentials; endpoint/auth/fields are documented, but actual account values remain unverified. One initial offline test failed because its hand-written expected UTC timestamp was wrong; the expectation was corrected using `new Date(unix * 1000).toISOString()`, with no product change.

Verification: primary LSP clean for all four TS files; session lens diagnostics clean. `npm run check` exit 0: typecheck and 320/320 tests pass (17 quota cases). Strict OpenSpec validation exit 0. Git diff for package.json, host and Whimsical is empty; per-call safe.directory handles the mounted root ownership without changing global Git configuration. Source sizes: quota.ts 125, speech-job.ts 460, index.ts 133; quota.test.ts 201 lines. No user config, credentials, paid service or live account access occurred. All non-gate assignments complete; gate 9.3 reserved for independent whole-wave review.

BASELINE_INVALIDATED=YES
During initial FULL review, Oracle detected candidate reformatting after the freeze. The caller independently recomputed the same new digest and re-read quota.ts, the complete quota tests and the affected controller: observed changes are formatting/reflow, with the same operations, guards and assertions; actor is not established. Current sizes are quota.ts 143, speech-job.ts 466, quota.test.ts 268 lines (all three mtimes 2026-10-03T03:24:41Z). Other inclusion file sizes/mtimes are unchanged. No files are restored or overwritten. Target/source/inclusion/exclusions remain literally unchanged; this refresh is not a boundary rebuild or new review round. Parent reran typecheck and all 17 quota tests against these bytes, both exit 0. Continue the same first FULL whole-wave review against the refreshed candidate; independently verify current behavior and final digest.
BASELINE_TARGET_REVISION=sha256:128a2296e2dba2167746b6be6fbff779a2a34beeffcf85bacf64e488a3167dc0

## Round 1 - Oracle Review

Independent read-only FULL review, gate 9.3, covering all completed Orchestrator assignments 9.1 (provider/routing/lifecycle/tests) and 9.2 (docs/API evidence/validation/boundaries). Run cd10d18a-cc2a-4f4c-95ae-4a8cae77cc8c completed; durable output: `/home/zenji/.pi/agent/sessions/--mnt-8CE085C2E085B2CE-Src-Tools-ZenStudioLab-pi-toolset--/subagent-artifacts/outputs/cd10d18a-cc2a-4f4c-95ae-4a8cae77cc8c/wave9-review.md`. No project writes, staging, commits, live credentials or account/paid calls.

No concrete P0-P3 findings. Oracle reviewed all eight inclusion files plus proposal/tasks. It verified quota.ts required/optional field handling, account calculations and separate billing figures; fixed-origin GET, auth, manual redirects, deadline, response cap and safe failures; index.ts routing before the speech restriction; and independent controller identity/duplicates/cleanup/stale guards without speech/widget/cache/persistence effects.

Independently passed typecheck, strict OpenSpec validation and 62 quota/progress/command/job/silence tests (including all 17 quota tests). Scoped Git checks found no host/Whimsical/package/package-lock diffs or staged files. Completion digest equals refreshed sha256:128a2296e2dba2167746b6be6fbff779a2a34beeffcf85bacf64e488a3167dc0; this remained the same first FULL review, with no scope/ownership change or rebuild.

Limits: parent LSP/full 320-test evidence was not independently reproduced; Oracle had no LSP tool. Official API claims were checked against supplied sources/COMPATIBILITY, not re-fetched (its curl attempt was blocked by tool policy before execution). Actual quota, permission, invoice accuracy, live transport, paid speech/translation/acoustics and task 4.5 remain unverified. No implementation handoff or further hardening is warranted.

PROPOSED_REVIEW_ACTION=PASS

## Caller Assessment - Wave 9 Round 1

Terminal run reconciled: completed read-only review, no project writes/partial effects, typecheck/62 regressions/strict validation passed, no findings or blocker. No finding requires disposition or remediation. The new Oracle section contains exactly one advisory proposal; it is not treated as branch authority.

Terminal baseline validation: target/source/inclusion/exclusions literally match the Wave 9 frozen boundary; parent recomputation equals the latest recorded and Oracle-reviewed sha256:128a2296e2dba2167746b6be6fbff779a2a34beeffcf85bacf64e488a3167dc0. Formatting refresh did not change scope; parent typecheck/17 quota checks and independent 62-case regression are current. Session lens diagnostics are clean. Exactly one final gate 9.3 exists after both non-gate assignments.

REVIEW_ACTION=PASS
CONSENSUS_STATUS=APPROVED

Mark 9.1-9.3 complete from this whole-wave caller PASS. Quota is implemented and offline-qualified; actual user quota/permissions/invoice remain unverified. Task 4.5 remains user-owned and unchecked, so do not claim full-change completion or archive. Activate via `/reload`, then `/speak quota`. Commit remains deferred under the previously recorded earlier-wave uncommitted prerequisite limitation; nothing is staged or committed, and unrelated work is preserved.

## Wave 10 Review Sequence

BASELINE_TARGET=Wave 10 evidence-backed quota failures, tasks 10.1-10.2
BASELINE_TARGET_REVISION=sha256:c47553ac60a27a64d02b5025d7cb42a7b453f49a41be4658472a51f4c47de530
BASELINE_SOURCE=User-reported quota HTTP 401 and explicit approval of safe provider-code diagnostics; owning Provider quota and cost visibility requirement, design 8d correction, engineering failure-feedback contract
BASELINE_INCLUSION_PREDICATE=extensions/speak/quota.ts; test/speak/quota.test.ts; extensions/speak/README.md; extensions/speak/COMPATIBILITY.md; openspec/changes/add-manual-speak-extension/design.md; openspec/changes/add-manual-speak-extension/specs/manual-speech/spec.md; unchanged command/controller lifecycle and privacy integration
BASELINE_EXCLUSIONS=Live account requests or credentials; claiming the user's actual 401 cause; changing key/config/permissions; raw error/message/request data; new logging/persistence/retries; speech/host/Whimsical/packaging/dependencies; task 4.5; earlier-wave/foreign changes

Digest: UTF-8 relative path + NUL + bytes of the six inclusion files in listed order. Tasks/status and this log are bookkeeping. One final gate 10.3, first FULL whole-wave review, maximum four rounds and one rebuild. Existing log remains one artifact under the apply workflow's explicit single-log convention.

## Round 1 - Implementation Assignments

Reviewer oracle; default specialist worker not dispatched under the user's restriction; focus normal. All non-gate work is context-local Orchestrator-owned. Same-provider diagnostic correction needs no new ADR. No configuration/account access or source cleanup/staging; preserve earlier prerequisites.

- 10.1, Orchestrator: `quota.ts` factors the existing streamed JSON reader for successful/error responses (64 KiB/4 KiB respectively), retaining HTTP evidence if error parsing fails. Show only token-shaped provider type/code/legacy status (maximum 64 characters each; key exclusion), omit all message/request/body data, and use structured permission/authentication codes before conservative HTTP fallback. Unexplained 401 no longer declares a key invalid. `quota.test.ts` adds five cases covering modern auth/permission codes, legacy status, unknown/unsafe/key-shaped identifiers, and oversized/unreadable error bodies. Existing exact request/no-retry/privacy/lifecycle tests remain.
- 10.2, Orchestrator: update owning design/spec and README/COMPATIBILITY in place; record user-observed HTTP 401 but no actual cause. Official Errors page verifies detail.type/code/status; API-key docs verify endpoint scopes and expiry. No live provider request made. The earlier caller message lost evidence by discarding the body; this correction improves the next result rather than claiming to recover it.

Verification: clean primary LSP for both changed TS files and clean session lens diagnostics. `npm run check` exit 0, typecheck and 325/325 tests pass (22 quota cases). Strict OpenSpec validation exit 0. Package/package-lock/host/Whimsical scoped diff empty. Current sizes quota.ts 169, quota.test.ts 319 lines; no decomposition is needed. All non-gate assignments complete, gate 10.3 reserved for independent review. Actual quota access and past 401 cause remain unverified; commit remains deferred under the previously recorded earlier-wave prerequisite limitation.

BASELINE_INVALIDATED=YES
Oracle detected candidate reflow after initially matching the freeze. Parent independently recomputed the current digest and re-read quota.ts and the affected tests: observed differences are formatting, not changed operations/guards/assertions. Current sizes quota.ts 187 and quota.test.ts 363, both mtimes 2026-10-03T03:45:08Z; other inclusion sizes/mtimes unchanged. Actor cannot be established from these observations, and no host/process/config changes are authorized or made to stop an unidentified formatter. No current source is restored or overwritten. Target/source/inclusion/exclusions stay literally unchanged; this is a revision refresh, not a rebuild/new round. Current typecheck and all 22 quota cases pass again. Continue the same first FULL whole-wave review against current bytes, checking the final digest for further drift.
BASELINE_TARGET_REVISION=sha256:cc2e778a3583e03a338ff4b807556eb0fae570f3278e00128ce4463f0dfa1cba

## Round 1 - Oracle Review

Gate 10.3, FULL whole-wave review of Orchestrator tasks 10.1-10.2. Independent read-only oracle run 36889b02-85fa-4a36-821c-2112d485be1f completed; durable output `/home/zenji/.pi/agent/sessions/--mnt-8CE085C2E085B2CE-Src-Tools-ZenStudioLab-pi-toolset--/subagent-artifacts/outputs/36889b02-85fa-4a36-821c-2112d485be1f/wave10-review.md`. No project writes, restored bytes, live requests, credentials, staging, commits or implementation handoff.

No P0-P3 findings. Oracle verified the 4 KiB error cap, retained HTTP evidence, safe identifiers/key exclusion, structured-code-first guidance and conservative unexplained 401, unchanged request/64 KiB success handling, stale controller/router guards, and consistent docs/spec distinction between classifier verification and actual-account diagnosis. All five new cases protect distinct current failure modes.

Independent typecheck and 48 quota/command/progress regressions passed, including all 22 quota cases. Eleven additional offline scenarios passed for exact response limits, streamed success, identifier/schema/privacy checks and stale failed-lookup isolation. Staged paths and scoped host/Whimsical/package/dependency diffs were empty. LSP and strict OpenSpec evidence were parent-supplied rather than independently rerun. Original rejection cause, account access/billing/live transport remain unverified.

Completion digest matched the refreshed candidate sha256:cc2e778a3583e03a338ff4b807556eb0fae570f3278e00128ce4463f0dfa1cba, with unchanged boundary and ownership and no further drift. The same first FULL review continued after the recorded refresh; no rebuild or additional review round occurred. Reflow actor remains unidentified.

PROPOSED_REVIEW_ACTION=PASS

## Caller Assessment - Wave 10 Round 1

Terminal oracle run reconciled: read-only completion, no project/partial writes, independent typecheck/48 regression cases plus 11 offline boundary scenarios passed, no findings or blocker. The newly appended section has exactly one advisory proposal. No finding requires a disposition/remediation; caller separately owns the terminal action.

Terminal baseline validation: literal target/source/inclusion/exclusions match the frozen Wave 10 boundary; parent recomputation equals the latest recorded and Oracle-reviewed sha256:cc2e778a3583e03a338ff4b807556eb0fae570f3278e00128ce4463f0dfa1cba. Parent typecheck/22 quota tests after reflow and independent regression evidence remain current; session lens is clean. Exactly one final gate 10.3 follows all non-gate assignments.

REVIEW_ACTION=PASS
CONSENSUS_STATUS=APPROVED

Mark 10.1-10.3 complete from this same whole-wave caller PASS. This completes the diagnostic correction, not recovery of actual quota access or diagnosis of the original 401. No agent live request was made. User may reload and explicitly retry `/speak quota` to obtain safe provider evidence. Task 4.5 remains unverified; full change is not complete/archive-ready. Commit remains deferred under the established earlier-wave prerequisite limitation; no staging/commit or foreign-work alteration.

## Wave 11 Review Sequence

BASELINE_TARGET=Wave 11 same-project/current-session/active-transcript selection after compaction and persisted resume, tasks 11.1-11.3
BASELINE_TARGET_REVISION=sha256:c7dd1120d66e42f77a4a18700fa53209c5dc6f83a0429c0df02ef139b0bf00f8
BASELINE_SOURCE=User-requested compaction/resume handling and same-project/same-session/no-failed-turn-fallback decisions; approved owning manual-speech Answer selection requirement and design decision 3; current explicit user clarification self-verification
BASELINE_INCLUSION_PREDICATE=extensions/speak/session.ts; extensions/speak/index.ts; test/speak/harness.ts; test/speak/session.test.ts; test/speak/command.test.ts; test/speak/session-resume.test.ts; extensions/speak/README.md; extensions/speak/COMPATIBILITY.md; openspec/changes/add-manual-speak-extension/proposal.md; openspec/changes/add-manual-speak-extension/design.md; openspec/changes/add-manual-speak-extension/specs/manual-speech/spec.md; unchanged silence/lifecycle/cache/replay/quota integration
BASELINE_EXCLUSIONS=Oracle or writer delegation in apply; paid/live model/TTS/account calls; user saved-session/config/settings/permission changes; session scanning or new answer/branch persistence; fallback/summaries/context-only speech; packaging/dependency/host/Whimsical changes; task 4.5; historical-wave/foreign work

Digest recipe: UTF-8 relative path + NUL + exact bytes of the eleven inclusion files in listed order. Tasks/status and this shared log are bookkeeping. The existing single-log command contract takes precedence over splitting this historical review document. One final whole-wave self-verification gate is task 11.3; no Oracle round, proposal or independent approval is invented.

## Round 1 - Implementation Assignments

Selected default specialist `worker` remains metadata only. Owner for 11.1, 11.2 and final self-verification 11.3: Orchestrator, context-local, focus normal. The latest user clarification explicitly retains self-verification, superseding the pasted command's default Oracle cadence for this wave only. No delegation or session reuse occurred. Herdr tab was renamed to the change; the current Pi header name cannot be set through an available main-agent tool, and no session-file workaround was used.

Existing dirty and untracked speech/locale/diagnostics/quota work is preserved. Baseline copies of the intended files were taken under `/tmp/pi-speak-wave11-baseline-FLugSL/`; no repository backup artifact, staging or reset was created. All earlier-wave checkboxes and reviews stay historical. No new ADR: this changes selection mechanics, not ADR-0002/0003's approved manual-only egress or privacy boundary.

- 11.1, Orchestrator, `session.ts`/`index.ts` and session/command/harness tests: add one selector boundary that matches the stored header's absolute normalized cwd before reading `getBranch()` and extracts only original `message` entries. Reuse the existing latest-turn eligibility and text-block selector; both answer modes share the new input. No filesystem read, remembered-answer state, model-context projection or whole-session scan is added. The harness supplies real native managers instead of implementing selection in a mock. Real compaction, hidden latest failures, active-branch navigation, empty/no-user and project refusals pass. The proposal review's accepted nonblocking context-edit reminder is resolved by real replacement/omission fixtures proving original transcript text wins.
- 11.2, Orchestrator, new `session-resume.test.ts` and README/COMPATIBILITY: isolate restart/persistence behavior in a cohesive suite using disposable test-owned sessions. Native synchronous persistence/reopen restores compacted active-branch success before another prompt; hidden latest failure, branch navigation, another same-project session and another project's cwd override do not reuse another answer. Original and localized routes use production selector/controller with mocked providers/player. Documentation names both API signatures and distinguishes restored transcript from cleared replay/translation memory; owning proposal/design status is synchronized without changing requirements.
- Final task 11.3 is reserved for the next whole-wave caller self-verification assessment; checkboxes remain pending until its caller-owned PASS. Initial primary LSP was clean; focused suites passed 48/48 against repo Pi 0.87.1 and installed Pi 0.99.2. Restoring only the baseline router through a subprocess loader produced four expected `no-turn` assertion failures in the compacted-command cases, with no repository mutation. Initial `npm run check` passed typecheck and 348/348 tests, and strict OpenSpec validation passed. Final checks below qualify the frozen post-format candidate.

## Whole-Wave 11 Caller Self-Verification - Task 11.3

This is the explicitly requested main-agent self-verification, not Oracle review or independent approval. It covers all Orchestrator assignments 11.1-11.2 and the same final task 11.3; no per-task gate or subagent was used.

Final primary LSP diagnostics checked all six changed TypeScript files: clean, zero diagnostics. Final `npm run check` exited 0: typecheck and 348/348 tests passed, none failed/skipped/cancelled, including speech silence, cancellation/lifecycle, diagnostics, translation/audio caches, replay and quota plus Whimsical regressions. `openspec validate add-manual-speak-extension --strict` exited 0. Focused native-session/router/resume suites passed 48/48 on Pi 0.87.1 and installed 0.99.2; the latter used an inline Node `registerHooks` resolver only for test imports of the native SessionManager module, with production code unchanged. The baseline-router comparison failed all four expected compacted-command cases with exactly the old `no-turn` refusal rather than a missing-export or loader error.

Scoped before/after diff inspection against the task-start snapshot confirms the production change is only the new header/branch selection boundary and routing input; no speech controller/provider/cache/quota/lifecycle implementation is changed. `git diff --check` exited 0. Package, lockfile, host and Whimsical scoped diffs and staged diff remain empty. No user saved sessions/config/credentials were accessed, no process player or live service was used, and no paid request occurred. All persistence is under disposable test-owned harness directories, removed by cleanup.

Source/tests touched by this wave are below 500 physical lines. The new resume suite owns persistence/restoration behavior separately from selection eligibility. Whole-change Step 14 audit is not run or reused because user-owned task 4.5 remains unverified; no archive recommendation is warranted. Session lens found no blocking errors; its only findings are MD024 duplicate-heading warnings for the command-prescribed wave-local round headings in this single shared historical log. They are retained under that explicit log contract, not used to rewrite old evidence.

The ancillary `openspec list --json` root check first exceeded a 10-second tool budget without writes. A bounded 15-second retry exited 0 and confirmed the nearest project root and this active change. No failed work or side effects were replayed.

## Caller Assessment - Wave 11 Self-Verification

No in-scope P0/P1 product blocker remains. The proposal reminder `acceptance-coverage` / `original-transcript-context-edit` is ACCEPT_NONBLOCKING and resolved: governing spec Answer selection and design decision 3 require original answer text, and real context replacement/omission cases now verify that behavior. No independent approval or new Oracle findings are claimed.

Terminal baseline validation: the literal target, source, inclusion predicate and exclusions remain the four recorded Wave 11 fields. Recomputed current candidate equals the latest frozen candidate `sha256:c7dd1120d66e42f77a4a18700fa53209c5dc6f83a0429c0df02ef139b0bf00f8`; no drift or boundary change occurred. Current source, docs and verification qualify the whole wave. Tasks/status and this log remain bookkeeping outside the digest.

REVIEW_ACTION=PASS
CONSENSUS_STATUS=APPROVED

Authorize tasks 11.1-11.3 complete from this whole-wave caller self-verification. Task 4.5 remains unchecked; progress becomes 46/47, not full-change completion. Live TUI narration of a real model answer, provider acceptance, language/voice quality and billing remain unverified. Working-directory matching is lexical absolute-path normalization, not symlink/repository-root equivalence. Activation requires `/reload`.

Commit is deferred under the existing concrete prerequisite limitation: this wave's router/resume tests depend on earlier uncommitted locale code and fixtures (`extensions/speak/translation.ts` and `test/speak/translation-fixture.ts` are absent from HEAD). A coherent current-wave-only commit would omit those dependencies; blanket staging would incorrectly include earlier-wave/foreign work. No staging or commit is performed, and no next wave is entered. The retained implementation is verified in the present working tree; earlier-wave commit ownership must be resolved before committing an integrated release. No user live-provider action is requested or performed automatically.
