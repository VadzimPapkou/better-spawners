import { world, system } from "@minecraft/server";

world.afterEvents.playerBreakBlock.subscribe((event) => {
    const player = event.player;
    const brokenTypeId = event.brokenBlockPermutation.type.id;

    if (brokenTypeId === "minecraft:mob_spawner") {
        player.sendMessage("Spawner broken!");
    }
});

system.run(mainTick);

function mainTick() {
    system.run(mainTick);
}
