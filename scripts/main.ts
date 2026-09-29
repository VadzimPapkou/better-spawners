import { initSpawnerParticles } from "./spawner-particles";
import { initOnPlayerBreakSpawner } from "./events/on-player-break-spawner";
import { initOnSpawnerSpawnEntity } from "./events/on-spawner-spawn-entity";

initOnPlayerBreakSpawner();
initOnSpawnerSpawnEntity();
initSpawnerParticles();
