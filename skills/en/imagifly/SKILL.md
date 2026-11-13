---
name: imagifly
description: Use the imagifly CLI to generate images and videos.
---

# Imagifly

Generate images and videos by shelling out to `imagifly`. Stdout is one JSON object. Progress and help are on stderr. Reply in English. Leave command names, flags, and JSON keys in English.

The picker name is `imagifly`. This file is the English skill. Copy it to `$AGENT_SKILLS_DIR/imagifly/SKILL.md`. Setup: https://imagifly.net/cli/setup.md

## Install

Node.js 18+.

```bash
npm install -g @imagifly/cli
SKILL_SRC="$(npm root -g)/@imagifly/cli/skills/en/imagifly/SKILL.md"
mkdir -p "$AGENT_SKILLS_DIR/imagifly"
cp "$SKILL_SRC" "$AGENT_SKILLS_DIR/imagifly/SKILL.md"
rm -rf "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli" "$AGENT_SKILLS_DIR/en/imagifly" "$AGENT_SKILLS_DIR/zh/imagifly" "$AGENT_SKILLS_DIR/ja/imagifly"
imagifly --version
```

The npm package is `@imagifly/cli`. The command is `imagifly`. This file is `skills/en/imagifly/SKILL.md`. Setup: https://imagifly.net/cli/setup.md

Replace `$AGENT_SKILLS_DIR` with the directory this agent loads. The `rm` drops leftover directories from older installs. It does not remove the `imagifly` folder just copied.

When the user asked only to install or configure the CLI, follow that guide. After `imagifly +me` exits 0, reply with only the English block in Verify. Do not translate it. Do not narrate the install. An upgrade or removal uses Update or Uninstall below, not that success block.

## Update

Upgrade the global package, then overwrite `$AGENT_SKILLS_DIR/imagifly/SKILL.md` from this English file and remove leftover locale directories. Replace `$AGENT_SKILLS_DIR` with the directory this agent loads. Leave the saved login in place.

```bash
npm install -g @imagifly/cli@latest
SKILL_SRC="$(npm root -g)/@imagifly/cli/skills/en/imagifly/SKILL.md"
mkdir -p "$AGENT_SKILLS_DIR/imagifly"
cp "$SKILL_SRC" "$AGENT_SKILLS_DIR/imagifly/SKILL.md"
rm -rf "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli" "$AGENT_SKILLS_DIR/en/imagifly" "$AGENT_SKILLS_DIR/zh/imagifly" "$AGENT_SKILLS_DIR/ja/imagifly"
imagifly --version
```

`--version` prints on stderr. Tell the user that version in English. Do not use the install success block.

## Uninstall

Remove the global package, `$AGENT_SKILLS_DIR/imagifly`, and leftover directories from older installs. Replace `$AGENT_SKILLS_DIR` with the same directory used at install.

```bash
npm uninstall -g @imagifly/cli
rm -rf "$AGENT_SKILLS_DIR/imagifly" "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli" "$AGENT_SKILLS_DIR/en/imagifly" "$AGENT_SKILLS_DIR/zh/imagifly" "$AGENT_SKILLS_DIR/ja/imagifly"
```

To clear the saved token as well, run `imagifly auth logout` before `npm uninstall` (the command is gone after uninstall). Do not use the install success block.

## Auth

Run login in the foreground. The command opens the browser. Tell the user only to click Allow, and wait until the command exits:

```bash
imagifly auth login --agent Cursor
imagifly auth status
```

- Replace `Cursor` with your own agent name (`Claude Code`, `Codex`, …). Do not send a hostname.
- Do not pass `--key` or `--no-browser`. Do not background it, and do not ask the user to run it in their own terminal.
- The Allow page shows the `--agent` name. Login polls Imagifly and does not need a terminal.
- As soon as it starts, tell the user the browser is open: sign in if asked, then click Allow. Do not ask them to paste a link, code, or token into the chat. Keep waiting until the command exits.
- Only if no browser window appears, send the `Open http...` link from stderr for them to open. Still do not ask them to paste anything back.
- `--api-key` on a command overrides `IMAGIFLY_API_KEY`, which overrides `~/.config/imagifly/config.json`.
- The config file is mode `600`. Do not copy the access token into the repo, chat, or logs.
- `auth status` returns `source` and `keyHint`. `authenticated: false` is still exit 0.
- Authorized agents can be revoked at https://imagifly.net/developer.

## Verify

```bash
imagifly +me
```

`+me` is the health check (image model count). Exit 0 means the token works. Exit 3 means the token is missing or rejected.

When the user asked only to install or configure via https://imagifly.net/cli/setup.md, and `+me` exits 0, reply with only the block below. Copy it as-is. Do not translate it. Do not narrate the install.

> Imagifly CLI is installed and signed in. You can generate images and videos.
> Try one of these:
> Generate an image of a teahouse in the rain
> List the available image models
> Generate a 5-second short video with a video model
>
> Or just describe the image or video you want, and the Agent will handle it.

On auth or verify failure, output only the failure info (exit code plus `error` and `message`). Do not add an essay.

Do not include install narration, tarball or script audits, npm cache workarounds, model catalogs, file modes, or key-rotation advice in that reply. List models only when the user asks to generate or to list models. Before generating, run `imagifly models image` or `imagifly models video` and read ids from that JSON. Prices and allowed durations change.

## Commands

| Command | When |
| --- | --- |
| `imagifly auth login --agent <name>` | Open the browser and wait for Allow |
| `imagifly auth logout` | Delete the saved token. Env may still be set (`envStillSet`) |
| `imagifly auth status` | See which credential is active |
| `imagifly +me` | Authenticated health check |
| `imagifly credits` | Current credit balance. Read `credits` |
| `imagifly models image` | `GET /api/v1/images/models` |
| `imagifly models video` | `GET /api/v1/videos/models` (no key required) |
| `imagifly image generate --prompt "..." --model <id> [--ratio 16:9] [--quality high] [--resolution-tier 1k] [--steps 20] [--reference file.png] [--wait] [--poll-interval 3] [--timeout 180] [--out file]` | Submit an image. `--wait` polls `GET /images/generations/{id}` |
| `imagifly image history [--limit 20]` | Recent image tasks. Each item includes `cost` and `imageUrls` |
| `imagifly image get --id gen_... [--out file]` | Read an image task. `--out` downloads the first `imageUrl` when `status` is `success`. `generation.cost` is the charge |
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
| 3 | Unauthorized. Fix the login; do not retry unchanged |
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

Run `imagifly credits` for the current balance. `generation.cost` on submit, `image get`, `video get`, and `image history` is the charge for that task. A failed task is refunded.

`POST` returning `202` already reserved credits. If the process stops before the task finishes, poll the same id with `image get` or `video get`. Submit again only when the previous submit was rejected (no id) or the task status is `failed`.

Do not retry `400`, `401`, `402`, or `404` unchanged. `429` and `5xx` can be retried with backoff. Do not send a second generate to "check" the first one.

## Language

Write every sentence to the user in English. Leave command names, flags, and JSON keys in English. The install-success reply is the block in Verify. Do not translate it.
