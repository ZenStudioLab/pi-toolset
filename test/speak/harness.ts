import { EventEmitter } from "node:events";
import {
  chmod,
  mkdir,
  mkdtemp,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  SessionManager,
  type ExtensionAPI,
  type ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";
import type { SpawnFn } from "../../extensions/speak/audio.ts";
import { registerSpeak } from "../../extensions/speak/index.ts";
import { SpeechController } from "../../extensions/speak/speech-job.ts";
import type { TranslationRegistry } from "../../extensions/speak/translation.ts";
import type { TranslationFailureRecord } from "../../extensions/speak/translation-failure.ts";

export const API_KEY = "test-secret-key-123";
export const VALID_CONFIG = {
  voiceId: "AbCdEf1234567890",
  modelId: "eleven_flash_v2_5",
  player: { command: "fakeplayer", args: ["--play", "{file}"] },
};

export class FakeChild extends EventEmitter {
  stderr = new EventEmitter();
  signals: (NodeJS.Signals | number | undefined)[] = [];
  autoExitOnKill = true;
  kill(signal?: NodeJS.Signals | number): boolean {
    this.signals.push(signal);
    if (this.autoExitOnKill)
      queueMicrotask(() => this.emit("exit", null, signal ?? "SIGTERM"));
    return true;
  }
  finish(code: number): void {
    this.emit("exit", code, null);
  }
}

export interface FetchCall {
  url: string;
  init: RequestInit;
}

export const audioResponse = (): Response =>
  new Response(new Uint8Array([1, 2, 3, 4]), {
    status: 200,
    headers: { "content-type": "audio/mpeg" },
  });

const tick = () => new Promise<void>((resolve) => setImmediate(resolve));

export interface CtxOptions {
  mode?: string;
  idle?: boolean;
  pending?: boolean;
  messages?: unknown[];
  cwd?: string;
  sessionManager?: Pick<
    ExtensionCommandContext["sessionManager"],
    "getHeader" | "getBranch"
  >;
  registry?: TranslationRegistry;
}

type Handler = (args: string, ctx: ExtensionCommandContext) => Promise<void>;

export async function createHarness(
  options: {
    config?: unknown;
    apiKey?: string | null;
    entryFailure?: boolean;
    widgetFailure?: boolean;
    entrySink?: (customType: string, data: TranslationFailureRecord) => void;
  } = {},
) {
  const dir = await mkdtemp(join(tmpdir(), "speak-harness-"));
  await mkdir(join(dir, "bin"));
  await writeFile(join(dir, "bin", "fakeplayer"), "#!/bin/sh\n");
  await chmod(join(dir, "bin", "fakeplayer"), 0o755);
  const env: Record<string, string | undefined> = {
    XDG_CONFIG_HOME: join(dir, "config"),
    XDG_CACHE_HOME: join(dir, "cache"),
    PATH: join(dir, "bin"),
    UNRELATED: "kept",
  };
  if (options.apiKey !== null)
    env.ELEVENLABS_API_KEY = options.apiKey ?? API_KEY;
  if (options.config !== null) {
    await mkdir(join(dir, "config", "pi-speak"), { recursive: true });
    await writeFile(
      join(dir, "config", "pi-speak", "config.json"),
      JSON.stringify(options.config ?? VALID_CONFIG),
    );
  }

  const fetchCalls: FetchCall[] = [];
  let behavior: (call: FetchCall) => Promise<Response> = async () =>
    audioResponse();
  const fetchFn = (async (url: string | URL, init?: RequestInit) => {
    const call = { url: String(url), init: init ?? {} };
    fetchCalls.push(call);
    return behavior(call);
  }) as typeof fetch;

  const children: FakeChild[] = [];
  const spawnCalls: {
    command: string;
    args: string[];
    options: Record<string, unknown>;
  }[] = [];
  // SAFETY: Only the members startPlayer uses (stderr, once, kill) exist on the fake child.
  const spawnFn = ((
    command: string,
    args: readonly string[],
    spawnOptions: Record<string, unknown>,
  ) => {
    const child = new FakeChild();
    children.push(child);
    spawnCalls.push({ command, args: [...args], options: spawnOptions });
    return child;
  }) as unknown as SpawnFn;

  const controller = new SpeechController({
    env,
    fetchFn,
    spawnFn,
    now: Date.now,
  });
  const commands = new Map<string, Handler>();
  const events = new Map<string, () => void>();
  const entries: { customType: string; data: TranslationFailureRecord }[] = [];
  // SAFETY: registerSpeak uses registerCommand/on and appendEntry only after a live failure.
  const api = {
    appendEntry(customType: string, data: TranslationFailureRecord) {
      if (options.entryFailure)
        throw new Error("session persistence unavailable");
      options.entrySink?.(customType, data);
      entries.push({ customType, data });
    },
    registerCommand: (name: string, definition: { handler: Handler }) =>
      commands.set(name, definition.handler),
    on: (event: string, handler: () => void) => {
      events.set(event, handler);
      return () => undefined;
    },
  } as unknown as ExtensionAPI;
  registerSpeak(api, controller);

  const notices: { message: string; level?: string }[] = [];
  const statuses: (string | undefined)[] = [];
  const widgets: { key: string; content: string[] | undefined }[] = [];
  let aborts = 0;

  async function run(args: string, ctxOptions: CtxOptions = {}) {
    const cwd = ctxOptions.cwd ?? dir;
    let sessionManager = ctxOptions.sessionManager;
    if (!sessionManager) {
      const session = SessionManager.inMemory(cwd);
      for (const message of ctxOptions.messages ?? [])
        session.appendMessage(message as never);
      sessionManager = session;
    }
    // SAFETY: The router uses this UI, registry, cwd, idle/pending flags and the real session boundary.
    const ctx = {
      mode: ctxOptions.mode ?? "tui",
      cwd,
      modelRegistry: ctxOptions.registry,
      ui: {
        notify: (message: string, level?: string) =>
          notices.push({ message, level }),
        setStatus: (_key: string, text: string | undefined) =>
          statuses.push(text),
        setWidget: (key: string, content: string[] | undefined) => {
          if (options.widgetFailure) throw new Error("widget unavailable");
          widgets.push({ key, content });
        },
      },
      isIdle: () => ctxOptions.idle ?? true,
      hasPendingMessages: () => ctxOptions.pending ?? false,
      sessionManager,
      abort: () => aborts++,
    } as unknown as ExtensionCommandContext;
    await commands.get("speak")!(args, ctx);
  }

  return {
    dir,
    env,
    controller,
    fetchCalls,
    children,
    spawnCalls,
    notices,
    statuses,
    widgets,
    events,
    entries,
    run,
    get aborts() {
      return aborts;
    },
    async writeConfig(config: unknown) {
      await writeFile(
        join(dir, "config", "pi-speak", "config.json"),
        JSON.stringify(config),
      );
    },
    setFetch(next: (call: FetchCall) => Promise<Response>) {
      behavior = next;
    },
    /** Waits (polling real I/O) until the condition holds; fails the test after the timeout. */
    async until(condition: () => boolean, timeoutMs = 3000) {
      const deadline = Date.now() + timeoutMs;
      while (!condition()) {
        if (Date.now() > deadline)
          throw new Error("condition not reached before the timeout");
        await tick();
      }
    },
    async cacheFiles() {
      return readdir(join(dir, "cache", "pi-speak")).catch(
        () => [] as string[],
      );
    },
    messages: () => notices.map((notice) => notice.message).join("\n"),
    async cleanup() {
      controller.resetSession();
      await controller.whenIdle();
      await rm(dir, { recursive: true, force: true });
    },
  };
}

export const answer = (text: string) => [
  { role: "user", content: "question", timestamp: 1 },
  {
    role: "assistant",
    content: [{ type: "text", text }],
    stopReason: "stop",
    timestamp: 2,
  },
];
