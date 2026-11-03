import { getInvocation } from "./context.js";
import { resolveApiKey } from "./config.js";
import { CliError } from "./errors.js";

const DEFAULT_BASE = "https://imagifly.net/api/v1";
const REQUEST_TIMEOUT_MS = 60_000;

export interface ApiRequest {
  method?: "GET" | "POST";
  json?: unknown;
  body?: Uint8Array;
  contentType?: string;
  auth?: "required" | "optional";
  apiKey?: string;
}

export async function apiRequest(pathname: string, request: ApiRequest = {}): Promise<unknown> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const auth = request.auth ?? "required";
  const resolved = await resolveApiKey(request.apiKey ?? getInvocation().apiKey);
  if (resolved) {
    headers.Authorization = `Bearer ${resolved.key}`;
  } else if (auth === "required") {
    throw new CliError(
      3,
      "UNAUTHORIZED",
      "No API key. Run `imagifly auth login --key imf_...` or set IMAGIFLY_API_KEY.",
    );
  }

  let body: Uint8Array | string | undefined;
  if (request.body) {
    body = request.body;
    headers["Content-Type"] = request.contentType ?? "application/octet-stream";
  } else if (request.json !== undefined) {
    body = JSON.stringify(request.json);
    headers["Content-Type"] = "application/json";
  }

  const url = joinUrl(resolveBaseUrl(), pathname);
  let response: Response;
  try {
    response = await fetch(url, {
      method: request.method ?? (body ? "POST" : "GET"),
      headers,
      body,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new CliError(1, "NETWORK_ERROR", message);
  }

  const text = await response.text();
  const parsed = parseBody(text);
  if (response.ok) {
    if (parsed === undefined) {
      throw new CliError(1, "INVALID_RESPONSE", `Empty response from ${pathname}`);
    }
    return parsed;
  }

  const exitCode = response.status === 401 || response.status === 403 ? 3 : 4;
  throw new CliError(exitCode, "REQUEST_FAILED", `HTTP ${response.status}`, {
    raw: asErrorEnvelope(parsed, response.status),
  });
}

export function resolveBaseUrl(): string {
  const raw = (
    getInvocation().baseUrl ||
    process.env.IMAGIFLY_BASE_URL ||
    DEFAULT_BASE
  ).trim();
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new CliError(2, "BAD_ARGS", `Invalid base URL: ${raw}`);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new CliError(2, "BAD_ARGS", `Unsupported base URL protocol: ${url.protocol}`);
  }
  return raw.replace(/\/+$/, "");
}

function joinUrl(base: string, pathname: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${base}${path}`;
}

function parseBody(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return trimmed;
  }
}

function asErrorEnvelope(parsed: unknown, status: number): unknown {
  if (isEnvelope(parsed)) return parsed;
  const message =
    typeof parsed === "string" && parsed.trim()
      ? parsed.trim().slice(0, 500)
      : `HTTP ${status}`;
  const error =
    status === 401 || status === 403
      ? "UNAUTHORIZED"
      : status >= 500
        ? "INTERNAL_ERROR"
        : "REQUEST_FAILED";
  return { ok: false, error, message };
}

function isEnvelope(value: unknown): value is { ok: false; error: string } {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      (value as { ok?: unknown }).ok === false &&
      typeof (value as { error?: unknown }).error === "string",
  );
}
