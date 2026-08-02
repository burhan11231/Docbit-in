import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthLayout } from './components/layout/AuthLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Overview } from './pages/dashboard/Overview';
import { WorkspaceList } from './pages/workspaces/WorkspaceList';
import { WorkspaceDetail } from './pages/workspaces/WorkspaceDetail';
import { ProjectList } from './pages/projects/ProjectList';
import { ProjectDetail } from './pages/projects/ProjectDetail';
import { AccessDenied } from './pages/projects/AccessDenied';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { Billing } from './pages/billing/Billing';
import { SettingsLayout } from './pages/settings/SettingsLayout';
import { SettingsGeneral, SettingsSecurity } from './pages/settings/SettingsPages';
import { Trash } from './pages/trash/Trash';
import { Favorites } from './pages/favorites/Favorites';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<div>Forgot Password</div>} />
          </Route>
          
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Overview />} />
            <Route path="/workspaces" element={<WorkspaceList />} />
            <Route path="/workspaces/:workspaceId" element={<WorkspaceDetail />} />
            <Route path="/projects" element={<ProjectList />} />
            <Route path="/projects/:projectId" element={<ProjectDetail />} />
            <Route path="/access-denied" element={<AccessDenied />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/billing" element={<Billing />} />
            
            <Route path="/settings" element={<SettingsLayout />}>
              <Route index element={<Navigate to="general" replace />} />
              <Route path="general" element={<SettingsGeneral />} />
              <Route path="security" element={<SettingsSecurity />} />
              <Route path="notifications" element={<div>Notifications Settings</div>} />
              <Route path="sharing" element={<div>Sharing Settings</div>} />
              <Route path="storage" element={<div>Storage Settings</div>} />
              <Route path="preferences" element={<div>Preferences</div>} />
            </Route>

            <Route path="/trash" element={<Trash />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

