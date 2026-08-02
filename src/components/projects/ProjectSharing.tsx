import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dialog } from '../ui/Dialog';
import { Share2, Plus, Trash2, Copy, Check, Link as LinkIcon, Lock, Clock } from 'lucide-react';
import { api } from '../../lib/api';
import { formatRelativeTime } from '../../lib/types';
import { motion } from 'motion/react';

interface ProjectSharingProps {
  projectId: string;
  isOwner: boolean;
}

export function ProjectSharing({ projectId, isOwner }: ProjectSharingProps) {
  const [shares, setShares] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [sharePermissions, setSharePermissions] = useState('view');
  const [sharePassword, setSharePassword] = useState('');
  const [shareExpiry, setShareExpiry] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchShares = async () => {
    try {
      const res = await api.shares.list(projectId);
      setShares(res.shares || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShares();
  }, [projectId]);

  const handleCreateShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.shares.create({
        project_id: projectId,
        permissions: sharePermissions,
        password: sharePassword || undefined,
        expires_in_days: shareExpiry,
      });
      setIsCreateOpen(false);
      setSharePassword('');
      setShareExpiry(7);
      setSharePermissions('view');
      fetchShares();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (window.confirm('Reoke this share link?')) {
      try {
        await api.shares.revoke(id);
        fetchShares();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const copyLink = (share: any) => {
    const url = `${window.location.origin}/share/${share.share_token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(share.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl">
        {[1, 2].map(i => (
          <Card key={i} className="border-slate-200">
            <CardContent className="p-4 space-y-3">
              <div className="h-5 w-32 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100">
          <CardTitle className="flex items-center gap-2"><Share2 className="w-5 h-5 text-indigo-500" /> Share Links</CardTitle>
          {isOwner && (
            <Button size="sm" className="gap-2 text-xs h-8 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-3.5 h-3.5" /> Create Link
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {shares.length === 0 ? (
            <div className="text-center py-12">
              <LinkIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-900">No share links yet</h3>
              <p className="text-sm text-slate-500 mt-1 mb-6">Create a secure link to share this project with external collaborators.</p>
              {isOwner && (
                <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="w-4 h-4" /> Create Share Link
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {shares.map(share => {
                const isExpired = share.expires_at && new Date(share.expires_at) < new Date();
                return (
                  <motion.div
                    key={share.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-slate-200 rounded-xl hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        {share.password_hash ? <Lock className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {share.permissions === 'view' ? 'View only' : 'View & download'}
                          {share.password_hash && <span className="text-slate-400 text-xs ml-2">(password protected)</span>}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                          <span>{formatRelativeTime(share.created_at)}</span>
                          {share.expires_at && (
                            <span className={`flex items-center gap-1 ${isExpired ? 'text-red-500' : ''}`}>
                              <Clock className="w-3 h-3" />
                              {isExpired ? 'Expired' : `Expires ${formatRelativeTime(share.expires_at)}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 gap-1.5"
                        onClick={() => copyLink(share)}
                      >
                        {copiedId === share.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedId === share.id ? 'Copied!' : 'Copy'}
                      </Button>
                      {isOwner && (
                        <button
                          onClick={() => handleRevoke(share.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Share Dialog */}
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Share Link"
        description="Generate a secure link to share this project."
      >
        <form onSubmit={handleCreateShare} className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Permissions</label>
            <div className="flex gap-2">
              {['view', 'download'].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSharePermissions(p)}
                  className={`flex-1 p-3 rounded-lg border text-sm font-medium capitalize transition-colors ${sharePermissions === p ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {p === 'view' ? 'View only' : 'View & Download'}
                </button>
              ))}
            </div>
          </div>
          <Input
            label="Password (Optional)"
            type="text"
            placeholder="Protect with a password"
            value={sharePassword}
            onChange={(e) => setSharePassword(e.target.value)}
          />
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Expires in</label>
            <select
              value={shareExpiry}
              onChange={(e) => setShareExpiry(Number(e.target.value))}
              className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={1}>1 day</option>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={0}>Never</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Link'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
