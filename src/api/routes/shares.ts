import { Router } from "express";
import { supabaseService } from "../services/supabase.js";
import { randomBytes } from "crypto";

const router = Router();

// Create a share link for a file or project
router.post("/", async (req: any, res) => {
  try {
    const { project_id, file_id, permissions = 'view', expires_in_days } = req.body;
    
    // Generate secure random share token
    const share_token = randomBytes(16).toString("hex");
    
    let expires_at = null;
    if (expires_in_days) {
      expires_at = new Date();
      expires_at.setDate(expires_at.getDate() + expires_in_days);
    }
    
    const { data, error } = await supabaseService
      .from('shares')
      .insert({
        project_id,
        file_id,
        share_token,
        permissions,
        expires_at,
        created_by: req.user?.id || 'sys'
      })
      .select()
      .single();
      
    if (error) throw error;
    
    // Construct the share URL
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const shareUrl = `${appUrl}/share/${share_token}`;
    
    res.json({ success: true, share: data, url: shareUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Access a shared resource
router.get("/:token", async (req, res) => {
  try {
    const { token } = req.params;
    
    const { data: share, error } = await supabaseService
      .from('shares')
      .select('*, projects(*), files(*)')
      .eq('share_token', token)
      .single();
      
    if (error) throw error;
    
    // Check expiration
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return res.status(410).json({ error: "Share link has expired" });
    }
    
    res.json({ success: true, share });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
