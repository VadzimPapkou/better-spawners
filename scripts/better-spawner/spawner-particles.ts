import { Block, Dimension, DimensionTypes, system, Vector3, world } from "@minecraft/server";
import { BETTER_SPAWNER_ITEM_ID } from "./spawner-constants";

const PARTICLES_EMITTER_ENTITY_ID = "better_spawners:spawner_particles_emitter";
/** Diamond-blue glitter burst on vanilla → better spawner conversion. */
const CONVERSION_PARTICLE = "better_spawners:spawner_conversion_sparkle";
const CONVERSION_SOUND = "firework.twinkle";
/** 30s between orphan particle sweeps. */
const ORPHAN_PARTICLES_CLEANUP_INTERVAL_TICKS = 600;
/** Match onBreak grace so ambient FX can finish fading. */
const ORPHAN_PARTICLES_REMOVE_DELAY_TICKS = 40;

function getSpawnerParticlesEmitter(dimension: Dimension, location: Vector3) {
    const center = {
        x: location.x + 0.5,
        y: location.y + 0.5,
        z: location.z + 0.5,
    };
    for (const entity of dimension.getEntities({
        type: PARTICLES_EMITTER_ENTITY_ID,
        location: center,
        maxDistance: 0.75,
        closest: 1,
    })) {
        return entity;
    }
    return undefined;
}

export function spawnSpawnerParticles(dimension: Dimension, location: Vector3): void {
    dimension.spawnEntity(PARTICLES_EMITTER_ENTITY_ID, {
        x: location.x + 0.5,
        y: location.y + 0.5,
        z: location.z + 0.5,
    });
}

/** Diamond-blue glitter burst when a vanilla spawner is converted. */
export function playSpawnerConversionParticles(dimension: Dimension, location: Vector3): void {
    const center = {
        x: location.x + 0.5,
        y: location.y + 0.5,
        z: location.z + 0.5,
    };
    dimension.spawnParticle(CONVERSION_PARTICLE, center);
    dimension.playSound(CONVERSION_SOUND, center);
}

/** Drives client animation controller via mark_variant (1 = ambient particles, 0 = idle). */
export function setSpawnerParticlesActive(dimension: Dimension, location: Vector3, active: boolean): void {
    const emitter = getSpawnerParticlesEmitter(dimension, location);
    if (!emitter) return;
    emitter.triggerEvent(active ? "better_spawners:has_player_in_range" : "better_spawners:no_player_in_range");
}

export function removeSpawnerParticles(dimension: Dimension, location: Vector3): void {
    getSpawnerParticlesEmitter(dimension, location)?.remove();
}

/** Periodically remove particle emitters that no longer sit inside a better spawner block. */
export function initOrphanSpawnerParticlesCleanup(): void {
    system.runInterval(() => {
        for (const dimensionType of DimensionTypes.getAll()) {
            const dimension = world.getDimension(dimensionType.typeId);
            for (const entity of dimension.getEntities({ type: PARTICLES_EMITTER_ENTITY_ID })) {
                const blockLocation = {
                    x: Math.floor(entity.location.x),
                    y: Math.floor(entity.location.y),
                    z: Math.floor(entity.location.z),
                };
                let block: Block | undefined;
                try {
                    block = dimension.getBlock(blockLocation);
                } catch {
                    continue;
                }
                if (block?.typeId === BETTER_SPAWNER_ITEM_ID) continue;

                entity.triggerEvent("better_spawners:no_player_in_range");
                system.runTimeout(() => {
                    if (entity.isValid) entity.remove();
                }, ORPHAN_PARTICLES_REMOVE_DELAY_TICKS);
            }
        }
    }, ORPHAN_PARTICLES_CLEANUP_INTERVAL_TICKS);
}
