import { spawn } from "node:child_process";
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
import { oauthRequest } from "../http.js";
import { printJson, progress } from "../output.js";

const CLIENT_ID = "imagifly-cli";
const DEVICE_GRANT_TYPE = "urn:ietf:params:oauth:grant-type:device_code";

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

  const timeoutSeconds = readTimeout(options.timeout, 600);
  const agentName = readAgentName(options.agent);
  const started = await oauthRequest("/api/oauth/device", {
    client_id: CLIENT_ID,
    agent: agentName,
  });
  const startBody = asRecord(started.body);
  const deviceCode = typeof startBody?.device_code === "string" ? startBody.device_code : "";
  const verificationUrl =
    typeof startBody?.verification_uri_complete === "string" ? startBody.verification_uri_complete : "";
  if (started.status !== 200 || !deviceCode || !verificationUrl) {
    throw oauthFailure(started.status, started.body, "Could not start OAuth login.");
  }

  const expiresIn = readBoundedInteger(startBody?.expires_in, timeoutSeconds, 15, 3600);
  const deadline = Date.now() + Math.min(timeoutSeconds, expiresIn) * 1000;
  let interval = readBoundedInteger(startBody?.interval, 2, 1, 60);

  progress(`Open ${verificationUrl}`);
  progress(`Waiting for the browser. Click Allow on the webpage.`);
  if (!options.noBrowser) {
    openBrowser(verificationUrl);
  }

  while (Date.now() < deadline) {
    const wait = Math.min(interval * 1000, deadline - Date.now());
    if (wait <= 0) break;
    await sleep(wait);

    const polled = await oauthRequest("/api/oauth/token", {
      grant_type: DEVICE_GRANT_TYPE,
      client_id: CLIENT_ID,
      device_code: deviceCode,
    });
    const body = asRecord(polled.body);
    const accessToken = typeof body?.access_token === "string" ? body.access_token : "";
    if (polled.status === 200 && accessToken) {
      const file = await saveAccessToken(accessToken);
      progress(`saved credentials to ${file}`);
      printJson({
        ok: true,
        saved: true,
        path: file,
        method: "oauth",
        tokenHint: keyHint(accessToken),
      });
      return;
    }

    const error = typeof body?.error === "string" ? body.error : "";
    if (error === "AUTHORIZATION_PENDING") continue;
    if (error === "SLOW_DOWN") {
      interval = Math.min(interval + 5, 60);
      continue;
    }
    if (error === "ACCESS_DENIED") {
      throw new CliError(3, "ACCESS_DENIED", messageFrom(body, "The sign-in request was denied."));
    }
    if (error === "EXPIRED_TOKEN") {
      throw new CliError(3, "EXPIRED_TOKEN", messageFrom(body, "Timed out waiting for the browser approval."));
    }
    throw oauthFailure(polled.status, polled.body, "Could not finish OAuth login.");
  }

  throw new CliError(3, "EXPIRED_TOKEN", "Timed out waiting for the browser approval.");
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

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function messageFrom(body: Record<string, unknown> | null, fallback: string) {
  return typeof body?.message === "string" && body.message ? body.message : fallback;
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

function readBoundedInteger(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) return fallback;
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
