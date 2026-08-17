import "dotenv/config";
import { createServer } from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { initSocket } from "./socket/index.js";

const app = createApp();
const httpServer = createServer(app);

initSocket(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`GroupUp backend listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});