# Design

## Context

See `proposal.md` for the motivation and `specs/voice-conversation/spec.md` for the behavior. The approach rests on four existing pieces of `extensions/speak/`:

- **`realtime.ts`** already opens the ElevenLabs live transcription connection (`openRealtime`) with pause-based commits (`commit_strategy: vad`, 1 s of silence) for the spoken stop phrase. `RealtimeSession.text` joins committed segments, `RealtimeHandlers` reports only commits and failures, and `partial_transcript` messages are ignored.
- **`record.ts`** `startRecorder` streams chunks through `onChunk`, but it also keeps every chunk in memory and stops at `maxSeconds` (at most 300). Both suit push-to-talk. Neither suits a session that can last an hour.
- **`speech-job.ts`** (659 lines) `SpeechController` runs one job at a time with a pinned provider override, a stop path, `stopOwnAudio()`, and a `speechBlock` hook that `talk.ts` uses to refuse `/speak` during a recording.
- **`talk.ts`** (468 lines) `TalkController` owns the push-to-talk microphone state (`Starting | Recording`). `talk-delivery.ts` sends through `pi.sendUserMessage` with `expandPromptTemplates: false` and maps `input.sendWhenBusy` to `steer`/`followUp`.

The Pi host provides what the tool needs. `pi.getActiveTools()` and `pi.setActiveTools()` decide which tools are declared to the model, and a tool's `promptGuidelines` enter the system prompt only while it is active (`host/pi/packages/coding-agent/src/core/extensions/types.ts`). Four host facts in `host/pi/packages/coding-agent/src/core/agent-session.ts` constrain the design:

- **H1:** A tool registers active unless `defaultActive: false`. The installed 0.99.2 and 1.x hosts honor it. The 0.87.1 types that `pi-speak` type-checks against lack it, and `pi-speak`'s peer range is `*`.
- **H2:** On session construction and after tree navigation, the host restores the recorded tool set (`_restoreToolsFromTranscript`). Names not yet registered, such as MCP tools whose servers are still connecting, stay pending and activate when they register.
- **H3:** A `setActiveTools` call that deactivates any tool clears that pending set. A call that only adds keeps it.
- **H4:** Each agent run clears the pending set at its start (`_runAgentPrompt`). A `setActiveTools` call made in a `before_agent_start` handler applies to the run that is starting.

## Goals / Non-Goals

**Goals:**

- Live mode reuses the existing connection, recorder, synthesis, cache, and player paths. It adds no second transport and no second speech pipeline.
- Each piece of state has one owner. Live mode owns its session, `TalkController` keeps owning push-to-talk, and `SpeechController` keeps owning the running speech job.
- Files this change creates stay under 500 lines. A file it extends that is already over 500 lines (`speech-job.ts`) is split along a clean responsibility boundary when one exists, as the large-files rule requires. When none exists, it grows only by the minimal live entry point, and the reason is recorded in the task result.

**Non-Goals:**

- Changing push-to-talk's 1 s pause or its languages: the settings of D13 and D14 apply to live mode only.
- Measuring cost inside the extension; `/speak quota` stays the only account view.

## Decisions

### D1. Borrow pi-realtime's split, not its code

The voice side only listens and speaks, and Pi stays the brain, as in pi-realtime's "eco mode." That project is not adopted: it has no license, its terminal recording uses macOS-only `ffmpeg -f avfoundation`, and it requires OpenAI. **Alternatives:** OpenAI Realtime breaks ADR-0004's two-provider choice and costs more per minute. Hosted ElevenLabs or Deepgram agents run their own model and would need a local OpenAI-style server to reach Pi.

### D2. ElevenLabs in both directions

Live mode reuses `openRealtime` exactly as the stop phrase does, plus ElevenLabs synthesis with the configured voice. Deepgram has no live path in this extension, and its Aura voices each speak one language, so they cannot follow the user between Vietnamese and English. A live job pins the provider to `elevenlabs` through the job's existing provider override, so `/speak provider` and `/talk provider` do not affect live mode.

### D3. One tool, activated only while live

`speak_aloud(text)` is registered with `defaultActive: false` (H1). The definition is passed as an object typed `ToolDefinition & { defaultActive?: boolean }`, so the 0.87.1 types accept it. A host whose types lack the property, such as 0.87.1, ignores it and activates the tool on registration.

The extension changes the active tools at three points and nowhere else:

- **Live mode starts:** it adds the name with `setActiveTools([...getActiveTools(), "speak_aloud"])`. An add-only call keeps pending tools (H3).
- **Live mode ends:** it removes the name, only if the tool is active.
- **An agent run starts:** a `before_agent_start` handler removes the name when live mode is off and the tool is active. That happens only after the host restored a recorded tool set (H2), or on a host that ignores `defaultActive` and activated the tool on registration (H1). A `/reload` while live mode is on is not such a case: its shutdown ends live mode, which removes the tool before the reload copies the active tools. By H4 the removal applies to the run that is starting, and the host is about to drop unregistered pending tools anyway, so nothing that run would have kept is lost. `before_agent_start` fires only for runs a prompt starts.

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

`input.liveIdleMinutes`, `input.liveListenWhileSpeaking`, `input.liveStopPhrases` (D12), `input.livePauseSeconds` (D13), and `input.liveLanguages` (D14) follow the existing flat `input.*` style (`stopOnPhrase`, `holdSpace`) rather than a nested block.

### D12. Ending live mode by voice (amendment of 2026-10-15)

While live mode is on, saying a configured phrase ends it exactly as `/talk live` does. The extension handles the phrase itself; it is never sent to Pi. Three questions were settled.

**Whole turn, not "contains".** A turn matches only when all of its words equal a phrase. Pausing is already how a turn ends, so "Stop the conversation" said on its own is its own turn. A sentence such as "stop the conversation about tests and look at the loader" is a request to Pi, and it must not end live mode by accident.

**Diacritics are ignored.** Words are compared as `matchStopPhrase` in `realtime.ts` compares them: lower-cased, in Unicode NFC, with whitespace and punctuation only separating words, and curly apostrophes made straight. In addition, combining marks are removed after NFD decomposition and `đ` counts as `d`. Transcription of Vietnamese often gets a tone mark wrong ("thoại" heard as "thoai"), and a whole-turn match on a four-word phrase keeps a false match, such as "Dùng cuộc hội thoại", unlikely as a turn on its own.

**Not heard while Pi speaks, unless barge-in is on.** With `input.liveListenWhileSpeaking` off, the microphone sends silence during playback (D6), so a phrase said then never reaches the provider. The user presses the cut-off key first, or waits. With the setting on, the phrase first cuts Pi off through the partial transcript (D8), and the committed turn then ends live mode.

**A built-in pair by default.** `input.liveStopPhrases` defaults to `["Dừng cuộc hội thoại", "Stop the conversation"]`, so the feature works out of the box for this bilingual user. Ending live mode is harmless and is undone with `/talk live`. `[]` turns it off. Validation follows `input.stopPhrases` (1 to 40 characters per phrase, at most 10), but allows an empty list, and rejects a phrase with no letter or digit, which could never match a turn the letter-or-digit filter keeps.

Ordering: the match happens when the segment is committed, before the letter-or-digit filter. The end is chained after the turns already waiting to be sent (`On.sending`), so a turn said just before the phrase is still delivered. Segments committed after a match are dropped. The phrases are read at live start, with the other live settings.

**Alternatives:**

- **Reuse `input.stopPhrases`.** Rejected: those phrases end a dictation and send it, while these end live mode and send nothing. The push-to-talk default, "let's go", is also a natural phrase in a conversation.
- **Match anywhere in the turn.** Rejected for the accidental-end risk above.
- **Listen for the phrase during playback.** Rejected: it would reopen the echo path that muting exists to close.
- **No default phrases.** Rejected: the user asked for the feature to work, and a default is easy to change or turn off.

### D13. A longer thinking pause (amendment of 2026-10-15)

The live check showed that 1 s of silence ends a turn while the user is still thinking, so Pi answers too soon. Live mode now sends `vad_silence_threshold_secs` from `input.livePauseSeconds`, which defaults to 2 and is limited to 0.3–3.

- **The limit comes from the provider.** A probe on 2026-10-15 showed that ElevenLabs accepts 2 and 3 but refuses 3.5 with `invalid_request` ("must be between 0.3 and 3.0"). The `elevenlabs-js` client applies the same check. Validating locally turns that refusal into a configuration error before anything connects.
- **The default is 2 s.** That is above the provider's own 1.5 s default, and every answer starts about a second later than before. The user can lower it.
- **Push-to-talk keeps 1 s.** There the pause only ends the stop-phrase listener's segment, and the user's key, not a pause, ends the recording.

Alternative rejected for now: holding a committed turn on the client and joining it with the next one if speech resumes. That allows pauses longer than 3 s, but adds a timer, a join rule, and an interaction with the stop phrase's whole-turn match. It is the next step if 3 s proves too short.

### D14. Limiting live languages (amendment of 2026-10-15)

Under auto-detect, Vietnamese was reported to come out as Chinese, and fixing `input.language` to one language garbles the other. Live mode now sends each entry of `input.liveLanguages` as a separate `secondary_languages` value, reduced to its primary subtag and sent once, alongside `language_code` when `input.language` is set.

The 2026-10-15 probe, one synthetic clip per language, showed the following:

- **The list limits recognition rather than hinting at it.** Chinese audio came back empty instead of as Chinese text.
- **`language_code=vi` plus `secondary_languages=en` detects English as `en`.**
- **Without `language_code`, the list is the complete allowed set.** `secondary_languages=en` alone dropped Vietnamese entirely.
- **Repeating the main language in the list is accepted.**

So the documentation states the rule plainly: live mode recognises only the listed languages, plus `input.language` when it is set. The user's own setup is `"liveLanguages": ["vi", "en"]` with `input.language` omitted, which leaves push-to-talk's own language behavior as it is.

**Alternatives:**

- **`input.secondaryLanguages` (the handoff's name).** Rejected for two reasons. The setting is live-only, which the `live` prefix of D11 signals. And without `input.language`, the list is the whole allowed set rather than a secondary one.
- **Applying the list to push-to-talk.** Rejected: push-to-talk sends its recorded clip to the batch or Deepgram endpoint, which this list does not reach, and its live connection only listens for the stop phrase.

## Risks / Trade-offs

- **Pi's voice reaching the microphone through speakers when barge-in is on** → it is off by default, muting is the default, and help and README state that the setting needs headphones or echo cancellation.
- **Continuous streaming cost** → the idle limit, a live status line that is always visible, and `/talk live` to end it.
- **The model forgetting to call `speak_aloud`, or overusing it** → tool guidance, a live check in tasks, and the written answer as the full record; there is no automatic fallback speech.
- **A misheard turn acting through Pi's tools** → the user accepted this risk for live mode in ADR-0010. Turns are plain text that never run commands, and text with no letter or digit is dropped.
- **A pause longer than `input.livePauseSeconds` splitting one thought into two turns** → while Pi is busy, the second turn steers the same run. The provider caps the pause at 3 s; D13 names the next step if that is too short.
- **Speech in a language outside `input.liveLanguages` is not transcribed** → the segment comes back empty and is dropped without a message. Help and the README say that the list is the complete set of languages heard.
- **A long session reaching `realtime.ts`'s 1 MiB transcript cap** → that would take hours of speech. Live mode ends cleanly with the existing "too large" message, and the user restarts it.
- **Toggling the tool changes the system prompt** → the prompt cache misses once per toggle, which is acceptable.
- **A run started by another extension's message** (`sendCustomMessage` with `triggerTurn`) skips `before_agent_start`, so after a resume it can still declare `speak_aloud` → the tool answers that live mode is off and nothing is spoken, and the next prompt removes it. No extension in this repository starts runs that way.
- **Ending live mode in a resumed session before its first agent run** clears MCP tools still connecting (H3) → this needs a resume, then `/talk live` on and off within seconds, before any prompt. It is accepted and not guarded; `/reload` restores the tools.
- **Silence frames keep a billed connection open while Pi speaks** → this is the cost of a stable connection. The idle limit bounds the total.
- **A misheard turn equals a live stop phrase** → live mode ends early. This is harmless: nothing is sent, the agent keeps working, and `/talk live` restarts it. The whole-turn rule keeps it rare.
- **Ignoring diacritics merges Vietnamese words that differ only in tone** → a match still needs every word of the phrase as the whole turn, and the user can choose phrases that do not collide.

## Migration Plan

Additive and off by default. Users opt in with `/talk live`, and the new settings are optional. Rollback means not using `/talk live`, or reverting the change. No configuration or data migration is needed. This change archives after `add-speak-voice-input`, whose `voice-input` requirements it modifies.

## Open Questions

- Does ElevenLabs bill live transcription by connection time or by audio sent? This changes only the documentation's cost wording, which a live check settles.
