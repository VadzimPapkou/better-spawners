# Цель проекта

Воссоздать логику [Apothic Spawners](https://www.curseforge.com/minecraft/mc-mods/apothic-spawners) на Minecraft Bedrock.

Кастомный спавнер делать как можно ближе к ванильному: поведение, визуал, интеракции — сначала ванильный паритет, потом апгрейды/фичи Apothic поверх него.

# Agent checklist

После правок pack/script/content (BP/RP/JSON/TS):

1. Если крутится `npm run local-deploy -- --watch` — дождись `Waiting for new changes...` (см. `.cursor/rules/build-watch.mdc`). Не запускай билд сам.
2. Релоад — **1 раз в конце** своего ответа (когда правки готовы), не после каждого файла. В мире через Bedrock MCP: `/reload all` + `send_message` (`релоад сделан`). Не ждать пока попросят. Правило: `.cursor/rules/in-game-reload.mdc`.
3. Если MCP/мир не подключен — кинуть в чат:
    ```
    /connect localhost:8001/ws
    ```
    Не писать фейковый «reload done».

Дебаг скриптов — `.cursor/rules/minecraft-debug.mdc` (`log(...)` + ContentLog shared-read).
