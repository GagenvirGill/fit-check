import { createApp } from './app';
import { envConfig } from './lib/env-config';

const start = async () => {
  const app = await createApp();
  try {
    await app.listen({ port: envConfig.port, host: '0.0.0.0' });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

await start();
