import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

test("AT23: fresh production import, display selection, rotation and disposal make zero monitored network calls", () => {
  const result = spawnSync(process.execPath, [
    "--experimental-strip-types",
    "--import", fileURLToPath(new URL("./network-sentinel.ts", import.meta.url)),
    fileURLToPath(new URL("./network-probe.ts", import.meta.url)),
  ], { encoding: "utf8", env: { ...process.env, PI_OFFLINE: "1" }, timeout: 10000 });
  assert.equal(result.status, 0, result.error?.message ?? result.stderr);
  const observed = JSON.parse(result.stdout) as { first: string; second: string; networkAttempts: string[]; pending: number };
  assert.deepEqual(observed.networkAttempts, []);
  assert.equal(observed.pending, 0);
  assert.notEqual(observed.first, observed.second);
  assert.match(observed.first, /^[A-Za-z]+…$/);
});
