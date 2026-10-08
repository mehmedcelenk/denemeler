import { defineConfig } from 'vite';
import { cpSync, existsSync, createReadStream, statSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  base: './',
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        app: path.resolve(root, 'src/main.js'),
        styles: path.resolve(root, 'src/styles/index.css'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
  plugins: [{
    name: 'study-assets-handler',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const rawUrl = (req.url || '').split('?')[0];
        const cleanUrl = rawUrl.replace(/^\//, '');
        if (cleanUrl.startsWith('data/') || cleanUrl.startsWith('audio/')) {
          const filePath = path.join(root, cleanUrl);
          if (existsSync(filePath) && statSync(filePath).isFile()) {
            if (filePath.endsWith('.json')) {
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
            } else if (filePath.endsWith('.mp3')) {
              res.setHeader('Content-Type', 'audio/mpeg');
            }
            createReadStream(filePath).pipe(res);
            return;
          }
        }
        next();
      });
    },
    closeBundle() {
      for (const name of ['data', 'audio', 'CNAME', 'manifest.json', 'sw.js']) {
        if (existsSync(`${root}${name}`)) {
          cpSync(`${root}${name}`, `${root}dist/${name}`, { recursive: true });
        }
      }
      if (existsSync(`${root}index.html`)) {
        let html = readFileSync(`${root}index.html`, 'utf8');
        html = html.replace('./dist/assets/styles.css', './assets/styles.css')
                   .replace('./dist/assets/app.js', './assets/app.js');
        writeFileSync(`${root}dist/index.html`, html, 'utf8');
      }
    },
  }],
});

