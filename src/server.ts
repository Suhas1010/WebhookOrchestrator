import express from "express";
import { env } from "./config/env.js";
import pool from "./db/pool.js";
import router from "./routes/index.js";
import { requestLogger } from "./middleware/request-logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";
const app = express();
const PORT = env.PORT;

app.use(express.json());
app.use(requestLogger);
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "HookRelay",
    timestamp: new Date().toISOString(),
  });
});

app.use(router);
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`HookRelay API running at http://localhost:${PORT}`);
});
