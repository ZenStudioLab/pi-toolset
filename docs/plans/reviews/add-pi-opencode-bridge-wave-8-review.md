# Wave 8 — whole-provider visibility choices

User requested selecting a whole provider in settings. Orchestrator added an optional global `providers` boolean map beneath explicit per-model choices and above automatic name matching. Existing models-only preference files still read unchanged. Provider rules apply to newly discovered eligible models but never bypass upstream authentication/filters.

The provider dialog now offers Enable whole provider, Disable whole provider and Reset provider to automatic. Whole-provider actions clear only that provider's previous model exceptions, including unavailable pairs, using its encoded identity prefix. Individual toggles can then create exceptions. Enabling always confirms inclusion of current/future paid or unknown-price models; Save/Cancel retain draft semantics. Global Reset clears both maps. No installation, activation, endpoint, tool or inference changes.

Typecheck passed4.78seconds. All10 affected preference/dialog/cross-project/packed-loader tests passed36.11seconds, zero failures/cancellations. Tests cover encoded provider isolation, enable/disable/reset, exception precedence, future models, confirmation denial/acceptance, legacy file reading and malformed provider data. Actual packed command enables all of opencode, unchecks one exception, discovers a newly introduced synthetic paid model via refresh without inference, and retains both rule/exception after reload. Existing lifecycle/tool checks pass for both packed routes. The preceding full65-test suite remains evidence for unchanged paths; this is not claimed as a new full-suite run. An initial test-only TypeScript narrowing error from assert.deepEqual was corrected by asserting on a cloned snapshot; no production change was needed. Strict OpenSpec validation and whitespace checks pass.

README/ADR/spec/design document precedence, clearing semantics and future paid-model warning. Foreign `.gitignore` and `extensions/pi-voicekit/` remain untouched. No actual operator settings, auth/config or external inference were used. The earlier question about global installation remains unanswered; source publication does not authorize installation or activation.

## Frozen review boundary

BASELINE_TARGET=add-pi-opencode-bridge numbered Wave 8, whole-provider visibility tasks 8.1-8.2
BASELINE_TARGET_REVISION=standalone candidate sha256:1d322db1b9b3580db95a2b19d5afe512d0ab93637567e9b1913370065babb20b; base 0637f8d431ce52b20302337bab11eb10a6da72dd
BASELINE_SOURCE=Explicit user request to choose a whole provider; canonical OpenSpec bundle sha256:1e4be88dde62c0125ce795477108dcd515e1ff0c4f7e16fc0816a12c3d568170
BASELINE_INCLUSION_PREDICATE=Optional persisted provider rules, model-over-provider-over-automatic precedence, confirmed whole-provider actions and scoped exception reset, legacy model-file preservation, focused/packed verification, documentation and scoped post-acceptance publication/pin
BASELINE_EXCLUSIONS=Installation or automatic activation, external inference, auth/endpoint changes, upstream-filter bypass, new transport qualification, price enforcement, custom TUI rendering, dependency changes and foreign work

Digest recipe unchanged: sorted package-relative .gitignore/package.json/yarn.lock/tsconfig.json/README.md and all src/test/docs/adr files; path/NUL/bytes/NUL to SHA256. Canonical uses sorted root-relative owning proposal/design/tasks/spec paths. FULL first review, zero rounds/rebuilds; existing four-round/one-rebuild cap. Parent owns edits and acceptance, Oracle advisory only.

## Round 1 - Oracle Review

Run `7a6e334b-8aaa-477c-b41d-3c0dac13bd70` reported no requirement-backed P0–P3 findings. Independent checks covered precedence, encoded-provider exception clearing, legacy persistence, native actions, unchanged authority paths, before/after hashes/literal boundaries and whitespace. Six pure preference/dialog tests passed1.503seconds; supplied persistence/packed/typecheck evidence was explicitly reused. No source changes, inference, operator-file inspection or installation occurred.

PROPOSED_REVIEW_ACTION=PASS

### Caller reconciliation

Parent independently recomputed candidate `1d322db1b9b3580db95a2b19d5afe512d0ab93637567e9b1913370065babb20b`, canonical `1e4be88dde62c0125ce795477108dcd515e1ff0c4f7e16fc0816a12c3d568170`, and compared all four literal boundary fields. Current target matches the reviewed candidate. No findings or accepted blockers remain. Foreign files and empty staging were confirmed before scoped publication.

REVIEW_ACTION=PASS
CONSENSUS_STATUS=APPROVED

One round, zero rebuilds. Whole-provider enabling intentionally includes future paid/unknown models; its confirmation is not billing enforcement. Existing global synchronization/native-rendering qualification limits remain documented. Installation is still outside this acceptance and has not been approved.

### Integration completion

Published exact reviewed standalone candidate as `868f707e69486348b78868907834adc00b42cfb5` to existing private SSH main. Local HEAD matches remote and standalone worktree is clean. Parent pin and tasks8.1–8.2 are updated in a scoped commit; root activation, real operator settings and foreign files are unchanged. No parent-remote push or extension installation occurred.
