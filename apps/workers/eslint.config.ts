import { baseConfig } from '../../eslint.config.base.ts';

export default [
  {
    ignores: ['eslint.config.ts'],
  },
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },
];
