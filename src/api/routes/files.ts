import { Router } from "express";
import multer from "multer";
import { uploadToB2 } from "../services/b2.js";
import { supabaseService } from "../services/supabase.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

// Get Files in a Project
router.get("/project/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const { data, error } = await supabaseService
      .from("files")
      .select("*, profiles!files_uploaded_by_fkey(id, email, full_name, avatar_url)")
      .eq("project_id", projectId);

    if (error) throw error;
    res.json({ files: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Upload File
router.post("/upload", upload.single("file"), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const { project_id } = req.body;

    const result = await uploadToB2(
      `projects/uploads/${Date.now()}-${req.file.originalname}`,
      req.file.buffer,
      req.file.mimetype
    );

    const { data: file, error } = await supabaseService
      .from("files")
      .insert({
        name: req.file.originalname,
        project_id: project_id || null,
        storage_path: result.url,
        size_bytes: req.file.size,
        mime_type: req.file.mimetype,
        uploaded_by: req.user?.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await supabaseService.from("activity_logs").insert({
      user_id: req.user.id,
      project_id: project_id,
      action: "file_uploaded",
      metadata: { file_name: req.file.originalname, file_id: file.id },
    });

    res.json({ success: true, fileUrl: result.url, file });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update File
router.put("/:id", async (req: any, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const { data, error } = await supabaseService
      .from("files")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Log rename activity
    if (updates.name) {
      await supabaseService.from("activity_logs").insert({
        user_id: req.user.id,
        project_id: data.project_id,
        action: "file_renamed",
        metadata: { file_id: id, new_name: updates.name },
      });
    }

    res.json({ success: true, file: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete File
router.delete("/:id", async (req: any, res) => {
  try {
    const { id } = req.params;

    // Get file info for activity log
    const { data: file } = await supabaseService.from("files").select("project_id, name").eq("id", id).single();

    const { error } = await supabaseService.from("files").delete().eq("id", id);

    if (error) throw error;

    if (file) {
      await supabaseService.from("activity_logs").insert({
        user_id: req.user.id,
        project_id: file.project_id,
        action: "file_deleted",
        metadata: { file_id: id, file_name: file.name },
      });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Copy File
router.post("/:id/copy", async (req: any, res) => {
  try {
    const { id } = req.params;
    const { target_project_id } = req.body;

    const { data: original, error: getErr } = await supabaseService
      .from("files")
      .select("*")
      .eq("id", id)
      .single();

    if (getErr) throw getErr;

    const { data, error } = await supabaseService
      .from("files")
      .insert({
        name: `Copy of ${original.name}`,
        project_id: target_project_id || original.project_id,
        storage_path: original.storage_path,
        size_bytes: original.size_bytes,
        mime_type: original.mime_type,
        uploaded_by: req.user?.id,
        kind: original.kind || "other",
        permission: original.permission || "private",
      })
      .select()
      .single();

    if (error) throw error;

    await supabaseService.from("activity_logs").insert({
      user_id: req.user.id,
      project_id: target_project_id || original.project_id,
      action: "file_copied",
      metadata: { source_file_id: id, new_file_id: data.id },
    });

    res.json({ success: true, file: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Increment view count
router.post("/:id/view", async (req: any, res) => {
  try {
    const { id } = req.params;
    const { data: file } = await supabaseService.from("files").select("view_count").eq("id", id).single();
    if (file) {
      await supabaseService.from("files").update({ view_count: (file.view_count || 0) + 1 }).eq("id", id);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Increment download count
router.post("/:id/download", async (req: any, res) => {
  try {
    const { id } = req.params;
    const { data: file } = await supabaseService.from("files").select("download_count").eq("id", id).single();
    if (file) {
      await supabaseService.from("files").update({ download_count: (file.download_count || 0) + 1 }).eq("id", id);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
