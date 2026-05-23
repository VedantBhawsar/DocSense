import express from "express";
import { PORT } from "./config/env.js";

export const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "server is running...",
  });
});

export function startServer() {
  app.listen(PORT, () => {
    console.log(`Server running on PORT:${PORT}`);
  });
}
