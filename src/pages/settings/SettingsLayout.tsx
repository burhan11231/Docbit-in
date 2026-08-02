import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Settings as SettingsIcon, Shield, Bell, Share2, HardDrive, Layout } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';

export function SettingsLayout() {
  const settingsNav = [
    { to: '/settings/general', icon: SettingsIcon, label: 'General' },
    { to: '/settings/security', icon: Shield, label: 'Security' },
    { to: '/settings/notifications', icon: Bell, label: 'Notifications' },
    { to: '/settings/sharing', icon: Share2, label: 'Sharing' },
    { to: '/settings/storage', icon: HardDrive, label: 'Storage' },
    { to: '/settings/preferences', icon: Layout, label: 'Preferences' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account settings and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex flex-col space-y-1">
            {settingsNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          <Card>
            <CardContent className="p-6">
              <Outlet />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
