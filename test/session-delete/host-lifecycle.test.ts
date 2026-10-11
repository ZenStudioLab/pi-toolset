import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { createInterface } from "node:readline";
import test from "node:test";
import { SessionManager } from "@earendil-works/pi-coding-agent";
import { fakeTrash } from "../fixtures/fake-cli.ts";
import { disposableHost, extensionPath, piCli } from "../fixtures/host.ts";

const extension = extensionPath("session-delete");
type Event = {
  type: string; id?: string; method?: string; success?: boolean; message?: string; error?: string;
  data?: { sessionFile?: string };
};

for (const mode of ["success", "decline", "switch-cancel", "trash-failure", "unavailable", "unsaved", "arguments"]) {
  test(`actual Pi command lifecycle: ${mode}`, { timeout: 20000 }, async () => {
    const f = await disposableHost();
    await fakeTrash(f);
    let child: ReturnType<typeof spawn> | undefined;
    try {
      const manager = SessionManager.create(f.cwd, join(f.root, "sessions"));
      manager.appendMessage({
        role: "assistant", content: [{ type: "text", text: "Disposable test transcript" }],
        api: "openai-responses", provider: "openai", model: "test", stopReason: "stop", timestamp: Date.now(),
        usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0,
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
      });
      const file = manager.getSessionFile()!;
      let original = await readFile(file, "utf8");
      const lifecycle = join(f.root, "lifecycle.ts");
      const marker = join(f.root, "old-session-shutdown");
      await writeFile(lifecycle, `import { writeFileSync } from 'node:fs';
export default function(pi) {
  pi.on('session_shutdown', (event) => { if (event.reason === 'new') writeFileSync(process.env.TEST_SHUTDOWN_MARKER, 'closed'); });
  if (process.env.TEST_CANCEL_SWITCH) pi.on('session_before_switch', () => ({cancel:true}));
}`);
      const args = [piCli, "--offline", "--no-extensions", "--no-skills", "--no-context-files", "--no-prompt-templates",
        "--no-themes", "--no-approve", "--mode", "rpc", "-e", extension, "-e", lifecycle,
        ...(mode === "unsaved" ? ["--no-session"] : ["--session", file])];
      const env = { ...f.env, TEST_SHUTDOWN_MARKER: marker,
        ...(mode === "switch-cancel" ? { TEST_CANCEL_SWITCH: "1" } : {}),
        ...(mode === "trash-failure" ? { TEST_TRASH_FAIL: "1" } : {}),
        ...(mode === "unavailable" ? { TEST_TRASH_UNAVAILABLE: "1" } : {}) };
      child = spawn(process.execPath, args, { cwd: f.cwd, env, stdio: ["pipe", "pipe", "pipe"] });
      const events: Event[] = [];
      let stderr = "";
      child.stderr!.on("data", (chunk) => { stderr += chunk; });
      const send = (value: object) => child!.stdin!.write(JSON.stringify(value) + "\n");
      const lines = createInterface({ input: child.stdout! });
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => { child!.kill(); reject(new Error(`RPC timeout: ${stderr}`)); }, 15000);
        child!.on("error", (error) => { clearTimeout(timer); reject(error); });
        child!.on("exit", (code) => {
          clearTimeout(timer);
          code === 0 ? resolve() : reject(new Error(`Pi exit ${code}: ${stderr}`));
        });
        lines.on("line", (line) => {
          try {
            const event: Event = JSON.parse(line);
            events.push(event);
            if (event.type === "response" && event.id === "before") {
              assert(event.success);
              // Pi may append restored thinking metadata during startup, before our command.
              original = readFileSync(file, "utf8");
              send({ id: "delete", type: "prompt", message: mode === "arguments" ? "/delete-session force" : "/delete-session" });
            } else if (event.type === "extension_ui_request" && event.method === "confirm") {
              assert(existsSync(file), "the old transcript must still exist at confirmation");
              send({ type: "extension_ui_response", id: event.id, confirmed: mode !== "decline" });
            } else if (event.type === "response" && event.id === "delete") {
              assert(event.success, event.error);
              send({ id: "after", type: "get_state" });
            } else if (event.type === "response" && event.id === "after") {
              child!.stdin!.end();
            }
          } catch (error) { clearTimeout(timer); child!.kill(); reject(error); }
        });
        send({ id: "before", type: "get_state" });
      });
      lines.close();
      const before = events.find((event) => event.id === "before")?.data?.sessionFile;
      const after = events.find((event) => event.id === "after")?.data?.sessionFile;
      const notifications = events.filter((event) => event.method === "notify").map((event) => event.message ?? "").join("\n");
      const moved = (await f.calls("trash")).filter((args) => args[0] === "trash");
      if (mode === "success") {
        assert.notEqual(after, before);
        assert(!existsSync(file));
        assert.equal(await readFile(join(f.logDir, "trash", basename(file)), "utf8"), original);
        assert.deepEqual(moved, [["trash", "--", file]]);
        assert(existsSync(marker), "old-session shutdown must precede trashing");
        assert(notifications.includes("moved to system trash"));
      } else {
        assert.equal(await readFile(file, "utf8"), original, "the original transcript must remain intact");
        if (mode === "trash-failure") {
          assert.notEqual(after, before);
          assert.equal(moved.length, 1);
          assert(notifications.includes("old file still exists") && notifications.includes("No permanent-delete fallback"));
        } else {
          assert.equal(after, before);
          assert.equal(moved.length, 0);
          if (mode === "switch-cancel") assert(notifications.includes("switching was cancelled"));
          if (mode === "unavailable") assert(notifications.includes("GIO trash is unavailable"));
          if (mode === "unsaved") assert(notifications.includes("no saved transcript"));
          if (mode === "arguments") assert(notifications.includes("takes no arguments"));
        }
      }
    } finally { child?.kill(); await new Promise((r) => setTimeout(r, 150)); await f.cleanup(); }
  });
}
