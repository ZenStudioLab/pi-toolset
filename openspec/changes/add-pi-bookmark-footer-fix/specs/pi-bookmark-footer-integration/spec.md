# Spec Delta

## Purpose

Provides a reproducible, locally maintained Pi bookmark extension whose status indicator remains compatible with Pi's shared footer and other installed extension statuses.

## ADDED Requirements

### Requirement: The repository SHALL pin the maintained bookmark source

The repository SHALL include `pi-bookmark` as a Git submodule at `extensions/pi-bookmark`, and the parent repository SHALL record a specific submodule commit so checkout and review do not depend on a moving upstream branch.

#### Scenario: Fresh checkout initializes the maintained source

- **WHEN** a developer clones the repository and initializes submodules
- **THEN** `extensions/pi-bookmark` resolves to the ZenStudioLab bookmark repository at the commit recorded by the parent repository
- **AND** the submodule contains the Pi package manifest and bookmark extension entrypoint

### Requirement: Pi SHALL load the maintained bookmark package instead of the official package

The active Pi package configuration SHALL disable the official `git:github.com/vaultboy001/pi-bookmark` package and SHALL load the local `extensions/pi-bookmark` package as the bookmark extension source.

#### Scenario: The configured package set is inspected

- **WHEN** Pi loads the user's configured packages
- **THEN** the upstream `vaultboy001/pi-bookmark` package is not selected
- **AND** the local ZenStudioLab package is selected exactly once

#### Scenario: Bookmark commands remain available after replacement

- **WHEN** Pi starts with the maintained package selected
- **THEN** `/pin`, `/unpin`, `/bookmarks`, and the existing bookmark shortcut remain registered
- **AND** bookmark persistence continues to use the existing bookmark store

### Requirement: The bookmark indicator SHALL be footer-safe

When the current session is bookmarked, the extension SHALL display its bookmark indicator without emitting terminal cursor-positioning escape sequences or other control sequences that reposition, overwrite, or wrap neighboring footer statuses. When the session is not bookmarked, it SHALL remove its status entry.

#### Scenario: A bookmarked session shares the footer with other statuses

- **WHEN** Pi displays the bookmark indicator together with subscription usage, MCP, image, or other extension statuses
- **THEN** all statuses render as ordinary inline footer content within the terminal width
- **AND** no status changes the terminal cursor position outside the footer layout managed by Pi

#### Scenario: A session is unpinned

- **WHEN** the current session is unpinned or the session changes to an unbookmarked session
- **THEN** the bookmark indicator is removed without leaving stale cursor movement or visible marker text

### Requirement: Existing bookmark behavior SHALL remain unchanged apart from footer positioning

The maintained package SHALL preserve bookmark commands, picker behavior, cross-workspace session lookup, and bookmark-store semantics while changing only the status rendering and package source selection required by this integration.

#### Scenario: Existing bookmark operations are used

- **WHEN** a user pins, unpins, lists, or resumes a bookmarked session
- **THEN** the operation behaves as it did before the footer fix
- **AND** the footer remains layout-safe throughout the operation
