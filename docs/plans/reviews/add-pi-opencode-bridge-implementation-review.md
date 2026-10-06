# Implementation review: add-pi-opencode-bridge

## Apply context and routing

Schema: spec-driven. Focus mode: focus. Orchestrator mode: orchestrator-led.
Selected default implementation owner: Orchestrator. Selected reviewer: oracle.
Latest user instruction overrides previous worker assignments: only Oracle delegation is allowed. Orchestrator directly owns investigation, implementation, validation, ADR/specifications, reconciliation, authoritative actions, task completion, and repository integration. Oracle is independent and advisory only. Historical worker entries below record completed work, not continuing delegation authority.

Canonical context: `openspec/changes/add-pi-opencode-bridge/{proposal.md,design.md,tasks.md,specs/opencode-provider/spec.md}` from `openspec instructions apply`. The original approved planning bundle matched `sha256:4a19d16455c2083cf812a03a1b592fbbfb827564873d7004a53ce1c3ccc63d35`. The current user-amended Pi 1.0.4, selected live-smoke-model and orchestrator-only implementation bundle matches `sha256:2f9be13db5ee184962bb4d1611b9ce0cb84126a874898c487a49a88ca3a5aafa` (sorted relative path, NUL, bytes, NUL); the earlier proposal verdict does not qualify the new release. All 17 checklist items remain pending until whole-wave caller PASS; implementation evidence below is not a review verdict.

The root already contains unrelated speech edits/untracked files and staged `.gitmodules`, `extensions/pi-bookmark`, and `extensions/pi-subscription-usage`. Preserve them and exclude them from current-wave commits. No remote repository creation, root submodule registration, paid-provider request, or root activation has occurred.

## Wave 1 Review Sequence

### Frozen review boundary

BASELINE_TARGET=add-pi-opencode-bridge numbered Wave 1, tasks 1.1-1.5 and final gate 1.6
BASELINE_TARGET_REVISION=sha256:3bcf96274da215354a54e047db19df0010244fd7f434465d35f01aca3251550f
BASELINE_SOURCE=User-amended canonical OpenSpec apply-context bundle sha256:2f9be13db5ee184962bb4d1611b9ce0cb84126a874898c487a49a88ca3a5aafa; Pi qualification target 1.0.4; later live-smoke model opencode/muse-spark-1.3-contributor-free; approved ephemeral child authentication and single-request Pi segments; Orchestrator implementation with only oracle delegation
BASELINE_INCLUSION_PREDICATE=Standalone package ADR and minimal real Pi/OpenCode provider seam, reviewed dependency acquisition, selective configuration isolation, deterministic single-request MCP-to-Pi segments serializing backend-parallel calls, exactly-once execution, cancellation and effectful retry retirement, with Wave 1 focused runtime evidence
BASELINE_EXCLUSIONS=Wave 2 catalog/context/attachment expansion, Wave 3 remote publication and submodule registration, paid-provider inference, root activation or host patches, foreign work, direct tool execution and delegation fallback

The candidate revision will be recorded from the actual source/evidence snapshot before Oracle dispatch. No Oracle round or rebuild has occurred.

## Round 1 - Implementation Assignments

Numbered wave: 1. Reserved final gate: task 1.6, Oracle advisory review of the entire completed Wave 1. Excluded from implementation dispatch; no intermediate task/slice review.

Ordered responsibilities:

1. Orchestrator, task 1.1: standalone repository metadata and `docs/adr/0001-pi-owned-opencode-provider.md` before implementation code.
2. worker, task 1.2: package/dependency qualification setup; static provenance/manifests/lifecycle review precedes installation or newly discovered-code execution and separate required approval.
3. worker, task 1.3: owned runtime/configuration and actual sentinel/first-session observations.
4. worker, task 1.4: minimal stream and real finite-batch MCP/Pi relay.
5. worker, task 1.5: cancellation, termination and healthy-server retry retirement checks.

### Orchestrator - task 1.1 evidence

Created the previously absent `extensions/pi-opencode-bridge/` as a standalone Git repository on unborn `main`, without registering a root gitlink or touching `.gitmodules`. Wrote only its package-owned ADR, explicitly retaining unqualified relay status and linking the owning change. Verified the ADR exists and its relative owning-change link resolves. Standalone status contains only `docs/`; no implementation code or dependency install exists yet. Root staged path inventory remains `.gitmodules`, `extensions/pi-bookmark`, and `extensions/pi-subscription-usage`.

Task 1.1 implementation is ready for the later whole-wave review, but its checkbox remains pending. The next bounded worker assignment is task 1.2 static acquisition review only; installation/execution is not approved merely by the overall apply request.

### Terminal reconciliation - dependency prerequisite review

Workflow `c27d16e8-e87b-41e2-9a41-688dae269bf0`, worker `15de5762-a0d0-4683-a82c-36fd8526c7a4`, completed. Read its bound `wave-1/dependency-review.md` output and terminal receipt. The report selected official OpenCode SDK 1.18.29, MCP SDK 1.29.0, released Pi coding-agent/pi-ai 0.99.2, TypeScript 5.8.2 and Node declarations 22.19.19, with registry integrity and archive hashes. Caller rehashed all six downloaded archives; their observed values match the report. The MCP comparison initially used a mistyped caller constant, not a discrepant archive; the observed hash matches the report's `1c51470eca288ae744a5d8bb48e217d3eab5869eb2cbaf587fc29f336d6b096c`.

Actual writes reported: static downloads/extractions in `/tmp/pi-opencode-dependency-review.jLvKCL/` and the managed output artifact only. Caller verified standalone status remains only `docs/` on unborn `main`; root staged path inventory remains unchanged. No manifest, lockfile, installation, newly acquired code execution, server, or inference check occurred. The report's final write-scope statement omits its temporary downloads; those are explicitly accounted for here.

Direct version availability is established, not compatibility or complete acquisition readiness. Required zod/typebox peer pins and the relevant resolved transitive installation/lifecycle paths are not yet reviewed. The proposed bare Yarn commands do not suppress dependency lifecycle scripts. Caller therefore does not forward them as an executable approval bundle yet. Continue the same reconciled worker in read-only mode to close those static gaps and provide a script-disabled acquisition boundary; task 1.2 and the whole-wave gate remain pending. OpenCode's patched MCP dependency, configuration isolation, finite batching and native retry retirement remain real-runtime gates, not static-review defects or permissions to alter scope.

### Terminal reconciliation - static dependency follow-up

Resumed worker `4c89c0b7-c93c-445b-b523-0496f5971198` completed; caller read the updated bound report and confirmed terminal `state: complete`. The follow-up selected runtime `zod@4.1.8` and host peer/exact dev `typebox@1.3.27`; caller rehashed their archives and confirmed both match the reported SHA-256 values. Standalone status still contains only `docs/`, with no package.json or yarn.lock. Root staged inventory remains unchanged. Writes were limited to the managed report and disposable static inspection downloads/extractions under the previously recorded temp directory; no installation or acquired-code execution occurred.

The worker inspected relevant transitive manifests/archives, identified an executable/legacy prepublish path in the cross-spawn chain and prebuilt Pi WASM/WASI assets, and found no required native installation hook for typecheck in that inspected set. This is proportionate static acquisition evidence, not a complete library security audit. Exact final transitive versions/integrities and optional-platform resolution remain pending lockfile review. All acquisition commands must suppress lifecycle scripts; no execution is approved by acquisition approval.

### Superseded human approval request - Pi 0.99.2 acquisition

Requested scope: create standalone package.json with runtime pins `@opencode-ai/sdk@1.18.29`, `@modelcontextprotocol/sdk@1.29.0`, `zod@4.1.8`; host peers and exact dev qualification packages `@earendil-works/pi-coding-agent@0.99.2`, `@earendil-works/pi-ai@0.99.2`, `typebox@1.3.27`; dev tooling `typescript@5.8.2`, `@types/node@22.19.19`. Run the report's workspace-native Yarn add/install commands with `--ignore-scripts`, producing standalone yarn.lock/node_modules, then statically inspect the resolved closure and integrity. Registry acquisition is permitted only after explicit user approval. Any newly discovered execution/native path requires its own review before execution approval.

This request excludes typecheck/tests/importing acquired packages, runtime/server/model calls, user configuration changes, root package or submodule changes, publication and lifecycle-script execution. The user explicitly changed the Pi target to the latest release, then clarified that this means the bridge dependencies/qualification target, not the global CLI. That scope correction clears and supersedes this old acquisition request; it is not approval to install or execute the updated packages. All 17 checkboxes remain pending; no Oracle implementation gate has been dispatched.

### User amendment - Pi 1.0.4 qualification target

Official npm `latest` metadata for both Pi packages reports 1.0.4, requiring Node >=22.19.0. Updated the owning proposal/design/tasks and proposed package ADR to exact released unpatched Pi 1.0.4 with unchanged OpenCode 1.18.29. This replaces the unimplemented 0.99.2 target, not adds legacy support; global Pi, root dependencies/settings and foreign work remain unchanged. No manifest or lockfile exists yet. Strict OpenSpec validation passes and apply remains ready at 0/17.

BASELINE_INVALIDATED=YES

The source boundary above is refreshed before any implementation Oracle invocation; no review round or rebuild has been consumed. Preserve valid unchanged OpenCode/MCP evidence but invalidate the Pi 0.99.2 acquisition/API evidence for the new target. Resume the same successfully completed/reconciled worker for a bounded static review of Pi 1.0.4 manifests, integrity, changed dependency acquisition paths and public provider/loader contracts. Installation/execution remains unapproved until the refreshed packet is reconciled and explicitly accepted. ADR reassessment: existing proposed package ADR still owns the same architecture; version selection warrants an amendment, not another ADR. No runtime compatibility is claimed.

### Terminal reconciliation - Pi 1.0.4 static refresh

Worker `f7a642b2-f8b4-47bc-bddf-f39fbbe1093d` completed; caller read the refreshed bound report and confirmed terminal `state: complete`. Its project write scope is empty; static archive/source/doc downloads and extractions remain in the recorded disposable temp directory, and the managed report was updated. No installation, acquired-code execution, server/model call or configuration/credential read was reported. Caller verified standalone status remains only `docs/` on unborn `main`, no manifest/lockfile exists, and root staged inventory is unchanged.

Caller independently rehashed the current released Pi archives: coding-agent 1.0.4 matches SHA-256 `04910bdae661a6529e9d6869b04006f6aad01186398b04a16c6d9793667b96c5`; pi-ai 1.0.4 matches `2fd5bf57c6a5b5b82d4563b18a2627b14d74dc4aacbf69a3dcf91c091e6038cf`. The worker reports released docs/source declaration comparison preserves the required provider/loader/abort/instrumentation seam; retry and settled behavior still requires runtime evidence. No further architecture amendment is indicated by static inspection.

New acquisition finding: Pi's chord path includes esbuild 0.28.2 with a postinstall helper and platform optional binary. Acquisition must suppress all lifecycle scripts and retain platform optionals. Pi TUI native prebuilds and QuickJS/Photon assets are static acquisition findings, not approval to execute them. No helper execution is required by inspected acquisition/typecheck evidence. Exact final semver transitive resolution and integrity remain pending the standalone lockfile. Unchanged OpenCode/MCP evidence remains valid; runtime qualification is still unproven.

### Pending human approval - Pi 1.0.4 acquisition only

Requested result: explicit yes/no approval to create the standalone package manifest with exact runtime pins OpenCode SDK 1.18.29, MCP SDK 1.29.0 and Zod 4.1.8; exact dev pins Pi coding-agent/pi-ai 1.0.4, TypeBox 1.3.27, TypeScript 5.8.2 and Node declarations 22.19.19, while keeping host packages as peers. From the standalone workspace run `yarn install --ignore-scripts` to produce yarn.lock/node_modules, retain platform optional packages, and statically review the resolved manifests/lock/integrity before any execution. This one install from the prepared exact manifest is equivalent to the report's script-disabled Yarn add acquisition without redundant package additions.

Scope excludes lifecycle/helper execution, imports/typecheck/tests, OpenCode/Pi runtime/model calls, global Pi/root package/settings/submodule changes, and publication. Approval to select Pi 1.0.4 did not approve acquisition or execution. The user explicitly answered yes to this acquisition-only request, clearing the wait. Task 1.2 and all wave checkboxes remain pending; no implementation Oracle review has occurred.

### Approved task 1.2 acquisition assignment

Owner: retained, successfully completed and reconciled worker; task mode changes from static read-only review to bounded manifest/acquisition writer plus static lockfile reviewer. User approval covers only standalone package.json, yarn.lock/node_modules acquisition via `yarn install --ignore-scripts`, and static installed-tree/integrity inspection. Keep exact reviewed direct/runtime and dev pins, host peers, and platform optionals. Preserve the supplied ADR and parent/foreign files; no source/tests/configuration/ADR/spec/log edits, lifecycle/helper execution, dependency imports/typecheck/tests, servers/models, commits, publication or global/root changes. Report actual write scope, commands/results, exact direct and internal Pi resolutions, transitive lifecycle/native paths and any remaining review gaps. Further package-code execution requires a later explicit user approval after this assignment's reconciliation.

### Terminal reconciliation - approved acquisition

Worker `a9a7c4f4-ae31-4a26-9ce3-8124e83119c6` completed. Caller read its bound acquisition report and confirmed terminal `state: complete`. Actual package writes are the approved package.json, generated yarn.lock and node_modules; Yarn also populated its normal operator cache. No source/ADR/spec/root/settings change, installation hook, acquired-package import/bin/helper, server/model request, commit or push was reported. Standalone status confirms only docs plus those acquisition artifacts, with nothing staged; root staged inventory is unchanged.

The first install timed out after 180 seconds while fetching, with no lock or node_modules; the second used a 600-second deadline and completed successfully after 435.30 seconds. Its budget increase did not follow the prescribed exact 1.5x timeout recovery ratio; this is recorded rather than retrospectively claimed compliant. No remaining process, cancellation, concurrent restart or further retry occurred. Successful acquisition is preserved, not replayed.

Caller reran operator-managed `yarn check --integrity --ignore-scripts` from the standalone workspace: exit 0, folder in sync. An earlier plain integrity check failed only because Yarn recorded the install flag; the matching-flag check is the relevant result. Caller independently inspected the manifest, lock direct resolutions/integrities and actual package versions. All selected direct pins and internal Pi packages resolve as reviewed (Pi 1.0.4); the Linux x64 esbuild optional artifact is physically present. All lock resolution URLs use standard npm/Yarn registries. No runtime qualification is inferred.

Candidate acquisition identity: package.json SHA-256 `dc6c3ef73d4f6b9a20f06ca4ece528deeabe35fdea4e72d161ea3b4b1fa792d3`; yarn.lock SHA-256 `12e1318fdc603882b82e2f03f7b0ee9888ab576b6f34c84b207c8e04bf321bf1`.

Caller dispositions: nested MCP Zod 4.6.5 is a normal lock-pinned transitive resolution alongside direct Zod 4.1.8, not a current blocker or reason to force dedupe; no single-physical-version contract exists. Likewise, the additional transitive Node declarations do not replace the exact direct Node 22 qualification types. The suppressed protobufjs helper was statically inspected: it reads manifests and emits version-scheme warnings; it does not require execution for acquisition and remains unapproved. Google genai's inspected preinstall is an echo no-op; it remained suppressed. Esbuild's postinstall/native helper remains disabled and unapproved. Native/WASM assets and callable libraries require the next execution permission, not more acquisition or automatic build scripts. Runtime API/schema interoperability remains a Wave 1 test obligation.

Acquisition and proportionate static lock/tree review are complete. Task 1.2 remains incomplete because no package entry, commands, resolution/typecheck or real loader has been qualified. All 17 checkboxes stay pending until whole-wave caller PASS; no Oracle implementation gate was dispatched.

### Approved Wave 1 controlled execution

Requested result: explicit approval to proceed with remaining Wave 1 implementation and run reviewed package code/toolchain with standalone `yarn typecheck` and `yarn test` commands (to be established), released Pi 1.0.4 loader and existing OpenCode 1.18.29 managed loopback runtime against the deterministic local model fixture. This includes exercising reviewed native/platform assets when the released loader requires them, but excludes all lifecycle/install-helper scripts, paid/external model requests, publication, global Pi/root dependency/settings changes and unrelated work. Stop for any new unreviewed executable/plugin acquisition, unexpressible runtime authority/batch/retry boundary or required helper outside this scope. The user's explicit `now continue` instruction authorizes this controlled Wave 1 execution scope; it is not merely a model-selection answer. Live OpenCode Zen prompt egress remains a distinct later approval gate. The user selected Muse Spark 1.3 Free for that later check; official Zen pricing and public catalog resolve the exact free variant to `muse-spark-1.3-contributor-free`. Updated owning design/task 3.2 to require that connected pair, runtime availability/pricing/data-handling verification, explicit egress approval and no paid substitute. Strict OpenSpec validation passes. Wave 1 still uses only the local fixture; no live request has occurred.

### Current writer topology and handoff

Current bounded assignment is a single seam: task 1.2 entry/toolchain completion and task 1.3 owned runtime/selective configuration lifecycle, with package resolution/typecheck and real sentinel/first-session checks. One retained worker owns only standalone manifest/toolchain files, the extension/runtime/configuration modules and their focused test/fixture/docs evidence; the parent remains the exclusive ADR/spec/log writer. Serial shared-cwd execution avoids conflicting package-entry/runtime ownership and preserves useful dependency context. No parallel or unrelated component writer is needed.

Task 1.4 tool-relay/finite-batch implementation and task 1.5 effectful retry retirement are later bounded assignments, not part of this writer commission. Parent consumes this runtime/configuration handoff before advancing. Task 1.6 remains the one final whole-Wave-1 Oracle gate, never an intermediate task review. Source/evidence go/no-go failures stop expansion without authorizing fallback or a host patch. All checkboxes remain pending until the full numbered wave clears caller PASS.

### Terminal reconciliation - entry/runtime slice

Worker `98e72f80-d45d-4028-b306-af1b5f09d824` completed; caller read its current bounded implementation handoff and hang-triage follow-up, not the obsolete acquisition approval language earlier in the shared report. Caller verified terminal state, actual standalone status and unchanged acquisition lock/root staged inventory. New maintained files are .gitignore (2 lines), package.json (33), tsconfig.json (14), src/configuration.ts (154), src/runtime.ts (157), src/index.ts (56), test/runtime.test.ts (219). The report's earlier 146-line test count/source digest predates its final follow-up and is not the current candidate identity. Parent current source+lock digest (sorted relative path, NUL, bytes, NUL over those seven files plus yarn.lock) is `sha256:94167c2dd46debf2619e91e256b33e5365b2f13581f74f80e9f5dd0c4ce23701`.

The worker reports typecheck and the bounded test pass, but the latter is explicitly test-only HOME/XDG isolation, not production qualification. The production entry inherits process.env and does not derive the required provider/authentication subset; an earlier real run exposed global commands. No first-session/title inference, released Pi loader, relay or retry qualification was completed. Caller inspected src/index.ts and the relevant configuration/runtime/test boundaries. No task completion, whole-wave review, staging or commit is warranted. No owned temp dirs remain in the caller snapshot; the worker reports the owned server was closed and unrelated OpenCode processes were untouched. Real runtime configuration inspection occurred inside the owned child, not a manual credential dump; no external model requests or user-file changes were reported.

Caller reconciliation: the command leakage is a genuine unmet task 1.3 boundary. The guard's rejection of every configured provider is not itself proof of an impossible design: provider/authentication configuration is deliberately retained by design 3, while unrelated commands/agents/tools/plugins are excluded. Fixture-only isolation cannot establish production behavior. Expansion to tasks 1.4/1.5 remains stopped.

New source evidence found after this handoff: pinned OpenCode auth/index.ts uses `OPENCODE_AUTH_CONTENT` before reading the auth.json data path in Auth.all. This source-supported process-only input, together with the already observed owned HOME/XDG isolation, deserves one bounded synthetic-auth probe before concluding that all supported controls are exhausted. It does not authorize copying/persisting real credentials, modifying files or admitting extra execution surfaces. No artifact boundary is weakened or amended based solely on this observation. Retain valid acquisition/typecheck evidence; investigate only this new control and its credential/necessary-plugin limits, then reconcile its result before any product implementation or user decision.

### Orchestrator - routing override and synthetic authentication probe

The user selected orchestrator-led execution with only Oracle delegation. All remaining implementation/investigation/validation assignments now belong directly to Orchestrator; historical worker evidence remains valid but grants no further dispatch authority. Updated the owning design/tasks and current log routing without changing the implementation boundary or marking tasks complete. No reviewer round or rebuild was consumed.

Extended the existing real-runtime sentinel test with synthetic `OPENCODE_AUTH_CONTENT`, owned HOME/XDG paths and an explicitly titled session. Only non-secret fixture authentication was used; no real credential file was read. The first prompt timed out at 10 seconds; a bounded diagnostic follow-up at 15 seconds revealed repeated local fixture requests. The fixture used single newlines between SSE events, so the backend could not consume its intended finish event. Corrected the fixture to separate SSE events with blank lines rather than changing product retry behavior or relaxing assertions. This failure is not evidence that the native effectful retry boundary passes.

Final `yarn typecheck` passes against pinned Pi 1.0.4. `yarn test` passes in 5.04 seconds with one controlled authenticated model request, expected text, no auxiliary title/discovery inference and no persisted auth file at the actual XDG data path. Strict OpenSpec validation passes. Source+lock candidate SHA-256 is `ee5f2a3dfc0fd0d18c114925301b1bb42e48b120c896500ee6823abf46545f52` over sorted package-relative source/toolchain/lock paths. Owned runtime/test directories are gone; unrelated OpenCode PID 6833 remains. Root staged inventory is unchanged. The initial Git inventory command lacked the per-command safe.directory setting and failed; corrected inspection succeeded without changing Git configuration. No commit, staging, external model request or Oracle dispatch occurred.

The probe qualifies only synthetic API-auth input to the isolated OpenCode runtime. Production entry still lacks selective provider/auth inheritance; real OAuth/plugin integrations, Pi loader, relay/batch boundary and effectful retry remain unqualified. Design decision 3 calls for a derived process-only provider/auth subset, but its non-goals also exclude credential copying. Production use of `OPENCODE_AUTH_CONTENT` would transfer authentication material into the owned child environment, so clarification/amendment is required before reading real credentials or adopting this mechanism. Proposed next scope: amend the owning design, auth requirement, task 1.3 and package ADR to explicitly permit necessary provider/auth material in memory/the owned child environment only, with no disk/Pi-store copy, user-file rewrite, raw logging, or automatic plugin installation. At this checkpoint the proposal was not yet approved; the following user approval supersedes that pause.

### Approved authentication amendment and direct implementation

The user explicitly approved the proposed amendment. Updated the owning design, authentication requirement/scenario, task 1.3 and package ADR to permit necessary authentication in memory/the owned child environment only. Disk/Pi-store copies, raw logging, user-file rewrites and automatic plugin installation remain prohibited. The current canonical bundle digest is the updated BASELINE_SOURCE above; no Oracle round/rebuild or task completion occurred.

Orchestrator implemented `src/provider-configuration.ts`: provider-only JSON/JSONC source projection, retained-provider environment/file reference resolution, precedence merging, API authentication and explicit unavailable status for unqualified OAuth/remote-auth providers. Excluded plugins are reported rather than executed. Wired this reader into the extension's session-start path. The runtime now enforces owned HOME/XDG paths, clears ambient config/permission overrides, supplies process authentication/configuration, disables default/discovered plugins and model-metadata fetching, drains backend diagnostics without forwarding secret-bearing output, and cleans up internally owned workspaces. Missing-executable cleanup no longer waits forever for an exit event from a child that never spawned; normal shutdown cancels its fallback timer. The minimal agent denies all native tools using the supported wildcard tool setting. Added concise README startup/authentication/qualification boundaries.

`test/provider-configuration.test.ts` verifies reference/JSONC handling, precedence, excluded-instruction non-reading, unchanged synthetic auth/config sources, explicit OAuth limitation and parser-error redaction. Updated `test/runtime.test.ts` to exercise the production source-reader/runtime path with synthetic operator files: exactly one authenticated inference with an explicit title, no declared native tools, unchanged sources and no credential bytes in any owned runtime file. Missing-executable behavior is also tested. No real credential file or external model was used. The pre-relay suite passed four tests and typecheck.

### Task 1.4 go/no-go - public tool-batch ordering blocker

Added `test/tool-boundary.test.ts` using real OpenCode 1.18.29, official MCP SDK 1.29.0 and a deterministic loopback model. The model issued two identical `pi_probe` calls; both actual MCP requests remained pending. A public session-message snapshot had two running tool parts but zero step-finish parts. After controlled MCP results were released, completion succeeded and two step-finish parts appeared. The fixture's known call count is only a synchronization aid for observing this state, not a production batching boundary. This probe does not execute a Pi tool and does not qualify Pi hook/exactly-once behavior.

Pinned `session/processor.ts` handles tool-input-end per call and publishes step-finish from the LLM step-completion event; pinned `session/llm.ts` derives that event from AI SDK fullStream. The observed public step-finish ordering therefore cannot be used to close a Pi tool handoff segment while its MCP results are still pending. Waiting for it deadlocks the planned whole-model-batch handoff. No timing debounce, fixture-derived call count, direct tool executor, provider proxy, host patch or early Oracle review was substituted.

Latest checks: `yarn typecheck` passes (1.90 seconds); the integrated `yarn test` suite has four passes and one real qualification failure (2.28 seconds), with before=0/after=2 step-finish observations. Strict OpenSpec validation passes. Source/toolchain/lock digest is `sha256:e1ae6990878dcb6bf0e8068b4e2590f31d7bec4f7f727f63563d046944aacf25` (sorted package-relative paths, NUL, bytes, NUL). All owned temporary directories and children were cleaned up. The unrelated port-5551 server now appears as PID 6913 rather than the previous snapshot's 6833; no bridge operation targeted either process. Root staged inventory remains only the previously recorded foreign entries. No staging/commit, external inference or delegation occurred.

Implementation stops at the design's explicit finite-batch go/no-go gate. All 17 tasks remain unchecked; task 1.6 is not ready. Proposed owning-artifact amendment: use exactly one accepted MCP request per Pi provider handoff segment, settle its matching Pi result on continuation, and then emit the next pending request from the same backend generation. This supplies a deterministic request boundary without waiting for a model-step end, preserves distinct IDs and Pi execution authority, and serializes backend-parallel calls through separate Pi segments. Amend design decision 4, task 1.4, the parallel-call scenario and package ADR only after user approval; then replace the blocked whole-batch expectation with real Pi-loop/exactly-once acceptance tests. No such amendment is approved yet.

### Bounded follow-up - public-event and source ordering

The user requested architectural review and approved further investigation, not serialization. Orchestrator extended the same boundary probe to subscribe to the public `/event` SSE endpoint and await its `server.connected` handshake before session creation/inference. Both real MCP responses remained unresolved for a one-second diagnostic observation window. This delay is solely a test observation opportunity; it is never a production batching rule or proof of absence by itself.

Observed before result release: step-start, individual pending/running tool updates, session/status and catalog/integration events; no assistant finish or step-finish. After releasing the results: step-finish and assistant `finish=tool-calls`, followed by the final text step, `finish=stop` and session idle. Public plugin-added metadata also appeared; these events alone do not establish execution of configured plugins or a batch boundary. Diagnostic capture retains event types/states only, not provider/auth/tool payloads. The previous immediate snapshot alone was insufficient to establish ordering; this event capture and the source trace below supersede that evidentiary limitation.

Pinned OpenCode commit `16747470f976aca3d362ad730bcd3fe82ecc2c9a` resolves `ai@6.0.168` in bun.lock, without an ai-package patch entry. In that AI SDK tag, `packages/ai/src/generate-text/run-tools-transformation.ts` stores the provider finish chunk and only enqueues it in `attemptClose()` when `canClose && outstandingToolResults.size === 0`; its comment explicitly states finish is delayed until all tool results arrive. OpenCode `session/llm/ai-sdk.ts` converts finish-step into stepFinish; tool-input-end remains per-call. Its raw-event branch consumes Copilot accounting and returns no events. OpenCode `session/processor.ts` handles tool-input-end with ensureToolCall, not a batch notification; step-finish alone updates assistant finish and creates the public completion part. The inspected LLM event publisher handles permission replies, not a separate model-finish signal. No supported complete-batch signal was found in this pinned AI SDK/session/public-event path. This does not claim exhaustive proof across other runtime modes or future OpenCode versions.

Verification: typecheck passes; strengthened probe fails its original qualification expectation in 3.41 seconds (before=0, after=2), with successful event subscription, two pending MCP calls and successful result release/cleanup. Afterwards, only diagnostic rendering was compacted to event-count output; behavior assertions were unchanged and not rerun redundantly. Current source/toolchain/lock digest is `sha256:9777041a880c3be9fb58e93de5b8657acab2aa7066364f8005703743ec74e357`. OpenCode still reports 1.18.29, owned temporary paths are absent, and root staged inventory is unchanged. No implementation ownership delegation, Oracle gate, real credentials, external model, host patch or architectural amendment occurred.

Caller recommendation after this bounded investigation: single-request Pi handoff segments are now the preferred fallback over a provider proxy or host patch, but only with explicit acceptance of serial tool execution and fragmented Pi segments. Task 1.4 remains blocked until the user approves that owning-artifact amendment or chooses to preserve parallel semantics and defer the extension pending upstream support. Oracle remains reserved for the completed numbered wave.

### Approved single-request architecture and Wave 1 implementation evidence

The user explicitly approved amending the spec and implementing single-request handoffs. Updated owning design decision 4, delta requirement/parallel-call scenario, task 1.4/dependency guidance and package ADR before implementation. Serial tool execution, fragmented Pi segments and unsupported concurrent-sibling tools are now explicit accepted tradeoffs. The updated public-event ordering test characterizes the pinned runtime limitation instead of retaining an obsolete failing whole-batch acceptance condition. No Oracle round/rebuild was consumed by this pre-review user amendment.

Current whole-wave owner mapping: Orchestrator directly owns tasks 1.1-1.5, superseding all historical worker recommendations; task 1.6 is the single final Oracle advisory gate. Task 1.1 owns repository/ADR metadata; 1.2 owns manifest/lock/TS entry; 1.3 owns provider projection/runtime isolation and sentinel tests; 1.4 owns tool-relay/provider-seam/entry integration and real Pi agent-loop tests; 1.5 owns cancellation, failure retirement, response socket lifecycle and corresponding tests. Root foreign staged entries remain excluded. Source repository is still unborn main, not pushed or attached as a root gitlink.

New `src/tool-relay.ts` creates one pending handoff per actual MCP request without executing a tool. New `src/provider-seam.ts` emits one Pi tool call/terminal toolUse per segment, resolves only its matching result on continuation, and resumes the same OpenCode request. Public retry/error events retire the backend generation; identical failed contexts cannot restart it automatically. The Pi entry now discovers the minimal connected text/tool catalog and wires the seam on selection, keeping provider/auth snapshots in memory. Full catalog refresh, streaming fidelity/accounting/images, retained-context replay and released-loader qualification remain Wave 2/3 work, not claims of this seam. README records those limits.

Tests use released Pi agent-core 1.0.4's actual Agent/tool loop and before/after hooks, real OpenCode 1.18.29, official MCP SDK and deterministic loopback inference. Text-only, one tool, two identical tools, failed second-tool result, cancellation inside an executing tool, owned-server termination, transient provider 503 after a Pi result, blocked identical-context replay and later user-directed recovery are exercised. Distinct tool identities, one call per Pi segment, hook counts, matching backend results and two total model requests for a tool round trip are asserted. `test/tool-relay.test.ts` additionally verifies rejection of undeclared native tool names, cancellation settlement and harmless late results.

Dependency bookkeeping: declared the already-reviewed/acquired Pi agent-core 1.0.4 as a host peer/exact dev dependency for its direct test import. Frozen offline install correctly rejected the new selector; `yarn install --offline --ignore-scripts` then updated the lock using existing cached packages, with no network acquisition or lifecycle execution. Root/global dependencies were not changed.

Runtime failure investigation found repeated ECONNRESET at reused port 4096 with pooled global fetch connections. Connection-close headers alone did not resolve it. The owned loopback transport now uses Node HTTP with agent:false; it also explicitly binds abort to the response body, preventing an SSE cleanup hang after retry recovery. Two timed-out suite commands left known test descendants, which were inspected by exact cwd/command and terminated without targeting unrelated processes. Recovery budgets increased from 120 to 180 to 270 seconds; a temporary --test-force-exit diagnostic isolated cleanup, but final passing evidence uses ordinary `yarn test` without forced exit. All owned temp directories are now absent. No test failure was accepted as success.

Final validation: ordinary `yarn test` passes all 11 then-existing tests in 13.07 seconds with normal process exit; the newly added focused relay test separately passes (1/1, 0.43 seconds). Final typecheck passes in 2.34 seconds; strict OpenSpec validation passes. No real operator credentials or external model calls were used. The current candidate digest above covers sorted package-relative .gitignore, package.json, yarn.lock, tsconfig.json, README.md, package ADR, and every src/test file (path NUL bytes NUL). The owning bundle digest covers its four canonical files in sorted root-relative order. All checkboxes remain pending until whole-Wave-1 caller PASS. The next action is the first FULL Oracle review of tasks 1.1-1.5 under gate 1.6; no per-task review or substitute reviewer is authorized.


## Round 1 - Oracle Review

**Mode:** FULL. **Gate:** task 1.6, advisory only.  
**Result:** Three reproduced P1 failures remain; the existing suite passes.

### Inherited decisions

The review covers completed Wave 1 tasks 1.1–1.5 together, not individual implementation gates.

| Task | Owner |
|---|---|
| 1.1 — Repository and ADR | Orchestrator |
| 1.2 — Dependencies, package and entry | Orchestrator |
| 1.3 — Configuration/authentication isolation | Orchestrator |
| 1.4 — MCP-to-Pi execution handoff | Orchestrator |
| 1.5 — Cancellation and failure retirement | Orchestrator |
| 1.6 — Whole-wave independent advisory review | oracle |

Orchestrator owns reconciliation, edits, task completion, authoritative decisions and repository operations. All non-gate implementation remains Orchestrator-owned.

The approved memory/owned-child authentication transfer and one-MCP-request-per-Pi-segment architecture remain unchanged. Serial backend-parallel tools and unsupported concurrent-sibling execution are accepted limitations.

**Frozen identity independently verified:**

- Source bundle: `2f9be13db5ee184962bb4d1611b9ce0cb84126a874898c487a49a88ca3a5aafa`
- Candidate before and after review: `3bcf96274da215354a54e047db19df0010244fd7f434465d35f01aca3251550f`

The standalone unborn-main repository’s entire untracked package was reviewed as candidate code. Foreign root changes were excluded.

### Diagnosis and coverage

All seven source modules, five test files, package/TypeScript setup, README, ADR, canonical four-file OpenSpec bundle and implementation-review record were inspected. Lockfile registry/direct-pin checks and installed qualification versions were also inspected.

Required applicable guidance was available and loaded, including review-convergence and the matching engineering, testing, code-review and supply-chain references.

Independent execution confirmed:

- `yarn typecheck`: passed.
- Ordinary `yarn test`: **12/12 passed**, normal exit in 12.58 seconds.
- Node 22.19.0, Pi agent-core 1.0.4, OpenCode 1.18.29 and MCP SDK 1.29.0.
- Three additional read-only, stdin-based synthetic probes reproduced the failures below.

The existing real-loop tests meaningfully establish ordinary text, distinct serial tool handoffs, hooks, failed results, initial-signal cancellation, server termination and retirement while the event connection remains healthy. They do not detect these three negative paths.

### Findings

Paths below are relative to `extensions/pi-opencode-bridge/`.

#### W1-RETRY-001 — P1: Losing the event subscription leaves later turns without retry retirement

**Family/root:** effectful-retry-retirement / dead-event-channel-reuse  
**In scope:** Yes — task 1.5; design decision 6 requires retiring retrying generations before another Pi execution.

**Evidence:** `src/provider-seam.ts:76–96,110–145,158–173`. Event-pump completion/rejection cancels only a currently unfinished turn. No persistent unavailable state prevents a subsequent request from using the same seam after that pump has terminated.

The synthetic probe completed a text turn, disconnected only the bridge-owned `/event` response, then issued a new user-directed turn. The fixture returned one tool, HTTP 503 after its real Pi result, then another tool on OpenCode’s retry. The real Pi loop executed both:

```json
{"requests":4,"executionsAfterOneToolAnd503":2,"finalReason":"aborted","ownedServerAlive":true}
```

The second execution was deliberately aborted to bound the probe. The OpenCode server remained healthy; only its monitoring connection had failed.

**SUGGESTED_CORRECTION:** Latch event-subscription loss as seam unavailability, retire active work, and prevent later inference through that unmonitored seam. Require a fresh owned runtime/subscription before safe later recovery, and add this disconnect-between-turns regression to the real-loop tests.

#### W1-ISOLATION-001 — P1: An overlapping independent request cancels the current request

**Family/root:** independent-request-ownership / shared-turn-cancellation-on-overlap  
**In scope:** Yes — design decision 4 requires serializing unrelated inference; the cancellation requirement prohibits affecting independent Pi requests.

**Evidence:** `src/provider-seam.ts:163–170,195–197`. An unrelated invocation encounters the shared active turn and throws. Its catch then cancels that shared turn, rather than only handling the incoming request.

The synthetic probe held request A at the local fixture, then invoked independent request B without aborting A:

```json
{"second":"error","firstWithoutAbort":"error","firstError":"OpenCode bridge request failed; no automatic replay was performed"}
```

Thus B both fails and terminates A.

**SUGGESTED_CORRECTION:** Serialize unrelated requests while allowing the matching tool-result continuation to bypass that queue. Scope failure/cancellation to the invocation’s owned turn; an overlapping request must not cancel the current owner. Add an overlapping-request regression.

#### W1-ABORT-001 — P1: Tool-result continuations ignore their supplied abort signal

**Family/root:** cancellation / initial-invocation-only-signal-binding  
**In scope:** Yes — task 1.5 and the supplied-abort/cancelled-handoff requirements. This does not request Wave 2 instrumentation expansion.

**Evidence:** `src/provider-seam.ts:110–115,163–187`. Abort binding/checking occurs only in `begin()`. A continuation instead settles the emitted result and can emit another queued call without checking or binding that invocation’s signal.

Using the real Pi Agent and a two-tool fixture, the probe supplied an already-aborted signal specifically to the second provider invocation:

```json
{"toolExecutions":2,"secondInvocationAlreadyAborted":true,"segmentReasons":["toolUse","toolUse","stop"],"requests":2}
```

The cancelled continuation emitted another tool-use segment and produced a second actual Pi execution.

**SUGGESTED_CORRECTION:** Check cancellation before settling continuation results or emitting queued calls, and bind each continuation invocation’s signal while it waits. Cancellation must retire the active generation and queued handoffs. Add an already-aborted/during-wait continuation regression.

**P0:** None identified. **P2/P3:** No additional findings.

### Drift / contradiction check

These failures contradict existing cancellation, request-isolation and effectful-retry guarantees; they do not invalidate the approved serial handoff or authentication amendments.

Wave 2 streaming/accounting/catalog/context/image work and Wave 3 released-loader/repository integration remain outside this gate. Their deliberate incompleteness is not classified as a Wave 1 blocker. Pending checkboxes are likewise not findings: the caller intentionally retains them until reconciliation.

### Recommendation

Reconcile and narrowly patch the three findings within this wave, retain the approved architecture, then rerun the existing suite plus the targeted regressions against a newly recorded candidate digest.

No rebuild or product-scope amendment is indicated by this first round. The existing passing suite alone is insufficient for Wave 1 acceptance given the reproduced second execution after event-channel loss.

### Risks and limits

- No real credentials or external inference were used.
- OAuth/plugin/provider-specific integrations remain unqualified.
- Released-loader packaging, full stream/accounting fidelity and retained-context behavior remain pending by scope.
- Dependency-acquisition chronology and ADR-before-code ordering were corroborated from the supplied implementation record, not independently reconstructed.
- Strict OpenSpec validation was reported by the parent; it was not independently rerun.
- Probes changed no source files. Event-disconnect instrumentation existed only in the disposable probe process and was restored.

### Need from main agent

No clarification is required. Orchestrator must reconcile these findings and decide the authoritative action.

### Suggested execution prompt

No worker handoff is warranted or permitted. Implementation remains with Orchestrator.

PROPOSED_REVIEW_ACTION=PATCH

### Caller assessment - Wave 1 round 1

Terminal oracle run c13ed32e-eac7-40f0-9244-9cc73fcc0e98 reconciled: completed read-only review, unchanged candidate digest, 12/12 independent tests and three synthetic reproductions. No project writes reported. All three findings are accepted as blocking against existing Wave 1 requirements, not additional scope.

- W1-RETRY-001: ACCEPT_BLOCKING. Governing source: task 1.5/design decision 6, no effectful replay. CORRECTION: latch lost event monitoring, retire the generation, refuse reuse until a fresh runtime/subscription is established; add disconnected-channel regression.
- W1-ISOLATION-001: ACCEPT_BLOCKING. Governing source: design decision 4 serialized unrelated inference and cancellation isolation. CORRECTION: queue independent requests, bypass only matching tool-result continuations, and cancel only invocation-owned turns; add overlap regression.
- W1-ABORT-001: ACCEPT_BLOCKING. Governing source: task 1.5/supplied abort and pending-handoff cancellation requirements. CORRECTION: bind/check every invocation signal before resolving results or emitting queued calls, retiring its generation on abort; add pre-aborted and waiting-continuation regressions.

Architecture, source boundary and ownership remain unchanged. Orchestrator performs all remediation directly. No task checkbox changes, commit or second gate is authorized before same-wave re-review. One of four Oracle rounds consumed; zero rebuilds.

REVIEW_ACTION=PATCH
CONSENSUS_STATUS=NEEDS_REVISION

## Round 2 - Implementation Assignments

Wave 1 remains Orchestrator-owned for tasks 1.1–1.5; task 1.6 remains the same final advisory Oracle gate. Only accepted blocking findings were remediated, without changing the frozen boundary or source bundle.

- W1-RETRY-001: `src/provider-seam.ts` now latches loss of the event subscription as unavailable, retires current work, and refuses further inference through that seam. Recovery requires a fresh seam/runtime, not reconnecting an unmonitored generation. The new lifecycle test disconnects the actual owned HTTP event response between turns and verifies no subsequent model request occurs.
- W1-ISOLATION-001: independent invocations wait for generation ownership to release; a matching tool-result continuation bypasses those waiters. Failure cancellation targets only the invocation's owned turn. Tests hold the first request open, queue and abort another independently, and verify both surviving requests complete; a real Pi tool loop additionally proves its continuation bypasses queued independent inference.
- W1-ABORT-001: every matching continuation checks its own signal before settling a result and binds cancellation while awaiting its next segment. Real Pi-loop tests cover already-aborted continuations with a second queued tool and cancellation while waiting for backend text; neither permits a second tool execution.

Validation: `yarn typecheck` passes; ordinary `yarn test` passes 17/17 with normal exit in 13.85 seconds; strict OpenSpec validation passes. The first focused typecheck identified use of raw context in the new test helper; corrected it to Pi's `normalizeContext` before the passing runs. Test instrumentation alters only its own process's HTTP binding and restores it during cleanup. No production test hook, real credentials, external inference, dependency acquisition, commit or root staging occurred. Root staged foreign paths remain unchanged. Actual source edits are limited to `src/provider-seam.ts` and new `test/provider-lifecycle.test.ts`, plus this caller-owned review record.

PATCH_BASELINE_REVISION=sha256:12b02ddde9b351ba19ecbef5701d02dd1ff8f0927ff5a933805c7cf4911ed990

The canonical bundle digest remains `2f9be13db5ee184962bb4d1611b9ce0cb84126a874898c487a49a88ca3a5aafa`. One Oracle round consumed, zero rebuilds. Next review is PATCH mode with a bounded whole-Wave-1 regression sweep; all task checkboxes remain pending.

## Round 2 - Oracle Review

Oracle run `5f4841bb-3795-4722-88e2-60c335b11f8c` completed read-only review of candidate `12b02ddde9b351ba19ecbef5701d02dd1ff8f0927ff5a933805c7cf4911ed990`, independently confirming unchanged candidate and canonical bundle, passing typecheck and 17/17 tests. Its bound report is the retained `c13ed32e-eac7-40f0-9244-9cc73fcc0e98/reviews/add-pi-opencode-bridge-wave-1-round-1.md` artifact, whose contents now identify Round 2. No project writes, external inference or credential access reported.

W1-RETRY-001 and W1-ISOLATION-001 resolved in reviewed paths. W1-ABORT-001 remains P1/in scope: the continuation listener is removed when its toolUse segment ends, while its emitted MCP call remains pending. A real Pi/OpenCode probe aborted the second invocation's separate signal during its tool execution; all three queued tools executed and inference completed successfully. SUGGESTED_CORRECTION: retain continuation cancellation through the pending handoff lifetime and test that exact gap. Whole-Wave-1 regression sweep found no additional findings; tasks 1.1–1.5 remain Orchestrator-owned, with advisory gate 1.6.

PROPOSED_REVIEW_ACTION=REBUILD

### Caller assessment - Wave 1 round 2

Terminal result reconciled. W1-RETRY-001 and W1-ISOLATION-001 accepted corrections verified; no further edits required for these findings. W1-ABORT-001: ACCEPT_BLOCKING, recurring cancellation-lifetime root. Governing source: task 1.5 and the delta spec's cancellation requirement; a pending backend handoff must remain cancellable after its provider segment returns. CORRECTION: generation owns all supplied invocation-signal bindings until completion or retirement, rather than segment cleanup owning continuation bindings. Add cancellation during the second tool with a separate continuation signal; require no third execution or successful completion. Existing negative-path checks remain required.

REVIEW_ACTION=REBUILD
CONSENSUS_STATUS=NEEDS_REVISION

### Single bounded rebuild - Wave 1

Prior incremental patch worklist is retired. Re-derived from the unchanged approved specification, the boundary remains the minimal Wave 1 provider seam, including pending-handoff cancellation; no architecture, scope or owner changes are warranted.

BASELINE_TARGET=add-pi-opencode-bridge numbered Wave 1, tasks 1.1-1.5 and final gate 1.6
BASELINE_TARGET_REVISION=sha256:12b02ddde9b351ba19ecbef5701d02dd1ff8f0927ff5a933805c7cf4911ed990
BASELINE_SOURCE=User-amended canonical OpenSpec apply-context bundle sha256:2f9be13db5ee184962bb4d1611b9ce0cb84126a874898c487a49a88ca3a5aafa; Pi qualification target 1.0.4; later live-smoke model opencode/muse-spark-1.3-contributor-free; approved ephemeral child authentication and single-request Pi segments; Orchestrator implementation with only oracle delegation
BASELINE_INCLUSION_PREDICATE=Standalone package ADR and minimal real Pi/OpenCode provider seam, reviewed dependency acquisition, selective configuration isolation, deterministic single-request MCP-to-Pi segments serializing backend-parallel calls, exactly-once execution, cancellation and effectful retry retirement, with Wave 1 focused runtime evidence
BASELINE_EXCLUSIONS=Wave 2 catalog/context/attachment expansion, Wave 3 remote publication and submodule registration, paid-provider inference, root activation or host patches, foreign work, direct tool execution and delegation fallback

Complete correction batch: move initial and continuation abort bindings to generation ownership, clean them on completion/retirement, retain them across tool-use returns, add the reproduced cancellation-during-tool regression, then run typecheck and the existing full suite. Preserve resolved monitoring/isolation behavior. Orchestrator performs this bounded correction directly; no other component rewrite or worker dispatch. Two Oracle rounds consumed. Next review is FULL after this single rebuild; recurrence thereafter requires HUMAN_DECISION.

BASELINE_REBUILD_COMPLETE=YES

## Round 3 - Implementation Assignments

Orchestrator directly implemented the complete bounded rebuild correction batch in `src/provider-seam.ts`. A generation now owns initial and continuation abort bindings; no binding is removed merely because a tool-use segment returns. Completion or retirement removes all generation bindings. This matches the lifetime of the actual pending backend handoffs without changing tool authority or the approved architecture. `test/provider-lifecycle.test.ts` now additionally aborts the second provider invocation's independent signal inside the second of three tools: exactly two executions occur, no successful completion occurs, and the backend receives no tool-result continuation request.

Validation: `yarn typecheck` passed (2.23 seconds), ordinary `yarn test` passed 18/18 with normal exit (14.16 seconds), strict OpenSpec validation passed. All prior monitor-loss, unrelated-request isolation and initial/continuation cancellation checks remain passing. No dependency, credential, external inference, root staging or commit operations occurred. Final advisory gate remains task 1.6; tasks 1.1–1.5 remain Orchestrator-owned and unchecked.

BASELINE_TARGET_REVISION=sha256:ab15851694946506224863ed646f1e739ffae56cc3ee64b47fadd5c577f028fb

Canonical source bundle remains unchanged at `2f9be13db5ee184962bb4d1611b9ce0cb84126a874898c487a49a88ca3a5aafa`. Next review is FULL for the same whole Wave 1 after the single rebuild; two prior Oracle rounds and one rebuild consumed.

## Round 3 - Oracle Review

Oracle run `c8b33d05-2097-426a-bb63-4062d7410d23` completed FULL review after the single rebuild. Its bound report, retained at `c13ed32e-eac7-40f0-9244-9cc73fcc0e98/reviews/add-pi-opencode-bridge-wave-1-round-1.md`, now identifies Round 3. Reviewer verified unchanged candidate/source, literal boundary equality, typecheck and 18/18 ordinary tests; no project writes or external inference reported. Tasks 1.1–1.5 remain Orchestrator-owned; advisory gate remains 1.6.

W1-RETRY-001 remains resolved. W1-ABORT-001 resolved, including the original distinct-signal three-tool probe. W1-ISOLATION-001 recurs as stale-result ownership, P1/in scope: cancellation leaves `turn.emitted` populated; transcript-wide matching claims the cancelled turn before changed-user recovery. An ordinary Agent.abort probe executed one tool, then two fresh user prompts both failed without reaching the healthy model fixture. SUGGESTED_CORRECTION: retire emitted ownership on cancellation, allow continuation bypass only for a live matching generation, and distinguish a new user request before historical results can claim a failed turn; add cancellation-then-recovery coverage. No further findings reported.

PROPOSED_REVIEW_ACTION=HUMAN_DECISION

### Caller assessment - Wave 1 round 3

Terminal review reconciled; no partial project writes to account for. W1-ISOLATION-001: ACCEPT_BLOCKING. Governing source: design decision 4 independent-request ownership and task 1.5 safe user-directed recovery; source inspection confirms the cancelled emitted pointer is retained and matched before changed-user recovery. CORRECTION proposed for human authorization: retire stale emitted ownership and classify only live matching continuations, then verify ordinary cancellation followed by successive new user prompts succeeds without replaying the old tool. W1-RETRY-001 and W1-ABORT-001 remain resolved; no additional corrections accepted.

Terminal baseline verification: caller recomputed candidate `ab15851694946506224863ed646f1e739ffae56cc3ee64b47fadd5c577f028fb` and canonical bundle `2f9be13db5ee184962bb4d1611b9ce0cb84126a874898c487a49a88ca3a5aafa`; both match the latest recorded values. All four boundary fields compare literally equal between original and rebuilt records and still describe the current target. This is a current terminal assessment, not a stale verdict.

Three Oracle rounds and one rebuild consumed. The ownership family recurred after that rebuild, so automatic remediation stops despite the remaining fourth-round capacity. No further code edits, task completion or commits are authorized by this result. Ask the user to authorize a separate bounded correction/review sequence for stale handoff ownership, retaining Orchestrator implementation and only Oracle review.

REVIEW_ACTION=HUMAN_DECISION
CONSENSUS_STATUS=REQUEST_CLARIFICATION

### Human-authorized bounded recovery sequence

The user explicitly approved a new bounded correction/review sequence for W1-ISOLATION-001 stale handoff ownership. Its separate sequence log is `docs/plans/reviews/add-pi-opencode-bridge-wave-1-recovery-review.md`; the previous sequence remains terminal and is not silently reset. The new log retains the same canonical bundle, whole-Wave-1 gate 1.6, Orchestrator implementation and Oracle-only advisory review. Direct correction and validation are recorded there; all 18 tests, typecheck and strict OpenSpec validation pass at candidate `d8672174c0b6505c8451e9a0b96caf7b7e0c30ca542af3dd5d794e2996bff4bb`. No task completion or commit before the newly authorized whole-wave caller PASS.

### Caller completion - authorized recovery sequence

The separate recovery sequence's Round 2 FULL Oracle review resolves all three accepted families with no current findings, independently passing typecheck, 20/20 tests and the original failed-remote-abort probe. Caller reconciled the terminal run and verified exact candidate/source digests plus literal frozen-boundary equality before PASS; evidence and dispositions are in `add-pi-opencode-bridge-wave-1-recovery-review.md`. Current implementation candidate is `d9925ca176f924bbcf30a4251d1fd9edb049b21dd729e1c282f5bc458b792039`. This consumes the same whole-Wave-1 gate 1.6. Tasks 1.1–1.6 are complete. Standalone Wave 1 source commit: `4c30234`; root completion commit: `8ce9abf`. Concurrent root commits had already captured the planning/review artifacts; the scoped parent commit contains only task completion. Those concurrent commits were preserved rather than rewritten. Foreign root changes (including newer `.gitignore`, package.json, tools and test/subagent-profiles work) remain excluded. No remote publication or gitlink registration occurs in Wave 1.

REVIEW_ACTION=PASS
CONSENSUS_STATUS=APPROVED

## Wave 2 Review Sequence

BASELINE_TARGET=add-pi-opencode-bridge numbered Wave 2, tasks 2.1-2.5 and final gate 2.6
BASELINE_TARGET_REVISION=sha256:9d1143da526f9501082daa0a306ab784c838f77fd713f6751fb2fccd4b99614c
BASELINE_SOURCE=Canonical OpenSpec apply-context bundle sha256:6ad1af6e7b8a010334147c1ad7e3dcf757f9637af8dc48aaeb284542ed512300; approved architecture unchanged; completed Wave 1 source 4c30234; Orchestrator implementation with only oracle delegation
BASELINE_INCLUSION_PREDICATE=Connected catalog/refresh and metadata, incremental text/reasoning and nonduplicated accounting, supported image input/results, append-compatible backend context and labelled replay/invalidation, evidenced diagnostics, actual entry/Pi-loop controlled-runtime validation, and preservation of Wave 1 ownership/cancellation guarantees
BASELINE_EXCLUSIONS=Wave 3 packed/released-loader qualification, external model egress, OAuth/plugin qualification, remote publication/submodule registration, root activation/settings/dependencies and foreign work

## Round 1 - Implementation Assignments

All non-gate tasks 2.1–2.5 are directly Orchestrator-owned. Final task 2.6 is the sole independent advisory oracle gate for this completed numbered wave, excluded from implementation assignments. No per-task reviews were dispatched. Wave 2 tasks remain unchecked until caller PASS.

- 2.1: `src/catalog.ts`, `src/index.ts`, catalog and provider-entry tests. Metadata is projected without credentials, full pair identities are retained, refresh preserves valid registration on failure and rejects removed selection. Real-runtime inspection exposed that pinned SDK legacy catalog declarations do not match OpenCode 1.18.29 capabilities; discovery now uses the installed SDK's `v2` client/types matching the actual response, without a dependency/version change or OpenCode-v2 product claim. Model images/reasoning are advertised through their implemented paths. Missing price uses the numeric placeholders Pi requires plus an explicit unavailable label; metadata never proves billing/entitlement.
- 2.2: `src/stream.ts`, provider seam and context/stream/runtime tests. Generation-wide snapshot/delta state normalizes balanced text/thinking events, Unicode and repeated snapshots; cumulative per-assistant accounting is charged once across handoff segments. Length completion is mapped. Payload/response hooks wrap the owned backend HTTP request; scoped raw event observation works through the provider entry. A controlled partial-stream/disconnect test first timed out, exposing that actual runtime deltas use `message.part.delta`, absent from the legacy generated event union. Added its real transport handling; the test now observes partial output before intentionally severing inference and verifies balanced failure/one terminal event. The identified owned orphan PID 537611 from that failed probe was terminated by exact identity; unrelated port-5551 runtime was untouched. Temporary synthetic-only diagnostics were removed. No forced-exit result is claimed.
- 2.3: `src/context.ts`, relay validation and real provider-context test. Supported base64 PNG/JPEG/WebP/GIF inputs become backend attachments, image tool results retain their MCP data, and unsupported formats or text-only model image paths fail explicitly. The actual Pi/OpenCode/provider fixture verifies PNG input and PNG tool-result bytes. An initially invalid PNG fixture was replaced with a valid standard-library-generated PNG; product validation was not relaxed. No exhaustive image-format/provider qualification is claimed.
- 2.4: context cursor, seam and entry lifecycle invalidation. Compatible append reuses native backend session history; branches/restoration/incompatible system/tools/model rebuild role-labelled Pi-retained history, preserving tool IDs/results and omitting opaque signatures. Pi's post-return thinkingLevel annotation is excluded from cursor comparison because it does not alter retained semantics. Long retained tool records plus reported usage beyond the model's small context window produce no auxiliary compaction/pruning request; a later branch excludes discarded sentinels. A controlled backend-compaction event invalidates idle retained history and blocks unsafe continuation. Actual entry callbacks for tree/compaction/model transitions close obsolete owned state. Public Pi agent-loop integration is tested here; full released-loader testing remains Wave 3.
- 2.5: `src/failure.ts`, provider entry/seam and failure tests. Evidence-based access, rate-limit and context-overflow failures preserve prompt/selection and omit payloads/credentials. Real fixtures cover 401, 403, 429, context-overflow 400 and midstream disconnect with one request/no replay. Startup distinguishes missing executable, configuration and discovery stages. README documents supported paths, placeholders, replay/caching tradeoffs, recovery and limits. ADR status now records the completed minimal Wave 1 gate, without expanding its architecture.

Final checks: `yarn typecheck` passed in 2.63 seconds; ordinary `yarn test` passed 33/33 with normal exit in 26.87 seconds; strict OpenSpec validation passed. Candidate digest covers the same sorted package-relative maintained manifest/lock/source/test/README/ADR files as prior waves, including new modules/tests; source bundle includes Wave 1 checklist completion. No dependency acquisition, external inference, operator credential use, host patches, root activation, staging or Wave 2 commits occurred. Maximum maintained source file length is 360 lines. No owned runtime remains after checks. New source responsibilities are separated into catalog, transcript/image conversion, stream state and sanitized failure classification rather than enlarging the seam into a generic framework.

Next: first FULL whole-Wave-2 Oracle review under gate 2.6; zero rounds and zero rebuilds consumed.

## Round 1 - Oracle Review

Read-only run `13b2dc5c-e036-4381-8675-d3f7f568e62d` completed Wave 2 FULL gate 2.6, covering Orchestrator-owned tasks 2.1–2.5. It independently verified unchanged candidate/source and boundary, passed typecheck and 33/33 tests, and reproduced two P1 blockers with controlled probes. No project writes or external inference occurred.

W1-RETRY-001, in-scope structural recurrence: awaiting a supported async observer inside the sole event pump blocks retry/error supervision while MCP/HTTP work proceeds. Holding the initial observer for five seconds, then issuing a real tool and provider 503, produced requests=4, executions=2, successful stop. Source: provider-seam observer awaits precede retry retirement. SUGGESTED_CORRECTION: decouple critical event supervision from observer latency and preserve ordered async instrumentation without permitting obsolete execution.

W2-STREAM-001, P1/in scope: HTTP finalization reconciles only its last assistant and marks the turn done before earlier queued SSE contributions are processed. A delayed observer with PREAMBLE/tool/FINAL and two 10-input/5-output steps yielded only FINAL and 10/5 instead of both texts and 20/10. SUGGESTED_CORRECTION: deterministic request-owned whole-generation content/accounting reconciliation before final success/cursor publication, without changing request-level tool handoffs.

PROPOSED_REVIEW_ACTION=REBUILD

### Caller assessment and single bounded rebuild

Terminal review reconciled with no partial project writes. W1-RETRY-001: ACCEPT_BLOCKING under design decision 6/task 1.5 and Wave 2's regression boundary; retain historical root identity. W2-STREAM-001: ACCEPT_BLOCKING under task 2.2 and stream/accounting requirements. Both arise from coupling optional async observation to mandatory event processing and finalization. CORRECTION batch: process supervision/content events without awaiting observers; queue observation per generation in order; reconcile all request-owned assistant snapshots/accounting from the backend after its prompt completes; drain accepted observations before successful finalization, with cancellation remaining responsive. Add real slow-observer/503 and delayed two-step text/accounting regressions. No product-scope amendment or per-tool completion marker is introduced.

REVIEW_ACTION=REBUILD
CONSENSUS_STATUS=NEEDS_REVISION

Prior incremental worklist is retired. Re-derived baseline remains the full numbered Wave 2, including preservation of Wave 1 retirement guarantees. Orchestrator performs the complete correction batch directly; only the same final Oracle gate 2.6 is reused. This Wave 2 sequence has consumed one round and now its one rebuild, independent of earlier wave counters while preserving issue history.

BASELINE_TARGET=add-pi-opencode-bridge numbered Wave 2, tasks 2.1-2.5 and final gate 2.6
BASELINE_TARGET_REVISION=sha256:9d1143da526f9501082daa0a306ab784c838f77fd713f6751fb2fccd4b99614c
BASELINE_SOURCE=Canonical OpenSpec apply-context bundle sha256:6ad1af6e7b8a010334147c1ad7e3dcf757f9637af8dc48aaeb284542ed512300; approved architecture unchanged; completed Wave 1 source 4c30234; Orchestrator implementation with only oracle delegation
BASELINE_INCLUSION_PREDICATE=Connected catalog/refresh and metadata, incremental text/reasoning and nonduplicated accounting, supported image input/results, append-compatible backend context and labelled replay/invalidation, evidenced diagnostics, actual entry/Pi-loop controlled-runtime validation, and preservation of Wave 1 ownership/cancellation guarantees
BASELINE_EXCLUSIONS=Wave 3 packed/released-loader qualification, external model egress, OAuth/plugin qualification, remote publication/submodule registration, root activation/settings/dependencies and foreign work

BASELINE_REBUILD_COMPLETE=YES

### Rebuilt Wave 2 candidate and verification

CANDIDATE_REVISION=sha256:0c4157158a997caa4e1e214a6bec0bc6b9ecdd3cd9008069875b9c2f8b06d280
SOURCE_REVISION=sha256:6ad1af6e7b8a010334147c1ad7e3dcf757f9637af8dc48aaeb284542ed512300
SOURCE_CHANGED=NO
PRIOR_CORRECTION_WORKLIST_ACTIVE=NO

Complete batch implemented directly. The event reader now processes retirement/history-change events independently; accepted instrumentation is queued in generation order before its corresponding output normalization. Observers cannot block MCP retirement. Final success closes observation intake, drains accepted callbacks with abort responsiveness, then reads all persisted assistant messages belonging to the exact request ID, in creation order. This reconciles earlier steps and cumulative usage even when SSE content events are absent; previously charged usage is not duplicated. HTTP batch completion remains separate from Pi tool handoffs. Failure never publishes a retained cursor.

Added three real Pi/OpenCode regressions in `test/provider-observer.test.ts`: held observer plus tool/503 retires with requests=2/executions=1 while observer remains held; held observer plus two text/tool/usage steps preserves PREAMBLE+FINAL and total20/10; suppressing content/accounting SSE frames while retaining connection/supervision still reconciles both steps from persisted history. The observer case also checks balanced text events and success waiting for accepted callbacks. Controlled message-event suppression is restored after its test. README documents the resulting observation/completion boundary.

Validation: typecheck passed in2.63seconds; focused regressions passed3/3 with normal exit in7.02seconds; full ordinary suite passed36/36 with normal exit in30.03seconds; strict OpenSpec validation and package diff whitespace checks passed. No owned runtime remains; unrelated port5551 runtime preserved. Maximum maintained source size395physical lines. No dependencies, canonical requirements, staging or commits changed. Tasks2.1–2.6 remain unchecked pending caller gate acceptance.

Next: FULL verification of rebuilt Wave 2 through the same final task2.6, retaining all accepted issue history. One review round and the sequence's one rebuild are consumed.

## Round 2 - Oracle Review

Run `742fd2c0-9083-4e9f-b815-e3d7bef767f7` completed rebuilt FULL Wave 2 gate2.6, covering Orchestrator-owned tasks2.1–2.5 and the Wave1 regression boundary. Independent typecheck, ordinary36/36 tests (normal exit33.55seconds) and package whitespace checks passed. Candidate/source and four boundary fields matched before/after review. Oracle reports no project writes.

W1-RETRY-001 resolved in the tested rebuilt path: held-observer/503 finishes with requests2/executions1 before observer release. Existing W1-ABORT-001/W1-ISOLATION-001 regressions remain passing.

W2-STREAM-001 remains P1/in scope, same structural family after the single rebuild. A controlled probe suppressed only three first-assistant text/delta frames, preserved identities/supervision/later content, and allowed FINAL to normalize before backend completion. Result: requests2/executions1, successful stop, text FINAL then PREAMBLE, correct usage20/10. Persisted assistants are sorted in provider-seam.ts:260–270, but GenerationStream's insertion-ordered Map (stream.ts:15–21,40–56) appends newly discovered earlier parts after already-emitted later text; seam:354–358 publishes success and retains this misordered transcript. SUGGESTED_CORRECTION: establish authoritative content order when combining streamed and persisted parts, or fail without retaining a contaminated success when prior emission cannot be safely reconciled; add selective-first-step-loss coverage without losing incremental output or request-level handoffs.

PROPOSED_REVIEW_ACTION=HUMAN_DECISION

### Caller terminal reconciliation - human checkpoint

W1-RETRY-001 accepted correction is verified resolved for its reproduced observer-blocking path; prior abort/isolation evidence remains valid. W2-STREAM-001: ACCEPT_BLOCKING under tasks2.2/2.4 and the concrete retained-conversation correctness risk. Source inspection confirms insertion order cannot repair already-emitted FINAL when PREAMBLE is discovered later. This is the existing completeness family, not a new scope or issue identity. CORRECTION, pending explicit authorization: preserve authoritative order, or terminate without contaminated success/cursor when reconciliation cannot preserve it; cover the selective-loss case. No automatic remediation or new review sequence is authorized.

Parent recomputed candidate `0c4157158a997caa4e1e214a6bec0bc6b9ecdd3cd9008069875b9c2f8b06d280` and canonical source `6ad1af6e7b8a010334147c1ad7e3dcf757f9637af8dc48aaeb284542ed512300`, matching the latest recorded revisions. All four Wave2 boundary fields remain literally equal and apply unchanged. Terminal outcome is current, not stale. Two rounds and the one rebuild are consumed.

The first selective-loss probe failed only in its test filter and supplies no passing evidence. Parent verified exact owned PID649589/cwd `/tmp/pi-opencode-bridge-NhaRcA`; an initial cleanup command lacked Python pidfd support and changed nothing. SIGTERM did not exit; identity-rechecked SIGKILL ended only that owned process, then its exact directory was removed. Unrelated PID330255/port5551 was preserved. Oracle's corrected probe completed after cleanup confirmation and reported no remaining owned runtime.

REVIEW_ACTION=HUMAN_DECISION
CONSENSUS_STATUS=NEEDS_REVISION

Automatic iteration stops here. Wave2 tasks remain unchecked, no Wave2 acceptance commit is made, and Wave3 is blocked. Requested user decision: explicitly authorize a separate bounded correction/review sequence retaining this finding history, or leave the candidate paused. Only this reconciliation log changed after review; implementation and canonical artifacts are untouched.
