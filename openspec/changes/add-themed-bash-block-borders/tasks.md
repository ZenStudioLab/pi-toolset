## 1. Qualify and bootstrap the standalone extension

- [x] 1.1 Qualify Pi 0.87.1 public Bash-definition/render APIs, native shell options and working-directory behavior, and custom-tool conflict handling; record any blocking limitation before implementation.
- [x] 1.2 Create minimal standalone npm package metadata, TypeScript configuration, extension entry point layout, and local verification commands with qualified host dependencies and no shared node_modules links.

## 2. Implement presentation-only Bash framing

- [x] 2.1 Implement an ANSI-width-aware left-rail component with modest padding, empty/narrow-width behavior, resize support, and correctly offset native mouse dispatch.
- [x] 2.2 Decorate native call/result renderers with separate inner-component reuse and shared native state, continuous framing, state-aware background/rail colors, and theme invalidation.
- [x] 2.3 Register the Bash override through public APIs while preserving metadata, execution settings, cwd, signals, partial updates, result details, and normal host hooks; retain conflict diagnostics.

## 3. Verify observable behavior

- [x] 3.1 Add and run focused framing tests for width, ANSI/wide text, narrow viewports, empty output, resize, theme/state changes, and mouse-coordinate translation.
- [x] 3.2 Add and run native-renderer integration tests for repeated streaming, completion/errors, timing cleanup, long-output expansion/truncation, and correct unwrapped last-component reuse.
- [x] 3.3 Verify execution parity for deterministic output, configured command prefix/cwd, cancellation/timeout, host hooks, and extension conflicts without changing global settings.
- [x] 3.4 Typecheck and explicitly load the extension in isolated host sessions; qualify non-interactive execution and inspect regular/fullscreen interactive framing under ORNG and a dark theme, including resize and expand/collapse.

## 4. Document and finish

- [x] 4.1 Document supported Pi compatibility, standalone npm commands, explicit local loading/unloading, Bash-only coverage, the ORNG accent adaptation, and conflict limitations.
- [x] 4.2 Run final package checks and OpenSpec validation, confirm only standalone project files changed, and report verification results plus any remaining manual acceptance work accurately.
