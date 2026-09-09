const API_BASE = '/api';

interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  timeoutMs?: number;
  retry?: boolean;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('amplify_token');
}

export function setToken(token: string) {
  localStorage.setItem('amplify_token', token);
}

export function clearToken() {
  localStorage.removeItem('amplify_token');
}

export async function api<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, timeoutMs = 15000, retry = method === 'GET' } = options;
  const token = getToken();

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) requestHeaders['Authorization'] = `Bearer ${token}`;

  const execute = async (): Promise<T> => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: requestHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (res.status === 401 && path !== '/auth/login' && path !== '/auth/register' && path !== '/auth/google') {
        clearToken();
        window.dispatchEvent(new CustomEvent('amplify:auth-expired'));
      }

      if (!res.ok) {
        let errorMsg = `API error: ${res.status}`;
        let details: unknown;
        try {
          const errData = await res.json();
          details = errData?.details;
          if (errData?.error) errorMsg = errData.error;
          else if (errData?.message) errorMsg = errData.message;
        } catch {
          // Preserve the HTTP status when the server does not return JSON.
        }
        throw new ApiError(errorMsg, res.status, details);
      }

      if (res.status === 204) return {} as T;
      const contentType = res.headers.get('content-type');
      if (contentType?.includes('application/json')) return res.json();
      return {} as T;
    } catch (err: any) {
      if (err?.name === 'AbortError') throw new ApiError('Request timed out. Please try again.', 408);
      if (err instanceof ApiError) throw err;
      throw new ApiError(`Network error: ${err?.message || 'Unable to reach server'}`, 0);
    } finally {
      window.clearTimeout(timeout);
    }
  };

  if (!retry) return execute();

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await execute();
    } catch (err) {
      lastError = err;
      if (err instanceof ApiError && err.status >= 400 && err.status !== 408) throw err;
      if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  throw lastError;
}

// ─── Auth ──────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) => api('/auth/login', { method: 'POST', body: { email, password } }),
  register: (data: { email: string; password: string; name: string; role?: string }) => api('/auth/register', { method: 'POST', body: data }),
  googleLogin: (credential: string) => api('/auth/google', { method: 'POST', body: { credential } }),
  me: () => api('/auth/me'),
  updateProfile: (data: { name?: string; phone?: string; avatar?: string }) => api('/auth/profile', { method: 'PUT', body: data }),
  inviteUser: (data: { email: string; role?: string; name?: string }) => api('/auth/invite', { method: 'POST', body: data }),
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
  reorder: (updates: { id: string; order: number }[]) => api('/leads/reorder/batch', { method: 'PUT', body: { updates } }),
  addActivity: (leadId: string, data: { type: string; content: string }) => api(`/leads/${leadId}/activity`, { method: 'POST', body: data }),
  convertToClient: (leadId: string) => api(`/leads/${leadId}/convert`, { method: 'POST' }),
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
  trigger: (triggerType: string, data: any) => api('/workflows/trigger', { method: 'POST', body: { triggerType, data } }),
};

// ─── WhatsApp ──────────────────────────────────────────────

export const whatsappApi = {
  listInstances: () => api('/whatsapp/instances'),
  createInstance: (data: { instanceName: string; phone?: string }) => api('/whatsapp/instances', { method: 'POST', body: data }),
  getQR: (name: string) => api(`/whatsapp/instances/${name}/qr`),
  getStatus: (name: string) => api(`/whatsapp/instances/${name}/status`),
  send: (data: { instanceName: string; to: string; message: string }) => api('/whatsapp/send', { method: 'POST', body: data }),
  delete: (name: string) => api(`/whatsapp/instances/${name}`, { method: 'DELETE' }),
};

// ─── Telegram ──────────────────────────────────────────────

export const telegramApi = {
  getConfig: () => api('/telegram/config'),
  updateConfig: (data: { botToken: string; chatId?: string; botName?: string }) => api('/telegram/config', { method: 'PUT', body: data }),
  test: () => api('/telegram/test', { method: 'POST' }),
  send: (data: { chatId?: string; message: string }) => api('/telegram/send', { method: 'POST', body: data }),
  setWebhook: (webhookUrl: string) => api('/telegram/setwebhook', { method: 'POST', body: { webhookUrl } }),
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
  create: (data: { actor?: string; action: string; status: string; details: string; severity: string }) => api('/audit', { method: 'POST', body: data }),
};

// ─── Team ──────────────────────────────────────────────────

export const teamApi = {
  list: () => api('/team'),
  updateRole: (id: string, role: string) => api(`/team/${id}/role`, { method: 'PUT', body: { role } }),
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
  createDriveDoc: (data: { title: string; content: string; mimeType?: string }) => api('/workspace/drive/create', { method: 'POST', body: data }),
  uploadToDrive: (data: { fileName: string; content: string; mimeType?: string; folderName?: string }) => api('/workspace/drive/upload', { method: 'POST', body: data }),
  sendEmail: (data: { to: string; subject: string; body: string; cc?: string }) => api('/workspace/gmail/send', { method: 'POST', body: data }),
  createCalendarEvent: (data: { summary: string; description?: string; startTime: string; endTime?: string; attendees?: { email: string }[]; conferenceData?: boolean }) => api('/workspace/calendar/create', { method: 'POST', body: data }),
  createContact: (data: { name: string; email: string; phone?: string; company?: string }) => api('/workspace/contacts/create', { method: 'POST', body: data }),
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
