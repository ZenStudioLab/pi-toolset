# Whimsical Activity

Local words from a fixed 100-entry bank on Pi's native working surface. No network dictionary, generated words, prompt inspection, tool changes, or provider-request changes.

## Compatibility and installation

**Version 0.1.2 adds stock Pi support.** Follow the [installation instructions](../../README.md#installation) to install with `pi install npm:@zenstudiolab/pi-toolset`. No patch or host source checkout is needed on stock Pi. Versions 0.1.0 and 0.1.1 remain host-only.

Stock **0.99.2** was qualified with real released-host lifecycle and native rendering using offline activity. Published **0.87.1** has loader/runner coverage, not full interactive render qualification. The optional advanced integration is qualified only against Pi **0.99.2**, base `005af57d88ee23b33778f343a9595b32e67ff788`, with the [supplied patch](host-patch/README.md). Node 22.19.0 was used for qualification.

At session start, a callable advanced registration API selects the advanced path, including when the host declines registration. Otherwise public working-message and indicator setters select stock. Hosts missing required public setters warn once and retain native presentation. Print, JSON, RPC, redirected, non-TTY, and no-UI sessions remain silent no-ops.

## Stock and advanced behavior

| Feature | Stock Pi | Optional advanced host |
| --- | --- | --- |
| Words | One word per agent loop; stable through its turns/tools | Whimsical / Operational / Both text modes |
| Normal animation | Pi's native spinner | Selectable presets and random mode |
| Delay / rotation | No extension delay or rotation timers | 250 ms initial delay; rotation every eight visible-busy seconds |
| Reduced | Static ASCII `*` with one word | Native reduced-motion policy |
| Plain | Literal native `Working`, no glyph or bank allocation | Literal native text, hidden decoration |
| ASCII | Whimsical suffix `...` instead of `…` | Label and metadata punctuation; no change to native messages/preset glyphs |
| Settings / colors | Invocation flags only; no saved settings or palette | Native saved submenu, presets and colors |
| Elapsed / action / output tokens | Not added | Observed foreground metadata; no estimates |
| Layout | Normal native text fitting; word may disappear at narrow widths | Fixed decoration slot and omission priority |
| Wait / ownership | Native surfaces remain in control; no exclusive setter ownership or synchronous wait guarantees | Synchronous scoped host arbitration |

Both paths reuse the same shuffled bank with no immediate repeat, including across session replacements in one loaded runtime. Stock constructs the bank only when its first normal/reduced loop begins. End, cancellation, session replacement, and shutdown reset only the message/indicator controls it changed. Repeated start/end/cleanup is safe. A malformed bank warns once and leaves native text; reduced/plain indicator choices still apply.

Stock does not replace the editor, footer, or widgets, and does not write retry/compaction surfaces or intercept input. Pi's normal layout and cancellation controls remain native. **Shared-setter limitation:** another extension writing working text or frames can overwrite Whimsical, or have its value reset by cleanup. There is no public previous-value getter. Prefer one owner of those setters; restoration means host defaults, not preservation of another extension's values.

## Invocation controls

- `--no-whimsical-activity` silently disables decoration, even with an invalid display flag. Stock performs no writes or bank/timer allocation.
- `--activity-display normal|reduced|plain` selects stock motion or overrides advanced saved motion. Invalid values disable decoration with one warning.
- `--activity-ascii` uses ASCII punctuation as described above.

For example, from the toolset checkout:

```bash
pi --no-extensions -e "$PWD/extensions/whimsical-activity/index.ts" \
  --activity-display reduced --activity-ascii
```

Boolean flags can consume a following positional prompt under Pi's parser. Put `--` before positional prompts, for example `--activity-ascii -- 'Do task'`. Absent flags inherit native saved preferences on advanced hosts; stock defaults to normal motion and Unicode punctuation.

## Optional advanced settings

The patch adds a native **Activity indicator** settings submenu:

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

Meaningful native messages, retries, compaction, cancellation hints, and input/permission waits retain priority. The host owns persistence, render surfaces, and observations. Metadata reports real top-level activity and provider-reported main-response output; it never estimates tokens or infers Thinking. Unavailable or zero output is omitted.

Roomy advanced displays can show `39s · Running bash · ↓913 tokens`. Narrow layouts omit tokens, elapsed, action, then whimsy before sacrificing operational text. Waiting, disabled, hidden, plain, idle, and unloaded states do not retain decoration timers.

## Disable and remove

Pass `--no-whimsical-activity` for either path. Advanced users can also turn **Activity indicator → Enabled** off. For a local trial, omit the explicit entry next time; reloading a still-configured entry loads it again. For a registered package, follow the [root removal instructions](../../README.md#installation) and restart Pi. Removal does not reverse the optional host patch.

Do not load local/GitHub/npm copies together. Check `pi list`, remove the unwanted source from its personal or `--local` scope, and restart with one entry. A local file and an npm package are not deduplicated as the same source.

## License

Original contributions are MIT licensed under the [root license](../../LICENSE). Host-derived portions retain the [upstream Pi MIT notice](host-patch/LICENSE.pi); see [third-party notices](../../THIRD_PARTY_NOTICES.md).
