import { initBetterSpawner } from "./better-spawner/better-spawner";
import { initBetterSpawnerModifications } from "./better-spawner/better-spawner-modifications";
import { initGuideBook } from "./guide/init-guide-book";
import { initOnPlayerBreakSpawner } from "./vanilla-spawner/on-player-break-spawner";
import { initOnSpawnerSpawnEntity } from "./vanilla-spawner/on-spawner-spawn-entity";

initOnPlayerBreakSpawner();
initOnSpawnerSpawnEntity();
initBetterSpawner();
initBetterSpawnerModifications();
initGuideBook();
