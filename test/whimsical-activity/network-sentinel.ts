import http from "node:http";
import https from "node:https";
import { syncBuiltinESMExports } from "node:module";
import net from "node:net";

/** Preloaded only in the disposable probe process, before the production module graph is imported. */
export const networkAttempts: string[] = [];
const blocked = () => {
  networkAttempts.push("unexpected network request");
  throw new Error("Indicator qualification forbids network I/O");
};
http.request = blocked;
http.get = blocked;
https.request = blocked;
https.get = blocked;
net.connect = blocked;
net.createConnection = blocked;
globalThis.fetch = async () => blocked();
syncBuiltinESMExports();
