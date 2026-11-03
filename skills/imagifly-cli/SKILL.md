---
name: imagifly-cli
description: >-
  Operate Imagifly image and video generation from the shell with the official
  CLI (@imagifly/cli, binary imagifly). Use when installing the CLI, saving an
  API key, listing models, generating or downloading images and videos, or
  reading JSON results. Do not use for MCP server setup.
---

# Imagifly CLI

Generate images and videos by shelling out to `imagifly`. Stdout is one JSON object. Progress and help are on stderr. Reply to the user in the language they are using; leave command names, flags, and JSON keys in English.

This skill does not install or configure the Imagifly MCP server. MCP docs: https://imagifly.net/docs/agents.

## Install

Node.js 18+.

```bash
npm install -g @imagifly/cli
imagifly --version
```

The npm package is `@imagifly/cli`. The command is `imagifly`.

## Auth

Ask once for an API key if you do not already have one (https://imagifly.net, key looks like `imf_...`). Then save it without echoing it back:

```bash
imagifly auth login --key imf_...
imagifly auth status
```

- `--api-key` on a command overrides `IMAGIFLY_API_KEY`, which overrides `~/.config/imagifly/config.json`.
- The config file is mode `600`. Do not copy the key into the repo, chat, or logs.
- `auth status` returns `source` and `keyHint`. `authenticated: false` is still exit 0.
- Do not open a browser login. There is no OAuth flow.

## Verify

```bash
imagifly +me
imagifly models image
imagifly models video
```

`+me` is the health check (image model count). Exit 3 means the key is missing or rejected. Read model ids from the catalog before generating. Prices and allowed durations change.

## Commands

| Command | When |
| --- | --- |
| `imagifly auth login --key imf_...` | Save a key |
| `imagifly auth logout` | Delete the saved key. Env may still be set (`envStillSet`) |
| `imagifly auth status` | See which credential is active |
| `imagifly +me` | Authenticated health check |
| `imagifly models image` | `GET /api/v1/images/models` |
| `imagifly models video` | `GET /api/v1/videos/models` (no key required) |
| `imagifly image generate --prompt "..." --model <id> [--ratio 16:9] [--quality high] [--resolution-tier 1k] [--steps 20] [--reference file.png] [--wait] [--poll-interval 3] [--timeout 180] [--out file]` | Submit an image. `--wait` polls `GET /images/generations/{id}` |
| `imagifly image get --id gen_... [--out file]` | Read an image task. `--out` downloads the first `imageUrl` when `status` is `success` |
| `imagifly video generate --prompt "..." --model <id> [--variant 2.5] [--workflow-format t2v] [--duration 5s] [--fps 24] [--size 1280x720] [--ratio 16:9] [--wait] [--poll-interval 5] [--timeout 900] [--out file]` | Submit a video. Duration must match that model's `durationOptions` |
| `imagifly video get --id vid_... [--out file]` | Read a video task and optionally download the first `videoUrl` |

`--poll-interval` must be from 2 to 5 seconds. `--out` on `generate` requires `--wait`. The saved file's absolute path is `outputPath` in the JSON.

Image references are files (or `data:` URLs) encoded as `{ "base64": "..." }`. Video reference URLs are string arrays. Local first/last frames (`--first-frame`, `--last-frame`) switch that request to multipart.

## JSON and exit codes

Parse stdout only. Ignore stderr unless the command failed and stdout is empty.

| Exit | Meaning |
| --- | --- |
| 0 | Success. For `image get` / `video get`, `generating` is still exit 0 |
| 2 | Bad arguments (`BAD_ARGS`) |
| 3 | Unauthorized. Fix the key; do not retry unchanged |
| 4 | Rejected request, failed generation, poll timeout, or download failure |
| 1 | Unexpected / network failure |

Success:

```json
{"ok":true,"generation":{"id":"gen_...","status":"success","imageUrls":["https://..."]},"outputPath":"/abs/tea.png"}
```

Failure matches the API envelope when Imagifly returned one:

```json
{"ok":false,"error":"NOT_ENOUGH_CREDITS","message":"Not enough credits: this generation costs 12."}
```

Branch on `error`, not on `message`. After `--wait`, a task that finishes `failed` is exit 4 with `error: "GENERATION_FAILED"` and the `generation` object. Credits for a failed task are returned by the API. Do not invent a retry endpoint.

## Credits

`POST` returning `202` already reserved credits. If the process stops before the task finishes, poll the same id with `image get` or `video get`. Submit again only when the previous submit was rejected (no id) or the task status is `failed`.

Do not retry `400`, `401`, `402`, or `404` unchanged. `429` and `5xx` can be retried with backoff. Do not send a second generate to "check" the first one.

## Language

Use the user's language for every sentence you write. Use English for the CLI's own JSON. If the user wrote in Chinese, explain results in Chinese. Do not print both languages.
