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

**A tap still types a space.** The first Space always reaches the editor. A hold is recognized only from the key repeat: three Spaces in a row, each arriving within 120 ms of the one before, which a person cannot type by hand. Then a recording starts, as if the send key were pressed. The Spaces the hold typed are removed from the end of the editor text, if they are still there, and further repeats are consumed.

**Letting go sends.** The hold ends when no Space has arrived for 300 ms, or when the terminal reports a Space release. That stops the recording in send mode, exactly as the send key does, including the stop phrase rules, `input.sendWhenBusy` and the time-cap hold. Letting go while the recording is still starting cancels it. Escape discards, as always.

**Only from idle.** A hold starts a recording only when no recording, held recording or transcription exists. Otherwise Space behaves normally.

## Consequences

- The user can dictate by holding one key, with no change for anyone who leaves it off.
- About 0.6 s passes between pressing Space and the start of recording, and letting go is noticed about 0.3 s late.
- If key repeat is turned off, or slower than 120 ms, in the desktop settings, a hold is never recognized.
- The terminal input listener sees keys even while a selector or dialog is open. Holding Space there can start a recording. This is documented, and Escape discards it.

## Alternatives Considered

- **Consuming the first Space and typing it back after a timeout**, as voicekit does on some terminals. Rejected: it delays every typed space and needs an insert-at-cursor operation the extension does not have.
- **Requesting the Kitty "report all keys" flag to get real release events.** Rejected: it changes how every key reaches Pi's editor, which Pi owns.
