import { createRequire } from "node:module";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const require = createRequire(import.meta.url);
try {
  const { FileContext } = require("eslint/lib/linter/file-context.js");
  if (FileContext && !FileContext.prototype.getFilename) {
    FileContext.prototype.getFilename = function () {
      return this.filename;
    };
    FileContext.prototype.getSourceCode = function () {
      return this.sourceCode;
    };
    FileContext.prototype.getCwd = function () {
      return this.cwd;
    };
    FileContext.prototype.getPhysicalFilename = function () {
      return this.physicalFilename;
    };
  }
} catch {
  // ignored
}

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    settings: {
      react: {
        version: "19.2.0",
      },
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
