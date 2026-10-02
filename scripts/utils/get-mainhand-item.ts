import { EntityComponentTypes, EquipmentSlot, ItemStack, Player } from "@minecraft/server";

export function getMainhandItem(player: Player): ItemStack | undefined {
    return player.getComponent(EntityComponentTypes.Equippable)?.getEquipmentSlot(EquipmentSlot.Mainhand)?.getItem();
}
