import { world, ItemStack, Player } from "@minecraft/server";
import { dropBlockItem } from "../utils/dropBlockItem";

const brokenSpawners = new Map<Player, ItemStack>();

export function initOnPlayerBreakSpawner(): void {
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
}
