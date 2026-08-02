import { Router } from "express";
import multer from "multer";
import { s3Client, uploadToB2 } from "../services/b2.js";
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
      .from('files')
      .select('*')
      .eq('project_id', projectId);
      
    if (error) throw error;
    res.json({ files: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }
    
    const { project_id } = req.body;
    
    // In DocBit, we use Backblaze B2 (S3-compatible) for project files
    const result = await uploadToB2(
      `projects/uploads/${Date.now()}-${req.file.originalname}`,
      req.file.buffer,
      req.file.mimetype
    );

    // Save to database
    const { data: file, error } = await supabaseService
      .from('files')
      .insert({
        name: req.file.originalname,
        project_id: project_id || null,
        storage_path: result.url,
        size_bytes: req.file.size,
        mime_type: req.file.mimetype,
        uploaded_by: (req as any).user?.id,
      })
      .select()
      .single();

    if (error) throw error;

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
      .from('files')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    res.json({ success: true, file: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete File
router.delete("/:id", async (req: any, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseService
      .from('files')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
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
    
    // Get original
    const { data: original, error: getErr } = await supabaseService
      .from('files')
      .select('*')
      .eq('id', id)
      .single();
      
    if (getErr) throw getErr;
    
    // Insert copy
    const { data, error } = await supabaseService
      .from('files')
      .insert({
        name: `Copy of ${original.name}`,
        project_id: target_project_id || original.project_id,
        storage_path: original.storage_path, // Point to same B2 file
        size_bytes: original.size_bytes,
        mime_type: original.mime_type,
        uploaded_by: (req as any).user?.id,
        kind: original.kind || 'other',
        permission: original.permission || 'private'
      })
      .select()
      .single();
      
    if (error) throw error;
    res.json({ success: true, file: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
