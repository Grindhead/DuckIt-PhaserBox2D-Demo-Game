import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginImport from "eslint-plugin-import";
// import airbnb from 'eslint-config-airbnb-base'; // Airbnb doesn't directly support flat config yet

// Note: Airbnb config isn't directly compatible with the new flat config format yet.
// We'll use the recommended rules and manually add some Airbnb-like import rules for now.
// We can switch to the official Airbnb flat config once available.

export default [
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Airbnb-like import rules (subset)
    plugins: {
      import: pluginImport,
    },
    rules: {
      "import/no-unresolved": "error",
      "import/named": "error",
      "import/namespace": "error",
      "import/default": "error",
      "import/export": "error",
      "import/order": [
        "error",
        {
          groups: [
            ["builtin", "external"],
            "internal",
            ["parent", "sibling", "index"],
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "import/no-duplicates": "error",
      // Add other specific Airbnb rules here if desired, checking compatibility with TS/ESLint v9+
      // Example: 'no-console': 'warn',
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
    },
    settings: {
      "import/resolver": {
        typescript: true,
        node: true,
      },
    },
  },
  {
    ignores: ["dist/", "node_modules/", "vite.config.ts", "eslint.config.js"],
  },
];
