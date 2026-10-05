import {
    Block,
    BlockComponentTypes,
    Dimension,
    DimensionTypes,
    ItemStack,
    system,
    Vector3,
    world,
} from "@minecraft/server";
import { randomInteger } from "../utils/random-integer";

const PARTICLES_EMITTER_ENTITY_ID = "better_spawners:spawner_particles_emitter";
/** 30s between orphan particle sweeps. */
const ORPHAN_PARTICLES_CLEANUP_INTERVAL_TICKS = 600;
/** Match onBreak grace so ambient FX can finish fading. */
const ORPHAN_PARTICLES_REMOVE_DELAY_TICKS = 40;

/** Vanilla Bedrock spawn FX (resource_pack/particles/mob_block_spawn.json). Classic mob_spawner has no spawn sound. */
const SPAWN_FLAME_PARTICLE = "minecraft:basic_flame_particle";
const SPAWN_SMOKE_PARTICLE = "minecraft:basic_smoke_particle";
/** White poof on the mob — vanilla emitter already fires 20 particles. */
const MOB_SPAWN_EMITTER = "minecraft:mob_block_spawn_emitter";
const SPAWNER_SPAWN_FLAME_COUNT = 20;
const SPAWNER_NW_SMOKE_COUNT = 20;

function getSpawnerParticlesEmitter(dimension: Dimension, location: Vector3) {
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
        return entity;
    }
    return undefined;
}

export function spawnSpawnerParticles(dimension: Dimension, location: Vector3): void {
    dimension.spawnEntity(PARTICLES_EMITTER_ENTITY_ID, {
        x: location.x + 0.5,
        y: location.y + 0.5,
        z: location.z + 0.5,
    });
}

/** Drives client animation controller via mark_variant (1 = ambient particles, 0 = idle). */
export function setSpawnerParticlesActive(dimension: Dimension, location: Vector3, active: boolean): void {
    const emitter = getSpawnerParticlesEmitter(dimension, location);
    if (!emitter) return;
    emitter.triggerEvent(active ? "better_spawners:has_player_in_range" : "better_spawners:no_player_in_range");
}

export function removeSpawnerParticles(dimension: Dimension, location: Vector3): void {
    getSpawnerParticlesEmitter(dimension, location)?.remove();
}

/** Periodically remove particle emitters that no longer sit inside a better spawner block. */
export function initOrphanSpawnerParticlesCleanup(): void {
    system.runInterval(() => {
        for (const dimensionType of DimensionTypes.getAll()) {
            const dimension = world.getDimension(dimensionType.typeId);
            for (const entity of dimension.getEntities({ type: PARTICLES_EMITTER_ENTITY_ID })) {
                const blockLocation = {
                    x: Math.floor(entity.location.x),
                    y: Math.floor(entity.location.y),
                    z: Math.floor(entity.location.z),
                };
                let block: Block | undefined;
                try {
                    block = dimension.getBlock(blockLocation);
                } catch {
                    continue;
                }
                if (block?.typeId === BETTER_SPAWNER_ITEM_ID) continue;

                entity.triggerEvent("better_spawners:no_player_in_range");
                system.runTimeout(() => {
                    if (entity.isValid) entity.remove();
                }, ORPHAN_PARTICLES_REMOVE_DELAY_TICKS);
            }
        }
    }, ORPHAN_PARTICLES_CLEANUP_INTERVAL_TICKS);
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
    redstoneControl: boolean;
};

export type BetterSpawnerStatsKey = keyof BetterSpawnerStats;

export type NumericModKey = Extract<
    BetterSpawnerStatsKey,
    "minSpawnDelay" | "maxSpawnDelay" | "spawnCount" | "maxCount" | "requiredPlayerRange" | "spawnRange"
>;

export type BooleanModKey = Extract<BetterSpawnerStatsKey, "redstoneControl">;

type SpawnerModifierBase = {
    itemId: string;
    displayName: string;
};

export type SpawnerNumberModifier = SpawnerModifierBase & {
    kind: "number";
    statKey: NumericModKey;
    delta: number;
    min?: number;
    max?: number;
    inverseDelta: number;
    inverseMin?: number;
    inverseMax?: number;
};

export type SpawnerBooleanModifier = SpawnerModifierBase & {
    kind: "boolean";
    statKey: BooleanModKey;
};

export type SpawnerModifier = SpawnerNumberModifier | SpawnerBooleanModifier;

export const SPAWNER_MODIFIERS: SpawnerModifier[] = [
    {
        kind: "number",
        itemId: "minecraft:sugar",
        displayName: "Min Spawn Delay",
        statKey: "minSpawnDelay",
        delta: -10,
        min: 20,
        inverseDelta: 10,
        inverseMax: 1600,
    },
    {
        kind: "number",
        itemId: "minecraft:clock",
        displayName: "Max Spawn Delay",
        statKey: "maxSpawnDelay",
        delta: -20,
        min: 20,
        inverseDelta: 20,
        inverseMax: 1600,
    },
    {
        kind: "number",
        itemId: "minecraft:fermented_spider_eye",
        displayName: "Spawn Count",
        statKey: "spawnCount",
        delta: 2,
        max: 16,
        inverseDelta: -2,
        inverseMin: 1,
    },
    {
        kind: "number",
        itemId: "minecraft:ghast_tear",
        displayName: "Max Entities",
        statKey: "maxCount",
        delta: 2,
        max: 32,
        inverseDelta: -2,
        inverseMin: 1,
    },
    {
        kind: "number",
        itemId: "minecraft:prismarine_crystals",
        displayName: "Activation Range",
        statKey: "requiredPlayerRange",
        delta: 4,
        max: 48,
        inverseDelta: -4,
        inverseMin: 1,
    },
    {
        kind: "number",
        itemId: "minecraft:piston",
        displayName: "Spawn Range",
        statKey: "spawnRange",
        delta: 2,
        max: 32,
        inverseDelta: -2,
        inverseMin: 1,
    },
    {
        kind: "boolean",
        itemId: "minecraft:comparator",
        displayName: "Redstone Control",
        statKey: "redstoneControl",
    },
];

export const MODIFIER_BY_ITEM = new Map(SPAWNER_MODIFIERS.map((m) => [m.itemId, m]));

/** Apothic-style "§aName: §7value" (lore prefixes with §r). */
/** Numeric/string stats: Apothic `§aName: §7value`. Booleans use On/Off (lang misc.on/off). */
export function formatStatDisplay(name: string, value: number | string | boolean): string {
    const display = typeof value === "boolean" ? (value ? "On" : "Off") : value;
    return `§a${name}: §7${display}`;
}

/** Transient redstone signal level (not part of silk-touch stats). */
export const REDSTONE_POWER_DP = "better_spawners:redstone_power";

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
    redstoneControl: "redstone_control",
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
        redstoneControl: readBooleanDp(blockDp?.get(BETTER_SPAWNER_STATS.redstoneControl), false),
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

function readBooleanDp(value: unknown, fallback: boolean): boolean {
    return typeof value === "boolean" ? value : fallback;
}

export function getRedstonePower(block: Block): number {
    const blockDp = block.getComponent(BlockComponentTypes.DynamicProperties);
    return readNumberDp(blockDp?.get(REDSTONE_POWER_DP), 0);
}

export function setRedstonePower(block: Block, power: number): boolean {
    const blockDp = block.getComponent(BlockComponentTypes.DynamicProperties);
    if (!blockDp) {
        console.error("No minecraft:dynamic_properties component found");
        return false;
    }
    blockDp.set(REDSTONE_POWER_DP, power);
    return true;
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

export function setBetterSpawnerLore(itemStack: ItemStack, spawnerStats: BetterSpawnerStats): void {
    // Apothic BooleanStat: omit at default (false); when true show dark-green name only (no ": value").
    itemStack.setLore(
        SPAWNER_MODIFIERS.flatMap((m) => {
            const raw = spawnerStats[m.statKey];
            if (typeof raw === "boolean") {
                return raw ? [`§r§2${m.displayName}`] : [];
            }
            return [`§r${formatStatDisplay(m.displayName, raw)}`];
        })
    );
}

export const PARTICLES_COMPONENT_ID = "better_spawners:spawner_particles";
export const BETTER_SPAWNER_ITEM_ID = "better_spawners:mob_spawner";
/*
Sync with block's
"minecraft:tick": {
    "looping": true,
    "interval_range": [N, N]
}
*/
export const TICKS_PER_BETTER_SPAWNER_TICK = 5;
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
        redstoneControl: false,
    };
}
