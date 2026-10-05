// Client for MetaTrader 5 & Multi-Broker Quant Trading Server (:8000)
// Proxied via /api/quant/ in Nginx and Vite dev server

const BASE_URL = '/api/quant';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Quant API Error (${response.status}): ${errorText}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json();
  // Unwrap standard FastAPI ApiResponse { success: boolean, data: T }
  return (data && typeof data === 'object' && 'data' in data) ? data.data : data;
}

// Health & System Status
export const getQuantHealth = () => request<any>('/health');

// Accounts & Brokers
export const getAccounts = () => request<any[]>('/accounts');
export const getBrokerCatalog = () => request<any[]>('/accounts/catalog');
export const createAccount = (payload: any) => request<any>('/accounts', { method: 'POST', body: JSON.stringify(payload) });
export const connectAccount = (accountId: number | string) => request<any>(`/accounts/${accountId}/connect`, { method: 'POST' });
export const disconnectAccount = (accountId: number | string) => request<any>(`/accounts/${accountId}/disconnect`, { method: 'POST' });
export const getAccountBalance = (accountId: number | string) => request<any>(`/accounts/${accountId}/balance`);

// Orders & Executions
export const executeMarketOrder = (payload: any) => request<any>('/orders/market', { method: 'POST', body: JSON.stringify(payload) });
export const executeBinaryOrder = (payload: any) => request<any>('/orders/binary', { method: 'POST', body: JSON.stringify(payload) });
export const getOrdersHistory = () => request<any[]>('/orders/history');
export const getOrderById = (orderId: number | string) => request<any>(`/orders/${orderId}`);

// Positions & Emergency Liquidation
export const getOpenPositions = () => request<any[]>('/positions');
export const closePosition = (payload: { account_id: number; ticket: string; symbol: string }) =>
  request<any>('/positions/close', { method: 'POST', body: JSON.stringify(payload) });
export const closeAllPositions = (accountId?: number) =>
  request<any>('/positions/close-all', { method: 'POST', body: JSON.stringify(accountId ? { account_id: accountId } : {}) });

// Signals Engine
export const getSignalsHistory = () => request<any[]>('/signals/history');
export const receiveSignal = (payload: any) => request<any>('/signals/receive', { method: 'POST', body: JSON.stringify(payload) });
export const executeSignal = (payload: any) => request<any>('/signals/execute', { method: 'POST', body: JSON.stringify(payload) });

// Funds (Capital Accumulation & Drawdown Goals)
export const getFunds = () => request<any[]>('/funds');
export const getFundById = (fundId: number | string) => request<any>(`/funds/${fundId}`);
export const getFundMetrics = (fundId: number | string) => request<any>(`/funds/${fundId}/metrics`);
export const createFund = (payload: any) => request<any>('/funds', { method: 'POST', body: JSON.stringify(payload) });
export const pauseFund = (fundId: number | string) => request<any>(`/funds/${fundId}/pause`, { method: 'POST' });
export const resumeFund = (fundId: number | string) => request<any>(`/funds/${fundId}/resume`, { method: 'POST' });

// Challenges & Leaderboards
export const getChallenges = () => request<any[]>('/challenges');
export const getChallengeById = (challengeId: number | string) => request<any>(`/challenges/${challengeId}`);
export const getChallengeLeaderboard = (challengeId: number | string) => request<any>(`/challenges/${challengeId}/leaderboard`);
export const createChallenge = (payload: any) => request<any>('/challenges', { method: 'POST', body: JSON.stringify(payload) });
export const joinChallenge = (challengeId: number | string) => request<any>(`/challenges/${challengeId}/join`, { method: 'POST' });
export const getWinnersHistory = () => request<any[]>('/challenges/history/winners');
export const evaluateTrade = (payload: any) => request<any>('/challenges/evaluate-trade', { method: 'POST', body: JSON.stringify(payload) });
