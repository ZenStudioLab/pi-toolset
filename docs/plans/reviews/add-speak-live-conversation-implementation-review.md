# Implementation Review: add-speak-live-conversation

Workflow: `/opsx-apply-loop add-speak-live-conversation` (started after proposal review `REVIEW_ACTION=PASS`, see `add-speak-live-conversation-review.md`).

selected reviewer: oracle
selected default implementation specialist: worker
focus mode: focus
orchestrator mode: normal

Baseline before Wave 1: pi-toolset `HEAD` with the change artifacts uncommitted; `extensions/speak` (`pi-speak`) clean at `b9f354d`. `npm test` in `extensions/speak`: 681 pass, 0 fail. `npm run typecheck`: clean.

Carried from the proposal review (accepted nonblocking, see that log's "Carried to apply"): F5, F6, F9, F11, F12, R2-F4, R3-F1.

## Wave 1 Review Sequence

## Round 1 - Implementation Assignments

Wave handled: 1. Final gate reserved: task 1.6 [Oracle gate: `oracle`], run once after 1.1–1.5.

| Assignment | Tasks | Owner | Bounded responsibility | Files and topics |
| --- | --- | --- | --- | --- |
| W1-A | 1.1 | orchestrator | ADR-0010 and the supersession notes | `docs/adr/0010-live-voice-conversation.md`, `docs/adr/0002-…`, `docs/adr/0004-…`, `docs/adr/0006-…`, task 1.1 wording (F9) |
| W1-B | 1.2, 1.3, 1.4, 1.5 | worker | Live settings; streaming recorder mode; `onPartial`; `speech-job.ts` split check and `speakLive` | `extensions/speak/input-settings.ts`, `record.ts`, `realtime.ts`, `speech-job.ts` (and any file a clean split creates), matching tests in `extensions/speak/test/` |

### W1-A (orchestrator) evidence

- Wrote `docs/adr/0010-live-voice-conversation.md`. It links the change design and ADR-0002, ADR-0004, ADR-0005, ADR-0006, and ADR-0008, and names ADR-0002's rejected "model-callable speech tool" (F9).
- ADR-0002 and ADR-0004: one status-line supersession note each, following the ADR-0004 precedent (F9). ADR-0006: one "Related" line. No other ADR text changed.
- Task 1.1's verification wording was amended to match F9.

### W1-B (worker, run aborted; reconciled and finished by the orchestrator)

The worker run (mission `380dfa16`) was aborted while it ran the test suite. Its writes were inspected before any rerun:

- **1.2:** `input-settings.ts` adds `liveIdleMinutes` (integer 1–60, default 5) and `liveListenWhileSpeaking` (boolean, default false). Both keys are in `INPUT_KEYS`, so unknown keys are still rejected. `test/config.test.ts` adds table-driven rejection cases, defaults, both bounds, and an unknown key beside the live settings.
- **1.3:** `record.ts` adds `RecorderRetention` (`{ retain?: true; maxSeconds } | { retain: false }`). `test/record.test.ts` covers the streaming recorder with no cap, nothing kept, a requested stop with no audio, and an exit on its own as a failure.
- **1.4:** `realtime.ts` adds the optional `onPartial(text)` for non-empty trimmed `partial_transcript` messages. The 64 KiB message limit still ends the session. `test/realtime.test.ts` covers this.
- **1.5:** split decision: a clean boundary existed, and `speech-job.ts` went from 659 to 487 lines. The new files and their responsibilities:
  - `speech-clip.ts` (75): cache identity and the synthesis request;
  - `speech-preflight.ts` (117): the checks before any billable request;
  - `speech-status.ts` (61): `/speak status`;
  - `quota-lookup.ts` (56): `/speak quota`.

  `SpeechController`'s public methods are unchanged, and the only new one is `speakLive(text, hooks)`. It pins `elevenlabs` as the job's provider override, skips `speechBlock`, uses the same preflight, cache, player, and progress line as `speak(text)`, and calls `onPlayerStart`/`onPlayerExit` around the player. No existing test assertion or import changed; `test/job.test.ts` only adds the `speakLive` cases.

#### Memory incident and orchestrator corrections

- **Incident:** three test runs were killed by the kernel's out-of-memory killer at 09:24:08 (the worker), 09:41:30, and about 09:50 (the orchestrator), each at 23–25 GB. The kills also took down herdr and other Pi sessions.
- **Root cause, part 1 (product bug):** `retain: false` still pushed every chunk into `chunks` and returned them on stop, contradicting design D5. In real live mode this holds about 115 MB per hour of audio.
- **Root cause, part 2 (amplifier):** the test's `assert.deepEqual(exit, { …, pcm: Buffer.alloc(0) })` then failed on a 4.16 MB buffer. Node 22.19's assertion diff inspects buffers with `maxArrayLength: Infinity` and `compact: false`, one line per byte. Its `myersDiff` then clones a 33 MB `Int32Array` per diff step. Confirmed from the source embedded in `/home/zenji/.nvm/versions/node/v22.19.0/bin/node`, read as text.
- **Fix in `record.ts`:** `capBytes` is `undefined` for a streaming recorder. Its chunks go only to `onLevel`/`onChunk`, and nothing is stored or counted.
- **Fix in `test/record.test.ts`:** the streaming test compares `kind`, `pcm.length`, and `capped` with `assert.equal`, with a comment explaining why.
- **Rename in `speech-job.ts`:** the new `Job.live` field became `liveHooks`, so that it no longer shares its name with the existing `live(job)` method ("this job is still current").
- **`tasks.md` (user-approved):** every test or type-check run now goes inside `systemd-run --user --scope -q -p MemoryMax=4G -p MemorySwapMax=0`. A new or changed test file runs alone first, and large buffers are not compared with `deepEqual`. Verified: the scope's `memory.max` is 4294967296 and its `memory.swap.max` is 0.

#### Validation (all inside the 4 GB scope)

- `node --experimental-strip-types --test test/record.test.ts`: 17 pass, 0 fail.
- `node --experimental-strip-types --test test/*.test.ts` (from `extensions/speak`): 702 pass, 0 fail (baseline 681).
- `npx tsc --noEmit`: clean.
- `openspec validate add-speak-live-conversation --strict`: valid, with the expected archive-order note.
- Line counts: `speech-job.ts` 487, `record.ts` 211, `realtime.ts` 343, `input-settings.ts` 179; all under 500.

DISPATCH_BUDGET wave 1: oracle=0/1 others=1/3 (before the gate)

BASELINE_TARGET=Wave 1 of add-speak-live-conversation: tasks 1.1–1.5 as implemented
BASELINE_TARGET_REVISION=sha256:4a0b33c24fa74512 (git -C extensions/speak diff HEAD, then the four new speak files in name order, then git diff HEAD -- docs/adr, then docs/adr/0010-live-voice-conversation.md)
BASELINE_SOURCE=openspec/changes/add-speak-live-conversation (proposal, design, tasks, three spec deltas); docs/adr/0002, 0004, 0005, 0006, 0008
BASELINE_INCLUSION_PREDICATE=files changed or created for tasks 1.1–1.5: extensions/speak/{input-settings,record,realtime,speech-job,speech-clip,speech-preflight,speech-status,quota-lookup}.ts, extensions/speak/test/{config,record,realtime,job}.test.ts, docs/adr/0002, 0004, 0006, 0010
BASELINE_EXCLUSIONS=Wave 2 and 3 work (live.ts, the speak_aloud tool, README, help); unrelated uncommitted add-pi-session-rename-tool files; host/pi

## Round 1 - Oracle Review

Gate task consumed (once): 1.6 [Oracle gate: `oracle`] Review gate for Wave 1, run once after 1.1–1.5 are complete. Mode: FULL (first review of this wave), under `review-convergence`. Output is advisory; the caller owns reconciliation, the authoritative action, and status.

Task and owner mapping reviewed:

| Task | Owner | Reviewed against |
| --- | --- | --- |
| 1.1 | orchestrator (W1-A) | ADR-0010; status-line notes in ADR-0002 and ADR-0004; "Related" line in ADR-0006; carried F9 |
| 1.2 | worker, finished by orchestrator (W1-B) | `input-settings.ts`, `test/config.test.ts`; D11; "Live idle limit" and "Live mode status, help, and settings" (settings parts) |
| 1.3 | worker, finished by orchestrator (W1-B) | `record.ts`, `test/record.test.ts`; D5 |
| 1.4 | worker, finished by orchestrator (W1-B) | `realtime.ts`, `test/realtime.test.ts`; D8 |
| 1.5 | worker, finished by orchestrator (W1-B) | `speech-job.ts` against `HEAD:speech-job.ts`; new `speech-clip.ts`, `speech-preflight.ts`, `speech-status.ts`, `quota-lookup.ts`; `test/job.test.ts`; D7, D10; "Speaking live updates"; modified `manual-speech` requirements |

Baseline: recomputed `sha256` over `git -C extensions/speak diff HEAD`, then `quota-lookup.ts`, `speech-clip.ts`, `speech-preflight.ts`, `speech-status.ts`, then `git diff HEAD -- docs/adr`, then `docs/adr/0010-live-voice-conversation.md`. The digest is `4a0b33c24fa745121ab8…`, so `BASELINE_TARGET_REVISION=sha256:4a0b33c24fa74512` is **confirmed**. `extensions/speak` status shows only the eight modified and four new files of the inclusion predicate. No tests were re-run, so the recorded evidence stands (702 pass and a clean `tsc`, both inside the 4 GB scope). Nothing gave a concrete reason to re-run them.

### What holds

- **Split (1.5, D10).** The moved code was compared line by line with `HEAD:speech-job.ts`. Preflight (HEAD L420–516 → `speech-preflight.ts`), the clip identity and synthesis call (HEAD L541–604 → `speech-clip.ts`), and quota (HEAD L227–256 → `quota-lookup.ts`) are verbatim, apart from the job-currency check, which is now passed in as `isCurrent()`. `whenIdle` keeps its call-time snapshot of the quota task, and `resetSession` still aborts and clears the pending lookup. Mutable state has one owner each: the job, `lastClip`, the overrides, and the translator stay in `SpeechController`, and the quota request and task live only in `QuotaLookup`. No duplicated authority. The back-imports (`speech-preflight`, `speech-status`, and `quota-lookup` → `speech-job`) are `import type` only, so no runtime cycle. `quota()` and `status()` are the unchanged public API delegating to their new owners, and private `preflight()` adapts the job to `isCurrent`. Neither is a forwarding-only layer. Every file is under 500 lines (487/75/117/61/56). No existing assertion in `test/job.test.ts` changed.
- **`speakLive` (1.5, D7).** `begin` pins `speechProviderOverride: "elevenlabs"` for live jobs (`speech-job.ts:279`) without touching the session override, and the test checks that it stays `deepgram`. `speechBlock` is skipped only when hooks are present (`:265`). It runs the same `generateAndPlay` path (preflight, length limit, cache, player, progress widget). The hooks wrap `player.done` (`:481–483`), so `onPlayerExit` also fires when `/speak stop` kills the player. The function returns `run()`'s promise, which never rejects, and resolves on cancel before playback (test with an abort-aware fetch). All four required test cases are present and mutation-sensitive, plus a length-limit case.
- **Recorder (1.3, D5).** With `retain: false`, `capBytes` is `undefined`, and chunks go only to `onLevel`/`onChunk` (`record.ts:190–195`). Nothing is pushed or counted. A requested stop with no audio resolves as `stopped` with an empty `pcm`, and an unrequested exit is still `failed`. The capped path is unchanged, since `capBytes !== undefined && total === 0` equals the old `total === 0`, and `talk.ts`'s call is untouched. The streaming test compares lengths, not buffers, so it would catch a reintroduced retention: `pcm.length` would be 4.16 MB.
- **Partials (1.4, D8).** `onPartial` sits after the 64 KiB check and the error-class dispatch. It is never added to `text` or `textBytes`, and it is optional, so a session without the handler behaves as before. The existing "partial transcripts ignored" test still covers that.
- **Settings (1.2, D11).** These are flat keys in `INPUT_KEYS`, `integerInRange(…,1,60)` and a strict boolean. The tests cover table-driven rejections, the defaults, both bounds, and an unknown key beside the live keys.
- **ADR (1.1, F9).** ADR-0010 links the change design and ADR-0002, 0004, 0005, 0006, and 0008, and names "model-callable speech tool" (L38). ADR-0002 and ADR-0004 each changed only on the status line, and ADR-0006 only got a "Related" line.

### Findings (highest priority first; no P0, P1, or P2)

**R1-F1 — family `split-behavior-preservation`, root `status-job-phase-read-time`.** P3. In scope.
- Evidence: `HEAD:speech-job.ts:294` read `this.job.phase` *after* the awaited `loadConfig`, `findRecorder`, and `cache.stats()`. The new `speech-job.ts:252` captures `jobPhase: this.job?.phase` *before* `reportStatus` awaits anything. A job that moves from preparing to generating, or ends, during those awaits is now reported with its earlier phase. Task 1.5 requires the split to be "without changing behavior". The effect is cosmetic, and the existing status test passes either way.
- SUGGESTED_CORRECTION: pass a getter (`jobPhase: () => this.job?.phase`) and call it where `speech-status.ts:59` builds the `job:` line. Alternatively, the caller can record that the call-time snapshot is accepted as equivalent.

**R1-F2 — family `live-hook-safety`, root `hook-throw-orphans-player`.** P3. In scope (latent until Wave 3 supplies the hooks).
- Evidence: `speech-job.ts:480–483` calls `job.liveHooks?.onPlayerStart()` after `startPlayer` and outside any guard. If the hook throws, `run()`'s `catch` reports "Speech failed", and its `finally` (`:352–355`) clears `this.job`. The player keeps playing, and `/speak stop` and `stopOwnAudio()` can no longer reach it. That breaks the "terminate only its own tracked player" guarantee of the modified `manual-speech` "Single job and responsive stop" requirement. `onPlayerExit` is then never called either, so the D6 mute would never lift. `show()` already guards its cosmetic UI calls this way (`:299–314`).
- SUGGESTED_CORRECTION: wrap each hook call in `try { … } catch {}`, as `show()` does, so that a hook failure can neither orphan the player nor skip `onPlayerExit`. No new test is needed beyond an optional single "throwing onPlayerStart still lets /speak stop end playback" case.

**R1-F3 — family `carried-decision`, root `replay-of-live-clip-unrecorded` (carried F12 edge).** P3. In scope.
- Evidence: the proposal review's F12 correction (`add-speak-live-conversation-review.md:209`) says "Whether `/speak replay` covers a live clip is decided at implementation." `speakLive` goes through `playClip`, which sets `this.lastClip` (`speech-job.ts:467`). So after live mode ends, `/speak replay` replays Pi's last spoken update. The behavior was chosen implicitly, and neither the W1-B evidence nor `tasks.md` records it.
- SUGGESTED_CORRECTION: the caller records the decision in this log. Allowing it is consistent with the spec's "same … cache, playback … rules as `/speak text`" and needs no code. Excluding it means skipping the `lastClip` assignment for live jobs plus one test.

**R1-F4 — family `adr-consistency`, root `adr-0010-supersedes-sweep-clause`.** P3. In scope.
- Evidence: `docs/adr/0010-live-voice-conversation.md:6` says that outside live mode both superseded decisions stand, "as does every other decision in ADR-0002 through ADR-0008". The same ADR's L22 ("Live mode ignores the input and speech provider choices of ADR-0004") and L33 (push-to-talk and Space holds of ADR-0008 refused while live) narrow other decisions *while live*. ADR-0004 L30 makes the session overrides decide the provider of "a recording or speech job". A reader of L6 alone would conclude that the provider choice still holds in live mode.
- SUGGESTED_CORRECTION: reword L6's tail to "every other decision in ADR-0002 through ADR-0008 stands, except as the Decision section below narrows it while live mode is on". Alternatively, name ADR-0004's provider choice in both the Supersedes line and ADR-0004's status-line note. The rewording is the lighter edit and stays within task 1.1's edit limits.

**R1-F5 — family `limit-authority`, root `effective-length-limit-single-source`.** P3. Deferred.
- Evidence: the effective limit `min(hardLimitChars, PROVIDER_HARD_LIMIT_CEILINGS[provider])` is computed only inside `preflightSpeech` (`speech-preflight.ts:46–49`). Its refusal text ends with "Use /speak text with a shorter passage." (`:55`), which reads oddly for model-originated text. Task 3.1 needs a "too-long" tool result before anything is queued.
- DEFERRED_REASON: no Wave 1 defect. `speakLive` correctly reuses the `/speak text` limit, as the spec requires. The risk is that Wave 3 recomputes the limit in `live.ts`, which would create a second authority. Carry to task 3.1: export one small helper for the effective ElevenLabs limit, used by both preflight and the tool, instead of duplicating the formula.

### Notes for the caller (not findings)

- `tasks.md` 1.1–1.5 are still unchecked. Checking them is caller-owned bookkeeping after reconciliation.
- Carried items that touch later waves are unchanged by Wave 1: F5 (live start checks for voice, model, and player belong in 2.1), F6, F11 (commit `pi-speak` first, then the gitlink), F12, R2-F4, and R3-F1.
- Optional, not required: a test that a second identical `speakLive` is a cache hit with no fetch. The path is shared with `speak`, whose cache tests already own that contract, so under test-value discipline this is not a gap.

PROPOSED_REVIEW_ACTION=PASS

## Caller Assessment — Wave 1, Round 1

Mode: `FULL`. Gate consumed: task 1.6. Owners reviewed: W1-A (orchestrator), task 1.1; W1-B (worker, aborted, reconciled and finished by the orchestrator), tasks 1.2–1.5.

#### R1-F1 — `/speak status` reads the job phase before its awaits
- **Decision:** `ACCEPT_NONBLOCKING`. Family `split-behavior-preservation`. P3, no governing source at blocking level: the effect is cosmetic, an older phase shown during a status read.
- **CORRECTION:** Carried to task 2.3, which already edits `/speak status` to add live state. Pass the phase as a getter, or read it after the awaits, so the HEAD order returns.

#### R1-F2 — a throwing `onPlayerStart` would leave the player unreachable and muting stuck
- **Decision:** `ACCEPT_NONBLOCKING`. Family `live-hook-robustness`. P3: unreachable until Wave 3 supplies the hooks.
- **CORRECTION:** Carried to task 3.2, which owns the hooks. Either the hooks are written so they cannot throw, or the two calls in `speech-job.ts` are guarded as `show()` is, so that `onPlayerExit` always follows a started player.

#### R1-F3 — `/speak replay` of a live clip
- **Decision:** `ACCEPT_NONBLOCKING`. Family `carried-f12-decisions`.
- **CORRECTION:** Decided as the code stands: the last live update is replayable with `/speak replay` once live mode has ended, from the cache, with no request. While live mode is on, `/speak replay` stays refused ("Other voice controls during live mode", task 2.1). This closes the carried F12 replay question.

#### R1-F4 — ADR-0010's supersession line is broader than its own text
- **Decision:** `ACCEPT_NONBLOCKING`. Family `adr-wording`. P3, wording only.
- **CORRECTION:** Carried to the start of Wave 2 (orchestrator). The line will also name, for live mode only, ADR-0004's provider choice and ADR-0008's Space holds.

#### R1-F5 — reuse the single effective length limit
- **Decision:** `ACCEPT_NONBLOCKING`. Family `length-limit-ownership`. P3, deferred to its owner.
- **CORRECTION:** Carried to task 3.1. The tool's "too long" result uses the same effective limit as `speech-preflight.ts:46–49`, through a shared export, not a second computation.

### Summary
- **Accepted blocking:** 0.
- **Accepted nonblocking:** 5 (R1-F1 to R1-F5).
- **Deferred:** 0.
- **Rejected:** 0.

### Terminal baseline validation
- **Boundary:** `BASELINE_TARGET`, `BASELINE_SOURCE`, `BASELINE_INCLUSION_PREDICATE`, and `BASELINE_EXCLUSIONS` are unchanged.
- **Candidate:** recomputed `sha256:4a0b33c24fa74512`, equal to the recorded `BASELINE_TARGET_REVISION`.
- **Rounds:** 1 of 4 Oracle rounds used, and no rebuild.

DISPATCH_BUDGET wave 1: oracle=1/1 others=1/3

REVIEW_ACTION=PASS
CONSENSUS_STATUS=MOSTLY_GOOD

## Wave 2 Review Sequence

## Round 1 - Implementation Assignments

Wave handled: 2. Final gate reserved: task 2.4 [Oracle gate: `oracle`], run once after 2.1–2.3.

Between-wave reuse: the Wave 1 worker run was aborted, so it is not eligible for reuse and no reuse check is needed. A fresh `worker` and, at the gate, a fresh `oracle` are used.

| Assignment | Tasks | Owner | Bounded responsibility | Files and topics |
| --- | --- | --- | --- | --- |
| W2-A | R1-F4 carry | orchestrator | ADR-0010 supersession wording | `docs/adr/0010-live-voice-conversation.md` (Supersedes line), `docs/adr/0004-…` (status note names the provider choice) |
| W2-B | 2.1, 2.2, 2.3 | worker | Live session and turns, idle limit, the listening side of the README, help, and status | new `extensions/speak/live.ts` (plus a responsibility split if needed), `index.ts`, `talk.ts`, `help.ts`, `speech-job.ts` / `speech-status.ts` (status only), `README.md`, `test/live.test.ts`, `test/command.test.ts`, `test/harness.ts` (fakes) |

Carried into W2-B:

- **F5 (optional):** start checks for the ElevenLabs voice, model, and player.
- **F12:**
  - verify the redaction scenario and manual-speech "Speech without live mode";
  - `/talk live` while live mode is starting cancels the start;
  - `/talk live` is refused while a push-to-talk attempt is starting;
  - split tests by behavior when they grow.
- **R1-F1:** in 2.3, restore the HEAD order of the `/speak status` job-phase read.
- **R1-F3:** `/speak replay` stays refused while live mode is on.

### W2-A (orchestrator) evidence

- **ADR-0010:** the Supersedes line now also names, for live mode only, ADR-0004's input and speech provider choice and ADR-0008's Space holds.
- **ADR-0004:** its status note now names the provider choice too.

### W2-B (worker, mission `248b7c40`, `anthropic/claude-sonnet-5-5`, completed)

Tasks 2.1–2.3. The changed files, all in `extensions/speak`, with line counts:

- **`live.ts`** (new, 308): `LiveSession` and `LivePhase` (`off | starting | on`). It owns the start checks, connection, streaming recorder, turn delivery, idle timer, and end paths, plus its own `TranscriptDelivery` for the composer fallback.
- **`talk.ts`** (484): routes presses to live mode while it is on or starting, refuses Space holds while live, adds `liveBlock()`, and combines `speechBlock`.
- **`index.ts`** (249): the `/talk live` form, the live pre-check for `/speak` forms that produce speech, and `live.resetSession()` on session reset.
- **`help.ts`** (65), **`speech-job.ts`** (489, `status(ui, livePhase)`), **`speech-status.ts`** (68), and **`README.md`** (301).
- **Tests:**
  - `test/harness.ts` (494, fakes only);
  - `test/command.test.ts` (632);
  - new `test/live.test.ts` (401), `test/live-turns.test.ts` (161), and `test/live-idle.test.ts` (90);
  - `test/live-harness.ts` (18).

Signature changes to existing symbols:

- `SpeechController.status` takes `livePhase: () => LivePhase`.
- `StatusState.jobPhase` and `livePhase` are getters.
- `registerSpeak` gains a `live` parameter.
- `TalkController`'s constructor gains a trailing `live` parameter.

Carried items:

- **F12:** covered, with the tests split by behavior.
- **F5:** done; the start checks include the ElevenLabs voice and model and the player.
- **R1-F1:** the job phase is read after the awaits, and a test fails if the read moves earlier.
- **R1-F3:** `/speak replay` is refused while live, even with a clip.

Worker-declared deviations, for the gate to judge:

- **Idle timer:** a re-armed 15 s one-shot timer instead of an interval, so it works with `FakeClock`. The idle count starts at the first idle tick, so live mode can end up to 15 s late but never early.
- **`/speak` refusal order:** speech-producing `/speak` forms are refused with the live message before the agent-busy and replay checks.
- **Send key while live:** shows "Nothing is being spoken." until task 3.2.
- **README:** mentions the cut-off key early, and says the live transcription billing basis is unchecked.
- **Risk:** `test/harness.ts` is at 494 lines, so Wave 3's tool fakes will need it split.

Orchestrator re-verification, inside the 4 GB scope:

- `node --experimental-strip-types --test test/*.test.ts`: 778 pass, 0 fail (Wave 1: 702).
- `npx tsc --noEmit`: clean.

#### Provider decision (user, during Wave 2)

From the Wave 2 gate onward, every dispatch passes a `claude-bridge/` model explicitly: `claude-bridge/claude-opus-5-5:high` for `oracle` and `claude-bridge/claude-sonnet-5-5:high` for `worker`. `pi-toolset/.pi/settings.json` (`anthropic/` overrides) is left unchanged. Earlier runs used `anthropic/claude-sonnet-5-5` (worker) and `anthropic/claude-opus-5-5` (oracle), the same models and thinking levels. If a bridge dispatch fails before it starts, it is rerun in the background on the same bridge model; it is never silently switched to `anthropic/`.

BASELINE_TARGET=Wave 2 of add-speak-live-conversation: tasks 2.1–2.3 as implemented, plus the R1-F4 ADR wording
BASELINE_TARGET_REVISION=sha256:9ea0d0345721cec2 (git -C extensions/speak diff HEAD, then live.ts and test/live-harness.ts, live-idle.test.ts, live-turns.test.ts, live.test.ts in that order, then git diff HEAD -- docs/adr)
BASELINE_SOURCE=openspec/changes/add-speak-live-conversation (proposal, design, tasks, three spec deltas); docs/adr/0002, 0004, 0005, 0006, 0008, 0010
BASELINE_INCLUSION_PREDICATE=files changed or created for tasks 2.1–2.3 and R1-F4: extensions/speak/{live,talk,index,help,speech-job,speech-status}.ts, extensions/speak/README.md, extensions/speak/test/{harness.ts,live-harness.ts,live.test.ts,live-turns.test.ts,live-idle.test.ts,command.test.ts}, docs/adr/0004, 0010
BASELINE_EXCLUSIONS=Wave 3 work (the speak_aloud tool, the update queue, muting, cut-off, barge-in, and the speaking side of the README); Wave 1 code except as context; unrelated uncommitted add-pi-session-rename-tool files; host/pi

DISPATCH_BUDGET wave 2: oracle=0/1 others=1/3 (before the gate)

## Round 1 - Oracle Review

Gate task consumed (once): 2.4 [Oracle gate: `oracle`] Review gate for Wave 2, run once after 2.1–2.3 are complete. Mode: FULL (first review of this wave), under `review-convergence`. Output is advisory; the caller owns reconciliation, the authoritative action, and status.

Task and owner mapping reviewed:

| Task | Owner | Reviewed against |
| --- | --- | --- |
| R1-F4 carry | orchestrator (W2-A) | `docs/adr/0010-live-voice-conversation.md` Supersedes line; `docs/adr/0004-…` status note |
| 2.1 | worker (W2-B) | `live.ts`, `talk.ts`, `index.ts`, `test/live.test.ts`, `test/live-turns.test.ts`, `test/live-harness.ts`, `test/harness.ts`; D2, D4, D5, D10; "Live mode starts and ends only by user action or a stop condition", "Starting live mode", "Live turn delivery", "Other voice controls during live mode", "Live mode ends cleanly", "Live mode privacy" (redaction); modified `voice-input` and `manual-speech` requirements |
| 2.2 | worker (W2-B) | `live.ts` idle timer, `test/live-idle.test.ts`; D9; "Live idle limit" |
| 2.3 | worker (W2-B) | `README.md`, `help.ts`, `speech-job.ts`, `speech-status.ts`, `test/command.test.ts`; D11; "Live mode status, help, and settings" (listening side), "Live mode privacy" (documentation); carried R1-F1 and R1-F3 |

Baseline: recomputed `sha256` over `git -C extensions/speak diff HEAD`, then `live.ts`, `test/live-harness.ts`, `test/live-idle.test.ts`, `test/live-turns.test.ts`, `test/live.test.ts`, then `git diff HEAD -- docs/adr`. The digest is `9ea0d0345721cec2679b…`, so `BASELINE_TARGET_REVISION=sha256:9ea0d0345721cec2` is **confirmed**. `extensions/speak` is at `5ff7869` (the Wave 1 commit), and its status shows only the eight modified and five new files of the inclusion predicate. No tests were re-run: the recorded evidence (778 pass, clean `tsc`, both inside the 4 GB scope) stands, and nothing in the review gave a concrete reason to re-run.

### What holds

- **State machine (2.1, D10).** `LiveSession.state` (`live.ts:57`) is the single authority for `off | starting | on`. Every await in `start` is followed by a claim check (`:138`, `:147`, `:150`, `:154`, `:162`, `:175`), and a late connection or recorder is closed or stopped when the claim is gone (`:163`, `:176–177`). `/talk live` while starting aborts the pending connection through `claim.cancel` (`:89`, `:276`). `end()` is idempotent, because it clears `state` before any side effect (`:273–275`). Provider error or close, the recorder exiting on its own, and every lifecycle event (`index.ts:185–197`, with reload arriving as `session_shutdown`) all reach `end()`. Nothing retries. A late commit, send, or idle tick re-checks `this.state !== on` (`:213`, `:228`, `:263`).
- **Turns (2.1, D4).** Only `session.text.slice(delivered)` becomes a turn (`:214–216`). The filter `[\p{L}\p{N}]` drops `...` and keeps `Ừ.`, `yes.`, and `42`. Sends go out in commit order through `on.sending`. `sendWhenBusy` comes from a fresh `loadConfig` for each turn, and the mapping matches `talk-delivery.ts:73–78`. `expandPromptTemplates: false` is always set, and the harness throws if it is not. The composer is touched only by the fallback `append`, and the fallback covers no model, compaction, an invalid configuration, and a throwing send. Warnings never contain the turn, which a test asserts.
- **Ownership.** `TalkController` keeps push-to-talk, `SpeechController` keeps the job, and live mode keeps its session. The two controllers check each other's state: `liveBlock()` (`talk.ts:75–81`) checks push-to-talk, and the `live.phase` checks in `press` and `startHold` (`talk.ts:97`, `:141`) check live mode. The combined `speechBlock` is computed, not stored (`talk.ts:68–72`). The compaction flag now exists twice, once in each `TranscriptDelivery`, but it has one writer (`talk.ts:160–163` forwards to `live.ts:119–121`), so the two copies cannot disagree. This is acceptable.
- **Refusals.** Space holds return `undefined` from `startHold` while live, so Spaces keep typing. Live mode registers no terminal-input listener, so Escape is not intercepted. The `/speak` forms that produce speech hit `live.speechBlock()` before any request (`index.ts:62–64`), and `/speak replay` is refused even with a clip (R1-F3). `/speak stop`, `status`, `quota`, `provider`, `locale`, `/talk provider`, and help sit above that check and keep working.
- **Start (F5).** The start checks the configuration, the key, the ElevenLabs voice and model, the recorder, and the player before any connection opens. It stops the extension's own speech first (`:153`), and starts the recorder only after the connection opens. The start message names ElevenLabs, the language setting, the cut-off key, and `/talk live`.
- **Status (2.3, R1-F1).** `jobPhase` and `livePhase` are getters, read after the awaits (`speech-status.ts:66`). The new command test fails if the read moves earlier. Status shows `live mode: off|starting|on` and both effective settings.
- **README privacy and cost.** The README (`README.md:247–266`) covers all five statements that "Live mode privacy" requires: streaming except during muted playback, turns saved as user messages, spoken text sent and cached, no zero-retention guarantee, and ending live mode as the way to stop streaming. It also states that the key never leaves the environment, and that how live transcription is billed is unchecked, which follows design "Open Questions" and leaves task 3.4 to settle it.
- **ADR (W2-A, R1-F4).** The ADR-0010 Supersedes line now names, for live mode only, ADR-0004's provider choice and ADR-0008's Space holds. ADR-0004's status note names the provider choice. Each ADR changed in exactly one line. R1-F4 is closed.
- **Regressions.** The push-to-talk, Space-hold, and `/speak` paths change only by the live checks inserted before them. No existing assertion changed apart from the help-form list, which adds `/talk live`.
- **Test memory safety.** No large buffer is compared with `deepEqual`. Every loop is bounded (at most 40 iterations), and `h.until` has a 3 s deadline (`test/harness.ts:462–468`). Idle tests run on `FakeClock` and assert `clock.pending`.

### Worker-declared deviations, judged

- **Idle timer as a re-armed 15 s one-shot instead of an interval: accepted.** It is behaviorally equivalent to D9's 15-second timer, never ends early, and `idleSince` starts at live start (`live.ts:194`), so the "up to 15 s late" case applies only after agent work. The README states it. No artifact amendment is needed.
- **`/speak` refused before the agent-busy and replay checks: accepted.** The spec requires refusal with a message and no request. It sets no order among the checks.
- **The send key shows "Nothing is being spoken." until 3.2: accepted for the send key,** which matches the voice-input scenario "Shortcut during live mode". The same path also catches `/talk send`, which is finding R1-F1 below.
- **README names the cut-off key and leaves billing unchecked: accepted.** The start message must name the key anyway, and billing is design's open question for 3.4.
- **`test/harness.ts` at 494 lines: accepted as a Wave 3 note.** It is a handwritten test helper. The testing-governance thresholds are 800 for review and 1,000 for a required split, and the global 500-line default would apply when 3.1 adds the tool fakes. Split by responsibility then, for example by moving the host `pi` fake out.

### Findings (highest priority first; no P0 or P1)

**R1-F1 — family `live-control-routing`, root `talk-send-conflated-with-send-key`.** P2. In scope (2.1).
- Evidence: `index.ts:151–152` (`/talk send`) and `index.ts:164–166` (the send shortcut) both call `talk.press(ctx, "send")`. `live.ts:99–104` cannot tell them apart and answers both with "Nothing is being spoken." while live mode is on. But "Other voice controls during live mode" (`specs/voice-conversation/spec.md:166–168`) requires `/talk send` to be refused with a message naming `/talk live`. The modified "Talk command contract" (`specs/voice-input/spec.md:23`) makes only the send *shortcuts* behave as "Cutting Pi off" while live, and "Cutting Pi off" names only the shortcuts and `/speak stop`. Three artifacts now disagree:
  - `test/live.test.ts:254–263` asserts the non-conforming behavior for `/talk send`;
  - `README.md:253` documents the spec behavior, so it contradicts the code;
  - Wave 3's task 3.2 would build the cut-off on this shared path, and `/talk send` would then cut Pi off.
- SUGGESTED_CORRECTION: carry the control's origin into `press`. For example, `TalkController.press(ctx, mode, fromKey = false)`, with the send shortcut handler passing `true`, and `LiveSession.press(ui, mode, fromKey)` treating only `fromKey && mode === "send" && phase === "on"` as the (later cut-off) send key. Split `test/live.test.ts:254–263` into two assertions: the send key says nothing is being spoken, and `/talk send` is refused with `/Run \/talk live to end live mode/`. The `/talk send` case can join the table at `test/live.test.ts:235–242`.

**R1-F2 — family `live-start-commit`, root `replayed-failure-before-render`.** P2. In scope (2.1).
- Evidence: `openRealtime` builds the `Session`, with its own `close`, `error`, and message listeners, as soon as the socket opens (`realtime.ts:305–307`, `:141–146`). A failure that arrives while `start` awaits `startRecorder` (`live.ts:169`, which awaits `findRecorder`) is stored and replayed synchronously by `listen` (`realtime.ts:149–152`). Inside `session.listen` at `live.ts:198–201`, `fail(on)` then `end()` stops the recorder, closes the connection, clears the status line, and shows "… Live mode ended." Execution then continues unconditionally:
  - `scheduleIdleCheck(on)` (`:203`) arms a stray timer;
  - `render(on)` (`:204`) sets "● Live — listening · … /talk live ends live mode" again;
  - the notice at `:205–208` says "Live mode is on …".

  The status line then stays wrong until the next live session ends, because only `end()` clears it. "Live mode ends cleanly" requires ending to clear the status line. A provider error message or close right after the handshake (quota, session limit, network) is enough to trigger this, and no test covers that window.
- SUGGESTED_CORRECTION: after `session.listen(...)`, add `if (this.state !== on) return;` before the recorder-exit hook, the timer, the render, and the start notice. Equivalently, attach `listen` last. Add one test with `holdSockets: true` and a `FakeClock`: open the socket, then emit `close` before the start continues. Assert that `liveStatuses.at(-1)` is `undefined`, that no "Live mode is on" notice follows the ended message, and that `clock.pending` is 0.

**R1-F3 — family `live-start-commit`, root `refusal-after-cancel`.** P3. In scope (2.1).
- Evidence: `live.ts:145–146` and `:148–149` call `refuse(...)` *before* the claim checks at `:147` and `:150`. `refuse` (`:133–136`) notifies whether or not the claim is still current. If `/talk live` cancels the start, or a session event ends it, while `findRecorder` or `resolveExecutable` is pending and that check fails, a second "… Live mode was not started." warning follows "Live mode start cancelled." Or it goes to a replaced session's UI.
- SUGGESTED_CORRECTION: make `refuse` silent when the claim is gone, `if (this.state !== claim) return;` before the notify. No new test is required. One optional case: cancel during a missing-player check, and expect exactly one message.

**R1-F4 — family `help-accuracy`, root `help-live-send-key-and-settings`.** P3. Deferred.
- Evidence: `help.ts:55` says "Push-to-talk keys … are refused while it is on", but the send key is not refused while live mode is on. It shows "Nothing is being spoken." now and cuts Pi off from 3.2. Help also does not yet name the cut-off key or `input.liveListenWhileSpeaking`, which "Live mode status, help, and settings" requires.
- DEFERRED_REASON: task 3.3 owns help's speaking side: the cut-off key, `/speak stop`, and `input.liveListenWhileSpeaking`. Carry to 3.3: exclude the send key from the refused list, and add the two missing items. Nothing in Wave 2 depends on it.

### Wave 3 seams (notes, not findings)

- **Send-key cut-off:** depends on R1-F1's origin flag. Without it, 3.2 cannot satisfy both "Cutting Pi off" and "Other voice controls".
- **`onChunk` mute:** `live.ts:173` is a closure over `session`. 3.2 needs a mute deadline reachable from that closure before `on` exists, for example a field on `claim` or a `let` captured by the closure.
- **`end()`:** it is the single exit and is idempotent. 3.1 and 3.2 add queue clearing, `stopOwnAudio`, and tool removal there. The R1-F2 guard keeps those from running twice.
- **Status line:** `render(on)` is fixed to "listening". 3.2 makes it state-dependent. Carried Wave 1 R1-F2 (hook throws) still applies to the hooks 3.2 writes.
- **`talk.ts` size:** it is at 484 lines, so 3.2's routing must stay small or move into `live.ts`.

### Notes for the caller (not findings)

- `tasks.md` 2.1–2.3 are still unchecked. Checking them is caller-owned bookkeeping.
- **Residual, not raised:** `on.context.model` (`live.ts:231`) and `on.context.isIdle()` in the timer (`:264`) are host getters that call `runner.assertActive()`. They are safe because every runner replacement emits a lifecycle event that ends live mode first. A host path that invalidated the runner without one would turn `:231` into an unhandled rejection that stalls `on.sending`, and `:264` into an uncaught timer exception.
- **Coarse idle check:** an agent run that starts and ends between two 15 s ticks is not seen, so typed prompts with short runs can still let the idle limit expire. D9 chose this coarse timer. Only a spoken turn resets the count (`:229`).

PROPOSED_REVIEW_ACTION=PATCH

## Caller Assessment — Wave 2, Round 1

Mode: `FULL`. Gate: task 2.4. Oracle ran in the background on `claude-bridge/claude-opus-5-5:high` (run `994a875a`), after the foreground bridge dispatch failed before starting with a prompt-capture error (run `11fb63b9`, no writes). Baseline `sha256:9ea0d0345721cec2` confirmed by Oracle.

#### R1-F1 — `/talk send` is treated as the send key while live mode is on
- **Oracle severity:** P2. **Caller severity:** P1, for three reasons:
  - The code breaks a SHALL requirement in two spec deltas.
  - A test (`test/live.test.ts`) locks in the wrong behavior, and the README already contradicts the code.
  - Task 3.2 would build the cut-off on this routing, so `/talk send` would cut Pi off.
- **GOVERNING_SOURCE:** `voice-conversation` "Other voice controls during live mode" (`/talk send` SHALL be refused, naming `/talk live`), and `voice-input` "Talk command contract" (only the send *shortcuts* get the live exception).
- **Decision:** `ACCEPT_BLOCKING`.
- **CORRECTION:**
  - `TalkController.press(ctx, mode, fromShortcut = false)`, and the four shortcut handlers in `index.ts` pass `true`.
  - `LiveSession.press` shows "Nothing is being spoken." only for the send shortcut while live mode is on.
  - `/talk send` joins the refusal table in `test/live.test.ts`, and the send-key test asserts its exact message.

#### R1-F2 — a failure right after the connection opens leaves live mode looking on
- **Oracle severity:** P2. **Caller severity:** P1. After live mode has ended, the status line, which is the user's visible sign that the microphone is streaming, says "● Live — listening". The message also says live mode is on, and a stray timer is left behind.
- **GOVERNING_SOURCE:** `voice-conversation` "Live mode ends cleanly" (ending SHALL clear the status line), plus a concrete correctness risk: a false live-state indication.
- **Decision:** `ACCEPT_BLOCKING`.
- **CORRECTION:** `if (this.state !== on) return;` right after `session.listen(...)` in `live.ts`. A new test sends `open` then `close` on a held socket and asserts four things:
  - the recorder had started and received SIGINT;
  - the message is the connection failure with "Live mode ended";
  - there is no start message and no idle timer;
  - the status line is cleared.

#### R1-F3 — a failed start check can warn after the start was cancelled
- **Decision:** `ACCEPT_NONBLOCKING`, applied now because it is in the same function.
- **CORRECTION:** `refuse` returns silently when its attempt is no longer current.
- **Untested:** the race depends on the timing of real filesystem calls. The guard is two lines.

#### R1-F4 — help text for live mode
- **Decision:** `ACCEPT_NONBLOCKING`, carried to task 3.3.
- **CORRECTION:** help says the send key is not refused while live, and names the cut-off key and `input.liveListenWhileSpeaking`.

#### Worker-declared deviations
The caller accepts Oracle's judgments. The re-armed one-shot idle timer, the `/speak` refusal order, the README wording, and the `harness.ts` size note for Wave 3 are all accepted. "Nothing is being spoken." is accepted for the send shortcut only.

#### Oracle-noted risks (no edit)
- Host getters that throw on a stale context are safe because every session change ends live mode first.
- The coarse idle check missing short runs between ticks was accepted under D9.

### Summary
- **Accepted blocking:** 2 (R1-F1, R1-F2).
- **Accepted nonblocking:** 2 (R1-F3, applied now; R1-F4, carried).
- **Deferred:** 0.
- **Rejected:** 0.

REVIEW_ACTION=PATCH
CONSENSUS_STATUS=NEEDS_REVISION

## Round 2 - Implementation Assignments

Wave handled: 2. Final gate reused: task 2.4.

Owner: the orchestrator, performing the revision in the main context. The fix was small and bounded, the context was already loaded, and the Wave 2 worker ran on `anthropic/`, while the user now wants `claude-bridge/`.

- **Files:** `extensions/speak/live.ts` (312), `talk.ts` (484), `index.ts` (249), and `test/live.test.ts` (418).
- **Mutation check:** with each fix reverted, its test fails ("/talk send during live mode starts no recording and names /talk live"; "a connection that fails while the recorder is starting…"). Both fixes were restored afterwards.
- **Validation inside the 4 GB scope:**
  - `test/live.test.ts` alone: 47 pass.
  - full suite: 780 pass, 0 fail.
  - `npx tsc --noEmit`: clean.
- **README:** `README.md:253` already said `/talk send` is refused while live, and now matches the code. No edit.

PATCH_BASELINE_REVISION=sha256:5870f2eedc5231b6 (same recipe as BASELINE_TARGET_REVISION)

## Round 2 - Oracle Review

Gate task: 2.4 (reused), Wave 2. Mode: PATCH under `review-convergence`, the same Oracle instance as Round 1. Output is advisory; the caller owns reconciliation, the authoritative action, and status.

Baseline: recomputed `sha256` with the same recipe: `git -C extensions/speak diff HEAD`, then `live.ts`, `test/live-harness.ts`, `test/live-idle.test.ts`, `test/live-turns.test.ts`, `test/live.test.ts`, then `git diff HEAD -- docs/adr`. The digest is `5870f2eedc5231b6c220…`, so `PATCH_BASELINE_REVISION=sha256:5870f2eedc5231b6` is **confirmed**. `extensions/speak` is still at `5ff7869`, and its status shows the same eight modified and five new files, so the boundary fields are unchanged. Independent check inside the 4 GB scope: `node --experimental-strip-types --test test/live.test.ts` alone gave 47 pass, 0 fail, matching the recorded figure. The full suite and `tsc` were not re-run; the recorded 780 pass and clean `tsc` stand.

### Accepted fixes, verified

- **R1-F1 (`live-control-routing`): fixed.**
  - `TalkController.press(ctx, mode, fromShortcut = false)` (`talk.ts:88`) passes the flag on only in the live branch (`talk.ts:98`).
  - All four shortcut loops in `index.ts:163–183` pass `true`, so every key in each list is covered.
  - The `/talk` forms (`index.ts:150`, `:152`) use the default `false`.
  - `LiveSession.press` (`live.ts:100–104`) shows "Nothing is being spoken." only for `send && fromShortcut && phase === "on"`. `/talk send`, and the send key while live mode is starting, get the refusal that names `/talk live`, as "Other voice controls during live mode" requires.
  - Tests: `/talk send` is now in the refusal table (`test/live.test.ts:257`), and the send-key test asserts the exact single message (`:276`).
- **R1-F2 (`live-start-commit`, `replayed-failure-before-render`): fixed.**
  - `live.ts` returns after `session.listen(...)` when the state is no longer `on`. That happens before the recorder-exit hook, the idle timer, the render, and the start notice.
  - The new test (`test/live.test.ts:93–108`) sends `open` then `close` on a held socket before the recorder starts, and asserts five things: the recorder started and received SIGINT; the failure message says "Live mode ended"; no "Live mode is on" or "was not started" message appears; `clock.pending` is 0; and the status line is cleared.
  - Leaving the recorder-exit hook unattached is safe, because `end()` has already stopped the recorder and `done` never rejects.
- **R1-F3 (`live-start-commit`, `refusal-after-cancel`): fixed** as the caller accepted it, untested. `refuse` returns before clearing state or notifying when its attempt is no longer current. That also keeps it from clearing a newer attempt's state.

### Regression sweep (whole wave)

- **The new parameter does not mis-route anything.** `fromShortcut` is read only in `live.ts:101`, and only while live mode is on or starting. With live mode off, `talk.ts:99` onward is unchanged, so normal push-to-talk, held recordings, and the stopping control's mode behave exactly as at HEAD.
  - Space holds reach `TalkController` through `startHold`, not `press` (`hold-space.ts:157`), so the parameter does not affect them.
  - No test calls `talk.press` directly. Every key helper goes through the registered shortcut handlers (`test/harness.ts:377–395`), so the tests exercise the real index wiring.
- **The rest of the wave is unchanged by this round.** The state machine, turn delivery, idle timer, ownership split, `/speak` refusals, status getters, and ADR lines are as judged in Round 1. `live.ts` is 312 lines and `talk.ts` 484, both under 500.
- **README and help.**
  - `README.md:253` (`/talk send` refused; the send key too only while live mode is starting) now matches the code.
  - `help.ts:55` still lists push-to-talk keys as refused without excluding the send key. This is carried R1-F4, owned by 3.3, and is not counted again here.
  - The README does not yet describe what the send key does while live mode is on. That is the speaking side, which belongs to 3.3, and the start message already names the key.

### Findings

None new. Carried: R1-F4 (task 3.3), and Wave 1 R1-F2 and R1-F5 (tasks 3.2 and 3.1). The Wave 3 seam notes from Round 1 still apply, and the send-key seam is now in place: 3.2 attaches the cut-off at `live.ts:101`.

PROPOSED_REVIEW_ACTION=PASS

## Caller Assessment — Wave 2, Round 2

Mode: `PATCH`. Gate: task 2.4, the same Oracle instance resumed in the background on `claude-bridge/claude-opus-5-5:high` (run `cba5d6f8`).

- **Fixes verified:** Oracle confirmed R1-F1, R1-F2, and R1-F3 and ran `test/live.test.ts` alone inside the 4 GB scope (47 pass).
- **Regression sweep:** no new findings. With live mode off, push-to-talk and held recordings run the same code as before. Space holds use `startHold`, not `press`. No test calls `press` directly. The README matches the code.
- **Carried items unchanged:**
  - Wave 2 R1-F4 (help text) to task 3.3;
  - Wave 1 R1-F2 (hook robustness) to task 3.2;
  - Wave 1 R1-F5 (single length limit) to task 3.1.
- **Remaining risk accepted:** R1-F3 has no test, because the race depends on real filesystem timing.

### Summary
- **Accepted blocking:** 0.
- **Accepted nonblocking:** 0 new.
- **Deferred:** 0.
- **Rejected:** 0.

### Terminal baseline validation
- **Boundary:** `BASELINE_TARGET`, `BASELINE_SOURCE`, `BASELINE_INCLUSION_PREDICATE`, and `BASELINE_EXCLUSIONS` are unchanged.
- **Candidate:** recomputed `sha256:5870f2eedc5231b6`, equal to the latest recorded `PATCH_BASELINE_REVISION`.
- **Rounds:** 2 of 4 Oracle rounds used, and no rebuild.

DISPATCH_BUDGET wave 2: oracle=1/1 others=1/3

REVIEW_ACTION=PASS
CONSENSUS_STATUS=MOSTLY_GOOD

## Wave 3 Review Sequence

## Round 1 - Implementation Assignments

Wave handled: 3. Final gate reserved: task 3.5 [Oracle gate: `oracle`], run once after 3.1–3.3 are complete and 3.4 is complete or explicitly reported as unverified.

Between-wave reuse: none. The Wave 2 worker ran on `anthropic/`, and the user moved all dispatches to `claude-bridge/`, so its context cannot carry over. Dispatches run in the background, because foreground bridge runs fail before starting (prompt capture).

| Assignment | Tasks | Owner | Bounded responsibility | Files and topics |
| --- | --- | --- | --- | --- |
| W3-A | 3.1, 3.2, 3.3 | worker (`claude-bridge/claude-sonnet-5-5:high`, background) | The `speak_aloud` tool and its activation, the update queue, muting, cut-off, barge-in, the speaking status line, and the speaking side of the README and help | `extensions/speak/live.ts` (plus a speech-queue file if needed), `index.ts`, `talk.ts`, `help.ts`, `speech-job.ts` (hook guarding only), `speech-preflight.ts` (shared limit export only), `README.md`, `test/*` (the harness split allowed) |
| W3-B | R3-F1 wording | orchestrator | Spec and design wording for tool activation, after 3.1 | `specs/voice-conversation/spec.md` "Spoken updates tool", design D3 |
| W3-C | 3.4 | user | Live checks with real keys and audio | Recorded in `tasks.md`, or the change reported as unverified |

Carried into W3-A:

- **Wave 1 R1-F5 (task 3.1):** the tool's "too long" result uses the single effective length limit from `speech-preflight.ts`.
- **Wave 1 R1-F2 (task 3.2):** `onPlayerExit` always follows a started player, even if a hook throws.
- **Wave 2 R1-F4 (task 3.3):** help says the send key is not refused while live, and names the cut-off key and `input.liveListenWhileSpeaking`.
- **F12 (task 3.2):** the "Session switched while Pi speaks" scenario.

### W3-A (worker, run `2aa1d487`, background, `claude-bridge/claude-sonnet-5-5:high`, completed)

Provider confirmed from the child transcript: all 61 model turns went through `claude-bridge`.

Files, all in `extensions/speak`, with line counts:

- **New:**
  - `live-speech.ts` (90): the `LiveSpeech` queue, mute with `MUTE_TAIL_MS` = 500, and cut-off;
  - `speak-aloud.ts` (57): `SPEAK_ALOUD`, `SpeakAloudSwitch`, and `registerSpeakAloud`;
  - `test/fake-pi.ts` (75): the harness split;
  - `test/live-tool.test.ts` (147) and `test/live-speech.test.ts` (194).
- **Edited:**
  - `live.ts` (370), `index.ts` (267), `help.ts` (66), `speech-job.ts` (498), `speech-preflight.ts` (118), `README.md`;
  - `test/harness.ts` (477), `test/live-harness.ts`, `test/live-idle.test.ts`, `test/job.test.ts` (674, was 548), `test/command.test.ts` (645, was 590), `test/silence.test.ts`.
- **Unchanged:** `talk.ts` (484).

Carried items:

- **Wave 1 R1-F5:** `effectiveHardLimit` is exported from `speech-preflight.ts` and used by both preflight and live mode.
- **Wave 1 R1-F2:** `SpeechController.signalLive` guards both hook calls, and a test fails without the guard.
- **Wave 2 R1-F4:** help says the send key cuts Pi off and is not refused. A new line names the cut-off keys, `/speak stop`, muting, and `input.liveListenWhileSpeaking` with its headphones requirement.
- **F12:** the session-switch-while-speaking test.

Host evidence for the `before_agent_start` removal is a source read, not a run:

- `agent-session.ts:3603` (activation unless `defaultActive === false`);
- `:1518–1525`, `:1810–1815`, and `:1822–1829`;
- `:2062–2073` (`handlerEditedTools`);
- `:2105` and `:1738–1741`;
- `extensions/runner.ts:1475–1504`.

Worker-declared deviations, for the gate to judge:

- **`test/silence.test.ts`:** it now expects `before_agent_start` to be subscribed, as D3 requires, and its fake `pi` gained the tool methods. Loading still makes no `setActiveTools` call.
- **`test/command.test.ts`:** the live-help regex was updated for the R1-F4 wording.
- **`live-speech.ts`:** split out, as D7 names it, although `live.ts` would have fit.
- **Idle limit:** an update in the queue counts as activity, as the "Live idle limit" requirement says, and `speakAloud` restarts the idle clock.
- **Too-long limit:** computed once, at live start, so that calls enter the queue in call order. The speech job checks it again.
- **Status line:** "Pi speaking" covers synthesis as well as playback. Muting still starts at the player's start.

Worker's mutation checks: 11 behaviors, each detected.

Orchestrator re-verification, inside the 4 GB scope:

- `test/live-tool.test.ts` alone: 11 pass.
- `test/live-speech.test.ts` alone: 12 pass.
- Full suite: 806 pass, 0 fail (Wave 2: 780).
- `npx tsc --noEmit`: clean.

### W3-B (orchestrator) evidence: R3-F1 wording

- **Spec "Spoken updates tool":**
  - "registered with `defaultActive: false`" replaces "registered inactive";
  - the run-start removal applies to runs started by a prompt;
  - a run started by another extension's message may still declare the tool, whose result then says live mode is off;
  - the "Tool absent when live mode is off" scenario is scoped to a prompt-started run.
- **Design:**
  - H1 names 0.99.2 and 1.x as honoring `defaultActive`;
  - D3 says "a host whose types lack the property, such as 0.87.1" instead of "pre-1.0", names `/reload` while live as a covered case, and states that `before_agent_start` fires only for prompt-started runs;
  - Risks gains a line for message-started runs.
- `openspec validate add-speak-live-conversation --strict`: valid.

### W3-C (user) evidence: task 3.4

- **Result (2026-10-15):** the user reported that live mode works in their own live test with real keys and audio.
- **Not reported individually, so unverified:** whether a one-second pause splits a turn; a one-syllable answer right after Pi stops (R2-F4); 3 minutes or more of silence (F6); voice barge-in with headphones; the billing basis.
- **README cost wording:** unchanged, because the billing basis is unchecked.
- **Where it is recorded:** in task 3.4 itself.

### Change amendment (user handoff, 2026-10-15): ending live mode by voice

The user asked for a live stop phrase. The orchestrator amended the change's own artifacts, with no parallel specification:

- **Proposal:** a new bullet, and the capability description.
- **Spec `voice-conversation`:**
  - a new requirement "Live stop phrase" with six scenarios;
  - "Live mode starts and ends…", "Live turn delivery", "Live mode ends cleanly", and "Live mode status, help, and settings" now refer to it.
- **Design:** D12 settles the open questions (whole-turn match, diacritics ignored, not heard while muted, a default VI/EN pair, turn order kept). D11 names the new setting, and Risks gains two lines.
- **Tasks:** a new Wave 4, tasks 4.1–4.5.
- **ADR-0010 (task 4.1, orchestrator):** an "Ending by voice" Decision bullet, the Consequences bullet rewritten, and the Change line naming the amendment.
- **Validation:** `openspec validate add-speak-live-conversation --strict` is valid; 20 tasks, 10 complete.

Wave 3 is gated first, with the stop-phrase work excluded, so that Wave 4 builds on reviewed code.

BASELINE_TARGET=Wave 3 of add-speak-live-conversation: tasks 3.1–3.3 as implemented, plus the W3-B wording
BASELINE_TARGET_REVISION=sha256:6e584395b83e3a4b (git -C extensions/speak diff HEAD, then live-speech.ts, speak-aloud.ts, test/fake-pi.ts, test/live-speech.test.ts, test/live-tool.test.ts in that order)
BASELINE_SOURCE=openspec/changes/add-speak-live-conversation (proposal, design, tasks, three spec deltas) as amended on 2026-10-15; docs/adr/0002, 0004, 0006, 0008, 0010; host/pi/packages/coding-agent/src/core/agent-session.ts (H1–H4, read only)
BASELINE_INCLUSION_PREDICATE=files changed or created for tasks 3.1–3.3: extensions/speak/{live,live-speech,speak-aloud,index,help,speech-job,speech-preflight}.ts, extensions/speak/README.md, extensions/speak/test/{harness,fake-pi,live-harness}.ts, extensions/speak/test/{live-tool,live-speech,live-idle,job,command,silence}.test.ts
BASELINE_EXCLUSIONS=Wave 4 (the "Live stop phrase" requirement, D12, the stop-phrase clauses in the status, help and end-cause lists, and the ADR-0010 amendment); Waves 1–2 code except as context; unrelated uncommitted add-pi-session-rename-tool files; host/pi edits

DISPATCH_BUDGET wave 3: oracle=0/1 others=1/3 (before the gate)

## Round 1 - Oracle Review

Gate task consumed (once): 3.5 [Oracle gate: `oracle`] Final review gate for Wave 3, run once after 3.1–3.3 are complete and 3.4 is complete or explicitly reported as unverified. Mode: FULL (first review of this wave), under `review-convergence`. Output is advisory; the caller owns reconciliation, the authoritative action, and status. The Wave 4 stop-phrase work is excluded by `BASELINE_EXCLUSIONS` and is not judged here.

Task and owner mapping reviewed:

| Task | Owner | Reviewed against |
| --- | --- | --- |
| 3.1 | worker (W3-A) | `speak-aloud.ts`, `live.ts` (`speakAloud`, `removeToolOutsideLive`, `end`), `index.ts`, `speech-preflight.ts`, `test/fake-pi.ts`, `test/live-tool.test.ts`, `test/silence.test.ts`; D3, D7, H1–H4; "Spoken updates tool", "Speaking live updates"; carried Wave 1 R1-F5 |
| 3.2 | worker (W3-A) | `live-speech.ts`, `live.ts` (mute, cut-off, barge-in, status line, idle), `speech-job.ts` (`signalLive`), `test/live-speech.test.ts`, `test/live-idle.test.ts`, `test/job.test.ts`; D6, D7, D8, D9, D10; "Microphone muted while Pi speaks", "Cutting Pi off", "Live mode ends cleanly", the status-line scenario, `manual-speech` "Stop during live mode"; carried Wave 1 R1-F2 and F12 |
| 3.3 | worker (W3-A) | `help.ts`, `README.md`, `test/command.test.ts`; "Live mode status, help, and settings" (speaking side), "Cutting Pi off" (documentation); carried Wave 2 R1-F4 |
| R3-F1 wording | orchestrator (W3-B) | spec "Spoken updates tool"; design H1, D3, Risks |
| 3.4 | user (W3-C) | Recorded result and the unverified sub-checks in `tasks.md:44–45` |

Baseline: recomputed `sha256` over `git -C extensions/speak diff HEAD`, then `live-speech.ts`, `speak-aloud.ts`, `test/fake-pi.ts`, `test/live-speech.test.ts`, `test/live-tool.test.ts`. The digest is `6e584395b83e3a4b11f8…`, so `BASELINE_TARGET_REVISION=sha256:6e584395b83e3a4b` is **confirmed**. `extensions/speak` is at `06d1733`, and its status shows exactly the twelve modified and five new files of the inclusion predicate (`talk.ts` unchanged).

Independent checks, each inside `systemd-run --user --scope -q -p MemoryMax=4G -p MemorySwapMax=0 timeout 300`, output in `/tmp/oracle-w3-*.log`:

- `test/live-tool.test.ts` alone: 11 pass, 0 fail.
- `test/live-speech.test.ts` alone: 12 pass, 0 fail.
- `test/live-idle.test.ts` alone: 7 pass, 0 fail.
- Host 1.1.0, `host/pi/packages/coding-agent`: `vitest --run test/system-prompt-updates.test.ts -t "setActiveTools in before_agent_start"`: 1 pass (7 skipped). See R1-F3.

The full suite and `tsc` were not re-run; the recorded 806 pass and clean `tsc` stand.

### What holds

- **Host facts H1–H4, against `host/pi` 1.1.0 source.**
  - H1: `_isActivatedOnRegistration` activates unless `defaultActive === false` (`agent-session.ts:3602–3604`).
  - H2: `_restoreToolsFromTranscript` restores the recorded set and keeps unregistered names pending (`:1809–1816`).
  - H3: `setActiveToolsByName` clears the pending set only when a tool is deactivated (`:1518–1525`).
  - H4: `_runAgentPrompt` clears the pending set (`:1822–1829`), and after `before_agent_start` the live loadout becomes the run's `selectedTools` unless a handler edited them (`:2062–2071`).
  - Session replacement emits `session_before_switch` and `session_shutdown` on the old runner before it is invalidated (`agent-session-runtime.ts:133–176`), so `tools.remove()` in `end()` reaches a live runner. The new session builds a new runtime in which the tool registers inactive.
- **Activation (3.1, D3).** `SpeakAloudSwitch` (`speak-aloud.ts:12–28`) reads the active set and calls `setActiveTools` only when the name's state changes. That enforces the "never a no-op" invariant at its boundary, so it is not a pass-through layer. The three change points are the only callers:
  - `tools.add()` at live start (`live.ts:256`), placed after the post-`listen` state check, so a failure while the recorder starts never adds it;
  - `tools.remove()` in `end()`, only for an `on` state (`live.ts:342`);
  - `removeToolOutsideLive()` from `before_agent_start` (`index.ts:207–209`, `live.ts:155–157`).

  Nothing subscribes to `session_start` for tools. `session_tree` reaches `end()`, which does nothing when live mode is off. The definition is typed `ToolDefinition<…> & { defaultActive?: boolean }` with `defaultActive: false` (`speak-aloud.ts:40–51`).
  - Tests: `test/live-tool.test.ts:11–19` fires every event but `session_start` plus `before_agent_start`, and asserts zero `setActiveTools` calls. `:33–39` checks that the removal keeps the other names and that a second run makes no call. `:41–57` covers add on start and removal on three end paths. `:59–69` covers no-op add and no-op remove. `:71–79` covers the failure while the recorder starts. Each test would fail under the matching mutation.
- **Tool contract (3.1).**
  - The description and guidance carry every element the requirement lists (`speak-aloud.ts:43–49`), and `test/live-tool.test.ts:21–31` asserts each one.
  - `execute` returns synchronously after `enqueue`.
  - The results cover live off (also while starting), empty (`trim`), too long, and queued (`live.ts:136–147`).
  - The text is enqueued untrimmed and spoken as written; `:102–112` asserts the exact text, the ElevenLabs URL under a Deepgram configuration, and no player yet.
- **Single limit (Wave 1 R1-F5, closed).** `effectiveHardLimit` (`speech-preflight.ts:15–16`) is used by preflight (`:50`) and by live start (`live.ts:238`). Both measure with `checkLength` on the same raw text, so the tool and the job agree. Tests cover both the configured limit and the provider ceiling (`test/live-tool.test.ts:81–100`).
- **Queue (3.2, D7).** `LiveSpeech.drain` (`live-speech.ts:70–89`) speaks one update at a time through `speakLive`, whose promise never rejects, so a failed update has already been reported by `run()` and the loop continues.
  - `cutOff` drops the waiting updates and cancels the current job through `stopOwnAudio`. `cancel` clears `this.job` synchronously, so the next `speakLive` is never refused as "already active".
  - Order, no retry, the sanitized failure, and continuation are tested (`test/live-tool.test.ts:114–147`).
- **Mute (3.2, D6).** `onChunk` sends `Buffer.alloc(chunk.length)` while `!liveListenWhileSpeaking && updates.muted` (`live.ts:218–219`). `muted` is `playing || now < exit + 500` (`live-speech.ts:43–45`), with `playing` set by the player hooks, so muting starts at the player's start and the tail applies after a cut-off too.
  - The fake-clock test (`test/live-speech.test.ts:47–70`) proves heard → muted → muted at 300 and 499 ms → heard at 500 ms, with equal lengths. It compares lengths and first bytes, never buffers, so it is memory-safe.
  - **Wave 1 R1-F2, closed:** `signalLive` (`speech-job.ts:483–496`) guards both hooks. `test/job.test.ts:652–674` shows that a throwing hook neither orphans the player nor skips the exit hook, and that `/speak stop` still ends playback.
- **Cut-off (3.2).**
  - The send key (`live.ts:112–117`) is routed only for `fromShortcut && phase === "on"`, so Wave 2 R1-F1 still holds.
  - `/speak stop` drops waiting updates, then cancels (`index.ts:40–43`). With live mode off it is a no-op.
  - Barge-in sets `onPartial` only with the setting on (`live.ts:250`), and `cutOff` acts only while `busy`.
  - Nothing aborts the agent (`h.aborts === 0`), and live mode stays on.
  - Tests cover the key during playback and during synthesis, `/speak stop`, barge-in on and off, and the "Nothing is being spoken." message (`test/live-speech.test.ts:81–148`).
- **End paths (F12, closed).** `end()` stops the timer, recorder, and connection, then `updates.end()` (stop and drop), then the status line, then the tool, and it is idempotent.
  - On a session change, `reset` cancels the job first and `live.resetSession()` follows synchronously, so the drain loop sees `ended` before it could start the next update.
  - Tested for `/talk live`, a lost connection, and a session switch while Pi speaks (`test/live-speech.test.ts:163–194`).
- **Idle and status.**
  - `checkIdle` counts a busy queue as activity (`live.ts:321`). Test: `test/live-idle.test.ts:56–69`.
  - `render()` reads `this.state`, so an ended `LiveSpeech` cannot write a newer session's line, and its `onChange` is suppressed after `end` (`live-speech.ts:87`).
  - The status test asserts the exact listening, Pi speaking, and listening lines (`test/live-speech.test.ts:150–161`).
- **Help and README (3.3; Wave 2 R1-F4, closed).**
  - `help.ts:55` now says the send key is not refused and cuts Pi off. `help.ts:56` names the key, `/speak stop`, the mute and its tail, and `input.liveListenWhileSpeaking` with the headphones requirement.
  - `README.md:253–261` covers the tool, the language, the results, order and failure, cut-off, muting, barge-in, status, and the end paths, including tool removal. `README.md:268` covers the setting.
  - This matches the spec's speaking side. Stop-phrase text is Wave 4.
- **Regressions.** With live mode off, `dropWaitingUpdates` and `removeToolOutsideLive` are no-ops: no state, and an inactive tool means no call. `signalLive` acts only on live jobs (`liveHooks?.`). The preflight change is an equivalent extraction, and `talk.ts` is unchanged. Push-to-talk, Space holds, and the `/speak` forms run the same code as at `06d1733`.
- **Test memory safety.** Chunks are 1,600–3,200 bytes, and they are compared by length, first byte, and last byte. Loops are bounded (at most 8 ticks). `h.until` keeps its 3 s deadline, and `settle` is a short real timeout. No `deepEqual` on audio.
- **Sizes.**
  - Source files: `live.ts` 370, `live-speech.ts` 90, `speak-aloud.ts` 57, `speech-job.ts` 498, `index.ts` 267, `help.ts` 66 — all under 500.
  - Handwritten test files are governed by `testing-governance`'s thresholds (review at 800, required split above 1,000), which are the specific contract for tests: `test/job.test.ts` 674, `test/command.test.ts` 645, `test/harness.ts` 477.
  - Wave 3 added only 24 lines to `job.test.ts` and 14 to `command.test.ts`, and the harness shrank by moving the host fake to `test/fake-pi.ts`. No policy action is required.

### Worker-declared deviations, judged

- **`test/silence.test.ts`: accepted.** D3 requires the `before_agent_start` subscription, and the modified `manual-speech` requirement permits it. The fake now records any `setActiveTools` call as use, so "loading changes no active tool" is still enforced.
- **`test/command.test.ts` regex: accepted.** It matches the full new sentence that carried Wave 2 R1-F4 required. That is a legitimate change of contract, not a weakened assertion.
- **`live-speech.ts` split: accepted.**
  - It is a cohesive responsibility: the queue and the mute state.
  - It has one owner, since `LiveSession` constructs it per session and holds it in `On.updates`.
  - It is part of the live module, as D7 places it.
  - It keeps `live.ts` clear of the 500 lines that Wave 4 will push toward.
- **Idle counting speech, and `speakAloud` restarting the idle clock: accepted.** It follows "Live idle limit". One residual nuance is in the notes below.
- **Too-long limit computed at live start: accepted.** An async config read per call could reorder the enqueues. The job re-checks with fresh configuration, so a mid-session edit of `hardLimitChars` can only produce a preflight refusal later, never an oversized request.
- **"Pi speaking" covering synthesis and waiting: accepted.**
  - The status-line scenario (playback → "Pi speaking", then "listening") holds.
  - The cut-off key acts during synthesis too, so the line's "cuts Pi off" stays truthful.
  - Showing "listening" between queued updates would only flicker.

### Findings (highest priority first; no P0, P1, or P2)

**R1-F1 — family `tool-activation-window`, root `starting-phase-skips-run-start-removal`.** P3. In scope (3.1).
- Evidence: `live.ts:155–157` removes the tool only when `!this.state`, so nothing is removed while live mode is starting. Yet `speakAloud` treats starting as off (`live.ts:138`), and the spec says the tool is declared "only while live mode is on" (`specs/voice-conversation/spec.md:90`).
  - Trigger: a session resumed with `speak_aloud` restored (H2), and a prompt submitted during the second or so that `/talk live` is starting.
  - Effect: that run declares the tool. If the start then fails, nothing removes it until the next prompt, and the backstop "live mode is off" result applies meanwhile.
  - Severity: harmless in effect and very narrow.
- SUGGESTED_CORRECTION: `if (this.state?.phase !== "on") this.tools.remove();`. If the start then succeeds, `tools.add()` re-adds it, and the host applies the change before the next request. One table row in `test/live-tool.test.ts` (prompt while starting with the tool restored) would cover it. Alternatively, the caller can record the window as accepted.

**R1-F2 — family `design-wording` (W3-B), root `d3-reload-case-unreachable`.** P3. In scope (W3-B wording).
- Evidence: `design.md:50` gives "a `/reload` while live mode was on, which carries every active tool across the reload" as a case for the run-start removal. On the 1.1.0 host, `reload()` first emits `session_shutdown` on the still-active runner (`agent-session.ts:3663`). The extension's handler then ends live mode, and `end()` removes `speak_aloud` (`index.ts:198–201` → `live.ts:342`). Only after that does reload copy the active names into the pending set (`agent-session.ts:3681`). So a reload does not carry the tool. The remaining real cases are a restored transcript (resume, or a tree point recorded in live mode) and a host that ignores `defaultActive`. The code is correct; only the rationale is inaccurate.
- SUGGESTED_CORRECTION: in D3, replace the `/reload` clause with "a reload while live mode is on ends it at shutdown, which already removes the tool". Optionally, add that the Risks bullet "Ending live mode in a resumed session before its first agent run…" also applies to a `/reload` in that window, because the shutdown removal clears pending tools (H3). This is a wording-only edit.

**R1-F3 — family `verification-evidence`, root `host-before-agent-start-confirmation`.** P3. In scope (3.1).
- Evidence: `tasks.md:40` requires confirming on the 1.1.0 host, "a host-level test or a real-host check", that a removal in `before_agent_start` applies to that run's declarations. W3-A recorded only a source read. An existing host test proves exactly this: `host/pi/packages/coding-agent/test/system-prompt-updates.test.ts:235–272`, "setActiveTools in before_agent_start controls the same request". It asserts that the second request's system update removes the deactivated tool and that the active set is the new one. Oracle ran it inside the 4 GB scope: 1 pass.
- SUGGESTED_CORRECTION: record that test and this run in task 3.1's result as the host-level confirmation. No new test.

### Notes for the caller (not findings)

- **Idle nuance (D9 coarse-timer family, already accepted in Wave 2).** `speakAloud` sets `idleSince` at call time (`live.ts:144`). If the agent run and the update both finish between two 15 s ticks, the next tick keeps that call time. The count then starts up to the length of the update (under 15 s) before the speech actually ended. The README says only "up to 15 seconds late". Bounded and minor against a 1–60 minute limit. Optional exact fix: restart `idleSince` when the drain ends, in the `LiveSpeech` `onChange` callback, instead of at call time.
- **Another extension editing `selectedTools`.** If another extension's `before_agent_start` handler explicitly edits `event.systemPromptOptions.selectedTools`, the host lets that edit win for the run (`agent-session.ts:2067–2071`), so the removal would apply only from the next run. The tool's "live mode is off" result is the backstop. No such extension is known in this repository.
- **3.4 residuals.** Still unverified on real hardware:
  - the 500 ms tail clipping a quick one-syllable answer (R2-F4);
  - voice barge-in with headphones;
  - a one-second pause splitting a turn;
  - three or more minutes of silence (F6);
  - the billing basis.

  The gate condition ("complete or explicitly reported as unverified") is met by `tasks.md:44–45`.
- **Wave 4 seams.**
  - `live.ts` is at 370 lines, so the stop phrase must stay small or move into its own module.
  - `speech-job.ts` is at 498 and must not grow.
  - The stop-phrase end should call the existing `end()`, which already stops speech, drops updates, removes the tool, and clears the status line.
- **Bookkeeping.** `tasks.md` 3.1–3.3 are still unchecked. Carried items closed by this wave: Wave 1 R1-F2 and R1-F5, Wave 2 R1-F4, and F12. Remaining carried: F11 (commit `pi-speak` first, then the gitlink).

PROPOSED_REVIEW_ACTION=PASS

## Caller Assessment — Wave 3, Round 1

Mode: `FULL`. Gate: task 3.5. Oracle ran in the background on `claude-bridge/claude-opus-5-5:high` (run `18e26ecd`) and confirmed the baseline `sha256:6e584395b83e3a4b`.

Oracle found no P0–P2 issues and closed every carried item (Wave 1 R1-F2 and R1-F5, Wave 2 R1-F4, F12). It accepted all six worker-declared deviations, with reasons in its section. File sizes are within policy.

#### R1-F1 — the tool is not removed when a prompt-started run begins while live mode is starting
- **Decision:** `ACCEPT_NONBLOCKING`. Family `tool-activation-lifecycle`. P3: a narrow window, and the tool's own "live mode is off" result keeps behavior safe.
- **CORRECTION:** Carried to task 4.2, which edits `live.ts` anyway. `removeToolOutsideLive` (`live.ts:155–157`) removes the tool whenever the phase is not `on`, with one table row in `test/live-tool.test.ts`.

#### R1-F2 — design D3's `/reload` remark cannot happen
- **Decision:** `ACCEPT_NONBLOCKING`. Family `adr-design-wording`. It is the orchestrator's own W3-B wording.
- **CORRECTION:** Applied now in `design.md` D3, which is source text, not the code under review. Shutdown ends live mode and so removes the tool before the reload copies the active tools, so `/reload` is not a case where the tool is carried over.

#### R1-F3 — task 3.1's host confirmation was only a source read
- **Decision:** `ACCEPT_NONBLOCKING`. Family `verification-evidence`.
- **CORRECTION:** Recorded in task 3.1. The host test `host/pi/packages/coding-agent/test/system-prompt-updates.test.ts:235` shows that a `setActiveTools` call in `before_agent_start` applies to the starting run. Oracle ran it inside the 4 GB scope, and it passed.

#### Oracle-noted risks (no edit)
- The task 3.4 sub-checks remain unverified on real hardware.
- The idle count may start up to about 15 s early, within D9's coarse timer.
- An extension that explicitly edits `selectedTools` could override the removal for one run; the tool's live-off result covers it.

### Summary
- **Accepted blocking:** 0.
- **Accepted nonblocking:** 3 (R1-F1 carried to 4.2; R1-F2 and R1-F3 applied now).
- **Deferred:** 0.
- **Rejected:** 0.

### Terminal baseline validation
- **Boundary:** `BASELINE_TARGET`, `BASELINE_SOURCE`, `BASELINE_INCLUSION_PREDICATE`, and `BASELINE_EXCLUSIONS` are unchanged. The design wording fix edits a source file's text, not its identity.
- **Candidate:** recomputed `sha256:6e584395b83e3a4b`, equal to the recorded `BASELINE_TARGET_REVISION`.
- **Rounds:** 1 of 4 Oracle rounds used, and no rebuild.

DISPATCH_BUDGET wave 3: oracle=1/1 others=1/3

REVIEW_ACTION=PASS
CONSENSUS_STATUS=MOSTLY_GOOD

## Wave 4 Review Sequence

## Round 1 - Implementation Assignments

Wave handled: 4 (amendment of 2026-10-15, live stop phrase). Final gate reserved: task 4.5 [Oracle gate: `oracle`], run once after 4.1–4.3 are complete and 4.4 is complete or explicitly reported as unverified.

Between-wave reuse check on the Wave 3 worker (`2aa1d487`), using the mechanical conditions only:

| Gate | Condition | Value | Result |
| --- | --- | --- | --- |
| 1 | Same agent type, completed, and reconciled | — | pass |
| 2 | Idle under 1 hour | about 30 minutes (03:51 to 04:20 UTC) | pass |
| 3 | Last context plus about 150k under 350k | 233,334 + 150k ≈ 383k | **fail** |

So a fresh `worker` is used, and no Jev check is needed. Dispatch: background, `claude-bridge/claude-sonnet-5-5:high`.

| Assignment | Tasks | Owner | Bounded responsibility | Files and topics |
| --- | --- | --- | --- | --- |
| W4-A | 4.1 | orchestrator | ADR-0010 amendment | `docs/adr/0010-live-voice-conversation.md` (Change line, the "Ending by voice" Decision bullet, the ADR-0006 Consequences bullet) |
| W4-B | 4.2, 4.3 | worker | `input.liveStopPhrases`, the whole-turn matcher, turn handling and ending, status line and help, the README, and the carried Wave 3 R1-F1 | `extensions/speak/input-settings.ts`, `realtime.ts` (matcher), `live.ts`, `help.ts`, `README.md`, `test/live-stop.test.ts` (new), `test/config.test.ts`, `test/live-tool.test.ts`, `test/command.test.ts` (help only) |
| W4-C | 4.4 | user | Live check of both default phrases and a longer sentence containing one | Recorded in task 4.4, or reported as unverified |

### W4-A (orchestrator) evidence

ADR-0010 is amended, uncommitted until the Wave 4 PASS:

- **Change line:** names the amendment of 2026-10-15 and design D12.
- **Decision:** a new "Ending by voice" bullet covers the setting, the default pair, `[]` to turn it off, the whole-turn match, ignored case, punctuation, and diacritics, that the extension handles the phrase itself, and that it is the only spoken command and can only end live mode.
- **Consequences:** the ADR-0006 bullet now says that live mode has its own stop phrases, that a misheard match is harmless, and that a phrase is not heard while Pi speaks with the microphone muted.
- **Other ADRs:** none edited.

### W4-B (worker, run `af8e687a`, background, `claude-bridge/claude-sonnet-5-5:high`, completed)

Provider confirmed from the child transcript: all 35 model turns went through `claude-bridge`.

Tasks 4.2 and 4.3. Files, all in `extensions/speak`, with line counts:

- **Source:** `input-settings.ts` (196), `realtime.ts` (357), `live.ts` (384), `help.ts` (70), `README.md` (311).
- **Tests:** new `test/live-stop.test.ts` (153), plus `test/config.test.ts` (469), `test/live-tool.test.ts` (160), `test/command.test.ts` (670), and `test/realtime.test.ts` (411).
- **Two one-line assertions outside the listed scope:** `test/live.test.ts:20` and `KEY_LINE` in `test/live-speech.test.ts`.

New export and fields:

- `matchesLiveStopPhrase(text, phrases): boolean` in `realtime.ts`: `spokenWords` with diacritics folded (NFD, combining marks removed, `đ` → `d`).
- `InputConfig.liveStopPhrases`.
- `On.stopPhrases`, read when live mode starts.

Behavior:

- **Matching:** checked in `onCommitted` before the letter-or-digit filter. A match is never sent. The end is chained behind `on.sending`, then goes through `end()` with "Live mode ended because you said the stop phrase. The microphone is closed.", which repeats no transcript text. Later segments find live mode ended and are dropped.
- **Status line:** appends ` · or say "<first phrase>"` when any phrase is configured.
- **Help:** shows the current phrases ("off" when empty, "unknown" when the configuration cannot be read) and a rule line: defaults, `[]`, whole-turn, what matching ignores, and muting.
- **README:** the example, the defaults paragraph, a new "Ending by voice" paragraph, and the status-line and ending text.
- **`/speak status`:** unchanged.

Carried Wave 3 R1-F1: `removeToolOutsideLive` removes the tool whenever the phase is not `on`, with a new case in `test/live-tool.test.ts`.

Deviation, accepted by the caller: the spec requires the status line to name the first stop phrase, so the two existing exact-match status assertions were updated by one line each. That follows from the spec change, not from a behavior regression.

Worker's mutation checks, each detected:

- whole-turn changed to prefix (5 failures);
- diacritic folding removed (5);
- `đ` mapping removed (2);
- matched turn also sent (9);
- end called immediately instead of chained (2);
- end delayed past later turns (1);
- R1-F1 reverted (1).

Orchestrator re-verification, inside the 4 GB scope:

- `test/live-stop.test.ts` alone: 22 pass.
- `test/live-tool.test.ts` alone: 12 pass.
- Full suite: 859 pass, 0 fail (Wave 3: 806).
- `npx tsc --noEmit`: clean.

### W4-C (user) evidence: task 4.4

- **Result (2026-10-15):** the user reported "stop the conversation work[s]", which the orchestrator reads as: the English default phrase ended live mode in their live test.
- **Not reported, so unverified:** the Vietnamese phrase, which the config's `input.language: "en"` would likely garble, and the longer sentence containing a phrase. Both are covered by automated tests only.
- **Where it is recorded:** in task 4.4 itself.

BASELINE_TARGET=Wave 4 of add-speak-live-conversation: tasks 4.1–4.3 as implemented (live stop phrase, the ADR-0010 amendment, and the carried Wave 3 R1-F1)
BASELINE_TARGET_REVISION=sha256:ea74699ccfa62b59 (git -C extensions/speak diff HEAD, then extensions/speak/test/live-stop.test.ts, then git diff HEAD -- docs/adr/0010-live-voice-conversation.md, in that order; pi-speak HEAD 8461c12, root HEAD 4861d6e)
BASELINE_SOURCE=openspec/changes/add-speak-live-conversation (proposal, design D12 and D3, tasks, specs/voice-conversation/spec.md "Live stop phrase" and its referencing requirements) as committed in 4861d6e plus the task 4.4 result; docs/adr/0006 and 0010
BASELINE_INCLUSION_PREDICATE=files changed or created for tasks 4.1–4.3: extensions/speak/{input-settings,realtime,live,help}.ts, extensions/speak/README.md, extensions/speak/test/{live-stop,config,live-tool,command,realtime,live,live-speech}.test.ts, docs/adr/0010-live-voice-conversation.md
BASELINE_EXCLUSIONS=Waves 1–3 code except as context; unrelated uncommitted add-pi-session-rename-tool files and the staged session-rename move; host/pi; ~/.config/pi-speak/config.json

DISPATCH_BUDGET wave 4: oracle=0/1 others=1/3 (before the gate)

## Round 1 - Oracle Review

Gate task consumed (once): 4.5 [Oracle gate: `oracle`] Final review gate for Wave 4, run once after 4.1–4.3 are complete and 4.4 is complete or explicitly reported as unverified. Mode: FULL (first review of this wave), under `review-convergence`. Output is advisory; the caller owns reconciliation, the authoritative action, and status.

Task and owner mapping reviewed:

| Task | Owner | Reviewed against |
| --- | --- | --- |
| 4.1 | orchestrator (W4-A) | `docs/adr/0010-live-voice-conversation.md` (Change line L5, Supersedes line L6, "Ending by voice" L25, ADR-0006 Consequences bullet L34); D12; ADR-0004 and ADR-0006 as context |
| 4.2 | worker (W4-B) | `input-settings.ts`, `realtime.ts` (`matchesLiveStopPhrase`), `live.ts` (`onCommitted`, `render`, `removeToolOutsideLive`), `help.ts`; `test/live-stop.test.ts`, `test/config.test.ts`, `test/realtime.test.ts`, `test/command.test.ts`, `test/live-tool.test.ts`; D12, D3, D6, D8, D11; "Live stop phrase" and the requirements that refer to it; carried Wave 3 R1-F1 |
| 4.2 deviation | worker (W4-B) | `test/live.test.ts:20`, `KEY_LINE` in `test/live-speech.test.ts:10` |
| 4.3 | worker (W4-B) | `README.md` (example, defaults paragraph, "How turns are sent", "Ending by voice", status, "Ending", settings table) against the spec |
| 4.4 | user (W4-C) | Recorded result and unverified parts in `tasks.md` task 4.4 |

Baseline: recomputed `sha256` over `git -C extensions/speak diff HEAD`, then `extensions/speak/test/live-stop.test.ts`, then `git diff HEAD -- docs/adr/0010-live-voice-conversation.md`, in that order. The digest is `ea74699ccfa62b594ea0…`, so `BASELINE_TARGET_REVISION=sha256:ea74699ccfa62b59` is **confirmed**. `pi-speak` HEAD is `8461c12` and root HEAD is `4861d6e`, as recorded. `extensions/speak` status shows exactly the eleven modified files and the one new test of the inclusion predicate.

Independent checks, each inside `systemd-run --user --scope -q -p MemoryMax=4G -p MemorySwapMax=0 timeout 300`, output in `/tmp/oracle-w4-*.log`:

- `test/live-stop.test.ts` alone: 22 pass, 0 fail.
- `test/realtime.test.ts` alone: 73 pass, 0 fail.

The full suite and `tsc` were not re-run; the recorded 859 pass and clean `tsc` stand.

### What holds

- **Setting (4.2, "Live stop phrase" ¶1).** `parseLiveStopPhrases` (`input-settings.ts:85–94`) accepts 0 to 10 entries, trims, requires 1–40 characters and `[\p{L}\p{N}]`, and fails with an `input.liveStopPhrases` message otherwise. The default is the spec pair (`:50`), the key is in `INPUT_KEYS` (`:68`), and it is a separate field from `stopPhrases`, whose rules (1 to 10, no letter check) are untouched. `null` falls back to the default through `??`, the same convention as every other `input.*` key. Length is counted in UTF-16 units, as `parseStopPhrases` counts it. Tests cover not a list, 11 entries, `""`, 41 characters, punctuation only, a non-string, `[]`, ten entries, both bounds after trim, and the default beside `stopPhrases` (`test/config.test.ts`). An invalid value refuses `/talk live` with the configuration error and opens nothing (`test/live-stop.test.ts:141–153`), through the existing `loadConfig` refusal at `live.ts:184`.
- **Matcher (4.2, ¶2).** `matchesLiveStopPhrase` (`realtime.ts:343–357`) reuses `spokenWords` unchanged — lower-case, NFC, curly apostrophes straight, whitespace and punctuation as separators — then folds each word (NFD, `\p{M}` removed, `đ` → `d`) and requires equal word counts and equal words. The edge cases asked about all hold:
  - An empty or whitespace-only turn yields no words, so `wanted.length === spoken.length` fails against any phrase with a word; it never matches.
  - Folding happens after splitting, and a combining mark is neither `\s` nor `\p{P}`, so an NFD or mixed NFC/NFD transcript keeps the same word boundaries; folding never changes the word count.
  - Uppercase `Đ` is lower-cased to `đ` before folding, and `đ` has no decomposition, so the explicit map is what makes it `d`; both directions are tested (`test/realtime.test.ts`, "a transcript with d against a phrase with đ" and "…Đ against a phrase with d").
  - A phrase configured without diacritics matches an accented transcript, and the reverse.
  - Any phrase that passes validation has at least one word, so `wanted.length > 0` only guards the matcher's own contract.
- **Push-to-talk regression.** `matchStopPhrase` and `spokenWords` are byte-for-byte unchanged; the new code is appended after them. `talk.ts` is unchanged and still passes `input.stopPhrases` (`talk.ts:298`). The live test at `test/live-stop.test.ts:119–128` shows that `"let's go"` is sent as a turn and that the live list is the only one read.
- **Turn order (4.2, ¶3).** In `onCommitted` (`live.ts:275–289`), `delivered` advances first, then the match, then the letter-or-digit filter. A match returns before `send`, so the turn is never sent, never reaches `keepInComposer`, and is never stored. The end is chained on `on.sending` and re-checks `this.state === on`, so:
  - earlier turns finish `send` first (`test/live-stop.test.ts:76–84`);
  - a `/talk live`, idle end, or connection failure in that window makes the chained end a no-op, with no second message;
  - a new live session started in that window is not ended, because `on` is the old object;
  - later segments either queue behind the end and stop at `send`'s `this.state !== on` check (`live.ts:298`), or arrive after `end()` and stop at `live.ts:276` (`test/live-stop.test.ts:86–99`).
  The end goes through `end()`, the same function as `/talk live` (`live.ts:104`). It stops the recorder, closes the connection, stops and drops updates, clears the status line, and removes the tool; `test/live-stop.test.ts:23–55` asserts each, plus `h.aborts === 0`.
- **Privacy.** The end message is a constant and contains no transcript (`live.ts:283`); the test checks that no notice contains the said text (`test/live-stop.test.ts:35`). Nothing is logged or written. The matched text stays only in the in-memory `session.text`, which is closed with the connection.
- **Muting and barge-in (D6, D8).** Untouched. With muting on, a phrase said during playback is replaced by silence and cannot match, as D12 states. With `input.liveListenWhileSpeaking` on, the phrase's first partial transcript cuts Pi off through `cutOffByVoice`, and its commit then ends live mode; `end()` would stop the speech anyway. That composition is not tested end to end, but both halves are (barge-in in `test/live-speech.test.ts`, the ending here), and the spec has no scenario for it.
- **Status line.** `render()` appends ` · or say "<first phrase>"` only when a phrase is configured (`live.ts:362`). The exact-line tests cover the default, a configured first phrase, and `[]` (`test/live-stop.test.ts:130–139`). A long phrase is bounded at 40 characters, so the line is at most about 125 columns. The host footer replaces newlines and tabs and truncates the status line to the terminal width with an ellipsis (`host/pi/packages/coding-agent/src/modes/interactive/components/footer.ts:14–19`, `:297`). The phrase comes last, so a narrow terminal loses it before the cut-off key or `/talk live`. A `"` inside a phrase would render doubled quotes, which is only cosmetic.
- **Help (4.2).** `Live stop phrase:` shows the configured phrases, `off` for `[]`, or `unknown` when the configuration cannot be read (`help.ts:19–24`), each tested exactly (`test/command.test.ts` table). The rule line (`help.ts:60`) names the setting, the defaults, `[]`, the whole-turn rule, what matching ignores, that the agent keeps working, the muted caveat, and the separation from `input.stopPhrases`. `/speak status` is unchanged (`speech-status.ts` and `config.ts` are not in the diff), as the spec requires.
- **README (4.3).** Read against the spec: the example and defaults paragraph carry the pair and `[]`; "How turns are sent" now says only the push-to-talk phrases have no effect; "Ending by voice" (`README.md:260`) states the whole-turn rule, the ignored case, punctuation, accents, `đ`, and curly apostrophes, both spec examples, the near-miss example, never sent, added, or stored, the turn order, the dropped later speech, the message, the agent not aborted, the muted caveat and barge-in behaviour, read at start, separation from `input.stopPhrases`, and the harmless misheard case. The status, "Ending", and settings-table text match the code. The `/speak status` sentence is narrowed to the two settings it really shows, which matches the spec.
- **Carried Wave 3 R1-F1, closed.** `removeToolOutsideLive` now removes unless the phase is `on` (`live.ts:157–159`). The new test (`test/live-tool.test.ts:81–92`) restores the tool, fires `before_agent_start` while the socket is held in the starting phase, and checks the removal, the re-add at start, and that a run during live mode keeps it. Reverting to `!this.state` fails its first assertion.
- **Test memory safety.** No audio buffers are compared; the new tests compare strings and lengths only. `h.until` keeps its 3 s deadline and `settle` is a short timeout. Loops are fixed tables of at most 16 rows.
- **Sizes.** `live.ts` 384, `realtime.ts` 357, `input-settings.ts` 196, `help.ts` 70: all source files are under 500. Handwritten tests are governed by `testing-governance` (review at 800, required split above 1,000), as the Wave 3 gate judged: `test/command.test.ts` 670 (+25), `test/config.test.ts` 469, `test/realtime.test.ts` 411, `test/live-stop.test.ts` 153. No policy action is required.
- **ADR consistency with ADR-0006 and D12.** The "Ending by voice" bullet and the rewritten Consequences bullet agree with D12: a separate list, the default pair, `[]`, whole turn, ignored case, punctuation, and diacritics, handled by the extension, never sent, the only spoken command, and only ending live mode. ADR-0006's "Related" line ("the stop phrase has no effect while live mode is on") is still true of the push-to-talk phrase. No other ADR was edited, as task 4.1 requires. Two wording findings follow.
- **4.4 gate condition.** Met: the English phrase was reported working, and the Vietnamese phrase and the longer sentence are explicitly recorded as unverified in task 4.4.

### Worker-declared deviation, judged

- **Two one-line status assertions outside the listed files: accepted.** The spec now requires the status line to name the first phrase, so the existing exact-line assertions at `test/live.test.ts:20` and `test/live-speech.test.ts:10` (used with `assert.equal` at `:154–160`) had to change. Both still match the whole line exactly, not a prefix, so they keep their mutation sensitivity. Both files are in the frozen inclusion predicate.

### Findings (highest priority first; no P0, P1, or P2)

**R1-F1 — family `adr-consistency`, root `adr-0010-supersedes-sweep-clause`.** P3. In scope (4.1). Recurrence 2 of Wave 1 R1-F4 (caller family `adr-wording`).
- Evidence: ADR-0004 decides "There are no spoken commands" (`docs/adr/0004-voice-input-and-provider-choice.md:20`) and rejects voice triggers (`:44`). Its status line records only ADR-0006 as superseding the voice-trigger exclusion, and only while the push-to-talk stop phrase is on (`:3`). ADR-0010's Supersedes line (`docs/adr/0010-live-voice-conversation.md:6`) lists every live-only override — the open microphone, automatic speech, the provider choice, Space holds — and then says "every other decision in ADR-0002 through ADR-0008 remains in force". The amendment's Decision bullet (`:25`) adds a spoken command in live mode, "the only spoken command in live mode", without adding it to that list. This is the same root as Wave 1 R1-F4: a new live-only override without a matching entry in the sweep clause. It is a list that was not updated with a new decision, not a structural defect, and there is no runtime effect, so it does not call for a rebuild.
- SUGGESTED_CORRECTION: in ADR-0010's Supersedes line, extend the live-mode-only sentence with "and ADR-0004's exclusion of spoken commands: the live stop phrase is the one spoken command, and it can only end live mode". This edits only ADR-0010, within task 4.1's "no other ADR is edited". A matching clause in ADR-0004's status note, as the Wave 2 precedent did, would need the caller to relax that task clause first; it is optional.

**R1-F2 — family `adr-consistency`, root `only-contains-reads-as-whole-turn`.** P3. In scope (4.1); the same sentence is in a source artifact.
- Evidence: ADR-0010 says "a turn that only contains a phrase is sent to Pi as usual" (`docs/adr/0010-live-voice-conversation.md:25`), and the proposal says "A sentence that only contains the phrase is sent as usual" (`openspec/changes/add-speak-live-conversation/proposal.md:15`). "Only contains the phrase" naturally reads as "contains nothing but the phrase", which is exactly the turn that ends live mode. The spec states the intended rule unambiguously: "A turn that contains a phrase together with other words SHALL NOT match" (`specs/voice-conversation/spec.md:189`). The code, README, and help are correct; only these two sentences can be misread as the opposite.
- SUGGESTED_CORRECTION: reword both to "a turn that contains a phrase among other words is sent to Pi as usual". The proposal edit is source wording, which the caller applied in place for Wave 3 R1-F2.

**R1-F3 — family `test-value`, root `unobservable-order-test`.** P3. In scope (4.2).
- Evidence: `test/live-stop.test.ts:101–108`, "the phrase is checked before the letter-or-digit filter, and dropped text does not join it", commits `...` then `stop the conversation` and asserts nothing is sent. Neither named property can fail it:
  - Every valid phrase has a letter or digit (`input-settings.ts:90`), and folding only removes marks, so every matching turn passes `HAS_WORDS`. Swapping the order of `live.ts:280` and `:287` changes nothing observable.
  - `session.text` joins segments with a space (`realtime.ts:245`), and `.` is punctuation. If `delivered` stopped advancing for dropped turns, the next turn would be `... stop the conversation`, which still matches.
  The only effective assertion duplicates the default-phrase table (`:16–41`). Under test-value discipline it detects no distinct failure.
- SUGGESTED_CORRECTION: delete the test. The ordering is safe by construction, and the comment at `live.ts:271–274` records it. The worker's mutation list has no entry for this test, consistent with its having no mutation to catch.

### Notes for the caller (not findings)

- **First phrase on the status line versus the user's language.** With `input.language: "en"` (the user's own configuration, per W4-C), the status line advertises the Vietnamese default, which a fixed English transcription would likely garble. This conforms to the spec ("the first live stop phrase"). The user can put "Stop the conversation" first. The README could optionally add that a fixed `input.language` may keep a phrase in another language from being recognized.
- **Inherited send-chain residual (Wave 2 note).** If `send` ever rejected — only possible if the host's `context.model` getter threw on a stale runner, which every session change prevents by ending live mode first — `on.sending` would reject, and the chained stop-phrase end would be skipped along with later turns. No change is needed; the stop phrase only adds one more consumer of the same chain.
- **Help's first live line.** `help.ts:57` lists ending "on /talk live again, on an error, or after input.liveIdleMinutes". It did not list session changes before this wave either, and the stop phrase has its own line just below (`:60`), so this is not an accuracy defect. Adding "or on a live stop phrase" is optional.
- **A phrase said into the mute tail.** A phrase that starts during the 500 ms tail can be committed without its first words, such as "the conversation", and then be sent as an ordinary turn. The README and help already say to wait until Pi has finished or to cut Pi off first.
- **Sizes for later work.** `test/command.test.ts` is at 670 lines. If it nears 800, the help tests are a cohesive group that can move to their own file.
- **Bookkeeping.** `tasks.md` 4.1–4.3 are still unchecked. Remaining carried item: F11 (commit `pi-speak` first, then the gitlink).

PROPOSED_REVIEW_ACTION=PASS

## Caller Assessment — Wave 4, Round 1

Mode: `FULL`. Gate: task 4.5. Oracle ran in the background on `claude-bridge/claude-opus-5-5:high` (run `53686811`) and confirmed the baseline `sha256:ea74699ccfa62b59`.

Oracle found no P0–P2 issues. It closed the carried Wave 3 R1-F1 and accepted the worker's two status-assertion edits.

#### R1-F1 — ADR-0010's Supersedes line does not set aside ADR-0004's "no spoken commands"
- **Decision:** `ACCEPT_NONBLOCKING`. Family `adr-consistency`, the same root as Wave 1 R1-F4. This is wording, not structure.
- **CORRECTION:** Carried to Wave 5 task 5.1 (orchestrator), so that this wave's commit matches the reviewed revision:
  - add the spoken-command exclusion to ADR-0010's live-mode-only Supersedes list;
  - add a matching line to ADR-0004's status note. The Oracle's question of relaxing task 4.1's "no other ADR is edited" is settled by moving the edit to 5.1.

#### R1-F2 — "a turn that only contains a phrase is sent" reads as the opposite of the whole-turn rule
- **Decision:** `ACCEPT_NONBLOCKING`. Family `adr-design-wording`.
- **CORRECTION:** Applied now in `proposal.md:15` ("contains the phrase among other words"), which is not part of the reviewed revision. ADR-0010 line 25 is carried to task 5.1.

#### R1-F3 — `test/live-stop.test.ts:101–108` cannot catch either property its name claims
- **Decision:** `ACCEPT_NONBLOCKING`. Family `test-value`.
- **CORRECTION:** Carried to Wave 5 task 5.2 (worker): delete the test.

#### Oracle notes (no edit)
- **The Vietnamese phrase shown first on the status line:** moot. The user removed `input.language: "en"` on 2026-10-15, so live mode detects the language, and Wave 5 adds a live language limit.
- **The 500 ms mute tail can clip a phrase:** already documented in the README and help.

### Summary
- **Accepted blocking:** 0.
- **Accepted nonblocking:** 3 (R1-F1 and R1-F3 carried to Wave 5; R1-F2 split between proposal.md now and the ADR in 5.1).
- **Deferred:** 0.
- **Rejected:** 0.

### Terminal baseline validation
- **Boundary:** the four boundary fields are unchanged.
- **Candidate:** recomputed `sha256:ea74699ccfa62b59`, equal to the recorded `BASELINE_TARGET_REVISION`.
- **Rounds:** 1 of 4 Oracle rounds used, and no rebuild.

DISPATCH_BUDGET wave 4: oracle=1/1 others=1/3

REVIEW_ACTION=PASS
CONSENSUS_STATUS=MOSTLY_GOOD

## Wave 5 Review Sequence

## Change amendment (user requests, 2026-10-15): thinking pause and live languages

What the user asked for, and why:

- **Thinking pause:** "when user is thinking/pausing/hesitating, the talk responds too fast". Q1 was not answered, so option A applies: a live-only `input.livePauseSeconds`, defaulting to 2.
- **Live languages:** a handoff asked to limit recognition to Vietnamese and English. Under auto-detect, Vietnamese was reported to come out as Chinese. The user's `input.language: "en"` was removed earlier by the user. Q2 = A.

API probe of 2026-10-15, done by the orchestrator:

- **Method:** a scratch script in `/tmp`, since deleted. Clips were made with ElevenLabs text-to-speech (`eleven_flash_v2_5`, the user's voice) and sent to `wss://…/v1/speech-to-text/realtime` with `scribe_v2_realtime`, a manual commit, and `include_language_detection`. There was one synthetic clip per language.
- **Auto-detect:** vi→vi, en→en, zh→**Chinese text**, vi with English words→vi.
- **`language_code=vi` alone:** English text came back labelled `vi`, and zh came back empty.
- **`language_code=vi` + `secondary_languages=en`:** vi→vi, en→**en**, zh→empty, mixed→vi.
- **`secondary_languages=vi` + `secondary_languages=en`, no language code:** the same as the line above.
- **`secondary_languages=en` alone:** vi→**empty**, mixed→empty. Without `language_code`, the list is the complete allowed set.
- **`language_code=vi` + `secondary_languages=vi,en`:** accepted, and vi and en were both detected correctly.
- **The `session_started` echo:** confirms `secondary_languages`, and gives a server default `vad_silence_threshold_secs` of 1.5.
- **Pause bounds:** 2 and 3 are accepted. 3.5 is refused with `invalid_request: vad_silence_threshold_secs must be between 0.3 and 3.0`, which matches the `elevenlabs-js` client check (`src/wrapper/realtime/scribe.ts`).

Conclusion: `secondary_languages` behaved as a limit, not a hint. Audio in a language outside the set came back as an empty segment. This is one synthetic sample per language, so real speech remains task 5.4.

Artifacts amended by the orchestrator, with no parallel specification:

- **Proposal:** a new bullet for the pause and the languages.
- **Spec `voice-conversation`:**
  - a new requirement "Live pause and languages" with five scenarios;
  - "Starting live mode" (the start message names the languages it listens for), "Live turn delivery" (the pause setting), and "Live mode status, help, and settings" now refer to it.
- **Design:** D13 (pause) and D14 (languages), with the probe evidence and rejected alternatives. The non-goal now reads "push-to-talk's pause and languages unchanged", D11 lists the new settings, and Risks gains two lines.
- **Tasks:** Wave 5, tasks 5.1–5.5.
- **Validation:** `openspec validate --strict` is valid.

## Round 1 - Implementation Assignments

Wave handled: 5. Final gate reserved: task 5.5 [Oracle gate: `oracle`].

| Assignment | Tasks | Owner | Bounded responsibility | Files and topics |
| --- | --- | --- | --- | --- |
| W5-A | 5.1 | orchestrator | ADR wording carried from the Wave 4 gate (R1-F1, R1-F2) | `docs/adr/0004-…` status note; `docs/adr/0010-…` Supersedes line and the "Ending by voice" bullet |
| W5-B | 5.2, 5.3 | worker (Wave 4 worker resumed) | `input.livePauseSeconds` and `input.liveLanguages`; pause and language list on the live connection only; start message, `/speak status`, help, README; carried Wave 4 R1-F3 (delete the test) | `input-settings.ts`, `realtime.ts`, `live.ts`, `config.ts` (status), `help.ts`, `README.md`, `test/realtime.test.ts`, `test/config.test.ts`, `test/live*.test.ts`, `test/command.test.ts` |
| W5-C | 5.4 | user | Live check: a 1.5 s pause, Vietnamese and English with `liveLanguages`, and the Vietnamese stop phrase | Recorded in task 5.4 |

### W5-A (orchestrator) evidence

- **ADR-0004:** its Status line now says the "no spoken commands" rule is superseded by ADR-0010 while live mode is on, for the live stop phrase only.
- **ADR-0010:** the Supersedes line names the same exclusion, and the "Ending by voice" bullet now reads "a turn that contains a phrase among other words is sent to Pi as usual". ADR-0010 agrees with D12.
- No other ADR is edited.

Worker reuse check:

| Gate | Condition | Value | Result |
| --- | --- | --- | --- |
| 1 | Same agent type, completed, and reconciled (Wave 4 PASS) | `af8e687a` | pass |
| 2 | Idle under 1 hour | 04:26 to 04:52 UTC | pass |
| 3 | Last context plus about 150k under 350k | 108,874 + 150k ≈ 259k | pass |

The worker is resumed with a bounded delta, on the same model (`claude-bridge/claude-sonnet-5-5:high`).

### W5-B (worker, resumed as run `de0ea9a4`, background, `claude-bridge/claude-sonnet-5-5:high`, completed)

Provider confirmed from the child transcript: every model turn in the session went through `claude-bridge` (54 entries across Waves 4 and 5).

Tasks 5.2 and 5.3. Files, all in `extensions/speak`, with line counts:

- **Source:** `input-settings.ts` (220), `realtime.ts` (368), `live.ts` (392), `speech-status.ts` (70), `help.ts` (71), `README.md` (317).
- **Tests:** `test/realtime.test.ts` (461), `test/config.test.ts` (504), `test/live.test.ts` (448), `test/talk-stream.test.ts` (611), `test/live-stop.test.ts` (144), `test/command.test.ts` (692).
- **`talk.ts`:** unchanged, confirmed with `git diff --quiet HEAD -- talk.ts`.

New export and signatures:

- `primarySubtags(tags): string[]` in `realtime.ts`: the distinct primary subtags, in order.
- `realtimeUrl(language, pauseSeconds = 1, languages = [])`: with no extra arguments the URL is unchanged.
- `openRealtime` options gain optional `pauseSeconds` and `languages`.
- `InputConfig` gains `livePauseSeconds` and `liveLanguages`.

Behavior:

- **Settings:** `parseLivePauseSeconds` accepts a number from 0.3 to 3 inclusive, default 2. `parseLiveLanguages` accepts 0–10 tags through `parseLocale`, default `[]`.
- **Connection:** `live.ts` passes both values at live start. The start message says "detected for each turn among any language", "fixed to X", or "limited to …".
- **`/speak status`:** shows `live pause: N seconds` and `live languages: … | none (not limited)`.
- **Help and README:** updated, including a new "Pause and languages" paragraph in the README.
- **Carried Wave 4 R1-F3:** the test is deleted from `test/live-stop.test.ts`.

Deviation, accepted by the caller: `/speak status` is built in `speech-status.ts`, not `config.ts` as task 5.2 said. The task named the wrong file; the behavior is what it asked for.

Worker's mutation checks, each detected:

- pause not sent (2 failures), or fixed at `"1"` (6);
- list joined with commas (4);
- duplicates not removed (4);
- live defaults leaking into push-to-talk (4);
- lower bound made exclusive (1), upper bound made exclusive (2), bounds widened to 0.2–3.5 (3).

Orchestrator re-verification, inside the 4 GB scope. A first attempt was interrupted before any test ran; no process was left behind, and it was rerun from scratch:

- changed files alone: `realtime` 84, `config` 132, `live` 53, `talk-stream` 43, `live-stop` 21, `command` 46, all passing;
- full suite: 894 pass, 0 fail (Wave 4: 859);
- `npx tsc --noEmit`: clean.

### W5-C (user) evidence: task 5.4

- **Result (2026-10-15):** the user explicitly reported the check as unverified ("mark unverified", answer Q4 = A) and asked to fold it into one combined live check after Wave 6.
- **Config:** with the user's approval, the orchestrator added `"liveLanguages": ["vi", "en"]` to `~/.config/pi-speak/config.json`. `parseConfig` from the Wave 5 code accepts the file (`livePauseSeconds` 2).
- **Covered by automated tests only:** the pause, the two languages, and the Vietnamese stop phrase.
- **Where it is recorded:** in task 5.4 itself.

BASELINE_TARGET=Wave 5 of add-speak-live-conversation: tasks 5.1–5.3 as implemented (live pause, live languages, the ADR wording carried from the Wave 4 gate, and the deleted test)
BASELINE_TARGET_REVISION=sha256:c6bdcc3197ec97ab (git -C extensions/speak diff HEAD, then git diff HEAD -- docs/adr/0004-voice-input-and-provider-choice.md docs/adr/0010-live-voice-conversation.md, in that order; pi-speak HEAD 2430a77, root HEAD c7de008; no untracked files)
BASELINE_SOURCE=openspec/changes/add-speak-live-conversation (proposal, design D13 and D14, tasks, specs/voice-conversation/spec.md "Live pause and languages" and the requirements that refer to it) as of the task 5.4 result; docs/adr/0004 and 0010; the API probe evidence in this log's Wave 5 section
BASELINE_INCLUSION_PREDICATE=files changed for tasks 5.1–5.3: extensions/speak/{input-settings,realtime,live,speech-status,help}.ts, extensions/speak/README.md, extensions/speak/test/{realtime,config,live,talk-stream,live-stop,command}.test.ts, docs/adr/0004-voice-input-and-provider-choice.md, docs/adr/0010-live-voice-conversation.md
BASELINE_EXCLUSIONS=Waves 1–4 code except as context; Wave 6 (live shortcut, streaming text, spoken replies), not yet specified; unrelated uncommitted add-pi-session-rename-tool files and the staged session-rename move; host/pi; ~/.config/pi-speak/config.json

DISPATCH_BUDGET wave 5: oracle=0/1 others=1/3 (before the gate)

## Round 1 - Oracle Review

*The caller transcribed this section from the Oracle's final output, because the Oracle run (`176075d3`, `claude-bridge/claude-opus-5-5:high`, background) had no file-writing tool. The content is the Oracle's; the caller condensed only the formatting.*

Gate task consumed (once): 5.5 [Oracle gate: `oracle`] Final review gate for Wave 5, run once after 5.1–5.3 are complete and 5.4 is complete or explicitly reported as unverified. Mode: FULL (first review of this wave), under `review-convergence`. Output is advisory.

Task and owner mapping reviewed:
- 5.1, orchestrator (W5-A): ADR-0004 Status line; ADR-0010 Supersedes line and "Ending by voice"; D12; Wave 4 R1-F1 and R1-F2.
- 5.2, worker (W5-B): `input-settings.ts`, `realtime.ts`, `live.ts`, `speech-status.ts`, `help.ts`, and their tests; D11, D13, D14; the spec; Wave 4 R1-F3.
- 5.3, worker (W5-B): the README against the spec.
- 5.4, user (W5-C): the recorded result.

Baseline: the Oracle recomputed `sha256:c6bdcc3197ec97ab` exactly as the log describes, and it is **confirmed**. pi-speak is at `2430a77` and the root at `c7de008`. Exactly the twelve included files are modified, there are no untracked files, and `talk.ts` is not in the diff.

Independent checks inside the 4 GB scope: `test/realtime.test.ts` alone gave 84 pass, and `test/live.test.ts` alone gave 53 pass. The recorded 894 pass and clean `tsc` stand.

### What holds

- **Pause:** `parseLivePauseSeconds` refuses strings, NaN, ±Infinity, and both out-of-range sides, and keeps 0.3 and 3 inclusive.
- **Languages:** `parseLiveLanguages` refuses a non-list and more than 10 entries; each entry goes through `parseLocale`.
- **Refusal at start:** `/talk live` refuses all four spec examples before opening anything.
- **URL:**
  - the pause becomes `vad_silence_threshold_secs`;
  - `language_code` is unchanged;
  - each distinct primary subtag of the list is a repeated `secondary_languages` value, in first-seen order;
  - the key is only in the header.
- **Push-to-talk unchanged:** the URL is byte-identical, guarded by `test/realtime.test.ts:57–66` and `test/talk-stream.test.ts:51–57`, and `talk.ts` is unchanged.
- **Live wiring:** both values are read once per start and passed through, and three tests through the real socket URL catch either one being dropped.
- **Start message:** it matches D14 in all four cases and reuses `primarySubtags`.
- **`/speak status`, help, and README:** all match the spec.
- **Carried items closed:** the Wave 4 R1-F3 test deletion, and the R1-F1 and R1-F2 ADR wording.
- **Test value:** the tests are memory-safe, and each of the worker's mutations maps to a test that actually fails.
- **Sizes:** within policy. `command.test.ts` is 692 lines and `talk-stream.test.ts` 611, both below the 800-line review threshold.
- **Gate condition for 5.4:** met.
- **Worker-declared deviation (`/speak status` in `speech-status.ts`):** accepted. `/speak status` has been built there since Wave 1, and task 5.2's text names no file.

### Findings

**R1-F1** — family `spec-consistency`, root `starting-live-mode-fixed-1s-pause`. P2, in scope.
- Evidence: `specs/voice-conversation/spec.md:30` ("Starting live mode") still requires "pause-based commits after 1 second of silence" and lists no `secondary_languages`. Meanwhile `:56` and "Live pause and languages" require `input.livePauseSeconds`, default 2. The code follows the newer requirements. There is no runtime defect, but the contradiction would reach the main spec on archive.
- SUGGESTED_CORRECTION: replace that phrase with "pause-based commits after `input.livePauseSeconds` of silence, the language list that "Live pause and languages" defines", then re-run strict validation.

**R1-F2** — family `live-language-wording`, root `empty-list-said-unlimited-despite-input-language`. P3, in scope.
- Evidence: with `input.language` set and an empty list, live mode is "fixed to X" (`live.ts:271`). Yet three places describe an empty list as unlimited:
  - help, `help.ts:59`: "An empty list leaves detection unlimited.";
  - the README settings row: "Empty means no limit.";
  - `/speak status`, `speech-status.ts:54`: `none (not limited)`.
- SUGGESTED_CORRECTION:
  - help: "With the list empty, live mode detects any language unless input.language fixes one.";
  - README row: "Empty adds no limit beyond `input.language`.";
  - status: `none`, with no parenthetical;
  - update the two exact strings in `test/command.test.ts`.

### Notes (not findings)

- **The stop phrase can be absorbed:** with the 2 s default, speech that ends less than 2 s before a stop phrase joins the same turn, which is then sent. The help and README wording ("with nothing else before the pause") is accurate. This belongs in the deferred live check.
- **"Dropped" rests on the probe:** it was one synthetic sample per language, so this too belongs in the deferred live check.
- **ADR-0010 and D13–D14:** no ADR edit is needed, because neither setting changes data egress or the provider.
- **Test name:** `test/live.test.ts:49` still says "the existing realtime parameters"; renaming it is optional.
- **Shared configuration:** an invalid live setting also blocks push-to-talk and `/speak`, because they share `loadConfig`. This is existing convention.
- **Bookkeeping:** tasks 5.2–5.4 are still unchecked. F11 commit order is still carried.

PROPOSED_REVIEW_ACTION=PASS

## Caller Assessment — Wave 5, Round 1

Mode: `FULL`. Gate: task 5.5. The Oracle's section above was transcribed by the caller, and its baseline confirmation matches the caller's own recomputation (`sha256:c6bdcc3197ec97ab`).

#### R1-F1 — "Starting live mode" still names a 1 s pause
- **Decision:** `ACCEPT_NONBLOCKING`. Family `spec-consistency`. The code follows the newer requirements, so this is stale wording in a source artifact, not a code defect. It is not raised to P1, because no SHALL is violated by behavior that the newer requirements do not themselves require.
- **CORRECTION:** applied now in `spec.md:30`, with the Oracle's wording. This is source text, not the reviewed revision. Strict validation is re-run below.

#### R1-F2 — an empty list is described as "unlimited" even when `input.language` fixes a language
- **Decision:** `ACCEPT_NONBLOCKING`. Family `live-language-wording`. The user's own setup does not hit it.
- **CORRECTION:** carried to Wave 6 task 6.2, which edits `help.ts`, `README.md`, and `speech-status.ts` anyway, so that this wave commits the reviewed revision. It uses the Oracle's suggested strings, with the exact test strings in `test/command.test.ts`, and includes the optional rename at `test/live.test.ts:49`.

#### Notes
- The stop phrase being absorbed by the 2 s pause, and the "dropped" behavior, join the combined live check (Wave 6 task 6.7).
- No ADR edit is needed for D13 and D14.

### Summary
- **Accepted blocking:** 0.
- **Accepted nonblocking:** 2 (R1-F1 applied now; R1-F2 carried to 6.2).
- **Deferred:** 0.
- **Rejected:** 0.

### Terminal baseline validation
- **Boundary:** the four boundary fields are unchanged.
- **Candidate:** recomputed `sha256:c6bdcc3197ec97ab`, equal to the recorded `BASELINE_TARGET_REVISION`.
- **Rounds:** 1 of 4 Oracle rounds used, and no rebuild.

DISPATCH_BUDGET wave 5: oracle=1/1 others=1/3

REVIEW_ACTION=PASS
CONSENSUS_STATUS=MOSTLY_GOOD
