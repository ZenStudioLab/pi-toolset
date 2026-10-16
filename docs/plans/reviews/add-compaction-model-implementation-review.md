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
