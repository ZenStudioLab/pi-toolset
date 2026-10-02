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

const valid = { voiceId: "AbCdEf1234567890", modelId: "eleven_flash_v2_5" };

test("a minimal configuration gets the documented defaults", () => {
  const result = parseConfig(valid);
  assert.ok(result.ok);
  assert.equal(result.config.outputFormat, "mp3_44100_128");
  assert.equal(result.config.hardLimitChars, 4000);
  assert.equal(result.config.requestTimeoutMs, 45_000);
  assert.equal(result.config.cache.ttlDays, 7);
  assert.equal(result.config.cache.maxBytes, 100 * 1024 * 1024);
  assert.equal(result.config.player.command, "ffplay");
  assert.ok(result.config.player.args.includes("{file}"));
});

const invalid: [string, unknown, RegExp][] = [
  ["not an object", [], /JSON object/],
  ["missing voice", { modelId: "m_1" }, /voiceId is not set/],
  ["placeholder voice", { ...valid, voiceId: VOICE_ID_PLACEHOLDER }, /placeholder/],
  ["unsafe voice characters", { ...valid, voiceId: "a/b/c/d/e/f" }, /voiceId must be/],
  ["missing model", { voiceId: valid.voiceId }, /modelId is not set/],
  ["limit above the ceiling", { ...valid, hardLimitChars: 4001 }, /hardLimitChars must be between/],
  ["limit of zero", { ...valid, hardLimitChars: 0 }, /hardLimitChars must be between/],
  ["fractional timeout", { ...valid, requestTimeoutMs: 1500.5 }, /requestTimeoutMs must be an integer/],
  ["timeout too short", { ...valid, requestTimeoutMs: 10 }, /requestTimeoutMs must be between/],
  ["player without file token", { ...valid, player: { args: ["-x"] } }, /exactly once/],
  ["player with two file tokens", { ...valid, player: { args: ["{file}", "{file}"] } }, /exactly once/],
  ["cache cap too small", { ...valid, cache: { maxBytes: 10 } }, /cache.maxBytes must be between/],
  ["other provider", { ...valid, provider: "google" }, /provider must be/],
];
for (const [name, input, expected] of invalid)
  test(`rejects ${name}`, () => {
    const result = parseConfig(input);
    assert.ok(!result.ok);
    assert.match(result.problem, expected);
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
  assert.match(missing.problem, /no configuration file at \/cfg\/pi-speak\/config\.json/);
  const bad = await loadConfig(env, async () => "{nope");
  assert.ok(!bad.ok && /not valid JSON/.test(bad.problem));
  const big = await loadConfig(env, async () => " ".repeat(70 * 1024));
  assert.ok(!big.ok && /larger than/.test(big.problem));
  const good = await loadConfig(env, async () => JSON.stringify(valid));
  assert.ok(good.ok);
});

test("paths follow XDG with a home fallback", () => {
  assert.equal(configPath({ XDG_CONFIG_HOME: "/x" }, "/h"), "/x/pi-speak/config.json");
  assert.equal(configPath({}, "/h"), "/h/.config/pi-speak/config.json");
  assert.equal(cacheDir({ XDG_CACHE_HOME: "/c" }, "/h"), "/c/pi-speak");
  assert.equal(cacheDir({}, "/h"), "/h/.cache/pi-speak");
});

test("the API key comes only from the environment and is trimmed", () => {
  assert.equal(readApiKey({ ELEVENLABS_API_KEY: "  abc  " }), "abc");
  assert.equal(readApiKey({ ELEVENLABS_API_KEY: "   " }), undefined);
  assert.equal(readApiKey({}), undefined);
});

test("the status view shows only the voice suffix and whether a key exists", () => {
  const result = parseConfig(valid);
  assert.ok(result.ok);
  const text = describeConfig(result.config, true).join("\n");
  assert.match(text, /voice: \.\.\.7890/);
  assert.doesNotMatch(text, /AbCdEf1234567890/);
  assert.match(text, /ELEVENLABS_API_KEY: present/);
  assert.match(describeConfig(result.config, false).join("\n"), /ELEVENLABS_API_KEY: missing/);
});
