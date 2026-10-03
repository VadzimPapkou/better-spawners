import { BlockPermutation, GameMode, ItemStack, system, world } from "@minecraft/server";
import { MinecraftBlockTypes } from "@minecraft/vanilla-data";
import { randomInteger } from "../utils/random-integer";
import {
    PARTICLES_COMPONENT_ID,
    removeSpawnerParticles,
    spawnMobs,
    spawnSpawnerParticles,
    getBetterSpawnerDp,
    setBetterSpawnerDp,
    TICKS_PER_BETTER_SPAWNER_TICK,
    BETTER_SPAWNER_ITEM_ID,
} from "./better-spawner-utils";
import { hasSilkTouch } from "../utils/has-silk-touch";
import { dropBlockItem } from "../utils/drop-block-item";
import { dropBlockExperience } from "../utils/drop-block-experience";
import { getMainhandItem } from "../utils/get-mainhand-item";
import { consumeMainhandItem } from "../utils/consume-mainhand-item";
import { spawnEggToMobId } from "../utils/spawn-egg-to-mob-id";

/** Vanilla monster spawner XP when broken with a pickaxe (no Silk Touch). */
const SPAWNER_BREAK_XP_MIN = 15;
const SPAWNER_BREAK_XP_MAX = 43;

export function initBetterSpawner(): void {
    system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
        blockComponentRegistry.registerCustomComponent(PARTICLES_COMPONENT_ID, {
            onPlace: (event) => {
                spawnSpawnerParticles(event.dimension, event.block.location);
            },
            onBreak: (event) => {
                removeSpawnerParticles(event.dimension, event.block.location);
            },
            onTick: (event) => {
                const spawnerBlock = event.block;
                const center = {
                    x: spawnerBlock.location.x + 0.5,
                    y: spawnerBlock.location.y + 0.5,
                    z: spawnerBlock.location.z + 0.5,
                };
                const players = spawnerBlock.dimension.getPlayers({ location: center, maxDistance: 16 });
                if (players.length === 0) return;

                const spawnerDp = getBetterSpawnerDp(spawnerBlock);
                if (!spawnerDp.mobId) return;

                const beforeNextSpawnTicks = spawnerDp.beforeNextSpawnTicks
                    ? spawnerDp.beforeNextSpawnTicks - TICKS_PER_BETTER_SPAWNER_TICK
                    : 0;
                if (beforeNextSpawnTicks <= 0) {
                    spawnMobs(
                        event.block,
                        spawnerDp.mobId,
                        spawnerDp.spawnCount,
                        spawnerDp.maxCount,
                        spawnerDp.spawnRange
                    );
                    setBetterSpawnerDp(
                        spawnerBlock,
                        "beforeNextSpawnTicks",
                        randomInteger(spawnerDp.minSpawnDelay, spawnerDp.maxSpawnDelay)
                    );
                } else {
                    setBetterSpawnerDp(spawnerBlock, "beforeNextSpawnTicks", beforeNextSpawnTicks);
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
            event.block.setPermutation(BlockPermutation.resolve(MinecraftBlockTypes.Air));
            dropBlockItem(event.dimension, event.block.location, new ItemStack(BETTER_SPAWNER_ITEM_ID));
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
            if (!setBetterSpawnerDp(event.block, "mobId", mobId)) return;
            consumeMainhandItem(event.player, heldItemId);
        });
    });
}
