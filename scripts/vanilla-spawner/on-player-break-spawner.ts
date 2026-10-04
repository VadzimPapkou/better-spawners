import { world, system, BlockPermutation, GameMode } from "@minecraft/server";
import { MinecraftBlockTypes } from "@minecraft/vanilla-data";
import { giveOrDropBlockItem } from "../utils/give-or-drop-block-item";
import { hasSilkTouch } from "../utils/has-silk-touch";
import { damageMainhandItem } from "../utils/damage-mainhand-item";

const SPAWNER_SILK_TOUCH_DURABILITY_COST = 100;

export function initOnPlayerBreakSpawner(): void {
    world.beforeEvents.playerBreakBlock.subscribe((event) => {
        const { block, player } = event;
        if (block.typeId !== "minecraft:mob_spawner") return;
        if (player.getGameMode() === GameMode.Creative) return;
        if (!hasSilkTouch(event.itemStack)) return;

        const spawnerItem = block.getItemStack(1, true);
        if (!spawnerItem) return;

        event.cancel = true;

        system.run(() => {
            block.setPermutation(BlockPermutation.resolve(MinecraftBlockTypes.Air));
            event.dimension.playSound("block.mob_spawner.break", block.location);
            giveOrDropBlockItem(player, block.location, spawnerItem);
            damageMainhandItem(player, SPAWNER_SILK_TOUCH_DURABILITY_COST);
        });
    });
}
