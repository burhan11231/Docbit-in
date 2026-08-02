import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Folder, Users, Settings, Activity, FileText, Share2, 
  BarChart, Grid, List as ListIcon, Search, Upload, Plus
} from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog } from '../../components/ui/Dialog';
import { FileUploader } from '../../components/files/FileUploader';
import { FileList } from '../../components/files/FileList';

export function ProjectDetail() {
  const { projectId } = useParams();
  const [activeTab, setActiveTab] = useState('files');
  const [project, setProject] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [fileToRename, setFileToRename] = useState<any>(null);
  const [newFileName, setNewFileName] = useState('');

  // Analytics State
  const [analytics, setAnalytics] = useState<any>(null);

  // Preview & Share State
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [shareLink, setShareLink] = useState('');

  const handleDownload = (file: any) => {
    if (file.storage_path) {
      window.open(file.storage_path, '_blank');
    } else {
      alert("No download URL available for this file.");
    }
  };

  const handlePreview = (file: any) => {
    if (file.storage_path) {
      setPreviewFile(file);
    } else {
      alert("Preview is not available for this file.");
    }
  };

  const handleShare = async (file: any) => {
    try {
      const res = await api.shares.create({ 
        file_id: file.id
      });
      const link = res.storage_path || `${window.location.origin}/share/${res.share?.share_token}`;
      setShareLink(link);
      navigator.clipboard.writeText(link).then(() => {
        alert("Share link copied to clipboard: " + link);
      });
    } catch (error) {
      console.error("Failed to generate share link", error);
      alert("Failed to generate share link.");
    }
  };

  useEffect(() => {
    fetchProjectAndFiles();
  }, [projectId]);

  // Project update state
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDescription, setEditProjectDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchProjectAndFiles = async () => {
    try {
      const projectRes = await api.projects.get(projectId!);
      setProject(projectRes.project);
      setEditProjectName(projectRes.project?.name || '');
      setEditProjectDescription(projectRes.project?.description || '');

      const filesRes = await api.files.list(projectId!);
      setFiles(filesRes.files || []);
      
      const statsRes = await api.admin.stats();
      setAnalytics(statsRes);
    } catch(err) {
      console.error(err);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'files', label: 'Files', icon: FileText },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'sharing', label: 'Sharing', icon: Share2 },
    { id: 'analytics', label: 'Analytics', icon: BarChart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleRenameFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fileToRename && newFileName) {
      try {
        await api.files.update(fileToRename.id, { name: newFileName });
        fetchProjectAndFiles();
        setIsRenameModalOpen(false);
      } catch (error) {
        console.error('Failed to rename file', error);
      }
    }
  };

  const openRenameModal = (id: string) => {
    const f = files.find(f => f.id === id);
    if (f) {
      setFileToRename(f);
      setNewFileName(f.name);
      setIsRenameModalOpen(true);
    }
  };

  const handleDeleteFile = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await api.files.delete(id);
        fetchProjectAndFiles();
      } catch (error) {
        console.error('Failed to delete file', error);
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
      });
      fetchProjectAndFiles();
      alert("Project updated successfully!");
    } catch (error) {
      console.error('Failed to update project', error);
      alert("Failed to update project.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchiveProject = async () => {
    try {
      const newStatus = project.is_deleted ? false : true;
      await api.projects.update(projectId!, { is_deleted: newStatus });
      fetchProjectAndFiles();
    } catch (error) {
      console.error('Failed to update project status', error);
    }
  };

  // File Action Modals State
  const [fileToMove, setFileToMove] = useState<any>(null);
  const [fileToCopy, setFileToCopy] = useState<any>(null);
  const [fileToViewMetadata, setFileToViewMetadata] = useState<any>(null);
  const [fileToViewHistory, setFileToViewHistory] = useState<any>(null);
  
  // For Move/Copy
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [selectedTargetProject, setSelectedTargetProject] = useState<string>('');
  
  // Search, Filter, Sort
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    fetchProjectAndFiles();
    fetchProjectsForMove();
  }, [projectId]);

  const fetchProjectsForMove = async () => {
    try {
      // Fetch workspaces then projects to get all projects for move/copy
      const workspacesRes = await api.workspaces.list();
      let allProjects: any[] = [];
      for (const ws of workspacesRes.workspaces || []) {
        const pRes = await api.projects.list(ws.id);
        allProjects = [...allProjects, ...(pRes.projects || [])];
      }
      setProjectsList(allProjects);
    } catch(err) {
      console.error(err);
    }
  };

  const handleMoveFile = async () => {
    if (fileToMove && selectedTargetProject) {
      try {
        await api.files.update(fileToMove.id, { project_id: selectedTargetProject });
        setFileToMove(null);
        setSelectedTargetProject('');
        fetchProjectAndFiles();
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
        fetchProjectAndFiles();
      } catch (err) {
        console.error(err);
      }
    }
  };

  let filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  if (filterType !== 'all') {
    filteredFiles = filteredFiles.filter(f => f.mime_type?.includes(filterType));
  }
  
  filteredFiles.sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'date') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === 'size') return (b.size_bytes || 0) - (a.size_bytes || 0);
    return 0;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <Link to="/projects" className="hover:text-indigo-600 transition-colors">Projects</Link>
            <span>/</span>
            <span className="font-medium text-slate-900">{project?.name || 'Loading...'}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            {project?.name}
            {project?.is_deleted && <span className="text-xs px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-semibold border border-amber-200">Archived</span>}
          </h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base">{project?.description}</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button variant="outline" className="gap-2 flex-1 sm:flex-none justify-center">
            <Share2 className="w-4 h-4" /> Share
          </Button>
          <Button className="gap-2 flex-1 sm:flex-none justify-center bg-indigo-600 hover:bg-indigo-700" onClick={() => setIsUploading(!isUploading)} disabled={project?.is_deleted}>
            <Upload className="w-4 h-4" /> Upload
          </Button>
        </div>
      </div>

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

      <div className="py-2">
        {activeTab === 'files' && (
          <div className="space-y-6">
            {isUploading && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-slate-900">Upload Files</h3>
                  <button onClick={() => setIsUploading(false)} className="text-sm text-slate-500 hover:text-slate-900">Close</button>
                </div>
                <FileUploader projectId={projectId!} onUploadComplete={() => { fetchProjectAndFiles(); setIsUploading(false); }} />
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-1 max-w-2xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    className="pl-9 bg-white" 
                    placeholder="Search files..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select 
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-indigo-500"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="image">Images</option>
                  <option value="document">Documents</option>
                  <option value="spreadsheet">Spreadsheets</option>
                </select>
                <select 
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-indigo-500"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="name">Name</option>
                  <option value="date">Date</option>
                  <option value="size">Size</option>
                </select>
              </div>
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <FileList 
              files={filteredFiles} 
              view={viewMode}
              onDelete={handleDeleteFile}
              onShare={handleShare}
              onRename={openRenameModal}
              onMove={(id) => { const f = files.find(x => x.id === id); if(f) { setFileToMove(f); setSelectedTargetProject(f.project_id); } }}
              onCopy={(id) => { const f = files.find(x => x.id === id); if(f) { setFileToCopy(f); setSelectedTargetProject(f.project_id); } }}
              onPreview={handlePreview}
              onDownload={handleDownload}
              onViewMetadata={setFileToViewMetadata}
              onViewHistory={setFileToViewHistory}
            />
          </div>
        )}
        
        {activeTab === 'members' && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-2xl mx-auto mt-12 shadow-sm">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900">Project Members</h3>
            <p className="text-slate-500 mt-2 mb-6">Collaborate with your team by adding them to this project. Set roles as Viewer, Editor or Owner.</p>
            <Button>Invite Members</Button>
          </div>
        )}

        {activeTab === 'sharing' && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-2xl mx-auto mt-12 shadow-sm">
            <Share2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900">External Sharing</h3>
            <p className="text-slate-500 mt-2 mb-6">Create public or password-protected links to share this project with external clients and partners.</p>
            <Button>Create Share Link</Button>
          </div>
        )}
        
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-medium text-slate-500">Total Files</h3>
              <p className="text-2xl font-bold text-slate-900 mt-2">{analytics?.total_files || files.length}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-medium text-slate-500">Storage Used</h3>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {(files.reduce((acc, f) => acc + (f.size_bytes || 0), 0) / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-medium text-slate-500">Active Shares</h3>
              <p className="text-2xl font-bold text-slate-900 mt-2">{analytics?.total_shares || 0}</p>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
             <div className="md:col-span-2 space-y-6">
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                   <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
                   <div className="space-y-4">
                     {files.slice(0, 5).map((f, i) => (
                        <div key={f.id} className="flex gap-4 items-start">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center mt-1 shrink-0">
                            <Activity className="w-4 h-4 text-indigo-500"/>
                          </div>
                          <div>
                            <p className="text-sm text-slate-900"><span className="font-medium">File Uploaded</span> "{f.name}"</p>
                            <p className="text-xs text-slate-500 mt-1">{new Date(f.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                     ))}
                     {files.length === 0 && <p className="text-sm text-slate-500">No recent activity.</p>}
                   </div>
                </div>
             </div>
             <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                   <h3 className="font-semibold text-slate-900 mb-2">About Project</h3>
                   <p className="text-sm text-slate-600 mb-4">{project?.description || 'No description provided.'}</p>
                   {project?.metadata?.category && (
                     <div className="mb-4">
                       <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md">{project.metadata.category}</span>
                     </div>
                   )}
                   <div className="space-y-3 pt-4 border-t border-slate-100">
                     <div className="flex justify-between text-sm">
                       <span className="text-slate-500">Created</span>
                       <span className="font-medium text-slate-900">{project ? new Date(project.created_at).toLocaleDateString() : '-'}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                       <span className="text-slate-500">Size</span>
                       <span className="font-medium text-slate-900">{(files.reduce((acc, f) => acc + (f.size_bytes || 0), 0) / 1024 / 1024).toFixed(2)} MB</span>
                     </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm max-w-3xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Project Settings</h3>
            <form className="space-y-6" onSubmit={handleUpdateProject}>
              <Input 
                label="Project Name" 
                value={editProjectName} 
                onChange={(e) => setEditProjectName(e.target.value)} 
              />
              <Input 
                label="Description" 
                value={editProjectDescription} 
                onChange={(e) => setEditProjectDescription(e.target.value)} 
              />
              
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <h4 className="font-medium text-slate-900">Danger Zone</h4>
                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                  <div>
                    <h5 className="font-medium text-red-900">{project?.is_deleted ? 'Restore Project' : 'Archive Project'}</h5>
                    <p className="text-sm text-red-700 mt-1">
                      {project?.is_deleted ? 'Restore this project to active status.' : 'Make this project read-only and hide it from the main list.'}
                    </p>
                  </div>
                  <Button type="button" variant="outline" className="text-red-600 border-red-200 hover:bg-red-100" onClick={handleArchiveProject}>
                    {project?.is_deleted ? 'Restore' : 'Archive'}
                  </Button>
                </div>
              </div>
              
              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      <Dialog
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        title="Rename File"
      >
        <form onSubmit={handleRenameFile} className="mt-4 space-y-4">
          <Input 
            label="File Name"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            autoFocus
            required
          />
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsRenameModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={!newFileName.trim()}>Rename</Button>
          </div>
        </form>
      </Dialog>
      
      <Dialog
        isOpen={!!fileToMove}
        onClose={() => setFileToMove(null)}
        title="Move File"
      >
        <div className="mt-4 space-y-4">
          <p className="text-sm text-slate-600">Select a project to move "{fileToMove?.name}" to.</p>
          <select 
            className="w-full p-2 border border-slate-200 rounded-lg"
            value={selectedTargetProject}
            onChange={(e) => setSelectedTargetProject(e.target.value)}
          >
            <option value="">Select Target Project</option>
            {projectsList.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setFileToMove(null)}>Cancel</Button>
            <Button type="button" onClick={handleMoveFile} disabled={!selectedTargetProject}>Move File</Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        isOpen={!!fileToCopy}
        onClose={() => setFileToCopy(null)}
        title="Copy File"
      >
        <div className="mt-4 space-y-4">
          <p className="text-sm text-slate-600">Select a project to copy "{fileToCopy?.name}" to.</p>
          <select 
            className="w-full p-2 border border-slate-200 rounded-lg"
            value={selectedTargetProject}
            onChange={(e) => setSelectedTargetProject(e.target.value)}
          >
            <option value="">Select Target Project</option>
            {projectsList.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setFileToCopy(null)}>Cancel</Button>
            <Button type="button" onClick={handleCopyFile} disabled={!selectedTargetProject}>Copy File</Button>
          </div>
        </div>
      </Dialog>
      
      <Dialog
        isOpen={!!fileToViewMetadata}
        onClose={() => setFileToViewMetadata(null)}
        title="File Metadata"
      >
        <div className="mt-4 space-y-4">
          <div className="flex justify-between border-b pb-2">
            <span className="text-slate-500">Name</span>
            <span className="font-medium">{fileToViewMetadata?.name}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-slate-500">Type</span>
            <span className="font-medium">{fileToViewMetadata?.mime_type}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-slate-500">Size</span>
            <span className="font-medium">{((fileToViewMetadata?.size_bytes || 0) / 1024 / 1024).toFixed(2)} MB</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-slate-500">Created At</span>
            <span className="font-medium">{fileToViewMetadata ? new Date(fileToViewMetadata.created_at).toLocaleString() : ''}</span>
          </div>
          <div className="pt-4 flex justify-end">
            <Button type="button" onClick={() => setFileToViewMetadata(null)}>Close</Button>
          </div>
        </div>
      </Dialog>
      
      <Dialog
        isOpen={!!fileToViewHistory}
        onClose={() => setFileToViewHistory(null)}
        title="Version History"
      >
        <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold">v1</div>
            <div>
              <p className="text-sm font-medium">Initial Upload</p>
              <p className="text-xs text-slate-500">{fileToViewHistory ? new Date(fileToViewHistory.created_at).toLocaleString() : ''}</p>
            </div>
            <div className="ml-auto">
              <Button variant="outline" className="text-xs py-1 h-8" onClick={() => handleDownload(fileToViewHistory)}>Download</Button>
            </div>
          </div>
          <p className="text-xs text-slate-500 text-center py-4">No other versions exist for this file.</p>
          <div className="pt-4 flex justify-end">
            <Button type="button" onClick={() => setFileToViewHistory(null)}>Close</Button>
          </div>
        </div>
      </Dialog>
      
      <Dialog
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        title="File Preview"
      >
        <div className="mt-4 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[300px]">
          {previewFile?.mime_type?.startsWith('image/') ? (
            <img src={previewFile.storage_path} alt="Preview" className="max-w-full max-h-[60vh] object-contain rounded" />
          ) : (
            <div className="text-center">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-900 font-medium">{previewFile?.name}</p>
              <p className="text-sm text-slate-500 mt-1">Preview not available for this file type.</p>
              <Button className="mt-4" onClick={() => handleDownload(previewFile)}>Download to View</Button>
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
}
