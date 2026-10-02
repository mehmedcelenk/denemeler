import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const failures = [];
const graph = new Map();
const root = path.resolve('src');
function scan(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { scan(file); continue; }
    if (!/\.(js|ts|css)$/.test(file)) continue;
    const source = readFileSync(file, 'utf8');
    const lines = source.trimEnd().split('\n').length;
    if (lines > 350) failures.push(`${path.relative(root, file)}: ${lines} satır (sınır 350). Sorumluluklarına göre böl.`);
    if (file.endsWith('.css')) continue;
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    const dependencies = [];
    for (const node of ast.statements) {
      if (!ts.isImportDeclaration(node)) continue;
      const spec = node.moduleSpecifier.text;
      if (!spec.startsWith('.')) continue;
      const target = path.resolve(path.dirname(file), spec);
      try { readFileSync(target); } catch { failures.push(`Eksik import: ${file} -> ${spec}`); }
      if (/\.(js|ts)$/.test(target)) dependencies.push(target);
      if (file.startsWith(path.join(root, 'shared') + path.sep) && /[/\\](features|app)[/\\]/.test(target)) {
        failures.push(`shared uygulama veya özellik katmanına bağımlı olamaz: ${file}`);
      }
    }
    graph.set(file, dependencies);
  }
}
scan(root);
const done = new Set();
function visit(file, stack = []) {
  if (stack.includes(file)) {
    failures.push(`Döngüsel import: ${[...stack.slice(stack.indexOf(file)), file].map(p => path.relative(root, p)).join(' -> ')}`);
    return;
  }
  if (done.has(file)) return;
  done.add(file);
  for (const dependency of graph.get(file) || []) visit(dependency, [...stack, file]);
}
for (const file of graph.keys()) visit(file);
const shell = readFileSync('index.html', 'utf8');
if (/<style\b/.test(shell) || /<script(?![^>]*\bsrc=)/.test(shell)) {
  failures.push('index.html içine uygulama JS/CSS kodu ekleme.');
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Mimari kontrolü geçti: ${graph.size} modül, döngüsel import yok, dosyalar en fazla 350 satır.`);
}
