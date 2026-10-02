# Pi Toolset

ZenStudioLab's extensions and tools for [Pi](https://github.com/earendil-works/pi). This repository is not a distribution or fork of the Pi host.

| Extension | Description |
| --- | --- |
| [Whimsical Activity](extensions/whimsical-activity/README.md) | Local activity words on Pi's native working surface, with optional advanced host integration. |

## Installation

**Version 0.1.2 adds stock Pi support; no host patch is needed.** Use Node >=22.19.0 and an installed Pi in an interactive terminal. Stock **0.99.2** is qualified for native rendering; see the [qualification notes](#qualification-and-development) for exact coverage.

Use Pi's package manager, not `npm install -g`:

```bash
pi install npm:@zenstudiolab/pi-toolset
pi list
```

Restart Pi without the local `-e` entry or `--no-extensions`. Installation is personal/global by default; add `--local` from the target project for a project-only declaration. Pi loads project packages after project trust is granted.

To update an unversioned installation or remove it:

```bash
pi update npm:@zenstudiolab/pi-toolset
pi remove npm:@zenstudiolab/pi-toolset
```

For an existing pinned install, remove its exact source, for example `pi remove npm:@zenstudiolab/pi-toolset@0.1.1`. Add `--local` when removing a project-local declaration. Restart after removal. Updating a package does not apply or update a host patch.

**Use only one copy:** local paths and npm packages are different sources. Remove old local/GitHub/npm declarations shown by `pi list` before switching installation methods. Do not combine a registered npm copy and an explicit local entry. Other extensions that write the same working-message/indicator setters can also interfere; stock Pi offers no exclusive ownership or previous-value getter. Cleanup restores defaults only for controls Whimsical changed, not another extension's prior values.

### Try a local checkout instead

From the cloned toolset root, in an interactive terminal:

```bash
pi --no-extensions -e "$PWD/extensions/whimsical-activity/index.ts"
```

This local-entry command was checked on stock **0.99.2**. It needs no host checkout, patch, build, or toolset dependency installation. `--no-extensions` disables other discovered/configured extensions, but the explicit `-e` still loads. The trial does not register a package in settings; your usual Pi model/auth configuration still applies. Omit the entry on the next launch to stop loading it.

Stock mode shows one bundled word per agent loop with Pi's native spinner. It adds no timers or settings and changes no prompts, tools, or provider requests. See the [feature comparison and invocation flags](extensions/whimsical-activity/README.md).

### Optional advanced host

For native saved settings, animation presets/colors, timed word rotation, width reservation, synchronous wait arbitration, and observed metadata, follow the [advanced host guide](extensions/whimsical-activity/host-patch/README.md). Only the documented patched 0.99.2 base is qualified. If the advanced registration API exists, it is authoritative even when it declines registration; stock never becomes a competing fallback.

### Troubleshooting

- **No decoration on npm 0.1.0 or 0.1.1 with stock Pi:** upgrade to 0.1.2 or later using the instructions above. Those older versions require the optional advanced host; reinstalling them cannot add stock support.
- **No indicator:** use an interactive TTY (both stdin and stdout), check `--no-whimsical-activity`, and use one entry. Print, JSON, RPC, no-UI, and redirected sessions are silent no-ops.
- **Working API warning:** update Pi to a qualified stock release. Only hosts missing required public setters are warned; an absent advanced API alone is normal.
- **Flicker, unexpected resets, or competing registration:** disable other working-message extensions and remove duplicate installations. On advanced hosts also check **Activity indicator → Enabled**.

## Qualification and development

Tested with Node **22.19.0**:

- Stock **0.99.2**: real released loader, agent lifecycle with an offline controlled provider, InteractiveMode/native editor and status rendering, cancellation/restoration, native prompts/retry/compaction, narrow widths, and packed-entry loading outside this repository. An isolated real CLI terminal startup/quit also checked the local trial command.
- Published **0.87.1** development packages: actual loader/runner integration plus focused unit tests. This is not a full interactive rendering qualification of 0.87.1.
- Advanced **0.99.2**, base `005af57d88ee23b33778f343a9595b32e67ff788` plus supplied patch: focused native lifecycle/render/preference regressions.

Peer ranges follow Pi's host-provided-package convention; they are not a claim that every Pi version is tested. No live provider calls are needed for these checks. Stock uses normal Pi layout and can omit/truncate words at narrow widths; it does not reserve the advanced fixed slot.

**Developer-only requirement:** root typechecking imports actual advanced source types. Prepare `host/pi` using the [advanced guide](extensions/whimsical-activity/host-patch/README.md), then run from this repository root:

```bash
npm ci --ignore-scripts
npm run check
```

Development dependencies stay pinned to 0.87.1. Neither the development tests nor `host/pi` are required for ordinary package loading, and neither is published. The explicit released-host render harness can be rerun from the root with an existing read-only 0.99.2 installation (no dependency install needed):

```bash
# PI_RELEASE_DIR must be the installed @earendil-works/pi-coding-agent directory.
CAPTURE_ROOT=$(mktemp -d)
node --experimental-strip-types test/whimsical-activity/released-stock-render.mjs \
  "$PI_RELEASE_DIR" extensions/whimsical-activity/index.ts "$CAPTURE_ROOT/render"
```

It writes ANSI/native render captures under that fresh directory and isolates its config. The harness checks regular terminal mode; it is not a claim of every terminal emulator or fullscreen layout being qualified.

## License

Original contributions are MIT licensed. See [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for upstream Pi attribution and redistribution requirements.
