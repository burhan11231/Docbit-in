import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { Folder, HardDrive, Users, Clock, Plus, TrendingUp, Share2, Star, FileText, Activity as ActivityIcon, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { formatBytes, formatRelativeTime, formatActionLabel, type Project, type ActivityLog } from '../../lib/types';
import { motion } from 'motion/react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export function Overview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [statsRes, projectsRes, activityRes] = await Promise.all([
        api.admin.stats(),
        api.projects.listAll(),
        api.activity.me(8),
      ]);
      setStats(statsRes.stats || statsRes);
      setRecentProjects((projectsRes.projects || []).slice(0, 4));
      setActivities(activityRes.activities || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const statCards = [
    { title: 'Workspaces', value: stats?.total_workspaces ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100', accent: 'border-blue-200' },
    { title: 'Active Projects', value: stats?.total_projects ?? 0, icon: Folder, color: 'text-indigo-600', bg: 'bg-indigo-100', accent: 'border-indigo-200' },
    { title: 'Storage Used', value: formatBytes(stats?.storage_used_bytes ?? 0), icon: HardDrive, color: 'text-emerald-600', bg: 'bg-emerald-100', accent: 'border-emerald-200' },
    { title: 'Shared Projects', value: stats?.shared_projects ?? 0, icon: Share2, color: 'text-amber-600', bg: 'bg-amber-100', accent: 'border-amber-200' },
  ];

  const quickActions = [
    { label: 'New Workspace', icon: Users, path: '/workspaces' },
    { label: 'New Project', icon: Folder, path: '/projects' },
    { label: 'Favorites', icon: Star, path: '/favorites' },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 md:space-y-8 px-1"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back, {user?.full_name?.split(' ')[0] || 'User'}</h1>
        <p className="text-slate-500 mt-1">Here's what's happening across your workspaces.</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={containerVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {isLoading ? (
          [1, 2, 3, 4].map(i => (
            <Card key={i} className="border-slate-200">
              <CardContent className="p-4 md:p-6 flex items-center gap-3 md:gap-4">
                <Skeleton className="w-10 h-10 md:w-12 md:h-12 rounded-2xl shrink-0" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20 rounded" />
                  <Skeleton className="h-6 w-16 rounded" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          statCards.map((stat) => (
            <motion.div variants={itemVariants} key={stat.title}>
              <Card className={`overflow-hidden border-t-4 ${stat.accent} shadow-sm hover:shadow-md transition-shadow`}>
                <CardContent className="p-4 md:p-6 flex items-center gap-3 md:gap-4">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                    <stat.icon className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm font-medium text-slate-500 truncate">{stat.title}</p>
                    <p className="text-xl md:text-2xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-2 md:gap-3">
        {quickActions.map(action => (
          <Button
            key={action.label}
            variant="outline"
            className="gap-2 bg-white rounded-xl h-10 md:h-11"
            onClick={() => navigate(action.path)}
          >
            <action.icon className="w-4 h-4 text-slate-600" />
            {action.label}
          </Button>
        ))}
      </motion.div>

      {/* Main Content Grid */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
        {/* Recent Projects */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4 md:space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent Projects</h2>
            <button onClick={() => navigate('/projects')} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="border-slate-200">
                  <CardContent className="p-4 md:p-5">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-xl" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4 rounded" />
                        <Skeleton className="h-3 w-1/2 rounded" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recentProjects.length === 0 ? (
            <Card className="border-dashed border-slate-300 bg-white/50">
              <CardContent className="p-8 md:p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Folder className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">No projects yet</h3>
                <p className="text-sm text-slate-500 mt-1 mb-6">Create your first project to get started.</p>
                <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => navigate('/projects')}>
                  <Plus className="w-4 h-4" /> Create Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {recentProjects.map(project => (
                <Card
                  key={project.id}
                  className="hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer group"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <CardContent className="p-4 md:p-5 flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-100 transition-all shrink-0">
                        <Folder className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors truncate">{project.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium">{formatRelativeTime(project.updated_at || project.created_at)}</p>
                      </div>
                    </div>
                    {project.is_favorite && <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </motion.div>

        {/* Storage + Activity */}
        <motion.div variants={itemVariants} className="space-y-4 md:space-y-6">
          {/* Storage */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3 md:mb-4">Storage Usage</h2>
            <Card className="shadow-sm">
              <CardContent className="p-4 md:p-6">
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full rounded" />
                    <Skeleton className="h-3 w-full rounded" />
                    <Skeleton className="h-16 w-full rounded" />
                  </div>
                ) : (
                  <>
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-500">{formatBytes(stats?.storage_used_bytes ?? 0)} used</span>
                      <span className="text-sm font-bold text-slate-900">{stats?.total_files ?? 0} files</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, ((stats?.storage_used_bytes ?? 0) / (10 * 1024 * 1024 * 1024)) * 100)}%` }}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                        className="bg-emerald-500 h-full rounded-full"
                      />
                    </div>
                    <p className="text-xs text-slate-400">10 GB plan limit</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3 md:mb-4">Recent Activity</h2>
            <Card className="shadow-sm">
              <CardContent className="p-4 md:p-5">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex gap-3">
                        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                        <div className="space-y-1.5 flex-1">
                          <Skeleton className="h-3 w-3/4 rounded" />
                          <Skeleton className="h-2 w-1/3 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-6">
                    <ActivityIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {activities.slice(0, 6).map(activity => (
                      <div key={activity.id} className="flex gap-3 items-start">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center mt-0.5 shrink-0">
                          {activity.profiles?.avatar_url ? (
                            <img src={activity.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                          ) : (
                            <span className="text-xs font-bold text-indigo-600">
                              {(activity.profiles?.full_name || activity.profiles?.email || 'U')[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-slate-900">
                            <span className="font-medium">{activity.profiles?.full_name || activity.profiles?.email?.split('@')[0] || 'Someone'}</span>
                            {' '}
                            <span className="text-slate-500">{formatActionLabel(activity.action)}</span>
                            {activity.projects?.name && (
                              <>
                                {' '}
                                <span className="text-slate-500">in</span>
                                {' '}
                                <span className="font-medium text-slate-700">{activity.projects.name}</span>
                              </>
                            )}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">{formatRelativeTime(activity.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom Stats Row */}
      {!isLoading && stats && (
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: 'Favorite Projects', value: stats.favorite_projects ?? 0, icon: Star, color: 'text-amber-500' },
            { label: 'Total Members', value: stats.total_members ?? 0, icon: Users, color: 'text-blue-500' },
            { label: 'Active Shares', value: stats.active_shares ?? 0, icon: Share2, color: 'text-purple-500' },
            { label: 'Total Files', value: stats.total_files ?? 0, icon: FileText, color: 'text-emerald-500' },
          ].map(item => (
            <Card key={item.label} className="border-slate-200">
              <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-3">
                <item.icon className={`w-4 h-4 md:w-5 md:h-5 ${item.color} shrink-0`} />
                <div className="min-w-0">
                  <p className="text-lg md:text-xl font-bold text-slate-900">{item.value}</p>
                  <p className="text-xs text-slate-500 truncate">{item.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
