/**
 * Bedrock entity id → English display name when strip/title-case ≠ vanilla name.
 * Inverse of SPAWN_EGG_ENTITY_OVERRIDES plus glued ids like tropicalfish.
 */
const MOB_TYPE_NAME_OVERRIDES: Readonly<Record<string, string>> = {
    "minecraft:evocation_illager": "Evoker",
    "minecraft:tropicalfish": "Tropical Fish",
    "minecraft:villager_v2": "Villager",
    "minecraft:zombie_villager_v2": "Zombie Villager",
};

/**
 * Maps an entity typeId to an English display name (no localization).
 * e.g. "minecraft:cave_spider" → "Cave Spider"
 */
export function mobTypeToName(mobTypeId: string): string {
    const override = MOB_TYPE_NAME_OVERRIDES[mobTypeId];
    if (override) return override;

    const bare = mobTypeId.includes(":") ? mobTypeId.slice(mobTypeId.indexOf(":") + 1) : mobTypeId;
    return bare
        .split("_")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}
