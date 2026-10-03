import { Block, BlockComponentTypes, Dimension, ItemStack, Vector3 } from "@minecraft/server";
import { randomInteger } from "../utils/random-integer";

const PARTICLES_EMITTER_ENTITY_ID = "better_spawners:spawner_particles_emitter";

/** Vanilla Bedrock spawn FX (resource_pack/particles/mob_block_spawn.json). Classic mob_spawner has no spawn sound. */
const SPAWN_FLAME_PARTICLE = "minecraft:basic_flame_particle";
const SPAWN_SMOKE_PARTICLE = "minecraft:basic_smoke_particle";
/** White poof on the mob — vanilla emitter already fires 20 particles. */
const MOB_SPAWN_EMITTER = "minecraft:mob_block_spawn_emitter";
const SPAWNER_SPAWN_FLAME_COUNT = 20;
const SPAWNER_NW_SMOKE_COUNT = 20;

export function spawnSpawnerParticles(dimension: Dimension, location: Vector3): void {
    dimension.spawnEntity(PARTICLES_EMITTER_ENTITY_ID, {
        x: location.x + 0.5,
        y: location.y + 0.5,
        z: location.z + 0.5,
    });
}

export function removeSpawnerParticles(dimension: Dimension, location: Vector3): void {
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
    spawnRange: number
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
        if (!passesLightCheck(mobId, feet.getLightLevel())) continue;

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

export type BetterSpawnerStats = {
    mobId: string | undefined;
    minSpawnDelay: number;
    maxSpawnDelay: number;
    spawnCount: number;
    maxCount: number;
    requiredPlayerRange: number;
    spawnRange: number;
    beforeNextSpawnTicks: number;
};

export type BetterSpawnerStatsKey = keyof BetterSpawnerStats;

/** Storage ids for block dynamic properties (must match BP). */
export const BETTER_SPAWNER_STATS = {
    mobId: "mob_id",
    minSpawnDelay: "min_spawn_delay",
    maxSpawnDelay: "max_spawn_delay",
    spawnCount: "spawn_count",
    maxCount: "max_count",
    requiredPlayerRange: "required_player_range",
    spawnRange: "spawn_range",
    beforeNextSpawnTicks: "before_next_spawn_countdown",
} as const satisfies Record<BetterSpawnerStatsKey, string>;

export function getBetterSpawnerStats(block: Block): BetterSpawnerStats;
export function getBetterSpawnerStats<K extends BetterSpawnerStatsKey>(
    block: Block,
    ...keys: K[]
): Pick<BetterSpawnerStats, K>;
export function getBetterSpawnerStats(block: Block, ...keys: BetterSpawnerStatsKey[]) {
    const blockDp = block.getComponent(BlockComponentTypes.DynamicProperties);
    if (!blockDp) {
        console.error("No minecraft:dynamic_properties component found");
    }

    const all: BetterSpawnerStats = {
        minSpawnDelay: readNumberDp(blockDp?.get(BETTER_SPAWNER_STATS.minSpawnDelay), DEFAULT_MIN_SPAWN_DELAY),
        maxSpawnDelay: readNumberDp(blockDp?.get(BETTER_SPAWNER_STATS.maxSpawnDelay), DEFAULT_MAX_SPAWN_DELAY),
        spawnCount: readNumberDp(blockDp?.get(BETTER_SPAWNER_STATS.spawnCount), DEFAULT_SPAWN_COUNT),
        maxCount: readNumberDp(blockDp?.get(BETTER_SPAWNER_STATS.maxCount), DEFAULT_MAX_COUNT),
        requiredPlayerRange: readNumberDp(
            blockDp?.get(BETTER_SPAWNER_STATS.requiredPlayerRange),
            DEFAULT_REQUIRED_PLAYER_RANGE
        ),
        spawnRange: readNumberDp(blockDp?.get(BETTER_SPAWNER_STATS.spawnRange), DEFAULT_SPAWN_RANGE),
        beforeNextSpawnTicks: readNumberDp(blockDp?.get(BETTER_SPAWNER_STATS.beforeNextSpawnTicks), 0),
        mobId: readStringDp(blockDp?.get(BETTER_SPAWNER_STATS.mobId)),
    };

    if (keys.length === 0) return all;

    const picked = {} as Pick<BetterSpawnerStats, BetterSpawnerStatsKey>;
    for (const key of keys) {
        (picked as BetterSpawnerStats)[key] = all[key] as never;
    }
    return picked;
}

function readNumberDp(value: unknown, fallback: number): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function readStringDp(value: unknown): string | undefined {
    return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function setBetterSpawnerStats(block: Block, values: BetterSpawnerStats): boolean;
export function setBetterSpawnerStats<K extends BetterSpawnerStatsKey>(
    block: Block,
    key: K,
    value: NonNullable<BetterSpawnerStats[K]>
): boolean;
export function setBetterSpawnerStats<K extends BetterSpawnerStatsKey>(
    block: Block,
    keyOrValues: K | BetterSpawnerStats,
    value?: NonNullable<BetterSpawnerStats[K]>
): boolean {
    const blockDp = block.getComponent(BlockComponentTypes.DynamicProperties);
    if (!blockDp) {
        console.error("No minecraft:dynamic_properties component found");
        return false;
    }

    if (typeof keyOrValues === "string") {
        blockDp.set(BETTER_SPAWNER_STATS[keyOrValues], value!);
        return true;
    }

    for (const key of Object.keys(BETTER_SPAWNER_STATS) as BetterSpawnerStatsKey[]) {
        const next = keyOrValues[key];
        if (next !== undefined) {
            blockDp.set(BETTER_SPAWNER_STATS[key], next);
        }
    }
    return true;
}

/**
 * Apothic Spawners item tooltip format (SpawnerStat.createTooltip):
 * green name + ": " + gray value, e.g. "§r§aMin Spawn Delay: §7200"
 * Order matches SpawnerStats.REGISTRY for the vanilla stats we store.
 */
export function setBetterSpawnerLore(itemStack: ItemStack, spawnerStats: BetterSpawnerStats): void {
    itemStack.setLore([
        apothicStatLore("Min Spawn Delay", spawnerStats.minSpawnDelay),
        apothicStatLore("Max Spawn Delay", spawnerStats.maxSpawnDelay),
        apothicStatLore("Spawn Count", spawnerStats.spawnCount),
        apothicStatLore("Max Entities", spawnerStats.maxCount),
        apothicStatLore("Required Player Range", spawnerStats.requiredPlayerRange),
        apothicStatLore("Spawn Range", spawnerStats.spawnRange),
    ]);
}

function apothicStatLore(name: string, value: number | string): string {
    return `§r§a${name}: §7${value}`;
}

export const PARTICLES_COMPONENT_ID = "better_spawners:spawner_particles";
export const BETTER_SPAWNER_ITEM_ID = "better_spawners:mob_spawner";
export const TICKS_PER_BETTER_SPAWNER_TICK = 20;
export const DEFAULT_MIN_SPAWN_DELAY = 200;
export const DEFAULT_MAX_SPAWN_DELAY = 800;
export const DEFAULT_SPAWN_RANGE = 4;
export const DEFAULT_SPAWN_COUNT = 4;
export const DEFAULT_MAX_COUNT = 6;
export const DEFAULT_REQUIRED_PLAYER_RANGE = 16;
export const SPAWNER_BREAK_XP_MIN = 15;
export const SPAWNER_BREAK_XP_MAX = 43;
export const BETTER_SPAWNER_ITEM_STATS_DP = "better_spawner:spawner_stats";

/** Vanilla-equivalent defaults written on convert / used as read fallbacks. */
export function createDefaultBetterSpawnerStats(mobId: string): BetterSpawnerStats {
    return {
        mobId,
        minSpawnDelay: DEFAULT_MIN_SPAWN_DELAY,
        maxSpawnDelay: DEFAULT_MAX_SPAWN_DELAY,
        spawnCount: DEFAULT_SPAWN_COUNT,
        maxCount: DEFAULT_MAX_COUNT,
        requiredPlayerRange: DEFAULT_REQUIRED_PLAYER_RANGE,
        spawnRange: DEFAULT_SPAWN_RANGE,
        beforeNextSpawnTicks: DEFAULT_MIN_SPAWN_DELAY,
    };
}
