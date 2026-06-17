import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  // Rules dasar Next.js + React + React Hooks, plus upgrade rule yang
  // berdampak ke Core Web Vitals dari warning jadi error.
  ...nextCoreWebVitals,

  // Rules tambahan khusus TypeScript (typescript-eslint).
  ...nextTypescript,

  {
    rules: {
      // Contoh override — sesuaikan dengan preferensi tim.
      // "react/no-unescaped-entities": "off",
      // "@next/next/no-page-custom-font": "off",
    },
  },

  // Override default ignores dari eslint-config-next supaya folder
  // build/output project nggak ikut di-lint.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
  ]),
]);

export default eslintConfig;
