# Pi Toolset

ZenStudioLab's extensions and tools for [Pi](https://github.com/earendil-works/pi). Each extension lives in its own directory; this repository is not a distribution or fork of the Pi host.

## Extensions

| Extension | Description | Compatibility |
| --- | --- | --- |
| [Whimsical Activity](extensions/whimsical-activity/README.md) | Local activity words, animation settings, and observed foreground metadata on native status surfaces. | Requires the supplied patch against Pi v0.99.2; stock Pi is not supported for this feature. |

Only Whimsical is included initially. Future extensions can be added under `extensions/<name>/`; add their entry points explicitly to the `pi.extensions` package manifest. Third-party extensions from the original local setup are excluded.

## Installation

**Whimsical Activity 0.1.1 is experimental and requires the patched Pi v0.99.2 source host.** Installing the npm package alone does not patch Pi. Stock Pi displays an unsupported-host warning in interactive mode and keeps its native UI unchanged.

### First-time setup: prepare the host

You need Node >=22.19.0, npm, Git, GitHub CLI (`gh`), and tar. The source-launch examples use a Bash-compatible shell.

Clone the toolset into a new directory:

```bash
gh repo clone ZenStudioLab/pi-toolset
cd pi-toolset
```

Complete **Prepare the source host** in the [Whimsical setup guide](extensions/whimsical-activity/host-patch/README.md). It checks out the exact supported Pi revision, applies the supplied patch, installs dependencies with lifecycle scripts disabled, and prepares the required provider catalogs. It does not replace your installed Pi executable.

After completing that setup, launch from the toolset root:

```bash
TOOLSET_ROOT="$PWD"
(cd host/pi && env -u PI_PACKAGE_DIR ./pi-test.sh --no-extensions \
  -e "$TOOLSET_ROOT/extensions/whimsical-activity/index.ts")
```

This loads only the local Whimsical entry for that session, without registering it in your global settings. Your usual Pi model/auth configuration still applies. Open Pi's settings menu, then **Activity indicator**, to customize the display.

### Install the published npm package

The package is available as [@zenstudiolab/pi-toolset](https://www.npmjs.com/package/@zenstudiolab/pi-toolset). If you already have the compatible patched host, register the published version with Pi's package manager—not `npm install -g`:

```bash
pi install npm:@zenstudiolab/pi-toolset@0.1.1
pi list
```

Here, `pi` must run your compatible patched host. If your `pi` command still points to stock Pi, use the source launcher instead, from the toolset root:

```bash
env -u PI_PACKAGE_DIR ./host/pi/pi-test.sh install npm:@zenstudiolab/pi-toolset@0.1.1
env -u PI_PACKAGE_DIR ./host/pi/pi-test.sh list
env -u PI_PACKAGE_DIR ./host/pi/pi-test.sh
```

Restart the patched host after installation. For this registered-package launch, do not add `--no-extensions` or the local `-e` entry: the former suppresses package loading and the latter can load a second copy. Unlike the isolated first-time launch, this launch also loads your other configured extensions.

Installation is personal/global by default. To register only for one project, run the install command from that project's directory with `--local`; Pi loads project packages only after project trust is granted. Do not install both the local checkout and npm package as separate copies.

### Update or remove

The `@0.1.1` command pins that version. To follow new releases instead, install the unversioned source, then update it when desired:

```bash
pi install npm:@zenstudiolab/pi-toolset
pi update npm:@zenstudiolab/pi-toolset
```

Check each release's host compatibility before upgrading. Updating the package does not update or reapply the host patch. With the source launcher, replace `pi` in these commands with `env -u PI_PACKAGE_DIR /absolute/path/to/pi-toolset/host/pi/pi-test.sh`.

To remove a pinned installation:

```bash
pi remove npm:@zenstudiolab/pi-toolset@0.1.1
```

For an unversioned installation, omit `@0.1.1`. For a project-local installation, add `--local` and run from that project. Restart the host afterward. Removal unregisters the package; it does not reverse the host patch. For a temporary disable, turn **Activity indicator → Enabled** off in Pi's settings.

### Troubleshooting

- **Unsupported-host warning:** your running Pi lacks the native activity API. Prepare and launch the patched source host; reinstalling the npm package cannot add that API.
- **No indicator:** use an interactive TTY session on the patched host, confirm the package appears in `pi list`, and check that Activity indicator is enabled. Print, JSON, RPC, and redirected modes intentionally show no decoration.
- **Competing registration:** remove the duplicate local, GitHub, or npm installation and restart with one Whimsical entry.

## Development

Use Node >=22.19.0. First prepare `host/pi` as documented in the [integration guide](extensions/whimsical-activity/host-patch/README.md): root typechecking verifies compatibility against its actual source API.

Then, from this repository root:

```bash
npm ci --ignore-scripts
env -u PI_PACKAGE_DIR npm run check
```

Development dependencies remain pinned to the original 0.87.1 packages for unsupported-host regression checks. They do not supply the new native activity API. Runtime uses the patched 0.99.2 source host, not those development packages. Peer dependency ranges do not imply support for stock Pi.

```text
extensions/whimsical-activity/             Extension and its host-integration patch
test/whimsical-activity/                   Existing extension regression suites
test/fixtures/                            Pinned bank verification input
host/pi/                                  Local upstream checkout; ignored, never published
```

Dependency installation scripts are disabled. The documented source tests use offline faux providers; no live provider calls are required. Internal review logs, agent session files, local configuration, and the original checkout history are not published.

## License

Original contributions are MIT licensed. See [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for the upstream Pi attribution and redistribution requirements.
