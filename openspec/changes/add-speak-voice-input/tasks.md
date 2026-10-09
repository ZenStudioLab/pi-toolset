# Tasks

Routing: focus mode. `worker` is the default implementer for grouped work and keeps one session across waves where practical. The orchestrator owns the ADR, spec and design amendments, reconciliation, task completion, and commits. `oracle` reviews each completed wave; it does not review individual tasks.

From Wave 2 round 2 on, only `worker` (`claude-bridge/claude-sonnet-5-5`, thinking high) and `oracle` (`claude-bridge/claude-opus-5-5`, thinking high) are dispatched, and both always run in the background (async). A foreground child runs inside the parent Pi process without the parent's extensions, so `pi-claude-bridge` never records its system prompt and every request fails with `prompt-capture: no capture for this … system prompt`. A background child is its own Pi process and records its own prompt. Background runs can still be steered.

Verification commands:

- **Speak tests:** `node --experimental-strip-types --test test/speak/*.test.ts`.
- **Type check:** `npx tsc --noEmit 2>&1 | grep -E 'extensions/speak|test/speak'`, which must print nothing. The repository-wide typecheck already fails on unrelated `extensions/pi-voicekit` errors.

## 1. Wave 1: decision record, provider facts, configuration

- [x] 1.1 [Orchestrator] Write `docs/adr/0004-voice-input-and-provider-choice.md`. It records push-to-talk microphone audio sent only after an explicit user action sends it (stopping a recording, or sending one held at the time cap; a held recording waits until the user sends or discards it), Deepgram and ElevenLabs as the only providers, environment-only keys, and session-only overrides. It keeps ADR-0002's manual-only rule for speech output. Must be done before any implementation task. Verify that the ADR links to this change and to ADR-0002, and that ADR-0002 is not edited except for a "Related" link.
- [x] 1.2 [Orchestrator] Check the facts design D9/D10 and Risks mark as unconfirmed, against current documentation or the installed host:
  - Deepgram Aura's per-request character limit;
  - whether `detect_language` works with `nova-3` for recorded audio;
  - the ElevenLabs `scribe_v2` model id;
  - whether `alt+t` is free in this Pi's default key bindings.

  Amend the spec and design values where they differ. Verify by recording each fact with its source URL or file in `design.md`, and confirm `openspec validate add-speak-voice-input --strict` passes.
- [x] 1.3 [worker] Change `config.ts` to the D6 shape: top-level `provider`; `providers.elevenlabs` (`voiceId`, `modelId`, `outputFormat`, `voiceRevision`, `sttModel`); `providers.deepgram` (`voice`, `sttModel`); and `input` (`provider`, `language`, `maxSeconds` 1–300 with default 60, and `shortcut` with default `alt+t`). Old flat keys are rejected with a message naming their new location. Verify with new table-driven cases in `test/speak/config.test.ts` (defaults, each provider block, invalid values, old flat keys, malformed `input.language`), passing speak tests, and a clean speak type check.
- [x] 1.4 [worker] Add the session overrides from design D7, with `/speak provider [elevenlabs|deepgram|reset]` and `/talk provider [deepgram|elevenlabs|reset]` (parsing and reporting only; `/talk` recording comes in wave 3). Extend `/speak status` per the modified Status reporting requirement. Verify with cases in `test/speak/command.test.ts` for setting, reporting, resetting, unknown names, and that no request is made. Add a status case showing both keys as present only and the override marked.
- [x] 1.5 [worker] Move the redirect, deadline, response-cap, and error-sanitizing logic from `elevenlabs.ts` into one bounded-request helper (design D8) without changing behavior. Verify that the existing `test/speak/provider.test.ts` passes unchanged and the speak type check is clean.
- [x] 1.6 [worker] Replace `playerEnvironment` in `audio.ts` with one child-environment helper that removes both `ELEVENLABS_API_KEY` and `DEEPGRAM_API_KEY`. Use it for the player now; the recorder uses it in 3.1 (design D3). Verify by extending `test/speak/audio.test.ts` with both keys present: neither reaches the player, and an unrelated audio variable such as `PULSE_SERVER` is kept.
- [x] 1.7 [Oracle gate: `oracle`] Review gate for Wave 1, run once after 1.1–1.6 are complete. It reviews the whole completed wave against the specs and design, not individual tasks, under `review-convergence`. Oracle output is advisory: it reports findings and one `PROPOSED_REVIEW_ACTION`. The caller reconciles every finding and solely owns `REVIEW_ACTION`, `CONSENSUS_STATUS`, edits, and termination. At most four Oracle rounds and one recorded rebuild. A terminal `PASS` or `HUMAN_DECISION` requires checking against the latest candidate revision and frozen boundary. A caller-owned `PATCH` or `REBUILD` returns work to this wave and reuses this gate.

## 2. Wave 2: Deepgram speech output

- [x] 2.1 [worker] Add Deepgram synthesis to a new `deepgram.ts` per the "Deepgram synthesis request" requirement: fixed `/v1/speak` origin, `model` set to the voice, MP3, `Authorization: Token`, using the bounded-request helper. Verify with table cases in `test/speak/provider.test.ts`: success, JSON error document, redirect, timeout, missing key, and no ElevenLabs request on failure.
- [x] 2.2 [worker] Make `speech-job.ts` choose the speech provider:
  - the per-provider ceiling (10000 for ElevenLabs, the Deepgram value from 1.2);
  - preflight for the selected provider's key and voice;
  - the Aura language check before translation (design D9);
  - the provider in the cache key, with a fixed voice-revision value for Deepgram;
  - the progress line naming the job's provider during synthesis;
  - translation failure messages naming the job's provider as the one that received no text.

  Verify with cases in `test/speak/job.test.ts`, `test/speak/localized-job.test.ts`, and `test/speak/progress.test.ts`: Deepgram ceiling refusal, a Vietnamese locale refused with an `-en` voice before any translation call, `/speak original` not language-checked, an override not affecting a running job, no ElevenLabs request when Deepgram is selected, an ElevenLabs clip not reused for Deepgram, the Deepgram progress phase, and a translation failure naming Deepgram.
- [x] 2.3 [worker] Update `extensions/speak/README.md`. Cover the new config shape and the hand migration from the flat format, provider switching (session-only; the file is never written), Deepgram's limit and language rule, and the data-leaving-the-machine statement for both providers. Keep the existing `/<name>` note. Verify that every config example in the README parses with `parseConfig` in a one-off script, and that every documented command matches the registered usage text.
- [x] 2.4 [Oracle gate: `oracle`] Review gate for Wave 2, run once after 2.1–2.3 are complete, under the same rules as 1.7: one wave-level review, advisory Oracle output, complete caller reconciliation and caller-owned `REVIEW_ACTION`, at most four rounds and one rebuild, terminal baseline validation, and `PATCH`/`REBUILD` returning to this wave.

## 3. Wave 3: push-to-talk voice input

- [x] 3.1 [worker] Add `record.ts` per design D3: the recorder lookup order, fixed arguments with no shell, the child-environment helper from 1.6, in-memory PCM capped at `maxSeconds`, an in-memory WAV header, a coarse level value, and SIGINT-then-SIGKILL stop. Copied privateer-speak code keeps its MIT notice. Verify with a fake spawn in a new `test/speak/record.test.ts`: lookup order, no tool found, an unexpected early exit and no audio reported as failures, a requested stop (user or time cap) keeping its audio and not reported as a failure, the byte cap, the environment excluding both keys, a valid WAV header, and the process stopped on discard.
- [x] 3.2 [worker] Add Deepgram transcription to `deepgram.ts` and ElevenLabs transcription to `elevenlabs.ts`, per the "Fixed-destination transcription request" requirement. Verify with table cases in `test/speak/provider.test.ts`: request URL and parameters per provider (`language` versus `detect_language`, `tag_audio_events=false`), the 1 MiB response cap, redirect, timeout, empty transcript, and no other-provider request on failure.
  - Carried from Wave 2 review (W2-F2): read HTTP error bodies inside the bounded-request boundary for every client (Deepgram speech, Deepgram transcription, ElevenLabs transcription). Add tests for an error body that times out or is cancelled after the headers arrive.
  - Carried from Wave 2 review (W2-F7): add a `test/speak/job.test.ts` case with Deepgram selected and no `DEEPGRAM_API_KEY`, for both `text` and localized speech, expecting `DEEPGRAM_API_KEY is not set`, zero translation calls, and zero fetches.
- [x] 3.3 [worker] Add the push-to-talk controller and its wiring in `index.ts`:
  - the `/talk` command and the `input.shortcut` registered at load (design D10);
  - start, stop, Escape discard (D5), the 0.5-second minimum, and only one active recording or transcription;
  - the time cap stopping the recorder and holding the audio unsent until the next press sends it, with Escape, session replacement, and shutdown discarding held audio (D1);
  - the input provider, transcription model, and language fixed when a recording starts (D7);
  - stopping the extension's own speech before recording;
  - appending the transcript (D4), and dropping late transcripts on session replacement;
  - the recording status line, including the held-at-cap state;
  - interactive mode only.

  Verify with a new `test/speak/talk.test.ts` covering every scenario in `specs/voice-input/spec.md`. Extend `test/speak/silence.test.ts` so load, reload, and session events start no recorder and make no request.
- [x] 3.4 [worker] Add a voice-input section to `extensions/speak/README.md`: setup (recording tools, keys, the `input` block), controls (including the held-at-cap state and its send and discard keys), the fact that the composer is never submitted, and the privacy statement that a recording the user sends goes to the selected provider while a discarded or held-unsent one never leaves the machine. Verify that the documented controls match the registered command and shortcut, and that the config example parses.
  - Carried from Wave 2 review (W2-F4, W2-F8): restore the setup guidance for an authorized voice, Pi-authenticated translation, translation being optional, and `voiceRevision`. Keep defaults separate from illustrative choices, and use the recognized placeholder `SET_YOUR_AUTHORIZED_VOICE_ID` for both providers' voices in the config example.
  - Carried from Wave 2 review (W2-F5): state that provider overrides survive session switching, forking, and navigation, and end on restart, reload, or `reset`.
- [x] 3.5 [Oracle gate: `oracle`] Review gate for Wave 3, run once after 3.1–3.4 are complete, under the same rules as 1.7: one wave-level review, advisory Oracle output, complete caller reconciliation and caller-owned `REVIEW_ACTION`, at most four rounds and one rebuild, terminal baseline validation, and `PATCH`/`REBUILD` returning to this wave.

## 4. Wave 4: integration and live checks

- [x] 4.1 [Orchestrator] Integration check: run the full speak test suite and the speak type check. Confirm that `pi -e extensions/speak/index.ts`, run non-interactively, loads and exits with no network use and no recorder process. Verify with recorded exit codes and any startup warnings.
  - Carried from Wave 3 review, done by `worker` before the integration check:
    - W3-F1: finish a recording on the recorder's `close` event instead of `exit`, keep `error` for spawn failures, make `FakeChild.finish` emit `close`, and add one test with an audio chunk between `exit` and `close`.
    - W3-F2: treat Escape or a second press while a recording is starting (waiting for the player to exit) as cancelling the attempt, so Escape does not reach the editor.
    - W3-F3: add one README sentence that dictation-only users may leave out `providers.elevenlabs.voiceId`.
    - W3-F4: correct the `loadConfig` comment: the config is read on demand, plus once at load for `input.shortcut`.
  - Run the speak suite cold several times. If the unexplained single failure from the Wave 3 review recurs, identify the test and fix its timing.
- [x] 4.2 [Orchestrator] Show the user the current and proposed `~/.config/pi-speak/config.json` (design D6) and rewrite it only with their explicit approval. Verify that `/speak status`, after `/reload`, reports the migrated settings with no configuration error.
- [x] 4.3 [User] Live checks, run only by the user with their own keys:
  - `/speak provider deepgram`, then `/speak text` with one short English sentence;
  - `/talk` with Deepgram in Vietnamese;
  - `/talk provider elevenlabs`, then one recording;
  - one Escape discard;
  - if `input.language` is set, whether each provider accepts it as written (a region tag such as `vi-VN` may be refused).

  Record what was heard and transcribed, and any error shown. Leave this unchecked and report it as unverified until the user has run it.

  Result (2026-10-09): verified by the user were ElevenLabs speech with Vietnamese translation, `/speak text`, ElevenLabs voice input, and `input.language: vi` accepted by ElevenLabs, with no errors shown. Explicitly unverified: the Deepgram speech and input checks (no `DEEPGRAM_API_KEY`, by the user's choice), Deepgram's handling of the language tag, and a real-terminal Escape discard.
- [x] 4.4 [Oracle gate: `oracle`] Final review gate for Wave 4, run once after 4.1–4.2 are complete and 4.3 is complete or explicitly reported as unverified, under the same rules as 1.7: one wave-level review, advisory Oracle output, complete caller reconciliation and caller-owned `REVIEW_ACTION`, at most four rounds and one rebuild, terminal baseline validation, and `PATCH`/`REBUILD` returning to this wave.

## 5. Wave 5: send key, session locale, help (amendment of 2026-10-09)

- [x] 5.1 [Orchestrator] Amend the change for the user's requests after the live checks: write ADR-0005 (`docs/adr/0005-voice-send-and-session-locale.md`) and mark ADR-0004's delivery rule as superseded; update `proposal.md`, design D4, D5, D6, D10 and Risks, and add D11–D14 plus the provider length facts; update `specs/voice-input/spec.md` and the `specs/manual-speech/spec.md` delta. This also fixes the Wave 4 carry-over W4-F1 (Escape while a recording is starting) in the design and spec. Verify with `openspec validate add-speak-voice-input --strict`.
- [x] 5.2 [worker] Change `config.ts`: add `input.transcribeShortcut` (default `alt+shift+t`) and `input.sendWhenBusy` (`interrupt` or `wait`, default `interrupt`), reject equal shortcut values, and change the `input.maxSeconds` default to 120 (ceiling 300 unchanged). Verify with table cases in `test/speak/config.test.ts`: both defaults, both accepted values and a rejected value for `sendWhenBusy`, equal shortcuts rejected, and the 120 default.
- [x] 5.3 [worker] Add the send mode to `talk.ts` and `index.ts` per design D10 and D11:
  - register both shortcuts at load, add `/talk send`, and keep `/talk` transcribe-only;
  - the stopping control decides the mode, including for a held recording;
  - in send mode, append as before, then send the whole composer with `pi.sendUserMessage` as plain text (no prompt-template or command expansion) and clear the composer only after the call returns; on failure keep the draft plus transcript and show the error;
  - when the agent is not idle, deliver with `steer` for `interrupt` and `followUp` for `wait`;
  - an empty or dropped transcript sends nothing;
  - the status line names both stop keys, and the held state names the send, transcribe-only, and discard keys.

  Verify with cases in `test/speak/talk.test.ts` for every new or changed scenario in `specs/voice-input/spec.md`, and update `test/speak/silence.test.ts` so loading registers both shortcuts and still starts no recorder and makes no request.
- [x] 5.4 [worker] Add the session and one-command speech locale per design D13: `/speak locale [<tag>|reset]` and `/speak in <tag>`, the locale order (one-command tag, then session, then config) fixed at job start and used by the Aura language check, translation, and both cache keys, and `/speak status` marking a session locale. Verify with cases in `test/speak/command.test.ts`, `test/speak/localized-job.test.ts`, and `test/speak/job.test.ts` for every new scenario in the manual-speech delta, plus an Aura voice refused for a session locale before any translation.
- [x] 5.5 [worker] Add the combined help per design D14 and the "Combined help for speak and voice input" requirement: `/speak help`, `/talk help`, and their short forms `/speak ?` and `/talk ?` (user request, 2026-10-09) show the same text with every form, the registered shortcuts and which one sends, the Escape behaviour, and the effective locale; unknown arguments show it too. Replace the hard-coded `(default vi)`. Verify in `test/speak/command.test.ts`, including a config error while building help.
- [x] 5.6 [worker] Update `extensions/speak/README.md`: the controls table with both keys and the starting state (W4-F1), `/talk send`, `input.transcribeShortcut`, `input.sendWhenBusy`, the 120-second default, the locale commands, help, and a plain warning that the default `alt+t` now sends. Keep the `/<name>` note. Verify that the config example parses once its placeholders are replaced, and that every documented form matches the registered usage.
- [ ] 5.7 [User] Live checks:
  - `alt+t` with the agent idle: the draft and transcript are sent;
  - `alt+t` while the agent is working: the message reaches the running turn;
  - `alt+shift+t`: the transcript is added and nothing is sent (this also confirms the terminal delivers the key);
  - `/speak locale en`, then `/speak`; then `/speak in ja`;
  - `/speak help`, then `/talk ?`.

  Record what happened and any error shown. Leave this unchecked and report it as unverified until the user has run it.

  Status (2026-10-09): not run. The user asked to continue to Wave 6, so gate 5.8 ran with this task reported as unverified. These checks are carried into the Wave 6 live checks and are ticked there.
- [x] 5.8 [Oracle gate: `oracle`] Review gate for Wave 5, run once after 5.2–5.6 are complete and 5.7 is complete or explicitly reported as unverified, under the same rules as 1.7: one wave-level review, advisory Oracle output, complete caller reconciliation and caller-owned `REVIEW_ACTION`, at most four rounds and one rebuild, terminal baseline validation, and `PATCH`/`REBUILD` returning to this wave.

## 6. Wave 6: spoken stop phrase (amendment of 2026-10-09)

- [x] 6.1 [Orchestrator] Amend the change for the spoken stop phrase. Write ADR-0006 (`docs/adr/0006-spoken-stop-phrase.md`), and mark the superseded parts in the status lines of ADR-0004 and ADR-0005. Update `proposal.md`, design Non-Goals, D2, D6, Risks and Verified Provider Facts, and add D15. Add the "Spoken stop phrase" requirement to `specs/voice-input/spec.md`, and adjust its lifecycle and privacy requirements. Verify with `openspec validate add-speak-voice-input --strict`.
- [x] 6.2 [worker] Change `config.ts`: add `input.stopOnPhrase` (default `false`) and `input.stopPhrases` (1 to 10 phrases, each 1 to 40 characters after trimming, default `["let's go"]`), each with errors on invalid values. Show both in `/speak status` and in help. Verify with table cases in `test/speak/config.test.ts`, and the status and help cases in `test/speak/command.test.ts`.
- [x] 6.3 [worker] Add the ElevenLabs live transcription client in a new `extensions/speak/realtime.ts`, per design D15:
  - the fixed URL and query, with the key only in the `xi-api-key` header, and an open deadline of `requestTimeoutMs`;
  - `input_audio_chunk` sending, and a final commit;
  - parsing `committed_transcript`, while ignoring `partial_transcript`;
  - the 64 KiB per-message and 1 MiB total caps;
  - mapping every error message type and an unexpected close to sanitized classes, with the key redacted;
  - no retry and no reconnect.

  Also add a pure stop-phrase matcher (normalization, whole words at the end, and removal of the phrase). Verify with a fake `WebSocket` in a new `test/speak/realtime.test.ts`: URL, query and header; open timeout; chunk shape; final commit and its wait deadline; each error class; the size caps; and table cases for the matcher, including curly apostrophes, punctuation, case, the phrase only, the phrase in the middle, and Vietnamese diacritics.
- [x] 6.4 [worker] Integrate streaming into `talk.ts` per D15:
  - with the feature on and ElevenLabs fixed at start, open the connection before starting the recorder;
  - stream each chunk and keep the in-memory audio, so the cap and the level bar still work;
  - when a stop phrase is detected, stop and send through the existing D11 path, including its pre-send refusals and `sendWhenBusy`;
  - a key or command stop requests the final commit and delivers in that control's mode;
  - Escape closes the stream and sends nothing;
  - at the time cap, hold the text until the next press or command;
  - on a failure, append the committed text without sending;
  - with Deepgram selected, refuse with no recording;
  - close the stream on session replacement and shutdown, and drop late messages;
  - never upload the streamed audio a second time.

  Verify with cases in `test/speak/talk.test.ts` for every scenario of "Spoken stop phrase" in `specs/voice-input/spec.md`. Extend `test/speak/silence.test.ts` so loading with the feature on still opens no connection.
- [x] 6.5 [worker] Update `extensions/speak/README.md` and the help text:
  - how to turn the stop phrase on, with `input.stopOnPhrase` and `input.stopPhrases`;
  - how detection works (the phrase must be the last words before a pause of about 1 second);
  - that it uses ElevenLabs only;
  - the privacy statement: while it is on, audio streams as you speak, and Escape cannot recall audio already sent;
  - how keys and Escape behave during a streamed recording.

  Verify that the config example parses once its placeholders are replaced.
- [ ] 6.6 [User] Live checks, covering Waves 5 and 6:
  - **Carried from 5.7:**
    - `alt+t` with the agent idle sends the draft and the transcript;
    - `alt+t` while the agent is working reaches the running turn;
    - `alt+shift+t` adds the text without sending, which also confirms the terminal delivers the key;
    - `/speak locale en`, then `/speak`; then `/speak in ja`;
    - `/speak help`, then `/talk ?`.
  - **Deepgram, not run in Wave 4:**
    - `/speak provider deepgram`, then `/speak text Hello there`;
    - `/talk provider deepgram`, then one recording.
  - **Escape:** one discard during a normal recording.
  - **Stop phrase:** set `"stopOnPhrase": true`, then:
    - dictate a sentence ending in "let's go" and pause: it is sent without the phrase;
    - say "let's go" in the middle of a sentence: the recording continues;
    - stop a streamed recording with `alt+shift+t`: the text is added, not sent;
    - speak, pause about 2 seconds, then press `alt+t`: the text is sent with no error and no long wait (W6-F1);
    - press Escape during a streamed recording: nothing is sent;
    - one Vietnamese dictation, which checks Vietnamese support in the live model.

  Record what happened and any error shown. Tick 5.7 and 6.6 only for checks the user actually ran, and report the rest as unverified.
- [x] 6.7 [Oracle gate: `oracle`] Review gate for Wave 6, run once after 6.2–6.5 are complete and 6.6 is complete or explicitly reported as unverified. The same rules apply as for 1.7: one wave-level review, advisory Oracle output, complete caller reconciliation, a caller-owned `REVIEW_ACTION`, at most four rounds and one rebuild, and terminal baseline validation. `PATCH` or `REBUILD` returns to this wave.

## 7. Wave 7: extra shortcut keys and the Wave 6 carry-overs (amendment of 2026-10-09)

- [x] 7.1 [Orchestrator] Amend design D10, the "Talk command contract" and "Recording indicator" requirements in `specs/voice-input/spec.md`, and the manual-speech help requirement. They now cover shortcut lists, so the user can add `alt+y` and `alt+shift+y` next to the T keys, and a held status line shown from the moment the cap is reached (W6-F5). Verify with `openspec validate add-speak-voice-input --strict`.
- [ ] 7.2 [worker] Allow lists of shortcut keys, per D10:
  - In `config.ts`, `input.shortcut` and `input.transcribeShortcut` each accept one key or a list of 1 to 4 keys. A key repeated anywhere across both settings, ignoring case, is a configuration error.
  - In `index.ts`, register every key, and fall back to the two defaults on a config error.
  - Help and the recording status lines name every registered key of each mode.

  Verify with table cases in `test/speak/config.test.ts`, the registration cases in `test/speak/silence.test.ts`, and a `test/speak/talk.test.ts` case for the "Extra keys per mode" scenario.
- [ ] 7.3 [worker] Fix the Wave 6 carry-overs:
  - **W6-F5:** in `onCapped`, redraw the status line after marking the recording held. Add status assertions to the cap-window tests in `test/speak/talk.test.ts` and `test/speak/talk-stream.test.ts`.
  - **W6-F4:** add "a recorder that fails while recording" to the failure list in the README.

  Also update the README for shortcut lists. Give the `alt+y` example, and note that it replaces Pi's yank-pop and that Pi shows a conflict notice at startup.
- [ ] 7.4 [Orchestrator] After 7.2 and 7.3, and with the user's approval, set the user's config to `"shortcut": ["alt+t", "alt+y"]` and `"transcribeShortcut": ["alt+shift+t", "alt+shift+y"]`, with a backup first. Verify it with `parseConfig`.
- [ ] 7.5 [User] Live checks: run task 6.6 (which carries 5.7), plus `alt+y` sends, `alt+shift+y` only transcribes, and the conflict notice at startup names only `alt+y`. Record what happened, and report anything not run as unverified.
- [ ] 7.6 [Oracle gate: `oracle`] Review gate for Wave 7, run once after 7.2–7.4 are complete and 7.5 is complete or explicitly reported as unverified. The same rules apply as for 1.7.
