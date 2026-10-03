import { Block } from "@minecraft/server";
import { serializers } from "../utils/serializers";

const byLocation = new Map<string, string>();

export const inferredSpawnerTypes = {
    get(block: Block): string | undefined {
        return byLocation.get(serializers.block.toString(block));
    },
    set(block: Block, typeId: string): void {
        byLocation.set(serializers.block.toString(block), typeId);
    },
};
