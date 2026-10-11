## Why

Pi's Bash blocks currently have background shading but no distinct left edge, unlike OpenCode's tool blocks. A local Pi extension can add that visual structure without patching Pi or changing terminal-wide themes.

## What Changes

- Create the standalone `pi-tool-block-borders` extension project under `/mnt/8CE085C2E085B2CE/Src/Tools/`, outside the Zen Virtual Piano workspace.
- Add a single-column `┃` left rail to Pi's Bash call and output, with light block padding and the active theme's existing tool-background colors.
- Use `borderAccent` for ordinary blocks and `error` for failed blocks. With the current ORNG theme, the ordinary rail is orange. This intentionally adapts OpenCode's framing rather than copying its normal white border literally.
- Reuse Pi's native Bash execution and call/result rendering, including streaming output, truncation notices, timing, and expansion behavior.
- Support interactive regular and fullscreen modes, theme changes, and narrow terminal widths. Keep non-interactive execution unaffected by rendering.
- Provide local loading/unloading instructions and focused verification. Do not install globally or change live Pi settings during proposal creation.
- Keep the first release Bash-only. Other built-in and third-party tools remain unchanged.

## Capabilities

### New Capabilities

- `themed-bash-block-framing`: Theme-aware left-edge framing for native Pi Bash blocks, preserving execution, rendering behavior, and terminal layout.

### Modified Capabilities

None. This new standalone project has no existing stable capability specs.

## Impact

- New extension implementation, package metadata, usage documentation, and focused tests in the Tools project; no implementation files are created by this proposal.
- Host APIs: `@earendil-works/pi-coding-agent` native Bash definition factory and extension tool registration; `@earendil-works/pi-tui` components and ANSI-aware width utilities.
- Initial compatibility baseline: installed Pi 0.87.1, especially `renderShell: "self"`, `renderCall`, and `renderResult`.
- Loading the extension shadows the built-in `bash` definition to customize presentation. It must preserve native execution and report competing Bash overrides rather than silently discarding them.
- No changes to OpenCode, HERDR, Ghostty, tmux, the ORNG theme JSON, or the piano repository. No monkey-patching installed packages and no npm publication in this change.
