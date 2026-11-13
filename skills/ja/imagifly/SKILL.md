---
name: imagifly
description: imagifly コマンドラインで画像と動画を生成する。
---

# Imagifly

`imagifly` をシェルから呼び出して画像と動画を生成する。標準出力は JSON オブジェクトひとつ。進捗とヘルプは stderr。日本語で返信する。コマンド名、フラグ、JSON のキーは英語のままにする。

ピッカーの名前は `imagifly`。これは日本語のスキル。`$AGENT_SKILLS_DIR/imagifly/SKILL.md` にコピーする。手順: https://imagifly.net/cli/setup.ja.md

## インストール

Node.js 18+。

```bash
npm install -g @imagifly/cli
SKILL_SRC="$(npm root -g)/@imagifly/cli/skills/ja/imagifly/SKILL.md"
mkdir -p "$AGENT_SKILLS_DIR/imagifly"
cp "$SKILL_SRC" "$AGENT_SKILLS_DIR/imagifly/SKILL.md"
rm -rf "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli" "$AGENT_SKILLS_DIR/en/imagifly" "$AGENT_SKILLS_DIR/zh/imagifly" "$AGENT_SKILLS_DIR/ja/imagifly"
imagifly --version
```

npm パッケージは `@imagifly/cli`。コマンドは `imagifly`。このファイルは `skills/ja/imagifly/SKILL.md`。手順: https://imagifly.net/cli/setup.ja.md

`$AGENT_SKILLS_DIR` は、この Agent がスキルを読むディレクトリに置き換える。上の `rm` は古いインストールの残りを消し、今コピーした `imagifly` は消さない。

ユーザーが CLI のインストールか設定だけを頼んだときは、そのガイドに従う。`imagifly +me` の終了コードが 0 なら、「確認」の日本語の文面だけを返す。翻訳しない。インストール経過は書かない。アップグレードと削除は「更新」か「アンインストール」を使い、インストール成功の文面は使わない。

## 更新

グローバルパッケージを上げ、この日本語スキルで `$AGENT_SKILLS_DIR/imagifly/SKILL.md` を上書きし、残っている古いディレクトリを消す。`$AGENT_SKILLS_DIR` はこの Agent のスキルディレクトリ。保存済みのログインはそのままにする。

```bash
npm install -g @imagifly/cli@latest
SKILL_SRC="$(npm root -g)/@imagifly/cli/skills/ja/imagifly/SKILL.md"
mkdir -p "$AGENT_SKILLS_DIR/imagifly"
cp "$SKILL_SRC" "$AGENT_SKILLS_DIR/imagifly/SKILL.md"
rm -rf "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli" "$AGENT_SKILLS_DIR/en/imagifly" "$AGENT_SKILLS_DIR/zh/imagifly" "$AGENT_SKILLS_DIR/ja/imagifly"
imagifly --version
```

`--version` は stderr に出る。そのバージョンを日本語で伝える。インストール成功の文面は使わない。

## アンインストール

グローバルパッケージと、インストール先の `$AGENT_SKILLS_DIR/imagifly`、および残っている `imagifly-zh`、`imagifly-ja`、`imagifly-cli` を消す。`$AGENT_SKILLS_DIR` はインストール時と同じディレクトリ。

```bash
npm uninstall -g @imagifly/cli
rm -rf "$AGENT_SKILLS_DIR/imagifly" "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli" "$AGENT_SKILLS_DIR/en/imagifly" "$AGENT_SKILLS_DIR/zh/imagifly" "$AGENT_SKILLS_DIR/ja/imagifly"
```

保存したトークンも消すときは、`npm uninstall` の前に `imagifly auth logout` を実行する（アンインストール後は `imagifly` コマンドが無くなる）。インストール成功の文面は使わない。

## ログイン

ログインはフォアグラウンドで実行する。コマンドがブラウザを開く。ユーザーには許可のクリックだけを伝え、コマンドが終わるまで待つ。

```bash
imagifly auth login --agent Cursor
imagifly auth status
```

- `Cursor` は自分の Agent 名（`Claude Code`、`Codex` など）に置き換える。ホスト名は送らない。
- `--key` と `--no-browser` は渡さない。バックグラウンドにしない。ユーザー自身の端末で実行させない。
- 許可ページには `--agent` の名前が表示される。ログインは Imagifly をポーリングし、対話端末は不要。
- 開始したらすぐ伝える：ブラウザが開いたので、必要ならサインインし、「許可」だけをクリックする。会話にリンク、確認コード、デバイスコード、トークンを貼らせない。コマンドが終わるまで待ち続ける。
- ブラウザが開かなかったときだけ、stderr の `Open http...` を開いてもらう。その場合も、内容を貼り戻させない。
- コマンドの `--api-key` は `IMAGIFLY_API_KEY` より優先され、後者は `~/.config/imagifly/config.json` より優先される。
- 設定ファイルのモードは `600`。アクセストークンをリポジトリ、会話、ログにコピーしない。
- `auth status` は `source` と `keyHint` を返す。`authenticated: false` でも終了コードは 0。
- 認可済み Agent は https://imagifly.net/developer で取り消せる。

## 確認

```bash
imagifly +me
```

`+me` はヘルスチェック（画像モデル数）。終了コード 0 はトークンが有効。終了コード 3 はトークンが無い、または拒否された。

ユーザーが https://imagifly.net/cli/setup.ja.md のインストールか設定だけを頼み、`+me` が 0 で終わったときは、下の文面だけを原文のまま返す。翻訳しない。インストール経過は書かない。

> Imagifly CLI のインストールとログインが完了しました。画像と動画を生成できます。
> 次のような指示を試してみてください：
> 雨の日の茶館の画像を生成して
> 使える画像モデルを一覧して
> 動画モデルで 5 秒の短い動画を生成して
>
> 作りたい画像や動画をそのまま説明しても、Agent が対応します。

ログインまたは確認が失敗したときは、失敗情報だけを出す（終了コードと `error` と `message`）。説明は足さない。

成功の返信に書かないもの: インストール経過、tarball やインストールスクリプトの監査、npm キャッシュ、モデル一覧、ファイルモード、キーローテーション。モデルを出すのは、ユーザーが生成または一覧を頼んだときだけ。生成の前に `imagifly models image` または `imagifly models video` を実行し、JSON から id を読む。価格と許される長さは変わる。

## コマンド

| コマンド | いつ |
| --- | --- |
| `imagifly auth login --agent <name>` | ブラウザを開き、許可を待つ |
| `imagifly auth logout` | 保存したトークンを消す。環境変数は残ることがある（`envStillSet`） |
| `imagifly auth status` | どの認証情報が有効かを見る |
| `imagifly +me` | ログイン済みのヘルスチェック |
| `imagifly credits` | 現在のクレジット残高。`credits` を読む |
| `imagifly models image` | `GET /api/v1/images/models` |
| `imagifly models video` | `GET /api/v1/videos/models`（キー不要） |
| `imagifly image generate --prompt "..." --model <id> [--ratio 16:9] [--quality high] [--resolution-tier 1k] [--steps 20] [--reference file.png] [--wait] [--poll-interval 3] [--timeout 180] [--out file]` | 画像を送る。`--wait` は `GET /images/generations/{id}` をポーリングする |
| `imagifly image history [--limit 20]` | 最近の画像生成。各項目に `cost` と `imageUrls` がある |
| `imagifly image get --id gen_... [--out file]` | 画像タスクを読む。`status` が `success` のとき `--out` は最初の `imageUrl` を保存する。`generation.cost` はこのタスクの消費クレジット |
| `imagifly video generate --prompt "..." --model <id> [--variant 2.5] [--workflow-format t2v] [--duration 5s] [--fps 24] [--size 1280x720] [--ratio 16:9] [--wait] [--poll-interval 5] [--timeout 900] [--out file]` | 動画を送る。長さはそのモデルの `durationOptions` と一致させる |
| `imagifly video get --id vid_... [--out file]` | 動画タスクを読み、必要なら最初の `videoUrl` を保存する |

`--poll-interval` は 2 秒から 5 秒。`generate` の `--out` には `--wait` が必要。保存先の絶対パスは JSON の `outputPath`。

画像の参照はファイル（または `data:` URL）で、`{ "base64": "..." }` として送る。動画の参照 URL は文字列の配列。ローカルの先頭・末尾フレーム（`--first-frame`、`--last-frame`）はそのリクエストを multipart にする。

## JSON と終了コード

stdout だけをパースする。コマンドが失敗し stdout が空のとき以外、stderr は無視する。

| 終了コード | 意味 |
| --- | --- |
| 0 | 成功。`image get` / `video get` は `generating` でも終了コード 0 |
| 2 | 引数が不正（`BAD_ARGS`） |
| 3 | 未認可。ログインを直し、同じリクエストをそのまま再送しない |
| 4 | リクエスト拒否、生成失敗、ポーリングのタイムアウト、またはダウンロード失敗 |
| 1 | 予期しない失敗、またはネットワーク失敗 |

成功:

```json
{"ok":true,"generation":{"id":"gen_...","status":"success","imageUrls":["https://..."]},"outputPath":"/abs/tea.png"}
```

Imagifly が封筒を返した失敗は、その形のまま:

```json
{"ok":false,"error":"NOT_ENOUGH_CREDITS","message":"Not enough credits: this generation costs 12."}
```

分岐は `error` で行い、`message` では行わない。`--wait` のあとタスクが `failed` なら終了コード 4、`error` は `"GENERATION_FAILED"`、`generation` オブジェクトが付く。失敗したタスクのクレジットは API が返す。再試行用のエンドポイントを作らない。

## クレジット

`imagifly credits` で現在の残高を見る。送信、`image get`、`video get`、`image history` の `generation.cost` はそのタスクで消費したクレジット。失敗したタスクは返金される。

`POST` が `202` を返した時点でクレジットは予約済み。プロセスがタスク完了前に止まったら、同じ id を `image get` または `video get` で見る。再送してよいのは、直前の送信が拒否された（id が無い）か、タスクの状態が `failed` のときだけ。

`400`、`401`、`402`、`404` をそのまま再試行しない。`429` と `5xx` はバックオフして再試行できる。最初の生成を「確認」するためだけに、二度目の生成を送らない。

## 言語

ユーザーへの文は日本語で書く。CLI 自身の JSON、コマンド名、フラグは英語のまま。インストール成功の返信は「確認」の文面だけを使い、翻訳しない。
