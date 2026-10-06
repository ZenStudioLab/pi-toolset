# Proposal

## Why

Pi users should be able to select models already configured and authenticated in OpenCode while retaining Pi's tool execution and visible conversation. A standalone provider bridge offers this without turning Pi into an OpenCode delegation client or coupling its dependencies to the toolset package.

## What Changes

- Introduce the standalone `ZenStudioLab/pi-opencode-bridge` package and store its reviewed commit at `extensions/pi-opencode-bridge/` as a Git submodule.
- Register an opt-in Pi provider that automatically discovers tool-capable chat models reported by connected OpenCode providers, preserving provider/model identity and capability metadata.
- Launch and manage a dedicated loopback OpenCode server; reuse OpenCode authentication and provider configuration without modifying user-owned configuration or credential files.
- Relay only the current Pi tool declarations through MCP, with actual execution and tool results passing through Pi's agent loop rather than OpenCode native tools.
- Translate streaming responses, cancellation, errors, usage, and context transitions between the two runtimes.
- Qualify an initial supported Pi/OpenCode pair and stop expansion if the first real tool-relay and configuration-inheritance slice cannot satisfy the authority boundary.
- Keep the toolset's root package exports and automatic extension loading unchanged. Do not introduce an `AskOpenCode` tool, shared bridge framework, automatic CLI installation, or npm publication.

## Capabilities

### New Capabilities

- `opencode-provider`: Standalone packaging, connected-model discovery, managed runtime configuration, Pi-owned tool execution, streaming, and session synchronization for an OpenCode-backed Pi provider.

### Modified Capabilities

None. The durable capability inventory is empty; existing activity, speech, bookmark, and subscription-usage changes remain outside this change.

## Impact

Implementation belongs to the standalone repository checked out at `extensions/pi-opencode-bridge/`; this change's planning source of truth remains in `pi-toolset/openspec/changes/add-pi-opencode-bridge/`. Toolset integration touches only the new submodule registration/gitlink and a concise storage description, not root runtime dependencies, publication exports, or Pi settings.

The new package will depend on reviewed, pinned OpenCode SDK and MCP transport packages and use Pi's public provider API. OpenCode 1.18.29 is installed; the user selected the latest published Pi release, verified as 1.0.4 in the official npm registry. The toolset's development dependencies are 0.87.1 and are not the qualification environment. Released, unpatched Pi 1.0.4 with OpenCode 1.18.29 is the proposed first qualification pair, pinned rather than following a floating latest tag, with no older-version or OpenCode v2 promise. The Pi 1.0.4 dependency/API review and runtime qualification remain pending.

The package has no existing source and its proposed GitHub repository returned HTTP 404 to the current account. Repository initialization and submodule attachment are future implementation work, not completed acquisition or publication. Provider-side authentication, subscriptions, costs, and entitlement remain OpenCode/provider concerns.
