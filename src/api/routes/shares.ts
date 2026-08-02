import { Router } from "express";
import { supabaseService } from "../services/supabase.js";
import { authenticate } from "../middleware/auth.js";
import { randomBytes } from "crypto";

const router = Router();

router.use(authenticate);

// Create a share link for a file or project
router.post("/", async (req: any, res) => {
  try {
    const { project_id, file_id, permissions = "view", expires_in_days, password } = req.body;

    const share_token = randomBytes(16).toString("hex");

    let expires_at: string | null = null;
    if (expires_in_days) {
      const d = new Date();
      d.setDate(d.getDate() + expires_in_days);
      expires_at = d.toISOString();
    }

    const { data, error } = await supabaseService
      .from("shares")
      .insert({
        project_id,
        file_id,
        share_token,
        password_hash: password || null,
        expires_at,
        permissions,
        created_by: req.user?.id || "sys",
      })
      .select()
      .single();

    if (error) throw error;

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const shareUrl = `${appUrl}/share/${share_token}`;

    // Log activity
    await supabaseService.from("activity_logs").insert({
      user_id: req.user.id,
      project_id,
      action: "share_created",
      metadata: { share_id: data.id, file_id },
    });

    res.json({ success: true, share: data, url: shareUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get shares for a project
router.get("/project/:projectId", async (req: any, res) => {
  try {
    const { projectId } = req.params;
    const { data, error } = await supabaseService
      .from("shares")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ shares: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Access a shared resource
router.get("/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const { data: share, error } = await supabaseService
      .from("shares")
      .select("*, projects(*), files(*)")
      .eq("share_token", token)
      .single();

    if (error) throw error;

    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return res.status(410).json({ error: "Share link has expired" });
    }

    res.json({ success: true, share });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Revoke a share
router.delete("/:id", async (req: any, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseService.from("shares").delete().eq("id", id);

    if (error) throw error;

    await supabaseService.from("activity_logs").insert({
      user_id: req.user.id,
      action: "share_revoked",
      metadata: { share_id: id },
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
