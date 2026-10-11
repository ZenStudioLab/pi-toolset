# ADR-0001: Support Stock Pi with Optional Advanced Activity Integration

**Status:** Accepted for implementation; runtime qualification pending.
**Owner:** Orchestrator.
**Change:** [add-stock-pi-activity-support](../../openspec/changes/add-stock-pi-activity-support/design.md).

## Context

The published 0.1.x extension requires a patched Pi host and therefore does not decorate normal installations. The user selected hybrid support: normal users must get stock-Pi functionality, while the existing advanced host integration stays optional.

The original mixed repository's ADR-0001, now `docs/adr/0009-native-activity-decoration.md`, chose native ownership to guarantee synchronous waits, scoped lifetimes, stable width, and full settings integration. That rationale remains valid for advanced mode. This public-repository decision changes the package's support boundary, not the historical advanced contract.

Released Pi 0.87.1 and 0.99.2 expose working-message and indicator setters. They support default restoration and static/hidden frames, but not previous-value reads, exclusive registration, authoritative foreground snapshots, or advanced activity settings. The package is trusted local presentation code; it must not change agent execution or install host modifications.

## Decision

Select one backend per eligible interactive session. If the advanced registration capability exists, use the existing controller and honor the host's refusal to register. Otherwise use public working-message and indicator setters, with an actionable warning only if required stock capabilities are missing.

Stock mode uses one lazy bank word per agent loop, the native spinner in normal mode, a static ASCII-compatible indicator in reduced mode, and literal native text without the decorative glyph in plain mode. Existing disable and ASCII flags remain supported. It creates no extension timers and restores only the public controls it changed at loop/session cleanup. The existing selector remains shared across loops and session replacements in one loaded runtime.

Advanced mode retains existing saved settings, preset/color selection, delayed visibility, timed rotation, width reservation, synchronous wait/ownership arbitration, and observed elapsed/action/output-token metadata. Do not modify the host patch or emulate its authority on stock Pi.

## Consequences

Ordinary users no longer need a host checkout or patch once a stock-capable release is published. Documentation must distinguish stock and advanced capabilities and clearly label checkout support as unreleased while npm still serves 0.1.x.

Stock support intentionally lacks the stronger native guarantees. Other extensions using the same public setters can compete, and previous values cannot be restored reliably without a public getter; document single-owner use rather than inspecting private state. Native Pi still owns layout, retry/compaction surfaces, waits, and cancellation controls. No additional renderer or editor replacement is introduced.

Real released-host lifecycle/rendering and packed-package checks must qualify the stock path, and existing advanced regressions must still pass. The whole implementation wave requires independent Oracle review plus caller reconciliation before acceptance. No publication, version bump, dependency change, installed-host modification, or personal settings migration is authorized by this ADR.

## Alternatives

- Keeping patch-only support fails the normal-installation requirement.
- Removing advanced integration contradicts the user's final hybrid choice.
- Reconstructing advanced ownership from async events or adding rotation timers would claim authority the public API does not expose.
- Replacing the editor or adding a footer/widget would add another presentation owner and unnecessary integration risk.
