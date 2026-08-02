import { Router } from "express";
import authRoutes from "./routes/auth.js";
import workspaceRoutes from "./routes/workspaces.js";
import projectRoutes from "./routes/projects.js";
import fileRoutes from "./routes/files.js";
import billingRoutes from "./routes/billing.js";
import adminRoutes from "./routes/admin.js";
import shareRoutes from "./routes/shares.js";
import memberRoutes from "./routes/members.js";
import activityRoutes from "./routes/activity.js";

const router = Router();

// Mount modules
router.use("/auth", authRoutes);
router.use("/workspaces", workspaceRoutes);
router.use("/projects", projectRoutes);
router.use("/files", fileRoutes);
router.use("/billing", billingRoutes);
router.use("/admin", adminRoutes);
router.use("/shares", shareRoutes);
router.use("/members", memberRoutes);
router.use("/activity", activityRoutes);

// Export router
export default router;
