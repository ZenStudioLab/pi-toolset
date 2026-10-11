## ADDED Requirements

### Requirement: Bash blocks have a themed left rail

In interactive Pi, the extension SHALL frame native Bash call and result content as one visual block with a single-column `┃` rail, a separating space, and modest padding. The extension SHALL use the active theme's `borderAccent` for an ordinary rail and `error` for a failed execution. It SHALL retain the applicable `toolPendingBg`, `toolSuccessBg`, and `toolErrorBg` roles rather than introduce fixed ORNG colors.

#### Scenario: Ordinary Bash block under ORNG

- **WHEN** a native Bash command is shown with the extension loaded and the ORNG theme active
- **THEN** its call and visible output have a continuous orange left rail using `borderAccent`
- **AND** the rail does not add top, right, or bottom rectangular borders

#### Scenario: Failed Bash command

- **WHEN** the native Bash execution reports a failed tool result
- **THEN** the block rail uses the active theme's `error` color
- **AND** the native error text and failure status remain visible

### Requirement: Native Bash execution is preserved

The extension SHALL preserve native Bash metadata, parameter validation, working directory, applicable shell options, event hooks, cancellation signal, streaming update callback, result content, and result details. Decoration SHALL NOT spawn a replacement shell, rewrite commands, alter output sent to the model, or change native success/error classification.

#### Scenario: Execution with native settings

- **WHEN** the same Bash call runs with and without the extension using the same supported host settings, working directory, and deterministic command
- **THEN** native execution honors the same settings and produces equivalent content, details, and success/error classification
- **AND** normal host tool-call and tool-result hooks remain in the execution path

#### Scenario: Cancelled or timed-out command

- **WHEN** a Bash call is cancelled or reaches its native timeout
- **THEN** native process cleanup and terminal result behavior remain unchanged
- **AND** the decorator neither retries the command nor leaves its own background timer running

### Requirement: Native output behavior is preserved

The extension SHALL reuse the host's native call/result rendering and preserve partial updates, elapsed-time rendering, truncation notices, output-file references, expansion/collapse, and existing output styling. It SHALL preserve the native component reuse and shared-state contracts without supplying a decorator as a native `lastComponent`.

#### Scenario: Streaming output updates repeatedly

- **WHEN** one Bash execution emits multiple partial results and then completes
- **THEN** the framed output updates in place without duplicated call headers or output sections
- **AND** native completion/timing behavior is preserved

#### Scenario: Long output is expanded and collapsed

- **WHEN** the native renderer truncates a long output and the user expands or collapses it through Pi's normal controls
- **THEN** the native preview, expanded output, and truncation notices remain available
- **AND** all displayed content stays within the left-railed block

#### Scenario: Empty native content

- **WHEN** a native call or result component renders no visible rows
- **THEN** decoration does not create a separate empty bordered card for that component

### Requirement: Framing respects terminal width and input coordinates

The extension SHALL measure visible terminal columns using ANSI-aware TUI utilities, reserve rail/gap columns before native layout, and handle resizing without overflow or lost content. At widths too narrow for useful framed content, it SHALL render the native content without decoration. Any mouse input forwarded to a native child SHALL account for the decorator's padding and horizontal offset.

#### Scenario: ANSI and wide-character output after resize

- **WHEN** Bash output contains ANSI styling and wide characters and the terminal becomes narrower
- **THEN** every rendered line stays within the available visible column width
- **AND** output wraps or truncates through native behavior without corrupting the rail or discarding content

#### Scenario: Extremely narrow viewport

- **WHEN** the viewport cannot accommodate the rail, gap, and useful native content
- **THEN** native content remains visible through the unframed fallback
- **AND** framing does not cause negative widths or rendering errors

#### Scenario: Mouse interaction with framed output

- **WHEN** the user activates native expand/collapse through the framed output's clickable region
- **THEN** the same action as the corresponding unframed native interaction occurs
- **AND** decorator offsets do not shift input onto the wrong native content region

### Requirement: Framing follows host theme and mode changes

The extension SHALL resolve colors against the active Pi theme during rendering/invalidation, operate in regular and fullscreen interactive modes, and leave print/JSON/RPC execution semantics independent of terminal rendering. It SHALL not modify terminal-wide colors or persist precolored output into model-facing results.

#### Scenario: Existing block changes theme

- **WHEN** the active Pi theme changes after a Bash block has been rendered
- **THEN** the block's rail and state-appropriate background update to the new theme
- **AND** native output content is unchanged

#### Scenario: Non-interactive execution

- **WHEN** the extension is loaded in print, JSON, or RPC mode and Bash executes
- **THEN** the native model-facing tool content and details remain equivalent to undecorated execution
- **AND** decoration requires no interactive terminal UI operations

### Requirement: The extension is isolated and reversible

The extension SHALL be a standalone local project in `/mnt/8CE085C2E085B2CE/Src/Tools/pi-tool-block-borders`, use supported Pi extension APIs, and initially decorate only the model-facing Bash tool. It SHALL not patch installed Pi files or change OpenCode, HERDR, Ghostty, tmux, ORNG theme files, or personal Pi configuration. Usage documentation SHALL describe explicit loading and unloading. A competing custom Bash implementation present before registration SHALL be surfaced through extension diagnostics rather than silently discarded.

#### Scenario: Explicit local loading and unloading

- **WHEN** the user loads the local extension in a separate Pi session and later starts a session without it
- **THEN** Bash is framed only in the session with the extension
- **AND** all other tool renderers and external application configuration files remain unchanged

#### Scenario: Competing Bash implementation

- **WHEN** another loaded extension already supplies a custom Bash definition
- **THEN** qualification reports the conflict rather than silently replacing its execution behavior
- **AND** any unsupported composition is resolved before the extension is accepted for that configuration
