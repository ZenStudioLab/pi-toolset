# Proposal Review: add-pi-opencode-bridge

## Review target and handoff

Invocation: `/omo-plan-review add-pi-opencode-bridge`, change-bundle path; this is the prepared handoff, not a completed reviewer dispatch.

`/<name>` may refer to either a registered command or a loaded skill, depending on the active toolset.

selected reviewer: oracle
selected default implementation specialist: worker
focus mode: focus
orchestrator mode: normal
review mode: change_bundle
convergence mode: FULL

The available global `omo-plan-review.md` and `opsx-apply-loop.md` prompts were located. Executable `oracle` and `worker` agents were confirmed through native capability discovery; the reviewer domain skill and review-convergence guidance are available. Orchestrator retains specification/ADR edits, per-finding reconciliation, authoritative actions, task completion, and external repository integration. Oracle remains independent and advisory. Initial implementation owners and completed-wave Oracle gates are recorded in `tasks.md`.

## Frozen baseline

BASELINE_TARGET=OpenSpec change bundle add-pi-opencode-bridge
BASELINE_TARGET_REVISION=sha256:3c696e1086b013c377a06d2d2b076291ba200802159d7da4d8dee7f44e59dbc0
BASELINE_SOURCE=openspec instructions apply --change add-pi-opencode-bridge --json; confirmed user exploration decisions
BASELINE_INCLUSION_PREDICATE=Internal consistency, scoped feasibility, acceptance criteria, task ownership, and dependency ordering of the four canonical apply-context artifacts for the standalone managed OpenCode provider and storage-only submodule integration
BASELINE_EXCLUSIONS=Implementation edits, live provider requests, remote repository creation/push, submodule installation, npm publication, unrelated activity/speech/bookmark/subscription work, shared bridge framework, delegation mode, and qualification of every external model or untested runtime version

Revision identity is SHA-256 over the ordered relative path, NUL, file bytes, NUL for each canonical context file below. This identifies the review candidate only; it is not a working-tree cleanliness or publication proof.

Canonical `contextFiles` from OpenSpec:

- `openspec/changes/add-pi-opencode-bridge/proposal.md`
- `openspec/changes/add-pi-opencode-bridge/specs/opencode-provider/spec.md`
- `openspec/changes/add-pi-opencode-bridge/design.md`
- `openspec/changes/add-pi-opencode-bridge/tasks.md`

## ADR assessment

A new package-owned ADR is needed for tool-execution authority, managed runtime/authentication ownership, and standalone repository boundaries. Task 1.1 is the first pending task, owned by Orchestrator, and writes `extensions/pi-opencode-bridge/docs/adr/0001-pi-owned-opencode-provider.md` before implementation code. Root ADRs 0001-0003 cover activity/speech and remain unchanged; the proposed package has no existing ADR directory or source. Material proposal changes require reassessing this decision before the next review.

## Preparation evidence

- Schema: `spec-driven`; proposal, design, specs, and tasks all report done.
- Apply state: `ready`; 17 tasks remain, zero implementation tasks completed.
- `openspec validate add-pi-opencode-bridge --strict --json`: passed with no issues.
- Installed OpenCode reports 1.18.29; its tagged source was inspected, but no server or bridge was started.
- The initial qualification pair is proposed, not tested. Wave 1 gates real finite-batch tool handoff and configuration inheritance before expansion.
- The standalone repository returned HTTP 404 to the current account. No repository was created or code downloaded for execution.
- The checkout contained 43 pre-existing changed/untracked paths before proposal creation. Those unrelated files and staged submodule entries were not edited by this task.

## Review dispatch authorization

The user explicitly approved native background review with `async: true`, resolving the original foreground-only workflow conflict. This authorizes independent proposal review and its in-scope planning corrections only, not implementation. The earlier wording that the host technically required background execution was corrected: the restriction came from the active tool's operating instructions, not a tested runtime rejection.

The four canonical artifacts still match the frozen candidate revision before dispatch. Invoke the selected Oracle against this exact bundle, require it to load plan-review-expert and review-convergence, and collect its read-only findings through the native result/output artifact. The built-in Oracle is read-only; the caller appends its returned review to this log without granting artifact-edit authority. Reconcile every finding, preserve the four-round/one-rebuild cap, and validate the latest candidate revision/frozen boundary before an authoritative terminal action.

## Terminal job reconciliation - Round 1

Workflow `87b13925-0e26-407f-b973-d77dc3608c1f` and child `116617c6-2dc9-4056-98e6-e19cb6dd306a` completed. The caller read the exact managed `reviews/round-1.md` output, confirmed one advisory proposal and no caller-owned control lines, and rechecked the unchanged candidate digest. Oracle reported read-only source inspection; no project edits, installations, servers, or provider calls occurred. The 43 foreign status entries remain present. The caller independently inspected the pinned backend retry, title-inference guard, and compaction/prune flag source before accepting corrections. Result: two findings ready for caller reconciliation; no implementation handoff.

---

## Round 1 - Oracle Review

**Target:** `add-pi-opencode-bridge`, change_bundle / FULL.  
**Candidate:** `sha256:3c696e1086b013c377a06d2d2b076291ba200802159d7da4d8dee7f44e59dbc0`; recomputed and matched.  
**Assessment:** One High and one Medium finding. Narrow planning amendments are sufficient; no scope rebuild is indicated.

### Inherited decisions

- Provider-only integration; Pi remains the tool executor and conversation authority.
- Dedicated bridge-owned loopback OpenCode runtime, not shared-server attachment.
- Standalone repository with storage-only submodule integration; root activation, dependencies, and foreign work remain unchanged.
- Released, unpatched Pi 0.99.2 / OpenCode 1.18.29 is the proposed qualification pair—not an established compatibility result.
- Wave 1 must qualify the real MCP/Pi handoff and configuration seam before expansion. Source inspection and mocks cannot satisfy that gate.
- Review is planning-only. No implementation handoff is warranted.

### Coverage and gaps

Read both required skills, the frozen review boundary, and all four canonical artifacts. Checked goals, dependencies, task ordering, ownership, acquisition prerequisites, repository boundaries, streaming, cancellation, context replay, qualification, and acceptance criteria.

Static runtime evidence was inspected from local Pi documentation/types and OpenCode commit `16747470f976aca3d362ad730bcd3fe82ecc2c9a`. No servers, provider requests, installations, or reviewed-package execution occurred.

**Bounded completeness inventory:**

| Claim/boundary | Inventory and assessment |
|---|---|
| Every eligible discovered model | OpenCode catalog `all`, membership in `connected`, model `capabilities.input.text`, `output.text`, and `toolcall`; distinct provider/model routing; refresh failure/removal. Covered by specification scenarios and task 2.1. Make both text directions explicit in the eligibility implementation. |
| Applicable model metadata | Reasoning, image capability, context/input/output limits, pricing/cache rates and applicable tiers; exclude provider keys/options/headers from persisted catalog diagnostics. Tasks 2.1–2.3 cover the adaptation boundary without claiming exhaustive external-model qualification. |
| Tool execution authority | Current Pi declarations → actual MCP request → distinct pending invocation → Pi ordinary hooks/execution → matched result; observational events, unknown/native calls, parallel calls, cancellation and late events. Well specified. Actual finite-batch feasibility remains deliberately unqualified. |
| Configuration authority | Global, explicit-file, project, home-directory, process-inline, remote/account configuration; configured/discovered plugins, instructions, agents, skills, native/custom tools and unrelated MCP surfaces. Selective inheritance and the real sentinel gate address this boundary, but effective tool lists alone cannot establish absence of loading/install side effects. |
| Backend session control | Append-only reuse, incompatible context reset, retained role/tool semantics, attachments, cancellation and recovery. Backend-owned retry and history transformations remain insufficiently addressed; findings below. |

No repository-wide inventory was derived. Resource availability, GitHub access, dependency acquisition approval, paid-provider access, and runtime feasibility remain future prerequisites, correctly distinguished from completed work.

### Findings — ordered by severity

#### F1 — High — Backend retries can repeat a completed Pi tool operation

- **Family / root identity:** `execution-authority / backend-retry-after-effect`
- **In-scope:** Yes.
- **Artifact evidence:** `design.md`, Decisions 6, assigns retry ownership to Pi and prohibits automatic replay of possibly effectful calls. `tasks.md`, task 1.5, verifies **server failure** after execution; task 2.5 prohibits a competing replay loop. Neither explicitly addresses OpenCode retrying a provider stream while its server remains healthy.
- **Governing source/risk:** `specs/opencode-provider/spec.md`, “Preserve actionable failures without silent fallback,” prohibits replaying a tool operation after ambiguous failure. The concrete risk is duplicated filesystem or other Pi-tool effects.
- **Runtime evidence:** At the pinned OpenCode commit, `packages/opencode/src/session/processor.ts:641–688` wraps the LLM stream in `Effect.retry(SessionRetry.policy(...))`. `packages/opencode/src/session/retry.ts:31–40,183–205` permits retries for transient HTTP/transport failures. This is distinct from the AI SDK `maxRetries` setting in `session/llm.ts:323`. Local Pi also classifies transport/server errors as retryable in `host/pi/packages/ai/src/utils/retry.ts`, with recovery initiated in `coding-agent/src/core/agent-session.ts`, `_prepareRetry`.
- **Diagnosis:** Omitting a bridge-authored retry loop does not establish single retry ownership. A provider failure after an MCP result may make OpenCode restart inference and issue a fresh invocation identity for the same operation. The currently required server-termination test does not exercise that path.
- **SUGGESTED_CORRECTION:** Extend Decisions 6 and task 1.5’s existing real-runtime gate to control backend retry after any accepted tool handoff. Inject a retryable provider failure/disconnect after a Pi result while OpenCode remains alive, and verify no repeated execution, no resumed obsolete request, settled handoffs, and safe subsequent Pi-owned recovery. Specify how backend retry is prevented or intercepted before re-execution and how host retry cannot resurrect the failed request. If the pinned public surface cannot enforce this, stop at Wave 1’s existing architectural-amendment boundary.

#### F2 — Medium — OpenCode-owned history changes and auxiliary inference are absent from the session policy

- **Family / root identity:** `context-authority / unmanaged-backend-session-policy`
- **In-scope:** Yes.
- **Artifact evidence:** `design.md`, Decisions 3 and 5, establishes selective configuration and Pi-authoritative retained context; Decision 6 assigns overflow recovery to Pi. `tasks.md`, tasks 2.2 and 2.4, checks accounting and Pi-originated context changes but does not explicitly qualify backend-originated compaction/pruning or auxiliary title inference.
- **Governing source/risk:** Specification requirements “Keep Pi context authoritative” and “Normalize provider streaming and metadata.” Hidden backend history changes can invalidate an apparently append-compatible cursor; auxiliary requests can introduce unreported inference and accounting.
- **Runtime evidence:** Pinned `session/prompt.ts:1161–1167,1320–1327,1338` invokes backend compaction/pruning. `session/compaction.ts:271–275` describes clearing older tool output; `session/overflow.ts:28` checks the backend auto-compaction setting. `session/prompt.ts:193–235,1132–1139` separately generates a title using a title agent/small model and its own retries. Config flags for disabling automatic compaction/pruning exist in `packages/core/src/flag/flag.ts:25–28`.
- **Diagnosis:** A minimal bridge agent and compatible context cursor do not themselves control these independent backend behaviors. Their treatment should be explicit rather than left to ordinary OpenCode defaults.
- **SUGGESTED_CORRECTION:** Add a concise backend-session policy to Decisions 3/5/6 and the existing tasks: prevent autonomous compaction/pruning from changing retained Pi semantics, route evidenced overflow back to Pi, and suppress unnecessary title inference or explicitly account for any retained auxiliary request. Verify forced overflow/long tool history and first-session startup using the controlled runtime fixture; document any unavoidable backend transformation as a qualification limitation.

### Drift / contradiction check

The package, runtime ownership, routing, version boundary, repository integration, and expansion order consistently preserve the confirmed scope. The outstanding contradictions concern **existing backend controllers**, not a need for delegation, host patches, a shared framework, hostile-client requirements, or additional review machinery.

The unproven finite-batch handoff and selective authentication inheritance are appropriately treated as go/no-go experiments. Their uncertainty alone is not a planning blocker.

### Recommendation and residual risks

Patch the existing owning design/tasks for F1; address F2 within the same bounded amendment if accepted. Preserve the current Wave 1-first architecture and qualification pair.

Residual risks:
- No reliable public SDK/MCP finite-batch boundary may exist.
- Configuration loading may install dependencies or execute plugin hooks before effective configuration can be inspected. The pinned `config/config.ts:438–479` and `plugin/index.ts:181–225` make that distinction material.
- Authentication integration preservation, image-result fidelity, unknown accounting presentation, and role-labelled replay still require runtime evidence.
- Local Pi source is useful inspection evidence, not qualification of the released loader.

**Need from main agent:** Reconcile both findings; no clarification is required to complete this review.  
**Suggested execution prompt:** None—planning only; no implementation handoff.

PROPOSED_REVIEW_ACTION=PATCH

---

## Caller Assessment - Round 1

Review mode: change_bundle. Convergence mode: FULL. Subject: add-pi-opencode-bridge.

### F1 - backend-retry-after-effect

- Oracle severity: High; caller severity: High; in-scope: YES.
- GOVERNING_SOURCE: `specs/opencode-provider/spec.md`, Requirement “Preserve actionable failures without silent fallback,” forbids automatic tool replay after ambiguous failure; Requirement “Execute tool calls exclusively through Pi” requires exactly-once execution of each accepted invocation. Duplicated filesystem/tool effects are a concrete correctness risk.
- Decision: ACCEPT_BLOCKING.
- CORRECTION: Extend the existing retry policy and Wave 1 task 1.5 to prevent/intercept OpenCode's native session retry after tool acceptance, retire the failed generation, settle pending MCP requests, and keep Pi host retry from resuming it. Verify a transient provider failure after a real tool result with the OpenCode server still healthy. Stop at the existing gate if the public runtime cannot enforce this without bypassing Pi's executor or patching hosts.

### F2 - unmanaged-backend-session-policy

- Oracle severity: Medium; caller severity: High; in-scope: YES.
- GOVERNING_SOURCE: `specs/opencode-provider/spec.md`, Requirement “Keep Pi context authoritative,” limits backend reuse to compatible retained Pi context and rejects hidden backend history; Requirement “Normalize provider streaming and metadata” requires accurate inference/usage attribution. Backend auto-pruning/compaction can silently invalidate the context cursor, directly contradicting this core ownership contract rather than presenting optional polish.
- Decision: ACCEPT_BLOCKING.
- CORRECTION: Disable backend automatic compaction/pruning through supported child-process controls, provide an explicit non-default backend session title to suppress title inference, and surface evidenced overflow to Pi. Extend existing configuration/context/accounting checks to observe first-turn auxiliary traffic and backend-originated history behavior. Retain the same runtime pair and gate; no new product mode or inference service is added.
- Notes: The priority adjustment is caller-owned and based on the existing context-authority contract. The pinned source exposes `OPENCODE_DISABLE_PRUNE` and `OPENCODE_DISABLE_AUTOCOMPACT`, and `ensureTitle` exits for a non-default session title. These are concrete proposed controls to qualify, not runtime claims.

### Summary

- Accepted blocking: 2; accepted nonblocking: 0; deferred: 0; rejected: 0.
- The correction batch is bounded to existing design/tasks. There is no change to the frozen acceptance boundary, user scope, ownership, or architecture; no rebuild is required. ADR assessment remains unchanged.
- Review receipt is reconciled. No source or implementation task is marked complete.

REVIEW_ACTION=PATCH
CONSENSUS_STATUS=NEEDS_REVISION

## Accepted patch and Round 2 candidate

Both accepted corrections are implemented in the owning planning artifacts only: design Decisions 3/5/6 and tasks 1.3/1.5/2.4 now control native backend retry, suppress autonomous history transformations/title inference, and require the corresponding real-runtime checks. Proposal/spec requirements, product scope, implementation routing, and the four frozen boundary fields remain unchanged. Strict OpenSpec validation passes; all 17 implementation tasks remain pending, with one Oracle gate per wave. ADR need/ownership is unchanged because these controls enforce the already-selected Pi-authority decision rather than introduce another architecture.

PATCH_BASELINE_REVISION=sha256:4a19d16455c2083cf812a03a1b592fbbfb827564873d7004a53ce1c3ccc63d35
BASELINE_TARGET_REVISION=sha256:4a19d16455c2083cf812a03a1b592fbbfb827564873d7004a53ce1c3ccc63d35

Next review mode is PATCH. Round 2 must verify both accepted corrections and perform a bounded whole-bundle regression sweep; it must not limit inspection to edited lines. No rebuild has occurred and one Oracle round has been used.

## Terminal job reconciliation - Round 2

Resumed Oracle run `ac074f75-eae5-45ba-8034-0624e52a2c1d` completed; native status confirms process termination. The caller read the exact managed output, confirmed it is Round 2 despite reuse of the original output filename, and found exactly one advisory proposal with no caller-owned control lines. The retained Round 1 report is preserved above. Oracle reported no project edits, installations, servers, or provider calls. The caller recomputed the current candidate and compared all four frozen boundary fields literally before terminal judgment; every value matches the latest recorded baseline. No further remediation is needed.

---

## Round 2 - Oracle Review

**Mode:** change_bundle / PATCH.  
**Candidate:** `sha256:4a19d16455c2083cf812a03a1b592fbbfb827564873d7004a53ce1c3ccc63d35`; independently recomputed and matched before and after review.  
**Assessment:** Both accepted planning corrections are addressed. No remaining Critical/High planning findings or new regression findings.

### Inherited decisions and boundary

The frozen target, source, inclusion predicate, exclusions, and routing remain unchanged. Provider-only operation, Pi-owned tools/context, dedicated loopback runtime, standalone repository/storage-only submodule, and the proposed Pi 0.99.2/OpenCode 1.18.29 qualification pair are preserved.

This is Round 2 of the existing sequence; no rebuild occurred. Planning acceptance does not qualify runtime behavior or authorize implementation.

### Accepted-finding verification — severity order

#### F1 — High — `execution-authority / backend-retry-after-effect`

- **In-scope:** Yes.
- **Status:** Resolved as a planning gap; runtime enforcement remains unqualified.
- **Exact artifact evidence:** `openspec/changes/add-pi-opencode-bridge/design.md`, Decision 6, now distinguishes OpenCode native session retry from SDK retries, requires failed-generation retirement and pending-handoff settlement, rejects subsequent callbacks, and prevents Pi host retry from resurrecting an effectful failed turn. `openspec/changes/add-pi-opencode-bridge/tasks.md`, task 1.5, requires a retryable provider failure **after a real Pi result while OpenCode stays healthy**, separately from server termination.
- **Source/risk verification:** Pinned OpenCode `packages/opencode/src/session/processor.ts:674–688` invokes native retry; `session/retry.ts:183–205` publishes the retry transition before its scheduled delay. Local Pi `host/pi/packages/ai/src/utils/retry.ts`, `isRetryableAssistantError`, confirms that host retry classification must also be controlled. Duplicate tool effects remain the governing risk under the specification’s no-ambiguous-replay requirement.
- **Diagnosis:** The correction covers the previously missing controller and failure injection. Supported disablement or interception is explicitly conditional, with a real-runtime stop gate if enforcement fails; it is not presented as implemented protection.
- **DEFERRED_REASON:** No further planning correction is needed. Enforcement timing, generation rejection, and non-retryable host behavior must be demonstrated by task 1.5—not inferred from these source observations.

#### F2 — High — `context-authority / unmanaged-backend-session-policy`

- **In-scope:** Yes.
- **Status:** Resolved as a planning gap; runtime behavior remains unqualified.
- **Priority assessment:** The caller’s High classification is defensible under “Keep Pi context authoritative”: autonomous clearing or summarization of retained history directly affects the core ownership contract.
- **Exact artifact evidence:** `openspec/changes/add-pi-opencode-bridge/design.md`, Decision 3, names both child-process flags and an explicit non-default session title, requiring observed behavior and first-session traffic checks. Decision 5 stops unexpected backend transformations and routes evidenced overflow to Pi. Decision 6 suppresses title inference. `openspec/changes/add-pi-opencode-bridge/tasks.md`, tasks 1.3 and 2.4, respectively require auxiliary-traffic observation and forced-overflow/long-tool-history checks.
- **Source/risk verification:** Pinned `packages/core/src/flag/flag.ts:25–28` defines the flags; `packages/opencode/src/config/config.ts:593–597` applies them. `session/prompt.ts:199–200` skips title inference for non-default titles, and SDK `types.gen.ts:9476–9491` exposes session creation’s `title`. These support the proposed controls without proving all overflow paths are controlled.
- **Diagnosis:** Configuration presence is no longer substituted for observed behavior. Unexpected backend changes invalidate continuation rather than quietly becoming authoritative history.
- **DEFERRED_REASON:** No further planning correction is needed. First-turn suppression, overflow propagation, and retained-history preservation remain explicit qualification obligations in the existing waves.

### Whole-bundle regression coverage

Re-read both required skills, the complete review log/reconciliation, and all four canonical artifacts—not just modified lines.

- **Packaging/ownership:** Standalone source, lockfile, tests and ADR ownership remain coherent; root integration stays storage-only and preserves foreign work.
- **Dependencies/order:** ADR and reviewed dependency acquisition precede implementation; the real Wave 1 seam precedes expansion; released-loader qualification and approved optional live checks precede final integration. All 17 implementation tasks remain pending.
- **Bounded catalog inventory:** Connected-provider intersection, text-chat/tool capability eligibility, distinct provider/model identities, applicable metadata, refresh failure/removal, and discovery-versus-entitlement distinctions remain covered. No whole-repository inventory or exhaustive model qualification was introduced.
- **Tool/config authority:** Actual MCP requests remain the handoff authority; Pi hooks/execution, invocation identity, failed outcomes, batching, cancellation and late-event rejection are preserved. Selective configuration inheritance still requires real sentinel evidence.
- **Streams/context/failures:** Balanced events, snapshot deduplication, accounting, attachments, context replay/reset, actionable diagnostics and no silent fallback remain consistent with the new controls.
- **Proportionality/convergence:** No new product mode, host patch, shared framework, review lane, or scope expansion appeared. Neither original issue recurs as an unresolved structural gap.

### Recommendation and residual risks

Accept the amended planning bundle. No implementation handoff is warranted.

Remaining risks are intentionally gated: finite-batch feasibility, safe retry interception, configuration/plugin acquisition side effects, authentication inheritance, forced-overflow handling, attachment fidelity, and released-loader compatibility. No servers, installs, inference calls, project edits, staging changes, or delegation occurred.

PROPOSED_REVIEW_ACTION=PASS

---

## Caller Assessment - Round 2

Review mode: change_bundle. Convergence mode: PATCH. Subject: add-pi-opencode-bridge.

### Per-issue resolution

- F1 retains its Round 1 ACCEPT_BLOCKING disposition and governing no-ambiguous-replay/tool-authority sources. Its planning correction is verified and closed: design Decision 6 and task 1.5 address native retry and host resurrection with the specified healthy-server failure injection. Runtime enforcement remains an explicit Wave 1 obligation, not a remaining planning defect.
- F2 retains its Round 1 ACCEPT_BLOCKING disposition and governing Pi-context/accounting sources. Its planning correction is verified and closed: design Decisions 3/5/6 and tasks 1.3/2.4 control history/title behavior and require observed qualification. The source supports the proposed flags/title guard; no runtime success is inferred.
- No new findings require acceptance, deferral, rejection, or target edits. The two Round 2 entries are verification of resolved issues, not new out-of-scope deferrals.

### Summary and terminal validation

- New findings: 0; accepted blocking remaining: 0; accepted nonblocking: 0; deferred: 0; rejected: 0; previous blocking findings closed: 2.
- Oracle rounds used: 2 of 4; rebuilds used: 0 of 1.
- All four frozen boundary fields literally match the current target/source. Current candidate matches the latest recorded revision `sha256:4a19d16455c2083cf812a03a1b592fbbfb827564873d7004a53ce1c3ccc63d35`.
- Strict OpenSpec validation passes. The four planning artifacts are apply-ready and all 17 implementation tasks remain pending. Package code, remote repository, submodule, runtime tests, and live provider checks have not been created or run.
- ADR assessment and focus routing remain unchanged. Implementation starts only on a separate user request through `/opsx-apply-loop add-pi-opencode-bridge`.

REVIEW_ACTION=PASS
CONSENSUS_STATUS=APPROVED
