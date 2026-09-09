import { User, Entity, Finding, AnalyticsSummary, NegativeSpaceMatrixItem, AuditLogItem } from './types';

const API_BASE = '/api';

export const getAuthToken = (): string | null => localStorage.getItem('satsa_token');
export const setAuthToken = (token: string) => localStorage.setItem('satsa_token', token);
export const clearAuthToken = () => localStorage.removeItem('satsa_token');

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthToken();
      window.dispatchEvent(new Event('auth-expired'));
    }
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || 'API request failed');
  }

  return response.json();
};

export const api = {
  // Auth
  login: (username: string, password: string) =>
    request<{ access_token: string; token_type: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getMe: () => request<User>('/auth/me'),

  // Entities
  getEntities: () => request<Entity[]>('/entities'),
  getEntityDetail: (id: string) => request<any>(`/entities/${id}`),
  getComparativeBenchmarks: () => request<any>('/entities/benchmarks/comparative'),

  // Findings
  getFindings: (params?: { entity_id?: string; category?: string; severity?: string; status?: string; min_priority?: number }) => {
    const query = new URLSearchParams();
    if (params?.entity_id) query.append('entity_id', params.entity_id);
    if (params?.category) query.append('category', params.category);
    if (params?.severity) query.append('severity', params.severity);
    if (params?.status) query.append('status', params.status);
    if (params?.min_priority !== undefined) query.append('min_priority', params.min_priority.toString());
    return request<Finding[]>(`/findings?${query.toString()}`);
  },

  getFindingDetail: (id: string) => request<Finding>(`/findings/${id}`),

  submitReviewDecision: (id: string, status: string, notes: string) =>
    request<any>(`/findings/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ status, examiner_notes: notes }),
    }),

  // Analytics
  getAnalyticsSummary: () => request<AnalyticsSummary>('/analytics/summary'),
  getNegativeSpaceMatrix: () => request<{ matrix: NegativeSpaceMatrixItem[] }>('/analytics/negative-space-matrix'),
  runAnalytics: (entity_id?: string) =>
    request<any>(`/analytics/run${entity_id ? `?entity_id=${entity_id}` : ''}`, { method: 'POST' }),

  // Ingest & Synthetic
  resetSyntheticBaseline: () => request<any>('/ingest/reset-synthetic', { method: 'POST' }),

  // Reports
  getAssessmentDossier: (entity_id?: string) =>
    request<any>(`/reports/assessment-dossier${entity_id ? `?entity_id=${entity_id}` : ''}`),

  // Audit Logs
  getAuditLogs: (limit: number = 50) => request<AuditLogItem[]>(`/audit/logs?limit=${limit}`),
};
