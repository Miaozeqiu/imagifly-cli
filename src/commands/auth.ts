import { createInterface } from "node:readline/promises";
import { stdin as input, stderr as output } from "node:process";
import { clearApiKey, configFilePath, keyHint, readConfig, saveApiKey } from "../config.js";
import { badArgs } from "../errors.js";
import { printJson, progress } from "../output.js";

export async function login(keyFlag?: string): Promise<void> {
  const key = (keyFlag?.trim() || (await readKeyLine())).trim();
  if (!key) {
    throw badArgs(
      "Pass --key imf_... or pipe one line on stdin. Example: imagifly auth login --key imf_...",
    );
  }
  const file = await saveApiKey(key);
  if (!key.startsWith("imf_")) {
    progress("key does not start with imf_; saved anyway");
  }
  progress(`saved credentials to ${file}`);
  printJson({
    ok: true,
    saved: true,
    path: file,
    keyHint: keyHint(key),
  });
}

export async function logout(): Promise<void> {
  const result = await clearApiKey();
  const envStillSet = Boolean(process.env.IMAGIFLY_API_KEY?.trim());
  if (result.removed) progress(`removed ${result.path}`);
  else progress("no saved key to remove");
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
  const configKey = stored?.apiKey?.trim() || "";
  const envKey = process.env.IMAGIFLY_API_KEY?.trim() || "";
  const source = envKey ? "env" : configKey ? "config" : null;
  const active = envKey || configKey;
  printJson({
    ok: true,
    authenticated: Boolean(active),
    source,
    keyHint: active ? keyHint(active) : null,
    configPath: file,
    configPresent: Boolean(configKey),
  });
}

async function readKeyLine(): Promise<string> {
  if (input.isTTY) {
    const rl = createInterface({ input, output });
    try {
      const answer = await rl.question("API key (imf_...): ");
      return answer;
    } finally {
      rl.close();
    }
  }

  const chunks: Buffer[] = [];
  return await new Promise((resolve) => {
    const cleanup = () => {
      input.off("data", onData);
      input.off("end", onEnd);
      input.pause();
    };
    const onData = (buf: Buffer | string) => {
      chunks.push(typeof buf === "string" ? Buffer.from(buf) : buf);
      const text = Buffer.concat(chunks).toString("utf8");
      const nl = text.indexOf("\n");
      if (nl >= 0) {
        cleanup();
        resolve(text.slice(0, nl).replace(/\r$/, ""));
      }
    };
    const onEnd = () => {
      cleanup();
      resolve(Buffer.concat(chunks).toString("utf8").replace(/\r?\n$/, ""));
    };
    input.on("data", onData);
    input.on("end", onEnd);
    input.resume();
  });
}
