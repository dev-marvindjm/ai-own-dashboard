// Client for MSG incoming Service (:8001)
// Proxied via /api/msg/ in Nginx and Vite dev server

const BASE_URL = '/api/msg';

export async function getOrFetchMsgToken(forceRefresh = false): Promise<string | null> {
  let token = localStorage.getItem('msg_token');
  if (token && !forceRefresh) return token;

  try {
    const form = new URLSearchParams();
    form.append('username', 'admin@quant.com');
    form.append('password', 'AdminPasswordSecure2026!');
    const res = await fetch(`${BASE_URL}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.access_token) {
        localStorage.setItem('msg_token', data.access_token);
        return data.access_token;
      }
    }
  } catch (err) {
    console.warn('Could not auto-fetch msg token:', err);
  }
  return localStorage.getItem('auth_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let token = localStorage.getItem('msg_token');
  if (!token && !endpoint.includes('/auth/token')) {
    token = await getOrFetchMsgToken();
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // If 401 Unauthorized, refresh token and retry once
  if (response.status === 401 && !endpoint.includes('/auth/token')) {
    token = await getOrFetchMsgToken(true);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
    }
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`MSG Incoming Error (${response.status}): ${errorText}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json();
  // Unwrap standard ApiResponse { success: boolean, data: T }
  return (data && typeof data === 'object' && 'data' in data) ? data.data : data;
}

// Health check
export const getMsgHealth = () => request<any>('/health');

// Sender Rules & Policies (ALLOW, BLOCK, DEFAULT)
export interface SenderRulePayload {
  platform: 'TELEGRAM' | 'THREADS' | 'WHATSAPP';
  entity_id: string;
  entity_name?: string;
  policy: 'ALLOW' | 'BLOCK' | 'DEFAULT';
  is_active?: boolean;
  forward_to_brokers?: boolean;
}

export const getSenderRules = (platform?: string, policy?: string) => {
  const params = new URLSearchParams();
  if (platform) params.append('platform', platform);
  if (policy) params.append('policy', policy);
  const q = params.toString() ? `?${params.toString()}` : '';
  return request<any[]>(`/rules/senders${q}`);
};

export const upsertSenderRule = (payload: SenderRulePayload) =>
  request<any>('/rules/senders', { method: 'POST', body: JSON.stringify(payload) });

export const deleteSenderRule = (senderIdentifier: string) =>
  request<any>(`/rules/senders/${encodeURIComponent(senderIdentifier)}`, { method: 'DELETE' });

export const toggleSenderRule = (ruleId: number | string) =>
  request<any>(`/rules/senders/${ruleId}/toggle`, { method: 'PUT' });

// Global Whitelist & Ingestion Config (allow_any_sender, strict_whitelist)
export interface GlobalFilterConfigPayload {
  platform: 'TELEGRAM' | 'THREADS' | 'WHATSAPP';
  allow_any_sender: boolean;
  strict_whitelist: boolean;
}

export const getGlobalFilterConfigs = () => request<any[]>('/rules/config');

export const updateGlobalFilterConfig = (payload: GlobalFilterConfigPayload) =>
  request<any>('/rules/config', { method: 'PUT', body: JSON.stringify(payload) });

// Messages Audit Log & Ingestion Webhook
export interface WebhookMessagePayload {
  platform: 'TELEGRAM' | 'THREADS' | 'WHATSAPP';
  external_message_id: string;
  sender_id: string;
  sender_name?: string;
  raw_text: string;
  chat_id?: string;
}

export const getMessagesHistory = (filters: {
  platform?: string;
  delivery_status?: string;
  page?: number;
  page_size?: number;
  sender_id?: string;
  search?: string;
} = {}) => {
  const params = new URLSearchParams();
  if (filters.platform) params.append('platform', filters.platform);
  if (filters.delivery_status) params.append('delivery_status', filters.delivery_status);
  if (filters.page) params.append('page', String(filters.page));
  if (filters.page_size) params.append('page_size', String(filters.page_size));
  if (filters.sender_id) params.append('sender_id', filters.sender_id);
  if (filters.search) params.append('search', filters.search);
  const q = params.toString() ? `?${params.toString()}` : '';
  return request<any>(`/messages/history${q}`);
};

export const ingestWebhookMessage = (payload: WebhookMessagePayload) =>
  request<any>('/messages/webhook', { method: 'POST', body: JSON.stringify(payload) });
