# Optional advanced Pi host integration

This patch is **optional starting with version 0.1.2**. Stock Pi can show one local word per loop through public APIs; follow the [ordinary installation instructions](../../../README.md#installation) instead if that is all you need. Versions 0.1.0 and 0.1.1 remain host-only and still need this patch.

Advanced mode adds native activity registration, persistent settings, presets/colors, delayed/timed rotation, width reservation, synchronous wait arbitration, and observed foreground metadata that the stock path does not provide. This directory distributes those changes as a patch, not a bundled host checkout. See the [feature comparison](../README.md#stock-and-advanced-behavior). The extension always selects advanced registration when available, even if the host declines it; it does not compete through stock setters.

## Upstream and scope

- Repository: <https://github.com/earendil-works/pi>
- Base revision: `005af57d88ee23b33778f343a9595b32e67ff788` (Pi v0.99.2).
- Patch: `pi-v0.99.2.patch`, covering native integration and its focused regression tests.
- Base revision: `abe508e1b89912adde45528136c3221eb69acdd7` (Pi v1.1.0, tag `v1.1.0`).
- Patch: `pi-v1.1.0.patch`, the same native integration rebased onto v1.1.0. It includes the v1.1.0 extension selector, input, and editor dialog behavior (`blocked` status and `setBlocked`).
- Base revision: `4a080252f06caf63a525d7873c5d94d3c23887e0` (Pi v1.4.0, tag `v1.4.0`).
- Patch: `pi-v1.4.0.patch`, the same native integration rebased onto v1.4.0. v1.4.0 reworked extension dialogs into a stack where every dialog stays answerable, so the patch layers activity waiting, stale-component guards, and reset cleanup on that stack instead of replacing dialogs. It also adds the `activityIndicator` setting to `settings-schema.ts`, where v1.4.0 moved the `Settings` type.
- License: MIT, copyright (c) 2025 Mario Zechner; the complete notice is retained in [LICENSE.pi](LICENSE.pi).

Each patch is qualified only on its exact base. The patch includes modified upstream context and ZenStudioLab's changes; it does not transfer ownership of upstream code. It makes no provider/protocol schema changes and does not replace the active word bank.

## Prepare the optional source host

The commands below retain the v0.99.2 preparation recipe. For v1.4.0, use revision `4a080252f06caf63a525d7873c5d94d3c23887e0`, patch `pi-v1.4.0.patch`, and catalog package/archive version `1.4.0` instead (for v1.1.0, revision `abe508e1b89912adde45528136c3221eb69acdd7`, `pi-v1.1.0.patch`, and `1.1.0`). Never apply both patches or reuse the v0.99.2 catalog with v1.1.0.

Use Node >=22.19.0, Git, npm, GitHub CLI, and tar. Run these commands from the Pi Toolset repository root. The `host/pi` destination must not already exist; never overwrite an existing checkout. Keep it at this location because the focused host tests import the extension and fixtures using repository-relative paths.

```bash
gh repo clone earendil-works/pi host/pi
git -C host/pi checkout --detach 005af57d88ee23b33778f343a9595b32e67ff788
git -C host/pi apply --check ../../extensions/whimsical-activity/host-patch/pi-v0.99.2.patch
git -C host/pi apply ../../extensions/whimsical-activity/host-patch/pi-v0.99.2.patch
```

Hydrate the host's pinned dependencies without lifecycle scripts:

```bash
(cd host/pi && npm ci --ignore-scripts)
```

Source execution also requires Pi's generated provider catalog assets. Obtain only the data directory from the publisher's pinned 0.99.2 package; do not run a catalog generator or a full host build. These are upstream model catalogs, not generated Whimsical words.

```bash
CATALOG_TMP=$(mktemp -d)
npm pack @earendil-works/pi-ai@0.99.2 --ignore-scripts --pack-destination "$CATALOG_TMP"
mkdir -p host/pi/packages/ai/src/providers/data
tar -xzf "$CATALOG_TMP/earendil-works-pi-ai-0.99.2.tgz" \
  -C host/pi/packages/ai/src/providers/data --strip-components=4 \
  package/dist/providers/data
```

For v0.99.2, the 43 catalog files, including `.manifest.json`, were checked byte-for-byte against that migration's qualified source assets. The npm artifact was verified against its registry SHA-512 integrity. Neither the archive nor the data is committed to Pi Toolset.

## Launch

From the Pi Toolset root:

```bash
TOOLSET_ROOT="$PWD"
(cd host/pi && env -u PI_PACKAGE_DIR ./pi-test.sh --no-extensions \
  -e "$TOOLSET_ROOT/extensions/whimsical-activity/index.ts")
```

This starts the source host with only this explicit extension entry, without adding a package to global settings. Your normal host model/auth configuration still governs real sessions. For a no-provider startup check:

```bash
TOOLSET_ROOT="$PWD"
(cd host/pi && env -u PI_PACKAGE_DIR PI_OFFLINE=1 ./pi-test.sh \
  --no-env --no-extensions --no-skills --no-prompt-templates --no-themes \
  --no-context-files -e "$TOOLSET_ROOT/extensions/whimsical-activity/index.ts" --help)
```

### Background subagents on the source host

`pi-subagents` selects the running Pi package before its fallback environment override. With `pi-test.sh`, that is `host/pi/packages/coding-agent`, not the managed npm installation. Source execution alone does not create the compiled SDK that detached children need.

For the migrated checkout, whose workspace dependencies are already compiled, build the SDK and its assets from `host/pi/packages/coding-agent`:

```bash
npm run build:unbundled
```

For a fresh checkout needing all compiled workspace dependencies, use `npm run build:offline` from `host/pi` after preparing the matching provider catalog. This optional background-runner preparation is separate from ordinary source-only startup. Rebuild after changing host source; do not substitute a symlink to another installation's SDK.

The local `pix` launcher uses `PI_SUBAGENTS_PI_CODING_AGENT_PACKAGE_ROOT` for fallback discovery; `PI_CODING_AGENT_PACKAGE_ROOT` is not recognized by the installed extension. Neither that fallback nor `PI_SUBAGENT_PI_BINARY` overrides a detected source host for npm background children. The migrated host passes all 12 required peer aliases and imports its SDK successfully in a separate process using the runner's peer loader; no live oracle completion was run for this check.

### Use the npm release with the advanced host

After preparing the compatible patched host, you may register version 0.1.2 instead of loading the local entry. From the toolset root:

```bash
env -u PI_PACKAGE_DIR ./host/pi/pi-test.sh install npm:@zenstudiolab/pi-toolset@0.1.2
env -u PI_PACKAGE_DIR ./host/pi/pi-test.sh list
env -u PI_PACKAGE_DIR ./host/pi/pi-test.sh
```

This is a personal/global installation by default. Add `--local` from the target project if desired (using an absolute launcher path); project packages require trust. Do not combine this registered copy with the local `-e` trial, and do not pass `--no-extensions` for a registered-package launch. Other configured extensions will also load. Remove the exact source with `remove npm:@zenstudiolab/pi-toolset@0.1.2` through the same launcher, adding `--local` for a project declaration, then restart.

## Qualification

The v1.4.0 migration was checked with Node 22.19.0:

- The patch applies to pristine v1.4.0 and reproduces all 50 changed/new files byte-for-byte; reverse-apply checking passes on the installed host. `pix --version` reports `1.4.0`.
- The host's complete `npm run check` passes. `npm ci --ignore-scripts` hydrated dependencies, the 1.4.0 provider catalog came from the publisher's `@earendil-works/pi-ai@1.4.0` package (npm-pack extraction verified against its registry SHA-512), and `npm run build:offline` built every workspace package.
- `./test.sh` passes for coding-agent (2,900 passed, 50 skipped), AI (1,433 passed, 869 skipped), TUI, and the other packages. Six `packages/env` suites still fail because the native daemon is not built. Two `packages/durable` codemode timing tests failed once under full-suite load and passed 41/41 on two isolated reruns.
- No test assertions were changed. The prototype-based dialog fixtures in `interactive-mode-status.test.ts` and `interactive-mode-extension-dialogs.test.ts` gained `activityDecoration`, `customUIEpoch`, `editorUIRevision`, and `customUICleanup`. Four displaced-dialog cases needed a one-time `settled` guard in the selector and input dialogs so a late key on a removed dialog cannot settle or dispose it twice. Two stale-custom-component cases needed custom components to stack (not invalidate each other) and a stale component's removal not to redraw the editor slot.
- All 12 required peer aliases resolve through the installed `pi-subagents` `resolveHostPeerAliases` and load in a separate process; no live background-subagent run was done. Interactive display and live-provider behavior were not manually verified.
- The previous v1.1.0 checkout is retained at `host/pi-v1.1.0-backup`.

### Historical v1.1.0 qualification

The v1.1.0 migration was checked with Node 24.3.0:

- The patch applies to pristine v1.1.0 and reproduces all 48 changed/new files; reverse-apply checking also passes on the installed host. Patch generation uses a temporary index and leaves the host's real index unchanged.
- The installed host's 31 focused suites pass (274 tests), and `pix --version` reports `1.1.0`.
- The coding-agent suite passes through the repository's `./test.sh`: 2,918 passed, 50 skipped, zero failures. The earlier two `package-command-paths.test.ts` failures came from running Vitest directly with real home-directory skills; those skills displaced the built-in extensions in the selector. No assertion or production-code change was needed for those two failures.
- Five new dialog-status cases cover cross-kind replacement, same-kind replacement, late dismissal, and permission prompts. Four failed before moving the replacement's blocked-status publication after disposal of the previous dialog; all five now pass.
- The AI suite passes with the release catalogs: 1,317 passed, 864 skipped. The broader `./test.sh` run still exits nonzero because five `packages/env` suites require the unbuilt native daemon.
- The host's complete `npm run check` passes, including test typechecking and browser smoke checks. Nine migrated settlement-event fixtures were updated with v1.1.0's required `aborted: false` field. Offline AI and unbundled coding-agent builds also pass; the TUI package's native tests pass.
- Pi Toolset's `npm test` passes (351 tests). Its root `npm run check` stops at type errors in the untouched `extensions/pi-voicekit` submodule, before reaching tests.

The initially regenerated provider assets drifted from the pinned release, including Sonnet 5.5 cache-read pricing. They have been replaced from the existing managed `@earendil-works/pi-ai@1.1.0` installation: all 42 provider files match its manifest hashes, and both source and compiled catalog directories match that release byte-for-byte, including `.manifest.json`. Catalog validation and the previously failing pricing regression pass without changing pricing assertions. The npm-pack extraction recipe above was not independently rerun. Interactive CLI activity-indicator display and live-provider behavior have not been manually verified. The original local checkout is retained at `host/pi-v0.99.2-backup`.

### Historical v0.99.2 qualification

Prepare root development dependencies and run the extension checks from the Pi Toolset root:

```bash
npm ci --ignore-scripts
env -u PI_PACKAGE_DIR npm run check
```

The hybrid checkout's focused native regressions run from `host/pi/packages/coding-agent`:

```bash
env -u PI_PACKAGE_DIR node ../../node_modules/vitest/dist/cli.js --run \
  test/whimsical-source-lifecycle.test.ts test/whimsical-source-rendering.test.ts \
  test/whimsical-source-preferences.test.ts
```

These three suites passed (22 tests) on the unchanged patched base with Node 22.19.0. The root hybrid check passed typechecking and 114 tests. Separate released stock 0.99.2 offline lifecycle/native render and packed-entry checks are described in the [root qualification notes](../../../README.md#qualification-and-development). Root typechecking needs this source checkout for actual advanced types; ordinary installed-package loading does not.

Historical migration evidence also covered 19 affected coding-agent suites (218 tests), 96 root extension tests, and 11 focused Loader tests. Those historical counts are not a claim that the broader suites were rerun for this hybrid change. No full host build or live-provider qualification is required here.

## Reversal

For a temporary disable, turn Enabled off in native settings or omit the extension entry; no checkout change is needed. To reverse the host integration, stop the host and verify that its patched files have no additional edits before using `git apply --reverse --check` and `git apply --reverse` with this patch. Do not reverse over unrelated work. The local host checkout is ignored by the toolset repository and is never included in its commits.
