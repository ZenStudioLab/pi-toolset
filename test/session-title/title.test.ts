import assert from "node:assert/strict";
import { test } from "node:test";
import { currentHerdrTab, normalizeName, renameHerdrTab } from "../../extensions/session-title/title.ts";
import { fakeHerdr } from "../fixtures/fake-cli.ts";
import { disposableHost } from "../fixtures/host.ts";

test("names become single-line labels of bounded length", () => {
  assert.equal(normalizeName("  add-themed-bash-block-borders \n"), "add-themed-bash-block-borders");
  assert.equal(normalizeName("multi\nline\tname"), "multi line name");
  assert.equal(normalizeName("keep\u0007bell"), "keep bell");
  assert.equal(normalizeName("x".repeat(200)).length, 120);
  assert.equal(normalizeName("   \n "), "");
  assert.equal(normalizeName("café 计划"), "café 计划");
});

test("Herdr detection requires both signals from the apply-loop contract", () => {
  assert.equal(currentHerdrTab({}), undefined);
  assert.equal(currentHerdrTab({ HERDR_ENV: "0", HERDR_TAB_ID: "w1:t1" }), undefined);
  assert.equal(currentHerdrTab({ HERDR_ENV: "1" }), undefined);
  assert.equal(currentHerdrTab({ HERDR_ENV: "1", HERDR_TAB_ID: "  " }), undefined);
  assert.deepEqual(currentHerdrTab({ HERDR_ENV: "1", HERDR_TAB_ID: " w5:t12 " }), { tabId: "w5:t12" });
});

test("tab rename passes the label as one literal argument and surfaces failures", async () => {
  const previous = { ...process.env };
  const host = await disposableHost();
  await fakeHerdr(host);
  try {
    Object.assign(process.env, host.env);
    assert.deepEqual(await renameHerdrTab(undefined, "x"), { ok: false, reason: "not-inside-herdr" });
    assert.deepEqual(await renameHerdrTab({ tabId: "w5:t12" }, "quoted; rm -rf / label"), { ok: true, tabId: "w5:t12" });
    process.env.TEST_HERDR_FAIL = "1";
    assert.deepEqual(await renameHerdrTab({ tabId: "w5:t12" }, "second"), { ok: false, reason: "fixture: tab rename rejected" });
    delete process.env.TEST_HERDR_FAIL;
    process.env.PATH = "/nonexistent";
    assert.deepEqual(await renameHerdrTab({ tabId: "w5:t12" }, "third"), { ok: false, reason: "herdr-cli-missing" });
    assert.deepEqual(await host.calls("herdr"), [["tab", "rename", "w5:t12", "quoted; rm -rf / label"], ["tab", "rename", "w5:t12", "second"]]);
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in previous)) delete process.env[key];
    Object.assign(process.env, previous);
    await host.cleanup();
  }
});
