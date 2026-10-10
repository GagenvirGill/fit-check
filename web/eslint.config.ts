import { reactConfig } from "../../eslint.config.base.ts";
import globals from "globals";

export default [
  {
    ignores: ["eslint.config.ts"],
  },
  ...reactConfig,
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
];
