import axios from 'axios';

// Requests go through the Vite proxy (/sync → https://shop-api.mysurefit.co)
// so the proxy can inject origin: https://2a9dc7.myshopify.com server-side
// (browsers block setting the 'origin' header from JS).
const syncApi = axios.create({
  baseURL: '/sync',
  headers: {
    'Content-Type': 'application/json',
  },
});

syncApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('ss_auth_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

export default syncApi;
