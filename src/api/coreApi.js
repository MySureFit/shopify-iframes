import axios from 'axios';

// Requests go through the Vite proxy (/v4 → https://api.mysurefit.co)
// so the proxy can inject origin: https://2a9dc7.myshopify.com server-side.
const coreApi = axios.create({
  baseURL: '/v4',
  headers: {
    'Content-Type': 'application/json',
  },
});

coreApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('ss_auth_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

export default coreApi;
