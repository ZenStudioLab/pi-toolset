# Wave 7 — global configurable model visibility

The user requested automatic case-insensitive `free` text matching, persistent unchecking, and enabling additional provider/model pairs, and selected the recommended global scope. This supersedes the fixed Zen whitelist. Orchestrator owns source/spec/tests/integration; the completed-wave Oracle review remains advisory.

## Implementation and evidence

`catalog.ts` retains the raw model display name separately from the provider-prefixed label. `model-preferences.ts` applies exact saved full-pair booleans first, otherwise checks `free` in raw ID/name (not provider name). It reads the extension-owned agent-directory `opencode-bridge.json` without creating it at discovery; explicit Save writes through a temporary file/rename, preserving valid saved state on write failure. Unavailable pairs' choices are retained and new matching entries get defaults. Global path uses Pi's public `getAgentDir()` (including PI_CODING_AGENT_DIR). Last-save-wins across simultaneous sessions is explicit; no watcher or lock framework.

`model-settings.ts` uses Pi-native select/confirm dialogs: choose provider, toggle `[x]`/`[ ]` rows with reported input/output/cache prices or unavailable label, confirm enabling paid/unknown pricing, Back then Save/Cancel/Reset. No custom renderer, dependency, browser page or visual styling system was added. Tests inspect dialog behavior/labels; no separate visual screenshot or manual TUI capture is claimed.

`index.ts` keeps the eligible discovery catalog distinct from visible registration, reads global choices on startup/refresh, registers the settings command, waits for idle before application, retires the old seam and publishes only visible models. It never selects another model or invokes inference from settings. Read/discovery/write failures preserve the last valid registration; malformed settings are not silently replaced. `provider-configuration.ts` no longer seeds a whitelist or enabled-provider list; existing operator OpenCode filters, endpoints and authentication remain intact. Settings can only offer eligible connected models inside those explicit filters; adding an unconnected endpoint/authentication belongs in OpenCode, as documented.

README and ADR document global storage, editing, override/reset behavior, old-environment-filter removal, Big Pickle no longer matching automatically, price/privacy limits, and authentication separation. Names containing free are not treated as a billing guarantee. No actual operator preferences or OpenCode files were changed; new settings writes occurred only in owned synthetic test directories.

Verification: typecheck passed4.67seconds. Focused checks passed10/10 including actual packed released Pi command execution. Cross-project settings integration passed separately. The complete standalone serial suite passed **65/65**, zero failures/cancellations, normal exit **109.71seconds**. Coverage includes explicit full-pair overrides, case matching, provider-name exclusion, new free discovery, temporary-unavailability retention, file read/write failures, cancel/reset, paid enable confirmation, an additional connected provider, restart/project reuse, failed refresh preservation and real packed command save/reload without inference. Prior controlled tool/retry/context/lifecycle suites also pass. The only edit after full-suite execution removed one extra space in a test loop; no behavioral change. Strict OpenSpec validation and root/standalone whitespace checks pass.

No external inference, credential/config inspection or dependency acquisition was needed. Foreign `tools/subagent-profiles/.gitignore` and `extensions/pi-voicekit/` remain untouched. Existing fixed-provider adapter and tool authority are unchanged.

## Frozen review boundary

BASELINE_TARGET=add-pi-opencode-bridge numbered Wave 7, global model visibility tasks 7.1-7.3
BASELINE_TARGET_REVISION=standalone candidate sha256:edc75a46ef3be81f8617bc58119ba2265c263f661bb89ff2515e0a1e40264416; base 5de08f3e5310f526fa8a8236ad82170d26c4a56a
BASELINE_SOURCE=Explicit user request for free-name automatic defaults, unchecking and additional provider/model choices with recommended global scope; canonical OpenSpec bundle sha256:3eff53dac1c22e007ad0cd59235f86ad0ac2398b2b71ff57560632bdbc4f169b
BASELINE_INCLUSION_PREDICATE=Global extension-owned visibility preferences, automatic raw-name/ID matching, native model settings dialogs and safe Save/Cancel/Reset, preservation of upstream filters/authentication and Pi selection/tool/runtime ownership, focused and packed/full regression evidence, accurate documentation and scoped post-acceptance publication/pin
BASELINE_EXCLUSIONS=New external inference, credential or OpenCode-file editing, unconnected-provider fabrication, new transport/model qualification, price-based billing enforcement, custom TUI renderer, root activation/dependency changes and foreign work

Digest recipe: sorted package-relative .gitignore/package.json/yarn.lock/tsconfig.json/README.md plus all files under src/test/docs/adr; path/NUL/bytes/NUL to SHA256. Canonical uses sorted root-relative owning proposal/design/tasks/spec paths, same encoding. First review FULL, zero rounds/rebuilds, existing four-round/one-rebuild cap. Parent owns all decisions and repository changes; no task checkboxes or publication until acceptance.

## Round 1 - Oracle Review

Run `0ff93e0b-bf67-4d54-be15-4d713e2d9cad` reported no requirement-backed P0–P3 findings. Independent checks covered matching/identity, global persistence, native draft dialogs, publication/idle lifecycle, selected-model preservation in released Pi, unchanged inference/runtime authority, source/test/docs consistency, whitespace, and before/after candidate/canonical hashes and literal fields. Four pure catalog/matching/dialog tests passed1.610seconds. The reviewer explicitly reused the supplied persistence/packed/full65-test evidence, with no new inference, operator-file inspection, source edits or manual-visual claim.

PROPOSED_REVIEW_ACTION=PASS

### Caller reconciliation

Parent independently verified candidate `edc75a46ef3be81f8617bc58119ba2265c263f661bb89ff2515e0a1e40264416`, canonical `3eff53dac1c22e007ad0cd59235f86ad0ac2398b2b71ff57560632bdbc4f169b`, and all four literal frozen boundary fields. Current candidate matches the reviewed finite target. No findings or accepted blockers remain; foreign files and empty staging were confirmed before scoped integration.

REVIEW_ACTION=PASS
CONSENSUS_STATUS=APPROVED

One round, zero rebuilds. Name-based defaults are not price enforcement; simultaneous saves remain last-save-wins, other sessions refresh/restart, and model availability remains bounded by upstream configuration/authentication. Those are documented boundaries, not claims of broader inference qualification.

### Integration completion

Published exact reviewed standalone candidate as `0637f8d431ce52b20302337bab11eb10a6da72dd` to existing private SSH main; remote matches local HEAD and standalone worktree is clean. Parent pin and tasks7.1–7.3 are updated in the scoped completion commit. No root activation, parent-remote push, real user settings creation, authentication change or additional inference occurred. Foreign files remain untouched.
