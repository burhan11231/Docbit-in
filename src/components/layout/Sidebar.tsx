import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Folder, 
  Briefcase, 
  Settings, 
  CreditCard,
  LogOut,
  Users,
  Star,
  Trash2,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }: { isMobileMenuOpen?: boolean, setIsMobileMenuOpen?: (v: boolean) => void }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Overview', to: '/' },
    { icon: Briefcase, label: 'Workspaces', to: '/workspaces' },
    { icon: Folder, label: 'Projects', to: '/projects' },
    { icon: Star, label: 'Favorites', to: '/favorites' },
    { icon: Users, label: 'Admin', to: '/admin' },
    { icon: CreditCard, label: 'Billing', to: '/billing' },
    { icon: Settings, label: 'Settings', to: '/settings/general' },
    { icon: Trash2, label: 'Trash', to: '/trash' },
  ];

  const sidebarContent = (
    <>
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200/60 pt-[max(env(safe-area-inset-top),0px)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-lg flex items-center justify-center shadow-inner">
            <span className="text-white font-bold text-lg leading-none">D</span>
          </div>
          <span className="font-bold text-lg text-slate-800">DocBit</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen?.(false)}
          className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              isActive 
                ? 'bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100/50' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200/60 pb-[max(env(safe-area-inset-bottom),1rem)]">
        <button 
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Log out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white flex-col h-full shrink-0 hidden lg:flex z-10 shadow-sm relative">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.aside 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-72 border-r border-slate-200 bg-white flex flex-col h-full shrink-0 fixed top-0 left-0 bottom-0 z-50 lg:hidden shadow-2xl"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
