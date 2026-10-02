import { Dimension, Entity, Vector3 } from "@minecraft/server";
import { MinecraftEntityTypes } from "@minecraft/vanilla-data";

/**
 * Bedrock / PocketMine World::dropExperience pop when a block breaks.
 * Position: block center. Motion: (±0.2 horizontal, 0–0.4 up).
 */
function experienceOrbDropLocation(location: Vector3): Vector3 {
    return {
        x: location.x + 0.5,
        y: location.y + 0.5,
        z: location.z + 0.5,
    };
}

function experienceOrbDropMotion(): Vector3 {
    return {
        x: (Math.random() * 0.2 - 0.1) * 2,
        y: Math.random() * 0.4,
        z: (Math.random() * 0.2 - 0.1) * 2,
    };
}

function applyExperienceOrbDropMotion(orb: Entity): void {
    const motion = experienceOrbDropMotion();
    orb.clearVelocity();
    orb.applyImpulse(motion);
}

/**
 * Spawns experience as 1-XP orbs (stable Script API has no orb value setter).
 * Scatter matches Bedrock protocol / PocketMine dropExperience.
 */
function dropBlockExperience(dimension: Dimension, location: Vector3, amount: number): Entity[] {
    const orbs: Entity[] = [];
    const center = experienceOrbDropLocation(location);
    const count = Math.max(0, Math.floor(amount));

    for (let i = 0; i < count; i++) {
        const orb = dimension.spawnEntity(MinecraftEntityTypes.XpOrb, center);
        applyExperienceOrbDropMotion(orb);
        orbs.push(orb);
    }

    return orbs;
}

export { dropBlockExperience, experienceOrbDropLocation, experienceOrbDropMotion, applyExperienceOrbDropMotion };
