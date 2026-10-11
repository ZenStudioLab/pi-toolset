import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { test } from "node:test";
import { SessionManager } from "@earendil-works/pi-coding-agent";
import { fakeHerdr } from "../fixtures/fake-cli.ts";
import { disposableHost, extensionPath, piCli } from "../fixtures/host.ts";

const extension = extensionPath("session-title");
type Event = { type: string; id?: string; method?: string; success?: boolean; error?: string; name?: string; message?: string };

type Scenario = {
  label: string;
  herdr: boolean;
  failHerdr?: boolean;
  dialog?: "value" | "cancel";
  typed?: string;
  expect: { name?: string; notify: RegExp; calls: string[][] };
};

const scenarios: Scenario[] = [
  { label: "argument inside Herdr", herdr: true, typed: "add-themed-bash-block-borders",
    expect: { name: "add-themed-bash-block-borders", notify: /relabeled/, calls: [["tab", "rename", "w5:t12", "add-themed-bash-block-borders"]] } },
  { label: "argument outside Herdr", herdr: false, typed: "offline-work",
    expect: { name: "offline-work", notify: /No Herdr tab detected/, calls: [] } },
  { label: "dialog input inside Herdr", herdr: true, dialog: "value",
    expect: { name: "from-dialog", notify: /relabeled/, calls: [["tab", "rename", "w5:t12", "from-dialog"]] } },
  { label: "cancelled dialog changes nothing", herdr: true, dialog: "cancel",
    expect: { notify: /^$/, calls: [] } },
  { label: "multiline argument is normalized", herdr: true, typed: "line one\nline two",
    expect: { name: "line one line two", notify: /not allowed|relabeled/, calls: [["tab", "rename", "w5:t12", "line one line two"]] } },
  { label: "herdr failure is reported after Pi still records the name", herdr: true, failHerdr: true, typed: "partial-state",
    expect: { name: "partial-state", notify: /rename failed/, calls: [["tab", "rename", "w5:t12", "partial-state"]] } },
];

for (const scenario of scenarios) {
  test(`actual Pi command lifecycle: ${scenario.label}`, { timeout: 20000 }, async () => {
    const f = await disposableHost();
    await fakeHerdr(f);
    let child: ReturnType<typeof spawn> | undefined;
    try {
      const manager = SessionManager.create(f.cwd, join(f.root, "sessions"));
      manager.appendMessage({
        role: "assistant", content: [{ type: "text", text: "Disposable title test" }],
        api: "openai-responses", provider: "openai", model: "test", stopReason: "stop", timestamp: Date.now(),
        usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0,
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
      });
      const file = manager.getSessionFile()!;
      const env: NodeJS.ProcessEnv = { ...f.env, ...(scenario.herdr ? { HERDR_ENV: "1", HERDR_TAB_ID: "w5:t12" } : { HERDR_ENV: "0" }) };
      if (scenario.failHerdr) env.TEST_HERDR_FAIL = "1";
      const args = [piCli, "--offline", "--no-extensions", "--no-skills", "--no-context-files", "--no-prompt-templates",
        "--no-themes", "--no-approve", "--mode", "rpc", "--session", file, "-e", extension];
      child = spawn(process.execPath, args, { cwd: f.cwd, env, stdio: ["pipe", "pipe", "pipe"] });
      const events: Event[] = [];
      let stderr = "";
      child.stderr!.on("data", (chunk) => { stderr += chunk; });
      const send = (value: object) => child!.stdin!.write(JSON.stringify(value) + "\n");
      const lines = createInterface({ input: child.stdout! });
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => { child!.kill(); reject(new Error(`RPC timeout: ${stderr}`)); }, 15000);
        child!.on("error", (error) => { clearTimeout(timer); reject(error); });
        child!.on("exit", (code) => { clearTimeout(timer); code === 0 ? resolve() : reject(new Error(`Pi exit ${code}: ${stderr}`)); });
        lines.on("line", (line) => {
          let event: Event;
          try { event = JSON.parse(line); } catch { return; }
          events.push(event);
          if (event.type === "extension_ui_request" && event.method === "input") {
            send(scenario.dialog === "cancel"
              ? { type: "extension_ui_response", id: event.id, cancelled: true }
              : { type: "extension_ui_response", id: event.id, value: "from-dialog" });
          } else if (event.type === "response" && event.id === "before") {
            send({ id: "title", type: "prompt", message: `/title${scenario.typed ? ` ${scenario.typed}` : ""}` });
          } else if (event.type === "response" && event.id === "title") {
            // The command has finished, including its optional tab rename; read state only now.
            send({ id: "after", type: "get_state" });
          } else if (event.type === "response" && event.id === "after") {
            child!.stdin!.end();
          }
        });
        send({ id: "before", type: "get_state" });
      });
      lines.close();
      const transcript = await readFile(file, "utf8");
      const names = events.filter((event) => event.type === "session_info_changed").map((event) => event.name);
      const notifications = events.filter((event) => event.method === "notify").map((event) => event.message ?? "").join("\n");
      assert.deepEqual(await f.calls("herdr"), scenario.expect.calls, "Herdr invocation");
      if (scenario.expect.name) {
        assert.equal(names.at(-1), scenario.expect.name, "Pi session name");
        assert(transcript.includes(`"name":"${scenario.expect.name}"`), "name persisted in the session file");
      } else {
        assert.deepEqual(names, [], "no session name change");
        assert(!transcript.includes('"type":"session_info"'), "no session_info entry appended");
      }
      if (scenario.expect.notify.source) assert.match(notifications, scenario.expect.notify);
    } finally { child?.kill(); await new Promise((r) => setTimeout(r, 150)); await f.cleanup(); }
  });
}
