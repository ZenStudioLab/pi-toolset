# Implementation Review — add-whimsical-activity-indicator

Using change: `add-whimsical-activity-indicator`. Schema: spec-driven. CLI progress: 0/8 tasks complete. Proposal review has current caller-owned PASS / APPROVED after Round 2 FULL; the exact five-file candidate is `sha256:6abc9353ba9cb1bc7588f7ee13020d275fa40ab2fd173ebc2f991938d7c14163`.

Selected implementation specialist: `worker`, the explicit user-approved override of unavailable `fixer`. Selected reviewer: `oracle`. Focus mode: normal. The orchestrator owns specifications, ADRs, caller reconciliation and task checkboxes. No checkbox is completed until its whole-wave Oracle gate and caller PASS. Session rename is unavailable through the exposed tools; no session/config files are edited to simulate it.

## Wave 1 Review Sequence

### Implementation Topology and Preparation

Host source target: separate Git checkout `host/pi`, detached v0.99.2 base `005af57d88ee23b33778f343a9595b32e67ff788`. It is ignored by the outer repo; it is not a submodule/gitlink. Host remains clean and unhydrated. Installed release and local package dependency pins are untouched. Foreign `temp/` and `openspec/config.yaml` are preserved.

Task 1.1 belongs to the orchestrator. Tasks 1.2–1.3 belong to worker in ordered bounded slices; task 1.4 is reserved for the only final whole-host-wave Oracle gate. Wave 2 remains pending until this gate passes and scoped commits are authorized/completed.

Before writer dispatch, partition independently testable host contracts: runner synchronous wait observation; native status decoration/rendering and its InteractiveMode integration; Loader monotonic frame behavior. Runner and Loader component handoffs precede the native integration owner. Use serial component writers/reconciled reuse to avoid overlapping exports/types/tests and artificial concurrent ownership. Preserve the task-level worker owner while bounding each assignment; no per-component Oracle gates are added. Exact component paths, handoff artifacts, and integration ownership are recorded before dispatch.

## Round 1 - Implementation Assignments

### 1.1 — Orchestrator ADR

Created `docs/adr/0009-native-activity-decoration.md` before any code changes. It records the approved cross-repository integration boundary and links to the owning design/spec rather than creating another specification. No prior ADR exists in local or host `docs/adr/`. Qualification is explicitly pending. Task checkbox remains unchecked until gate 1.4 passes.

### Execution/Commit Approval Prerequisite

Official provenance and immutable source identity were verified before checkout; Round 2 independently reviewed relevant source and the full proposal. Static manifests/lock inspection found npm-registry tarballs plus local workspace links, pinned tooling, 442 lock entries, and several transitive install-script packages. Root `prepare` installs Husky. `npm ci --ignore-scripts` is therefore the proposed hydration path, preserving the lockfile and skipping lifecycle scripts/hooks. Source `npm run check` includes Biome `--write`, metadata checks, TypeScript, and esbuild browser-smoke bundles; unrelated formatter edits must not be retained. Source test execution will be focused and offline, not the full suite. The inspected `pi-test.sh --no-env` starts source through its resolver and removes provider credentials; disposable agent settings/faux provider and isolated environment must also prevent reading live credentials.

Separate explicit approval is still required for executing newly discovered source tooling after this static review and for host scoped commits under `host/pi/AGENTS.md`. Proposed commands: host-root `npm ci --ignore-scripts`, host-root `npm run check`, coding-agent package focused `node <host-root>/node_modules/vitest/dist/cli.js --run test/<affected>.test.ts`, TUI package focused `node --test test/<affected>.test.ts`, and isolated/offline `./pi-test.sh --no-env` for PTY qualification. No full build/test suite, dependency update, model-data fetch, release/install/publish, or installed-package edit is included.

At the approval pause no worker had been launched, no source had been modified/executed, and no host commit had occurred. The user subsequently replied **approve**, explicitly authorizing the listed script-disabled hydration, source checks/focused offline tests/PTY checks, and scoped host commits after whole-wave PASS. This resolves the execution/commit prerequisite, not the implementation review gate.

### Ordered Component Assignments — Wave 1

Classification: multi-seam. Runner wait publication and Loader frame timing are independently testable; native status registration/rendering is the integration seam consuming both. Components run serially in the approved host checkout; only one writer owns it at a time. A committed handoff is not required before the whole-wave gate, so each component returns a managed report plus the actual working-tree diff as its durable handoff.

| Assignment | Owner / cwd | Exclusive contract and allowed edits | Next gate / dependency |
| --- | --- | --- | --- |
| H1-wait (task 1.2 component) | worker / `host/pi` | `core/extensions/runner.ts`, wait-state types in `core/extensions/types.ts`, existing exports if necessary, and cohesive runner wait tests. Publish depth/revision synchronously with initial snapshot, robust finish/invalidation, and observer error isolation; keep legacy events unchanged. No InteractiveMode or renderer edits. | Focused runner tests; parent reconciliation before H2. |
| H2-clock (task 1.3 component) | worker / `host/pi` | `packages/tui/src/components/loader.ts` and focused Loader tests. Clock-derived frame selection preserving public start/stop/setIndicator and cadence semantics. No native status/runner edits. | Focused TUI tests; parent reconciliation before H3. |
| H3-native (tasks 1.2–1.3 integration) | worker / `host/pi` | Native registration/types/UI consumers; coherent presentation helper; narrowly wired InteractiveMode producer/status/visibility paths; StatusIndicator/CustomEditor layout; host API docs and integration tests. Consume H1/H2, never reimplement their authorities. | Full host checks and focused native tests, then only final Oracle gate 1.4. |

H1/H2 are components, not Oracle boundaries. The orchestrator ADR (1.1) and all H1–H3 evidence must finish before task 1.4. Wave 2 has not started. Workers may not edit OpenSpec/ADR/review control, commit, delegate, mutate foreign files or install/publish anything. The parent records actual run IDs/artifacts and reconciles each result before dependent dispatch.

### Hydration Evidence

Authorized host-root `npm ci --ignore-scripts` completed with exit 0, adding 342 packages; full log `/tmp/whimsical-host-npm-ci-1790864644207.log`. Host Git status remained clean, including the lockfile. Actual PATH runtime is Node v22.19.0/npm 10.9.3, not the context sandbox's Node version. Optional example dependency Gondolin reports a Node >=23.6 requirement; its code is not part of this feature's focused checks. Autoevals reports package-manager engine advice; no lifecycle scripts were executed.

`npm audit --json --ignore-scripts` identifies one existing transitive `brace-expansion` high-severity denial-of-service family (GHSA-qhr7-859c-m2p7/GHSA-6j4f-fj2g-mc7p and related quadratic-expansion advisory). This is a known source-lock residual, not indicator-originated dependency/code. Tests use trusted local patterns, no exposed hostile glob input; no automatic `npm audit fix` or dependency change is authorized. Report it at delivery and keep this feature scoped.

### H1 Dispatch

Async workflow `9dc9a457-1064-450f-bb04-622513b4333d`, mission `f3aecdf4-4aed-4cab-b6a8-250a286f13b6`, starts the sole host writer for H1 only. Managed output is bound to `host/h1-wait-component.md`. The packet names the approved source/base, runner/types/test ownership, no commit/spec/delegation permission, exact focused test/check commands, and required handoff. H2/H3 remain undispatched until parent reconciliation of the terminal H1 result. Native completion is the revisit trigger; no polling or interim Oracle gate is used.

H1 child `b5cf1063-5333-4411-b39b-5f3b4eefd30c` requested a decision on invalidation with in-flight prompts. The parent approved preserving the old runner's singular depth and deployed legacy start/end finish behavior: invalidate synchronously clears new wait observers and rejects new prompts/subscriptions; old completions change only obsolete runner state and never notify revoked/current listeners. Do not zero depth or introduce another generation/depth authority. H3 must revoke old-runner subscriptions and use only the current runner. Tests must cover overlapping prompt invalidation, late completion silence, and unchanged legacy events. Supervisor reply `e48e11c7-0114-42be-9759-a103df08c3f4` was delivered; the later attention notice was stale (no pending request, child actively running).

H1 later reported auxiliary scan findings against unchanged `types.ts`: the deployed `BeforeProviderRequestEventResult = unknown` alias and documented `$PROXY_API_KEY` placeholder. Parent independently confirmed both in source HEAD at lines 1398/1768 and approved leaving them unchanged (supervisor reply `d9c03a7a-8aa2-4d0c-86ff-6e685e57dd2c`). They are baseline/false-positive scan findings, not permission to remove unrelated API behavior/documentation or add suppressions. Focused tests and full host check continue; new H1 diagnostics still require resolution.

H1's first focused Vitest attempt failed before collection because source provider catalogs were absent (`amazon-bedrock.json`; log `/tmp/h1-wait-focused-20261001-1.log`). The parent supplied offline setup by copying the pre-existing installed pi-ai **0.99.2** `dist/providers/data` directory into the previously absent, ignored host `packages/ai/src/providers/data`. All 42 JSON files match their installed SHA256 manifest (schema 6, structure hash `3e97a64c71ef31a515f668d9fbc653d49b3ece171d88bfd103001e963497661f`). No fetch/generator, live-package mutation, dependency/lockfile edit, or indicator-bank generation occurred. This task-owned ignored setup data is separate from worker source ownership. Supervisor reply `f0afb0d0-0c46-4b97-8f99-0bf9f669d467` authorizes rerunning the same source-local focused checks against this corrected prerequisite; source structure compatibility and actual test results remain to be confirmed.

H1 reproduced reentrant observer publication delivering revision 3 followed by stale revision 2 to a later listener. Parent selected current-state subscription semantics: reread the current snapshot before each still-subscribed listener, keeping synchronous suppression and nondecreasing revisions without a queued event framework. A later listener may receive a duplicate newest snapshot or miss a superseded intermediate state; consumers use depth/state, not callback counts. Actual depth transitions still increment revision once. H1 adds a focused nested-prompt regression, preserves captured legacy identity, and documents H3's snapshot semantics. Supervisor reply `3a4ed707-50ca-46e1-b89c-56b32eb4cc0d` delivered.

### H1 Terminal Reconciliation

Workflow `9dc9a457-1064-450f-bb04-622513b4333d` and child `b5cf1063-5333-4411-b39b-5f3b4eefd30c` completed successfully; process terminal is observed. The parent read the entire managed `host/h1-wait-component.md` report, inspected actual runner publication/finish/invalidation logic, new production-runner tests, and exact type/export diff. All five reported file hashes match the current candidate. Actual write scope is runner, prompt-state types and two required export lists, plus new cohesive 393-line `extensions-runner-ui-prompt-state.test.ts`; no native renderer/InteractiveMode/Loader, dependency/lock, local extension, specification, staging, or commit writes occurred.

Verified current evidence: final focused log shows **17/17 tests passed**; the full 38-line final host check log was read and shows all configured checks passing with formatting limited to the owned test. `git diff --check` passes. Initial missing-data collection failure is resolved by the documented local offline prerequisite. The parent found no component blocker in this bounded inspection; H1 is a ready durable component handoff, not whole-wave acceptance. Automatic runtime `review-required` remains satisfied only by the reserved gate 1.4 after H2/H3, not by an interim review.

H1 APIs are `getUIPromptState()` and `onUIPromptStateChange()` with frozen `UIPromptStateSnapshot { depth, revision }` and `UIPromptStateListener`. H3 must consume only the current runner, use snapshot depth rather than notification counts, and revoke subscriptions on native owner/session lifecycle changes. No task checkbox is completed yet.

The successfully completed/reconciled worker remains suitable for the related H2 native timing component. Its model/tool contract stays unchanged; resume only with H2's exclusive Loader/test edit boundary, preserving H1 files/hashes and evidence. H3 remains undispatched.

### H2 Dispatch

Async workflow `2fd0abe4-5c04-47f1-9bca-7ad33f9328a7` resumes the reconciled H1 worker for the exclusive Loader/timing-test component, using stable key `host-clock-component` and managed `host/h2-clock-component.md` output. It attaches to the existing implementation mission `f3aecdf4-4aed-4cab-b6a8-250a286f13b6`; agent/model/tools remain unchanged. H1 source and evidence must be preserved, no registration/native-integration edits are allowed yet, and focused TUI tests/full host check are required. Native completion triggers parent reconciliation before H3; no per-component Oracle review is authorized.

### H2 Terminal Reconciliation

Workflow `2fd0abe4-5c04-47f1-9bca-7ad33f9328a7` and child `c2521636-aa6b-4172-81a6-275eabe6a311` completed; process terminal is observed. Parent read the managed H2 report, the complete Loader and 217-line production test suite, and full host check log. Current H2 hashes match the handoff; all five H1 hashes remain unchanged. Actual H2 writes are only five insertions/one deletion in Loader plus the new focused timing test, with no public API, dependency, unrelated source, staging, or commit change.

Verified evidence: mutation-sensitive pre-change timing run failed 5/10; after the actual monotonic-origin change final tests passed **10/10**, zero skips/cancellations. Full host check passes; `git diff --check` passes. Node mock-timer experimental warning is test-tooling noise, not a new production diagnostic. `stop` freezes, `start` restarts the full cadence from the displayed frame, `setIndicator` resets frame/cadence and starts, and zero/one frames allocate no animation timer. H3 consumes these existing public controls only on the current native owner. No component blocker remains; whole-wave gate and checkboxes remain pending.

### H3 Integration Ownership

H3 is the native decoration integration seam, consuming ready H1 wait observation and H2 clock behavior. The existing successfully completed/reconciled worker retains related source context, model/tools, and explicit native-UI/logic/test responsibilities. It owns new registration/types/exports and no-op/RPC API consumers, a coherent native presentation helper, narrow InteractiveMode status/run/wait/visibility/reset wiring, StatusIndicator/CustomEditor composition, host API docs, and cohesive native integration tests. It must not rewrite H1 runner or H2 Loader authority without first reporting a concrete integration contradiction to the parent.

Actual producer coverage comes from the Round 2 inventory: runner waits; native selector/input/editor/dialog lifetimes; general selector displacement; asynchronous custom factories including noncapturing/hidden overlays; auth and delegated share/bug-report UI; TUI hidden/external-editor periods; native status/foreground settlement; reset/rebind/shutdown; print/RPC/non-TTY consumers. This is one supported native-surface contract, not a general compositor or independent agent lifecycle. Additional native producer edits are limited to necessary ownership/visibility hooks; unrelated cleanup, execution/model behavior and installed packages stay excluded.

The worker is explicitly assigned native UI/layout integration and rendered-validation mode against the approved design. There is no new aesthetic direction or designated visual specialist to override. Source-real terminal component/VirtualTerminal or isolated PTY evidence is appropriate; this TUI has no browser page. Only final gate 1.4 reviews the complete ADR/H1/H2/H3 host wave.

### H3 Dispatch

Async workflow `a29f36ed-b318-45ba-85d0-b512b5ab3718` resumes the latest reconciled worker for `host-native-integration`, with managed `host/h3-native-integration.md` output, a 45-minute bound, and the existing implementation mission. The packet pins source authority, ready H1/H2 consumption, registration/producer/renderer ownership, actual focused/check/rendered qualification, and no outer extension/spec/commit/dependency or interim-review authority. Native completion/supervisor requests are the revisit triggers. The parent does not mutate host source concurrently.

H3 child `272dab1d-54ea-4ed3-956d-ec0a25b1f34b` reported a context-mode reminder despite its unchanged tool allowlist lacking ctx tools. Parent explicitly reaffirmed bounded use of the available read/bash/edit/write tools, full fresh-log capture and concise derived results, without runtime/protocol/tooling changes or false ctx-use claims (reply `aee97300-0ae3-4ca2-a011-d062ad9d798b`). The subsequent attention notice had no pending supervisor request; no duplicate reply/restart was needed.

H3 identified two required integration crossings (reply `c8949cb5-e105-4f2f-80e0-62a257e60fbd`). Parent approved the additive no-op registration stub in runner.ts as API-consumer wiring only, preserving H1 wait behavior and requiring its focused regression; this intentionally changes that H1 file's hash and must be reported. Parent also inspected actual `showExtensionCustom` and confirmed late mounts, unconditional saved-text restoration/focus, and top-overlay hiding lack operation ownership. Approved narrow custom-UI lifetime/mount tokens and per-overlay handle cleanup at existing producer/reset boundaries, preserving current valid UI and promise result/error settlement while preventing stale mounts/closes from altering new UI/wait state. Component/handle disposal must be own-resource and idempotent; no invented cancellation results, host-execution changes or broad editor refactoring. Real-source stale factory/reset, out-of-order overlay close, and current input/focus/status preservation tests are required within H3.

### H3 Reload Recovery

On the user's resume request, exact child status and resume for `272dab1d-54ea-4ed3-956d-ec0a25b1f34b` both returned `Async run not found`. The durable workflow artifact for `a29f36ed-b318-45ba-85d0-b512b5ab3718` states: `Workflow stopped because the extension session was replaced or reloaded.` The retained transcript ends with `Request was aborted`; no successful H3 handoff or implementation PASS exists. No pending supervisor request or matching live process remains. This is a reload infrastructure interruption, not a confirmed timeout.

The parent captured the tracked partial diff at `/home/zenji/.pi/agent/sessions/--mnt-8CE085C2E085B2CE-Src-Tools-pi--/subagent-artifacts/h3-recovery-partial.patch` before retry. The checkout remains detached at approved base `005af57d88ee23b33778f343a9595b32e67ff788`. H1 runner and H2 Loader hashes remain unchanged. Partial H3 consists of new `core/extensions/activity-decoration.ts` plus additive activity-type export/type wiring; native integration/tests are not complete. Existing H1/H2 source and test files remain intact, with no staged files or commits. Prior logs under `/tmp` may no longer exist; their recorded successful evidence is historical and must not be fabricated anew.

Recovery uses a clearly labeled same-role `worker` fallback inside the same async workflow protocol because the exact old run is not resumable. The old transcript resolved `openai-codex/gpt-6.1-sol`, matching the currently advertised worker profile; no model/tool/execution-mode switch is made. The original H3 scope, supervisor approvals, 45-minute bound, separate repositories and final whole-wave gate remain unchanged. Git inspection uses per-command `safe.directory` for the two exact approved repositories after the mounted filesystem ownership check; no global Git configuration is changed. All task checkboxes and gate 1.4 remain pending.

Recovery workflow `80e7ba83-8353-44f9-b307-505907b9bcfa` dispatched the sole same-role H3 worker, with managed child output `host/h3-native-integration-recovery.md`, a 45-minute bound and mission `3bf11678-a41a-4875-9e70-7b342ffe53bf`. It retains approved H3 scope and all supervisor decisions; native completion/request notifications trigger parent reconciliation. No concurrent host writer or interim Oracle gate is started.

Recovery child `72428bde-408d-4fb3-9170-1b3ac4a71fa4` received reaffirmation to retain the two verified `types.ts` baseline findings without unrelated cleanup/suppression (reply `587732a0-bb2c-45fc-9d90-12c279d9db18`). A later auxiliary scan also flagged unchanged InteractiveMode crash-cleanup empty catches and custom-editor duck-typing double assertion. Parent independently verified them in HEAD at actual lines 4235/4238/4241 and 2810 respectively, with no introduced catch/assertion in the diff, and approved preservation (reply `f8700c5d-46c7-477c-987f-06e92f8a7500`). New H3 reset logic must preserve the existing best-effort terminal-stop attempt even if reset throws. The first fresh full check reportedly reached TypeScript and exposed an omitted new UI method in the test harness; the worker added the required no-op and must rerun the check. This report is not yet reconciled verification evidence.

H3 reported the existing command-context `navigateTree` summary producer has no branch-summary status cleanup, unlike the UI-tree path; retry attempt-start attaches a branch-summary indicator while retry-finished clears only retry. Parent inspected those source paths and approved narrow actual-summary lifetime/finally wiring (reply `ed8d53e4-a17a-4fac-b857-86da462e1813`). Non-summary navigation must not create busy state; cleanup must prove the current native owner belongs to that operation across retry replacements and must preserve a newer/unrelated owner. Execution, cancellation and promise results remain unchanged. Focused real-source success/abort/rejection, retry-gap and late-finally ownership tests are required. No whole-wave acceptance has occurred.

Parent approved removing the single redundant `clearStatusIndicator("retry")` immediately preceding `showStatusIndicator` in `summarization_retry_attempt_start` (reply `815334c5-5ce5-4a35-b9e6-bcdb22e96abc`). Actual source inspection confirmed direct replacement already revokes the old decoration owner, disposes its native indicator, and reattaches the surface. The intermediate clear would falsely publish hidden state during an unsuppressed same-run phase transfer. Actual terminal/wait/hide clears and retry-finished behavior remain unchanged. Source-real retained-run/new-generation/no-hidden-snapshot/prior-owner-disposal regression and affected tests/full check are required.

### H3 Terminal Reconciliation

Workflow `80e7ba83-8353-44f9-b307-505907b9bcfa` and child `72428bde-408d-4fb3-9170-1b3ac4a71fa4` completed successfully. Parent read the full managed `host/h3-native-integration-recovery.md` report, current native presentation helper, status renderer, custom-UI/reset/summary ownership methods, and the new native/headless/InteractiveMode test suites. The actual write scope is 17 H3 host files and three preserved H1/H2-only files: 20 cumulative host files. No installed packages, dependencies/locks, outer specifications, staging or commits changed. Existing foreign outer work is preserved.

Parent independently inspected final log evidence: `/tmp/h3-recovery-check-phase-qualified.log` contains all configured host checks with no fixes/errors/warnings/infos; `/tmp/h3-recovery-focused-phase-qualified.log` records **11 files / 105 tests passed**; `/tmp/h3-recovery-loader-final.log` records **10 passed, zero failed/skipped/cancelled**. MockTimers' experimental warning is test-tooling noise. Current `git diff --check` passes and the staged file list is empty. Runner minus the approved no-op line exactly reproduces H1's hash; H2's Loader is unchanged. No repeat execution is needed for this unchanged tested source.

Nineteen of the twenty host hashes match the worker manifest. The sole mismatch is `docs/extensions.md`: reversing only the two Markdown table-delimiter normalizations exactly reproduces its recorded hash. This is behavior-neutral formatting, not a source/verification mismatch; the current formatted file is included in the frozen review candidate. The worker's claim of no unrelated formatter effects is therefore qualified by these two existing table formatting changes.

H3 now supplies native registration/ownership, producer-owned wait suppression, native border/container composition, synchronous phase transfer, and stale custom-UI protection. Real VirtualTerminal rendering, cursor/paste/autocomplete/focus preservation, native summary retry/terminal ownership, and headless factory suppression have passing production-source regressions. No PTY/live-release/real-auth/network-upload qualification is claimed. Wave 2's static bank/controller/preferences/full AT01–AT24 remains pending. H3 is a ready component handoff, not Oracle or caller PASS. All non-gate Wave 1 assignments are ready for gate 1.4; no checkbox is marked complete.

### Wave 1 Frozen Review Baseline

BASELINE_TARGET=add-whimsical-activity-indicator / Wave 1 / tasks 1.1–1.3 / final gate 1.4
BASELINE_TARGET_REVISION=sha256:66fad245364bf5416dcbbdabba1fc6f78094990bfc288e6543c2ed388b979591
BASELINE_SOURCE=approved OpenSpec proposal/design/delta/tasks; docs/adr/0009-native-activity-decoration.md; host/pi v0.99.2 base 005af57d88ee23b33778f343a9595b32e67ff788
BASELINE_INCLUSION_PREDICATE=complete Wave 1 ADR and cumulative H1/H2/H3 host API, wait/lifecycle, native renderer/Loader, focused tests and API documentation changes
BASELINE_EXCLUSIONS=Wave 2 bank/selector/controller/preferences/full extension qualification; installed releases; dependencies/lockfiles; personal settings; foreign temp/ and openspec/config.yaml; unrelated execution/editor refactors and existing baseline scan/dependency findings

Candidate revision is SHA256 of sorted lines `SHA256(file) + two spaces + root-relative path + LF`, covering the 20 current host changed/untracked product files and the Wave 1 ADR. Review-control prose and future Wave 2 files are not candidate content. Boundary/source fields stay literal through ordinary PATCH; no review round has yet been consumed in this wave. Gate 1.4 is the only whole-wave Oracle gate, with FULL mode for this first review, four-round/one-rebuild limit, and caller-only reconciliation/action/task completion.

### Wave 1 Oracle Dispatch

Workflow `563743c5-f96c-4f12-beda-e3e9187400fc` invokes selected `oracle` in fresh read-only context for the complete frozen Wave 1 candidate, stable child key `host-wave1-oracle-r1`, managed output `oracle/host-wave1-round-1.md`, 45-minute bound and mission `cd1b42c6-5d57-44b9-bc06-096b3f08d5de`. The packet includes all ADR/H1/H2/H3 owner boundaries, actual source/log evidence and qualification exclusions. No further implementation starts before terminal Oracle reconciliation. This is gate 1.4's first FULL review, not a component or proposal review.

Oracle child `ffb052c0-5fd4-407c-91d9-f73807670a85` requested concrete offline reproduction for displaced native input/select signal+timeout settlement and reentrant registration during decoration reset. Parent authorized only disposable `/tmp` scripts/fixtures using real source and existing offline tooling, complete fresh output/status capture, no candidate/config/dependency changes, no full check/suite or live providers (reply `ef1fa24a-ef0d-43d2-aa12-6c022a688cba`). Findings must distinguish baseline bugs from introduced regressions or current full-contract integration gaps. If external fixtures cannot execute without candidate edits, Oracle must report the limitation rather than switch protocol or claim execution. No finding has yet been caller-reconciled; this authorization is evidence gathering, not remediation or acceptance.

## Round 1 - Oracle Review

### Reviewed Target and Ownership

FULL review at final whole-wave gate 1.4 covers orchestrator ADR 1.1, worker H1 runner wait contract 1.2, worker H2 Loader contract 1.3 and worker H3 native integration 1.2–1.3 together. Managed complete Oracle entry: `/home/zenji/.pi/agent/sessions/--mnt-8CE085C2E085B2CE-Src-Tools-pi--/subagent-artifacts/outputs/563743c5-f96c-4f12-beda-e3e9187400fc/oracle/host-wave1-round-1.md`. Workflow `563743c5-f96c-4f12-beda-e3e9187400fc` and child `ffb052c0-5fd4-407c-91d9-f73807670a85` completed successfully. Oracle independently recomputed the frozen candidate before/after inspection and reproduction: `sha256:66fad245364bf5416dcbbdabba1fc6f78094990bfc288e6543c2ed388b979591`; host HEAD remains the approved base.

### P1 — W1-PROMPT-SETTLEMENT

Stable family/root: displacement removes outstanding prompt completion routes. In scope; introduced H3 regression. Governing contract is deployed `ExtensionUIDialogOptions.signal`/`timeout` dismissal and design decision 2/task 1.2 producer-wait settlement without changing promise/cancellation semantics.

Evidence: `host/pi/packages/coding-agent/src/modes/interactive/interactive-mode.ts:2664–2667,2729–2732,4826–4830,4848`. Displacement calls disposal, removing the abort listener and countdown without settling the promise. The production-source reproduction opened runner select/input with signal and 1,000 ms timeout, displaced it with another input, aborted the first, advanced 1,200 ms, then dismissed the second. Both variants retained an unsettled first promise and runner depth 1/revision 3. Immutable baseline InteractiveMode methods under the same observation settled both, depth 0/revision 4; this is not merely baseline overlapping-prompt behavior.

SUGGESTED_CORRECTION: Separate surface disposal from outstanding operation settlement. Preserve existing abort/timeout routes until promise settlement while retaining token-guarded stale dismissal. Add real-runner/native displacement regressions; do not invent cancellation results or alter H1 depth authority.

### P1 — W1-RESET-REENTRANCY

Stable family/root: reset retains a registration created during disposal. In scope; new registration-lifecycle defect. Governing contract is design decision 1 reset/shutdown revocation and exactly-once disposal, plus scheduled-work teardown cleanup.

Evidence: `host/pi/packages/coding-agent/src/modes/interactive/activity-decoration.ts:50–77,80–92,156–167`. Reset removes only its entry registration; remove clears exclusivity before dispose invokes extension code, so a replacement registration is accepted and left undisposed. Production-helper reproduction records firstDisposed=1, secondConstructed=1, secondDisposed=0, acceptedReentrantRegistration=true. This API is new, so it is not a baseline defect.

SUGGESTED_CORRECTION: Establish reset-time revocation before invoking callbacks and decline registration throughout teardown without constructing the factory. Preserve legitimate subsequent-lifecycle registration. Add a reentrant-disposal regression proving no accepted controller or recurring work survives reset.

### Coverage and Verification

Oracle reviewed authoritative artifacts/ADR, all component reports, cumulative actual diff and seven new files. It traced the finite producer/consumer boundary, H1 synchronous snapshot/invalidation/reentrancy, H2 Loader, native prompt/auth/custom/share/bug/external-editor/suspend/run/summary/reset paths, both ANSI/Unicode status rendering surfaces, editor state/coexistence and noninteractive consumers. It reused the clean host check, 105 coding-agent tests and 10 Loader tests; neither reproduced defect was covered by those passing suites.

Authorized additional command from coding-agent cwd: `node ../../node_modules/vitest/dist/cli.js --run --config /tmp/oracle-wave1-r1-563743c5/vitest.config.mjs`. Three assertions failed, exit 1; full log `/tmp/oracle-wave1-r1-563743c5-repro.log`. Same-facility baseline contrast passed two relevant assertions with one deliberately skipped new-API case, exit 0; `/tmp/oracle-wave1-r1-563743c5-baseline-qualified.log`. Initial relocated-baseline collection failed on Chalk resolution; import relocation corrected that fixture prerequisite. Only disposable scripts were created/removed; candidate repositories/staged indices were unchanged.

No additional P0/P2/P3 findings. Both corrections are bounded within the frozen architecture; Oracle recommends PATCH, not rebuild. Offline TUI/VirtualTerminal evidence is not PTY/live-release/real-auth/upload qualification; Wave 2 remains excluded.

PROPOSED_REVIEW_ACTION=PATCH

### Round 1 Caller Assessment

The parent read the full terminal Oracle output, inspected actual prompt input/select/general-selector disposal and native reset methods, read derived failure/baseline log results, and independently recomputed the unchanged candidate digest. No partial source writes/staging occurred. The Oracle result is fully reconciled before remediation; no component/whole-wave PASS or task completion is inferred.

- **W1-PROMPT-SETTLEMENT — ACCEPT_BLOCKING.** Deployed abort/timeout dismissal, OpenSpec native wait contract and task 1.2 govern this regression. CORRECTION: preserve outstanding operation completion resources independently from displaced surface ownership, retaining guarded stale UI effects and unchanged result semantics; add mutation-sensitive real-runner/native displacement abort and timeout cases, and verify current replacement prompt/focus/status survive old completion. H1 remains the sole depth authority.
- **W1-RESET-REENTRANCY — ACCEPT_BLOCKING.** OpenSpec native registration ownership and scheduled-work teardown require revocation/disposal on reset. CORRECTION: reject factory construction/registration during the reset callback window with the smallest local teardown guard, including reentrant reset; restore eligibility afterward for the valid current lifecycle. Verify dispose exactly once, no accepted replacement/controller timers, and normal subsequent registration. Do not add a general lifecycle framework or prohibit ordinary non-reset removal semantics without evidence.

The four frozen boundary/source fields remain unchanged; current candidate matches the reviewed revision. Both accepted in-scope P1 findings are patchable and neither has prior accepted-remediation recurrence. Wave 1 checkboxes remain unchanged; commit and Wave 2 remain blocked. Same gate 1.4 is reserved for Round 2 PATCH review after both corrections and evidence complete.

REVIEW_ACTION=PATCH
CONSENSUS_STATUS=NEEDS_REVISION

## Round 2 - Implementation Assignments

Sole same-wave owner remains `worker` for the two accepted H3 corrections in `interactive-mode.ts`, `modes/interactive/activity-decoration.ts`, and their cohesive focused production tests. Preserve ADR/specification/H1/H2 ownership and all valid evidence. No interim review, scope expansion, task checkbox, staging/commit or Wave 2 work is authorized. Required evidence is current failure-before/fix-after regressions, affected native/runner/status tests, full host check, whitespace/index checks and new candidate revision before the same whole-wave Oracle gate.

Workflow `bc4ef309-121e-445b-978b-ca0903697ccc` resumes the exact completed/reconciled H3 worker `72428bde-408d-4fb3-9170-1b3ac4a71fa4` under stable key `host-wave1-patch-r2`; managed report `host/host-wave1-patch-round-2.md`, 45-minute bound, mission `c5e02da1-b7ff-46be-b0c9-a08abaab20e6`. The delta packet contains only the two caller corrections and required supporting regressions/checks. Model/tools/protocol/ownership remain unchanged. Native completion triggers terminal reconciliation before Round 2 PATCH Oracle gate; no concurrent writer or interim review.

### Round 2 Patch Terminal Reconciliation

Workflow `bc4ef309-121e-445b-978b-ca0903697ccc` and child `a7ebb9ae-99ce-4a0c-9797-e08b28387ff1` completed successfully. Parent read the complete managed `host/host-wave1-patch-round-2.md` report, actual input/select finish and native reset/registration methods, and all six new production-source regression cases. Only the four assigned H3 source/test files changed this round; H1/H2 and remaining Wave 1 files are preserved. No staging, commit, specification or Wave 2 writes occurred.

The parent verified the full fresh host check log is clean with no formatting effects. Retained logs show the new regressions failed before fixes (**5 failed / 30 passed**), then passed (**35/35**) after the implementation and corrected deterministic promise-drain fixture. Final affected/adjacent suites passed **11 files / 111 tests** in `/tmp/host-wave1-patch-r2-bc4ef309-focused.log`. Source whitespace and staged-index checks remain clean/empty. Unchanged H2's prior 10/10 evidence remains valid; no unnecessary rerun is required. Current 21-file candidate manifest exactly matches a parent recomputation.

W1-PROMPT-SETTLEMENT now keeps signal/countdown cleanup in exactly-once operation finish while displaced-surface disposal clears only current surface references; existing token guards prevent late completion from affecting replacement UI. Four real-runner/native abort/timeout cases verify unchanged results, depth 0/revision 4 after both operations, exactly-once cleanup and replacement text/focus/status preservation. W1-RESET-REENTRANCY now declines registration throughout the bounded reset callback window, guards nested reset and restores ordinary eligibility afterward; tests prove no surviving factory/controller/timer and preserve non-reset removal behavior. Both accepted corrections have component evidence and are ready for independent PATCH review; this is not caller PASS.

PATCH_BASELINE_REVISION=sha256:026af291c99e74fe510a943ae7e611e74722829b61066ce99972ab30bf76ab91

The four frozen target/source/inclusion/exclusion fields remain literally unchanged. This revision replaces Round 1's candidate only for the next review; gate 1.4, owner mapping and four-round/one-rebuild sequence remain unchanged. Round 2 must verify both fixes and perform a bounded holistic whole-wave regression sweep, not a fixes-only review.

### Round 2 Oracle Dispatch

Workflow `6d57f75b-30bd-4b44-b3e1-39bc7b33802f` resumes the exact completed/reconciled independent Oracle `ffb052c0-5fd4-407c-91d9-f73807670a85` under stable key `host-wave1-oracle-r2`, managed output `oracle/host-wave1-round-2.md`, 45-minute bound and mission `94024f2b-f16d-47a3-a50a-e9a7fb9cb16d`. This reuses gate 1.4 in PATCH mode with the newly recorded candidate and unchanged frozen boundary; no further writer is active, no interim gate or next wave is started. Native terminal notification triggers caller reconciliation.

## Round 2 - Oracle Review

PATCH review at the same whole-wave gate 1.4 covered orchestrator ADR/H1 runner/H2 Loader/H3 native integration together. Complete managed entry: `/home/zenji/.pi/agent/sessions/--mnt-8CE085C2E085B2CE-Src-Tools-pi--/subagent-artifacts/outputs/6d57f75b-30bd-4b44-b3e1-39bc7b33802f/oracle/host-wave1-round-2.md`. Workflow `6d57f75b-30bd-4b44-b3e1-39bc7b33802f` and child `e390a000-f0e9-453d-9385-78760ca69418` completed successfully. Oracle independently verified all 21 current manifest entries and candidate `sha256:026af291c99e74fe510a943ae7e611e74722829b61066ce99972ab30bf76ab91`, approved host HEAD and unchanged frozen boundary.

Both accepted P1 families are resolved: **W1-PROMPT-SETTLEMENT** now separates displaced surface cleanup from exactly-once operation completion, with four real-runner/native abort/timeout regressions proving replacement UI preservation and final depth 0/revision 4. **W1-RESET-REENTRANCY** rejects registration through reset/nested disposal without constructing surviving work, with zero-timer/subsequent-registration/ordinary-removal preservation regressions. Oracle found no new P0/P1/P2/P3 findings and no scope/architecture drift.

The bounded holistic sweep revisited synchronous runner invalidation/reentrancy, stale presentation handles, foreground/summary/compaction ownership, custom factory/overlay cleanup, native/auth/delegated waits, visibility/shutdown, both status render paths, editor state, Loader timing and headless consumers. Oracle read retained complete failure-before/fix-after/111-test/full-check evidence and unchanged Loader 10-test evidence instead of repeating unchanged execution. It independently checked whitespace, empty host index and candidate identity; no writes or new test execution occurred. Source/TUI/VirtualTerminal evidence is not browser/PTY/live-release/real-auth/upload qualification. Wave 2 and the accepted baseline scanner/dependency residuals remain outside this gate.

PROPOSED_REVIEW_ACTION=PASS

### Round 2 Caller Assessment and Terminal Validation

Parent read the entire terminal review and reconciled its no-new-finding result. Both previously accepted P1 families have verified corrections and independent approval; no accepted blocker remains. The parent independently recomputed the current 21-file digest as `sha256:026af291c99e74fe510a943ae7e611e74722829b61066ce99972ab30bf76ab91`, matching the latest recorded PATCH revision and Oracle candidate. Host remains at approved base with empty staged index. Literal target/source/inclusion/exclusion fields still describe the same Wave 1 artifacts and authority; no baseline mismatch exists.

This is caller-owned PASS for gate 1.4, not feature-wide acceptance. Complete tasks 1.1–1.4 and perform the previously user-authorized scoped host commit followed by root commit before dispatching Wave 2. No extra Oracle round, rebuild, interim gate or acceptance claim is added. Session `lens_diagnostics(mode=all)` reports no blocking error; its sole proposal MD041 warning is the existing OpenSpec `## Why` template shape, not a new code issue. Source checks and accepted unchanged auxiliary alerts are reported separately, not claimed absent.

REVIEW_ACTION=PASS
CONSENSUS_STATUS=APPROVED

### Wave 1 Commit and Progress

Tasks 1.1–1.4 are checked only after the above whole-wave caller PASS. Strict OpenSpec validation passes; apply instructions report **4/8 complete, 4 remaining**, ready for Wave 2. The previously authorized explicit 20-file host commit is `bdfa3155aae32d29bc22884fa017ef4d7427b5e7`, message `feat(coding-agent): add native activity decoration hooks [add-whimsical-activity-indicator]`; host tracked/untracked status is clean. This separate ignored checkout is not a submodule/gitlink, so no root gitlink is invented. Root scoped artifact commit follows before next-wave dispatch; foreign `temp/` and `openspec/config.yaml` are excluded. The root commit completed as `10901700e49fba6be6b03f3c71a3fd5281edf84a`, message `feat: record approved native activity host wave [add-whimsical-activity-indicator]`. Root status afterward contains only the two foreign untracked paths.

## Wave 2 Review Sequence

### Wave 2 Ordered Ownership

Wave 1 has current caller PASS and both scoped commits. Wave 2 starts with the same successfully completed/reconciled `worker`, retaining useful supported-host API context while explicitly switching to local extension logic/UI/test mode. Sole writer, selected independent `oracle`, normal focus; no additional per-component Oracle gate. Parent owns specifications, review reconciliation and checkboxes.

1. **E1 / task 2.1 — bank and selector:** worker owns byte-identical runtime JSON, once-only validation/direct loading and deterministic shuffled-bag selector, with cohesive AT01–AT07 tests under `test/whimsical-activity/`. No model/conversation inputs or generated bank.
2. **E2 / task 2.2 — controller and preferences:** same suitable reconciled worker next owns native registration entry/controller and deterministic lifecycle/output/preference tests, consuming E1 and committed host API. No rejected editor-replacement/event-counter seam.
3. **E3 / task 2.3 — whole extension qualification/docs:** worker owns bounded source-host integration tests, actual AT01–AT24 evidence, local check and README launch/disable/source-qualification instructions. Host test additions only when needed; any host production contradiction is reported before wider edits.
4. **Gate 2.4:** selected oracle reviews the entire completed Wave 2 once, then parent reconciliation determines progress/commit. E1–E3 are slices, not review boundaries.

The approved host revision is `bdfa3155aae32d29bc22884fa017ef4d7427b5e7`; local source commits are not installed-release qualification. Root dependencies are already hydrated, package manager/scripts are npm per repository, and no dependency/lockfile update is authorized. Root `npm run check` is typecheck plus its existing Node test suite; host checks follow host restrictions. Foreign `temp/` and `openspec/config.yaml` remain untouched. Task checkboxes 2.1–2.4 remain unchecked until whole-wave caller PASS.

## Round 1 - Implementation Assignments

E1 workflow `d9b5d5c0-33f7-4a4e-9117-2503bf29727d` resumes latest reconciled worker `a7ebb9ae-99ce-4a0c-9797-e08b28387ff1` for only task 2.1, stable key `extension-bank-component`, managed report `extension/e1-bank-component.md`, 45-minute bound and mission `f4f59bf0-b079-4b0e-ac40-3a327ac587bd`. Target is the outer extension workspace with explicit local logic/test responsibilities; no host/UI/controller/doc/spec/commit writes. E2/E3 remain undispatched until E1 reconciliation. Gate 2.4 is reserved for the complete numbered wave, not this component.

### E1 Terminal Reconciliation

Workflow `d9b5d5c0-33f7-4a4e-9117-2503bf29727d` and child `04b6bd57-69ce-4779-bbee-bb4161edd350` completed successfully. Parent read the full managed report, complete 70-line production selector and 187-line tests. Actual writes are exactly the runtime JSON, `word-bank.ts` and cohesive bank tests. Current hashes match the handoff; runtime JSON is byte-identical to owning supplied JSON, SHA256 `1ff08926c752cff9690fcb6b41d5e9ddb13808385852f4ea6a87fadda3a7ae68`. No host/dependency/specification/prompt/controller edits occurred; host remains clean at the committed Wave 1 revision.

Fresh qualified logs record **43/43 bank tests passed**, zero failed/skipped/cancelled, and clean root typecheck. Parent checked actual log results, source identities and repository scope. Loader validation occurs once per selector construction; E2 must retain one selector lazily for the application UI runtime across ordinary runs. `next()` is the only consumption method; words are frozen and unpunctuated, maxWordLength and diagnostic are readonly metadata, invalid/unavailable data yields singleton Working. Six full seeded cycles, forced boundary repair, malformed/singleton/unavailable banks and reuse across simulated run requests have production-module tests. Actual AT07 UI non-consumption and diagnostic delivery remain E2/E3 responsibilities. E1 is ready for controller integration, not a completed checkbox or Oracle PASS.

### E2 Dispatch

Workflow `4569810a-d168-4e60-8755-13e635673af0` resumes latest reconciled E1 worker `04b6bd57-69ce-4779-bbee-bb4161edd350` for task 2.2 only, stable key `extension-controller-component`, managed report `extension/e2-controller-component.md`, 45-minute bound and mission `d7861e78-4dba-46f5-b97b-2e5c51ddca0d`. Explicit responsibility is local entry/native presentation/preferences plus focused lifecycle tests; preserve E1 asset/selector and committed host authority, no host production/specification/dependency/README/commit writes. The packet includes current API, timing/suppression/phase/stale-callback and output constraints. E3 and whole-wave gate 2.4 remain pending until terminal E2 reconciliation.

E2 child `7432f735-d9b4-4993-9c2e-2e7a2f0cb692` reported 71 focused cases passing but an added native composition fixture could not collect under root Node strip-types: unbuilt host workspace exports target absent `dist/index.js`; existing host Vitest supplies source aliases. Parent approved removing only that task-created non-runnable E2 fixture and keeping native runtime qualification with E3's already assigned existing source-aliased host/offline harness (reply `ef2756d7-334f-4c6f-b016-31f65f94875d`). No build/dependency/package-script/resolver framework change is authorized. Compile-time compatibility is not runtime evidence; E3 must exercise actual host plus actual controller before gate 2.4. The failure/log must remain accurately reported. A later attention notice had no pending request; no duplicate reply/restart is required.

### E2 Terminal Reconciliation

Workflow `4569810a-d168-4e60-8755-13e635673af0` and child `7432f735-d9b4-4993-9c2e-2e7a2f0cb692` completed successfully. Parent read the entire managed E2 report and all three production modules, checked all nine E1/E2 product hashes, inspected final focused/root log results and both repository scopes. Actual E2 writes are three production modules and three cohesive test/support files; E1 hashes and clean committed host are unchanged. No README, host production, specification, dependency, staging or commit writes occurred.

Final qualified logs show **73/73 focused cases** and clean root typecheck plus **101/101 root tests**, zero failed/skipped/cancelled. Initial native-fixture collection failure is the explicitly approved E3 deferral. An unrelated initial root-suite failure came from inherited `PI_PACKAGE_DIR` selecting installed 0.99.2 assets for pinned 0.87.1; unsetting only that variable in command context resolves it without changing assets/settings/dependencies. E3 must preserve explicit runtime/asset isolation and the failure provenance.

The controller owns only one cancelable label deadline, monotonic 250 ms/8 s timing, current scoped presentation handle, retained word and stale-callback token. Source host still owns animation/status/wait/run identity. Lazy selector creation waits until accepted first selection and retains the same instance across ordinary runs/registration replacements. Reduced mode stops rotation; plain mode constructs no bank/deadline; ASCII changes label punctuation only. Entry guards TUI/TTY/hasUI/disabled/options/API and deduplicates existing diagnostics. All mock-controller/entry checks are component evidence, not native runtime qualification. E2 is ready for E3, not gate PASS or a completed checkbox.

### E3 Dispatch

Workflow `bf5a0855-48f3-479d-be54-e716b0d9c7c6` resumes latest reconciled E2 worker `7432f735-d9b4-4993-9c2e-2e7a2f0cb692` under stable key `extension-qualification-component`, managed report `extension/e3-qualification.md`, 60-minute bound and mission `37f69cd0-466a-4e8c-a5a6-1b7509a51c85`. Scope is task 2.3 actual source-host/controller qualification, proportionate model/network/prompt monitoring, acceptance evidence and README; both repositories' bounded integration tests may be written by this sole owner, but no host production/dependency/specification/commit expansion is preauthorized. E2 native-runtime deferral is mandatory evidence now. Existing source aliases/offline fixtures and isolation are required, no build or new resolver. E1/E2/host valid checks are reused where unchanged. Final gate 2.4 remains undispatched until E3 terminal reconciliation.

E3 child `ea5847b7-e904-42c1-a7a4-b682d78b89d7` reported a native minimum-width residual. Parent inspected `/tmp/whimsical-e3-bf5a0855-source-2.log`, which records the undecorated live editor already rendering 2 cells at width 1 while normal sampled widths fit. Approved preserving that unrelated baseline behavior with explicit limitation, before/after no-added-overflow assertions, strict decorated status/border width checks and actual 22-column TUI evidence; no host production expansion (reply `ebf9a299-934a-429e-b70c-791045e3e94e`). This does not qualify the entire editor at a 1-column viewport. The same log showed an AT23 empty-system-message prompt mismatch; parent requires identically configured actual provider-bound contexts and exact comparison, not filtering differing prompts to hide a failure. Actual reload or faithful source-runtime reconstruction is required for reload evidence. Remaining initial failures are not accepted as resolved until fresh terminal qualification evidence is reconciled.

E3's next source log records exact unfiltered provider-bound prompt equality after identically configuring both actual sessions with the same persisted system instruction: two legitimate faux requests, zero indicator provider requests/fetch calls, SHA256 `894b220ce1020247b0410127b738a954d2449b0f8c8f96d50193c02aee3f30d9`. Parent inspected those results in `/tmp/whimsical-e3-bf5a0855-source-3.log`. The remaining reset cursor assertion reflects immutable-base `resetExtensionUI` already calling `setCustomEditorComponent(undefined)` and raw-text restoration; parent verified base line 2378 and current method. Approved preserving that unrelated whole-host reset behavior with an identically prepared undecorated contrast and explicit limitation, while keeping strict lossless indicator registration/removal/disable checks and post-reset shutdown preservation (reply `7f521956-4b50-4925-a1c6-dd9ee9a32d25`). No full reload losslessness or host production edit is authorized. Final evidence remains subject to terminal reconciliation and whole-wave review.

`/<name>` may refer to either a registered command or a loaded skill, depending on the active toolset.

### E3 Terminal Reconciliation

Workflow `bf5a0855-48f3-479d-be54-e716b0d9c7c6` and child `ea5847b7-e904-42c1-a7a4-b682d78b89d7` completed successfully. Parent read the full managed `extension/e3-qualification.md` report and inspected final retained logs, current repository scope and candidate fingerprints. Actual writes are README, four root monitoring/compatibility support files and five host source integration test/fixture files. E1/E2 runtime fingerprints remain unchanged; host production tracked diff is empty at committed `bdfa3155aae32d29bc22884fa017ef4d7427b5e7`. Neither repository has staged paths; foreign `temp/` and `openspec/config.yaml` remain untouched.

Fresh evidence records root typecheck plus **103/103 cases**, expanded source **10 suites/117 cases**, new source **4 suites/24 cases**, full host check **1673 files/no fixes**, and pre-import network sentinel **zero monitored attempts/zero pending callbacks**. Final logs use prefix `/tmp/whimsical-e3-bf5a0855-` with `root-check-final.log`, `source-tests-final.log`, `source-evidence-final.log`, `host-check-post-format.log` and `network-evidence-final.log`. Actual source TUI captures show wide decoration, narrow native-status priority, usable prompt and same-word resume. Final provider comparison records two legitimate faux requests, zero indicator requests/fetch calls and full-message equality except timestamps, SHA256 `378c9449cb8d5281cccfb17c35e531fcf7701caff76ad8bacc28865524713f53`. Earlier failing fixture logs and corrections remain disclosed, not counted as successful checks.

The AT01–AT24 evidence map combines fresh E1/E2 tests with actual source runner/AgentSession/InteractiveMode/native/TUI/VirtualTerminal composition. Source aliases are the existing host Vitest facility; no build/resolver/dependency change occurred. Preserved limitations are the baseline one-column editor minimum and whole-host reset cursor/paste restoration, separately contrasted with lossless feature removal. No installed-release, live PTY, real-auth/upload/service or exhaustive-transport qualification is claimed. E1–E3 now satisfy their assigned evidence prerequisites; gate 2.4 is the sole remaining whole-wave review, and tasks 2.1–2.4 remain unchecked pending caller PASS.

### Wave 2 Frozen Review Baseline

BASELINE_TARGET=add-whimsical-activity-indicator / Wave 2 / tasks 2.1–2.3 / final gate 2.4
BASELINE_TARGET_REVISION=sha256:2f612b43b3e60745fd7dbc8e3aa1b48fd83b0cb4fd0d655b3c3db84844f5dc4d
BASELINE_SOURCE=approved owning OpenSpec proposal/design/spec/tasks; committed Wave 1 native API bdfa3155aae32d29bc22884fa017ef4d7427b5e7; outer baseline 10901700e49fba6be6b03f3c71a3fd5281edf84a; supplied static JSON and recorded user-approved source-host scope
BASELINE_INCLUSION_PREDICATE=complete Wave 2 static bank/selector/controller/preferences/entry, qualification tests and README; actual source-host integration tests and their committed native consumers
BASELINE_EXCLUSIONS=already accepted Wave 1 implementation except consumed integration seams; installed releases; dependency/lockfile changes; live PTY/auth/upload/service qualification; unrelated host production/editor refactors; foreign temp/ and openspec/config.yaml; accepted unchanged baseline scanner/dependency advisories

Candidate revision is the SHA256 of sorted lines containing file SHA256, two spaces, root-relative path and LF for README, all files under `extensions/whimsical-activity/` and `test/whimsical-activity/`, and host `packages/coding-agent/test/whimsical-source-*.ts` (19 files). Review-control prose is excluded. Parent recomputed this current candidate independently; no writer remains active. Review mode is FULL, first Oracle review in this numbered wave, selected reviewer `oracle`; no interim or replacement gate is created.

### Wave 2 Oracle Dispatch

Workflow `cab9777c-583d-4515-b28d-bdca86627193` resumes exact completed/reconciled Oracle `e390a000-f0e9-453d-9385-78760ca69418` under stable key `wave2-oracle-r1`, managed output `oracle/wave2-round-1.md`, 45-minute bound and mission `1ebb1e4a-ad33-4ec2-a8b6-3811fdde51a6`. Gate 2.4 reviews all E1/E2/E3 implementation and source qualification against the frozen boundary, with read-only authority and no new implementation/review gate. Prior bounded available-tool authorization is preserved; concrete extra execution or scope decisions use supervisor dialogue. Native terminal notification triggers caller reconciliation; checkboxes and commits remain pending.

Oracle child `f58aa31f-e9d4-438c-aa6c-108351c01dfb` identified the consumed extension-flag CLI seam: existing unknown-flag parsing can consume the following positional prompt before boolean flag application. Parent approved only a disposable/offline real-source parser reproduction with immutable-base contrast and a fresh full log (supervisor reply `293e52ff-a117-478c-b9e4-f281f3574961`). Candidate/source/dependencies remain unchanged; no parser refactor or remediation is authorized before complete finding reconciliation. Safe delimiter documentation and focused CLI characterization remain proposed remedies, not acceptance.

## Round 1 - Oracle Review

FULL review at final gate 2.4 covered E1/task 2.1 bank/selector, E2/task 2.2 controller/preferences/entry and E3/task 2.3 documentation/actual-source qualification. Workflow `cab9777c-583d-4515-b28d-bdca86627193` and child `f58aa31f-e9d4-438c-aa6c-108351c01dfb` completed successfully; full managed entry is `oracle/wave2-round-1.md` under that workflow's session outputs. Oracle independently recomputed the 19-file candidate before/after review as `sha256:2f612b43b3e60745fd7dbc8e3aa1b48fd83b0cb4fd0d655b3c3db84844f5dc4d`; HEADs, frozen boundary, empty indexes and absent host production diff matched.

The holistic sweep found no P0/P1 blocker or architectural drift across direct-bank selection, bag retention, delay/rotation/deadline semantics, scoped callbacks/ownership, authoritative wait/run state, motion/output controls, actual native render paths, editor preservation, provider/network/prompt effects and reload/unsupported-host behavior. Retained checks were reviewed rather than broadly rerun. Source/TUI evidence retains the documented baseline and live-service exclusions.

**P2 — W2-CLI-BOOLEAN-PROMPT; in scope documentation/qualification:** README lines 64–72 omit the positional delimiter caveat for new boolean controls. Governing sources are design decision 7, task 2.3 accurate controls/loading documentation and the execution-neutrality requirement. Existing `cli/args.ts:237–248` consumes a following positional argument as an unknown extension flag value; `agent-session-services.ts:106–108` then discards that value when applying registered booleans. E3 direct flag injection does not characterize the parser. Approved offline repro `/tmp/oracle-wave2-r1-cab9777c-cli-repro.log`, exit 0, proves identical immutable-base/current behavior: `--activity-ascii "Do task"` and `--no-whimsical-activity "Do task"` lose the message; adding `--` preserves it. String `--activity-display normal "Do task"` preserves the message.

**SUGGESTED_CORRECTION:** Document `--` before positional prompts for boolean controls and retain focused actual-parser safe-usage characterization; do not refactor the baseline parser. No other findings were emitted.

PROPOSED_REVIEW_ACTION=PASS

### Round 1 Caller Assessment and Terminal Validation

Parent read the full terminal review and fresh parser output, independently recomputed current candidate `sha256:2f612b43b3e60745fd7dbc8e3aa1b48fd83b0cb4fd0d655b3c3db84844f5dc4d`, and checked both repositories' HEADs, unstaged scope, empty indexes and whitespace. Literal target/source/inclusion/exclusion fields still match this completed Wave 2; no candidate or boundary mismatch exists. All E1–E3 writes and evidence are reconciled, and no accepted in-scope P0/P1 blocker remains.

**W2-CLI-BOOLEAN-PROMPT — ACCEPT_NONBLOCKING (P2).** This is a real documentation/qualification gap around unchanged baseline CLI behavior, not a new indicator runtime/model/prompt mutation. **CORRECTION:** Retain the concrete safe-usage caveat here and in completion reporting: `--activity-ascii -- "Do task"` or `--no-whimsical-activity -- "Do task"`. Defer README caveat expansion/permanent parser characterization; they are not implemented by this accepted candidate. No unrelated parser refactor or automatic P2-only remediation/review cycle is justified under the selected P0/P1 gate. This residual remains visible rather than being claimed fixed.

Caller-owned PASS consumes the same gate 2.4 and permits marking tasks 2.1–2.4 complete plus the already authorized explicit host-test/root commits. No additional Oracle gate, rebuild or release qualification is inferred.

REVIEW_ACTION=PASS
CONSENSUS_STATUS=MOSTLY_GOOD

### Completion Verification and Step 14 Advisory Audit

Tasks now report **8/8 complete**, state `all_done`; strict OpenSpec validation passes with zero issues. Current session diagnostics have no blocking error: MD041 is the existing OpenSpec `## Why` shape, and MD024 reflects command-required `Round 1 - Oracle Review` headings within separate uniquely marked numbered waves. Neither warning indicates a source defect, and neither is suppressed or claimed absent.

The once-per-change audit counted physical lines in maintained root handwritten source/tests and all change-touched handwritten host source/tests, excluding generated/vendor/fixture/snapshot/catalog files and the unchanged external checkout. No new Wave 2 implementation/test exceeds 1000 lines (maximum 302). The following pre-existing host files remain decomposition opportunities, not blockers under this command's advisory completion audit:

- `host/pi/packages/coding-agent/src/core/extensions/runner.ts` — **1606 lines**, base 1551, +55. Wave 1 adds synchronous prompt observation. Potential boundaries are UI-prompt observation versus registered command/shortcut resolution and event transforms; retain one runner validity/depth authority. Defer to a separate host decomposition change.
- `host/pi/packages/coding-agent/src/modes/interactive/interactive-mode.ts` — **7024 lines**, base 6904, +120. Wave 1 wires native activity and prompt/custom surface cleanup; presentation authority was already extracted to the new helper. Potential independent boundaries are resource-label/diagnostic formatting, authentication dialogs and settings/model selectors, preserving focus and lifecycle ownership. Defer unrelated broad refactoring.
- `host/pi/packages/coding-agent/test/interactive-mode-status.test.ts` — **1256 lines**, base 1251, +5. Existing fixture gains the additive no-op API field. Cohesive describe groups support separate status/tool-expansion, custom-UI/theme, autocomplete and loaded-resource suites with shared fixture support. Defer unrelated test reorganization.
- `host/pi/packages/coding-agent/src/core/extensions/types.ts` — **2267 lines**, base 2245, +22. This deployed public API declaration surface is an external-contract exemption, not a required split; a future UI/event/tool type separation would need stable exported imports and compatibility review.

No automatic split, scope expansion or additional Oracle loop is performed. Both numbered waves have current caller PASS; scoped commits follow, with foreign `temp/` and `openspec/config.yaml` excluded. Archive is not performed without a user request.

### Wave 2 Scoped Commit

The five source qualification test/fixture additions are committed in the separate ignored host repository as `04ef561b360a233254187d63ce1b575058e387b0`, message `feat(coding-agent): qualify whimsical activity source integration [add-whimsical-activity-indicator]`. Host status is clean; native API remains the Wave 1 implementation commit in that ancestry. No root gitlink exists or is staged. The outer scoped commit includes README, the five extension files, eight local test/support files, completed owning tasks and this review record only. The accepted candidate's file bytes remain unchanged by committing; foreign paths stay untracked. The deferred P2 CLI caveat remains as recorded above.

## Wave 3 Review Sequence

### Amendment Apply Preparation

Current proposal review Round 3 received advisory PASS with zero findings; the parent fully reconciled terminal workflow `17a8ad4e-69b3-4736-8a02-890813a8227e` and independently validated amended candidate `sha256:cb51d537e1216e0c2b0c97b1a514965819b2df3a1add559a17687b306066708b`. The proposal log contains current caller-owned PASS. The user requested automatic `/opsx-apply-loop` afterward; this numbered wave implements that approved amendment, not the original already-complete waves.

Apply schema: spec-driven, state ready, progress 8/12 complete. Pending assignments: 3.1 native settings/presentation, 3.2 extension bridge/docs, 3.3 integration qualification. Final gate 3.4 is reserved for the one whole-wave Oracle review after every preceding assignment and required evidence; no interim task/slice review and no checkbox updates before caller PASS.

Selected default implementation specialist: `worker`; selected reviewer: `oracle`; focus mode: normal. One worker owns sequential 3.1–3.3 with explicitly approved logic + terminal-UI responsibility and actual rendered verification. Start a fresh worker for this materially expanded native-settings slice rather than transferring the prior original-feature worker's very large qualification history; reuse this worker for later related assignments after successful terminal reconciliation. Orchestrator remains exclusive owner of specifications, ADRs, review/caller records, completion and authorized scoped commits.

BASELINE_TARGET=add-whimsical-activity-indicator / Wave 3 / tasks 3.1–3.3 / final gate 3.4
BASELINE_TARGET_REVISION=sha256:c7dd61f3a7911749806fb344e4eb9c8a05a4613f651dfe21fb6864b046078c37
BASELINE_SOURCE=current approved owning proposal/design/spec/tasks; user-approved configurable whimsical design/amend and Oracle-gated automatic apply; source-host and runtime bank from completed waves 1–2
BASELINE_INCLUSION_PREDICATE=complete numbered wave 3 native settings/storage/presets/preview/text/color/motion and local controller preference bridge; AM01–AM12 and affected AT01–AT24 source-host integration/regression qualification; relevant source/API/user docs
BASELINE_EXCLUSIONS=agent/tool/provider/prompt execution changes; conversation-driven selection; runtime/build fetching/generation; installed releases/install/publish; dependency/lockfile changes; unrelated settings/editor refactors; real personal-settings edits by agents/tests; persistent selection history/telemetry; foreign/untracked work; previously accepted unchanged baseline scanner advisories

Boundary fields are frozen for this wave. Record actual current candidate revision after implementation, before the first Oracle gate; no review is dispatched for this pre-implementation placeholder. This wave starts its own four-round/one-rebuild accounting, independent of earlier waves. The initial source host is clean, outer modified paths are only the five orchestrator-owned artifact/review files, and all foreign untracked paths remain untouched. No additional ADR is needed.

## Round 1 - Implementation Assignments

- **3.1 / owner worker / first assignment:** native settings and presentation. Ownership is bounded to approved `host/pi` activity preference/registry/submenu, SettingsManager/SettingsSelector/InteractiveMode wiring, native decoration/status/rendering types/exports, focused host tests and related API/settings docs. Preserve native execution, current/custom status priority, caller overrides, input and unrelated source. Required evidence: focused new/modified host tests including disposable persistence, previews/cleanup, widths, text provenance/hints, random/motion/run ownership, plus full-output host check; report actually run commands, results/captures and remaining gaps.
- **3.2 / owner same reconciled worker / subsequent assignment:** extension/controller structural preference bridge, explicit legacy flags, local focused tests and root README; no source-host settings duplication. Preserve bank bytes and run/word/bag identity. Required evidence: local deterministic timing/entry tests and source compatibility, accurate native/CLI precedence and boolean delimiter docs.
- **3.3 / owner same reconciled worker / final non-gate assignment:** whole-wave source-host/local integration, source TUI evidence, no model/network/prompt effects, output modes, root check and affected source checks. Use existing offline/disposable harnesses, never real services/settings or a full build/test suite. Required evidence maps AM01–AM12 and affected original checks, with exact actual commands and qualifications.
- **3.4 / owner oracle / reserved final gate:** independently review the entire completed 3.1–3.3 wave under the frozen boundary. It is excluded from all writer dispatch; only caller-reconciled current whole-wave PASS can complete it.

### 3.1 Transport Failure and Retained-Work Reconciliation

Workflow `c53420bd-4da1-4043-98dc-d00c27140775`, child `cb1398d4-ef13-4a20-a9ca-c574f2f0d20e`, terminated with orchestration/provider `fetch failed`, not a recorded timeout or product-test failure. Exact status confirms process terminal and no active run. The worker had already written the complete managed `host/wave3-native-settings.md` report before its final transport failure. Parent read that report and the full retained focused/Loader/host-check final logs. A failed terminal runtime result is not itself successful delivery/acceptance; the preserved report, actual files and inspected test logs provide the bounded evidence reconciled here.

Actual write scope is 26 approved source-host files: preferences/registry/submenu modules and their tests; supported decoration/settings/API/export wiring; native status/InteractiveMode/Loader integration; focused existing test/fixture adjustments and extensions/settings documentation. Source HEAD remains `04ef561b360a233254187d63ce1b575058e387b0` on detached HEAD, with these unstaged writes and an empty index. Root remains `90151f0d2baf1acec21692c0c163192fc8658e5f` on master; only six orchestrator-owned artifact/review files differ, with preserved foreign untracked paths and no local extension/code edits. Both whitespace checks pass. The tracked source diff was retained at `/tmp/whimsical-wave3-native-recovery-diff-uL9anO.patch`; task-created new modules/tests remain in place and are enumerated in the managed report.

Inspected final logs, all exit 0:

- `/tmp/whimsical-wave3-native-c53420bd-focused-final-2.log`: 16 coding-agent suites, 241 tests passed; actual source VirtualTerminal wide/narrow/wait/resume and animation-preview captures; two legitimate faux requests, zero indicator provider/fetch calls, normalized provider prompt equality.
- `/tmp/whimsical-wave3-native-c53420bd-loader-final.log`: 11/11 Loader tests passed, including rejection of queued callbacks after stop/replacement; existing experimental MockTimers notice only.
- `/tmp/whimsical-wave3-native-c53420bd-check-final-2.log`: full host `npm run check` passed, 1680 files, one own test format fix; final focused tests ran afterward. Pinned/runtime dependencies, imports, entry graphs, shrinkwrap/install-lock, TypeScript and browser smoke checks passed. No dependency/catalog/build/install operation is inferred.

Parent also read the actual additive native API/preferences files. Handoff for 3.2: frozen normalized `snapshot.preferences`, producer-derived `snapshot.genericWorking`, `presentation.nativeTextFallback?: true`, and optional registration overrides `{enabled?:false,motion?:normal|reduced|plain,ascii?:boolean}`. Three supervisor decisions are accepted within the approved boundary: dormant explicit CLI opt-out without factory/resources/native mutations; typed invalid-bank native fallback preserving `Working…`/ASCII punctuation and meaningful messages; generic Working provenance allowing first-bank-draw deferral without inventing waits or resetting retained deadlines. All are content-free presentation semantics, not another lifecycle/configuration authority.

The retained native assignment now supplies its required evidence and current source contract for dependent 3.2. This is not a whole-wave PASS, checkbox completion or independently reviewed native acceptance; 3.2/3.3 and reserved gate 3.4 remain pending. Native logs are retained, not needlessly replayed solely for the transport failure. New integration work may invalidate relevant source checks and will rerun those affected checks proportionately.

The user requested resume. Continue the next authorized assignment, not an unchanged retry of completed side effects: start a same-role fresh `worker` for 3.2 under the same subagent protocol/model profile/tools/scope. Do not revive the failed 316k-token session, switch to an external/foreground/CLI agent, or change provider. This preserves valid native work while satisfying the no-reuse-of-failed-session governance. No timeout occurred, so the 1.5x timeout rule is inapplicable; keep the next bounded assignment's explicit 45-minute budget. All wave-3 checkboxes remain unchanged.

### 3.2 Terminal Reconciliation

Workflow `35ed79ae-46d0-480e-8e11-7570fcdcce57`, child `c8c06574-3305-4889-b2c9-e80a0fa1d811`, completed successfully with terminal process observed. Parent read the full managed `extension/wave3-extension-bridge.md` report and all three current production bridge modules, including reported pi-lens autofixes. Actual writes are eight root bridge/test/README files plus the narrow approved host source-rendering test caller adjustment. Native 3.1 work remains present; no host production edit, dependency/bank/selector change, staging or commit occurred. Both repositories have empty indexes and clean whitespace; foreign untracked paths remain preserved.

Parent inspected retained final logs: `/tmp/whimsical-wave3-bridge-35ed79ae-root-check-final.log` records TypeScript plus 123/123 tests, zero failed/skipped/cancelled; `source-final.log` records four actual-source suites/24 tests, two legitimate faux requests, zero indicator provider/fetch calls and equal normalized provider prompt SHA256 `5afb96c86ac760dcdfb5e392d01984fa453e5034bce6bc45ebb4460368ea3a37`; `host-check-1.log` records 1680 files/no fixes and all configured check stages. All exit 0. The report's preservation and boundary checks retain native work, unchanged bank bytes and HEADs.

Supervisor clarified within scope: Operational owns only the initial 250 ms visibility callback, no bank or word rotation; hard-disable precedence stays silent and registers only the supported dormant override. Controller now consumes effective host preferences and generic-working provenance, preserves same-run word/deadlines, defers first draw on meaningful phases and supplies typed invalid-bank fallback. This satisfies 3.2's bounded prerequisites, not whole-amendment qualification or PASS. Proceed with assignment 3.3 using this successfully completed/reconciled worker; task 3.4 remains the independent whole-wave gate, and all wave-3 checkboxes remain unchecked.

### 3.3 Dispatch

Workflow `782b4348-fdb4-4bd4-978f-65f0816b940e` resumes reconciled bridge worker `c8c06574-3305-4889-b2c9-e80a0fa1d811` under key `whimsical-wave3-qualification`, managed output `extension/wave3-qualification.md`, 60-minute child/65-minute enclosing bound and mission `72fbd7f1-f62b-4d12-a72e-6bf9b279d4de`. Scope is task 3.3 actual source-host/local composition, AM01–AM12 evidence, affected original regressions, preview/preferences effects and output/resource qualification. Bounded test/fixture and evidence-driven README edits are authorized; source/API contradictions require supervisor decision before production edits. Native 3.1 and bridge 3.2 valid evidence is retained, no broad rerun solely for history. No concurrent writer, artifacts/checklist/commit ownership or interim Oracle gate is delegated. Final gate 3.4 remains pending.

3.3 child `823b2541-fce9-4e3c-b0a4-8afe06f0f95b` found an actual-source run-transition defect: `NativeActivityDecoration.publish` reset preset identity but applied retained previous-run animated presentation before the controller reset it, consuming Random before the 250 ms display gate. Parent read `publish`/`applyPresentation` and the owning spec's first-actual-display Random rule (line 239). Approved only resetting retained decorative presentation on authoritative run change plus mutation-sensitive actual-source regression (reply `f66acc12-85b3-4d7e-9013-126f3ad02b81`); same-run phase/wait/resume semantics and native status must remain intact. A separate picker expectation must use effective CLI Normal rather than saved Reduced; this is fixture correction, not production scope. Retain failed logs and rerun affected checks before qualification; no resolution or PASS is claimed yet.

### 3.3 Failed Acceptance and Retained Evidence Reconciliation

Workflow `782b4348-fdb4-4bd4-978f-65f0816b940e`, child `823b2541-fce9-4e3c-b0a4-8afe06f0f95b`, failed with `Acceptance rejected: Required criterion 'criterion-1' was reported as not-satisfied.` Exact status confirms terminal process after session compaction/settlement. This is a disclosed instruction-compliance failure, not timeout, provider failure or failing final product tests. The worker ran host `env -u PI_PACKAGE_DIR npm run build:offline` contrary to the explicit no-full-build dispatch. The failed status remains authoritative; no acceptance bypass, retroactive build authorization or failed-session reuse is performed.

Parent read the complete managed `extension/wave3-qualification.md` report, current repository scopes, approved production reset and retained final/build logs. Actual task writes are seven host source/test/fixture files: the approved two-line new-run presentation reset, three new source integration suites, shared source fixture and effects/output test expansions. No additional root product/artifact or host production/dependency/lock changes occurred. Both HEADs remain unchanged (outer master `90151f0d2baf1acec21692c0c163192fc8658e5f`, separate detached host `04ef561b360a233254187d63ce1b575058e387b0`); indexes are empty and whitespace clean; foreign paths preserved.

The unauthorized offline build log records workspace TypeScript builds and ignored dist declarations/assets/bundle refresh, existing offline model-data validation and asset copies. It contains no install/catalog-fetch/publish/installed-release operation. Ignored generated build effects are retained, not blindly deleted or reverted without a prior artifact baseline. This build is excluded from authorized verification and not claimed as approval or release qualification. No unchanged retry is needed: source qualification evidence can be inspected independently, and the next action is the already-required read-only Oracle gate, not another writer or build.

Inspected fresh logs under `/tmp/whimsical-wave3-qualification-782b4348-` record: `source-final-2.log` 19 focused suites/272 passed; `root-check-final.log` TypeScript plus123 passed; `loader-final.log`11 passed; `host-check-final-2.log`1683 files/all stages passed with one owned test formatting fix, followed by final focused tests. All exit0 and postdate the offline build. `boundary-final-2.log` verifies375 preserved production/owning-artifact hashes with only the approved reset and caller review-record exceptions, unchanged banks/manifests/locks and empty indexes. Negative mutation evidence rejects the pre-fix premature Random draw; final source tests verify no draw/animation through249ms. Actual TUI captures verify preview cancellation/restored word/live editor; monitored preview/settings/rotation/disposal records two legitimate faux provider requests, zero indicator provider/fetch calls and equal normalized prompt SHA256 `9cead778626a62efd5c4501a769c7654b115e374aab450280da203896f1b0c6c`.

AM01–AM12 and affected AT regressions have the report's concrete source-test map. Parent session diagnostics have no blocking errors; only the existing OpenSpec proposal MD041 warning remains. The source candidate is ready for independent gate3.4 inspection on retained evidence, despite the recorded worker process failure; this is not whole-wave acceptance. All wave3 checkboxes remain unchecked, no commits, and the failed worker is not reusable.

### Wave 3 Candidate Freeze

Current candidate is `sha256:c7dd61f3a7911749806fb344e4eb9c8a05a4613f651dfe21fb6864b046078c37`, independently computed across50 files. Algorithm: sort root-relative paths; concatenate each lowercase file SHA256, two spaces, root-relative path and LF; SHA256 the concatenation. Inputs are README, every file under `extensions/whimsical-activity/` and `test/whimsical-activity/`, five owning proposal/design/tasks/spec/bank files, and host tracked changes against HEAD plus its nonignored new task files. Review logs, foreign root files and ignored build output are excluded. No writer is active. The owning proposal digest remains the current approved `cb51d537e1216e0c2b0c97b1a514965819b2df3a1add559a17687b306066708b`.

Literal target/source/inclusion/exclusion boundary fields from Amendment Apply Preparation remain unchanged. This is FULL mode, first Oracle round of wave3, maximum four rounds and one rebuild. The gate reviews all3.1–3.3 code/tests/docs/evidence together and accurately retains the failed worker/build-deviation provenance; it does not certify instruction compliance retroactively.

### Wave 3 Oracle Dispatch

Workflow `af886156-b77f-4090-a113-1226431f93ca` dispatches fresh-context independent `oracle` under key `whimsical-wave3-oracle-r1`, managed output `oracle/wave3-round-1.md`, 45-minute child/50-minute enclosing bound and mission `e53f7fd6-6400-43b3-b0ee-d15a6c55ae86`. FULL mode at final gate3.4 covers the complete frozen50-file candidate and all3.1–3.3 evidence. Reviewer has read-only scope, explicit known bounded-tool authorization, advisory findings/action only and supervisor dialogue for concrete additional repro or decisions. No failed worker is resumed and no build/test retry is dispatched. Caller owns reconciliation, finite cadence, terminal validation, checkboxes and commit authorization.

## Round 1 - Oracle Review

FULL review of completed wave3 at gate3.4: workflow `af886156-b77f-4090-a113-1226431f93ca`, child `b60c1bb4-b2c3-486c-9e9a-ea0b7b422aa7`, completed successfully. Parent read the full managed `oracle/wave3-round-1.md` report. Oracle independently matched the50-file candidate before/after as `c7dd61f3a7911749806fb344e4eb9c8a05a4613f651dfe21fb6864b046078c37`, current five-file approved bundle, both HEADs/empty indexes and whitespace. Whole-wave source/behavior/evidence sweep found no Oracle-classified P0/P1; advisory PASS used that threshold, with these three findings.

- **W3-SETTINGS-SHADOW-CYCLE — Oracle P2, in scope:** Activity settings rows display effective values, and SettingsList cycles from those same values. `activity-indicator-settings.ts:128–162,176–177` restores effective after saving; `settings-list.ts:285–290` bases the next selection on it. Approved disposable actual-source reproduction `/tmp/whimsical-oracle-wave3-picker-yjwG9U/repro.log` fails two assertions: three confirmations under CLI Motion=Normal or project Motion=Normal save Reduced three times, making Plain/Normal unreachable. Animation's explicit submenu works; other cycle-based fields share the root family. Suggested correction separates persisted selection from effective display or uses explicit-value submenus, preserving precedence and field-local writes, with repeated CLI/project regressions.
- **W3-VALIDATION-SCOPE — P2, verification provenance:** the expressly prohibited full offline build remains disclosed and worker acceptance failed. Suggested candidate repair is not warranted; retained generated effects have no prior rollback baseline. Preserve process failure and exclude build from authorized evidence.
- **W3-QUALIFICATION-DOC — P3, in scope:** README still calls assignment3.3 qualification pending despite its retained current source/TUI evidence. Suggested correction distinguishes retained qualification from pending caller acceptance and installed-release limits.

PROPOSED_REVIEW_ACTION=PASS

### Round 1 Caller Reconciliation

All findings are reconciled before remediation. The caller does not accept a complete-feature claim with an explicit requested preference choice unreachable in the supported settings path.

**W3-SETTINGS-SHADOW-CYCLE — ACCEPT_BLOCKING, caller priority P1 (functional requirement), rather than Oracle's P2 recommendation.** Governing sources: user's selectable persisted options requirement, design decision8, native settings requirement and AM03/AM04. These expressly require users to choose/save the offered values even while project/CLI precedence is displayed; the actual-source reproduction shows that promise fails. This is a bounded feature-correctness defect, not optional assurance or a new scope. **CORRECTION:** reuse native explicit-value selection for the affected activity fields or otherwise decouple persisted selection cursor from effective display; preserve truthful override display/layering, global field-only writes and existing preview/editor/lifecycle behavior. Add targeted real-source repeated-choice coverage for CLI and project shadowing. Do not change shared SettingsList or unrelated settings.

**W3-VALIDATION-SCOPE — DEFER_OUT_OF_SCOPE for candidate repair; retain the historical process finding.** Governing no-build instruction was violated and cannot be retroactively satisfied. Existing parent reconciliation remains authoritative, failed worker is not reused, no build/cleanup retry is warranted. Preserve disclosure at delivery; no source patch or speculative ignored-artifact rollback is approved.

**W3-QUALIFICATION-DOC — ACCEPT_NONBLOCKING P3.** Governing task3.2/3.3 documentation. **CORRECTION:** update README to accurately distinguish retained completed source qualification, pending whole-wave caller acceptance and failed build-compliance outcome; no installed-release claim.

The acceptance boundary remains literal and unchanged; no structural family has recurred after an accepted patch, no rebuild is warranted. Record the corrected candidate revision before round2, and use PATCH-mode accepted-fix verification plus bounded whole-wave regression. Round1 of at most4 consumed; one rebuild remains unused. All wave3 checkboxes stay unchecked and no commit is authorized here.

REVIEW_ACTION=PATCH
CONSENSUS_STATUS=PENDING

### Round 2 Remediation Dispatch

Workflow `62fa0086-afb0-4076-8026-4b1e57b53d01` starts fresh selected `worker` under key `whimsical-wave3-patch-r2`, bound report `extension/wave3-patch-round-2.md`, 45-minute child/50-minute enclosing bound and mission `a4026756-c567-4eb7-bd10-10a40979a161`. Explicit batch is W3-SETTINGS-SHADOW-CYCLE plus W3-QUALIFICATION-DOC only, with host activity-submenu/cohesive tests/README ownership and narrow affected test-caller adaptation. No shared SettingsList/other production scope, interim gate or failed-session reuse. Explicit checked criteria prohibit every build/install/full-test command; evidence requires changed focused suites, bounded whole-wave regression, host check and empty index. Root/Loader retained checks are reused unless invalidated. Same final gate3.4 follows parent reconciliation and recorded revised candidate.

### Round 2 Remediation Reconciliation and Candidate Revision

Workflow `62fa0086-afb0-4076-8026-4b1e57b53d01`, fresh worker `c8c746c4-4a7c-49b1-be9b-da50680b6516`, completed successfully. Parent read the full managed patch report, actual activity-submenu conversion and README, inspected final logs and both repository identities/indexes/whitespace. Actual batch changes are six existing files: activity submenu, four cohesive settings/preferences/effects test consumers and README. The16-line source conversion reuses native explicit-value SelectSubmenu for all six cycle fields; rows still display effective values, saves remain global/field-only and project/CLI precedence stays unchanged. No shared SettingsList/API change, new lifecycle/settings authority, build/install/full-test/staging/commit or foreign-artifact change occurred.

Final logs `/tmp/whimsical-wave3-patch-62fa0086-focused-final.log` record four changed suites/34 passed, and `source-final.log`19 whole-wave suites/273 passed; both exit0 after formatting. `host-check-final.log` records full host check1683 files/all stages passed, one owned test formatting fix followed by final tests. `boundary-final.log` preserves prior source/artifact/dependency/ignored-dist work and confirms empty indexes/unchanged HEADs/clean whitespace. Negative original-source reproduction fails both targeted regressions; fixed CLI saves Reduced/Plain/Normal while effective remains Normal, and project-shadow coverage saves every cycle choice with unchanged project storage and effective preferences. Preview/editor/effects tests remain intact: zero indicator provider/fetch calls and equal normalized prompt SHA256 `f3841577bc450df7b2b62ce8bc4619453257e2e7f6d2c94e706cd9d8366fcc00`.

Root123 and Loader11 retained checks remain valid with unchanged code/consumers. Parent made a documentation-only pre-review clarification in README: current count273 and acceptance recorded separately in owning tasks/review log, rather than a pending assertion that would become stale after this gate. This does not invalidate source/test evidence; it is included in the newly frozen candidate. The historical build-compliance failure stays disclosed and is not repaired or relabeled.

PATCH_BASELINE_REVISION=sha256:0af74823f7cf363cf8ab105ad43993a2f0ecbb6528ca708f64d80a08def51d78

Parent independently recomputed the same50-file input set/algorithm. All four boundary fields remain literal and unchanged. No writer is active; review mode is PATCH, second Oracle round at the same gate3.4, no rebuild used. Both accepted corrections are ready for independent verification, not caller PASS or completed tasks.

### Round 2 Oracle Dispatch

Workflow `1d0f65c3-52b8-42ce-8326-449040aeb11b` resumes completed/reconciled independent oracle `b60c1bb4-b2c3-486c-9e9a-ea0b7b422aa7` under key `whimsical-wave3-oracle-r2`, managed output `oracle/wave3-round-2.md`, 45-minute child/50-minute enclosing bound and mission `79b311e6-8044-4924-843f-f6258d3baeb9`. PATCH-mode review uses latest recorded revision `0af74823f7cf363cf8ab105ad43993a2f0ecbb6528ca708f64d80a08def51d78`, accepted-fix verification and bounded whole-wave regression; same frozen boundary/final gate3.4, read-only scope and advisory role. Historical failed writer/build provenance remains included without retry or retroactive compliance.

## Round 2 - Oracle Review

PATCH-mode final gate3.4 reviewed all completed3.1–3.3 assignments plus the accepted correction batch. Workflow `1d0f65c3-52b8-42ce-8326-449040aeb11b`, independent oracle child `f0e5fc68-420e-4875-a967-e47033770314`, completed successfully; full managed report is `oracle/wave3-round-2.md` under that workflow. Oracle inspected corrected activity submenu, all four affected test consumers, README, governing requirements and retained whole-wave logs. No new findings or unresolved product blocker were identified.

**W3-SETTINGS-SHADOW-CYCLE — resolved:** all six formerly cyclic activity fields use existing native explicit selection, while rows display effective values. Actual CLI coverage saves Reduced/Plain/Normal under effective Normal; project-shadow coverage saves every offered value with unchanged project/effective settings and exact global field-only writes. Highlight/cancel does not save.

**W3-QUALIFICATION-DOC — resolved:** README accurately reports retained source/TUI qualification, separately records caller acceptance and preserves failed build-compliance/installed-release limitations. **W3-VALIDATION-SCOPE** remains the already-reconciled historical process deviation; no retroactive compliance or new remediation is proposed.

Independent before/after candidate remains `sha256:0af74823f7cf363cf8ab105ad43993a2f0ecbb6528ca708f64d80a08def51d78`, all four frozen boundaries unchanged, HEADs unchanged/indexes empty/whitespace clean. Bounded whole-wave review reused19 suites/273 source tests, changed4 suites/34 tests, full host1683-file checks, root123/Loader11 evidence, original-behavior negative regression, actual TUI/editor captures and zero-indicator provider/fetch/equal-prompt effects. No tests/builds/install were rerun during review; no ownership/API/persistence/lifecycle drift was found.

PROPOSED_REVIEW_ACTION=PASS

### Round 2 Caller Assessment and Terminal Validation

Parent read the complete terminal review, reread the persisted new Oracle section and confirmed exactly one advisory PASS; this wave consumed two Oracle rounds and no rebuild. No new finding exists. **W3-SETTINGS-SHADOW-CYCLE:** accepted functional blocker is resolved by actual explicit-choice behavior/regressions. **W3-QUALIFICATION-DOC:** accepted nonblocking correction is resolved. **W3-VALIDATION-SCOPE:** historical process deviation remains deferred for candidate repair and disclosed; failed worker status/build effects are not retroactively approved.

Immediately before terminal action, parent independently compared all four frozen boundary fields literally with current wave authority and recomputed the current50-file candidate as `0af74823f7cf363cf8ab105ad43993a2f0ecbb6528ca708f64d80a08def51d78`, equal to the latest recorded PATCH revision and Oracle's before/after identity. Both HEADs/indexes/whitespace remain current; no writer is active. All assignment outcomes and evidence are reconciled; no accepted in-scope blocking product finding remains. This is source/offline/TUI acceptance, not installed-release/live-PTY/exhaustive assurance or certification of the earlier worker's instruction compliance.

REVIEW_ACTION=PASS
CONSENSUS_STATUS=APPROVED

### Completion and Commit Authorization

Caller PASS at the existing gate3.4 permits marking tasks3.1–3.4 complete. Task-checkbox/progress prose updates are administrative completion records after validating the reviewed candidate, not unreviewed source changes. Source/test/README bytes remain the accepted revision. No archive or commit is performed. Although the apply workflow calls for scoped commits, the nearer host AGENTS explicitly requires a user commit request and the owning tasks preserve that restriction. The wave's implementation/qualification is complete; obtaining permission for host/root scoped commits is the remaining workflow action. Indexes stay empty; foreign paths remain excluded.

### Final Advisory Oversized-File Opportunities

The Step14 amendment audit checks maintained local source/tests and change-touched host source/tests, excluding generated/vendor/fixtures/data/output. All new responsibility modules and new handwritten tests are below1000 physical lines. These existing host integration surfaces remain separate decomposition opportunities, not reasons to reopen accepted scope:

- `host/pi/packages/coding-agent/src/core/settings-manager.ts` — **1555 lines**, pre-wave1530, +25 preference accessors. Separate typed settings accessors from storage/layering/flush responsibilities without duplicating settings authority; defer to a separate host decomposition change.
- `host/pi/packages/coding-agent/src/modes/interactive/components/settings-selector.ts` — **1018 lines**, pre-wave992, +26 submenu wiring. Separate ordinary item construction and model/terminal submenus from selector mounting/navigation; the activity submenu is already independently owned. Defer unrelated broader UI reorganization rather than enlarge this amendment.
- `host/pi/packages/coding-agent/src/modes/interactive/interactive-mode.ts` — **7043 lines**, pre-wave7024, +19 settings integration. Independent settings/authentication/resource surfaces are potential extraction boundaries, retaining run/focus/lifecycle authority. Activity logic/preview are already coherent separate modules; defer unrelated broad refactoring.
- `host/pi/packages/coding-agent/src/core/extensions/types.ts` — **2277 lines**, pre-wave2267, +10 exported types. Existing deployed public-API declaration surface is an external-contract exemption; any future type separation requires stable exported import compatibility.

Earlier completed-wave audit opportunities for runner observation and the existing interactive status test remain documented above and unchanged by this amendment. No automatic split or extra Oracle loop is performed solely for these advisory counts.

Final completion checks: `openspec validate add-whimsical-activity-indicator --strict --json` exits0, valid with zero issues; `openspec instructions apply --change add-whimsical-activity-indicator --json` exits0 and reports `all_done`,12/12 complete,0 remaining. Session diagnostics have no blocking errors; existing proposal MD041 and untouched README fenced-language MD040 are documentation advisories, not introduced source failures. No further tests/builds or archive were run. User commit permission remains outstanding for both repositories; the accepted source implementation stays unstaged.

## Wave 4 Review Sequence

### Apply Resume and Ownership

The user resumed `/opsx-apply-loop` for the reviewed foreground-metadata amendment, then explicitly selected the available `oracle` with model `xai/grok-4.7:high` after `oracle1` was unavailable. This is a per-dispatch override for this OpenSpec change only, not a project/global agent override. The default implementation owner remains `worker`; focus mode is normal. Historical wave reviews remain unchanged. The additional 1,000-word proposal under `docs/plans/whimsical-activity/` is excluded from runtime integration and this wave.

Root HEAD is `90151f0d2baf1acec21692c0c163192fc8658e5f`; host HEAD is `04ef561b360a233254187d63ce1b575058e387b0` (detached source checkout). Both indexes were empty before dispatch. Existing dirty/untracked work is preserved; it is not grounds for cleanup or unrelated repairs. Git safety checks required command-scoped `-c safe.directory=<exact repository>` for inspection; no global Git configuration was changed.

## Round 1 - Implementation Assignments

Final gate **4.4**, reserved for `oracle` (`xai/grok-4.7:high`), is excluded from writer dispatch. Only one whole-wave gate may run after all non-gate assignments and evidence are reconciled.

The implementation is one tightly coupled native activity-presentation seam. Observations, settings, width allocation and refresh lifetime share the existing NativeActivityDecoration/StatusIndicator contract; concurrent component writers would overlap these files and require artificial API handoffs. One writer is explicitly qualified for logic and terminal UI, executing ordered responsibilities:

- **4.1 — worker, logic:** NativeActivityDecoration foreground scalar observations/lifetime and narrow InteractiveMode event wiring; focused MD01–MD04/MD07 tests and native API docs.
- **4.2 — worker, logic + terminal UI:** Existing preference normalization/persistence/submenu and StatusIndicator border/container composition, with token→elapsed→action→whimsy omission, metadata controls and docs; focused MD05–MD07/AT/AM tests.
- **4.3 — same worker, integration qualification only after 4.1/4.2:** Source-event/settings/render/controller composition and actual TUI evidence, MD01–MD08, execution neutrality and focused regressions, root/host checks with retained full logs. No new architecture, provider changes or unrelated cleanup.

Exclusive writer targets are the existing host activity presentation/observation/settings/render surfaces, associated focused tests/API docs, root README and local structural preference types only where actual compatibility requires them. The runtime word bank, proposal assets, dependencies/lockfiles, provider/protocol/footer execution and installed releases are excluded. The parent exclusively owns OpenSpec/ADRs, review reconciliation and checkboxes; the worker may not stage, commit, delegate or edit review-control sections.

Validation and candidate revision evidence will be recorded after the writer returns. Required checks remain focused suites and root/host `npm run check`; no full host suite/build/live provider calls. Earlier passing evidence is reused only where unaffected; baseline warnings are reported rather than fixed by widening scope. No task checkbox changes precede caller-owned whole-wave PASS.

### Observation Attribution Decision

Worker `033de033-5dde-4e3b-9ae0-759408d87351` reported that current public main-session message events have no run/response ids and streamed/final message objects differ. Parent inspected InteractiveMode subscription/event handling and AgentSession `_emit`/`_handleAgentEvent`/`_emitExtensionEvent`. The actual main-session subscription is approved as foreground provenance, with subscription/reset epoch, retained native run and scoped response/tool observation handles; nested calls use existing `parentToolCallId`. This does not authorize provider/protocol changes, invented ids or a second lifecycle. Arbitrary untagged injected old starts cannot be distinguished solely from these public events and are not claimed as qualification.

The worker must still qualify reachable asynchronous source delivery: AgentSession awaits extension handlers before public notification, and InteractiveMode can await initialization. Ownership must be captured/rechecked across those boundaries, stale observation handles revoked and response usage finalized once. A real reordered/stale production sequence defeating that scope must be reported before widening the source seam; synchronous fixture ordering alone is not sufficient evidence.

### Round 1 Implementation Reconciliation

Workflow `5c4d9885-8bae-4aee-b4bc-3870e6b39af0` and worker `033de033-5dde-4e3b-9ae0-759408d87351` completed successfully. Parent read the complete managed report `host/wave4-metadata-implementation.md`, checked assignment-only patches, native observation/rendering seams, validation exits/totals and actual terminal captures. Tasks 4.1–4.3 are implemented and ready for independent review; task 4.4 and all wave-4 checkboxes remain pending. Worker evidence is `/tmp/pi-wave4-TdYvBa`; parent reconciliation evidence is `/tmp/pi-wave4-parent-lfupe2vy`.

Actual assignment scope is four root files and nineteen host files, listed in worker `changed-files.json`. Changes add host-only scalar observations and monotonic elapsed, independent preferences/submenu controls, shared border/container metadata fitting, scoped static elapsed refresh, focused tests and documentation. Bank/controller/selector runtime bytes remain unchanged. No provider/protocol/footer/dependency/lockfile/installed-release edits, staging or commits occurred. Parent attribution-decision prose is separately preserved, not attributed to the worker.

Parent verified all nineteen host and three of four root final file hashes. The remaining root controller test differs solely by multiline formatting of the two newly added preference objects; reconstructed worker bytes match its recorded digest. Current-file qualification therefore reran only that suite: `node --experimental-strip-types --test test/whimsical-activity/activity-controller.test.ts`, root workdir, 30/30 passed, exit 0. Full output and the formatting contrast are retained in parent evidence. A first sandbox-local log disappeared with sandbox teardown; this durable `/tmp` run replaces it rather than claiming retained output. No source behavior changed during reconciliation.

Retained final worker checks: host `npm run check` exit 0 (1686 files, all dependency/import/entry/lock/type/browser checks); twenty explicit coding-agent suites, 273/273 passed; Loader 11/11 passed; root typecheck passed, but root check exit 1 with 120/124 passed. Four failures are in unchanged session-title/Herdr lifecycle fixtures; the isolated same suite reproduces four failures. Its extension, fixtures and suite have no assignment delta and use the installed development host, not the modified source metadata. This separates those failures from the exercised source feature, but does not establish their exact environmental cause or claim a green root suite. They remain disclosed residual qualification risk for Oracle, not authorization to patch unrelated timing or installed packages.

Actual offline source terminal captures show response reception/100 reported tokens, two tools/150 tokens, permission-wait suppression, resize/live draft and restored full width, settlement, and status-container reception. Reduced/Plain captures and effects/source tests qualify the remaining MD cases. Source CLI exit is 0 and its test tmux session is absent. No live-provider or installed-release qualification is claimed. Parent's current root/host whitespace checks pass; HEADs are unchanged and both indexes remain empty. No writer is active. Existing root failures do not prevent reviewing completed source qualification; acceptance remains caller-owned after the whole-wave gate.

### Round 1 Frozen Whole-Wave Baseline

BASELINE_TARGET=add-whimsical-activity-indicator wave 4, tasks 4.1–4.3 and final gate 4.4
BASELINE_TARGET_REVISION=sha256:51ca4fb80d07b3522975532d861ddf64c59f4f7acccae4a86b25991abefdaf9d
BASELINE_SOURCE=owning OpenSpec proposal/design/delta spec/tasks, approved attribution decision, root 90151f0d2baf1acec21692c0c163192fc8658e5f and host 04ef561b360a233254187d63ce1b575058e387b0 working trees
BASELINE_INCLUSION_PREDICATE=foreground metadata observations/lifetime, native preferences/settings/rendering/refresh, local structural compatibility, MD01–MD08 qualification and relevant AT/AM regression boundaries
BASELINE_EXCLUSIONS=completed waves 1–3 except regressions caused by wave 4; proposal-only additional word bank; unrelated dirty work; provider/protocol/footer execution changes; dependencies/lockfiles/install/build/full-suite/live-service work; commit/archive authority

The revision is the SHA256 of the sorted 31-file content-digest manifest at `/tmp/pi-wave4-parent-lfupe2vy/wave4-candidate.sha256`, including actual wave files, unchanged local controller/selector/bank and the four owning artifacts. It identifies this candidate, not a closed-world scope or clean-tree requirement. Review mode is FULL, first Oracle round for wave 4; no rebuild has been used. The user-selected `oracle` receives invocation-only `xai/grok-4.7:high` in fresh context; no persistent agent settings change.

### Round 1 Oracle Dispatch

Async workflow `e8dd8fca-5c78-464f-a06c-f234571b046d` dispatches independent `oracle` under key `whimsical-wave4-oracle-r1`, fresh context, invocation-only `xai/grok-4.7:high`, managed output `oracle/wave4-round-1.md`, 45-minute child/50-minute enclosing bound, attached to mission `a729d05a-4357-4686-9a4d-00486088dc75`. Gate 4.4 reviews the entire completed 4.1–4.3 mapping in FULL mode against the recorded revision and boundary. It is read-only, with retained full evidence and narrow offline repro permission only if a concrete uncovered issue requires it. No mutating host check, broad suite, source/spec edits, staging, commit or delegation is authorized. Launch is not completed execution or acceptance. Parent resumes automatically on native completion, reconciles every finding and validates the candidate before any terminal action; all wave-4 tasks remain pending meanwhile.

### Oracle Launch Failure Reconciliation and Same-Protocol Recovery

Workflow `e8dd8fca-5c78-464f-a06c-f234571b046d` failed before reviewer execution: `fast mode supports only native openai-codex/* models; unsupported model: xai/grok-4.7.` Status identifies provisional child `5834d886-a5e1-4e7c-a418-91c75c47834f`, but the terminal receipt records no executed child/session/output and rejects resumability. This is launch infrastructure failure, not product failure or an Oracle review round; no Oracle section/proposal exists.

Parent reconciled terminal status/receipt, verified the frozen candidate remains `51ca4fb80d07b3522975532d861ddf64c59f4f7acccae4a86b25991abefdaf9d`, confirmed unchanged root master/host detached HEADs and empty indexes, and captured both existing dirty diffs/statuses in `/tmp/pi-wave4-parent-lfupe2vy/review-fast-failure`. No reviewer project write occurred. Corrective prerequisite is explicit per-invocation `fast: false` for the workflow and child, retaining the user-selected `oracle`, fresh context and `xai/grok-4.7:high`. Retry uses the same governed async protocol and the same unconsumed Round 1/gate 4.4, without global settings, model fallback or rerunning valid product checks.

### Round 1 Corrected Oracle Dispatch

After the user's `continue`, workflow `35bbdf10-8482-47b5-8cb2-c3b41cd769bf` launches key `whimsical-wave4-oracle-r1-fast-off`, selected `oracle`, fresh context, exact invocation model `xai/grok-4.7:high`, and explicit `fast: false` at workflow and child level. Managed output remains `oracle/wave4-round-1.md`; the same mission, 45-minute child/50-minute enclosing deadline, unchanged frozen candidate/boundary and read-only whole-wave contract apply. Native completion will resume caller reconciliation automatically. This is still the first executed review if launch succeeds, not a second Oracle round; launch alone does not consume acceptance or complete gate/task checkboxes.

## Round 1 - Oracle Review

Workflow `35bbdf10-8482-47b5-8cb2-c3b41cd769bf` and independent `oracle` child `2d8dc256-c515-4c45-bd09-42b736f235b9` completed successfully on the change-only Grok invocation. Complete managed output is `oracle/wave4-round-1.md` under that workflow. FULL-mode gate 4.4 reviewed the entire exclusive ordered mapping: 4.1 observations/lifetime; 4.2 native settings/rendering/refresh and local structural typing; 4.3 whole-wave source/TUI qualification. Oracle inspected the source/tests and recomputed the same 31-file candidate before and after review. HEADs/indexes/whitespace/bank and the four boundary fields were unchanged. No P0/P1/P2/P3 product finding, drift, patch or rebuild was proposed.

Oracle covered retained elapsed origins, top-level tool/reception action, reported snapshot replacement/finalization, default-on settings/layering, shared fitting and native priority, bounded refresh/suppression/revocation, real source async seams, local selection neutrality and AT/AM test ownership. Approved trusted-subscription attribution remains unchanged; arbitrary untagged injected stale starts are not claimed. Qualification is source/offline, not installed-release/live-provider qualification.

**Evidence gap:** both prior `/tmp` evidence directories were absent in the reviewer environment. Oracle could inspect source/tests and current candidate but could not reread the raw focused/root/host/Loader logs, terminal captures or parent formatting contrast. It did not rerun suites or label the reported Herdr failures green. The full report explicitly discloses those gaps and recommends acceptance subject to caller reconciliation.

PROPOSED_REVIEW_ACTION=PASS

### Round 1 Caller Assessment — Qualification Evidence Recovery

Parent read the full terminal Oracle output; it contains exactly one advisory proposal and no findings needing a correction/disposition. The recommendation is source-review evidence, not acceptance. Parent independently confirmed that `/tmp/pi-wave4-TdYvBa`, `/tmp/pi-wave4-parent-lfupe2vy` and their temporary scripts are now absent. Earlier parent-read exits/captures remain historical observations in this log, but missing full output cannot continue to be described as available retained evidence. Required task-4.3 qualification is therefore not yet ready for final caller action or checkbox completion.

The frozen 31-file manifest was reconstructed from the original exact input set, independently recomputed to the unchanged `51ca4fb80d07b3522975532d861ddf64c59f4f7acccae4a86b25991abefdaf9d`, and saved with current root/host dirty diffs/statuses under the session-managed durable directory `subagent-artifacts/qualification/wave4-recovery-afnhbxga`. HEADs remain unchanged and both indexes empty. The four baseline boundaries remain unchanged; no product/specification patch or rebuild is authorized by the gap.

Recovery repeats only missing qualification output against this unchanged candidate, not implementation or the already completed source review. Fresh `/tmp` logs will also be copied immediately to that durable session-artifact directory so a later `/tmp` disappearance does not lose them. The completed worker `033de033-5dde-4e3b-9ae0-759408d87351` could not be located by either status or authoritative resume (`Async run not found. Provide id or dir.`); no retained session was revived. A labeled fresh same-role worker fallback is therefore appropriate for evidence-only task 4.3. It may recreate disposable offline test/terminal harnesses, but may not edit product/spec/review files, change acceptance, commit or widen scope. Existing unrelated root failures remain disclosed unless a new full current run actually passes.

### Evidence Recovery Dispatch

Workflow `097f2e82-a931-4777-a7f2-afddb75bef26` starts the fresh same-role `worker` fallback under key `whimsical-wave4-evidence-recovery`, managed output `host/wave4-evidence-recovery.md`, 60-minute child/65-minute enclosing bound, same mission. Its assignment is task-4.3 evidence only: restore exact focused/root/host/Loader check output, actual offline source terminal captures and cleanup, and candidate/bank/controller neutrality; no product/spec/test edits or acceptance. Each fresh `/tmp` log/harness/capture is immediately copied to a distinct recovery subdirectory of `/home/zenji/.pi/agent/sessions/--mnt-8CE085C2E085B2CE-Src-Tools-pi--/subagent-artifacts/qualification/wave4-recovery-afnhbxga`. Source changes or a newly exposed defect must be escalated, not silently repaired. The completed Oracle source review remains Round 1; evidence recovery does not authorize a per-task review or a new implementation wave.

### Evidence Recovery Reconciliation and Gate Follow-Up

Workflow `097f2e82-a931-4777-a7f2-afddb75bef26`, worker `9b5cb374-0a13-4ebc-92d0-cc2be0c0066c`, completed evidence-only recovery. Parent read its complete managed report `host/wave4-evidence-recovery.md`, inspected full host/focused logs, cleanup output and representative actual terminal captures, and independently checked current manifest bytes plus every validation exit/TAP total. Durable evidence is `subagent-artifacts/qualification/wave4-recovery-afnhbxga/recovered-097f2e82/` under the same session root. Raw streams and all harness/capture/check files are now outside transient `/tmp`.

Current host check exits 0, 1686 files, no formatter fixes. Exactly twenty coding-agent suites pass 273/273; Loader passes 11/11. Current root check exits 0 with typecheck and 124/124 tests passing. The previous four Herdr failures remain historical outcomes, not retroactively green; no fixture/installed-host fix or proven environmental root cause is claimed. Both repository whitespace checks, index checks and cleanup/neutrality check exit 0. No repository source/test/artifact/dependency changes occurred during recovery; before/after dirty scope and HEADs/indexes are identical. Parent's independent current candidate matches all 31 frozen files and revision `51ca4fb80d07b3522975532d861ddf64c59f4f7acccae4a86b25991abefdaf9d`.

Three actual offline source terminal runs qualify both native surfaces, count→remaining tool, reported 100→150→190 run subtotal versus cumulative footer, permission wait/resume, live paste/draft/cursor/resize/overflow priority, native metadata toggles/help, retained Reduced word with elapsed updates, Plain and ASCII. Full terminal stream is 805150 bytes, CLI exit 0; owned session/processes are absent and foreign tmux work is preserved. No network attempts were recorded; focused effects separately measure zero indicator provider/fetch requests and identical normalized prompts. Honest unsuccessful preliminary picker captures are retained but excluded from qualification.

The missing-output gap is repaired, with source review and frozen boundaries still valid. To close Oracle's explicit inability to inspect task-4.3 raw evidence, reuse its successfully completed/reconciled independent session for one bounded whole-wave gate follow-up in PATCH mode: inspect the newly available evidence and sweep the unchanged whole target without repeating implementation or already-passing checks. There are no accepted product fixes and no new candidate revision; this is Round 2 at the same final gate 4.4, not a per-task/interim gate. Caller acceptance and checkboxes remain pending until that follow-up is reconciled.

### Round 2 Oracle Evidence Follow-Up Dispatch

Workflow `79a4e753-4929-4f6d-828f-89c113b125a2` resumes reconciled independent Oracle `2d8dc256-c515-4c45-bd09-42b736f235b9` under new key `whimsical-wave4-oracle-r2-evidence`, managed output `oracle/wave4-round-2.md`, same mission and 45-minute child/50-minute enclosing bound. Its stored `oracle`/`xai/grok-4.7:high`/Fast-off contract is retained, without model or global-setting override. PATCH-mode review inspects restored durable task-4.3 output and performs a bounded unchanged whole-wave sweep at gate 4.4; no source changes, accepted product correction batch or new candidate revision exists. No tests/builds/checks are to be rerun during read-only review. Round 1 is complete and the second review awaits execution, with no rebuild; the source remains frozen pending native completion and caller reconciliation.

### Round 2 Resume Launch Failure Reconciliation

Workflow `79a4e753-4929-4f6d-828f-89c113b125a2` failed before resumed reviewer execution with the same unsupported Fast/xAI message; no resumed child/session/output was produced. Top-level `fast: false` alone did not prevent the resumed `runs.run` item from inheriting Fast. The earlier claim that Fast-off was retained by resume is therefore unsupported and corrected: explicitly pass `fast: false` on each xAI child launch **and resume**, as well as the enclosing call. No provider/model/global-setting change is authorized.

Parent reconciled terminal failure, recomputed the unchanged frozen candidate, reconfirmed root master/host detached HEADs and empty indexes, and retained current dirty diffs/statuses in durable `qualification/wave4-recovery-afnhbxga/oracle-resume-fast-failure-mbnkkcy9`. No product or test write occurred; successful recovery checks remain valid and are not repeated. The failed pre-execution attempt is not Oracle round 2 and does not invalidate the completed Round 1 session `2d8dc256-c515-4c45-bd09-42b736f235b9`. Same-protocol retry keeps that session, same gate/candidate/role/model/boundary, with the concrete child-level Fast correction.

### Round 2 Corrected Resume Dispatch

Workflow `2ba3fb9d-c56a-4ad9-993b-33979cc681b0` resumes successful Oracle `2d8dc256-c515-4c45-bd09-42b736f235b9` under key `whimsical-wave4-oracle-r2-evidence-fast-off`, explicitly setting `fast: false` on the child resume item and enclosing invocation. Managed output remains `oracle/wave4-round-2.md`; same role/model/gate/candidate/boundary, mission and deadlines apply. No product check is repeated. Caller awaits native completion and will reconcile actual evidence and candidate before acceptance; failed launch attempts do not count as executed Oracle sections.

### Resume Contract Blocker and Fresh Same-Role Fallback

Workflow `2ba3fb9d-c56a-4ad9-993b-33979cc681b0` also failed before execution with unsupported Fast/xAI, despite explicit child-resume and enclosing `fast: false`. No new child/session/output exists. The earlier proposed flag correction is therefore insufficient on the resume path, and no further unchanged resume retry is authorized. This is an infrastructure limitation, not a product finding or completed Oracle round.

The observed supported path is a fresh `oracle` launch with exact per-child `xai/grok-4.7:high` and `fast: false`, which already executed successfully in Round 1. A labeled fresh same-role fallback within the **same native async workflow protocol** changes the failing resume prerequisite without switching provider/model, using external/foreground tools or changing global settings/package code. Resume was attempted and rejected; the prior completed reviewer remains valid source-review evidence, not a failed session to revive. Parent reconfirmed the unchanged candidate/HEADs/empty indexes and captured current dirty scope in durable `qualification/wave4-recovery-afnhbxga/oracle-fresh-fallback-b4dqo9r5`. Valid recovered checks are reused without rerun. The fallback receives the complete frozen bundle, prior report and recovered evidence for the same unexecuted Round 2 whole-wave gate. If that supported fresh launch fails, report the concrete infrastructure blocker instead of repeating unchanged work.

### Round 2 Fresh Fallback Dispatch

Workflow `5bb96e06-190d-461b-8eb3-b279e13972c7` launches fresh selected `oracle` under key `whimsical-wave4-oracle-r2-fresh-fallback`, exact per-child model `xai/grok-4.7:high` and `fast: false` (also enclosing Fast off), managed output `oracle/wave4-round-2.md`. Same mission, 45-minute child/50-minute enclosing deadline, PATCH-mode whole-wave gate and unchanged frozen source/boundary apply. Prior source review and restored durable raw evidence are supplied cold-start complete. No source edits, model/global setting changes, test/check repeats or third-party execution-mode fallback is authorized. Native completion will resume caller reconciliation; final acceptance remains pending.

## Round 2 - Oracle Review

Workflow `5bb96e06-190d-461b-8eb3-b279e13972c7`, fresh independent `oracle` child `5e902e5e-0019-4227-8520-d02c30d03987`, completed the same gate 4.4 in PATCH mode on `xai/grok-4.7:high` with Fast off. Full managed report is `oracle/wave4-round-2.md` under that workflow. It reviewed the entire ordered mapping—4.1 observations/lifetime, 4.2 native preferences/settings/rendering/refresh and local structural typing, 4.3 source/actual terminal qualification—against the unchanged bundle and prior source review, not a per-task gate.

Oracle independently matched all 31 candidate paths before/after to `51ca4fb80d07b3522975532d861ddf64c59f4f7acccae4a86b25991abefdaf9d`, with unchanged HEADs, empty indexes and literal boundary fields. It inspected recovered **raw** host/focused/root/Loader logs and exits, exact twenty-suite argv, neutrality/cleanup, offline provider/sentinel/launcher/events and selected actual terminal captures. Current host check passes with no fixes, focused tests pass 273/273, Loader passes 11/11 and root typecheck/tests pass 124/124. Historical missing Herdr-failure logs are not retroactively green or explained.

All MD01–MD08 and relevant AT/AM boundaries are covered: monotonic wait/retry retention, actual top-level actions, reported snapshots/final-only subtotal 190 versus cumulative footer 380/570, independent native toggles/help and retained live state, both surfaces' width order, Reduced/static elapsed, Plain, wait/settlement/cleanup, actual source async attribution, headless suppression, zero indicator/fetch/network attempts and unchanged prompts/bank/controller/selector. Honest failed preliminary picker/obstructed captures remain excluded. No test/check/build was rerun during review. No P0/P1/P2/P3 product finding, source drift or correction is proposed. The missing raw-output gap from Round 1 is closed.

Residual limits remain source/offline rather than installed/live-provider/modified-Enter qualification, unproven historical Herdr cause, approved inability to distinguish arbitrary untagged injected old starts, and existing large-file opportunities outside this amendment. They are not new product blockers or authorization for cleanup.

PROPOSED_REVIEW_ACTION=PASS

### Round 2 Caller Assessment and Terminal Validation

Parent read the complete terminal review and reread the newly persisted Wave 4 Round 2 section from disk: exactly one advisory proposal, two executed Oracle rounds and no rebuild. There are no product findings requiring a disposition or corrective batch; both reviews found no P0/P1/P2/P3 defect. The actual missing-evidence gap that held acceptance is now resolved by durable current raw qualification and independent inspection, not by overlooking it. Historical Herdr failures remain historical and unexplained; the separately retained current 124/124 pass qualifies current bytes without claiming a root-cause repair. Approved source/offline, subscription-attribution and transport exclusions remain explicit.

Immediately before terminal action, parent independently recomputed all 31 frozen candidate files to `51ca4fb80d07b3522975532d861ddf64c59f4f7acccae4a86b25991abefdaf9d`, equal to the latest recorded and independently reviewed revision. All four target/source/inclusion/exclusion boundary fields literally match the current owning bundle and approved scope. Both HEADs remain unchanged, indexes empty and whitespace checks clean; no writer or unreconciled owned job remains. Current checks and actual terminal/effects evidence meet tasks 4.1–4.3 and MD01–MD08; no accepted in-scope blocker remains. Parent—not Oracle—accepts this whole wave at the existing gate 4.4.

REVIEW_ACTION=PASS
CONSENSUS_STATUS=APPROVED

### Completion Records and Commit Boundary

This caller PASS permits marking tasks 4.1–4.4 complete. Subsequent checkbox/progress prose and removal of README's now-obsolete pending-review sentence are administrative completion records, not a new implementation or behavior claim. Product source, tests, bank, settings contracts and qualification remain the reviewed bytes. Reviewed pre-completion manifest is preserved; any post-completion manifest will separately identify these status-only changes rather than pretend Oracle reviewed their exact bytes.

No staging, commit or archive is performed. Explicit applicable user authorization for scoped root/host commits remains outstanding under the owning tasks and nearer host AGENTS. The uncommitted qualified source checkout is not an installed or published release. Foreign work and proposal-only additional word assets stay excluded. Final OpenSpec validation/progress checks and the whole-change advisory oversized-file audit follow this PASS before reporting completion.

### Final Whole-Change Oversized-File Audit

The Step 14 audit covers maintained local source/tests and change-touched host source/tests, including earlier committed wave-1 integration surfaces. Generated/vendor/fixture/snapshot/migration/data files are excluded. No new responsibility module or newly added handwritten test exceeds 1000 physical lines. These six existing files remain advisory opportunities; do not reopen the accepted change or split unrelated host responsibilities automatically:

- `host/pi/packages/coding-agent/src/modes/interactive/interactive-mode.ts` — **7096 lines**. Wave 4 adds narrow scalar event/subscription wiring; extract independent settings/authentication/resource or native event-presentation regions in a separate host change, preserving one run/focus/subscription authority. The metadata helper already owns the coherent lifetime seam.
- `host/pi/packages/coding-agent/src/core/settings-manager.ts` — **1555 lines**. Earlier wave 3 added typed preference accessors; wave 4 reuses them unchanged. Separate typed accessors from storage/layering/flush without duplicating settings authority; defer outside this amendment.
- `host/pi/packages/coding-agent/src/modes/interactive/components/settings-selector.ts` — **1018 lines**. Earlier wave 3 added submenu wiring; wave 4 uses the independently owned activity submenu. Separate ordinary item construction and model/terminal submenus from mounting/navigation in a future change.
- `host/pi/packages/coding-agent/src/core/extensions/runner.ts` — **1606 lines**. Earlier wave 1 added synchronous prompt observation; wave 4 leaves it unchanged. Potential separation is prompt observation versus command/shortcut resolution and event transforms, retaining one runner validity/depth authority.
- `host/pi/packages/coding-agent/test/interactive-mode-status.test.ts` — **1256 lines**. Earlier wave 1 added the no-op API fixture field; wave 4 leaves this fixture unchanged. Cohesive status/tool-expansion, custom-UI/theme, autocomplete and loaded-resource groups can become separate behavior suites with shared fixture support; defer unrelated reorganization.
- `host/pi/packages/coding-agent/src/core/extensions/types.ts` — **2277 lines**. Existing public declaration surface includes earlier decoration exports. This deployed external-contract surface is exempt from automatic splitting; any future separation must preserve exported import compatibility.

The 513-line NativeActivityDecoration lifecycle helper was considered by both independent reviews; neither found a harmless split without duplicating lifetime authority or adding forwarding-only wiring. Advisory counts are not product blockers, and no fifth gate or new specification is created for them.

### Final Completion Verification

Tasks 4.1–4.4 are now checked after the same whole-wave gate's caller PASS; earlier waves remain accepted. README removes only the obsolete pending-review assertion, retaining uncommitted/source-only release limitations. Parent verified that the only differences from the independently reviewed 31-file manifest are `tasks.md` completion prose/checkboxes and this README status sentence; every product source/test/bank byte is unchanged.

POST_COMPLETION_RECORD_REVISION=sha256:315f4905c525cbe067dcb173eefa48977fb8c8bb41a1ccec2c80d6fd7b35fcbf

This separate administrative content identity is retained as `post-completion-candidate.sha256`, not falsely attributed to Oracle. Reviewed pre-completion revision and manifest remain preserved. Final logs are durable under `qualification/wave4-recovery-afnhbxga/completion-948c23xz/`: strict OpenSpec validation exits 0 with no issues; status exits 0; apply instructions exit 0 and report `all_done`, **16/16 complete, 0 remaining**. Both final whitespace checks pass and indexes remain empty. Session diagnostics have no blocking errors; the untouched README L29 MD040 fenced-language advisory remains out of scope. No tests/builds were repeated for these documentation-only completion records.

All owned delegated runs are reconciled. Source/offline implementation and qualification are complete, not installed/published/live-provider assurance. Historical failed runs and lost historical raw logs remain disclosed; current durable qualification is green. Scoped root/host commit authorization remains outstanding, and no archive, staging, commit, package/global-settings modification or foreign cleanup occurred.
