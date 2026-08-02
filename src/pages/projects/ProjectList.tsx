import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog } from '../../components/ui/Dialog';
import { Dropdown } from '../../components/ui/Dropdown';
import { Skeleton } from '../../components/ui/Skeleton';
import { Plus, Folder, Search, ListFilter as Filter, Star, HardDrive, CreditCard as Edit, Trash2, Archive, Link as LinkIcon, RotateCcw, Copy, Tag } from 'lucide-react';
import { api } from '../../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { formatRelativeTime, type Project, type Workspace } from '../../lib/types';

export function ProjectList() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');
  const [filterFavorite, setFilterFavorite] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectCategory, setProjectCategory] = useState('');
  const [projectTags, setProjectTags] = useState('');
  const [projectCover, setProjectCover] = useState('');
  const [createWorkspaceId, setCreateWorkspaceId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [workspacesData, allProjectsData] = await Promise.all([
        api.workspaces.list(),
        api.projects.listAll(),
      ]);
      setWorkspaces(workspacesData.workspaces || []);
      setProjects(allProjectsData.projects || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshProjects = async () => {
    const allProjectsData = await api.projects.listAll();
    setProjects(allProjectsData.projects || []);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createWorkspaceId) return;
    setIsSubmitting(true);
    try {
      await api.projects.create({
        name: projectName,
        description: projectDescription,
        workspace_id: createWorkspaceId,
        metadata: {
          category: projectCategory,
          tags: projectTags.split(',').map(t => t.trim()).filter(Boolean),
          cover_image: projectCover
        }
      });
      setIsCreateModalOpen(false);
      resetForm();
      await refreshProjects();
    } catch (error) {
      console.error('Failed to create project', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;
    setIsSubmitting(true);
    try {
      await api.projects.update(currentProject.id, {
        name: projectName,
        description: projectDescription,
        metadata: {
          ...currentProject.metadata,
          category: projectCategory,
          tags: projectTags.split(',').map(t => t.trim()).filter(Boolean),
          cover_image: projectCover
        }
      });
      setIsEditModalOpen(false);
      resetForm();
      await refreshProjects();
    } catch (error) {
      console.error('Failed to update project', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await api.projects.delete(id);
        await refreshProjects();
      } catch (error) {
        console.error('Failed to delete project', error);
      }
    }
  };

  const toggleArchive = async (project: Project) => {
    try {
      await api.projects.update(project.id, { is_deleted: !project.is_deleted });
      await refreshProjects();
    } catch (error) {
      console.error('Failed to archive project', error);
    }
  };

  const toggleFavorite = async (project: Project) => {
    try {
      await api.projects.update(project.id, { is_favorite: !project.is_favorite });
      await refreshProjects();
    } catch (error) {
      console.error('Failed to favorite project', error);
    }
  };

  const handleDuplicate = async (project: Project) => {
    try {
      await api.projects.create({
        name: `${project.name} (Copy)`,
        description: project.description,
        workspace_id: project.workspace_id,
        metadata: project.metadata
      });
      await refreshProjects();
    } catch (error) {
      console.error('Failed to duplicate project', error);
    }
  };

  const togglePin = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    try {
      const isPinned = project.metadata?.is_pinned || false;
      await api.projects.update(project.id, {
        metadata: { ...project.metadata, is_pinned: !isPinned }
      });
      await refreshProjects();
    } catch (error) {
      console.error('Failed to pin project', error);
    }
  };

  const resetForm = () => {
    setProjectName('');
    setProjectDescription('');
    setProjectCategory('');
    setProjectTags('');
    setProjectCover('');
    setCurrentProject(null);
  };

  const openCreateModal = () => {
    resetForm();
    if (workspaces.length > 0) setCreateWorkspaceId(workspaces[0].id);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (project: Project) => {
    setCurrentProject(project);
    setProjectName(project.name);
    setProjectDescription(project.description || '');
    setProjectCategory(project.metadata?.category || '');
    setProjectTags((project.metadata?.tags || []).join(', '));
    setProjectCover(project.metadata?.cover_image || '');
    setIsEditModalOpen(true);
  };

  const filteredProjects = projects
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.metadata?.tags && p.metadata.tags.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchesCategory = filterCategory === 'all' || p.metadata?.category === filterCategory;
      const matchesStatus = filterStatus === 'archived' ? p.is_deleted === true : (p.is_deleted === false || p.is_deleted === null || p.is_deleted === undefined);
      const matchesFavorite = !filterFavorite || p.is_favorite;
      const matchesWorkspace = selectedWorkspaceId === 'all' || p.workspace_id === selectedWorkspaceId;

      return matchesSearch && matchesCategory && matchesStatus && matchesFavorite && matchesWorkspace;
    })
    .sort((a, b) => {
      const aPinned = a.metadata?.is_pinned ? 1 : 0;
      const bPinned = b.metadata?.is_pinned ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const categories = ['all', ...Array.from(new Set(projects.map(p => p.metadata?.category).filter(Boolean)))];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
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
      className="space-y-6 max-w-7xl mx-auto px-1"
    >
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Projects</h1>
          <p className="text-slate-500 mt-2">Organize your files into collaborative projects</p>
        </div>
        <Button className="gap-2 shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto justify-center shadow-md shadow-indigo-200" onClick={openCreateModal} disabled={workspaces.length === 0}>
          <Plus className="w-5 h-5" />
          New Project
        </Button>
      </motion.div>

      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            className="pl-10 bg-white border-slate-200 hover:border-slate-300 transition-colors rounded-xl h-12 w-full text-base"
            placeholder="Search projects, descriptions, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Workspace selector */}
        <select
          className="px-4 h-12 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
          value={selectedWorkspaceId}
          onChange={(e) => setSelectedWorkspaceId(e.target.value)}
        >
          <option value="all">All Workspaces</option>
          {workspaces.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>

        <div className="relative">
          <Button variant="outline" className="gap-2 px-4 h-12 w-full sm:w-auto justify-between sm:justify-center rounded-xl bg-white border-slate-200 hover:bg-slate-50" onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-500" />
              <span className="font-medium text-slate-700">Filter</span>
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
                <div className="px-5 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">Status</div>
                <button className={`w-full text-left px-5 py-2.5 text-sm hover:bg-indigo-50 transition-colors ${filterStatus === 'active' && !filterFavorite ? 'font-semibold bg-indigo-50/50 text-indigo-700' : 'text-slate-700'}`} onClick={() => { setFilterStatus('active'); setFilterFavorite(false); setIsFilterDropdownOpen(false); }}>Active</button>
                <button className={`w-full text-left px-5 py-2.5 text-sm hover:bg-indigo-50 transition-colors ${filterFavorite ? 'font-semibold bg-indigo-50/50 text-indigo-700' : 'text-slate-700'}`} onClick={() => { setFilterFavorite(true); setIsFilterDropdownOpen(false); }}>Favorites</button>
                <button className={`w-full text-left px-5 py-2.5 text-sm hover:bg-indigo-50 transition-colors ${filterStatus === 'archived' ? 'font-semibold bg-indigo-50/50 text-indigo-700' : 'text-slate-700'}`} onClick={() => { setFilterStatus('archived'); setFilterFavorite(false); setIsFilterDropdownOpen(false); }}>Archived</button>

                <div className="border-t border-slate-100 my-2"></div>
                <div className="px-5 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">Category</div>
                {categories.map((cat: any) => (
                  <button
                    key={cat}
                    className={`w-full text-left px-5 py-2.5 text-sm hover:bg-indigo-50 transition-colors capitalize ${filterCategory === cat ? 'font-semibold bg-indigo-50/50 text-indigo-700' : 'text-slate-700'}`}
                    onClick={() => { setFilterCategory(cat); setIsFilterDropdownOpen(false); }}
                  >
                    {cat === 'all' ? 'All Categories' : cat}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {isLoading ? (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-slate-200">
              <div className="h-32 bg-slate-100 rounded-t-2xl" />
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-3/4 rounded-md" />
                <div className="flex justify-between items-center pt-2">
                  <Skeleton className="h-4 w-20 rounded-md" />
                  <Skeleton className="h-4 w-16 rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      ) : workspaces.length === 0 ? (
        <motion.div variants={itemVariants} className="text-center py-24 bg-white/50 border border-slate-200 rounded-3xl border-dashed">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Folder className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900">No workspaces available</h3>
          <p className="text-slate-500 mt-2 mb-8">You need to create or join a workspace before creating projects.</p>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => navigate('/workspaces')}>Go to Workspaces</Button>
        </motion.div>
      ) : filteredProjects.length === 0 ? (
        <motion.div variants={itemVariants} className="text-center py-24 bg-white/50 border border-slate-200 rounded-3xl border-dashed">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            {filterStatus === 'archived' ? <Archive className="w-10 h-10 text-slate-400" /> : <Folder className="w-10 h-10 text-slate-400" />}
          </div>
          <h3 className="text-xl font-semibold text-slate-900">No projects found</h3>
          <p className="text-slate-500 mt-2 mb-8">
            {searchQuery ? 'Try adjusting your search' : filterStatus === 'archived' ? 'No archived projects' : 'Create your first project to get started.'}
          </p>
          {!searchQuery && filterStatus !== 'archived' && !filterFavorite && (
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={openCreateModal}>Create Project</Button>
          )}
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          <AnimatePresence>
            {filteredProjects.map((project) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Card className={`group transition-all cursor-pointer h-full border-slate-200 rounded-2xl overflow-hidden ${project.is_deleted ? 'opacity-75 bg-slate-50/50' : 'hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100/40 bg-white'}`} onClick={() => !project.is_deleted && navigate(`/projects/${project.id}`)}>
                  <CardContent className="p-0 h-full flex flex-col">
                    <div className="h-36 bg-slate-100 relative flex items-center justify-center overflow-hidden border-b border-slate-100 group-hover:border-indigo-50 transition-colors">
                      {project.metadata?.cover_image ? (
                        <img src={project.metadata.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center group-hover:from-indigo-50 group-hover:to-indigo-100/50 transition-colors">
                          <Folder className="w-12 h-12 text-slate-300 group-hover:text-indigo-300 transition-colors" />
                        </div>
                      )}
                      <button
                        onClick={(e) => togglePin(e, project)}
                        className={`absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-md shadow-sm transition-all z-10 ${project.metadata?.is_pinned ? 'text-indigo-600 opacity-100 scale-100' : 'text-slate-400 hover:text-indigo-600 opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 hover:bg-white'}`}
                      >
                        <Star className="w-4 h-4" fill={project.metadata?.is_pinned ? "currentColor" : "none"} />
                      </button>
                      {project.metadata?.category && (
                        <span className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-lg shadow-sm z-10 border border-slate-100">
                          {project.metadata.category}
                        </span>
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-bold text-slate-900 line-clamp-1 flex items-center gap-2 text-lg">
                          {project.name}
                          {project.is_deleted && <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded shrink-0 border border-slate-200">Archived</span>}
                        </h3>
                        <div onClick={(e) => e.stopPropagation()} className="shrink-0 -mt-1 -mr-1">
                          <Dropdown
                            items={[
                              ...(!project.is_deleted ? [
                                { label: 'Edit', icon: Edit, onClick: () => openEditModal(project) },
                                { label: 'Duplicate', icon: Copy, onClick: () => handleDuplicate(project) },
                                { label: project.is_favorite ? 'Unfavorite' : 'Favorite', icon: Star, onClick: () => toggleFavorite(project) },
                                { label: 'Archive', icon: Archive, onClick: () => toggleArchive(project) },
                              ] : [
                                { label: 'Restore', icon: RotateCcw, onClick: () => toggleArchive(project) },
                              ]),
                              { label: 'Delete', icon: Trash2, danger: true, onClick: () => handleDeleteProject(project.id) },
                            ]}
                          />
                        </div>
                      </div>
                      {project.description && (
                        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-4">{project.description}</p>
                      )}

                      <div className="mt-auto">
                        {project.metadata?.tags && project.metadata.tags.length > 0 && (
                          <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                            <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {project.metadata.tags.slice(0, 3).map((tag: string, i: number) => (
                              <span key={i} className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                {tag}
                              </span>
                            ))}
                            {project.metadata.tags.length > 3 && (
                              <span className="text-xs font-medium text-slate-500">+{project.metadata.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs font-medium text-slate-500 pt-3 border-t border-slate-100">
                          <span>{formatRelativeTime(project.created_at)}</span>
                          <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                            <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                            {project.files?.[0]?.count || 0} files
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Create Project Modal */}
      <Dialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Project"
        description="Add a new project to your workspace."
      >
        <form onSubmit={handleCreateProject} className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Workspace</label>
            <select
              value={createWorkspaceId}
              onChange={(e) => setCreateWorkspaceId(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            >
              {workspaces.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <Input
            label="Project Name"
            placeholder="e.g. Q4 Marketing Assets"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
            autoFocus
          />
          <Input
            label="Description (Optional)"
            placeholder="Brief description of the project"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Category"
              placeholder="e.g. Marketing"
              value={projectCategory}
              onChange={(e) => setProjectCategory(e.target.value)}
            />
            <Input
              label="Tags"
              placeholder="brand, assets, 2026"
              value={projectTags}
              onChange={(e) => setProjectTags(e.target.value)}
            />
          </div>
          <Input
            label="Cover Image URL (Optional)"
            placeholder="https://example.com/image.jpg"
            value={projectCover}
            onChange={(e) => setProjectCover(e.target.value)}
          />
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || !projectName.trim()}>
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Project Modal */}
      <Dialog
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Project"
      >
        <form onSubmit={handleEditProject} className="mt-4 space-y-4">
          <Input
            label="Project Name"
            placeholder="e.g. Q4 Marketing Assets"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
            autoFocus
          />
          <Input
            label="Description (Optional)"
            placeholder="Brief description of the project"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Category"
              placeholder="e.g. Marketing"
              value={projectCategory}
              onChange={(e) => setProjectCategory(e.target.value)}
            />
            <Input
              label="Tags"
              placeholder="brand, assets, 2026"
              value={projectTags}
              onChange={(e) => setProjectTags(e.target.value)}
            />
          </div>
          <Input
            label="Cover Image URL (Optional)"
            placeholder="https://example.com/image.jpg"
            value={projectCover}
            onChange={(e) => setProjectCover(e.target.value)}
          />
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || !projectName.trim()}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Dialog>
    </motion.div>
  );
}
