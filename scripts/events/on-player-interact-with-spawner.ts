import { EquipmentSlot, GameMode, system, world } from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data";
import { spawnSpawnerParticles } from "../spawner-particles";

const CUSTOM_SPAWNER_ID = "better_spawners:mob_spawner";

export function initOnPlayerInteractWithSpawner(): void {
    world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
        if (!event.isFirstEvent) return;
        if (event.block.typeId !== "minecraft:mob_spawner") return;
        if (event.itemStack?.typeId !== MinecraftItemTypes.Diamond) return;

        const player = event.player;
        const block = event.block;

        system.run(() => {
            if (!block.isValid || block.typeId !== "minecraft:mob_spawner") return;

            block.setType(CUSTOM_SPAWNER_ID);
            spawnSpawnerParticles(block.dimension, block.location);

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
