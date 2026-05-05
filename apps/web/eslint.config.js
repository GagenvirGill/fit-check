import { reactConfig } from "../../eslint.config.base.js";
import globals from "globals";

export default [
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
