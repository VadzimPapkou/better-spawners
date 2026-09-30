import { system } from "@minecraft/server";
import { MinecraftEntityTypes } from "@minecraft/vanilla-data";
import { randomInteger } from "./utils/randomInteger";
import { removeSpawnerParticles, spawnMobs, spawnSpawnerParticles } from "./better-spawner-utils";

const PARTICLES_COMPONENT_ID = "better_spawners:spawner_particles";
const BETTER_SPAWNER_DP = {
    MIN_SPAWN_DELAY: "min_spawn_delay",
    MAX_SPAWN_DELAY: "max_spawn_delay",
    SPAWN_COUNT: "spawn_count",
    MAX_COUNT: "max_count",
    BEFORE_NEXT_SPAWN_TICKS: "before_next_spawn_countdown",
    SPAWN_RANGE: "spawn_range",
    MOB_ID: "mob_id",
};
const TICKS_PER_BETTER_SPAWNER_TICK = 20;
const DEFAULT_MIN_SPAWN_DELAY = 1000;
const DEFAULT_MAX_SPAWN_DELAY = 1000;
const DEFAULT_SPAWN_RANGE = 4;
const DEFAULT_SPAWN_COUNT = 4;
const DEFAULT_MAX_COUNT = 6;

export function initBetterSpawner(): void {
    system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
        blockComponentRegistry.registerCustomComponent(PARTICLES_COMPONENT_ID, {
            onPlace: (event) => {
                spawnSpawnerParticles(event.dimension, event.block.location);
            },
            onBreak: (event) => {
                removeSpawnerParticles(event.dimension, event.block.location);
            },
            onTick: (event) => {
                const blockDp = event.block.getComponent("minecraft:dynamic_properties");
                if (!blockDp) {
                    return console.error("No minecraft:dynamic_properties component found");
                }

                const spawnerBlock = event.block;
                const center = {
                    x: spawnerBlock.location.x + 0.5,
                    y: spawnerBlock.location.y + 0.5,
                    z: spawnerBlock.location.z + 0.5,
                };
                const players = spawnerBlock.dimension.getPlayers({ location: center, maxDistance: 16 });
                if (players.length === 0) return;

                const minSpawnDelay = Number(blockDp.get(BETTER_SPAWNER_DP.MIN_SPAWN_DELAY)) || DEFAULT_MIN_SPAWN_DELAY;
                const maxSpawnDelay = Number(blockDp.get(BETTER_SPAWNER_DP.MAX_SPAWN_DELAY)) || DEFAULT_MAX_SPAWN_DELAY;
                const spawnCount = Number(blockDp.get(BETTER_SPAWNER_DP.SPAWN_COUNT)) || DEFAULT_SPAWN_COUNT;
                const maxCount = Number(blockDp.get(BETTER_SPAWNER_DP.MAX_COUNT)) || DEFAULT_MAX_COUNT;
                const spawnRange = Number(blockDp.get(BETTER_SPAWNER_DP.SPAWN_RANGE)) || DEFAULT_SPAWN_RANGE;
                const beforeNextSpawnTicksDp = Number(blockDp.get(BETTER_SPAWNER_DP.BEFORE_NEXT_SPAWN_TICKS));
                const mobId = String(blockDp.get(BETTER_SPAWNER_DP.MOB_ID) || MinecraftEntityTypes.Zombie);

                const beforeNextSpawnTicks = beforeNextSpawnTicksDp
                    ? beforeNextSpawnTicksDp - TICKS_PER_BETTER_SPAWNER_TICK
                    : 0;
                if (beforeNextSpawnTicks <= 0) {
                    spawnMobs(event.block, mobId, spawnCount, maxCount, spawnRange);
                    blockDp.set(BETTER_SPAWNER_DP.BEFORE_NEXT_SPAWN_TICKS, randomInteger(minSpawnDelay, maxSpawnDelay));
                } else {
                    blockDp.set(
                        BETTER_SPAWNER_DP.BEFORE_NEXT_SPAWN_TICKS,
                        beforeNextSpawnTicks - TICKS_PER_BETTER_SPAWNER_TICK
                    );
                }
            },
        });
    });
}
