import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { FileText, Image as ImageIcon, FileSpreadsheet, Download, Trash2, Share2, Eye, Edit, Copy, FolderInput, CheckSquare, Square } from 'lucide-react';
import { Button } from '../ui/Button';
import { Dropdown } from '../ui/Dropdown';
import { motion, AnimatePresence } from 'motion/react';

export function FileList({ files, view = 'grid', onDelete, onShare, onRename, onMove, onCopy, onPreview, onDownload, onViewMetadata, onViewHistory }: { 
  files: any[], 
  view?: 'grid' | 'list', 
  onDelete: (id: string) => void, 
  onShare: (file: any) => void,
  onRename?: (id: string) => void,
  onMove?: (id: string) => void,
  onCopy?: (id: string) => void,
  onPreview?: (file: any) => void,
  onDownload?: (file: any) => void,
  onViewMetadata?: (file: any) => void,
  onViewHistory?: (file: any) => void
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const getIcon = (mimeType: string) => {
    if (mimeType.includes('image')) return <ImageIcon className="w-10 h-10 text-emerald-500" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('csv')) return <FileSpreadsheet className="w-10 h-10 text-emerald-600" />;
    return <FileText className="w-10 h-10 text-indigo-500" />;
  };

  const getSmallIcon = (mimeType: string) => {
    if (mimeType.includes('image')) return <ImageIcon className="w-4 h-4 text-emerald-500" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('csv')) return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
    return <FileText className="w-4 h-4 text-indigo-500" />;
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === files.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(files.map(f => f.id)));
    }
  };

  if (files.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-24 bg-white/50 border border-slate-200 border-dashed rounded-3xl"
      >
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileText className="w-10 h-10 text-indigo-300" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900">No files yet</h3>
        <p className="text-slate-500 mt-2">Upload your first file to get started</p>
      </motion.div>
    );
  }

  const getDropdownItems = (f: any) => [
    { label: 'Preview', icon: Eye, onClick: () => onPreview?.(f) },
    { label: 'Download', icon: Download, onClick: () => onDownload?.(f) },
    { label: 'Share', icon: Share2, onClick: () => onShare(f) },
    { label: 'Metadata', icon: FileText, onClick: () => onViewMetadata?.(f) },
    { label: 'History', icon: FileText, onClick: () => onViewHistory?.(f) },
    { label: 'Rename', icon: Edit, onClick: () => onRename?.(f.id) },
    { label: 'Move', icon: FolderInput, onClick: () => onMove?.(f.id) },
    { label: 'Copy', icon: Copy, onClick: () => onCopy?.(f.id) },
    { label: 'Delete', icon: Trash2, danger: true, onClick: () => onDelete(f.id) },
  ];

  const handleDownloadAll = () => {
    Array.from<string>(selectedIds as Set<string>).forEach((id: string) => {
      const file = files.find(f => f.id === id);
      if (file && onDownload) onDownload(file);
    });
  };

  const handleDeleteSelected = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} files?`)) {
      Array.from<string>(selectedIds as Set<string>).forEach((id: string) => {
        onDelete(id);
      });
      setSelectedIds(new Set());
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1 }
  };

  if (view === 'list') {
    return (
      <div className="space-y-4">
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 overflow-hidden"
            >
              <span className="text-sm font-semibold text-indigo-900">{selectedIds.size} files selected</span>
              <div className="flex gap-2">
                <Button onClick={handleDownloadAll} variant="outline" className="bg-white hover:bg-slate-50 text-xs py-1.5 h-8">Download All</Button>
                <Button onClick={handleDeleteSelected} variant="outline" className="bg-white hover:bg-rose-50 text-xs py-1.5 h-8 text-rose-600 hover:text-rose-700 border-rose-200">Delete Selected</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto scrollbar-hide">
          <table className="w-full text-left text-sm whitespace-nowrap min-w-[600px]">
            <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-4 w-10">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-indigo-600 transition-colors">
                    {selectedIds.size === files.length && files.length > 0 ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Size</th>
                <th className="px-6 py-4 hidden md:table-cell">Type</th>
                <th className="px-6 py-4 hidden sm:table-cell">Uploaded</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence>
                {files.map((f, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    exit={{ opacity: 0 }}
                    key={f.id} 
                    className={`hover:bg-slate-50/80 transition-colors group ${selectedIds.has(f.id) ? 'bg-indigo-50/30' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <button onClick={() => toggleSelect(f.id)} className="text-slate-400 hover:text-indigo-600 transition-colors mt-1">
                        {selectedIds.has(f.id) ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-white transition-colors">
                        {getSmallIcon(f.mime_type || '')}
                      </div>
                      <span className="font-medium text-slate-900 truncate max-w-[200px] md:max-w-xs">{f.name}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{((f.size_bytes || f.size || 0) / 1024 / 1024).toFixed(2)} MB</td>
                    <td className="px-6 py-4 text-slate-500 truncate max-w-[120px] hidden md:table-cell">{f.mime_type || f.type}</td>
                    <td className="px-6 py-4 text-slate-500 hidden sm:table-cell">{new Date(f.created_at || Date.now()).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <Dropdown items={getDropdownItems(f)} />
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 overflow-hidden"
          >
            <span className="text-sm font-semibold text-indigo-900">{selectedIds.size} files selected</span>
            <div className="flex gap-2">
              <Button onClick={handleDownloadAll} variant="outline" className="bg-white hover:bg-slate-50 text-xs py-1.5 h-8">Download All</Button>
              <Button onClick={handleDeleteSelected} variant="outline" className="bg-white hover:bg-rose-50 text-xs py-1.5 h-8 text-rose-600 hover:text-rose-700 border-rose-200">Delete Selected</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
      >
        <AnimatePresence>
          {files.map(f => (
            <motion.div variants={item} key={f.id} layout exit={{ opacity: 0, scale: 0.9 }}>
              <Card className={`group hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100/50 transition-all cursor-pointer overflow-hidden relative rounded-2xl ${selectedIds.has(f.id) ? 'border-indigo-400 ring-2 ring-indigo-400 shadow-md' : 'border-slate-200'}`}>
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleSelect(f.id); }}
                  className={`absolute top-2 left-2 z-10 p-1.5 bg-white/90 rounded-lg backdrop-blur-md shadow-sm transition-all ${selectedIds.has(f.id) ? 'opacity-100 scale-100' : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'}`}
                >
                  {selectedIds.has(f.id) ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                </button>
                <div className="h-36 bg-slate-50/50 border-b border-slate-100 flex items-center justify-center relative group-hover:bg-indigo-50/30 transition-colors">
                   {getIcon(f.mime_type || '')}
                   <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px]">
                     <button onClick={(e) => { e.stopPropagation(); onPreview?.(f); }} className="p-2.5 bg-white/90 hover:bg-white text-slate-900 rounded-full hover:scale-110 transition-all shadow-lg"><Eye className="w-4 h-4" /></button>
                     <button onClick={(e) => { e.stopPropagation(); onShare(f); }} className="p-2.5 bg-white/90 hover:bg-white text-slate-900 rounded-full hover:scale-110 transition-all shadow-lg"><Share2 className="w-4 h-4" /></button>
                   </div>
                </div>
                <CardContent className="p-4 bg-white">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-sm text-slate-900 truncate" title={f.name}>{f.name}</h4>
                      <p className="text-xs text-slate-500 mt-1 font-medium">{((f.size_bytes || f.size || 0) / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <div className="relative dropdown-container shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Dropdown items={getDropdownItems(f)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
