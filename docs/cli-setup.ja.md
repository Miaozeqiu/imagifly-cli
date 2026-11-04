# Imagifly CLI

`imagifly` コマンドの Agent 向けセットアップ（npm パッケージ `@imagifly/cli`）。

安定したアドレス：https://imagifly.net/cli/setup.ja.md

ピッカーの名前は `imagifly`。このページは日本語のスキルをインストールする。

四つの手順を行う。`imagifly +me` の終了コードが 0 なら、手順 4 の文面だけを返す。翻訳しない。インストール経過は書かない。

## 1. CLI をインストール

Node.js 18+。

```bash
npm install -g @imagifly/cli
```

## 2. skill をコピー

```bash
SKILL_SRC="$(npm root -g)/@imagifly/cli/skills/ja/imagifly/SKILL.md"
mkdir -p "$AGENT_SKILLS_DIR/imagifly"
cp "$SKILL_SRC" "$AGENT_SKILLS_DIR/imagifly/SKILL.md"
rm -rf "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli" "$AGENT_SKILLS_DIR/en/imagifly" "$AGENT_SKILLS_DIR/zh/imagifly" "$AGENT_SKILLS_DIR/ja/imagifly"
```

`$AGENT_SKILLS_DIR` は、この Agent がスキルを読むディレクトリに置き換える。`rm` は古いインストールの残りを消し、今コピーした `imagifly` は消さない。

`image generate`、`video generate`、`image get`、`video get` はこの skill に書いてある。成功の返信では展開しない。

## 3. ログイン

```bash
imagifly auth login --agent Cursor
```

- 先に手順 1 を終える。`--key` と `--no-browser` は渡さない。フォアグラウンドで実行し、コマンド自身にブラウザを開かせ、許可が押されるまで待つ。バックグラウンドにしない。ユーザー自身の端末で実行させない。
- `Cursor` は自分の Agent 名（`Claude Code`、`Codex` など）に置き換える。ホスト名は書かない。
- 許可ページには `--agent` の名前が表示される。
- 開始したらすぐ伝える：ブラウザが開いたので、必要ならサインインし、「許可」だけをクリックする。会話にリンク、確認コード、デバイスコード、トークンを貼らせない。コマンドが終わるまで待ち続ける。
- ブラウザが開かなかったときだけ、stderr の `Open http...` を開いてもらう。その場合も、内容を貼り戻させない。
- CLI は access token を `~/.config/imagifly/config.json` に書く。トークンを会話、ログ、リポジトリにコピーしない。
- 認可済み Agent は https://imagifly.net/developer で取り消せる。
- 失敗したら同じコマンドを再実行し、エラーをユーザーに渡す。

## 4. 確認

```bash
imagifly +me
```

終了コード `0` はログインが使えること。この文面だけを返す：

> Imagifly CLI のインストールとログインが完了しました。画像と動画を生成できます。
> 次のような指示を試してみてください：
> 雨の日の茶館の画像を生成して
> 使える画像モデルを一覧して
> 動画モデルで 5 秒の短い動画を生成して
>
> 作りたい画像や動画をそのまま説明しても、Agent が対応します。

ログインまたは `+me` が失敗したときは、終了コードと stdout の `error` と `message` だけを出す。

成功の返信に、インストール経過、パッケージの監査、npm キャッシュ、モデル一覧、ファイルモード、キーのローテーションは書かない。

## 更新

パッケージを上げ、この日本語スキルをもう一度コピーする。保存済みのログインはそのまま。インストール成功の文面は使わない。`--version` は stderr。そのバージョンを日本語で伝える。

```bash
npm install -g @imagifly/cli@latest
SKILL_SRC="$(npm root -g)/@imagifly/cli/skills/ja/imagifly/SKILL.md"
mkdir -p "$AGENT_SKILLS_DIR/imagifly"
cp "$SKILL_SRC" "$AGENT_SKILLS_DIR/imagifly/SKILL.md"
rm -rf "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli" "$AGENT_SKILLS_DIR/en/imagifly" "$AGENT_SKILLS_DIR/zh/imagifly" "$AGENT_SKILLS_DIR/ja/imagifly"
imagifly --version
```

## アンインストール

```bash
npm uninstall -g @imagifly/cli
rm -rf "$AGENT_SKILLS_DIR/imagifly" "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli" "$AGENT_SKILLS_DIR/en/imagifly" "$AGENT_SKILLS_DIR/zh/imagifly" "$AGENT_SKILLS_DIR/ja/imagifly"
```

保存したトークンも消すときは、`npm uninstall` の前に `imagifly auth logout` を実行する。インストール成功の文面は使わない。

## 参考

成功の返信にこの節を貼らない。

- Node.js 18+。`--help` と `--version` は stderr、終了コード 0、JSON はない。
- access token は `~/.config/imagifly/config.json`（mode `600`）。`IMAGIFLY_API_KEY` がそのファイルより優先され、コマンドの `--api-key` は両方より優先される。`imagifly auth status` は hint だけを出し、token は出さない。
- `+me` は `GET /api/v1/images/models` を呼ぶ。成功時の stdout は `{ "ok": true, "imageModelCount": N, "models": ["..."] }`。終了コード `0` は成功。終了コード `3` は未ログイン、またはトークンが拒否された。
- 終了コード：`0` 成功、`2` 引数エラー、`3` 未認可、`4` API または生成の失敗、`1` 予期しない失敗。JSON の `error` で分岐する。
- 生成と取得のコマンドはインストール済みスキルにある：`$AGENT_SKILLS_DIR/imagifly/SKILL.md`。

## コンソール

https://imagifly.net
