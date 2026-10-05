// Client for Rust Trading Signals Tokenizer & Matcher (:8002 / :8000 in container)
// Proxied via /api/tokenizer/ in Nginx and Vite dev server

const BASE_URL = import.meta.env.VITE_TOKENIZER_API_URL || '/api/tokenizer';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanBase = BASE_URL.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const response = await fetch(`${cleanBase}${cleanEndpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Tokenizer API Error (${response.status}): ${errorText}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// Templates CRUD & Activation
export interface SignalTemplatePayload {
  name: string;
  pattern_syntax: string;
  template_type: string;
  description?: string;
  example_text?: string;
  priority?: number;
  is_active?: boolean;
  is_system?: boolean;
  code_slot?: string;
  section?: string;
  sender_name?: string;
  win_rate?: number;
  latency_us?: number;
  signals_count?: number;
  quality_score?: number;
}

export const getTemplates = (filters: {
  is_active?: boolean;
  template_type?: string;
  search?: string;
  limit?: number;
  offset?: number;
} = {}) => {
  const params = new URLSearchParams();
  if (filters.is_active !== undefined) params.append('is_active', String(filters.is_active));
  if (filters.template_type) params.append('template_type', filters.template_type);
  if (filters.search) params.append('search', filters.search);
  if (filters.limit) params.append('limit', String(filters.limit));
  if (filters.offset) params.append('offset', String(filters.offset));
  const q = params.toString() ? `?${params.toString()}` : '';
  return request<any[]>(`/templates${q}`);
};

export const getTokenizerTemplates = getTemplates;

export const getTemplateById = (templateId: number | string) =>
  request<any>(`/templates/${templateId}`);

export const createTemplate = (payload: SignalTemplatePayload) =>
  request<any>('/templates', { method: 'POST', body: JSON.stringify(payload) });

export const updateTemplate = (templateId: number | string, payload: Partial<SignalTemplatePayload>) =>
  request<any>(`/templates/${templateId}`, { method: 'PUT', body: JSON.stringify(payload) });

export const deleteTemplate = (templateId: number | string) =>
  request<any>(`/templates/${templateId}`, { method: 'DELETE' });

export const matchTemplate = (payload: { text: string; template_id?: number } | string) => {
  const body = typeof payload === 'string' ? { text: payload } : payload;
  return request<any>('/templates/match', { method: 'POST', body: JSON.stringify(body) });
};

export const getTemplateConfigsList = () =>
  request<any[]>('/templates/configs');

export const getTemplateConfigData = (templateId: number | string) =>
  request<any>(`/templates/${templateId}/config`);

export const saveTemplateConfigData = (templateId: number | string, payload: any) =>
  request<any>(`/templates/${templateId}/config`, { method: 'PUT', body: JSON.stringify(payload) });

export const getTemplateBrokersLinks = () =>
  request<any[]>('/templates/brokers-links');

export const getBrokersCatalog = () =>
  request<any[]>('/templates/brokers-catalog');

export const getTemplateBrokers = (templateId: number | string) =>
  request<any[]>(`/templates/${templateId}/brokers`);

export const linkTemplateBrokerToAccount = (templateId: number | string, payload: any) =>
  request<any>(`/templates/${templateId}/brokers`, { method: 'POST', body: JSON.stringify(payload) });

// Native Rust Tokenizer Tester
export interface TokenizeRequestPayload {
  text: string;
  template_id?: number;
  persist?: boolean;
}

export interface TokenDTO {
  kind: string;
  value: string;
  start: number;
  end: number;
  line: number;
}

export interface TokenizeResponse {
  tokens: TokenDTO[];
  entities: Record<string, any>;
  processing_time_us: number;
  record_id?: number;
}

export const tokenizeText = (payload: TokenizeRequestPayload | string): Promise<TokenizeResponse> => {
  const body = typeof payload === 'string' ? { text: payload } : payload;
  return request<TokenizeResponse>('/tokens/tokenize', { method: 'POST', body: JSON.stringify(body) });
};

// Benchmarks & Replay Engine
export const replayBenchmarkSignals = (limit: number = 100) =>
  request<any>(`/benchmarks/replay-signals?limit=${limit}`, { method: 'POST' });
