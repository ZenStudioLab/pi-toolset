# ADR-0007: Voice Command and Skill Keys

**Status:** Accepted for implementation; runtime qualification pending.
**Owner:** Orchestrator.
**Change:** [add-speak-voice-input](../../openspec/changes/add-speak-voice-input/design.md) (Wave 8 amendment of 2026-10-09).
**Supersedes:** the exclusion of spoken slash commands in the change proposal. Every decision in ADR-0002 through ADR-0006 remains in force; in particular, a sent message still never runs a slash command.

## Context

The user wants to start Pi commands, prompt templates and skills by voice. Pi 1.1.0 lists all three to extensions through `pi.getCommands()`: extension commands and prompt templates by name, skills as `skill:<name>` (`agent-session.js:2681-2700`). Pi's own interactive commands, such as `/model` and `/compact`, are handled by the editor screen and are not in that list.

A misheard dictation must not run anything. The user's input language is Vietnamese, so English command names may be transcribed loosely.

## Decision

**Two more push-to-talk keys.** `input.commandShortcut` (default `alt+m`) and `input.skillShortcut` (default `alt+i`) work like the other push-to-talk keys and have `/talk command` and `/talk skill` equivalents. Neither default has a built-in binding in Pi 1.1.0. The control that stops a recording decides its mode, as in ADR-0005.

**The result goes into the editor; nothing runs.** In command mode the transcript is matched against Pi's extension commands and prompt templates; in skill mode, against its skills. The matched name becomes `/<name>` at the start of the editor, followed by any words spoken after the name and then by the draft that was already there. The user reviews it and presses Enter, so Pi itself runs it exactly as if typed. This also lets an alias reach Pi's interactive commands.

**Matching is forgiving but never guesses.** Case, punctuation, spaces, hyphens and colons are ignored, so "op sx apply loop" finds `opsx-apply-loop`. The longest name that the first spoken words spell wins. User-defined aliases in `input.commandAliases` map a spoken phrase to a target such as `/opsx-apply-loop`, for names that are hard to say or that transcription mishears. When nothing matches, or two names match equally, the words are added unchanged as with the transcribe-only key, and a warning says so.

**No new network use.** Command and skill recordings are transcribed exactly like transcribe-only recordings. A recording started with one of these keys never streams, even with the stop phrase on, so a spoken stop phrase cannot send it.

## Consequences

- Voice can reach every command, prompt template and skill without risk of running the wrong one.
- The status line and help grow by two keys.
- Spoken arguments are plain words; for example, a change name is not re-hyphenated. The user corrects them in the editor before pressing Enter.

## Alternatives Considered

- **A spoken trigger word in a normal dictation.** Rejected by the user in favour of keys: a key cannot be misheard, and an ordinary dictation can never turn into a command.
- **Running the matched command at once.** Rejected by the user for now: a misheard name would run.
- **Numbered keys bound to fixed commands.** Not chosen; one command key reaches every command.
