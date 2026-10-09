# ADR-0008: Hold Space to Talk

**Status:** Accepted for implementation; runtime qualification pending.
**Owner:** Orchestrator.
**Change:** [add-speak-voice-input](../../openspec/changes/add-speak-voice-input/design.md) (Wave 8 amendment of 2026-10-09).
**Supersedes:** the rejection of hold-to-talk in design D1 and in the Non-Goals of `add-speak-voice-input`, only while `input.holdSpace` is on. Every decision in ADR-0002 through ADR-0007 remains in force.

## Context

The user asked to record by holding Space and to send when Space is let go, as in Claude Code's voice mode. D1 had rejected hold-to-talk because key-release events depend on the terminal.

A probe in the user's terminal (Ghostty on Linux, `TERM_PROGRAM=ghostty`) on 2026-10-09 enabled the same keyboard reporting Pi requests (Kitty flags 1, 2 and 4; `pi-tui/dist/terminal.js:192-195`). Tapping Space sent one `" "`. Holding it sent one `" "`, then after about 0.5 s a `" "` every 30 ms, and no release event. Without the "report all keys as escape codes" flag, Kitty-protocol terminals send keys that produce text, such as Space, as plain text, so a release can be seen only as the end of the repeats. Extensions receive raw input before the editor through `ctx.ui.onTerminalInput`, and can consume it (`pi-tui/dist/tui.js:685-699`). The voicekit extension in this repository uses the same gap-based detection (`extensions/pi-voicekit/extensions/voice.ts:23-41`).

## Decision

**Off by default.** `input.holdSpace: true` turns it on.

**A tap still types a space.** Every Space reaches the editor until a hold is recognized from the key repeat: the second Space in a row within 120 ms of the one before. In the probed terminal that is the fourth Space, about 0.56 s after the press. The hold is then spent and is not recognized again until it ends.
- **Engaged hold:** if nothing else is starting, recording, held or transcribing, a recording starts as the send key would start one. Spaces are consumed until the hold ends. Once the recorder runs, the Spaces typed since the last other input are removed from the end of the text, if they are still there.
- **Busy hold:** otherwise nothing happens, and Spaces keep typing.

**Letting go sends, and only the hold's own recording.** The hold ends on a reported Space release, or when no Space has arrived for 300 ms. A quiet gap is confirmed only after pending input has been read. Release events of other keys are ignored. Ending acts only on the recording that hold started:
- **recording or held:** it is sent, exactly as with the send key, including the stop phrase rules, `input.sendWhenBusy` and the time-cap hold;
- **still starting:** it is cancelled;
- **already ended in any other way:** nothing happens.

**Typing during a hold discards the recording.** Another key stops Space's key repeat, so a release could no longer be told apart from the typing. That key reaches the editor, and the hold's recording is discarded exactly as Escape discards it; nothing is uploaded or sent. The hold then just consumes Spaces until it ends. Escape and the push-to-talk keys, including the command and skill keys, behave as usual. This adds no new way for audio to leave the machine and no new held state.

**Lifecycle.** The setting is read at load and applies after `/reload`. The listener is subscribed on every session start, because Pi drops it when a session is replaced. A session change discards the hold's recording and clears its timers, and the spent hold stays unrecognizable until Space is released.

## Consequences

- The user can dictate by holding one key, with no change for anyone who leaves it off.
- About 0.6 s passes between pressing Space and the start of recording, and letting go is noticed about 0.3 s late.
- If key repeat is turned off, or slower than 120 ms, in the desktop settings, a hold is never recognized.
- Losing window focus while holding Space stops the repeats and counts as letting go, which sends.
- If the cursor is inside the text, the typed Spaces stay there.
- Pressing Space again within 300 ms of letting go continues the same hold.
- Three Spaces typed by hand within 120 ms of each other count as a hold: they are removed, `/speak` playback stops, and a recording starts. Letting go within 0.5 s sends nothing; with the stop phrase off nothing is uploaded either, but with it on the audio before the release may already have streamed to ElevenLabs.
- The terminal input listener sees keys even while a selector or dialog is open. Holding Space there can start a recording. This is documented, and Escape discards it before the release.

## Alternatives Considered

- **Consuming the first Space and typing it back after a timeout**, as voicekit does on some terminals. Rejected: it delays every typed space and needs an insert-at-cursor operation the extension does not have.
- **Requesting the Kitty "report all keys" flag to get real release events.** Rejected: it changes how every key reaches Pi's editor, which Pi owns.
