import React from 'react';
import { FileText, MoreVertical, Search, RefreshCw, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function Trash() {
  const deletedItems = [
    { id: 1, name: 'Old Report.pdf', type: 'file', deletedAt: '2 days ago', size: '2.4 MB' },
    { id: 2, name: 'Q1 Marketing Assets', type: 'project', deletedAt: '5 days ago', size: '1.8 GB' },
    { id: 3, name: 'Draft_v1.docx', type: 'file', deletedAt: '1 week ago', size: '125 KB' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Trash</h1>
          <p className="text-slate-500 mt-1">Items in trash will be permanently deleted after 30 days.</p>
        </div>
        <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 gap-2">
          <Trash2 className="w-4 h-4" />
          Empty Trash
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input className="pl-9 bg-white" placeholder="Search trash..." />
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Size</th>
                <th className="px-6 py-3">Deleted</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deletedItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-slate-400" />
                    </div>
                    <span className="font-medium text-slate-900">{item.name}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 capitalize">{item.type}</td>
                  <td className="px-6 py-4 text-slate-500">{item.size}</td>
                  <td className="px-6 py-4 text-slate-500">{item.deletedAt}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" className="h-8 px-3 text-xs gap-1">
                        <RefreshCw className="w-3 h-3" />
                        Restore
                      </Button>
                      <button className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
