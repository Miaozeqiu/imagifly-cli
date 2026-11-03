import { badArgs } from "./errors.js";

export function requireText(value: string | undefined, flag: string): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    throw badArgs(`Missing ${flag}.`);
  }
  return trimmed;
}

export function assertGenerationId(id: string): string {
  const trimmed = id.trim();
  if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) {
    throw badArgs("id must contain only letters, numbers, underscores, and hyphens.");
  }
  return trimmed;
}

export function parsePollInterval(value: string | undefined, fallback: number): number {
  const raw = value?.trim() || String(fallback);
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 2 || n > 5) {
    throw badArgs("--poll-interval must be a number of seconds from 2 to 5.");
  }
  return n;
}

export function parseTimeoutMs(value: string | undefined, fallbackSeconds: number): number {
  const raw = value?.trim() || String(fallbackSeconds);
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    throw badArgs("--timeout must be a positive number of seconds.");
  }
  return n * 1000;
}

export function parseSteps(value: string): number | string {
  const trimmed = value.trim();
  if (/^(low|standard|high)$/i.test(trimmed)) return trimmed.toLowerCase();
  if (/^\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  throw badArgs("--steps must be a number or one of low, standard, high.");
}

export function parseSeed(value: string): number {
  if (!/^-?\d+$/.test(value.trim())) {
    throw badArgs("--seed must be an integer.");
  }
  return Number(value);
}

export function assignIf(
  target: Record<string, unknown>,
  key: string,
  value: string | number | undefined | null,
): void {
  if (value === undefined || value === null) return;
  if (typeof value === "string" && value.trim() === "") return;
  target[key] = typeof value === "string" ? value.trim() : value;
}
