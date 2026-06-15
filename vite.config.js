import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const SHOP_ORIGIN = 'https://2a9dc7.myshopify.com';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3004,
    proxy: {
      '/sync': {
        target: 'https://shop-api.mysurefit.co',
        changeOrigin: true,
        secure: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('origin', SHOP_ORIGIN);
            proxyReq.setHeader('referer', SHOP_ORIGIN + '/');
          });
        },
      },
      '/v4': {
        target: 'https://api.mysurefit.co',
        changeOrigin: true,
        secure: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('origin', SHOP_ORIGIN);
            proxyReq.setHeader('referer', SHOP_ORIGIN + '/');
          });
        },
      },
    },
  },
});
