import { Router } from "express";
import { supabaseService } from "../services/supabase.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

// Get Workspaces (with member count and project count)
router.get("/", async (req: any, res) => {
  try {
    const { data: workspaces, error } = await supabaseService
      .from("workspaces")
      .select("*")
      .eq("owner_id", req.user.id);

    if (error) throw error;

    // Fetch member counts and project counts for each workspace
    const workspacesWithCounts = await Promise.all(
      (workspaces || []).map(async (w: any) => {
        const [{ count: memberCount }, { count: projectCount }] = await Promise.all([
          supabaseService.from("workspace_members").select("*", { count: "exact", head: true }).eq("workspace_id", w.id),
          supabaseService.from("projects").select("*", { count: "exact", head: true }).eq("workspace_id", w.id).eq("is_deleted", false),
        ]);
        return {
          ...w,
          workspace_members: [{ count: memberCount || 0 }],
          projects: [{ count: projectCount || 0 }],
        };
      })
    );

    res.json({ workspaces: workspacesWithCounts });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get single workspace
router.get("/:id", async (req: any, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseService
      .from("workspaces")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    res.json({ workspace: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Workspace
router.post("/", async (req: any, res) => {
  try {
    const { name } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now().toString(36);

    const { data: workspace, error } = await supabaseService
      .from("workspaces")
      .insert({ name, owner_id: req.user.id, slug })
      .select()
      .single();

    if (error) throw error;

    // Add owner as workspace member
    await supabaseService.from("workspace_members").insert({
      workspace_id: workspace.id,
      user_id: req.user.id,
      role: "owner",
    });

    // Log activity
    await supabaseService.from("activity_logs").insert({
      user_id: req.user.id,
      workspace_id: workspace.id,
      action: "workspace_created",
      metadata: { name },
    });

    res.json({ success: true, workspace });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Workspace
router.put("/:id", async (req: any, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabaseService
      .from("workspaces")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, workspace: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Workspace
router.delete("/:id", async (req: any, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseService
      .from("workspaces")
      .delete()
      .eq("id", id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get workspace members
router.get("/:id/members", async (req: any, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseService
      .from("workspace_members")
      .select("*, profiles!workspace_members_user_id_fkey(id, email, full_name, avatar_url)")
      .eq("workspace_id", id);

    if (error) throw error;
    res.json({ members: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Add workspace member
router.post("/:id/members", async (req: any, res) => {
  try {
    const { id } = req.params;
    const { user_id, role } = req.body;

    const { data, error } = await supabaseService
      .from("workspace_members")
      .insert({ workspace_id: id, user_id, role: role || "member" })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, member: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Remove workspace member
router.delete("/:id/members/:memberId", async (req: any, res) => {
  try {
    const { id, memberId } = req.params;
    const { error } = await supabaseService
      .from("workspace_members")
      .delete()
      .eq("id", memberId)
      .eq("workspace_id", id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
