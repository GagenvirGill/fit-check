import { baseConfig } from '../../eslint.config.base.js';

export default [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },
];
