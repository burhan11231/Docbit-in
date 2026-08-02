import { Router } from "express";
import { supabaseService } from "../services/supabase.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

// Get Projects in a Workspace (with file count)
router.get("/workspace/:workspaceId", async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { data: projects, error } = await supabaseService
      .from("projects")
      .select("*")
      .eq("workspace_id", workspaceId);

    if (error) throw error;

    // Fetch file counts for each project
    const projectsWithCounts = await Promise.all(
      (projects || []).map(async (p: any) => {
        const { count } = await supabaseService
          .from("files")
          .select("*", { count: "exact", head: true })
          .eq("project_id", p.id);
        return { ...p, files: [{ count: count || 0 }] };
      })
    );

    res.json({ projects: projectsWithCounts });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get all projects across all workspaces for the current user
router.get("/all/me", async (req: any, res) => {
  try {
    // Get user's workspaces
    const { data: workspaces } = await supabaseService
      .from("workspaces")
      .select("id")
      .eq("owner_id", req.user.id);

    const workspaceIds = (workspaces || []).map((w: any) => w.id);

    let allProjects: any[] = [];

    if (workspaceIds.length > 0) {
      const { data: projects, error } = await supabaseService
        .from("projects")
        .select("*")
        .in("workspace_id", workspaceIds);

      if (error) throw error;
      allProjects = projects || [];
    }

    // Also get projects where user is a member
    const { data: memberProjects } = await supabaseService
      .from("project_members")
      .select("project_id")
      .eq("user_id", req.user.id);

    const memberProjectIds = (memberProjects || []).map((m: any) => m.project_id);

    if (memberProjectIds.length > 0) {
      const { data: sharedProjects } = await supabaseService
        .from("projects")
        .select("*")
        .in("id", memberProjectIds);

      // Merge, avoiding duplicates
      const existingIds = new Set(allProjects.map((p) => p.id));
      for (const p of sharedProjects || []) {
        if (!existingIds.has(p.id)) allProjects.push(p);
      }
    }

    // Fetch file counts
    const projectsWithCounts = await Promise.all(
      allProjects.map(async (p: any) => {
        const { count } = await supabaseService
          .from("files")
          .select("*", { count: "exact", head: true })
          .eq("project_id", p.id);
        return { ...p, files: [{ count: count || 0 }] };
      })
    );

    res.json({ projects: projectsWithCounts });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Project
router.post("/", async (req: any, res) => {
  try {
    const { name, workspace_id, description, metadata } = req.body;

    const { data, error } = await supabaseService
      .from("projects")
      .insert({
        name,
        workspace_id,
        description,
        created_by: req.user.id,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) throw error;

    // Add creator as owner member
    await supabaseService.from("project_members").insert({
      project_id: data.id,
      user_id: req.user.id,
      role: "owner",
    });

    // Log activity
    await supabaseService.from("activity_logs").insert({
      user_id: req.user.id,
      workspace_id,
      project_id: data.id,
      action: "project_created",
      metadata: { name },
    });

    res.json({ success: true, project: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Single Project
router.get("/:id", async (req: any, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseService
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    // Get file count
    const { count: fileCount } = await supabaseService
      .from("files")
      .select("*", { count: "exact", head: true })
      .eq("project_id", id);

    res.json({ project: { ...data, files: [{ count: fileCount || 0 }] } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Project
router.put("/:id", async (req: any, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    const { data, error } = await supabaseService
      .from("projects")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await supabaseService.from("activity_logs").insert({
      user_id: req.user.id,
      project_id: id,
      action: "project_updated",
      metadata: { fields: Object.keys(updates) },
    });

    res.json({ success: true, project: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Project
router.delete("/:id", async (req: any, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseService
      .from("projects")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await supabaseService.from("activity_logs").insert({
      user_id: req.user.id,
      project_id: id,
      action: "project_deleted",
      metadata: {},
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
