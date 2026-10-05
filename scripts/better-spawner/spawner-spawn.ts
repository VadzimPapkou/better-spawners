import { Block, Dimension, Vector3 } from "@minecraft/server";
import { randomInteger } from "../utils/random-integer";

/** Vanilla Bedrock spawn FX (resource_pack/particles/mob_block_spawn.json). Classic mob_spawner has no spawn sound. */
const SPAWN_FLAME_PARTICLE = "minecraft:basic_flame_particle";
const SPAWN_SMOKE_PARTICLE = "minecraft:basic_smoke_particle";
/** White poof on the mob — vanilla emitter already fires 20 particles. */
const MOB_SPAWN_EMITTER = "minecraft:mob_block_spawn_emitter";
const SPAWNER_SPAWN_FLAME_COUNT = 20;
const SPAWNER_NW_SMOKE_COUNT = 20;

/**
 * Bedrock mob_spawner on successful spawn (per mob):
 * - burst of basic_flame_particle around the spawner
 * - basic_smoke_particle from the northwest corner of the block
 * - minecraft:mob_block_spawn_emitter at the mob (white poofs; vanilla num_particles: 20)
 */
function playVanillaSpawnerSpawnFx(dimension: Dimension, spawnerLocation: Vector3, mobLocation: Vector3): void {
    const spawnerCenter = {
        x: spawnerLocation.x + 0.5,
        y: spawnerLocation.y + 0.5,
        z: spawnerLocation.z + 0.5,
    };

    for (let i = 0; i < SPAWNER_SPAWN_FLAME_COUNT; i++) {
        dimension.spawnParticle(SPAWN_FLAME_PARTICLE, {
            x: spawnerCenter.x + Math.random() - 0.5,
            y: spawnerCenter.y + Math.random() - 0.5,
            z: spawnerCenter.z + Math.random() - 0.5,
        });
    }

    for (let i = 0; i < SPAWNER_NW_SMOKE_COUNT; i++) {
        dimension.spawnParticle(SPAWN_SMOKE_PARTICLE, {
            x: spawnerLocation.x + Math.random() * 0.25,
            y: spawnerLocation.y + Math.random(),
            z: spawnerLocation.z + Math.random() * 0.25,
        });
    }

    dimension.spawnParticle(MOB_SPAWN_EMITTER, mobLocation);
}

/** Vanilla MaxNearbyEntities box: (SpawnRange*2+1) × (SpawnRange*2+1) × 8, centered on the spawner block. */
function countNearbySameType(dimension: Dimension, location: Vector3, mobId: string, spawnRange: number): number {
    const sizeXZ = spawnRange * 2 + 1;
    const sizeY = 8;
    return dimension.getEntities({
        type: mobId,
        location: {
            x: location.x - spawnRange,
            y: location.y - 3.5,
            z: location.z - spawnRange,
        },
        volume: { x: sizeXZ, y: sizeY, z: sizeXZ },
    }).length;
}

// #region Light levels
/**
 * Bedrock vanilla `minecraft:brightness_filter` from spawn_rules.
 * Missing id → default hostile `{ max: 7 }`.
 */
type MobLightRange = { min?: number; max?: number };

const LIGHT_HOSTILE: MobLightRange = { max: 7 };
const LIGHT_ANIMAL: MobLightRange = { min: 7 };
const LIGHT_ANY: MobLightRange = {};

const ANIMALS = [
    "cow",
    "chicken",
    "pig",
    "sheep",
    "rabbit",
    "horse",
    "donkey",
    "mule",
    "llama",
    "trader_llama",
    "wolf",
    "ocelot",
    "cat",
    "fox",
    "panda",
    "parrot",
    "polar_bear",
    "goat",
    "turtle",
    "bee",
    "armadillo",
    "camel",
    "sniffer",
    "frog",
];

const ANY_LIGHT = [
    "blaze",
    "magma_cube",
    "slime",
    "ghast",
    "piglin",
    "piglin_brute",
    "hoglin",
    "strider",
    "silverfish",
    "endermite",
    "shulker",
    "guardian",
    "elder_guardian",
    "squid",
    "glow_squid",
    "dolphin",
    "axolotl",
    "cod",
    "salmon",
    "tropicalfish",
    "pufferfish",
    "tadpole",
];

const MOB_LIGHT_LEVELS: Record<string, MobLightRange> = {
    "minecraft:bat": { max: 4 },
    "minecraft:zombie_pigman": { max: 11 },
    "minecraft:mooshroom": { min: 9 },
};
for (const id of ANIMALS) MOB_LIGHT_LEVELS[`minecraft:${id}`] = LIGHT_ANIMAL;
for (const id of ANY_LIGHT) MOB_LIGHT_LEVELS[`minecraft:${id}`] = LIGHT_ANY;
// #endregion

function passesLightCheck(mobId: string, lightLevel: number): boolean {
    const range = MOB_LIGHT_LEVELS[mobId] ?? LIGHT_HOSTILE;
    if (range.min !== undefined && lightLevel < range.min) return false;
    if (range.max !== undefined && lightLevel > range.max) return false;
    return true;
}

export function spawnMobs(
    spawnerBlock: Block,
    mobId: string,
    spawnCount: number,
    maxCount: number,
    spawnRange: number,
    ignoresLight = false
): void {
    const { dimension, location } = spawnerBlock;
    const nearbyCount = countNearbySameType(dimension, location, mobId, spawnRange);
    if (nearbyCount >= maxCount) return;

    let canSpawn = maxCount - nearbyCount;
    for (let i = 0; i < spawnCount && canSpawn > 0; i++) {
        const pos = {
            x: Math.floor(location.x + (Math.random() - Math.random()) * spawnRange),
            y: location.y + randomInteger(-1, 1),
            z: Math.floor(location.z + (Math.random() - Math.random()) * spawnRange),
        };
        const feet = dimension.getBlock(pos);
        const head = dimension.getBlock({ ...pos, y: pos.y + 1 });
        if (!feet?.isAir || !head?.isAir) continue;
        if (!ignoresLight && !passesLightCheck(mobId, feet.getLightLevel())) continue;

        const mobLocation = {
            x: pos.x + 0.5,
            y: pos.y,
            z: pos.z + 0.5,
        };
        dimension.spawnEntity(mobId, mobLocation);
        playVanillaSpawnerSpawnFx(dimension, location, mobLocation);
        canSpawn--;
    }
}
