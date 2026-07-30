import { createApp } from "./app";
import { env } from "./lib/get-env";

const app = createApp();

app.listen(env.port, () => {
  process.stdout.write(`API listening on port ${env.port}\n`);
});
