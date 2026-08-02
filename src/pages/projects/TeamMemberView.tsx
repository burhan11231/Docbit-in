import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog } from '../../components/ui/Dialog';
import { FileFilters } from '../../components/files/FileFilters';
import { FileList } from '../../components/files/FileList';
import { Skeleton } from '../../components/ui/Skeleton';
import { Upload, Folder, ArrowLeft, FileText } from 'lucide-react';
import { FileUploader } from '../../components/files/FileUploader';
import { api } from '../../lib/api';
import { matchesFileType, matchesDateFilter, sortFiles, type FileItem, type Project } from '../../lib/types';
import { motion } from 'motion/react';

export function TeamMemberView() {
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date_created');
  const [dateFilter, setDateFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [fileToRename, setFileToRename] = useState<FileItem | null>(null);
  const [newFileName, setNewFileName] = useState('');

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    try {
      setIsLoading(true);
      const [projectRes, filesRes] = await Promise.all([
        api.projects.get(projectId),
        api.files.list(projectId),
      ]);
      setProject(projectRes.project || null);
      setFiles(filesRes.files || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDownload = (file: FileItem) => {
    if (file.storage_path) {
      window.open(file.storage_path, '_blank');
      api.files.trackDownload(file.id).catch(() => {});
    }
  };

  const handlePreview = (file: FileItem) => {
    setPreviewFile(file);
    api.files.trackView(file.id).catch(() => {});
  };

  const openRenameModal = (id: string) => {
    const f = files.find(f => f.id === id);
    if (f) {
      setFileToRename(f);
      setNewFileName(f.name);
      setIsRenameOpen(true);
    }
  };

  const handleRename = async (e: React.FormEvent) => {
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

  let filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  filteredFiles = filteredFiles.filter(f => matchesFileType(f, filterType));
  filteredFiles = filteredFiles.filter(f => matchesDateFilter(f, dateFilter));
  if (ownerFilter === 'mine') {
    filteredFiles = filteredFiles.filter(f => f.uploaded_by === project?.created_by);
  }
  filteredFiles = sortFiles(filteredFiles, sortBy);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto px-1"
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
          <Link to="/projects" className="hover:text-slate-900 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Projects
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-900">{project?.name || 'Loading...'}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Folder className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">{project?.name}</h1>
              {project?.description && <p className="text-sm text-slate-500 mt-0.5">{project.description}</p>}
            </div>
          </div>
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shrink-0" onClick={() => setIsUploading(!isUploading)}>
            <Upload className="w-4 h-4" /> Upload
          </Button>
        </div>
      </div>

      {/* Upload Panel */}
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

      {/* Filters */}
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

      {/* Files */}
      <FileList
        files={filteredFiles}
        view={viewMode}
        onDelete={() => {}}
        onShare={() => {}}
        onRename={openRenameModal}
        onPreview={handlePreview}
        onDownload={handleDownload}
      />

      {/* Rename Dialog */}
      <Dialog isOpen={isRenameOpen} onClose={() => setIsRenameOpen(false)} title="Rename File">
        <form onSubmit={handleRename} className="mt-4 space-y-4">
          <Input
            label="File Name"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            autoFocus
            required
          />
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsRenameOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={!newFileName.trim()}>Rename</Button>
          </div>
        </form>
      </Dialog>

      {/* Preview Dialog */}
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
    </motion.div>
  );
}
