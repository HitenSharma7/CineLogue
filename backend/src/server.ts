
import { env } from "./config/env";
import app from "./app";
import type { Server } from "node:http";

const server: Server = app.listen(
  env.PORT,
  "0.0.0.0",
  () => {
    console.log(
      `Server running on 0.0.0.0:${env.PORT} (${env.NODE_ENV})`,
    );
  },
);

server.on("error", (error: NodeJS.ErrnoException) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
