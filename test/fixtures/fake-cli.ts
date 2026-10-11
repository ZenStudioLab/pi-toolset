import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { type Host } from "./host.ts";

/** Write a fake executable onto the host PATH that records its arguments in `logDir`. */
async function writeFakeCli(host: Host, name: string, logName: string, body: string): Promise<void> {
  host.env[`TEST_${logName.toUpperCase()}_LOG`] = join(host.logDir, `${logName}.jsonl`);
  await writeFile(join(host.bin, name), `#!/usr/bin/env node\nconst fs = require('node:fs');\n${body}\n`, { mode: 0o755 });
}

/**
 * Fake GIO: moves the trashed path into a disposable directory instead of the
 * real desktop trash. TEST_TRASH_FAIL / TEST_TRASH_NOOP / TEST_TRASH_UNAVAILABLE
 * drive the failure branches the session-delete command must survive.
 */
export async function fakeTrash(host: Host): Promise<string> {
  const trashDir = join(host.logDir, "trash");
  await mkdir(trashDir, { recursive: true });
  host.env.TEST_TRASH_DIR = trashDir;
  await writeFakeCli(host, "gio", "trash", `const args = process.argv.slice(2);
fs.appendFileSync(process.env.TEST_TRASH_LOG, JSON.stringify(args) + '\\n');
if (args[0] === 'help') process.exit(process.env.TEST_TRASH_UNAVAILABLE ? 3 : 0);
if (process.env.TEST_SHUTDOWN_MARKER && !fs.existsSync(process.env.TEST_SHUTDOWN_MARKER)) process.exit(8);
if (args.length !== 3 || args[0] !== 'trash' || args[1] !== '--') process.exit(9);
if (process.env.TEST_TRASH_FAIL) { console.error('fixture: trash unavailable on this filesystem'); process.exit(1); }
if (!process.env.TEST_TRASH_NOOP) require('node:fs').renameSync(args[2], require('node:path').join(process.env.TEST_TRASH_DIR, require('node:path').basename(args[2])));`);
  return trashDir;
}

/** Fake Herdr tab manager: records `tab rename` arguments instead of touching a real tab. */
export async function fakeHerdr(host: Host): Promise<void> {
  await writeFakeCli(host, "herdr", "herdr", `const args = process.argv.slice(2);
fs.appendFileSync(process.env.TEST_HERDR_LOG, JSON.stringify(args) + '\\n');
if (process.env.TEST_HERDR_FAIL) { console.error('fixture: tab rename rejected'); process.exit(1); }
process.stdout.write(JSON.stringify({ result: { tab: { tab_id: args[2], label: args[3] } } }));`);
}
