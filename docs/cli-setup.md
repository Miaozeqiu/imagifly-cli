# Imagifly CLI

Agent-first setup for the `imagifly` binary (`npm` package `@imagifly/cli`).

稳定地址：https://imagifly.net/cli/setup.md

## 快速开始（AI Agent）

做完下面四步。技能选择器里的名字始终是 `imagifly`。按用户语言选择描述是英语、简体中文还是日语的那一份，只复制到 `$AGENT_SKILLS_DIR/imagifly/SKILL.md`。`imagifly +me` 退出码为 0 之后，只回复第 4 步里、对应用户语言的那一段成功文案。不要叙述安装过程，不要同时输出多种语言。

第 1 步 — 安装 CLI

Node.js 18+。

```bash
npm install -g @imagifly/cli
```

第 2 步 — 只安装一个 skill

包里有三份 skill，frontmatter 的 `name` 都是 `imagifly`。选择器始终显示 `imagifly`，描述语言取决于复制的是哪一份。按用户正在用的语言只复制一份到 `$AGENT_SKILLS_DIR/imagifly/SKILL.md`。复制之后删掉遗留目录 `imagifly-zh`、`imagifly-ja`、`imagifly-cli`。把 `$AGENT_SKILLS_DIR` 换成当前 Agent 的 skills 目录。

| 用户语言 | 选择器里的名字 | 包内路径 |
| --- | --- | --- |
| 英语，以及其他语言 | `imagifly` | `skills/en/imagifly/SKILL.md` |
| 简体中文（繁体也用这一份） | `imagifly` | `skills/zh/imagifly/SKILL.md` |
| 日语 | `imagifly` | `skills/ja/imagifly/SKILL.md` |

英语（默认）：

```bash
SKILL_SRC="$(npm root -g)/@imagifly/cli/skills/en/imagifly/SKILL.md"
mkdir -p "$AGENT_SKILLS_DIR/imagifly"
cp "$SKILL_SRC" "$AGENT_SKILLS_DIR/imagifly/SKILL.md"
rm -rf "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli"
```

简体中文：

```bash
SKILL_SRC="$(npm root -g)/@imagifly/cli/skills/zh/imagifly/SKILL.md"
mkdir -p "$AGENT_SKILLS_DIR/imagifly"
cp "$SKILL_SRC" "$AGENT_SKILLS_DIR/imagifly/SKILL.md"
rm -rf "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli"
```

日本語：

```bash
SKILL_SRC="$(npm root -g)/@imagifly/cli/skills/ja/imagifly/SKILL.md"
mkdir -p "$AGENT_SKILLS_DIR/imagifly"
cp "$SKILL_SRC" "$AGENT_SKILLS_DIR/imagifly/SKILL.md"
rm -rf "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli"
```

本安装指南的稳定地址：

https://imagifly.net/cli/setup.md

`image generate`、`video generate`、`image get`、`video get` 写在这份 skill 里。安装完成时不要展开这些命令。

第 3 步 — 登录

```bash
imagifly auth login --agent Cursor
```

- 先完成第 1 步。在终端里运行，不要传 `--key`。
- `--agent` 换成你自己的名字，例如 `Cursor`、`Claude Code`、`Codex`。不要写主机名或设备信息。
- CLI 打开的授权链接会带上 `agent=`，用户在网页上能看到是哪个 Agent 在申请。
- CLI 会打开浏览器。立刻把 stderr 里的 URL 发给用户，请用户登录后只点「允许」。
- 用户点允许后，CLI 把 access token 写到 `~/.config/imagifly/config.json`。不要把 token 原文回显到对话、日志或仓库。
- 已授权的 Agent 在 https://imagifly.net/developer 管理。
- 失败时重新运行同一条带 `--agent` 的命令。把错误信息交给用户。

第 4 步 — 验证

```bash
imagifly +me
```

退出码 `0` 表示登录可用。

验证成功后，只回复下面其中一段，语言跟用户这场对话一致。不要叙述安装过程，不要同时输出多种语言。

- 用户在用中文（简体或繁体）：用简体中文这一段。
- 用户在用日语：用日语这一段。
- 用户在用英语，或者以上都不是：用英语这一段。

选定后按原文输出。不要再翻译成别的语言，也不要补第二语言。命令名、flag、JSON 字段保持英文；这三段是给用户看的说明，不是命令。

简体中文：

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

登录或 `+me` 失败时，只输出失败信息：退出码，以及 stdout 里的 `error` 和 `message`。不要另写说明。

成功回复里不要写这些：安装过程、tarball 或安装脚本审计、`~/.npm` 缓存处理、模型清单、文件权限、key 轮换建议。它们留在 skill 里，等用户要生成或列出模型时再用。不要把 `+me` 打印的 `models` 数组贴进成功回复。

## 更新

先升级全局包，再用与安装时相同的语言源覆盖 `$AGENT_SKILLS_DIR/imagifly/SKILL.md`，并删掉遗留的 `imagifly-zh`、`imagifly-ja`、`imagifly-cli`。已有登录不用重做。不要用上面的安装成功文案。`--version` 写在 stderr。用用户的语言告诉用户这个版本号即可。

英语（`skills/en/imagifly/SKILL.md`）：

```bash
npm install -g @imagifly/cli@latest
SKILL_SRC="$(npm root -g)/@imagifly/cli/skills/en/imagifly/SKILL.md"
mkdir -p "$AGENT_SKILLS_DIR/imagifly"
cp "$SKILL_SRC" "$AGENT_SKILLS_DIR/imagifly/SKILL.md"
rm -rf "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli"
imagifly --version
```

简体中文（`skills/zh/imagifly/SKILL.md`）：

```bash
npm install -g @imagifly/cli@latest
SKILL_SRC="$(npm root -g)/@imagifly/cli/skills/zh/imagifly/SKILL.md"
mkdir -p "$AGENT_SKILLS_DIR/imagifly"
cp "$SKILL_SRC" "$AGENT_SKILLS_DIR/imagifly/SKILL.md"
rm -rf "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli"
imagifly --version
```

日本語（`skills/ja/imagifly/SKILL.md`）：

```bash
npm install -g @imagifly/cli@latest
SKILL_SRC="$(npm root -g)/@imagifly/cli/skills/ja/imagifly/SKILL.md"
mkdir -p "$AGENT_SKILLS_DIR/imagifly"
cp "$SKILL_SRC" "$AGENT_SKILLS_DIR/imagifly/SKILL.md"
rm -rf "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli"
imagifly --version
```

## 卸载

删掉全局包、已安装的 `$AGENT_SKILLS_DIR/imagifly`，以及遗留的 `imagifly-zh`、`imagifly-ja`、`imagifly-cli`。把 `$AGENT_SKILLS_DIR` 换成安装时用的同一目录。

```bash
npm uninstall -g @imagifly/cli
rm -rf "$AGENT_SKILLS_DIR/imagifly" "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli"
```

如果还要清掉已保存的 token，先运行 `imagifly auth logout`，再执行 `npm uninstall`（卸载之后就没有 `imagifly` 命令了）。不要用安装成功文案。

## 把上面四步做成功所需的事实

不要把本节抄进成功回复。

- Node.js 18+。`--help` 和 `--version` 写到 stderr，退出码 0，没有 JSON。
- Access token 存在 `~/.config/imagifly/config.json`（mode `600`）。`IMAGIFLY_API_KEY` 覆盖该文件；单次命令的 `--api-key` 覆盖两者。`imagifly auth status` 只打印 hint，不打印 token。
- `+me` 调用 `GET /api/v1/images/models`。成功时 stdout 是 `{ "ok": true, "imageModelCount": N, "models": ["..."] }`。退出码 `0` 表示成功。退出码 `3` 表示未登录或令牌被拒绝。
- 退出码：`0` 成功，`2` 参数错误，`3` 未授权，`4` API 或生成失败，`1` 意外失败。按 JSON 字段 `error` 判断。
- 生成和查询命令见已安装的 skill：`$AGENT_SKILLS_DIR/imagifly/SKILL.md`。包内源文件是 `skills/en/imagifly/SKILL.md`、`skills/zh/imagifly/SKILL.md`、`skills/ja/imagifly/SKILL.md`。

## 控制台

https://imagifly.net
