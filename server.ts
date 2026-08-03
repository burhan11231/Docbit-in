import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import apiRouter from "./src/api/index.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use("/api", apiRouter);

  // Health check for infrastructure
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString(), service: "DocBit Backend Phase 1" });
  });

  // Vite middleware for development (serves React frontend later)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      root: process.cwd(),
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[DocBit] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
