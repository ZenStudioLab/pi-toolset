# ADR-0009: Keep Activity Decoration Behind Native Host Ownership

**Status:** Accepted for implementation; not yet qualified.
**Owner:** Orchestrator.
**Change:** [add-whimsical-activity-indicator](../../openspec/changes/add-whimsical-activity-indicator/design.md).

## Context

Whimsical labels must come only from the supplied static JSON bank while Pi's real lifecycle determines busy state. The user requires truthful status, immediate wait precedence, lossless editing, lifecycle cleanup, and reversible unloading.

The existing extension-only seam cannot satisfy these guarantees. `setCustomEditorComponent` copies raw text rather than cursor/collapsed-paste state; old editor attachment is not notified on replacement; asynchronous prompt events can arrive end-before-start. The user selected source scope A, and the rebuilt proposal passed independent Oracle review and caller reconciliation.

## Decision

Extend the approved Pi source checkout at `host/pi` (v0.99.2 base `005af57d88ee23b33778f343a9595b32e67ff788`) with a narrow native activity-decoration registration contract. The local extension supplies decorative words and deadlines; the host retains native foreground ownership, truthful messages, animation control, rendering, and synchronous producer-owned waiting state.

Registration/removal never replaces the editor. The host revokes stale registration/owner handles and disposes presentation callbacks at native lifecycle boundaries. Existing asynchronous prompt events remain informational for this feature. Native Loader frames become monotonic-clock-derived without a second spinner implementation.

The existing OpenSpec design and delta specification own the detailed contract and acceptance tests; this record does not introduce additional requirements.

## Alternatives Rejected

- A CustomEditor factory would require lossy state migration and an unavailable detach lifecycle.
- Focus/overlay probing or counting asynchronous prompt events would miss waits or resume incorrectly.
- A footer/widget spinner would duplicate native status and invent another owner.
- Reduced extension-only guarantees were offered, but the user chose the complete source-host contract.
- Patching installed packages would alter an unowned release and is excluded.

## Consequences

The feature requires the modified source host. Unmodified published/installed hosts retain their native UI and receive one compatibility diagnostic; they are not claimed to support this feature. Separate host and extension diffs, focused tests, and two whole-wave Oracle gates must qualify the integration.

The bank, shuffled bag, and presentation controller remain independent of prompts, models, and network retrieval. Disabling/unloading restores native presentation without input migration. No dependency pins, lockfiles, personal settings, installed release, or publication workflow change is included.
