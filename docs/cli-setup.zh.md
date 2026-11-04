# Imagifly CLI

`imagifly` 命令的 Agent 安装说明（npm 包 `@imagifly/cli`）。

稳定地址：https://imagifly.net/cli/setup.zh.md

选择器里的名字是 `imagifly`。本页安装简体中文 skill。

做完下面四步。`imagifly +me` 退出码为 0 之后，只回复第 4 步里的成功文案，不要翻译，不要叙述安装过程。

## 1. 安装 CLI

Node.js 18+。

```bash
npm install -g @imagifly/cli
```

## 2. 复制 skill

```bash
SKILL_SRC="$(npm root -g)/@imagifly/cli/skills/zh/imagifly/SKILL.md"
mkdir -p "$AGENT_SKILLS_DIR/imagifly"
cp "$SKILL_SRC" "$AGENT_SKILLS_DIR/imagifly/SKILL.md"
rm -rf "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli" "$AGENT_SKILLS_DIR/en/imagifly" "$AGENT_SKILLS_DIR/zh/imagifly" "$AGENT_SKILLS_DIR/ja/imagifly"
```

把 `$AGENT_SKILLS_DIR` 换成当前 Agent 加载 skills 的目录。`rm` 删掉旧安装留下的目录，不会删掉刚复制的 `imagifly`。

`image generate`、`video generate`、`image get`、`video get` 写在这份 skill 里。成功回复里不要展开这些命令。

## 3. 登录

```bash
imagifly auth login --agent Cursor
```

- 先完成第 1 步。在终端里运行，不要传 `--key`。
- `--agent` 换成你自己的名字，例如 `Cursor`、`Claude Code`、`Codex`。不要写主机名。
- 授权链接带有 `agent=`。用户在允许页面上能看到这个名字。
- 把 stderr 里的 URL 发给用户。需要的话先登录，然后只点「允许」。没有要手输的设备码。
- CLI 把 access token 写到 `~/.config/imagifly/config.json`。不要把 token 发到对话、日志或仓库。
- 已授权的 Agent 在 https://imagifly.net/developer 管理。
- 失败时重新运行同一条命令，把错误交给用户。

## 4. 验证

```bash
imagifly +me
```

退出码 `0` 表示登录可用。只回复下面这一段：

> Imagifly CLI 已安装并登录成功，可以用来生成图片和视频了
> 你可以试试以下指令：
> 帮我生成一张雨天茶馆的图
> 列出可用的图像模型
> 用视频模型生成一段 5 秒短视频
>
> 也可以直接描述你的生图/生视频需求，让 Agent 帮你处理。

登录或 `+me` 失败时，只输出退出码，以及 stdout 里的 `error` 和 `message`。

成功回复里不要写安装过程、安装包审计、npm 缓存、模型清单、文件权限或 key 轮换。

## 更新

升级全局包，再把这份中文 skill 复制一遍。已有登录不用重做。不要用安装成功文案。`--version` 写在 stderr。用简体中文告诉用户这个版本号。

```bash
npm install -g @imagifly/cli@latest
SKILL_SRC="$(npm root -g)/@imagifly/cli/skills/zh/imagifly/SKILL.md"
mkdir -p "$AGENT_SKILLS_DIR/imagifly"
cp "$SKILL_SRC" "$AGENT_SKILLS_DIR/imagifly/SKILL.md"
rm -rf "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli" "$AGENT_SKILLS_DIR/en/imagifly" "$AGENT_SKILLS_DIR/zh/imagifly" "$AGENT_SKILLS_DIR/ja/imagifly"
imagifly --version
```

## 卸载

```bash
npm uninstall -g @imagifly/cli
rm -rf "$AGENT_SKILLS_DIR/imagifly" "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli" "$AGENT_SKILLS_DIR/en/imagifly" "$AGENT_SKILLS_DIR/zh/imagifly" "$AGENT_SKILLS_DIR/ja/imagifly"
```

如果还要清掉已保存的 token，先运行 `imagifly auth logout`，再执行 `npm uninstall`。不要用安装成功文案。

## 参考

不要把本节抄进成功回复。

- Node.js 18+。`--help` 和 `--version` 写到 stderr，退出码 0，没有 JSON。
- Access token 在 `~/.config/imagifly/config.json`（mode `600`）。`IMAGIFLY_API_KEY` 覆盖该文件；单次命令的 `--api-key` 覆盖两者。`imagifly auth status` 只打印 hint，不打印 token。
- `+me` 调用 `GET /api/v1/images/models`。成功时 stdout 是 `{ "ok": true, "imageModelCount": N, "models": ["..."] }`。退出码 `0` 表示成功。退出码 `3` 表示未登录或令牌被拒绝。
- 退出码：`0` 成功，`2` 参数错误，`3` 未授权，`4` API 或生成失败，`1` 意外失败。按 JSON 字段 `error` 判断。
- 生成和查询命令见已安装的 skill：`$AGENT_SKILLS_DIR/imagifly/SKILL.md`。

## 控制台

https://imagifly.net
