import { VanillaEntityIdentifier, world } from "@minecraft/server";

const CUSTOM_SPAWNER_ID = "better_spawners:mob_spawner";
const PARTICLES_EMITTER_ENTITY_ID = "better_spawners:spawner_particles_emitter";

export function initSpawnerParticles(): void {
    world.afterEvents.playerPlaceBlock.subscribe((event) => {
        if (event.block.typeId !== CUSTOM_SPAWNER_ID) return;
        event.dimension.spawnEntity(PARTICLES_EMITTER_ENTITY_ID as VanillaEntityIdentifier, {
            x: event.block.location.x + 0.5,
            y: event.block.location.y + 0.5,
            z: event.block.location.z + 0.5,
        });
    });

    world.afterEvents.playerBreakBlock.subscribe((event) => {
        if (event.brokenBlockPermutation.type.id !== CUSTOM_SPAWNER_ID) return;
        const center = {
            x: event.block.location.x + 0.5,
            y: event.block.location.y + 0.5,
            z: event.block.location.z + 0.5,
        };
        for (const entity of event.dimension.getEntities({
            type: PARTICLES_EMITTER_ENTITY_ID,
            location: center,
            maxDistance: 0.75,
            closest: 1,
        })) {
            entity.remove();
        }
    });
}
