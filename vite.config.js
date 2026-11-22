import { defineConfig, loadEnv } from 'vite';
import { cpSync, existsSync, createReadStream, statSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { writeAssetManifest } from './scripts/release-assets.ts';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode || 'development', root, '');
  const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
  if (apiKey) process.env.GEMINI_API_KEY = apiKey;
  if (env.EVREN_API_KEY) process.env.EVREN_API_KEY = env.EVREN_API_KEY;
  if (env.EVREN_BASE_URL) process.env.EVREN_BASE_URL = env.EVREN_BASE_URL;
  if (env.OPENAI_API_KEY) process.env.OPENAI_API_KEY = env.OPENAI_API_KEY;
  if (env.ELEVENLABS_API_KEY) process.env.ELEVENLABS_API_KEY = env.ELEVENLABS_API_KEY;
  if (env.ELEVENLABS_VOICE_ID) process.env.ELEVENLABS_VOICE_ID = env.ELEVENLABS_VOICE_ID;
  if (env.ELEVENLABS_VOICE_ID_MALE) process.env.ELEVENLABS_VOICE_ID_MALE = env.ELEVENLABS_VOICE_ID_MALE;

  return {
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
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks(id) {
          if (id.includes('node_modules/katex')) {
            return 'katex-vendor';
          }
          if (id.includes('MEB_VOCAB_DICT.json')) {
            return 'vocab-dict';
          }
        },
      },
    },
  },
  plugins: [{
    name: 'study-assets-handler',
    transformIndexHtml: {
      order: 'pre',
      handler(html, context) {
        if (!context.server) return html;
        return html.replace('./dist/assets/styles.css', './src/styles/index.css')
          .replace('./dist/assets/app.js', './src/main.js');
      },
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = (req.url || '').split('?')[0];
        if (rawUrl === '/api/tts') {
          try {
            const { handleTtsRequest } = await server.ssrLoadModule('/functions/api/tts.ts');
            const fullUrl = `http://${req.headers.host || '127.0.0.1:5173'}${req.url}`;
            const fetchReq = new Request(fullUrl, {
              method: req.method,
              headers: req.headers,
            });
            const response = await handleTtsRequest(fetchReq, {
              ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
              ELEVENLABS_VOICE_ID: process.env.ELEVENLABS_VOICE_ID,
              ELEVENLABS_VOICE_ID_MALE: process.env.ELEVENLABS_VOICE_ID_MALE,
              OPENAI_API_KEY: process.env.OPENAI_API_KEY,
              GEMINI_API_KEY: process.env.GEMINI_API_KEY,
            });
            res.statusCode = response.status;
            for (const [k, v] of response.headers.entries()) {
              res.setHeader(k, v);
            }
            const buf = await response.arrayBuffer();
            res.end(Buffer.from(buf));
            return;
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(err) }));
            return;
          }
        }
        const cleanUrl = rawUrl.replace(/^\//, '');
        if (cleanUrl.startsWith('data/') || cleanUrl.startsWith('audio/')) {
          let filePath = path.join(root, cleanUrl);
          if (!existsSync(filePath) && cleanUrl.startsWith('audio/')) {
            filePath = path.join(root, 'archive', cleanUrl);
          }
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
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = (req.url || '').split('?')[0];
        if (rawUrl === '/api/tts') {
          try {
            const { handleTtsRequest } = await import('./functions/api/tts.ts');
            const fullUrl = `http://${req.headers.host || '127.0.0.1:4173'}${req.url}`;
            const fetchReq = new Request(fullUrl, {
              method: req.method,
              headers: req.headers,
            });
            const response = await handleTtsRequest(fetchReq, {
              ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
              ELEVENLABS_VOICE_ID: process.env.ELEVENLABS_VOICE_ID,
              ELEVENLABS_VOICE_ID_MALE: process.env.ELEVENLABS_VOICE_ID_MALE,
              OPENAI_API_KEY: process.env.OPENAI_API_KEY,
              GEMINI_API_KEY: process.env.GEMINI_API_KEY,
            });
            res.statusCode = response.status;
            for (const [k, v] of response.headers.entries()) {
              res.setHeader(k, v);
            }
            const buf = await response.arrayBuffer();
            res.end(Buffer.from(buf));
            return;
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(err) }));
            return;
          }
        }
        next();
      });
    },
    generateBundle(_options, bundle) {
      const app = Object.values(bundle).find(item => item.type === 'chunk' && item.isEntry && item.name === 'app');
      const styles = Object.values(bundle).find(item => item.type === 'asset' && /^assets\/styles-[^/]+\.css$/.test(item.fileName));
      if (!app || !styles) throw new Error('Üretim JavaScript veya CSS dosyası bulunamadı.');
      const source = readFileSync(`${root}index.html`, 'utf8');
      if (!source.includes('./dist/assets/styles.css') || !source.includes('./dist/assets/app.js')) {
        throw new Error('HTML giriş dosyası işaretçileri bulunamadı.');
      }
      const html = source.replace('./dist/assets/styles.css', `./${styles.fileName}`)
        .replace('./dist/assets/app.js', `./${app.fileName}`);
      this.emitFile({ type: 'asset', fileName: 'index.html', source: html });
      this.emitFile({ type: 'asset', fileName: '200.html', source: html });
    },
    closeBundle() {
      // Sadece çalışma anında (runtime) tarayıcının ihtiyaç duyduğu veri ve varlıkları kopyala
      if (existsSync(`${root}data/subjects`)) {
        cpSync(`${root}data/subjects`, `${root}dist/data/subjects`, { recursive: true });
      }
      if (existsSync(`${root}data/lessons`)) {
        cpSync(`${root}data/lessons`, `${root}dist/data/lessons`, { recursive: true });
      }
      writeAssetManifest(`${root}dist`);
      for (const name of ['audio', 'CNAME', 'manifest.json', 'sw.js']) {
        if (existsSync(`${root}${name}`)) {
          cpSync(`${root}${name}`, `${root}dist/${name}`, { recursive: true });
        } else if (name === 'audio' && existsSync(`${root}archive/audio`)) {
          cpSync(`${root}archive/audio`, `${root}dist/audio`, { recursive: true });
        }
      }

    },
  }],
  };
});


