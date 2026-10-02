import { app } from "./app.js";
import { env } from "./config/env.js";

const server = app.listen(env.PORT, "127.0.0.1", () => {
  console.info(`StockSense backend listening on http://127.0.0.1:${env.PORT}`);
});

const shutdown = (signal: string) => {
  console.info(`${signal} received; stopping StockSense backend.`);
  server.close((error) => {
    if (error) {
      console.error("Backend shutdown failed", error);
      process.exitCode = 1;
    }
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

