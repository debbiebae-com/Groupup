import "dotenv/config";
import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`GroupUp backend listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});