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

---

## Locale amendment proposal review preparation

Invocation: `/omo-plan-review add-manual-speak-extension` in change-bundle mode. `/<name>` may refer to either a registered command or a loaded skill, depending on the active toolset.

selected reviewer: oracle
selected default implementation specialist: worker
focus mode: normal

Owner override: Orchestrator owns all Wave 5 implementation and spec/ADR work because the user permits only oracle delegation. Oracle registration was verified in this host; no other child is authorized. Existing implementation and test modifications, `.pi/`, and `.playwright-mcp/` were present before this amendment and are preserved. The Git ownership warning was handled only for read-only status with per-command `safe.directory`, not by changing global Git configuration.

BASELINE_INVALIDATED=YES
The earlier terminal review does not cover the user-requested locale/translation amendment or current bundle revision. Start FULL review of the amended bundle; one prior review-heading exists, so the next Oracle review is Round 2, with the existing four-round cap preserved.

BASELINE_TARGET=add-manual-speak-extension apply-ready change bundle
BASELINE_TARGET_REVISION=sha256:a5cd2e64adb6fd0d73ee06097e8a6ec327b36aaf2620c152d43131f0a17a552d
BASELINE_SOURCE=User request for English written Pi output and localized speech; user locale setting default vi; accepted original/literal bypass; current base speech implementation and ADR-0002; oracle-only delegation
BASELINE_INCLUSION_PREDICATE=Full four-artifact bundle consistency and feasibility for configurable speech locale, explicit isolated translation, cancellation, cache/replay, migration, privacy/cost boundaries, Wave 5 ownership and final review gate, and applicable ADR supersession
BASELINE_EXCLUSIONS=Implementation edits, user runtime configuration, actual translation-model selection, live paid verification, deferred summary/confirmation/secret-scan/cache-clear/accounting features, package publication, unrelated extensions and pre-existing work

Candidate digest uses the same relative-path-plus-NUL-plus-bytes order documented above. Canonical contextFiles remain proposal.md, specs/manual-speech/spec.md, design.md, and tasks.md under the existing change root. Strict OpenSpec validation passed; apply state ready, 21/28 tasks complete. Six pending locale tasks are new; existing task 4.5 remains unchecked because prior technical synthesis success does not establish user-confirmed voice quality or provider-visible billing.

ADR assessment: `/architecture-decision-record` is not registered at the checked global/project command locations; the available native `architecture-decision-records` skill supplies the equivalent assessment. ADR-0002 confines egress to one fixed TTS origin; isolated translation changes that accepted decision. Task 5.1 therefore requires ADR-0003 to supersede only the affected scope before implementation, preserving the accepted historical record. No ADR is written during this proposal-only amendment.

Session-name action was not performed: this tool surface has no session-name setter; no session file was edited to simulate the UI command. No Herdr tab operation was performed; environment check confirmed it is not applicable.

### Failed Oracle dispatch reconciliation

Workflow `080b6354-7b98-4d0e-ad07-c36b86283947`, attempted child `a1fa03bc-8ffe-4d86-90ff-f056b4a6843f`, key `locale-proposal-review`: terminal state failed, no child output. Receipt: `/tmp/pi-subagents-uid-1000/async-subagent-runs/080b6354-7b98-4d0e-ad07-c36b86283947/workflow-receipt.json`.

Exact launch prerequisite failure: Background children require the host npm package (`@earendil-works/pi-coding-agent`) with its dependencies; `/mnt/8CE085C2E085B2CE/Src/Tools/ZenStudioLab/pi-toolset/host/pi/packages/coding-agent` does not provide `@earendil-works/pi-coding-agent`, `@earendil-works/pi-agent-core`, `@earendil-works/pi-agent-core/node`, `@earendil-works/pi-tui`, `@earendil-works/pi-ai`, `@earendil-works/pi-ai/compat`, `@earendil-works/pi-ai/oauth`, `@earendil-works/pi-ai/providers/all`, `@earendil-works/chord`, `@earendil-works/chord/context`.

Repo/cwd: `/mnt/8CE085C2E085B2CE/Src/Tools/ZenStudioLab/pi-toolset`; primary worktree, branch `main`, HEAD `8df9fac5471bd1fb3d2ff013bdbcbde80d8d7c51`. The child failed before startup, so no child-written repository files or review evidence exist. Post-failure bundle digest equals the pre-dispatch digest; partial work consists only of the caller's four planning artifacts and this review log, with pre-existing code/test changes preserved. No launch retry, external CLI fallback, host repair, or other agent was attempted. The user's explicit prior permission to proceed with self-review when Oracle is unavailable authorizes the following fallback; it is not independent review.

## Round 2 - Caller Self-Review (Oracle unavailable)

Mode: FULL change-bundle review. Reviewer: Orchestrator, not Oracle. Coverage: full proposal/design/spec/tasks contents and amendment changes; command modes, locale default and validation, old-config migration, explicit translation authentication/cost, source isolation, no main-session mutation, source/output limits, no retry/fallback, stop/lifecycle races, translation/audio cache identities, replay, task ordering, one final Wave 5 gate, and ADR-0002 supersession need. The existing source config/job controller was read as evidence that locale/translation are not already implemented.

Uncovered: actual nested-call compatibility in both Pi versions (task 5.3), runtime locale behavior (Wave 5), translation quality, user model selection/authentication, and live billing. These are not claimed verified by proposal validation. The earlier 123-character TTS test qualifies no translation behavior and authorizes no further paid request.

### Findings

1. P2, family `historical-context`, root `base-release-present-tense`, in scope YES. Evidence: proposal.md Impact says the package "currently has no network egress" and design.md Open Questions still asks which player ships, although the base implementation now exists and uses ffplay. These are stale base-release descriptions; the locale amendment itself explicitly says the base release is deployed and the new wave is pending. SUGGESTED_CORRECTION: during task 5.5 documentation qualification, distinguish historical base-release context from current runtime facts. This does not change the locale implementation contract or block its bounded plan.

No P0/P1 blocker found. Six new non-gate/gate assignments form one coherent Wave 5; task 5.1 is the first pending task in that wave and precedes implementation. Original/text/replay exceptions, missing-model failure, and both-cache-hit versus restart behavior are explicit. Deferred summary/confirmation/secret-scan/cache-clear/accounting remain excluded.

## Caller Assessment - Locale Amendment Round 2

Finding 1: ACCEPT_NONBLOCKING. Governing source: accurate implemented/proposed distinctions in the proposal and engineering reporting requirements. CORRECTION: retain this historical-wording limitation as a task 5.5 documentation follow-up; no target edit or extra review cycle is justified by this P2 finding. No blocking, rejected, or out-of-scope findings; one accepted nonblocking finding. No Oracle proposal exists because its process never launched.

Terminal validation: the four frozen boundary fields above still match literally; recomputed SHA-256 equals `a5cd2e64adb6fd0d73ee06097e8a6ec327b36aaf2620c152d43131f0a17a552d`. Strict OpenSpec validation passed, apply state ready, and Wave 5 contains exactly six pending checklist items with one final Oracle gate. No implementation, live config, or paid-call changes were made in this amendment. Host diagnostics report no blocking errors; this is not execution-test evidence.

REVIEW_ACTION=PASS
CONSENSUS_STATUS=MOSTLY_GOOD

Proposal accepted with explicitly authorized self-review, not Oracle approval. Implementation remains pending and continues through `/opsx-apply-loop add-manual-speak-extension`. Translation provider/model must be selected explicitly during user setup; the plan does not pick or purchase one.

## Diagnostics amendment review preparation

Invocation: `/omo-plan-review add-manual-speak-extension`, change-bundle mode, requested through `/opsx-propose-loop`; user separately requested continuation with `/opsx-apply-loop`.

selected reviewer: oracle
selected default implementation specialist: worker
focus mode: normal

Owner mapping remains Orchestrator for Wave 7 non-gate tasks and all artifacts under the existing user restriction. One final whole-wave gate is task 7.4. ADR assessment: no new or superseding ADR; design 8b adds local metadata observability without changing ADR-0002/0003's egress, privacy or cost boundaries.

BASELINE_INVALIDATED=YES
The prior proposal PASS does not cover failure diagnostics.
BASELINE_TARGET=add-manual-speak-extension apply-ready change bundle
BASELINE_TARGET_REVISION=sha256:9f06f3c6c69d240c56a0d713e1be3166294664cb2badff9893e7d10917bc15a1
BASELINE_SOURCE=User reports intermittent translation failure and requests evidence-producing logs/messages instead of guessed causes; existing translation.ts, speech-job.ts, index.ts and Pi appendEntry declarations
BASELINE_INCLUSION_PREDICATE=Full four-artifact bundle consistency and Wave 7 feasibility for structured translation failure categories, metadata-only correlated session records, one notification, cancellation/stale-job silence, privacy, no retry/TTS after failure, offline tests and documentation
BASELINE_EXCLUSIONS=Diagnosis of the previous incident without evidence, paid calls, user configuration/model changes, other extensions or working indicators, new egress/dependencies, success logging/accounting, unrelated pre-existing modifications

Canonical contextFiles are the existing proposal.md, specs/manual-speech/spec.md, design.md and tasks.md. Strict validation passed; apply state ready, 30/35 tasks complete. Four Wave 7 tasks are pending; user live-provider task 4.5 remains unverified and is not an offline diagnostics prerequisite.

Oracle capability listing confirms registration. Read-only resolution from host/pi/packages/coding-agent still reports missing @earendil-works/pi-coding-agent, pi-agent-core, pi-ai and chord. This is the unchanged prerequisite of failed workflow 080b6354-7b98-4d0e-ad07-c36b86283947 documented above; no launch retry or alternate execution mode was attempted. The existing explicit self-review fallback authorizes the following caller review, not independent approval.

## Diagnostics Amendment - Caller Self-Review

Mode FULL; domain guidance plan-review-expert and review-convergence loaded. Coverage: full four-artifact bundle, current translation result/catch paths, speech job identity/cancellation and notification owner, router integration, appendEntry signature in repo dependency and host source, privacy/no-transcript boundaries, task order and one final gate. The planned descriptor distinguishes observed stop reasons/validation from unknown exceptions rather than promising unsupported transport diagnosis. Optional HTTP status is evidence-dependent. Persistence failures cannot replace the speech failure; cancelled/stale jobs cannot log into another session. Original/literal/replay modes, caches and TTS remain unchanged.

No P0/P1 plan blocker found. Uncovered: runtime sink behavior, installed-host persistence qualification, new failure tests, and the actual cause of the past incident; these remain implementation checks or explicitly unknown. Execution prerequisite: translation.ts and three related test files are untracked pre-existing work; the global preservation invariant requires explicit edit authorization before task 7.1. No code was modified or existing task checkbox marked complete.

## Caller Assessment - Diagnostics Amendment

No findings to reconcile; zero accepted blocking/nonblocking, deferred or rejected findings. Terminal check: boundary remains the five recorded fields above and the recomputed candidate digest matches the latest recorded revision. Strict OpenSpec validation passed. This qualifies the plan only, not implementation or independent review.

REVIEW_ACTION=PASS
CONSENSUS_STATUS=APPROVED

Continue via `/opsx-apply-loop add-manual-speak-extension` after authorization to edit the pre-existing untracked `extensions/speak/translation.ts` and `test/speak/{translation.test.ts,translation-fixture.ts,localized-job.test.ts}`. Preserve their existing behavior and all unrelated work; do not stage or commit pre-existing changes without accounting for ownership.

## Compaction and Resume Amendment - Proposal Review Preparation

Invocation: `/omo-plan-review add-manual-speak-extension`, change-bundle mode, from the current `/opsx-propose-loop` request. This is planning only; no implementation is claimed.

selected reviewer: oracle
selected default implementation specialist: worker
focus mode: normal

The current user requires both same project and same session, reports failures rather than skipping to older successful turns, asks about compaction/resume, and requests main-agent self-verification with no Oracle in apply. That explicit instruction supersedes the default apply-wave Oracle cadence for pending Wave 11, not the completed historical waves or this proposal review. All Wave 11 work is Orchestrator-owned: selector/router context is held locally and writer delegation adds no benefit. Proposal review remains independent and read-only.

BASELINE_INVALIDATED=YES
Earlier terminal proposal assessments do not cover the compaction/resume amendment. Select FULL; this log has one previous Oracle-heading, so the next Oracle heading is Round 2, within the existing four-round cap. No rebuild has been used for this amendment.
BASELINE_TARGET=add-manual-speak-extension apply-ready change bundle
BASELINE_TARGET_REVISION=sha256:ec3da9d761ff3385e9dba675b1e4e0b9ac774f2485ca310ac73c9539d407c9f8
BASELINE_SOURCE=Current user decisions: same project AND same session, report latest-turn failure, cover compaction and resume, self-verify apply without Oracle; existing speech source/tests; checked Pi SessionManager implementation and docs; HEAD 8df9fac5471bd1fb3d2ff013bdbcbde80d8d7c51
BASELINE_INCLUSION_PREDICATE=Full four-artifact bundle consistency and feasibility for same-project/current-session/active-transcript-branch speech selection after compaction and resume, latest-turn refusals, original text isolation, unchanged speech boundaries, Wave 11 ownership/self-verification and ADR assessment
BASELINE_EXCLUSIONS=Implementation edits or implementation approval, cross-session search, abandoned branches, summaries as speech, failed-turn fallback, paid calls, user session/config/permission edits, new egress/dependencies/persistence, publication, host/Whimsical changes, prior completed waves as new work, and unrelated pre-existing changes

Digest recipe remains UTF-8 relative path + NUL + exact bytes in order: proposal.md; design.md; specs/manual-speech/spec.md; tasks.md. Canonical apply contextFiles are those same four existing artifacts. Strict OpenSpec validation passed; schema spec-driven, apply state ready, 43/47 tasks complete. Pending tasks are 11.1-11.3 plus unrelated user task 4.5, which remains unverified; a working quota lookup does not qualify voice quality or billing.

Read-only evidence: with a real in-memory SessionManager, an ordinary user/assistant turn selects `last answer`; compaction retaining only the assistant gives roles `compactionSummary,assistant` and `no-turn`; retain-none gives only `compactionSummary` and `no-turn`. Both failing projections retain two original messages in `getBranch()`. No session files, providers or player were used. `getBranch` and `getHeader` are exposed in ReadonlySessionManager in both repo Pi 0.87.1 and installed Pi 0.99.2. Persisted resume is not yet qualified and is an explicit Wave 11 task. The initial broad-package reproduction timed out without useful output; the bounded session-manager-module reproduction exited successfully.

ADR assessment used the available native architecture-decision-records skill because the exact command is absent. ADR-0002/0003 were read: no new ADR is required; only design decision 3's selection mechanism changes, while manual-only answer egress, recipients, privacy/storage and publication stay unchanged. No submodule is implicated by this bundle. The existing all-done planning skip path does not run the session/tab rename step.

Working tree is already dirty with earlier speech/locale/diagnostic/quota source, tests and review artifacts; untracked `.pi/`, `.playwright-mcp/`, ADR-0003 and speech translation/quota files are preserved. This preparation changed only the four owning artifacts and this log, not source/tests. Git inspection uses a per-command safe.directory override after the observed ownership warning; no global Git configuration was altered. No staging or commits.

## Round 2 - Oracle Review

Reviewer: `oracle`. Mode: FULL change-bundle proposal review; focus: normal. Default specialist: `worker` (metadata only).

### Inherited decisions

- Review all four canonical artifacts against the literal latest baseline target, source, inclusion predicate and exclusions in the review log.
- Answer selection must remain within the current project, current session and active transcript branch. Recover original answers hidden by compaction; never speak summaries/context replacements or skip an ineligible latest turn.
- Wave 11 is Orchestrator-owned and self-verified, with **no Oracle in apply**. Historical completed waves remain historical.
- This review neither edits nor approves implementation.

**Baseline verification:** independently computed before review and at completion using the prescribed path-plus-NUL-plus-bytes recipe. Both matched:

`sha256:ec3da9d761ff3385e9dba675b1e4e0b9ac774f2485ca310ac73c9539d407c9f8`

No candidate drift detected.

### Diagnosis

The amendment addresses the evidenced cause directly. Current routing reads the model projection (`extensions/speak/index.ts:80-82`), which is not the original transcript.

Read-only, real in-memory SessionManager inspections independently confirmed identical behavior in repo Pi 0.87.1 and installed Pi 0.99.2:

- Full-turn retention preserves projection selection.
- Assistant-only and retain-none compaction produce projection `no-turn`; original branch messages retain the eligible answer.
- Compaction-hidden aborted, errored, truncated and tool-use completions remain `not-final`; an unanswered latest user remains `no-answer`.
- Context replacement changes projected speech text, while original branch selection retains original text.
- Branch selection excludes the abandoned answer.

These observations support feasibility, **not qualification of the pending production routing change**.

### Drift / contradiction check

No P0/P1 contradiction found. Proposal, design decision 3, amended selection requirement and Wave 11 agree. Tasks 11.1 → 11.2 → 11.3 provide implementation, persisted-resume qualification and final self-verification in dependency order.

The projection-based historical task 2.2 is explicitly superseded, not reopened. ADR-0002/0003 do not require model-context selection; unchanged recipients, explicit-request disclosure and storage boundaries support the recorded “no new ADR” assessment. No apply Oracle gate should be restored.

### Findings

**1. P2 — family `acceptance-coverage`; root `original-transcript-context-edit`; scope: in scope.**

- **Governing source:** `specs/manual-speech/spec.md:53` excludes context-only replacements; `design.md:66` requires original displayed answer text.
- **Evidence:** `tasks.md:97-99` explicitly names compaction, latest-turn refusals, branch isolation, project mismatch and resume checks, but does not explicitly require a context-edit fixture. The existing session tests contain none. Independent inspection demonstrated that projection selection returns `CONTEXT REPLACEMENT` where original-message selection returns `original`.
- **SUGGESTED_CORRECTION:** explicitly include a focused real-SessionManager context-edit fixture in task 11.1: replace or omit the selected answer’s model-context contribution and assert that production answer selection still uses its original transcript text. This is a nonblocking verification clarification, not a new behavior or review gate.

P0: none. P1: none. P3: none.

### Recommendation

The bounded proposal is feasible and coherent. Reconcile the P2 clarification without widening scope. Persisted-resume qualification remains pending; do not mark Wave 11 complete from this review or the in-memory observations.

### Coverage / uncovered areas and risks

**Covered:** all four artifacts end to end; latest frozen baseline and prior assessments; selector/router and session/command/harness tests; SessionManager branch, projection, header and persistence/load behavior; both versions’ exposed APIs; ADR-0002/0003; speech-boundary consistency and Wave 11 ownership.

**Uncovered:** persisted-resume execution, proposed router/project-check execution, terminal behavior, live providers and billing. Existing write-producing tests were not run. LSP tooling was unavailable on this review surface; no substitute diagnostics or typecheck was claimed.

Residual implementation risks:

- Harness changes must expose the real manager/header boundary rather than implement selection in a mock.
- Missing/unusable header cwd must refuse before paid work, as design decision 3 requires.
- Resume fixtures must exercise the host-restored active branch; no extension-owned branch persistence is proposed.

Existing dirty/untracked work remained untouched. No project/log edits, saved-session/config access, network calls, staging or commits were performed.

### Need from main agent

No product decision required; caller reconciliation remains necessary.

### Suggested execution prompt

No implementation handoff or code approval is warranted in this proposal review. Return this text for caller append.

PROPOSED_REVIEW_ACTION=PASS

## Caller Assessment - Compaction/Resume Round 2

Mode: change_bundle / FULL. Workflow `e63d153e-83b8-4de1-9d45-1f7ca6364aeb` completed successfully; child `bdff3ab8-1a21-4807-841f-884b5bf6762c` returned the independent read-only proposal review above. Receipt: `/tmp/pi-subagents-uid-1000/async-subagent-runs/e63d153e-83b8-4de1-9d45-1f7ca6364aeb/workflow-receipt.json`. Actual child output: `/home/zenji/.pi/agent/sessions/--mnt-8CE085C2E085B2CE-Src-Tools-ZenStudioLab-pi-toolset--/subagent-artifacts/outputs/e63d153e-83b8-4de1-9d45-1f7ca6364aeb/compaction-resume-proposal-review.md`. Child write scope: none in the repository; report storage was host-managed. Verification comprised both Pi versions' in-memory branch/compaction/context-edit checks and full artifact review. No infrastructure blocker or product clarification remains. Terminal job is reconciled; no worker reuse or implementation dispatch is warranted in this proposal phase.

Finding 1 (`acceptance-coverage` / `original-transcript-context-edit`): in scope YES; decision ACCEPT_NONBLOCKING. GOVERNING_SOURCE: owning spec "Answer selection from the active branch" requires original transcript text, never a context-only replacement; design decision 3 distinguishes transcript from model context. CORRECTION: during existing task 11.1, include one focused real-SessionManager context-edit fixture (replacement or omission) that fails under projection selection and succeeds only with the original selected transcript answer. This is a verification reminder in apply context, not a new product behavior, scope expansion, target edit or review gate. No P0/P1 or other finding was reported. Counts: accepted blocking 0; accepted nonblocking 1; deferred 0; rejected 0.

Terminal baseline validation: the literal target, source, inclusion predicate and exclusions remain those recorded immediately before Round 2. The current four-artifact candidate recomputes to `sha256:ec3da9d761ff3385e9dba675b1e4e0b9ac774f2485ca310ac73c9539d407c9f8`, identical to the latest recorded candidate and the review's completion digest. No candidate edits were made after review. Strict OpenSpec validation passed and apply state remains ready; Wave 11 checkboxes remain pending. Prior user task 4.5 remains unverified. This approval qualifies the proposal, not implementation.

REVIEW_ACTION=PASS
CONSENSUS_STATUS=MOSTLY_GOOD

Proposal review is complete. Continue with `/opsx-apply-loop add-manual-speak-extension` when the user starts apply after this planning presentation. Orchestrator implements and self-verifies Wave 11; do not dispatch Oracle in apply. Preserve all pre-existing changes and user-owned/untracked artifacts; no live paid calls, staging or commits are authorized.
