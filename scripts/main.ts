import { world, ItemStack, Player, Entity, EntityInitializationCause, Block, BlockVolume } from "@minecraft/server";
import { dropBlockItem } from "./block-drop";
import { log } from "./utils";

const brokenSpawners = new Map<Player, ItemStack>();

world.beforeEvents.playerBreakBlock.subscribe((event) => {
    const block = event.block;
    block.getComponents().forEach((component) => {
        console.log(component.typeId);
    });
    if (block.typeId !== "minecraft:mob_spawner") return;
    const itemStack = block.getItemStack(1, true)!;

    brokenSpawners.set(event.player, itemStack);
});

world.afterEvents.playerBreakBlock.subscribe((event) => {
    const player = event.player;
    const brokenTypeId = event.brokenBlockPermutation.type.id;

    if (brokenTypeId === "minecraft:mob_spawner") {
        const itemStack = brokenSpawners.get(player);
        if (!itemStack) {
            console.error("No broken spawner found for player", player.name);
            return;
        }

        dropBlockItem(event.dimension, event.block.location, itemStack);
        brokenSpawners.delete(player);
    }
});

const spawnerTypes = new Map<Block, string>();

/** 9×9 горизонталь (±4), 4 по высоте (−1..+2) */
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

world.afterEvents.entitySpawn.subscribe((event) => {
    const entity = event.entity;
    if (event.cause === EntityInitializationCause.Spawned) {
        const spawner = findNearestSpawner(entity);
        if (!spawner) return;
        spawnerTypes.set(spawner, entity.typeId);
        log("spawner type:", entity.typeId);
    }
});
