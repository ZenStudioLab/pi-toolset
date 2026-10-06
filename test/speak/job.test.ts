import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, test } from "node:test";
import {
  API_KEY,
  VALID_CONFIG,
  audioResponse,
  createHarness,
} from "./harness.ts";

type Harness = Awaited<ReturnType<typeof createHarness>>;
const open: Harness[] = [];
afterEach(async () => {
  while (open.length > 0) await open.pop()!.cleanup();
});
async function harness(
  options?: Parameters<typeof createHarness>[0],
): Promise<Harness> {
  const h = await createHarness(options);
  open.push(h);
  return h;
}
/** Starts speech and waits until the fake player has been launched. */
async function startPlaying(h: Harness, text = "hello") {
  const wanted = h.children.length + 1;
  const command = "text " + text;
  await h.run(command);
  await h.until(() => h.children.length === wanted);
  return h.children[wanted - 1];
}
const hasSigterm = (child: { signals: unknown[] }) =>
  child.signals.includes("SIGTERM");

test("speech makes one documented request, caches the clip, and plays it without the key or a shell", async () => {
  const h = await harness();
  const child = await startPlaying(h);
  assert.equal(h.fetchCalls.length, 1);
  const call = h.fetchCalls[0];
  assert.equal(
    call.url,
    "https://api.elevenlabs.io/v1/text-to-speech/AbCdEf1234567890?output_format=mp3_44100_128",
  );
  assert.equal(
    (call.init.headers as Record<string, string>)["xi-api-key"],
    API_KEY,
  );
  assert.equal(call.init.redirect, "manual");

  const files = await h.cacheFiles();
  assert.equal(files.length, 1);
  assert.match(files[0], /^[0-9a-f]{64}\.mp3$/);
  const spawn = h.spawnCalls[0];
  assert.equal(spawn.command, "fakeplayer");
  assert.equal(spawn.args[0], "--play");
  assert.equal(spawn.args[1], join(h.dir, "cache", "pi-speak", files[0]));
  assert.equal(spawn.options.shell, false);
  const env = spawn.options.env as Record<string, string>;
  assert.equal(env.ELEVENLABS_API_KEY, undefined);
  assert.equal(env.UNRELATED, "kept");

  child.finish(0);
  await h.controller.whenIdle();
  assert.deepEqual(h.notices, []);
  assert.deepEqual(h.statuses.filter(Boolean), [
    "speak: preparing",
    "speak: generating",
    "speak: playing",
  ]);
  assert.equal(h.statuses.at(-1), undefined);

  await h.run("text hello");
  await h.until(() => h.children.length === 2);
  assert.equal(
    h.fetchCalls.length,
    1,
    "identical text is served from the cache",
  );
});

test("a second request while one is active is refused, even in the same instant", async () => {
  const h = await harness();
  await Promise.all([h.run("text first"), h.run("text second")]);
  await h.until(() => h.children.length === 1);
  assert.equal(h.fetchCalls.length, 1);
  assert.match(h.messages(), /already active/);
  await h.run("text third");
  assert.equal(h.fetchCalls.length, 1);
  assert.equal(
    h.notices.filter((notice) => /already active/.test(notice.message)).length,
    2,
  );
});

test("stop during generation aborts the request, leaves nothing behind, and frees the job", async () => {
  const h = await harness();
  let aborted = false;
  h.setFetch(
    (call) =>
      new Promise((_resolve, reject) =>
        call.init.signal!.addEventListener("abort", () => {
          aborted = true;
          reject(new DOMException("aborted", "AbortError"));
        }),
      ),
  );
  await h.run("text hello");
  await h.until(() => h.fetchCalls.length === 1);
  await h.run("stop");
  await h.controller.whenIdle();
  assert.ok(aborted);
  assert.match(h.messages(), /Stopped\./);
  assert.doesNotMatch(h.messages(), /failed/i);
  assert.equal(h.spawnCalls.length, 0);
  assert.deepEqual(await h.cacheFiles(), []);
  assert.equal(h.aborts, 0, "the coding agent is never aborted");

  h.setFetch(async () => audioResponse());
  await startPlaying(h);
  assert.equal(h.fetchCalls.length, 2);
});

test("a response that arrives after stop never plays or caches", async () => {
  const h = await harness();
  let release!: () => void;
  h.setFetch(
    () => new Promise((resolve) => (release = () => resolve(audioResponse()))),
  );
  await h.run("text hello");
  await h.until(() => h.fetchCalls.length === 1);
  await h.run("stop");
  release();
  await h.controller.whenIdle();
  assert.equal(h.spawnCalls.length, 0);
  assert.deepEqual(await h.cacheFiles(), []);
  assert.doesNotMatch(h.messages(), /failed/i);
});

test("a late finish of a cancelled job cannot disturb the job that replaced it", async () => {
  const h = await harness();
  let release!: () => void;
  h.setFetch(
    () => new Promise((resolve) => (release = () => resolve(audioResponse()))),
  );
  await h.run("text one");
  await h.until(() => h.fetchCalls.length === 1);
  const staleRelease = release;
  await h.run("stop");
  h.setFetch(async () => audioResponse());
  await startPlaying(h, "two");
  staleRelease();
  await h.until(() => h.statuses.length > 0);
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert.equal(h.children.length, 1, "the stale job started no second player");
  assert.equal(
    h.statuses.at(-1),
    "speak: playing",
    "the stale job did not clear the newer job's status",
  );
  await h.run("status");
  assert.match(h.notices.at(-1)!.message, /job: playing/);
});

test("stop during playback ends only the player and is not reported as a failure", async () => {
  const h = await harness();
  const child = await startPlaying(h);
  await h.run("stop");
  await h.until(() => hasSigterm(child));
  await h.controller.whenIdle();
  assert.doesNotMatch(h.messages(), /Playback failed/);
  assert.match(h.messages(), /Stopped\./);
  await startPlaying(h, "again");
});

test("stop with nothing active says so", async () => {
  const h = await harness();
  await h.run("stop");
  assert.match(h.messages(), /Nothing is being generated or played/);
});

test("a failing player is reported with its exit code", async () => {
  const h = await harness();
  (await startPlaying(h)).finish(3);
  await h.controller.whenIdle();
  assert.match(h.messages(), /Playback failed: exit code 3/);
});

test("provider errors are sanitized, never retried, and leave no clip", async () => {
  const h = await harness();
  h.setFetch(
    async () =>
      new Response(JSON.stringify({ detail: { message: `bad ${API_KEY}` } }), {
        status: 401,
      }),
  );
  await h.run("text hello");
  await h.controller.whenIdle();
  assert.match(h.messages(), /rejected the API key/);
  assert.doesNotMatch(h.messages(), new RegExp(API_KEY));
  assert.equal(h.fetchCalls.length, 1);
  assert.deepEqual(await h.cacheFiles(), []);
  assert.equal(h.spawnCalls.length, 0);
});

test("an unexpected failure inside a job is reported and releases the job", async () => {
  const h = await harness();
  h.env.XDG_CACHE_HOME = join(h.dir, "config", "pi-speak", "config.json");
  await h.run("text hello");
  await h.controller.whenIdle();
  assert.match(h.messages(), /Speech failed:/);
  assert.equal(h.fetchCalls.length, 0);
  await h.run("status");
  assert.match(
    h.notices.at(-1)!.message,
    /cache: .* \(unreadable\)/,
    "status still answers when the cache cannot be read",
  );
  h.env.XDG_CACHE_HOME = join(h.dir, "cache");
  await startPlaying(h);
});

test("replay plays the last clip without a request, and never regenerates a missing one", async () => {
  const h = await harness();
  await h.run("replay");
  assert.match(h.messages(), /Nothing to replay in this session/);

  (await startPlaying(h)).finish(0);
  await h.controller.whenIdle();
  await h.run("replay");
  await h.until(() => h.children.length === 2);
  assert.equal(h.fetchCalls.length, 1);
  h.children[1].finish(0);
  await h.controller.whenIdle();

  await rm(join(h.dir, "cache"), { recursive: true, force: true });
  await h.run("replay");
  await h.controller.whenIdle();
  assert.match(h.messages(), /no longer in the cache/);
  assert.equal(h.fetchCalls.length, 1);
  assert.equal(h.spawnCalls.length, 2);
  h.notices.length = 0;
  await h.run("replay");
  assert.match(h.messages(), /Nothing to replay in this session/);
});

for (const event of [
  "session_shutdown",
  "session_before_switch",
  "session_before_fork",
  "session_tree",
]) {
  test(`${event} stops playback and forgets the previous clip`, async () => {
    const h = await harness();
    const child = await startPlaying(h);
    h.events.get(event)!();
    await h.until(() => hasSigterm(child));
    await h.controller.whenIdle();
    assert.doesNotMatch(h.messages(), /failed/i);
    await h.run("replay");
    assert.match(h.messages(), /Nothing to replay in this session/);
    assert.equal(h.fetchCalls.length, 1);
  });
}

test("status shows redacted configuration, key presence, job state, and cache usage without a request", async () => {
  const h = await harness();
  const child = await startPlaying(h);
  await h.run("status");
  const during = h.notices.at(-1)!.message;
  assert.match(during, /job: playing/);
  child.finish(0);
  await h.controller.whenIdle();
  await h.run("status");
  const after = h.notices.at(-1)!.message;
  assert.match(after, /voice: \.\.\.7890/);
  assert.match(after, /ELEVENLABS_API_KEY: present/);
  assert.match(after, /job: idle/);
  assert.match(after, /\(1 clips, 4 bytes\)/);
  for (const text of [during, after]) {
    assert.doesNotMatch(text, new RegExp(API_KEY));
    assert.doesNotMatch(text, new RegExp(VALID_CONFIG.voiceId));
  }
  assert.equal(h.fetchCalls.length, 1);
});
