import eslint from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  reactHooks.configs.flat.recommended,
  {
    files: ["**/*.{js,mjs,cjs}"],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "no-restricted-globals": [
        "error",
        {
          name: "localStorage",
          message: "Use the shared storage adapter from src/lib/storage.ts.",
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["date-fns-jalali"],
              message: "Import date-fns-jalali only from src/lib/date.ts.",
            },
            {
              group: ["echarts"],
              message: "Import echarts only from src/components/chart/.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='style']",
          message:
            "Use Astryx component props and design tokens instead of inline styles.",
        },
      ],
    },
  },
  {
    files: ["src/lib/storage.ts"],
    rules: {
      "no-restricted-globals": "off",
    },
  },
  {
    files: ["src/lib/date.ts"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  {
    files: ["src/components/chart/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
      },
    },
  },
);
