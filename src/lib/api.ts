const API_BASE = '/api';

async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  let data: any;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    if (!response.ok) {
      throw new Error(text || `Request failed with status ${response.status}`);
    }
    return { success: true };
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new Error(data.error || 'API request failed');
  }
  return data;
}

export const api = {
  auth: {
    login: (credentials: any) => fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (credentials: any) => fetchApi('/auth/register', { method: 'POST', body: JSON.stringify(credentials) }),
    logout: () => fetchApi('/auth/logout', { method: 'POST' }),
  },
  workspaces: {
    list: () => fetchApi('/workspaces'),
    create: (data: any) => fetchApi('/workspaces', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: string) => fetchApi(`/workspaces/${id}`),
    update: (id: string, data: any) => fetchApi(`/workspaces/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi(`/workspaces/${id}`, { method: 'DELETE' }),
    members: (id: string) => fetchApi(`/workspaces/${id}/members`),
    addMember: (id: string, data: any) => fetchApi(`/workspaces/${id}/members`, { method: 'POST', body: JSON.stringify(data) }),
    removeMember: (id: string, memberId: string) => fetchApi(`/workspaces/${id}/members/${memberId}`, { method: 'DELETE' }),
  },
  projects: {
    list: (workspaceId: string) => fetchApi(`/projects/workspace/${workspaceId}`),
    listAll: () => fetchApi('/projects/all/me'),
    create: (data: any) => fetchApi('/projects', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: string) => fetchApi(`/projects/${id}`),
    update: (id: string, data: any) => fetchApi(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi(`/projects/${id}`, { method: 'DELETE' }),
  },
  files: {
    list: (projectId: string) => fetchApi(`/files/project/${projectId}`),
    upload: (formData: FormData) => {
      const token = localStorage.getItem('token');
      return fetch(`${API_BASE}/files/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      }).then(async res => {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          return res.json();
        }
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Upload failed with status ${res.status}`);
        }
        return { success: true };
      });
    },
    update: (id: string, data: any) => fetchApi(`/files/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi(`/files/${id}`, { method: 'DELETE' }),
    copy: (id: string, data?: any) => fetchApi(`/files/${id}/copy`, { method: 'POST', body: JSON.stringify(data || {}) }),
    trackView: (id: string) => fetchApi(`/files/${id}/view`, { method: 'POST' }),
    trackDownload: (id: string) => fetchApi(`/files/${id}/download`, { method: 'POST' }),
  },
  shares: {
    create: (data: any) => fetchApi('/shares', { method: 'POST', body: JSON.stringify(data) }),
    list: (projectId: string) => fetchApi(`/shares/project/${projectId}`),
    get: (token: string) => fetchApi(`/shares/${token}`),
    revoke: (id: string) => fetchApi(`/shares/${id}`, { method: 'DELETE' }),
  },
  members: {
    list: (projectId: string) => fetchApi(`/members/project/${projectId}`),
    getMyRole: (projectId: string) => fetchApi(`/members/project/${projectId}/me`),
    update: (projectId: string, memberId: string, data: any) => fetchApi(`/members/project/${projectId}/member/${memberId}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (projectId: string, memberId: string) => fetchApi(`/members/project/${projectId}/member/${memberId}`, { method: 'DELETE' }),
    leave: (projectId: string) => fetchApi(`/members/project/${projectId}/leave`, { method: 'POST' }),
    transferOwnership: (projectId: string, data: any) => fetchApi(`/members/project/${projectId}/transfer`, { method: 'POST', body: JSON.stringify(data) }),
    invitations: (projectId: string) => fetchApi(`/members/invitations/project/${projectId}`),
    myInvitations: () => fetchApi('/members/invitations/me'),
    createInvitation: (data: any) => fetchApi('/members/invitations', { method: 'POST', body: JSON.stringify(data) }),
    acceptInvitation: (id: string) => fetchApi(`/members/invitations/${id}/accept`, { method: 'POST' }),
    rejectInvitation: (id: string) => fetchApi(`/members/invitations/${id}/reject`, { method: 'POST' }),
  },
  activity: {
    project: (projectId: string, limit = 20) => fetchApi(`/activity/project/${projectId}?limit=${limit}`),
    workspace: (workspaceId: string, limit = 20) => fetchApi(`/activity/workspace/${workspaceId}?limit=${limit}`),
    me: (limit = 10) => fetchApi(`/activity/me?limit=${limit}`),
    log: (data: any) => fetchApi('/activity', { method: 'POST', body: JSON.stringify(data) }),
  },
  admin: {
    stats: () => fetchApi('/admin/stats'),
  },
  billing: {
    createSubscription: (data: any) => fetchApi('/billing/create-subscription', { method: 'POST', body: JSON.stringify(data) }),
  }
};
