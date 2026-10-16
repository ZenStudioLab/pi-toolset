# add-compaction-model — Proposal Review

Review mode: `change_bundle`
Selected reviewer: `oracle`
Selected default implementation specialist: orchestrator (the user allows only `oracle` as a subagent)
Focus mode: normal
Orchestrator mode: orchestrator-led (Oracle advisory only; the orchestrator owns every authoritative decision)
ADR check: considered; no ADR required. The change adds an extension on an existing Pi hook and loads an existing package from a fork submodule, without changing a recorded decision in `docs/adr/`.

## Frozen Baseline

BASELINE_TARGET=openspec/changes/add-compaction-model (apply-ready bundle)
BASELINE_TARGET_REVISION=sha256:72fea5afd1bbb849 (concatenation of proposal.md, design.md, tasks.md, specs/compaction-model/spec.md, in that order)
BASELINE_SOURCE=openspec instructions apply --change add-compaction-model --json (contextFiles)
BASELINE_INCLUSION_PREDICATE=proposal.md, specs/compaction-model/spec.md, design.md, tasks.md under openspec/changes/add-compaction-model/
BASELINE_EXCLUSIONS=implementation source (not yet written); extensions/pi-claude-bridge submodule source (read-only evidence); host/pi source (read-only evidence)

---

## Round 1 - Claude.ai Review

Reviewer: claude.ai (Opus 5.5), chat https://claude.ai/chat/ba026bc4-b48c-4b59-9c92-fb607d76d17a, user's special request replacing oracle. Staging: ~/Documents/26-10-16-add-compaction-model-review/round-01/. Verbatim response follows (indented).

    Critical
    
    None.
    
    High
    F1
    Title: Extension-written compactions lose Pi’s carried-forward file lists at the next compaction
    Family: file-ops-carryover
    Severity: High
    In scope: YES
    Evidence:
    The host flags a handler’s { compaction } as extension-generated: evidence.md › agent-session.ts L2808–2810 (fromExtension = true) and L2847 (appendCompaction(..., details, fromExtension, usage)).
    pi-claude-bridge 0.9.1 L2476 had to call reinjectPriorCompactionFileOps(event.branchEntries, event.preparation) before compact(). That means Pi’s preparation leaves out the file ops recorded in extension-flagged entries. Upstream Pi likewise reads prior details only from Pi-generated compactions. The host’s prepareCompaction is not excerpted, so this needs verifying.
    This extension flags every compaction. From the second compaction on, the read/modified file lists cover only the latest span.
    That contradicts design.md › Goals (“only the model and thinking level differ”) and spec › “Configured model writes compaction summaries”, which requires parity with the default, including previous-summary updating.
    Unit tests with an injected fake compact cannot detect it.
    SUGGESTED_CORRECTION:
    Confirm the skip in host/pi/.../compaction.ts.
    If it is there, merge readFiles/modifiedFiles from the latest compaction entry in event.branchEntries into event.preparation.fileOps whenever that entry is extension-flagged. Do this once the handler has a valid config on a non-Codex session. Port 0.9.1’s reinjectPriorCompactionFileOps from the submodule history.
    Run it before the guard and auth checks. preparation is the same object Pi’s default path receives (L2795, L2830), so fallbacks keep parity too.
    Record it as a design decision, and add a unit test with two consecutive compactions.
    Medium
    F2
    Title: Jev handling assumes a rejecting classify() and an unverified answer field
    Family: jev-contract
    Severity: Medium
    In scope: YES
    Evidence:
    evidence.md › model-registry.ts L172 says classify “Never rejects”.
    jev-router.ts L86–87 reads the answer only via type === "choice" and probabilities. No selected-option field appears anywhere in the evidence.
    The plan assumes otherwise. design.md › “Jev decision in auto mode” says “The answer’s choice becomes the summary thinking level” and that a cancellation during the Jev request cancels compaction. tasks.md 1.2 says “rethrow when the signal is aborted”.
    An aborted classify therefore resolves with a non-stop result. The design maps that to “Jev unavailable → session level”, so the handler starts compact() after the user cancelled and shows a wrong notification. This violates spec › “Cancellation stops compaction”.
    The classifier types are absent from stock 0.87.1 and come from a local structural type, so a wrong field name typechecks.
    A fake registry built on the same assumption passes, and 2.3 only “records” Jev’s choice. A permanent “Jev unavailable” would pass every check.
    SUGGESTED_CORRECTION:
    After classify() resolves, check signal.aborted first and return { cancel: true }. Read stopReason only after that.
    Pick the level as the argmax of answer.probabilities over off/low/medium/high. Use a selected-option field only if host/pi’s ClassifierResult type proves one exists, and cite it.
    In 1.2, make the fake registry resolve with stopReason: "aborted" rather than reject, and give it the evidenced answer shape.
    In 2.3, fail the auto run if the notification says Jev was unavailable.
    F3
    Title: Bridge session association and pi-compact coexistence depend on an unpinned handler order
    Family: hook-order
    Severity: Medium
    In scope: YES
    Evidence:
    evidence.md › runner.ts L1148–1157 awaits handlers one at a time in load order. A later truthy result replaces ours, and cancel short-circuits.
    pi-claude-bridge 0.9.3 L2470–2472 registers event.signal in its own handler. L581 resolves the session with summarySessionFor(options?.signal) ?? options?.sessionId, and Pi passes no sessionId (agent-session.ts L2740).
    Our summary request runs inside our handler. If we load before the bridge, the lookup misses and the isolated Claude Code process gets sessionCwdFor(undefined), which is the #175 class of bug. design.md › “Claude bridge sessions” states the association with no order condition.
    pi-compact L299–306 returns nativeFallbackOrCancel(...) for non-Codex sessions. Its body is not in evidence, so design.md’s “returns nothing for other providers” is unverified.
    If it returns a truthy non-cancel value after us, our summary is silently replaced by a session-model one. If it cancels after us (the remote-checkpoint case), our request is wasted.
    SUGGESTED_CORRECTION:
    Add the precondition to design.md: compaction-model must run after pi-claude-bridge and @tian.zuo/pi-compact.
    In 2.2, establish Pi’s load order for packages vs extensions vs -e, and verify the actual order.
    Read nativeFallbackOrCancel at the installed version and record that it returns only undefined or { cancel: true }.
    Prefer pinning the order over passing sessionId, which Pi deliberately omits.
    F4
    Title: The session_before_compact inventory omits loaded packages, notably pi-opencode-bridge
    Family: hook-inventory
    Severity: Medium
    In scope: YES
    Evidence:
    design.md › Context says “Three of the user’s loaded packages register this hook”, then lists four.
    evidence.md › settings.json also loads pi-opencode-bridge (git, pinned e60b925…), pi-lens, pi-gitnexus, pi-image-tools, pi-subscription-usage, pi-mcp-adapter, pi-web-access, pi-toolset and pi-bookmark. None of them is excerpted or discussed.
    A provider bridge is the likeliest to take over compaction, as pi-claude-bridge 0.9.1 did (L2468–2498). A takeover there means two summary requests per compaction in its sessions.
    SUGGESTED_CORRECTION:
    Grep each loaded package at its installed or pinned version for session_before_compact, and record what each handler returns.
    Skip any provider whose package returns { compaction }, as with openai-codex.
    Add the inventory to the evidence before the wave 1 review.
    F5
    Title: The submodule lives under extensions/, where root tooling and the pi-toolset package may pick it up
    Family: submodule-placement
    Severity: Medium
    In scope: YES
    Evidence:
    proposal.md › Impact says the submodule is “already added”. Only the new extension is excluded from the published files.
    design.md › Context says extensions are typechecked by the root tsconfig.json.
    tasks.md 1.3 and 1.4 require the root typecheck and check to pass in wave 1, but the submodule’s npm ci is task 2.1 in wave 2. If the root globs cover extensions/**, wave 1 fails on the bridge’s unresolved imports. Even after npm ci, the bridge code meets the root’s compiler and lint rules.
    evidence.md › settings.json loads the pi-toolset repo root as a Pi package. If its manifest discovers extensions/*, the bridge or this handler loads twice.
    SUGGESTED_CORRECTION:
    Add a wave 1 step before 1.3 that excludes extensions/pi-claude-bridge/** from the root tsconfig, lint and test globs.
    Confirm that neither the npm files list nor pi-toolset’s Pi manifest includes the submodule or extensions/compaction-model.
    In 2.3 and 2.4, require exactly one compaction-model notification per compaction.
    F6
    Title: “Exactly one summary request” is wrong for split turns
    Family: request-count-criterion
    Severity: Medium
    In scope: YES
    Evidence:
    evidence.md › compaction.ts L994–1033 makes up to two requests on a split turn: history plus turn prefix. design.md › “Context-window guard” says the same.
    spec › “Claude bridge sessions are supported” requires “exactly one summary request”, and tasks.md 2.4 expects “the bridge log shows one isolated summary”.
    Both fail on a correct split-turn /compact, which is common after a long, tool-heavy turn.
    proposal.md’s Codex bullet uses the same wording.
    SUGGESTED_CORRECTION:
    Restate the invariant: exactly one handler produces the summary, through one compact() call. All of its requests (one, or two on a split turn) go to the configured model, and none go to the session model.
    In 2.4, require every compact summary: spawn line (bridge L587) to show registeredModel=claude-haiku-5-5.
    F7
    Title: Success is announced before the host commits, and 2.3 cannot prove the configured model’s summary was persisted
    Family: outcome-proof
    Severity: Medium
    In scope: YES
    Evidence:
    tasks.md 1.3 notifies first, then returns { compaction }.
    Two things can still discard that result. A later handler can replace or cancel it (evidence.md › runner.ts L1153–1157). An abort after the hook discards a returned compaction (agent-session.ts L2843–2844, L3145).
    2.3 checks the notification, the entry’s existence, the absence of model-change entries, and the next reply. All of these still pass if our result was replaced and Pi re-summarized with Opus.
    SUGGESTED_CORRECTION:
    If signal.aborted is set after compact() resolves, return { cancel: true } and skip the success notification.
    In 2.3 and 2.4, assert the new compaction entry carries the extension flag written at L2847. That proves our result was the one persisted.
    Optionally, move the success notification to session_compact, which fires only after success (event types L454).
    F8
    Title: The reported thinking level can differ from what is actually sent
    Family: level-semantics
    Severity: Medium
    In scope: YES
    Evidence:
    evidence.md › compaction.ts L606–607 sends reasoning only when model.reasoning is true and the level is not off.
    pi-claude-bridge 0.9.3 L586–587 derives effort from options.reasoning and logs effort=default when it is absent (CHANGELOG #184).
    So off on a claude-bridge summarizer, which is one of Jev’s specified options, runs at Claude Code’s default effort. That can cost more than low.
    On a non-reasoning summarizer, the level has no effect, and in auto mode the Jev call is wasted.
    In both cases, spec › “Compaction outcome notification” would name a level that was never applied.
    SUGGESTED_CORRECTION:
    Report the effective level: “no reasoning” for non-reasoning models (and skip Jev for them), and “Claude Code default effort” for off on claude-bridge.
    Drop off from Jev’s options when the summarizer is a claude-bridge model.
    In 2.4, assert that the debug line’s effort= matches the configured level.
    F9
    Title: Handler tests omit the success, failure, cancel and pass-through requirements
    Family: test-coverage
    Severity: Medium
    In scope: YES
    Evidence:
    tasks.md 1.3 covers only the skip, silence, invalid-config, unknown-model, missing-auth and too-large paths, plus the no-model-switch rule.
    No unit or live step covers these spec requirements:
    “Summary request fails” (warning carries the error)
    “Cancellation stops compaction”
    “Custom instructions are preserved”
    “Config is read at each compaction”
    the threshold and overflow triggers (customInstructions: undefined, evidence L3129)
    All of them are cheap to test with the injected compact.
    SUGGESTED_CORRECTION: Extend handler.test.ts with these cases:
    Success returns the injected result and passes the model (with the baseUrl override), apiKey, headers, env, customInstructions, event.signal, and the explicit, session, or Jev level.
    A rejecting compact returns undefined with a warning containing its message.
    An aborted signal yields { cancel: true } and no second call.
    Two calls with different config reads use different models.
    Reason threshold with no instructions behaves the same.
    Low
    F10
    Title: With the user’s 500K reserve, Haiku 4.5 cannot serve automatic compactions, and the overflow clause contradicts the guard
    Family: guard-arithmetic
    Severity: Low
    In scope: YES
    Evidence:
    Inputs: evidence.md › settings.json (reserveTokens: 500000), the catalog (haiku-4-5 at 200K/64K, the 5.5 models at 1M/128K), and compaction.ts L712–715.
    Assuming Pi’s usual trigger (context > window − reserve, not excerpted), a 1M session compacts at about 500K and summarizes about 480K.
    Haiku 4.5 needs material of about 136K or less, so it falls back on nearly every automatic compaction.
    Overflow recovery summarizes roughly a full window, which no model with the same window can pass.
    proposal.md and several spec scenarios use Haiku 4.5, and the automatic scenario says “or overflows” without the guard’s condition.
    SUGGESTED_CORRECTION:
    Use Haiku 5.5 and Sonnet 5.5 in the examples.
    Qualify the automatic scenario with “and the material fits the configured model”.
    State this arithmetic in the README’s fallback section.
    F11
    Title: Any transient error on the cheap model triggers a full session-model summary
    Family: retry-fallback-cost
    Severity: Low
    In scope: YES
    Evidence:
    evidence.md › agent-session.ts L2738–2739 shows Pi’s own path passes retry settings, and compaction.ts L975 shows compact() accepts retry?: RetryPolicy.
    design.md drops retries because Pi’s settings are unreachable from an extension, but a policy can be passed directly.
    One 429 or 529 from Haiku means Opus summarizes about 480K tokens, which is the cost this change exists to avoid.
    SUGGESTED_CORRECTION: Pass a small fixed RetryPolicy before falling back, if the type is exported. Otherwise, record the trade-off in design.md › Risks.
    F12
    Title: Config parsing leaves slash handling and unknown keys unspecified
    Family: config-parsing
    Severity: Low
    In scope: YES
    Evidence:
    spec › “Invalid config” and tasks.md 1.1 do not say how to split provider/modelId.
    Model IDs can contain /, and the registry takes provider and id separately (model-registry.ts L72, jev-router.ts L67).
    A typo such as thinkinglevel validates and silently uses the session level.
    SUGGESTED_CORRECTION:
    Split on the first / only.
    Reject unknown keys with a warning that names the key.
    Test both cases in config.test.ts.
    F13
    Title: Request setup mirrors only part of _getSummarizationRequestAuth
    Family: auth-mirroring
    Severity: Low
    In scope: YES
    Evidence:
    evidence.md › agent-session.ts L583–589 routes virtual models before auth, and L601 cleans headers with withoutDeletedHeaders.
    model-registry.ts L89–105 returns raw headers and takes no signal.
    design.md mirrors only the baseUrl handling (L597). A virtual configured model reaches compact() unresolved, fails at request time, and then falls back.
    SUGGESTED_CORRECTION:
    Reject virtual configured models with a named warning, or document them as unsupported.
    Apply withoutDeletedHeaders if it is exported; otherwise note the gap.
    F14
    Title: git describe --tags is a fragile proxy for “takeover removed”
    Family: submodule-verification
    Severity: Low
    In scope: YES
    Evidence:
    tasks.md 2.1 checks the tag. A fork created before the 2026-10-13 release, or a submodule clone without tags, prints something else for a correct commit.
    What matters is the hook body: 0.9.3 L2470–2472 versus 0.9.1 L2468–2498.
    SUGGESTED_CORRECTION:
    Check that package.json says 0.9.3 and that the submodule’s session_before_compact handler only calls rememberSummarySession.
    If a tag check is still wanted, compare the commit with upstream v0.9.3 via git ls-remote.
    F15
    Title: Minor inaccuracies and step ordering
    Family: doc-accuracy
    Severity: Low
    In scope: YES
    Evidence:
    design.md › Context says “a later non-empty result replaces”, but runner.ts L1153–1154 replaces on any truthy value, including {}.
    design.md › Risks says the guard adds “the reserve”, which contradicts its Decisions section (the output limit, not the raw reserve).
    proposal.md › Impact omits serializeConversation and convertToLlm, which design.md uses.
    tasks.md 2.5 runs openspec validate --strict last, although it checks only the plan files.
    SUGGESTED_CORRECTION: Correct the three statements, and also run the validation before wave 1.
    Coverage
    
    I checked cross-file consistency and every design.md claim that evidence.md backs.
    
    Confirmed against evidence.md:
    
    Runner precedence and the cancel short-circuit (L1148–1172).
    The compact() signature and output cap, which the guard formula matches (L712–715, L965–978).
    { cancel: true } on abort is genuinely needed. The manual path runs the default compaction with no abort check after the hook (L2812–2829); the automatic path already checks (L3145).
    The 0.9.1 takeover would race this extension (L2468–2498).
    0.9.3’s hook only records the signal (L2470–2472).
    pi-compact’s Codex gate (L299).
    getApiKeyAndHeaders returns baseUrl and env (L99–105).
    Bridge Haiku 5.5 is registered at 1M only from 0.9.3 (#190), which is another reason to load the submodule.
    
    Not checkable from evidence.md:
    
    The host’s prepareCompaction (F1’s mechanism).
    Where the cacheRetention: "none" marker the bridge routes on is set. It is absent from the options builder at L604–610; 2.4’s spawn-line check covers it.
    Pi’s extension load order.
    The bodies of nativeFallbackOrCancel, effortForReasoning and sessionCwdFor.
    Other packages’ hooks.
    Whether stock 0.87.1 matches the patched host’s exports and signatures, and whether extensions get the host’s compact().
    The root tsconfig, lint config and Pi manifest.
    The bridge’s long-context mapping for Haiku 5.5.
    Whether anthropic credentials exist for 2.3.
    
    PROPOSED_REVIEW_ACTION=PATCH
    END_OF_REVIEW
    
    
    
    
    
    
    

---

## Caller Assessment — Round 1

Review mode: `change_bundle`. Convergence mode: `FULL`. Review subject: `add-compaction-model`. Reviewer proposal: `PATCH` (candidate input only).

Caller verification performed before deciding (read-only):
- `host/pi/packages/coding-agent/src/core/compaction/compaction.ts:67-79` — `extractFileOperations` reads prior `readFiles`/`modifiedFiles` only when `!prevCompaction.fromHook`. Confirms F1.
- `host/pi/packages/ai/src/types.ts:679-684` — `ClassifierChoiceAnswer` has `choice: string` plus `probabilities`. Refutes the F2 claim that no selected-option field exists.
- `host/pi/packages/coding-agent/src/core/package-manager.ts:925-966` — settings `packages` resolve before top-level `extensions`. An extension listed in `settings.extensions` runs after the bridge and pi-compact packages.
- `extensions/pi-claude-bridge/src/session-cwd.ts` — `sessionCwdFor(undefined)` falls back to `process.cwd()`, which is the session cwd in the pi CLI.
- `@tian.zuo/pi-compact/src/compact.ts:107-130` — `nativeFallbackOrCancel` returns only `undefined` or `{ cancel: true }`.
- Hook inventory: `session_before_compact` is absent from pi-lens, pi-gitnexus, pi-image-tools, pi-mcp-adapter, pi-web-access, pi-opencode-bridge, pi-subscription-usage, pi-bookmark, whimsical-activity, and subagent-profiles.
- Root `tsconfig.json` excludes `extensions/pi-*`. The root `npm test` script lists explicit test directories. The root `package.json` `pi.extensions` lists only whimsical-activity and subagent-profiles.

| # | Family | Decision | GOVERNING_SOURCE | CORRECTION / notes |
|---|---|---|---|---|
| F1 | file-ops-carryover | ACCEPT_BLOCKING | spec "Configured model writes compaction summaries" (parity with default compaction); compaction.ts:67-79 | Before calling `compact()`, merge `readFiles`/`modifiedFiles` from the latest compaction entry in `event.branchEntries` into `event.preparation.fileOps` when that entry has `fromHook: true`. Record it as a design decision; add a two-compaction unit test. Run it only after the handler commits to summarizing, so Pi's default path keeps its own behavior on fallback. |
| F2 | jev-contract | ACCEPT_BLOCKING (partial) | spec "Cancellation stops compaction"; model-registry.ts:172 ("Never rejects") | After `classify()` resolves, check `signal.aborted` first and return `{ cancel: true }`; then require `stopReason === "stop"`. Use `answer.choice` (exists per types.ts:679-684). The argmax suggestion is rejected because the field exists. The fake registry resolves `stopReason: "aborted"`. In 2.3, the auto run fails if Jev is reported unavailable. |
| F3 | hook-order | ACCEPT_NONBLOCKING | package-manager.ts:925-966 | Record in design.md that the extension must be loaded through `settings.extensions`, so it runs after the bridge (signal registration) and pi-compact. 2.2 verifies the order. Pass no `sessionId`. |
| F4 | hook-inventory | ACCEPT_NONBLOCKING | — | Inventory done (above); no other loaded package handles the hook. Record it in design.md Context and fix the "Three of" count. |
| F5 | submodule-placement | REJECT | — | Root tsconfig excludes `extensions/pi-*`; the test script uses explicit paths; the package manifest lists explicit extensions. No double load or typecheck exposure. A one-notification-per-compaction check is still added to 2.3/2.4 (cheap). |
| F6 | request-count-criterion | ACCEPT_BLOCKING | concrete correctness of acceptance criteria: compaction.ts split-turn path makes up to two requests | Restate as: exactly one handler produces the summary through one `compact()` call; every summary request (one, or two on a split turn) goes to the configured model; none goes to the session model. Update spec, proposal, and 2.4. |
| F7 | outcome-proof | ACCEPT_BLOCKING | spec "Cancellation stops compaction"; agent-session.ts:2843-2844 | If `signal.aborted` after `compact()` resolves, return `{ cancel: true }` without the success notification. 2.3/2.4 assert the new compaction entry has `fromHook: true`. |
| F8 | level-semantics | ACCEPT_NONBLOCKING | — | The notification reports the effective level: "no reasoning" for a non-reasoning summarizer, where Jev is also skipped. Jev options become `low`/`medium`/`high` (drop `off`, which on claude-bridge means default effort). An explicit `off` is the user's choice and is reported as such. |
| F9 | test-coverage | ACCEPT_BLOCKING | OpenSpec tasks instruction: each task must state how to verify; spec requirements otherwise unverified | Extend 1.3's handler tests: success argument pass-through (model with baseUrl, auth, env, customInstructions, signal, level), request failure → warning, abort → cancel with no second call, per-compaction config read, threshold reason without instructions. |
| F10 | guard-arithmetic | ACCEPT_NONBLOCKING | — | Use Haiku 5.5 / Sonnet 5.5 in examples; qualify the automatic scenario with "and the material fits"; state the arithmetic in the README fallback section. |
| F11 | retry-fallback-cost | ACCEPT_NONBLOCKING | — | Pass a small fixed retry policy `{ enabled: true, maxRetries: 2, baseDelayMs: 2000 }` to `compact()`. |
| F12 | config-parsing | ACCEPT_NONBLOCKING | — | Split `provider/modelId` on the first `/`. An unknown key is a warning naming the key, not a fallback. Test both. |
| F13 | auth-mirroring | ACCEPT_NONBLOCKING | — | Virtual configured models are unsupported and fall back with a warning (detected when the registry's model is virtual or unresolvable). `withoutDeletedHeaders` is not exported; document the gap. |
| F14 | submodule-verification | ACCEPT_NONBLOCKING | — | 2.1 checks `package.json` version 0.9.3 and that the submodule's hook only calls `rememberSummarySession`; drop the tag check. |
| F15 | doc-accuracy | ACCEPT_NONBLOCKING | — | Fix "non-empty" → "truthy", the Risks reserve wording, and the Impact export list. Run `openspec validate --strict` before wave 1 too. |

### Summary
- Accepted blocking: 5 (F1, F2, F6, F7, F9)
- Accepted nonblocking: 9
- Deferred out of scope: 0
- Rejected: 1 (F5)

### Caller Result
REVIEW_ACTION=PATCH
CONSENSUS_STATUS=NEEDS_REVISION

### Notes for reviewer (next round)
- All accepted findings, blocking and nonblocking, are applied in the patched bundle.
- F2's "no selected-option field" was wrong: `ClassifierChoiceAnswer.choice` exists in `host/pi/packages/ai/src/types.ts:679-684`.
- F5 was rejected on the tsconfig, test-script, and manifest evidence above.
- Focus: verify the fixes and run a bounded whole-bundle regression sweep.

PATCH_BASELINE_REVISION=sha256:d99d756f13cd97c5

---

## Round 2 - Claude.ai Review

Reviewer: same claude.ai chat. Reviewed candidate revision sha256:d99d756f13cd97c5. Staging: ~/Documents/26-10-16-add-compaction-model-review/round-02/. Verbatim response follows (indented).

    Fix verification
    F1 — FIXED. Spec adds the carried-list clause and scenario. Design restores from the latest fromHook entry (evidence-02 compaction.ts L67–79), and 1.3 implements and tests it. A wording residual remains: N1.
    F2 — FIXED, and I agree with the partial acceptance. ClassifierChoiceAnswer.choice exists (evidence-02 types.ts L679–684), which was the condition my correction set. Abort is now checked before stopReason.
    F3 — FIXED. settings.extensions resolve after all packages (package-manager.ts L925–966). A lookup miss falls back to process.cwd() (session-cwd.ts L36–38), and pi-compact returns only undefined or { cancel: true } (L107–130). Residual: N6.
    F4 — FIXED. design Context records the grep inventory and the miscount is gone. Residual: N4.
    F5 — AGREE-REJECT. tsconfig excludes extensions/pi-*, and the test script and manifest are explicit (evidence-02). extensions/pi-bookmark already uses this layout.
    F6 — FIXED. The spec, the bridge requirement, the Codex bullet and 2.4 now state the invariant: one handler, every request to the configured model. Residual: N2.
    F7 — FIXED. An abort after compact() resolves returns { cancel: true } with no notification (design › Cancellation, 1.3). 2.3 and 2.4 assert fromHook: true.
    F8 — FIXED. The notification reports the effective level. Jev is limited to low/medium/high and is skipped for non-reasoning models, and 2.4 asserts effort low. Untested scenarios: N3.
    F9 — FIXED. 1.3 now covers pass-through, failure, abort, per-compaction config, the threshold reason, file lists and the notification count.
    F10 — FIXED. Examples use the 5.5 models, the automatic scenario adds “and the material fits”, and the arithmetic is in design Context and the README.
    F11 — FIXED. { enabled: true, maxRetries: 2, baseDelayMs: 2000 } matches RetryPolicy (evidence-02 L9–17).
    F12 — FIXED. The first-slash split and the unknown-key warning are specified and tested in 1.1.
    F13 — FIXED. api === "pi-virtual" models fall back with a warning (virtual-models.ts L29, L105–106), and the header gap is documented.
    F14 — FIXED. 2.1 checks version 0.9.3 and the record-only hook.
    F15 — FIXED. “Truthy”, the output-limit wording, the Impact exports, and openspec validate in 1.4 are all in place.
    New findings
    
    None is Critical, High or Medium.
    
    N1
    Title: The design’s claim about fallback preparation is false after a failed request
    Family: file-ops-carryover
    Severity: Low
    In scope: YES
    Evidence:
    design.md › “Carry file lists…” says the restore “runs after every fallback check, so a fallback hands Pi exactly the preparation Pi built”.
    The restore runs before compact() (tasks.md 1.3 order) and mutates event.preparation.
    So a summary that fails after retries hands Pi’s default compaction the restored lists. That is the better outcome, but the sentence, and any test written from it, says otherwise.
    SUGGESTED_CORRECTION:
    Reword the sentence: pre-request fallbacks get Pi’s own preparation, and a failed-request fallback keeps the restored lists. Add that handler case.
    Optionally, narrow the scenario’s “a second compaction runs” to “a second compaction the extension summarizes”.
    2.3’s auto repeat is already a second compaction after an extension-written one. Checking that its details include the first’s files gives F1 a free live proof.
    N2
    Title: Request-routing wording conflicts with the fallback rule, the retries, and 2.4’s own steps
    Family: request-count-criterion
    Severity: Low
    In scope: YES
    Evidence:
    spec › “Claude bridge sessions” says “no summary request SHALL go to the session model” with no condition, but spec › Fallback sends a failed configured-model compaction there.
    The first requirement’s “(one, or two when the cut point splits a turn)” ignores the two retries.
    tasks.md 2.4’s “none names Opus” applies to the whole log, yet its own config-deletion step produces an Opus spawn by design.
    proposal.md › Impact › Runtime still says “one extra model request per compaction”. The requests move to the configured provider; they are not added.
    SUGGESTED_CORRECTION:
    Scope the bridge clause to a successful configured-model summary.
    Add “plus retries” to the parenthetical, or drop the count.
    Limit 2.4’s Opus check to the configured-model compaction.
    Reword Runtime: summary requests move to the configured provider, auto adds one classifier request, and a failure after retries adds a session-model summary.
    N3
    Title: Scenarios added in this revision have no handler test, and the notification count is ambiguous
    Family: test-coverage
    Severity: Low
    In scope: YES
    Evidence:
    tasks.md 1.3 has no case for these new scenarios: “Non-reasoning summarizer”, “User cancels during the Jev decision” and “Unknown config key”. It also has none for the bridge off wording in design › Notification.
    1.2 only tests that thinking.ts returns cancelled, not that compact is never called afterwards.
    1.3 asserts “exactly one notification per handled compaction”, but the unknown-key scenario adds a warning to a handled compaction.
    2.4’s “exactly one notification appears” counts notifications from every source.
    SUGGESTED_CORRECTION:
    Add these handler cases:
    A reasoning: false model makes no Jev call, and the notification says “no reasoning”.
    An abort after Jev returns { cancel: true } and never calls compact.
    An unknown key still summarizes, with a warning naming the key.
    An explicit off on a claude-bridge model is reported as “Claude Code default effort”.
    In both 1.3 and 2.4, count one outcome notification per handled compaction, with config warnings counted separately.
    N4
    Title: The hook inventory omits this repo’s extensions loaded through settings.extensions
    Family: hook-inventory
    Severity: Low
    In scope: YES
    Evidence:
    design.md › Context says none of “this repo’s own extensions” registers the hook.
    evidence-02’s grep names only whimsical-activity and subagent-profiles. It does not cover speak, session-delete, session-title, session-rename or tool-block-borders (evidence.md › settings.json extensions).
    Those are top-level entries like compaction-model. If one listed after it returned a truthy result, it would replace our summary (runner.ts L1153–1154).
    SUGGESTED_CORRECTION: Add the five extensions to the grep evidence, and have 2.2 append compaction-model as the last extensions entry.
    N5
    Title: The large (~480K-token) bridge compaction this change targets is never exercised live
    Family: guard-arithmetic
    Severity: Low
    In scope: YES
    Evidence:
    design.md › Context now says Haiku 5.5 fits a ~480K compaction, and claude-bridge/claude-haiku-5-5 is a headline example (proposal, 1.4).
    The guard reads the registry’s context window. Whether the bridge’s Claude Code process accepts that size depends on the bridge’s long-context mapping (bridge L584 claudeCodeModelId(model, longContextSettings)).
    2.3 and 2.4 compact sessions of unspecified size. A failure would only show up later, as a fallback warning on every threshold compaction.
    SUGGESTED_CORRECTION: Run 2.4, or one extra compaction, on a resumed session with more than ~200K tokens of material, and check that the Haiku spawn succeeds and the entry has fromHook: true. Otherwise record this as a residual risk.
    N6
    Title: proposal.md still offers pi -e as a load route
    Family: hook-order
    Severity: Low
    In scope: YES
    Evidence:
    proposal.md › Impact › README bullet still says “how to load it with pi -e or…”.
    design.md and tasks.md 1.4 require loading through settings.extensions to get the right order.
    -e paths do not appear in the excerpted resolve() (package-manager.ts L920–967), so their order relative to packages is unverified.
    SUGGESTED_CORRECTION: Make settings.extensions the supported route, and mention pi -e only for ad-hoc tests, with the order caveat.
    N7
    Title: proposal.md’s fallback list lags the spec
    Family: doc-accuracy
    Severity: Low
    In scope: YES
    Evidence: proposal.md › What Changes › the fallback bullet omits the virtual-model fallback and the retries now in spec › Fallback and design.md.
    SUGGESTED_CORRECTION: Add “is a virtual model” and “fails after retries”.
    Coverage
    What I checked: I read all four updated files in full and the review log, and checked every accepted fix against evidence-02 and the round-1 evidence.
    Confirmed by evidence-02:
    Pi’s fromHook skip (L67–79).
    The classifier answer and stop-reason types (L679–684, L698).
    Packages resolve before top-level extensions (L925–966).
    The bridge’s cwd fallback (L36–38).
    nativeFallbackOrCancel’s two possible returns (L107–130).
    isVirtualModel (L105–106).
    The RetryPolicy shape (L9–17).
    The scope of the tsconfig, test script and manifest.
    Not checkable here:
    That resolve order equals handler registration order at runtime (2.2 verifies this).
    That withoutDeletedHeaders is unexported.
    Where cacheRetention: "none" is set (2.4’s spawn lines cover this).
    Whether stock 0.87.1 exports serializeConversation and convertToLlm (1.3’s typecheck will show).
    How effortForReasoning maps low (2.4 checks this).
    What context-mode and pi-subagents return. This is harmless now that this handler runs after them, though a cancel from either would still stop compaction.
    The bridge’s long-context mapping (N5).
    Why PASS: All seven new findings are Low and nonblocking. They are wording, test-list, evidence or verification-step edits that change no design decision, so they can be folded into wave 1 (1.3) and the 2.2–2.4 task text without another proposal round.
    
    PROPOSED_REVIEW_ACTION=PASS
    END_OF_REVIEW
    
    
    
    
    
    
    

---

## Caller Assessment — Round 2

Review mode: `change_bundle`. Convergence mode: `PATCH`. Reviewer proposal: `PASS` (candidate input only).

Fix verification: the reviewer reports F1–F4 and F6–F15 FIXED, and AGREE-REJECT for F5. No accepted blocker remains.

Caller verification for N4: `extensions/speak/index.ts:227` registers `session_before_compact` only to call `talk.setCompacting(true)` and returns nothing; session-delete, session-title, session-rename, and tool-block-borders do not register it.

| # | Family | Decision | GOVERNING_SOURCE | CORRECTION |
|---|---|---|---|---|
| N1 | file-ops-carryover | ACCEPT_NONBLOCKING | — | Design wording now separates pre-request fallbacks (Pi's own preparation) from a failed-request fallback (keeps restored lists); spec scenario narrowed to "the extension summarizes a second compaction"; 1.3 adds the failed-request case; 2.3 checks carried files live. |
| N2 | request-count-criterion | ACCEPT_NONBLOCKING | — | "plus any retries"; the bridge clause is scoped to a successful configured-model summary; the 2.4 Opus check is scoped to that compaction; the proposal Runtime bullet is reworded. |
| N3 | test-coverage | ACCEPT_NONBLOCKING | — | 1.3 adds non-reasoning, abort-after-Jev, unknown-key, and bridge-`off` cases; the outcome notification is counted separately from config warnings in spec, design, 1.3, and 2.4. |
| N4 | hook-inventory | ACCEPT_NONBLOCKING | — | The inventory lists `speak` (side effect only) and the four non-registering extensions; 2.2 appends compaction-model as the last `extensions` entry. |
| N5 | guard-arithmetic | ACCEPT_NONBLOCKING | — | 2.4 runs one >200K bridge compaction or records the residual risk; added to Risks. |
| N6 | hook-order | ACCEPT_NONBLOCKING | — | The proposal makes `settings.extensions` (last entry) the supported route; `pi -e` is for ad-hoc tests only. |
| N7 | doc-accuracy | ACCEPT_NONBLOCKING | — | The proposal fallback bullet adds the virtual-model and after-retries conditions. |

### Summary
- Accepted blocking: 0
- Accepted nonblocking: 7 (all applied)
- Deferred out of scope: 0
- Rejected: 0

PATCH_BASELINE_REVISION=sha256:39e0619921b5d321

Terminal baseline validation: BASELINE_TARGET, BASELINE_SOURCE, BASELINE_INCLUSION_PREDICATE, and BASELINE_EXCLUSIONS are unchanged from the frozen baseline. The current candidate equals the latest recorded revision sha256:39e0619921b5d321. The nonblocking wording and test-list edits after round 2 change no design decision and were not re-reviewed.

### Caller Result
REVIEW_ACTION=PASS
CONSENSUS_STATUS=MOSTLY_GOOD
