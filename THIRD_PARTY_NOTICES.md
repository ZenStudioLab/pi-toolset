# Third-party notices

ZenStudioLab's original contributions are licensed under the root MIT license. That notice does not replace upstream copyrights or dependency licenses.

## Pi host integration

The Whimsical host patch modifies and reproduces portions of [Pi](https://github.com/earendil-works/pi), copyright (c) 2025 Mario Zechner, under the MIT license. The complete upstream notice is preserved in [LICENSE.pi](extensions/whimsical-activity/host-patch/LICENSE.pi). Apply the patch only to the upstream revision documented in the [integration guide](extensions/whimsical-activity/host-patch/README.md).

The extension's structural activity API types mirror that host boundary. Retain this notice and LICENSE.pi when redistributing the extension or patch. Modified host files remain subject to upstream copyright; the patch is not a claim that ZenStudioLab authored Pi.

## Dependencies and other extensions

Dependencies are obtained from their publishers, not vendored here, and retain their respective licenses. The session-delete, session-title, and tool-block-borders extensions in this repository are original work. The pi-bookmark, pi-subscription-usage, and pi-openai-codex-fast submodules are forks of upstream projects and keep their authors' copyright and licenses in their own repositories. Linking to or using an upstream project does not transfer ownership.
