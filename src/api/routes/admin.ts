import { Router } from "express";
import { posthog } from "../services/analytics.js";

const router = Router();

// Admin Dashboard stats
router.get("/stats", async (req, res) => {
  try {
    // Mocked admin stats representing PostgreSQL aggregations
    res.json({
      success: true,
      stats: {
        total_users: 1250,
        active_workspaces: 800,
        total_projects: 3420,
        storage_used_gb: 450,
        mrr_inr: 450000
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
