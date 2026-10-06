# Proposal

## Why

The official `pi-bookmark` package emits a raw terminal cursor-movement escape sequence from `ctx.ui.setStatus()`. Pi concatenates extension statuses into one footer line, so adding `pi-subscription-usage` causes the bookmark marker and neighboring statuses to render at incorrect positions and corrupt the footer layout. The maintained ZenStudioLab fork should be vendored as a submodule and loaded instead of the official package so the fix is reproducible and survives package refreshes.

## What Changes

- Add `git@github.com:ZenStudioLab/pi-bookmark.git` under `extensions/pi-bookmark` as a pinned Git submodule.
- Replace the bookmark status implementation that emits `ESC[999C` with footer-safe status text that does not reposition the terminal cursor.
- Disable the official `git:github.com/vaultboy001/pi-bookmark` package in the local Pi package configuration and load the patched local extension.
- Verify bookmark status, subscription usage status, MCP status, and other extension statuses coexist within Pi's footer width without cursor corruption or overlap.

## Capabilities

### New Capabilities

- `pi-bookmark-footer-integration`: Maintained local Pi bookmark integration with footer-safe status rendering and reproducible submodule/package selection.

### Modified Capabilities

- None. The repository has no existing OpenSpec capability specs; this change introduces the integration contract.

## Impact

- Repository integration: `.gitmodules` and `extensions/pi-bookmark`.
- Pi extension loading: local user package configuration must stop loading the official bookmark package and load the patched local extension.
- Pi TUI footer behavior: bookmark status rendering must remain compatible with the core footer's status concatenation and width handling.
- Existing bookmark commands and persistence behavior should remain unchanged; only footer status emission and package ownership change.
