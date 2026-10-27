import { execFile } from "node:child_process";
import { createReadStream, existsSync } from "node:fs";
import { lstat, realpath } from "node:fs/promises";
import { resolve } from "node:path";
import { createInterface } from "node:readline";
import { promisify } from "node:util";

const exec = promisify(execFile);

export type SessionTarget = { path: string; id: string; dev: number; ino: number };

export async function captureSession(file: string, id: string): Promise<SessionTarget> {
  const stat = await lstat(file);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("The session path must be a regular, non-symlink file.");
  const path = await realpath(file);
  const input = createReadStream(path);
  const lines = createInterface({ input, crlfDelay: Infinity });
  try {
    const first = await lines[Symbol.asyncIterator]().next();
    const header = JSON.parse(first.value ?? "");
    if (header?.type !== "session" || header.id !== id) {
      throw new Error("The file no longer matches the selected session ID; refusing to trash it.");
    }
  } finally {
    lines.close();
    input.destroy();
  }
  return { path, id, dev: stat.dev, ino: stat.ino };
}

export async function requireTrash(): Promise<void> {
  try {
    await exec("gio", ["help", "trash"], { timeout: 5000, maxBuffer: 64 * 1024 });
  } catch (error) {
    throw new Error("GIO trash is unavailable. Install the system GIO utility before retrying; no permanent-delete fallback is used.", { cause: error });
  }
}

export async function trashSession(target: SessionTarget, activeFile: string | undefined, activeId: string): Promise<void> {
  if (activeId === target.id) throw new Error("The old session is still active; refusing to trash it.");
  if (activeFile) {
    if (resolve(activeFile) === target.path) throw new Error("The old session file is still active; refusing to trash it.");
    try {
      const activePath = await realpath(activeFile);
      if (activePath === target.path) throw new Error("The old session file is still active; refusing to trash it.");
      const active = await lstat(activePath);
      if (active.dev === target.dev && active.ino === target.ino) {
        throw new Error("The active session shares the old file; refusing to trash it.");
      }
    } catch (error) {
      // A new Pi session normally has no file until its first assistant response.
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  const current = await captureSession(target.path, target.id);
  if (current.dev !== target.dev || current.ino !== target.ino) {
    throw new Error("The old session file was replaced; refusing to trash the replacement.");
  }
  // Pi keeps forks and subagent runs in a sibling folder named like the transcript; trash it too, folder first so a failure leaves the transcript intact.
  const sibling = target.path.replace(/\.jsonl$/, "");
  if (sibling !== target.path && existsSync(sibling)) {
    await exec("gio", ["trash", "--", sibling], { timeout: 60000, maxBuffer: 64 * 1024 });
  }
  await exec("gio", ["trash", "--", target.path], { timeout: 15000, maxBuffer: 64 * 1024 });
  try {
    await lstat(target.path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
    throw error;
  }
  throw new Error("GIO reported success but the source path still exists. No permanent deletion was attempted.");
}
