import { execFile } from "node:child_process";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const STATUS_KEY = "claude-limit";
const REFRESH_MS = 5 * 60 * 1000;

interface ClaudeWindow {
	usedPercent: number;
	// Absent when the window has not started yet.
	resetDescription?: string;
}

// Runs the installed codexbar CLI without a shell; resolves undefined on any failure.
function readClaudeSession(): Promise<ClaudeWindow | undefined> {
	return new Promise((resolve) => {
		execFile(
			"codexbar",
			["usage", "--provider", "claude", "--source", "oauth", "--json"],
			{ timeout: 30_000 },
			(error, stdout) => {
				if (error) return resolve(undefined);
				try {
					const [entry] = JSON.parse(stdout) as { usage?: { primary?: ClaudeWindow | null } }[];
					resolve(entry?.usage?.primary ?? undefined);
				} catch {
					resolve(undefined);
				}
			},
		);
	});
}

export default function (pi: ExtensionAPI) {
	let timer: ReturnType<typeof setInterval> | undefined;
	let refreshing = false;

	async function refresh(ctx: ExtensionContext) {
		if (refreshing) return;
		refreshing = true;
		try {
			const window = await readClaudeSession();
			const resetTime = window?.resetDescription?.split(" at ").pop();
			const reset = resetTime ? ` · resets ${resetTime}` : "";
			const text = window ? `Claude ${100 - window.usedPercent}%${reset}` : "Claude n/a";
			ctx.ui.setStatus(STATUS_KEY, ctx.ui.theme.fg("dim", text));
		} finally {
			refreshing = false;
		}
	}

	pi.on("session_start", async (_event, ctx) => {
		if (!ctx.hasUI) return;
		void refresh(ctx);
		timer = setInterval(() => void refresh(ctx), REFRESH_MS);
	});

	pi.on("session_shutdown", async () => {
		clearInterval(timer);
		timer = undefined;
	});
}
