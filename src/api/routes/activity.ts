import { Router } from "express";
import { supabaseService } from "../services/supabase.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

// Get activity logs for a project
router.get("/project/:projectId", async (req: any, res) => {
  try {
    const { projectId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const { data, error } = await supabaseService
      .from("activity_logs")
      .select("*, profiles!activity_logs_user_id_fkey(id, email, full_name, avatar_url)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) throw error;
    res.json({ activities: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get activity logs for a workspace
router.get("/workspace/:workspaceId", async (req: any, res) => {
  try {
    const { workspaceId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const { data, error } = await supabaseService
      .from("activity_logs")
      .select("*, profiles!activity_logs_user_id_fkey(id, email, full_name, avatar_url)")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) throw error;
    res.json({ activities: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get recent activity for the current user across all projects
router.get("/me", async (req: any, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get all workspaces for the user
    const { data: workspaces } = await supabaseService
      .from("workspaces")
      .select("id")
      .eq("owner_id", req.user.id);

    const workspaceIds = (workspaces || []).map((w: any) => w.id);

    // Get all projects for those workspaces
    let projectIds: string[] = [];
    if (workspaceIds.length > 0) {
      const { data: projects } = await supabaseService
        .from("projects")
        .select("id")
        .in("workspace_id", workspaceIds);
      projectIds = (projects || []).map((p: any) => p.id);
    }

    // Also get projects where user is a member
    const { data: memberProjects } = await supabaseService
      .from("project_members")
      .select("project_id")
      .eq("user_id", req.user.id);

    const allProjectIds = [...new Set([...projectIds, ...(memberProjects || []).map((m: any) => m.project_id)])];

    if (allProjectIds.length === 0) return res.json({ activities: [] });

    const { data, error } = await supabaseService
      .from("activity_logs")
      .select("*, profiles!activity_logs_user_id_fkey(id, email, full_name, avatar_url), projects(id, name)")
      .in("project_id", allProjectIds)
      .order("created_at", { ascending: false })
      .limit(Number(limit));

    if (error) throw error;
    res.json({ activities: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Log a new activity
router.post("/", async (req: any, res) => {
  try {
    const { project_id, workspace_id, action, metadata } = req.body;
    const { data, error } = await supabaseService
      .from("activity_logs")
      .insert({
        user_id: req.user.id,
        project_id,
        workspace_id,
        action,
        metadata,
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, activity: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
