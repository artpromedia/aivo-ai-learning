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
  // touching components. Raw hex literals — both `#RRGGBB` and the
  // `#RRGGBBAA` alpha-channel form — bypass this contract.
  //
  // The rule scans both string literals and template literals. We don't
  // ban CSS-property strings via AST shape checks because the false-
  // positive surface is too high (many pure-data imports legitimately
  // store hex). If a violation is intentional (e.g. a third-party brand
  // colour that should stay constant across tiers), suppress with
  // `// eslint-disable-next-line no-restricted-syntax` and a rationale.
  {
    files: ["src/app/dashboard/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          // {6} matches #RRGGBB, {8} matches #RRGGBBAA. The negative
          // lookahead on `[0-9a-fA-F]` after the {6,8} run prevents
          // false matches against e.g. 10+ char hex hashes / IDs.
          selector: "Literal[value=/#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?(?![0-9a-fA-F])/]",
          message:
            "Avoid raw #RRGGBB/#RRGGBBAA hex in dashboard files. Prefer hsl(var(--visual-*)) / var(--tier-*) so the surface re-skins per age tier. If unavoidable (e.g. third-party brand mark), add an eslint-disable comment with rationale.",
        },
        {
          selector: "TemplateElement[value.raw=/#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?(?![0-9a-fA-F])/]",
          message:
            "Avoid raw #RRGGBB/#RRGGBBAA hex in dashboard files. Prefer hsl(var(--visual-*)) / var(--tier-*) so the surface re-skins per age tier. If unavoidable (e.g. third-party brand mark), add an eslint-disable comment with rationale.",
        },
      ],
    },
  },
);
