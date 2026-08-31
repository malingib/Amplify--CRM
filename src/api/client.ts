const API_BASE = '/api';

interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

export function getToken(): string | null {
  return localStorage.getItem('amplify_token');
}

export function setToken(token: string) {
  localStorage.setItem('amplify_token', token);
}

export function clearToken() {
  localStorage.removeItem('amplify_token');
}

export async function api<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;
  const token = getToken();

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err: any) {
    throw new Error(`Network error: ${err.message}`);
  }

  if (!res.ok) {
    let errorMsg = `API error: ${res.status}`;
    try {
      const errData = await res.json();
      if (errData?.error) errorMsg = errData.error;
      else if (errData?.message) errorMsg = errData.message;
    } catch {}
    throw new Error(errorMsg);
  }

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }

  return {} as T;
}

// ─── Auth ──────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    api('/auth/login', { method: 'POST', body: { email, password } }),
  register: (data: { email: string; password: string; name: string; role?: string }) =>
    api('/auth/register', { method: 'POST', body: data }),
  googleLogin: (credential: string) =>
    api('/auth/google', { method: 'POST', body: { credential } }),
  me: () => api('/auth/me'),
  updateProfile: (data: { name?: string; phone?: string; avatar?: string }) =>
    api('/auth/profile', { method: 'PUT', body: data }),
  inviteUser: (data: { email: string; role?: string; name?: string }) =>
    api('/auth/invite', { method: 'POST', body: data }),
};

// ─── Leads ─────────────────────────────────────────────────

export const leadsApi = {
  list: (params?: { stage?: string; search?: string; owner?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return api(`/leads${query ? `?${query}` : ''}`);
  },
  get: (id: string) => api(`/leads/${id}`),
  create: (data: any) => api('/leads', { method: 'POST', body: data }),
  update: (id: string, data: any) => api(`/leads/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) => api(`/leads/${id}`, { method: 'DELETE' }),
  reorder: (updates: { id: string; order: number }[]) =>
    api('/leads/reorder/batch', { method: 'PUT', body: { updates } }),
  addActivity: (leadId: string, data: { type: string; content: string }) =>
    api(`/leads/${leadId}/activity`, { method: 'POST', body: data }),
};

// ─── Clients ───────────────────────────────────────────────

export const clientsApi = {
  list: (params?: { search?: string; status?: string; industry?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return api(`/clients${query ? `?${query}` : ''}`);
  },
  get: (id: string) => api(`/clients/${id}`),
  create: (data: any) => api('/clients', { method: 'POST', body: data }),
  update: (id: string, data: any) => api(`/clients/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) => api(`/clients/${id}`, { method: 'DELETE' }),
};

// ─── Catalogue ─────────────────────────────────────────────

export const catalogueApi = {
  list: (params?: { search?: string; category?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return api(`/catalogue${query ? `?${query}` : ''}`);
  },
  create: (data: any) => api('/catalogue', { method: 'POST', body: data }),
  update: (id: string, data: any) => api(`/catalogue/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) => api(`/catalogue/${id}`, { method: 'DELETE' }),
};

// ─── Tasks ─────────────────────────────────────────────────

export const tasksApi = {
  list: (params?: { status?: string; assigneeId?: string; priority?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return api(`/tasks${query ? `?${query}` : ''}`);
  },
  create: (data: any) => api('/tasks', { method: 'POST', body: data }),
  update: (id: string, data: any) => api(`/tasks/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) => api(`/tasks/${id}`, { method: 'DELETE' }),
};

// ─── Invoices ──────────────────────────────────────────────

export const invoicesApi = {
  list: (params?: { status?: string; clientId?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return api(`/invoices${query ? `?${query}` : ''}`);
  },
  create: (data: any) => api('/invoices', { method: 'POST', body: data }),
  update: (id: string, data: any) => api(`/invoices/${id}`, { method: 'PUT', body: data }),
  pay: (id: string) => api(`/invoices/${id}/pay`, { method: 'POST' }),
};

// ─── Workflows ─────────────────────────────────────────────

export const workflowsApi = {
  list: () => api('/workflows'),
  create: (data: any) => api('/workflows', { method: 'POST', body: data }),
  update: (id: string, data: any) => api(`/workflows/${id}`, { method: 'PUT', body: data }),
  toggle: (id: string) => api(`/workflows/${id}/toggle`, { method: 'PUT' }),
  delete: (id: string) => api(`/workflows/${id}`, { method: 'DELETE' }),
  trigger: (triggerType: string, data: any) =>
    api('/workflows/trigger', { method: 'POST', body: { triggerType, data } }),
};

// ─── WhatsApp ──────────────────────────────────────────────

export const whatsappApi = {
  listInstances: () => api('/whatsapp/instances'),
  createInstance: (data: { instanceName: string; phone?: string }) =>
    api('/whatsapp/instances', { method: 'POST', body: data }),
  getQR: (name: string) => api(`/whatsapp/instances/${name}/qr`),
  getStatus: (name: string) => api(`/whatsapp/instances/${name}/status`),
  send: (data: { instanceName: string; to: string; message: string }) =>
    api('/whatsapp/send', { method: 'POST', body: data }),
  delete: (name: string) => api(`/whatsapp/instances/${name}`, { method: 'DELETE' }),
};

// ─── Telegram ──────────────────────────────────────────────

export const telegramApi = {
  getConfig: () => api('/telegram/config'),
  updateConfig: (data: { botToken: string; chatId?: string; botName?: string }) =>
    api('/telegram/config', { method: 'PUT', body: data }),
  test: () => api('/telegram/test', { method: 'POST' }),
  send: (data: { chatId?: string; message: string }) =>
    api('/telegram/send', { method: 'POST', body: data }),
  setWebhook: (webhookUrl: string) =>
    api('/telegram/setwebhook', { method: 'POST', body: { webhookUrl } }),
};

// ─── Dashboard ─────────────────────────────────────────────

export const dashboardApi = {
  stats: () => api('/dashboard/stats'),
  activity: () => api('/dashboard/activity'),
  revenue: () => api('/dashboard/revenue'),
};

// ─── Audit ─────────────────────────────────────────────────

export const auditApi = {
  list: (params?: { search?: string; severity?: string; status?: string; limit?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return api(`/audit${query ? `?${query}` : ''}`);
  },
  create: (data: { actor?: string; action: string; status: string; details: string; severity: string }) =>
    api('/audit', { method: 'POST', body: data }),
};

// ─── Team ──────────────────────────────────────────────────

export const teamApi = {
  list: () => api('/team'),
  updateRole: (id: string, role: string) =>
    api(`/team/${id}/role`, { method: 'PUT', body: { role } }),
  delete: (id: string) => api(`/team/${id}`, { method: 'DELETE' }),
};

// ─── Proposals ─────────────────────────────────────────────

export const proposalsApi = {
  list: (params?: { leadId?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return api(`/proposals${query ? `?${query}` : ''}`);
  },
  get: (id: string) => api(`/proposals/${id}`),
  create: (data: any) => api('/proposals', { method: 'POST', body: data }),
  update: (id: string, data: any) => api(`/proposals/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) => api(`/proposals/${id}`, { method: 'DELETE' }),
};

// ─── Google Workspace ─────────────────────────────────────

export const workspaceApi = {
  createDriveDoc: (data: { title: string; content: string; mimeType?: string }) =>
    api('/workspace/drive/create', { method: 'POST', body: data }),
  uploadToDrive: (data: { fileName: string; content: string; mimeType?: string; folderName?: string }) =>
    api('/workspace/drive/upload', { method: 'POST', body: data }),
  sendEmail: (data: { to: string; subject: string; body: string; cc?: string }) =>
    api('/workspace/gmail/send', { method: 'POST', body: data }),
  createCalendarEvent: (data: { summary: string; description?: string; startTime: string; endTime?: string; attendees?: { email: string }[]; conferenceData?: boolean }) =>
    api('/workspace/calendar/create', { method: 'POST', body: data }),
  createContact: (data: { name: string; email: string; phone?: string; company?: string }) =>
    api('/workspace/contacts/create', { method: 'POST', body: data }),
};

// ─── Transactions ──────────────────────────────────────────

export const transactionsApi = {
  list: (params?: { clientId?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return api(`/transactions${query ? `?${query}` : ''}`);
  },
  get: (id: string) => api(`/transactions/${id}`),
  create: (data: any) => api('/transactions', { method: 'POST', body: data }),
  reconcile: (id: string) => api(`/transactions/${id}/reconcile`, { method: 'POST' }),
};
