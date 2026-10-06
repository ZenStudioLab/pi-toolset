# Wave 1 recovery review: add-pi-opencode-bridge

The user explicitly approved a separate bounded correction/review sequence after the preceding sequence reached HUMAN_DECISION. This record supplements the main implementation review log; it does not replace the canonical OpenSpec artifacts or create another checklist gate. Orchestrator remains the sole implementation owner and authority; oracle remains the only delegated, read-only reviewer. No Wave 2/3 work is included.

## Wave 1 Review Sequence

BASELINE_TARGET=add-pi-opencode-bridge numbered Wave 1, tasks 1.1-1.5 and final gate 1.6
BASELINE_TARGET_REVISION=sha256:ab15851694946506224863ed646f1e739ffae56cc3ee64b47fadd5c577f028fb
BASELINE_SOURCE=User-amended canonical OpenSpec apply-context bundle sha256:2f9be13db5ee184962bb4d1611b9ce0cb84126a874898c487a49a88ca3a5aafa; Pi qualification target 1.0.4; later live-smoke model opencode/muse-spark-1.3-contributor-free; approved ephemeral child authentication and single-request Pi segments; Orchestrator implementation with only oracle delegation
BASELINE_INCLUSION_PREDICATE=Standalone package ADR and minimal real Pi/OpenCode provider seam, reviewed dependency acquisition, selective configuration isolation, deterministic single-request MCP-to-Pi segments serializing backend-parallel calls, exactly-once execution, cancellation and effectful retry retirement, with Wave 1 focused runtime evidence
BASELINE_EXCLUSIONS=Wave 2 catalog/context/attachment expansion, Wave 3 remote publication and submodule registration, paid-provider inference, root activation or host patches, foreign work, direct tool execution and delegation fallback

## Round 1 - Implementation Assignments

User-approved correction: W1-ISOLATION-001 stale-result ownership remains ACCEPT_BLOCKING under design decision 4 and task 1.5. Orchestrator will retire emitted/queued ownership on cancellation, limit continuation matching to a live same-user generation, and add ordinary Agent.abort followed by fresh-user recovery coverage without replaying the old tool. Existing generation-lifetime cancellation, monitoring and overlap behavior must remain intact. Files: `extensions/pi-opencode-bridge/src/provider-seam.ts`, existing `test/provider-seam.test.ts`, and caller-owned review logs only. No task checkbox or commit before caller PASS of the full Wave 1 gate 1.6.

This sequence begins with zero Oracle rounds and zero rebuilds. Its first review is FULL, with a whole-target regression sweep and explicit verification of all prior finding families. Limits remain four rounds and one rebuild; user approval does not waive them.

### Implementation and validation

Orchestrator cleared emitted and queued ownership when cancelling and restricted continuation matching to a live, non-error generation for the same last-user identity. The existing ordinary Agent.abort scenario now submits two subsequent fresh user prompts through the same seam and transcript, requiring both to finish successfully and the cancelled tool to execute only once.

The first full regression run exposed an additional retirement ordering race: releasing cancelled MCP results before OpenCode acknowledged session abortion sometimes started an extra model request (four rather than three total fixture requests). Cancellation now detaches pending ownership immediately but settles those MCP requests only after the backend abort request terminates (bounded by its existing three-second timeout). This is a supporting change to the same cancellation/recovery contract, not a new architecture. An initial typecheck also caught boolean narrowing in the live-generation match; it was corrected before tests.

Final validation: `yarn typecheck` passed (2.41 seconds); ordinary `yarn test` passed 18/18 with normal exit (14.80 seconds); strict OpenSpec validation passed. No dependency acquisition, external inference, real credentials, root staging or commits occurred. No tasks marked complete.

BASELINE_TARGET_REVISION=sha256:d8672174c0b6505c8451e9a0b96caf7b7e0c30ca542af3dd5d794e2996bff4bb

Canonical bundle remains `2f9be13db5ee184962bb4d1611b9ce0cb84126a874898c487a49a88ca3a5aafa`. Review uses this latest candidate, unchanged four boundary fields, FULL mode, and the same whole-Wave-1 gate 1.6.

## Round 1 - Oracle Review

Read-only oracle run `fc902e7c-d2e2-4a61-8f12-ee9a64136a83` completed and verified unchanged candidate/source and literal boundary fields, typecheck and 18/18 ordinary tests. No project writes or external inference occurred. Normal stale-transcript recovery and prior cancellation/monitoring tests pass. W1-ISOLATION-001 remains P1/in scope as failed-remote-retirement ownership contamination. The reviewer redirected the owned session abort request to a local HTTP 503; after Agent.abort and a fresh user request, the old backend continued and its obsolete MCP tool was admitted into the new global turn. Repeated probe: executions=[cancelled,obsolete], aRequests=3, bRequests=1, recoveryReason=stop, owned server alive. Source: relay admits into current turn; abort errors are ignored and handoffs released; replacement ownership starts before retirement acknowledgement. SUGGESTED_CORRECTION: gate replacement on verified retirement, check abort response/errors, and retire the owned runtime before releasing pending handoffs if remote abortion fails; cover failed abort deterministically. No other findings.

PROPOSED_REVIEW_ACTION=REBUILD

### Caller assessment

W1-ISOLATION-001: ACCEPT_BLOCKING. Governing source: delta cancellation requirement, design decision 4 and task 1.5 prohibit obsolete tool execution or interference with independent requests. Source inspection confirms both unverified abort acknowledgement and premature replacement admission. CORRECTION: retain retirement as a generation-owned promise, gate replacements until it settles successfully, explicitly verify the SDK abort response, and on failure mark the seam unavailable and close only its owned runtime before releasing detached pending MCP calls. Add failed-abort recovery isolation coverage. This is a recurring ownership family after an accepted revision; fresh counters do not erase that history.

REVIEW_ACTION=REBUILD
CONSENSUS_STATUS=NEEDS_REVISION

### Single bounded rebuild

Stop the incremental correction list. Re-derived target is unchanged full Wave 1, with runtime retirement acknowledgement as part of the existing cancellation/ownership contract. No stronger external threat model or architectural amendment is introduced.

BASELINE_TARGET=add-pi-opencode-bridge numbered Wave 1, tasks 1.1-1.5 and final gate 1.6
BASELINE_TARGET_REVISION=sha256:d8672174c0b6505c8451e9a0b96caf7b7e0c30ca542af3dd5d794e2996bff4bb
BASELINE_SOURCE=User-amended canonical OpenSpec apply-context bundle sha256:2f9be13db5ee184962bb4d1611b9ce0cb84126a874898c487a49a88ca3a5aafa; Pi qualification target 1.0.4; later live-smoke model opencode/muse-spark-1.3-contributor-free; approved ephemeral child authentication and single-request Pi segments; Orchestrator implementation with only oracle delegation
BASELINE_INCLUSION_PREDICATE=Standalone package ADR and minimal real Pi/OpenCode provider seam, reviewed dependency acquisition, selective configuration isolation, deterministic single-request MCP-to-Pi segments serializing backend-parallel calls, exactly-once execution, cancellation and effectful retry retirement, with Wave 1 focused runtime evidence
BASELINE_EXCLUSIONS=Wave 2 catalog/context/attachment expansion, Wave 3 remote publication and submodule registration, paid-provider inference, root activation or host patches, foreign work, direct tool execution and delegation fallback

Complete batch: generation-owned retirement promise; successful response verification; block replacement admission during retirement; latch unavailable and close owned runtime on failure before releasing pending calls; deterministic failed-abort regression and existing full-suite validation. Orchestrator implements directly in provider seam and lifecycle tests. Next review is FULL against the resulting candidate; one round consumed and the sequence's single rebuild now recorded. Same gate 1.6, no task completion yet.

BASELINE_REBUILD_COMPLETE=YES

## Round 2 - Implementation Assignments

Orchestrator directly implemented the complete retirement batch in `src/provider-seam.ts`. Each cancelled generation retains a retirement promise; replacement admission waits for it. The abort call uses `throwOnError: true` and requires `data === true`. Rejection, non-acknowledgement or timeout latches the seam unavailable and awaits owned-runtime shutdown before releasing detached pending calls. Inference failure uses the same retirement path, avoiding a separate early-settlement route. Close also awaits retirement. No global process or user runtime is targeted.

Added deterministic actual Pi/OpenCode/MCP tests in `test/provider-lifecycle.test.ts`: redirect only the owned abort endpoint to a local HTTP 503 or a response that never completes. Both require one tool execution, no obsolete backend continuation or independent-request success through the failed runtime, and confirmed owned process exit. Normal successful-cancellation recovery and all previous families remain passing.

Final `yarn typecheck` passed (2.70 seconds), ordinary `yarn test` passed 20/20 with normal exit (23.85 seconds), and strict OpenSpec validation passed. No source-bundle change, external inference, credentials, acquisition, root staging or commits occurred. All checklist tasks remain pending the same whole-Wave-1 gate 1.6.

BASELINE_TARGET_REVISION=sha256:d9925ca176f924bbcf30a4251d1fd9edb049b21dd729e1c282f5bc458b792039

The canonical source and four boundary fields remain unchanged. Next review is FULL after the one rebuild in this human-authorized recovery sequence; one previous Oracle round consumed.

## Round 2 - Oracle Review

Oracle run `39291f12-62b8-4b03-b469-283a2cdf0e9f` completed FULL review after the rebuild. Gate 1.6 covered all Orchestrator-owned tasks 1.1–1.5 and the entire standalone candidate. It independently verified candidate `d9925ca176f924bbcf30a4251d1fd9edb049b21dd729e1c282f5bc458b792039`, source bundle `2f9be13db5ee184962bb4d1611b9ce0cb84126a874898c487a49a88ca3a5aafa` and literal boundary equality before/after checks. Typecheck and ordinary 20/20 tests passed (22.18 seconds). The original failed-abort probe now yields aRequests=1, bRequests=0, executions=[cancelled], recoveryReason=error, ownedServerAlive=false. W1-ISOLATION-001, W1-ABORT-001 and W1-RETRY-001 resolved; no P0/P1/P2/P3 findings. No project writes, installs, external inference or unrelated-process operations. Non-true successful abort response is source-reviewed, not separately fixture-tested; Wave 2/3 qualification remains outside this gate.

PROPOSED_REVIEW_ACTION=PASS

### Caller assessment - recovery sequence round 2

Terminal result reconciled: read-only scope and independent validation accounted for, with no partial writes. All accepted findings are resolved; no new findings need disposition. Caller recomputed exact current candidate/source digests and compared all four boundary fields literally with the recorded baseline; they match the reviewed target and latest recorded revision. No accepted in-scope P0/P1 blocker remains. This PASS covers the whole numbered Wave 1 and exact gate 1.6, not the entire change. Normal metadata completion below does not alter the reviewed implementation.

REVIEW_ACTION=PASS
CONSENSUS_STATUS=APPROVED
