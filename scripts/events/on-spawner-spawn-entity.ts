import { world, Entity, EntityInitializationCause, Block, BlockVolume } from "@minecraft/server";
import { log } from "../utils/log";
import { inferredSpawnerTypes } from "../inferred-spawner-types";

function findNearestSpawner(entity: Entity): Block | undefined {
    const { x, y, z } = entity.location;
    const volume = new BlockVolume({ x: x - 4, y: y - 1, z: z - 4 }, { x: x + 4, y: y + 2, z: z + 4 });

    const found = entity.dimension.getBlocks(volume, {
        includeTypes: ["minecraft:mob_spawner"],
        closest: 1,
        location: entity.location,
    });

    const first = found.getBlockLocationIterator().next();
    if (first.done) return undefined;
    return entity.dimension.getBlock(first.value);
}

export function initOnSpawnerSpawnEntity(): void {
    world.afterEvents.entitySpawn.subscribe((event) => {
        const entity = event.entity;
        if (event.cause === EntityInitializationCause.Spawned) {
            const spawner = findNearestSpawner(entity);
            if (!spawner) return;
            inferredSpawnerTypes.set(spawner, entity.typeId);
            log("spawner type:", entity.typeId);
        }
    });
}
