export const PARTICLES_COMPONENT_ID = "better_spawners:spawner_particles";
export const BETTER_SPAWNER_ITEM_ID = "better_spawners:mob_spawner";
/*
Sync with block's
"minecraft:tick": {
    "looping": true,
    "interval_range": [N, N]
}
*/
export const TICKS_PER_BETTER_SPAWNER_TICK = 5;
export const DEFAULT_MIN_SPAWN_DELAY = 200;
export const DEFAULT_MAX_SPAWN_DELAY = 800;
export const DEFAULT_SPAWN_RANGE = 4;
export const DEFAULT_SPAWN_COUNT = 4;
export const DEFAULT_MAX_COUNT = 6;
export const DEFAULT_REQUIRED_PLAYER_RANGE = 16;
export const SPAWNER_BREAK_XP_MIN = 15;
export const SPAWNER_BREAK_XP_MAX = 43;
export const BETTER_SPAWNER_ITEM_STATS_DP = "better_spawner:spawner_stats";

/** Transient redstone signal level (not part of silk-touch stats). */
export const REDSTONE_POWER_DP = "better_spawners:redstone_power";
