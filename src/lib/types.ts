export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

export type ProjectRole = 'owner' | 'editor' | 'team';
export type WorkspaceRole = 'owner' | 'admin' | 'member';

export type EditorPermission =
  | 'full_edit'
  | 'upload_files'
  | 'replace_files'
  | 'delete_files'
  | 'rename_files'
  | 'move_files'
  | 'organize_folders'
  | 'edit_metadata'
  | 'manage_uploads'
  | 'manage_members'
  | 'manage_sharing'
  | 'manage_analytics'
  | 'manage_specific_folders'
  | 'manage_selected_file_types';

export const ALL_EDITOR_PERMISSIONS: { value: EditorPermission; label: string }[] = [
  { value: 'full_edit', label: 'Full Project Editing' },
  { value: 'upload_files', label: 'Upload Files' },
  { value: 'replace_files', label: 'Replace Files' },
  { value: 'delete_files', label: 'Delete Files' },
  { value: 'rename_files', label: 'Rename Files' },
  { value: 'move_files', label: 'Move Files' },
  { value: 'organize_folders', label: 'Organize Folders' },
  { value: 'edit_metadata', label: 'Edit Metadata' },
  { value: 'manage_uploads', label: 'Manage Uploads' },
  { value: 'manage_members', label: 'Manage Members' },
  { value: 'manage_sharing', label: 'Manage Sharing' },
  { value: 'manage_analytics', label: 'Manage Analytics' },
  { value: 'manage_specific_folders', label: 'Manage Specific Folders' },
  { value: 'manage_selected_file_types', label: 'Manage Selected File Types' },
];

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectRole;
  created_at: string;
  profiles?: Profile;
  permissions: EditorPermission[];
}

export interface ProjectInvitation {
  id: string;
  project_id: string;
  invited_by: string;
  invitee_email: string;
  role: ProjectRole;
  permissions: EditorPermission[];
  share_token: string;
  password_hash: string | null;
  expires_at: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  created_at: string;
  projects?: { id: string; name: string; description: string | null };
}

export interface ActivityLog {
  id: string;
  user_id: string;
  workspace_id: string | null;
  project_id: string | null;
  action: string;
  metadata: any;
  created_at: string;
  profiles?: Profile;
  projects?: { id: string; name: string };
}

export interface Workspace {
  id: string;
  name: string;
  slug: string | null;
  owner_id: string | null;
  plan: string;
  storage_used_bytes: number;
  is_favorite: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  workspace_members?: { count: number }[];
  projects?: { count: number }[];
}

export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  is_deleted: boolean;
  is_favorite: boolean;
  metadata: {
    category?: string;
    tags?: string[];
    cover_image?: string;
    is_pinned?: boolean;
    [key: string]: any;
  } | null;
  created_at: string;
  updated_at: string;
  files?: { count: number }[];
}

export interface FileItem {
  id: string;
  project_id: string;
  folder_id: string | null;
  name: string;
  storage_path: string;
  size_bytes: number;
  mime_type: string;
  uploaded_by: string | null;
  kind: string;
  permission: string;
  view_count: number;
  download_count: number;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function formatActionLabel(action: string): string {
  const labels: Record<string, string> = {
    workspace_created: 'created workspace',
    project_created: 'created project',
    project_updated: 'updated project',
    project_deleted: 'deleted project',
    file_uploaded: 'uploaded file',
    file_deleted: 'deleted file',
    file_renamed: 'renamed file',
    file_copied: 'copied file',
    share_created: 'created share link',
    share_revoked: 'revoked share link',
    invitation_sent: 'sent invitation',
    invitation_accepted: 'accepted invitation',
    member_removed: 'removed member',
    member_role_updated: 'updated member role',
    ownership_transferred: 'transferred ownership',
  };
  return labels[action] || action.replace(/_/g, ' ');
}

export function getFileKind(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('spreadsheet') || mimeType.includes('csv') || mimeType.includes('excel')) return 'spreadsheet';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
  if (mimeType.includes('text')) return 'text';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z') || mimeType.includes('compressed')) return 'archive';
  if (mimeType.includes('font')) return 'font';
  if (mimeType.includes('svg') || mimeType.includes('design')) return 'svg_design';
  if (mimeType.match(/(javascript|typescript|python|java|c|cpp|html|css|json|xml|sql|go|rust|ruby|php)/)) return 'code';
  if (mimeType.includes('document') || mimeType.includes('word') || mimeType.includes('msword')) return 'document';
  return 'other';
}

export function matchesFileType(file: FileItem, filterType: string): boolean {
  if (filterType === 'all') return true;
  const kind = file.kind || getFileKind(file.mime_type);
  return kind === filterType;
}

export function matchesDateFilter(file: FileItem, dateFilter: string): boolean {
  if (dateFilter === 'all') return true;
  const fileDate = new Date(file.created_at);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const fileDay = new Date(fileDate.getFullYear(), fileDate.getMonth(), fileDate.getDate());
  const diffDays = Math.floor((today.getTime() - fileDay.getTime()) / 86400000);

  switch (dateFilter) {
    case 'today': return diffDays === 0;
    case 'yesterday': return diffDays === 1;
    case 'last_7_days': return diffDays <= 7;
    case 'last_30_days': return diffDays <= 30;
    case 'this_month': return fileDate.getMonth() === now.getMonth() && fileDate.getFullYear() === now.getFullYear();
    case 'this_year': return fileDate.getFullYear() === now.getFullYear();
    default: return true;
  }
}

export function sortFiles(files: FileItem[], sortBy: string): FileItem[] {
  const sorted = [...files];
  switch (sortBy) {
    case 'name_asc': return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'name_desc': return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case 'date_mod_new': return sorted.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    case 'date_mod_old': return sorted.sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
    case 'date_created': return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case 'size_large': return sorted.sort((a, b) => (b.size_bytes || 0) - (a.size_bytes || 0));
    case 'size_small': return sorted.sort((a, b) => (a.size_bytes || 0) - (b.size_bytes || 0));
    case 'file_type': return sorted.sort((a, b) => a.mime_type.localeCompare(b.mime_type));
    case 'most_viewed': return sorted.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
    case 'most_downloaded': return sorted.sort((a, b) => (b.download_count || 0) - (a.download_count || 0));
    default: return sorted;
  }
}
