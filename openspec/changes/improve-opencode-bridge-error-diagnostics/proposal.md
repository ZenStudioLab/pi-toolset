# Proposal

## Why

A user request to Muse Spark 1.3 Contributor Free failed with only “OpenCode bridge request failed; no automatic replay was performed.” The bridge discards unclassified exceptions at several boundaries, so neither the user nor the maintainer can distinguish transport errors, invalid responses, observer failures or intentionally blocked continuation from that message.

## What Changes

- Show the failing operation, selected OpenCode provider/model, actual error type and safe message, and evidenced HTTP status or transport cause code in Pi's existing error output.
- Preserve useful failure details through the provider seam and Muse inference relay instead of replacing them with generic strings. Keep recognized authentication, free-tier, rate-limit and context-limit explanations.
- Explain whether a Pi tool was handed off and whether its result returned; do not claim a tool did not execute merely because its result is missing. Distinguish a blocked replay from the initial failure.
- Redact credentials and exclude request/response payloads, tool arguments/results and arbitrary backend stderr. Clearly indicate withheld or unavailable details rather than inventing a diagnosis.
- Keep cancellation, exactly-once terminal events, partial output, model selection and no-automatic-replay behavior unchanged. No new persistent log service or debug command is proposed.

## Capabilities

### New Capabilities

- `opencode-provider`: Add requirements for actionable request diagnostics and safe detail preservation, using the capability path already introduced by `add-pi-opencode-bridge`. There is no main spec yet; this delta adds distinct requirements rather than using MODIFIED against a nonexistent main requirement.

### Modified Capabilities

None in the current main-spec inventory. The completed but unarchived `add-pi-opencode-bridge` change remains the baseline for existing execution and confidentiality guarantees; this change does not reopen its completed tasks.

## Impact

Implementation is confined to `extensions/pi-opencode-bridge/`, principally `src/failure.ts`, `src/provider-seam.ts`, `src/inference-relay.ts` and the request-start error boundary in `src/index.ts`, with relevant tests and user documentation. The design must preserve the existing `opencode-provider` contract excluding raw credentials and complete payloads from diagnostics.

No dependency upgrades, authentication repair, model routing expansion, root activation, user-settings changes or live inference are required. The exact cause of the reported Muse failure remains unknown; this change makes the next failure diagnosable and does not claim to fix that underlying cause. Standalone publication, parent pinning and updating the installed Pi copy are separate release actions, not effects of this planning workflow.
