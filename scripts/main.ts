import { initBetterSpawner } from "./better-spawner";
import { initOnPlayerBreakSpawner } from "./events/on-player-break-spawner";
import { initOnPlayerInteractWithSpawner } from "./events/on-player-interact-with-spawner";
import { initOnSpawnerSpawnEntity } from "./events/on-spawner-spawn-entity";

initOnPlayerBreakSpawner();
initOnPlayerInteractWithSpawner();
initOnSpawnerSpawnEntity();
initBetterSpawner();
