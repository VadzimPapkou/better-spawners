import { system, world } from "@minecraft/server";
import {
    BETTER_SPAWNER_ITEM_ID,
    formatStatDisplay,
    getBetterSpawnerStats,
    MODIFIER_BY_ITEM,
    setBetterSpawnerStats,
    SpawnerNumberModifier,
} from "./better-spawner-utils";
import { consumeMainhandItem } from "../utils/consume-mainhand-item";
import { getMainhandItem } from "../utils/get-mainhand-item";

function clampStat(value: number, min?: number, max?: number): number {
    let next = value;
    if (min !== undefined) next = Math.max(next, min);
    if (max !== undefined) next = Math.min(next, max);
    return next;
}

function applyNumberModifier(modifier: SpawnerNumberModifier, oldValue: number, inverse: boolean): number {
    return inverse
        ? clampStat(oldValue + modifier.inverseDelta, modifier.inverseMin, modifier.inverseMax)
        : clampStat(oldValue + modifier.delta, modifier.min, modifier.max);
}

export function initBetterSpawnerModifications(): void {
    world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
        if (!event.isFirstEvent) return;
        if (event.block.typeId !== BETTER_SPAWNER_ITEM_ID) return;

        const itemId = event.itemStack?.typeId;
        if (!itemId) return;

        const modifier = MODIFIER_BY_ITEM.get(itemId);
        if (!modifier) return;

        const player = event.player;
        const block = event.block;
        const inverse = player.isSneaking;

        event.cancel = true;

        system.run(() => {
            if (!block.isValid || block.typeId !== BETTER_SPAWNER_ITEM_ID) return;
            if (getMainhandItem(player)?.typeId !== itemId) return;

            const stats = getBetterSpawnerStats(block);

            if (modifier.kind === "number") {
                const oldValue = stats[modifier.statKey];
                const nextValue = applyNumberModifier(modifier, oldValue, inverse);

                if (nextValue === oldValue) {
                    player.onScreenDisplay.setActionBar(`${formatStatDisplay(modifier.displayName, oldValue)} (cap)`);
                    return;
                }
                if (!setBetterSpawnerStats(block, modifier.statKey, nextValue)) return;
                if (!consumeMainhandItem(player, itemId)) return;

                player.onScreenDisplay.setActionBar(formatStatDisplay(modifier.displayName, nextValue));
                return;
            }

            // Apply → enable, sneak → disable (mirrors numeric add/remove).
            const oldValue = stats[modifier.statKey];
            const nextValue = !inverse;

            if (nextValue === oldValue) {
                player.onScreenDisplay.setActionBar(`${formatStatDisplay(modifier.displayName, oldValue)} (cap)`);
                return;
            }
            if (!setBetterSpawnerStats(block, modifier.statKey, nextValue)) return;
            if (!consumeMainhandItem(player, itemId)) return;

            player.onScreenDisplay.setActionBar(formatStatDisplay(modifier.displayName, nextValue));
        });
    });
}
