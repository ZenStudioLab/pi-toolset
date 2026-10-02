# Whimsical Activity

A local, fixed-bank activity indicator on Pi's native foreground status surfaces. It adds activity words, selectable animation, and optional elapsed time, observed action, and provider-reported output tokens without changing model prompts or tool execution.

## Compatibility and setup

This extension currently requires the [supplied native host patch](host-patch/README.md) against Pi v0.99.2. Stock installed Pi and the pinned 0.87.1 development packages do not expose the required API. On an unsupported interactive host it warns once and keeps native UI; print, JSON, RPC, redirected, and non-TTY modes are silent no-ops.

Follow the [setup and launch guide](host-patch/README.md). Cloning or installing the extension package alone does not modify Pi.

## Behavior

The native Activity indicator settings menu controls:

| Setting | Choices | Default |
| --- | --- | --- |
| Enabled | On / Off | On |
| Activity text | Whimsical / Operational / Both | Whimsical |
| Animation | Asterisk, Braille, Dots, Orbit, Arc, Diamond, Pulse, Blocks, Classic, Bounce, Random | Asterisk |
| Random timing | Once per run / Periodically | Once per run |
| Color | Theme / Claude terracotta | Theme |
| Motion | Normal / Reduced / Plain | Normal |
| ASCII punctuation | On / Off | Off |
| Elapsed time | On / Off | On |
| Current action | On / Off | On |
| Output tokens | On / Off | On |

Words come from the bundled 100-entry JSON bank, with a shuffled bag and no immediate repeat across bag boundaries. Default generic activity appears after 250 ms and rotates words every eight visible-busy seconds. There is no network dictionary, LLM generation, or prompt inspection.

Meaningful native messages, retries, compaction, cancellation hints, and input/permission waits retain priority. Reduced freezes decorative motion; Plain keeps literal native text. The host owns settings persistence, render surfaces, and observations. Metadata reports real top-level activity and reported main-response output; it never estimates tokens or infers Thinking. Unavailable or zero output is omitted.

Roomy displays can show `39s · Running bash · ↓913 tokens`. Narrow layouts omit tokens, elapsed, action, then whimsy before sacrificing operational text. Waiting, disabled, hidden, plain, idle, and unloaded states do not retain decoration timers.

## Invocation overrides

- `--no-whimsical-activity` silently disables the feature for that invocation.
- `--activity-display normal|reduced|plain` overrides saved motion.
- `--activity-ascii` uses ASCII label and metadata punctuation without changing native messages or preset glyphs.

Boolean flags can consume a following positional prompt under the host's existing parser. Put `--` before positional prompts, for example `--activity-ascii -- 'Do task'`.

## Disable and remove

Turn Enabled off in the native settings menu, or pass `--no-whimsical-activity`. For the isolated source launch, omit the explicit extension entry on the next launch. Reloading a still-configured entry reloads it; it is not an unload action. Removing the extension does not automatically reverse the host patch.

## License

Original contributions are MIT licensed under the [root license](../../LICENSE). Host-derived portions retain the [upstream Pi MIT notice](host-patch/LICENSE.pi); see [third-party notices](../../THIRD_PARTY_NOTICES.md).
