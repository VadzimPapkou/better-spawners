import { ItemStack } from "@minecraft/server";

export function hasSilkTouch(itemStack: ItemStack | undefined): boolean {
    if (!itemStack) return false;
    return itemStack.getComponent("minecraft:enchantable")?.hasEnchantment("silk_touch") ?? false;
}
