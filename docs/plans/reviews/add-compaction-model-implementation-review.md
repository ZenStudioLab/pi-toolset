# add-compaction-model — Implementation Review

Change: `openspec/changes/add-compaction-model/`. Mode: orchestrator-led (from the tasks routing line), normal focus. Selected reviewer: `oracle`, advisory only. Selected default implementation owner: `orchestrator`.

## Wave 1 Review Sequence

BASELINE_TARGET=Wave 1 (tasks 1.1–1.4) of add-compaction-model: the compaction-model extension, its tests, the npm test script entry, and its README documentation
BASELINE_SOURCE=openspec/changes/add-compaction-model/{proposal.md,design.md,specs/compaction-model/spec.md,tasks.md}
BASELINE_INCLUSION_PREDICATE=extensions/compaction-model/**, test/compaction-model/**, the package.json `test` script line, the README.md Compaction Model row and section, and the two design.md lines amended during implementation
BASELINE_EXCLUSIONS=pre-existing uncommitted work (README.md Subagent Profiles paragraph, extensions/subagent-profiles/**, test/subagent-profiles/show.test.mjs, tools/subagent-profiles/README.md); the extensions/pi-claude-bridge submodule (wave 2); ~/.pi/agent/settings.json (task 2.2)

## Round 1 - Implementation Assignments

Wave handled: 1. Final gate reserved: 1.5 (Owner: oracle — wave 1 review gate, advisory only).

| Assignment | Tasks | Owner | Files |
|---|---|---|---|
| A1 | 1.1 | orchestrator | `extensions/compaction-model/config.ts`, `test/compaction-model/config.test.ts` |
| A2 | 1.2 | orchestrator | `extensions/compaction-model/thinking.ts`, `test/compaction-model/thinking.test.ts`, `test/compaction-model/fixtures.ts` |
| A3 | 1.3 | orchestrator | `extensions/compaction-model/index.ts`, `test/compaction-model/handler.test.ts` |
| A4 | 1.4 | orchestrator | `package.json` (`test` script), `README.md` (table row and section), `extensions/compaction-model/README.md` |

Owner choice: orchestrator for every assignment, per orchestrator-led mode and the user's rule that only `oracle` may run as a subagent.

Implementation notes:
- `config.ts` returns `{ ok, config, unknownKeys }` or `{ ok: false, error }`; model refs split on the first `/`.
- `thinking.ts` reads the patched-host classifier through a local structural type with a `typeof === "function"` check, asks one `choice` question over `low`/`medium`/`high`, checks `signal.aborted` after `classify()` settles, then requires `stopReason === "stop"` and a valid `choice`. A thrown `classify()` is also treated as unavailable, even though the host promises never to reject.
- `index.ts` exports `createCompactionHandler(pi, { compact, readConfig })`, `requiredContext`, and `restoreCarriedFileOps`; the default export wires Pi's `compact` and a reader for `join(getAgentDir(), "compaction-model.json")`.
- Two design deviations, both reflected in design.md: (1) the 0.87.1 registry returns `ProviderHeaders` (`Record<string, string | null>`), which `compact()` does not accept, so `null` entries are dropped like Pi's `withoutDeletedHeaders`; (2) a config read error other than ENOENT falls back with a warning instead of throwing out of the handler.
- The tasks.md wave log paths were aligned with the apply-loop convention (this file, one section per wave).
- `README.md` keeps the root entry short and links to `extensions/compaction-model/README.md`, matching the other entries. The extension is not added to the published `files` list.

Validation:
- `npx tsc --noEmit` — passes.
- `node --experimental-strip-types --test test/compaction-model/*.test.ts` — 19/19 pass (config 4, thinking 4, handler 11).
- `npm run check` — typecheck passes; 1117/1117 tests pass.
- The README JSON example parsed with `parseConfig` → `{ ok: true, model anthropic/claude-haiku-5-5, thinkingLevel auto, decisionModel typesafe/jev-latest }`.
- `openspec validate add-compaction-model --type change --strict` — valid.

Candidate revision: `sha256:06205d590d8b0bcf` (wave 1 files plus the `package.json` and `README.md` diffs).

Caveats: the classifier path is exercised only with a fake registry; real Jev use is verified in task 2.3. The bridge path is not exercised in wave 1.

Reviewer direction (user, during wave 1 gate): use the claude.ai web app via the Kimi browser extension as the oracle reviewer from wave 2 onward; tasks.md routing line and task 2.6 updated. The routing sentence that defaulted later gates to the local `oracle` was the orchestrator's own narrowing of the earlier proposal-stage request and is withdrawn.

## Round 1 - Oracle Review

Reviewer: local `oracle` subagent on `claude-bridge/claude-opus-5-5:high`, fresh context (run 3f64f327; the foreground attempt failed before starting with a bridge prompt-capture error). Gate 1.5; assignments A1–A4. Verbatim findings, condensed to the required fields:

- F1 — P1 — summary-request-routing — In scope: YES. `index.ts:104` passed `undefined` as `streamFn`, so `compact()` used `completeSimple`, which only knows built-in and globally registered APIs (`compat.ts:239-292`); extension providers live only in the model runtime and nothing registers them globally. Probe on stock 0.87.1: `No API provider registered for api: claude-bridge`. Every `claude-bridge/...` summarizer would fall back. SUGGESTED_CORRECTION: pass the registry's `streamSimple` as `streamFn`; assert forwarding in the handler test; amend design.md.
- F2 — P3 — notification-level-accuracy — In scope: YES. The notice reported the requested level, which providers clamp (`clampThinkingLevel`, `models.ts:1235-1255`). SUGGESTED_CORRECTION: clamp before passing and reporting.
- F3 — P3 — size-guard-cap-parity — In scope: YES. `index.ts:29` used `min(0.8×reserve, maxTokens)`; `compact()` treats `maxTokens <= 0` as unlimited (`compaction.ts:712-715`). SUGGESTED_CORRECTION: same treatment.
- F4 — P3 — handler-test-sensitivity — In scope: YES. The previous-summary and turn-prefix terms of the size check, and the abort check before the request (`index.ts:94`), could be deleted without a test failing. SUGGESTED_CORRECTION: one fallback case per term and an already-aborted explicit-level cancel case.

Coverage (reviewer): every spec requirement and design decision; `tsc` and the 19 tests run. Not checked: live Pi, `openspec validate`, `npm run check`.

PROPOSED_REVIEW_ACTION=PATCH

## Caller Assessment — Round 1

Caller verification: `compaction.ts:634-637` calls `completeSimple` when no `streamFn` is given; no `registerApiProvider(` call exists in `host/pi/packages/coding-agent/src`; stock `model-registry.d.ts:36` declares `streamSimple`; `compaction.ts:712-715` confirms the cap; `clampThinkingLevel` is exported from `@earendil-works/pi-ai` (`models.d.ts:196` via `index.d.ts:21`), which other repo extensions already import.

| # | Family | Decision | CORRECTION |
|---|---|---|---|
| F1 | summary-request-routing | ACCEPT_BLOCKING | `streamFn = ctx.modelRegistry.streamSimple.bind(ctx.modelRegistry)` passed to `compact()`; the handler test asserts the passed function forwards to the registry; design.md compact-call and bridge paragraphs amended. |
| F2 | notification-level-accuracy | ACCEPT_NONBLOCKING | Level clamped with `clampThinkingLevel(model, level)` before sending and reporting; design.md notes it. |
| F3 | size-guard-cap-parity | ACCEPT_NONBLOCKING | `maxTokens > 0 ? maxTokens : Infinity` inside the cap. |
| F4 | handler-test-sensitivity | ACCEPT_NONBLOCKING | Two fallback-table cases (previous summary alone, turn prefix alone) and a "before the request" cancel case; each fails when its branch is removed. |

REVIEW_ACTION=PATCH
CONSENSUS_STATUS=NEEDS_REVISION

## Round 2 - Implementation Assignments

Owner: orchestrator (A3 files only: `extensions/compaction-model/index.ts`, `test/compaction-model/handler.test.ts`; plus design.md amendments). Gate 1.5 reserved.

Validation: `npx tsc --noEmit` passes; `test/compaction-model/*.test.ts` 19/19; `npm run check` 1117/1117; `openspec validate --strict` valid.

Candidate revision: `sha256:f6e15eac689a2f42`

## Round 2 - Oracle Review

Reviewer: the same local `oracle` instance, resumed (run c851df04). Gate 1.5, PATCH mode, candidate sha256:f6e15eac689a2f42. Condensed to the required fields:

- Fix verification: F1 FIXED (`index.ts:108-109`; stock `model-registry.js:70-71` and patched `model-runtime.ts:716-741` resolve extension providers and keep apiKey, headers, env); F2 FIXED as written but regressed (F5); F3 FIXED (`index.ts:30` matches `compaction.ts:712-715`); F4 FIXED (each new case fails when its branch is removed).
- F5 — P2 — notification-level-accuracy (recurrence of the F2 family; a narrow clamp-scope error, not structural) — In scope: YES. `clampThinkingLevel` raises a null-mapped level (probe: catalog `claude-opus-5-5` clamps `off→low`, `minimal→low`), whereas Pi's own summary path drops `off` and sends nothing (`compaction.ts:606`; the bridge then uses Claude Code's default effort). An explicit `off` would therefore send effort `low`, contradicting the spec's explicit-level SHALL and design.md's "explicit `off` is passed through"; the bridge fixture had no `thinkingLevelMap`, so no test caught it. SUGGESTED_CORRECTION: apply the clamp only when it lowers the level; give the bridge fixture `{ off: null, minimal: null }`; add a `max` cap case; align design.md.

Coverage (reviewer): F1–F4 against host source, both `streamSimple` routes, the loader's pi-ai mapping, `clampThinkingLevel` on the real catalog, bridge `effortForReasoning`; `tsc` and 19/19 tests. Not checked: live Pi, Haiku/Sonnet 5.5 level maps, `npm run check`, `openspec validate`.

PROPOSED_REVIEW_ACTION=PATCH

## Caller Assessment — Round 2

| # | Family | Decision | CORRECTION |
|---|---|---|---|
| F5 | notification-level-accuracy | ACCEPT_NONBLOCKING (P2; applied before closing) | The clamped level is used only when it is lower than the requested one (`THINKING_LEVELS` order), so `off` and unmapped `minimal` are never raised. The bridge fixture now has `thinkingLevelMap: { off: null, minimal: null, max: null }`, which makes the existing `off` case sensitive to the regression; a new case checks that session `max` is sent and reported as `high`, the clamp result for a model without explicit `xhigh`/`max`. design.md line 45 is aligned with line 71. |

Validation after the correction: `test/compaction-model/*.test.ts` 19/19; `npm run check` 1117/1117; `openspec validate --strict` valid.

Recurrence note: F5 recurs in the F2 family after one revision. It is a scope error in a single statement with no invalid boundary or structural assumption, so it does not call for REBUILD.

PATCH_BASELINE_REVISION=sha256:18eed0aceffdf318

Terminal baseline validation: BASELINE_TARGET, BASELINE_SOURCE, BASELINE_INCLUSION_PREDICATE, and BASELINE_EXCLUSIONS are unchanged from the frozen Wave 1 baseline. The current candidate equals the latest recorded revision sha256:18eed0aceffdf318. The F5 correction is nonblocking and was verified by the caller's own tests rather than by a third review round.

DISPATCH_BUDGET wave 1: oracle=1/1 others=0/3

REVIEW_ACTION=PASS
CONSENSUS_STATUS=MOSTLY_GOOD

## Wave 2 Review Sequence

BASELINE_TARGET=Wave 2 (tasks 2.1–2.5) of add-compaction-model: bridge submodule install and checks, the user settings switch, live verification, and change validation
BASELINE_SOURCE=openspec/changes/add-compaction-model/{proposal.md,design.md,specs/compaction-model/spec.md,tasks.md} at commit fc41303
BASELINE_INCLUSION_PREDICATE=the extensions/pi-claude-bridge submodule at v0.9.3 and its local install; ~/.pi/agent/settings.json packages/extensions entries; live session evidence under /tmp/cm-live.Jq0lDf; this log
BASELINE_EXCLUSIONS=wave 1 source (accepted at fc41303); pre-existing uncommitted subagent-profiles work and the README Subagent Profiles paragraph

## Round 1 - Implementation Assignments

Wave handled: 2. Final gate reserved: 2.6 (oracle role on the claude.ai web app via the Kimi browser extension, advisory only). Owner of every assignment: orchestrator.

| Assignment | Task | Result |
|---|---|---|
| B1 | 2.1 | Done. Supply-chain review before install: commit 874fa7c2, tag v0.9.3 "Release 0.9.3" by the upstream author; 250 lockfile packages all from registry.npmjs.org; install scripts only in esbuild, fsevents, protobufjs, @google/genai; the only runtime dependency change from 0.9.1 is `@anthropic-ai/claude-agent-sdk` ^0.3.284 → ^0.3.293. User approved `npm ci --ignore-scripts`. Results: 0 vulnerabilities; `npm run typecheck` passes; `npm run test:unit` 330/330; package.json version 0.9.3; `session_before_compact` handler (src/index.ts:2470-2472) only calls `rememberSummarySession`. Submodule tree clean. |
| B2 | 2.2 | Done. The user approved the exact diff shown beforehand; applied as a text edit (backup /tmp/pi-settings.before-compaction-model.json): `npm:pi-claude-bridge@latest` → `../../../../mnt/.../pi-toolset/extensions/pi-claude-bridge` in the same `packages` slot (before `npm:@tian.zuo/pi-compact`), and the compaction-model path appended as the last `extensions` entry. JSON valid; `diff` shows only those lines. `pi list` resolves the bridge to the submodule path and lists no other pi-claude-bridge; `pi --list-models claude-haiku-5-5` lists `claude-bridge/claude-haiku-5-5` (1M/128K, reasoning). Load order (packages before extensions) rests on `package-manager.ts:925-966`; the live run in B4 shows the bridge's isolated-summary routing working, which depends on that order. |
| B3 | 2.3 | BLOCKED for the Anthropic session: `pi --list-models anthropic/claude` → "No models matching", so no `anthropic/claude-opus-5-5` session can run (recorded as a blocker for this task only, as the task allows). The task's `auto` part was verified in a bridge session instead: config `claude-bridge/claude-haiku-5-5` + `thinkingLevel: auto` → notice "Compacted with claude-bridge/claude-haiku-5-5, thinking high, chosen by Jev."; the bridge log shows both summary spawns at `effort=high`. Jev was available and chose `high`. |
| B4 | 2.4 | Done, with one residual. Fork of the real Opus bridge session (`--fork` of this conversation into /tmp/cm-live.Jq0lDf/sessions), RPC `compact`, then a prompt. Config `claude-bridge/claude-haiku-5-5`, `low`, `CLAUDE_BRIDGE_DEBUG=1`. Evidence: exactly one outcome notice "Compacted with claude-bridge/claude-haiku-5-5, thinking low."; the bridge log shows two isolated-summary spawns (split turn: history promptLen 266339, prefix 4377), both `model=claude-haiku-5-5[1m] … effort=low`, none on Opus; the new compaction entry has `fromHook: true`, carries 20 read and 16 modified files from the previous extension-written compaction, and is followed by no model or thinking-level change entries; get_state before and after: `claude-bridge/claude-opus-5-5`, thinking high; the next reply came from `claude-bridge/claude-opus-5-5` ("OK"). Config removed: the next compaction spawned `claude-opus-5-5[1m] effort=high`, no notice from this extension, entry `fromHook: false`. Residual: the summarized material was about 67K tokens (266K characters; `tokensBefore` 251K), not the >200K tokens the task asked for, because a fork holds only the branch after the session's earlier compaction. Recorded as a residual risk as the task allows. |
| B5 | 2.5 | Done. `openspec validate add-compaction-model --type change --strict` → valid. |

The test config file `~/.pi/agent/compaction-model.json` was created only for these runs and has been removed; the user's setup runs Pi's default compaction until they create it.

No repository files changed in wave 2 apart from this log. Candidate revision: commit fc41303 plus this log entry.

Wave 2 gate (task 2.6), round 1 sent to claude.ai (Opus 5.5, new chat): https://claude.ai/chat/160ca1f5-d22e-4e36-87ed-b489d4b720dd. Attached: spec.md, design.md, tasks.md, compaction-model-index.ts, implementation-review-log.md, evidence-wave-2.md (staged in ~/Documents/26-10-16-add-compaction-model-review/wave-2-round-01/). Later rounds go in the same chat.

## Round 1 - Oracle Review

Reviewer: claude.ai (Opus 5.5) in https://claude.ai/chat/160ca1f5-d22e-4e36-87ed-b489d4b720dd, oracle role, advisory only. Gate 2.6, assignments B1–B5. No P0 or P1 findings. Condensed to the required fields (full text: ~/Documents/26-10-16-add-compaction-model-review/wave-2-round-01/response.md):

- F1 — P2 — large-material-residual — In scope: YES. 2.4 allows a residual only "if no such session can be arranged", but the same session branched before its first compaction (tokensBefore 387332) would give far more material than run A (promptLen 266339). SUGGESTED_CORRECTION: branch before that compaction, run with run A's config, record promptLen, model, notification count and `fromHook`; measure by `promptLen`, not `tokensBefore`; keep the residual only with the measured size.
- F2 — P2 — file-list-carry-evidence — In scope: YES. Counts alone do not prove the carry; the earlier compaction was not written by this extension; run C's entry was not reported. SUGGESTED_CORRECTION: compare sets (modified ⊆ modified; read ⊆ read ∪ modified; name a carried file untouched in the new range), then run a second extension-written compaction as the spec scenario says; report run C's entry or narrow B3.
- F3 — P2 — blocker-evidence — In scope: YES. The 2.3 blocker rests on a `--list-models` pattern miss, not a credential check. SUGGESTED_CORRECTION: record `pi --list-models claude-opus-5-5` and a presence-only credential check; if no credential, leave 2.3 unticked with the blocker and re-validate.
- F4 — P2 — load-order-verification — In scope: YES. 2.2's order check is static; B2's claim that run B4 depends on the order is wrong (routing follows cache retention). SUGGESTED_CORRECTION: remove the claim, or add a runtime observation; otherwise record the check as static.
- F5 — P3 — live-evidence-record — In scope: YES. The excerpts were curated, merged out of order, and lacked per-run counts and fork snapshots. SUGGESTED_CORRECTION: record snapshots and unfiltered counts per run; reword run B as a separate fork.
- F6 — P3 — settings-rollback-lifecycle — In scope: YES. The settings backup and the evidence lived in /tmp; running sessions switch only after a restart; the bridge now runs from a submodule working tree that needs `npm ci`. SUGGESTED_CORRECTION: keep the revert and the evidence outside /tmp, remove the test config, state the restart, document the `npm ci` step.

Coverage (reviewer): each Verify clause of 2.1–2.5 against B1–B5 and the evidence file; live runs against the spec requirements they touch. Not checked: session files, the unfiltered bridge log, Pi's `--list-models` matching, README.md.

PROPOSED_REVIEW_ACTION=PATCH

## Caller Assessment — Round 1

The reviewer's claim on F6 proved right in practice: the /tmp scratch directory with runs A–C, their session files and the settings backup no longer existed when this round started. Runs A–C therefore cannot be re-examined and are superseded by the reruns below.

| # | Family | Decision | CORRECTION |
|---|---|---|---|
| F1 | large-material-residual | ACCEPT_NONBLOCKING (done) | Reran on the real session truncated before its first compaction (run D): tokensBefore 387332, two Haiku requests of promptLen 291079 and 65236 (4× run A). Residual narrowed, see Round 2 assignment C1. |
| F2 | file-list-carry-evidence | ACCEPT_NONBLOCKING (done) | Run E: second extension-written compaction after two read turns; set comparison recorded in C2. Run F (`auto`) entry recorded in C3. |
| F3 | blocker-evidence | ACCEPT_NONBLOCKING (done) | Direct checks recorded in C4; the blocker stands and 2.3 stays unticked. |
| F4 | load-order-verification | ACCEPT_NONBLOCKING (done) | B2's claim withdrawn; order recorded as static; extension README corrected (it made the same claim). |
| F5 | live-evidence-record | ACCEPT_NONBLOCKING (done) | New runs logged unfiltered with per-run counts; run B reworded as a separate earlier fork. |
| F6 | settings-rollback-lifecycle | ACCEPT_NONBLOCKING (done) | Revert and evidence kept outside /tmp, README notes added. |

REVIEW_ACTION=PATCH
CONSENSUS_STATUS=NEEDS_REVISION

## Round 2 - Implementation Assignments

Owner of every assignment: orchestrator. Candidate revision for the re-review: sha256 of the files listed in `evidence-wave-2-round-2.md` (see the Round 2 prompt). Nothing in the extension source changed in this round; one README sentence was corrected (F4) and two sentences added (F6).

| Assignment | Task | Result |
|---|---|---|
| C1 | 2.4 (F1, F5) | Run D: `--session` on a copy of this conversation's session truncated before its first compaction (318 entries), model `claude-bridge/claude-opus-5-5` at `high`, config `claude-bridge/claude-haiku-5-5` + `low`, `CLAUDE_BRIDGE_DEBUG=1`, RPC `compact`. Unfiltered log: 2 routing lines, 2 spawn lines, both `model=claude-haiku-5-5[1m] effort=low`, promptLen 291079 (history) and 65236 (turn prefix); 1 notification "Compacted with claude-bridge/claude-haiku-5-5, thinking low."; new entry `fromHook: true`, tokensBefore 387332; get_state before and after: `claude-bridge/claude-opus-5-5`, thinking high; no entries after the compaction. Residual (measured): the largest material this session can give is 387K raw tokens, which Pi serializes into a ~356K-character request (~89K tokens), because tool results are shortened when the conversation is serialized, so a >200K-token serialized request cannot be built from this history. The extension's size guard counts raw tokens (387K here, against the 1M window of the bridge's model), and its 200K-window refusal is unit-tested (previous-summary and turn-prefix cases). The earlier configuration-removed run (default compaction, no notification, `fromHook: false`) was not repeated; it was recorded in Round 1 from a fork that no longer exists and the reviewer accepted it. Earlier runs A–C are superseded; run B was a separate fork, not "the next compaction". |
| C2 | 2.3 file lists (F2) | Run E continues run D's session: two prompts that read `extensions/compaction-model/thinking.ts`, then `compact` again. Result: both entries `fromHook: true` (compaction entries 318 and 328); 1st read 18 / modified 6, 2nd read 18 / modified 6; 1st modified ⊆ 2nd modified; 1st read ⊆ 2nd read ∪ modified; 24 files that only the first entry knew and that no tool call in the new range touched (e.g. `/home/zenji/.agents/rules/persona.md`) are all present in the 2nd entry; the new range touched only `thinking.ts`. Second summary request: 1 spawn, Haiku, `effort=low`, promptLen 15970; 1 notification. |
| C3 | 2.3 auto (F2) | Run F: fresh copy of the truncated session, config `thinkingLevel: auto`. 1 notification "Compacted with claude-bridge/claude-haiku-5-5, thinking high, chosen by Jev."; both spawns `effort=high` (291079 and 65236); entry `fromHook: true`, 18 read / 6 modified; session unchanged (Opus, high). Jev is therefore shown to run, to pick `high` for this material, and to leave the session level alone; run F's `effort=high` equals the session level, so only the notification shows Jev's choice. |
| C4 | 2.3 blocker (F3) | `pi --list-models claude-opus-5-5` lists only `claude-bridge/claude-opus-5-5`; `pi auth check --provider anthropic --no-refresh` prints `not_ready`; `~/.pi/agent/auth.json` holds credentials for `openai-codex`, `typesafe`, `xai` only (provider names only, no secrets read); no `ANTHROPIC_*` environment variable. 2.3 stays unticked as a blocker for this task only; supplying credentials or amending the task is the user's call. |
| C5 | 2.2 order (F4) | B2's claim that run B4 depends on load order is withdrawn: routing follows cache retention, so that evidence does not show order. The order check is static: the settings diff, `package-manager.ts:925-966` (packages resolved before top-level extensions), and the runner's load-order `emit`. The extension README now says what order actually does (the bridge hook records the abort signal first; `pi-compact` can cancel before this extension pays for a summary). |
| C6 | lifecycle (F6) | Evidence copied to ~/Documents/26-10-16-add-compaction-model-review/wave-2-evidence/ (per-run bridge summary lines and notifications). Revert for `~/.pi/agent/settings.json`: in `packages` replace the submodule path with `npm:pi-claude-bridge@latest`; delete the last `extensions` entry (`.../extensions/compaction-model/index.ts`). The test config `~/.pi/agent/compaction-model.json` was removed after the runs (verified absent). Running Pi sessions switch to bridge 0.9.3 and this extension only after a restart; the README now says so and documents `npm ci --ignore-scripts` for the submodule. The /tmp scratch directory is deleted once this round's evidence is staged. |

## Round 2 - Oracle Review

Reviewer: claude.ai (Opus 5.5), same chat, oracle role, advisory only. Gate 2.6, assignments C1–C6. No P0, P1 or P2 findings. Condensed (full text: ~/Documents/26-10-16-add-compaction-model-review/wave-2-round-02/response.md):

- Verification: F1 FIXED; F2 PARTIAL; F3 FIXED; F4 FIXED; F5 FIXED; F6 PARTIAL.
- F7 — P3 — file-list-carry-evidence (recurs from F2) — In scope: YES. The "untouched" check used entries 319–327 instead of the range entry 328 summarized, and C2 does not explain why `thinking.ts` is absent from the second lists. SUGGESTED_CORRECTION: reword C2 to name the range; repeat the check over the summarized range.
- F8 — P3 — large-material-residual (recurs from F1) — In scope: YES. C1 misstates the request (two requests of 291,079 and 65,236 characters, not one of ~356K), uses `tokensBefore` as if it were the guard's figure, and cites no serializer source. SUGGESTED_CORRECTION: restate the residual with the measured numbers and the serializer line.
- F9 — P3 — live-evidence-record (recurs from F5) — In scope: YES. `get_state` for runs D and F, run F's entry fields and a post-compaction reply were not in the attached evidence. SUGGESTED_CORRECTION: attach them or state what rests on run A.
- F10 — P3 — candidate-boundary-record — In scope: YES. No concrete candidate revision; the README edit and the moved evidence path need boundary notes; `openspec validate` must be re-run on the final revision. SUGGESTED_CORRECTION: record them before the terminal record.

Coverage (reviewer): C1–C6 against the round 2 evidence, tasks.md and the README; counts and request sizes per run; the set arithmetic; the F3 outputs. Not checked: session files, serializer source, staged evidence directory.

PROPOSED_REVIEW_ACTION=PASS

## Caller Assessment — Round 2

| # | Family | Decision | CORRECTION |
|---|---|---|---|
| F7 | file-list-carry-evidence | ACCEPT_NONBLOCKING (done) | Re-measured over the range Pi actually summarized. The second compaction (entry 328, `firstKeptEntryId` index 280, previous `firstKeptEntryId` index 276) summarized entries 276–279, which contain no read, write or edit call; entries 319–327 (the two `thinking.ts` reads and a system, user, assistant and tool-result sequence) were kept, not summarized. Entry 328's 18 read and 6 modified files can therefore only have come from the carry, and that is a stronger proof than the earlier one. This replaces C2's "new range" wording, whose stated basis (entries 319–327) was wrong; `thinking.ts` is absent because it was kept, not summarized. |
| F8 | large-material-residual | ACCEPT_NONBLOCKING (done) | C1's residual is restated here and supersedes it: run D made two summary requests of 291,079 and 65,236 characters from a context of 387,332 tokens (`tokensBefore`, which includes the kept messages); `served contextWindow=1000000` confirms the 1M window; the serializer shortens each tool result to 2000 characters (`host/pi/packages/coding-agent/src/core/compaction/utils.ts:94` and `:149`), so a single request above ~200K tokens could not be produced from this session's history and stays untested live. The guard's figure for run D was not computed; its 200K-window refusal is covered by the handler tests (previous-summary and turn-prefix cases). |
| F9 | live-evidence-record | ACCEPT_NONBLOCKING (done) | Attached in `evidence-wave-2-round-2-supplement.md`: `get_state` before and after for runs D, F and G (all `claude-bridge/claude-opus-5-5`, thinking high); run F's entry (`fromHook: true`, 18 read / 6 modified, no entries after it); entries 319–327 listed by role; and a new run G prompt after the second compaction, whose first assistant message came from `claude-bridge/claude-opus-5-5` ("OK"). The "entry types after each compaction" line measured the two entries after index 318 and none after 328; it is superseded by the entry listing. |
| F10 | candidate-boundary-record | ACCEPT_NONBLOCKING (done) | See the boundary note and candidate revision below; `openspec validate --strict` re-run on it. |

Boundary notes (BASELINE_TARGET unchanged): `extensions/compaction-model/README.md` was edited in this wave as a documentation correction to a wave 1 file (the load-order sentence, F4; the restart and `npm ci --ignore-scripts` notes, F6); no source file changed. The inclusion predicate's "live session evidence under /tmp/cm-live.Jq0lDf" is superseded by ~/Documents/26-10-16-add-compaction-model-review/wave-2-evidence/ and the wave-2-round-02 folder; the /tmp scratch directory is removed at the end of this round. Dispatch: the claude.ai reviewer acted as the wave's one oracle instance; no other subagent was used.

Terminal baseline validation: BASELINE_TARGET, BASELINE_SOURCE, BASELINE_INCLUSION_PREDICATE and BASELINE_EXCLUSIONS are unchanged apart from the boundary notes above. The candidate revision sha256:9a87a352d2b0fad3 covers extensions/compaction-model/README.md, openspec/changes/add-compaction-model/tasks.md and this log up to this line (the lines after it are the terminal record only). `openspec validate add-compaction-model --type change --strict` passes on it; the compaction-model tests (19/19) were re-run as a sanity check, since no source changed.
PATCH_BASELINE_REVISION=sha256:9a87a352d2b0fad3

Task status at the gate: 2.1, 2.2, 2.4, 2.5 and 2.6 done; 2.3 not run and left unticked — no `anthropic` credentials on this machine (assignment C4). Its file-list and `auto` parts were verified in bridge sessions (C2, C3).

DISPATCH_BUDGET wave 2: oracle=1/1 others=0/3

REVIEW_ACTION=PASS
CONSENSUS_STATUS=MOSTLY_GOOD

## Post-gate change — progress notification (user request)

After both gates passed, the user ran the extension with `claude-bridge/claude-sonnet-5-5` and saw only the fallback warning (a Claude Code session-limit error), then asked for a message while the extension is working. The handler now shows one progress notification just before the summary request ("The conversation is being compacted with <model>, thinking <level>, by the compaction-model extension…"); the new spec requirement "Compaction progress notification", the design's Notification section and the README were amended in the same change. Verification: a new handler test proves the message is shown before `compact()` is called and before the outcome notice; cancel and failure cases were updated; `npm run check` 1118/1118; `openspec validate --strict` valid. This is a small, user-directed addition on the same notification mechanism that the live runs already exercised; it was not sent to a third review round.

## Post-gate change — priority list of summarizing models (user request)

After the Sonnet 5.5 summary request failed on a Claude Code session limit and compaction fell to the session model, the user asked for the compaction model setting to be an array in priority order: if the first fails, try the second, and so on. The config is now `models: [{ model, thinkingLevel? }, …]` plus the optional `decisionModel`; the single-model shape was replaced, not aliased (the file is user-owned and was migrated). The handler tries each entry in order and skips one that is unknown, virtual, without credentials, too small for the material, or whose request fails after the fixed retries; Pi's default compaction runs only when the config is invalid or every entry was skipped. Jev is asked at most once per compaction. A user cancel never starts the next model. Spec (fallback requirement rewritten; new scenarios for a failed first model, a skipped model, every model failing, per-model levels, and cancel), design ("Priority list of models"), proposal and both READMEs were amended in the same change.

Verification: config and handler tests cover the order, skips without a request, all-fail, cancel, per-entry levels and the single Jev question (25 compaction-model tests; `npm run check` 1123/1123); `openspec validate --strict` valid. A live bridge run with a nonexistent first model and Haiku second showed the skip warning with "Trying claude-bridge/claude-haiku-5-5." and the next model's "is being compacted" notice; the Haiku request then failed with the account's Claude Code session limit, as did Pi's fallback on Opus, so a successful second-model summary was not observed live. This is a user-directed change on the same mechanism the earlier live runs exercised; it was not sent to a third review round.
