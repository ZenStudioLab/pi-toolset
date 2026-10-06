# Wave 6 — several free Zen models

User requested adding several free models. Orchestrator expanded only the existing default whitelist: Muse Spark1.3 Contributor Free, MiMo V2.5 Free, Nemotron3.5 Lightning Free, Ling3.0 Flash Fin Free and Big Pickle. Explicit operator overrides still win; paid models remain outside the default. No runtime, adapter, authentication, dependencies or root activation change.

Fresh official checks of https://opencode.ai/zen/v1/models and https://opencode.ai/docs/zen/ confirmed all five IDs and Free input/output/cache-read pricing. A synthetic-authentication, catalog-only owned OpenCode1.18.29 runtime confirmed all five are connected eligible text/tool entries with explicitly zero pricing; it issued no inference and was closed. Newer Fledge Alpha, MiMo V2.6 Flash and Ling3.1 entries were absent from the pinned runtime and were not added. No operator authentication/configuration was inspected. README notes data collection/model-improvement terms and that only Muse has live bridge qualification; adding selectable entries is not proof their external inference will succeed.

Typecheck passed4.59seconds. All6 affected configuration, entry and packed-loader tests passed28.96seconds with zero failures/cancellations. Packed discovery asserts every added model exists, the eligible synthetic paid model is absent, and no inference occurs before selection. Existing controlled lifecycle/tool/hook checks pass for chat and Responses. Strict OpenSpec validation and whitespace checks pass. No external inference, paid substitution, plugin installation or user-file change occurred. Foreign `.gitignore` and `extensions/pi-voicekit/` remain untouched.

## Frozen review boundary

BASELINE_TARGET=add-pi-opencode-bridge numbered Wave 6, selected free Zen additions tasks 6.1-6.2
BASELINE_TARGET_REVISION=standalone candidate sha256:fbcaa136ce62051539e2a46dc923a245e25f613bee97d56411063ab9986db713; base 7405474d478bde77cd010e684aafb9fec46e162e
BASELINE_SOURCE=Explicit user request to add several free models; canonical OpenSpec bundle sha256:b2319043f61b696750d8ec1954f89e382217f89c30b8cf866456ccb12749df7a; current official Zen pricing/catalog and pinned local discovery
BASELINE_INCLUSION_PREDICATE=Four named free-model additions to existing Zen whitelist, unchanged explicit precedence and paid exclusion, discovery/packed-loader verification, accurate qualification/privacy documentation and scoped post-acceptance publication/pin
BASELINE_EXCLUSIONS=Additional inference or authentication inspection, qualification of new external model execution, new adapter/protocol support, dynamic price filtering, Pi-native provider visibility, user-file or root activation/dependency changes and foreign work

Digest recipe: sorted package-relative .gitignore/package.json/yarn.lock/tsconfig.json/README.md and all files under src/test/docs/adr; feed path/NUL/bytes/NUL to SHA256. Canonical uses sorted root-relative owning proposal/design/tasks/spec paths, same encoding. First review FULL, zero rounds/rebuilds, existing four-round/one-rebuild cap. Orchestrator owns acceptance and edits; Oracle is advisory only.

## Round 1 - Oracle Review

Run `070296ae-d3d7-419a-8cb6-e7b7b40716c7` reported no requirement-backed P0–P3 findings. Independent checks covered complete diff, selection completeness, preserved override/endpoint/authentication behavior, packed discovery assertions, unchanged adapter/runtime/root files, before/after hashes and literal boundaries, and whitespace. The reviewer accurately reused the supplied public/local catalog evidence and6 affected tests/typecheck without claiming reruns. No source edits or inference occurred.

PROPOSED_REVIEW_ACTION=PASS

### Caller reconciliation

Parent independently recomputed candidate `fbcaa136ce62051539e2a46dc923a245e25f613bee97d56411063ab9986db713` and canonical `b2319043f61b696750d8ec1954f89e382217f89c30b8cf866456ccb12749df7a`, and compared all four frozen boundary fields literally. Target identity remains current; no findings or accepted blockers remain. Foreign files and empty staging state were confirmed before scoped integration.

REVIEW_ACTION=PASS
CONSENSUS_STATUS=APPROVED

One round, zero rebuilds. Acceptance covers discovery only for the four additions; Muse remains the sole live-qualified model. Explicit overrides and changing vendor policies remain documented limits.

### Integration completion

Published exact reviewed standalone candidate as `5de08f3e5310f526fa8a8236ad82170d26c4a56a` to existing private SSH main; remote matches local HEAD and standalone worktree is clean. Parent pin and task completion are updated in a scoped commit, without parent-remote push or root activation. Foreign files remain untouched. No additional model inference was issued.
