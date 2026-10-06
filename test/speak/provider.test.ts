import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MAX_AUDIO_BYTES,
  redact,
  synthesize,
  type SynthesisRequest,
} from "../../extensions/speak/elevenlabs.ts";
import { API_KEY, audioResponse } from "./harness.ts";

const request = (
  overrides: Partial<SynthesisRequest> = {},
): SynthesisRequest => ({
  text: "Hello there.",
  voiceId: "voice123456",
  modelId: "eleven_flash_v2_5",
  outputFormat: "mp3_44100_128",
  apiKey: API_KEY,
  timeoutMs: 5000,
  signal: new AbortController().signal,
  ...overrides,
});

function recordingFetch(respond: () => Promise<Response>) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchFn = (async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return respond();
  }) as typeof fetch;
  return { calls, fetchFn };
}

test("sends one request of the documented shape to the fixed origin and returns the audio", async () => {
  const { calls, fetchFn } = recordingFetch(async () => audioResponse());
  const result = await synthesize(request(), fetchFn);
  assert.ok(result.ok);
  assert.deepEqual([...result.bytes], [1, 2, 3, 4]);
  assert.equal(calls.length, 1);
  assert.equal(
    calls[0].url,
    "https://api.elevenlabs.io/v1/text-to-speech/voice123456?output_format=mp3_44100_128",
  );
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.redirect, "manual");
  assert.equal(
    (calls[0].init.headers as Record<string, string>)["xi-api-key"],
    API_KEY,
  );
  assert.deepEqual(JSON.parse(calls[0].init.body as string), {
    text: "Hello there.",
    model_id: "eleven_flash_v2_5",
  });
});

test("the voice ID cannot change the destination", async () => {
  const { calls, fetchFn } = recordingFetch(async () => audioResponse());
  await synthesize(request({ voiceId: "../evil?x=1#" }), fetchFn);
  const url = new URL(calls[0].url);
  assert.equal(url.origin, "https://api.elevenlabs.io");
  assert.equal(url.pathname, "/v1/text-to-speech/..%2Fevil%3Fx%3D1%23");
});

const failures: [string, () => Response, string, RegExp][] = [
  [
    "401",
    () => new Response("{}", { status: 401 }),
    "auth",
    /rejected the API key/,
  ],
  [
    "403",
    () => new Response("{}", { status: 403 }),
    "permission",
    /denied access/,
  ],
  [
    "404",
    () => new Response("{}", { status: 404 }),
    "not-found",
    /voice or model/,
  ],
  ["422", () => new Response("{}", { status: 422 }), "invalid", /HTTP 422/],
  [
    "429",
    () => new Response("{}", { status: 429 }),
    "rate-limit",
    /Nothing was retried/,
  ],
  [
    "500",
    () => new Response("{}", { status: 500 }),
    "server",
    /billed is unknown/,
  ],
  [
    "a redirect",
    () =>
      new Response(null, {
        status: 302,
        headers: { location: "https://evil.example" },
      }),
    "redirect",
    /not followed/,
  ],
  [
    "a JSON body with 200",
    () =>
      new Response('{"detail":"nope"}', {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    "bad-response",
    /not audio/,
  ],
  [
    "an empty audio body",
    () =>
      new Response(new Uint8Array(), {
        status: 200,
        headers: { "content-type": "audio/mpeg" },
      }),
    "bad-response",
    /empty audio/,
  ],
];
for (const [name, respond, kind, message] of failures)
  test(`${name} fails as ${kind} after exactly one request and never echoes the key`, async () => {
    const { calls, fetchFn } = recordingFetch(async () => respond());
    const result = await synthesize(request(), fetchFn);
    assert.ok(!result.ok);
    assert.equal(result.kind, kind);
    assert.match(result.message, message);
    assert.doesNotMatch(result.message, new RegExp(API_KEY));
    assert.equal(calls.length, 1, "no automatic retry");
  });

test("only a harmless provider status code is surfaced, never the provider's free text", async () => {
  const body = (status: string) =>
    JSON.stringify({ detail: { status, message: `leaked ${API_KEY}` } });
  const quota = await synthesize(
    request(),
    async () => new Response(body("quota_exceeded"), { status: 429 }),
  );
  assert.ok(!quota.ok);
  assert.match(quota.message, /\(quota_exceeded\)/);
  assert.doesNotMatch(quota.message, new RegExp(API_KEY));
  const odd = await synthesize(
    request(),
    async () =>
      new Response(body("<script>alert(1)</script>"), { status: 429 }),
  );
  assert.ok(!odd.ok);
  assert.doesNotMatch(odd.message, /script/);
});

test("an oversize response is cut off and discarded", async () => {
  let pulls = 0;
  const chunk = new Uint8Array(1024 * 1024);
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      pulls++;
      controller.enqueue(chunk);
    },
  });
  const result = await synthesize(
    request(),
    async () =>
      new Response(stream, {
        status: 200,
        headers: { "content-type": "audio/mpeg" },
      }),
  );
  assert.ok(!result.ok);
  assert.equal(result.kind, "too-large");
  assert.ok(
    pulls <= MAX_AUDIO_BYTES / chunk.byteLength + 3,
    `read ${pulls} chunks`,
  );
});

test("a request that outlives the deadline is aborted, reported as unknown-billing, and not retried", async () => {
  const { calls, fetchFn } = recordingFetch(
    () => new Promise<Response>(() => undefined),
  );
  // fetch rejects when its signal fires, as the real one does.
  const abortable = ((url: string | URL, init?: RequestInit) => {
    const pending = fetchFn(url, init);
    return new Promise<Response>((resolve, reject) => {
      init?.signal?.addEventListener("abort", () =>
        reject(new DOMException("timed out", "TimeoutError")),
      );
      void pending.then(resolve);
    });
  }) as typeof fetch;
  // AbortSignal.timeout uses an unref'd timer; Pi's loop is always alive, a bare test process is not.
  const keepAlive = setTimeout(() => undefined, 2000);
  try {
    const result = await synthesize(request({ timeoutMs: 30 }), abortable);
    assert.ok(!result.ok);
    assert.equal(result.kind, "timeout");
    assert.match(result.message, /billed is unknown/);
    assert.equal(calls.length, 1);
  } finally {
    clearTimeout(keepAlive);
  }
});

test("the owning job's abort is reported as cancelled, not as a failure", async () => {
  const controller = new AbortController();
  const hanging = (async (_url: string | URL, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () =>
        reject(new DOMException("aborted", "AbortError")),
      );
    })) as typeof fetch;
  const pending = synthesize(request({ signal: controller.signal }), hanging);
  controller.abort();
  const result = await pending;
  assert.ok(!result.ok);
  assert.equal(result.kind, "cancelled");
});

test("a network error is reported without an automatic retry and without the key", async () => {
  const { calls, fetchFn } = recordingFetch(async () => {
    throw new TypeError(`fetch failed for ${API_KEY}`);
  });
  const result = await synthesize(request(), fetchFn);
  assert.ok(!result.ok);
  assert.equal(result.kind, "network");
  assert.doesNotMatch(result.message, new RegExp(API_KEY));
  assert.equal(calls.length, 1);
});

test("redact removes every occurrence of the key", () => {
  assert.equal(
    redact(`a ${API_KEY} b ${API_KEY}`, API_KEY),
    "a [redacted] b [redacted]",
  );
  assert.equal(redact("nothing here", ""), "nothing here");
});
