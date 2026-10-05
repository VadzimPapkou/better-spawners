import { system, world } from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { inferredSpawnerTypes } from "./inferred-spawner-types";
import { BETTER_SPAWNER_ITEM_ID } from "../better-spawner/spawner-constants";
import { createDefaultBetterSpawnerStats, setBetterSpawnerStats } from "../better-spawner/spawner-stats";
import { consumeMainhandItem } from "../utils/consume-mainhand-item";

export function initOnPlayerInteractWithSpawner(): void {
    world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
        if (!event.isFirstEvent) return;
        if (event.block.typeId !== "minecraft:mob_spawner") return;
        if (event.itemStack?.typeId !== MinecraftItemTypes.Diamond) return;

        const player = event.player;
        const block = event.block;
        const spawnerType = inferredSpawnerTypes.get(block);
        if (!spawnerType) {
            player.sendMessage("§cThis spawner has to spawn at least one mob in order to be converted");
            return;
        }

        system.run(() => {
            if (!block.isValid || block.typeId !== "minecraft:mob_spawner") return;
            if (!consumeMainhandItem(player, MinecraftItemTypes.Diamond)) return;

            block.setType(BETTER_SPAWNER_ITEM_ID);
            setBetterSpawnerStats(block, createDefaultBetterSpawnerStats(spawnerType));
            player.sendMessage("§aSpawner converted to custom spawner");
        });
    });
}
