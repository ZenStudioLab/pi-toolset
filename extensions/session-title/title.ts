import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

const MAX_NAME_LENGTH = 120;

/** Terminal titles and tab labels are single-line labels, not free text. */
export function normalizeName(input: string): string {
  // eslint-disable-next-line no-control-regex
  const singleLine = input.replace(/[\u0000-\u001f\u007f]+/g, " ");
  return singleLine.replace(/\s+/g, " ").trim().slice(0, MAX_NAME_LENGTH);
}

export type HerdrTarget = { tabId: string } | undefined;

/** Herdr exports itself through these variables; the apply-loop step uses the same signal. */
export function currentHerdrTab(env: NodeJS.ProcessEnv = process.env): HerdrTarget {
  if (env.HERDR_ENV !== "1") return undefined;
  const tabId = env.HERDR_TAB_ID?.trim();
  return tabId ? { tabId } : undefined;
}

export type TabResult = { ok: true; tabId: string } | { ok: false; reason: string };

export async function renameHerdrTab(target: HerdrTarget, name: string): Promise<TabResult> {
  if (!target) return { ok: false, reason: "not-inside-herdr" };
  try {
    // Array arguments, no shell: the label never reaches an interpolated command line.
    await exec("herdr", ["tab", "rename", target.tabId, name], { timeout: 5000, maxBuffer: 64 * 1024 });
    return { ok: true, tabId: target.tabId };
  } catch (error) {
    const failure = error as { code?: string; stderr?: string; message?: string };
    const detail = failure.stderr?.trim().split("\n")[0] ?? failure.message ?? "unknown error";
    return { ok: false, reason: failure.code === "ENOENT" ? "herdr-cli-missing" : detail };
  }
}
