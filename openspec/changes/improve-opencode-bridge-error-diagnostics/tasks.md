# Tasks

## 1. Safe diagnostic extraction and presentation

- [x] 1.1 Extend the existing failure owner with operation/model context, bounded Error and SDK-object extraction, cause codes, HTTP status and shared rendering; verify focused tests preserve known domain classifications and useful benign error wording without inventing missing fields.
- [x] 1.2 Sanitize selected diagnostic fields before retention/rendering, excluding secrets and payload dumps and marking withheld/truncated details; verify synthetic credential, URL, payload, oversized-message and cyclic-cause cases neither leak sentinels nor throw during formatting.
- [x] 1.3 Document the user-visible error fields and confidentiality limits in the standalone README, including a clearly synthetic example; verify the example agrees with the formatter tests and does not claim to diagnose the original Muse incident.

## 2. Request lifecycle diagnostics

- [x] 2.1 Wire diagnostics through provider-seam operation boundaries and the request-start catch in index.ts, preserving originating errors through cancellation/cleanup; verify controlled startup, structured backend, response-processing and observer failures report their actual stage and safe cause with one terminal outcome.
- [x] 2.2 Retain sanitized originating failure context for the existing failed-context guard and report issued handoffs/returned results accurately; extend existing lifecycle tests to verify blocked continuation sends no new request, ambiguous tool effects are not replayed, and a fresh generation has no stale diagnostic.
- [x] 2.3 Extend partial-disconnect and cancellation coverage to assert preserved content, balanced events, unchanged prompt/model and aborted-versus-error semantics; verify the affected serial tests pass and update README recovery guidance to match those observed outcomes.

## 3. Muse relay evidence preservation

- [x] 3.1 Add a narrow in-memory diagnostic path from the owned inference relay to its owning generation without changing upstream HTTP behavior; verify loopback tests retain transport/processing causes before headers and during streaming, distinguish local 502 from upstream status, and suppress stale or intentional-abort reports.
- [x] 3.2 Exercise that relay path through the provider seam and released Pi loader/session using synthetic fixtures; verify the final Pi assistant error contains the originating safe cause, excludes secret/payload sentinels, preserves no-replay behavior and does not duplicate notifications.
- [x] 3.3 Update the standalone README's Muse qualification limits to distinguish improved failure visibility from successful external inference or entitlement; verify no adapter-route, authentication, dependency or activation expansion appears in the diff.

## 4. Integrated acceptance

- [x] 4.1 Run yarn typecheck and the complete serial standalone test suite from the package root, including packed-loader coverage; inspect failures, terminal counts and cleanup evidence, and report exact results without performing external inference.
- [x] 4.2 Validate this OpenSpec change strictly and inspect scoped whitespace/diffs; verify every diagnostic scenario has evidence and that installed package files, user configuration, parent activation and foreign work remain unchanged. Leave publication, parent pin updates and installed-package upgrades for an explicit release action after acceptance.

## Verification evidence

- `yarn typecheck`: passed (4.23s).
- Focused serial diagnostics, relay, lifecycle, entry, observer and packed-loader tests: 34/34 passed (76.62s).
- Complete serial suite: `node --experimental-strip-types --test --test-concurrency=1 test/*.test.ts` passed 76/76, zero failures/cancellations, normal exit (107.93s).
- Strict OpenSpec validation and scoped Git whitespace checks passed. New artifacts/tests were also checked for trailing whitespace. An existing trailing-space line in unchanged `test/runtime.test.ts` was left untouched.
- Installed source still matches the pre-change standalone HEAD. Manifest, lockfile, runtime/auth/configuration/tool-routing sources and root activation files are unchanged; foreign parent work was not modified.
- Initial HTTP-status assertions were corrected to reflect observed OpenCode retry/context-overflow events that do not carry upstream status. The implementation does not infer missing status codes.
- All inference checks used controlled loopback fixtures. No live provider request, publication, installed-package upgrade or separate manual TUI test was performed; the original external Muse failure remains undiagnosed.
