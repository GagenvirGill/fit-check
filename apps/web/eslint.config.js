import { reactConfig } from "../../eslint.config.base.js";

export default [
  ...reactConfig,
  {
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
];
