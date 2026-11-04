# Imagifly CLI

Agent-first setup for the `imagifly` binary (`npm` package `@imagifly/cli`).

Stable URL: https://imagifly.net/cli/setup.md

稳定地址：https://imagifly.net/cli/setup.md

安定したアドレス：https://imagifly.net/cli/setup.md

One skill. The picker name is `imagifly`. Copy that one file. Do not pick a locale folder.

只有一份 skill。选择器里的名字是 `imagifly`。只复制这一个文件，不要按语言另选目录。

スキルは一つ。ピッカーの名前は `imagifly`。このファイルだけをコピーする。言語ごとのディレクトリは選ばない。

## English

Do these four steps. After `imagifly +me` exits 0, reply with the one success block that matches how the user is writing. Do not narrate the install. Do not print more than one language.

### 1. Install the CLI

Node.js 18+.

```bash
npm install -g @imagifly/cli
```

### 2. Copy the skill

The skill in this package is `skills/imagifly/SKILL.md`. After a global install it is:

`$(npm root -g)/@imagifly/cli/skills/imagifly/SKILL.md`

Replace `$AGENT_SKILLS_DIR` with the directory this agent loads. The `rm` removes leftover folders from older installs (`imagifly-zh`, `imagifly-ja`, `imagifly-cli`, and `en/imagifly`, `zh/imagifly`, `ja/imagifly`). It does not remove the `imagifly` folder just copied.

```bash
SKILL_SRC="$(npm root -g)/@imagifly/cli/skills/imagifly/SKILL.md"
mkdir -p "$AGENT_SKILLS_DIR/imagifly"
cp "$SKILL_SRC" "$AGENT_SKILLS_DIR/imagifly/SKILL.md"
rm -rf "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli" "$AGENT_SKILLS_DIR/en/imagifly" "$AGENT_SKILLS_DIR/zh/imagifly" "$AGENT_SKILLS_DIR/ja/imagifly"
```

`image generate`, `video generate`, `image get`, and `video get` live in that skill. Do not expand them in the success reply.

### 3. Sign in

```bash
imagifly auth login --agent Cursor
```

- Finish step 1 first. Run this in a terminal. Do not pass `--key`.
- Replace `Cursor` with your agent name (`Claude Code`, `Codex`, …). Do not send a hostname.
- The authorize URL includes `agent=`. The user sees that name on the Allow page.
- Send the user the URL from stderr and ask them to sign in if needed, then click Allow. There is no device code.
- The CLI writes the access token to `~/.config/imagifly/config.json`. Do not copy the token into the chat, logs, or the repo.
- Revoke agents at https://imagifly.net/developer.
- On failure, rerun the same command and give the user the error.

### 4. Verify

```bash
imagifly +me
```

Exit 0 means the login works.

Reply with the one block that matches how the user is writing. Copy it as-is. Do not write a new translation.

- Chinese (Simplified or Traditional): the Simplified Chinese block.
- Japanese: the Japanese block.
- English, or any other language: the English block.

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

On login or `+me` failure, output only the exit code and the `error` and `message` from stdout.

Leave install narration, package audits, npm cache notes, model lists, file modes, and key-rotation advice out of that reply.

### Update

Upgrade the package, then copy the same skill file again. Leave the saved login in place. Do not use the install success block. `--version` prints on stderr. Tell the user that version, in the language they are writing.

```bash
npm install -g @imagifly/cli@latest
SKILL_SRC="$(npm root -g)/@imagifly/cli/skills/imagifly/SKILL.md"
mkdir -p "$AGENT_SKILLS_DIR/imagifly"
cp "$SKILL_SRC" "$AGENT_SKILLS_DIR/imagifly/SKILL.md"
rm -rf "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli" "$AGENT_SKILLS_DIR/en/imagifly" "$AGENT_SKILLS_DIR/zh/imagifly" "$AGENT_SKILLS_DIR/ja/imagifly"
imagifly --version
```

### Uninstall

```bash
npm uninstall -g @imagifly/cli
rm -rf "$AGENT_SKILLS_DIR/imagifly" "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli" "$AGENT_SKILLS_DIR/en/imagifly" "$AGENT_SKILLS_DIR/zh/imagifly" "$AGENT_SKILLS_DIR/ja/imagifly"
```

To clear the saved token as well, run `imagifly auth logout` before `npm uninstall`. Do not use the install success block.

## 简体中文

做完下面四步。`imagifly +me` 退出码为 0 之后，按用户正在写的语言回复对应的那一段成功文案。不要叙述安装过程，不要同时输出多种语言。

### 1. 安装 CLI

Node.js 18+。

```bash
npm install -g @imagifly/cli
```

### 2. 复制 skill

包内只有这一份：`skills/imagifly/SKILL.md`。全局安装后的路径是：

`$(npm root -g)/@imagifly/cli/skills/imagifly/SKILL.md`

把 `$AGENT_SKILLS_DIR` 换成当前 Agent 加载 skills 的目录。`rm` 删掉旧安装留下的 `imagifly-zh`、`imagifly-ja`、`imagifly-cli`，以及 `en/imagifly`、`zh/imagifly`、`ja/imagifly`。不会删掉刚复制的 `imagifly`。

```bash
SKILL_SRC="$(npm root -g)/@imagifly/cli/skills/imagifly/SKILL.md"
mkdir -p "$AGENT_SKILLS_DIR/imagifly"
cp "$SKILL_SRC" "$AGENT_SKILLS_DIR/imagifly/SKILL.md"
rm -rf "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli" "$AGENT_SKILLS_DIR/en/imagifly" "$AGENT_SKILLS_DIR/zh/imagifly" "$AGENT_SKILLS_DIR/ja/imagifly"
```

`image generate`、`video generate`、`image get`、`video get` 写在这份 skill 里。成功回复里不要展开这些命令。

### 3. 登录

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

### 4. 验证

```bash
imagifly +me
```

退出码 `0` 表示登录可用。

按用户正在写的语言，原文回复下面一段。不要另写翻译。

- 中文（简体或繁体）：用简体中文这一段。
- 日语：用日语这一段。
- 英语，或者其他语言：用英语这一段。

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

登录或 `+me` 失败时，只输出退出码，以及 stdout 里的 `error` 和 `message`。

成功回复里不要写安装过程、安装包审计、npm 缓存、模型清单、文件权限或 key 轮换。

### 更新

升级全局包，再把同一份 skill 复制一遍。已有登录不用重做。不要用安装成功文案。`--version` 写在 stderr。用用户正在写的语言告诉用户这个版本号。

```bash
npm install -g @imagifly/cli@latest
SKILL_SRC="$(npm root -g)/@imagifly/cli/skills/imagifly/SKILL.md"
mkdir -p "$AGENT_SKILLS_DIR/imagifly"
cp "$SKILL_SRC" "$AGENT_SKILLS_DIR/imagifly/SKILL.md"
rm -rf "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli" "$AGENT_SKILLS_DIR/en/imagifly" "$AGENT_SKILLS_DIR/zh/imagifly" "$AGENT_SKILLS_DIR/ja/imagifly"
imagifly --version
```

### 卸载

```bash
npm uninstall -g @imagifly/cli
rm -rf "$AGENT_SKILLS_DIR/imagifly" "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli" "$AGENT_SKILLS_DIR/en/imagifly" "$AGENT_SKILLS_DIR/zh/imagifly" "$AGENT_SKILLS_DIR/ja/imagifly"
```

如果还要清掉已保存的 token，先运行 `imagifly auth logout`，再执行 `npm uninstall`。不要用安装成功文案。

## 日本語

四つの手順を行う。`imagifly +me` の終了コードが 0 なら、ユーザーが書いている言語に合う成功文面を一つだけ返す。インストール経過は書かない。複数の言語を同時に出さない。

### 1. CLI をインストール

Node.js 18+。

```bash
npm install -g @imagifly/cli
```

### 2. skill をコピー

パッケージ内の skill は `skills/imagifly/SKILL.md` だけ。グローバルインストール後のパス:

`$(npm root -g)/@imagifly/cli/skills/imagifly/SKILL.md`

`$AGENT_SKILLS_DIR` は、この Agent がスキルを読むディレクトリに置き換える。`rm` は古いインストールの `imagifly-zh`、`imagifly-ja`、`imagifly-cli`、および `en/imagifly`、`zh/imagifly`、`ja/imagifly` を消す。今コピーした `imagifly` は消さない。

```bash
SKILL_SRC="$(npm root -g)/@imagifly/cli/skills/imagifly/SKILL.md"
mkdir -p "$AGENT_SKILLS_DIR/imagifly"
cp "$SKILL_SRC" "$AGENT_SKILLS_DIR/imagifly/SKILL.md"
rm -rf "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli" "$AGENT_SKILLS_DIR/en/imagifly" "$AGENT_SKILLS_DIR/zh/imagifly" "$AGENT_SKILLS_DIR/ja/imagifly"
```

`image generate`、`video generate`、`image get`、`video get` はこの skill に書いてある。成功の返信では展開しない。

### 3. ログイン

```bash
imagifly auth login --agent Cursor
```

- 先に手順 1 を終える。端末で実行する。`--key` は渡さない。
- `Cursor` は自分の Agent 名（`Claude Code`、`Codex` など）に置き換える。ホスト名は書かない。
- 認可 URL には `agent=` が付く。ユーザーは許可ページでその名前を見る。
- stderr の URL をユーザーに送り、必要ならサインインしてから「許可」だけをクリックしてもらう。入力するデバイスコードはない。
- CLI は access token を `~/.config/imagifly/config.json` に書く。トークンを会話、ログ、リポジトリにコピーしない。
- 認可済み Agent は https://imagifly.net/developer で取り消せる。
- 失敗したら同じコマンドを再実行し、エラーをユーザーに渡す。

### 4. 確認

```bash
imagifly +me
```

終了コード `0` はログインが使えること。

ユーザーが書いている言語に合う文面を、原文のまま一つ返す。新しい翻訳は書かない。

- 中国語（簡体字・繁体字）: 簡体字の文面。
- 日本語: 日本語の文面。
- 英語、およびそれ以外: 英語の文面。

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

ログインまたは `+me` が失敗したときは、終了コードと stdout の `error` と `message` だけを出す。

成功の返信に、インストール経過、パッケージの監査、npm キャッシュ、モデル一覧、ファイルモード、キーのローテーションは書かない。

### 更新

パッケージを上げ、同じ skill ファイルをもう一度コピーする。保存済みのログインはそのまま。インストール成功の文面は使わない。`--version` は stderr。そのバージョンを、ユーザーが書いている言語で伝える。

```bash
npm install -g @imagifly/cli@latest
SKILL_SRC="$(npm root -g)/@imagifly/cli/skills/imagifly/SKILL.md"
mkdir -p "$AGENT_SKILLS_DIR/imagifly"
cp "$SKILL_SRC" "$AGENT_SKILLS_DIR/imagifly/SKILL.md"
rm -rf "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli" "$AGENT_SKILLS_DIR/en/imagifly" "$AGENT_SKILLS_DIR/zh/imagifly" "$AGENT_SKILLS_DIR/ja/imagifly"
imagifly --version
```

### アンインストール

```bash
npm uninstall -g @imagifly/cli
rm -rf "$AGENT_SKILLS_DIR/imagifly" "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli" "$AGENT_SKILLS_DIR/en/imagifly" "$AGENT_SKILLS_DIR/zh/imagifly" "$AGENT_SKILLS_DIR/ja/imagifly"
```

保存したトークンも消すときは、`npm uninstall` の前に `imagifly auth logout` を実行する。インストール成功の文面は使わない。

## Reference

Do not paste this section into the success reply. 不要把本节抄进成功回复。成功の返信にこの節を貼らない。

- Node.js 18+. `--help` and `--version` go to stderr, exit 0, no JSON.
- The access token is in `~/.config/imagifly/config.json` (mode `600`). `IMAGIFLY_API_KEY` overrides that file. `--api-key` on one command overrides both. `imagifly auth status` prints a hint, not the token.
- `+me` calls `GET /api/v1/images/models`. Success stdout is `{ "ok": true, "imageModelCount": N, "models": ["..."] }`. Exit `0` is success. Exit `3` means signed out or the token was rejected.
- Exit codes: `0` success, `2` bad arguments, `3` unauthorized, `4` API or generation failure, `1` unexpected failure. Branch on the JSON field `error`.
- Generate and fetch commands are in the installed skill: `$AGENT_SKILLS_DIR/imagifly/SKILL.md`.

## Console

https://imagifly.net
