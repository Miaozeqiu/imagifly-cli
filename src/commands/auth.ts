import { createHash, randomBytes } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { spawn } from "node:child_process";
import { stdin as input } from "node:process";
import {
  clearApiKey,
  configFilePath,
  keyHint,
  readConfig,
  saveAccessToken,
  saveApiKey,
  storedCredential,
} from "../config.js";
import { CliError, badArgs } from "../errors.js";
import { oauthRequest, resolveSiteOrigin } from "../http.js";
import { printJson, progress } from "../output.js";

const CLIENT_ID = "imagifly-cli";
const GRANT_TYPE = "authorization_code";

export async function login(options: {
  key?: string;
  agent?: string;
  noBrowser?: boolean;
  timeout?: string;
}): Promise<void> {
  const key = options.key?.trim();
  if (key) {
    await loginWithKey(key);
    return;
  }

  if (!input.isTTY && !process.env.IMAGIFLY_ALLOW_DEVICE_LOGIN) {
    throw badArgs("Run `imagifly auth login` in a terminal, or pass --key only for CI.");
  }

  const timeoutSeconds = readTimeout(options.timeout, 600);
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const state = randomBytes(16).toString("base64url");
  const callback = await listenForCallback(timeoutSeconds);
  const authorizeUrl = new URL("/oauth/authorize", `${resolveSiteOrigin()}/`);
  authorizeUrl.searchParams.set("client_id", CLIENT_ID);
  authorizeUrl.searchParams.set("redirect_uri", callback.redirectUri);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", challenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  authorizeUrl.searchParams.set("agent", readAgentName(options.agent));

  progress(`callback ${callback.redirectUri}`);
  progress(`Open ${authorizeUrl.toString()}`);
  progress(`Waiting for the browser. Click Allow on the webpage.`);
  if (!options.noBrowser) {
    openBrowser(authorizeUrl.toString());
  }

  let redirected: { code?: string; error?: string; state?: string };
  try {
    redirected = await callback.wait();
  } finally {
    void callback.close();
  }

  if (redirected.state !== state) {
    throw new CliError(3, "ACCESS_DENIED", "OAuth state mismatch. Run imagifly auth login again.");
  }
  if (redirected.error === "access_denied") {
    throw new CliError(3, "ACCESS_DENIED", "The sign-in request was denied.");
  }
  if (!redirected.code) {
    throw new CliError(3, "UNAUTHORIZED", redirected.error || "The browser did not return an authorization code.");
  }

  const exchanged = await oauthRequest("/api/oauth/token", {
    grant_type: GRANT_TYPE,
    client_id: CLIENT_ID,
    code: redirected.code,
    redirect_uri: callback.redirectUri,
    code_verifier: verifier,
  });
  const body = asRecord(exchanged.body);
  if (exchanged.status !== 200 || typeof body?.access_token !== "string") {
    throw oauthFailure(exchanged.status, exchanged.body, "Could not finish OAuth login.");
  }

  const file = await saveAccessToken(body.access_token);
  progress(`saved credentials to ${file}`);
  printJson({
    ok: true,
    saved: true,
    path: file,
    method: "oauth",
    tokenHint: keyHint(body.access_token),
  });
}

async function loginWithKey(key: string): Promise<void> {
  const file = await saveApiKey(key);
  if (!key.startsWith("imf_")) {
    progress("key does not start with imf_; saved anyway");
  }
  progress(`saved credentials to ${file}`);
  printJson({
    ok: true,
    saved: true,
    path: file,
    method: "key",
    keyHint: keyHint(key),
  });
}

export async function logout(): Promise<void> {
  const result = await clearApiKey();
  const envStillSet = Boolean(process.env.IMAGIFLY_API_KEY?.trim());
  if (result.removed) progress(`removed ${result.path}`);
  else progress("no saved credentials to remove");
  if (envStillSet) progress("IMAGIFLY_API_KEY is still set and will be used");
  printJson({
    ok: true,
    removed: result.removed,
    path: result.path,
    envStillSet,
  });
}

export async function status(): Promise<void> {
  const file = configFilePath();
  const stored = await readConfig();
  const configKey = storedCredential(stored);
  const envKey = process.env.IMAGIFLY_API_KEY?.trim() || "";
  const source = envKey ? "env" : configKey ? "config" : null;
  const active = envKey || configKey;
  printJson({
    ok: true,
    authenticated: Boolean(active),
    source,
    method: envKey ? "env" : stored?.accessToken ? "oauth" : stored?.apiKey ? "key" : null,
    keyHint: active ? keyHint(active) : null,
    configPath: file,
    configPresent: Boolean(configKey),
  });
}

function listenForCallback(timeoutSeconds: number) {
  return new Promise<{
    redirectUri: string;
    wait: () => Promise<{ code?: string; error?: string; state?: string }>;
    close: () => Promise<void>;
  }>((resolveListen, rejectListen) => {
    let settle!: (value: { code?: string; error?: string; state?: string }) => void;
    const received = new Promise<{ code?: string; error?: string; state?: string }>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new CliError(3, "EXPIRED_TOKEN", "Timed out waiting for the browser approval."));
      }, timeoutSeconds * 1000);
      settle = (value) => {
        clearTimeout(timer);
        resolve(value);
      };
    });

    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url ?? "/", "http://127.0.0.1");
      if (url.pathname !== "/callback") {
        res.writeHead(404);
        res.end();
        return;
      }
      const html =
        "<!doctype html><html><body style=\"font-family:sans-serif;padding:40px\">You can close this tab and return to the terminal.</body></html>";
      res.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        connection: "close",
      });
      res.end(html);
      setImmediate(() => {
        settle({
          code: url.searchParams.get("code") ?? undefined,
          error: url.searchParams.get("error") ?? undefined,
          state: url.searchParams.get("state") ?? undefined,
        });
      });
    });

    server.on("error", rejectListen);
    server.unref();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        rejectListen(new CliError(1, "NETWORK_ERROR", "Could not start the local OAuth callback."));
        return;
      }
      resolveListen({
        redirectUri: `http://127.0.0.1:${address.port}/callback`,
        wait: () => received,
        close: () =>
          new Promise((resolve, reject) => {
            if (typeof server.closeAllConnections === "function") {
              server.closeAllConnections();
            }
            server.close((error) => (error ? reject(error) : resolve()));
          }),
      });
    });
  });
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readAgentName(value: string | undefined): string {
  const fromFlag = value?.replace(/[\u0000-\u001f]/g, "").trim();
  if (fromFlag) return fromFlag.slice(0, 64);
  const fromEnv = process.env.IMAGIFLY_AGENT?.replace(/[\u0000-\u001f]/g, "").trim();
  if (fromEnv) return fromEnv.slice(0, 64);
  return "Imagifly CLI";
}

function readTimeout(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 15) {
    throw badArgs("--timeout must be an integer of at least 15 seconds.");
  }
  return parsed;
}

function oauthFailure(status: number, body: unknown, fallback: string): CliError {
  const record = asRecord(body);
  const message =
    (typeof record?.message === "string" && record.message) ||
    (typeof body === "string" && body.trim()) ||
    fallback;
  const error =
    (typeof record?.error === "string" && record.error) ||
    (status === 401 || status === 403 ? "UNAUTHORIZED" : "REQUEST_FAILED");
  return new CliError(status === 401 || status === 403 ? 3 : 4, error, message, { raw: body });
}

function openBrowser(url: string): void {
  try {
    const command =
      process.platform === "win32" ? "cmd" : process.platform === "darwin" ? "open" : "xdg-open";
    const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
    const child = spawn(command, args, { detached: true, stdio: "ignore" });
    child.unref();
  } catch {
    // The user can open the printed URL themselves.
  }
}
