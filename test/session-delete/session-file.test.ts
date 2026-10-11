import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile, rename, symlink, writeFile } from "node:fs/promises";
import { basename } from "node:path";
import { test } from "node:test";
import { captureSession, requireTrash, trashSession } from "../../extensions/session-delete/session-file.ts";
import { fakeTrash } from "../fixtures/fake-cli.ts";
import { disposableHost } from "../fixtures/host.ts";

const header = (id: string) => JSON.stringify({ type: "session", version: 3, id, cwd: "/test" }) + "\n";

test("only a regular file with the expected session header can become a trash target", async () => {
  const host = await disposableHost();
  try {
    const file = `${host.cwd}/session.jsonl`;
    await writeFile(file, header("old"));
    assert.equal((await captureSession(file, "old")).path, file);
    await assert.rejects(captureSession(file, "wrong"), /session ID/);
    await writeFile(file, '{"type":"message","id":"old"}\n');
    await assert.rejects(captureSession(file, "old"), /session ID/);
    const link = `${host.cwd}/link.jsonl`;
    await symlink(file, link);
    await assert.rejects(captureSession(link, "old"), /non-symlink/);
    await assert.rejects(captureSession(host.cwd, "old"), /regular/);
  } finally { await host.cleanup(); }
});

test("active-session and replaced-file guards refuse deletion before invoking trash", async () => {
  const host = await disposableHost();
  await fakeTrash(host);
  const previous = { ...process.env };
  try {
    Object.assign(process.env, host.env);
    const file = `${host.cwd}/session.jsonl`;
    await writeFile(file, header("old"));
    const target = await captureSession(file, "old");
    await assert.rejects(trashSession(target, undefined, "old"), /still active/);
    await assert.rejects(trashSession(target, file, "new"), /still active/);
    const alias = `${host.cwd}/alias.jsonl`;
    await symlink(file, alias);
    // File identity/header checks prevent a fresh context from targeting its own transcript.
    await assert.rejects(trashSession(target, alias, "new"), /still active/);
    await rename(file, `${host.cwd}/original.jsonl`);
    await writeFile(file, header("old"));
    await assert.rejects(trashSession(target, undefined, "new"), /replaced/);
    assert(existsSync(file));
    assert.deepEqual(await host.calls("trash"), []);
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in previous)) delete process.env[key];
    Object.assign(process.env, previous);
    await host.cleanup();
  }
});

test("trash receives one literal path; unavailable, failing and no-op backends never permanently remove it", async () => {
  const previous = { ...process.env };
  const host = await disposableHost();
  const trashDir = await fakeTrash(host);
  try {
    Object.assign(process.env, host.env);
    const file = `${host.cwd}/session with 'quotes' ; harmless.jsonl`;
    for (const mode of ["unavailable", "failure", "noop", "success"]) {
      delete process.env.TEST_TRASH_UNAVAILABLE;
      delete process.env.TEST_TRASH_FAIL;
      delete process.env.TEST_TRASH_NOOP;
      await writeFile(file, header("old"));
      const target = await captureSession(file, "old");
      if (mode === "unavailable") {
        process.env.TEST_TRASH_UNAVAILABLE = "1";
        await assert.rejects(requireTrash(), /no permanent-delete fallback/);
      } else {
        if (mode === "failure") process.env.TEST_TRASH_FAIL = "1";
        if (mode === "noop") process.env.TEST_TRASH_NOOP = "1";
        await requireTrash();
        const move = trashSession(target, `${host.cwd}/new-not-yet-saved.jsonl`, "new");
        if (mode === "success") {
          await move;
          assert(!existsSync(file));
          assert.equal(await readFile(`${trashDir}/${basename(file)}`, "utf8"), header("old"));
        } else await assert.rejects(move, mode === "noop" ? /source path still exists/ : /trash unavailable/);
      }
      if (mode !== "success") assert(existsSync(file));
    }
    assert.deepEqual((await host.calls("trash")).filter((args) => args[0] === "trash"),
      Array.from({ length: 3 }, () => ["trash", "--", file]));
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in previous)) delete process.env[key];
    Object.assign(process.env, previous);
    await host.cleanup();
  }
});
