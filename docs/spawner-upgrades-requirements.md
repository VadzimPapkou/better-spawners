# Spawner upgrades — requirements

Inspired by [Apothic Spawners](https://github.com/Shadows-of-Fire/Apothic-Spawners) (Apotheosis spawner module), adapted for Minecraft Bedrock and this addon.

## Goal

Players can pick up, move, retype, and upgrade mob spawners with vanilla items so farms become tunable machines instead of static dungeon blocks.

## Current state (baseline)

Already in the pack:

- Silk Touch pickup of `minecraft:mob_spawner`
- Infer mob type from first nearby spawn
- Convert vanilla spawner → `better_spawners:mob_spawner` (diamond, after type known)
- Custom block with `block_entity` + `dynamic_properties`
- Ambient particles on custom spawners

Upgrades apply only to **custom** spawners (`better_spawners:mob_spawner`). Vanilla spawners stay convert-only until upgraded path exists.

## Platform constraints (Bedrock)

Vanilla Bedrock spawners cannot be freely NBT-edited like Java. Custom spawners must drive spawning via Script API (timer + `spawnEntity` / equivalent), reading stats from block dynamic properties.

Implications:

- Upgrade stats live on the custom block (dynamic properties), not on vanilla spawner NBT
- Placing a dropped custom spawner item must restore saved stats + mob type
- Silk Touch / break/place must preserve upgrade state
- Some Apothic flags map cleanly; others need Bedrock-specific approximations (see Out of scope / approximations)

---

## Functional requirements

### 1. Spawner lifecycle

| ID  | Requirement                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------ |
| L1  | Custom spawner stores: mob type, all numeric stats, all boolean/flag stats                             |
| L2  | Breaking a custom spawner with Silk Touch drops an item that retains full state                        |
| L3  | Placing that item restores the same state at the new location                                          |
| L4  | Without Silk Touch, custom spawner drops nothing useful (or XP only — match current loot table policy) |
| L5  | Converted spawners start with **vanilla-equivalent defaults** (see Defaults)                           |

### 2. Changing mob type

| ID  | Requirement                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------- |
| T1  | Right-click custom spawner with a spawn egg → set mob type to that egg’s entity; consume egg (Survival) |
| T2  | Invalid / unsupported eggs are rejected with a clear message                                            |
| T3  | Optional later: Capturing-like way to obtain eggs (see Phase 2)                                         |

### 3. Applying modifiers

| ID  | Requirement                                                                                                                                          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1  | Right-click custom spawner with a modifier item in main hand to apply the matching upgrade                                                           |
| M2  | On success: consume 1 item (Survival), play feedback (sound + short message and/or actionbar)                                                        |
| M3  | If already at min/max for that stat (or flag already set), do not consume; tell the player why                                                       |
| M4  | Hold **Nether Quartz** in off-hand while applying a modifier to **reverse** the numeric change (or unset a boolean flag). Quartz is **not** consumed |
| M5  | Reverse is blocked at the opposite bound (same no-consume + message rule)                                                                            |
| M6  | Boolean/flag modifiers toggle or set once; reverse with quartz clears the flag                                                                       |

### 4. Stats — numeric (vanilla-like)

Defaults match vanilla dungeon spawners where applicable.

| Stat                           | Default | Step (apply) | Step (reverse) | Cap                                               | Modifier item        |
| ------------------------------ | ------- | ------------ | -------------- | ------------------------------------------------- | -------------------- |
| Min spawn delay (ticks)        | 200     | −10          | +10            | min **20**                                        | Sugar                |
| Max spawn delay (ticks)        | 800     | −20          | +20            | min **20**; must stay ≥ min delay                 | Clock                |
| Spawn count                    | 4       | +2           | −2             | max **16**                                        | Fermented spider eye |
| Max nearby entities            | 6       | +2           | −2             | max **32**                                        | Ghast tear           |
| Required player range (blocks) | 16      | +4           | −4             | max **48**; **0** allowed only via Ignore Players | Prismarine crystals  |
| Spawn range (blocks)           | 4       | +2           | −2             | max **32**                                        | Piston               |

Rules:

- After any change, enforce `min_spawn_delay ≤ max_spawn_delay`
- “Nearby” for max entities = same spawn type within spawn range (or a fixed check radius documented in implementation)

### 5. Stats — advanced (Apothic-like)

| Stat              | Type        | Default | Modifier item     | Behavior                                                                           |
| ----------------- | ----------- | ------- | ----------------- | ---------------------------------------------------------------------------------- |
| Initial health    | % of max HP | 100%    | Pointed dripstone | −5% per apply; floor **20%**; reverse +5% up to 100%                               |
| Ignore players    | bool        | false   | Nether star       | Spawner runs with no player in range                                               |
| Ignore light      | bool        | false   | Soul lantern      | Ignore light-level spawn checks                                                    |
| Ignore conditions | bool        | false   | Conduit           | Ignore remaining spawn condition checks (biome/space/etc. as implemented)          |
| Redstone control  | bool        | false   | Comparator        | When true, spawner active only with redstone signal                                |
| No AI             | bool        | false   | Chorus fruit      | Spawned mobs get no AI (still affected by gravity / knockback if engine allows)    |
| Silent            | bool        | false   | Any wool          | Spawned mobs make no sound                                                         |
| Youthful          | bool        | false   | Turtle egg        | Prefer baby form when the entity supports it                                       |
| Burning           | bool        | false   | Campfire          | Spawn mobs on fire                                                                 |
| Echoing           | int 0–3     | 0       | Echo shard        | +1 level per apply; on death, extra loot rolls ≈ level (exact formula TBD in impl) |

### 6. Spawning behavior

| ID  | Requirement                                                                                                             |
| --- | ----------------------------------------------------------------------------------------------------------------------- |
| S1  | Custom spawner only spawns its stored mob type                                                                          |
| S2  | Delay between attempts is random in `[min_spawn_delay, max_spawn_delay]`                                                |
| S3  | Each successful attempt tries up to `spawn_count` entities (or spawns that many if space allows — document chosen rule) |
| S4  | Skip spawning while count of same-type entities in range ≥ `max_nearby_entities`                                        |
| S5  | Unless Ignore players: require a player within `required_player_range`                                                  |
| S6  | Unless Ignore light / Ignore conditions: apply the corresponding checks                                                 |
| S7  | Redstone control: if enabled and unpowered, do not spawn                                                                |
| S8  | Apply Initial health, No AI, Silent, Youthful, Burning, Echoing to each spawned entity                                  |

### 7. Player feedback / UX

| ID  | Requirement                                                                                                     |
| --- | --------------------------------------------------------------------------------------------------------------- |
| U1  | After convert or successful upgrade, show current key stats (chat, actionbar, or form — pick one consistent UI) |
| U2  | Empty-hand interact (or dedicated “inspect” item) shows a readable summary of all stats                         |
| U3  | Messages use clear success / fail / at-cap wording                                                              |
| U4  | Optional: particle/sound cue distinct from vanilla use                                                          |

### 8. Persistence & multiplayer

| ID  | Requirement                                                      |
| --- | ---------------------------------------------------------------- |
| P1  | Stats survive world save/reload                                  |
| P2  | Stats survive chunk unload/reload                                |
| P3  | Works in multiplayer for all players with permission to interact |

---

## Non-goals (v1)

- Full Java Apothic recipe JSON datapack parity (two-item recipes beyond main+quartz)
- GUI screens with hover tooltips like Java JEI/Apothic UI
- Capturing enchantment (Phase 2)
- Upgrading still-vanilla `minecraft:mob_spawner` without conversion
- Configurable datapack/JSON modifier table (hardcode v1; data-drive later)
- Cross-mod / marketplace economy balance beyond sensible survival cost of vanilla items

---

## Phased delivery

### Phase 1 — core upgrades

1. Persist stats on custom spawner + item (break/place)
2. Script-driven spawn loop honoring numeric stats + player range + max nearby
3. Modifier apply/reverse for all numeric stats
4. Inspect summary on interact
5. Spawn egg type change

### Phase 2 — advanced flags

1. Boolean/flag modifiers (Ignore players, light, conditions, redstone, No AI, Silent, Youthful, Burning)
2. Initial health + Echoing
3. Redstone power detection for controlled spawners

### Phase 3 — acquisition & polish

1. Capturing-like egg drop (enchantment or process suitable for Bedrock)
2. Balance pass on steps/caps
3. Optional config / data-driven modifier table
4. Better inspect UI (form) if chat noise is too high

---

## Acceptance criteria (Phase 1)

- [ ] Converted custom spawner spawns its inferred type on a delay matching defaults
- [ ] Sugar / clock / fermented spider eye / ghast tear / prismarine crystals / piston each change the matching stat within caps
- [ ] Quartz in off-hand reverses the last applied direction for that modifier
- [ ] At-cap attempts do not consume items
- [ ] Silk Touch pick up + place keeps mob type and upgraded stats
- [ ] Spawn egg changes type and is consumed in Survival
- [ ] Inspect shows accurate current values

## Acceptance criteria (Phase 2)

- [ ] Each advanced modifier sets/clears as specified
- [ ] Ignore players: farm runs with player far away / in another dimension chunk still loaded as applicable
- [ ] Redstone control: lever/torch reliably gates spawning
- [ ] No AI / Silent / Youthful / Burning / Initial health visibly affect spawned mobs
- [ ] Echoing increases loot across multiple kills in a measurable way

---

## Open questions

1. Exact spawn placement algorithm (surface checks, collision, water/lava) — how close to vanilla?
2. Echoing loot formula (full extra roll per level vs. chance-based)?
3. Should Ignore conditions imply Ignore light, or remain independent?
4. Creative mode: consume modifiers or not? (Propose: do not consume, same as current diamond convert.)
5. Durability tax on Silk Touch pickaxe when mining spawners (Apothic does this) — want it on Bedrock?

---

## Reference — Apothic behavior we mirror

Source: [Apothic Spawners README](https://github.com/Shadows-of-Fire/Apothic-Spawners) and common pack wikis.

- Pick up spawners with Silk Touch; keep properties
- Right-click modifiers with vanilla items; caps per stat
- Off-hand quartz reverses numeric/flag changes without consuming quartz
- Spawn eggs change spawner type
- Capturing (Phase 3) for egg acquisition

Item ↔ stat mapping above follows the common Apothic defaults (sugar/clock/etc.); adjust only via the open questions / balance pass, not ad hoc in code without updating this doc.
