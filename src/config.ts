import { chmod, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { CliError } from "./errors.js";

export interface StoredConfig {
  apiKey?: string;
}

export type KeySource = "flag" | "env" | "config";

export function configFilePath(): string {
  const override = process.env.IMAGIFLY_CONFIG_DIR?.trim();
  const dir = override
    ? path.resolve(override)
    : path.join(os.homedir(), ".config", "imagifly");
  return path.join(dir, "config.json");
}

export async function readConfig(): Promise<StoredConfig | null> {
  const file = configFilePath();
  let text: string;
  try {
    text = await readFile(file, "utf8");
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
  try {
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("expected an object");
    }
    const apiKey = (parsed as { apiKey?: unknown }).apiKey;
    if (apiKey !== undefined && typeof apiKey !== "string") {
      throw new Error("apiKey must be a string");
    }
    return { apiKey };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new CliError(1, "CONFIG_INVALID", `Cannot parse ${file}: ${reason}`);
  }
}

export async function resolveApiKey(
  flag?: string,
): Promise<{ key: string; source: KeySource } | null> {
  const fromFlag = flag?.trim();
  if (fromFlag) return { key: fromFlag, source: "flag" };
  const fromEnv = process.env.IMAGIFLY_API_KEY?.trim();
  if (fromEnv) return { key: fromEnv, source: "env" };
  const stored = await readConfig();
  const fromFile = stored?.apiKey?.trim();
  if (fromFile) return { key: fromFile, source: "config" };
  return null;
}

export async function saveApiKey(apiKey: string): Promise<string> {
  const file = configFilePath();
  const dir = path.dirname(file);
  await mkdir(dir, { recursive: true });
  await chmod(dir, 0o700);
  const body = `${JSON.stringify({ apiKey }, null, 2)}\n`;
  await writeFile(file, body, { mode: 0o600 });
  await chmod(file, 0o600);
  return file;
}

export async function clearApiKey(): Promise<{ removed: boolean; path: string }> {
  const file = configFilePath();
  try {
    await stat(file);
  } catch (err) {
    if (isNotFound(err)) return { removed: false, path: file };
    throw err;
  }
  await rm(file);
  return { removed: true, path: file };
}

export function keyHint(key: string): string {
  const trimmed = key.trim();
  if (trimmed.length <= 8) return `${trimmed.slice(0, 2)}…`;
  return `${trimmed.slice(0, 4)}…${trimmed.slice(-4)}`;
}

function isNotFound(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && err.code === "ENOENT";
}
