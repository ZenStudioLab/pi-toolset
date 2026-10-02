import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { ActivityWordSelector } from "../../extensions/whimsical-activity/word-bank.ts";

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function bankJSON(words: unknown[]): string {
  return JSON.stringify({ schemaVersion: 1, locale: "en", words });
}

test("AT01–AT02: shipped JSON is byte-exact and selections are complete unpunctuated bank entries", () => {
  const supplied = readFileSync(new URL("../fixtures/whimsical-activity-words.json", import.meta.url));
  const bundled = readFileSync(new URL("../../extensions/whimsical-activity/activity-words.json", import.meta.url));
  assert.deepEqual(bundled, supplied);
  assert.equal(createHash("sha256").update(bundled).digest("hex"), "1ff08926c752cff9690fcb6b41d5e9ddb13808385852f4ea6a87fadda3a7ae68");
  const source: { schemaVersion: number; locale: string; words: string[] } = JSON.parse(supplied.toString("utf8"));
  const selector = new ActivityWordSelector(seededRandom(42));
  assert.equal(source.schemaVersion, 1);
  assert.equal(source.locale, "en");
  assert.equal(source.words.length, 100);
  assert.deepEqual(selector.words, source.words);
  assert.equal(new Set(selector.words.map((word) => word.toLowerCase())).size, 100);
  assert.equal(selector.maxWordLength, 13);
  assert.equal(selector.diagnostic, undefined);
  for (let i = 0; i < 300; i++) {
    const word = selector.next();
    assert.ok(source.words.includes(word));
    assert.match(word, /^[A-Za-z]+$/);
    assert.ok(word.length <= 13);
  }
});

test("AT03–AT05: seeded bags consume every entry once, refill only on exhaustion, and reproduce sequences", () => {
  let draws = 0;
  const random = seededRandom(137);
  const first = new ActivityWordSelector(() => { draws++; return random(); });
  const second = new ActivityWordSelector(seededRandom(137));
  assert.equal(draws, 0);
  let previous: string | undefined;
  for (let bag = 0; bag < 6; bag++) {
    const cycle: string[] = [];
    for (let i = 0; i < first.words.length; i++) {
      const word = first.next();
      assert.equal(draws, (bag + 1) * (first.words.length - 1));
      assert.equal(word, second.next());
      if (i === 0) assert.notEqual(word, previous);
      cycle.push(word);
    }
    assert.equal(new Set(cycle).size, first.words.length);
    assert.deepEqual([...cycle].sort(), [...first.words].sort());
    previous = cycle.at(-1);
  }
});

test("AT04: a two-entry shuffle repairs a forced immediate cross-bag repeat without a retry loop", () => {
  // Seed 3 chooses j=0 for the first bag and j=1 for the second; without repair Alpha repeats.
  const selector = new ActivityWordSelector(seededRandom(3), () => bankJSON(["Alpha", "Beta"]));
  assert.equal(selector.next(), "Beta");
  assert.equal(selector.next(), "Alpha");
  assert.equal(selector.next(), "Beta");
  assert.equal(selector.next(), "Alpha");
});

test("one runtime asset load validates once and publishes immutable words", () => {
  let reads = 0;
  const selector = new ActivityWordSelector(seededRandom(10), () => {
    assert.equal(reads++, 0, "selection must not reload or revalidate the asset");
    return bankJSON(["Alpha", "Beta", "Gamma"]);
  });
  assert.equal(Object.isFrozen(selector.words), true);
  assert.equal(Reflect.set(selector.words, 0, "Changed"), false);
  for (let i = 0; i < 300; i++) assert.ok(selector.words.includes(selector.next()));
  assert.equal(reads, 1);
});

test("validation accepts the 24-character limit and single interior spaces or hyphens", () => {
  const words = ["A".repeat(24), "Deep Thought", "Fine-tuning", "Alpha beta-gamma"];
  const selector = new ActivityWordSelector(seededRandom(9), () => bankJSON(words));
  assert.equal(selector.diagnostic, undefined);
  assert.equal(selector.maxWordLength, 24);
  assert.deepEqual(selector.words, words);
});

const invalidBanks: [string, unknown][] = [
  ["null", null],
  ["array instead of object", []],
  ["missing schema", { locale: "en", words: ["Alpha"] }],
  ["unsupported schema", { schemaVersion: 2, locale: "en", words: ["Alpha"] }],
  ["string schema", { schemaVersion: "1", locale: "en", words: ["Alpha"] }],
  ["missing locale", { schemaVersion: 1, words: ["Alpha"] }],
  ["unsupported locale", { schemaVersion: 1, locale: "fr", words: ["Alpha"] }],
  ["missing words", { schemaVersion: 1, locale: "en" }],
  ["non-array words", { schemaVersion: 1, locale: "en", words: "Alpha" }],
  ["empty words", { schemaVersion: 1, locale: "en", words: [] }],
];
const invalidEntries: [string, unknown[]][] = [
  ["number", [42]],
  ["null entry", [null]],
  ["boolean", [true]],
  ["object", [{}]],
  ["empty entry", [""]],
  ["leading whitespace", [" Alpha"]],
  ["trailing whitespace", ["Alpha "]],
  ["trailing newline", ["Alpha\n"]],
  ["trailing CRLF", ["Alpha\r\n"]],
  ["25 characters", ["A".repeat(25)]],
  ["case-insensitive duplicate", ["Alpha", "aLPHA"]],
  ["exact duplicate", ["Alpha", "Alpha"]],
  ["non-ASCII letters", ["Café"]],
  ["digits", ["Alpha2"]],
  ["underscore", ["Deep_thought"]],
  ["ellipsis", ["Alpha…"]],
  ["ASCII ellipsis", ["Alpha..."]],
  ["newline", ["Alpha\nBeta"]],
  ["tab", ["Alpha\tBeta"]],
  ["double space", ["Alpha  Beta"]],
  ["double hyphen", ["Alpha--Beta"]],
  ["adjacent mixed separators", ["Alpha- Beta"]],
  ["leading hyphen", ["-Alpha"]],
  ["trailing hyphen", ["Alpha-"]],
  ["invalid after valid entry", ["Alpha", "Beta!"]],
];
for (const [name, words] of invalidEntries) {
  invalidBanks.push([name, { schemaVersion: 1, locale: "en", words }]);
}
for (const [name, data] of invalidBanks) {
  test(`AT06: ${name} falls back to literal Working without retries or recurring diagnostics`, () => {
    let reads = 0;
    const selector = new ActivityWordSelector(() => { throw new Error("fallback must not shuffle"); }, () => {
      reads++;
      return JSON.stringify(data);
    });
    assert.deepEqual(selector.words, ["Working"]);
    assert.equal(selector.maxWordLength, 7);
    assert.equal(selector.diagnostic, "Whimsical activity word bank is invalid or unavailable; using Working.");
    for (let i = 0; i < 100; i++) assert.equal(selector.next(), "Working");
    assert.equal(reads, 1);
  });
}

test("AT06: malformed JSON and a genuinely unavailable file use the same safe fallback", () => {
  const directory = mkdtempSync(join(tmpdir(), "pi-activity-bank-"));
  try {
    for (const readAsset of [() => "{", () => readFileSync(join(directory, "missing.json"), "utf8")]) {
      const selector = new ActivityWordSelector(seededRandom(1), readAsset);
      assert.equal(selector.next(), "Working");
      assert.equal(selector.next(), "Working");
      assert.ok(selector.diagnostic);
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("AT06: a valid singleton never shuffles or retries", () => {
  const selector = new ActivityWordSelector(() => { throw new Error("singleton must not shuffle"); }, () => bankJSON(["Solo"]));
  assert.equal(selector.diagnostic, undefined);
  assert.equal(selector.maxWordLength, 4);
  for (let i = 0; i < 1000; i++) assert.equal(selector.next(), "Solo");
});

test("reusing one selector across simulated run requests retains its cursor and bag", () => {
  const selector = new ActivityWordSelector(seededRandom(73));
  const uninterrupted = new ActivityWordSelector(seededRandom(73));
  const selections: string[] = [];
  for (const requestsInRun of [1, 3, 2, 94, 5]) {
    for (let request = 0; request < requestsInRun; request++) {
      assert.equal(selector.maxWordLength, 13);
      assert.equal(selector.words.length, 100);
      selections.push(selector.next());
    }
  }
  assert.deepEqual(selections, Array.from({ length: selections.length }, () => uninterrupted.next()));
  assert.equal(new Set(selections.slice(0, 100)).size, 100);
  assert.notEqual(selections[99], selections[100]);
  // Actual frame/phase/theme/resize/resume non-consumption (AT07) belongs to E2 controller composition.
});
