import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api/v1',
  timeout: 15000,
});

// ── Token refresh silencioso ──────────────────────────────────
let refreshing = null;

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  async (err) => {
    const orig = err.config;
    if (err.response?.status === 401 && !orig._retry && err.response?.data?.code === 'TOKEN_EXPIRED') {
      orig._retry = true;
      if (!refreshing) {
        refreshing = api.post('/auth/refresh', { refreshToken: localStorage.getItem('refresh_token') })
          .then(r => {
            localStorage.setItem('accessToken', r.data.data.accessToken);
            return r.data.data.access_token;
          })
          .catch(() => {
            localStorage.clear();
            window.location.href = '/login';
          })
          .finally(() => { refreshing = null; });
      }
      const token = await refreshing;
      if (token) { orig.headers.Authorization = `Bearer ${token}`; return api(orig); }
    }
    return Promise.reject(err);
  }
);

// ── Services ──────────────────────────────────────────────────
export const clientService = {
  list:       (p)  => api.get('/clients', { params: p }),
  search:     (q)  => api.get('/clients/search', { params: { q } }),
  get:        (id) => api.get(`/clients/${id}`),
  getHistory: (id) => api.get(`/clients/${id}/history`),
  create:     (d)  => api.post('/clients', d),
  update:     (id, d) => api.put(`/clients/${id}`, d),
  delete:     (id) => api.delete(`/clients/${id}`),
  lookupCEP:  (cep) => api.get(`/clients/cep/${cep}`),
};
export const authService = {
  login:          (d)  => api.post('/auth/login', d),
  refresh:        (d)  => api.post('/auth/refresh', d),
  me:             ()   => api.get('/auth/me'),
  changePassword: (d)  => api.patch('/auth/change-password', d),
  register:       (d)  => api.post('/auth/register', d),
};
export const orderService = {
  list:         (p)  => api.get('/orders', { params: p }),
  search:       (q)  => api.get('/orders/search', { params: { q } }),
  get:          (id) => api.get(`/orders/${id}`),
  stats:        (period) => api.get('/orders/stats', { params: { period } }),
  advancedStats:(period) => api.get('/orders/stats/advanced', { params: { period } }),
  create:       (d)  => api.post('/orders', d),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  downloadPDF:  (id) => api.get(`/orders/${id}/warranty-pdf`, { responseType: 'blob' }),
  resendPDF:    (id) => api.patch(`/orders/${id}/resend-pdf`),
  delete:       (id) => api.delete(`/orders/${id}`),
  auditLogs:    (p)  => api.get('/audit', { params: p }),
  runReport:    (month, year) => api.post('/reports/monthly', { month, year }),
  runBackup:    ()   => api.post('/backup/run'),
};

export default api;
