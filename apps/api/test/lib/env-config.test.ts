import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyTestEnv } from '../helpers/env.js';

let envConfig: {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  frontendUrl: string;
};
let isProduction: boolean;

void describe('lib/env-config', () => {
  void before(async () => {
    applyTestEnv();
    const mod = await import('../../lib/env-config.js');
    envConfig = mod.envConfig;
    isProduction = mod.isProduction;
  });

  void it('loads required API environment values and defaults', () => {
    assert.equal(envConfig.nodeEnv, 'development');
    assert.equal(envConfig.port, 4000);
    assert.equal(envConfig.databaseUrl, 'pgmem://fit-check-test-db');
    assert.equal(envConfig.frontendUrl, 'http://localhost:5173');
    assert.equal(isProduction, false);
  });
});
