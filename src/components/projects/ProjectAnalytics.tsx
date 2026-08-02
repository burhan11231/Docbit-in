import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { Upload, Download, Eye, HardDrive, TrendingUp, FileText, Activity as ActivityIcon } from 'lucide-react';
import { api } from '../../lib/api';
import { formatBytes, formatRelativeTime, formatActionLabel, type FileItem, type ActivityLog } from '../../lib/types';
import { motion } from 'motion/react';

interface ProjectAnalyticsProps {
  projectId: string;
  files: FileItem[];
}

export function ProjectAnalytics({ projectId, files }: ProjectAnalyticsProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await api.activity.project(projectId, 20);
        setActivities(res.activities || []);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchActivity();
  }, [projectId]);

  const totalSize = files.reduce((acc, f) => acc + (f.size_bytes || 0), 0);
  const totalViews = files.reduce((acc, f) => acc + (f.view_count || 0), 0);
  const totalDownloads = files.reduce((acc, f) => acc + (f.download_count || 0), 0);
  const uploadCount = activities.filter(a => a.action === 'file_uploaded').length;

  const statCards = [
    { title: 'Total Files', value: files.length, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { title: 'Storage Used', value: formatBytes(totalSize), icon: HardDrive, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'Total Views', value: totalViews, icon: Eye, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Downloads', value: totalDownloads, icon: Download, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  // Top files by views
  const topByViews = [...files].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 5);
  const topByDownloads = [...files].sort((a, b) => (b.download_count || 0) - (a.download_count || 0)).slice(0, 5);

  // Activity by type
  const activityByType: Record<string, number> = {};
  activities.forEach(a => {
    activityByType[a.action] = (activityByType[a.action] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="shadow-sm">
              <CardContent className="p-4 md:p-5 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-slate-500 truncate">{stat.title}</p>
                  <p className="text-xl md:text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Top Files */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-base"><Eye className="w-4 h-4 text-blue-500" /> Most Viewed Files</CardTitle>
          </CardHeader>
          <CardContent>
            {topByViews.length === 0 || topByViews.every(f => (f.view_count || 0) === 0) ? (
              <p className="text-sm text-slate-500 text-center py-6">No views recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {topByViews.filter(f => (f.view_count || 0) > 0).map((f, i) => (
                  <div key={f.id} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-400 w-5">{i + 1}</span>
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-sm font-medium text-slate-900 truncate flex-1">{f.name}</span>
                    <span className="text-sm text-slate-500 shrink-0">{f.view_count} views</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-base"><Download className="w-4 h-4 text-amber-500" /> Most Downloaded Files</CardTitle>
          </CardHeader>
          <CardContent>
            {topByDownloads.length === 0 || topByDownloads.every(f => (f.download_count || 0) === 0) ? (
              <p className="text-sm text-slate-500 text-center py-6">No downloads recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {topByDownloads.filter(f => (f.download_count || 0) > 0).map((f, i) => (
                  <div key={f.id} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-400 w-5">{i + 1}</span>
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-sm font-medium text-slate-900 truncate flex-1">{f.name}</span>
                    <span className="text-sm text-slate-500 shrink-0">{f.download_count} downloads</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 text-base"><ActivityIcon className="w-4 h-4 text-indigo-500" /> Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
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
            <p className="text-sm text-slate-500 text-center py-6">No recent activity.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {activities.map(activity => (
                <div key={activity.id} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center mt-0.5 shrink-0">
                    <span className="text-xs font-bold text-indigo-600">
                      {(activity.profiles?.full_name || activity.profiles?.email || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-900">
                      <span className="font-medium">{activity.profiles?.full_name || activity.profiles?.email?.split('@')[0] || 'Someone'}</span>
                      {' '}
                      <span className="text-slate-500">{formatActionLabel(activity.action)}</span>
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
  );
}
