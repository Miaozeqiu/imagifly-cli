import { createRequire } from "node:module";
import { Command, CommanderError, type Command as CommandType } from "commander";
import { login, logout, status } from "./commands/auth.js";
import {
  imageGenerate,
  imageGet,
  imageModels,
  me,
  videoGenerate,
  videoGet,
  videoModels,
} from "./commands/tasks.js";
import { setInvocation } from "./context.js";
import { CliError } from "./errors.js";
import { printJson } from "./output.js";
import { assertGenerationId } from "./parse.js";

const require = createRequire(import.meta.url);
const pkg = require("../package.json") as { version: string };

function collect(value: string, previous: string[]): string[] {
  previous.push(value);
  return previous;
}

function addApiOptions(command: Command): Command {
  return command
    .option("--api-key <key>", "API key for this call (overrides IMAGIFLY_API_KEY and the config file)")
    .option("--base-url <url>", "API base URL (default: https://imagifly.net/api/v1 or IMAGIFLY_BASE_URL)");
}

function mergedOpts(command: CommandType): Record<string, unknown> {
  const chain: CommandType[] = [];
  let current: CommandType | null = command;
  while (current) {
    chain.push(current);
    current = current.parent;
  }
  const merged: Record<string, unknown> = {};
  for (const item of chain.reverse()) {
    for (const [key, value] of Object.entries(item.opts<Record<string, unknown>>())) {
      if (value !== undefined) merged[key] = value;
    }
  }
  return merged;
}

function run(fn: (opts: Record<string, unknown>) => Promise<void>) {
  return async function (this: CommandType): Promise<void> {
    const opts = mergedOpts(this);
    setInvocation({
      apiKey: typeof opts.apiKey === "string" ? opts.apiKey : undefined,
      baseUrl: typeof opts.baseUrl === "string" ? opts.baseUrl : undefined,
    });
    try {
      await fn(opts);
    } finally {
      setInvocation({});
    }
  };
}

function missing(message: string) {
  return () => {
    throw new CliError(2, "BAD_ARGS", message);
  };
}

export function buildProgram(): Command {
  const program = new Command();
  program
    .name("imagifly")
    .description(
      "Agent-first CLI for the Imagifly image and video API. JSON goes to stdout. Progress and help go to stderr.",
    )
    .version(pkg.version, "-v, --version", "Print the CLI version");

  program.configureOutput({
    writeOut(str) {
      process.stderr.write(str);
    },
    writeErr(str) {
      process.stderr.write(str);
    },
  });
  program.exitOverride();
  program.showSuggestionAfterError();
  addApiOptions(program);

  program.addHelpText(
    "after",
    `
Examples:
  imagifly auth login --agent Cursor
  imagifly auth status
  imagifly +me
  imagifly models image
  imagifly image generate --model gpt-image-2 --prompt "A quiet tea shop" --ratio 16:9 --wait --out tea.png

Exit codes: 0 success, 2 bad args, 3 unauthorized, 4 API or generation error, 1 unexpected.
`,
  );

  const auth = addApiOptions(program.command("auth").description("Sign in with OAuth or inspect the saved token"));
  auth.action(missing("Choose auth login, auth logout, or auth status."));
  addApiOptions(
    auth
      .command("login")
    .description("Open the browser so you can click Allow, then save the access token")
    .option("--key <key>", "Legacy API key or access token for CI; skips the browser flow")
    .option("--agent <name>", "Agent name shown on the authorize page, for example Cursor")
    .option("--no-browser", "Do not open a browser")
    .option("--timeout <seconds>", "Give up waiting for approval after this many seconds")
    .action(async function (this: CommandType) {
      const opts = mergedOpts(this);
      setInvocation({
        apiKey: typeof opts.apiKey === "string" ? opts.apiKey : undefined,
        baseUrl: typeof opts.baseUrl === "string" ? opts.baseUrl : undefined,
      });
      try {
        await login({
          key: typeof opts.key === "string" ? opts.key : undefined,
          agent: typeof opts.agent === "string" ? opts.agent : undefined,
          noBrowser: opts.browser === false,
          timeout: typeof opts.timeout === "string" ? opts.timeout : undefined,
        });
      } finally {
        setInvocation({});
      }
    }),
  );
  auth.command("logout").description("Remove the saved access token").action(logout);
  auth
    .command("status")
    .description("Show whether a token is available, without printing it")
    .action(status);

  addApiOptions(
    program.command("+me").description("Health check: image model count for the authenticated account"),
  ).action(run(() => me()));

  const models = program.command("models").description("List live image or video models");
  models.action(missing("Choose models image or models video."));
  addApiOptions(models.command("image").description("GET /api/v1/images/models")).action(
    run(() => imageModels()),
  );
  addApiOptions(
    models.command("video").description("GET /api/v1/videos/models (public; key optional)"),
  ).action(run(() => videoModels()));

  const image = program.command("image").description("Submit and poll image generations");
  image.action(missing("Choose image generate or image get."));
  addApiOptions(
    image
      .command("generate")
      .description("POST /api/v1/images/generations")
      .requiredOption("--prompt <text>", "What to draw")
      .option("--model <id>", "Image model id from `imagifly models image`")
      .option("--ratio <ratio>", "Aspect ratio, for example 1:1 or 16:9")
      .option("--negative-prompt <text>", "What to avoid")
      .option("--quality <quality>", "standard or high")
      .option("--resolution-tier <tier>", "1k or 2k when the model supports it")
      .option("--steps <value>", "Numeric steps, or low, standard, high")
      .option("--reference <path>", "Reference image file or data: URL (repeatable, base64 JSON)", collect, [])
      .option("--wait", "Poll until success or failed")
      .option("--poll-interval <seconds>", "Seconds between polls (2-5)", "3")
      .option("--timeout <seconds>", "Stop waiting after this many seconds", "180")
      .option("--out <path>", "With --wait, download the first imageUrl"),
  ).action(run((opts) => imageGenerate(opts)));

  addApiOptions(
    image
      .command("get")
      .description("GET /api/v1/images/generations/{id}")
      .requiredOption("--id <id>", "Generation id (gen_...)")
      .option("--out <path>", "Download the first imageUrl when status is success"),
  ).action(
    run(async (opts) => {
      const id = assertGenerationId(String(opts.id ?? ""));
      await imageGet(id, typeof opts.out === "string" ? opts.out : undefined);
    }),
  );

  const video = program.command("video").description("Submit and poll video generations");
  video.action(missing("Choose video generate or video get."));
  addApiOptions(
    video
      .command("generate")
      .description("POST /api/v1/videos/generations")
      .requiredOption("--prompt <text>", "What happens in the clip")
      .option("--model <id>", "Video model id from `imagifly models video`")
      .option("--variant <id>", "Model variant, for example 2.0 or 2.5")
      .option("--workflow-format <id>", "t2v, r2v, or fl2v")
      .option("--duration <value>", "Duration from the model durationOptions, for example 5s")
      .option("--fps <value>", "Frame rate from the model fpsOptions")
      .option("--size <size>", "Output size, for example 1280x720")
      .option("--ratio <ratio>", "Aspect ratio, for example 16:9")
      .option("--quality <quality>", "standard or high")
      .option("--seed <int>", "Reproducibility seed")
      .option("--reference-url <url>", "Reference image URL (repeatable; sent as a string array)", collect, [])
      .option("--reference-video-url <url>", "Reference video URL (repeatable)", collect, [])
      .option("--reference-audio-url <url>", "Reference audio URL (repeatable)", collect, [])
      .option("--first-frame-url <url>", "Opening frame URL")
      .option("--last-frame-url <url>", "Closing frame URL")
      .option("--first-frame <path>", "Opening frame file (switches the request to multipart)")
      .option("--last-frame <path>", "Closing frame file (multipart)")
      .option("--reference <path>", "Reference image file (multipart field referenceImages)", collect, [])
      .option("--reference-video <path>", "Reference video file (multipart field referenceVideos)", collect, [])
      .option("--reference-audio <path>", "Reference audio file (multipart field referenceAudios)", collect, [])
      .option("--wait", "Poll until success or failed")
      .option("--poll-interval <seconds>", "Seconds between polls (2-5)", "5")
      .option("--timeout <seconds>", "Stop waiting after this many seconds", "900")
      .option("--out <path>", "With --wait, download the first videoUrl"),
  ).action(run((opts) => videoGenerate(opts)));

  addApiOptions(
    video
      .command("get")
      .description("GET /api/v1/videos/generations/{id}")
      .requiredOption("--id <id>", "Generation id (vid_...)")
      .option("--out <path>", "Download the first videoUrl when status is success"),
  ).action(
    run(async (opts) => {
      const id = assertGenerationId(String(opts.id ?? ""));
      await videoGet(id, typeof opts.out === "string" ? opts.out : undefined);
    }),
  );

  return program;
}

export async function main(argv: string[]): Promise<number> {
  const program = buildProgram();
  if (argv.slice(2).length === 0) {
    program.outputHelp();
    printJson({
      ok: false,
      error: "BAD_ARGS",
      message: "No command given. Run imagifly --help.",
    });
    return 2;
  }
  try {
    await program.parseAsync(argv);
    return 0;
  } catch (err) {
    return handleError(err);
  }
}

function handleError(err: unknown): number {
  if (err instanceof CommanderError) {
    if (err.exitCode === 0 || err.code === "commander.help" || err.code === "commander.version") {
      return 0;
    }
    printJson({
      ok: false,
      error: "BAD_ARGS",
      message: err.message.replace(/^error:\s*/, ""),
    });
    return 2;
  }
  if (err instanceof CliError) {
    if (err.raw !== undefined) printJson(err.raw);
    else printJson({ ok: false, error: err.error, message: err.message, ...(err.details ?? {}) });
    return err.exitCode;
  }
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`${err instanceof Error && err.stack ? err.stack : message}\n`);
  printJson({ ok: false, error: "UNKNOWN", message });
  return 1;
}
