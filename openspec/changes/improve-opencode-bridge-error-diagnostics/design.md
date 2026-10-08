# Design

## Context

See proposal.md for motivation. The affected system is a local, operator-controlled Pi extension, but its errors can contain credentials and private provider payloads. This warrants narrowly scoped sanitization, not a new logging platform. Design is needed because evidence crosses the relay, runtime SDK, generation lifecycle and Pi rendering boundaries.

Observed source behavior:

- `src/failure.ts` classifies selected backend metadata into `BridgeFailure` but reduces unknown metadata to a generic inference failure.
- `src/provider-seam.ts` converts non-Error failures into a generic Error, replaces observer exceptions, and finally hides every unclassified exception behind the reported request-failed message. Its failed-context guard also uses this generic path.
- `src/inference-relay.ts` catches without retaining the exception. Before headers it emits a generic 502; after headers it destroys the response. The original transport or transformation cause is therefore lost.
- `src/index.ts` has a separate request-start catch that must use the same diagnostic policy. Catalog/settings notifications are adjacent but outside this change.
- `src/runtime.ts` deliberately drains rather than forwards stderr. That privacy boundary stays intact.
- `test/provider-failures.test.ts` covers classified HTTP failures and partial disconnects, but its broad failure assertion does not require operation or originating cause details.

The installed source matched all 15 development source files during exploration; the installed HEAD observed then was `e60b9258becedc2faa9135b9b8e17399f36728d9`. Direct dependency versions matched. These observations do not establish the user's failure cause. No failing external request was reproduced.

The main-spec inventory is empty. The completed `add-pi-opencode-bridge` change owns the existing `opencode-provider` baseline. This explicitly requested follow-up uses that same capability path with new requirement names and leaves the prior artifacts unchanged. Integrate the baseline before this additive delta when syncing or archiving.

## Goals / Non-Goals

**Goals:** Preserve evidence before lossy boundaries; render useful failure details once through Pi's existing error output; keep ownership and recovery behavior unchanged.

**Non-Goals:** Raw object/stack/stderr dumps, filesystem log storage, telemetry, a debug-mode command, changes to provider authentication or pricing, dependency upgrades, automatic retries, tool re-execution, or diagnosing the original Muse cause without evidence. No expansion of the Muse adapter to additional routes.

## Decisions

### 1. One small diagnostic representation at existing failure ownership

Extend `failure.ts` with a bounded internal diagnostic representation and extraction/rendering helpers. Keep classification separate from formatting. Include operation, provider/model identity, available error name/message, HTTP status, cause code and tool-handoff/result state. These are display evidence, not a new recovery state machine.

Normalize Error instances and the SDK's structured non-Error values without enumerating arbitrary object fields. Inspect a bounded cause chain with cycle detection. Preserve the first originating failure through cleanup; retirement errors can be secondary information, not replacements. Known domain classifications remain ahead of generic HTTP/transport fallback.

Alternative rejected: interpolate `String(error)` at the final catch. It both loses SDK object metadata and may leak payloads. A separate logging service would add ownership and storage without helping the immediate user-visible error.

### 2. Capture operation context where failure occurs

Tag actual boundaries: runtime startup/event connection, session creation, prompt submission, upstream forwarding, tool-result continuation, stream observation/normalization, completed-history retrieval/reconciliation, and blocked continuation. Do not use one mutable global stage across concurrent work. Attach context at the corresponding catch or call boundary and keep it with the generation.

Retain a sanitized failure alongside the existing failed-context fingerprint so a blocked retry can explain that it is replaying a failed generation, not report a new inference failure. New generations must not inherit old details. Capture handoff/result counters or equivalent facts from existing lifecycle transitions; no new authority to execute tools is introduced.

### 3. Preserve relay evidence in memory across the HTTP boundary

Give the owned inference relay a narrow diagnostic callback consumed by the owning seam. Record safe local exceptions before returning a 502 or destroying an already-started stream. Tie the record to the active generation and stop accepting records after it retires. Only a matching generation's record may supplement the SDK failure. Do not introduce custom headers carrying diagnostics or forward secrets to another service.

Actual upstream error statuses and responses keep existing forwarding behavior. Local relay failure evidence supplements rather than fabricates upstream status: a relay-generated 502 is identified as local. If a causal association is unavailable, omit relay detail instead of attributing a stale exception. Intentional cancellation does not generate a competing error.

Alternative rejected: place the original exception into the relay response JSON. This would miss failures after headers and expose details to an additional boundary unnecessarily.

### 4. Safe detail, not a raw transcript of the exception

Use existing `AssistantMessage.errorMessage` and terminal error events, including the request-start path, so Pi renders and persists the same sanitized diagnostic. Do not add a second toast or separate log file. A representative output shape is:

```text
OpenCode request failed: upstream forwarding
Model: opencode/muse-spark-1.3-contributor-free
Cause: TypeError: fetch failed
Transport: ECONNRESET
Tools: no handoff issued
No automatic replay was performed.
```

This is an illustrative synthetic failure, not a diagnosis of the user's incident. Fields absent from the actual exception are omitted or explicitly unavailable. Detail withheld or truncated is labeled.

Preserve benign source wording after sanitization. Extract only selected error metadata; never serialize request/response objects, headers, tool arguments/results or arbitrary stderr. Remove credential assignments, bearer/cookie values and URL userinfo/query material from selected strings; normalize terminal control characters and bound message/cause length. Treat provider text containing payload dumps or echoed private content as withheld, not as automatically safe because its property is named `message`. Do not claim a regex can prove arbitrary upstream prose safe: uncertain free-form content is withheld while safe type/status/code/operation evidence remains. Sanitization precedes rendering and any retention in the generation diagnostic.

The ordinary Pi session may persist its displayed error; it must receive only sanitized text. “Exact error” means faithfully retained safe evidence, not byte-for-byte reproduction of secrets or opaque payloads.

### 5. Verify outcomes at existing boundaries

Extend the existing failure/relay tests rather than build a parallel diagnostic harness. Pure extraction tests cover non-Error SDK metadata, nested causes, redaction, cycles and truncation. Controlled transport and provider-seam tests prove details survive actual boundaries before and after headers and are not reused by a later generation. A released Pi loader/session check proves the displayed assistant error carries the diagnostic, without depending on manual TUI rendering.

Keep assertions on no replay, preserved selection/context, partial content, cancellation and terminal-event count. Add handoff/result cases to existing lifecycle coverage instead of duplicating complete happy paths. Use synthetic secret and payload sentinels and loopback fixtures only; no external model call is needed for acceptance.

## Risks / Trade-offs

- Provider wording can echo private data -> selectively retain safe metadata and mark uncertain text withheld; never dump entire exceptions.
- Relay errors can arrive after cancellation -> associate records with the owning generation and discard stale/intentional-abort records.
- More descriptive errors can still lack the root cause -> clearly identify missing evidence and do not claim the Muse incident is resolved.
- Error formatting can itself fail -> keep extraction bounded and nonthrowing, with an operation-specific fallback.
- More detailed output can become noisy -> one bounded diagnostic on the existing error surface, not multiple notifications.

## Migration Plan

No preference, authentication or persisted-data migration is required. During implementation, update the standalone README with a representative sanitized error and qualification limits. Validate locally with controlled fixtures before any release.

Publishing the standalone revision, updating the parent gitlink and upgrading the installed Pi package are separate explicit release steps after acceptance. Do not patch the managed installation directly. Rollback uses the previous pinned standalone revision; model preferences and credentials are untouched.

## Open Questions

The exact exception behind the reported Muse failure is not available from the generic message. A later occurrence can establish it after diagnostics ship; investigating or fixing that cause is not an acceptance prerequisite for this diagnostic-only change.
