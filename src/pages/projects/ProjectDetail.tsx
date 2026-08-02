import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Folder, Users, Settings, Activity, FileText, Share2,
  BarChart, Grid, List as ListIcon, Search, Upload, Plus, Star, Tag, Pin, HardDrive, Crown, Shield, User as UserIcon, Lock
} from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog } from '../../components/ui/Dialog';
import { Card, CardContent } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { FileUploader } from '../../components/files/FileUploader';
import { FileList } from '../../components/files/FileList';
import { FileFilters } from '../../components/files/FileFilters';
import { ProjectMembers } from '../../components/projects/ProjectMembers';
import { ProjectSharing } from '../../components/projects/ProjectSharing';
import { ProjectAnalytics } from '../../components/projects/ProjectAnalytics';
import { AccessDenied } from './AccessDenied';
import { useAuth } from '../../contexts/AuthContext';
import { formatBytes, formatRelativeTime, matchesFileType, matchesDateFilter, sortFiles, type Project, type FileItem, type EditorPermission } from '../../lib/types';
import { motion, AnimatePresence } from 'motion/react';

const OWNER_TABS = ['overview', 'files', 'members', 'sharing', 'analytics', 'settings'] as const;
const EDITOR_TABS = ['overview', 'files', 'analytics'] as const;
const TEAM_TABS = ['files'] as const;

type Tab = string;

export function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<EditorPermission[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isUploading, setIsUploading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date_created');
  const [dateFilter, setDateFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');

  // Modals
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [fileToRename, setFileToRename] = useState<FileItem | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [fileToMove, setFileToMove] = useState<FileItem | null>(null);
  const [fileToCopy, setFileToCopy] = useState<FileItem | null>(null);
  const [fileToViewMetadata, setFileToViewMetadata] = useState<FileItem | null>(null);
  const [fileToViewHistory, setFileToViewHistory] = useState<FileItem | null>(null);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [shareLink, setShareLink] = useState('');
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [selectedTargetProject, setSelectedTargetProject] = useState('');

  // Settings
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDescription, setEditProjectDescription] = useState('');
  const [editProjectCategory, setEditProjectCategory] = useState('');
  const [editProjectTags, setEditProjectTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    try {
      setIsLoading(true);

      // Check access first
      try {
        const roleRes = await api.members.getMyRole(projectId);
        setUserRole(roleRes.role);
        setUserPermissions(roleRes.permissions || []);
      } catch (err: any) {
        if (err.message?.includes('Access denied') || err.message?.includes('403')) {
          setAccessDenied(true);
          setIsLoading(false);
          return;
        }
        // If role check fails, assume owner (backward compat)
        setUserRole('owner');
      }

      const [projectRes, filesRes] = await Promise.all([
        api.projects.get(projectId),
        api.files.list(projectId),
      ]);
      setProject(projectRes.project || null);
      setEditProjectName(projectRes.project?.name || '');
      setEditProjectDescription(projectRes.project?.description || '');
      setEditProjectCategory(projectRes.project?.metadata?.category || '');
      setEditProjectTags((projectRes.project?.metadata?.tags || []).join(', '));
      setFiles(filesRes.files || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchProjectsForMove = async () => {
    try {
      const res = await api.projects.listAll();
      setProjectsList((res.projects || []).filter((p: Project) => p.id !== projectId));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (userRole === 'owner' || (userRole === 'editor' && userPermissions.includes('move_files'))) {
      fetchProjectsForMove();
    }
  }, [userRole, userPermissions, projectId]);

  const isOwner = userRole === 'owner';
  const canUpload = isOwner || (userRole === 'editor' && (userPermissions.includes('upload_files') || userPermissions.includes('full_edit')));
  const canDeleteFiles = isOwner || (userRole === 'editor' && (userPermissions.includes('delete_files') || userPermissions.includes('full_edit')));
  const canRenameFiles = isOwner || (userRole === 'editor' && (userPermissions.includes('rename_files') || userPermissions.includes('full_edit')));
  const canMoveFiles = isOwner || (userRole === 'editor' && (userPermissions.includes('move_files') || userPermissions.includes('full_edit')));
  const canShare = isOwner || (userRole === 'editor' && (userPermissions.includes('manage_sharing') || userPermissions.includes('full_edit')));

  const availableTabs = isOwner ? OWNER_TABS : userRole === 'editor' ? EDITOR_TABS : TEAM_TABS;

  const handleDownload = (file: FileItem) => {
    if (file.storage_path) {
      window.open(file.storage_path, '_blank');
      api.files.trackDownload(file.id).catch(() => {});
    }
  };

  const handlePreview = (file: FileItem) => {
    if (file.storage_path) {
      setPreviewFile(file);
      api.files.trackView(file.id).catch(() => {});
    }
  };

  const handleShare = async (file: FileItem) => {
    try {
      const res = await api.shares.create({ project_id: projectId, file_id: file.id });
      const link = res.url || `${window.location.origin}/share/${res.share?.share_token}`;
      setShareLink(link);
      navigator.clipboard.writeText(link);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRenameFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fileToRename && newFileName) {
      try {
        await api.files.update(fileToRename.id, { name: newFileName });
        fetchData();
        setIsRenameOpen(false);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const openRenameModal = (id: string) => {
    const f = files.find(f => f.id === id);
    if (f) {
      setFileToRename(f);
      setNewFileName(f.name);
      setIsRenameOpen(true);
    }
  };

  const handleDeleteFile = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await api.files.delete(id);
        fetchData();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleMoveFile = async () => {
    if (fileToMove && selectedTargetProject) {
      try {
        await api.files.update(fileToMove.id, { project_id: selectedTargetProject });
        setFileToMove(null);
        setSelectedTargetProject('');
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleCopyFile = async () => {
    if (fileToCopy && selectedTargetProject) {
      try {
        await api.files.copy(fileToCopy.id, { target_project_id: selectedTargetProject });
        setFileToCopy(null);
        setSelectedTargetProject('');
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.projects.update(projectId!, {
        name: editProjectName,
        description: editProjectDescription,
        metadata: {
          ...project?.metadata,
          category: editProjectCategory,
          tags: editProjectTags.split(',').map(t => t.trim()).filter(Boolean),
        }
      });
      fetchData();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchiveProject = async () => {
    try {
      await api.projects.update(projectId!, { is_deleted: !project?.is_deleted });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteProject = async () => {
    try {
      await api.projects.delete(projectId!);
      navigate('/projects');
    } catch (error) {
      console.error(error);
    }
  };

  const toggleFavorite = async () => {
    try {
      await api.projects.update(projectId!, { is_favorite: !project?.is_favorite });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const togglePin = async () => {
    try {
      const isPinned = project?.metadata?.is_pinned || false;
      await api.projects.update(projectId!, {
        metadata: { ...project?.metadata, is_pinned: !isPinned }
      });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  // Filter and sort files
  let filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  filteredFiles = filteredFiles.filter(f => matchesFileType(f, filterType));
  filteredFiles = filteredFiles.filter(f => matchesDateFilter(f, dateFilter));
  if (ownerFilter === 'mine') {
    filteredFiles = filteredFiles.filter(f => f.uploaded_by === user?.id);
  }
  filteredFiles = sortFiles(filteredFiles, sortBy);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return <AccessDenied />;
  }

  if (!project) {
    return (
      <div className="text-center py-24">
        <h2 className="text-xl font-semibold text-slate-900">Project not found</h2>
        <Button className="mt-4" onClick={() => navigate('/projects')}>Back to Projects</Button>
      </div>
    );
  }

  const tabs = availableTabs.map(tabId => {
    const tabConfig: Record<string, { label: string; icon: any }> = {
      overview: { label: 'Overview', icon: Activity },
      files: { label: 'Files', icon: FileText },
      members: { label: 'Members', icon: Users },
      sharing: { label: 'Sharing', icon: Share2 },
      analytics: { label: 'Analytics', icon: BarChart },
      settings: { label: 'Settings', icon: Settings },
    };
    return { id: tabId, ...tabConfig[tabId] };
  });

  const totalSize = files.reduce((acc, f) => acc + (f.size_bytes || 0), 0);
  const roleIcon = (role: string) => {
    if (role === 'owner') return <Crown className="w-4 h-4 text-amber-500" />;
    if (role === 'editor') return <Shield className="w-4 h-4 text-blue-500" />;
    return <UserIcon className="w-4 h-4 text-slate-400" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto px-1"
    >
      {/* Breadcrumb + Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <Link to="/projects" className="hover:text-indigo-600 transition-colors">Projects</Link>
            <span>/</span>
            <span className="font-medium text-slate-900">{project.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">{project.name}</h1>
            {project.is_deleted && <span className="text-xs px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-semibold border border-amber-200">Archived</span>}
            {project.is_favorite && <Star className="w-5 h-5 text-amber-400 fill-amber-400" />}
            {project.metadata?.is_pinned && <Pin className="w-5 h-5 text-indigo-500 fill-indigo-500" />}
          </div>
          {project.description && <p className="text-slate-500 mt-2 text-sm md:text-base">{project.description}</p>}
          <div className="flex items-center gap-2 mt-2">
            {roleIcon(userRole || 'team')}
            <span className="text-sm text-slate-500 capitalize">{userRole}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {isOwner && (
            <>
              <Button variant="outline" size="sm" className="gap-2 flex-1 sm:flex-none justify-center" onClick={toggleFavorite}>
                <Star className={`w-4 h-4 ${project.is_favorite ? 'text-amber-400 fill-amber-400' : ''}`} />
                <span className="hidden sm:inline">{project.is_favorite ? 'Favorited' : 'Favorite'}</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-2 flex-1 sm:flex-none justify-center" onClick={togglePin}>
                <Pin className={`w-4 h-4 ${project.metadata?.is_pinned ? 'text-indigo-500 fill-indigo-500' : ''}`} />
                <span className="hidden sm:inline">Pin</span>
              </Button>
            </>
          )}
          {canShare && (
            <Button variant="outline" size="sm" className="gap-2 flex-1 sm:flex-none justify-center" onClick={() => setActiveTab('sharing')}>
              <Share2 className="w-4 h-4" /> Share
            </Button>
          )}
          {canUpload && (
            <Button size="sm" className="gap-2 flex-1 sm:flex-none justify-center bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setIsUploading(!isUploading)} disabled={project.is_deleted}>
              <Upload className="w-4 h-4" /> Upload
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white/50 backdrop-blur-sm sticky top-0 z-10 -mx-4 px-4 sm:mx-0 sm:px-0">
        <nav className="flex space-x-2 md:space-x-6 overflow-x-auto scrollbar-hide py-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 px-3 md:px-1 text-sm font-medium border-b-2 transition-all whitespace-nowrap relative ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="py-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="md:col-span-2 space-y-4 md:space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Card className="shadow-sm">
                      <CardContent className="p-4">
                        <FileText className="w-5 h-5 text-indigo-500 mb-2" />
                        <p className="text-2xl font-bold text-slate-900">{files.length}</p>
                        <p className="text-xs text-slate-500">Files</p>
                      </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                      <CardContent className="p-4">
                        <HardDrive className="w-5 h-5 text-emerald-500 mb-2" />
                        <p className="text-2xl font-bold text-slate-900">{formatBytes(totalSize)}</p>
                        <p className="text-xs text-slate-500">Storage</p>
                      </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                      <CardContent className="p-4">
                        <Users className="w-5 h-5 text-blue-500 mb-2" />
                        <p className="text-2xl font-bold text-slate-900">{files.length > 0 ? 'Active' : 'Empty'}</p>
                        <p className="text-xs text-slate-500">Status</p>
                      </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                      <CardContent className="p-4">
                        <Activity className="w-5 h-5 text-amber-500 mb-2" />
                        <p className="text-2xl font-bold text-slate-900">{formatRelativeTime(project.updated_at || project.created_at)}</p>
                        <p className="text-xs text-slate-500">Updated</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Activity */}
                  <Card className="shadow-sm">
                    <CardContent className="p-5">
                      <h3 className="font-semibold text-slate-900 mb-4">Recent Activity</h3>
                      <RecentActivity projectId={projectId!} />
                    </CardContent>
                  </Card>

                  {/* Recent Uploads */}
                  <Card className="shadow-sm">
                    <CardContent className="p-5">
                      <h3 className="font-semibold text-slate-900 mb-4">Recent Uploads</h3>
                      {files.length === 0 ? (
                        <p className="text-sm text-slate-500">No files uploaded yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {files.slice(0, 5).map(f => (
                            <div key={f.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer" onClick={() => handlePreview(f)}>
                              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="text-sm font-medium text-slate-900 truncate flex-1">{f.name}</span>
                              <span className="text-xs text-slate-500 shrink-0">{formatBytes(f.size_bytes)}</span>
                              <span className="text-xs text-slate-400 shrink-0">{formatRelativeTime(f.created_at)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4 md:space-y-6">
                  {/* About */}
                  <Card className="shadow-sm">
                    <CardContent className="p-5">
                      <h3 className="font-semibold text-slate-900 mb-3">About Project</h3>
                      <p className="text-sm text-slate-600 mb-4">{project.description || 'No description provided.'}</p>
                      {project.metadata?.category && (
                        <span className="inline-block text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md mb-3">{project.metadata.category}</span>
                      )}
                      {project.metadata?.tags && project.metadata.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap mb-4">
                          <Tag className="w-3.5 h-3.5 text-slate-400" />
                          {project.metadata.tags.map((tag, i) => (
                            <span key={i} className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{tag}</span>
                          ))}
                        </div>
                      )}
                      <div className="space-y-2 pt-3 border-t border-slate-100">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Created</span>
                          <span className="font-medium text-slate-900">{new Date(project.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Size</span>
                          <span className="font-medium text-slate-900">{formatBytes(totalSize)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Your Role</span>
                          <span className="font-medium text-slate-900 capitalize">{userRole}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card className="shadow-sm">
                    <CardContent className="p-5">
                      <h3 className="font-semibold text-slate-900 mb-3">Quick Actions</h3>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => setActiveTab('files')}>
                          <FileText className="w-4 h-4" /> Browse Files
                        </Button>
                        {canUpload && (
                          <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => { setActiveTab('files'); setIsUploading(true); }}>
                            <Upload className="w-4 h-4" /> Upload Files
                          </Button>
                        )}
                        {isOwner && (
                          <>
                            <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => setActiveTab('members')}>
                              <Users className="w-4 h-4" /> Manage Members
                            </Button>
                            <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => setActiveTab('settings')}>
                              <Settings className="w-4 h-4" /> Project Settings
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Files Tab */}
            {activeTab === 'files' && (
              <div className="space-y-6">
                {isUploading && (
                  <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-slate-900">Upload Files</h3>
                        <button onClick={() => setIsUploading(false)} className="text-sm text-slate-500 hover:text-slate-900">Close</button>
                      </div>
                      <FileUploader projectId={projectId!} onUploadComplete={() => { fetchData(); setIsUploading(false); }} onCancel={() => setIsUploading(false)} />
                    </CardContent>
                  </Card>
                )}

                <FileFilters
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  filterType={filterType}
                  setFilterType={setFilterType}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  dateFilter={dateFilter}
                  setDateFilter={setDateFilter}
                  ownerFilter={ownerFilter}
                  setOwnerFilter={setOwnerFilter}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                />

                <FileList
                  files={filteredFiles}
                  view={viewMode}
                  onDelete={canDeleteFiles ? handleDeleteFile : () => {}}
                  onShare={canShare ? handleShare : () => {}}
                  onRename={canRenameFiles ? openRenameModal : undefined}
                  onMove={canMoveFiles ? (id) => { const f = files.find(x => x.id === id); if (f) { setFileToMove(f); setSelectedTargetProject(f.project_id); } } : undefined}
                  onCopy={canMoveFiles ? (id) => { const f = files.find(x => x.id === id); if (f) { setFileToCopy(f); setSelectedTargetProject(f.project_id); } } : undefined}
                  onPreview={handlePreview}
                  onDownload={handleDownload}
                  onViewMetadata={setFileToViewMetadata}
                  onViewHistory={setFileToViewHistory}
                />
              </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <ProjectMembers projectId={projectId!} isOwner={isOwner} />
            )}

            {/* Sharing Tab */}
            {activeTab === 'sharing' && (
              <ProjectSharing projectId={projectId!} isOwner={isOwner} />
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <ProjectAnalytics projectId={projectId!} files={files} />
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && isOwner && (
              <div className="max-w-3xl space-y-6">
                <Card className="shadow-sm">
                  <CardContent className="p-6 space-y-6">
                    <h3 className="text-lg font-semibold text-slate-900">General Settings</h3>
                    <form className="space-y-4" onSubmit={handleUpdateProject}>
                      <Input label="Project Name" value={editProjectName} onChange={(e) => setEditProjectName(e.target.value)} />
                      <Input label="Description" value={editProjectDescription} onChange={(e) => setEditProjectDescription(e.target.value)} />
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Category" value={editProjectCategory} onChange={(e) => setEditProjectCategory(e.target.value)} />
                        <Input label="Tags (comma separated)" value={editProjectTags} onChange={(e) => setEditProjectTags(e.target.value)} />
                      </div>
                      <div className="pt-2 flex justify-end">
                        <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-red-200">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-red-900">Danger Zone</h3>
                    <div className="flex items-center justify-between p-4 border border-red-200 rounded-xl bg-red-50">
                      <div>
                        <h5 className="font-medium text-red-900">{project.is_deleted ? 'Restore Project' : 'Archive Project'}</h5>
                        <p className="text-sm text-red-700 mt-1">{project.is_deleted ? 'Restore to active status.' : 'Hide from main list.'}</p>
                      </div>
                      <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-100 shrink-0" onClick={handleArchiveProject}>
                        {project.is_deleted ? 'Restore' : 'Archive'}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-red-300 rounded-xl bg-red-50">
                      <div>
                        <h5 className="font-medium text-red-900">Delete Project</h5>
                        <p className="text-sm text-red-700 mt-1">Permanently delete this project and all its files.</p>
                      </div>
                      <Button variant="danger" className="shrink-0" onClick={() => setIsDeleteOpen(true)}>Delete</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dialogs */}
      <Dialog isOpen={isRenameOpen} onClose={() => setIsRenameOpen(false)} title="Rename File">
        <form onSubmit={handleRenameFile} className="mt-4 space-y-4">
          <Input label="File Name" value={newFileName} onChange={(e) => setNewFileName(e.target.value)} autoFocus required />
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsRenameOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={!newFileName.trim()}>Rename</Button>
          </div>
        </form>
      </Dialog>

      <Dialog isOpen={!!fileToMove} onClose={() => setFileToMove(null)} title="Move File">
        <div className="mt-4 space-y-4">
          <p className="text-sm text-slate-600">Select a project to move "{fileToMove?.name}" to.</p>
          <select className="w-full p-2 border border-slate-200 rounded-lg" value={selectedTargetProject} onChange={(e) => setSelectedTargetProject(e.target.value)}>
            <option value="">Select Target Project</option>
            {projectsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setFileToMove(null)}>Cancel</Button>
            <Button type="button" onClick={handleMoveFile} disabled={!selectedTargetProject}>Move File</Button>
          </div>
        </div>
      </Dialog>

      <Dialog isOpen={!!fileToCopy} onClose={() => setFileToCopy(null)} title="Copy File">
        <div className="mt-4 space-y-4">
          <p className="text-sm text-slate-600">Select a project to copy "{fileToCopy?.name}" to.</p>
          <select className="w-full p-2 border border-slate-200 rounded-lg" value={selectedTargetProject} onChange={(e) => setSelectedTargetProject(e.target.value)}>
            <option value="">Select Target Project</option>
            {projectsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setFileToCopy(null)}>Cancel</Button>
            <Button type="button" onClick={handleCopyFile} disabled={!selectedTargetProject}>Copy File</Button>
          </div>
        </div>
      </Dialog>

      <Dialog isOpen={!!fileToViewMetadata} onClose={() => setFileToViewMetadata(null)} title="File Metadata">
        <div className="mt-4 space-y-3">
          <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Name</span><span className="font-medium">{fileToViewMetadata?.name}</span></div>
          <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Type</span><span className="font-medium">{fileToViewMetadata?.mime_type}</span></div>
          <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Size</span><span className="font-medium">{formatBytes(fileToViewMetadata?.size_bytes || 0)}</span></div>
          <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Views</span><span className="font-medium">{fileToViewMetadata?.view_count || 0}</span></div>
          <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Downloads</span><span className="font-medium">{fileToViewMetadata?.download_count || 0}</span></div>
          <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Created</span><span className="font-medium">{fileToViewMetadata ? new Date(fileToViewMetadata.created_at).toLocaleString() : ''}</span></div>
          <div className="pt-4 flex justify-end"><Button type="button" onClick={() => setFileToViewMetadata(null)}>Close</Button></div>
        </div>
      </Dialog>

      <Dialog isOpen={!!fileToViewHistory} onClose={() => setFileToViewHistory(null)} title="Version History">
        <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold">v1</div>
            <div>
              <p className="text-sm font-medium">Initial Upload</p>
              <p className="text-xs text-slate-500">{fileToViewHistory ? new Date(fileToViewHistory.created_at).toLocaleString() : ''}</p>
            </div>
            <div className="ml-auto"><Button variant="outline" className="text-xs py-1 h-8" onClick={() => fileToViewHistory && handleDownload(fileToViewHistory)}>Download</Button></div>
          </div>
          <p className="text-xs text-slate-500 text-center py-4">No other versions exist for this file.</p>
          <div className="pt-4 flex justify-end"><Button type="button" onClick={() => setFileToViewHistory(null)}>Close</Button></div>
        </div>
      </Dialog>

      <Dialog isOpen={!!previewFile} onClose={() => setPreviewFile(null)} title="File Preview">
        <div className="mt-4 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[300px]">
          {previewFile?.mime_type?.startsWith('image/') ? (
            <img src={previewFile.storage_path} alt="Preview" className="max-w-full max-h-[60vh] object-contain rounded" />
          ) : (
            <div className="text-center">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-900 font-medium">{previewFile?.name}</p>
              <p className="text-sm text-slate-500 mt-1">Preview not available for this file type.</p>
              <Button className="mt-4" onClick={() => previewFile && handleDownload(previewFile)}>Download to View</Button>
            </div>
          )}
        </div>
      </Dialog>

      <Dialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Project" description="This action is permanent and cannot be undone.">
        <div className="mt-4 space-y-4">
          <p className="text-sm text-slate-600">Are you sure you want to delete <span className="font-semibold">{project.name}</span> and all its files?</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteProject}>Delete Permanently</Button>
          </div>
        </div>
      </Dialog>

      {shareLink && (
        <Dialog isOpen={!!shareLink} onClose={() => setShareLink('')} title="Share Link Copied">
          <div className="mt-4 space-y-3">
            <p className="text-sm text-slate-600">Share link copied to clipboard:</p>
            <code className="block p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 break-all">{shareLink}</code>
            <div className="flex justify-end"><Button onClick={() => setShareLink('')}>Close</Button></div>
          </div>
        </Dialog>
      )}
    </motion.div>
  );
}

// Inline component for recent activity in overview
function RecentActivity({ projectId }: { projectId: string }) {
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.activity.project(projectId, 5);
        setActivities(res.activities || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [projectId]);

  if (isLoading) return <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-full rounded" />)}</div>;
  if (activities.length === 0) return <p className="text-sm text-slate-500">No recent activity.</p>;

  return (
    <div className="space-y-3">
      {activities.map(a => (
        <div key={a.id} className="flex gap-3 items-start">
          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center mt-0.5 shrink-0">
            <span className="text-xs font-bold text-indigo-600">{(a.profiles?.full_name || a.profiles?.email || 'U')[0].toUpperCase()}</span>
          </div>
          <div>
            <p className="text-sm text-slate-900">
              <span className="font-medium">{a.profiles?.full_name || a.profiles?.email?.split('@')[0] || 'Someone'}</span>
              {' '}
              <span className="text-slate-500">{a.action.replace(/_/g, ' ')}</span>
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{formatRelativeTime(a.created_at)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
