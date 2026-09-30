import { world, Entity, EntityInitializationCause, Block, BlockVolume } from "@minecraft/server";
import { log } from "../utils/log";
import { inferredSpawnerTypes } from "../inferred-spawner-types";

function findNearbySpawners(entity: Entity): Block[] {
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
        // log("[dbg-spawner-spawn] entitySpawn", entity.typeId, "cause:", event.cause);
        if (event.cause !== EntityInitializationCause.Spawned) {
            // log("[dbg-spawner-spawn] skip: cause not Spawned");
            return;
        }
        const spawners = findNearbySpawners(entity);
        if (spawners.length === 0) {
            return;
        }
        for (const spawner of spawners) {
            inferredSpawnerTypes.set(spawner, entity.typeId);
            // log("[dbg-spawner-spawn] set type", entity.typeId, "at", spawner.location);
        }
    });
}
