import { defineConfig } from 'vite';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Vite's SPA fallback serves the app index.html for directory paths.
// For the static blog we serve the corresponding public/blog/.../index.html.
const blogIndexMiddleware = () => ({
  name: 'serve-blog-index',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = (req.url || '').split('?')[0];
      const candidates = [];
      if (url.startsWith('/blog/') || url === '/blog') {
        if (url === '/blog' || url === '/blog/') {
          candidates.push('public/blog/index.html');
        } else if (url.endsWith('/')) {
          candidates.push(`public${url}index.html`);
        } else {
          // Try both exact .html and with trailing-slash index.html
          candidates.push(`public${url}`);
          candidates.push(`public${url}/index.html`);
        }
      }
      for (const rel of candidates) {
        const file = resolve(__dirname, rel);
        if (existsSync(file) && file.endsWith('.html')) {
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
