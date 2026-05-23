import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // shadcn/ui auto-generated — never hand-edited per project conventions
    "components/ui/**",
    // shadcn hook — auto-generated, not hand-edited
    "hooks/use-mobile.ts",
    // Claude Code user-level skills — not project source
    ".claude/**",
  ]),
]);

export default eslintConfig;
