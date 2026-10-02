# ADR-0002: Manual-Only Speech Extension With an Explicit Cloud Egress Boundary

**Status:** Accepted for implementation; runtime qualification pending.
**Owner:** Orchestrator.
**Change:** [add-manual-speak-extension](../../openspec/changes/add-manual-speak-extension/design.md).

## Context

The package has so far contained presentation code only: no component makes outbound network requests, and the repository's test helpers assert that. The user wants to hear Pi answers in their own authorized cloned ElevenLabs voice. That requires sending text to a third-party paid service, which spends allowance and discloses the text to that service.

The trust boundary is small and concrete: the user's own Pi answers, a service the user chose, and a single-user local machine. It is not a public multi-user system, so safeguards are sized to that boundary and not to a hostile-input model.

## Decision

Add `extensions/speak/` as a separate, manual-only extension. Nothing is spoken, summarized, or transmitted unless the user runs a `/speak` subcommand that produces speech; load, reload, prompts, tools, and agent completion are silent and make no request. Lifecycle events may only cancel the extension's own work.

Network egress is confined to one fixed HTTPS origin, authenticated with a key read only from `ELEVENLABS_API_KEY`, with redirects rejected, a total deadline, a response-size cap, and no automatic retry or provider fallback. Audio is cached in a private per-user directory keyed by every input that affects it, so a cache hit or replay makes no request. Playback uses a configurable local player started without a shell, and `/speak stop` cancels only this extension's generation and player.

The extension is not added to the published package's `pi.extensions` or `files` list by this decision. Publishing it is a separate, later decision because it would add a network-capable command for every installer.

Deferred, with details kept in the change design: `/speak summary`, confirmation tiers for long text, secret-pattern blocking, `/speak cache-clear`, and usage accounting.

## Consequences

Users must configure a voice they are authorized to use, supply a restricted API key, and accept that prepared text leaves the machine on each cache miss. The tier used is not a zero-retention guarantee. Other same-user processes and other Pi extensions run with the Pi process's permissions and can read the environment, configuration, and cache; the README states this limit instead of attempting to defend against it.

Without secret-pattern blocking in this version, a user can speak text that contains a credential. The single hard length limit and the explicit-request rule bound the exposure; the deferred capability is documented for a later specification.

Mocked tests will not prove the real account, voice, or audio session. A single live check of a non-sensitive sentence, run by the user, qualifies those.

## Alternatives

- Automatic narration or a model-callable speech tool would remove the explicit-request guarantee and make spend and disclosure unpredictable.
- A local text-to-speech model avoids egress but does not use the user's cloned voice and adds a heavy runtime.
- Registering the extension in the published package now would change behavior for all installers without the user's decision.
- Streaming playback, multiple providers, and a persistent voice daemon add machinery that no current requirement needs.
