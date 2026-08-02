import { Router } from "express";
import { supabaseService } from "../services/supabase.js";
import { authenticate } from "../middleware/auth.js";
import { randomBytes } from "crypto";

const router = Router();

router.use(authenticate);

// Get project members with profile info and permissions
router.get("/project/:projectId", async (req: any, res) => {
  try {
    const { projectId } = req.params;

    const { data: members, error } = await supabaseService
      .from("project_members")
      .select("*, profiles!project_members_user_id_fkey(id, email, full_name, avatar_url)")
      .eq("project_id", projectId);

    if (error) throw error;

    // Fetch permissions for each member
    const membersWithPermissions = await Promise.all(
      (members || []).map(async (m: any) => {
        const { data: perms } = await supabaseService
          .from("project_member_permissions")
          .select("permission")
          .eq("project_member_id", m.id);
        return { ...m, permissions: (perms || []).map((p: any) => p.permission) };
      })
    );

    res.json({ members: membersWithPermissions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get invitations for a project
router.get("/invitations/project/:projectId", async (req: any, res) => {
  try {
    const { projectId } = req.params;
    const { data, error } = await supabaseService
      .from("project_invitations")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ invitations: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get pending invitations for the current user (by email)
router.get("/invitations/me", async (req: any, res) => {
  try {
    const { data: profile } = await supabaseService
      .from("profiles")
      .select("email")
      .eq("id", req.user.id)
      .single();

    if (!profile) return res.json({ invitations: [] });

    const { data, error } = await supabaseService
      .from("project_invitations")
      .select("*, projects(id, name, description)")
      .eq("invitee_email", profile.email)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ invitations: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create invitation
router.post("/invitations", async (req: any, res) => {
  try {
    const { project_id, invitee_email, role, permissions, password, expires_in_days } = req.body;

    const share_token = randomBytes(16).toString("hex");
    let expires_at: string | null = null;
    if (expires_in_days) {
      const d = new Date();
      d.setDate(d.getDate() + expires_in_days);
      expires_at = d.toISOString();
    }

    const { data, error } = await supabaseService
      .from("project_invitations")
      .insert({
        project_id,
        invited_by: req.user.id,
        invitee_email,
        role: role || "team",
        permissions: permissions || [],
        share_token,
        password_hash: password || null,
        expires_at,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await supabaseService.from("activity_logs").insert({
      user_id: req.user.id,
      project_id,
      action: "invitation_sent",
      metadata: { invitee_email, role },
    });

    res.json({ success: true, invitation: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Accept invitation
router.post("/invitations/:id/accept", async (req: any, res) => {
  try {
    const { id } = req.params;

    const { data: invitation, error: invError } = await supabaseService
      .from("project_invitations")
      .select("*")
      .eq("id", id)
      .single();

    if (invError || !invitation) return res.status(404).json({ error: "Invitation not found" });
    if (invitation.status !== "pending") return res.status(400).json({ error: "Invitation already processed" });

    // Check expiration
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      await supabaseService.from("project_invitations").update({ status: "expired" }).eq("id", id);
      return res.status(410).json({ error: "Invitation has expired" });
    }

    // Add user as project member
    const { error: memberError } = await supabaseService
      .from("project_members")
      .insert({
        project_id: invitation.project_id,
        user_id: req.user.id,
        role: invitation.role,
      });

    if (memberError) {
      // Might already be a member
      if (memberError.code !== "23505") throw memberError;
    }

    // Add permissions if editor
    if (invitation.role === "editor" && invitation.permissions && invitation.permissions.length > 0) {
      const { data: member } = await supabaseService
        .from("project_members")
        .select("id")
        .eq("project_id", invitation.project_id)
        .eq("user_id", req.user.id)
        .single();

      if (member) {
        const permRows = invitation.permissions.map((p: string) => ({
          project_member_id: member.id,
          permission: p,
        }));
        await supabaseService.from("project_member_permissions").upsert(permRows, { onConflict: "project_member_id,permission" });
      }
    }

    // Update invitation status
    await supabaseService.from("project_invitations").update({ status: "accepted" }).eq("id", id);

    // Log activity
    await supabaseService.from("activity_logs").insert({
      user_id: req.user.id,
      project_id: invitation.project_id,
      action: "invitation_accepted",
      metadata: { invitation_id: id },
    });

    res.json({ success: true, project_id: invitation.project_id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reject invitation
router.post("/invitations/:id/reject", async (req: any, res) => {
  try {
    const { id } = req.params;
    await supabaseService.from("project_invitations").update({ status: "rejected" }).eq("id", id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Remove member from project
router.delete("/project/:projectId/member/:memberId", async (req: any, res) => {
  try {
    const { projectId, memberId } = req.params;

    const { error } = await supabaseService
      .from("project_members")
      .delete()
      .eq("id", memberId)
      .eq("project_id", projectId);

    if (error) throw error;

    await supabaseService.from("activity_logs").insert({
      user_id: req.user.id,
      project_id: projectId,
      action: "member_removed",
      metadata: { member_id: memberId },
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Leave project
router.post("/project/:projectId/leave", async (req: any, res) => {
  try {
    const { projectId } = req.params;
    const { error } = await supabaseService
      .from("project_members")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", req.user.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Transfer ownership
router.post("/project/:projectId/transfer", async (req: any, res) => {
  try {
    const { projectId } = req.params;
    const { new_owner_member_id } = req.body;

    // Get current owner
    const { data: currentOwner } = await supabaseService
      .from("project_members")
      .select("*")
      .eq("project_id", projectId)
      .eq("role", "owner")
      .single();

    // Get new owner
    const { data: newOwner } = await supabaseService
      .from("project_members")
      .select("*")
      .eq("id", new_owner_member_id)
      .eq("project_id", projectId)
      .single();

    if (!newOwner) return res.status(404).json({ error: "Member not found" });

    // Demote current owner to editor
    if (currentOwner) {
      await supabaseService.from("project_members").update({ role: "editor" }).eq("id", currentOwner.id);
    }

    // Promote new owner
    await supabaseService.from("project_members").update({ role: "owner" }).eq("id", new_owner_member_id);

    // Update project created_by
    await supabaseService.from("projects").update({ created_by: newOwner.user_id }).eq("id", projectId);

    await supabaseService.from("activity_logs").insert({
      user_id: req.user.id,
      project_id: projectId,
      action: "ownership_transferred",
      metadata: { new_owner_id: newOwner.user_id },
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update member role and permissions
router.put("/project/:projectId/member/:memberId", async (req: any, res) => {
  try {
    const { projectId, memberId } = req.params;
    const { role, permissions } = req.body;

    const { error: updateError } = await supabaseService
      .from("project_members")
      .update({ role })
      .eq("id", memberId)
      .eq("project_id", projectId);

    if (updateError) throw updateError;

    // Update permissions: delete old, insert new
    await supabaseService.from("project_member_permissions").delete().eq("project_member_id", memberId);

    if (role === "editor" && permissions && permissions.length > 0) {
      const permRows = permissions.map((p: string) => ({
        project_member_id: memberId,
        permission: p,
      }));
      await supabaseService.from("project_member_permissions").upsert(permRows, { onConflict: "project_member_id,permission" });
    }

    await supabaseService.from("activity_logs").insert({
      user_id: req.user.id,
      project_id: projectId,
      action: "member_role_updated",
      metadata: { member_id: memberId, role },
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Check if current user is a member of the project and get their role
router.get("/project/:projectId/me", async (req: any, res) => {
  try {
    const { projectId } = req.params;

    const { data: member, error } = await supabaseService
      .from("project_members")
      .select("*, project_member_permissions(permission)")
      .eq("project_id", projectId)
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (error) throw error;

    // Also check if user is the project creator
    const { data: project } = await supabaseService
      .from("projects")
      .select("created_by")
      .eq("id", projectId)
      .single();

    let role = null;
    let permissions: string[] = [];

    if (member) {
      role = member.role;
      permissions = (member.project_member_permissions || []).map((p: any) => p.permission);
    } else if (project && project.created_by === req.user.id) {
      // Creator is owner even if not in project_members table
      role = "owner";
    }

    if (!role) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ role, permissions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
