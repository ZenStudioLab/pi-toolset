## Context

The user wants an OpenCode-style left edge on Pi's tool blocks and a standalone extension in `/mnt/8CE085C2E085B2CE/Src/Tools/`. The current personal theme is ORNG light, with white terminal and HERDR sidebar backgrounds.

Read-only inspection established:

- Installed OpenCode 1.18.29 gives Bash blocks a left-only border, custom border characters, padding, and `backgroundPanel`. Its ordinary tool border uses the page background; error blocks elsewhere use the error color. We are adapting that framing, not claiming a pixel-identical ORNG clone.
- Installed Pi 0.87.1 provides `ToolDefinition.renderShell: "default" | "self"`. The self shell omits the standard filled box and composes the tool's call/result components.
- Pi publicly exports `createBashToolDefinition`; native Bash renderers preserve truncation, expansion, timing, and streaming.
- Native renderers reuse `context.lastComponent` as their own concrete component and share `context.state`. Passing a rail wrapper back as the native last component would break their assumptions.

Relevant installed references are Pi's `docs/extensions.md`, `docs/tui.md`, `dist/core/extensions/types.d.ts`, `dist/core/tools/renderers/bash.js`, and `dist/modes/interactive/components/tool-execution.js`. Inspect the supported host version again during implementation; installed files are evidence, not edit targets.

## Goals / Non-Goals

**Goals:**

- Give native Bash calls/results a continuous, one-cell left rail in interactive Pi.
- Use the active theme's `borderAccent`, `error`, and tool-background tokens instead of fixed ORNG hex values.
- Preserve model-facing schemas, execution, output, timing, truncation warnings, and interaction behavior.
- Keep a small local extension with focused tests and explicit load/unload instructions.

**Non-Goals:**

- Framing every built-in or MCP/third-party tool in this first change.
- Decorating user-entered shell commands outside the model-facing Bash tool.
- New terminal themes, background changes, settings dashboards, configurable border styles, or exact OpenCode UI cloning.
- Monkey-patching Pi, copying its shell execution implementation, publishing a package, automatic global installation, or worktrees.

## Decisions

### 1. Use the public tool-definition API and self-rendered shell

Build the Bash definition from the host's native factory, retain its model-facing metadata and native execution, and customize only presentation through `renderShell: "self"` and decorated call/result renderers. Ensure native execution uses the invocation's correct working directory and honors the host's applicable shell settings/options; qualify this before registering the override.

This supported boundary is preferable to patching `ToolExecutionComponent`, which would affect all tools and be overwritten by upgrades. A theme-only change cannot introduce a rail because Pi has no tool-border theme setting. Terminal or HERDR configuration cannot selectively decorate application-owned tool blocks.

### 2. Decorate native components rather than rebuilding their output

Keep the inner call component and inner result component separately from the returned wrappers. Forward native renderer state and render context, but supply the corresponding unwrapped `lastComponent`. Preserve `invalidate`, arguments, execution/partial/error flags, working directory, expansion, and image visibility. Do not add elapsed-time timers or modify native timer ownership.

Call and result framing form one visual block, with a rail on padding and content rows and no artificial seam between slots. Forward mouse events to the child with coordinates adjusted for the rail/gap/padding so native result expansion remains usable. Empty native components must not become empty bordered cards.

### 3. Theme-aware adaptation, not a hard-coded ORNG skin

Draw `┃` with `borderAccent` normally and `error` after a failed execution. Use `toolPendingBg`, `toolSuccessBg`, or `toolErrorBg` according to the host's state. Resolve colors when rendering or invalidating so changing themes recolors existing blocks.

Under the user's ORNG palette the normal rail is orange. OpenCode's white ordinary border is deliberately not copied: the requested distinct edge is clearer with Pi's existing accent role. No new color tokens or theme-file modifications are needed.

### 4. Treat width and input routing as component contracts

Reserve one terminal column for the rail and one for the adjacent gap before asking the native component to render. Use Pi TUI's ANSI-aware width utilities; never use string length to measure terminal cells. Handle wide characters, escape sequences, resizing, and narrow widths without overflow or lost output. At widths too narrow for rail plus meaningful content, prefer unframed native rendering over consuming the whole viewport with decoration.

Preserve Pi's own per-tool mouse region, adjusting any child-coordinate dispatch inside the wrapper. Do not introduce a second terminal renderer, global raw-output interception, or private prototype edits.

### 5. Keep the project standalone and installation explicit

Use a small TypeScript Pi extension entry point, a distinct framing component only if separation improves clarity, minimal Pi package metadata with `pi.extensions`, and focused local test/typecheck commands. Declare host peer compatibility against the qualified 0.87.1 API; do not bundle another Pi runtime or borrow the piano monorepo's node_modules. Select and record the standalone package-manager contract during implementation.

Test by explicitly loading the local entry point into a separate Pi session. Existing extensions/events must continue to run. A competing custom Bash implementation is not a merge target. Qualification found that Pi's registry silently replaces definitions, so delay registration until `session_start`, inspect public `getAllTools()` source metadata, and warn/skip if Bash is already custom. Late dynamic competing registration and SDK-injected private execution options are unsupported compositions, not grounds for private registry access. Global configuration changes require a separate explicit installation decision.

## Risks / Trade-offs

- **Overriding Bash can lose execution options or conflict with another custom implementation** → Read file-backed CLI shell settings through public `SettingsManager` with the host context's project-trust decision; test command prefix/working directory/cancellation parity, and check public tool-source metadata before dynamic registration rather than using private introspection or silently replacing an existing custom tool.
- **Native last-component reuse breaks when given the decorator** → Track each inner component independently and test repeated partial updates and expansion.
- **ANSI resets, Unicode, and resizing distort the rail or content** → Test actual rendered visible widths and keep wrapping in the native renderer's reduced viewport.
- **Added columns alter mouse coordinates** → Preserve the host click region and test forwarded native input at the adjusted origin.
- **Color state or timing becomes stale during streaming/reload** → Preserve native state/invalidation, add no new timers, and qualify success, error, abort, and theme change.
- **Pi's public APIs may change** → Declare only qualified compatibility, recheck declarations at implementation, and stop clearly if the supported API is unavailable instead of patching internals.

## Migration Plan

1. Implement and verify within the standalone Tools project.
2. Load the local extension explicitly in a separate interactive Pi session; inspect ORNG and a dark theme in regular/fullscreen modes.
3. Verify non-interactive Bash parity and unload by omitting the extension from the next session.
4. Present the result for acceptance. Do not alter personal Pi settings or restart existing sessions as part of this change.

No data migration is involved. Rollback is unloading the extension; native Pi rendering returns without reverting terminal/theme files.

## Open Questions

No product decision blocks the proposal: this is a Bash-only, accent-rail adaptation. Qualification confirmed the native factory's public execution options and dynamic registration on Pi 0.87.1. The extension supports ordinary file-backed CLI settings; programmatic SDK-only shell-option overrides and custom Bash definitions are not merge targets. If either cannot be preserved through public APIs, stop and revise this design rather than weakening the execution-parity requirement. Wider tool coverage and global installation are outside this change.
