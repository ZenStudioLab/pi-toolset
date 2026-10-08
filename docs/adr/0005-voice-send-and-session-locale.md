# ADR-0005: Sending Dictation by Key, and a Session Speech Locale

**Status:** Accepted for implementation; runtime qualification pending.
**Owner:** Orchestrator.
**Change:** [add-speak-voice-input](../../openspec/changes/add-speak-voice-input/design.md) (amendment of 2026-10-09).
**Supersedes:** [ADR-0004](0004-voice-input-and-provider-choice.md) only in its delivery rule that the extension never submits a prompt or interrupts the agent. Every other decision in ADR-0004, and in ADR-0002 and ADR-0003, remains in force.

## Context

ADR-0004 kept voice input to one effect: text appended to the composer, which the user then sends with Enter. After using it, the user found recognition accurate enough that the extra Enter is friction, and asked for a key that transcribes and sends in one step, with the current behaviour kept on a second key. The user also asked for a speech language chosen per session, or per command, instead of only in the config file.

The trust boundary is unchanged: one user's own machine and the services that user chose.

## Decision

**Two push-to-talk keys.** `alt+t` (`input.shortcut`) transcribes and sends. `alt+shift+t` (`input.transcribeShortcut`) transcribes only, which is the ADR-0004 behaviour. Typed `/talk` stays transcribe-only, and `/talk send` sends. The key or command that stops a recording, or that sends a recording held at the time cap, decides the mode. A recording can be started with either key.

**What sending does.** The transcript is appended to the composer exactly as before. The whole composer, the user's draft plus the transcript, is then sent as one ordinary user message, as if the user had pressed Enter. It is sent as plain text: no slash command, prompt template, or skill command in it is run. An empty transcript sends nothing.

**When the agent is busy.** `input.sendWhenBusy` chooses `"interrupt"` (the default: the message reaches the agent at once and steers its current turn) or `"wait"` (the message is queued until the current turn ends). The user chose interrupting as the default.

**Still a key press, never a voice trigger.** Sending happens only because the user pressed the send key or ran `/talk send`. There are still no spoken commands, no open microphone, no automatic send at the time cap, and no automatic speech of answers.

**Session speech locale.** `/speak locale <tag>` sets the speech locale until Pi restarts or reloads, or until `/speak locale reset`, without writing the config file. `/speak in <tag>` uses a locale for one command only. Both follow the existing locale rules: a valid BCP-47 tag, canonicalized, and checked against a Deepgram voice's language before any translation.

## Consequences

A misrecognized phrase sent with the send key reaches the agent without review, and with the default `"interrupt"` it can redirect a running turn. The transcribe-only key, `/talk`, and `"wait"` remain for users who want to review first. The cost of a wrong send is the same as a mistyped Enter: the conversation continues, and the user can correct it with another message.

The README and help must name both keys and say which one sends, because the default key now has a bigger effect than before.

## Alternatives

- **Keep transcribe-only and rely on Enter.** This is the ADR-0004 rule. The user found it slower than needed.
- **Default `"wait"` when the agent is busy.** It is safer against an unintended interruption. The user preferred interrupting by default and a setting to change it.
- **Expand slash commands in a sent transcript.** It would let a misheard phrase run a command, which ADR-0004 ruled out.
- **Decide the mode by the start key.** It locks the decision before the user has spoken. Deciding at the stop lets the user change their mind.
- **Write the session locale to the config file.** The extension never writes the config file (ADR-0004).
