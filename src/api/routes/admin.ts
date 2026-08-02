import { Router } from "express";
import { supabaseService } from "../services/supabase.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

// Dashboard stats for the current user
router.get("/stats", async (req: any, res) => {
  try {
    // Get user's workspaces
    const { data: workspaces } = await supabaseService
      .from("workspaces")
      .select("id, storage_used_bytes")
      .eq("owner_id", req.user.id);

    const workspaceIds = (workspaces || []).map((w: any) => w.id);
    const totalStorage = (workspaces || []).reduce((acc: number, w: any) => acc + (w.storage_used_bytes || 0), 0);

    // Get projects in those workspaces
    let projectCount = 0;
    let allProjectIds: string[] = [];
    if (workspaceIds.length > 0) {
      const { data: projects, error } = await supabaseService
        .from("projects")
        .select("id")
        .in("workspace_id", workspaceIds)
        .eq("is_deleted", false);
      if (!error) {
        projectCount = (projects || []).length;
        allProjectIds = (projects || []).map((p: any) => p.id);
      }
    }

    // Also get shared projects (where user is a member)
    const { data: memberProjects } = await supabaseService
      .from("project_members")
      .select("project_id")
      .eq("user_id", req.user.id);

    const sharedProjectIds = (memberProjects || []).map((m: any) => m.project_id);
    const allIds = [...new Set([...allProjectIds, ...sharedProjectIds])];

    // Get file count and total size
    let totalFiles = 0;
    let totalFileBytes = 0;
    if (allIds.length > 0) {
      const { data: files } = await supabaseService
        .from("files")
        .select("size_bytes")
        .in("project_id", allIds);
      totalFiles = (files || []).length;
      totalFileBytes = (files || []).reduce((acc: number, f: any) => acc + (f.size_bytes || 0), 0);
    }

    // Get favorite projects count
    let favoriteProjects = 0;
    if (allIds.length > 0) {
      const { count } = await supabaseService
        .from("projects")
        .select("*", { count: "exact", head: true })
        .in("id", allIds)
        .eq("is_favorite", true)
        .eq("is_deleted", false);
      favoriteProjects = count || 0;
    }

    // Get favorite workspaces count
    let favoriteWorkspaces = 0;
    if (workspaceIds.length > 0) {
      const { count } = await supabaseService
        .from("workspaces")
        .select("*", { count: "exact", head: true })
        .in("id", workspaceIds)
        .eq("is_favorite", true)
        .neq("status", "archived");
      favoriteWorkspaces = count || 0;
    }

    // Get recent activity count
    let activityCount = 0;
    if (allIds.length > 0) {
      const { count } = await supabaseService
        .from("activity_logs")
        .select("*", { count: "exact", head: true })
        .in("project_id", allIds);
      activityCount = count || 0;
    }

    // Get total members across all projects
    let totalMembers = 0;
    if (allIds.length > 0) {
      const { count } = await supabaseService
        .from("project_members")
        .select("*", { count: "exact", head: true })
        .in("project_id", allIds);
      totalMembers = count || 0;
    }

    // Get active shares count
    let activeShares = 0;
    if (allIds.length > 0) {
      const { count } = await supabaseService
        .from("shares")
        .select("*", { count: "exact", head: true })
        .in("project_id", allIds);
      activeShares = count || 0;
    }

    res.json({
      success: true,
      stats: {
        total_workspaces: (workspaces || []).length,
        active_workspaces: (workspaces || []).filter((w: any) => w.status !== "archived").length,
        total_projects: projectCount,
        shared_projects: sharedProjectIds.length,
        total_files: totalFiles,
        storage_used_bytes: totalStorage + totalFileBytes,
        favorite_projects: favoriteProjects,
        favorite_workspaces: favoriteWorkspaces,
        recent_activity: activityCount,
        total_members: totalMembers,
        active_shares: activeShares,
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
