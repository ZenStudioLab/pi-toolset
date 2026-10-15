# Tasks

Routing: focus mode. `worker` is the default implementer for grouped work and keeps one session across waves where practical (resume it when it finished cleanly, was reconciled, has been idle under an hour, and its context stays under 350k tokens). The orchestrator owns the ADR, spec and design amendments, reconciliation, task completion, and commits. `oracle` reviews each completed wave, never individual tasks. Each wave uses at most one `oracle` instance and at most three other subagent instances. If a foreground dispatch fails before the task starts (as `pi-claude-bridge` children did in `add-speak-voice-input`), run the same task in the background and reconcile it before dependent work.

Verification commands:

- **Memory limit (required for every test or type-check run, by the orchestrator or any worker):** run it inside a 4 GB memory scope with swap disabled, prefixing the command with `systemd-run --user --scope -q -p MemoryMax=4G -p MemorySwapMax=0`. A failing `assert.deepEqual` on megabytes of audio once made Node's error diff grow to 23–25 GB and the kernel killed herdr and other Pi sessions; inside the scope only the test run is killed. Run a new or changed test file alone first. Do not compare large buffers with `deepEqual`; compare lengths or a few bytes.
- **Speak tests:** `systemd-run --user --scope -q -p MemoryMax=4G -p MemorySwapMax=0 node --experimental-strip-types --test extensions/speak/test/*.test.ts`.
- **Type check:** `systemd-run --user --scope -q -p MemoryMax=4G -p MemorySwapMax=0 npx tsc --noEmit 2>&1 | grep -E 'extensions/speak'`, which must print nothing.
- **Spec check:** `openspec validate add-speak-live-conversation --strict`.

Archive order: archive this change only after `add-speak-voice-input`, whose `voice-input` requirements this change modifies.

## 1. Wave 1: decision record and building blocks

- [x] 1.1 [Orchestrator] Write `docs/adr/0010-live-voice-conversation.md`. It records live mode as an explicit opt-in in which, while it is on, microphone audio streams to ElevenLabs and Pi's chosen spoken text is synthesized without a `/speak` command; ElevenLabs is used in both directions; the microphone is muted during playback by default; voice barge-in is optional; and pi-realtime's design is adopted without its code. It states that this supersedes, for live mode only, ADR-0002's manual-only speech rule and ADR-0004's exclusion of automatic speech and an open microphone, and that both still hold outside live mode. Must be done before any implementation task. Verify that the ADR links to this change, ADR-0002, ADR-0004, ADR-0005, ADR-0006, and ADR-0008, names ADR-0002's rejected "model-callable speech tool", and that ADR-0002 and ADR-0004 are edited only to add a status-line supersession note (the ADR-0004 precedent) and ADR-0006 only to add a "Related" link to ADR-0010.
- [x] 1.2 [worker] Add `input.liveIdleMinutes` (integer 1–60, default 5) and `input.liveListenWhileSpeaking` (boolean, default `false`) to `extensions/speak/input-settings.ts`, keeping unknown keys rejected. Verify with table-driven cases in `extensions/speak/test/config.test.ts` (defaults, both bounds, a non-integer, a non-boolean), passing speak tests, and a clean speak type check.
- [x] 1.3 [worker] Add the streaming recorder mode from design D5 to `startRecorder` in `record.ts`: with `retain: false`, chunks go only to `onChunk` and `onLevel`, nothing is buffered, no length cap applies, and a requested stop resolves as stopped with no audio. Push-to-talk calls stay unchanged. Verify with cases in `extensions/speak/test/record.test.ts`: no cap after more than `maxSeconds` of fake audio, no retained audio on stop, an unrequested exit still reported as a failure, and the existing capped behavior unchanged.
- [x] 1.4 [worker] Add the optional `onPartial(text)` handler from design D8 to `RealtimeHandlers` in `realtime.ts`, called for non-empty `partial_transcript` messages. Message-size and text-size limits still apply. Verify with cases in `extensions/speak/test/realtime.test.ts`: a non-empty partial reaches the handler, an empty one does not, a session without the handler ignores partials as today, and committed text is unchanged by partials.
- [x] 1.5 [worker] Before extending `speech-job.ts` (659 lines), inspect it for a clean responsibility split (design D10, for example status, quota, and help reporting apart from the job runner). Split it where such a boundary exists without changing behavior; test imports may change, assertions may not. If none exists, record why in this task's result and add only `speakLive`. Then add `speakLive(text, hooks)` (design D7): it pins ElevenLabs regardless of overrides, skips `speechBlock`, uses the same preflight, length limit, cache, player, and progress line as `speak(text)`, reports when the player starts and exits, and resolves when the job ends. Verify with cases in `extensions/speak/test/job.test.ts`: a Deepgram override is ignored, a speech block does not refuse it, the hooks fire in order around playback, cancellation resolves it without playback, and the existing job tests pass. Files created by the split are under 500 lines.
- [x] 1.6 [Oracle gate: `oracle`] Review gate for Wave 1, run once after 1.1–1.5 are complete. It reviews the whole completed wave against the specs and design, not individual tasks, under `review-convergence`. Oracle output is advisory: it reports findings and one `PROPOSED_REVIEW_ACTION`. The caller reconciles every finding and solely owns `REVIEW_ACTION`, `CONSENSUS_STATUS`, edits, and termination. At most four Oracle rounds and one recorded rebuild. A terminal `PASS` or `HUMAN_DECISION` requires checking against the latest candidate revision and frozen boundary. A caller-owned `PATCH` or `REBUILD` returns work to this wave and reuses this gate.

## 2. Wave 2: the live session and turns

- [x] 2.1 [worker] Create `extensions/speak/live.ts` with the live session (design D4, D5, D10): `/talk live` toggling, the start checks and refusals, the connection with the existing realtime parameters, the streaming recorder, turn delivery (new committed text only, dropping only text with no letter or digit, plain `sendUserMessage` with `sendWhenBusy`, the composer left alone, and the append-to-composer fallback on refusal or failure), and ending on `/talk live`, provider error or close, recorder exit, session replacement, fork, tree navigation, reload, and shutdown, without retry. Wire it from `index.ts` and `talk.ts`: the `live` form of `/talk`; push-to-talk presses, Space holds, and speech-producing `/speak` forms refused while live (the send key's cut-off comes in 3.2); and a combined `speechBlock`. Verify with a new `extensions/speak/test/live.test.ts` using fake socket, recorder, and send functions, covering the scenarios of "Live mode starts and ends only by user action or a stop condition", "Starting live mode", "Live turn delivery", "Other voice controls during live mode", and "Live mode ends cleanly" (except those about spoken updates); the existing talk and hold-space tests passing unchanged; and `live.ts` and `talk.ts` each under 500 lines (split along a responsibility boundary if not).
- [x] 2.2 [worker] Add the idle limit (design D9): a 15-second timer that ends live mode after `input.liveIdleMinutes` of agent idleness with no update speaking and no turn sent, with the idle message, cleared when live mode ends. Verify with cases using the fake clock in `extensions/speak/test/hold-clock.ts`: it ends after the limit, agent work resets the clock, and no timer remains after live mode ends.
- [x] 2.3 [worker] Document live mode's listening side in `extensions/speak/README.md`: `/talk live`, how turns are sent, the idle limit and both settings, that live mode uses ElevenLabs in both directions, and the privacy and cost statements of "Live mode privacy". Add `/talk live` to help and live state to `/speak status` ("Live mode status, help, and settings"). Verify with help and status cases in `extensions/speak/test/command.test.ts` and a read-through of the README against the spec.
- [x] 2.4 [Oracle gate: `oracle`] Review gate for Wave 2, run once after 2.1–2.3 are complete, under the same rules as 1.6: one wave-level review, advisory Oracle output, complete caller reconciliation and caller-owned `REVIEW_ACTION`, at most four rounds and one rebuild, terminal baseline validation, and `PATCH`/`REBUILD` returning to this wave.

## 3. Wave 3: Pi speaking, cutting off, and live checks

- [x] 3.1 [worker] Register the `speak_aloud` tool (design D3) with `defaultActive: false`, passed through an object typed `ToolDefinition & { defaultActive?: boolean }`, with its description and `promptGuidelines` per "Spoken updates tool". Change the active tools only at the three D3 points: add on live start, remove on live end only if active, and remove in a `before_agent_start` handler only when live mode is off and the tool is active. Never call `setActiveTools` when nothing would change. Add `registerTool`, `getActiveTools`, and `setActiveTools` to the fake `pi` in the test harness. Add the ordered update queue (design D7) on top of `speakLive`, so the tool returns at once with a queued or refused result. Verify with cases in `extensions/speak/test/live.test.ts`:
  - loading with the tool inactive makes no `setActiveTools` call at all;
  - an agent run that starts with the tool already active and live mode off removes only that name;
  - live start adds only that name, and live end removes only that name;
  - other active tools survive each of these;
  - results for queued, empty, too-long, and live-off calls;
  - updates play in order, and a failed update lets the next one play.

  Also confirm on the 1.1.0 host (a host-level test or a real-host check) that a removal in `before_agent_start` applies to that run's tool declarations.
  - **Result:** confirmed by the existing host test `host/pi/packages/coding-agent/test/system-prompt-updates.test.ts:235`, run inside the 4 GB scope by the Wave 3 gate, and by a source read of `agent-session.ts:2062–2073` and `:2105`.
- [x] 3.2 [worker] Add muting and cut-off (design D6, D8): silence frames of the same length from the player's start until 500 ms after it exits (with `input.liveListenWhileSpeaking` off), checked with the fake clock; the send key and `/speak stop` stopping the current update and dropping waiting ones without ending live mode or aborting the agent; the send key's "nothing is being spoken" message; barge-in on a non-empty partial transcript when the setting is on; and the status line switching between listening and Pi speaking. Verify with cases in `extensions/speak/test/live.test.ts` covering the scenarios of "Microphone muted while Pi speaks", "Cutting Pi off", and the status-line scenario, plus the "Stop during live mode" scenario from the modified `manual-speech` requirement. Keep `live.ts` under 500 lines, splitting the speech queue into its own file if needed.
- [x] 3.3 [worker] Document the speaking side in `extensions/speak/README.md` and help: Pi's spoken updates and their language, the cut-off key, `/speak stop`, and `input.liveListenWhileSpeaking`, including that it needs headphones or system echo cancellation. Verify with help cases in `extensions/speak/test/command.test.ts` and a read-through of the README against the spec. Run speak tests, the speak type check, and the spec check, all clean.
- [x] 3.4 [User] Live checks, with real keys and audio. With speakers: a spoken exchange in English and one in Vietnamese, where Pi acknowledges, reports progress on a longer task, and speaks a summary in the language used; Pi's voice is never sent as a turn; the send key cuts Pi off; a one-second mid-sentence pause either sends two turns or not (record which); the idle limit ends live mode. With headphones and `input.liveListenWhileSpeaking` on: speaking cuts Pi off. Check whether ElevenLabs bills live transcription by connection time or by audio sent, and correct the README's cost wording if needed. Record results in this task, or report the change as unverified.
  - **Result (2026-10-15):** the user reported that live mode works in their own live test with real keys and audio.
  - **Not reported individually, so unverified:** whether a one-second pause splits one turn into two; whether a one-syllable answer given right after Pi stops is kept (R2-F4); 3 minutes or more of silence (F6); voice barge-in with headphones; and the billing basis. The README's cost wording stays as written: the basis is unchecked, so assume time-based billing.
- [x] 3.5 [Oracle gate: `oracle`] Final review gate for Wave 3, run once after 3.1–3.3 are complete and 3.4 is complete or explicitly reported as unverified, under the same rules as 1.6: one wave-level review, advisory Oracle output, complete caller reconciliation and caller-owned `REVIEW_ACTION`, at most four rounds and one rebuild, terminal baseline validation, and `PATCH`/`REBUILD` returning to this wave.

## 4. Wave 4: ending live mode by voice (amendment of 2026-10-15)

- [x] 4.1 [Orchestrator] Amend ADR-0010 with the live stop phrase (design D12): a separate list `input.liveStopPhrases`, whole-turn match, and the default pair. It is the only spoken command in live mode, and it can only end live mode. Must be done before 4.2. Verify that the ADR's Decision and Consequences agree with D12 and that no other ADR is edited.
- [x] 4.2 [worker] Add the live stop phrase (design D12, "Live stop phrase"):
  - **Setting:** `input.liveStopPhrases` in `input-settings.ts`, a list of 0 to 10 phrases of 1 to 40 characters, each with at least one letter or digit, default `["Dừng cuộc hội thoại", "Stop the conversation"]`. An empty list turns the feature off.
  - **Matcher:** a whole-turn match beside `matchStopPhrase` in `realtime.ts`, reusing its word rules and also ignoring diacritics (`đ` counts as `d`).
  - **Turn handling in `live.ts`:** checked on each committed turn before the letter-or-digit filter. A matched turn is never sent. Earlier turns are delivered first, then live mode ends through the existing end path with the stop-phrase message. Segments committed after the match are ignored.
  - **Status line and help:** both name the phrase.

  Verify with cases in a new `extensions/speak/test/live-stop.test.ts`:
  - each default phrase matches in any case, with or without diacritics, and with surrounding punctuation;
  - a turn that only contains the phrase, and a near-miss, are sent to Pi;
  - a matched turn is not sent, live mode ends, the recorder stops, the connection closes, waiting updates are dropped, `speak_aloud` is removed, and the status line is cleared;
  - a turn committed just before the phrase is still sent, and one after it is not;
  - `[]` disables the feature;
  - the status line and help name the phrase;
  - invalid settings refuse `/talk live` with the configuration error (cases in `test/config.test.ts`: not a list, 11 entries, an empty string, 41 characters, punctuation only).

  Also, carried from the Wave 3 gate (R1-F1): `removeToolOutsideLive` removes the tool whenever live mode is not `on`, including while it is starting, with one case in `test/live-tool.test.ts`.

  Run the new file alone first inside the memory scope, then the full suite and the type check. Keep `live.ts` under 500 lines.
- [x] 4.3 [worker] Update the README's "Live conversation" section, and the configuration defaults paragraph and example, with `input.liveStopPhrases`: the defaults, the whole-turn rule, what matching ignores (case, punctuation, diacritics), and that the phrase cannot be heard while Pi speaks unless `input.liveListenWhileSpeaking` is on. Verify with a read-through of the README against the spec.
- [x] 4.4 [User] Live check: say each default phrase, in Vietnamese and in English, while live mode is listening, and confirm that live mode ends with the stop-phrase message and nothing is sent to Pi. Then say a longer sentence that contains a phrase, and confirm it is sent to Pi and live mode stays on. Record the results here, or report them as unverified.
  - **Result (2026-10-15):** the user reported "stop the conversation work[s]": the English phrase ended live mode in their live test.
  - **Not reported, so unverified:** the Vietnamese phrase, which the config's `input.language: "en"` would likely garble, and the longer sentence containing a phrase. Both are covered by automated tests only.
- [x] 4.5 [Oracle gate: `oracle`] Final review gate for Wave 4, run once after 4.1–4.3 are complete and 4.4 is complete or explicitly reported as unverified, under the same rules as 1.6: one wave-level review, advisory Oracle output, complete caller reconciliation and caller-owned `REVIEW_ACTION`, at most four rounds and one rebuild, terminal baseline validation, and `PATCH`/`REBUILD` returning to this wave.

## 5. Wave 5: thinking pause and live languages (amendment of 2026-10-15)

- [x] 5.1 [Orchestrator] ADR wording carried from the Wave 4 gate. Must be done before 5.2.
  - **R1-F1:** ADR-0010's Supersedes line sets aside, while live mode is on, ADR-0004's "no spoken commands", for the live stop phrase only. ADR-0004's status note gains a matching line.
  - **R1-F2:** ADR-0010's "Ending by voice" bullet says that a turn containing the phrase among other words is sent.

  Verify that ADR-0010 agrees with D12, and that the only ADRs edited are 0004 and 0010.
- [x] 5.2 [worker] Add the live pause and the live languages (design D13 and D14, "Live pause and languages"):
  - **Settings:** in `input-settings.ts`:
    - `input.livePauseSeconds` is a number from 0.3 to 3 inclusive, default 2.
    - `input.liveLanguages` is a list of 0 to 10 tags, each validated as `input.language` is (`parseLocale`), default `[]`.
  - **Connection:** `openRealtime`/`realtimeUrl` in `realtime.ts` take an optional pause and an optional language list:
    - the pause becomes `vad_silence_threshold_secs`;
    - each distinct primary subtag of the list becomes a repeated `secondary_languages` entry;
    - `language_code` is unchanged.
    - Push-to-talk (`talk.ts`) passes neither, so it keeps `1` and sends no `secondary_languages`.
  - **Live mode:** `live.ts` passes both, read at live start. The start message names the languages it listens for: any, fixed, or limited.
  - **`/speak status`** shows both effective values.
  - **Help** describes both, including that the list is the complete set heard when `input.language` is unset.
  - **Carried from the Wave 4 gate (R1-F3):** delete the test at `test/live-stop.test.ts:101–108`.

  Verify with:
  - `realtimeUrl` cases: repeated `secondary_languages` entries, an empty list sending none, tags reduced to primary subtags and sent once, the pause value, the push-to-talk URL unchanged, and no API key in the URL;
  - config cases: defaults, bounds 0.3 and 3 accepted, 0.2, 3.5 and `"2"` refused, a list of tags accepted, a non-list, an invalid tag and 11 entries refused, and unknown keys still rejected;
  - one live test showing that the URL live mode opens carries both values;
  - status, help, and start-message assertions.

  Run each changed test file alone first inside the memory scope, then the full suite and the type check.
- [x] 5.3 [worker] Update the README's configuration example, the defaults paragraph, and the "Live conversation" section with both settings: the 2 s default and the 3 s provider limit, the list as the complete set of languages heard (plus `input.language`), speech in other languages being dropped, and push-to-talk being unaffected. Verify with a read-through against the spec.
- [x] 5.4 [User] Live check, with `"liveLanguages": ["vi", "en"]` in `~/.config/pi-speak/config.json`, after `/reload` and `/talk live`:
  - pause about 1.5 s in the middle of a sentence, and confirm it stays one message;
  - speak Vietnamese and English, and confirm each is transcribed in its own language with no Chinese;
  - say "Dừng cuộc hội thoại" (carried from 4.4), and confirm it ends live mode.

  Record the results here, or report them as unverified.
  - **Result (2026-10-15):** the user explicitly reported this check as unverified ("mark unverified") and asked to fold it into one combined live check after Wave 6. With the user's approval, the orchestrator added `"liveLanguages": ["vi", "en"]` to `~/.config/pi-speak/config.json` and confirmed that the Wave 5 code accepts it. The pause, the two languages, and the Vietnamese stop phrase are covered by automated tests only.
- [x] 5.5 [Oracle gate: `oracle`] Final review gate for Wave 5, run once after 5.1–5.3 are complete and 5.4 is complete or explicitly reported as unverified, under the same rules as 1.6: one wave-level review, advisory Oracle output, complete caller reconciliation and caller-owned `REVIEW_ACTION`, at most four rounds and one rebuild, terminal baseline validation, and `PATCH`/`REBUILD` returning to this wave.

## 6. Wave 6: live key, words as you speak, and spoken replies (amendment of 2026-10-15)

- [x] 6.1 [Orchestrator] Amend ADR-0010 for D15–D17. Must be done before 6.2.
  - **Decision:** live mode starts and ends by `/talk live` or the live key; Pi's finished answer is read aloud, cleaned as for `/speak original`; the words heard so far are only shown.
  - **Consequences:** spend now includes every answer read aloud; a forgotten `speak_aloud` call is covered by the read-aloud answer.
  - **Alternatives:** "Speak every answer automatically" is marked as adopted by the user on 2026-10-15, with its mitigations.
  - **Status and Change lines:** name tasks 3.4 and 4.4 as done and 6.7 as pending, and list D13–D17.

  Verify that ADR-0010 agrees with D15–D17 and that no other ADR is edited.
- [x] 6.2 [worker] Add the live key (design D15, "Live shortcut"):
  - **Setting:** `input.liveShortcut` in `input-settings.ts`, default `alt+l`, parsed like the other shortcut settings, and included in the repeated-key check across all five settings.
  - **Shortcuts:** the `Shortcuts` type in `config.ts` gains `live`, read at load like the others, with a matching load-time default in `index.ts`. Each key is registered in `index.ts` with a handler that calls the same toggle as `/talk live`.
  - **`live.ts`:**
    - the status line says that the live key or `/talk live` ends live mode;
    - the refusal message for other voice controls names the live key and `/talk live`.
  - **Help:** describes `input.liveShortcut` and lists the live key among the registered keys.
  - **Carried from the Wave 5 gate (R1-F2):**
    - help says "With the list empty, live mode detects any language unless input.language fixes one.";
    - the README settings row says "Empty adds no limit beyond `input.language`.";
    - `/speak status` prints `live languages: none`, with no parenthetical;
    - update the exact strings in `test/command.test.ts`;
    - optionally rename the test at `test/live.test.ts:49`, whose name still says "the existing realtime parameters".

  Verify with:
  - config cases: the default; one key and a list; a key repeated against each of the other four settings; an invalid value;
  - a test that the live key is registered and toggles live mode on and off, including ending while Pi speaks without aborting the agent;
  - the status-line, refusal-message, and help assertions.
- [x] 6.3 [worker] Show the words heard so far (design D16, "Words heard so far"):
  - **Partials:** `live.ts` always subscribes to `onPartial`, not only for barge-in. Barge-in still cuts Pi off only when `input.liveListenWhileSpeaking` is on.
  - **Widget:** the latest partial is shown with `setWidget` above the editor. A long partial may be shortened to its last words.
  - **Clearing:** the widget is cleared on commit, on every end path, and on session reset.
  - **Display only:** nothing is written to the composer, logs, or messages.

  Verify with tests:
  - a partial is shown and replaced by a newer one;
  - the widget clears on commit, on end, and on session reset;
  - the composer is untouched;
  - with barge-in off, a partial while Pi speaks does not cut Pi off;
  - a long partial is shortened.
- [x] 6.4 [worker] Read Pi's answers aloud (design D17, "Spoken replies"):
  - **Trigger:** an `agent_end` handler in `index.ts` reaches live mode only while it is `on`.
  - **Selection and cleanup:** the answer is selected with `selectSessionAnswer` and cleaned with `prepareAnswerText`, exactly as `/speak original` does.
  - **Parts:** split at paragraph breaks; a paragraph longer than 1,000 characters is split at sentence ends, or at a space when a single sentence is longer.
  - **Queue:** parts are queued on the live update queue while their total stays within the speech limit read at live start. When the answer is longer, one message says the rest was not read, without repeating it.
  - **Silent cases:** aborted or failed runs, no text, nothing speakable, and live mode off speak nothing and show no message.
  - **Guidance:** `speak-aloud.ts` drops the end-summary instruction and says that the final answer is read aloud automatically.
  - **Size:** keep `live.ts` under 500 lines; put the splitting in its own small module if that helps.

  Verify with:
  - splitter cases: paragraphs, a long paragraph split at sentences, an over-long sentence split at a space, and no empty parts;
  - a live test where a finished run queues parts in order without code;
  - the limit and its message;
  - cut-off dropping the remaining parts while live mode stays on;
  - aborted, no text, and live-off cases speak nothing;
  - the guidance text.
- [x] 6.5 [worker] Update the README's "Live conversation" section, the configuration example and defaults, and the settings table:
  - `input.liveShortcut` and its default;
  - the words heard so far being shown only;
  - answers read aloud in parts up to the speech limit, cleaned as for `/speak original`, with cut-off;
  - the privacy and cost text for answers sent to ElevenLabs.

  Verify with a read-through against the spec.

  For tasks 6.2–6.5, run each changed test file alone first inside the memory scope, then the full suite and the type check.
- [x] 6.6 [Orchestrator] With the user's approval of 2026-10-15, set `"shortcut": ["alt+s"]` and `"liveShortcut": ["alt+t"]` under `input` in `~/.config/pi-speak/config.json`, changing nothing else. Confirm that `parseConfig` from the Wave 6 code accepts the file.
- [x] 6.7 [User] Combined live check for Waves 5 and 6, after `/reload`:
  - alt+t starts live mode;
  - the start message says "limited to vi, en";
  - your words appear above the input box as you speak;
  - a 1.5 s pause mid-sentence stays one message;
  - Vietnamese and English are each transcribed in their own language, with no Chinese;
  - Pi's answer is read aloud, and alt+s cuts it off while live mode stays on;
  - "Dừng cuộc hội thoại" ends live mode;
  - alt+t ends live mode.

  Record the results here, or report them as unverified.

  Result (2026-10-15, reported by the user in live mode): the user confirmed that cutting Pi off with alt+s works ("mình đã thử và nó hoạt động"), then reported that every item of this check was tested and passed ("tất cả những yếu tố ở trên mà em cần test thì đã xong xuôi cả rồi … tất cả đều ổn cả"). The orchestrator observed in the same conversation that live turns arrive transcribed in Vietnamese, and that one turn was sent mid-sentence after a thinking pause of about 2 s ("…nhưng mà"). With the user's approval, `input.livePauseSeconds` in the user's own configuration was set to 3, the provider's maximum; the default stays 2. The per-item results were reported together, not one by one.
- [x] 6.8 [Oracle gate: `oracle`] Final review gate for Wave 6, run once after 6.1–6.6 are complete and 6.7 is complete or explicitly reported as unverified, under the same rules as 1.6: one wave-level review, advisory Oracle output, complete caller reconciliation and caller-owned `REVIEW_ACTION`, at most four rounds and one rebuild, terminal baseline validation, and `PATCH`/`REBUILD` returning to this wave.
