import { Block } from "@minecraft/server";

const byLocation = new Map<string, string>();

function keyOf(block: Block): string {
    const { x, y, z } = block.location;
    return `${block.dimension.id}:${x},${y},${z}`;
}

export const inferredSpawnerTypes = {
    get(block: Block): string | undefined {
        return byLocation.get(keyOf(block));
    },
    set(block: Block, typeId: string): void {
        byLocation.set(keyOf(block), typeId);
    },
};
