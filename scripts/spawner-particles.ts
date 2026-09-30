import { Dimension, system, VanillaEntityIdentifier, Vector3 } from "@minecraft/server";

const PARTICLES_EMITTER_ENTITY_ID = "better_spawners:spawner_particles_emitter";
const PARTICLES_COMPONENT_ID = "better_spawners:spawner_particles";

export function spawnSpawnerParticles(dimension: Dimension, location: Vector3): void {
    dimension.spawnEntity(PARTICLES_EMITTER_ENTITY_ID as VanillaEntityIdentifier, {
        x: location.x + 0.5,
        y: location.y + 0.5,
        z: location.z + 0.5,
    });
}

function removeSpawnerParticles(dimension: Dimension, location: Vector3): void {
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
        entity.remove();
    }
}

export function initSpawnerParticles(): void {
    system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
        blockComponentRegistry.registerCustomComponent(PARTICLES_COMPONENT_ID, {
            onPlace: (event) => {
                spawnSpawnerParticles(event.dimension, event.block.location);
            },
            onBreak: (event) => {
                removeSpawnerParticles(event.dimension, event.block.location);
            },
        });
    });
}
