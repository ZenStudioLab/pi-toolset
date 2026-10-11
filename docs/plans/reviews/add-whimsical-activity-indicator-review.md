# Proposal Review — add-whimsical-activity-indicator

Review mode: change_bundle. Convergence mode: FULL. Selected reviewer: `oracle`. Selected default implementation specialist: `worker` (user-approved override of unavailable `fixer`). Focus mode: normal.

BASELINE_TARGET=openspec/changes/add-whimsical-activity-indicator/{proposal.md,design.md,tasks.md,specs/whimsical-activity-indicator/spec.md,activity-words.json}
BASELINE_TARGET_REVISION=sha256:bd09b0a56f4419ab055c73fde3b84bdfbf928e4ffba7c1d9bbd723d80ea119bc
BASELINE_SOURCE=temp/implementation-spec.md; user-supplied complete JSON and static-bank constraints; user authorization for propose-loop, Oracle-gated apply-loop, worker override, and Git initialization; inspected pinned Pi 0.87.1 APIs
BASELINE_INCLUSION_PREDICATE=Full proposed static-bank native foreground UI feature, its 24 acceptance checks, narrow native editor/status compositor, mode/configuration behavior, lifecycle cleanup, feasibility, and ordered implementation tasks
BASELINE_EXCLUSIONS=Model/tool execution changes; prompt/conversation-driven selection; network word acquisition; host/dependency patches; personal settings; unrelated extensions; new frameworks/dependencies; persistence/telemetry; unsupported custom-editor composition

Candidate digest covers the five listed artifact/data files by sorted relative path plus NUL and exact content. Only target identity/revision is frozen; this is not a clean-working-tree requirement.

## Preparation Evidence

- `openspec validate add-whimsical-activity-indicator --strict --json`: passed, zero issues.
- `openspec instructions apply --change add-whimsical-activity-indicator --json`: state ready; proposal, delta spec, design, tasks are the canonical bundle, with 0/4 tasks complete.
- Supplied JSON: 100 case-insensitively unique entries; maximum 13 characters.
- ADR assessment: recorded in design; existing local Pi pattern, no separate ADR needed.
- Git baseline initialized and committed; mount ownership requires per-command `git -c safe.directory=<absolute checkout>` rather than global configuration changes.
- Existing `temp/` and untracked `openspec/config.yaml` are preserved and excluded from scoped commits.
- Session renaming is not exposed by this session's tools; no transcript/config file is edited to simulate it.

Implementation remains prohibited until the Oracle proposal review and caller reconciliation record a current PASS. The user authorized automatic continuation into `/opsx-apply-loop` afterward. `/<name>` may refer to either a registered command or a loaded skill, depending on the active toolset.

---

## Round 1 - Oracle Review

**Assessment:** Not apply-ready. The exported compositor seam exists, but editor migration and presentation-lifecycle assumptions are contradicted by pinned source.

### Inherited decisions

- Frozen five-file bundle at Git `bd81ed4`; its change-relative-path SHA-256 matches `bd09b0a56f4419ab055c73fde3b84bdfbf928e4ffba7c1d9bbd723d80ea119bc`.
- Authority remains `temp/implementation-spec.md` and the supplied static bank.
- Narrow local extension only: no host patches, private-field access, monkey-patching, prompt/model/network feature, dependencies, or framework.
- Preserve native status ownership, prompts, input, output modes, and lifecycle cleanup. Implementation owner remains `worker`; this review authorizes no execution.

### Coverage / uncovered areas

All five artifacts and the authority were read. Coverage includes:

| Acceptance family | Review coverage |
| --- | --- |
| AT01–AT07 | Asset, validation, exact-entry selection, shuffled bags, determinism, fallback, selection independence. JSON matches the authority: 100 unique entries, maximum 13 characters. |
| AT08–AT12 | Visibility/rotation deadlines, short runs, phase transitions, native animation, optional elapsed metadata. |
| AT13–AT17 | Prompt dispatch, settlement, owner replacement, cancellation, stale callbacks, disposal, late updates. Findings below. |
| AT18–AT22 | Width-aware border APIs, overflow priority, editor migration, regular/fullscreen source paths, reduced/plain/noninteractive modes, disable/unload. Findings below. |
| AT23–AT24 | Execution-neutral boundaries, existing offline fixtures and real-component tests, pinned/live compatibility separation. No dependency expansion is justified. |

Pinned `CustomEditor`, status indicators, `Loader`, native owner lifecycle, extension runner, agent-session event ordering, and editor contracts were inspected. Corresponding installed **0.99.2** compositor/status/loader source was also inspected; API presence is confirmed, not full compatibility.

**Uncovered:** No implementation exists to qualify. Actual PTY rendering, live loading/execution, accessibility announcements, and feature/regression tests were not run.

### Findings / diagnosis

#### O1 — Lossy editor replacement

- **Family / root:** `editor-preservation / raw-text-is-not-editor-state`
- **Severity:** High
- **In scope:** Yes — authority §9; delta specification “Layout preserves real status and editing behavior,” AT18/AT22.
- **Exact evidence:** `design.md:21,77` assumes installation at `session_start` precedes editing. However, pinned `interactive-mode.js:675–752` starts the UI before awaited startup work and extension initialization. Its `setCustomEditorComponent`, lines **2155–2170**, transfers `getText()` into `setText()`; restoration similarly uses raw text at **2207–2209**. Pinned `editor.js:898–930` stores paste expansion separately and clears that registry during `setText()`.
- **Observed reproduction:** An in-memory probe invoking the actual pinned host setter transferred a 1,100-character collapsed paste:
  - Before replacement: raw `[paste #1 1100 chars]`, expanded length **1100**.
  - After replacement: identical raw marker, expanded length **21**.
  
  Nonterminal cursor positions likewise are not transferred. Inheriting input methods does not prevent migration-time loss.
- **SUGGESTED_CORRECTION:** Resolve installation/restoration safety before implementation: establish a supported lossless handoff or a safe transition policy that retains the current editor when live edit state cannot be preserved. Include startup typing, collapsed paste, cursor position, and unload restoration in qualification. Do not access private editor state.

#### O2 — Status attachment does not notify compositor detachment

- **Family / root:** `presentation-ownership / attachment-is-not-mount-lifecycle`
- **Severity:** High
- **In scope:** Yes — authority §§5/11; delta lifecycle-cleanup requirement, AT14–AT16/AT22.
- **Exact evidence:** `design.md:29,54–58,72` relies on attachment clearing/replacement to suspend presentation and avoid obsolete-owner operations. Pinned `interactive-mode.js:2155–2220` replaces the editor without clearing or disposing the previous custom editor. `setEditorWorkingStatusIndicator`, lines **1699–1704**, clears only `defaultEditor` and attaches to the **new current editor**. `EditorComponent`/`Component` declare no editor-unmount callback.
- **Observed reproduction:** Replacing an attached custom editor through the actual pinned host setter produced **zero clearing notifications to the old editor**, while the same native owner remained active and moved to the new editor. Old run/owner tokens therefore need not become stale. Their callbacks could continue selecting words or stopping/restarting an owner now rendered elsewhere.
- **SUGGESTED_CORRECTION:** Establish an evidenced compositor-detachment/ownership-loss strategy. Every delayed callback must additionally verify current factory ownership before selection, rendering, or native-loader mutation; ownership loss must not stop the transferred native owner. Identify how required unmount cleanup occurs without assuming a host notification that does not exist.

#### O3 — Prompt notification delivery can reverse lifecycle order

- **Family / root:** `prompt-precedence / asynchronous-notifications-are-not-ordered-wait-state`
- **Severity:** High
- **In scope:** Yes — authority §§5/11; delta waiting requirement, AT13–AT15.
- **Exact evidence:** `design.md:44` recognizes microtask delivery but resumes using run/owner/eligibility/busy checks. Pinned `runner.js:328–358` dispatches prompt events through independent fire-and-forget microtasks. `emit`, lines **716–722**, awaits preceding extension handlers. These events contain no prompt-generation identifier (`types.d.ts:627–641`).
- **Observed reproduction:** Using actual `ExtensionRunner.withUIPrompt`, `emitUIPromptEvent`, and `emit`, an earlier asynchronous start handler caused a later observer to receive **`end`, then `start`**. This involved a supported Pi confirmation lifecycle, not an unsupported third-party wait. Run and native-owner identities were unchanged.
- **SUGGESTED_CORRECTION:** Specify a supported authoritative presentation/wait gate resilient to delayed or reordered notifications, and test this dispatch ordering through the real runner. Boolean suppression or notification counting alone is insufficient. Do not claim immediate prompt suppression/resume solely from these events; report an integration gap if the required signal is unavailable.

#### O4 — Clock-derived animation recovery remains unresolved

- **Family / root:** `timing-contract / native-frame-ticks-are-not-clock-derived`
- **Severity:** Medium
- **In scope:** Yes — authority §6 and AT17.
- **Exact evidence:** Authority §6 requires deriving the current frame from the clock after suspension. `design.md:56,70` mandates unchanged native animation. Pinned `loader.js:63–67` advances `currentFrame` by one per interval callback; `loader.d.ts` makes frame state private and exposes no clock/frame-seek API. The delta’s late-callback scenario addresses word rotations but omits this frame requirement.
- **SUGGESTED_CORRECTION:** Resolve and document this narrow authority mismatch: provide a supported clock-derived presentation approach or obtain explicit approval to retain native tick-based animation. Do not claim native reuse already satisfies clock-derived recovery.

### Drift / contradiction check

The static-bank and execution-neutral decisions remain consistent. The material drift is treating a supported **rendering seam** as sufficient evidence of lossless editor migration and complete presentation-lifecycle authority. The bundle’s “test and stop if unsupported” escape clause does not resolve these already-observed contradictions before application.

### Recommendation

**Rebuild the bounded integration design**, retaining the same feature authority and exclusions. Resolve O1–O3 against supported APIs before assigning implementation; do not patch dependencies or silently relax preservation/wait requirements.

No executor handoff is warranted yet. Caller reconciliation is the next step.

### Validation notes / residual risks

- Strict OpenSpec validation passed; apply instructions report ready, **0/4 tasks complete**. These establish bundle structure, not runtime feasibility.
- Initial native probes failed because inherited `PI_PACKAGE_DIR` selected live 0.99.2 theme assets for pinned 0.87.1 code. Command-local removal of that override allowed the pinned probes to pass. No settings or dependencies were changed; qualification must isolate this version contamination.
- Regular/fullscreen rendering, native cancellation delegation, retry countdown preservation, accessibility modes, and actual 0.99.2 execution remain implementation qualifications.
- Project files and staging were unchanged.

PROPOSED_REVIEW_ACTION=REBUILD

---

## Caller Assessment — Round 1

Review mode: change_bundle. Convergence mode: FULL. Terminal child `6cea9fec-389e-4d7b-a110-21b7cd35466c` is completed; the read-only result reports no project/staging writes. Its managed output was read and the single advisory proposal was appended above. No implementation job was launched.

### O1 — Editor preservation

- **Family:** `editor-preservation / raw-text-is-not-editor-state`.
- **GOVERNING_SOURCE:** User instruction to preserve keyboard focus/editing buffer; `temp/implementation-spec.md` §9; delta layout requirement and AT18/AT22.
- **Decision:** ACCEPT_BLOCKING (High).
- **CORRECTION:** Replace the lossy migration assumption with an evidenced supported handoff or an explicit safe transition policy that leaves live edit state intact. Test startup input, collapsed paste, cursor, and unload behavior. Native input inheritance is not proof of safe state transfer.

### O2 — Actual compositor ownership

- **Family:** `presentation-ownership / attachment-is-not-mount-lifecycle`.
- **GOVERNING_SOURCE:** `temp/implementation-spec.md` §§5/11; delta scheduled-work and reversible-feature requirements, AT14–AT16/AT22.
- **Decision:** ACCEPT_BLOCKING (High).
- **CORRECTION:** Establish actual current-factory/mount ownership checks and an evidenced cleanup signal. On ownership loss, stop owned callbacks without stopping/restarting the native owner transferred to another editor. Do not assume an unmount callback absent from the host contract.

### O3 — Authoritative wait state

- **Family:** `prompt-precedence / asynchronous-notifications-are-not-ordered-wait-state`.
- **GOVERNING_SOURCE:** User permission/user-input precedence table; `temp/implementation-spec.md` §§5/11; delta wait/cleanup requirements, AT13–AT15.
- **Decision:** ACCEPT_BLOCKING (High).
- **CORRECTION:** Establish a supported presentation gate resilient to delayed/reordered prompt notifications. Test the real runner's end-before-start dispatch. A boolean or unsigned event counter cannot be accepted as authoritative wait state.

### O4 — Native frame recovery

- **Family:** `timing-contract / native-frame-ticks-are-not-clock-derived`.
- **GOVERNING_SOURCE:** `temp/implementation-spec.md` §6, alongside the user's explicit permission to reuse native animation.
- **Decision:** ACCEPT_NONBLOCKING (Medium).
- **CORRECTION:** Keep the discrepancy visible during redesign. Do not claim native animation is clock-derived; choose a supported compliant presentation or obtain explicit approval for the narrower native-cadence interpretation. This does not authorize private frame access or a new spinner dependency.

### Caller Result

Accepted blocking: 3. Accepted nonblocking: 1. Deferred: 0. Rejected: 0.

REVIEW_ACTION=REBUILD
CONSENSUS_STATUS=NEEDS_REVISION

## Rebuild Preparation

The narrow PATCH worklist is invalidated. The feature authority and static-bank/execution-neutral exclusions remain unchanged; the disproven editor-migration and attachment-lifecycle assumptions are not accepted implementation authority.

The complete correction batch is O1 (safe state handoff), O2 (actual compositor ownership/cleanup), and O3 (authoritative wait gating), with O4 retained as a declared timing discrepancy. A supported alternative must be evidenced before candidate edits or another FULL review. No implementation is authorized by the structural OpenSpec ready state.

Parent follow-up inspection confirms exported TUI `getFocusedComponent`, `setFocus`, and `hasOverlay` exist. Focus is potential evidence, not yet proof of all blocking wait state: noncapturing custom overlays and asynchronous notifications must be covered or explicitly excluded by an approved scope decision. A bounded same-Oracle design consultation will assess these existing public seams before requesting a user scope/source decision.

Baseline regression check completed independently during review: `npm run check` passed typecheck and all 28 existing tests (0 failures). This is pre-feature evidence only.

## Consultation Interruption and Recovery

The mission record reports consultation workflow `1dd60d37-62fa-42e5-a73d-213373e0a248` stopped because the extension session was replaced or reloaded. No final consultation output or workflow receipt is present; its child running heartbeat is stale under that stopped workflow, not evidence of a live worker. Current Git status contains only the preserved untracked `openspec/config.yaml` and `temp/`; no partial source/target edits occurred.

The user requested continuation. The restored runtime lists the same registered `oracle` and `worker` profiles. Restart only the unfinished read-only consultation with a fresh Oracle under the same subagent protocol, scope, model profile, and 30-minute deadline; do not revive the cancelled consultation or rerun the completed first proposal review. The completed Round 1 evidence and caller reconciliation above remain authoritative.

## Integration Consultation Reconciliation

Recovered workflow `c03b32d4-fa2b-4b05-a139-d8032feaef68` and read-only Oracle child `8dac2235-859d-494f-a359-41fc8b3e61fc` completed. Its managed output was read in full. The child was explicitly allowed to use its existing bounded read/bash tools after reporting missing context-mode tools; agent, model profile, scope, and subagent protocol were unchanged. No project/source edits were made. Current diff contains only this caller review-log update, with the same preserved untracked input/config paths.

The consultation confirms that existing public APIs support a bounded compositor but not the entire contract. Native probes found that a public focus-aware shell can preserve editing state and observe capturing dialogs, but noncapturing overlays produce no focus transitions, hidden overlays are absent from `hasOverlay`, and custom UI reports waiting before its asynchronous factory mounts. Real runner probes reproduced end-before-start prompt delivery. Factory/instance checks can prevent stale mutations but do not provide a complete reversible lifecycle for a native loader already paused before transfer. Unload/reload still invokes the lossy host editor replacement path.

**Caller assessment:** This supports the existing O1–O3 blockers rather than a second review round or PASS. O4 remains a declared native-frame timing discrepancy. Source inspection of live 0.99.2 found equivalent gaps; no live PTY or feature suite was run. The existing data/selector contract remains valid, but implementation cannot be authorized from a structurally ready bundle whose integration design is disproven.

### Required User Decision — Integration Scope

One unresolved decision owns the pause:

1. Preserve the full feature contract and explicitly extend scope to an owning Pi source checkout, adding narrow native-status decoration lifecycle and authoritative synchronous wait-state hooks. No installed-release/dependency patch is authorized.
2. Remain extension-only and explicitly approve reduced guarantees: conditional empty-editor installation, restricted focus-observable wait coverage, revised unload/native-animation ownership behavior, and native tick-based animation. Amend the owning specification before another review; this is not full original compliance.
3. Choose another approach or stop the feature.

At this pause the user had not selected a scope. The subsequent user answer **A** resolves it in favor of option 1: preserve the complete contract and extend the owning Pi source. This permits the rebuilt proposal below, not implementation or an implied Oracle PASS.

## Source-Scope Rebuild — Caller-Owned Complete Batch

The prior incremental worklist is stopped. The extension-only boundary is invalid: supported exported editor rendering does not provide lossless installation/removal or authoritative synchronous wait state. The explicit user choice A changes source ownership; no requirement is silently narrowed.

The approved source checkout is the separate nested repository `host/pi`, from official `https://github.com/earendil-works/pi.git` tag v0.99.2, verified base `005af57d88ee23b33778f343a9595b32e67ff788`. No existing checkout was found. Only source was cloned/checked out, with hooks disabled; no dependency hydration, lifecycle script, build, or host feature test has run. The task-owned clone was moved into `host/pi` because context tools could not read its former sibling path. Outer `.gitignore` excludes `/host/pi/`; user-owned input/config files remain untouched. Host Git status is clean.

BASELINE_TARGET=openspec/changes/add-whimsical-activity-indicator/{proposal.md,design.md,tasks.md,specs/whimsical-activity-indicator/spec.md,activity-words.json}
BASELINE_TARGET_REVISION=sha256:6abc9353ba9cb1bc7588f7ee13020d275fa40ab2fd173ebc2f991938d7c14163
BASELINE_SOURCE=temp/implementation-spec.md; user-supplied complete JSON and static-bank constraints; user-selected full-contract source scope A; user authorization for propose-loop, Oracle-gated apply-loop, worker override, and Git initialization; approved Pi v0.99.2 source at 005af57d88ee23b33778f343a9595b32e67ff788
BASELINE_INCLUSION_PREDICATE=Full static-bank native foreground UI feature and 24 acceptance checks; narrow supported host decoration lifecycle and synchronous wait authority; clock-derived native animation; local extension selector/controller; two ordered implementation waves and cross-repository ADR
BASELINE_EXCLUSIONS=Model/tool/provider execution changes; prompt/conversation-driven selection; network word acquisition; installed-release patches or installation/publishing; dependency pins/lockfile changes; personal settings; unrelated extensions/editor fixes; new frameworks/dependencies; persistence/telemetry; silent custom-UI replacement

The complete caller-owned correction batch against this rebuilt boundary is:

- **O1 ACCEPT_BLOCKING:** Replace the CustomEditor-factory migration with native status decoration registration/removal that never replaces the editor. Keep startup typing, live cursor/paste, autocomplete and unload checks.
- **O2 ACCEPT_BLOCKING:** Host-own the registration and status generation; synchronously revoke/dispose callbacks on owner loss/reset/shutdown. The extension gets scoped presentation updates, never transferred native loader control.
- **O3 ACCEPT_BLOCKING:** Observe producer-owned wait depth synchronously in the runner and native UI transitions; legacy asynchronous notifications remain informational. Include overlapping waits, custom asynchronous factories, noncapturing/hidden overlays and late completion checks.
- **O4 ACCEPT_NONBLOCKING, resolved in the same source redesign:** Use monotonic-clock-derived native Loader frames at the existing cadence; test delayed ticks and start/stop/replacement. No independent spinner or private-frame access.

BASELINE_REBUILD_COMPLETE=YES

The orchestrator applied this complete batch locally to the owning proposal/design/spec/tasks. The bank is unchanged. The host integration responsibility is explicit, not an extension feasibility escape clause. Tasks now contain a host wave and an extension/qualification wave, each with one final Oracle gate; ADR assessment changed to require an orchestrator-owned integration ADR first during apply. No feature code was edited, no worker remediation was dispatched, and no host/live-release execution is claimed.

Rebuilt bundle verification: strict OpenSpec validation passed with zero issues; canonical apply instructions report ready, 0/8 tasks complete. Bank validation reports 100 unique entries and maximum 13 characters. Next review is Round 2 in FULL mode, within the existing four-round sequence and its single completed rebuild. A recurring structural blocker after this rebuild requires caller-owned HUMAN_DECISION, not another automatic rebuild.

Selected reviewer: `oracle`. Selected implementation specialist: `worker` (explicit user-approved override). Focus mode: normal. Implementation and `/opsx-apply-loop` remain gated by current proposal PASS and caller reconciliation.

---

## Round 2 - Oracle Review

**Assessment:** Proposal PASS recommended; no Critical/High blockers or other findings. This is not implementation acceptance or installation/publication authorization.

Full read-only report: `/home/zenji/.pi/agent/sessions/--mnt-8CE085C2E085B2CE-Src-Tools-pi--/subagent-artifacts/outputs/6e5c6f3a-1541-492c-b94c-495402a91b59/oracle/proposal-round-2.md`. Workflow `6e5c6f3a-1541-492c-b94c-495402a91b59`, child `03bfd5e7-0944-4902-8900-6a67dc6711e3`, completed. The caller read all 123 report lines; this section records its bounded conclusion and evidence.

Oracle independently reproduced the frozen candidate digest and bank cardinality/uniqueness/maximum length. It reviewed all five artifacts, authority, previous dispositions and source boundary. O1–O3 are addressed architecturally through no-editor-replacement registration, host-owned revocation/scoped generations, and synchronous producer wait state; O4 is addressed through the approved native Loader source change. These are proposal resolutions, not implemented fixes.

The reviewed authority inventory includes runner select/confirm/input/editor/custom waits; direct native dialogs at `interactive-mode.ts:2598–2767`; general selectors at `4742–4776`; asynchronous custom UI at `2863–2941`; authentication at `6015–6206`; delegated share/bug-report UI at `6393–6415`; terminal-hidden/external-editor paths at `4310–4347,4465–4485`; foreground native transitions at `3311–3683`; reset/rebind/shutdown and no-op/RPC consumers. All remain within the producer/visibility obligations already specified, not new execution-lifecycle requirements.

Coverage: all AT01–AT24 families, task dependencies, cross-repository ownership, supported API feasibility, and native wait/render boundaries. No findings, contradictory requirements, or unapproved scope reduction were identified. Highest implementation risks remain late custom factories, direct/delegated dialogs, Loader restart semantics, and source/package resolution.

Unverified: feature tests, dependency hydration, host execution, PTY rendering, builds and live release compatibility. Oracle reports no project/source/review/staging/settings/dependency writes and no host execution.

PROPOSED_REVIEW_ACTION=PASS

## Caller Assessment — Round 2

Review mode: change_bundle. Convergence mode: FULL. Completed child/workflow reconciled as read-only: managed report read completely, no partial writes, host remains clean, and outer changes are the scoped proposal/review/ignore edits. No findings require disposition. Accepted blocking: 0; accepted nonblocking: 0; deferred: 0; rejected: 0.

Terminal baseline validation: the current five-file target, authoritative source (including user-selected A and verified source base), inclusion predicate, and exclusions literally match the rebuilt fields above. The recomputed candidate remains `sha256:6abc9353ba9cb1bc7588f7ee13020d275fa40ab2fd173ebc2f991938d7c14163`, matching both latest recorded revision and Oracle's independent result. The source pivot did not change the supplied bank or reduce the 24 checks.

REVIEW_ACTION=PASS
CONSENSUS_STATUS=APPROVED

The proposal sequence closes after two review rounds and one rebuild. The user-authorized `/opsx-apply-loop` may begin with the orchestrator ADR and native source wave. Proposal PASS does not establish implemented behavior, authorize installation/publishing, or waive source-host execution/commit approval rules.

---

## Approved Settings and Presets Amendment — Proposal Review Preparation

The user confirmed the configurable whimsical design, corrected accidental routing away from this feature, and explicitly requested `amend`. Capture scope is this change's proposal, design, delta spec and tasks plus the existing proposal review record. Earlier original-feature waves remain complete at root `90151f0` and host `04ef561`; pending wave 3 is not implemented. The user requested automatic `/opsx-apply-loop` after current Oracle proposal PASS and caller reconciliation; this is not authorization to apply the stale original proposal result.

BASELINE_INVALIDATED=YES

The earlier terminal proposal boundary excluded persistence and assumed generic native Working plus whimsical decoration. The approved amendment permits host-managed preference persistence only for explicit user choices, host-marked generic Working replacement, ten presets/Random, timing modes, previews and color/motion choices. Those user-approved changes require a current FULL review; prior PASS cannot authorize them. The original bank/execution/source-host constraints remain.

BASELINE_TARGET=openspec/changes/add-whimsical-activity-indicator/{proposal.md,design.md,tasks.md,specs/whimsical-activity-indicator/spec.md,activity-words.json}
BASELINE_TARGET_REVISION=sha256:cb51d537e1216e0c2b0c97b1a514965819b2df3a1add559a17687b306066708b
BASELINE_SOURCE=original supplied static-bank authority and source scope A; user-approved whimsical settings/presets/random timing design and amend request; committed original root 90151f0 and host 04ef561; inspected native settings/decoration/rendering/animation code; observed Claude Code 2.1.287 terracotta literal
BASELINE_INCLUSION_PREDICATE=whole amended apply-ready bundle; preserved AT01–AT24 and new AM01–AM12; native persisted settings/preview/preset/text/color/motion behavior; independent local animation/word selection; ordered pending wave 3 and one final whole-wave Oracle gate
BASELINE_EXCLUSIONS=agent/tool/provider/prompt execution changes; conversation-driven selection; runtime/build word/color retrieval or generation; installed-release edits/install/publish; dependencies/lockfiles; unrelated settings/editor refactors; real personal-settings edits by agents/tests; bank/history persistence; telemetry; foreign/untracked work

Candidate digest hashes sorted change-relative file paths, NUL, then exact contents of the five listed files. All four canonical apply context files exist; the fifth file is unchanged bank authority. Strict OpenSpec validation passes with zero issues. Apply state is ready, 8/12 complete, with only new wave 3 pending. Runtime bank remains byte-equal to the proposal bank; source host remains clean; no feature code or real settings were changed. Both repositories' whitespace checks pass.

Source evidence: SettingsManager owns merged persistent settings; SettingsSelectorComponent owns native submenus; NativeActivityDecoration owns run/wait/scoped updates; StatusIndicator renders both native surfaces and Loader already accepts clock-derived local frames. Generic Working must be marked at its producer rather than inferred from message contents, preserving custom working text and interrupt hints. Local binary read-only inspection confirms `claude:"rgb(215,119,87)"` and another theme literal, so the proposal names a verified swatch without claiming a universal exact Claude animation/theme.

ADR assessment: ADR-0009 remains the accepted host-ownership boundary. This is configuration/presentation within that boundary, not a new persistence system or architectural pattern; no additional ADR/edit is required. Task recommendation: selected default implementation specialist `worker`, explicitly opted into coherent logic and terminal-UI responsibility with real rendered evidence; no competing writer. Selected reviewer: `oracle`. Focus mode: normal.

Review mode is change_bundle/FULL. Preserve the existing log's two Oracle sections and one completed rebuild: the next review is Round 3, with Round 4 the final automatic review if remediation is needed. Do not create an automatic fifth round or second rebuild. Any terminal decision must compare this current literal boundary and latest candidate revision. The reviewer returns advisory findings only; the orchestrator owns all target edits, finding decisions and authoritative action.

## Round 3 - Oracle Review

FULL review of the amended change bundle recommends PASS, with no Critical/High/Medium/Low findings. Workflow `17a8ad4e-69b3-4736-8a02-890813a8227e` and read-only child `33eea003-6f0d-4f5c-b9a9-2bacbc81b005` completed successfully. The full 62-line report is the managed `oracle/whimsical-amendment-proposal-round-3.md` output under that workflow; the parent read it completely.

Oracle independently confirmed candidate `sha256:cb51d537e1216e0c2b0c97b1a514965819b2df3a1add559a17687b306066708b`, complete 100-entry bank/max13 and unchanged runtime-bank equality. It reviewed all five artifacts, original authority, latest baseline, ADR, relevant guidance and actual native settings/selector/decoration/status/Loader source and tests. Native nested persistence, submenu/highlight callbacks, selector disposal ownership, producer-marked Working, scoped lifecycle updates and native clock-derived frames support this bounded plan.

Coverage includes AT01–AT24 and AM01–AM12, both repositories and all proposed choices/defaults/ownership. CLI-only/append-only constraints are explicitly superseded consistently, not silently relaxed. No new framework, unrelated refactor or ADR is warranted. Preview cleanup must be wired explicitly because closing a settings submenu does not automatically dispose it. Other implementation risks are custom-message/hint separation, absent/explicit flags, independent deadlines and live preferences without controller reconstruction; pending tasks already require qualification of these risks.

Unverified: all wave-3 behavior, captures, tests/checks, PTY and installed releases. Oracle executed no tests/builds/providers/installations/settings writes and made no project mutations. This is proposal feasibility, not implementation PASS.

PROPOSED_REVIEW_ACTION=PASS

## Caller Assessment — Round 3

Review mode: change_bundle. Convergence mode: FULL. Terminal workflow/child reconciled: full result read, read-only scope confirmed by current status, no partial source writes or staging, and source host clean at `04ef561b360a233254187d63ce1b575058e387b0`. Root remains at `90151f0d2baf1acec21692c0c163192fc8658e5f` with only the intended four artifact amendments and this review record modified; foreign untracked work is preserved.

Findings: none. Accepted blocking: 0; accepted nonblocking: 0; deferred: 0; rejected: 0. No correction dispatch or additional proposal review is needed.

Terminal baseline validation: the five-file target, authority/source, whole-amended-bundle inclusion predicate and exclusions literally match the current Approved Settings and Presets Amendment fields. Parent independently recomputed candidate `sha256:cb51d537e1216e0c2b0c97b1a514965819b2df3a1add559a17687b306066708b`, equal to the latest recorded revision and Oracle result. No target/boundary/candidate mismatch exists.

REVIEW_ACTION=PASS
CONSENSUS_STATUS=APPROVED

This current proposal PASS covers the approved amendment and permits the user-requested automatic `/opsx-apply-loop add-whimsical-activity-indicator`. Begin pending numbered wave 3, reserve gate 3.4 until all non-gate assignments and evidence are complete, and preserve completed waves 1–2. No wave-3 checkbox, runtime qualification, source-host commit permission, installed-release update or publication is inferred merely from this proposal result.

## Foreground Metadata Amendment — Proposal Review Preparation

The user requested elapsed seconds, current tool/action names and output tokens on the whimsical activity line, selected current tool/action names rather than streamed text, invoked propose-loop, and explicitly requested amending the spec. Scope is the four owning artifacts plus this proposal review record. No implementation is authorized in this invocation. Completed waves 1–3 remain historical; only the four wave-4 tasks are pending.

BASELINE_INVALIDATED=YES

The earlier proposal PASS excluded adding an ordinary-activity elapsed counter and did not qualify foreground metadata. The new approved scope supersedes that restriction; prior proposal and implementation PASS cannot qualify it.

BASELINE_TARGET=openspec/changes/add-whimsical-activity-indicator/{proposal.md,design.md,tasks.md,specs/whimsical-activity-indicator/spec.md,activity-words.json}
BASELINE_TARGET_REVISION=sha256:8a54f7fa885773e75778eddb9d7a22f1d0b52cddeec77829b795901a696fe68f
BASELINE_SOURCE=original supplied static-bank authority and approved source scope A; completed settings/presets waves; user-requested elapsed seconds/current tool-action/output usage and explicit amendment/propose-loop request; current source native decoration, InteractiveMode message/tool events, footer session accounting and provider scalar usage
BASELINE_INCLUSION_PREDICATE=whole amended apply-ready bundle; preserved AT01–AT24 and AM01–AM12 plus MD01–MD08; native foreground elapsed/action/reported output subtotal and three persistent toggles; current source feasibility, lifecycle/output/layout neutrality and one pending wave-4 whole-wave Oracle gate
BASELINE_EXCLUSIONS=implementation in this invocation; agent/tool/provider/prompt execution or provider/usage-schema changes; generated summaries or prompt/text/argument-driven selection; token estimates/tokenizers; new requests/dependencies/frameworks; bank expansion; installed releases/install/publish; unrelated editor/settings fixes; real personal-settings edits by agents/tests; telemetry; foreign/untracked work

Digest method is unchanged: SHA256 of sorted five change-relative paths, each followed by NUL and exact file contents. Parent strict OpenSpec validation passes, candidate digest is recorded above, and proposal/runtime banks remain byte-equal. Canonical apply bundle is proposal.md, design.md, specs/whimsical-activity-indicator/spec.md and tasks.md under the change root; state ready, 12/16 complete. This amendment changed only those four documents so far, not source, tests, bank, settings or dependencies. Existing root/host modifications and foreign untracked paths are preserved. Read-only git inspection uses per-command safe.directory for the exact repository paths because the sandbox reports dubious ownership; no global configuration is changed.

Source evidence: InteractiveMode receives existing message_start/update/end and tool_execution_start/update/end; NativeActivityDecoration already owns foreground/native run identity, waits and stale scoped handles. StatusIndicator supports both render paths. Footer totals persisted session usage, distinct from the proposed reported run subtotal. Anthropic adapter updates scalar output usage from provider message events; OpenAI adapters receive response/final chunk usage. Initial zeros do not prove live measurement; proposal omits unreported output and promises no continuously exact count. No content reaches the selector, and no provider change is proposed.

ADR assessment performed with architecture-decision-records and accepted docs/adr/0009-native-activity-decoration.md: this is host-owned observation/presentation with existing persistence, not a new architectural pattern or authority; no new ADR or edit to the accepted record. Registered worker supports the explicitly opted-in logic/terminal-UI slices with real rendering evidence. Registered oracle is independent and read-only. Selected reviewer: oracle. Selected default implementation specialist: worker. Focus mode: normal.

Invoking the global /omo-plan-review contract in change_bundle/FULL mode against this exact bundle. The existing log contains three Oracle rounds and one completed rebuild. This is Round 4, the final automatic review in this sequence; do not invent Round 5, a second rebuild, or silently restart the sequence. Any accepted blocker remaining requires caller-owned HUMAN_DECISION, not an automatic additional cycle. Oracle is advisory; only parent reconciliation and current literal boundary/revision validation can produce terminal PASS. The read-only Oracle report is bound to a managed output artifact; the orchestrator appends it and reconciliation here.

## Round 4 - Oracle Review

FULL proposal feasibility review recommends PASS with no Critical, High, Medium or Low findings. Read-only run `321c4d3d-54ab-4aad-a1b4-e3548467b8f3` completed; the full 55-line report was read by the parent and is preserved at `/home/zenji/.pi/agent/sessions/--mnt-8CE085C2E085B2CE-Src-Tools-pi--/subagent-artifacts/outputs/321c4d3d-54ab-4aad-a1b4-e3548467b8f3/oracle/whimsical-metadata-proposal-round-4.md`.

Oracle independently reproduced candidate `sha256:8a54f7fa885773e75778eddb9d7a22f1d0b52cddeec77829b795901a696fe68f` and checked the complete canonical bundle, original authority, supporting bank, latest baseline, previous dispositions, ADR, and relevant source/test facilities. Its review covered AT01–AT24, AM01–AM12 and MD01–MD08 holistically: run lifetime, concurrency, authoritative action names, reported output accounting, settings/rendering, footer separation, accessibility, suppression and task verification. It confirmed unchanged bank bytes/count/max-length and empty staging, without requiring clean working trees.

Feasibility evidence: NativeActivityDecoration already provides run/generation/reset boundaries; InteractiveMode receives real top-level/nested tool identity events; agent-loop response start/update/end supports per-response accounting; provider adapters expose scalar usage at differing report times; native render/settings and offline source fixtures cover the integration. The plan explicitly supersedes the no-new-elapsed-counter restriction and preserves native message priority and static-selection independence. ADR-0009 continues to apply.

Findings: none. Implementation risks already assigned to pending tasks are response-lifetime tracking rather than shallow-cloned snapshot object identity, rejecting obsolete/nested observations, and real Reduced/wait/overflow/both-surface qualification. These are not omitted requirements or new blockers. LSP/AST tools were unavailable; the reviewer used the bounded read-only tools authorized by the parent. It ran no tests/builds/provider calls/network/scripts/fixtures/settings writes and did not rerun parent OpenSpec validation. This is proposal PASS, not runtime qualification or implementation authorization.

PROPOSED_REVIEW_ACTION=PASS

## Caller Assessment — Round 4

Review mode: change_bundle. Convergence mode: FULL. Review subject: add-whimsical-activity-indicator, foreground-metadata amendment.

Terminal reconciliation: run state complete and process terminal observed; full result read; read-only scope and no source/settings/test writes confirmed. Current root/host statuses retain the pre-review modifications and foreign/untracked paths. No retry, recovery, correction dispatch or additional review is needed.

Per-issue evaluation: no findings. Accepted blocking: 0; accepted nonblocking: 0; deferred: 0; rejected: 0. The implementation cautions remain within existing pending tasks, not a widened acceptance boundary.

Terminal baseline validation: target, source, inclusion predicate and exclusions literally match the latest Foreground Metadata Amendment preparation and current intended scope. Parent recomputed the five-file candidate as `sha256:8a54f7fa885773e75778eddb9d7a22f1d0b52cddeec77829b795901a696fe68f`, equal to the latest recorded revision and Oracle's independently reproduced revision. Bank equality remains true. The current review is valid; no stale prior PASS is used.

REVIEW_ACTION=PASS
CONSENSUS_STATUS=APPROVED

The four-artifact bundle is apply-ready with 12/16 tasks complete and four pending wave-4 tasks. Strict OpenSpec validation and scoped artifact whitespace checks passed; metadata runtime behavior remains unimplemented/unverified. This proposal-only invocation stops here. A new user request for `/opsx-apply-loop add-whimsical-activity-indicator` may start wave 4; no commit/install/publish authority is inferred.

Local tracking-plan event record (no runtime telemetry or external transmission): `feature_used`, properties `{"feature_name":"opsx-propose-loop","change_name":"add-whimsical-activity-indicator","outcome":"approved"}`, trigger: caller-reconciled proposal PASS after Round 4.
