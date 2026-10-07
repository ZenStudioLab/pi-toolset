/**
 * Session Rename - Minimal B1 agent-callable session rename tool.
 *
 * Lets pi agents set the visible session title from opsx prompts so
 * parallel proposal and apply sessions stay navigable.
 *
 * Pattern: defineTool-shaped (see examples/extensions/hello.ts) but
 * execute() closes over the factory `pi` object (see
 * examples/extensions/bookmark.ts) because ExtensionToolContext has
 * no setSessionName -- only the factory pi does (types.ts:1731).
 *
 * Exposure: plain `direct` default-active. No `defaultActive:false`,
 * no setActiveTools wiring -- prompt templates expand text only and
 * cannot invoke activation APIs.
 */

import { Type } from "@earendil-works/pi-ai";
import { defineTool, type ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
	const sessionRenameTool = defineTool({
		name: "session_rename",
		label: "Session Rename",
		description:
			"Set the session display name to the kebab-case change name (e.g. add-foo-bar). Call once the opsx change name is final, and re-affirm after artifacts are done.",
		parameters: Type.Object({
			name: Type.String({
				description: "Kebab-case change name to use as the session title",
			}),
		}),

		async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
			const trimmed = (params.name ?? "").trim();
			if (!trimmed) {
				throw new Error("session_rename requires a non-empty name");
			}
			pi.setSessionName(trimmed);
			const actual = pi.getSessionName() ?? trimmed;
			return {
				content: [{ type: "text", text: `Session name set: ${actual}` }],
				details: { name: actual },
			};
		},
	});

	pi.registerTool(sessionRenameTool);
}
