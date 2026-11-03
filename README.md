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

## Auth

Precedence: `--api-key` on a command, then `IMAGIFLY_API_KEY`, then `~/.config/imagifly/config.json`. The file is created mode `600`. Set `IMAGIFLY_CONFIG_DIR` to override that directory. Set `IMAGIFLY_BASE_URL` to point at another host.

```bash
imagifly auth login --key imf_...
imagifly auth status
imagifly auth logout
```

`auth login` without `--key` reads one line from stdin (or prompts on a terminal). Agents should pass `--key`.

## Commands

| Command | API |
| --- | --- |
| `imagifly +me` | `GET /images/models`, summarized as a count |
| `imagifly models image` | `GET /images/models` |
| `imagifly models video` | `GET /videos/models` (public) |
| `imagifly image generate --prompt "..." --model <id> [--ratio ...] [--wait] [--out path]` | `POST /images/generations` |
| `imagifly image get --id gen_... [--out path]` | `GET /images/generations/{id}` |
| `imagifly video generate --prompt "..." --model <id> [--duration 5s] [--wait] [--out path]` | `POST /videos/generations` |
| `imagifly video get --id vid_... [--out path]` | `GET /videos/generations/{id}` |

`--wait` polls every `--poll-interval` seconds (2–5; default 3 for images, 5 for video) until `success` or `failed`. Image wait defaults to 180s; video wait defaults to 900s. `--out` on generate requires `--wait` and downloads the first `imageUrl` or `videoUrl`. The JSON result includes `outputPath`.

There is no documented credits endpoint. `+me` is the lightweight authenticated check.

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
| 3 | Missing or rejected API key (`401` / `403`) |
| 4 | API or generation error (including `failed` tasks and poll timeout) |
| 1 | Unexpected failure |

A submit that returns `202` has already reserved credits. If you still have the id, use `image get` or `video get` instead of submitting again.

## Docs

- API: https://imagifly.net/docs/api
- Images: https://imagifly.net/docs/api/images
- Videos: https://imagifly.net/docs/api/videos
- Errors: https://imagifly.net/docs/getting-started/errors
- Agent setup for this CLI: [docs/cli-setup.md](docs/cli-setup.md)
- Agent skill: [skills/imagifly-cli/SKILL.md](skills/imagifly-cli/SKILL.md)

## Publish

Do not publish unless you mean to release. From a clean tree, as a member of the npm org `imagifly`:

```bash
npm publish --access public
```

That publishes `@imagifly/cli`. `publishConfig.access` is `public`. `prepublishOnly` runs `npm run build`, and the `files` field ships `dist`, `README.md`, `LICENSE`, `docs`, and `skills`.
