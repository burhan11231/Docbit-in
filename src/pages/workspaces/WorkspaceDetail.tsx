import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Users, HardDrive, Settings, Activity, Folder, Plus } from 'lucide-react';
import { api } from '../../lib/api';

const TABS = ['Overview', 'Members', 'Settings'];

export function WorkspaceDetail() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [workspaceName, setWorkspaceName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchWorkspace();
  }, [workspaceId]);

  const fetchWorkspace = async () => {
    try {
      setIsLoading(true);
      const data = await api.workspaces.list();
      const current = data.workspaces?.find((w: any) => w.id === workspaceId);
      if (current) {
        setWorkspace(current);
        setWorkspaceName(current.name);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace) return;
    
    setIsSubmitting(true);
    try {
      await api.workspaces.update(workspace.id, { name: workspaceName });
      fetchWorkspace();
      alert('Workspace updated successfully');
    } catch (error) {
      console.error('Failed to update workspace', error);
      alert('Failed to update workspace');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (window.confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
      try {
        await api.workspaces.delete(workspaceId!);
        navigate('/workspaces');
      } catch (error) {
        console.error('Failed to delete workspace', error);
        alert('Failed to delete workspace');
      }
    }
  };

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!workspace) return <div className="p-8 text-center text-slate-500">Workspace not found</div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <Link to="/workspaces" className="hover:text-slate-900">Workspaces</Link>
            <span>/</span>
            <span className="font-medium text-slate-900">{workspace.name}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{workspace.name}</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Users className="w-4 h-4" /> Invite Members
          </Button>
          <Button className="gap-2" onClick={() => setActiveTab('Settings')}>
            <Settings className="w-4 h-4" /> Settings
          </Button>
        </div>
      </div>

      <div className="flex border-b border-slate-200">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
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

      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Users className="w-5 h-5"/>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Members</p>
                    <p className="text-2xl font-bold text-slate-900">{workspace.workspace_members?.[0]?.count || 1}</p>
                  </div>
               </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Folder className="w-5 h-5"/>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Projects</p>
                    <p className="text-2xl font-bold text-slate-900">{workspace.projects?.[0]?.count || 0}</p>
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'Members' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
            <CardTitle>Workspace Members</CardTitle>
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> Add Member
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              <div className="flex items-center justify-between p-4 hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    U
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Current User</p>
                    <p className="text-sm text-slate-500">Owner</p>
                  </div>
                </div>
              </div>
              {/* Additional members would go here */}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'Settings' && (
        <Card>
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
               <div className="pt-4 flex justify-end">
                 <Button type="submit" disabled={isSubmitting || workspaceName === workspace.name || !workspaceName.trim()}>
                   {isSubmitting ? 'Saving...' : 'Save Changes'}
                 </Button>
               </div>
            </form>
            
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <h4 className="font-medium text-slate-900">Danger Zone</h4>
              <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                <div>
                  <h5 className="font-medium text-red-900">Delete Workspace</h5>
                  <p className="text-sm text-red-700 mt-1">Permanently delete this workspace and all its projects.</p>
                </div>
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-100" onClick={handleDeleteWorkspace}>
                  Delete Workspace
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
