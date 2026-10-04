import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const errors = [];
const warnings = [];
const graph = new Map();
const root = path.resolve('src');

// 1. src/ dizinini tara ve AST ile bağımlılık grafını kur
function scan(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { scan(file); continue; }
    if (!/\.(js|ts|css)$/.test(file)) continue;

    const source = readFileSync(file, 'utf8');
    const lines = source.trimEnd().split('\n').length;
    const relFile = path.relative(root, file);

    // Kural 2: Aşırı büyük dosyalar (WARNING)
    if (lines > 350) {
      warnings.push(`📏 [Dosya Boyutu] ${relFile}: ${lines} satır (önerilen sınır: 350 satır).`);
    }

    if (file.endsWith('.css')) continue;

    // Kural 4: Shared yardımcıların saflığı (DOM/window/storage bağımlılığı olmamalı)
    if (file.startsWith(path.join(root, 'shared') + path.sep)) {
      if (/\b(window|document|localStorage|sessionStorage)\b/.test(source)) {
        errors.push(`🧹 [Shared Saflığı] ${relFile}: Saf yardımcı modülde DOM veya global nesne referansı tespit edildi.`);
      }
    }

    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    const dependencies = [];

    for (const node of ast.statements) {
      if (!ts.isImportDeclaration(node)) continue;
      const spec = node.moduleSpecifier.text;
      if (!spec.startsWith('.')) continue;

      const target = path.resolve(path.dirname(file), spec);
      try {
        readFileSync(target);
      } catch {
        errors.push(`❌ [Eksik Import] ${relFile} -> ${spec}`);
      }

      if (/\.(js|ts)$/.test(target)) {
        dependencies.push(target);

        // Kural 3: Katman ihlalleri (ERROR)
        if (file.startsWith(path.join(root, 'shared') + path.sep) && /[/\\](features|app)[/\\]/.test(target)) {
          errors.push(`🏗️ [Katman İhlali] ${relFile} -> ${spec}: shared katmanı features veya app katmanına bağımlı olamaz.`);
        }
        if (file.startsWith(path.join(root, 'data') + path.sep) && /[/\\]features[/\\]/.test(target)) {
          errors.push(`🏗️ [Katman İhlali] ${relFile} -> ${spec}: data katmanı features katmanına bağımlı olamaz.`);
        }

        // Kural 6: Cross-coupling (WARNING)
        const fileFeatureMatch = relFile.match(/^features[/\\]([^/\\]+)/);
        const targetRel = path.relative(root, target);
        const targetFeatureMatch = targetRel.match(/^features[/\\]([^/\\]+)/);
        if (fileFeatureMatch && targetFeatureMatch && fileFeatureMatch[1] !== targetFeatureMatch[1]) {
          const featA = fileFeatureMatch[1];
          const featB = targetFeatureMatch[1];
          if (/[/\\](render|topics|selection|drawer|reveal|question-card)\.(js|ts)$/.test(targetRel)) {
            warnings.push(`📦 [Cross-Coupling] ${featA} -> ${featB}: ${relFile} doğrudan ${targetRel} bileşenine bağlı.`);
          }
        }
      }
    }

    // Kural 5: Aşırı bağımlılık (WARNING)
    if (dependencies.length > 8) {
      warnings.push(`🔗 [Aşırı Bağımlılık] ${relFile}: ${dependencies.length} modüle doğrudan bağımlı.`);
    }

    graph.set(file, dependencies);
  }
}

scan(root);

// Kural 1: Döngüsel import tespiti (ERROR)
const done = new Set();
function visit(file, stack = []) {
  if (stack.includes(file)) {
    errors.push(`🔄 [Döngüsel Bağımlılık] ${[...stack.slice(stack.indexOf(file)), file].map(p => path.relative(root, p)).join(' -> ')}`);
    return;
  }
  if (done.has(file)) return;
  done.add(file);
  for (const dependency of graph.get(file) || []) {
    visit(dependency, [...stack, file]);
  }
}
for (const file of graph.keys()) visit(file);

// HTML kabuk temizliği denetimi (ERROR)
const shell = readFileSync('index.html', 'utf8');
if (/<style\b/.test(shell) || /<script(?![^>]*\bsrc=)/.test(shell)) {
  errors.push('🏛️ [Kabuk Hijyeni] index.html içine uygulama JS/CSS kodu gömülemez.');
}

// Kural 7: Global namespace denetimi (WARNING)
let globalFnCount = 0;
const eventsPath = path.join(root, 'app', 'events.js');
try {
  const eventsContent = readFileSync(eventsPath, 'utf8');
  const assignMatch = eventsContent.match(/Object\.assign\(window,\s*\{([^}]+)\}\)/s);
  if (assignMatch) {
    const entries = assignMatch[1].split(',').map(s => s.trim()).filter(s => s && !s.startsWith('//'));
    globalFnCount = entries.length;
  }
} catch {
  // events.js dosyası veya eşleşme yoksa yoksay
}

if (globalFnCount > 20) {
  warnings.push(`🌍 [Global Namespace] window üzerine ${globalFnCount} adet fonksiyon bağlanmış (src/app/events.js). Event delegation ile azaltılması önerilir.`);
}

// Mimari Rapor Çıktısı
console.log('\n🏛️  AÖL Dijital Kitapçık — Mimari Denetim Raporu');
console.log('='.repeat(56));

if (errors.length > 0) {
  console.log(`\n🔴 HATALAR (ERROR - ${errors.length}):`);
  errors.forEach(e => console.log(`  ${e}`));
}

if (warnings.length > 0) {
  console.log(`\n🟡 UYARILAR (WARNING - ${warnings.length}):`);
  warnings.forEach(w => console.log(`  ${w}`));
}

console.log('\n' + '='.repeat(56));
if (errors.length === 0) {
  console.log(`✅ Mimari denetim GEÇTİ: ${graph.size} modül incelendi, 0 Hata, ${warnings.length} Uyarı.`);
} else {
  console.error(`❌ Mimari denetim BAŞARISIZ: ${errors.length} kritik mimari hata bulundu.`);
  process.exitCode = 1;
}

