import tseslint from "typescript-eslint";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import nextPlugin from "@next/eslint-plugin-next";

export default tseslint.config(
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [tseslint.configs.base],
    plugins: {
      "jsx-a11y": jsxA11y,
      "react-hooks": reactHooks,
      "@next/next": nextPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      ...jsxA11y.configs.recommended.rules,
      "jsx-a11y/anchor-is-valid": "warn",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/label-has-associated-control": ["error", {
        controlComponents: ["Toggle", "AccessibleToggle"],
        assert: "either",
        depth: 3,
      }],
    },
  },
  // Tier-theme contract: dashboard surfaces must drive colour off the
  // `--tier-*` / `--visual-*` CSS variables (or HSL fragments referencing
  // them) so promoting a learner across age tiers re-skins the UI without
  // touching components. Raw 6-digit hex literals bypass this contract.
  //
  // The rule scans both string literals and template literals for a
  // standalone `#RRGGBB`. We don't ban CSS-property strings via AST shape
  // checks because the false-positive surface is too high (many pure-data
  // imports legitimately store hex). If a violation is intentional (e.g.
  // a third-party brand colour that should stay constant across tiers),
  // suppress with `// eslint-disable-next-line aivo/no-raw-hex-in-dashboard`.
  {
    files: ["src/app/dashboard/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector: "Literal[value=/#[0-9a-fA-F]{6}\\b/]",
          message:
            "Avoid raw #RRGGBB hex in dashboard files. Prefer hsl(var(--visual-*)) / var(--tier-*) so the surface re-skins per age tier. If unavoidable (e.g. third-party brand mark), add an eslint-disable comment with rationale.",
        },
        {
          selector: "TemplateElement[value.raw=/#[0-9a-fA-F]{6}\\b/]",
          message:
            "Avoid raw #RRGGBB hex in dashboard files. Prefer hsl(var(--visual-*)) / var(--tier-*) so the surface re-skins per age tier. If unavoidable (e.g. third-party brand mark), add an eslint-disable comment with rationale.",
        },
      ],
    },
  },
);
