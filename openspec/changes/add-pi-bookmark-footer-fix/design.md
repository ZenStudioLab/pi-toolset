# Design

## Context

The official bookmark package is installed from a pinned Git source in `/home/zenji/.pi/agent/settings.json`. Its extension status uses `ESC[999C` to place `◢` at the far right of the footer. Pi's `FooterComponent` collects all extension statuses, sorts them by key, joins them into one line, sanitizes only a small set of whitespace characters, and truncates based on logical visible width. Cursor movement embedded in one status therefore escapes the footer's layout model when another status, such as `pi-subscription-usage`, is present.

The repository already contains `extensions/pi-subscription-usage` as a submodule. The bookmark fork will follow the same repository-boundary pattern, while its package manifest continues to expose `./extensions/index.ts` as the Pi entrypoint.

## Goals / Non-Goals

**Goals:**

- Keep the bookmark source reviewable and reproducible inside the monorepo.
- Make bookmark status text safe for Pi's shared footer-status aggregation.
- Replace the official package selection with the local maintained package.
- Preserve bookmark commands, storage, picker behavior, and session lifecycle behavior.
- Verify coexistence with the subscription usage and other installed status providers.

**Non-Goals:**

- Redesign Pi's core footer layout or add a new footer-slot API.
- Change the subscription usage extension's provider logic or status format.
- Change bookmark persistence format, command names, keyboard bindings, or picker UX.
- Add Claude usage support as part of this change.

## Decisions

### Use a ZenStudioLab Git submodule

Add `git@github.com:ZenStudioLab/pi-bookmark.git` at `extensions/pi-bookmark` and record the reviewed commit in the parent repository. This keeps the maintained fork's history and package boundary intact instead of copying source into the monorepo or patching the global package cache.

**Alternative considered:** Edit `/home/zenji/.pi/agent/git/github.com/vaultboy001/pi-bookmark` directly. This is not reproducible and would be lost on package refresh.

### Render the bookmark marker as ordinary status content

The fork will emit the visible marker through the normal `setStatus` text path without `ESC[999C` or other cursor-positioning sequences. Pi's footer owns width calculation and placement; the bookmark extension will not attempt to right-align itself.

**Alternative considered:** Preserve the cursor escape and teach subscription usage to render before or after it. This would leave the shared status contract unsafe for every other extension and would make ordering part of correctness.

### Select the local package explicitly

Remove the upstream bookmark package entry from the active Pi package configuration and add the local submodule package path. Keep the local package selected exactly once so both copies cannot register duplicate commands or compete for the same status key.

**Alternative considered:** Keep both packages installed and filter one extension entry. This preserves ambiguity and risks duplicate command registration, so it is rejected.

### Test the boundary at both source and runtime levels

Add focused coverage for the status value and existing bookmark behavior, then run a Pi-level smoke check with bookmark, subscription usage, MCP, and image statuses active. The test must verify absence of cursor-control sequences and visible-width safety rather than only checking that a marker string exists.

## Risks / Trade-offs

- [Risk] The submodule uses an SSH remote and may require contributor SSH access during initialization. -> [Mitigation] Record the exact commit and document the repository URL; use the configured access method during implementation.
- [Risk] The marker will no longer be physically right-aligned under the model name. -> [Mitigation] Accept Pi's shared footer layout as the ownership boundary; preserve marker visibility and layout correctness over extension-specific positioning.
- [Risk] The user package configuration is outside the repository and cannot be reviewed through the parent Git diff. -> [Mitigation] Make a targeted package-source replacement, verify the resulting `pi list`, and report the external configuration change explicitly.
- [Risk] Existing bookmark behavior could regress while changing a small status-only path. -> [Mitigation] Preserve all command/store/picker code and run the package's existing checks plus focused footer coexistence verification.

## Migration Plan

1. Add and pin the ZenStudioLab submodule.
2. Apply the status-only fix in the submodule and verify the submodule worktree.
3. Replace the official package entry with the local package path in the active Pi configuration.
4. Reload Pi and verify `pi list`, bookmark commands, and combined footer rendering.
5. Roll back by restoring the official package entry and removing the local package entry if the smoke check fails; the parent repository can independently revert the submodule gitlink.
