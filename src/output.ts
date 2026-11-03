export function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

export function progress(message: string): void {
  process.stderr.write(`imagifly: ${message}\n`);
}
