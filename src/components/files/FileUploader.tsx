import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File as FileIcon, X, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';

export function FileUploader({ projectId, onUploadComplete, onCancel }: { projectId: string, onUploadComplete: () => void, onCancel?: () => void }) {
  const [selectedFiles, setSelectedFiles] = useState<{file: File, progress: number, error?: string, completed?: boolean}[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Validation: Check size limits (e.g. 1GB max)
    const MAX_SIZE = 1024 * 1024 * 1024; // 1GB
    
    const newFiles = acceptedFiles.map(f => {
      let error = undefined;
      if (f.size > MAX_SIZE) {
        error = 'File exceeds 1GB limit';
      }
      return { file: f, progress: error ? -1 : 0, error };
    });
    
    setSelectedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleUploadAll = async () => {
    const filesToUpload = selectedFiles.filter(f => !f.error && !f.completed);
    if (filesToUpload.length === 0) return;
    
    setIsUploading(true);
    let completedCount = 0;

    for (const fileObj of filesToUpload) {
      const formData = new FormData();
      formData.append('file', fileObj.file);
      formData.append('project_id', projectId);

      await new Promise<void>((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/files/upload', true);
        const token = localStorage.getItem('token');
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setSelectedFiles(prev => prev.map(f => 
              f.file === fileObj.file ? { ...f, progress } : f
            ));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setSelectedFiles(prev => prev.map(f => f.file === fileObj.file ? { ...f, completed: true, progress: 100 } : f));
            completedCount++;
          } else {
            try {
              const res = JSON.parse(xhr.responseText);
              setSelectedFiles(prev => prev.map(f => f.file === fileObj.file ? { ...f, progress: -1, error: res.error || 'Upload failed' } : f));
            } catch(e) {
              setSelectedFiles(prev => prev.map(f => f.file === fileObj.file ? { ...f, progress: -1, error: 'Upload failed' } : f));
            }
          }
          resolve();
        };

        xhr.onerror = () => {
          setSelectedFiles(prev => prev.map(f => f.file === fileObj.file ? { ...f, progress: -1, error: 'Network error' } : f));
          resolve();
        };

        xhr.send(formData);
      });
    }
    
    setIsUploading(false);
    if (completedCount === filesToUpload.length) {
      setTimeout(() => {
        onUploadComplete();
      }, 500);
    } else if (completedCount > 0) {
       onUploadComplete();
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, disabled: isUploading } as any);

  return (
    <div className="space-y-4">
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-4" />
        <p className="text-sm font-medium text-slate-900">Drag & drop files here, or click to select files</p>
        <p className="text-xs text-slate-500 mt-1">Supports Documents, Images, Spreadsheets up to 1GB</p>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          <div className="flex justify-between items-center mb-2">
             <h4 className="text-sm font-medium text-slate-900">Selected Files</h4>
             <button 
                onClick={() => setSelectedFiles([])}
                className="text-xs text-slate-500 hover:text-slate-800"
                disabled={isUploading}
             >
                Clear all
             </button>
          </div>
          {selectedFiles.map((uf, idx) => (
            <div key={idx} className="flex items-center p-3 bg-white border border-slate-200 rounded-lg shadow-sm gap-3">
              <FileIcon className="w-8 h-8 text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-medium text-slate-900 truncate">{uf.file.name}</p>
                  {uf.progress === -1 ? (
                    <span className="text-xs font-medium text-red-500">{uf.error || 'Failed'}</span>
                  ) : uf.completed ? (
                    <span className="text-xs font-medium text-green-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Done</span>
                  ) : uf.progress > 0 ? (
                    <span className="text-xs font-medium text-slate-500">{uf.progress}%</span>
                  ) : (
                    <span className="text-xs font-medium text-slate-400">{(uf.file.size / 1024 / 1024).toFixed(2)} MB</span>
                  )}
                </div>
                {(uf.progress > 0 || uf.progress === -1) && (
                   <div className="w-full bg-slate-100 rounded-full h-1.5">
                     <div 
                       className={`h-1.5 rounded-full ${uf.progress === -1 ? 'bg-red-500' : uf.completed ? 'bg-green-500' : 'bg-indigo-500 transition-all duration-300'}`}
                       style={{ width: `${uf.progress === -1 ? 100 : uf.progress}%` }}
                     ></div>
                   </div>
                )}
              </div>
              {!isUploading && !uf.completed && (
                 <button 
                   onClick={() => setSelectedFiles(prev => prev.filter(f => f.file !== uf.file))}
                   className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                 >
                   <X className="w-4 h-4" />
                 </button>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        {onCancel && (
           <Button variant="outline" onClick={onCancel} disabled={isUploading}>Cancel</Button>
        )}
        <Button 
          onClick={handleUploadAll} 
          disabled={isUploading || selectedFiles.filter(f => !f.error && !f.completed).length === 0}
        >
          {isUploading ? 'Saving...' : 'Save Uploads'}
        </Button>
      </div>
    </div>
  );
}
