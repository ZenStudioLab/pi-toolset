# add-speak-live-conversation — Proposal Review

Review mode: `change_bundle`. Command: `/opsx-propose-loop --focus`, then `/omo-plan-review add-speak-live-conversation`.

Routing handoff:

- selected reviewer: `oracle`
- selected default implementation specialist: `worker`
- focus mode: focus
- orchestrator mode: normal

ADR assessment: a new ADR is required. Live mode reverses, for live mode only, ADR-0002's manual-only speech rule and ADR-0004's exclusion of automatic speech and an open microphone. Task 1.1 (Orchestrator) writes ADR-0010 before any implementation task.

Frozen baseline:

BASELINE_TARGET=openspec/changes/add-speak-live-conversation (apply-ready bundle)
BASELINE_TARGET_REVISION=sha256:9142dcc3e1da26b0 (proposal.md, design.md, tasks.md, specs/manual-speech/spec.md, specs/voice-conversation/spec.md, specs/voice-input/spec.md, concatenated in that order)
BASELINE_SOURCE=user decisions in session add-speak-live-conversation (live mode on/off; Pi speaks acknowledgement, progress, summary; microphone muted while Pi speaks by default, with voice barge-in as an option; spoken language follows the user's latest spoken message); openspec/specs/manual-speech/spec.md; openspec/changes/add-speak-voice-input/specs/voice-input/spec.md; docs/adr/0002, 0004, 0006; extensions/speak source
BASELINE_INCLUSION_PREDICATE=files listed in `openspec instructions apply --change add-speak-live-conversation --json` contextFiles
BASELINE_EXCLUSIONS=implementation code (not yet written); the unarchived add-speak-voice-input change except as a cited source

---

## Round 1 - Oracle Review

Mode: FULL. Skills loaded: `plan-review-expert`, then `review-convergence` (plus `testing-governance` with `test-value` and `test-decomposition`, because the bundle plans tests).

Baseline check: concatenated `proposal.md, design.md, tasks.md, specs/manual-speech/spec.md, specs/voice-conversation/spec.md, specs/voice-input/spec.md` hashes to `sha256:9142dcc3e1da26b006301b64…`. That matches the recorded `BASELINE_TARGET_REVISION`. The boundary fields are unchanged. No prior Oracle rounds exist in this log.

Scope and inventory: the bundle is bounded, so no repo-wide inventory was forced. I did enumerate one boundary: each spec requirement and modified requirement against the task that verifies it (see F12). `openspec validate add-speak-live-conversation --strict` passes. Its only info note is the expected one: the voice-input deltas cannot archive before `add-speak-voice-input`. The three copied voice-input requirements and the two manual-speech requirements match their source text except for the intended additions; I checked this with a diff.

Claims verified against source (accurate): the realtime.ts behavior (vad, 1 s pause, partials ignored, 1 MiB text cap, 64 KiB message cap); record.ts retaining chunks and stopping at maxSeconds; speech-job.ts at 659 lines with `speechBlock`, `stopOwnAudio`, and a per-job provider override; talk.ts at 468 lines; talk-delivery `steer`/`followUp` mapping and its `compacting` flag; host `defaultActive`, `setActiveTools`, and `promptGuidelines` semantics in `host/pi/.../types.ts`. ElevenLabs TTS sends no `language_code`, so language-following depends only on the model text and a multilingual ElevenLabs model.

### Findings (ordered by severity)

**F1. Tool activation lifecycle: `speak_aloud` is re-declared from the session transcript when live mode is off.** Severity: High. In scope.
- Evidence: the host restores the active tool set from the transcript. `host/pi/packages/coding-agent/src/core/agent-session.ts` `_restoreToolsFromTranscript()` (≈L1809) re-activates every name in the current system message's `toolsAdded`. It runs at session construction (≈L525, when no explicit tool list was given) and after `/tree` navigation (≈L4138), and every agent run records the loadout (≈L1830, "The run records the loadout in the transcript"). Restored names that are not yet registered are kept pending and activated when they register.
- Consequence: a run made while live mode was on records `speak_aloud`. After `/resume`, `pi --continue`, a session switch back, or `/tree` to such a point, the tool and its voice guidance are declared again while live mode is off. Removing it with `setActiveTools` when live mode ends does not rewrite the transcript's last recorded loadout.
- This violates voice-conversation "Spoken updates tool" (L83, "SHALL be declared to the model only while live mode is on"), scenario "Tool absent when live mode is off" (L87), and "Session switched while Pi speaks" (L188). Design D3 and task 3.1 rely only on `defaultActive: false` plus toggling, and no task tests restore.
- SUGGESTED_CORRECTION: add to D3 and task 3.1: "On `session_start` and `session_tree`, when live mode is off, remove `speak_aloud` from the active tools if present, leaving the others unchanged." Add one test in which the fake host starts with `speak_aloud` already active, a session_start or session_tree fires with live off, and the tool ends inactive. The tool's existing "live mode is off" result stays as the backstop.

**F2. Host and type dependency: `defaultActive` does not exist in the pinned host types or in the declared peer range.** Severity: High. In scope.
- Evidence (types): the installed `node_modules/@earendil-works/pi-coding-agent` is 0.87.1, which is also the `devDependencies` pin in `extensions/speak/package.json`. Its `ToolDefinition` has no `defaultActive`. A probe compiled against these types failed with `TS2353: Object literal may only specify known properties, and 'defaultActive' does not exist in type 'ToolDefinition<…>'`. Tasks 3.1 and 3.3 require `defaultActive: false` and a clean speak type check, which conflict.
- Evidence (runtime): in 0.87.1, `dist/core/agent-session.js` (≈L2554) activates every extension tool on registration. `extensions/speak` is now the standalone submodule `pi-speak`, with peer dependencies set to `"*"`. On such a host the tool and its guidance would be active from load.
- Design L12 cites only the local fork (`pi --version` 1.1.0).
- SUGGESTED_CORRECTION: make the host baseline an explicit decision in design D3 and the task 3.1 prerequisites. Either raise the type dev dependency and the declared minimum host version to one that has `defaultActive`, or drop the reliance on it. In both cases, F1's session_start deactivation also makes the behavior correct on older hosts. The task's type-check criterion must name which types it checks against.

**F3. Turn filter: the four-letters-or-digits rule silently drops the most common conversational replies.** Severity: High (Medium if the user explicitly chose this threshold). In scope.
- Evidence: spec "Live turn delivery" (L56) drops turns "with fewer than four letters or digits … without a message"; design D4 and proposal L9 say the same.
- The rule drops "yes", "no", "ok", "go", Vietnamese "có", "ừ", and "dạ". In a hands-free conversation, Pi's spoken updates and questions invite exactly these answers. The user hears nothing, nothing is shown, and the dropped reply also does not reset the idle clock.
- This threshold is not among the user decisions recorded in `BASELINE_SOURCE`. It conflicts with the proposal's stated goal ("talk with Pi back and forth hands-free").
- SUGGESTED_CORRECTION: drop only segments with no letter or digit left after removing bracketed or parenthesized audio-event tags, plus segments made only of a short filler list (for example uh, um, hmm, ờ, ừm). Change the "Short noise dropped" scenario to `uh.` and add a "Short answer sent" scenario (`yes.` is sent). If the user deliberately chose the threshold, record that in design D4 and downgrade this finding.

**F4. Mute correctness: Pi's voice can leak into the transcript after playback, because input latency is not covered.** Severity: Medium. In scope.
- Evidence: design D6 and spec "Microphone muted while Pi speaks" (L116) mute "from the moment this extension's player starts until it exits". Scenario L120 guarantees that no turn containing the update's words is committed.
- Recorder chunks reach `onChunk` through a pipe (`record.ts` L186), so chunks that arrive just after the player exits hold audio captured while it was still playing. Output buffers drain on top of that.
- A trailing word of five or more letters passes the filter and steers the running agent with Pi's own words.
- SUGGESTED_CORRECTION: keep sending silence for a short fixed tail after the player exits (a constant such as 300–500 ms, not a setting). State it in D6 and the spec, and add a fake-clock test for the tail. Keep the 3.4 live check as confirmation.

**F5. Start preconditions: live mode can start when no ElevenLabs voice or player is configured, so every update then fails.** Severity: Medium. In scope.
- Evidence: spec "Starting live mode" (L30) checks only that the config is valid, the key is set, and a recording tool exists.
- `speech-job.ts` preflight (≈L455–510) refuses ElevenLabs synthesis without `providers.elevenlabs.voiceId` and `modelId`, and refuses when the player is missing.
- A Deepgram-only user (spec scenario "Deepgram selected elsewhere") can therefore start live mode, and every `speak_aloud` call then fails with "ElevenLabs speech is not configured".
- SUGGESTED_CORRECTION: add the ElevenLabs voice and model and the player executable to the start checks, refusing with a named message. Add a scenario and a task 2.1 test.

**F6. Provider assumptions: long silences and session length are unverified, and two current code paths would end live mode.** Severity: Medium. In scope.
- Evidence: `realtime.ts` L90 and L226–229 treat `insufficient_audio_activity` and `commit_throttled` as harmless only while a final commit is pending. Outside a pending commit they are fatal failures. Live mode never has a pending commit.
- `realtime.ts` L86 maps `session_time_limit_exceeded`, whose duration is unknown. The `add-speak-voice-input` design L277 only records that a limit exists.
- Design D6 states the premise "never idle" as fact, and its risks list only the 1 MiB cap. Existing live checks covered recordings of at most 120–300 s, not minutes of silence or muted playback.
- SUGGESTED_CORRECTION: add both items to the design's Risks and Open Questions. Decide in D8 or task 1.4 whether live mode ignores `insufficient_audio_activity` when no commit is pending. Add to task 3.4: at least 3 minutes of silence with live on, and record whether and when the session time limit ends live mode.

**F7. Acceptance contradiction: the `speech-job.ts` split.** Severity: Medium. In scope.
- Evidence: design Goals L20 says "No source file goes over 500 lines because of this change", but the file is already 659 lines.
- D10 says the file is split only where the split is clean ("split only where no behavior changes"). Task 1.5 requires a split ("Every resulting file is under 500 lines") and also requires the existing tests to pass unchanged.
- If no clean split brings the file under 500 lines, task 1.5 cannot be completed.
- SUGGESTED_CORRECTION: pick one criterion. Either "speech-job.ts does not grow, and `speakLive` lives beside it", or "split to under 500 lines, with test imports allowed to change and behavior unchanged". State the same criterion in D10 and task 1.5.

**F8. Privacy wording contradicts other requirements in the same capability.** Severity: Medium. In scope.
- Evidence: "Live mode privacy" (L207) says the extension "SHALL NOT log or persist audio" and "SHALL NOT store transcripts anywhere other than the user messages it sends".
- "Speaking live updates" (L102) requires the `/speak text` cache rules, so synthesized audio is persisted for 7 days.
- "Live turn delivery" appends refused turns to the composer.
- SUGGESTED_CORRECTION: change the wording to "SHALL NOT log or persist microphone audio". Name the composer fallback as an allowed place for a transcript. Have the documentation statement mention that spoken updates are cached like `/speak` clips.

**F9. ADR task conflicts with the repository's ADR convention and leaves out the rejected alternative.** Severity: Low. In scope.
- Evidence: task 1.1 allows only a "Related" link in ADR-0002 and ADR-0004.
- The precedent is different: ADR-0004 L3 records its partial supersessions by ADR-0005 and ADR-0006 in its Status line.
- ADR-0002 L33 explicitly rejects "a model-callable speech tool", which ADR-0010 adopts for live mode. ADR-0005 (send and interrupt) and ADR-0008 (Space hold) are also affected.
- SUGGESTED_CORRECTION: allow a one-clause status note in ADR-0002 and ADR-0004 naming the live-mode-only supersession. Have ADR-0010 name the rejected model-callable tool alternative and link ADR-0005 and ADR-0008.

**F10. Spec wording is internally inconsistent.** Severity: Low. In scope.
- Evidence: modified manual-speech "Speech occurs only on explicit request" (L7) admits `speak_aloud` calls, then says in the next sentence that "tool execution … SHALL NOT initiate a provider request".
- The modified voice-input "Talk command contract" (L23) still states, without qualification, that each send shortcut is "equivalent to `/talk send`". In live mode they diverge: the shortcut cuts off speech and `/talk send` is refused.
- SUGGESTED_CORRECTION: change the first to "execution of other tools". Add "except while live mode is on, as `voice-conversation` defines" to the equivalence sentence.

**F11. Repository mechanics: the submodule commit flow is not stated.** Severity: Low. In scope.
- Evidence: `extensions/speak` is the git submodule `pi-speak` (`.gitmodules`; parent commit 74e8026). The ADR and OpenSpec files live in the parent repo.
- The tasks' "orchestrator owns … commits" does not say that code and README commits go to the submodule, followed by a gitlink bump in the parent.
- SUGGESTED_CORRECTION: add one line to the tasks preamble: commit in `extensions/speak` first, then bump the gitlink in pi-toolset, keeping ADR and OpenSpec edits in the parent.

**F12. Coverage gaps and test layout.** Severity: Low. In scope.
- Evidence (scenarios not assigned to any task's verification):
  - voice-conversation "Session switched while Pi speaks" (L188). Task 2.1 excludes spoken-update scenarios, and task 3.2 does not list this one.
  - "Live mode privacy" › "Error output redaction".
  - manual-speech "Speech without live mode".
- Evidence (test layout): tasks 2.1, 2.2, 3.1 and 3.2 put ten requirements' scenarios into one `test/live.test.ts`. Under `testing-governance` (test-decomposition), that file is likely to cross 800–1000 lines.
- Evidence (harness): the fake `pi` in `test/harness.ts` and `test/silence.test.ts` has no `registerTool`, `getActiveTools`, or `setActiveTools`, so loading will throw until they are added. No task mentions this.
- Evidence (lifecycle edges with no specified behavior):
  - `/talk live` while live mode is still starting.
  - `/talk live` while a push-to-talk attempt is still "starting".
  - `/speak replay` after live mode replaying the last live update (`lastClip` is set by the shared job path).
- SUGGESTED_CORRECTION:
  - Assign the three scenarios to tasks 3.2 and 2.1.
  - Plan two files from the start, split by behavior: `live-session.test.ts` and `live-speech.test.ts`.
  - Note the harness additions in task 2.1 or 3.1.
  - Add one clause each for the three edges (cancel the start; refuse while starting; exclude live clips from replay, or allow replaying them).

### Coverage and uncovered areas

- **Covered:** all six artifacts; the cited ADRs; the cited speak source files; the host tool-activation and transcript-restore path; the installed host type version; and the delta-versus-source requirement text.
- **Not verified:**
  - D1's claims about pi-realtime (no license, macOS-only).
  - Real ElevenLabs behavior (billing basis, session limit, silence handling). F6 routes this to live checks.
  - Whether the user's configured ElevenLabs model speaks Vietnamese. eleven_multilingual_v2 does not; the v2.5 and v3 models do. This should go in the README note.
- I did not run the existing test suite. A root `npx tsc --noEmit` reported no `extensions/speak` errors on the current tree.

### Residual risks

- Model compliance with the guidance (no fallback speech) and splitting a thought across a 1 s pause both remain live-check items, as the design accepts.
- The F3 severity depends on whether the user chose the four-character threshold.

PROPOSED_REVIEW_ACTION=PATCH

---

## Caller Assessment — Round 1

### Review Mode
- `change_bundle`

### Convergence Mode
- `FULL`

### Review Subject
- `add-speak-live-conversation`

### Per-Issue Evaluation

#### Issue F1 — `speak_aloud` restored from the transcript while live mode is off
- **Oracle Severity:** High
- **Caller Assessment:** Family `tool-activation-lifecycle`; In-scope YES. GOVERNING_SOURCE: voice-conversation "Spoken updates tool" ("declared to the model only while live mode is on"), plus a concrete correctness risk: voice guidance reaches non-voice sessions. Verified: `_restoreToolsFromTranscript` in `host/pi/packages/coding-agent/src/core/agent-session.ts`. **Decision:** `ACCEPT_BLOCKING`.
- **CORRECTION:** The spec requires removal on every session start and on tree navigation while live mode is off, with a "Resumed session does not bring the tool back" scenario. Design D3 adds the `session_start` and `session_tree` handlers. Task 3.1 adds them, the harness fakes, and the tests.

#### Issue F2 — `defaultActive` absent from the 0.87.1 types and peer range `*`
- **Oracle Severity:** High
- **Caller Assessment:** Family `host-version-dependency`; In-scope YES. GOVERNING_SOURCE: concrete correctness risk. On hosts without `defaultActive` the tool is active from load, and task 3.3's clean type check could not pass. Verified: no `defaultActive` in the `node_modules` 0.87.1 `types.d.ts`; present in installed releases 1.0.1, 1.0.4, and 1.1.0. **Decision:** `ACCEPT_BLOCKING`.
- **CORRECTION:** The bundle no longer relies on `defaultActive`. The tool registers normally and is deactivated by the F1 handlers on every session start, so the same code works on every host version. Context and D3 record both host facts.

#### Issue F3 — four-letters-or-digits filter drops short answers
- **Oracle Severity:** High
- **Caller Assessment:** Family `turn-filter`; In-scope YES. GOVERNING_SOURCE: explicit user requirement, a real back-and-forth voice conversation. The threshold was the caller's own suggestion, not a user decision. **Decision:** `ACCEPT_BLOCKING`.
- **CORRECTION:** Only text with no letter or digit is dropped. A "Short answer sent" scenario was added (`Ừ.`, `yes.`). The proposal, D4, and task 2.1 were updated. There is no filler list; the live check reveals whether fillers are noisy.

#### Issue F4 — Pi's voice leaking after the player exits
- **Oracle Severity:** Medium. **Caller severity:** High, because a trailing word of Pi's own speech would steer the agent on every update with speakers, defeating the user-chosen default (mute while Pi speaks).
- **Caller Assessment:** Family `mute-correctness`; In-scope YES. GOVERNING_SOURCE: user decision (microphone muted while Pi speaks), plus the spec scenario "Pi's voice is not transcribed". **Decision:** `ACCEPT_BLOCKING`.
- **CORRECTION:** A fixed 500 ms silence tail after the player exits, in the spec (with the new "Audio arriving just after playback is muted" scenario), D6, and task 3.2 (with a fake-clock check).

#### Issue F5 — start checks omit the ElevenLabs voice, model, and player
- **Oracle Severity:** Medium
- **Caller Assessment:** Family `start-preconditions`; In-scope YES. GOVERNING_SOURCE: none at blocking level. Each failed update shows a sanitized message, so the failure is visible, not silent. **Decision:** `ACCEPT_NONBLOCKING`.
- **CORRECTION:** Carried to apply: task 2.1 may add these checks if the implementer finds them cheap. There is no spec edit in this loop.

#### Issue F6 — provider silence and session-length assumptions
- **Oracle Severity:** Medium
- **Caller Assessment:** Family `provider-assumptions`; In-scope YES. GOVERNING_SOURCE: none at blocking level. `insufficient_audio_activity` and `commit_throttled` are, in the existing spec, answers to a manual final commit, and live mode never sends one under `commit_strategy: vad`. That they arrive unprompted is unevidenced. **Decision:** `ACCEPT_NONBLOCKING`.
- **CORRECTION:** Carried to apply: task 3.4's live check also runs 3+ minutes of silence and records any session time limit. If either message type ends live mode, task 2.1's owner treats it as non-fatal when no commit is pending.

#### Issue F7 — contradictory file-size acceptance for `speech-job.ts`
- **Oracle Severity:** Medium. **Caller severity:** High, because task 1.5 could be uncompletable as written and contradicted the large-files rule it cites.
- **Caller Assessment:** Family `acceptance-contradiction`; In-scope YES. GOVERNING_SOURCE: the existing policy `engineering-governance/references/large-files.md` (split along a clean boundary; keep intact when none exists). **Decision:** `ACCEPT_BLOCKING`.
- **CORRECTION:** Goals, D10, and task 1.5 now share one criterion. Split where a clean boundary exists (test imports may change, assertions may not). Otherwise add only `speakLive` and record why. Files created by the split stay under 500 lines.

#### Issue F8 — privacy wording contradicted the cache and composer fallback
- **Oracle Severity:** Medium. **Caller severity:** High, because two SHALL statements could not both hold and the required documentation would misstate what is stored.
- **Caller Assessment:** Family `spec-consistency`; In-scope YES. GOVERNING_SOURCE: concrete correctness risk (a user-facing privacy misstatement). **Decision:** `ACCEPT_BLOCKING`.
- **CORRECTION:** "Live mode privacy" now covers microphone audio only, names the composer fallback, and requires documenting that spoken updates are cached like `/speak` clips.

#### Issue F9 — ADR convention and rejected-alternative note
- **Oracle Severity:** Low
- **Caller Assessment:** Family `adr-convention`; In-scope YES. **Decision:** `ACCEPT_NONBLOCKING`.
- **CORRECTION:** Carried to task 1.1, which the orchestrator executes. Follow the ADR-0004 status-line precedent for partial supersession, have ADR-0010 name ADR-0002's rejected "model-callable speech tool", and link ADR-0005 and ADR-0008.

#### Issue F10 — two spec sentences contradicted live mode
- **Oracle Severity:** Low. **Caller severity:** High, because these are contradictory normative statements across modified requirements.
- **Caller Assessment:** Family `spec-consistency` (same family as F8); In-scope YES. GOVERNING_SOURCE: concrete correctness risk (the requirements cannot both hold). **Decision:** `ACCEPT_BLOCKING`.
- **CORRECTION:** manual-speech now excludes `speak_aloud` in live mode from "tool execution". The voice-input send-shortcut equivalence now carries a live-mode exception.

#### Issue F11 — submodule commit flow
- **Oracle Severity:** Low
- **Caller Assessment:** Family `repo-mechanics`; In-scope YES. **Decision:** `ACCEPT_NONBLOCKING`.
- **CORRECTION:** Carried to apply. Commit code and README in `extensions/speak` (`pi-speak`) first, then bump the gitlink in pi-toolset; ADR and OpenSpec edits stay in the parent.

#### Issue F12 — scenario coverage, test layout, harness, lifecycle edges
- **Oracle Severity:** Low
- **Caller Assessment:** Family `coverage`; In-scope YES. **Decision:** `ACCEPT_NONBLOCKING`. The harness fakes were folded into task 3.1 as part of the F1/F2 correction.
- **CORRECTION:** Carried to apply:
  - Verify the "Session switched while Pi speaks" scenario in 3.2, the redaction scenario in 2.1, and the manual-speech "Speech without live mode" scenario in 2.1.
  - Split tests by behavior (`live-session.test.ts`, `live-speech.test.ts`) when they grow.
  - For the edges: `/talk live` while starting cancels the start, and is refused while a push-to-talk attempt is starting. Whether `/speak replay` covers a live clip is decided at implementation.

### Summary
- **Issues accepted blocking:** 7 (F1, F2, F3, F4, F7, F8, F10)
- **Issues accepted nonblocking:** 5 (F5, F6, F9, F11, F12)
- **Issues deferred out of scope:** 0
- **Issues rejected:** 0

### Caller Result
- REVIEW_ACTION=PATCH
- CONSENSUS_STATUS=NEEDS_REVISION
- PATCH_BASELINE_REVISION=sha256:11ff29397afef914

### Notes for Oracle (next round)
- Fixed: F1/F2 (no `defaultActive`; deactivation on session start and tree; harness fakes), F3 (no-letter-or-digit filter only), F4 (500 ms tail), F7 (one file-size criterion), F8 and F10 (spec consistency).
- Nonblocking items F5, F6, F9, F11, and F12 are intentionally not edited in this loop. Do not re-raise them unless a patch made them worse.
- Focus: verify the accepted fixes and run a bounded whole-bundle regression sweep. Check especially that the new session_start/session_tree deactivation does not conflict with any other requirement, and that D3, the spec, and task 3.1 agree.

---

## Round 2 - Oracle Review

Mode: PATCH. Skills loaded: `plan-review-expert`, then `review-convergence`.

Baseline check: the six artifacts, concatenated in the recorded order, hash to `sha256:11ff29397afef914950aa0be…`. This matches the caller-recorded PATCH_BASELINE_REVISION (`sha256:11ff29397afef914`). The four boundary fields are unchanged from Round 1. `openspec validate add-speak-live-conversation --strict` still passes. Its only info note is the same expected one: the voice-input delta cannot archive before `add-speak-voice-input`.

This is Oracle round 2 of at most 4.

### Verification of accepted Round 1 blockers

| ID | Status | Evidence |
|---|---|---|
| F1 | Fixed in text; see R2-F1 for the mechanism | voice-conversation "Spoken updates tool" (L90) now requires removal on session start (including resume, switch, fork, and reload) and on tree navigation, adding scenario "Resumed session does not bring the tool back" (L97). Design D3 (L39) and task 3.1 agree with each other and with the spec. |
| F2 | Type conflict fixed; regression introduced (R2-F1) | Design D3 registers the tool without `defaultActive`, so the 0.87.1 type check can pass. Context L12 records both host facts. |
| F3 | Fixed | Spec L56 drops only text with no letter or digit, and adds scenario "Short answer sent" (L73). Proposal L9, D4 (L43), and task 2.1 match. There is one wording residue (R2-F2). |
| F4 | Fixed | Spec L128 adds the 500 ms tail, with scenario L135. D6 (L51) and task 3.2 (fake-clock check) match. There is one side effect (R2-F4). |
| F7 | Fixed | Goals L20, D10 (L67), and task 1.5 now share a single criterion: split where a clean boundary exists, otherwise add only `speakLive` and record why. Files created by the split must stay under 500 lines. |
| F8 | Fixed | "Live mode privacy" (L224) now covers microphone audio only, names the composer fallback, and requires the cache statement. |
| F10 | Fixed; one residue (R2-F3) | manual-speech L7 now says "any tool other than `speak_aloud` in live mode". voice-input L23 adds the live-mode exception to the send-shortcut equivalence. |

The accepted-nonblocking items F5, F6, F9, F11, and F12 are not edited, and no patch made any of them worse. They are not re-raised.

### Findings (ordered by severity)

**R2-F1. Removing `speak_aloud` at session start drops tools the host is still restoring, on every resume and reload.** Severity: High. In scope.
- Family: `tool-activation-lifecycle`. This is the root issue of F1/F2 recurring once, through the F2 correction.
- Evidence, from the local 1.x host (`host/pi/packages/coding-agent/src/core/agent-session.ts`):
  - `setActiveToolsByName()` (L1518–1525) is what `pi.setActiveTools` calls (L3425). It ends with:

        if (previous.some((name) => !active.has(name))) this._pendingToolNames.clear();

    Its comment says that "a loadout that deactivates a tool replaces the restored one, whose pending tools are dropped".
  - `_pendingToolNames` (doc comment L442–446) holds tools of the restored or reloaded loadout that have not registered yet, "such as tools of MCP servers that are still connecting".
  - `reload()` (L3681) puts every active tool into the pending set before the new extensions register.
  - `bindExtensions()` (L3279) emits `session_start` before `reportUnhandledMcpServers()` and `extendResourcesFromExtensions()`.
  - `_isActivatedOnRegistration()` (L3602–3603) activates every declarable extension tool unless it sets `defaultActive: false`.
- Consequence: design D3 drops `defaultActive`, so `speak_aloud` is active after every load. The `session_start` handler from D3 and task 3.1 therefore always finds the tool active and always calls `setActiveTools` to remove it.
  - On every `/resume`, `pi --continue`, and `/reload`, that removal clears the pending set. Restored MCP tools that register after `session_start` then stay inactive.
  - This happens to every user who loads `pi-speak`, including users who never turn on live mode.
  - It breaks the spec's own promise of "leaving the other active tools unchanged" (L90), and it is a regression outside the feature itself.
  - The 0.87.1 host has `_restoreToolsFromTranscript` but no pending set, so it is unaffected. The local 1.1.0 host the user runs is affected.
- Note: my Round 1 F2 text said the `session_start` removal "also makes the behavior correct on older hosts". That was incomplete, because it missed the pending-set semantics.
- Why PATCH, not REBUILD: the bundle's structure holds (one tool, explicit activation, cleanup on session events). Only one host-semantics detail in D3 and task 3.1 is wrong. Rebuilding the whole bundle would be machinery out of proportion to a one-paragraph fix. The caller owns whether the recurrence rule applies.
- SUGGESTED_CORRECTION (D3, task 3.1, and one spec clause):
  1. Restore `defaultActive: false`, so that 1.x hosts never activate the tool at load. The 0.87.1 type check then needs one explicit choice. Either raise the type dev dependency to a 1.x release that declares `defaultActive` (Round 1's option), or add the property through an object typed outside `ToolDefinition`. Name the choice in task 3.1/3.3.
  2. Have the `session_start` and `session_tree` handlers call `setActiveTools` only when `speak_aloud` is actually in `getActiveTools()`. With step 1, that happens only when a live-mode loadout was restored.
  3. Add a test in task 3.1: a session start where `speak_aloud` is not active makes no `setActiveTools` call.
  4. Record the remaining narrow case in D3's risks: resuming a session whose last run was in live mode, while MCP servers are still connecting, can still drop those pending tools. Either accept it explicitly or defer that removal to the next run start, where the host drops pending tools anyway (L1827–1829).

**R2-F2. Wording left over from the F3 change contradicts the new filter rule.** Severity: Low. In scope.
- Family: `spec-consistency`.
- Evidence:
  - voice-conversation L56, after the new sentence "every turn with at least one letter or digit, however short, SHALL be sent", still continues "Every other turn SHALL be sent to Pi as one plain user message". "Every other" now reads as if it meant the dropped turns.
  - Design Risks L78 still says "fragments are filtered". Since F3, short fragments such as "yes" are deliberately sent.
- SUGGESTED_CORRECTION: change the spec to "Each sent turn SHALL be one plain user message, with no expansion: …". Change the design to "segments with no letter or digit are dropped".

**R2-F3. "On" and "on or starting" disagree for the send shortcut during live mode.** Severity: Low. In scope.
- Family: `spec-consistency` (a residue of F10).
- Evidence:
  - voice-input L23 makes the send shortcuts equivalent to `/talk send` "except while live mode is on".
  - voice-input L52 says that "while live mode is on or starting" no control starts a recording, and that controls behave as "Cutting Pi off" and "Other voice controls" state.
  - "Cutting Pi off" (L142) covers only "while live mode is on".
  - "Other voice controls" (L163) covers "on or starting" but leaves out the send shortcut.
  - Result: the send shortcut's behavior while live mode is starting is unspecified, and L23 read literally makes it start a recording.
- SUGGESTED_CORRECTION: in voice-input L23, say "except while live mode is on or starting". Add one clause to "Cutting Pi off": while live mode is starting, the send shortcut changes nothing and shows that live mode is starting. Alternatively, have it cancel the start, matching the F12 edge decision carried to apply.

**R2-F4. The 500 ms tail also clips the start of the user's speech right after Pi stops.** Severity: Low. In scope. Nonblocking.
- Family: `mute-correctness`.
- Evidence:
  - Spec L128 and D6 send silence until 500 ms after the player exits.
  - "Cutting Pi off" (L142) resumes listening after a send-key cut-off, and that cut-off also exits the player. A user who presses the key and starts talking at once, or who answers the instant a summary ends, loses roughly the first half second.
  - In the "Short answer sent" case (L73), a one-syllable `Ừ` could be lost entirely.
- SUGGESTED_CORRECTION: no spec change is needed. Add one item to the task 3.4 live check: "an answer started immediately after playback ends or after a key cut-off is transcribed in full (record whether the first word is lost)". The tail stays a constant, as D6 decides.

### Regression sweep coverage

- **Re-read in full:** all six artifacts.
- **Cross-checked:**
  - The new session-event removal against "Live mode ends cleanly" (L196), which ends live mode on tree navigation and session changes. There is no conflict, and the removal is idempotent with ending.
  - The removal against "Session switched while Pi speaks" (L203) and against proposal L39 (prompt changes only on toggle).
  - The tail against the idle limit and the status line.
  - The F7 criterion against tasks 2.1 and 3.2 (each says "under 500 lines").
  - The F8 privacy text against tasks 2.3 and 3.3.
- **Host verification:** `pi.setActiveTools`, pending-tool, reload, and `bindExtensions` ordering in the local host source. For 0.87.1, I confirmed that `dist/core/agent-session.js` has the restore path but no pending set, and that its types declare `session_start` and `session_tree`.
- **Not verified:** whether `before_agent_start` precedes every run path (the custom-message path at L2316–2319 calls `_runAgentPrompt` directly). That matters only if the caller picks the "defer to run start" variant of R2-F1. I also did not verify whether ElevenLabs realtime emits audio-event tags such as `(laughs)`. If it does, they now pass the filter, but they would also have passed the old four-character rule, so this is not a regression.

### Residual risks and notes

- Carried nonblocking items (F5, F6, F9, F11, F12) exist only in the Caller Assessment, not in `tasks.md`. Task 1.1's literal check ("edited only to add a 'Related' link") still contradicts the carried F9 note, which follows the ADR-0004 status-line precedent. Task 3.2 still does not list "Session switched while Pi speaks". An executor reading only `tasks.md` will miss these items. Copying one line per item into the tasks would be cheap; this is optional.
- R2-F1's narrow residual case (a resumed live-mode loadout with MCP servers still connecting) stays unless the removal is deferred to run start.

PROPOSED_REVIEW_ACTION=PATCH

---

## Caller Assessment — Round 2

### Review Mode
- `change_bundle`

### Convergence Mode
- `PATCH`

### Review Subject
- `add-speak-live-conversation`

Round 1 blockers: F3, F4, F7, F8, and F10 are confirmed fixed. F1 and F2 are fixed for the type check, but their correction caused R2-F1.

### Per-Issue Evaluation

#### Issue R2-F1 — session-start deactivation clears MCP tools still being restored
- **Oracle Severity:** High
- **Caller Assessment:** Family `tool-activation-lifecycle` (the same family as F1 and F2); In-scope YES. GOVERNING_SOURCE: voice-conversation "Spoken updates tool" ("leaving the other active tools unchanged"), plus a concrete correctness risk: users lose MCP tools on every resume or reload without ever using live mode. Verified in `host/pi/packages/coding-agent/src/core/agent-session.ts`:
  - `setActiveToolsByName` clears `_pendingToolNames` whenever a call deactivates any tool (L1518–1525).
  - `_restoreToolsFromTranscript` fills that set (L1809–1816).
  - `_runAgentPrompt` clears it at the start of every run (L1822–1829).
  - `setActiveTools()` inside `before_agent_start` updates the loadout of the run that is starting (L2061–2073).
  **Decision:** `ACCEPT_BLOCKING`.
- **Structural recurrence:** this family repeated after one accepted revision. The caller takes `REBUILD` under `review-convergence`, not Oracle's proposed `PATCH`, and re-derives the activation lifecycle from the host source instead of patching one more trigger.

#### Issue R2-F2 — leftover wording from the F3 correction
- **Oracle Severity:** Low
- **Caller Assessment:** Family `turn-filter`, the same root issue as F3: an incomplete application of an accepted blocking correction. GOVERNING_SOURCE: as for F3. **Decision:** `ACCEPT_BLOCKING`, completing F3.
- **CORRECTION:** Remove the redundant "Every other turn" wording from the spec and the "fragments are filtered" wording from the design.

#### Issue R2-F3 — the send shortcut while live mode is starting is unspecified
- **Oracle Severity:** Low
- **Caller Assessment:** Family `spec-consistency`, the same root issue as F10: an incomplete application of an accepted blocking correction. GOVERNING_SOURCE: as for F10. **Decision:** `ACCEPT_BLOCKING`, completing F10.
- **CORRECTION:** While live mode is starting, the send shortcuts are refused like the other controls. The voice-input exception covers "on or starting".

#### Issue R2-F4 — the 500 ms tail may clip a reply given right after Pi stops
- **Oracle Severity:** Low
- **Caller Assessment:** Family `mute-correctness`; In-scope YES. GOVERNING_SOURCE: none at blocking level, because the tail length can only be learned by a live check. **Decision:** `ACCEPT_NONBLOCKING`.
- **CORRECTION:** Carried to task 3.4. Record whether a one-syllable answer given at once after Pi stops is kept. If it is not, shorten the constant during apply.

### Summary
- **Issues accepted blocking:** 3 (R2-F1, R2-F2, R2-F3)
- **Issues accepted nonblocking:** 1 (R2-F4)
- **Issues deferred out of scope:** 0
- **Issues rejected:** 0

### Caller Result
- REVIEW_ACTION=REBUILD
- CONSENSUS_STATUS=NEEDS_REVISION

---

## Caller Rebuild — after Round 2

Prior incremental worklist invalidated. The Round 1 baseline did not name the host's tool-activation lifecycle as a source, and that omission produced two successive defects in one family.

Rebuilt baseline:

BASELINE_TARGET=openspec/changes/add-speak-live-conversation (apply-ready bundle)
BASELINE_TARGET_REVISION=recorded below after the correction batch is applied
BASELINE_SOURCE=as before, plus the host tool-activation lifecycle in host/pi/packages/coding-agent/src/core/agent-session.ts (registration activation and `defaultActive`; `_restoreToolsFromTranscript` with `_pendingToolNames`; `setActiveToolsByName` clearing pending on any deactivation; `_runAgentPrompt` clearing pending at each run start; `before_agent_start` `setActiveTools()` applying to the starting run) and the 0.87.1 type pin in extensions/speak/package.json
BASELINE_INCLUSION_PREDICATE=files listed in `openspec instructions apply --change add-speak-live-conversation --json` contextFiles
BASELINE_EXCLUSIONS=implementation code (not yet written); the unarchived add-speak-voice-input change except as a cited source

Host facts the lifecycle is rebuilt on:

- **H1:** Tools register active unless `defaultActive: false`. 1.x hosts honor it. The 0.87.1 types lack it, and those hosts activate every tool on registration.
- **H2:** On session construction and after tree navigation, the host restores the recorded loadout. Names not yet registered stay pending and activate when they register.
- **H3:** A `setActiveTools` call that deactivates any tool clears the pending set. A call that only adds keeps it.
- **H4:** Each agent run clears the pending set at its start. A `setActiveTools` call in `before_agent_start` applies to that run.

Complete correction batch:

- **C1 (R2-F1, F1, F2):** Register `speak_aloud` with `defaultActive: false`, passed through an object typed `ToolDefinition & { defaultActive?: boolean }` so the 0.87.1 types accept it and older hosts ignore it.
  - Starting live mode only adds the tool, which keeps pending tools.
  - Ending live mode removes it only when it is active.
  - Remove the `session_start` and `session_tree` handlers. Instead, a `before_agent_start` handler removes the tool when live mode is off and the tool is active. By H4 the host drops unregistered pending tools at that run's start anyway, so the removal costs nothing.
  - The extension never calls `setActiveTools` when nothing would change.
  - Spec "Spoken updates tool" and its scenarios, design Context and D3, Risks, and task 3.1 change accordingly.
- **C2 (R2-F2, F3):** Remove the redundant "Every other turn" sentence from "Live turn delivery". Replace "fragments are filtered" in the design's Risks.
- **C3 (R2-F3, F10):** Refuse the send shortcuts while live mode is starting ("Other voice controls during live mode"). Extend the voice-input send-shortcut exception to "on or starting".

BASELINE_REBUILD_COMPLETE=YES

BASELINE_TARGET_REVISION=sha256:046c8d9de8767684 (rebuilt candidate after correction batch C1–C3; same six files and order)

---

## Round 3 - Oracle Review

Mode: FULL, against the rebuilt baseline. Skills loaded: `plan-review-expert`, then `review-convergence`. This is Oracle round 3 of at most 4.

Baseline check: the six artifacts, concatenated in the recorded order, hash to `sha256:046c8d9de87676842f2a5627…`. That matches the rebuilt `BASELINE_TARGET_REVISION` (`sha256:046c8d9de8767684`). The target, inclusion predicate, and exclusions are unchanged. The source field adds the host tool-activation lifecycle, as the rebuild records. The rebuild record is complete: a new baseline, the reason the prior baseline was invalid, the full C1–C3 batch, and the rebuild-complete marker, all before remediation. `openspec validate add-speak-live-conversation --strict` passes. Its only info note is the expected voice-input archive-order note.

### Host facts H1–H4, verified independently

Sources: `host/pi/packages/coding-agent/src/core/agent-session.ts` and `extensions/types.ts`, plus the 0.87.1 `dist/core/agent-session.js`.

| Fact | Verdict | Evidence |
|---|---|---|
| H1 | Accurate, with one wording slip | `_isActivatedOnRegistration` (L3602–3603) checks `defaultActive !== false`. `types.ts` L634–639 says the property is honored and that `--tools` or the `defaultTools` setting can still activate the tool. The 0.87.1 types lack it, and `extensions/speak/package.json` has peer `*` and dev pin `0.87.1`. The slip: D3 says "pre-1.0 hosts ignore the property", but `host/pi-v0.99.2-backup/.../types.ts` L630 declares and honors it. Only older hosts such as 0.87.1 ignore it. |
| H2 | Accurate | Restore runs at construction (L525) and after tree navigation (L4138). `_restoreToolsFromTranscript` (L1809–1816) puts unregistered names in the pending set, and `_refreshToolRegistry` (L3590) activates them when they register. |
| H3 | Accurate | `setActiveToolsByName` (L1518–1525) clears the pending set only when some previously active name is no longer active. An add-only call keeps it. |
| H4 | Accurate for the `prompt()` path only | `_runAgentPrompt` clears the pending set at L1829. In `prompt()`, `emitBeforeAgentStart` (L2062) runs before `_preparePromptAndToolLoadout` (L2105). The comment at L2067–2072 and the `handlerEditedTools` logic make a `setActiveTools()` call in the handler authoritative for that run. The 0.87.1 dist has the same logic (L1283–1300), so the removal also works there. See R3-F1 for paths that skip `before_agent_start`. |

Type feasibility of C1, probed against the 0.87.1 types with a throwaway file under `/tmp` (strict; nothing in the repo was touched):

- A `ToolDefinition<typeof Params> & { defaultActive?: boolean }` object with `defaultActive: false`, passed to `pi.registerTool` and used with a `before_agent_start` `setActiveTools` filter, compiles cleanly (exit 0).
- The same literal typed as plain `ToolDefinition` fails with TS2353. This confirms that the probe resolved the 0.87.1 types.
- Implementation note: task 3.1 should use the generic form, `ToolDefinition<typeof Params>`, so that `params.text` stays typed.

Are D3, the spec "Spoken updates tool", and task 3.1 correct and consistent?

- **Main path: yes.** Live start adds only the tool (H3 keeps the pending set). Live end removes it only when it is active. A run started by `prompt()` with live mode off removes it in `before_agent_start` (H4), and the extension never makes a no-op call.
- The spec's "Loading leaves the tool set alone" is satisfied, because nothing calls `setActiveTools` at load.
- The task 3.1 test list matches the spec scenarios. It also asks for a real-host confirmation of the `before_agent_start` removal, which is proportionate.

### Verification of C2, C3, and earlier accepted fixes

| ID | Status | Evidence |
|---|---|---|
| C2 (R2-F2/F3) | Applied | Spec L56 reads "Every turn with at least one letter or digit, however short, SHALL be sent … with no expansion". The "Every other turn" wording is gone. Design Risks L99 reads "text with no letter or digit is dropped". `grep` finds no "fragment" anywhere in the bundle. |
| C3 (R2-F3/F10) | Applied | voice-conversation L168 refuses the send shortcuts "while live mode is starting". voice-input L23 says "except while live mode is on or starting". voice-input L52 ("on or starting") and "Cutting Pi off" (L147, "on") now agree. |
| F3 | No regression | Proposal L9, D4 L64, spec L56 and L68–76, and task 2.1 all use the no-letter-or-digit rule. |
| F4 | No regression | Spec L133 and L140–143, D6 L72, and task 3.2 all describe the 500 ms tail checked with the fake clock. |
| F7 | No regression | Goals L25, D10 L88, and task 1.5 share one criterion. |
| F8 | No regression | Spec L229 covers microphone audio only, names the composer fallback, and keeps the cache statement. |
| F10 | No regression | manual-speech L7 says "any tool other than `speak_aloud` in live mode". The voice-input L23 exception now covers "on or starting". |

The accepted-nonblocking items F5, F6, F9, F11, F12, and R2-F4 are unchanged, and no rebuild edit made any of them worse. They are not re-raised.

### Findings

**R3-F1. The run-start removal assumes every agent run emits `before_agent_start`, and three statements about the activation lifecycle claim more than the host provides.** Severity: Low. In scope. Nonblocking in my assessment.
- Family: `tool-activation-lifecycle`.
- **Recurrence statement, stated explicitly as requested:** this finding is in the same family as F1, F2, and R2-F1, after the single rebuild. It is the residual edge that Round 2 listed under "Not verified". I do not assess it as a blocking recurrence:
  - the main paths are correct;
  - the gap has no audio, privacy, or other-tool effect;
  - the fix is wording.
  If the caller instead accepts it as blocking, the contract requires `HUMAN_DECISION` for this family, not another PATCH.
- Evidence:
  1. `sendCustomMessage(..., { triggerTurn: true })` while idle calls `_runAgentPrompt` directly (L2312–2319, including the deferred `_deferredSettledActions` path). It never emits `before_agent_start`. Later turns re-read `getActiveToolNames()` (L909), which still includes the tool.
     - So after a resume, a tree navigation, or (on old hosts) a load, a first run started by another extension's custom message with live mode off declares `speak_aloud` and its voice guidance for that whole run. The run records it in the loadout again.
     - The next user prompt removes it, and the tool's "live mode is off" result prevents any speech.
     - The normative text (spec L90, "SHALL be declared to the model in an agent run only while live mode is on") is therefore not fully met. The "Resumed session" scenario (L99, "the user then submits a prompt") is met.
     - No extension in this repository uses `triggerTurn: true`, so in practice this needs a third-party extension.
  2. Reload carry-over is a third way the tool can be active while live mode is off, and D3 does not list it. `reload()` puts every active tool in the pending set (L3681) after emitting `session_shutdown` (L3663). If live mode is on at `/reload` and the end path has not removed the tool synchronously in that handler, the tool comes back active on re-registration despite `defaultActive: false`.
     - The run-start removal still covers this, so behavior stays correct.
     - However, D3 says "That happens only after the host restored a recorded tool set (H2), or on a pre-1.0 host", and that claim is incomplete.
  3. Spec L90 says "SHALL be registered inactive", but D3 itself says older hosts ignore the property, so on 0.87.1 the tool registers active. D3's "pre-1.0 hosts ignore the property" is also inaccurate, because 0.99.2 honors it (see H1).
- SUGGESTED_CORRECTION (wording only; no new mechanism):
  - Spec L90: change "registered inactive" to "registered with `defaultActive: false`". Scope the run-start removal to runs started by a prompt, including turns that `sendUserMessage` sends.
  - D3 Risks: add one line. A run that another extension starts with a custom message while live mode is off, before any prompt since a resume, tree navigation, or reload, can still declare the tool; its result says live mode is off, and the next prompt removes it.
  - D3: replace "pre-1.0 hosts" with "hosts whose types lack it, such as 0.87.1". Add reload carry-over to the cases the run-start removal covers.
  - Optional, not required: in task 2.1, have the end path call `setActiveTools` synchronously in `session_shutdown` before awaiting any teardown. On `/reload` the tool then never re-enters the pending set.
  - Do not add `agent_start` or `turn_start` removal. I did not verify that either one applies to a run's first request, and the edge does not justify the extra machinery.

### Coverage and uncovered areas

- **Re-read in full:** all six artifacts.
- **Cross-checked:**
  - D3 against spec "Spoken updates tool" and "Live mode ends cleanly", proposal L10 and L39, task 3.1, and the existing `index.ts` session handlers (L177–189: `reset` on `session_before_switch`, `session_before_fork`, `session_tree`, and `session_shutdown`).
  - The mute, cut-off, and barge-in rules against the "starting" state and the queue. Synthesis before playback is not muted, as specified.
  - The idle limit against dropped turns.
  - The tasks' verification lists against the spec scenarios.
- **Host paths checked:**
  - construction restore;
  - tree-navigation restore, followed by the `session_tree` emit;
  - reload ordering (shutdown emit, then pending carry-over, then the `session_start` emit);
  - the `prompt()` path through `before_agent_start`;
  - the custom-message trigger path;
  - the per-turn loadout refresh;
  - the 0.87.1 `before_agent_start` handling.
- **Accepted category, not raised:**
  - Ending live mode on tree navigation runs after `_restoreToolsFromTranscript` (L4138 comes before the `session_tree` emit). If the restored point recorded `speak_aloud`, the removal clears that restore's pending names.
  - Mid-session, those names are only tools that are not registered at all. This belongs to the same category as the accepted D3 risk "Ending live mode in a resumed session before its first agent run" (L103), and it could be noted there.
- **Not verified:**
  - Interaction with a third-party `before_agent_start` handler that explicitly edits `systemPromptOptions.selectedTools`. By L2067–2072 an explicit edit wins and could re-include the tool for that run. No extension in this repository edits it.
  - Real ElevenLabs behavior and model compliance. These remain task 3.4 live checks.
  - I did not run the speak test suite.
- **Carried items:** the carried nonblocking items (F5, F6, F9, F11, F12, R2-F4) still exist only in the Caller Assessments, not in `tasks.md`. Task 1.1's "Related link only" check still contradicts the F9 carry note. This is unchanged since Round 2 and not worse. Copying one line per item into the tasks during apply remains a cheap option.

### Residual risks

- The narrow window in which a pending MCP tool registers between `before_agent_start` (L2062) and the pending clear at run start (L1829) gets lost by the removal. It is negligible.
- If the caller rejects the R3-F1 wording change, the spec keeps one normative sentence that a custom-message-triggered run does not meet.

PROPOSED_REVIEW_ACTION=PASS

---

## Caller Assessment — Round 3

### Review Mode
- `change_bundle`

### Convergence Mode
- `FULL` (rebuild resume)

### Review Subject
- `add-speak-live-conversation`

Rebuild check: host facts H1–H4 were independently confirmed. C1–C3 are applied, and F3, F4, F7, F8, and F10 have not regressed.

### Per-Issue Evaluation

#### Issue R3-F1 — runs that skip `before_agent_start`, reload while live, and wording accuracy
- **Oracle Severity:** Low
- **Caller Assessment:** Family `tool-activation-lifecycle` (recurrence after the rebuild, at Low severity, wording only); In-scope YES. GOVERNING_SOURCE: none at blocking level. In the affected path, a third-party `sendCustomMessage(..., { triggerTurn: true })` run after a resume, the tool's own "live mode is off" result keeps behavior safe (nothing is spoken), and the next prompt removes the tool. No extension in this repository triggers turns that way. Reload while live mode is on is covered by the run-start removal. **Decision:** `ACCEPT_NONBLOCKING`. Because it is not blocking, the same-family recurrence rule does not force `HUMAN_DECISION`.
- **CORRECTION:** Carried to apply. When task 3.1 is done, the orchestrator amends the wording:
  - spec "Spoken updates tool": "registered with `defaultActive: false`" instead of "registered inactive", and the run-start removal scoped to prompt-started runs;
  - D3: "hosts whose types lack it, such as 0.87.1" instead of "pre-1.0 hosts" (0.99.2 honors `defaultActive`), reload while live listed as a covered case, and one risk line for runs started by other extensions' messages.

  Do not add `agent_start` or `turn_start` removal.

### Summary
- **Issues accepted blocking:** 0
- **Issues accepted nonblocking:** 1 (R3-F1)
- **Issues deferred out of scope:** 0
- **Issues rejected:** 0

### Terminal baseline validation
- **Boundary fields:** `BASELINE_TARGET`, `BASELINE_SOURCE`, `BASELINE_INCLUSION_PREDICATE`, and `BASELINE_EXCLUSIONS` match the rebuilt baseline literally.
- **Candidate revision:** the current candidate `sha256:046c8d9de8767684` equals the latest recorded `BASELINE_TARGET_REVISION`.
- **Round count:** three Oracle review rounds are used, within the cap of four.

### Caller Result
- REVIEW_ACTION=PASS
- CONSENSUS_STATUS=MOSTLY_GOOD

### Carried to apply (accepted nonblocking, for `/opsx-apply-loop`)
- **F5:** task 2.1 may add the ElevenLabs voice, model, and player to the live start checks.
- **F6:** task 3.4 adds a 3+ minute silence run and records any session time limit. If `insufficient_audio_activity` or `commit_throttled` ends live mode with no pending commit, task 2.1's owner makes them non-fatal in live mode.
- **F9:** task 1.1 follows the ADR-0004 status-line precedent for partial supersession, names ADR-0002's rejected "model-callable speech tool", and links ADR-0005 and ADR-0008.
- **F11:** commit code and README in `extensions/speak` (`pi-speak`) first, then bump the gitlink in pi-toolset; ADR and OpenSpec edits stay in the parent.
- **F12:** verify "Session switched while Pi speaks" in 3.2, and the redaction scenario and manual-speech "Speech without live mode" in 2.1. Split tests by behavior when they grow. `/talk live` while starting cancels the start, and is refused while a push-to-talk attempt is starting.
- **R2-F4:** task 3.4 records whether a one-syllable answer given at once after Pi stops is kept. If not, shorten the 500 ms constant.
- **R3-F1:** the wording amendments listed above, made by the orchestrator after task 3.1.
