import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/** Real Pi binary under test, resolved from this package's development dependencies. */
export const piCli = fileURLToPath(new URL("../../node_modules/@earendil-works/pi-coding-agent/dist/cli.js", import.meta.url));

/** Extension entry point of one bundled extension, as Pi receives it on the command line. */
export function extensionPath(name: "session-delete" | "session-title" | "tool-block-borders"): string {
  return fileURLToPath(new URL(`../../extensions/${name}/index.ts`, import.meta.url));
}

export type Host = {
  root: string;
  cwd: string;
  agentDir: string;
  /** Fake external CLIs prepended to PATH, e.g. a trash or tab manager. */
  bin: string;
  logDir: string;
  env: NodeJS.ProcessEnv;
  /** Arguments recorded by the fake CLI identified by `logName`, oldest first. */
  calls(logName: string): Promise<string[][]>;
  cleanup(): Promise<void>;
};

export async function disposableHost(settings: Record<string, unknown> = {}): Promise<Host> {
  const root = await mkdtemp(join(tmpdir(), "pi-extensions-test-"));
  const cwd = join(root, "project"), agentDir = join(root, "agent"), bin = join(root, "bin"), logDir = join(root, "logs");
  await Promise.all([cwd, agentDir, bin, logDir].map((path) => mkdir(path)));
  await writeFile(join(agentDir, "settings.json"), JSON.stringify({
    quietStartup: true, cacheWarming: "off", enableInstallTelemetry: false, enableAnalytics: false,
    retry: { enabled: false }, compaction: { enabled: false },
    ...settings,
  }));
  return {
    root, cwd, agentDir, bin, logDir,
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, PI_CODING_AGENT_DIR: agentDir, PI_OFFLINE: "1" },
    async calls(logName) {
      try {
        const raw = await readFile(join(logDir, `${logName}.jsonl`), "utf8");
        return raw.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line) as string[]);
      } catch {
        return []; // the CLI was never invoked
      }
    },
    async cleanup() {
      // Pi can still be flushing a replacement session file when a test ends.
      for (let attempt = 0; attempt < 5; attempt++) {
        try { await rm(root, { recursive: true, force: true }); return; } catch { await new Promise((r) => setTimeout(r, 200)); }
      }
      throw new Error(`fixture cleanup failed for ${root}`);
    },
  };
}
