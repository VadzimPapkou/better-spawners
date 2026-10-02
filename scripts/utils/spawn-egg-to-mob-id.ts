import { EntityTypes } from "@minecraft/server";

/**
 * Bedrock spawn-egg item id → entity id when strip(`_spawn_egg`) ≠ runtime entity id.
 * Prefer current Bedrock identifiers; candidates are tried via EntityTypes.get so
 * future flattening renames (egg/entity → Java-like ids) still resolve.
 *
 * Sources: minecraft.wiki Spawn Egg (BE), MS Learn Vanilla Entity Listings,
 * Bedrock flattening notes (planned renames).
 */
const SPAWN_EGG_ENTITY_OVERRIDES: Readonly<Record<string, string>> = {
    "minecraft:evoker_spawn_egg": "minecraft:evocation_illager",
    "minecraft:tropical_fish_spawn_egg": "minecraft:tropicalfish",
    // Egg still `villager_*`; modern BP entity is `*_v2` (legacy `villager` / `zombie_villager` remain).
    "minecraft:villager_spawn_egg": "minecraft:villager_v2",
    "minecraft:zombie_villager_spawn_egg": "minecraft:zombie_villager_v2",
    // Flattening / Java-aligned egg id while entity may still be `zombie_pigman`.
    "minecraft:zombified_piglin_spawn_egg": "minecraft:zombie_pigman",
};

/**
 * Maps a spawn-egg item typeId to a spawnable entity typeId, or undefined if unknown.
 */
export function spawnEggToMobId(spawnEggItemId: string): string | undefined {
    if (!spawnEggItemId.endsWith("_spawn_egg")) return undefined;

    const stripped = spawnEggItemId.replace(/_spawn_egg$/, "");
    const override = SPAWN_EGG_ENTITY_OVERRIDES[spawnEggItemId];

    for (const candidate of [override, stripped]) {
        if (!candidate) continue;
        if (EntityTypes.get(candidate)) return candidate;
    }

    return undefined;
}
