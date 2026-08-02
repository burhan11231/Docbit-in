import { Router } from "express";
import { supabaseService } from "../services/supabase.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();


router.use(authenticate);

// Get Workspaces
router.get("/", async (req: any, res) => {
  try {
    const { data, error } = await supabaseService
      .from('workspaces')
      .select('*')
      .eq('owner_id', req.user.id);
      
    if (error) throw error;
    res.json({ workspaces: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Workspace
router.post("/", async (req: any, res) => {
  try {
    const { name } = req.body;
    const { data: workspace, error } = await supabaseService
      .from('workspaces')
      .insert({ name, owner_id: req.user.id })
      .select()
      .single();
      
    if (error) throw error;

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
      .from('workspaces')
      .update(updates)
      .eq('id', id)
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
      .from('workspaces')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
