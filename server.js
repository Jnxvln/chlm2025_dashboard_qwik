import express from 'express';
import compression from 'compression';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = parseInt(process.env.PORT || '3000');

async function createServer() {
  const app = express();
  app.use(compression());

  // Create vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
    mode: 'ssr'
  });

  app.use(vite.middlewares);

  app.get('*', async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // 1. Read index.html
      let template = fs.readFileSync(
        resolve(__dirname, 'index.html'),
        'utf-8'
      );

      // 2. Apply Vite HTML transforms. This injects the Vite HMR client, and
      // also applies HTML transforms from Vite plugins
      template = await vite.transformIndexHtml(url, template);

      // 3. Load the server entry. vite.ssrLoadModule automatically transforms
      // your ESM source code to be usable in Node.js! There is no bundling
      // required, and provides efficient invalidation similar to HMR.
      const { default: render } = await vite.ssrLoadModule('/src/entry.ssr.tsx');

      // 4. Render the app HTML. This assumes entry-server.js's exported
      // `render` function calls appropriate framework SSR APIs,
      const appHtml = await render({
        url,
        base: '/src/',
      });

      // 5. Inject the app-rendered HTML into the template.
      const html = template.replace(`<!--qwik-->`, appHtml);

      // 6. Send the rendered HTML back.
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e) {
      // If an error is caught, let Vite fix the stacktrace so it maps back to
      // your actual source code.
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
  });
}

createServer();