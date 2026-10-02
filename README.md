# Pi Toolset

ZenStudioLab's extensions and tools for [Pi](https://github.com/earendil-works/pi). Each extension lives in its own directory; this repository is not a distribution or fork of the Pi host.

## Extensions

| Extension | Description | Compatibility |
| --- | --- | --- |
| [Whimsical Activity](extensions/whimsical-activity/README.md) | Local activity words, animation settings, and observed foreground metadata on native status surfaces. | Requires the supplied patch against Pi v0.99.2; stock Pi is not supported for this feature. |

Only Whimsical is included initially. Future extensions can be added under `extensions/<name>/`; add their entry points explicitly to the `pi.extensions` package manifest. Third-party extensions from the original local setup are excluded.

## Installation

Clone this repository, then follow the [Whimsical setup guide](extensions/whimsical-activity/host-patch/README.md) to prepare the required source host. Installing this package alone does **not** patch Pi or enable the feature on an installed release.

The package can be registered from its local directory with `pi install .`. For the isolated, patched-source launch, use the explicit entry point in the setup guide instead. No global Pi settings are changed by cloning or preparing this repository.

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
