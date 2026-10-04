import { Dimension, EntityComponentTypes, ItemStack, Player, system, Vector3 } from "@minecraft/server";
import { dropBlockItem } from "./drop-block-item";

/** Avoids instant close-range pickup desync for script-spawned custom block items. */
const DEFAULT_DROP_DELAY_TICKS = 10;

/**
 * Gives the item to the player's inventory when it fits; otherwise drops it at the block location after a short delay.
 */
export function giveOrDropBlockItem(
    player: Player,
    location: Vector3,
    item: ItemStack,
    dropDelayTicks: number = DEFAULT_DROP_DELAY_TICKS
): void {
    const container = player.getComponent(EntityComponentTypes.Inventory)?.container;
    if (container) {
        const leftover = container.addItem(item);
        if (!leftover) return;
        scheduleDropBlockItem(player.dimension, location, leftover, dropDelayTicks);
        return;
    }
    scheduleDropBlockItem(player.dimension, location, item, dropDelayTicks);
}

function scheduleDropBlockItem(dimension: Dimension, location: Vector3, item: ItemStack, delayTicks: number): void {
    const dropLocation = { ...location };
    if (delayTicks <= 0) {
        dropBlockItem(dimension, dropLocation, item);
        return;
    }
    system.runTimeout(() => {
        dropBlockItem(dimension, dropLocation, item);
    }, delayTicks);
}
