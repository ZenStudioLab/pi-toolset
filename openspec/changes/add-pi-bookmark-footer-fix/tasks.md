# Tasks

## 1. Add and patch the maintained bookmark source

- [x] 1.1 Add `git@github.com:ZenStudioLab/pi-bookmark.git` as the `extensions/pi-bookmark` submodule and verify its package manifest exposes `./extensions/index.ts` as the Pi extension entrypoint.
- [x] 1.2 Replace the bookmark status value that emits `ESC[999C` with an ordinary visible marker and verify the status source contains no cursor-positioning escape sequence.
- [x] 1.3 Add focused bookmark-extension coverage for pinned and unpinned status values, existing command registration, and unchanged bookmark-store behavior; verify the submodule's available checks pass.
- [x] 1.4 Commit and push the patched bookmark source to the ZenStudioLab remote, then verify the pushed commit is reachable from `git@github.com:ZenStudioLab/pi-bookmark.git`.

## 2. Integrate the patched package with the monorepo

- [x] 2.1 Update the parent repository's `.gitmodules` and gitlink to the pushed patched commit; verify `git submodule status` reports the expected commit at `extensions/pi-bookmark`.
- [x] 2.2 Remove the official `git:github.com/vaultboy001/pi-bookmark` package from the active Pi package configuration and install/load `$REPO/extensions/pi-bookmark`; verify `pi list` shows the local package exactly once and no official bookmark package.
- [x] 2.3 Reload Pi and verify `/pin`, `/unpin`, `/bookmarks`, and the existing bookmark shortcut remain available while the existing bookmark store is preserved.

## 3. Verify footer coexistence and documentation

- [x] 3.1 Run the relevant Pi footer/status tests with bookmark, subscription usage, MCP, image, and other extension statuses represented; verify every rendered line stays within terminal width and no output contains cursor-positioning control sequences.
- [x] 3.2 Perform a TUI smoke check with a bookmarked session and subscription usage active; verify the bookmark marker, usage status, MCP/image statuses, model line, and session path render without overlap, wrapping, or font/cursor corruption.
- [x] 3.3 Verify the final parent Git diff contains only the intended submodule metadata/gitlink and planning-approved integration changes, while unrelated existing work remains untouched.
