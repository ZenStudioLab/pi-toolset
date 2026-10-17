# Pi Toolset

ZenStudioLab's extensions and tools for [Pi](https://github.com/earendil-works/pi), the terminal coding agent. Each one is small, does one job, and loads only when you ask for it. This repository is not a distribution or fork of the Pi host.

## Extensions

Eleven extensions live here. Six are part of this repository; five are separate repositories pulled in as [git submodules](#getting-the-code), so each can be used and versioned on its own. A sixth submodule, `extensions/pi-claude-bridge`, is a fork of the Claude bridge kept for [Compaction Model](#compaction-model).

| Extension | What it gives you | How you use it | Where it lives |
| --- | --- | --- | --- |
| [Whimsical Activity](#whimsical-activity) | A calm busy indicator with a playful word instead of a bare "Working…" | Automatic; flags `--activity-display`, `--activity-ascii`, `--no-whimsical-activity` | This repo, published to npm |
| [Subagent Profiles](#subagent-profiles) | A read-only viewer for saved subagent model profiles | `/subagents-show-profile [name]` | This repo, published to npm |
| [Session Title](#session-title) | Name the session, and the Herdr tab with it | `/title [name]` | This repo |
| [Session Delete](#session-delete) | Delete a session safely, via the system trash | `/delete-session` | This repo |
| [Tool Block Borders](#tool-block-borders) | Themed left rail around Bash call and output blocks | Automatic once loaded | This repo |
| [Compaction Model](#compaction-model) | Compaction summaries written by a model and thinking level you choose, with the chat model unchanged | `~/.pi/agent/compaction-model.json` | This repo |
| [Speak](#speak) | Hear answers aloud and dictate prompts by push-to-talk | `/speak`, `/talk`, `alt+t` | Submodule: [pi-speak](https://github.com/ZenStudioLab/pi-speak) |
| [pi-bookmark](#pi-bookmark) | A short, global list of sessions worth resuming | `/pin`, `/unpin`, `/bookmarks`, `ctrl+shift+b` | Submodule: [pi-bookmark](https://github.com/ZenStudioLab/pi-bookmark) |
| [Subscription Usage](#subscription-usage) | Your subscription quota across providers in one view | Automatic once loaded | Submodule: [pi-subscription-usage](https://github.com/ZenStudioLab/pi-subscription-usage) |
| [OpenCode Bridge](#opencode-bridge) | OpenCode models as an opt-in Pi provider | `/opencode-settings` | Submodule: [pi-opencode-bridge](https://github.com/ZenStudioLab/pi-opencode-bridge) |
| [OpenAI Codex Fast](#openai-codex-fast) | A priority-tier variant of the built-in `openai-codex` provider | Select `openai-codex-fast/<model>` | Submodule: [pi-openai-codex-fast](https://github.com/ZenStudioLab/pi-openai-codex-fast) |

Nothing here changes Pi on its own. An extension runs only after you load it (see [Loading an extension](#loading-an-extension)), and none of them edits your prompts, tools or provider requests unless its description below says so.

### Presentation

#### Whimsical Activity

Replaces Pi's generic "Working…" label with a calm animated indicator and a word picked from a bundled bank of 100 short words. On stock Pi it shows one word per agent loop beside Pi's native spinner and adds no timers or settings. On a patched host it adds saved settings, animation presets, word rotation and observed metadata. Flags: `--no-whimsical-activity`, `--activity-display normal|reduced|plain`, `--activity-ascii`. It does nothing in print, JSON, RPC or non-terminal sessions.

Full guide: [extensions/whimsical-activity](extensions/whimsical-activity/README.md). Install the published package with `pi install npm:@zenstudiolab/pi-toolset` (see [Installation](#installation)). The design history is in [ADR-0001](docs/adr/0001-hybrid-activity-compatibility.md), [ADR-0009](docs/adr/0009-native-activity-decoration.md) and the OpenSpec changes `add-whimsical-activity-indicator` and `add-stock-pi-activity-support`.

#### Tool Block Borders

Wraps Pi's Bash call and output in a single `┃` left rail with light padding, using the active theme's tool-background colors. The rail uses the theme's accent color normally and its error color when a command fails. Pi still runs Bash and renders its output, including streaming, truncation notices, timing and expansion, so the commands behave exactly as before. It covers Bash only, handles fullscreen, theme changes and narrow terminals, and skips itself with a warning if another extension already customizes Bash.

Source: [extensions/tool-block-borders](extensions/tool-block-borders). Design: OpenSpec change `add-themed-bash-block-borders`.

### Sessions

#### Session Title

`/title [name]` sets the session's name. Run it with no name to type one in a dialog. Inside Herdr, it also relabels the Herdr tab through the `herdr` command-line tool. Outside Herdr it only names the session and says so. Names are cut to one line of at most 120 characters, so a stray newline cannot reach the tab label. It needs an interactive session or an RPC client that supports dialogs.

Source: [extensions/session-title](extensions/session-title).

#### Session Delete

`/delete-session` asks for confirmation, opens a fresh session, then moves the old transcript to the system trash. It never deletes permanently, refuses to run while a response is in progress, and checks that the file still belongs to the session you selected before touching it. It needs the `gio` command (from GLib) to reach the system trash, and an interactive session or an RPC client that supports confirmation dialogs.

Source: [extensions/session-delete](extensions/session-delete).

#### pi-bookmark

Pi's built-in `/resume` lists every session you ever started. pi-bookmark keeps a short, global list of the ones you want again. `/pin [note]` bookmarks the current session, `/bookmarks [query]` opens a picker of pinned sessions only, `/unpin` removes the pin, `/pin prune` drops pins whose files are gone, and `ctrl+shift+b` toggles the pin. The model can pin a session only when you ask it to.

A fork of [vaultboy001/pi-bookmark](https://github.com/vaultboy001/pi-bookmark), whose upstream is published on npm as `pi-bookmark`. Guide: [extensions/pi-bookmark](extensions/pi-bookmark/README.md).

### Speech

#### Speak

Hear a Pi answer in a language you choose (default `vi`), or speak any text you type, through ElevenLabs or Deepgram Aura. Dictate a prompt by push-to-talk: `alt+t` sends it as soon as it is transcribed and `alt+shift+t` only adds the text to the composer for review. `alt+m` and `alt+i` turn a spoken command or skill name into text in the editor, and an optional setting lets you hold Space to dictate. Nothing is translated, spoken, recorded or sent anywhere unless you run `/speak` or `/talk`, press a shortcut, or turn on hold-Space. You supply your own provider keys, a voice you are authorized to use, a local audio player, and a recorder for voice input.

Guide: [extensions/speak](extensions/speak/README.md). Design: [ADR-0002](docs/adr/0002-manual-speech-egress-boundary.md) through [ADR-0008](docs/adr/0008-hold-space-to-talk.md) and the OpenSpec changes `add-manual-speak-extension` and `add-speak-voice-input`.

### Models and providers

#### OpenAI Codex Fast

Adds an `openai-codex-fast` provider that delegates to Pi's built-in `openai-codex` with `serviceTier: "priority"`. Pick `openai-codex-fast/<model>` to use it; ordinary `openai-codex/<model>` selections stay on the default tier. It reuses your existing `openai-codex` login and keeps stored messages in the built-in Codex format. At the pinned revision it requires Pi `>=0.99.1 <0.100.0`; the pinned revision predates upstream's Pi 1.1.0 support, so check the upstream project for newer releases.

A fork of [2h2d-co/pi-openai-codex-fast](https://github.com/2h2d-co/pi-openai-codex-fast). Guide: [extensions/pi-openai-codex-fast](extensions/pi-openai-codex-fast/README.md).

#### OpenCode Bridge

An opt-in provider that runs an OpenCode runtime the bridge owns, while Pi keeps executing tools. Models whose name contains "free" appear automatically; `/opencode-settings` lets you enable others, with a confirmation before any paid or unknown-price model. Credentials are read into memory and passed only to the private child process, and OpenCode plugins are never loaded. It needs an `opencode` executable on your PATH. It is qualified against Pi 1.0.4 and OpenCode 1.18.29, and only one model has passed a live smoke test, so treat other models as discovered but not proven.

Guide: [extensions/pi-opencode-bridge](extensions/pi-opencode-bridge/README.md).

#### Subscription Usage

Shows the active account's subscription quota in one consistent view for OpenAI (ChatGPT) plan limits, OpenAI Codex, OpenCode Go, Grok and Kimi Coding. It never rewrites model requests.

A fork of [specode/pi-subscription-usage](https://github.com/specode/pi-subscription-usage). Guide: [extensions/pi-subscription-usage](extensions/pi-subscription-usage/README.md).

#### Subagent Profiles

`/subagents-show-profile` with no name shows every profile saved in `~/.pi/agent/profiles/pi-subagents/`; `/subagents-show-profile <name>` shows one. Each profile lists its default model, whether subagents start asynchronously, and every agent's model, thinking level and fast flag. The command only reads those files and never changes them, so it is a safe way to check what a profile sets.

Source: [extensions/subagent-profiles](extensions/subagent-profiles). It ships in the published npm package.

#### Compaction Model

Writes every compaction summary with the first working model in the priority list in `~/.pi/agent/compaction-model.json` — for example Sonnet 5.5, then Haiku 5.5, summarizing an Opus session — each with its own thinking level, while the chat keeps its own model and thinking level. `"thinkingLevel": "auto"` lets the Jev decision model choose `low`, `medium`, or `high`. A model that is unavailable, too small for the material, or whose request fails is skipped with a warning and the next is tried; when the config is invalid or every model fails, Pi's default compaction runs. Load it as the last entry of `settings.json` `extensions`; Claude bridge sessions need the bridge from the `extensions/pi-claude-bridge` submodule, and `openai-codex` sessions are left to `@tian.zuo/pi-compact`.

Guide: [extensions/compaction-model](extensions/compaction-model/README.md). Design: OpenSpec change `add-compaction-model`.

## Getting the code

Five extensions are submodules, so clone with them:

```bash
git clone --recurse-submodules https://github.com/ZenStudioLab/pi-toolset.git
```

If you already cloned without them, run `git submodule update --init --recursive` from the repository root. Initializing a submodule only downloads its files. It does not load anything or change your Pi settings.

## Loading an extension

Only Whimsical Activity and Subagent Profiles ship in the npm package. Every other extension is loaded from a checkout. For a one-off trial, pass its entry file:

```bash
pi -e "$PWD/extensions/session-title/index.ts"
```

To load it every time, add the same absolute path to the `"extensions"` list in `~/.pi/agent/settings.json`. Load each extension once, and avoid combining a local path with a package copy of the same extension. Each submodule's own README covers its setup, such as provider keys for Speak or the `opencode` tool for the bridge.

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

For native saved settings, animation presets/colors, timed word rotation, width reservation, synchronous wait arbitration, and observed metadata, follow the [advanced host guide](extensions/whimsical-activity/host-patch/README.md). The guide documents exact patched 0.99.2 and 1.1.0 bases and their verification limits. If the advanced registration API exists, it is authoritative even when it declines registration; stock never becomes a competing fallback.

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

Advanced **1.1.0**, base `abe508e1b89912adde45528136c3221eb69acdd7` plus supplied patch, was checked separately with Node 24.3.0: the host quality check passed, along with 2,918 coding-agent tests (50 skipped) and 351 toolset tests. See the [advanced qualification notes](extensions/whimsical-activity/host-patch/README.md#qualification) for broader-suite failures and manual-verification limits.

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

Original contributions are MIT licensed. See [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for upstream Pi attribution and redistribution requirements. Each submodule carries its own MIT license and notices, including the three forks above, which keep their upstream authors' copyright.
