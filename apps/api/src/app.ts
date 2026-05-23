import express from "express";
import cors from "cors";
import { PORT } from "./config/env.js";
import { apiRouter } from "./routes/index.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

export const app = express();

const corsOptions = {
  origin: process.env["CORS_ORIGIN"] ?? "http://localhost:3000",
  credentials: true,
}

app.options("/{*path}", cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/", (_req, res) => {
  res.status(200).json({ message: "server is running..." });
});

app.use("/api/v1", apiRouter);
app.use(errorMiddleware);

export function startServer() {
  app.listen(PORT, () => {
    console.log(`Server running on PORT:${PORT}`);
  });
}
