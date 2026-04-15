import tseslint from "typescript-eslint";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default tseslint.config(
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [tseslint.configs.base],
    plugins: {
      "jsx-a11y": jsxA11y,
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
);
