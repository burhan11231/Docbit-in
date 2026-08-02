import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog } from '../../components/ui/Dialog';
import { Dropdown } from '../../components/ui/Dropdown';
import { Skeleton } from '../../components/ui/Skeleton';
import { Plus, Users, Folder, Settings, Search, Filter, Edit, Trash2, Archive, Star, RotateCcw } from 'lucide-react';
import { api } from '../../lib/api';
import { motion, AnimatePresence } from 'motion/react';

export function WorkspaceList() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search, Filter & Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, favorites, archived
  const [sortBy, setSortBy] = useState('name'); // name, newest
  const [sortOrder, setSortOrder] = useState('asc');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState<any>(null);
  
  const [workspaceName, setWorkspaceName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      setIsLoading(true);
      const data = await api.workspaces.list();
      setWorkspaces(data.workspaces || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.workspaces.create({ name: workspaceName });
      setIsCreateModalOpen(false);
      setWorkspaceName('');
      fetchWorkspaces();
    } catch (error) {
      console.error('Failed to create workspace', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace) return;
    setIsSubmitting(true);
    try {
      await api.workspaces.update(currentWorkspace.id, { name: workspaceName });
      setIsEditModalOpen(false);
      setWorkspaceName('');
      setCurrentWorkspace(null);
      fetchWorkspaces();
    } catch (error) {
      console.error('Failed to update workspace', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWorkspace = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
      try {
        await api.workspaces.delete(id);
        fetchWorkspaces();
      } catch (error) {
        console.error('Failed to delete workspace', error);
      }
    }
  };

  const toggleFavorite = async (workspace: any) => {
    try {
      await api.workspaces.update(workspace.id, { is_favorite: !workspace.is_favorite });
      fetchWorkspaces();
    } catch (error) {
      console.error('Failed to favorite workspace', error);
    }
  };

  const toggleArchive = async (workspace: any) => {
    try {
      const newStatus = workspace.status === 'archived' ? 'active' : 'archived';
      await api.workspaces.update(workspace.id, { status: newStatus });
      fetchWorkspaces();
    } catch (error) {
      console.error('Failed to archive workspace', error);
    }
  };

  const openEditModal = (workspace: any) => {
    setCurrentWorkspace(workspace);
    setWorkspaceName(workspace.name);
    setIsEditModalOpen(true);
  };

  const filteredWorkspaces = workspaces
    .filter(w => {
      const matchesSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (filterType === 'favorites') return matchesSearch && w.is_favorite && w.status !== 'archived';
      if (filterType === 'archived') return matchesSearch && w.status === 'archived';
      return matchesSearch && w.status !== 'archived';
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'newest') {
        comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const activeStats = {
    total: workspaces.filter(w => w.status !== 'archived').length,
    archived: workspaces.filter(w => w.status === 'archived').length,
    favorites: workspaces.filter(w => w.is_favorite && w.status !== 'archived').length
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-7xl mx-auto"
    >
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Workspaces</h1>
          <p className="text-slate-500 mt-2">Manage your teams and organizations</p>
        </div>
        <Button className="gap-2 shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto justify-center shadow-md shadow-indigo-200" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-5 h-5" />
          New Workspace
        </Button>
      </motion.div>
      
      {/* Statistics */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-200 pb-8">
        <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider mb-2">Active</p>
          <p className="text-3xl font-bold text-slate-900">{activeStats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
            Favorites <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          </p>
          <p className="text-3xl font-bold text-slate-900">{activeStats.favorites}</p>
        </div>
        <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider mb-2">Archived</p>
          <p className="text-3xl font-bold text-slate-900">{activeStats.archived}</p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input 
            className="pl-10 bg-white border-slate-200 hover:border-slate-300 transition-colors rounded-xl h-12 w-full text-base" 
            placeholder="Search workspaces..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative">
          <Button variant="outline" className="gap-2 px-4 h-12 w-full sm:w-auto justify-between sm:justify-center rounded-xl bg-white border-slate-200 hover:bg-slate-50" onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-500" />
              <span className="font-medium text-slate-700">{filterType === 'all' ? 'All Active' : filterType === 'favorites' ? 'Favorites' : 'Archived'}</span>
            </div>
          </Button>
          <AnimatePresence>
            {isFilterDropdownOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-2 origin-top-right"
              >
                <button className={`w-full text-left px-5 py-2.5 text-sm hover:bg-indigo-50 transition-colors ${filterType === 'all' ? 'font-semibold bg-indigo-50/50 text-indigo-700' : 'text-slate-700'}`} onClick={() => { setFilterType('all'); setIsFilterDropdownOpen(false); }}>All Active</button>
                <button className={`w-full text-left px-5 py-2.5 text-sm hover:bg-indigo-50 transition-colors ${filterType === 'favorites' ? 'font-semibold bg-indigo-50/50 text-indigo-700' : 'text-slate-700'}`} onClick={() => { setFilterType('favorites'); setIsFilterDropdownOpen(false); }}>Favorites</button>
                <button className={`w-full text-left px-5 py-2.5 text-sm hover:bg-indigo-50 transition-colors ${filterType === 'archived' ? 'font-semibold bg-indigo-50/50 text-indigo-700' : 'text-slate-700'}`} onClick={() => { setFilterType('archived'); setIsFilterDropdownOpen(false); }}>Archived</button>
                <div className="border-t border-slate-100 my-2"></div>
                <div className="px-5 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">Sort By</div>
                <button className={`w-full text-left px-5 py-2.5 text-sm hover:bg-indigo-50 transition-colors ${sortBy === 'name' ? 'font-semibold text-indigo-700' : 'text-slate-700'}`} onClick={() => { setSortBy('name'); setIsFilterDropdownOpen(false); }}>Name</button>
                <button className={`w-full text-left px-5 py-2.5 text-sm hover:bg-indigo-50 transition-colors ${sortBy === 'newest' ? 'font-semibold text-indigo-700' : 'text-slate-700'}`} onClick={() => { setSortBy('newest'); setIsFilterDropdownOpen(false); }}>Date Created</button>
                <div className="px-5 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">Order</div>
                <button className={`w-full text-left px-5 py-2.5 text-sm hover:bg-indigo-50 transition-colors ${sortOrder === 'asc' ? 'font-semibold text-indigo-700' : 'text-slate-700'}`} onClick={() => { setSortOrder('asc'); setIsFilterDropdownOpen(false); }}>Ascending</button>
                <button className={`w-full text-left px-5 py-2.5 text-sm hover:bg-indigo-50 transition-colors ${sortOrder === 'desc' ? 'font-semibold text-indigo-700' : 'text-slate-700'}`} onClick={() => { setSortOrder('desc'); setIsFilterDropdownOpen(false); }}>Descending</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>


      {isLoading ? (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <Skeleton className="w-8 h-8 rounded-lg" />
                </div>
                <Skeleton className="h-6 w-2/3 mb-4 rounded-lg" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-20 rounded-md" />
                  <Skeleton className="h-4 w-20 rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      ) : filteredWorkspaces.length === 0 ? (
        <motion.div variants={itemVariants} className="text-center py-24 bg-white/50 border border-slate-200 rounded-3xl border-dashed">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            {filterType === 'archived' ? <Archive className="w-10 h-10 text-slate-400" /> : <Users className="w-10 h-10 text-slate-400" />}
          </div>
          <h3 className="text-xl font-semibold text-slate-900">No workspaces found</h3>
          <p className="text-slate-500 mt-2 mb-8">
            {searchQuery ? 'Try adjusting your search query' : filterType === 'archived' ? 'No archived workspaces' : 'Create a workspace to collaborate with your team'}
          </p>
          {!searchQuery && filterType !== 'archived' && (
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setIsCreateModalOpen(true)}>Create Workspace</Button>
          )}
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredWorkspaces.map((workspace) => (
              <motion.div 
                key={workspace.id} 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Card 
                  className={`cursor-pointer transition-colors h-full border-slate-200 rounded-2xl overflow-hidden group ${workspace.status === 'archived' ? 'opacity-75 bg-slate-50/50' : 'hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100/40 bg-white'}`} 
                  onClick={() => workspace.status !== 'archived' && navigate(`/workspaces/${workspace.id}`)}
                >
                  <CardContent className="p-6 h-full flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-2xl relative shadow-md group-hover:scale-105 transition-transform">
                        {workspace.name.charAt(0).toUpperCase()}
                        {workspace.is_favorite && (
                          <div className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-white rounded-full p-1 shadow-sm">
                            <Star className="w-3.5 h-3.5 fill-current" />
                          </div>
                        )}
                      </div>
                      <div onClick={e => e.stopPropagation()} className="relative z-10">
                        <Dropdown 
                          items={[
                            ...(workspace.status !== 'archived' ? [
                              { label: 'Edit', icon: Edit, onClick: () => openEditModal(workspace) },
                              { label: 'Settings', icon: Settings, onClick: () => navigate(`/workspaces/${workspace.id}`) },
                              { label: workspace.is_favorite ? 'Unfavorite' : 'Favorite', icon: Star, onClick: () => toggleFavorite(workspace) },
                              { label: 'Archive', icon: Archive, onClick: () => toggleArchive(workspace) },
                            ] : [
                              { label: 'Restore', icon: RotateCcw, onClick: () => toggleArchive(workspace) },
                            ]),
                            { label: 'Delete', icon: Trash2, danger: true, onClick: () => handleDeleteWorkspace(workspace.id) },
                          ]}
                        />
                      </div>
                    </div>
                    <div className="mt-auto">
                      <h3 className="font-bold text-lg text-slate-900 mb-2 flex items-center gap-2">
                        <span className="truncate">{workspace.name}</span>
                        {workspace.status === 'archived' && <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full shrink-0 font-semibold border border-slate-200">Archived</span>}
                      </h3>
                      <div className="flex items-center gap-5 text-sm text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                          <Users className="w-4 h-4 text-indigo-500" />
                          {workspace.workspace_members?.[0]?.count || 1} members
                        </span>
                        <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                          <Folder className="w-4 h-4 text-emerald-500" />
                          {workspace.projects?.[0]?.count || 0} projects
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Create Workspace Modal */}
      <Dialog 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Workspace"
        description="Add a new workspace to organize your projects and teams."
      >
        <form onSubmit={handleCreateWorkspace} className="mt-4 space-y-4">
          <Input 
            label="Workspace Name" 
            placeholder="e.g. Acme Corp" 
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            required
            autoFocus
          />
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || !workspaceName.trim()}>
              {isSubmitting ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Workspace Modal */}
      <Dialog 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Workspace"
      >
        <form onSubmit={handleEditWorkspace} className="mt-4 space-y-4">
          <Input 
            label="Workspace Name" 
            placeholder="e.g. Acme Corp" 
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            required
            autoFocus
          />
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || !workspaceName.trim() || workspaceName === currentWorkspace?.name}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Dialog>
    </motion.div>
  );
}

