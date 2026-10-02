# Manual Speak Extension Proposal Review

## Review handoff

Invocation: `/omo-plan-review add-manual-speak-extension` in change-bundle mode, from `/opsx-propose-loop`.
Selected reviewer: `oracle`.
Selected default implementation specialist: `worker` (not used: the user permits only the `oracle` subagent, so the Orchestrator owns all implementation).
Focus mode: `normal`.

The user's source guide (an externally produced implementation guide for a Pi speech extension) was trimmed to a v1 on the user's instruction; the omitted features are documented as Deferred Capabilities in `design.md` and required to report "unavailable" by the spec. The orchestrator retains reconciliation authority.

## Frozen proposal baseline

BASELINE_TARGET=add-manual-speak-extension apply-ready change bundle
BASELINE_TARGET_REVISION=sha256:a99624d1b429e741eed3228d6424984d8a686113045f48e4377acab542423f5b
BASELINE_SOURCE=User request to turn the speech-extension guide into an OpenSpec change with deferred features documented; pi-toolset HEAD a25e2b904fefb53cf1d9d4b208bbaaefcf18c0a5; installed Pi 0.99.2 and repo Pi 0.87.1 type declarations; existing whimsical-activity extension and ADR-0001
BASELINE_INCLUSION_PREDICATE=v1 /speak command contract, answer selection, text preparation, ElevenLabs request, cache/replay, playback and stop, lifecycle cancellation, secret handling, silence guarantees, deferred-feature documentation and unavailable-reporting, task ownership and wave gates, ADR need
BASELINE_EXCLUSIONS=Implementation code, the deferred capabilities themselves, package publication, live provider use, pricing or entitlement verification, other extensions, Pi or ElevenLabs changes

The revision is SHA-256 over UTF-8 relative path + NUL + file bytes, in this order: proposal.md; design.md; specs/manual-speech/spec.md; tasks.md. Paths are relative to `openspec/changes/add-manual-speak-extension/`.

Canonical contextFiles from the apply CLI:

- `openspec/changes/add-manual-speak-extension/proposal.md`
- `openspec/changes/add-manual-speak-extension/specs/manual-speech/spec.md`
- `openspec/changes/add-manual-speak-extension/design.md`
- `openspec/changes/add-manual-speak-extension/tasks.md`

## Preparation and authority

`openspec validate --strict` passed; apply state is `ready` with 21 tasks, 0 complete. `openspec list --specs` returned no specs. Untracked paths at review start are this change directory and `.pi/` (created earlier in this session by a settings preset load); no tracked file was modified.

ADR check: required. The change adds an explicit-request network path to a third-party paid service to a package with no network egress; recorded as task 1.1 (first task, Orchestrator). Existing ADR directory contains ADR-0001 only.

Owner mapping: Orchestrator owns every implementation task in waves 1-4 and all spec/ADR edits; `oracle` reviews each full numbered wave at its single final gate (1.6, 2.5, 3.5, 4.5). Read-only reviewers return artifacts; the caller appends them here.

Known facts to treat as evidence vs leads: Pi API symbols and the absence of `mpv` were verified read-only; ElevenLabs endpoint/model/pricing claims were NOT verified and are explicitly scheduled for re-verification (task 1.3).

---

## Round 1 - Oracle Review

REVIEWER=caller self-review (NOT an Oracle review). The `oracle` subagent could not be dispatched: the host did not expose the `subagent` tool after `subagents_enable`. The user authorized self-review in that case. Convergence mode: FULL (first review). Independence is weaker than an Oracle review because the same agent wrote and reviewed the bundle; the evidence below was re-derived by command rather than by memory.

Coverage: all four bundle files read end to end; spec requirements cross-checked against design decisions and tasks; Pi API claims re-checked against type declarations; environment claims (`mpv`, `ffplay`, `ffmpeg`, Node 22.19.0) re-checked by command; `openspec validate --strict` passed. Not covered: ElevenLabs behavior (unverified by design, task 1.3), real-terminal behavior (task 4.4), and any implementation.

### Findings

1. P2, family `spec-design-consistency`, in scope. `voiceSettings` appears in the cache key (spec, design 7, task 2.4) but the proposed config has no such field. Evidence: design.md config JSON versus cache-key line. SUGGESTED_CORRECTION: state that v1 sends no voice settings and fix the key field to `null`.
2. P2, family `spec-design-consistency`, in scope. Design 7 said a sidecar records data "for eviction and replay" while the spec clears the replay reference on session or branch change. Evidence: design.md decision 7 versus spec "Lifecycle cancellation". SUGGESTED_CORRECTION: make replay an in-memory pointer and drop the sidecar.
3. P2, family `spec-gap`, in scope. `/speak text` with no content is unspecified. Evidence: spec "Command contract" has no such scenario. SUGGESTED_CORRECTION: add a usage-help scenario.
4. P2, family `spec-gap`, in scope. Cancelled or failed generations may leave temporary audio; the spec does not forbid it. Evidence: spec "Single job and responsive stop". SUGGESTED_CORRECTION: add a no-residue clause to the stop-during-generation scenario and to design.
5. P2, family `process-consistency`, in scope. Task gates name `oracle` with no fallback, though the user authorized self-review when Oracle is unavailable. Evidence: tasks.md gates 1.6, 2.5, 3.5, 4.5. SUGGESTED_CORRECTION: add a review-fallback note to tasks.md that forbids describing a self-review as Oracle's.
6. P3, family `wording`, in scope. Stray backticks around "ElevenLabs" in proposal Impact. SUGGESTED_CORRECTION: remove them.
7. P3, family `readiness-risk`, in scope. Wave 4 gate 4.5 depends on task 4.4, which needs the user's key, voice, and terminal. Evidence: tasks.md 4.4. DEFERRED_REASON: already handled; 4.4 is explicitly allowed to stay unverified and be reported, so no artifact change.

No P0 or P1 finding. No contradictory requirement, no missing dependency between waves, no task without a verification statement, and no deferred feature implemented by a task.

PROPOSED_REVIEW_ACTION=PASS

---

## Caller Assessment - Round 1

### Review Mode

- `change_bundle`

### Convergence Mode

- `FULL`

### Review Subject

- OpenSpec change `add-manual-speak-extension`

### Per-Issue Evaluation

Findings 1-6 are the same author's own findings. Decisions: all `ACCEPT_NONBLOCKING`, in scope `YES`, `GOVERNING_SOURCE` for each is the change's own spec/design/tasks consistency (no user requirement is violated, so none qualifies as `ACCEPT_BLOCKING`). Corrections applied and re-validated: finding 1 in design.md decision 7; finding 2 in design.md decision 7; finding 3 as a new scenario in the spec's Command contract; finding 4 in the spec's stop-during-generation scenario and design.md decision 7; finding 5 as a Review fallback note in tasks.md; finding 6 in proposal.md. Finding 7 is `DEFER_OUT_OF_SCOPE` with the reason above.

### Summary

- **Issues accepted blocking:** 0
- **Issues accepted nonblocking:** 6
- **Issues deferred out of scope:** 1
- **Issues rejected:** 0

### Candidate revision after corrections

BASELINE_TARGET_REVISION_AFTER_NONBLOCKING_EDITS=sha256:9eebf857b95ca770c34879f5327b5441130df655e89aa6675a78c88413d31a4b
The corrections are clarifications only (no requirement removed or relaxed, no task added or removed, wave structure unchanged: 21 tasks). `openspec validate --strict` passed after the edits. The frozen target, source, inclusion predicate, and exclusions are unchanged; the recorded revision above supersedes the pre-review revision for any later terminal check.

### Caller Result

- `REVIEW_ACTION=PASS`
- `CONSENSUS_STATUS=MOSTLY_GOOD`

### Notes for the apply phase

- Self-review is weaker than Oracle review; if `oracle` becomes available, a proposal-level Oracle pass is optional, and wave gates should prefer it.
- Task 1.3 may invalidate design assumptions about ElevenLabs; if so, amend the artifacts before coding to the guide.
