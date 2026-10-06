# Spec Delta

## Purpose

Allow Pi users to select models configured in OpenCode through an independently distributed provider package while retaining Pi-owned tool execution, conversation control, and explicit runtime ownership.

## ADDED Requirements

### Requirement: Standalone opt-in package and pinned storage

The bridge SHALL be an independently loadable Pi package owned by the `ZenStudioLab/pi-opencode-bridge` repository and stored in `pi-toolset` at `extensions/pi-opencode-bridge/` as a commit-pinned Git submodule. Storing the package SHALL NOT enable it, add it to the root toolset's published extension exports, change root runtime dependencies, or modify Pi loading settings. The package SHALL provide provider mode only, without an OpenCode delegation tool.

#### Scenario: Store a reviewed package revision

- **WHEN** the standalone package is attached to the toolset
- **THEN** the submodule records its SSH repository URL and reviewed commit
- **AND** the root toolset's exports, runtime dependencies, and Pi loading settings remain unchanged

#### Scenario: Explicitly load the standalone package

- **WHEN** the user explicitly loads the installed standalone package in a supported Pi runtime
- **THEN** its provider integration is available independently of the toolset's activity or speech extensions
- **AND** no OpenCode delegation tool is registered

### Requirement: Discover connected tool-capable chat models

The provider SHALL discover models from all connected OpenCode providers within the operator's existing enabled/disabled-provider and model filters, without injecting a fixed whitelist or changing user-owned OpenCode files. It SHALL expose eligible text-chat/tool models whose raw model ID or display name contains `free` case-insensitively, unless a saved explicit visibility choice overrides that default. The provider's display name alone SHALL NOT trigger matching. Saved explicit choices SHALL also allow enabling other eligible provider/model pairs. It SHALL retain distinct OpenCode provider/model identities and translate applicable reported capabilities and limits without inventing metadata. Disconnected providers and models without those capabilities SHALL be excluded. Discovery SHALL NOT imply that every listed model has been runtime-qualified or is entitled under a subscription.

#### Scenario: Automatic free-name discovery

- **WHEN** discovery reports eligible models without saved visibility choices
- **THEN** models whose ID or raw display name contains `free` are shown across connected providers
- **AND** nonmatching models remain available in bridge settings but hidden from Pi's model list
- **AND** existing endpoint/authentication settings and Pi-native providers remain unchanged
- **AND** reported pricing is not replaced or treated as a billing guarantee based on the name

#### Scenario: Mixed provider catalog

- **WHEN** OpenCode reports connected and disconnected providers, including tool-capable chat and non-tool-capable models
- **THEN** Pi lists exactly the eligible models enabled by automatic or saved visibility choices from connected providers
- **AND** discovery does not issue inference requests

#### Scenario: Identical model names from different providers

- **WHEN** two connected providers report the same enabled model ID or display name
- **THEN** Pi exposes distinct selectable identities that route to the original provider/model pair

#### Scenario: Refresh removes the selected model

- **WHEN** a successful catalog refresh no longer reports the selected pair as eligible
- **THEN** a subsequent request reports that pair as unavailable rather than silently using another model

#### Scenario: Catalog refresh fails

- **WHEN** discovery fails after a valid catalog has been loaded
- **THEN** the failure is reported without replacing the catalog with a fabricated successful empty response or changing the user's selection

### Requirement: Global configurable model visibility

The extension SHALL provide a registered `opencode-settings` command using Pi-owned dialogs to toggle eligible models by provider, show reported pricing or its absence, save or cancel changes, and reset to automatic defaults. Explicit choices SHALL be stored outside conversation state in `<Pi agent directory>/opencode-bridge.json`, shared across projects. This file SHALL contain only model identities and visibility booleans, not credentials or prompts. Saving SHALL update the current catalog without selecting a different model or issuing inference. Other sessions SHALL read changes on startup or refresh. Malformed/unreadable preferences and failed saves SHALL be reported without silently replacing previous preferences or a valid catalog.

#### Scenario: Persist an exclusion and enable an additional model

- **WHEN** the user unchecks a default-enabled model and checks another connected provider's model, then saves
- **THEN** both explicit choices survive restart, project changes and catalog refresh
- **AND** a newly discovered matching model without an override is enabled automatically
- **AND** saved choices for temporarily unavailable models remain retained

#### Scenario: Cancel or fail to save settings

- **WHEN** the user cancels, or saving cannot complete
- **THEN** no partial preferences document replaces the prior saved settings
- **AND** draft choices do not replace the current valid catalog

#### Scenario: Additional provider or model is not eligible

- **WHEN** a requested provider/model is disconnected, unsupported or excluded by explicit OpenCode filters
- **THEN** settings do not fabricate model metadata, enable authentication integrations or override those filters
- **AND** documentation directs the user to configure/authenticate it in OpenCode and refresh

### Requirement: Own a dedicated local runtime

An explicitly loaded bridge SHALL launch and manage a dedicated local OpenCode server and its tool-relay endpoint, bound to loopback. It SHALL use the existing installed executable without automatic installation, and SHALL NOT attach to, reconfigure, or terminate an unrelated OpenCode server. Shutdown, unload/reload, or partial startup failure SHALL release the runtime resources owned by that bridge instance.

#### Scenario: Existing OpenCode server

- **WHEN** an unrelated OpenCode server is already running and the bridge loads
- **THEN** the bridge establishes its own runtime on an available loopback port and leaves the existing server unchanged

#### Scenario: Missing executable or partial startup

- **WHEN** the OpenCode executable is unavailable or bridge initialization fails partway through
- **THEN** the user receives a concrete startup diagnostic, already-created owned resources are released, and no software is installed automatically

#### Scenario: Bridge unloads

- **WHEN** Pi unloads or reloads the bridge or shuts down
- **THEN** outstanding bridge inference is stopped and only the bridge-owned child and relay endpoint are closed

### Requirement: Preserve authentication and configuration ownership

The bridge SHALL reuse OpenCode's configured provider/authentication access without writing user-owned authentication, environment, or configuration files, or copying credentials into Pi's credential store. Bridge inference SHALL use Pi's system instructions and current tool declarations, not unrelated OpenCode project agents, commands, instructions, native execution tools, or MCP endpoints. Necessary provider/authentication material MAY be read into memory and supplied only to the owned child environment through supported process inputs. Authentication copies SHALL NOT be persisted to disk or Pi's credential store, and raw authentication material SHALL NOT appear in diagnostics. The child's configuration/runtime data SHALL use owned temporary paths without rewriting user-owned sources. Necessary operator-managed provider/authentication integrations SHALL remain usable; the bridge SHALL NOT automatically install or execute newly discovered plugins to enable them.

#### Scenario: Existing provider authentication

- **WHEN** the user has an already-configured OpenCode provider supported by the bridge
- **THEN** the bridge can request that provider without a second Pi credential copy or changes to the user's OpenCode files

#### Scenario: Isolated child retains API authentication

- **WHEN** the bridge retains a configured provider's API authentication in the owned child environment
- **THEN** OpenCode uses that authentication for the selected provider without importing unrelated execution configuration
- **AND** no authentication copy is written to the child's temporary data directory, Pi's credential store, user-owned files, or diagnostics

#### Scenario: Unrelated project configuration

- **WHEN** the user's ordinary OpenCode project declares a custom agent prompt, native tools, and an unrelated MCP endpoint
- **THEN** bridge inference uses Pi's supplied instructions and tools without importing those execution surfaces

#### Scenario: Required authentication integration cannot be retained

- **WHEN** the bridge cannot retain a necessary provider/authentication integration while meeting its execution boundary
- **THEN** it reports that integration limitation without silently dropping authentication, enabling unrelated tools, or installing additional code

### Requirement: Execute tool calls exclusively through Pi

Every model-requested execution accepted by the bridge SHALL correspond to a currently declared Pi tool and SHALL execute through Pi's ordinary tool loop and applicable hooks. Observational backend tool events SHALL NOT independently execute a tool. Calls SHALL preserve valid structured arguments, distinct invocation identity, and the corresponding success or failure result returned to OpenCode. Unknown or native OpenCode tools SHALL NOT become Pi executions. Each accepted MCP request SHALL produce one Pi handoff segment; backend-parallel calls SHALL be serialized through distinct Pi segments without waiting for a whole-model-batch completion marker. Tools requiring concurrent sibling execution are unsupported and this limitation SHALL be documented.

#### Scenario: One tool round trip

- **WHEN** the backend requests a declared Pi tool
- **THEN** Pi receives the assistant tool call, runs its normal tool lifecycle exactly once, and its result resumes the same backend request

#### Scenario: Parallel calls with identical arguments

- **WHEN** the backend issues two tool calls with identical names and arguments in one response
- **THEN** Pi receives two distinct invocation identities in successive handoff segments and executes each once, serially
- **AND** each backend call receives its own corresponding result without waiting for the backend's whole-batch completion
- **AND** no timing debounce or known fixture call count determines a handoff boundary

#### Scenario: Tool execution fails

- **WHEN** a Pi tool returns a failure or is rejected by Pi's tool lifecycle
- **THEN** the matching backend invocation receives the failed outcome rather than a synthesized successful result

#### Scenario: Backend reports an undeclared tool

- **WHEN** the backend reports or attempts an undeclared or native tool
- **THEN** the bridge does not dispatch that tool into Pi or execute it directly

### Requirement: Preserve Pi tool names on the qualified Muse Responses route

For the qualified OpenCode Zen Muse Spark 1.3 Contributor Free Responses route, the bridge SHALL expose the original names of currently declared Pi tools to the upstream model and restore the corresponding MCP names before OpenCode handles returned calls. It SHALL preserve invocation IDs, arguments, results, retained call history, streaming and accounting. The adapter SHALL use only a fixed configured upstream and owned loopback resources, retain authentication only in memory/in transit, and share cancellation/startup/shutdown ownership with the provider seam. Other model routes and explicitly overridden non-Responses provider SDKs SHALL retain their existing behavior. It SHALL NOT invent tools, enable native tool execution, replace Pi's instructions, change providers or automatically replay failed work.

#### Scenario: Aliased tool round trip

- **WHEN** Muse requests a declared Pi tool using its original name
- **THEN** the returned name maps to the existing MCP handoff and Pi executes that tool through its normal loop and hooks
- **AND** subsequent upstream history retains the original name with unchanged call IDs and results

#### Scenario: Fragmented provider response

- **WHEN** Responses SSE events are split across transport chunks or contain text resembling tool names
- **THEN** only matching function-call name fields are rewritten as complete events become available
- **AND** text, argument strings, ordering and UTF-8 content remain intact without waiting for the entire response

#### Scenario: No tool may be invented

- **WHEN** Pi's current declarations do not include a tool expected by the external free-tier policy
- **THEN** the bridge does not manufacture that tool or invoke a native implementation
- **AND** an evidenced `FreeTierError` is reported as a provider client restriction, not mislabeled as missing authentication

#### Scenario: Cancel or close the forwarding boundary

- **WHEN** an aliased request is cancelled, the owned runtime is retired, or startup fails
- **THEN** its forwarding requests and listening endpoint are settled or released with the existing seam
- **AND** no failed request is automatically resent or unrelated process terminated

### Requirement: Normalize provider streaming and metadata

The bridge SHALL translate backend text, reported reasoning, completion, usage, and tool handoffs into Pi's public provider event contract with balanced content events and exactly one terminal outcome per provider segment. It SHALL honor Pi's request instrumentation and supplied abort signal. Snapshot updates SHALL NOT duplicate already emitted deltas. Capabilities SHALL be advertised only when the bridge supports their complete input/result path; absent usage or pricing SHALL NOT be represented to users as verified zero cost.

#### Scenario: Text snapshots and deltas overlap

- **WHEN** OpenCode delivers text deltas followed by a snapshot containing that same text
- **THEN** Pi displays each text fragment once and receives one terminal outcome for the segment

#### Scenario: Reported reasoning and usage

- **WHEN** the selected model reports reasoning content and token usage
- **THEN** Pi receives the supported reasoning stream and reported usage without duplicated accounting across tool handoff segments

#### Scenario: Supported image input or tool result

- **WHEN** an exposed model advertises supported image input and receives a Pi image attachment or image tool result
- **THEN** the bridge preserves the supported image content through the backend request/result path
- **AND** an unsupported image path produces an explicit limitation rather than silent content loss

### Requirement: Cancel backend work and pending tools

Cancellation SHALL abort the matching backend inference and settle its pending tool handoffs. Late events or results from cancelled/replaced work SHALL NOT emit a new successful completion, restart inference, or trigger another tool execution. Cancellation SHALL NOT terminate unrelated OpenCode processes or independent Pi requests.

#### Scenario: Cancel while waiting for a tool result

- **WHEN** the user cancels while the backend is awaiting a Pi tool result
- **THEN** that request terminates as aborted, its pending backend handoffs are released, and no late result restarts it

#### Scenario: Late backend event

- **WHEN** a cancelled request later produces a stream event
- **THEN** the bridge discards it from the active Pi conversation

### Requirement: Keep Pi context authoritative

The bridge SHALL preserve Pi's current system instructions and retained conversation semantics when starting or continuing backend sessions. A backend session SHALL be reused only for compatible append-only context under the same model, system instructions, and current tool declarations. Branching, compaction, restored context, or incompatible changes SHALL stop obsolete work and rebuild backend context from Pi's retained conversation rather than continue hidden backend history. Replay SHALL preserve user/assistant roles, tool-call/result associations, and supported attachments without claiming exact native-role import.

#### Scenario: Compatible next user turn

- **WHEN** Pi appends a user turn after a completed backend response with unchanged system, model, and tools
- **THEN** backend continuation preserves the existing conversation without replaying already-executed tools

#### Scenario: Branch or compact the conversation

- **WHEN** Pi branches or compacts away part of the previous context
- **THEN** subsequent inference uses only the retained Pi context and does not continue discarded backend history

#### Scenario: Switch provider or change tool declarations

- **WHEN** Pi returns to the bridge with incompatible context or changes the selected model, system instructions, or tool declarations
- **THEN** obsolete backend work is stopped and a new backend context reflects the current Pi state

### Requirement: Preserve actionable failures without silent fallback

The bridge SHALL report startup, catalog, authentication/entitlement, rate-limit, context-overflow, backend-termination, and stream errors according to available evidence, preserving the user's prompt and model selection. It SHALL NOT automatically change providers or replay a tool operation after an ambiguous failure. Default diagnostics SHALL exclude credentials and complete prompt/tool/provider payloads. Compatibility documentation SHALL distinguish the tested runtime pair and representative model checks from unqualified catalog entries and versions.

#### Scenario: Connected model lacks entitlement

- **WHEN** a discovered model rejects the request because provider access is unavailable
- **THEN** Pi reports the evidenced provider failure without claiming entitlement from catalog discovery or selecting another model

#### Scenario: Server fails after a tool operation

- **WHEN** the backend connection fails after a tool may have executed
- **THEN** the request reports failure and does not automatically replay that operation

#### Scenario: Provider catalog contains sensitive fields

- **WHEN** discovery responses contain credential or provider-option fields
- **THEN** default diagnostics and persisted model metadata exclude those fields
