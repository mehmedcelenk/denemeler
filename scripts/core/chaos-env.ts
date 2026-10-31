import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

export function loadEnvKey(keyName: string): string {
  if (process.env[keyName]) return process.env[keyName]!;
  const envPath = path.resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return '';
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [k, ...v] = trimmed.split('=');
    if (k.trim() === keyName) {
      return v.join('=').trim().replace(/^['"]|['"]$/g, '');
    }
  }
  return '';
}
