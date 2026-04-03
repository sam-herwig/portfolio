import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // --- Errors (block commits) ---
      "no-console": ["error", { allow: ["warn", "error"] }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "react-hooks/rules-of-hooks": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["three"],
              importNamePattern: "^\\*$",
              message:
                "Import specific Three.js exports (e.g., import { Vector3 } from 'three') to enable tree-shaking.",
            },
          ],
        },
      ],

      // --- Warnings (visible, non-blocking for now) ---
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "react/display-name": "warn",
    },
  },
]);

export default eslintConfig;
