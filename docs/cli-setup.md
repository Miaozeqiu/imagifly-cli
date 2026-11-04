# Imagifly CLI

Agent-first setup for the `imagifly` binary (`npm` package `@imagifly/cli`).

Stable URL: https://imagifly.net/cli/setup.md

The picker name is `imagifly`. This page installs the English skill.

Do these four steps. After `imagifly +me` exits 0, reply with only the success block in step 4. Do not translate it. Do not narrate the install.

## 1. Install the CLI

Node.js 18+.

```bash
npm install -g @imagifly/cli
```

## 2. Copy the skill

```bash
SKILL_SRC="$(npm root -g)/@imagifly/cli/skills/en/imagifly/SKILL.md"
mkdir -p "$AGENT_SKILLS_DIR/imagifly"
cp "$SKILL_SRC" "$AGENT_SKILLS_DIR/imagifly/SKILL.md"
rm -rf "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli" "$AGENT_SKILLS_DIR/en/imagifly" "$AGENT_SKILLS_DIR/zh/imagifly" "$AGENT_SKILLS_DIR/ja/imagifly"
```

Replace `$AGENT_SKILLS_DIR` with the directory this agent loads. The `rm` removes leftover folders from older installs. It does not remove the `imagifly` folder just copied.

`image generate`, `video generate`, `image get`, and `video get` live in that skill. Do not expand them in the success reply.

## 3. Sign in

```bash
imagifly auth login --agent Cursor
```

- Finish step 1 first. Do not pass `--key` or `--no-browser`. Run the command in the foreground so it opens the browser and waits until the user clicks Allow. Do not background it, and do not ask the user to run it in their own terminal.
- Replace `Cursor` with your agent name (`Claude Code`, `Codex`, …). Do not send a hostname.
- The Allow page shows the `--agent` name.
- As soon as it starts, tell the user the browser is open: sign in if asked, then click Allow. Do not ask them to paste a link, code, or token into the chat. Keep waiting until the command exits.
- Only if no browser window appears, send the `Open http...` link from stderr for them to open. Still do not ask them to paste anything back.
- The CLI writes the access token to `~/.config/imagifly/config.json`. Do not copy the token into the chat, logs, or the repo.
- Revoke agents at https://imagifly.net/developer.
- On failure, rerun the same command and give the user the error.

## 4. Verify

```bash
imagifly +me
```

Exit 0 means the login works. Reply with only this block:

> Imagifly CLI is installed and signed in. You can generate images and videos.
> Try one of these:
> Generate an image of a teahouse in the rain
> List the available image models
> Generate a 5-second short video with a video model
>
> Or just describe the image or video you want, and the Agent will handle it.

On login or `+me` failure, output only the exit code and the `error` and `message` from stdout.

Leave install narration, package audits, npm cache notes, model lists, file modes, and key-rotation advice out of that reply.

## Update

Upgrade the package, then copy this same English skill again. Leave the saved login in place. Do not use the install success block. `--version` prints on stderr. Tell the user that version in English.

```bash
npm install -g @imagifly/cli@latest
SKILL_SRC="$(npm root -g)/@imagifly/cli/skills/en/imagifly/SKILL.md"
mkdir -p "$AGENT_SKILLS_DIR/imagifly"
cp "$SKILL_SRC" "$AGENT_SKILLS_DIR/imagifly/SKILL.md"
rm -rf "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli" "$AGENT_SKILLS_DIR/en/imagifly" "$AGENT_SKILLS_DIR/zh/imagifly" "$AGENT_SKILLS_DIR/ja/imagifly"
imagifly --version
```

## Uninstall

```bash
npm uninstall -g @imagifly/cli
rm -rf "$AGENT_SKILLS_DIR/imagifly" "$AGENT_SKILLS_DIR/imagifly-zh" "$AGENT_SKILLS_DIR/imagifly-ja" "$AGENT_SKILLS_DIR/imagifly-cli" "$AGENT_SKILLS_DIR/en/imagifly" "$AGENT_SKILLS_DIR/zh/imagifly" "$AGENT_SKILLS_DIR/ja/imagifly"
```

To clear the saved token as well, run `imagifly auth logout` before `npm uninstall`. Do not use the install success block.

## Reference

Do not paste this section into the success reply.

- Node.js 18+. `--help` and `--version` go to stderr, exit 0, no JSON.
- The access token is in `~/.config/imagifly/config.json` (mode `600`). `IMAGIFLY_API_KEY` overrides that file. `--api-key` on one command overrides both. `imagifly auth status` prints a hint, not the token.
- `+me` calls `GET /api/v1/images/models`. Success stdout is `{ "ok": true, "imageModelCount": N, "models": ["..."] }`. Exit `0` is success. Exit `3` means signed out or the token was rejected.
- Exit codes: `0` success, `2` bad arguments, `3` unauthorized, `4` API or generation failure, `1` unexpected failure. Branch on the JSON field `error`.
- Generate and fetch commands are in the installed skill: `$AGENT_SKILLS_DIR/imagifly/SKILL.md`.

## Console

https://imagifly.net
