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
