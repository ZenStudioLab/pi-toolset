# ADR-0010: Live Voice Conversation

**Status:** Accepted for implementation; runtime qualification pending (task 3.4 of `add-speak-live-conversation`).
**Owner:** Orchestrator.
**Change:** [add-speak-live-conversation](../../openspec/changes/add-speak-live-conversation/design.md), with the amendment of 2026-10-15 (live stop phrase, design D12).
**Supersedes:** while live mode is on, and only then, [ADR-0002](0002-manual-speech-egress-boundary.md)'s rule that nothing is spoken unless the user runs a `/speak` subcommand, and [ADR-0004](0004-voice-input-and-provider-choice.md)'s exclusion of an open microphone and of automatic speech, and ADR-0004's "no spoken commands" rule, for the live stop phrase only, which can only end live mode. While live mode is on, it also sets aside ADR-0004's choice of input and speech provider (live mode always uses ElevenLabs) and [ADR-0008](0008-hold-space-to-talk.md)'s Space holds (refused while live). Outside live mode all of these stand unchanged, and every other decision in ADR-0002 through ADR-0008 remains in force.

## Context

The speak extension handles one voice action at a time: push-to-talk in, `/speak` out. The user wants a hands-free, back-and-forth conversation with Pi itself, with Pi's context, tools, and repository behind every answer, rather than a separate voice agent that lacks them. The user wears headphones when needed, speaks Vietnamese and English, and accepted that misheard speech can act through Pi's tools while this mode is on.

`transcendr/pi-realtime` showed a workable shape: the voice side only listens and speaks, and Pi does the thinking. A static review (commit `55390ce4`) found it has no license, records from the terminal only on macOS (`ffmpeg -f avfoundation`), and requires OpenAI.

The trust boundary is the one in ADR-0004: one user's own machine and the services that user chose.

## Decision

Add an explicit opt-in **live mode** to `extensions/speak/`. `/talk live` turns it on and `/talk live` again turns it off. Nothing else starts it, and it never survives a reload, restart, or session replacement.

- **Open microphone, only while live.** Microphone audio streams to ElevenLabs live transcription for as long as live mode is on. Each stretch of speech that ends with a pause is sent to Pi as one plain user message, under `input.sendWhenBusy` as in [ADR-0005](0005-voice-send-and-session-locale.md). The composer is left alone, and no slash command, template, or skill runs.
- **Pi chooses what is spoken.** A model-callable `speak_aloud` tool, active only while live mode is on, synthesizes the text Pi writes, without a `/speak` command. Pi writes it in the language the user just spoke, so there is no translation step.
- **ElevenLabs in both directions.** It is the only provider here with live transcription and voices that follow the user between languages. Live mode ignores the input and speech provider choices of ADR-0004.
- **Muted while Pi speaks, by default.** From playback start until 500 ms after it ends, silence is sent in place of microphone audio, so Pi never hears itself. The send key or `/speak stop` cuts Pi off. `input.liveListenWhileSpeaking` keeps the microphone live for voice barge-in, for headphones or system echo cancellation.
- **Bounded streaming.** `input.liveIdleMinutes` (default 5) ends live mode when nothing happens, and a status line is shown for as long as it is on. A connection failure ends live mode without retry or reconnect.
- **Ending by voice (amendment of 2026-10-15).** Saying a live stop phrase as a whole turn ends live mode exactly as `/talk live` does. The phrases are in `input.liveStopPhrases`, default "Dừng cuộc hội thoại" and "Stop the conversation", and `[]` turns this off. Case, punctuation, and diacritics are ignored, and a turn that contains a phrase among other words is sent to Pi as usual. The extension handles the phrase itself and never sends it to Pi. It is the only spoken command in live mode, and it can only end live mode, never start or run anything.
- **Idea borrowed, code not.** pi-realtime's split between a thin voice layer and Pi as the brain is adopted; none of its code or dependencies are.

## Consequences

- **Audio leaves continuously while live.** Everything the microphone hears, except during muted playback, goes to ElevenLabs. Neither tier is a zero-retention guarantee. Ending live mode is the way to stop streaming. The README says so.
- **Spend is less predictable** than with explicit `/speak`. The connection is billed while open, and every update is a synthesis request. The idle limit, the status line, and the off-by-default design bound it.
- **A misheard turn can act through Pi's tools.** The user accepted this for live mode. Turns are plain text that never run commands, and text with no letter or digit is dropped.
- **The model may forget or overuse the tool.** The written answer remains the full record; there is no automatic fallback speech.
- **The push-to-talk stop phrase of [ADR-0006](0006-spoken-stop-phrase.md) has no effect in live mode.** Each pause already ends a turn. Live mode has its own stop phrases, which end live mode instead of sending. A misheard turn that equals one ends live mode early. That is harmless, because nothing is sent and `/talk live` restarts it. While Pi speaks with the microphone muted, a stop phrase is not heard. Push-to-talk keys and Space holds ([ADR-0008](0008-hold-space-to-talk.md)) are refused while live, except that the send key cuts Pi off.
- **Mocked tests cannot prove echo, turn-taking, or recognition quality.** A user-run live check with speakers and headphones qualifies them.

## Alternatives

- **Keep ADR-0002's manual-only rule.** ADR-0002 rejected "a model-callable speech tool" because it removes the explicit-request guarantee. Live mode keeps that guarantee at the mode level instead: the user's `/talk live` is the explicit request, and outside live mode the tool is never declared.
- **Adopt pi-realtime.** No license, macOS-only terminal capture, OpenAI only.
- **OpenAI Realtime.** Breaks ADR-0004's two-provider choice and costs more per minute.
- **Hosted ElevenLabs or Deepgram voice agents.** They run their own model and would need a local OpenAI-style server to reach Pi, losing Pi's context.
- **Speak every answer automatically.** Long technical answers read aloud poorly; Pi choosing short spoken updates keeps the written answer as the record.
- **Keep the microphone open during playback by default.** Without headphones or echo cancellation, Pi's own voice would be sent as turns.
