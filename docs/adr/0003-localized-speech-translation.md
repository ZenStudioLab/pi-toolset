# ADR-0003: Isolated Translation for Configurable Speech Locale

**Status:** Accepted for implementation; translation runtime qualification pending.
**Owner:** Orchestrator.
**Change:** [add-manual-speak-extension](../../openspec/changes/add-manual-speak-extension/design.md).
**Supersedes:** [ADR-0002](0002-manual-speech-egress-boundary.md) only in its restriction to one TTS network origin and no inference. All other decisions remain applicable.

## Context

The user wants English written Pi answers and Vietnamese narration by default, with a configurable speech locale. Selecting a Vietnamese voice does not translate English text. Faithful translation requires a separate inference step before TTS, distinct from the deferred summary feature.

## Decision

Use an explicitly configured authenticated Pi registry provider/model for a separate, tool-free translation call only on localized `/speak`. Default `locale` to `vi`. Do not inherit Pi's coding model, change its prompts, tools, language, messages, or model, or add a turn with `sendUserMessage`. Send only the cleaned selected answer as data and a translation instruction.

Keep `/speak original` and `/speak text` untranslated, and replay cache-only. Check configuration, authentication, source limits, and player before inference. Bound the translation with a deadline, finite output cap, and no automatic retry, model substitution, summary, or original-language fallback. The existing speech job owns cancellation and prevents late results from affecting a replacement job.

Translations are cached only in bounded session memory keyed by source, locale, model/settings and prompt version. Audio remains in the private disk cache keyed by final text, speech locale, and TTS inputs. Nothing runs at extension load. Preserve ADR-0002's manual-only, secret, playback, publication, and cache/privacy boundaries.

## Consequences

Users must explicitly choose a translation model and accept its inference cost and answer disclosure to that provider, separately from ElevenLabs TTS. Missing setup fails clearly and points to the original/literal commands. An existing config without locale defaults to Vietnamese; it no longer silently narrates English via bare `/speak` without translation setup.

Local cache hits reduce calls but are not authoritative billing records; inference may be required again after restart. Structural validation cannot prove linguistic fidelity. Offline fixtures qualify isolation, limits, routing, caching and cancellation; bilingual listening and real account charges remain separate authorized checks. Existing approval for one TTS test does not authorize translation tests.

## Alternatives

- Changing Pi's conversation language violates the user's English-output preference.
- Asking the main agent to translate adds a conversation turn and alters its workflow.
- Selecting another TTS voice does not translate text.
- Automatic model selection obscures cost and disclosure.
- A general summarization or multi-provider framework is unnecessary for faithful localized speech.
