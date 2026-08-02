import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dialog } from '../ui/Dialog';
import { Crown, Shield, User as UserIcon, Trash2, Plus, Mail, Clock, Check, X, ArrowRightLeft } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { ALL_EDITOR_PERMISSIONS, type ProjectMember, type ProjectInvitation, type ProjectRole, type EditorPermission } from '../../lib/types';
import { formatRelativeTime } from '../../lib/types';
import { motion, AnimatePresence } from 'motion/react';

interface ProjectMembersProps {
  projectId: string;
  isOwner: boolean;
}

export function ProjectMembers({ projectId, isOwner }: ProjectMembersProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<ProjectMember | null>(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState('');

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<ProjectRole>('team');
  const [invitePermissions, setInvitePermissions] = useState<EditorPermission[]>([]);
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteExpiry, setInviteExpiry] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editRole, setEditRole] = useState<ProjectRole>('team');
  const [editPermissions, setEditPermissions] = useState<EditorPermission[]>([]);

  const fetchData = async () => {
    try {
      const [membersRes, invitationsRes] = await Promise.all([
        api.members.list(projectId),
        api.members.invitations(projectId),
      ]);
      setMembers(membersRes.members || []);
      setInvitations(invitationsRes.invitations || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.members.createInvitation({
        project_id: projectId,
        invitee_email: inviteEmail,
        role: inviteRole,
        permissions: inviteRole === 'editor' ? invitePermissions : [],
        password: invitePassword || undefined,
        expires_in_days: inviteExpiry,
      });
      setIsInviteOpen(false);
      setInviteEmail('');
      setInviteRole('team');
      setInvitePermissions([]);
      setInvitePassword('');
      setInviteExpiry(7);
      fetchData();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (window.confirm('Remove this member from the project?')) {
      try {
        await api.members.remove(projectId, memberId);
        fetchData();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleLeaveProject = async () => {
    if (window.confirm('Are you sure you want to leave this project?')) {
      try {
        await api.members.leave(projectId);
        window.location.href = '/projects';
      } catch (error) {
        console.error(error);
      }
    }
  };

  const openEditModal = (member: ProjectMember) => {
    setEditingMember(member);
    setEditRole(member.role);
    setEditPermissions(member.permissions || []);
    setIsEditOpen(true);
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setIsSubmitting(true);
    try {
      await api.members.update(projectId, editingMember.id, {
        role: editRole,
        permissions: editRole === 'editor' ? editPermissions : [],
      });
      setIsEditOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransferOwnership = async () => {
    if (!transferTargetId) return;
    if (window.confirm('Are you sure you want to transfer ownership? You will become an editor.')) {
      try {
        await api.members.transferOwnership(projectId, { new_owner_member_id: transferTargetId });
        setIsTransferOpen(false);
        fetchData();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const togglePermission = (perm: EditorPermission, list: EditorPermission[], setter: React.Dispatch<React.SetStateAction<EditorPermission[]>>) => {
    if (list.includes(perm)) {
      setter(list.filter(p => p !== perm));
    } else {
      setter([...list, perm]);
    }
  };

  const roleIcon = (role: string) => {
    if (role === 'owner') return <Crown className="w-4 h-4 text-amber-500" />;
    if (role === 'editor') return <Shield className="w-4 h-4 text-blue-500" />;
    return <UserIcon className="w-4 h-4 text-slate-400" />;
  };

  const roleBadge = (role: string) => {
    const styles: Record<string, string> = {
      owner: 'bg-amber-50 text-amber-700 border-amber-200',
      editor: 'bg-blue-50 text-blue-700 border-blue-200',
      team: 'bg-slate-50 text-slate-600 border-slate-200',
    };
    return styles[role] || styles.team;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="border-slate-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-200 rounded-full animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
                <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const editors = members.filter(m => m.role === 'editor');
  const teamMembers = members.filter(m => m.role === 'team');

  const renderMember = (member: ProjectMember) => (
    <div key={member.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
          {(member.profiles?.full_name || member.profiles?.email || 'U')[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-slate-900 truncate">
            {member.profiles?.full_name || member.profiles?.email || 'Unknown'}
            {member.user_id === user?.id && <span className="text-slate-400 text-xs ml-2">(You)</span>}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {roleIcon(member.role)}
            <p className="text-sm text-slate-500 capitalize">{member.role}</p>
            {member.role === 'editor' && member.permissions && member.permissions.length > 0 && (
              <span className="text-xs text-slate-400 ml-2">{member.permissions.length} permissions</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isOwner && member.role !== 'owner' && (
          <>
            <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => openEditModal(member)}>Edit</Button>
            <button
              onClick={() => handleRemoveMember(member.id)}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Pending Invitations */}
      {isOwner && invitations.filter(i => i.status === 'pending').length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-base"><Mail className="w-4 h-4 text-indigo-500" /> Pending Invitations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {invitations.filter(i => i.status === 'pending').map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">{inv.invitee_email}</p>
                      <p className="text-xs text-slate-500">Invited as {inv.role} · {formatRelativeTime(inv.created_at)}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${inv.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}`}>
                    Pending
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Owner */}
      <Card className="shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 text-base"><Crown className="w-4 h-4 text-amber-500" /> Owner</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {members.filter(m => m.role === 'owner').map(renderMember)}
          </div>
        </CardContent>
      </Card>

      {/* Editors */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 text-base"><Shield className="w-4 h-4 text-blue-500" /> Editors</CardTitle>
          {isOwner && (
            <Button variant="outline" size="sm" className="gap-2 text-xs h-8" onClick={() => { setInviteRole('editor'); setIsInviteOpen(true); }}>
              <Plus className="w-3.5 h-3.5" /> Add Editor
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {editors.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No editors assigned.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">{editors.map(renderMember)}</div>
          )}
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 text-base"><UserIcon className="w-4 h-4 text-slate-500" /> Team Members</CardTitle>
          {isOwner && (
            <Button variant="outline" size="sm" className="gap-2 text-xs h-8" onClick={() => { setInviteRole('team'); setIsInviteOpen(true); }}>
              <Plus className="w-3.5 h-3.5" /> Add Team Member
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {teamMembers.length === 0 ? (
            <div className="text-center py-8">
              <UserIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No team members yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">{teamMembers.map(renderMember)}</div>
          )}
        </CardContent>
      </Card>

      {/* Actions for non-owners */}
      {!isOwner && (
        <div className="flex justify-end">
          <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleLeaveProject}>
            Leave Project
          </Button>
        </div>
      )}

      {/* Owner Actions */}
      {isOwner && members.filter(m => m.role !== 'owner').length > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" className="gap-2" onClick={() => setIsTransferOpen(true)}>
            <ArrowRightLeft className="w-4 h-4" /> Transfer Ownership
          </Button>
        </div>
      )}

      {/* Invite Dialog */}
      <Dialog
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title={`Invite ${inviteRole === 'editor' ? 'Editor' : 'Team Member'}`}
        description="Send a secure invitation to join this project."
      >
        <form onSubmit={handleInvite} className="mt-4 space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="colleague@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
            autoFocus
          />
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Role</label>
            <div className="flex gap-2">
              {(['editor', 'team'] as ProjectRole[]).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setInviteRole(r)}
                  className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-colors capitalize ${inviteRole === r ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {inviteRole === 'editor' && (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Permissions</label>
              <div className="max-h-40 overflow-y-auto space-y-1.5 border border-slate-200 rounded-lg p-3">
                {ALL_EDITOR_PERMISSIONS.map(perm => (
                  <label key={perm.value} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded-md transition-colors">
                    <input
                      type="checkbox"
                      checked={invitePermissions.includes(perm.value)}
                      onChange={() => togglePermission(perm.value, invitePermissions, setInvitePermissions)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Password (Optional)"
              type="text"
              placeholder="Access password"
              value={invitePassword}
              onChange={(e) => setInvitePassword(e.target.value)}
            />
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Expires (days)</label>
              <select
                value={inviteExpiry}
                onChange={(e) => setInviteExpiry(Number(e.target.value))}
                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={1}>1 day</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={0}>Never</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || !inviteEmail.trim()}>
              {isSubmitting ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Member"
      >
        <form onSubmit={handleUpdateMember} className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Role</label>
            <div className="flex gap-2">
              {(['editor', 'team'] as ProjectRole[]).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setEditRole(r)}
                  className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-colors capitalize ${editRole === r ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {editRole === 'editor' && (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Permissions</label>
              <div className="max-h-40 overflow-y-auto space-y-1.5 border border-slate-200 rounded-lg p-3">
                {ALL_EDITOR_PERMISSIONS.map(perm => (
                  <label key={perm.value} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded-md transition-colors">
                    <input
                      type="checkbox"
                      checked={editPermissions.includes(perm.value)}
                      onChange={() => togglePermission(perm.value, editPermissions, setEditPermissions)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Transfer Ownership Dialog */}
      <Dialog
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        title="Transfer Ownership"
        description="You will become an editor after transferring ownership."
      >
        <div className="mt-4 space-y-4">
          <p className="text-sm text-slate-600">Select a member to become the new owner:</p>
          <select
            value={transferTargetId}
            onChange={(e) => setTransferTargetId(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select a member</option>
            {members.filter(m => m.role !== 'owner').map(m => (
              <option key={m.id} value={m.id}>{m.profiles?.full_name || m.profiles?.email || 'Unknown'}</option>
            ))}
          </select>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsTransferOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleTransferOwnership} disabled={!transferTargetId}>Transfer Ownership</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
