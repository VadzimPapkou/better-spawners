import { EntityComponentTypes, EquipmentSlot, GameMode, Player } from "@minecraft/server";

/**
 * Removes 1 item from mainhand.
 * @returns true if consumed (or Creative — no consume needed), false if mainhand missing/mismatched.
 */
export function consumeMainhandItem(player: Player, expectedTypeId?: string): boolean {
    if (player.getGameMode() === GameMode.Creative) return true;

    const mainhand = player.getComponent(EntityComponentTypes.Equippable)?.getEquipmentSlot(EquipmentSlot.Mainhand);
    if (!mainhand) return false;
    if (expectedTypeId !== undefined && mainhand.typeId !== expectedTypeId) return false;

    if (mainhand.amount > 1) {
        mainhand.amount--;
    } else {
        mainhand.setItem(undefined);
    }
    return true;
}
