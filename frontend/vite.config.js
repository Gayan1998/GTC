import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Local development serves the React app on :5173 and proxies /api and
// /uploads to the XAMPP/Apache document root so the app is same-origin.
// In production the build output is uploaded to the web root and served
// directly by Apache.
//
// Environment files (.env, .env.production, .env.<mode>) may set:
//   VITE_BASE_PATH        Base URL path (default "/"). Set to "/sub/dir/" when
//                         deploying into a sub-directory.
//   VITE_API_BASE         API path (default "/api").
//   VITE_MEDIA_BASE       Prefix for uploaded media (default "").
//   VITE_DEV_APACHE_BASE  Proxy target used only by the dev server.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    base: env.VITE_BASE_PATH || '/',
    build: {
      // Production files land in the web root so Apache can serve them directly.
      outDir: '../',
      emptyOutDir: false,
      sourcemap: false,
    },
    server: {
      port: 5173,
      proxy: {
        '/api': { target: env.VITE_DEV_APACHE_BASE || 'http://localhost/GTC%20holdings/web', changeOrigin: true },
        '/uploads': { target: env.VITE_DEV_APACHE_BASE || 'http://localhost/GTC%20holdings/web', changeOrigin: true },
      },
    },
  };
});
