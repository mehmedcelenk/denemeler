import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

interface AssetManifest { version: 1; assets: Record<string, string> }
const digest = (data: Buffer): string => createHash('sha256').update(data).digest('hex');
const validName = (name: string): boolean => /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name);

export function createAssetManifest(dist: string): AssetManifest {
  const dir = join(dist, 'assets');
  const assets: Record<string, string> = {};
  for (const name of readdirSync(dir).sort()) {
    if (!validName(name) || !statSync(join(dir, name)).isFile()) throw new Error(`Geçersiz varlık: ${name}`);
    assets[name] = digest(readFileSync(join(dir, name)));
  }
  return { version: 1, assets };
}
export function writeAssetManifest(dist: string): void {
  writeFileSync(join(dist, 'release-assets.json'), JSON.stringify(createAssetManifest(dist)) + '\n');
}
function parseManifest(value: unknown): AssetManifest {
  if (!value || typeof value !== 'object') throw new Error('Yayın manifesti geçersiz.');
  const v = value as Record<string, unknown>;
  if (v.version !== 1 || !v.assets || typeof v.assets !== 'object' || Array.isArray(v.assets)) throw new Error('Yayın manifesti geçersiz.');
  const entries = Object.entries(v.assets);
  if (!entries.length || !entries.every(([key, hash]) => validName(key) && typeof hash === 'string' && /^[a-f0-9]{64}$/.test(hash))) throw new Error('Yayın manifestindeki varlıklar geçersiz.');
  return { version: 1, assets: Object.fromEntries(entries) as Record<string, string> };
}
export async function checkPreviousAssets(dist: string, url: string, baseline?: string, allowInitial = false): Promise<void> {
  const base = new URL(url);
  const response = await fetch(new URL('release-assets.json', base), { cache: 'no-store', signal: AbortSignal.timeout(15000) });
  let previous: AssetManifest;
  if (response.ok) {
    const body = await response.text();
    if (body.trimStart().startsWith('{')) previous = parseManifest(JSON.parse(body) as unknown);
    else if (body.trimStart().startsWith('<!') || body.trimStart().startsWith('<html')) previous = await bootstrap(base, baseline);
    else throw new Error('Yayın manifesti geçersiz.');
  } else if (response.status === 404) previous = await bootstrap(base, baseline, allowInitial);
  else throw new Error(`Yayın manifesti okunamadı (HTTP ${response.status}).`);
  const local = createAssetManifest(dist);
  const missing = Object.entries(previous.assets).filter(([name, hash]) => local.assets[name] !== hash).map(([name]) => name);
  if (missing.length) throw new Error(`Önceki yayından ${missing.length} varlık eksik veya değiştirilmiş: ${missing.slice(0, 5).join(', ')}. Önce önceki yayın çıktısının assets/ klasörünü dist/assets/ içine taşıyıp yeniden derleyin.`);
}
async function bootstrap(base: URL, baseline?: string, allowInitial = false): Promise<AssetManifest> {
  const html = await fetch(base, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (html.status === 404) {
    if (allowInitial) return { version: 1, assets: {} };
    throw new Error('Canlı alan boş (HTTP 404). İlk yayın için CENKS_INITIAL_DEPLOY=1 ile çalıştırın.');
  }
  if (!baseline) throw new Error('Canlı yayında varlık manifesti yok. İlk geçiş için önceki yayının eksiksiz dist klasörünü CENKS_PREVIOUS_DIST ile belirtin; eski varlıkları yeni dist/assets içine taşıyın.');
  if (!html.ok) throw new Error(`Canlı HTML okunamadı (HTTP ${html.status}).`);
  const previousHtml = join(baseline, 'index.html');
  if (!existsSync(previousHtml) || await html.text() !== readFileSync(previousHtml, 'utf8')) throw new Error('Önceki yayın klasöründeki index.html canlı yayınla eşleşmiyor.');
  return createAssetManifest(baseline);
}
async function main(): Promise<void> {
  const dist = resolve('dist');
  await checkPreviousAssets(dist, 'https://anlatansorular.surge.sh/', process.env.CENKS_PREVIOUS_DIST, process.env.CENKS_INITIAL_DEPLOY === '1');
  writeAssetManifest(dist);
  console.log('Önceki yayın varlıkları doğrulandı.');
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error(`Yayın durduruldu: ${error instanceof Error ? error.message : String(error)}`); process.exitCode = 1; });
}
