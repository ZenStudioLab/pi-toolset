# Optional advanced Pi v0.99.2 host integration

This patch is **optional for the unreleased stock-compatible checkout**. Stock Pi can show one local word per loop through public APIs; follow the [ordinary checkout trial](../../../README.md#stock-pi-try-the-unreleased-checkout) instead if that is all you need. **Current npm 0.1.1 remains host-only** and still needs this patch.

Advanced mode adds native activity registration, persistent settings, presets/colors, delayed/timed rotation, width reservation, synchronous wait arbitration, and observed foreground metadata that the stock path does not provide. This directory distributes those changes as a patch, not a bundled host checkout. See the [feature comparison](../README.md#stock-and-advanced-behavior). The extension always selects advanced registration when available, even if the host declines it; it does not compete through stock setters.

## Upstream and scope

- Repository: <https://github.com/earendil-works/pi>
- Base revision: `005af57d88ee23b33778f343a9595b32e67ff788` (Pi v0.99.2).
- Patch: `pi-v0.99.2.patch`, covering native integration and its focused regression tests.
- License: MIT, copyright (c) 2025 Mario Zechner; the complete notice is retained in [LICENSE.pi](LICENSE.pi).

Only this exact base is qualified. The patch includes modified upstream context and ZenStudioLab's changes; it does not transfer ownership of upstream code. It makes no provider/protocol schema changes and does not replace the active word bank.

## Prepare the optional source host

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

### Use the current host-only npm release

After preparing the compatible patched host, you may register published 0.1.1 instead of loading the local entry. From the toolset root:

```bash
env -u PI_PACKAGE_DIR ./host/pi/pi-test.sh install npm:@zenstudiolab/pi-toolset@0.1.1
env -u PI_PACKAGE_DIR ./host/pi/pi-test.sh list
env -u PI_PACKAGE_DIR ./host/pi/pi-test.sh
```

This is a personal/global installation by default. Add `--local` from the target project if desired (using an absolute launcher path); project packages require trust. Do not combine this registered copy with the local `-e` trial, and do not pass `--no-extensions` for a registered-package launch. Other configured extensions will also load. Remove the exact source with `remove npm:@zenstudiolab/pi-toolset@0.1.1` through the same launcher, adding `--local` for a project declaration, then restart.

## Qualification

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
