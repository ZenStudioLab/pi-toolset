# Spec Delta

## Purpose

Allow Pi users to select models configured in OpenCode through an independently distributed provider package while retaining Pi-owned tool execution, conversation control, and explicit runtime ownership.

## ADDED Requirements

### Requirement: Actionable request failure details

For a failed inference attempt, the bridge SHALL report the selected OpenCode provider/model, failing operation, and available error type, safe error message, HTTP status and underlying transport cause code through Pi's existing request-error output. It SHALL preserve known domain-specific explanations and SHALL NOT infer authentication, entitlement, rate limiting or another cause without evidence. Missing, withheld and truncated details SHALL be identified rather than fabricated. Failures during request startup, inference, tool-result continuation, response processing and stream observation SHALL retain their operation context.

#### Scenario: Transport exception has an underlying cause

- **WHEN** a request fails with an error message and an underlying transport code
- **THEN** the user sees the failing operation, selected pair, safe message and code
- **AND** the message is not replaced solely by the generic no-replay text

#### Scenario: Backend returns structured failure metadata

- **WHEN** the backend supplies an HTTP status and structured error metadata, including a non-Error thrown value
- **THEN** the diagnostic retains the evidenced status and safe error details
- **AND** recognized free-tier, access, rate-limit and context-limit explanations remain distinguishable

#### Scenario: Response processing or observation fails

- **WHEN** processing a response or invoking an observer throws an exception
- **THEN** the diagnostic identifies that operation and available safe exception details without mislabeling it as provider authentication failure

#### Scenario: No useful error detail exists

- **WHEN** a failure has no usable safe message, type, status or code
- **THEN** the bridge identifies the operation and pair and explicitly states that further detail is unavailable or withheld

### Requirement: Preserve Muse relay failure evidence

A failure originating in the qualified Muse Responses forwarding path SHALL reach the Pi request diagnostic with its originating operation and available safe cause details. A secondary local HTTP status or cancellation SHALL NOT replace an already captured originating failure. Upstream HTTP failures SHALL retain their status; the relay SHALL NOT change endpoint, credentials, tool execution authority or replay behavior to obtain a diagnostic.

#### Scenario: Forwarding fails before response headers

- **WHEN** the Muse forwarding connection fails with a transport cause before headers arrive
- **THEN** Pi reports the forwarding failure and cause rather than only an undifferentiated local gateway error

#### Scenario: Forwarding fails during a response stream

- **WHEN** the Muse forwarding stream fails after headers or partial content have been delivered
- **THEN** Pi reports the stream failure with available safe originating details and preserves valid partial content
- **AND** a later request does not inherit that failure's details

### Requirement: Confidentiality of displayed diagnostics

Diagnostics SHALL exclude credentials, authorization and cookie values, URL user information and query secrets, full request/response bodies, complete prompt/tool payloads and raw backend stderr. Safe source error wording SHALL be preserved rather than rewritten into an invented explanation. Sensitive or payload-bearing portions SHALL be redacted or withheld, with explicit indication. Diagnostic extraction SHALL tolerate non-Error values and bounded or cyclic causes and SHALL bound displayed length. The bridge SHALL NOT introduce a separate persistent raw error log or duplicate request-error notifications.

#### Scenario: Error fields contain secrets or echoed payloads

- **WHEN** an error includes credential-bearing text, a credential-bearing URL, or an embedded request/response or tool payload
- **THEN** those values are absent from displayed and persisted Pi error messages
- **AND** remaining safe operation, type, status, code and message details are retained where available

#### Scenario: Oversized or cyclic failure input

- **WHEN** a failure carries an oversized message or cyclic cause references
- **THEN** rendering terminates with bounded output, marks omitted detail and does not replace the original failure with a formatting exception

### Requirement: Honest execution and replay status

Request diagnostics SHALL distinguish no tool handoff, an issued handoff with no returned result, and a returned tool result using evidence available to the bridge. They SHALL NOT equate a missing result with proof that no side effect occurred, or a returned result with proof of success. A rejected continuation of a failed generation SHALL be identified as a blocked replay rather than a new backend failure. Diagnostic changes SHALL preserve cancellation semantics, balanced partial-content events, one terminal outcome per segment, user selection and the prohibition on automatic replay or fallback.

#### Scenario: Failure after a tool handoff

- **WHEN** a request fails after Pi received a tool call but before its result returned
- **THEN** the error states that execution may have occurred and no automatic replay was performed
- **AND** no tool is re-executed to collect diagnostic information

#### Scenario: Failure after a returned tool result

- **WHEN** a request fails after a tool result has returned
- **THEN** the error identifies that result boundary without claiming the tool succeeded unless evidenced
- **AND** the original prompt and selected model remain unchanged

#### Scenario: Identical failed context is submitted again

- **WHEN** an automatic continuation attempts to resume the rejected generation
- **THEN** the bridge reports that replay was blocked and preserves available originating failure context
- **AND** it sends no new inference request for that continuation

#### Scenario: User intentionally cancels

- **WHEN** the user cancels active work
- **THEN** it remains an aborted outcome without an additional backend-error notification or automatic replay
