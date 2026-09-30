import { Block, Dimension, system, VanillaEntityIdentifier, Vector3 } from "@minecraft/server";
import { randomInteger } from "./utils/randomInteger";
import { MinecraftEntityTypes } from "@minecraft/vanilla-data";
import { log } from "./utils/log";

const PARTICLES_EMITTER_ENTITY_ID = "better_spawners:spawner_particles_emitter";
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
const DEFAULT_MIN_SPAWN_DELAY = 60;
const DEFAULT_MAX_SPAWN_DELAY = 60;
const DEFAULT_SPAWN_RANGE = 9;
const DEFAULT_SPAWN_COUNT = 2;
const DEFAULT_MAX_COUNT = 6;

export function spawnSpawnerParticles(dimension: Dimension, location: Vector3): void {
    dimension.spawnEntity(PARTICLES_EMITTER_ENTITY_ID as VanillaEntityIdentifier, {
        x: location.x + 0.5,
        y: location.y + 0.5,
        z: location.z + 0.5,
    });
}

function removeSpawnerParticles(dimension: Dimension, location: Vector3): void {
    const center = {
        x: location.x + 0.5,
        y: location.y + 0.5,
        z: location.z + 0.5,
    };
    for (const entity of dimension.getEntities({
        type: PARTICLES_EMITTER_ENTITY_ID,
        location: center,
        maxDistance: 0.75,
        closest: 1,
    })) {
        entity.remove();
    }
}

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

function spawnMobs(spawnerBlock: Block, mobId: string, spawnCount: number, maxCount: number, spawnRange: number) {
    const { dimension, location } = spawnerBlock;
    const nearby = dimension.getEntities({
        type: mobId,
        location: { x: location.x + 0.5, y: location.y + 0.5, z: location.z + 0.5 },
        maxDistance: spawnRange,
    });
    if (nearby.length >= maxCount) return;

    let canSpawn = maxCount - nearby.length;
    for (let i = 0; i < spawnCount && canSpawn > 0; i++) {
        const pos = {
            x: Math.floor(location.x + (Math.random() - Math.random()) * spawnRange),
            y: location.y + randomInteger(-1, 1),
            z: Math.floor(location.z + (Math.random() - Math.random()) * spawnRange),
        };
        const feet = dimension.getBlock(pos);
        const head = dimension.getBlock({ ...pos, y: pos.y + 1 });
        const below = dimension.getBlock({ ...pos, y: pos.y - 1 });
        if (!feet?.isAir || !head?.isAir || !below || below.isAir) continue;

        dimension.spawnEntity(mobId as VanillaEntityIdentifier, {
            x: pos.x + 0.5,
            y: pos.y,
            z: pos.z + 0.5,
        });
        canSpawn--;
    }
}
