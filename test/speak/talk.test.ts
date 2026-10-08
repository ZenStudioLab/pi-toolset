import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, test } from "node:test";
import { TALK_USAGE } from "../../extensions/speak/index.ts";
import { VALID_CONFIG, audioResponse, createHarness, type FakeChild } from "./harness.ts";

type Harness = Awaited<ReturnType<typeof createHarness>>;
const open: Harness[] = [];
afterEach(async () => {
  while (open.length > 0) await open.pop()!.cleanup();
});

const baseConfig = (input: Record<string, unknown> = {}) => ({
  ...VALID_CONFIG,
  providers: {
    elevenlabs: { ...VALID_CONFIG.providers.elevenlabs, sttModel: "scribe_v2" },
    deepgram: { sttModel: "nova-3" },
  },
  input: { provider: "deepgram", language: "vi", ...input },
});

async function harness(options: Parameters<typeof createHarness>[0] = {}) {
  const h = await createHarness({
    config: baseConfig(),
    deepgramKey: "deepgram-test-key",
    recorders: ["rec"],
    ...options,
  });
  open.push(h);
  respond(h, "xin chào");
  return h;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/** Answers each provider in its own response shape. */
function respond(h: Harness, transcript: string) {
  h.setFetch(async (call) =>
    call.url.includes("deepgram")
      ? json({ results: { channels: [{ alternatives: [{ transcript }] }] } })
      : json({ text: transcript }),
  );
}

/** Starts a recording with the shortcut and waits for the recorder process. */
async function startRecording(h: Harness): Promise<FakeChild> {
  const wanted = h.recorderChildren().length + 1;
  await h.pressShortcut();
  await h.until(() => h.recorderChildren().length === wanted);
  return h.recorderChildren()[wanted - 1]!;
}

/** Stops a recording longer than the 0.5 s minimum and waits for the transcript outcome. */
async function stopAndSettle(h: Harness) {
  h.advance(2000);
  await h.pressShortcut();
  await h.until(() => h.talkStatuses.length > 0 && h.talkStatuses.at(-1) === undefined);
}

const audio = (child: FakeChild, bytes = 3200) => child.emitAudio(new Uint8Array(bytes).fill(1));
const sessionEvent = (h: Harness, name = "session_before_switch") => h.events.get(name)!();
const mixed = (statuses: (string | undefined)[]) => statuses.filter(Boolean).join("\n");

test("speech commands, status, and provider selection start no recorder", async () => {
  const h = await harness();
  await h.run("text hello");
  await h.run("status");
  await h.run("provider deepgram");
  await h.runTalk("provider elevenlabs");
  sessionEvent(h, "session_shutdown");
  assert.equal(h.recorderChildren().length, 0);
});

test("a missing key for the selected provider is named and starts no recorder or request", async () => {
  const h = await harness({ deepgramKey: null });
  await h.pressShortcut();
  assert.match(h.messages(), /DEEPGRAM_API_KEY is not set/);
  assert.equal(h.recorderChildren().length, 0);
  assert.equal(h.fetchCalls.length, 0);
  await h.runTalk("provider elevenlabs");
  await h.pressShortcut();
  assert.equal(h.recorderChildren().length, 1, "ELEVENLABS_API_KEY is set, so the override records");
});

test("an unknown /talk argument shows usage, changes nothing, and makes no request", async () => {
  const h = await harness();
  for (const args of ["bogus", "provider whisper", "provider deepgram extra"]) {
    await h.runTalk(args);
    assert.equal(h.notices.at(-1)!.message, TALK_USAGE);
  }
  assert.equal(h.recorderChildren().length, 0);
  assert.equal(h.fetchCalls.length, 0);
});

for (const mode of ["rpc", "json", "print"])
  test(`voice input is unsupported in ${mode} mode and records nothing`, async () => {
    const h = await harness();
    await h.runTalk("", { mode });
    await h.pressShortcut({ mode });
    assert.equal(h.notices.length, 2);
    assert.match(h.notices[0]!.message, /works only in the interactive terminal/);
    assert.equal(h.recorderChildren().length, 0);
    assert.equal(h.fetchCalls.length, 0);
  });

test("/talk starts, the shortcut stops, and exactly one Deepgram request carries the recording", async () => {
  const h = await harness();
  await h.runTalk("");
  await h.until(() => h.recorderChildren().length === 1);
  const child = h.recorderChildren()[0]!;
  audio(child);
  await stopAndSettle(h);
  assert.deepEqual(child.signals, ["SIGINT"]);
  assert.equal(h.fetchCalls.length, 1);
  const call = h.fetchCalls[0]!;
  assert.equal(
    call.url,
    "https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&language=vi",
  );
  const wav = call.init.body as Uint8Array;
  assert.equal(String.fromCharCode(...wav.subarray(0, 4)), "RIFF");
  assert.equal(wav.length, 44 + 3200);
  assert.equal(h.editor.text, "xin chào");
});

test("a recording is sent to ElevenLabs as one multipart upload without audio-event tags", async () => {
  const h = await harness({ config: baseConfig({ provider: "elevenlabs", language: undefined }) });
  audio(await startRecording(h));
  await stopAndSettle(h);
  assert.equal(h.fetchCalls.length, 1);
  assert.equal(h.fetchCalls[0]!.url, "https://api.elevenlabs.io/v1/speech-to-text");
  const form = h.fetchCalls[0]!.init.body as FormData;
  assert.equal(form.get("model_id"), "scribe_v2");
  assert.equal(form.get("tag_audio_events"), "false");
  assert.equal(form.has("language_code"), false);
  assert.equal(h.editor.text, "xin chào");
});

test("the indicator follows the recording: recording with time and level, then transcribing, then nothing", async () => {
  const h = await harness();
  const child = await startRecording(h);
  h.advance(3000);
  child.emitAudio(new Uint8Array(new Int16Array(1600).fill(30000).buffer));
  await stopAndSettle(h);
  const lines = h.talkStatuses.filter(Boolean) as string[];
  assert.match(lines[0]!, /Recording 0:00 .* alt\+t stop · Esc discard/);
  assert.match(lines[1]!, /Recording 0:03 █ .* alt\+t stop/);
  assert.equal(lines.at(-1), "Transcribing…");
  assert.equal(h.talkStatuses.at(-1), undefined);
});

test("the transcript is appended to the composer with one space and nothing is submitted", async () => {
  for (const [existing, expected] of [
    ["Refactor the loader", "Refactor the loader xin chào"],
    ["Refactor the loader ", "Refactor the loader xin chào"],
    ["Refactor\n", "Refactor\nxin chào"],
    ["", "xin chào"],
  ] as const) {
    const h = await harness();
    h.editor.text = existing;
    audio(await startRecording(h));
    await stopAndSettle(h);
    assert.equal(h.editor.text, expected);
    assert.equal(h.submitted, 0);
  }
});

test("an empty transcript leaves the composer unchanged and says nothing was recognized", async () => {
  const h = await harness();
  respond(h, "");
  h.editor.text = "keep me";
  audio(await startRecording(h));
  await stopAndSettle(h);
  assert.equal(h.editor.text, "keep me");
  assert.match(h.messages(), /Nothing was recognized/);
});

test("Escape while recording stops the recorder, sends nothing, and never reaches the editor", async () => {
  const h = await harness();
  const child = await startRecording(h);
  audio(child);
  assert.equal(h.sendKey("a"), false, "other keys pass through");
  assert.equal(h.sendKey("\r"), false, "Enter is never intercepted");
  assert.equal(h.sendKey("\x1b"), true);
  assert.deepEqual(child.signals, ["SIGINT"]);
  assert.equal(h.talkStatuses.at(-1), undefined);
  assert.equal(h.sendKey("\x1b"), false, "the key is released once the recording is gone");
  await h.until(() => h.fetchCalls.length === 0);
  assert.equal(h.fetchCalls.length, 0);
  assert.equal(h.editor.text, "");
});

test("a recording stopped at the time cap is held unsent, and the next press transcribes it once", async () => {
  const h = await harness({ config: baseConfig({ maxSeconds: 1 }) });
  const child = await startRecording(h);
  audio(child, 40000);
  await h.until(() => mixed(h.talkStatuses).includes("limit reached"));
  assert.deepEqual(child.signals, ["SIGINT"]);
  assert.match(h.talkStatuses.at(-1)!, /Recording limit reached \(1 s\), not sent — alt\+t transcribe · Esc discard/);
  assert.equal(h.fetchCalls.length, 0);
  assert.equal(h.notices.length, 0, "a requested stop is not a failure");
  await h.pressShortcut();
  await h.until(() => h.editor.text !== "");
  assert.equal(h.fetchCalls.length, 1);
  assert.equal((h.fetchCalls[0]!.init.body as Uint8Array).length, 44 + 32000);
  await h.pressShortcut();
  assert.equal(h.recorderChildren().length, 2, "the press after delivery starts a new recording");
});

test("Escape or a session change discards a held recording; the next shortcut starts a new one", async () => {
  for (const discard of [() => undefined, (h: Harness) => sessionEvent(h)]) {
    const h = await harness({ config: baseConfig({ maxSeconds: 1 }) });
    const child = await startRecording(h);
    audio(child, 40000);
    await h.until(() => mixed(h.talkStatuses).includes("limit reached"));
    if (discard.length === 0) assert.equal(h.sendKey("\x1b"), true);
    else discard(h);
    assert.equal(h.talkStatuses.at(-1), undefined);
    assert.equal(h.fetchCalls.length, 0);
    await startRecording(h);
    assert.equal(h.recorderChildren().length, 2);
    assert.equal(h.fetchCalls.length, 0, "the discarded audio is never sent");
  }
});

test("a tap shorter than 0.5 seconds is discarded with a message and nothing is sent", async () => {
  const h = await harness();
  const child = await startRecording(h);
  audio(child);
  h.advance(400);
  await h.pressShortcut();
  assert.match(h.messages(), /shorter than 0.5 seconds/);
  assert.deepEqual(child.signals, ["SIGINT"]);
  assert.equal(h.fetchCalls.length, 0);
  assert.equal(h.talkStatuses.at(-1), undefined);
});

test("a press during transcription is refused, Escape is not taken, and no second recording starts", async () => {
  const h = await harness();
  let release!: (response: Response) => void;
  h.setFetch(() => new Promise<Response>((resolve) => (release = resolve)));
  audio(await startRecording(h));
  h.advance(2000);
  await h.pressShortcut();
  await h.until(() => h.fetchCalls.length === 1);
  await h.pressShortcut();
  await h.runTalk("");
  assert.equal(h.notices.filter((n) => /still in progress/.test(n.message)).length, 2);
  assert.equal(h.recorderChildren().length, 1);
  assert.equal(h.sendKey("\x1b"), false);
  release(json({ results: { channels: [{ alternatives: [{ transcript: "ok" }] }] } }));
  await h.until(() => h.editor.text === "ok");
});

test("starting a recording stops this extension's own player and waits for its exit; speech is refused while recording", async () => {
  const h = await harness();
  h.setFetch(async () => audioResponse());
  await h.run("text hello");
  await h.until(() => h.children.length === 1);
  const player = h.children[0]!;
  player.autoExitOnKill = false;
  const pressed = h.pressShortcut();
  await h.until(() => player.signals.includes("SIGTERM"));
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(h.recorderChildren().length, 0, "the recorder waits for the player's real exit");
  assert.equal(h.messages(), "");
  await h.run("text refused");
  assert.match(h.messages(), /recording is in progress or held/);
  player.emit("exit", null, "SIGTERM");
  await pressed;
  await h.until(() => h.recorderChildren().length === 1);
  assert.deepEqual(player.signals, ["SIGTERM"], "nothing else was signalled");
  const fetchesBefore = h.fetchCalls.length;
  await h.run("text still refused");
  assert.equal(h.fetchCalls.length, fetchesBefore);
  assert.equal(h.children.length, 2, "no new player started");
});

/** Presses the shortcut while this extension's player is still stopping, which holds the start. */
async function pressWhilePlayerStops(h: Harness) {
  h.setFetch(async () => audioResponse());
  await h.run("text hello");
  await h.until(() => h.children.length === 1);
  const player = h.children[0]!;
  player.autoExitOnKill = false;
  const pressed = h.pressShortcut();
  await h.until(() => player.signals.includes("SIGTERM"));
  return { player, pressed, fetchesBefore: h.fetchCalls.length };
}

test("Escape while the recording is starting cancels the attempt, is consumed, and starts no recorder", async () => {
  const h = await harness();
  const { player, pressed, fetchesBefore } = await pressWhilePlayerStops(h);
  assert.equal(h.sendKey("\x1b"), true);
  assert.equal(h.talkStatuses.at(-1), undefined);
  player.emit("exit", null, "SIGTERM");
  await pressed;
  assert.equal(h.spawnCalls.length, 1, "only the player was spawned");
  assert.equal(h.fetchCalls.length, fetchesBefore);
  assert.equal(h.keyListeners.size, 0);
  assert.equal(h.sendKey("\x1b"), false, "Escape reaches the editor once nothing is starting or recording");
});

test("a second press while the recording is starting cancels the attempt and starts no recorder", async () => {
  const h = await harness();
  const { player, pressed, fetchesBefore } = await pressWhilePlayerStops(h);
  await h.pressShortcut();
  assert.match(h.messages(), /Recording cancelled/);
  assert.equal(h.talkStatuses.at(-1), undefined);
  player.emit("exit", null, "SIGTERM");
  await pressed;
  assert.equal(h.spawnCalls.length, 1, "only the player was spawned");
  assert.equal(h.fetchCalls.length, fetchesBefore);
  assert.equal(h.keyListeners.size, 0);
  assert.equal(h.sendKey("\x1b"), false);
});

test("no recording tool names the tools looked for and starts nothing", async () => {
  const h = await harness({ recorders: [] });
  await h.pressShortcut();
  assert.match(h.messages(), /looked for rec, arecord, ffmpeg/);
  assert.equal(h.spawnCalls.length, 0);
  assert.equal(h.fetchCalls.length, 0);
  assert.equal(h.sendKey("\x1b"), false);
});

test("a recorder that exits on its own, or records nothing, is reported and sends nothing", async () => {
  const h = await harness();
  const first = await startRecording(h);
  audio(first);
  first.finish(1);
  await h.until(() => /Recording failed/.test(h.messages()));
  assert.equal(h.talkStatuses.at(-1), undefined);
  assert.equal(h.sendKey("\x1b"), false);

  const second = await startRecording(h);
  h.advance(2000);
  await h.pressShortcut();
  await h.until(() => h.notices.filter((n) => /Recording failed/.test(n.message)).length === 2);
  assert.match(h.notices.at(-1)!.message, /recorded no audio/);
  assert.deepEqual(second.signals, ["SIGINT"]);
  assert.equal(h.fetchCalls.length, 0);
});

test("shutdown or session replacement during a recording stops the recorder and leaves no file", async () => {
  for (const event of ["session_shutdown", "session_before_switch", "session_before_fork", "session_tree"]) {
    const h = await harness();
    const child = await startRecording(h);
    audio(child);
    sessionEvent(h, event);
    assert.deepEqual(child.signals, ["SIGINT"]);
    assert.equal(h.talkStatuses.at(-1), undefined);
    assert.equal(h.sendKey("\x1b"), false);
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(h.fetchCalls.length, 0);
    const files = (await readdir(h.dir, { recursive: true })).filter((name) => /\.(wav|pcm|raw)$/.test(name));
    assert.deepEqual(files, []);
  }
});

test("a transcript that arrives after the session was replaced is dropped", async () => {
  const h = await harness();
  let release!: (response: Response) => void;
  h.setFetch(() => new Promise<Response>((resolve) => (release = resolve)));
  audio(await startRecording(h));
  h.advance(2000);
  await h.pressShortcut();
  await h.until(() => h.fetchCalls.length === 1);
  sessionEvent(h);
  assert.equal((h.fetchCalls[0]!.init.signal as AbortSignal).aborted, true);
  release(json({ results: { channels: [{ alternatives: [{ transcript: "late" }] }] } }));
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(h.editor.text, "");
  assert.equal(h.messages(), "");
  assert.equal(h.talkStatuses.at(-1), undefined);
});

test("a session override applies from the next recording and is not written to the configuration", async () => {
  const h = await harness({ config: baseConfig({ provider: "deepgram" }), apiKey: "eleven-test-key" });
  const path = join(h.dir, "config", "pi-speak", "config.json");
  const before = await readFile(path, "utf8");
  await h.runTalk("provider elevenlabs");
  audio(await startRecording(h));
  await stopAndSettle(h);
  assert.equal(new URL(h.fetchCalls[0]!.url).host, "api.elevenlabs.io");
  assert.equal(await readFile(path, "utf8"), before);

  const restarted = await harness({ config: baseConfig({ provider: "deepgram" }), apiKey: "eleven-test-key" });
  audio(await startRecording(restarted));
  await stopAndSettle(restarted);
  assert.equal(new URL(restarted.fetchCalls[0]!.url).host, "api.deepgram.com");
});

test("provider, model, and language are fixed when a recording starts", async () => {
  const h = await harness({ apiKey: "eleven-test-key" });
  audio(await startRecording(h));
  await h.runTalk("provider elevenlabs");
  await h.writeConfig(baseConfig({ language: "en" }));
  await stopAndSettle(h);
  assert.deepEqual(h.fetchCalls.map((call) => new URL(call.url).host), ["api.deepgram.com"]);
  assert.match(h.fetchCalls[0]!.url, /language=vi$/);

  audio(await startRecording(h));
  await stopAndSettle(h);
  assert.deepEqual(h.fetchCalls.map((call) => new URL(call.url).host), ["api.deepgram.com", "api.elevenlabs.io"]);
});

test("a malformed input.language is reported and no recording starts", async () => {
  const h = await harness({ config: baseConfig({ language: "not a tag!" }) });
  await h.pressShortcut();
  assert.match(h.messages(), /input\.language/);
  assert.equal(h.recorderChildren().length, 0);
  assert.equal(h.fetchCalls.length, 0);
});

test("a provider failure is shown sanitized, not retried or rerouted, and clears the indicator", async () => {
  const key = "deepgramtokenkey";
  const h = await harness({ deepgramKey: key, apiKey: "eleven-test-key" });
  h.setFetch(async () => json({ detail: { status: key } }, 401));
  audio(await startRecording(h));
  await stopAndSettle(h);
  assert.equal(h.fetchCalls.length, 1);
  assert.match(h.messages(), /Deepgram rejected the API key/);
  assert.doesNotMatch(h.messages(), new RegExp(key));
  assert.equal(h.editor.text, "");
  assert.equal(h.sendKey("\x1b"), false);
  h.setFetch(async () => new Response(null, { status: 302, headers: { location: "https://evil.example" } }));
  audio(await startRecording(h));
  await stopAndSettle(h);
  assert.equal(h.fetchCalls.length, 2);
  assert.match(h.notices.at(-1)!.message, /redirect, which is not followed/);
});
