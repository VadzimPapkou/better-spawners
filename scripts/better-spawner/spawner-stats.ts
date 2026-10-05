import { Block, BlockComponentTypes } from "@minecraft/server";
import {
    DEFAULT_MAX_COUNT,
    DEFAULT_MAX_SPAWN_DELAY,
    DEFAULT_MIN_SPAWN_DELAY,
    DEFAULT_REQUIRED_PLAYER_RANGE,
    DEFAULT_SPAWN_COUNT,
    DEFAULT_SPAWN_RANGE,
    REDSTONE_POWER_DP,
} from "./spawner-constants";

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
    ignoresLight: boolean;
};

export type BetterSpawnerStatsKey = keyof BetterSpawnerStats;

export type NumericModKey = Extract<
    BetterSpawnerStatsKey,
    "minSpawnDelay" | "maxSpawnDelay" | "spawnCount" | "maxCount" | "requiredPlayerRange" | "spawnRange"
>;

export type BooleanModKey = Extract<BetterSpawnerStatsKey, "redstoneControl" | "ignoresLight">;

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
    ignoresLight: "ignores_light",
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
        ignoresLight: readBooleanDp(blockDp?.get(BETTER_SPAWNER_STATS.ignoresLight), false),
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
        ignoresLight: false,
    };
}
