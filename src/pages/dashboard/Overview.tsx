import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Folder, HardDrive, Users, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'motion/react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export function Overview() {
  const { user } = useAuth();

  const stats = [
    { title: 'Total Workspaces', value: '3', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100', accent: 'border-blue-200' },
    { title: 'Active Projects', value: '12', icon: Folder, color: 'text-indigo-600', bg: 'bg-indigo-100', accent: 'border-indigo-200' },
    { title: 'Storage Used', value: '4.2 GB', icon: HardDrive, color: 'text-emerald-600', bg: 'bg-emerald-100', accent: 'border-emerald-200' },
    { title: 'Recent Activity', value: '24', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100', accent: 'border-orange-200' },
  ];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back, {user?.full_name?.split(' ')[0] || 'User'}</h1>
        <p className="text-slate-500 mt-1">Here's what's happening in your workspaces today.</p>
      </motion.div>

      <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat) => (
          <motion.div variants={itemVariants} key={stat.title}>
            <Card className={`overflow-hidden border-t-4 ${stat.accent} shadow-sm hover:shadow-md transition-shadow`}>
              <CardContent className="p-5 md:p-6 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-semibold text-slate-900">Recent Projects</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer group">
                <CardContent className="p-4 md:p-5 flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-100 transition-all">
                      <Folder className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">Project Alpha {i}</h3>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">Updated 2h ago</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-6">
          <h2 className="text-lg font-semibold text-slate-900">Storage Usage</h2>
          <Card className="shadow-sm">
            <CardContent className="p-5 md:p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">4.2 GB of 10 GB</span>
                <span className="text-sm font-bold text-slate-900">42%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 mb-8 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '42%' }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                  className="bg-emerald-500 h-full rounded-full" 
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-3 text-slate-600 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm"></span> Documents
                  </span>
                  <span className="font-bold text-slate-700">2.1 GB</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-3 text-slate-600 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm"></span> Images
                  </span>
                  <span className="font-bold text-slate-700">1.5 GB</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-3 text-slate-600 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm"></span> Other
                  </span>
                  <span className="font-bold text-slate-700">0.6 GB</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
