import { Player, system, world } from "@minecraft/server";
import { CustomForm } from "@minecraft/server-ui";
import {
    DEFAULT_MAX_COUNT,
    DEFAULT_MAX_SPAWN_DELAY,
    DEFAULT_MIN_SPAWN_DELAY,
    DEFAULT_REQUIRED_PLAYER_RANGE,
    DEFAULT_SPAWN_COUNT,
    DEFAULT_SPAWN_RANGE,
} from "../better-spawner/spawner-constants";
import { SPAWNER_MODIFIERS, SpawnerModifier } from "../better-spawner/spawner-modifiers";

const GUIDE_BOOK_ID = "better_spawners:guide_book";

/**
 * Ore UI drops U+0020 next to § codes. Join plain/colored pieces with NBSP
 * between them only — never pad the start/end of a line.
 */
const NBSP = "\u00A0";

type RichPart = string | { color: string; text: string };

function rich(...parts: RichPart[]): string {
    return parts
        .map((part, index) => {
            const text = typeof part === "string" ? part : `§${part.color}${part.text}§r`;
            return index === 0 ? text : `${NBSP}${text}`;
        })
        .join("");
}

function itemDisplayName(itemId: string): string {
    const short = itemId.includes(":") ? itemId.split(":")[1]! : itemId;
    return short
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function formatBounds(min: number | undefined, max: number | undefined): string {
    const parts: string[] = [];
    if (min !== undefined) parts.push(`min ${min}`);
    if (max !== undefined) parts.push(`max ${max}`);
    return parts.length === 0 ? "" : ` (${parts.join(", ")})`;
}

function formatModifierLine(modifier: SpawnerModifier): string {
    const item = itemDisplayName(modifier.itemId);
    const title = rich({ color: "e", text: item }, "—", { color: "a", text: modifier.displayName });

    if (modifier.kind === "boolean") {
        return `${title}\nApply to enable, sneak to disable.`;
    }

    const applySign = modifier.delta > 0 ? "+" : "";
    const reverseSign = modifier.inverseDelta > 0 ? "+" : "";
    return (
        `${title}\n` +
        `Apply: ${applySign}${modifier.delta}${formatBounds(modifier.min, modifier.max)}\n` +
        `Sneak: ${reverseSign}${modifier.inverseDelta}${formatBounds(modifier.inverseMin, modifier.inverseMax)}`
    );
}

function openPage(_player: Player, current: CustomForm, openNext: () => void): void {
    // CustomForm stays open on button click; show() another form same-tick fails.
    try {
        if (current.isShowing()) current.close();
    } catch {
        // already closed / tearing down
    }
    system.run(openNext);
}

function showGeneralPage(player: Player): void {
    const form = new CustomForm(player, { translate: "better_spawners.guide.general" })
        .label({ translate: "better_spawners.guide.general.body" })
        .divider()
        .label(
            [
                rich({ color: "a", text: "Defaults" }),
                rich("Min Spawn Delay:", { color: "7", text: String(DEFAULT_MIN_SPAWN_DELAY) }),
                rich("Max Spawn Delay:", { color: "7", text: String(DEFAULT_MAX_SPAWN_DELAY) }),
                rich("Spawn Count:", { color: "7", text: String(DEFAULT_SPAWN_COUNT) }),
                rich("Max Entities:", { color: "7", text: String(DEFAULT_MAX_COUNT) }),
                rich("Activation Range:", { color: "7", text: String(DEFAULT_REQUIRED_PLAYER_RANGE) }),
                rich("Spawn Range:", { color: "7", text: String(DEFAULT_SPAWN_RANGE) }),
            ].join("\n")
        )
        .label("\n")
        .button({ translate: "better_spawners.guide.back" }, () => {
            openPage(player, form, () => showGuideIndex(player));
        });

    form.show();
}

function showModifiersPage(player: Player): void {
    const form = new CustomForm(player, { translate: "better_spawners.guide.modifiers" }).label({
        translate: "better_spawners.guide.modifiers.intro",
    });

    for (const modifier of SPAWNER_MODIFIERS) {
        form.divider().label(formatModifierLine(modifier));
    }

    form.label("\n")
        .button({ translate: "better_spawners.guide.back" }, () => {
            openPage(player, form, () => showGuideIndex(player));
        })
        .show();
}

function showGuideIndex(player: Player): void {
    const guide = new CustomForm(player, { translate: "better_spawners.guide.title" })
        .button({ translate: "better_spawners.guide.general" }, () => {
            openPage(player, guide, () => showGeneralPage(player));
        })
        .button({ translate: "better_spawners.guide.modifiers" }, () => {
            openPage(player, guide, () => showModifiersPage(player));
        });

    guide.show();
}

export function initGuideBook(): void {
    world.afterEvents.itemUse.subscribe((event) => {
        if (event.itemStack.typeId !== GUIDE_BOOK_ID) return;
        showGuideIndex(event.source);
    });
}
