import { world, ItemStack, Player, GameMode } from "@minecraft/server";
import { dropBlockItem } from "../utils/drop-block-item";
import { hasSilkTouch } from "../utils/has-silk-touch";

const brokenSpawners = new Map<Player, ItemStack>();

export function initOnPlayerBreakSpawner(): void {
    world.beforeEvents.playerBreakBlock.subscribe((event) => {
        const block = event.block;
        if (block.typeId !== "minecraft:mob_spawner") return;
        const itemStack = block.getItemStack(1, true)!;

        brokenSpawners.set(event.player, itemStack);
    });

    world.afterEvents.playerBreakBlock.subscribe((event) => {
        const player = event.player;
        const brokenTypeId = event.brokenBlockPermutation.type.id;
        const itemStack = brokenSpawners.get(player);
        brokenSpawners.delete(player);

        if (
            brokenTypeId === "minecraft:mob_spawner" &&
            hasSilkTouch(event.itemStackBeforeBreak) &&
            player.getGameMode() !== GameMode.Creative
        ) {
            if (!itemStack) {
                console.error("No broken spawner found for player", player.name);
                return;
            }

            dropBlockItem(event.dimension, event.block.location, itemStack);
        }
    });
}
