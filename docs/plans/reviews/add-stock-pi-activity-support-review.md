# Hybrid Activity Proposal Review

## Review handoff

Invocation: `/omo-plan-review add-stock-pi-activity-support` in change-bundle mode.
Selected reviewer: `oracle`.
Selected default implementation specialist: `worker`.
Focus mode: `normal`.

`/<name>` may refer to either a registered command or a loaded skill, depending on the active toolset.

The latest user choice is B: stock Pi works by default, with optional advanced features on the patched host. It supersedes the preceding A selection. The user explicitly authorized initialization in the public repository and automatic `/opsx-apply-loop` after proposal PASS. The orchestrator retains reconciliation authority; publication remains separate.

## Frozen proposal baseline

BASELINE_TARGET=add-stock-pi-activity-support apply-ready change bundle
BASELINE_TARGET_REVISION=sha256:2abe923bce1b24adde7b8a988520dbef197f5b6b8d890b04f5a7c589093c2d33
BASELINE_SOURCE=User hybrid selection B; public pi-toolset HEAD 06ce7daa28889905eaa27bcc5f14e5389130fa51; released Pi public working UI APIs; existing advanced implementation
BASELINE_INCLUSION_PREDICATE=Hybrid backend selection, stock lifecycle/flags/cleanup, preservation of advanced path, honest installation and feature disclosure, focused offline qualification, owner and wave-gate mapping
BASELINE_EXCLUSIONS=Host or installed-release modifications, upstream work, dependency/lockfile changes, new bank content, stock metadata/settings parity, other extensions, npm publication/version bump, pushes and tags

The revision is SHA-256 over UTF-8 relative path + NUL + file bytes, in this order: proposal.md; design.md; specs/hybrid-activity-compatibility/spec.md; tasks.md. Paths are relative to `openspec/changes/add-stock-pi-activity-support/`.

Canonical contextFiles from the apply CLI:

- `openspec/changes/add-stock-pi-activity-support/proposal.md`
- `openspec/changes/add-stock-pi-activity-support/specs/hybrid-activity-compatibility/spec.md`
- `openspec/changes/add-stock-pi-activity-support/design.md`
- `openspec/changes/add-stock-pi-activity-support/tasks.md`

## Preparation and authority

The public root was clean on `main` at the recorded HEAD before initialization. `openspec init --tools none` created only project planning structure without modifying managed prompts/skills. `openspec list --specs` returned no specs. The original mixed repo's advanced implementation is complete (16/16); this change concerns new public-package compatibility, not reimplementation of that advanced scope.

Both exact agents are registered and executable. Use their current defaults with fresh independent reviewer context; the original change's invocation-only Grok override does not apply here. No agents or global settings were modified.

Owner mapping: orchestrator writes ADR task 1.1 first; worker writes runtime/tests/user docs for 1.2–1.4 with explicit terminal-UI responsibility; oracle reviews the full numbered wave at sole gate 1.5; caller owns task completion and commit. Read-only reviewers return artifacts; the caller appends them here rather than granting review-log write permission.

ADR check used the applicable `architecture-decision-records` skill because no exact architecture-decision-record command was found. A short ADR is required before implementation. Historical reference: original mixed repo `docs/adr/0001-native-activity-decoration.md`; no applicable public-root ADR existed. No upstream ADR edit is implicated because host source is excluded.

Strict OpenSpec validation passed (exit 0), apply state is ready, 0/5 tasks complete. Logs: `/tmp/.ctx-mode-AP9q1J/pi-hybrid-proposal-Tn9X3a/` (status/apply/validate stdout, stderr, exit files). Herdr tab rename succeeded. No session-name tool is exposed in this API session; no claim is made that the Pi session display name was changed.

## Review sequence

First review mode: FULL. At most four Oracle rounds and one rebuild. Review recommendations do not create requirements; every accepted blocker needs exact governing-source provenance. No implementation starts until caller reconciliation validates this bundle's current revision and emits PASS.

## Round 1 - Oracle Review

Oracle run `8159b9da-6c84-4488-b053-20734837bb2f`, workflow `1d570b0e-35ee-4b25-8a93-0b0a3ac5175d`, completed successfully. Full read-only report: `/home/zenji/.pi/agent/sessions/--mnt-8CE085C2E085B2CE-Src-Tools-pi--/subagent-artifacts/outputs/1d570b0e-35ee-4b25-8a93-0b0a3ac5175d/oracle/hybrid-proposal-round-1.md`.

Findings: none at Critical, High, Medium, or Low severity. Oracle independently recomputed the matching bundle digest and checked all four canonical artifacts plus relevant entry/controller/monitoring/loader tests and stock source.

Evidence highlights: released 0.87.1 public working setters support restoration/static/empty frames; installed 0.99.2 InteractiveMode applies setters only to working indicators; extension events precede public listeners; native working display starts on turn_start and clears on agent_end. Stock Loader supports zero/one-frame modes without animation intervals. Session abort/shutdown precedes invalidation. Advanced refusal and dormant disable registration remain authoritative.

Coverage: advanced accepted/declined, capable/missing stock APIs, eligibility modes, invocation controls, loop/session lifecycle, UI authority, package/render qualification, and task-owner/gate mapping. No scope drift or contradictory requirements were found. Implementation, rendered captures, packed loading, and test results remain unqualified pending apply; shared-setter interference and untested host versions remain disclosed limitations. No tests, builds, installs, or provider calls were performed by the reviewer.

PROPOSED_REVIEW_ACTION=PASS

## Caller Assessment — Round 1

Review mode: change_bundle. Convergence mode: FULL. Subject: add-stock-pi-activity-support.

Terminal reconciliation: the workflow and child completed; report read in full; no reviewer-authored repository modifications or staged files were found. Root has only this task's new planning/review directories. Existing ignored host checkout remains at detached `005af57d88ee23b33778f343a9595b32e67ff788` with its pre-existing advanced patch; it is not implementation scope.

Per-issue decisions: none required because the report has no findings. Counts: accepted blocking 0; accepted nonblocking 0; deferred 0; rejected 0. The caller independently confirms that proposal-level feasibility is supported, while actual behavior must still pass task 1.3 and whole-wave gate 1.5.

Terminal baseline validation: the four frozen boundary fields are unchanged; current bundle digest is exactly `sha256:2abe923bce1b24adde7b8a988520dbef197f5b6b8d890b04f5a7c589093c2d33`, matching the reviewed candidate. No rebuild used; one of four review rounds consumed.

REVIEW_ACTION=PASS
CONSENSUS_STATUS=APPROVED

Automatic continuation: enter `/opsx-apply-loop add-stock-pi-activity-support`, write ADR 1.1 before assigning worker 1.2–1.4. No task checkbox is completed until caller PASS for the full implementation wave. Publishing, version bump, push, and tag remain excluded.
