# Wave 2 recovery review — explicitly authorized sequence

The user selected A to authorize a new bounded correction/review sequence after the prior Wave 2 HUMAN_DECISION checkpoint. The prior sequence remains terminal in `add-pi-opencode-bridge-implementation-review.md`; its findings and correction history are preserved, not reset or relabelled. This sequence has at most four Oracle rounds and one rebuild. Orchestrator exclusively owns implementation/reconciliation; Oracle supplies the same whole-Wave-2 advisory gate 2.6. No Wave 3 work is authorized by this recovery.

BASELINE_TARGET=add-pi-opencode-bridge numbered Wave 2, tasks 2.1-2.5 and final gate 2.6
BASELINE_TARGET_REVISION=sha256:a71419baabf9c94230285b3151b255028ce93d734875dde229f92eb44b5e9cff
BASELINE_SOURCE=Canonical OpenSpec apply-context bundle sha256:6ad1af6e7b8a010334147c1ad7e3dcf757f9637af8dc48aaeb284542ed512300; approved architecture unchanged; completed Wave 1 source 4c30234; Orchestrator implementation with only oracle delegation
BASELINE_INCLUSION_PREDICATE=Connected catalog/refresh and metadata, incremental text/reasoning and nonduplicated accounting, supported image input/results, append-compatible backend context and labelled replay/invalidation, evidenced diagnostics, actual entry/Pi-loop controlled-runtime validation, and preservation of Wave 1 ownership/cancellation guarantees
BASELINE_EXCLUSIONS=Wave 3 packed/released-loader qualification, external model egress, OAuth/plugin qualification, remote publication/submodule registration, root activation/settings/dependencies and foreign work

## Authorized correction and ownership

W2-STREAM-001 remains ACCEPT_BLOCKING, P1/in scope, under tasks 2.2/2.4 and retained-conversation correctness. Selectively missing earlier text can currently produce successful FINAL/PREAMBLE instead of PREAMBLE/FINAL. Correct usage alone does not establish correct transcript semantics.

CORRECTION: reconcile authoritative ordered content against the actual already-emitted content prefix before adding recovered parts. Reorder content that has not escaped to Pi; reject final success and retained-cursor publication when prior emission cannot be reconciled. Preserve incremental events, ordered async instrumentation, request-level tool handoffs, exactly-once accounting, cancellation and native-retry retirement. Add focused prefix/order tests and a controlled selective-first-step-loss real-loop regression, including failed-context recovery behavior. The current caller-facing provider is still an unqualified local development candidate; this protects an evidenced transcript correctness failure, not a new hostile-input or external compatibility boundary.

W1-RETRY-001's observer-blocking variant and prior abort/isolation corrections remain accepted regression obligations. Existing 36-test/typecheck results remain valid for the prior candidate; rerun affected tests and the bounded full suite for the correction. No installation, host patches, external inference, root activation, commits, or task completion until the applicable whole-wave acceptance gate.

Initial boundary: current standalone changes are the recorded Wave 2 candidate, including its new catalog/context/failure/stream modules and tests. Preserve foreign root work and unrelated runtime PID330255 on port5551. Main log is not expanded further; this separate authorized sequence log owns new review evidence.

## Correction evidence before first FULL review

Initial candidate was `0c4157158a997caa4e1e214a6bec0bc6b9ecdd3cd9008069875b9c2f8b06d280`. Corrected candidate is the current BASELINE_TARGET_REVISION above; canonical source and all boundary fields remain unchanged. No rounds/rebuilds consumed in this explicitly authorized sequence.

`src/stream.ts` records the actual order of emitted content blocks across Pi segments, coalescing adjacent continuation of the same part. Its new reconciliation operation checks emitted identities, kinds and byte prefixes against authoritative ordered content; all emitted parts before the last must already be complete. Validation precedes state mutation. Unemitted parts may be reordered; an irreconcilable prefix produces a sanitized stream failure. `src/provider-seam.ts` supplies the complete ordered snapshot list instead of individually appending recovered snapshots. Existing retirement clears retained state and blocks identical failed-context replay. Incremental streaming/observer sequencing/request-level tool handoffs are unchanged.

Focused tests add authoritative reordering before emission and seven prefix cases: valid partial last part, valid same-part continuation across segments, missing earlier part, missing earlier suffix, removed emitted part, changed emitted bytes, and an earlier part resuming after a later segment. Existing stream/context owner retains these cases rather than introducing a parallel harness.

`test/provider-observer.test.ts` adds selective loss to its controlled real Pi/OpenCode suite. The filter preserves assistant IDs and supervision but removes only the first assistant's text/delta events. An explicit barrier waits until FINAL has actually reached Pi before finishing the provider response. The generation now ends in error without appending PREAMBLE; identical failed-context replay performs no request; a later user-directed request succeeds without inheriting PREAMBLE from the failed backend session. Tool execution remains once. The filter handles events without part/info and is restored in cleanup; abort releases fixture barriers. README documents the fail-without-continuation outcome.

Validation: focused stream/context/observer suites passed15/15 with normal exit9.40seconds. Final typecheck passed2.66seconds; full ordinary suite passed45/45 with normal exit29.48seconds. Strict OpenSpec validation and package whitespace checks passed. Source max396lines. Process inspection found only unrelated PID330255/port5551; no owned runtime remained. No installs, dependency edits, external inference, host patches, staging, commits, or task completion occurred.

Next: first FULL whole-Wave-2 Oracle review under existing task2.6. Owner assignments remain Orchestrator for2.1–2.5 and advisory Oracle only for2.6; review must retain prior root identities and verify the whole bounded wave.

## Round 1 - Oracle Review

Run `cd590862-4666-4cc8-9374-23c140495d4c` completed the explicitly authorized recovery's FULL gate2.6. Current candidate/source/boundaries independently matched; typecheck,45/45 tests (normal27.09seconds) and whitespace checks passed. No project writes or owned runtime remained. Prior stale task wording was explicitly superseded through supervisor confirmation before review.

W2-STREAM-001, P1/in scope: content-only prefix validation omits already-consumed tool handoffs/results. The existing missing-events real-loop fixture produces PREAMBLE before a tool upstream, but Pi receives toolCall, toolResult, then PREAMBLE/FINAL with successful stop. A strengthened ordering assertion failed normally, with requests2/executions1 and correct20/10 usage. Evidence: stream.ts emitted IDs omit tool markers; seam's authoritative collection excludes tool parts and publishes tool calls separately. SUGGESTED_CORRECTION: include consumed tool boundaries in authoritative order validation; fail without success/retained continuation where earlier narration cannot be inserted into already-consumed segments. Preserve request-level handoffs.

W1-RETRY-001, W1-ABORT-001 and W1-ISOLATION-001 are resolved in their tested paths; no new correction is indicated. No other findings or boundary drift reported.

PROPOSED_REVIEW_ACTION=REBUILD

### Caller reconciliation and bounded rebuild

W2-STREAM-001: ACCEPT_BLOCKING under tasks2.2/2.4 and concrete retained-conversation correctness. The caller confirms that a consumed handoff/result separates Pi messages even when no text preceded it, so text-only prefix tracking cannot establish full order. This remains the same structural family. Prior retry/abort/isolation findings remain resolved regression obligations. Terminal review reconciled; no partial project writes.

REVIEW_ACTION=REBUILD
CONSENSUS_STATUS=NEEDS_REVISION

Prior incremental worklist is retired. Re-derived boundary remains the whole numbered Wave2, unchanged canonical architecture and one-request Pi handoffs. CORRECTION batch: include consumed handoff positions in emitted-prefix tracking and persisted tool positions in authoritative reconciliation. Recover only a compatible prefix; otherwise fail and invalidate continuation. Strengthen existing missing-event/delayed-observer tests to assert ordering relative to tool calls/results and safe recovery, rather than requiring a falsely successful flattened-text result. Preserve independent retry supervision and accounting. Orchestrator implements directly; same final gate2.6 reviews the rebuilt whole wave.

BASELINE_TARGET=add-pi-opencode-bridge numbered Wave 2, tasks 2.1-2.5 and final gate 2.6
BASELINE_TARGET_REVISION=sha256:a71419baabf9c94230285b3151b255028ce93d734875dde229f92eb44b5e9cff
BASELINE_SOURCE=Canonical OpenSpec apply-context bundle sha256:6ad1af6e7b8a010334147c1ad7e3dcf757f9637af8dc48aaeb284542ed512300; approved architecture unchanged; completed Wave 1 source 4c30234; Orchestrator implementation with only oracle delegation
BASELINE_INCLUSION_PREDICATE=Connected catalog/refresh and metadata, incremental text/reasoning and nonduplicated accounting, supported image input/results, append-compatible backend context and labelled replay/invalidation, evidenced diagnostics, actual entry/Pi-loop controlled-runtime validation, and preservation of Wave 1 ownership/cancellation guarantees
BASELINE_EXCLUSIONS=Wave 3 packed/released-loader qualification, external model egress, OAuth/plugin qualification, remote publication/submodule registration, root activation/settings/dependencies and foreign work

BASELINE_REBUILD_COMPLETE=YES

This authorized recovery has consumed one review and now its one rebuild. No further automatic rebuild is available.

## Rebuilt candidate before FULL verification

CANDIDATE_REVISION=sha256:67fb45eebf0080bbeb1fd8bccd91ed81ffce22dcb3a441e74eb06b4a8b417720
SOURCE_REVISION=sha256:6ad1af6e7b8a010334147c1ad7e3dcf757f9637af8dc48aaeb284542ed512300
SOURCE_CHANGED=NO
PRIOR_CORRECTION_WORKLIST_ACTIVE=NO

Complete batch implemented directly. `GenerationStream.handoff()` records a consumed tool/result boundary immediately before each Pi tool-call segment is published. Authoritative reconciliation includes persisted tool positions as well as text/reasoning; only a matching emitted prefix is accepted, and the total persisted tool count must match consumed handoffs. Tool markers represent positions, not a replacement for existing distinct request/result IDs or serial relay ownership. Validation still precedes state replacement; incompatible earlier content fails with no retained continuation. No model-batch boundary, handoff delay, observer/supervision coupling or automatic replay was added.

The existing real-loop fixture now asserts safe failure/recovery for both complete-content loss and a held observer that delays pre-tool text beyond its consumed handoff, rather than treating flattened recovered text as successful fidelity. Selective-first-step loss still fails safely. Each error case rejects exact-context replay without another inference request and permits a fresh user-directed request whose upstream native history contains no old assistant entries and instead carries Pi-owned retained records. A new ordered case uses an explicit preamble-observed barrier and asserts `PREAMBLE<TOOL><RESULT>FINAL`, correct20/10 accounting and one execution. Unit cases cover missing/partial/complete text before a consumed tool boundary and reject unconsumed authoritative tool calls. README explicitly documents the lost/delayed-pre-tool-content failure boundary.

Final verification: typecheck passed2.42seconds; ordinary full suite passed50/50 with normal exit26.57seconds; strict OpenSpec validation and package whitespace checks passed. Earlier focused19/19 validation also passed before the final tool-count assertion was added. Only unrelated PID330255/port5551 remains; no owned runtime. No dependencies, canonical artifacts, staging, commits or task completion changed.

Next: Round2 FULL verification of the rebuilt whole Wave2 under the same final gate2.6; retain all historical findings and the one-rebuild limit.

## Round 2 - Oracle Review

Run `1ca00bcf-9546-4c74-bf98-2d54ece520d8` completed rebuilt FULL whole-Wave2 gate2.6 with no current P0–P3 findings. W2-STREAM-001 is verified resolved: authoritative content includes consumed tool boundaries, incompatible output fails before success/cursor publication, and the original missing-events probe now produces error with `<TOOL><RESULT>`, requests2/executions1 and safe fresh-user recovery. W1-RETRY-001, W1-ABORT-001 and W1-ISOLATION-001 remain resolved in tested paths. No additional correction is indicated for any family.

Independent typecheck passed2.51seconds; ordinary suite passed50/50 with normal exit27.42seconds; original missing-events safety probe passed1/1; package whitespace checks passed. Candidate/source and literal boundaries matched before/after checks. No staged standalone files, project writes or owned runtime remained; unrelated PID330255/port5551 was preserved. Full task2.1–2.5 coverage and Wave1 regression boundary were reviewed, not only the fixes.

PROPOSED_REVIEW_ACTION=PASS

### Caller terminal reconciliation and Wave 2 acceptance

All four historical families retain their identities and are accepted as resolved for the reviewed scope; no accepted in-scope blocker remains. Caller independently recomputed candidate `67fb45eebf0080bbeb1fd8bccd91ed81ffce22dcb3a441e74eb06b4a8b417720` and canonical bundle `6ad1af6e7b8a010334147c1ad7e3dcf757f9637af8dc48aaeb284542ed512300`, exactly matching the latest reviewed revisions, and compared all four frozen boundary fields literally. Terminal PASS is current. No remediation or further review is required in this sequence.

REVIEW_ACTION=PASS
CONSENSUS_STATUS=APPROVED

Tasks2.1–2.6 may now be marked complete. Intentional limitation: pre-tool content lost/delayed beyond a consumed handoff produces safe failure instead of reordered success; README documents this. Released-loader/package qualification, live provider egress, OAuth/plugins and remote/submodule integration are not established by this acceptance. Wave3 remains unfinished. Following checklist/README acceptance-status updates are post-review bookkeeping, not changes to reviewed runtime behavior. Tasks2.1–2.6 are complete; OpenSpec now reports12/17 complete with five Wave3 tasks pending. Strict validation passes after the checklist update. Standalone Wave2 source committed as `25aa9ae`; its worktree is clean. Only README's acceptance-status sentence changed in the maintained package after Oracle's reviewed digest; runtime source/tests are unchanged. No push, remote creation, gitlink registration or root activation occurred.
