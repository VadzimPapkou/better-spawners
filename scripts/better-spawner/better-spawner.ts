import { BlockPermutation, GameMode, ItemStack, system, world } from "@minecraft/server";
import { MinecraftBlockTypes } from "@minecraft/vanilla-data";
import { randomInteger } from "../utils/random-integer";
import {
    PARTICLES_COMPONENT_ID,
    removeSpawnerParticles,
    spawnMobs,
    spawnSpawnerParticles,
    setSpawnerParticlesActive,
    getBetterSpawnerStats,
    setBetterSpawnerStats,
    TICKS_PER_BETTER_SPAWNER_TICK,
    BETTER_SPAWNER_ITEM_ID,
    setBetterSpawnerLore,
    BETTER_SPAWNER_ITEM_STATS_DP,
    SPAWNER_BREAK_XP_MAX,
    SPAWNER_BREAK_XP_MIN,
    BetterSpawnerStats,
} from "./better-spawner-utils";
import { hasSilkTouch } from "../utils/has-silk-touch";
import { dropBlockItem } from "../utils/drop-block-item";
import { dropBlockExperience } from "../utils/drop-block-experience";
import { getMainhandItem } from "../utils/get-mainhand-item";
import { consumeMainhandItem } from "../utils/consume-mainhand-item";
import { spawnEggToMobId } from "../utils/spawn-egg-to-mob-id";
import { mobTypeToName } from "../utils/mob-type-to-name";
import { log } from "../utils/log";
import { serializers } from "../utils/serializers";
import { isObject } from "../utils/is-object";

const beforePlayerPlaceItemStack: Map<string, ItemStack> = new Map();

export function initBetterSpawner(): void {
    system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
        blockComponentRegistry.registerCustomComponent(PARTICLES_COMPONENT_ID, {
            onPlace: (event) => {
                spawnSpawnerParticles(event.dimension, event.block.location);
                const placeKey = serializers.block.toString(event.block);
                const itemStack = beforePlayerPlaceItemStack.get(placeKey);
                beforePlayerPlaceItemStack.delete(placeKey);
                if (!itemStack) return;
                const rawBetterSpawnerStats = itemStack.getDynamicProperty(BETTER_SPAWNER_ITEM_STATS_DP);
                if (!rawBetterSpawnerStats || typeof rawBetterSpawnerStats !== "string") {
                    log("No better spawner stats found");
                    return;
                }
                const betterSpawnerStats = JSON.parse(rawBetterSpawnerStats) as BetterSpawnerStats;
                if (!isObject(betterSpawnerStats)) {
                    log("Better spawner stats JSON is not an object");
                    return;
                }
                setBetterSpawnerStats(event.block, betterSpawnerStats);
            },
            beforeOnPlayerPlace: (event) => {
                const player = event.player;
                if (!player) return;
                const heldItem = getMainhandItem(player);
                if (!heldItem) return;
                beforePlayerPlaceItemStack.set(serializers.block.toString(event.block), heldItem);
            },
            onBreak: (event) => {
                setSpawnerParticlesActive(event.dimension, event.block.location, false);
                system.runTimeout(() => {
                    removeSpawnerParticles(event.dimension, event.block.location);
                }, 40);

                system.runJob
            },
            onTick: (event) => {
                const spawnerBlock = event.block;
                if (!spawnerBlock.isValid || spawnerBlock.typeId !== BETTER_SPAWNER_ITEM_ID) return;

                const spawnerStats = getBetterSpawnerStats(spawnerBlock);

                const center = {
                    x: spawnerBlock.location.x + 0.5,
                    y: spawnerBlock.location.y + 0.5,
                    z: spawnerBlock.location.z + 0.5,
                };
                const players = spawnerBlock.dimension.getPlayers({
                    location: center,
                    maxDistance: spawnerStats.requiredPlayerRange,
                });
                setSpawnerParticlesActive(spawnerBlock.dimension, spawnerBlock.location, players.length > 0);

                if (!spawnerStats.mobId) return;
                if (players.length === 0) return;

                const beforeNextSpawnTicks = spawnerStats.beforeNextSpawnTicks
                    ? spawnerStats.beforeNextSpawnTicks - TICKS_PER_BETTER_SPAWNER_TICK
                    : 0;
                if (beforeNextSpawnTicks <= 0) {
                    spawnMobs(
                        event.block,
                        spawnerStats.mobId,
                        spawnerStats.spawnCount,
                        spawnerStats.maxCount,
                        spawnerStats.spawnRange
                    );
                    setBetterSpawnerStats(
                        spawnerBlock,
                        "beforeNextSpawnTicks",
                        randomInteger(spawnerStats.minSpawnDelay, spawnerStats.maxSpawnDelay)
                    );
                } else {
                    setBetterSpawnerStats(spawnerBlock, "beforeNextSpawnTicks", beforeNextSpawnTicks);
                }
            },
        });
    });

    world.beforeEvents.playerBreakBlock.subscribe((event) => {
        if (event.block.typeId !== BETTER_SPAWNER_ITEM_ID) return;

        const heldItem = getMainhandItem(event.player);

        if (!hasSilkTouch(heldItem) && event.player.getGameMode() !== GameMode.Creative) {
            if (heldItem?.hasTag("minecraft:is_pickaxe")) {
                const { dimension } = event;
                const location = { ...event.block.location };
                system.run(() => {
                    dropBlockExperience(dimension, location, randomInteger(SPAWNER_BREAK_XP_MIN, SPAWNER_BREAK_XP_MAX));
                });
            }
            return;
        }

        event.cancel = true;

        system.run(() => {
            const spawnerStats = getBetterSpawnerStats(event.block);
            const spawnerItem = new ItemStack(BETTER_SPAWNER_ITEM_ID);
            const spawnerMobType = spawnerStats.mobId;
            if (spawnerMobType) {
                spawnerItem.nameTag = `§r${mobTypeToName(spawnerMobType)} Spawner`;
            }
            spawnerItem.setDynamicProperty(BETTER_SPAWNER_ITEM_STATS_DP, JSON.stringify(spawnerStats));
            setBetterSpawnerLore(spawnerItem, spawnerStats);
            event.block.setPermutation(BlockPermutation.resolve(MinecraftBlockTypes.Air));
            event.dimension.playSound("dig.stone", event.block.location);
            dropBlockItem(event.dimension, event.block.location, spawnerItem);
        });
    });

    world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
        if (event.block.typeId !== BETTER_SPAWNER_ITEM_ID) return;
        if (!event.isFirstEvent) return;

        const heldItemId = getMainhandItem(event.player)?.typeId;

        if (!heldItemId) return;
        const mobId = spawnEggToMobId(heldItemId);
        if (!mobId) return;
        event.cancel = true;
        system.run(() => {
            if (heldItemId !== getMainhandItem(event.player)?.typeId) return;
            if (event.block.typeId !== BETTER_SPAWNER_ITEM_ID) return;
            if (!setBetterSpawnerStats(event.block, "mobId", mobId)) return;
            consumeMainhandItem(event.player, heldItemId);
        });
    });
}
