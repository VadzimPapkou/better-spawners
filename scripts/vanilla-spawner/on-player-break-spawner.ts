import { world, system, BlockPermutation, GameMode, ItemStack } from "@minecraft/server";
import { MinecraftBlockTypes } from "@minecraft/vanilla-data";
import { giveOrDropBlockItem } from "../utils/give-or-drop-block-item";
import { hasSilkTouch } from "../utils/has-silk-touch";
import { damageMainhandItem } from "../utils/damage-mainhand-item";
import { inferredSpawnerTypes } from "./inferred-spawner-types";
import { BETTER_SPAWNER_ITEM_ID, BETTER_SPAWNER_ITEM_STATS_DP } from "../better-spawner/spawner-constants";
import { createDefaultBetterSpawnerStats } from "../better-spawner/spawner-stats";
import { setBetterSpawnerLore } from "../better-spawner/spawner-modifiers";
import { mobTypeToName } from "../utils/mob-type-to-name";

const SPAWNER_SILK_TOUCH_DURABILITY_COST = 100;

export function initOnPlayerBreakSpawner(): void {
    world.beforeEvents.playerBreakBlock.subscribe((event) => {
        const { block, player } = event;
        if (block.typeId !== "minecraft:mob_spawner") return;
        if (player.getGameMode() === GameMode.Creative) return;
        if (!hasSilkTouch(event.itemStack)) return;

        event.cancel = true;

        const mobId = inferredSpawnerTypes.get(block);
        const spawnerStats = createDefaultBetterSpawnerStats(mobId);

        system.run(() => {
            if (!block.isValid || block.typeId !== "minecraft:mob_spawner") return;

            const spawnerItem = new ItemStack(BETTER_SPAWNER_ITEM_ID);
            if (mobId) {
                spawnerItem.nameTag = `§r${mobTypeToName(mobId)} Spawner`;
            }
            spawnerItem.setDynamicProperty(BETTER_SPAWNER_ITEM_STATS_DP, JSON.stringify(spawnerStats));
            setBetterSpawnerLore(spawnerItem, spawnerStats);

            block.setPermutation(BlockPermutation.resolve(MinecraftBlockTypes.Air));
            event.dimension.playSound("block.mob_spawner.break", block.location);
            giveOrDropBlockItem(player, block.location, spawnerItem);
            damageMainhandItem(player, SPAWNER_SILK_TOUCH_DURABILITY_COST);
        });
    });
}
