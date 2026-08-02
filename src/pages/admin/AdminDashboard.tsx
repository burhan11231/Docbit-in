import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Users, HardDrive, CreditCard, Activity } from 'lucide-react';

export function AdminDashboard() {
  const stats = [
    { title: 'Total Users', value: '1,250', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Active Workspaces', value: '800', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'Platform Storage', value: '450 GB', icon: HardDrive, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { title: 'Monthly Revenue', value: '₹4.5L', icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Administration</h1>
        <p className="text-slate-500 mt-1">Platform overview and management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Signups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                      U{i}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">User {i}</p>
                      <p className="text-xs text-slate-500">user{i}@example.com</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">{i} hour{i > 1 ? 's' : ''} ago</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">API Response Time</span>
                  <span className="text-sm font-medium text-emerald-600">45ms (Healthy)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Database Load</span>
                  <span className="text-sm font-medium text-blue-600">32% (Normal)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '32%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Storage Capacity</span>
                  <span className="text-sm font-medium text-orange-600">78% (Warning)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
