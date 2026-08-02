import { Router } from "express";
import { supabaseService } from "../services/supabase.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();


router.use(authenticate);

// Get Projects in a Workspace
router.get("/workspace/:workspaceId", async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { data, error } = await supabaseService
      .from('projects')
      .select('*')
      .eq('workspace_id', workspaceId);
      
    if (error) throw error;
    res.json({ projects: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Project
router.post("/", async (req: any, res) => {
  try {
    const { name, workspace_id, description, metadata } = req.body;
    console.log("Create project body:", { name, workspace_id, description, metadata });
    
    // Check if metadata exists in payload, if so try inserting with and without it to see what fails
    // Wait, let's just remove metadata from insert since the DB doesn't seem to support it
    const { data, error } = await supabaseService
      .from('projects')
      .insert({ name, workspace_id, description, created_by: req.user?.id || 'sys' })
      .select()
      .single();
      
    if (error) {
      console.error("Insert error:", error);
      throw error;
    }
    res.json({ success: true, project: data });
  } catch (err: any) {
    console.error("Create project caught error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get Single Project
router.get("/:id", async (req: any, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseService
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    res.json({ project: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Project
router.put("/:id", async (req: any, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    delete updates.metadata; // Remove metadata as it doesn't exist in schema
    
    const { data, error } = await supabaseService
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
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
      .from('projects')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
