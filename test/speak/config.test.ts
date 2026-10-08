import assert from "node:assert/strict";
import { test } from "node:test";
import {
  VOICE_ID_PLACEHOLDER,
  cacheDir,
  configPath,
  describeConfig,
  loadConfig,
  parseConfig,
  readApiKey,
} from "../../extensions/speak/config.ts";

const valid = {
  providers: {
    elevenlabs: { voiceId: "AbCdEf1234567890", modelId: "eleven_flash_v2_5" },
  },
};

test("a minimal configuration gets the documented defaults", () => {
  const result = parseConfig(valid);
  assert.ok(result.ok);
  assert.equal(result.config.locale, "vi");
  assert.equal(result.config.translation, undefined);
  assert.equal(result.config.provider, "elevenlabs");
  assert.equal(result.config.input.provider, "deepgram");
  assert.equal(result.config.input.maxSeconds, 60);
  assert.equal(result.config.input.shortcut, "alt+t");
  assert.equal(result.config.providers.elevenlabs.outputFormat, "mp3_44100_128");
  assert.equal(result.config.providers.elevenlabs.voiceRevision, 1);
  assert.equal(result.config.providers.elevenlabs.sttModel, "scribe_v2");
  assert.equal(result.config.providers.deepgram.sttModel, "nova-3");
  assert.equal(result.config.hardLimitChars, 10000);
  assert.equal(result.config.requestTimeoutMs, 45_000);
  assert.equal(result.config.cache.ttlDays, 7);
  assert.equal(result.config.cache.maxBytes, 100 * 1024 * 1024);
  assert.equal(result.config.player.command, "ffplay");
  assert.ok(result.config.player.args.includes("{file}"));
});

const invalid: [string, unknown, RegExp][] = [
  ["not an object", [], /JSON object/],
  [
    "placeholder voice",
    { providers: { elevenlabs: { ...valid.providers.elevenlabs, voiceId: VOICE_ID_PLACEHOLDER } } },
    /placeholder/,
  ],
  [
    "unsafe voice characters",
    { providers: { elevenlabs: { ...valid.providers.elevenlabs, voiceId: "a/b/c/d/e/f" } } },
    /voiceId must be/,
  ],
  [
    "limit above the ceiling",
    { ...valid, hardLimitChars: 10001 },
    /hardLimitChars must be between/,
  ],
  [
    "limit of zero",
    { ...valid, hardLimitChars: 0 },
    /hardLimitChars must be between/,
  ],
  [
    "fractional timeout",
    { ...valid, requestTimeoutMs: 1500.5 },
    /requestTimeoutMs must be an integer/,
  ],
  [
    "timeout too short",
    { ...valid, requestTimeoutMs: 10 },
    /requestTimeoutMs must be between/,
  ],
  [
    "player without file token",
    { ...valid, player: { args: ["-x"] } },
    /exactly once/,
  ],
  [
    "player with two file tokens",
    { ...valid, player: { args: ["{file}", "{file}"] } },
    /exactly once/,
  ],
  [
    "cache cap too small",
    { ...valid, cache: { maxBytes: 10 } },
    /cache.maxBytes must be between/,
  ],
  ["other provider", { ...valid, provider: "google" }, /provider must be/],
  ["empty locale", { ...valid, locale: "" }, /locale must be/],
  ["malformed locale", { ...valid, locale: "vi_VN" }, /locale must be/],
  ["null locale", { ...valid, locale: null }, /locale must be/],
  [
    "invalid translation",
    { ...valid, translation: {} },
    /translation.provider is not set/,
  ],
  ...["unknown", null, 1].map((thinking): [string, unknown, RegExp] => [
    `invalid translation thinking ${thinking}`,
    {
      ...valid,
      translation: { provider: "openai-codex", model: "gpt-6-luna", thinking },
    },
    /translation.thinking must be/,
  ]),
  [
    "translation credentials",
    {
      ...valid,
      translation: { provider: "openai", model: "gpt-test", apiKey: "secret" },
    },
    /credentials belong/,
  ],
];
for (const [name, input, expected] of invalid)
  test(`rejects ${name}`, () => {
    const result = parseConfig(input);
    assert.ok(!result.ok);
    assert.match(result.problem, expected);
  });

test("locale is canonical and translation setup is explicit and non-secret", () => {
  const result = parseConfig({
    ...valid,
    locale: "VI-vn",
    translation: { provider: "openai-codex", model: "gpt-test" },
  });
  assert.ok(result.ok);
  assert.equal(result.config.locale, "vi-VN");
  assert.deepEqual(result.config.translation, {
    provider: "openai-codex",
    model: "gpt-test",
  });
  assert.match(
    describeConfig(result.config, true).join("\n"),
    /locale: vi-VN\ntranslation: openai-codex\/gpt-test/,
  );
});

test("translation thinking accepts native levels, stays isolated, and is shown in status", () => {
  for (const thinking of ["minimal", "low", "medium", "high", "xhigh", "max"]) {
    const result = parseConfig({
      ...valid,
      translation: { provider: "openai-codex", model: "gpt-6-luna", thinking },
    });
    assert.ok(result.ok);
    assert.equal(result.config.translation?.thinking, thinking);
    assert.match(
      describeConfig(result.config, false).join("\n"),
      new RegExp(`thinking: ${thinking}`),
    );
  }
  const omitted = parseConfig({
    ...valid,
    translation: { provider: "openai-codex", model: "gpt-6-luna" },
  });
  assert.ok(omitted.ok);
  assert.equal(omitted.config.translation?.thinking, undefined);
  assert.match(
    describeConfig(omitted.config, false).join("\n"),
    /thinking: host default/,
  );
});

test("an unknown key is named but its value is never echoed", () => {
  const result = parseConfig({ ...valid, apiKey: "sk-super-secret-value" });
  assert.ok(!result.ok);
  assert.match(result.problem, /apiKey/);
  assert.match(result.problem, /ELEVENLABS_API_KEY/);
  assert.doesNotMatch(result.problem, /super-secret/);
});

test("loadConfig reports a missing file, invalid JSON, and oversize files without throwing", async () => {
  const env = { XDG_CONFIG_HOME: "/cfg" };
  const missing = await loadConfig(env, async () => {
    throw Object.assign(new Error("x"), { code: "ENOENT" });
  });
  assert.ok(!missing.ok);
  assert.match(
    missing.problem,
    /no configuration file at \/cfg\/pi-speak\/config\.json/,
  );
  const bad = await loadConfig(env, async () => "{nope");
  assert.ok(!bad.ok && /not valid JSON/.test(bad.problem));
  const big = await loadConfig(env, async () => " ".repeat(70 * 1024));
  assert.ok(!big.ok && /larger than/.test(big.problem));
  const good = await loadConfig(env, async () => JSON.stringify(valid));
  assert.ok(good.ok);
});

test("paths follow XDG with a home fallback", () => {
  assert.equal(
    configPath({ XDG_CONFIG_HOME: "/x" }, "/h"),
    "/x/pi-speak/config.json",
  );
  assert.equal(configPath({}, "/h"), "/h/.config/pi-speak/config.json");
  assert.equal(cacheDir({ XDG_CACHE_HOME: "/c" }, "/h"), "/c/pi-speak");
  assert.equal(cacheDir({}, "/h"), "/h/.cache/pi-speak");
});

test("the API key comes only from the environment and is trimmed", () => {
  assert.equal(readApiKey({ ELEVENLABS_API_KEY: "  abc  " }), "abc");
  assert.equal(readApiKey({ ELEVENLABS_API_KEY: "   " }), undefined);
  assert.equal(readApiKey({}), undefined);
});

test("provider blocks and input settings are parsed independently", () => {
  const result = parseConfig({
    provider: "deepgram",
    providers: {
      elevenlabs: { voiceId: "AbCdEf1234567890", modelId: "eleven_flash_v2_5", sttModel: "scribe_v2" },
      deepgram: { voice: "aura-2-thalia-en", sttModel: "nova-3" },
    },
    input: { provider: "elevenlabs", language: "VI-vn", maxSeconds: 300, shortcut: "ctrl+r" },
  });
  assert.ok(result.ok);
  assert.equal(result.config.provider, "deepgram");
  assert.equal(result.config.input.language, "vi-VN");
  assert.equal(result.config.providers.deepgram.voice, "aura-2-thalia-en");
});

for (const [key, location] of Object.entries({
  voiceId: "providers.elevenlabs.voiceId",
  modelId: "providers.elevenlabs.modelId",
  outputFormat: "providers.elevenlabs.outputFormat",
  voiceRevision: "providers.elevenlabs.voiceRevision",
})) {
  test(`rejects old flat ${key} with its new location`, () => {
    const result = parseConfig({ ...valid, [key]: "old-value" });
    assert.ok(!result.ok);
    assert.match(result.problem, new RegExp(`${key}.*${location}`));
  });
}

for (const [name, input] of [
  ["zero", { ...valid, input: { maxSeconds: 0 } }],
  ["above maximum", { ...valid, input: { maxSeconds: 301 } }],
  ["fractional", { ...valid, input: { maxSeconds: 1.5 } }],
  ["malformed language", { ...valid, input: { language: "vi_VN" } }],
] as const) {
  test(`rejects ${name} input setting`, () => {
    const result = parseConfig(input);
    assert.ok(!result.ok);
    assert.match(result.problem, /input\.(maxSeconds|language)/);
  });
}

test("the status view shows only the voice suffix and whether a key exists", () => {
  const result = parseConfig(valid);
  assert.ok(result.ok);
  const text = describeConfig(result.config, true).join("\n");
  assert.match(text, /voice: \.\.\.7890/);
  assert.doesNotMatch(text, /AbCdEf1234567890/);
  assert.match(text, /ELEVENLABS_API_KEY: present/);
  assert.match(
    describeConfig(result.config, false).join("\n"),
    /ELEVENLABS_API_KEY: missing/,
  );
});
