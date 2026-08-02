import React from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user } = useAuth();

  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 shrink-0 sticky top-0 z-20 pt-[max(env(safe-area-inset-top),0px)]">
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative flex-1 hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search files, projects..."
            className="w-full h-9 pl-9 pr-4 bg-slate-100 border-transparent rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 ml-auto">
        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors hidden sm:block">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
        </button>
        
        <div className="flex items-center gap-3 sm:pl-4 sm:border-l border-slate-200">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-semibold text-slate-900">{user?.full_name || 'User'}</span>
            <span className="text-xs text-slate-500">{user?.email}</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shadow-sm ring-2 ring-white">
            {(user?.full_name || 'U')[0].toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
