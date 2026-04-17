import { defineConfig } from 'vite';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// In dev, Vite's SPA fallback serves the app index.html for any non-file path.
// For /blog/ (and /blog) we want the static public/blog/index.html instead.
const blogIndexMiddleware = () => ({
  name: 'serve-blog-index',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = (req.url || '').split('?')[0];
      if (url === '/blog' || url === '/blog/') {
        const file = resolve(__dirname, 'public/blog/index.html');
        if (existsSync(file)) {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(readFileSync(file));
          return;
        }
      }
      next();
    });
  },
});

export default defineConfig({
  plugins: [blogIndexMiddleware()],
  server: {
    port: 5174,
    strictPort: true,
    host: 'localhost',
  },
});
