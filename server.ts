import express from "express";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import apiRouter from "./src/api/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  // Catch unmatched API routes before Vite middleware so they return JSON, not HTML
  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // Vite middleware for development (serves React frontend later)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      root: __dirname,
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('/api/*', (req, res) => {
      res.status(404).json({ error: 'Not found' });
    });
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[DocBit] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
