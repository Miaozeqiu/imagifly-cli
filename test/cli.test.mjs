import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const cli = path.resolve("dist/cli.js");
const KEY = "imf_test_key_value";

function run(args, options = {}) {
  const env = { ...process.env };
  delete env.IMAGIFLY_API_KEY;
  delete env.IMAGIFLY_BASE_URL;
  delete env.IMAGIFLY_CONFIG_DIR;
  Object.assign(env, options.env ?? {});
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cli, ...args], {
      env,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    if (options.input !== undefined) child.stdin.end(options.input);
    else child.stdin.end();
    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

async function waitForMatch(child, readStderr, pattern) {
  const started = Date.now();
  while (Date.now() - started < 8000) {
    const match = pattern.exec(readStderr());
    if (match) return match;
    if (child.exitCode !== null) {
      throw new Error(`CLI exited ${child.exitCode} before matching ${pattern}: ${readStderr()}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`CLI did not match ${pattern}: ${readStderr()}`);
}

function jsonStdout(result) {
  assert.equal(result.stdout.endsWith("\n"), true, result.stdout);
  const lines = result.stdout.trim().split("\n");
  assert.equal(lines.length, 1, result.stdout);
  return JSON.parse(lines[0]);
}

async function startApi() {
  const hits = [];
  let imagePolls = 0;
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const body = Buffer.concat(chunks);
      hits.push({
        method: req.method,
        path: url.pathname,
        authorization: req.headers.authorization ?? null,
        contentType: req.headers["content-type"] ?? null,
        body,
      });
      const auth = req.headers.authorization;
      const authed = auth === `Bearer ${KEY}`;
      const send = (status, payload, type = "application/json") => {
        const data = Buffer.isBuffer(payload) ? payload : Buffer.from(JSON.stringify(payload));
        res.writeHead(status, { "content-type": type });
        res.end(data);
      };

      if (req.method === "POST" && url.pathname === "/api/oauth/token") {
        send(200, {
          ok: true,
          access_token: KEY,
          token_type: "Bearer",
          scope: "api",
        });
        return;
      }
      if (url.pathname === "/files/cat.png") {
        send(200, Buffer.from("PNGDATA"), "image/png");
        return;
      }
      if (url.pathname === "/api/v1/videos/models") {
        send(200, { ok: true, models: [{ id: "MiniMax-H3", durationOptions: ["5s"] }] });
        return;
      }
      if (!authed) {
        send(401, { ok: false, error: "UNAUTHORIZED", message: "Missing API key." });
        return;
      }
      if (url.pathname === "/api/v1/images/models") {
        send(200, {
          ok: true,
          models: [
            { id: "gpt-image-2", credits: 12 },
            { id: "z-image", credits: 2 },
          ],
        });
        return;
      }
      if (req.method === "POST" && url.pathname === "/api/v1/images/generations") {
        const json = JSON.parse(body.toString("utf8"));
        if (json.prompt === "bad-request") {
          send(400, { ok: false, error: "INVALID_IMAGE_REQUEST", message: "Unknown image model: foo." });
          return;
        }
        if (json.prompt === "no-credits") {
          send(402, { ok: false, error: "NOT_ENOUGH_CREDITS", message: "Not enough credits: this generation costs 12." });
          return;
        }
        const ids = { fails: "gen_bad", slow: "gen_slow" };
        const id = ids[json.prompt] ?? "gen_ok";
        send(202, {
          ok: true,
          generation: { id, status: "generating", cost: 12, imageCount: 1 },
          settings: { model: json.model, ratio: json.ratio ?? null },
        });
        return;
      }
      if (req.method === "GET" && url.pathname === "/api/v1/images/generations/gen_ok") {
        imagePolls += 1;
        if (imagePolls === 1) {
          send(200, { ok: true, generation: { id: "gen_ok", status: "generating", imageUrls: [] } });
        } else {
          send(200, {
            ok: true,
            generation: {
              id: "gen_ok",
              status: "success",
              error: null,
              imageUrls: [`http://127.0.0.1:${server.address().port}/files/cat.png`],
            },
          });
        }
        return;
      }
      if (req.method === "GET" && url.pathname === "/api/v1/images/generations/gen_bad") {
        send(200, {
          ok: true,
          generation: { id: "gen_bad", status: "failed", error: "content policy", imageUrls: [] },
        });
        return;
      }
      if (req.method === "GET" && url.pathname === "/api/v1/images/generations/gen_slow") {
        send(200, { ok: true, generation: { id: "gen_slow", status: "generating", imageUrls: [] } });
        return;
      }
      if (req.method === "POST" && url.pathname === "/api/v1/videos/generations") {
        send(202, {
          ok: true,
          generation: { id: "vid_ok", status: "generating", cost: 100 },
        });
        return;
      }
      if (req.method === "GET" && url.pathname === "/api/v1/videos/generations/vid_ok") {
        send(200, {
          ok: true,
          generation: {
            id: "vid_ok",
            status: "success",
            videoUrls: ["https://example.invalid/clip.mp4"],
          },
        });
        return;
      }
      send(404, { ok: false, error: "GENERATION_NOT_FOUND", message: "No such task." });
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  return {
    hits,
    base: `http://127.0.0.1:${port}/api/v1`,
    close: () => new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve()))),
  };
}

test("package metadata and docs", async () => {
  const pkg = JSON.parse(await readFile("package.json", "utf8"));
  assert.equal(pkg.name, "@imagifly/cli");
  assert.equal(pkg.bin.imagifly, "dist/cli.js");
  assert.match(pkg.scripts.prepublishOnly, /build/);
  assert.equal(pkg.publishConfig.access, "public");
  assert.ok(pkg.files.includes("dist"));
  const readme = await readFile("README.md", "utf8");
  assert.match(readme, /npm publish --access public/);
  assert.match(readme, /@imagifly\/cli/);
  const skill = await readFile("skills/imagifly-cli/SKILL.md", "utf8");
  assert.match(skill, /npm install -g @imagifly\/cli/);
  assert.doesNotMatch(skill, /claude mcp add|mcp\.json/);
  const setup = await readFile("docs/cli-setup.md", "utf8");
  assert.match(setup, /imagifly auth login --agent/);
  assert.match(setup, /只需输出以下内容/);
  assert.match(setup, /https:\/\/imagifly\.net\/cli\/setup\.md/);
  assert.doesNotMatch(setup, /https:\/\/imagifly\.net\/cli\/skill\.md/);
  assert.doesNotMatch(setup, /raw\.githubusercontent\.com/);
  const successLine = "Imagifly CLI 已安装并登录成功，可以用来生成图片和视频了";
  assert.match(setup, new RegExp(successLine));
  assert.match(skill, new RegExp(successLine));
  const license = await readFile("LICENSE", "utf8");
  assert.match(license, /MIT License/);
});

test("help and version stay off stdout", async () => {
  const help = await run(["--help"]);
  assert.equal(help.code, 0);
  assert.equal(help.stdout, "");
  assert.match(help.stderr, /imagifly image generate/);
  assert.match(help.stderr, /\+me/);

  const version = await run(["--version"]);
  assert.equal(version.code, 0);
  assert.equal(version.stdout, "");
  assert.match(version.stderr, /0\.1\.0/);

  const none = await run([]);
  assert.equal(none.code, 2);
  assert.equal(jsonStdout(none).error, "BAD_ARGS");
  assert.match(none.stderr, /Usage/);
});

test("auth login, status, logout, and env precedence", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "imagifly-cli-"));
  try {
    const missing = await run(["auth", "login"], { env: { IMAGIFLY_CONFIG_DIR: dir } });
    assert.equal(missing.code, 2);
    const missingBody = jsonStdout(missing);
    assert.equal(missingBody.ok, false);
    assert.match(missingBody.message, /auth login/);

    const secret = "imf_supersecretvalue";
    const saved = await run(["auth", "login", "--key", secret], { env: { IMAGIFLY_CONFIG_DIR: dir } });
    assert.equal(saved.code, 0);
    const savedBody = jsonStdout(saved);
    assert.equal(savedBody.ok, true);
    assert.equal(savedBody.saved, true);
    assert.equal(savedBody.method, "key");
    assert.equal(saved.stdout.includes(secret), false);
    assert.equal(saved.stderr.includes(secret), false);
    const file = path.join(dir, "config.json");
    if (process.platform !== "win32") {
      const mode = (await stat(file)).mode & 0o777;
      assert.equal(mode, 0o600);
    }
    const stored = JSON.parse(await readFile(file, "utf8"));
    assert.equal(stored.apiKey, secret);

    const fromFile = await run(["auth", "status"], { env: { IMAGIFLY_CONFIG_DIR: dir } });
    assert.equal(fromFile.code, 0);
    const fileStatus = jsonStdout(fromFile);
    assert.equal(fileStatus.authenticated, true);
    assert.equal(fileStatus.source, "config");
    assert.equal(fromFile.stdout.includes(secret), false);
    assert.equal(fileStatus.method, "key");

    const fromEnv = await run(["auth", "status"], {
      env: { IMAGIFLY_CONFIG_DIR: dir, IMAGIFLY_API_KEY: KEY },
    });
    assert.equal(jsonStdout(fromEnv).source, "env");
    assert.equal(fromEnv.stdout.includes(KEY), false);

    const removed = await run(["auth", "logout"], {
      env: { IMAGIFLY_CONFIG_DIR: dir, IMAGIFLY_API_KEY: KEY },
    });
    assert.equal(removed.code, 0);
    const removedBody = jsonStdout(removed);
    assert.equal(removedBody.removed, true);
    assert.equal(removedBody.envStillSet, true);
    await assert.rejects(stat(file));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("oauth browser login saves an access token", { timeout: 20_000 }, async () => {
  const api = await startApi();
  const dir = await mkdtemp(path.join(tmpdir(), "imagifly-cli-oauth-"));
  const env = {
    ...process.env,
    IMAGIFLY_CONFIG_DIR: dir,
    IMAGIFLY_BASE_URL: api.base,
    IMAGIFLY_ALLOW_DEVICE_LOGIN: "1",
  };
  delete env.IMAGIFLY_API_KEY;
  const child = spawn(process.execPath, [cli, "auth", "login", "--no-browser", "--timeout", "20"], {
    env,
    stdio: ["pipe", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  child.stdin.end();
  const closed = new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", resolve);
  });

  try {
    const callbackMatch = await waitForMatch(child, () => stderr, /callback (http:\/\/127\.0\.0\.1:\d+\/callback)/);
    const stateMatch = await waitForMatch(child, () => stderr, /[?&]state=([^&\s]+)/);
    const redirectUri = callbackMatch[1];
    const state = decodeURIComponent(stateMatch[1]);
    const callback = await fetch(`${redirectUri}?code=test-code&state=${encodeURIComponent(state)}`, {
      signal: AbortSignal.timeout(3000),
    });
    assert.equal(callback.ok, true, await callback.text());

    const code = await closed;
    assert.equal(code, 0, stderr);
    const body = JSON.parse(stdout.trim());
    assert.equal(body.ok, true);
    assert.equal(body.method, "oauth");
    assert.equal(stdout.includes(KEY), false);
    const stored = JSON.parse(await readFile(path.join(dir, "config.json"), "utf8"));
    assert.equal(stored.accessToken, KEY);

    const health = await run(["+me"], {
      env: { IMAGIFLY_CONFIG_DIR: dir, IMAGIFLY_BASE_URL: api.base },
    });
    assert.equal(health.code, 0, health.stderr);
    assert.equal(jsonStdout(health).ok, true);
  } finally {
    if (!child.killed) child.kill("SIGTERM");
    await api.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test("api commands against a mock server", async () => {
  const api = await startApi();
  const dir = await mkdtemp(path.join(tmpdir(), "imagifly-cli-"));
  const env = {
    IMAGIFLY_API_KEY: KEY,
    IMAGIFLY_BASE_URL: api.base,
    IMAGIFLY_CONFIG_DIR: dir,
  };
  try {
    const health = await run(["+me"], { env });
    assert.equal(health.code, 0);
    const healthBody = jsonStdout(health);
    assert.equal(healthBody.ok, true);
    assert.equal(healthBody.imageModelCount, 2);
    assert.deepEqual(healthBody.models, ["gpt-image-2", "z-image"]);

    const flagAfter = await run(["+me", "--api-key", KEY], {
      env: { IMAGIFLY_BASE_URL: api.base, IMAGIFLY_CONFIG_DIR: dir },
    });
    assert.equal(flagAfter.code, 0, flagAfter.stderr);
    const flagBefore = await run(["--api-key", KEY, "+me"], {
      env: { IMAGIFLY_BASE_URL: api.base, IMAGIFLY_CONFIG_DIR: dir },
    });
    assert.equal(flagBefore.code, 0, flagBefore.stderr);

    const noKey = await run(["+me"], { env: { IMAGIFLY_BASE_URL: api.base, IMAGIFLY_CONFIG_DIR: dir } });
    assert.equal(noKey.code, 3);
    assert.equal(jsonStdout(noKey).error, "UNAUTHORIZED");

    const denied = await run(["models", "image"], {
      env: { ...env, IMAGIFLY_API_KEY: "imf_wrong" },
    });
    assert.equal(denied.code, 3);
    assert.deepEqual(jsonStdout(denied), { ok: false, error: "UNAUTHORIZED", message: "Missing API key." });

    const publicModels = await run(["models", "video"], {
      env: { IMAGIFLY_BASE_URL: api.base, IMAGIFLY_CONFIG_DIR: dir },
    });
    assert.equal(publicModels.code, 0);
    assert.equal(jsonStdout(publicModels).models[0].id, "MiniMax-H3");

    const noPrompt = await run(["image", "generate", "--model", "gpt-image-2"], { env });
    assert.equal(noPrompt.code, 2);
    assert.equal(jsonStdout(noPrompt).message, "required option '--prompt <text>' not specified");

    const badArgs = await run(["image", "generate", "--prompt", "hello"], { env });
    assert.equal(badArgs.code, 2);
    assert.equal(jsonStdout(badArgs).error, "BAD_ARGS");

    const outWithoutWait = await run(
      ["image", "generate", "--prompt", "hello", "--model", "gpt-image-2", "--out", "x.png"],
      { env },
    );
    assert.equal(outWithoutWait.code, 2);

    const badRequest = await run(
      ["image", "generate", "--prompt", "bad-request", "--model", "foo"],
      { env },
    );
    assert.equal(badRequest.code, 4);
    assert.equal(jsonStdout(badRequest).error, "INVALID_IMAGE_REQUEST");

    const credits = await run(
      ["image", "generate", "--prompt", "no-credits", "--model", "gpt-image-2"],
      { env },
    );
    assert.equal(credits.code, 4);
    assert.equal(jsonStdout(credits).error, "NOT_ENOUGH_CREDITS");

    const ref = path.join(dir, "ref.png");
    await writeFile(ref, Buffer.from("PNGDATA"));
    const submitted = await run(
      [
        "image",
        "generate",
        "--prompt", "A cat",
        "--model", "gpt-image-2",
        "--ratio", "16:9",
        "--reference", ref,
      ],
      { env },
    );
    assert.equal(submitted.code, 0, submitted.stderr);
    assert.equal(jsonStdout(submitted).generation.id, "gen_ok");
    assert.match(submitted.stderr, /submitted gen_ok/);
    const post = api.hits.filter((hit) => hit.path === "/api/v1/images/generations").at(-1);
    const posted = JSON.parse(post.body.toString("utf8"));
    assert.equal(posted.model, "gpt-image-2");
    assert.equal(posted.ratio, "16:9");
    assert.equal(Buffer.from(posted.referenceImages[0].base64, "base64").toString(), "PNGDATA");
    assert.equal(submitted.stdout.includes("PNGDATA"), false);

    const out = path.join(dir, "out.png");
    const waited = await run(
      [
        "image",
        "generate",
        "--prompt", "A cat",
        "--model", "gpt-image-2",
        "--wait",
        "--poll-interval", "2",
        "--out", out,
      ],
      { env },
    );
    assert.equal(waited.code, 0, waited.stderr);
    const waitedBody = jsonStdout(waited);
    assert.equal(waitedBody.ok, true);
    assert.equal(waitedBody.generation.status, "success");
    assert.equal(waitedBody.outputPath, out);
    assert.equal(await readFile(out, "utf8"), "PNGDATA");
    assert.equal(waited.stdout.includes("http://"), true);

    const failed = await run(
      ["image", "generate", "--prompt", "fails", "--model", "gpt-image-2", "--wait", "--poll-interval", "2"],
      { env },
    );
    assert.equal(failed.code, 4);
    const failedBody = jsonStdout(failed);
    assert.equal(failedBody.error, "GENERATION_FAILED");
    assert.equal(failedBody.generation.status, "failed");

    const video = await run(
      [
        "video",
        "generate",
        "--prompt", "A boat",
        "--model", "MiniMax-H3",
        "--duration", "5s",
        "--ratio", "16:9",
        "--reference-url", "https://example.invalid/a.png",
      ],
      { env },
    );
    assert.equal(video.code, 0, video.stderr);
    assert.equal(jsonStdout(video).generation.id, "vid_ok");
    const videoPost = api.hits.filter((hit) => hit.path === "/api/v1/videos/generations").at(-1);
    const videoJson = JSON.parse(videoPost.body.toString("utf8"));
    assert.deepEqual(videoJson, {
      model: "MiniMax-H3",
      prompt: "A boat",
      duration: "5s",
      ratio: "16:9",
      referenceImages: ["https://example.invalid/a.png"],
    });

    const frame = path.join(dir, "first.png");
    await writeFile(frame, Buffer.from("FRAME"));
    const multipart = await run(
      [
        "video",
        "generate",
        "--prompt", "Push in",
        "--model", "MiniMax-H3",
        "--workflow-format", "fl2v",
        "--first-frame", frame,
      ],
      { env },
    );
    assert.equal(multipart.code, 0, multipart.stderr);
    const multiHit = api.hits.filter((hit) => hit.path === "/api/v1/videos/generations").at(-1);
    assert.match(String(multiHit.contentType), /multipart\/form-data/);
    const raw = multiHit.body.toString("utf8");
    assert.match(raw, /name="firstFrame"/);
    assert.match(raw, /name="workflowFormat"/);
    assert.match(raw, /FRAME/);

    const got = await run(["image", "get", "--id", "gen_bad"], { env });
    assert.equal(got.code, 4);
    assert.equal(jsonStdout(got).error, "GENERATION_FAILED");

    const badId = await run(["image", "get", "--id", "../etc"], { env });
    assert.equal(badId.code, 2);

    const fileKeyDir = await mkdtemp(path.join(tmpdir(), "imagifly-cli-file-"));
    await run(["auth", "login", "--key", "imf_file_key_not_used"], { env: { IMAGIFLY_CONFIG_DIR: fileKeyDir } });
    const envWins = await run(["+me"], {
      env: { IMAGIFLY_CONFIG_DIR: fileKeyDir, IMAGIFLY_BASE_URL: api.base, IMAGIFLY_API_KEY: KEY },
    });
    assert.equal(envWins.code, 0, envWins.stderr);
    const meHit = api.hits.filter((hit) => hit.path === "/api/v1/images/models").at(-1);
    assert.equal(meHit.authorization, `Bearer ${KEY}`);
    await rm(fileKeyDir, { recursive: true, force: true });
  } finally {
    await api.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test("poll timeout exits 4", { timeout: 20_000 }, async () => {
  const api = await startApi();
  const dir = await mkdtemp(path.join(tmpdir(), "imagifly-cli-timeout-"));
  try {
    const result = await run(
      ["image", "get", "--id", "gen_slow"],
      { env: { IMAGIFLY_API_KEY: KEY, IMAGIFLY_BASE_URL: api.base, IMAGIFLY_CONFIG_DIR: dir } },
    );
    assert.equal(result.code, 0);
    assert.equal(jsonStdout(result).generation.status, "generating");

    const timed = await run(
      [
        "image",
        "generate",
        "--prompt", "slow",
        "--model", "gpt-image-2",
        "--wait",
        "--poll-interval", "2",
        "--timeout", "2",
      ],
      { env: { IMAGIFLY_API_KEY: KEY, IMAGIFLY_BASE_URL: api.base, IMAGIFLY_CONFIG_DIR: dir } },
    );
    assert.equal(timed.code, 4, timed.stderr);
    assert.equal(jsonStdout(timed).error, "POLL_TIMEOUT");
  } finally {
    await api.close();
    await rm(dir, { recursive: true, force: true });
  }
});
