import React, { useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Search, Folder, Star, HardDrive, Edit, Archive, Trash2, Link as LinkIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dropdown } from '../../components/ui/Dropdown';
import { FileList } from '../../components/files/FileList';

export function Favorites() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  const [favoriteProjects, setFavoriteProjects] = useState([
    { id: '1', name: 'Q3 Marketing Assets', updated: '2 hours ago', size: '1.2 GB', fav: true },
    { id: '2', name: 'Brand Guidelines 2026', updated: '1 day ago', size: '450 MB', fav: true },
  ]);

  const [favoriteFiles, setFavoriteFiles] = useState([
    { id: '1', name: 'Presentation.pptx', size_bytes: 4500000, mime_type: 'application/vnd.ms-powerpoint', created_at: new Date().toISOString() },
    { id: '2', name: 'Logo_Final.png', size_bytes: 2500000, mime_type: 'image/png', created_at: new Date().toISOString() },
  ]);

  const toggleProjectFav = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavoriteProjects(prev => prev.filter(p => p.id !== id));
  };

  const filteredProjects = favoriteProjects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredFiles = favoriteFiles.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Favorites</h1>
          <p className="text-slate-500 mt-1">Quick access to your starred projects and files.</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input 
          className="pl-9 bg-white" 
          placeholder="Search favorites..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Projects</h2>
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-xl border-dashed">
            <Star className="w-10 h-10 text-slate-300 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-slate-900">No favorite projects</h3>
            <p className="text-xs text-slate-500 mt-1">Star important projects to see them here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="group hover:border-slate-300 transition-colors cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
                <CardContent className="p-0">
                  <div className="h-32 bg-slate-100 rounded-t-xl relative flex items-center justify-center">
                    <Folder className="w-12 h-12 text-slate-300" />
                    <button 
                      onClick={(e) => toggleProjectFav(e, project.id)} 
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 backdrop-blur-sm text-yellow-500 hover:text-slate-400 transition-colors"
                    >
                      <Star className="w-4 h-4" fill="currentColor" />
                    </button>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-slate-900 line-clamp-1">{project.name}</h3>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Dropdown 
                          items={[
                            { label: 'Edit', icon: Edit, onClick: () => console.log('Edit') },
                            { label: 'Copy Link', icon: LinkIcon, onClick: () => console.log('Copy') },
                            { label: 'Archive', icon: Archive, onClick: () => console.log('Archive') },
                            { label: 'Delete', icon: Trash2, danger: true, onClick: () => console.log('Delete') },
                          ]}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                      <span>Updated {project.updated}</span>
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3" />
                        {project.size}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
      
      <section className="space-y-4 pt-4 border-t border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Files</h2>
        {filteredFiles.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-xl border-dashed">
            <Star className="w-10 h-10 text-slate-300 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-slate-900">No favorite files</h3>
            <p className="text-xs text-slate-500 mt-1">Star important files to see them here.</p>
          </div>
        ) : (
          <FileList 
            files={filteredFiles}
            onDelete={(id) => setFavoriteFiles(prev => prev.filter(f => f.id !== id))}
            onShare={() => {}}
          />
        )}
      </section>
    </div>
  );
}
