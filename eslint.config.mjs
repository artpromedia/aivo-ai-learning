import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/coverage/**",
      "**/.venv/**",
      "**/*.config.{js,mjs,ts}",
      "**/vitest.setup.ts",
      "**/lighthouserc.js",
      "**/scripts/**",
      "apps/web/**",
      "apps/mobile/**",
      "services/**",
      "packages/db/**",
      "packages/events/**",
    ],
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
);
