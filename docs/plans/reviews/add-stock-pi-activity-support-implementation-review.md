# Hybrid Activity Implementation Review

## Apply context

Using change: `add-stock-pi-activity-support` (schema: spec-driven).
Selected reviewer: `oracle`.
Selected default implementation specialist: `worker`.
Focus mode: `normal`.

Proposal review is caller-owned PASS after one independent FULL round with no findings. See [proposal review](add-stock-pi-activity-support-review.md). The user authorized automatic `/opsx-apply-loop add-stock-pi-activity-support` after that gate, including its scoped post-wave commit. No push, tag, version bump, npm publication, installed-host change, or global configuration change is authorized. `/<name>` may refer to either a registered command or a loaded skill, depending on the active toolset.

Apply CLI: state ready, 0/5 tasks complete, contextFiles proposal/spec/design/tasks under `openspec/changes/add-stock-pi-activity-support/`. Its generic mark-as-you-go instruction is overridden by the explicit whole-wave workflow: all checkboxes stay pending until caller PASS for wave 1.

## Wave 1 Review Sequence

### Frozen scope

BASELINE_TARGET=add-stock-pi-activity-support numbered wave 1 tasks 1.1-1.5
BASELINE_SOURCE=Reviewed hybrid change bundle sha256:2abe923bce1b24adde7b8a988520dbef197f5b6b8d890b04f5a7c589093c2d33; user hybrid choice B; public repository HEAD 06ce7daa28889905eaa27bcc5f14e5389130fa51
BASELINE_INCLUSION_PREDICATE=Compatibility ADR, exclusive stock/advanced entry selection, stock lifecycle/flags/cleanup, honest installation documentation, focused tests and offline real-host/packed-package qualification
BASELINE_EXCLUSIONS=Changes to advanced controller/preferences/bank/patch, host checkout or installed releases, other extensions, dependencies/lockfile, personal settings, provider behavior, live provider calls, version bump/publication/push/tag

The candidate revision will be frozen after all non-gate assignments and evidence are reconciled, before the first whole-wave Oracle invocation. No Oracle gate has been consumed; no rebuild used.

### Baseline repository state

Public root: `main`, HEAD `06ce7daa28889905eaa27bcc5f14e5389130fa51`, empty index, no tracked modifications before worker launch. New docs/openspec files are this task's orchestrator-owned work. Optional ignored host checkout: detached `005af57d88ee23b33778f343a9595b32e67ff788`, empty index, existing advanced patched files and untracked source/tests; preserve them all. That checkout is test/reference input, not a writer target or submodule commit target.

Before-worker root/host status, full binary diffs, index diffs, HEAD and untracked lists: `/tmp/.ctx-mode-u1HjgZ/pi-hybrid-apply-KUFL7I/`.

## Round 1 - Implementation Assignments

The sole final gate is task **1.5**, reserved for independent `oracle` review of every completed task 1.1–1.4. No per-task/interim review.

1. **1.1 — Orchestrator:** `docs/adr/0001-hybrid-activity-compatibility.md`. Delivered before writer launch; checked against the reviewed proposal/design/spec. Records capability selection, stock limitations and optional advanced authority. Status is accepted for implementation, not runtime-qualified. Checkbox remains pending for whole-wave acceptance.
2. **1.2–1.4 — worker:** one coherent writer for entry/stock implementation, focused tests, runtime/pack qualification, user READMEs and package description. Explicit modes: implementation, terminal-UI integration, testing, user documentation. No editor redesign or new visual language. Worker loads relevant engineering/testing/UI guidance itself. Preserve all excluded existing source and foreign work. Report exact changes, commands, full log/capture paths, exit codes, and residual risks; no spec/ADR/review-log edits or checkboxes, staging, commits, delegation, or review dispatch.
3. **1.5 — oracle:** only after caller reconciles all non-gate evidence; fresh independent FULL review of the entire numbered wave. The caller alone reconciles findings, chooses action, marks tasks, and commits after validated PASS.

One writer is retained for the related runtime/test/docs boundary to avoid duplicated context and overlapping edits. No suitable prior implementation session exists for this new stock-support contract; start a fresh worker. The original advanced implementation sessions and their old model override are not reused.

### Timeout reconciliation and recovery

Workflow `a97c0c38-98d3-4a1a-bf37-645bb8ed892d`, child `0d5adb37-762f-47b5-be02-720a038ef959`, terminated with verified timeout after 1,800,000 ms. Native status confirms timedOut and observed process termination. The automatic recovery summary failed to capture Git changes (reported not a Git repository); caller used explicit repository cwd and command-scoped safe.directory instead. Root remains main at the original HEAD; both indexes remain empty. No fallback execution protocol or model change is used.

Partial implementation consists of eight tracked edits (entry, three READMEs, package description, entry/network/published-host tests) and four new files: stock-presentation.ts, stock-presentation.test.ts, released-stock-render.mjs, and tty.ts in their respective extension/test directories. Caller read the runtime implementation and root README. Root OpenSpec/ADR/review content remained unchanged by worker, and the reviewed proposal digest still matches. Host diff/index/HEAD/untracked lists and all 2,160 baseline file hashes match the worker's captured baseline. Host status formatting differs because the caller included --branch; this is not a source change.

Durable recovered evidence: `/tmp/pi-hybrid-worker-qBg8Im/`. Final recorded exits: root-check-final 0 (typecheck and 114 tests), advanced-regressions 0 (3 files, 22 tests), released-render-final 0 (68 captures, 12 controlled calls, zero errors/network attempts), packed-render 0 (same coverage outside repository), inspect-pack 0 (14 allowed files match candidate bytes), cli-pty-check-3 0, diff-check 0. Earlier failed harness/test attempts are preserved with later successful checks; they do not erase final valid evidence. The interrupted final-snapshot/reconcile step has no completed exit record and remains unfinished; no final worker report or acceptance claim exists.

Caller captured current root/host partial diffs and identities in `/tmp/pi-hybrid-timeout-reconcile-b5m3pR/`. Earlier caller evidence under context-mode's nested temporary directory has expired; the worker's direct `/tmp` baseline and this new durable capture replace that unavailable path for recovery. No lost baseline is being treated as proof.

Recovery decision: fresh same-role worker, same native workflow protocol and scope, because failed/timed-out worker context must not be reused. Increase its explicit deadline from 1,800,000 to 2,700,000 ms (45 minutes). Recover only final reconciliation/report and genuinely missing/invalidated checks; preserve passed checks. No speculative edits or replay of completed side effects. The whole-wave gate 1.5 remains unconsumed and all task checkboxes remain pending.

### Recovered assignment reconciliation

Recovery workflow `2b5af33e-a1ac-48f3-a291-e19d23f9cb9d` and child `087ec573-fa48-401c-bf62-6706da0c23ff` completed successfully. Full report read: `/home/zenji/.pi/agent/sessions/--mnt-8CE085C2E085B2CE-Src-Tools-pi--/subagent-artifacts/outputs/2b5af33e-a1ac-48f3-a291-e19d23f9cb9d/worker/hybrid-wave1-recovered-handoff.md`. Recovery made no repository edits.

A source-freshness comparison found formatting-only changes in index.ts, stock-presentation.ts and tty.ts, plus a host-guide Markdown URL autolink, after the original interrupted snapshot. Supervisor request `d6679cff-9f03-40fc-ae6b-dba665cdf425` approved only fresh pack/inspection/packed rendering. Parsed TypeScript structure and complete diffs established no executable change; prior root/advanced/released-render evidence remains valid. Original unsuccessful setup/assertion attempts and the stale archive remain explicitly historical, not hidden or treated as current.

Fresh durable evidence: `/tmp/pi-hybrid-recovered-bz9uysgl/`. Parent inspected successful exit files for reconciliation-final, semantic-freshness-final, npm-pack, inspect-pack, packed-render and final-state. Parent independently confirmed all 41 current root snapshot hashes match, package.json differs only in description, the index is empty, and the current archive digest matches `91ab6c6ba5faedd5a4e8f4422d43ec4e4d54e17cd15902732cf194fd1550955f`. The archive has 14 current-byte files and no host checkout/tests/settings/dependencies. Root tests remain 114/114; advanced regressions 22/22; fresh packed stock0.99.2 evidence contains 68 captures/12 offline calls and zero errors/network attempts.

Parent read the runtime implementation, native released rendering harness, root README, and representative actual capture files for normal/reduced/plain/default restoration/retry/input. They show bank words on the real native border, preserved draft editor, native prompt controls, and restored Working/spinner. The harness uses real released loader/AgentSession/InteractiveMode/TUI with recording terminal I/O; retry/compaction events are controlled, startup probing is separately covered by CLI PTY startup/quit. These limits are documented. Stock0.87.1 evidence is loader/runner rather than full rendering. Primary TypeScript LSP diagnostics for index.ts and stock-presentation.ts returned zero diagnostics.

All non-gate assignments 1.1–1.4 now have reconciled deliverables and evidence. This is readiness for independent review, not wave acceptance. No checkboxes, commits, publication, upstream source, personal settings, dependency or lockfile changes have occurred.

### Candidate frozen for whole-wave review

BASELINE_TARGET_REVISION=sha256:62a1dad5d2c97a804e5f3374cffd3acf6efb7e19050222f9f45db8493aba1ab7

Digest algorithm: SHA-256 of each relative path + NUL + file bytes in lexicographic path order for the following thirteen wave-deliverable files. This identifies the reviewed candidate, not a new repository-cleanliness requirement.

- README.md
- docs/adr/0001-hybrid-activity-compatibility.md
- extensions/whimsical-activity/README.md
- extensions/whimsical-activity/host-patch/README.md
- extensions/whimsical-activity/index.ts
- extensions/whimsical-activity/stock-presentation.ts
- package.json
- test/whimsical-activity/entry.test.ts
- test/whimsical-activity/network-probe.ts
- test/whimsical-activity/published-host.test.ts
- test/whimsical-activity/released-stock-render.mjs
- test/whimsical-activity/stock-presentation.test.ts
- test/whimsical-activity/tty.ts

Consume sole final gate 1.5 through fresh independent oracle FULL review of tasks 1.1–1.4 and their evidence. Same four frozen boundary fields above; no scope expansion or rebuild. Reviewer findings are advisory and caller reconciliation remains mandatory.

## Round 1 - Oracle Review

Gate 1.5: FULL independent review of the whole completed numbered wave, tasks 1.1–1.4. Reviewer `oracle`; default writer `worker`; normal focus. Workflow `cda24134-a9ae-4340-bbaf-04af4c549261` and child `03c50d75-d9da-40c0-b567-e3386dfa8cdb` completed successfully. Full report: `/home/zenji/.pi/agent/sessions/--mnt-8CE085C2E085B2CE-Src-Tools-pi--/subagent-artifacts/outputs/cda24134-a9ae-4340-bbaf-04af4c549261/oracle/hybrid-wave1-round-1.md`.

Findings: **P0 none; P1 none; P2 none; P3 none.** Oracle independently recomputed matching bundle, thirteen-file candidate, and current archive digests. All fourteen archive entries match current repository bytes.

Owner coverage: orchestrator ADR 1.1; worker exclusive runtime selection and lifecycle/flags/cleanup 1.2; actual released-host/native render, tests and advanced regressions 1.3; honest documentation/package description/packed loading 1.4. Enumerable surfaces include three flags, four lifecycle handlers, advanced acceptance/refusal, capable/unsupported stock branches, eligibility, both setter cleanup paths, and archive contents. No stock timers, execution transformations, private-host runtime imports, competing renderers or editor replacement were found. Preserved advanced controller/preferences/selector/bank/patch, dependency lockfile and licenses match HEAD; package.json differs only in description.

Reviewed evidence includes 114/114 root tests and typechecking, 22/22 advanced regressions, stock released/current packed runs with 68 captures and 12 offline calls each, zero extension errors/network attempts, real CLI PTY startup/quit, and exact-byte packing. Oracle inspected actual normal/reduced/plain/restoration/input/retry/narrow captures and the complete formatting/autolink freshness diff. No test/build/pack reruns were needed.

Remaining qualification limits: stock0.99.2 regular terminal mode; 0.87.1 loader/runner only; controlled retry/compaction events rather than live failures/summarization; startup probing bypassed by render harness but startup/quit independently checked via CLI PTY. Shared-setter interference is an approved documented limitation. Current registry0.1.1 remains host-only. These are not findings or claims of universal terminal/host support.

PROPOSED_REVIEW_ACTION=PASS

## Caller Assessment — Round 1

Review target: numbered wave 1, gate 1.5; convergence mode FULL. Full Oracle artifact read and reconciled; reviewer made no repository changes. All worker results and timeout/recovery effects were already reconciled before gate dispatch.

Per-issue decisions: none, because Oracle returned no findings. Counts: accepted blocking 0; accepted nonblocking 0; deferred 0; rejected 0. No correction batch or rebuild is required.

Terminal baseline validation: all four frozen boundary fields literally match the authorized wave. The current candidate is still `sha256:62a1dad5d2c97a804e5f3374cffd3acf6efb7e19050222f9f45db8493aba1ab7`; the proposal bundle is still `sha256:2abe923bce1b24adde7b8a988520dbef197f5b6b8d890b04f5a7c589093c2d33` before completion tracking. No target drift occurred during review. Parent diagnostics remain clean for the two runtime TypeScript files; git diff --check passes, and the index is empty before authorized staging.

REVIEW_ACTION=PASS
CONSENSUS_STATUS=APPROVED

Task disposition: tasks 1.1–1.4 and this exact gate 1.5 can now be checked complete. Subsequent checkbox/review-log changes are completion tracking, not implementation changes. The ADR's original pre-qualification wording records its authoring point; this caller decision supplies the completed runtime qualification without rewriting the frozen design record.

### Whole-change oversized-file opportunity audit

The maintained handwritten extension/source and test tree contains no files above 1,000 physical lines. Host checkout, dependencies, fixtures and cohesive data banks were excluded. No decomposition task or unrelated cleanup is opened.

### Completion boundary

Commit only this change's scoped public-repository implementation, tests, documentation, ADR and OpenSpec/review artifacts, with `[add-stock-pi-activity-support]` postfix. Preserve the ignored advanced host checkout. No push, tag, version bump or npm publication. The feature remains unreleased until separate publication approval.
