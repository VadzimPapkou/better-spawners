# Todo

- [x] persist better spawner block DP on break into ItemStack, and from ItemStack into Block DP on place
- [x] make spawn eggs work: click better spawner -> change type
- [x] sync spawner active/inactive block state with particles; keep particles from vanishing instantly when the spawner is broken
- [x] fix mob egg -> entity type -> spawner type mapping; some mobs need overrides (e.g. evoker)
- [x] add periodic cleanup of orphan spawner particle entities
- [ ] spin the mob inside the spawner (render controller -> pick the right vanilla mob geo)
- [x] allow upgrading / configuring upgraded spawners (custom JSON UI server form)
- [ ] add comparator upgrade so the spawner responds to redstone signal
- [ ] invent a way to obtain spawn eggs (maybe Capturing enchant — then how to obtain it, maybe hook vanilla enchant), or a custom nice item like a Reaper's Scythe
