import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { join } from "node:path";
import { SessionManager } from "@earendil-works/pi-coding-agent";
import { SPEAK_USAGE, TALK_USAGE } from "../../extensions/speak/index.ts";
import { VALID_CONFIG, answer, createHarness } from "./harness.ts";
import {
  TRANSLATION_CONFIG,
  translatedMessage,
  translationFixture,
} from "./translation-fixture.ts";

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
const quiet = (h: Harness) => {
  assert.equal(h.fetchCalls.length, 0, "no provider request");
  assert.equal(h.spawnCalls.length, 0, "no player started");
};

for (const mode of ["", "original"])
  for (const retention of ["assistant-only", "none"])
    test(`${mode || "localized"} routing speaks original transcript after ${retention} compaction`, async () => {
      const h = await harness({
        config: { ...VALID_CONFIG, translation: TRANSLATION_CONFIG },
      });
      const session = SessionManager.inMemory(h.dir);
      const ids = answer("Original answer.").map((message) =>
        session.appendMessage(message as never),
      );
      session.appendCompaction(
        "Summary text must not be spoken.",
        retention === "none" ? null : ids[1],
        100,
      );
      const translation = translationFixture();
      translation.setResult(async () =>
        translatedMessage("Translated original answer."),
      );
      await h.run(mode, {
        sessionManager: session,
        registry: translation.registry,
      });
      assert.deepEqual(
        h.notices,
        [],
        "compaction must not cause a no-turn refusal",
      );
      await h.until(() => h.children.length === 1);
      assert.equal(
        JSON.parse(h.fetchCalls[0].init.body as string).text,
        mode ? "Original answer." : "Translated original answer.",
      );
      assert.equal(translation.calls.length, mode ? 0 : 1);
      if (!mode) {
        assert.match(
          JSON.stringify(translation.calls[0].context),
          /Original answer\./,
        );
        assert.doesNotMatch(
          JSON.stringify(translation.calls[0].context),
          /Summary text|question/,
        );
      }
      h.children[0].finish(0);
      await h.controller.whenIdle();
      assert.deepEqual(h.notices, []);
    });

for (const mode of ["", "original"])
  test(`${mode || "localized"} routing refuses hidden failed turns, missing project and foreign project without calls`, async () => {
    const h = await harness({
      config: { ...VALID_CONFIG, translation: TRANSLATION_CONFIG },
    });
    const translation = translationFixture();
    for (const stopReason of [
      "aborted",
      "error",
      "length",
      "toolUse",
      "unanswered",
    ]) {
      const session = SessionManager.inMemory(h.dir);
      for (const message of answer("Older success."))
        session.appendMessage(message as never);
      session.appendMessage({
        role: "user",
        content: "Latest question",
        timestamp: 3,
      });
      if (stopReason !== "unanswered")
        session.appendMessage({
          ...answer("Partial answer.")[1],
          stopReason,
        } as never);
      session.appendCompaction("Summary claims success.", null, 100);
      await h.run(mode, {
        sessionManager: session,
        registry: translation.registry,
      });
      assert.match(
        h.notices.at(-1)!.message,
        stopReason === "unanswered"
          ? /no assistant answer/
          : /not completed normally/,
      );
    }
    const foreign = SessionManager.inMemory(join(h.dir, "other-project"));
    for (const message of answer("Foreign answer."))
      foreign.appendMessage(message as never);
    await h.run(mode, {
      sessionManager: foreign,
      registry: translation.registry,
    });
    assert.match(h.notices.at(-1)!.message, /project.*does not match/);
    await h.run(mode, {
      sessionManager: {
        getHeader: () => null,
        getBranch: () => {
          throw new Error("must not read history");
        },
      },
      registry: translation.registry,
    });
    assert.match(h.notices.at(-1)!.message, /project.*unavailable/);
    quiet(h);
    assert.equal(translation.calls.length, 0);
    assert.equal(
      translation.lookups.length,
      0,
      "refused before translation setup",
    );
  });

test("an unknown subcommand and an empty text command show usage and do nothing else", async () => {
  const h = await harness();
  for (const args of [
    "frobnicate",
    "textual",
    "text",
    "text   \n\t ",
    "text \u001b[0m",
  ])
    await h.run(args);
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
    [
      "/speak summary is not available in this version.",
      "/speak cache-clear is not available in this version.",
      "/speak summary is not available in this version.",
    ],
  );
  assert.deepEqual(await h.cacheFiles(), before);
  assert.equal(
    h.fetchCalls.length,
    1,
    "only the earlier explicit text request",
  );
});

test("outside the interactive terminal nothing is spoken, while stop and status still answer", async () => {
  const h = await harness();
  for (const args of ["", "original", "text hi", "replay"])
    await h.run(args, { mode: "rpc", messages: answer("hi") });
  assert.equal(h.notices.length, 4);
  assert.ok(
    h.notices.every((notice) => /interactive terminal/.test(notice.message)),
  );
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
  await h.run("", {
    messages: [
      ...answer("old"),
      { role: "user", content: "q2", timestamp: 3 },
      {
        role: "assistant",
        content: [{ type: "text", text: "partial" }],
        stopReason: "aborted",
        timestamp: 4,
      },
    ],
  });
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

test("the original answer is cleaned and spoken, with shell-looking text sent as plain data", async () => {
  const h = await harness();
  await h.run("original", {
    messages: answer(
      "The build did **not** pass:\n\n```sh\nnpm test\n```\n\nSee [the log](https://x.example/log).",
    ),
  });
  await h.until(() => h.children.length === 1);
  assert.deepEqual(JSON.parse(h.fetchCalls[0].init.body as string), {
    text: "The build did not pass:\n\nSee the log.",
    model_id: "eleven_flash_v2_5",
  });
  h.children[0].finish(0);
  await h.controller.whenIdle();

  await h.run('text $(touch /tmp/x); echo "hi" | cat');
  await h.until(() => h.children.length === 2);
  assert.equal(
    JSON.parse(h.fetchCalls[1].init.body as string).text,
    '$(touch /tmp/x); echo "hi" | cat',
  );
  assert.equal(h.spawnCalls[1].options.shell, false);
  assert.equal(h.spawnCalls[1].command, "fakeplayer");
});

const preflightFailures: [
  string,
  Parameters<typeof createHarness>[0],
  string,
  RegExp,
][] = [
  [
    "no configuration file",
    { config: null },
    "text hello",
    /not configured: no configuration file/,
  ],
  [
    "the placeholder voice",
    { config: { ...VALID_CONFIG, providers: { elevenlabs: { ...VALID_CONFIG.providers.elevenlabs, voiceId: "SET_YOUR_AUTHORIZED_VOICE_ID" } } } },
    "text hello",
    /placeholder/,
  ],
  [
    "a missing model",
    { config: { providers: { elevenlabs: { voiceId: "AbCdEf1234567890" } }, player: VALID_CONFIG.player } },
    "text hello",
    /providers\.elevenlabs\.voiceId and providers\.elevenlabs\.modelId/,
  ],
  [
    "text over the limit",
    {},
    `text ${"a".repeat(10001)}`,
    /10001 characters and the elevenlabs limit is 10000/,
  ],
  [
    "a missing player",
    {
      config: {
        ...VALID_CONFIG,
        player: { command: "no-such-player", args: ["{file}"] },
      },
    },
    "text hello",
    /"no-such-player" was not found/,
  ],
  [
    "a missing API key",
    { apiKey: null },
    "text hello",
    /ELEVENLABS_API_KEY is not set/,
  ],
];
for (const [name, options, args, message] of preflightFailures)
  test(`preflight stops before any request: ${name}`, async () => {
    const h = await harness(options);
    await h.run(args);
    await h.controller.whenIdle();
    assert.match(h.messages(), message);
    quiet(h);
    await h.run("status");
    assert.match(
      h.notices.at(-1)!.message,
      /job: idle/,
      "the failed job released its claim",
    );
  });

test("exactly 10000 characters is accepted with no confirmation step", async () => {
  const h = await harness();
  const text = "a".repeat(10000);
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

test("speech provider override reports, resets, and makes no request", async () => {
  const h = await harness({
    config: { ...VALID_CONFIG, provider: "elevenlabs" },
  });
  await h.run("provider deepgram");
  assert.match(h.messages(), /speech provider: deepgram \(session override\)/);
  await h.run("provider");
  assert.match(h.messages(), /speech provider: deepgram \(session override\)/);
  await h.run("provider reset");
  assert.match(h.messages(), /speech provider: elevenlabs$/);
  assert.equal(h.fetchCalls.length, 0);
  assert.equal(h.spawnCalls.length, 0);
});

test("session navigation cleanup preserves both provider overrides until explicit reset", async () => {
  const h = await harness({ config: { ...VALID_CONFIG, input: { provider: "deepgram" } } });
  await h.run("provider deepgram");
  await h.runTalk("provider elevenlabs");

  for (const event of [
    "session_before_switch",
    "session_before_fork",
    "session_tree",
    "session_shutdown",
  ]) {
    h.events.get(event)!();
    await h.run("provider");
    assert.match(h.notices.at(-1)!.message, /speech provider: deepgram \(session override\)/);
    await h.runTalk("provider");
    assert.match(h.notices.at(-1)!.message, /input provider: elevenlabs \(session override\)/);
  }

  await h.run("provider reset");
  await h.runTalk("provider reset");
  await h.run("provider");
  assert.match(h.notices.at(-1)!.message, /speech provider: elevenlabs$/);
  await h.runTalk("provider");
  assert.match(h.notices.at(-1)!.message, /input provider: deepgram$/);
  quiet(h);
});

test("unknown provider names show usage and preserve the override", async () => {
  const h = await harness();
  await h.run("provider deepgram");
  await h.run("provider openai");
  assert.match(h.notices.at(-1)!.message, /Usage: \/speak provider/);
  await h.run("provider");
  assert.match(h.notices.at(-1)!.message, /deepgram \(session override\)/);
  await h.runTalk("provider whisper");
  assert.equal(h.notices.at(-1)!.message, TALK_USAGE);
  await h.runTalk("provider");
  assert.match(h.notices.at(-1)!.message, /input provider: deepgram/);
  assert.equal(h.fetchCalls.length, 0);
});

test("status reports both key presences and marks the speech override without values", async () => {
  const h = await harness({
    deepgramKey: "deepgram-secret-value",
    config: {
      ...VALID_CONFIG,
      providers: {
        elevenlabs: VALID_CONFIG.providers.elevenlabs,
        deepgram: { voice: "aura-2-thalia-en" },
      },
      input: { provider: "deepgram", language: "VI-vn" },
    },
  });
  await h.run("provider deepgram");
  await h.run("status");
  const text = h.notices.at(-1)!.message;
  assert.match(text, /speech provider: deepgram \(session override\)/);
  assert.match(text, /input provider: deepgram/);
  assert.match(text, /input language: vi-VN/);
  assert.match(text, /ELEVENLABS_API_KEY: present/);
  assert.match(text, /DEEPGRAM_API_KEY: present/);
  assert.match(text, /model: Aura voice model/);
  assert.match(text, /input model: nova-3/);
  assert.doesNotMatch(text, /aura-2-thalia-en/);
  assert.doesNotMatch(text, /^model:.*nova-3$/m);
  assert.doesNotMatch(text, /test-secret-key|deepgram-secret-value/);
  assert.equal(h.fetchCalls.length, 0);
});
