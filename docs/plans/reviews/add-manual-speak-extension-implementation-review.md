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
