import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { CliError, badArgs } from "./errors.js";
import { progress } from "./output.js";

export interface Generation {
  id?: string;
  status?: string;
  error?: string | null;
  imageUrls?: unknown;
  videoUrls?: unknown;
}

const DOWNLOAD_TIMEOUT_MS = 120_000;

export function expectObject(body: unknown, label: string): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new CliError(1, "INVALID_RESPONSE", `${label} was not a JSON object.`);
  }
  return body as Record<string, unknown>;
}

export function expectGeneration(body: unknown): Generation {
  const record = expectObject(body, "Response");
  const generation = record.generation;
  if (!generation || typeof generation !== "object" || Array.isArray(generation)) {
    throw new CliError(1, "INVALID_RESPONSE", "Response did not include generation.");
  }
  return generation as Generation;
}

export function generationId(body: unknown): string {
  const id = expectGeneration(body).id;
  if (typeof id !== "string" || !id.trim()) {
    throw new CliError(1, "INVALID_RESPONSE", "Response did not include generation.id.");
  }
  return id;
}

export async function pollUntilDone(options: {
  id: string;
  intervalMs: number;
  timeoutMs: number;
  fetchStatus: () => Promise<unknown>;
}): Promise<unknown> {
  const deadline = Date.now() + options.timeoutMs;
  let last = await options.fetchStatus();
  for (;;) {
    const generation = expectGeneration(last);
    const status = generation.status ?? "unknown";
    progress(`${options.id} status=${status}`);
    if (status === "success" || status === "failed") return last;
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      throw new CliError(
        4,
        "POLL_TIMEOUT",
        `Timed out after ${Math.round(options.timeoutMs / 1000)}s waiting for ${options.id}.`,
        { details: { generation } },
      );
    }
    await sleep(Math.min(options.intervalMs, remaining));
    last = await options.fetchStatus();
  }
}

export function throwIfFailed(body: unknown): void {
  const generation = expectGeneration(body);
  if (generation.status !== "failed") return;
  const message =
    typeof generation.error === "string" && generation.error.trim()
      ? generation.error
      : "Generation failed.";
  throw new CliError(4, "GENERATION_FAILED", message, { details: { generation } });
}

export async function downloadFirst(
  urls: unknown,
  out: string,
  fallbackBase: string,
): Promise<string> {
  const url = firstUrl(urls);
  if (!url) {
    throw new CliError(4, "DOWNLOAD_FAILED", "The finished task did not include a media URL.");
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new CliError(4, "DOWNLOAD_FAILED", "The media URL was invalid.", { details: { url } });
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new CliError(4, "DOWNLOAD_FAILED", `Unsupported media URL protocol: ${parsed.protocol}`, {
      details: { url },
    });
  }

  progress(`downloading ${url}`);
  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new CliError(4, "DOWNLOAD_FAILED", message, { details: { url } });
  }
  if (!response.ok) {
    throw new CliError(4, "DOWNLOAD_FAILED", `Download failed with HTTP ${response.status}.`, {
      details: { url, status: response.status },
    });
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  const dest = await resolveDestination(out, url, response.headers.get("content-type"), fallbackBase);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, bytes);
  progress(`saved ${dest}`);
  return dest;
}

export function withOutputPath(body: unknown, outputPath: string): unknown {
  const record = expectObject(body, "Response");
  return { ...record, outputPath };
}

export function outRequiresWait(out: string | undefined, wait: boolean): void {
  if (out && !wait) {
    throw badArgs("--out on generate requires --wait. Or poll later with image get / video get --out.");
  }
}

function firstUrl(urls: unknown): string | undefined {
  if (!Array.isArray(urls)) return undefined;
  return urls.find((item): item is string => typeof item === "string" && item.trim().length > 0);
}

async function resolveDestination(
  out: string,
  url: string,
  contentType: string | null,
  fallbackBase: string,
): Promise<string> {
  const resolved = path.resolve(out);
  let asDirectory = out.endsWith("/") || out.endsWith(path.sep);
  if (!asDirectory) {
    try {
      asDirectory = (await stat(resolved)).isDirectory();
    } catch (err) {
      if (!isNotFound(err)) throw err;
    }
  }
  if (!asDirectory) return resolved;
  return path.join(resolved, fileNameFromUrl(url, contentType, fallbackBase));
}

function fileNameFromUrl(url: string, contentType: string | null, fallbackBase: string): string {
  let base = fallbackBase;
  try {
    const last = new URL(url).pathname.split("/").filter(Boolean).pop();
    if (last) base = decodeURIComponent(last);
  } catch {
    // Keep the fallback name.
  }
  base = base.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^\.+/, "").slice(0, 120);
  if (!base) base = fallbackBase;
  if (!path.extname(base)) {
    const ext = extensionFor(contentType);
    if (ext) base += ext;
  }
  return base;
}

function extensionFor(contentType: string | null): string {
  const type = contentType?.split(";")[0]?.trim().toLowerCase();
  switch (type) {
    case "image/png":
      return ".png";
    case "image/jpeg":
      return ".jpg";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "video/mp4":
      return ".mp4";
    case "video/webm":
      return ".webm";
    case "video/quicktime":
      return ".mov";
    default:
      return "";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isNotFound(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && err.code === "ENOENT";
}
