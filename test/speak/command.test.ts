import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { SPEAK_USAGE } from "../../extensions/speak/index.ts";
import { VALID_CONFIG, answer, createHarness } from "./harness.ts";

type Harness = Awaited<ReturnType<typeof createHarness>>;
const open: Harness[] = [];
afterEach(async () => {
  while (open.length > 0) await open.pop()!.cleanup();
});
async function harness(options?: Parameters<typeof createHarness>[0]): Promise<Harness> {
  const h = await createHarness(options);
  open.push(h);
  return h;
}
const quiet = (h: Harness) => {
  assert.equal(h.fetchCalls.length, 0, "no provider request");
  assert.equal(h.spawnCalls.length, 0, "no player started");
};

test("an unknown subcommand and an empty text command show usage and do nothing else", async () => {
  const h = await harness();
  for (const args of ["frobnicate", "textual", "text", "text   \n\t ", "text \u001b[0m"]) await h.run(args);
  assert.equal(h.notices.length, 5);
  assert.ok(h.notices.every((notice) => notice.message === SPEAK_USAGE));
  quiet(h);
});

test("summary and cache-clear are unavailable in this version and change nothing", async () => {
  const h = await harness();
  await h.run("text hello");
  await h.until(() => h.children.length === 1);
  const before = await h.cacheFiles();
  h.notices.length = 0;
  for (const name of ["summary", "cache-clear", "Summary"]) await h.run(name);
  assert.deepEqual(
    h.notices.map((notice) => notice.message),
    ["/speak summary is not available in this version.", "/speak cache-clear is not available in this version.", "/speak summary is not available in this version."],
  );
  assert.deepEqual(await h.cacheFiles(), before);
  assert.equal(h.fetchCalls.length, 1, "only the earlier explicit text request");
});

test("outside the interactive terminal nothing is spoken, while stop and status still answer", async () => {
  const h = await harness();
  for (const args of ["", "text hi", "replay"]) await h.run(args, { mode: "rpc", messages: answer("hi") });
  assert.equal(h.notices.length, 3);
  assert.ok(h.notices.every((notice) => /interactive terminal/.test(notice.message)));
  await h.run("stop", { mode: "rpc" });
  await h.run("status", { mode: "print" });
  assert.match(h.notices.at(-1)!.message, /job: idle/);
  quiet(h);
});

test("a busy agent and an unusable latest answer are reported without any request", async () => {
  const h = await harness();
  await h.run("", { idle: false, messages: answer("hi") });
  await h.run("", { pending: true, messages: answer("hi") });
  await h.run("", { messages: [] });
  await h.run("", { messages: [{ role: "user", content: "q", timestamp: 1 }] });
  await h.run("", { messages: [...answer("old"), { role: "user", content: "q2", timestamp: 3 }, { role: "assistant", content: [{ type: "text", text: "partial" }], stopReason: "aborted", timestamp: 4 }] });
  await h.run("", { messages: answer("```js\nconst x = 1;\n```") });
  const messages = h.notices.map((notice) => notice.message);
  assert.match(messages[0], /still working/);
  assert.match(messages[1], /still working/);
  assert.match(messages[2], /no conversation turn/);
  assert.match(messages[3], /no assistant answer/);
  assert.match(messages[4], /not completed normally/);
  assert.match(messages[5], /nothing speakable/);
  quiet(h);
});

test("the latest answer is cleaned and spoken, with shell-looking text sent as plain data", async () => {
  const h = await harness();
  await h.run("", { messages: answer("The build did **not** pass:\n\n```sh\nnpm test\n```\n\nSee [the log](https://x.example/log).") });
  await h.until(() => h.children.length === 1);
  assert.deepEqual(JSON.parse(h.fetchCalls[0].init.body as string), {
    text: "The build did not pass:\n\nSee the log.",
    model_id: "eleven_flash_v2_5",
  });
  h.children[0].finish(0);
  await h.controller.whenIdle();

  await h.run('text $(touch /tmp/x); echo "hi" | cat');
  await h.until(() => h.children.length === 2);
  assert.equal(JSON.parse(h.fetchCalls[1].init.body as string).text, '$(touch /tmp/x); echo "hi" | cat');
  assert.equal(h.spawnCalls[1].options.shell, false);
  assert.equal(h.spawnCalls[1].command, "fakeplayer");
});

const preflightFailures: [string, Parameters<typeof createHarness>[0], string, RegExp][] = [
  ["no configuration file", { config: null }, "text hello", /not configured: no configuration file/],
  ["the placeholder voice", { config: { ...VALID_CONFIG, voiceId: "SET_YOUR_AUTHORIZED_VOICE_ID" } }, "text hello", /placeholder/],
  ["a missing model", { config: { voiceId: VALID_CONFIG.voiceId, player: VALID_CONFIG.player } }, "text hello", /modelId is not set/],
  ["text over the limit", {}, `text ${"a".repeat(4001)}`, /4001 characters and the limit is 4000/],
  ["a missing player", { config: { ...VALID_CONFIG, player: { command: "no-such-player", args: ["{file}"] } } }, "text hello", /"no-such-player" was not found/],
  ["a missing API key", { apiKey: null }, "text hello", /ELEVENLABS_API_KEY is not set/],
];
for (const [name, options, args, message] of preflightFailures)
  test(`preflight stops before any request: ${name}`, async () => {
    const h = await harness(options);
    await h.run(args);
    await h.controller.whenIdle();
    assert.match(h.messages(), message);
    quiet(h);
    await h.run("status");
    assert.match(h.notices.at(-1)!.message, /job: idle/, "the failed job released its claim");
  });

test("exactly 4000 characters is accepted with no confirmation step", async () => {
  const h = await harness();
  const text = "a".repeat(4000);
  await h.run("text " + text);
  await h.until(() => h.children.length === 1);
  assert.equal(h.fetchCalls.length, 1);
  assert.deepEqual(h.notices, []);
});

test("a cache hit needs neither the API key nor a request, but a new text does need the key", async () => {
  const h = await harness();
  await h.run("text hello");
  await h.until(() => h.children.length === 1);
  h.children[0].finish(0);
  await h.controller.whenIdle();

  delete h.env.ELEVENLABS_API_KEY;
  await h.run("text hello");
  await h.until(() => h.children.length === 2);
  assert.equal(h.fetchCalls.length, 1, "served from the cache");
  assert.equal(h.spawnCalls.length, 2);
  assert.deepEqual(h.notices, []);
  h.children[1].finish(0);
  await h.controller.whenIdle();

  await h.run("text something new");
  await h.controller.whenIdle();
  assert.match(h.messages(), /ELEVENLABS_API_KEY is not set/);
  assert.equal(h.fetchCalls.length, 1);
});
