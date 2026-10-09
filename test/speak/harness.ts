import { EventEmitter } from "node:events";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
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
import type { Shortcuts } from "../../extensions/speak/config.ts";
import { registerSpeak } from "../../extensions/speak/index.ts";
import { SpeechController } from "../../extensions/speak/speech-job.ts";
import { TalkController } from "../../extensions/speak/talk.ts";
import type { TranslationRegistry } from "../../extensions/speak/translation.ts";
import type { TranslationFailureRecord } from "../../extensions/speak/translation-failure.ts";

export const API_KEY = "test-secret-key-123";
export const VALID_CONFIG = {
  providers: {
    elevenlabs: {
      voiceId: "AbCdEf1234567890",
      modelId: "eleven_flash_v2_5",
    },
  },
  player: { command: "fakeplayer", args: ["--play", "{file}"] },
};

export class FakeChild extends EventEmitter {
  stdout = new EventEmitter();
  stderr = new EventEmitter();
  signals: (NodeJS.Signals | number | undefined)[] = [];
  autoExitOnKill = true;
  kill(signal?: NodeJS.Signals | number): boolean {
    this.signals.push(signal);
    if (this.autoExitOnKill)
      queueMicrotask(() => {
        this.emit("exit", null, signal ?? "SIGTERM");
        this.emit("close", null, signal ?? "SIGTERM");
      });
    return true;
  }
  /** Ends the process as Node does: `exit` first, then `close` once the output has closed. */
  finish(code: number): void {
    this.emit("exit", code, null);
    this.emit("close", code, null);
  }
  /** Delivers recorded PCM as the recorder's stdout. */
  emitAudio(bytes: Uint8Array): void {
    this.stdout.emit("data", Buffer.from(bytes));
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

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

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
  /** Leaves `ctx.model` undefined, as when no model is selected. */
  noModel?: boolean;
}

type Handler = (args: string, ctx: ExtensionCommandContext) => Promise<void>;

export async function createHarness(
  options: {
    config?: unknown;
    apiKey?: string | null;
    deepgramKey?: string | null;
    /** Recording tools to install on the fake PATH, such as `["rec"]`. */
    recorders?: string[];
    readFile?: (path: string) => Promise<string>;
    entryFailure?: boolean;
    widgetFailure?: boolean;
    entrySink?: (customType: string, data: TranslationFailureRecord) => void;
    /**
     * Makes the fake `pi.sendUserMessage` fail as the host does: it returns normally and the failure
     * is only reported later, to `hostErrors`.
     */
    sendFailure?: string;
    /** Makes the fake `pi.sendUserMessage` throw this message synchronously. */
    sendThrows?: string;
    /** The keys registered at load; the default is the built-in pair. */
    shortcuts?: Shortcuts;
  } = {},
) {
  const dir = await mkdtemp(join(tmpdir(), "speak-harness-"));
  await mkdir(join(dir, "bin"));
  await writeFile(join(dir, "bin", "fakeplayer"), "#!/bin/sh\n");
  await chmod(join(dir, "bin", "fakeplayer"), 0o755);
  for (const tool of options.recorders ?? []) {
    await writeFile(join(dir, "bin", tool), "#!/bin/sh\n");
    await chmod(join(dir, "bin", tool), 0o755);
  }
  const env: Record<string, string | undefined> = {
    XDG_CONFIG_HOME: join(dir, "config"),
    XDG_CACHE_HOME: join(dir, "cache"),
    PATH: join(dir, "bin"),
    UNRELATED: "kept",
  };
  if (options.apiKey !== null)
    env.ELEVENLABS_API_KEY = options.apiKey ?? API_KEY;
  if (options.deepgramKey !== undefined && options.deepgramKey !== null)
    env.DEEPGRAM_API_KEY = options.deepgramKey;
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

  const deps = {
    env,
    fetchFn,
    spawnFn,
    now: Date.now,
    readFile: options.readFile ?? ((path: string) => readFile(path, "utf8")),
  };
  const registered = options.shortcuts ?? { send: "alt+t", transcribe: "alt+shift+t" };
  const controller = new SpeechController(deps, registered);
  // A manual clock keeps the 0.5 s minimum and the elapsed time exact.
  let clock = 1_000_000;
  const editor = { text: "" };
  /** Messages passed to `pi.sendUserMessage`, with the composer text seen at the moment of the call. */
  const sent: { text: string; options: unknown; composerAtCall: string }[] = [];
  /** Failures the host reports after `pi.sendUserMessage` has already returned (`runner.emitError`). */
  const hostErrors: string[] = [];
  const talk = new TalkController(
    { ...deps, now: () => clock },
    controller,
    (text, sendOptions) => {
      if (sendOptions.expandPromptTemplates !== false) throw new Error("templates must not be expanded");
      sent.push({ text, options: sendOptions, composerAtCall: editor.text });
      if (options.sendThrows) throw new Error(options.sendThrows);
      if (options.sendFailure) hostErrors.push(options.sendFailure);
    },
    registered,
  );
  const commands = new Map<string, Handler>();
  const shortcuts = new Map<string, (ctx: ExtensionCommandContext) => Promise<void>>();
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
    registerShortcut: (
      key: string,
      definition: { handler: (ctx: ExtensionCommandContext) => Promise<void> },
    ) => shortcuts.set(key, definition.handler),
    sendUserMessage: () => {
      submitted++;
    },
    sendMessage: () => {
      submitted++;
    },
    on: (event: string, handler: () => void) => {
      events.set(event, handler);
      return () => undefined;
    },
  } as unknown as ExtensionAPI;
  let submitted = 0;
  registerSpeak(api, controller, talk, registered);

  const notices: { message: string; level?: string }[] = [];
  const statuses: (string | undefined)[] = [];
  const talkStatuses: (string | undefined)[] = [];
  const keyListeners = new Set<(data: string) => { consume?: boolean } | undefined>();
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
        setStatus: (key: string, text: string | undefined) =>
          (key === "speak-talk" ? talkStatuses : statuses).push(text),
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

  function talkContext(ctxOptions: CtxOptions = {}) {
    const cwd = ctxOptions.cwd ?? dir;
    // SAFETY: /talk and the shortcut use only the mode, the UI, and the editor and key hooks below.
    return {
      mode: ctxOptions.mode ?? "tui",
      cwd,
      model: ctxOptions.noModel ? undefined : { id: "test-model" },
      modelRegistry: ctxOptions.registry,
      ui: {
        notify: (message: string, level?: string) => notices.push({ message, level }),
        setStatus: (key: string, text: string | undefined) =>
          (key === "speak-talk" ? talkStatuses : statuses).push(text),
        setWidget: () => undefined,
        getEditorText: () => editor.text,
        setEditorText: (text: string) => {
          editor.text = text;
        },
        onTerminalInput: (listener: (data: string) => { consume?: boolean } | undefined) => {
          keyListeners.add(listener);
          return () => keyListeners.delete(listener);
        },
      },
      isIdle: () => ctxOptions.idle ?? true,
      hasPendingMessages: () => false,
      sessionManager: SessionManager.inMemory(cwd),
      abort: () => aborts++,
    } as unknown as ExtensionCommandContext;
  }

  async function runTalk(args: string, ctxOptions: CtxOptions = {}) {
    await commands.get("talk")!(args, talkContext(ctxOptions));
  }

  /** Presses the registered send shortcut (`alt+t` unless `shortcuts` was given). */
  async function pressShortcut(ctxOptions: CtxOptions = {}) {
    await shortcuts.get(registered.send)!(talkContext(ctxOptions));
  }

  /** Presses the registered transcribe-only shortcut (`alt+shift+t` unless `shortcuts` was given). */
  async function pressTranscribeShortcut(ctxOptions: CtxOptions = {}) {
    await shortcuts.get(registered.transcribe)!(talkContext(ctxOptions));
  }

  /** Sends a key to the terminal-input listeners; true when one consumed it (the editor never sees it). */
  function sendKey(data: string): boolean {
    let consumed = false;
    for (const listener of [...keyListeners])
      if (listener(data)?.consume) consumed = true;
    return consumed;
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
    runTalk,
    pressShortcut,
    pressTranscribeShortcut,
    sendKey,
    sent,
    hostErrors,
    talkStatuses,
    editor,
    keyListeners,
    shortcuts,
    get submitted() {
      return submitted + sent.length;
    },
    advance(ms: number) {
      clock += ms;
    },
    /** The recorder processes started so far, in order. */
    recorderChildren: () =>
      children.filter((_, i) => /\/(rec|arecord|ffmpeg)$/.test(spawnCalls[i]!.command)),
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
      talk.resetSession();
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
