import { EntityComponentTypes, EquipmentSlot, GameMode, ItemComponentTypes, Player } from "@minecraft/server";

/**
 * Applies durability damage to the player's mainhand.
 * amount > 10: Unbreaking divides by (level + 1).
 * amount ≤ 10: Unbreaking via getDamageChance roll per point (vanilla-like).
 * Breaks the item (and plays random.break) when damage reaches maxDurability.
 */
export function damageMainhandItem(player: Player, amount: number): void {
    if (amount <= 0 || player.getGameMode() === GameMode.Creative) return;

    const mainhand = player.getComponent(EntityComponentTypes.Equippable)?.getEquipmentSlot(EquipmentSlot.Mainhand);
    if (!mainhand?.hasItem()) return;

    const itemStack = mainhand.getItem();
    if (!itemStack) return;

    const durability = itemStack.getComponent(ItemComponentTypes.Durability);
    if (!durability || durability.unbreakable) return;

    const unbreakingLevel = Math.min(
        3,
        itemStack.getComponent(ItemComponentTypes.Enchantable)?.getEnchantment("unbreaking")?.level ?? 0
    );

    let damageToApply: number;
    if (amount > 10) {
        damageToApply = Math.floor(amount / (unbreakingLevel + 1));
    } else {
        const damageChance = durability.getDamageChance(unbreakingLevel) / 100;
        damageToApply = 0;
        for (let i = 0; i < amount; i++) {
            if (Math.random() < damageChance) damageToApply++;
        }
    }
    if (damageToApply <= 0) return;

    const newDamage = durability.damage + damageToApply;
    if (newDamage >= durability.maxDurability) {
        mainhand.setItem(undefined);
        player.dimension.playSound("random.break", player.location);
        return;
    }

    durability.damage = newDamage;
    mainhand.setItem(itemStack);
}
