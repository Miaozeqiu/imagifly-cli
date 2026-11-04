---
name: imagifly
description: >-
  用官方命令行生成图片和视频（npm 包 @imagifly/cli，命令 imagifly）。用于安装、更新、卸载命令行和本技能，OAuth 登录，列出模型，生成或下载图片和视频，阅读 JSON 结果。不要用于 MCP 服务器配置。
---

# Imagifly

通过 shell 调用 `imagifly` 生成图片和视频。标准输出是一个 JSON 对象。进度和帮助写在 stderr。用用户正在使用的语言回复；命令名、flag、JSON 字段保持英文。

本技能不安装、也不配置 Imagifly MCP 服务器。MCP 文档：https://imagifly.net/docs/agents

选择器里的名字始终是 `imagifly`。这份文件的描述是简体中文。英语说明在 `skills/en/imagifly/SKILL.md`，日语说明在 `skills/ja/imagifly/SKILL.md`。三份都复制到 `$AGENT_SKILLS_DIR/imagifly/SKILL.md`，只装与用户语言对应的那一份。复制后删掉遗留目录 `imagifly-zh`、`imagifly-ja`、`imagifly-cli`。繁体中文也用这一份。

## 安装

Node.js 18+。

```bash
npm install -g @imagifly/cli
SKILL_SRC="$(npm root -g)/@imagifly/cli/skills/zh/imagifly/SKILL.md"
mkdir -p "$AGENT_SKILLS_DIR/imagifly"
cp "$SKILL_SRC" "$AGENT_SKILLS_DIR/imagifly/SKILL.md"
rm -rf "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli"
imagifly --version
```

npm 包是 `@imagifly/cli`。命令是 `imagifly`。本文件是 `skills/zh/imagifly/SKILL.md`。包内还有 `skills/en/imagifly/SKILL.md` 和 `skills/ja/imagifly/SKILL.md`。安装步骤：https://imagifly.net/cli/setup.md

把 `$AGENT_SKILLS_DIR` 换成当前 Agent 加载 skills 的目录。上面的 `rm` 只删遗留的 `imagifly-zh`、`imagifly-ja`、`imagifly-cli`，不会删掉刚复制的 `imagifly`。中文安装不要复制另外两份。

用户只要求安装或配置 CLI 时，按那份指南做。`imagifly +me` 退出码为 0 之后，只回复下面「验证」里、对应用户语言的那一段成功文案。不要叙述安装过程。升级或卸载走「更新」或「卸载」，不要用安装成功文案。

## 更新

升级全局包，用这份中文 skill 覆盖 `$AGENT_SKILLS_DIR/imagifly/SKILL.md`，并删掉遗留目录。把 `$AGENT_SKILLS_DIR` 换成当前 Agent 的 skills 目录。已有登录不用重做。

```bash
npm install -g @imagifly/cli@latest
SKILL_SRC="$(npm root -g)/@imagifly/cli/skills/zh/imagifly/SKILL.md"
mkdir -p "$AGENT_SKILLS_DIR/imagifly"
cp "$SKILL_SRC" "$AGENT_SKILLS_DIR/imagifly/SKILL.md"
rm -rf "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli"
imagifly --version
```

`--version` 写在 stderr。用用户的语言告诉用户这个版本号。不要用安装成功文案。

## 卸载

卸掉全局包，并删掉 `$AGENT_SKILLS_DIR/imagifly`，以及遗留的 `imagifly-zh`、`imagifly-ja`、`imagifly-cli`。`$AGENT_SKILLS_DIR` 与安装时相同。

```bash
npm uninstall -g @imagifly/cli
rm -rf "$AGENT_SKILLS_DIR/imagifly" "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli"
```

如果还要清掉已保存的 token，先运行 `imagifly auth logout`，再执行 `npm uninstall`（卸载之后就没有 `imagifly` 命令了）。不要用安装成功文案。

## 登录

运行登录，并请用户在浏览器里点允许：

```bash
imagifly auth login --agent Cursor
imagifly auth status
```

- 把 `Cursor` 换成你自己的 Agent 名字（`Claude Code`、`Codex` 等）。不要写主机名。
- 授权链接带有 `agent=`。用户在允许页面上能看到这个名字。
- 登录还在跑时，留意 stderr 里的 `Open http...`。浏览器没打开就把这个 URL 发给用户。
- 用户只需登录（如果被要求）并点允许。没有需要手输的设备码。
- 单次命令的 `--api-key` 覆盖 `IMAGIFLY_API_KEY`，后者再覆盖 `~/.config/imagifly/config.json`。
- 配置文件权限是 `600`。不要把 access token 复制到仓库、对话或日志。
- `auth status` 返回 `source` 和 `keyHint`。`authenticated: false` 仍然是退出码 0。
- 已授权的 Agent 在 https://imagifly.net/developer 撤销。

## 验证

```bash
imagifly +me
```

`+me` 是健康检查（图像模型数量）。退出码 0 表示 token 可用。退出码 3 表示 token 缺失或被拒绝。

用户只是按 https://imagifly.net/cli/setup.md 安装或配置，且 `+me` 退出码为 0 时，只回复下面一段成功文案。语言跟用户这场对话一致。不要叙述安装过程。不要同时输出多种语言。

只选一段，按原文复制（与 https://imagifly.net/cli/setup.md 相同）：

- 中文（简体或繁体）：用简体中文这一段。
- 日语：用日语这一段。
- 英语，以及其他语言：用英语这一段。

不要另写翻译。命令名、flag、JSON 字段保持英文；这三段是给用户看的说明，不是命令。

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

登录或验证失败时，只输出失败信息（退出码，以及 `error` 和 `message`）。不要另写说明。

成功回复里不要写这些：安装过程、tarball 或安装脚本审计、npm 缓存处理、模型清单、文件权限、key 轮换建议。只有用户要生成或列出模型时才列模型。生成前先运行 `imagifly models image` 或 `imagifly models video`，从 JSON 里读 id。价格和允许的时长会变。

## 命令

| 命令 | 何时 |
| --- | --- |
| `imagifly auth login --agent <name>` | 打开浏览器并等待用户点允许 |
| `imagifly auth logout` | 删除已保存的 token。环境变量仍可能还在（`envStillSet`） |
| `imagifly auth status` | 查看当前生效的是哪份凭证 |
| `imagifly +me` | 已登录的健康检查 |
| `imagifly models image` | `GET /api/v1/images/models` |
| `imagifly models video` | `GET /api/v1/videos/models`（不需要 key） |
| `imagifly image generate --prompt "..." --model <id> [--ratio 16:9] [--quality high] [--resolution-tier 1k] [--steps 20] [--reference file.png] [--wait] [--poll-interval 3] [--timeout 180] [--out file]` | 提交图片。`--wait` 轮询 `GET /images/generations/{id}` |
| `imagifly image get --id gen_... [--out file]` | 读取图片任务。`status` 为 `success` 时，`--out` 下载第一个 `imageUrl` |
| `imagifly video generate --prompt "..." --model <id> [--variant 2.5] [--workflow-format t2v] [--duration 5s] [--fps 24] [--size 1280x720] [--ratio 16:9] [--wait] [--poll-interval 5] [--timeout 900] [--out file]` | 提交视频。时长必须是该模型的 `durationOptions` 之一 |
| `imagifly video get --id vid_... [--out file]` | 读取视频任务，并可下载第一个 `videoUrl` |

`--poll-interval` 必须在 2 到 5 秒之间。`generate` 上的 `--out` 必须同时带 `--wait`。保存文件的绝对路径在 JSON 的 `outputPath`。

图片参考是文件（或 `data:` URL），编码为 `{ "base64": "..." }`。视频参考 URL 是字符串数组。本地首尾帧（`--first-frame`、`--last-frame`）会把该请求改成 multipart。

## JSON 和退出码

只解析 stdout。除非命令失败且 stdout 为空，否则忽略 stderr。

| 退出码 | 含义 |
| --- | --- |
| 0 | 成功。`image get` / `video get` 在 `generating` 时仍是退出码 0 |
| 2 | 参数错误（`BAD_ARGS`） |
| 3 | 未授权。修好登录，不要原样重试 |
| 4 | 请求被拒绝、生成失败、轮询超时或下载失败 |
| 1 | 意外失败或网络失败 |

成功：

```json
{"ok":true,"generation":{"id":"gen_...","status":"success","imageUrls":["https://..."]},"outputPath":"/abs/tea.png"}
```

失败时，如果 Imagifly 返回了信封，就沿用它：

```json
{"ok":false,"error":"NOT_ENOUGH_CREDITS","message":"Not enough credits: this generation costs 12."}
```

按 `error` 分支，不要按 `message`。`--wait` 之后任务变成 `failed` 时，退出码是 4，`error` 为 `"GENERATION_FAILED"`，并带有 `generation` 对象。失败任务的积分由 API 退回。不要编造重试接口。

## 积分

`POST` 返回 `202` 时积分已经预留。进程在任务完成前停了，用同一个 id 调 `image get` 或 `video get`。只有上次提交被拒绝（没有 id）或任务状态是 `failed` 时才重新提交。

不要原样重试 `400`、`401`、`402`、`404`。`429` 和 `5xx` 可以退避后重试。不要为了“确认”第一次生成再发第二次生成。

## 语言

你写的每一句话都用用户正在使用的语言。CLI 自己的 JSON、命令名和 flag 用英文。用户用中文就用中文解释结果。不要同时输出两种语言。安装成功回复是「验证」里对应的那一段：简体中文、日语或英语。其他语言用英语这一段。不要另写翻译。
