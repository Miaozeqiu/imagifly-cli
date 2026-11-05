import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { getInvocation } from "../context.js";
import { resolveApiKey } from "../config.js";
import { CliError, badArgs } from "../errors.js";
import { apiRequest } from "../http.js";
import {
  downloadFirst,
  expectGeneration,
  expectObject,
  generationId,
  outRequiresWait,
  pollUntilDone,
  throwIfFailed,
  withOutputPath,
} from "../media.js";
import { printJson, progress } from "../output.js";
import { assignIf, parseHistoryLimit, parsePollInterval, parseSeed, parseSteps, parseTimeoutMs, requireText } from "../parse.js";

const IMAGE_POLL_DEFAULT = 3;
const VIDEO_POLL_DEFAULT = 5;
const IMAGE_TIMEOUT_DEFAULT = 180;
const VIDEO_TIMEOUT_DEFAULT = 900;
const MAX_REFERENCE_BYTES = 10 * 1024 * 1024;
const MAX_MULTIPART_BYTES = 50 * 1024 * 1024;

type Flags = Record<string, unknown>;

export async function imageModels(): Promise<void> {
  printJson(await apiRequest("/images/models"));
}

export async function videoModels(): Promise<void> {
  printJson(await apiRequest("/videos/models", { auth: "optional" }));
}

export async function me(): Promise<void> {
  const body = expectObject(await apiRequest("/images/models"), "Model list");
  const models = Array.isArray(body.models) ? body.models : [];
  const ids = models.map((model) => {
    if (model && typeof model === "object" && "id" in model && typeof model.id === "string") {
      return model.id;
    }
    return null;
  });
  printJson({
    ok: body.ok === false ? false : true,
    imageModelCount: models.length,
    models: ids.filter((id): id is string => Boolean(id)),
  });
}

export async function credits(): Promise<void> {
  printJson(await apiRequest("/credits"));
}

export async function checkin(): Promise<void> {
  printJson(await apiRequest("/credits/checkin", { method: "POST" }));
}

export async function ensureDailyCheckin(): Promise<void> {
  const resolved = await resolveApiKey(getInvocation().apiKey);
  if (!resolved) return;

  try {
    const body = expectObject(await apiRequest("/credits/checkin", { method: "POST" }), "Check-in");
    if (body.claimed === true) {
      const granted = typeof body.creditsGranted === "number" ? body.creditsGranted : 0;
      progress(`checked in, +${granted} credits`);
    }
  } catch (err) {
    if (err instanceof CliError && err.message.startsWith("HTTP 403")) {
      progress("daily check-in is not available");
      return;
    }
    throw err;
  }
}

export async function imageHistory(opts: Flags): Promise<void> {
  const limit = parseHistoryLimit(text(opts, "limit"));
  printJson(await apiRequest(limit ? `/images/generations?limit=${limit}` : "/images/generations"));
}

export async function imageGenerate(opts: Flags): Promise<void> {
  const prompt = requireText(text(opts, "prompt"), "--prompt");
  const model = requireText(text(opts, "model"), "--model");
  const wait = opts.wait === true;
  const out = text(opts, "out");
  outRequiresWait(out, wait);
  const payload: Record<string, unknown> = { model, prompt };
  assignIf(payload, "ratio", text(opts, "ratio"));
  assignIf(payload, "negativePrompt", text(opts, "negativePrompt"));
  assignIf(payload, "quality", text(opts, "quality"));
  assignIf(payload, "resolutionTier", text(opts, "resolutionTier"));
  const steps = text(opts, "steps");
  if (steps?.trim()) payload.steps = parseSteps(steps);
  const references = list(opts, "reference");
  if (references.length) {
    payload.referenceImages = await Promise.all(references.map(referenceImage));
  }
  const submitted = await apiRequest("/images/generations", { method: "POST", json: payload });
  await finishGenerate(submitted, {
    wait,
    out,
    interval: parsePollInterval(text(opts, "pollInterval"), IMAGE_POLL_DEFAULT),
    timeoutMs: parseTimeoutMs(text(opts, "timeout"), IMAGE_TIMEOUT_DEFAULT),
    urlField: "imageUrls",
    pollPath: (id) => `/images/generations/${encodeURIComponent(id)}`,
  });
}

export async function imageGet(id: string, out?: string): Promise<void> {
  await printFetched(
    await apiRequest(`/images/generations/${encodeURIComponent(id)}`),
    out,
    "imageUrls",
    id,
  );
}

export async function videoGenerate(opts: Flags): Promise<void> {
  const prompt = requireText(text(opts, "prompt"), "--prompt");
  const model = requireText(text(opts, "model"), "--model");
  const wait = opts.wait === true;
  const out = text(opts, "out");
  outRequiresWait(out, wait);
  const fields: Record<string, string> = { model, prompt };
  assignString(fields, "variant", text(opts, "variant"));
  assignString(fields, "workflowFormat", text(opts, "workflowFormat"));
  assignString(fields, "duration", text(opts, "duration"));
  assignString(fields, "fps", text(opts, "fps"));
  assignString(fields, "size", text(opts, "size"));
  assignString(fields, "ratio", text(opts, "ratio"));
  assignString(fields, "quality", text(opts, "quality"));
  const seed = text(opts, "seed");
  if (seed?.trim()) fields.seed = String(parseSeed(seed));
  assignString(fields, "firstFrameUrl", text(opts, "firstFrameUrl"));
  assignString(fields, "lastFrameUrl", text(opts, "lastFrameUrl"));

  const files: MultipartFile[] = [];
  const firstFrame = text(opts, "firstFrame");
  const lastFrame = text(opts, "lastFrame");
  if (firstFrame) files.push(await readMultipart("firstFrame", firstFrame));
  if (lastFrame) files.push(await readMultipart("lastFrame", lastFrame));
  for (const file of list(opts, "reference")) files.push(await readMultipart("referenceImages", file));
  for (const file of list(opts, "referenceVideo")) files.push(await readMultipart("referenceVideos", file));
  for (const file of list(opts, "referenceAudio")) files.push(await readMultipart("referenceAudios", file));

  const submitted = files.length
    ? await apiRequest("/videos/generations", {
        method: "POST",
        ...multipartBody(fields, files, {
          referenceImages: list(opts, "referenceUrl"),
          referenceVideos: list(opts, "referenceVideoUrl"),
          referenceAudios: list(opts, "referenceAudioUrl"),
        }),
      })
    : await apiRequest("/videos/generations", {
        method: "POST",
        json: jsonVideoBody(fields, opts),
      });

  await finishGenerate(submitted, {
    wait,
    out,
    interval: parsePollInterval(text(opts, "pollInterval"), VIDEO_POLL_DEFAULT),
    timeoutMs: parseTimeoutMs(text(opts, "timeout"), VIDEO_TIMEOUT_DEFAULT),
    urlField: "videoUrls",
    pollPath: (id) => `/videos/generations/${encodeURIComponent(id)}`,
  });
}

export async function videoGet(id: string, out?: string): Promise<void> {
  await printFetched(
    await apiRequest(`/videos/generations/${encodeURIComponent(id)}`),
    out,
    "videoUrls",
    id,
  );
}

async function finishGenerate(
  submitted: unknown,
  options: {
    wait: boolean;
    out?: string;
    interval: number;
    timeoutMs: number;
    urlField: "imageUrls" | "videoUrls";
    pollPath: (id: string) => string;
  },
): Promise<void> {
  const id = generationId(submitted);
  progress(`submitted ${id}`);
  if (!options.wait) {
    printJson(submitted);
    return;
  }
  const finished = await pollUntilDone({
    id,
    intervalMs: options.interval * 1000,
    timeoutMs: options.timeoutMs,
    fetchStatus: () => apiRequest(options.pollPath(id)),
  });
  await printFetched(finished, options.out, options.urlField, id);
}

async function printFetched(
  body: unknown,
  out: string | undefined,
  urlField: "imageUrls" | "videoUrls",
  id: string,
): Promise<void> {
  throwIfFailed(body);
  if (!out) {
    printJson(body);
    return;
  }
  const generation = expectGeneration(body);
  if (generation.status !== "success") {
    throw new CliError(
      4,
      "NOT_READY",
      `Generation ${id} is not ready to download (status=${generation.status ?? "unknown"}).`,
      { details: { generation } },
    );
  }
  const outputPath = await downloadFirst(generation[urlField], out, id);
  printJson(withOutputPath(body, outputPath));
}

async function referenceImage(input: string): Promise<{ base64: string }> {
  if (input.startsWith("data:")) return { base64: input };
  const info = await stat(input).catch(() => {
    throw badArgs(`Reference image not found: ${input}`);
  });
  if (!info.isFile()) throw badArgs(`Reference image is not a file: ${input}`);
  if (info.size > MAX_REFERENCE_BYTES) {
    throw badArgs(`Reference image exceeds 10MB: ${input}`);
  }
  const bytes = await readFile(input);
  return { base64: bytes.toString("base64") };
}

function jsonVideoBody(fields: Record<string, string>, opts: Flags): Record<string, unknown> {
  const body: Record<string, unknown> = { ...fields };
  // Docs describe reference media as "URLs in JSON" without an object schema.
  // Send a string array. File uploads use multipart field names from the docs.
  assignUrlList(body, "referenceImages", list(opts, "referenceUrl"));
  assignUrlList(body, "referenceVideos", list(opts, "referenceVideoUrl"));
  assignUrlList(body, "referenceAudios", list(opts, "referenceAudioUrl"));
  return body;
}

function text(opts: Flags, key: string): string | undefined {
  const value = opts[key];
  return typeof value === "string" ? value : undefined;
}

function list(opts: Flags, key: string): string[] {
  const value = opts[key];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function assignUrlList(body: Record<string, unknown>, key: string, values: string[] | undefined): void {
  const urls = (values ?? []).map((value) => value.trim()).filter(Boolean);
  if (urls.length) body[key] = urls;
}

function assignString(target: Record<string, string>, key: string, value: string | undefined): void {
  if (value?.trim()) target[key] = value.trim();
}

interface MultipartFile {
  field: string;
  filename: string;
  contentType: string;
  bytes: Buffer;
}

async function readMultipart(field: string, filePath: string): Promise<MultipartFile> {
  const info = await stat(filePath).catch(() => {
    throw badArgs(`File not found: ${filePath}`);
  });
  if (!info.isFile()) throw badArgs(`Not a file: ${filePath}`);
  if (info.size > MAX_MULTIPART_BYTES) throw badArgs(`File exceeds 50MB: ${filePath}`);
  const filename = path.basename(filePath).replace(/[\r\n"]/g, "_");
  return {
    field,
    filename,
    contentType: contentTypeFor(filename),
    bytes: await readFile(filePath),
  };
}

function multipartBody(
  fields: Record<string, string>,
  files: MultipartFile[],
  repeated: Record<string, string[] | undefined>,
): { body: Uint8Array; contentType: string } {
  const boundary = `----imagifly${Math.random().toString(16).slice(2)}`;
  const chunks: Buffer[] = [];
  const push = (value: string | Buffer) => {
    chunks.push(typeof value === "string" ? Buffer.from(value) : value);
  };
  const addField = (name: string, value: string) => {
    push(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`);
  };
  for (const [name, value] of Object.entries(fields)) addField(name, value);
  for (const [name, values] of Object.entries(repeated)) {
    for (const value of values ?? []) {
      if (value.trim()) addField(name, value.trim());
    }
  }
  for (const file of files) {
    push(
      `--${boundary}\r\nContent-Disposition: form-data; name="${file.field}"; filename="${file.filename}"\r\nContent-Type: ${file.contentType}\r\n\r\n`,
    );
    push(file.bytes);
    push("\r\n");
  }
  push(`--${boundary}--\r\n`);
  return {
    body: Buffer.concat(chunks),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

function contentTypeFor(filename: string): string {
  switch (path.extname(filename).toLowerCase()) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".mp4":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    case ".mov":
      return "video/quicktime";
    case ".mp3":
      return "audio/mpeg";
    case ".wav":
      return "audio/wav";
    default:
      return "application/octet-stream";
  }
}
