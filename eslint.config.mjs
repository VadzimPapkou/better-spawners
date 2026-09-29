import minecraftLinting from "eslint-plugin-minecraft-linting";
import tsParser from "@typescript-eslint/parser";

export default [
    {
        files: ["scripts/**/*.ts"],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 2021,
        },
        plugins: {
            "minecraft-linting": minecraftLinting,
        },
        rules: {
            "minecraft-linting/avoid-unnecessary-command": "error",
        },
    },
];
