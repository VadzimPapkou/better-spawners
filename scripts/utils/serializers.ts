import { Block, Vector3 } from "@minecraft/server";

export type SerializedBlock = {
    dimensionId: string;
    location: Vector3;
};

function blockToString(block: Block): string {
    const { x, y, z } = block.location;
    return `${block.dimension.id}:${x},${y},${z}`;
}

function blockParse(value: string): SerializedBlock {
    const match = /^(.+):(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/.exec(value);
    if (!match) {
        throw new Error(`Invalid serialized block: ${value}`);
    }
    return {
        dimensionId: match[1],
        location: {
            x: Number(match[2]),
            y: Number(match[3]),
            z: Number(match[4]),
        },
    };
}

export const serializers = {
    block: {
        toString: blockToString,
        parse: blockParse,
    },
};
