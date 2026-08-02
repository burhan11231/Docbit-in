import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog } from '../../components/ui/Dialog';
import { Skeleton } from '../../components/ui/Skeleton';
import { Users, HardDrive, Settings, Activity, Folder, Plus, Trash2, Crown, Shield, User as UserIcon, ArrowLeft } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { formatBytes, formatRelativeTime, formatActionLabel, type Workspace, type ActivityLog } from '../../lib/types';
import { motion, AnimatePresence } from 'motion/react';

const TABS = ['Overview', 'Members', 'Activity', 'Settings'] as const;
type Tab = typeof TABS[number];

export function WorkspaceDetail() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [workspaceName, setWorkspaceName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const fetchWorkspace = useCallback(async () => {
    if (!workspaceId) return;
    try {
      setIsLoading(true);
      const [wsRes, membersRes, activityRes, projectsRes] = await Promise.all([
        api.workspaces.get(workspaceId),
        api.workspaces.members(workspaceId),
        api.activity.workspace(workspaceId, 10),
        api.projects.list(workspaceId),
      ]);
      setWorkspace(wsRes.workspace || null);
      setWorkspaceName(wsRes.workspace?.name || '');
      setMembers(membersRes.members || []);
      setActivities(activityRes.activities || []);
      setProjects((projectsRes.projects || []).filter((p: any) => !p.is_deleted));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace) return;
    setIsSubmitting(true);
    try {
      await api.workspaces.update(workspace.id, { name: workspaceName });
      fetchWorkspace();
    } catch (error) {
      console.error('Failed to update workspace', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!workspaceId) return;
    try {
      await api.workspaces.delete(workspaceId);
      navigate('/workspaces');
    } catch (error) {
      console.error('Failed to delete workspace', error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!workspaceId) return;
    if (window.confirm('Remove this member from the workspace?')) {
      try {
        await api.workspaces.removeMember(workspaceId, memberId);
        fetchWorkspace();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !memberEmail.trim()) return;
    try {
      // Look up user by email via profiles
      // For now, we'll just add them - in production this would send an invitation
      setIsInviteOpen(false);
      setMemberEmail('');
    } catch (error) {
      console.error(error);
    }
  };

  const totalStorage = projects.reduce((acc, p) => acc + (p.files?.[0]?.count || 0), 0);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="text-center py-24">
        <h2 className="text-xl font-semibold text-slate-900">Workspace not found</h2>
        <Button className="mt-4" onClick={() => navigate('/workspaces')}>Back to Workspaces</Button>
      </div>
    );
  }

  const roleIcon = (role: string) => {
    if (role === 'owner') return <Crown className="w-4 h-4 text-amber-500" />;
    if (role === 'admin') return <Shield className="w-4 h-4 text-blue-500" />;
    return <UserIcon className="w-4 h-4 text-slate-400" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 md:space-y-8 max-w-5xl mx-auto px-1"
    >
      {/* Breadcrumb + Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
          <Link to="/workspaces" className="hover:text-slate-900 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Workspaces
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-900">{workspace.name}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
              {workspace.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">{workspace.name}</h1>
              <p className="text-sm text-slate-500 mt-1">{members.length} members · {projects.length} projects</p>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <Button variant="outline" className="gap-2" onClick={() => setIsInviteOpen(true)}>
              <Users className="w-4 h-4" /> Invite
            </Button>
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setActiveTab('Settings')}>
              <Settings className="w-4 h-4" /> Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <Card className="shadow-sm">
                <CardContent className="p-5 md:p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">Members</p>
                      <p className="text-2xl font-bold text-slate-900">{members.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="p-5 md:p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Folder className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">Projects</p>
                      <p className="text-2xl font-bold text-slate-900">{projects.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="p-5 md:p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <HardDrive className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">Storage</p>
                      <p className="text-2xl font-bold text-slate-900">{formatBytes(workspace.storage_used_bytes || 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Projects list */}
              <div className="md:col-span-3">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Projects in this Workspace</h3>
                {projects.length === 0 ? (
                  <Card className="border-dashed border-slate-300">
                    <CardContent className="p-8 md:p-12 text-center">
                      <Folder className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm text-slate-500 mb-4">No projects in this workspace yet.</p>
                      <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => navigate('/projects')}>
                        <Plus className="w-4 h-4" /> Create Project
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {projects.map(project => (
                      <Card
                        key={project.id}
                        className="hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer group"
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                            <Folder className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors truncate">{project.name}</h4>
                            <p className="text-xs text-slate-500">{project.files?.[0]?.count || 0} files</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Members' && (
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
                <CardTitle>Workspace Members</CardTitle>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsInviteOpen(true)}>
                  <Plus className="w-4 h-4" /> Invite Member
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {members.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">No members yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {members.map(member => (
                      <div key={member.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                            {(member.profiles?.full_name || member.profiles?.email || 'U')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">{member.profiles?.full_name || member.profiles?.email || 'Unknown'}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {roleIcon(member.role)}
                              <p className="text-sm text-slate-500 capitalize">{member.role}</p>
                            </div>
                          </div>
                        </div>
                        {member.user_id !== user?.id && (
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'Activity' && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-500" /> Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">No recent activity.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.map(activity => (
                      <div key={activity.id} className="flex gap-3 items-start">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center mt-0.5 shrink-0">
                          <span className="text-xs font-bold text-indigo-600">
                            {(activity.profiles?.full_name || activity.profiles?.email || 'U')[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-slate-900">
                            <span className="font-medium">{activity.profiles?.full_name || activity.profiles?.email?.split('@')[0] || 'Someone'}</span>
                            {' '}
                            <span className="text-slate-500">{formatActionLabel(activity.action)}</span>
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">{formatRelativeTime(activity.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'Settings' && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Workspace Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 max-w-2xl">
                <form onSubmit={handleUpdateWorkspace} className="space-y-4">
                  <Input
                    label="Workspace Name"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    required
                  />
                  <div className="pt-2 flex justify-end">
                    <Button type="submit" disabled={isSubmitting || workspaceName === workspace.name || !workspaceName.trim()}>
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>

                <div className="pt-6 border-t border-slate-100 space-y-4">
                  <h4 className="font-medium text-slate-900">Danger Zone</h4>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-red-200 rounded-xl bg-red-50">
                    <div>
                      <h5 className="font-medium text-red-900">Delete Workspace</h5>
                      <p className="text-sm text-red-700 mt-1">Permanently delete this workspace and all its projects. This cannot be undone.</p>
                    </div>
                    <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-100 shrink-0" onClick={() => setIsDeleteDialogOpen(true)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <Dialog isOpen={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} title="Delete Workspace" description="This action is permanent and cannot be undone.">
        <div className="mt-4 space-y-4">
          <p className="text-sm text-slate-600">Are you sure you want to delete <span className="font-semibold">{workspace.name}</span> and all its projects?</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteWorkspace}>Delete Permanently</Button>
          </div>
        </div>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Invite Member" description="Invite a team member to this workspace.">
        <form onSubmit={handleInviteMember} className="mt-4 space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="colleague@company.com"
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
            required
            autoFocus
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={!memberEmail.trim()}>Send Invitation</Button>
          </div>
        </form>
      </Dialog>
    </motion.div>
  );
}
