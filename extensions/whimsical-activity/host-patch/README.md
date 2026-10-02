# Pi v0.99.2 host integration

Whimsical requires native activity registration, settings, presentation, and foreground observations that stock Pi does not provide. This directory distributes those changes as a patch, not a bundled host checkout.

## Upstream and scope

- Repository: https://github.com/earendil-works/pi
- Base revision: `005af57d88ee23b33778f343a9595b32e67ff788` (Pi v0.99.2).
- Patch: `pi-v0.99.2.patch`, covering native integration and its focused regression tests.
- License: MIT, copyright (c) 2025 Mario Zechner; the complete notice is retained in [LICENSE.pi](LICENSE.pi).

Only this exact base is qualified. The patch includes modified upstream context and ZenStudioLab's changes; it does not transfer ownership of upstream code. It makes no provider/protocol schema changes and does not replace the active word bank.

## Prepare the source host

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

The 43 catalog files, including `.manifest.json`, were checked byte-for-byte against the migration's qualified source assets. The npm artifact was verified against its registry SHA-512 integrity. Neither the archive nor the data is committed to Pi Toolset.

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

## Qualification

Prepare root development dependencies and run the extension checks from the Pi Toolset root:

```bash
npm ci --ignore-scripts
env -u PI_PACKAGE_DIR npm run check
```

Focused native composition tests run from `host/pi/packages/coding-agent`:

```bash
env -u PI_PACKAGE_DIR node ../../node_modules/vitest/dist/cli.js --run \
  test/whimsical-source-lifecycle.test.ts test/whimsical-source-rendering.test.ts \
  test/whimsical-source-effects.test.ts test/whimsical-source-output.test.ts \
  test/whimsical-source-preferences.test.ts test/whimsical-source-settings.test.ts \
  test/whimsical-source-presets.test.ts test/whimsical-source-metadata.test.ts \
  test/native-activity-metadata.test.ts
```

The migration also ran all 19 affected coding-agent suites (218 tests), the root check (typecheck and 96 extension tests), and 11 focused Loader tests. All passed on the patched base with script-disabled dependencies. These are offline source checks, not a stock-release compatibility claim, a new live-provider qualification, or a full host build.

## Reversal

For a temporary disable, turn Enabled off in native settings or omit the extension entry; no checkout change is needed. To reverse the host integration, stop the host and verify that its patched files have no additional edits before using `git apply --reverse --check` and `git apply --reverse` with this patch. Do not reverse over unrelated work. The local host checkout is ignored by the toolset repository and is never included in its commits.
