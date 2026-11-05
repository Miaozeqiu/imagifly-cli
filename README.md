# Imagifly CLI

Agent-first command line for the [Imagifly](https://imagifly.net) image and video API (`https://imagifly.net/api/v1`).

面向 Agent 的 Imagifly 图片 / 视频命令行。标准输出是一行 JSON；进度和帮助写到 stderr。

npm package: `@imagifly/cli`. Binary: `imagifly`. The executable name lives only in the `bin` field, and command modules do not embed the npm scope. Renaming the package later is a `package.json` `name` change plus these docs.

## Install

Node.js 18 or newer.

```bash
npm install -g @imagifly/cli
imagifly --help
```

From a git checkout:

```bash
npm install
npm run build
node dist/cli.js --help
npm test
```

## Agent skill

The picker name is always `imagifly`. The package ships three locale sources. Link the setup page that matches the prompt, and copy only that file into `$AGENT_SKILLS_DIR/imagifly/SKILL.md`.

| Prompt | Setup URL | Skill source |
| --- | --- | --- |
| English | https://imagifly.net/cli/setup.md | `skills/en/imagifly/SKILL.md` |
| Simplified Chinese | https://imagifly.net/cli/setup.zh.md | `skills/zh/imagifly/SKILL.md` |
| Japanese | https://imagifly.net/cli/setup.ja.md | `skills/ja/imagifly/SKILL.md` |

English:

```bash
SKILL_SRC="$(npm root -g)/@imagifly/cli/skills/en/imagifly/SKILL.md"
mkdir -p "$AGENT_SKILLS_DIR/imagifly"
cp "$SKILL_SRC" "$AGENT_SKILLS_DIR/imagifly/SKILL.md"
rm -rf "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli" "$AGENT_SKILLS_DIR/en/imagifly" "$AGENT_SKILLS_DIR/zh/imagifly" "$AGENT_SKILLS_DIR/ja/imagifly"
```

Simplified Chinese:

```bash
SKILL_SRC="$(npm root -g)/@imagifly/cli/skills/zh/imagifly/SKILL.md"
mkdir -p "$AGENT_SKILLS_DIR/imagifly"
cp "$SKILL_SRC" "$AGENT_SKILLS_DIR/imagifly/SKILL.md"
rm -rf "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli" "$AGENT_SKILLS_DIR/en/imagifly" "$AGENT_SKILLS_DIR/zh/imagifly" "$AGENT_SKILLS_DIR/ja/imagifly"
```

Japanese:

```bash
SKILL_SRC="$(npm root -g)/@imagifly/cli/skills/ja/imagifly/SKILL.md"
mkdir -p "$AGENT_SKILLS_DIR/imagifly"
cp "$SKILL_SRC" "$AGENT_SKILLS_DIR/imagifly/SKILL.md"
rm -rf "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli" "$AGENT_SKILLS_DIR/en/imagifly" "$AGENT_SKILLS_DIR/zh/imagifly" "$AGENT_SKILLS_DIR/ja/imagifly"
```

## Update

Run `npm install -g @imagifly/cli@latest`, then repeat the copy for the same locale that was installed. `--version` prints on stderr.

English (`skills/en/imagifly/SKILL.md`):

```bash
npm install -g @imagifly/cli@latest
SKILL_SRC="$(npm root -g)/@imagifly/cli/skills/en/imagifly/SKILL.md"
mkdir -p "$AGENT_SKILLS_DIR/imagifly"
cp "$SKILL_SRC" "$AGENT_SKILLS_DIR/imagifly/SKILL.md"
rm -rf "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli" "$AGENT_SKILLS_DIR/en/imagifly" "$AGENT_SKILLS_DIR/zh/imagifly" "$AGENT_SKILLS_DIR/ja/imagifly"
imagifly --version
```

Simplified Chinese (`skills/zh/imagifly/SKILL.md`):

```bash
npm install -g @imagifly/cli@latest
SKILL_SRC="$(npm root -g)/@imagifly/cli/skills/zh/imagifly/SKILL.md"
mkdir -p "$AGENT_SKILLS_DIR/imagifly"
cp "$SKILL_SRC" "$AGENT_SKILLS_DIR/imagifly/SKILL.md"
rm -rf "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli" "$AGENT_SKILLS_DIR/en/imagifly" "$AGENT_SKILLS_DIR/zh/imagifly" "$AGENT_SKILLS_DIR/ja/imagifly"
imagifly --version
```

Japanese (`skills/ja/imagifly/SKILL.md`):

```bash
npm install -g @imagifly/cli@latest
SKILL_SRC="$(npm root -g)/@imagifly/cli/skills/ja/imagifly/SKILL.md"
mkdir -p "$AGENT_SKILLS_DIR/imagifly"
cp "$SKILL_SRC" "$AGENT_SKILLS_DIR/imagifly/SKILL.md"
rm -rf "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli" "$AGENT_SKILLS_DIR/en/imagifly" "$AGENT_SKILLS_DIR/zh/imagifly" "$AGENT_SKILLS_DIR/ja/imagifly"
imagifly --version
```

## Uninstall

```bash
npm uninstall -g @imagifly/cli
rm -rf "$AGENT_SKILLS_DIR/imagifly" "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli" "$AGENT_SKILLS_DIR/en/imagifly" "$AGENT_SKILLS_DIR/zh/imagifly" "$AGENT_SKILLS_DIR/ja/imagifly"
```

To clear the saved token as well, run `imagifly auth logout` before `npm uninstall`.

## Auth

`imagifly auth login --agent Cursor` opens the browser. Sign in if needed, click Allow, and the CLI stores the access token. Revoke authorized agents later on https://imagifly.net/developer.

Precedence: `--api-key` on a command, then `IMAGIFLY_API_KEY`, then `accessToken` or a leftover `apiKey` in `~/.config/imagifly/config.json`. The file is created mode `600`. Set `IMAGIFLY_CONFIG_DIR` to override that directory. Set `IMAGIFLY_BASE_URL` to point at another host.

```bash
imagifly auth login --agent Cursor
imagifly auth status
imagifly auth logout
```

`--key` is only for CI or a leftover API key. Agents should run `imagifly auth login --agent <name>` in the foreground, let it open the browser, and wait until the user clicks Allow. Do not ask the user to paste a link or code.

## Commands

| Command | API |
| --- | --- |
| `imagifly +me` | `GET /images/models`, summarized as a count |
| `imagifly credits` | `GET /credits` |
| `imagifly checkin` | `POST /credits/checkin` |
| `imagifly models image` | `GET /images/models` |
| `imagifly models video` | `GET /videos/models` (public) |
| `imagifly image generate --prompt "..." --model <id> [--ratio ...] [--wait] [--out path]` | `POST /images/generations` |
| `imagifly image history [--limit 20]` | `GET /images/generations` |
| `imagifly image get --id gen_... [--out path]` | `GET /images/generations/{id}` |
| `imagifly video generate --prompt "..." --model <id> [--duration 5s] [--wait] [--out path]` | `POST /videos/generations` |
| `imagifly video get --id vid_... [--out path]` | `GET /videos/generations/{id}` |

`--wait` polls every `--poll-interval` seconds (2–5; default 3 for images, 5 for video) until `success` or `failed`. Image wait defaults to 180s; video wait defaults to 900s. `--out` on generate requires `--wait` and downloads the first `imageUrl` or `videoUrl`. The JSON result includes `outputPath`.

`imagifly checkin` claims the daily credit grant. Image and video generate do this first, and so does every other signed-in command. The same account can claim once per day across the website, QQ, and the CLI. `imagifly credits` prints the signed-in account balance. `image history` lists recent image tasks, and each task includes `cost`. A submit that does not wait already returns `generation.cost`; `image get` and `--wait` return that same charge on the finished task. `+me` remains the lightweight authenticated check.

Model ids, prices, durations, and ratios come from the live catalog. Video `durationOptions` are strings such as `5s`. Reference image files are sent as `{ "base64": "..." }`. Video reference URLs are sent as a string array (`referenceImages`, and the video/audio counterparts). Local video frames use `multipart/form-data` with the field names from the docs (`firstFrame`, `lastFrame`, `referenceImages`).

## Output and exit codes

Stdout is one JSON object, matching the Imagifly envelope when the API returns one:

```json
{"ok":true,"generation":{"id":"gen_...","status":"generating"}}
```

```json
{"ok":false,"error":"NOT_ENOUGH_CREDITS","message":"Not enough credits: this generation costs 12."}
```

| Exit | Meaning |
| --- | --- |
| 0 | Success |
| 2 | Bad arguments |
| 3 | Missing or rejected access token (`401` / `403`) |
| 4 | API or generation error (including `failed` tasks and poll timeout) |
| 1 | Unexpected failure |

A submit that returns `202` has already reserved credits. If you still have the id, use `image get` or `video get` instead of submitting again.

## Docs

- API: https://imagifly.net/docs/api
- Images: https://imagifly.net/docs/api/images
- Videos: https://imagifly.net/docs/api/videos
- Errors: https://imagifly.net/docs/getting-started/errors
- Agent setup for this CLI: https://imagifly.net/cli/setup.md
- Agent skills: `skills/en/imagifly/SKILL.md`, `skills/zh/imagifly/SKILL.md`, `skills/ja/imagifly/SKILL.md` (each installed as `imagifly`)

## Publish

Do not publish unless you mean to release. From a clean tree, as a member of the npm org `imagifly`:

```bash
npm publish --access public
```

That publishes `@imagifly/cli`. `publishConfig.access` is `public`. `prepublishOnly` runs `npm run build`, and the `files` field ships `dist`, `README.md`, `LICENSE`, `docs`, and `skills`.
