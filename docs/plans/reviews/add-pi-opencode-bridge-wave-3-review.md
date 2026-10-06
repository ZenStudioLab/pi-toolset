# Wave 3 — released-loader qualification and repository integration

Owning change: `openspec/changes/add-pi-opencode-bridge/`. User explicitly requested continuing Wave 3 after Wave 2 caller PASS. Tasks3.1–3.4 remain exclusively Orchestrator-owned; task3.5 is the sole completed-wave independent Oracle advisory gate. No per-task reviews or other delegation. Source baseline is accepted standalone Wave2 commit `25aa9ae`; the parent recorded Wave2 acceptance in `d8223fa`.

The bounded target is numbered Wave3: packed/released-loader qualification, the explicitly approved or deliberately omitted selected live smoke, authorized private repository/SSH publication, storage-only submodule integration and their documentation. Preserve all prior tool/credential/context safeguards, foreign work, root exports/dependencies/settings and unrelated processes. Do not publish npm or substitute a paid model. The five frozen review fields and final candidate/source revisions will be recorded before the completed-wave gate, not inferred from partial task evidence.

## Implementation assignments and evidence

### 3.1 — Orchestrator

Added package `files` allowlist for src/README/ADR and `test/released-loader.test.ts`. The test packs/extracts outside the toolset, confirms the declared entry and exclusion of tests/node_modules/git metadata, copies the existing reviewed lockfile, and installs only production dependencies from the existing offline Yarn cache with scripts disabled and frozen lockfile. No dependency symlinks or downloads; host-provided peers are not bundled. It loads through released unpatched Pi1.0.4's DefaultResourceLoader and actual AgentSession with isolated workspace/settings/auth paths and synthetic loopback provider configuration.

Verified catalog/model selection without inference, two real tool turns and hooks, abort during a third tool, fresh-user recovery, loader reload, package removal and exit of observed owned children. The fixture initially supplied an empty SDK tool allowlist and failed with no active tools; correcting the test to the documented explicit `probe` allowlist resolved that harness error without production changes. An earlier ExtensionError diagnostic field mismatch was corrected from `message` to the actual `error` API. One command had a mistyped cwd and launched no process; corrected before retry. No failed invocation is claimed as qualification evidence.

Final typecheck passed4.30seconds; ordinary full suite passed51/51 with normal exit28.90seconds, including packed production-dependency qualification. SDK-loader/session lifecycle is tested; a separate TUI/CLI interaction is not claimed. README documents install/load/unload, exact tested pair, and the SDK host's need to run extension shutdown lifecycle before synchronous dispose. Final Wave3 review remains pending.

### 3.2 — Orchestrator, approved live attempt unavailable

Read-only owned-runtime catalog discovery found exact connected eligible pair `opencode/muse-spark-1.3-contributor-free`, advertised zero token prices and text/image input; zero inference calls issued. Necessary operator authentication remained in memory/owned child environment; no credentials or full catalog payload were printed or written.

Current official catalog https://opencode.ai/zen/v1/models includes `muse-spark-1.3-contributor-free`. Official https://opencode.ai/docs/zen/ lists Muse Spark1.3 Contributor Free as Free for input/output/cache read, available for a limited period. Its privacy exception explicitly allows prompts/completions to train future Meta models; linked details: https://dev.meta.ai/docs/pricing-rate-limits#contributor-tier. Catalog metadata is not entitlement or a billing guarantee. These prerequisite checks issued no inference. The subsequent approval request covered a fixed synthetic prompt plus one harmless echo-tool schema/result, excluding project files/private conversation. Availability/free pricing was rechecked at execution; no paid model was substituted.

### 3.3 — Orchestrator, source published privately

GitHub CLI authenticates as `ZenStudioLab`. The proposed repository returns404; SSH read access to the existing `ZenStudioLab/pi-toolset` succeeds. No organization membership/policy was available for this account (organization endpoints return404); do not request broader admin scopes. Apply the owning task's private-initial-repository default. No overwrite, public publication or npm release is authorized. Created the previously absent repository as private and verified `private=true` plus push/admin access through GitHub's API. Committed the qualified packed-loader test/manifest/docs as `779a8eaa4e2375287c174f6b32141b5ae58b6893`, set exact SSH origin `git@github.com:ZenStudioLab/pi-opencode-bridge.git`, and pushed main without force. SSH ls-remote equals the local commit. No npm publication or visibility change to an existing repository occurred.

### 3.4 — Orchestrator, storage integration prepared

Registered the existing standalone checkout through standard git submodule add, then absorbed its Git directory into parent metadata. Verified mode160000 gitlink `779a8eaa4e2375287c174f6b32141b5ae58b6893` and exact SSH URL. Prior `.gitmodules` contents were preserved. Before/after comparisons confirm root exports, runtime dependencies, Pi package manifest and `.pi/settings.json` unchanged. Added only a concise storage-only section to root README. Root integration remains staged/uncommitted pending final gate; no automatic loading was enabled.

### 3.5 — completed-wave Oracle gate

Tasks3.1–3.4 now have recorded outcomes, including the explicitly approved live attempt rejected for access. Checkboxes remain pending until whole-wave caller acceptance. Use a fresh-context Oracle for this new wave: prior resumed sessions twice needed stale-task clarification; a new bounded handoff avoids carrying those obsolete task prompts forward.

## Approved human decision — live-smoke egress

The user explicitly replied `approve`, clearing the single pending wait and authorizing one synthetic text/echo-tool round trip to exact `opencode/muse-spark-1.3-contributor-free`, currently connected and listed free. Payload is a minimal smoke-test system instruction, request to call `bridge_echo` with `text=ping` once then reply `pong`, its harmless echo-tool schema and `ping` result. No project files, private conversation or other tool declarations are included. Authentication is used normally by OpenCode without being placed in prompt content or logs. The Contributor tier permits prompts/completions to train future Meta models. Recheck current free availability before execution; stop rather than substitute a paid model.

Approval is resolved. The first preflight selected the endpoint-table row rather than the pricing-table row and stopped before creating a session or issuing inference. A read-only inspection identified both rows; the corrected preflight required the actual Free/Free/Free price row and confirmed the exact public model ID. This harness-only failure is not a live attempt or passing qualification.

The single approved inference attempt used released Pi1.0.4's actual loader/AgentSession, isolated Pi settings/session/workspace, a minimal synthetic system prompt and only `bridge_echo`. Exact connected model and zero-price catalog metadata were rechecked before selection; Pi retries and compaction were disabled. It returned `OpenCode provider access denied; check its authentication and model entitlement.` Tool calls/executions and both tool hooks remained0; terminal outcome was error. No model fallback, automatic replay or second inference attempt occurred. No private project data or existing conversation was supplied. Session resources were unloaded and the owned temporary workspace removed.

Outcome: the selected live target is unavailable for this credential/entitlement context. The smoke was attempted, not deliberately omitted; no successful external authentication/model/tool-round-trip qualification is claimed. This follows task3.2's unavailable-target outcome while accurately distinguishing a rejected request from a check never run. Controlled-runtime qualification remains valid. README records the limitation; no request to change credentials or substitute a paid model is necessary to complete the bounded wave.

## Frozen whole-Wave-3 review boundary

BASELINE_TARGET=add-pi-opencode-bridge numbered Wave 3, tasks 3.1-3.4 and final gate 3.5
BASELINE_TARGET_REVISION=standalone:74b21afe0dae5ac4b6030809e900019ecb64494e;root-integration-sha256:daef6abbdb9e57bac075226a9f81cd393c13a5f578c1b3251386c94352477fde
BASELINE_SOURCE=Canonical OpenSpec apply-context bundle sha256:ea761c46ec08981e168f8b2e0004914a9ab3b75ccd13ff0142f05e71d42244c9; accepted Wave 2 source 25aa9ae; explicit user Wave 3 continuation and synthetic live-egress approval; Orchestrator implementation with only advisory Oracle delegation
BASELINE_INCLUSION_PREDICATE=Packed released-Pi-1.0.4/OpenCode-1.18.29 loader and lifecycle qualification, accurately recorded selected live-smoke outcome, private standalone SSH source publication, commit-pinned storage-only submodule integration, compatibility/install/unload documentation and preservation of prior ownership/runtime guarantees
BASELINE_EXCLUSIONS=Another external inference attempt, credential repair, paid-model substitution, exhaustive provider/image/TUI qualification, OAuth/plugin enablement, npm publication, root automatic activation/dependency changes, host patches and foreign work

Latest standalone source/docs commit `74b21afe0dae5ac4b6030809e900019ecb64494e` is pushed to the private SSH origin and matches the staged mode160000 gitlink. It differs from the controlled-test commit only by README live-outcome documentation. Standalone worktree is clean. Root integration digest hashes `.gitmodules` then `README.md` as relative path/NUL/bytes/NUL, followed by `gitlink`/NUL/trimmed `git ls-files --stage -- extensions/pi-opencode-bridge`/NUL. Canonical digest uses the established sorted four owning artifact paths and contents. These identify the bounded candidate, not foreign repository changes.

Final prerequisite checks: strict OpenSpec and targeted whitespace checks pass; Node22.19.0 and OpenCode1.18.29 observed; only unrelated PID330255/port5551 remains. Controlled51-test/typecheck evidence is unchanged by documentation/Git integration, so it is reused rather than rerunning identical checks. No owned runtime remains after the live attempt. First FULL review: zero rounds/rebuilds consumed, all implementation directly Orchestrator-owned, final task3.5 advisory only.

## Round 1 - Oracle Review

Run `d7ca5492-27f6-41c0-b140-4468fcbb2c38` completed FULL gate3.5 with no requirement-backed P0–P3 findings. It covered tasks3.1–3.4 and the prior ownership/runtime regression families; W1-ISOLATION-001, W1-ABORT-001, W1-RETRY-001 and W2-STREAM-001 remain resolved in tested paths. No correction is indicated.

Independent evidence: typecheck4.61seconds; ordinary51/51 tests with normal exit32.36seconds; strict OpenSpec and targeted whitespace checks; private GitHub repository/push access and SSH main; mode160000 gitlink/exact SSH URL; preserved prior submodule sections and unchanged root package/Pi settings. Source, canonical and integration digests matched before/after review. Standalone worktree remained clean and owned temporary resources were removed. Live access failure was reviewed from the explicit approval/outcome record, not replayed.

PROPOSED_REVIEW_ACTION=PASS

### Caller terminal reconciliation and completion

No accepted in-scope blocker remains. Caller independently verified clean standalone commit `74b21afe0dae5ac4b6030809e900019ecb64494e`, canonical digest `ea761c46ec08981e168f8b2e0004914a9ab3b75ccd13ff0142f05e71d42244c9`, root-integration digest `daef6abbdb9e57bac075226a9f81cd393c13a5f578c1b3251386c94352477fde`, and all four literal frozen boundary fields. The returned report is reconciled and terminal acceptance is current.

REVIEW_ACTION=PASS
CONSENSUS_STATUS=APPROVED

Tasks3.1–3.5 may now be marked complete, including task3.2's accurately recorded unavailable live outcome. This acceptance does not claim successful live entitlement/tool inference, separately automated TUI coverage, exhaustive provider/image support or OAuth/plugins. Final README/ADR/checklist changes only record this acceptance; no runtime, tests, dependencies or approved architecture change. Post-acceptance source commit `b449ef6c4fb5e571e3fd69235cb171e67be54819` changes only README/ADR acceptance-status text (four lines replaced); parent inspected these updates and verified runtime source, tests, package manifest and lockfile are unchanged from Oracle-reviewed `74b21afe0dae5ac4b6030809e900019ecb64494e`. The private SSH main and staged gitlink both match `b449ef6c4fb5e571e3fd69235cb171e67be54819`. This is acceptance bookkeeping, not a new implementation candidate or a silent review-scope reset.

OpenSpec apply now reports `all_done`,17/17 complete; strict validation and whitespace checks pass. Root package/Pi settings have no changes. The parent completion commit is scoped to `.gitmodules`, the new gitlink, root README's storage note, this review record and the owning task checklist. No npm publication, automatic activation, parent-remote push or additional live inference occurred. The change is ready for an explicitly requested archive.
