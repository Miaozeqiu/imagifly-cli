# Imagifly CLI

Agent-first setup for the `imagifly` binary (`npm` package `@imagifly/cli`).

## 快速开始（AI Agent）

做完下面四步。`imagifly +me` 退出码为 0 之后，给用户的回复只有「只需输出以下内容」里的那一段。

第 1 步 — 安装 CLI

Node.js 18+。

```bash
npm install -g @imagifly/cli
```

第 2 步 — 安装/更新 skill

Skill 正文是本仓库的 `skills/imagifly-cli/SKILL.md`。全局安装后，同一份文件在 npm 包内：

`<npm root -g>/@imagifly/cli/skills/imagifly-cli/SKILL.md`

复制到当前 Agent 会加载的 skills 目录（把 `$AGENT_SKILLS_DIR` 换成该目录）：

```bash
SKILL_SRC="$(npm root -g)/@imagifly/cli/skills/imagifly-cli/SKILL.md"
mkdir -p "$AGENT_SKILLS_DIR/imagifly-cli"
cp "$SKILL_SRC" "$AGENT_SKILLS_DIR/imagifly-cli/SKILL.md"
```

包路径不可用时，用 raw GitHub URL 读取或下载同一份文件：

https://raw.githubusercontent.com/Miaozeqiu/imagifly-cli/main/skills/imagifly-cli/SKILL.md

`image generate`、`video generate`、`image get`、`video get` 写在这份 skill 里。安装完成时不要展开这些命令。

第 3 步 — 登录

还没有 key 时，向用户要一次。Key 形如 `imf_...`，在 https://imagifly.net 创建。然后：

```bash
imagifly auth login --key imf_...
```

- 先完成第 1 步。Agent 要传 `--key`。
- 不要把 key 原文回显到对话、日志或仓库。
- 没有浏览器登录，也没有 OAuth。
- 失败时不要用同一把 key 重试。把错误信息交给用户。

第 4 步 — 验证

```bash
imagifly +me
```

退出码 `0` 表示 key 可用。

验证完成后，只需输出以下内容：

> Imagifly CLI 已安装并登录成功，可以用来生成图片和视频了
> 你可以试试以下指令：
> 帮我生成一张雨天茶馆的图
> 列出可用的图像模型
> 用视频模型生成一段 5 秒短视频
>
> 也可以直接描述你的生图/生视频需求，让 Agent 帮你处理。

登录或 `+me` 失败时，只输出失败信息：退出码，以及 stdout 里的 `error` 和 `message`。不要另写说明。

成功回复里不要写这些：安装过程、tarball 或安装脚本审计、`~/.npm` 缓存处理、模型清单、文件权限、key 轮换建议。它们留在 skill 里，等用户要生成或列出模型时再用。不要把 `+me` 打印的 `models` 数组贴进成功回复。

## 把上面四步做成功所需的事实

不要把本节抄进成功回复。

- Node.js 18+。`--help` 和 `--version` 写到 stderr，退出码 0，没有 JSON。
- Key 存在 `~/.config/imagifly/config.json`（mode `600`）。`IMAGIFLY_API_KEY` 覆盖该文件；单次命令的 `--api-key` 覆盖两者。`imagifly auth status` 只打印 hint，不打印 key。
- `+me` 调用 `GET /api/v1/images/models`。成功时 stdout 是 `{ "ok": true, "imageModelCount": N, "models": ["..."] }`。退出码 `0` 表示成功。退出码 `3` 表示 key 缺失或被拒绝。
- 退出码：`0` 成功，`2` 参数错误，`3` 未授权，`4` API 或生成失败，`1` 意外失败。按 JSON 字段 `error` 判断。
- 生成和查询命令见 [skills/imagifly-cli/SKILL.md](../skills/imagifly-cli/SKILL.md)。

## 控制台

https://imagifly.net
