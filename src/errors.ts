export class CliError extends Error {
  readonly error: string;
  readonly exitCode: number;
  readonly details?: Record<string, unknown>;
  /** Official API envelope printed unchanged on stdout. */
  readonly raw?: unknown;

  constructor(
    exitCode: number,
    error: string,
    message: string,
    options?: { details?: Record<string, unknown>; raw?: unknown },
  ) {
    super(message);
    this.name = "CliError";
    this.exitCode = exitCode;
    this.error = error;
    this.details = options?.details;
    this.raw = options?.raw;
  }
}

export function badArgs(message: string, details?: Record<string, unknown>): CliError {
  return new CliError(2, "BAD_ARGS", message, { details });
}
