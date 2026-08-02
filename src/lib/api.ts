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

  const data = await response.json();
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
  },
  projects: {
    list: (workspaceId: string) => fetchApi(`/projects/workspace/${workspaceId}`),
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
      }).then(res => res.json());
    },
    update: (id: string, data: any) => fetchApi(`/files/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi(`/files/${id}`, { method: 'DELETE' }),
    copy: (id: string, data?: any) => fetchApi(`/files/${id}/copy`, { method: 'POST', body: JSON.stringify(data || {}) }),
  },
  shares: {
    create: (data: any) => fetchApi('/shares', { method: 'POST', body: JSON.stringify(data) }),
    get: (token: string) => fetchApi(`/shares/${token}`),
    revoke: (id: string) => fetchApi(`/shares/${id}`, { method: 'DELETE' }),
  },
  admin: {
    stats: () => fetchApi('/admin/stats'),
  },
  billing: {
    createSubscription: (data: any) => fetchApi('/billing/create-subscription', { method: 'POST', body: JSON.stringify(data) }),
  }
};
