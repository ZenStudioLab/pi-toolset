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

- [ ] 4.1 [Orchestrator] Integration check: run the full speak test suite and the speak type check. Confirm that `pi -e extensions/speak/index.ts`, run non-interactively, loads and exits with no network use and no recorder process. Verify with recorded exit codes and any startup warnings.
  - Carried from Wave 3 review, done by `worker` before the integration check:
    - W3-F1: finish a recording on the recorder's `close` event instead of `exit`, keep `error` for spawn failures, make `FakeChild.finish` emit `close`, and add one test with an audio chunk between `exit` and `close`.
    - W3-F2: treat Escape or a second press while a recording is starting (waiting for the player to exit) as cancelling the attempt, so Escape does not reach the editor.
    - W3-F3: add one README sentence that dictation-only users may leave out `providers.elevenlabs.voiceId`.
    - W3-F4: correct the `loadConfig` comment: the config is read on demand, plus once at load for `input.shortcut`.
  - Run the speak suite cold several times. If the unexplained single failure from the Wave 3 review recurs, identify the test and fix its timing.
- [ ] 4.2 [Orchestrator] Show the user the current and proposed `~/.config/pi-speak/config.json` (design D6) and rewrite it only with their explicit approval. Verify that `/speak status`, after `/reload`, reports the migrated settings with no configuration error.
- [ ] 4.3 [User] Live checks, run only by the user with their own keys:
  - `/speak provider deepgram`, then `/speak text` with one short English sentence;
  - `/talk` with Deepgram in Vietnamese;
  - `/talk provider elevenlabs`, then one recording;
  - one Escape discard;
  - if `input.language` is set, whether each provider accepts it as written (a region tag such as `vi-VN` may be refused).

  Record what was heard and transcribed, and any error shown. Leave this unchecked and report it as unverified until the user has run it.
- [ ] 4.4 [Oracle gate: `oracle`] Final review gate for Wave 4, run once after 4.1–4.2 are complete and 4.3 is complete or explicitly reported as unverified, under the same rules as 1.7: one wave-level review, advisory Oracle output, complete caller reconciliation and caller-owned `REVIEW_ACTION`, at most four rounds and one rebuild, terminal baseline validation, and `PATCH`/`REBUILD` returning to this wave.
