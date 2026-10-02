import { Dimension, Entity, ItemStack, Vector3 } from "@minecraft/server";

/**
 * Bedrock-style item pop when a block breaks (PocketMine-MP / Bedrock protocol default).
 * Differs from Java Block.popResource (random 0.25–0.75 inside block + triangle velocity).
 */
function blockDropLocation(location: Vector3): Vector3 {
    return {
        x: location.x + 0.5,
        y: location.y + 0.5,
        z: location.z + 0.5,
    };
}

function blockDropMotion(): Vector3 {
    return {
        x: Math.random() * 0.2 - 0.1,
        y: 0.2,
        z: Math.random() * 0.2 - 0.1,
    };
}

function applyBlockDropMotion(itemEntity: Entity): void {
    const motion = blockDropMotion();
    itemEntity.clearVelocity();
    itemEntity.applyImpulse(motion);
}

function dropBlockItem(dimension: Dimension, location: Vector3, item: ItemStack): Entity {
    const entity = dimension.spawnItem(item, blockDropLocation(location));
    applyBlockDropMotion(entity);
    return entity;
}

export { dropBlockItem, blockDropLocation, blockDropMotion, applyBlockDropMotion };
