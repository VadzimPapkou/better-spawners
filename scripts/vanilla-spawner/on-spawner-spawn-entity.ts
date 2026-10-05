import { world, Entity, EntityComponentTypes, EntityInitializationCause, Block, BlockVolume } from "@minecraft/server";
import { inferredSpawnerTypes } from "./inferred-spawner-types";

/** Living mobs only — skips xp_orb, item, projectiles, etc. */
function isInferableSpawnerMob(entity: Entity): boolean {
    if (!entity.isValid || entity.typeId === "minecraft:player") return false;
    return entity.getComponent(EntityComponentTypes.TypeFamily)?.hasTypeFamily("mob") === true;
}

function findNearbySpawners(entity: Entity): Block[] {
    if (!entity.isValid) return [];
    const { x, y, z } = entity.location;
    const volume = new BlockVolume({ x: x - 4, y: y - 1, z: z - 4 }, { x: x + 4, y: y + 2, z: z + 4 });

    const found = entity.dimension.getBlocks(volume, {
        includeTypes: ["minecraft:mob_spawner"],
    });

    const spawners: Block[] = [];
    for (const loc of found.getBlockLocationIterator()) {
        const block = entity.dimension.getBlock(loc);
        if (block) spawners.push(block);
    }
    return spawners;
}

export function initOnSpawnerSpawnEntity(): void {
    world.afterEvents.entitySpawn.subscribe((event) => {
        const entity = event.entity;
        if (event.cause !== EntityInitializationCause.Spawned) return;
        if (!isInferableSpawnerMob(entity)) return;

        const spawners = findNearbySpawners(entity);
        if (spawners.length === 0) return;

        for (const spawner of spawners) {
            inferredSpawnerTypes.set(spawner, entity.typeId);
        }
    });
}
