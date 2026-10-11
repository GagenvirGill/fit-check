import { createApp } from "./app";
import { env } from "./lib/get-env";

const app = createApp();

app.listen(env.port, env.host, () => {
  process.stdout.write(`API listening on ${env.host}:${env.port}\n`);
});
