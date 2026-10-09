# ADR-0006: A Spoken Stop Phrase, Using Live ElevenLabs Transcription

**Status:** Accepted. The user approved the live checks on 2026-10-09 (task 7.5 of `add-speak-voice-input`).
**Owner:** Orchestrator.
**Change:** [add-speak-voice-input](../../openspec/changes/add-speak-voice-input/design.md) (Wave 6 amendment of 2026-10-09).
**Supersedes:**
- [ADR-0004](0004-voice-input-and-provider-choice.md), in two places: its rule that microphone audio leaves the machine only after the user stops a recording, and its exclusion of voice triggers. Both apply only while the stop phrase is turned on.
- [ADR-0005](0005-voice-send-and-session-locale.md), only in its statement that sending happens only on a key press.

Every other decision in ADR-0002 through ADR-0005 remains in force.

## Context

With the send key from ADR-0005, dictating still ends with a key press. The user wants to end it by voice instead: saying a phrase such as "let's go" at the end of a recording should stop it and send it. Recognizing the phrase while the user is still speaking needs transcription as the audio arrives. The current design records locally and uploads once after the stop, so it cannot see the phrase in time.

ElevenLabs, the user's voice-input provider, offers live transcription over a WebSocket (`wss://api.elevenlabs.io/v1/speech-to-text/realtime`, model `scribe_v2_realtime`). It accepts the 16 kHz PCM our recorder already produces. It can settle a stretch of speech when the speaker pauses (`commit_strategy: "vad"`). These facts were checked on 2026-10-09 and are recorded in the review log.

The trust boundary is unchanged: one user's own machine and the services that user chose.

## Decision

**Off by default.** `input.stopOnPhrase: true` turns it on. `input.stopPhrases` lists the phrases (default `["let's go"]`) and is used only when the stop phrase is on. When it is off, recording works exactly as before: the audio stays local until the user stops, and is uploaded once.

**When on, every recording streams.** The audio goes to ElevenLabs live transcription while the user speaks, authenticated with `ELEVENLABS_API_KEY` in the `xi-api-key` header. ElevenLabs settles a stretch of speech after a pause. If the settled text ends with a configured phrase, the recording stops. The phrase is removed from the end of the text, and the rest is sent as with the send key: appended to the composer, then sent as one plain user message, following `input.sendWhenBusy`.

**Keys still work.** The send key, the transcribe-only key, `/talk`, `/talk send`, and Escape behave as they do today. A key press ends the recording with the text received so far.

**ElevenLabs only, at first.** Deepgram live streaming may be added later. If the input provider is Deepgram while the stop phrase is on, the extension reports that the stop phrase needs ElevenLabs and records nothing. It never switches providers silently.

## Consequences

- **Audio leaves while the user speaks.** When the stop phrase is on, audio is sent during the recording, not after it. Escape still stops the recording and sends no message, but it cannot recall audio ElevenLabs has already received. The README and help must say this.
- **A natural "let's go" can stop a recording early.** It counts only at the end of a stretch of speech followed by a pause, which makes an accidental stop less likely. The user can choose less common phrases.
- **Cost.** Streaming is billed for the audio sent, as uploads are.
- **More failure paths.** A dropped connection, an authentication error, or a session time limit can now happen mid-recording. Each one ends the recording with a sanitized error and sends no message.

## Alternatives

- **Recognize the phrase locally**, for example with a Vosk model, and upload only at the end. It keeps audio local longer, but it adds a native dependency and a model download, and it recognizes a short phrase poorly in Vietnamese.
- **Deepgram first.** Deepgram's live API was checked earlier in this change, but the user's voice-input provider and key are ElevenLabs.
- **Always on.** Every recording would stream even when the user wants to stop with a key. Off by default keeps streaming a deliberate choice.
- **A separate shortcut for phrase-stopped recordings.** It would add a third key to learn. The config switch was preferred.
