const BASE_URL = '/api';

function getToken() {
  return localStorage.getItem('cp_token');
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const message = data?.error || `Request failed with status ${res.status}`;
    const error = new Error(message);
    error.details = data?.details;
    error.status = res.status;
    throw error;
  }

  return data;
}

export const api = {
  login: (username, password) => request('/auth/login', { method: 'POST', body: { username, password }, auth: false }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),

  getPolicies: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/policies${qs ? `?${qs}` : ''}`);
  },
  getPolicy: (id) => request(`/policies/${id}`),

  getClaims: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/claims${qs ? `?${qs}` : ''}`);
  },
  getClaim: (id) => request(`/claims/${id}`),
  createClaim: (payload) => request('/claims', { method: 'POST', body: payload }),
  updateClaimStatus: (id, payload) => request(`/claims/${id}/status`, { method: 'PATCH', body: payload }),
  addDocument: (id, name) => request(`/claims/${id}/documents`, { method: 'POST', body: { name } }),

  getDashboardStats: () => request('/stats/dashboard'),
};

export { getToken };
