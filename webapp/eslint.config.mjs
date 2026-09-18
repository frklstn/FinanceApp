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
    // Set versi React eksplisit. Tanpa ini, eslint-plugin-react mendeteksi versi
    // dengan memanggil context.getFilename() yang sudah dihapus di ESLint 9/10,
    // sehingga lint crash ("contextOrFilename.getFilename is not a function").
    // Menyetel versi membuat plugin melewati deteksi itu -> jalan di ESLint 10.
    settings: {
      react: { version: "19.2" },
    },
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
    "scripts/**",
  ]),
]);

export default eslintConfig;
