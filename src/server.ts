
import "dotenv/config";
import express from "express";
import pool from "./db/pool.js";
import router from "./routes/index.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "HookRelay",
    timestamp: new Date().toISOString(),
  });
});

app.use(router);

app.listen(PORT, () => {
  console.log(`HookRelay API running at http://localhost:${PORT}`);
});
