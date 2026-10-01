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

# Minecraft script debug

Дебаг скриптов — через `scripts/utils/log.ts` (`log(...)`), **не** через `fetch`/HTTP ingest и не через произвольный `console.log` в новых местах.

`log` = `console.warn` → в ContentLog строка вида:

```
12:40:01[Scripting][warning]-your message here
```

## Папка логов

```
%APPDATA%\Minecraft Bedrock\logs\
```

(= `C:\Users\<user>\AppData\Roaming\Minecraft Bedrock\logs\`)

Бери самый свежий `ContentLogYYYY-MM-DD_HH-MM-SS_*.txt` (по `LastWriteTime`).

Файл часто **залочен** процессом Minecraft: обычный `ReadAllBytes` / иногда `Select-String` падают или отдают устаревшее. Читай через shared-read copy (`File.Open(..., Read, ReadWrite)` → temp), потом grep по копии. Это снимок на момент копирования, не live-stream — после репро перечитай снова.

**Не бери сырой `Tail` файла** — хвост забит `[Sound][verbose]` (fly и т.п.), на экране в игре их нет. Для script debug фильтруй `[Scripting][warning]` (то что даёт `log()` / то же что content log overlay в игре).

## Как дебажить

1. Вставь `log("[tag] ...", values)` вокруг гипотез (ранние return, setType, consume item).
2. Дождись watch (`build-watch.mdc`), сделай `/reload all` (`in-game-reload.mdc`).
3. Воспроизведи баг в мире.
4. Скопируй свежий ContentLog shared-read'ом, возьми последние строки с `[Scripting][warning]` / тегом `[dbg-…]`.
5. По логам подтверди/опровергни гипотезы, потом фикси.

Дубликат правила: `.cursor/rules/minecraft-debug.mdc`.
