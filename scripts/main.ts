import { initBetterSpawner } from "./better-spawner/better-spawner";
import { initBetterSpawnerModifications } from "./better-spawner/better-spawner-modifications";
import { initOnPlayerBreakSpawner } from "./vanilla-spawner/on-player-break-spawner";
import { initOnPlayerInteractWithSpawner } from "./vanilla-spawner/on-player-interact-with-spawner";
import { initOnSpawnerSpawnEntity } from "./vanilla-spawner/on-spawner-spawn-entity";

initOnPlayerBreakSpawner();
initOnPlayerInteractWithSpawner();
initOnSpawnerSpawnEntity();
initBetterSpawner();
initBetterSpawnerModifications();
