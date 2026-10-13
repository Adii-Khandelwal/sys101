import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const config = [
  { ignores: [".next*/**", "public/pagefind/**", "node_modules/**", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // A leading underscore, or a sibling of a rest element, marks a value dropped on purpose.
  { rules: { "@typescript-eslint/no-unused-vars": ["warn", { varsIgnorePattern: "^_", ignoreRestSiblings: true }] } },
];

export default config;
