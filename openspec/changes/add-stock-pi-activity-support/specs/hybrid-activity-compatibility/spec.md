# Spec Delta

## Purpose

Make Whimsical Activity usable on unmodified Pi through public extension APIs while retaining optional advanced behavior on the explicitly supported patched host.

## ADDED Requirements

### Requirement: Stock Pi works without a host patch

The package SHALL decorate the native working presentation in eligible interactive sessions on the qualified stock Pi versions, without installing, modifying, or importing a patched host. Missing advanced integration SHALL NOT by itself produce an unsupported-host warning.

#### Scenario: Ordinary stock installation
- **WHEN** an operator loads the package on stock Pi with the public working-message and indicator capabilities in a TUI with stdin and stdout TTYs
- **THEN** an agent loop displays a word from the bundled bank on the native working surface without a patched-host warning
- **AND** installing the extension does not alter the host or user settings beyond Pi's normal package registration

#### Scenario: Genuinely missing public capabilities
- **WHEN** an otherwise eligible host lacks both advanced integration and a required stock presentation capability
- **THEN** native presentation remains unchanged and at most one actionable compatibility warning is shown per loaded extension runtime

### Requirement: Exactly one presentation backend is selected

An eligible session SHALL use advanced integration when that capability exists and stock integration otherwise. An advanced host's refusal to register SHALL remain authoritative and SHALL NOT enable a second stock writer. Backend replacement and shutdown SHALL release the prior backend idempotently.

#### Scenario: Advanced host
- **WHEN** the supported patched host accepts the extension
- **THEN** existing advanced controls and behavior remain available and stock presentation handlers do not write to its UI

#### Scenario: Advanced registration declined
- **WHEN** the advanced capability exists but declines registration
- **THEN** the stock backend is not activated and the host retains its existing presentation

### Requirement: Stock decoration remains bounded and local

In normal or reduced stock mode, the extension SHALL choose one word per agent loop from the existing shuffled bank and retain it for that loop. It SHALL NOT schedule word rotation or delayed visibility callbacks. The native host SHALL continue to own rendering, layout, operational retry/compaction surfaces, and cancellation controls. No editor replacement, footer, or widget SHALL be introduced.

#### Scenario: Repeated activity
- **WHEN** two consecutive agent loops occur within one loaded extension runtime
- **THEN** each loop receives a word using the existing selector's no-immediate-repeat behavior
- **AND** the extension creates no stock timers and does not change the bank contents

#### Scenario: Operational surfaces and waits
- **WHEN** the stock host shows retry, compaction, or a user-interaction surface
- **THEN** the extension creates no competing surface and makes no attempt to control that operation, its visibility, or input handling
- **AND** stock support does not claim advanced synchronous wait arbitration or exclusive ownership against other extensions

### Requirement: Existing invocation controls work in both modes

The existing disable, normal/reduced/plain, and ASCII invocation controls SHALL retain their meanings. Stock normal mode SHALL use native animation; reduced mode SHALL use a static ASCII-compatible indicator; plain mode SHALL preserve literal native working text and suppress the decorative glyph without selecting a word. ASCII mode SHALL change whimsical punctuation to `...`. Advanced preferences SHALL continue to inherit native saved settings when flags are absent.

#### Scenario: Disabled and invalid flags
- **WHEN** hard disable is set, even with an invalid display flag
- **THEN** stock mode performs no UI writes, creates no bank or timer, and emits no warning
- **AND** otherwise an invalid display value disables decoration with the existing single validation warning

#### Scenario: Motion and punctuation
- **WHEN** stock reduced mode and ASCII punctuation are selected
- **THEN** one bank word with `...` and a static indicator are used during the loop
- **AND** plain mode instead shows the default native working message without a decorative glyph or bank allocation

### Requirement: Lifecycle cleanup is presentation-only

The extension SHALL restore stock presentation defaults only for the message or indicator controls it changed, clear its loop state at agent end, session replacement, and shutdown, and tolerate repeated cleanup. After cleanup, late end events SHALL NOT trigger new decoration. The stock backend SHALL NOT retain timers or construct a bank before the first eligible decorated loop.

#### Scenario: End, abort, reload, and session replacement
- **WHEN** a decorated loop completes or aborts, or its session is replaced or shut down
- **THEN** the extension's modified message and indicator controls are reset to defaults and repeated cleanup has no additional effect
- **AND** a subsequent loop or fresh session can decorate normally

### Requirement: Noninteractive execution and agent behavior are unchanged

Print, JSON, RPC, non-TTY, and no-UI sessions SHALL remain silent decoration no-ops. In all modes, the extension SHALL NOT change prompts, messages sent to the model, provider requests, tool execution, continuations, permissions, or credentials, and SHALL NOT fetch or generate activity words.

#### Scenario: Headless invocation
- **WHEN** the package loads in a noneligible session, including RPC with UI capability
- **THEN** it makes no stock UI writes or advanced registrations, allocates no bank or timers, and emits no decoration warning

#### Scenario: Execution neutrality
- **WHEN** the extension observes activity events
- **THEN** its handlers return no event transformation or control-flow decision and use presentation APIs only

### Requirement: Hybrid capabilities and installation are disclosed honestly

Documentation SHALL lead with ordinary stock Pi installation, label advanced setup optional, and distinguish qualified stock versions from the patched-host base. It SHALL disclose that stock mode uses one word per loop and lacks advanced delay/rotation, persistent native settings, selectable presets/colors, width reservation, synchronous wait/ownership guarantees, and elapsed/action/output-token metadata. It SHALL explain shared-setter conflicts and removal of duplicate local/npm installations. Existing 0.1.x releases SHALL NOT be described as stock-compatible.

#### Scenario: Unreleased compatibility change
- **WHEN** documentation changes before an npm release containing stock support exists
- **THEN** it clearly labels stock support as unreleased and provides a working local-checkout trial path instead of claiming the registry's current package already includes it

### Requirement: Both paths are qualified before completion

Qualification SHALL exercise the real extension entry through a released stock host, observe its native rendered working output and restoration, and retain advanced regression evidence. Tests SHALL cover backend selection, flags, lifecycle cleanup, noninteractive behavior, and package loading without a host checkout in the installed package. Tests SHALL use offline controlled activity, not live providers.

#### Scenario: Release candidate verification
- **WHEN** implementation is submitted for the whole-wave gate
- **THEN** focused tests, typechecking, real stock render/lifecycle evidence, packed-package loading evidence, and advanced regressions have recorded commands and results
- **AND** no claim is made that mocked UI setter calls alone establish stock rendering compatibility
