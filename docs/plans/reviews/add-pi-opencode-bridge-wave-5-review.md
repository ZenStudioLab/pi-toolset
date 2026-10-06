# Wave 5 — free Muse extension defaults

The user rejected the provider-only launch filter because it still showed paid models, then explicitly asked to make the supplied Zen/Muse whitelist setting the extension default. This follow-up defaults only bridge discovery to `opencode/muse-spark-1.3-contributor-free`; it does not change Pi-native provider visibility or user-owned configuration. Explicit operator enabled-provider/whitelist values retain normal precedence. Orchestrator owns implementation and integration; the existing task contract retains one final whole-wave Oracle advisory gate.

Implementation is a seeded in-memory configuration in `src/provider-configuration.ts`. No filtering framework, new option, dependency, credentials, runtime or protocol change. README documents exact default, override behavior and absence of a perpetual price guarantee. Unit coverage verifies empty-input defaults, endpoint preservation and explicit overrides. The packed Responses fixture includes an eligible synthetic paid model and verifies it is not registered without a caller-supplied whitelist; both packed routes retain their lifecycle/tool/hook checks.

Verification: typecheck passed4.34seconds; affected serial configuration, entry and packed-loader tests passed6/6 with zero failures/cancellations (26.12seconds). Strict OpenSpec validation and whitespace checks pass. No external inference or operator auth/config inspection was performed. Foreign `tools/subagent-profiles/.gitignore` and `extensions/pi-voicekit/` remain untouched.

## Frozen review boundary

BASELINE_TARGET=add-pi-opencode-bridge numbered Wave 5, free-Muse defaults tasks 5.1-5.2
BASELINE_TARGET_REVISION=standalone candidate sha256:ce62e11cef7c9ea4a036f307487cb69154228018afa469251066d387e255b762; base da5107fcfc25f432dacee32212b0d42e07cdcdff
BASELINE_SOURCE=Explicit user request to make the Zen/free-Muse whitelist launch setting the extension default; canonical OpenSpec bundle sha256:26c1ccef4668ab2ffac51c94d41de79f9857120f10b39629ec1e4dc550e15ee1
BASELINE_INCLUSION_PREDICATE=In-memory free-Muse-only bridge defaults, existing explicit configuration precedence and endpoint/auth preservation, affected configuration/catalog/packed-loader tests, concise documentation and post-acceptance scoped publication/pin
BASELINE_EXCLUSIONS=Pi-native provider visibility changes, dynamic price-filter framework, additional models, inference, auth/config file edits, root activation, dependency changes, unrelated protocol/runtime changes and foreign work

Digest recipe unchanged: sorted package-relative `.gitignore`, package.json, yarn.lock, tsconfig.json, README.md and files under src/test/docs/adr; path/NUL/bytes/NUL to SHA256. Canonical bundle uses sorted root-relative owning proposal/design/tasks/spec paths with the same encoding. First review FULL, zero rounds/rebuilds; existing four-round/one-rebuild cap. No commit/publication until caller acceptance.

## Round 1 - Oracle Review

Oracle run `b179d491-fd73-4f68-876a-89c0c866dc47` reported no requirement-backed P0–P3 findings. It independently checked candidate/canonical hashes and literal boundaries before/after, inspected the complete standalone diff and discovery consumers, confirmed prior endpoint/tool/runtime and root activation files unchanged, and passed whitespace checks. It explicitly reused the6 affected passing tests/typecheck rather than claiming a rerun. No source edits or external inference occurred.

PROPOSED_REVIEW_ACTION=PASS

### Caller reconciliation and acceptance

Parent recomputed candidate `ce62e11cef7c9ea4a036f307487cb69154228018afa469251066d387e255b762` and canonical `26c1ccef4668ab2ffac51c94d41de79f9857120f10b39629ec1e4dc550e15ee1`, compared the four boundary fields literally and confirmed current identity matches the frozen target. No findings require correction; no accepted blocker remains. Foreign work and empty staging state were confirmed before scoped publication.

REVIEW_ACTION=PASS
CONSENSUS_STATUS=APPROVED

One round, zero rebuilds. Accepted defaults remain overrideable by explicit operator configuration; Pi-native models are untouched. No perpetual pricing guarantee or broader model qualification is claimed.

### Integration completion

Published standalone `7405474d478bde77cd010e684aafb9fec46e162e` to the existing private SSH main; local HEAD and remote match and standalone worktree is clean. This is the exact reviewed candidate, with no post-review source changes. Parent pin and Wave5 task completion are updated in the scoped completion commit. No parent push or automatic activation; foreign files remain untouched.
