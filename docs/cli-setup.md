# Imagifly CLI setup

One path from an empty shell to a verified Imagifly call. The binary is `imagifly`. The npm package is `@imagifly/cli`.

从空环境到完成一次校验：命令名是 `imagifly`，npm 包名是 `@imagifly/cli`。

## 1. Install

Node.js 18+.

```bash
npm install -g @imagifly/cli
imagifly --version
```

Help text is on stderr. `--help` and `--version` exit 0 and do not print JSON.

## 2. Auth

Create a key in the Imagifly API console. It looks like `imf_...`.

```bash
imagifly auth login --key imf_your_key_here
imagifly auth status
```

The key is stored in `~/.config/imagifly/config.json` with mode `600`. `IMAGIFLY_API_KEY` overrides that file. `--api-key` overrides both for a single command. `auth status` prints a hint, not the key.

Agents should pass `--key`. Without it, `auth login` reads one line from stdin and, on a terminal, prompts once.

## 3. Verify

```bash
imagifly +me
imagifly models image
imagifly models video
```

`+me` calls `GET /api/v1/images/models` and prints `{ "ok": true, "imageModelCount": N, "models": ["..."] }`. Exit 0 means the key works. Exit 3 means the key is missing or rejected. `models video` is public and works without a key.

## 4. Generate

List models first and copy an id. Do not hard-code prices.

```bash
imagifly image generate \
  --model gpt-image-2 \
  --prompt "A quiet tea shop on a rainy street" \
  --ratio 16:9 \
  --wait \
  --out ./tea.png
```

```bash
imagifly video generate \
  --model MiniMax-H3 \
  --prompt "A paper boat on a rain-soaked street" \
  --duration 5s \
  --ratio 16:9 \
  --wait \
  --out ./boat.mp4
```

`--duration` must be one of that model's `durationOptions` (often `5s`, not `5`). Poll interval is 2–5 seconds.

Stdout is one JSON object. On success with `--out`, read `outputPath` and use the local file. A failed task is exit 4 with `error: "GENERATION_FAILED"`. If a submit was accepted and the wait was interrupted, poll the same id:

```bash
imagifly image get --id gen_... --out ./tea.png
imagifly video get --id vid_... --out ./boat.mp4
```

## Exit codes

| Code | Meaning |
| --- | --- |
| 0 | Success |
| 2 | Bad arguments |
| 3 | Unauthorized |
| 4 | API or generation error |
| 1 | Unexpected failure |

Branch on the JSON field `error`, not on the wording of `message`.
