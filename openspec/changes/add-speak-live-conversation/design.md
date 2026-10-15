# Design

## Context

See `proposal.md` for the motivation and `specs/voice-conversation/spec.md` for the behavior. The approach rests on four existing pieces of `extensions/speak/`:

- **`realtime.ts`** already opens the ElevenLabs live transcription connection (`openRealtime`) with pause-based commits (`commit_strategy: vad`, 1 s of silence) for the spoken stop phrase. `RealtimeSession.text` joins committed segments, `RealtimeHandlers` reports only commits and failures, and `partial_transcript` messages are ignored.
- **`record.ts`** `startRecorder` streams chunks through `onChunk`, but it also keeps every chunk in memory and stops at `maxSeconds` (at most 300). Both suit push-to-talk. Neither suits a session that can last an hour.
- **`speech-job.ts`** (659 lines) `SpeechController` runs one job at a time with a pinned provider override, a stop path, `stopOwnAudio()`, and a `speechBlock` hook that `talk.ts` uses to refuse `/speak` during a recording.
- **`talk.ts`** (468 lines) `TalkController` owns the push-to-talk microphone state (`Starting | Recording`). `talk-delivery.ts` sends through `pi.sendUserMessage` with `expandPromptTemplates: false` and maps `input.sendWhenBusy` to `steer`/`followUp`.

The Pi host provides what the tool needs. `pi.getActiveTools()` and `pi.setActiveTools()` decide which tools are declared to the model, and a tool's `promptGuidelines` enter the system prompt only while it is active (`host/pi/packages/coding-agent/src/core/extensions/types.ts`). Four host facts in `host/pi/packages/coding-agent/src/core/agent-session.ts` constrain the design:

- **H1:** A tool registers active unless `defaultActive: false`. The installed 1.x hosts honor it. The 0.87.1 types that `pi-speak` type-checks against lack it, and `pi-speak`'s peer range is `*`.
- **H2:** On session construction and after tree navigation, the host restores the recorded tool set (`_restoreToolsFromTranscript`). Names not yet registered, such as MCP tools whose servers are still connecting, stay pending and activate when they register.
- **H3:** A `setActiveTools` call that deactivates any tool clears that pending set. A call that only adds keeps it.
- **H4:** Each agent run clears the pending set at its start (`_runAgentPrompt`). A `setActiveTools` call made in a `before_agent_start` handler applies to the run that is starting.

## Goals / Non-Goals

**Goals:**

- Live mode reuses the existing connection, recorder, synthesis, cache, and player paths. It adds no second transport and no second speech pipeline.
- Each piece of state has one owner. Live mode owns its session, `TalkController` keeps owning push-to-talk, and `SpeechController` keeps owning the running speech job.
- Files this change creates stay under 500 lines. A file it extends that is already over 500 lines (`speech-job.ts`) is split along a clean responsibility boundary when one exists, as the large-files rule requires. When none exists, it grows only by the minimal live entry point, and the reason is recorded in the task result.

**Non-Goals:**

- Tuning the turn-ending pause beyond the existing 1 s, or making it configurable.
- Measuring cost inside the extension; `/speak quota` stays the only account view.

## Decisions

### D1. Borrow pi-realtime's split, not its code

The voice side only listens and speaks, and Pi stays the brain, as in pi-realtime's "eco mode." That project is not adopted: it has no license, its terminal recording uses macOS-only `ffmpeg -f avfoundation`, and it requires OpenAI. **Alternatives:** OpenAI Realtime breaks ADR-0004's two-provider choice and costs more per minute. Hosted ElevenLabs or Deepgram agents run their own model and would need a local OpenAI-style server to reach Pi.

### D2. ElevenLabs in both directions

Live mode reuses `openRealtime` exactly as the stop phrase does, plus ElevenLabs synthesis with the configured voice. Deepgram has no live path in this extension, and its Aura voices each speak one language, so they cannot follow the user between Vietnamese and English. A live job pins the provider to `elevenlabs` through the job's existing provider override, so `/speak provider` and `/talk provider` do not affect live mode.

### D3. One tool, activated only while live

`speak_aloud(text)` is registered with `defaultActive: false` (H1). The definition is passed as an object typed `ToolDefinition & { defaultActive?: boolean }`, so the 0.87.1 types accept it and pre-1.0 hosts ignore the property.

The extension changes the active tools at three points and nowhere else:

- **Live mode starts:** it adds the name with `setActiveTools([...getActiveTools(), "speak_aloud"])`. An add-only call keeps pending tools (H3).
- **Live mode ends:** it removes the name, only if the tool is active.
- **An agent run starts:** a `before_agent_start` handler removes the name when live mode is off and the tool is active. That happens only after the host restored a recorded tool set (H2), or on a pre-1.0 host that activated the tool on registration (H1). By H4 the removal applies to the run that is starting, and the host is about to drop unregistered pending tools anyway, so nothing that run would have kept is lost.

The extension never calls `setActiveTools` when nothing would change. Loading, reloading, and resuming without live mode therefore leave every other tool, including MCP tools still connecting, untouched. The tool's own "live mode is off" result remains the backstop.

The voice-conversation guidance lives in the tool's `promptGuidelines`, so it enters and leaves the system prompt together with the tool.

**Alternatives:**

- Removing the tool in `session_start` or `session_tree` would clear MCP tools that are still being restored (H3); this was tried in review round 2 and rejected.
- Raising the type dev dependency to 1.x would churn `pi-speak`'s lockfile for one property.
- Rewriting the system prompt in `before_agent_start` would duplicate the activation state and miss steered turns. Pi writes the spoken text in the user's language itself, so live mode needs no translation and no language detection.

### D4. One committed segment is one turn, sent directly

Live mode tracks how much of `session.text` it has already delivered. On each commit it takes the new part, drops it only when it contains no letter or digit (short answers such as "yes" or "ừ" are the heart of a conversation, so no length threshold applies), and calls `pi.sendUserMessage` with `expandPromptTemplates: false`, mapping `sendWhenBusy` the same way `talk-delivery.ts` does. Unlike the push-to-talk send key, it never reads or clears the composer: in a hands-free flow, a half-typed draft should not ride along unnoticed. When a send is refused or fails, the turn is appended to the composer, reusing `TranscriptDelivery`'s append rule.

### D5. A streaming recorder mode

`startRecorder` gains a `retain: false` option: chunks go only to `onChunk` and `onLevel`, nothing is buffered, and no length cap applies. Push-to-talk keeps today's behavior. **Alternative:** restarting a capped recorder every few minutes would leave gaps in the audio and add restart failures.

### D6. Mute by sending silence

From the player's start until a fixed 500 ms after it exits, the `onChunk` handler sends `Buffer.alloc(chunk.length)` instead of the chunk. The tail covers Pi's last words still in the output and recorder buffers. It is a constant, not a setting, and the live check confirms it. The connection keeps receiving audio at the normal rate, so it is never idle, and the provider's pause detection sees silence, which commits any speech that was in progress. **Alternatives:** pausing the stream risks an unknown server idle timeout, and closing and reopening the connection adds about a second of delay to every reply.

### D7. Ordered update queue beside the speech job

A small `LiveSpeech` queue (in the live module) holds waiting texts. It starts the next one through a new `SpeechController.speakLive(text, hooks)` entry point. That entry point skips `speechBlock`, pins ElevenLabs, runs the same preflight, cache, and player path as `speak(text)`, reports when the player starts and exits (for muting and the status line), and resolves when the job ends. Cutting Pi off clears the queue and calls the existing cancel path. The tool's `execute` only enqueues and returns.

### D8. Barge-in via partial transcripts

`RealtimeHandlers` gains an optional `onPartial(text)` for non-empty `partial_transcript` messages. With `input.liveListenWhileSpeaking` on, a partial transcript that arrives while an update is synthesizing or playing triggers the cut-off. With the setting off, audio is silence during playback, so no partial transcript can arrive.

### D9. Idle limit on a coarse timer

A 15-second interval timer checks `ctx.isIdle()`, the queue, and the time of the last sent turn. Agent work or speech resets the clock, so only idle time counts. The timer is cleared when live mode ends.

### D10. File layout and ownership

The new `live.ts` owns the live session: connection, streaming recorder, turn delivery, queue, mute, cut-off, idle timer, and tool activation. `talk.ts` only routes: a press while live is active goes to `live.cutOff()` for the send key and to a refusal otherwise, and `/talk live` calls `live.toggle()`. Each controller checks the other's busy state before starting. A combined `speechBlock` refuses `/speak` while either a recording or live mode is active. `speech-job.ts` is already 659 lines. Before `speakLive` is added, it is inspected for a clean responsibility split, for example status, quota, and help reporting apart from the job runner. It is split where such a boundary exists without changing behavior; test imports may change. If no clean boundary exists, the file keeps its shape, gains only `speakLive`, and the task result records why.

### D11. Flat settings

`input.liveIdleMinutes` and `input.liveListenWhileSpeaking` follow the existing flat `input.*` style (`stopOnPhrase`, `holdSpace`) rather than a nested block.

## Risks / Trade-offs

- **Pi's voice reaching the microphone through speakers when barge-in is on** → it is off by default, muting is the default, and help and README state that the setting needs headphones or echo cancellation.
- **Continuous streaming cost** → the idle limit, a live status line that is always visible, and `/talk live` to end it.
- **The model forgetting to call `speak_aloud`, or overusing it** → tool guidance, a live check in tasks, and the written answer as the full record; there is no automatic fallback speech.
- **A misheard turn acting through Pi's tools** → the user accepted this risk for live mode in ADR-0010. Turns are plain text that never run commands, and text with no letter or digit is dropped.
- **A 1 s pause splitting one thought into two turns** → while Pi is busy, the second turn steers the same run. The live check decides whether a longer pause is needed later.
- **A long session reaching `realtime.ts`'s 1 MiB transcript cap** → that would take hours of speech. Live mode ends cleanly with the existing "too large" message, and the user restarts it.
- **Toggling the tool changes the system prompt** → the prompt cache misses once per toggle, which is acceptable.
- **Ending live mode in a resumed session before its first agent run** clears MCP tools still connecting (H3) → this needs a resume, then `/talk live` on and off within seconds, before any prompt. It is accepted and not guarded; `/reload` restores the tools.
- **Silence frames keep a billed connection open while Pi speaks** → this is the cost of a stable connection. The idle limit bounds the total.

## Migration Plan

Additive and off by default. Users opt in with `/talk live`, and the two new settings are optional. Rollback means not using `/talk live`, or reverting the change. No configuration or data migration is needed. This change archives after `add-speak-voice-input`, whose `voice-input` requirements it modifies.

## Open Questions

- Does ElevenLabs bill live transcription by connection time or by audio sent? This changes only the documentation's cost wording, which a live check settles.
