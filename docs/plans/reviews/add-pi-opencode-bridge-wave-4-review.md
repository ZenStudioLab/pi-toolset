# Wave 4 — Muse Responses tool-name compatibility

Owning change: `openspec/changes/add-pi-opencode-bridge/`. The user explicitly authorized continued feasible synthetic experiments and then production integration. Orchestrator owns implementation, tests, artifacts and integration; Oracle supplies the one final whole-wave advisory gate. Historical Wave 3 acceptance and subsequent diagnosis remain in `add-pi-opencode-bridge-wave-3-review.md`; this sequence does not reopen them.

## Implementation and verification

The new `src/responses-tool-names.ts` maps only current declared Pi tool names between the internal MCP namespace and original names on the Responses boundary. It transforms declarations, selected-tool references and retained function calls, then restores complete/streamed response calls. IDs, argument strings, results and unrelated text are not transformed. Fragmented SSE events are buffered to protocol event boundaries, not timing windows.

`src/inference-relay.ts` owns a loopback HTTP adapter only for `opencode/muse-spark-1.3-contributor-free` with the OpenAI Responses SDK. It preserves configured upstream baseURL/options and authentication headers, forwards upstream errors unchanged, and aborts active streams on close. `provider-seam.ts` starts/closes it alongside the owned runtime/MCP relay, including startup failure. No placeholder tools, native tool execution, altered prompt/message IDs, credential changes, new dependencies, plugins, fallback or automatic replay were added. `FreeTierError` now produces an accurate sanitized client-restriction message rather than generic credential-repair advice.

Focused tests cover transformation, unchanged arguments/text/IDs/results, fragmented events, response completion, error forwarding, ineligible routes and active-stream close. The packed released-Pi loader test now runs both the original chat fixture and the Muse Responses route, including original upstream names, retained tool-call/result history, real Pi hooks, cancellation/fresh recovery, reload, unload and owned-child exit.

Typecheck passed (9.63 seconds). Complete suite passed **58/58**, zero failed/cancelled, normal exit (218.12 seconds) using `node --experimental-strip-types --test --test-concurrency=1 test/*.test.ts`. An earlier ordinary parallel run passed55 with one existing catalog-test timeout at30 seconds, not a failed assertion. That test independently passed on rerun (26.16 seconds); both packed variants passed. No test timeout or runtime behavior was changed to hide this; serial execution provided complete evidence on this loaded machine. Strict OpenSpec validation and whitespace checks pass.

The integrated synthetic live check revalidated the exact public model and official Free/Free/Free pricing row, then connected zero-cost catalog metadata. It used the normal in-memory OpenCode authentication, an isolated workspace with `fixture.txt` containing only `ping`, and real Pi Agent tool handlers. Only `read` of that fixture and constrained `bash` for `printf ping` were offered. The request cap allowed at most two upstream requests; retry/fallback was not added. Observed **HTTP200 twice, exactly one read, zero bash executions, final `pong`, stopReason=stop**. Owned runtimes, workspace and temporary harness were closed/removed. No project data or private conversation was sent. The Contributor training-data terms remain documented. This is not qualification of every tool set, provider, protocol, version, image path or future vendor policy.

The repository mount currently reports standalone directory/git metadata ownership as root while the executing account is uid1000. Git's ownership check was handled only with a command-scoped `-c safe.directory=<exact standalone path>` after confirming the expected checkout; no global trust setting or ownership change was made. Foreign `tools/subagent-profiles/.gitignore` and untracked `extensions/pi-voicekit/` remain untouched.

## Frozen whole-Wave-4 review boundary

BASELINE_TARGET=add-pi-opencode-bridge numbered Wave 4, tasks 4.1-4.3 and final advisory gate 4.4
BASELINE_TARGET_REVISION=standalone working candidate sha256:0daa6cfed400681bc8c8b364d54de8f27aa283414a5881742b5686684d33d900; base commit b449ef6c4fb5e571e3fd69235cb171e67be54819
BASELINE_SOURCE=Canonical OpenSpec apply-context bundle sha256:e1afdbb3b40925b70150bf0195ba7abff1663feba21e3a7567471bd357c184e2; explicit user authorization for feasible synthetic experiments and production integration; prior accepted Pi-owned execution/runtime guarantees
BASELINE_INCLUSION_PREDICATE=Qualified Muse Responses route tool-name translation and lifecycle, accurate free-tier failure classification, controlled transformation/transport and packed-loader verification, approved integrated synthetic live outcome, compatibility/architecture documentation, preservation of prior Pi tool/context/authentication ownership and scoped post-acceptance private publication/submodule pin
BASELINE_EXCLUSIONS=Additional external inference by reviewer, credential repair, paid-model substitution, arbitrary provider/protocol/version or tool-set qualification, placeholder/native tools, prompt/ID/client-header impersonation, plugin/OAuth enablement, npm publication, root automatic activation/dependency changes, host patches and foreign work

Candidate hash: sorted package-relative `.gitignore`, `package.json`, `yarn.lock`, `tsconfig.json`, `README.md`, every file under `src`, `test`, `docs/adr`; feed each relative path/NUL/bytes/NUL to SHA256. Canonical hash: sorted root-relative `proposal.md`, `design.md`, `tasks.md`, `specs/opencode-provider/spec.md` under the owning change, same encoding. The four boundary fields remain literal during this sequence; update candidate revision only through recorded reconciliation/remediation. At most four rounds and one rebuild. Task checkboxes remain pending until caller acceptance; no source push or new gitlink yet.

## Round 1 - Oracle Review

Oracle run `8bba4114-bbdf-440d-856f-e234dd19b3eb` completed with one P1 finding, `W4-UPSTREAM-001`: the adapter ignored the supported `provider.api` endpoint fallback and could redirect a configured private endpoint to public Zen. Candidate and canonical hashes matched before/after; reviewer made no repository edits. Independent typecheck and6 focused tests passed; a mocked-fetch reproduction demonstrated the incorrect endpoint without external requests. Pinned executable inspection established endpoint precedence and `${...}` environment expansion. No other requirement-backed finding was reported; prior full-suite/packed/live evidence was explicitly reused.

PROPOSED_REVIEW_ACTION=PATCH

### Caller reconciliation

`W4-UPSTREAM-001`: ACCEPT_BLOCKING. Task4.1 and design8 require preserving the configured upstream, and unintended prompt/authentication egress is a concrete risk. Parent confirmed the pinned executable's construction: nonempty options.baseURL wins; otherwise model.provider.api precedes provider.api and catalog URL; remaining `${NAME}` placeholders use the runtime environment. The current code violates that boundary. No scope change or rebuild is needed.

CORRECTION: Capture the qualified route's effective endpoint before replacing baseURL, including nonempty baseURL precedence, model/provider api fallbacks and environment substitution. Reject unusable configured endpoints rather than redirecting to the default. Add synthetic endpoint-precedence/expansion regressions; rerun focused transport and packed-loader checks. Reuse prior live/default-route evidence only if the correction leaves its endpoint unchanged. No additional live inference is authorized by this review.

REVIEW_ACTION=PATCH

Round1 consumed; zero rebuilds. Publication and task completion remain blocked until the correction and bounded whole-target review are reconciled.

### Implemented correction and revised candidate

Endpoint resolution now matches the qualified pinned runtime: nonempty string `options.baseURL`, then `models[modelID].provider.api`, then `provider.api`, then the unchanged catalog default for this exact Muse route. `${NAME}` expansion uses the process environment merged with the same explicit environment overrides passed to the child. Invalid or unresolved configured endpoints fail before starting the relay or sending a request; they never fall back to Zen. The pinned runtime's model-level api field is wider than the v1 SDK Config declaration, so a narrow local type view documents that observed API difference without changing dependencies.

Synthetic loopback regressions demonstrate provider api fallback, empty-baseURL fallback, model api precedence, explicit-baseURL precedence, environment expansion and rejection without requests. The test also blocks non-loopback fetches before dispatch, so a regression cannot contact public Zen. Typecheck passed10.03seconds. All9 focused transformation/transport/packed-loader tests passed, including both complete packed lifecycle variants (102.35seconds total). Root/standalone whitespace checks pass. The preceding58-test full-suite evidence remains applicable outside the corrected endpoint path; no changes to other transports, tools, context or runtime source. Prior live evidence is retained for its unchanged default/baseURL endpoint; no additional live inference was issued.

PATCH_BASELINE_REVISION=standalone working candidate sha256:b9925e7fedfc8590ae4d837a4b468bad76e4e31164a86467ff2a8876de0fe95d; base commit b449ef6c4fb5e571e3fd69235cb171e67be54819

This is the round2 candidate revision. All four original boundary fields and canonical bundle digest remain unchanged. Next review mode is PATCH: verify W4-UPSTREAM-001 plus a bounded whole-wave regression sweep, not a new scope or rebuilt sequence.

## Round 2 - Oracle Review

Resumed Oracle run `9fedf0d5-1db6-42f2-87fc-511710a47fb3` verified W4-UPSTREAM-001 resolved and reported no new requirement-backed P0–P3 findings. It independently passed7 focused tests, compared unchanged prior runtime/tool/context sources and tests, checked whitespace, and verified candidate/canonical hashes and literal boundaries before/after. It reused the recorded typecheck,9 focused/packed checks, prior58-test full suite and approved live outcome without misrepresenting them as reruns. No repository edits, extra inference or credential inspection occurred.

PROPOSED_REVIEW_ACTION=PASS

### Caller terminal reconciliation

Parent independently recomputed candidate `b9925e7fedfc8590ae4d837a4b468bad76e4e31164a86467ff2a8876de0fe95d` and canonical `e1afdbb3b40925b70150bf0195ba7abff1663feba21e3a7567471bd357c184e2`, and compared all four boundary-defining fields literally. They match the latest recorded review candidate and original finite scope. W4-UPSTREAM-001 is resolved; no accepted blocking finding remains. Foreign changes remain outside the task; neither repository has unrelated staged changes.

REVIEW_ACTION=PASS
CONSENSUS_STATUS=APPROVED

Wave4 implementation is accepted after two rounds, zero rebuilds. Remaining work is caller-owned acceptance-status documentation, scoped source publication and parent pin/checklist completion. Those bookkeeping edits must not change the reviewed runtime/test candidate. Qualification remains limited to the recorded versions, controlled fixtures and approved synthetic Muse route; no additional external inference or npm publication is implied.

### Publication and completion

Standalone commit `da5107fcfc25f432dacee32212b0d42e07cdcdff` is pushed to the existing private `git@github.com:ZenStudioLab/pi-opencode-bridge.git` main; SSH ls-remote matches local HEAD and the standalone worktree is clean. GitHub metadata independently confirmed private visibility and ADMIN permission before publication. Only two README/ADR acceptance-status sentences differ from the reviewed candidate: parent reversed those sentences in-memory and recomputed the complete original candidate digest successfully, proving the reviewed implementation/tests/configuration remained unchanged.

The parent mode160000 gitlink is updated to that source revision; Wave4 checkboxes now record completion. Root loading/settings, exports, dependencies and submodule URL remain unchanged. No parent-remote push, npm publication or global activation was performed. Foreign `tools/subagent-profiles/.gitignore` and `extensions/pi-voicekit/` remain outside the scoped parent completion commit. The user can test by launching a fresh Pi process with the absolute extension path; no API-key change is required for the already-working native Muse API-authentication setup.
