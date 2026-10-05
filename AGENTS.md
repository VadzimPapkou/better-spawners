# Project goal

Recreate [Apothic Spawners](https://www.curseforge.com/minecraft/mc-mods/apothic-spawners) logic on Minecraft Bedrock.

Keep the custom spawner as close to vanilla as possible: behavior, visuals, interactions — vanilla parity first, then Apothic upgrades/features on top.

# Agent checklist

After pack/script/content edits (BP/RP/JSON/TS):

1. If `npm run local-deploy -- --watch` is running — wait for `Waiting for new changes...` (see `.cursor/rules/build-watch.mdc`). Do not start the build yourself.
2. Reload — **once at the end** of your reply (when edits are ready), not after every file. In-world via Bedrock MCP: `/reload all` + `send_message` (`reload done`). Do not wait to be asked. Rule: `.cursor/rules/in-game-reload.mdc`.
3. If MCP/world is not connected — paste into chat:
    ```
    /connect localhost:8001/ws
    ```
    Do not send a fake «reload done».

# Minecraft script debug

Debug scripts via `scripts/utils/log.ts` (`log(...)`), **not** via `fetch`/HTTP ingest and not via ad-hoc `console.log` in new places.

`log` = `console.warn` → ContentLog line like:

```
12:40:01[Scripting][warning]-your message here
```

## Logs folder

```
%APPDATA%\Minecraft Bedrock\logs\
```

(= `C:\Users\<user>\AppData\Roaming\Minecraft Bedrock\logs\`)

Take the newest `ContentLogYYYY-MM-DD_HH-MM-SS_*.txt` (by `LastWriteTime`).

The file is often **locked** by the Minecraft process: plain `ReadAllBytes` / sometimes `Select-String` fail or return stale data. Read via shared-read copy (`File.Open(..., Read, ReadWrite)` → temp), then grep the copy. That is a snapshot at copy time, not a live stream — after repro, copy again.

**Do not raw-`Tail` the file** — the tail is flooded with `[Sound][verbose]` (fly etc.), which are not shown on the in-game overlay. For script debug, filter `[Scripting][warning]` (what `log()` produces / same as the content log overlay in-game).

## How to debug

1. Insert `log("[tag] ...", values)` around hypotheses (early returns, setType, consume item).
2. Wait for watch (`build-watch.mdc`), then `/reload all` (`in-game-reload.mdc`).
3. Reproduce the bug in-world.
4. Copy the fresh ContentLog via shared-read, take the latest `[Scripting][warning]` / `[dbg-…]` lines.
5. Confirm/refute hypotheses from the logs, then fix.

Rule duplicate: `.cursor/rules/minecraft-debug.mdc`.
