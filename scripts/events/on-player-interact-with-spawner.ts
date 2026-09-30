import { EquipmentSlot, GameMode, system, world } from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { inferredSpawnerTypes } from "../inferred-spawner-types";

const CUSTOM_SPAWNER_ID = "better_spawners:mob_spawner";

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

            block.setType(CUSTOM_SPAWNER_ID);
            player.sendMessage("§aSpawner converted to custom spawner");

            if (player.getGameMode() === GameMode.Creative) return;

            const equippable = player.getComponent("minecraft:equippable");
            const mainhand = equippable?.getEquipmentSlot(EquipmentSlot.Mainhand);
            if (!mainhand || mainhand.typeId !== MinecraftItemTypes.Diamond) return;

            if (mainhand.amount > 1) {
                mainhand.amount--;
            } else {
                mainhand.setItem(undefined);
            }
        });
    });
}
