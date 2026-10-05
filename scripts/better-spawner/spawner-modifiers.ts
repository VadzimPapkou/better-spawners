import { ItemStack } from "@minecraft/server";
import { BetterSpawnerStats, BooleanModKey, NumericModKey } from "./spawner-stats";

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
    {
        kind: "boolean",
        itemId: "minecraft:soul_lantern",
        displayName: "Ignores Light",
        statKey: "ignoresLight",
    },
];

export const MODIFIER_BY_ITEM = new Map(SPAWNER_MODIFIERS.map((m) => [m.itemId, m]));

/** Numeric/string stats: Apothic `§aName: §7value`. Booleans use On/Off (lang misc.on/off). */
export function formatStatDisplay(name: string, value: number | string | boolean): string {
    const display = typeof value === "boolean" ? (value ? "On" : "Off") : value;
    return `§a${name}: §7${display}`;
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
