# Design

## Context

See `proposal.md` for motivation and scope. This is a greenfield package: no bridge source exists locally, and GitHub returned 404 for the proposed repository. The root toolset currently exports only Whimsical Activity and has separate bookmark and subscription-usage submodules. Existing ADRs 0001-0003 govern activity/speech, not inference providers, and require no amendments.

The consumers are local, operator-installed Pi sessions and their configured OpenCode providers. The bridge handles prompts, credentials indirectly, and tool operations with real filesystem effects. Loopback binding, preserving user configuration, excluding unrelated execution, and accurate tool ownership address those concrete boundaries; there is no public multi-user service or hostile-client protocol in scope.

### Observed evidence and qualification boundary

- The installed OpenCode executable reports `1.18.29`. Its source tag resolves to `16747470f976aca3d362ad730bcd3fe82ecc2c9a` in `anomalyco/opencode`.
- That revision's `packages/sdk/js/src/v2/gen/types.gen.ts` defines provider discovery with `all`, `connected`, and `default`. Its session prompt input accepts user text/file/agent/subtask parts, not an arbitrary Pi conversation with assistant and tool-result roles. The `v2` SDK directory name does not establish support for the separately advertised OpenCode v2 product.
- That revision's `packages/opencode/src/config/config.ts` merges process-provided configuration after other sources and discovers directory-local plugins/agents. A child process alone is not configuration isolation.
- Earlier Pi evidence and static dependency review used 0.99.2. The user subsequently selected the latest published Pi release: official npm metadata reports both `@earendil-works/pi-coding-agent` and `@earendil-works/pi-ai` at 1.0.4, requiring Node >=22.19.0. Refresh dependency/API evidence against these exact released artifacts before acquisition/execution. Root development packages remain 0.87.1 and are not the bridge's runtime qualification environment.
- Claude bridge revision `5fb69c49e1548add3686dfeecd1a040001622e6d` demonstrates provider/delegation separation and disabling native tools in favor of Pi MCP tools. It is architectural evidence, not code to copy or a compatibility guarantee.

Primary references:

- https://opencode.ai/docs/server/
- https://opencode.ai/docs/sdk/
- https://github.com/anomalyco/opencode/tree/16747470f976aca3d362ad730bcd3fe82ecc2c9a/packages/opencode/src/config
- https://github.com/anomalyco/opencode/blob/16747470f976aca3d362ad730bcd3fe82ecc2c9a/packages/sdk/js/src/v2/gen/types.gen.ts
- `host/pi/packages/coding-agent/docs/custom-provider.md`
- `host/pi/packages/coding-agent/src/core/extensions/types.ts`
- https://github.com/ZenStudioLab/pi-claude-bridge/tree/5fb69c49e1548add3686dfeecd1a040001622e6d

Latest-release metadata: https://registry.npmjs.org/@earendil-works%2fpi-coding-agent/1.0.4 and https://registry.npmjs.org/@earendil-works%2fpi-ai/1.0.4. Earlier local Pi documentation is background evidence, not proof of the new release's API contract.

These are source-level observations only. The first qualification target is released, unpatched Pi 1.0.4 with OpenCode 1.18.29, replacing the earlier proposed Pi 0.99.2 target at the user's request. Pin the exact 1.0.4 qualification/development packages rather than a floating latest tag; do not upgrade the global Pi CLI or root toolset dependencies. Older Pi releases and OpenCode v2 are not promised. Refresh the Pi-specific static review and obtain acquisition/execution approval for the updated pin set; no runtime compatibility is established by the version change.

## Goals / Non-Goals

**Goals:**

- Keep a single authority for actual tool execution: Pi's existing agent loop, hooks, and tool-result handling.
- Adapt the OpenCode session protocol with a small managed-runtime, catalog, stream, tool-relay, and context boundary rather than a generic bridge framework.
- Keep user-owned authentication/configuration files unchanged and distinguish model metadata from actual provider entitlement.
- Make cancellation and context changes explicit so a stale backend session cannot continue work against a different Pi conversation.

**Non-Goals:**

- Delegated autonomous OpenCode work, OpenCode TUI control, remote-server attachment, persistent credential copying, automatic CLI/plugin installation, or provider failover.
- Root toolset activation, host patches, publishing an npm release, copying the Claude bridge, exhaustive qualification of every externally billed model, or importing every OpenCode agent/plugin/command.

## Decisions

### 1. Independent package, repository-local submodule checkout

The source repository is `ZenStudioLab/pi-opencode-bridge`, with SSH remote `git@github.com:ZenStudioLab/pi-opencode-bridge.git`. Its working checkout and eventual gitlink live at `extensions/pi-opencode-bridge/`. Source, package-specific tests, lockfile, and package ADR belong inside that standalone repository. The current OpenSpec bundle and its proposal review remain owned by the toolset; do not create a second implementation plan in the new repository.

Use a TypeScript ESM Pi package with its own extension entry and reviewed, pinned dependencies. Select exact SDK/MCP versions through static manifest/source review against the qualification pair, then commit its lockfile. Package commands execute in the standalone workspace, not through the toolset's 0.87.1 dependencies. Use yarn unless the selected package tooling demonstrably requires another manager.

The root toolset adds only the submodule entry/gitlink and a concise storage note after the standalone candidate is qualified. Leave root exports, dependencies, scripts, and Pi settings unchanged. Create no public release; if repository visibility is not already specified by organization policy, use a private initial repository rather than assuming public publication. Verify access before remote creation/push and preserve the existing staged submodules and foreign work.

Alternative: an in-tree extension would couple lifecycle/dependencies to this package; the user explicitly selected standalone plus submodule. A shared Claude/OpenCode abstraction has only a hypothetical consumer and is excluded.

### 2. Dedicated owned runtime, discovered catalog before provider selection

An explicitly loaded asynchronous extension starts one owned OpenCode server bound to `127.0.0.1` on an available port, establishes the client and MCP endpoint, and reads the catalog before publishing provider models. Catalog startup makes no inference request. A missing executable or startup failure is reported without installing software or changing another provider.

Keep the server while this loaded extension needs it. Abort active work and stop only the owned child and its MCP endpoint on unload/reload or Pi shutdown. Do not attach to or terminate an unrelated OpenCode process. Startup cleanup covers partial initialization. No automatic replay follows server failure.

Register the Pi provider as `opencode-bridge`. Maintain a lookup from each stable Pi model ID to the complete OpenCode `(providerID, modelID)` pair; never recover the pair by ambiguous string splitting. Intersect the reported provider catalog with `connected`, then include models with text chat and tool-call capability. Translate reported reasoning, image-input, context/output limits, token pricing, and other applicable metadata without inventing unsupported capabilities. The catalog is metadata, not proof of subscription entitlement.

Refresh replaces the provider-owned catalog without modifying Pi settings; a model removed from the catalog cannot silently redirect to a different one. Retain the selected pair on ordinary refresh. A failed refresh must not create a fabricated empty-success catalog or discard the last valid catalog without an explicit unavailable state.

Alternative: attaching to a shared server would mix bridge-specific MCP registration/configuration with normal OpenCode work and complicate ownership.

### 3. Selective configuration inheritance, not a blanket overlay

Use an owned runtime working directory and process-only configuration. Derive the provider/authentication subset from OpenCode's supported configuration/auth sources, preserving provider settings, model filters, environment references, and operator-managed authentication integrations needed by those providers. Leave authentication under OpenCode's control; do not rewrite or persist its keys in Pi. The user approved reading necessary provider/authentication material into memory and supplying it only to the owned child environment via supported process inputs such as `OPENCODE_AUTH_CONTENT`. Isolate HOME/XDG configuration and runtime data to owned temporary paths; never persist authentication copies there, in Pi's credential store, or in diagnostics. Read user-owned source files without rewriting them, resolve only references needed by the retained provider subset, and discard the in-memory snapshot when the runtime is closed. This permits ephemeral child-process transfer, not blanket credential/configuration export or execution of unrelated plugins. Required OAuth refresh/plugin integrations still need separate behavioral qualification and an explicit limitation when they cannot meet the no-user-file-write boundary.

Exclude project-discovered agents, commands, skills, instructions, and unrelated MCP endpoints from bridge inference. Use a dedicated minimal bridge agent with Pi's current system instructions; disable native OpenCode filesystem/shell/delegation tools and permit only the current Pi MCP tools. Retain an operator-managed plugin only when it is necessary for provider/authentication integration; do not auto-install or execute newly discovered plugin code to make configuration load.

Because arrays/maps merge and plugin discovery can happen before the inline override, the implementation must verify the effective configuration and actual allowed tool list against the pinned runtime. Merely setting an empty MCP map or spawning in another directory is not sufficient. The first slice tests inherited MCP/plugin/prompt entries with harmless sentinel configuration while preserving a representative configured provider. If supported flags/API configuration cannot meet this boundary, stop for a design decision; do not silently drop needed authentication or allow extra tools.

Set `OPENCODE_DISABLE_AUTOCOMPACT` and `OPENCODE_DISABLE_PRUNE` in the owned child process and verify their effective behavior, not just their presence. Create backend sessions with an explicit non-default title; pinned `session/prompt.ts:193-235` skips title inference for such sessions. The first real-runtime slice must observe no auxiliary title/model requests and no autonomous history transformations. These are supported-source controls to qualify, not a claim that flags alone prove isolation.

Do not print or persist raw provider discovery responses, which can include key/options fields. Keep only whitelisted model metadata and operational diagnostics; prompts, tool payloads, and credentials are not default logs.

### 4. MCP is the execution handoff, not a second tool executor

Expose the current Pi tool declarations through an owned loopback MCP endpoint. The bridge never directly invokes the tool's implementation from its MCP callback. An actual MCP request creates a pending handoff with a unique bridge-generated Pi tool-call ID and an MCP response promise. Emit the corresponding Pi assistant tool call and finish that Pi provider segment with the tool-use stop reason. Pi then executes it through its ordinary loop. On the next provider invocation, match Pi tool results to pending handoffs, resolve the matching MCP promises, and continue consuming the same OpenCode request.

```text
OpenCode model --> MCP request --> pending bridge handoff
                                      |
                                      v
                              Pi assistant tool call
                                      |
                                      v
                              Pi loop executes tool
                                      |
                                      v
Pi tool result --> matching pending promise --> OpenCode continues
```

Use the pending MCP request as execution authority. OpenCode's observational tool-part events alone must not cause side effects or create a second Pi invocation. Unknown/native tool names cannot enter Pi's tool loop. A captured immutable tool snapshot belongs to the current handoff. Preserve structured arguments, failed tool outcomes, and supported result content, including image results when the selected model supports them; never turn a failed result into success.

Each accepted MCP request defines exactly one Pi provider handoff segment. Parallel/identical backend calls retain distinct request identities but execute serially through separate Pi assistant/tool-result segments. After Pi returns the emitted call's result, resolve only that MCP promise and emit the next queued request from the same backend generation. Never wait for whole-model-batch completion or use a timing debounce: pinned OpenCode/AI SDK completion is delayed until tool results arrive. This user-approved tradeoff loses parallel execution and cannot support tools requiring concurrent sibling execution; document that limitation. Preserve accounting across the split segments without double-counting backend usage. Serialize unrelated inference requests within the bridge instance; tool-result continuation of the active request bypasses that queue. Cancellation settles all pending requests and prevents late events/results from restarting execution.

This relay is a proposed implementation mechanism, not runtime-verified behavior. A passing real one-tool and multi-tool handoff is the first implementation go/no-go gate. The user approved single-request segmentation after the pinned public-event/source investigation found no usable pre-result whole-batch boundary. Qualify this request-level mechanism through the real Pi loop before expansion; do not introduce direct tool execution or an AskOpenCode fallback.

### 5. Pi context is authoritative; OpenCode sessions are replaceable

Reuse a backend session only for append-compatible Pi context under the same model pair, system instructions, and tool snapshot. Continuing a pending tool call delivers its result to that request rather than issuing a new user prompt.

The prompt endpoint does not import arbitrary assistant/tool roles. For a new backend session, send Pi's system prompt separately and serialize the retained conversation into explicitly role-labelled context, with current user input clearly separated and supported images represented as attachments. Do not pretend this is an exact native-role import or carry opaque provider-specific reasoning signatures between providers. Retain a bounded context cursor to recognize compatible append-only turns.

Branching, Pi-owned compaction, restored sessions, changed system/tools/model, or incompatible cursor state aborts pending work and starts a fresh backend session from the authoritative retained Pi context. Reject late events from the replaced session. Backend automatic compaction/pruning is disabled; evidenced overflow returns to Pi's existing recovery owner rather than silently substituting an OpenCode summary or clearing retained tool output. An unexpected backend history transformation invalidates the cursor and stops the affected request instead of being treated as compatible continuation. Tests include forced overflow and long retained tool history, alongside continued conversations and representative Pi branch/compaction/provider-switch paths; no persistent cross-runtime synchronization service is needed.

Alternative: letting OpenCode history remain authoritative would lose Pi branch/compaction semantics. Fresh sessions on every tool result would lose the outstanding MCP request and deadlock the relay.

### 6. Normalize streams, failures, and accounting at one boundary

Translate text and reported reasoning deltas, reported usage, completion, context overflow, and cancellation to Pi's public provider event contract, including balanced content events and exactly one terminal outcome per segment. Honor Pi's documented request instrumentation and abort options. Handle OpenCode snapshot-versus-delta events without duplicated content.

Distinguish missing executable/startup failure, empty connected catalog, authentication/entitlement failure, provider rate limit, context overflow, server termination, and malformed stream only when evidence supports the classification. Preserve the prompt and selected model; never fall back to another provider or replay a possibly effectful tool call automatically. Missing token/cost data must be documented as unavailable rather than marketed as free inference. Suppress auxiliary title inference rather than hiding its requests or charges in ordinary response accounting.

Pi owns recovery, but OpenCode also has a native session retry controller: pinned `session/processor.ts:641-688` wraps the provider stream in `SessionRetry.policy`. Setting the model SDK's `maxRetries` alone does not disable that controller. Disable native session retry through a supported public control if available; otherwise intercept its retry transition and abort/retire the affected backend generation before another MCP request can reach Pi execution. After any accepted tool handoff, a retryable provider failure must settle pending handoffs, reject further callbacks from that failed generation, and surface a non-retryable effectful-turn outcome to Pi, so Pi's own transport retry cannot resurrect it. A later user-directed request may use a fresh session with the authoritative retained Pi context, but it must not automatically replay an old invocation.

Wave 1 must inject a transient provider failure/disconnect after a real Pi tool result while the OpenCode server remains healthy, then observe no repeated execution, no resumed obsolete generation, settled handoffs, and safe subsequent Pi-owned recovery. If the pinned public APIs cannot enforce the retry boundary before another execution, the existing go/no-go gate fails; stop for an owning-artifact amendment rather than patching OpenCode/Pi or bypassing Pi's tool loop.

### 7. Prove the smallest seam, then expand in focus-mode waves

Before broad feature work, use the real installed OpenCode runtime and released Pi loader against a deterministic local model-server fixture. The fixture controls model responses only; observations must come from the actual bridge, Pi tool loop, and OpenCode/MCP request. Demonstrate text, one tool round trip, two identical/parallel calls with distinct results, cancellation while waiting, and effective configuration isolation. No paid model calls are needed for this gate.

Only after that gate passes should the worker expand streaming, catalog metadata, context reset, and standalone packaging. The later representative live smoke target is the user-selected OpenCode Zen Muse Spark 1.3 Contributor Free (`opencode/muse-spark-1.3-contributor-free`). Official Zen pricing and its public model catalog currently list this free variant; verify the exact connected pair, current availability/pricing and applicable data-handling terms at execution time. Request explicit approval for prompt egress before the live check even if inference remains free; no paid-model substitution is permitted. Wave 1 still uses only the deterministic local fixture. A few representative runs do not qualify every catalog entry.

The user's latest routing instruction selects orchestrator-led execution with only `oracle` delegation allowed. Orchestrator directly performs investigation, implementation and validation as well as specifications, ADR, reconciliation, task completion and repository integration. Focus mode does not restore worker delegation. Oracle provides one completed-wave independent advisory review gate; the caller retains all authoritative decisions. Each gate follows the selected bounded review cadence; no per-task Oracle gates or other lanes are permitted.

### 8. Follow-up: preserve Pi tool names at the qualified Muse inference boundary

Subsequent approved live experiments identified Muse's HTTP403 as `FreeTierError`, not an authentication loss. The same Pi-backed bash/read handlers failed with MCP-prefixed upstream names and succeeded with original `bash`/`read` names; Pi performed exactly one synthetic read and received `pong`. Native-prompt and message-ID changes were unnecessary. This is empirical compatibility evidence, not a complete description or guarantee of the vendor's private gate.

Add a small owned loopback adapter only for the `opencode/muse-spark-1.3-contributor-free` Responses route. OpenCode still owns provider authentication and request construction; its selected provider's configured base URL (or its pinned default) becomes the adapter's fixed upstream. Preserve configured headers/authentication in transit without logging or persisting them. Route other models and explicitly overridden non-Responses SDKs as before; do not claim Chat Completions/Anthropic or general-provider alias qualification from this slice. No host patch, new dependency, plugin loading or automatic provider switch is needed.

Build an immutable name map from the current actual Pi tools: `pi_<name>` to `<name>`. Rewrite only declared function names, explicit function tool choice and retained function-call names on outgoing Responses requests. Restore the matching streamed or complete function-call names before OpenCode receives them. Preserve IDs, argument strings, text/reasoning, tool-result content and accounting. Never inject a fake bash tool or broaden Pi's tool declarations to satisfy a provider gate. Tool-less/restricted-tool requests can still receive a provider restriction and must report it accurately.

Keep the adapter's lifecycle inside the existing seam: startup failure, cancellation, runtime retirement and close must close/abort owned forwarding resources, without touching unrelated servers. Forward events incrementally with proper SSE framing and UTF-8 handling; do not buffer whole successful responses until completion. HTTP failures are not rewritten into success and transport failures must not trigger a second inference. The adapter is an operator-local, fixed-upstream transport, not a general proxy or public multi-user service.

The working prototype added a loopback hop rather than enabling an OpenCode plugin or native tool aliases inside its registry. Retain that responsibility boundary for this focused fix: replacing the existing MCP handoff or enabling native tools would reopen previously qualified execution guarantees. Pi's system instructions, existing message IDs, tool executor and one-MCP-request-per-segment behavior stay unchanged. Add specific tests of the new name/stream boundary and a released-loader alias round trip, then perform the existing independent completed-wave review before publication/integration.

### 9. Follow-up: default to the tested free Muse catalog

The user requested making the successful Zen/Muse whitelist launch setting the extension default. Seed the in-memory selective configuration with `enabled_providers: ["opencode"]` and `provider.opencode.whitelist: ["muse-spark-1.3-contributor-free"]` before merging ordinary configuration sources. Explicit operator values retain existing precedence; provider endpoints, credentials and unrelated fields are not replaced. This fixed default is not a dynamic price filter or a billing guarantee. It changes only bridge discovery, not Pi-native providers or user-owned OpenCode files. Verify the default and explicit overrides plus exclusion of a synthetic paid Zen model through the released packed loader; no live inference is necessary.

### 10. Expand the default free-model selection

The subsequent user request adds several free models to the fixed default whitelist: keep Muse Spark1.3 Contributor Free and add `mimo-v2.5-free`, `nemotron-3.5-lightning-free`, `ling-3.0-flash-fin-free` and `big-pickle`. All five are present in the current official Zen model catalog, listed Free in its pricing table, and eligible with explicitly zero pricing in pinned OpenCode1.18.29 discovery. Newer free listings absent from that pinned catalog are not added. Retain the same explicit-config precedence and paid-model exclusion. This changes discovery only; do not broaden the Muse-only Responses adapter, promise successful inference on untested models, or issue new external inference. Document the free-tier data-use limits and verify all additions through the packed loader without inference.

## Risks / Trade-offs

- Two session runtimes can deadlock at tool handoff. Mitigation: the real single-request handoff gate precedes expansion; abort pending requests together and reject concurrent-sibling tool requirements. The request itself, not backend step completion, is the segment boundary.
- Configuration inheritance may run unrelated tools/plugins or change prompts. Mitigation: process-local selective inheritance plus observed sentinel checks, with no writes to user configuration and no blanket credential/plugin copying.
- Role-labelled replay can change model interpretation and caching. Mitigation: preserve role/tool semantics explicitly, test retained-context transitions, and qualify behavior rather than claiming native-history equivalence.
- API drift can break event translation. Mitigation: pin dependencies, qualify the exact initial runtime pair, and add another version only with new evidence.
- Catalog discovery does not prove model entitlement or billing. Mitigation: expose accurate metadata, propagate provider failures, and document qualification separately from discovery.
- A server per Pi instance adds startup/process overhead. Mitigation: one owned runtime per loaded bridge instance, catalog-only startup, and ownership-bounded shutdown; no shared daemon machinery.

## Migration Plan

This adds an opt-in package, not a migration of existing extensions. During apply, first prepare the standalone repository/ADR, pass the real relay/configuration gate, implement and qualify the package, then commit its source and register the reviewed commit as the toolset submodule. The initial private remote is storage, not permission for an npm release. Existing root exports and Pi settings stay unchanged.

Users load/install the standalone Pi package explicitly after qualification; dependency installation and any newly discovered code execution follow the applicable static-review/approval boundary. Removing its explicit loading declaration restores use of other Pi providers; unloading stops only the bridge-owned runtime. There is no automatic installation or configuration rewrite to roll back.

## ADR Assessment

A new ADR is warranted because a provider built over another agent runtime establishes tool-execution authority, credential ownership, and cross-repository lifecycle boundaries. Existing root ADRs need no amendments. The first pending apply task is Orchestrator-owned creation of `extensions/pi-opencode-bridge/docs/adr/0001-pi-owned-opencode-provider.md`, before implementation code. Its status must acknowledge that the handoff mechanism remains unqualified until Wave 1 passes. No standalone ADR is written during this proposal workflow.
