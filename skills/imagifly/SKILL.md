---
name: imagifly
description: >-
  Imagifly image and video generation / 图片和视频生成 / 画像と動画の生成.
  Official CLI (@imagifly/cli, binary imagifly). Use when installing, updating,
  or uninstalling the CLI and this skill, signing in with OAuth, listing models,
  generating or downloading images and videos, or reading JSON results.
  用于安装、更新、卸载、OAuth 登录、列出模型、生成或下载图片和视频、阅读 JSON 结果。
  インストール、更新、アンインストール、OAuth ログイン、モデル一覧、画像・動画の生成とダウンロード、JSON 結果の確認。
  Do not use for MCP server setup. 不要用于 MCP 服务器配置。MCP サーバーの設定には使わない。
---

# Imagifly

Generate images and videos by shelling out to `imagifly`. Stdout is one JSON object. Progress and help are on stderr. Reply in the language the user is writing. 用用户正在写的语言回复。ユーザーが書いている言語で返す。Leave command names, flags, and JSON keys in English.

This skill does not install or configure the Imagifly MCP server. MCP docs: https://imagifly.net/docs/agents.

The picker name is `imagifly`. There is one skill file. Do not choose a locale file.

## Install

Node.js 18+.

```bash
npm install -g @imagifly/cli
SKILL_SRC="$(npm root -g)/@imagifly/cli/skills/imagifly/SKILL.md"
mkdir -p "$AGENT_SKILLS_DIR/imagifly"
cp "$SKILL_SRC" "$AGENT_SKILLS_DIR/imagifly/SKILL.md"
rm -rf "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli" "$AGENT_SKILLS_DIR/en/imagifly" "$AGENT_SKILLS_DIR/zh/imagifly" "$AGENT_SKILLS_DIR/ja/imagifly"
imagifly --version
```

The npm package is `@imagifly/cli`. The command is `imagifly`. This file is `skills/imagifly/SKILL.md`. Agent setup steps: https://imagifly.net/cli/setup.md

Replace `$AGENT_SKILLS_DIR` with the directory this agent loads. The `rm` drops leftover `imagifly-zh`, `imagifly-ja`, and `imagifly-cli` directories, plus old `en/imagifly`, `zh/imagifly`, and `ja/imagifly` copies. It does not remove the `imagifly` folder just copied.

When the user asked only to install or configure the CLI, follow that guide. After `imagifly +me` exits 0, reply with only the success block for the user's language in Verify below. Do not narrate the install. An upgrade or removal uses Update or Uninstall below, not that success block.

## Update

Upgrade the global package, then overwrite `$AGENT_SKILLS_DIR/imagifly/SKILL.md` from this same file. Replace `$AGENT_SKILLS_DIR` with the directory this agent loads. Leave the saved login in place.

```bash
npm install -g @imagifly/cli@latest
SKILL_SRC="$(npm root -g)/@imagifly/cli/skills/imagifly/SKILL.md"
mkdir -p "$AGENT_SKILLS_DIR/imagifly"
cp "$SKILL_SRC" "$AGENT_SKILLS_DIR/imagifly/SKILL.md"
rm -rf "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli" "$AGENT_SKILLS_DIR/en/imagifly" "$AGENT_SKILLS_DIR/zh/imagifly" "$AGENT_SKILLS_DIR/ja/imagifly"
imagifly --version
```

`--version` prints on stderr. Tell the user that version, in their language. Do not use the install success block.

## Uninstall

Remove the global package, `$AGENT_SKILLS_DIR/imagifly`, and the leftover directories from older installs. Replace `$AGENT_SKILLS_DIR` with the same directory used at install.

```bash
npm uninstall -g @imagifly/cli
rm -rf "$AGENT_SKILLS_DIR/imagifly" "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli" "$AGENT_SKILLS_DIR/en/imagifly" "$AGENT_SKILLS_DIR/zh/imagifly" "$AGENT_SKILLS_DIR/ja/imagifly"
```

To clear the saved token as well, run `imagifly auth logout` before `npm uninstall` (the command is gone after uninstall). Do not use the install success block.

## Auth

Run login and tell the user to click Allow in the browser:

```bash
imagifly auth login --agent Cursor
imagifly auth status
```

- Replace `Cursor` with your own agent name (`Claude Code`, `Codex`, …). Do not send a hostname.
- The authorize URL includes `agent=`. The user sees that name on the Allow page.
- Watch stderr for `Open http...` while login is still running. Send the user that URL if the browser did not open.
- The user only needs to sign in (if asked) and click Allow. There is no device code to type.
- `--api-key` on a command overrides `IMAGIFLY_API_KEY`, which overrides `~/.config/imagifly/config.json`.
- The config file is mode `600`. Do not copy the access token into the repo, chat, or logs.
- `auth status` returns `source` and `keyHint`. `authenticated: false` is still exit 0.
- Authorized agents can be revoked at https://imagifly.net/developer.

## Verify

```bash
imagifly +me
```

`+me` is the health check (image model count). Exit 0 means the token works. Exit 3 means the token is missing or rejected.

When the user asked only to install or configure via https://imagifly.net/cli/setup.md, and `+me` exits 0, reply with the one block below that matches how the user is writing. Do not narrate the install. Do not print more than one language. Do not choose a different skill file.

Copy that block as-is (same wording as https://imagifly.net/cli/setup.md):

- Chinese (Simplified or Traditional): the Simplified Chinese block.
- Japanese: the Japanese block.
- English, or any other language: the English block.

Do not write a new translation. Command names, flags, and JSON keys stay English; these blocks are user-facing text, not commands.

简体中文:

> Imagifly CLI 已安装并登录成功，可以用来生成图片和视频了
> 你可以试试以下指令：
> 帮我生成一张雨天茶馆的图
> 列出可用的图像模型
> 用视频模型生成一段 5 秒短视频
>
> 也可以直接描述你的生图/生视频需求，让 Agent 帮你处理。

English:

> Imagifly CLI is installed and signed in. You can generate images and videos.
> Try one of these:
> Generate an image of a teahouse in the rain
> List the available image models
> Generate a 5-second short video with a video model
>
> Or just describe the image or video you want, and the Agent will handle it.

日本語:

> Imagifly CLI のインストールとログインが完了しました。画像と動画を生成できます。
> 次のような指示を試してみてください：
> 雨の日の茶館の画像を生成して
> 使える画像モデルを一覧して
> 動画モデルで 5 秒の短い動画を生成して
>
> 作りたい画像や動画をそのまま説明しても、Agent が対応します。

On auth or verify failure, output only the failure info (exit code plus `error` and `message`). Do not add an essay.

Do not include install narration, tarball or script audits, npm cache workarounds, model catalogs, file modes, or key-rotation advice in that reply. List models only when the user asks to generate or to list models. Before generating, run `imagifly models image` or `imagifly models video` and read ids from that JSON. Prices and allowed durations change.

## Commands

| Command | When |
| --- | --- |
| `imagifly auth login --agent <name>` | Open the browser and wait for Allow |
| `imagifly auth logout` | Delete the saved token. Env may still be set (`envStillSet`) |
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

`POST` returning `202` already reserved credits. If the process stops before the task finishes, poll the same id with `image get` or `video get`. Submit again only when the previous submit was rejected (no id) or the task status is `failed`.

Do not retry `400`, `401`, `402`, or `404` unchanged. `429` and `5xx` can be retried with backoff. Do not send a second generate to "check" the first one.

## Language

Use the user's language for every sentence you write. Use English for the CLI's own JSON, command names, and flags. If the user wrote in Chinese, explain results in Chinese. Do not print both languages. The install-success reply is the single matching block in Verify: Simplified Chinese, Japanese, or English. Any other language uses the English block. Do not invent another translation.
