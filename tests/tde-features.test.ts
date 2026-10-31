import test from 'node:test';
import assert from 'node:assert/strict';

import { parseTurkishSentenceElements, enrichTurkishSentenceXray } from '../src/features/tde/cumle-xray.ts';

test('parseTurkishSentenceElements soru köklerini İngilizce Röntgen ile aynı sınıflarla ayırır', () => {
  // Kullanıcının doğrudan örneği
  const r1 = parseTurkishSentenceElements('Aşağıdakilerden hangisi siyahtır?');
  assert.ok(r1.includes('<span class="xray-sub" title="Özne">Aşağıdakilerden hangisi</span>'));
  assert.ok(r1.includes('<span class="xray-verb" title="Yüklem">siyahtır?</span>'));

  // Olumsuz soru kökü
  const r2 = parseTurkishSentenceElements('Bu parçayla ilgili aşağıdakilerden hangisi söylenemez?');
  assert.ok(r2.includes('<span class="xray-adv" title="Tümleç / Zarf">Bu parçayla ilgili</span>'));
  assert.ok(r2.includes('<span class="xray-sub" title="Özne">aşağıdakilerden hangisi</span>'));
  assert.ok(r2.includes('<span class="xray-verb" title="Yüklem">söylenemez?</span>'));

  // Standart SOV cümle
  const r3 = parseTurkishSentenceElements('Yazar, Anadolu romanının özelliklerini bu makalesinde ortaya koydu.');
  assert.ok(r3.includes('<span class="xray-sub" title="Özne">Yazar</span>'));
  assert.ok(r3.includes('<span class="xray-verb" title="Yüklem">ortaya koydu.</span>'));
});

test('enrichTurkishSentenceXray doğrulanmış sorularda tam cümle röntgeni döner', () => {
  const q1462Html = enrichTurkishSentenceXray('Yazar, makalesinde ortaya koydu.', 1462);
  assert.ok(q1462Html.includes('class="xray-sub"'), '1462 özne etiketi içermeli');
  assert.ok(q1462Html.includes('class="xray-obj"'), '1462 nesne etiketi içermeli');
  assert.ok(q1462Html.includes('class="xray-adv"'), '1462 tümleç etiketi içermeli');
  assert.ok(q1462Html.includes('class="xray-verb"'), '1462 yüklem etiketi içermeli');
  // Kocaman HUD banner ve Çözüm Yolu olmamalı
  assert.ok(!q1462Html.includes('cumle-oge-banner'), 'HUD banner içermemeli');
  assert.ok(!q1462Html.includes('Çözüm Yolu'), 'Çözüm yolu kutusu içermemeli');
});

test('renderCardStem TDE sorusunda soru_xray varsa öncelikle onu kullanır', async () => {
  const { renderCardStem } = await import('../src/features/booklet/question-card.ts');
  const dummyQ = {
    id: 99999,
    ders: 'TÜRK DİLİ VE EDEBİYATI – 1',
    soru: 'Orijinal soru metni.',
    soru_xray: '<span class="xray-sub">Yazar</span> <span class="xray-verb">yazdı</span>.',
    secenekler: { A: '1', B: '2', C: '3', D: '4' },
    dogru_cevap: 'A' as const
  };

  const rendered = renderCardStem(dummyQ);
  assert.ok(rendered.includes('class="xray-sub">Yazar</span>'), 'soru_xray içindeki özne etiketi render edilmeli');
  assert.ok(rendered.includes('class="xray-verb">yazdı</span>'), 'soru_xray içindeki yüklem etiketi render edilmeli');
});

test('renderCardHeader: çekmece varsayılan olarak kapalıdır (is-expanded içermez)', async () => {
  const { renderCardHeader } = await import('../src/features/booklet/question-card.ts');
  const { state } = await import('../src/app/state.ts');
  state.isFeaturesExpanded = false;
  state.expandedQuestionIds.clear();

  const dummyQ = {
    id: 88888,
    ders: 'TÜRK DİLİ VE EDEBİYATI – 1',
    soru: 'Örnek soru',
    soru_xray: '<span class="pos-word pos-adj">güzel</span> bir gün',
    secenekler: { A: '1', B: '2', C: '3', D: '4' },
    dogru_cevap: 'A' as const
  };

  const headerHtml = renderCardHeader(dummyQ, 1, false);
  // Çekmece başlangıçta kapalı olmalı, ancak açıldığında ÖZ, SF, ÜN butonları active gelecektir
  assert.ok(!headerHtml.includes('q-features-drawer is-expanded'), 'Çekmece varsayılan olarak kapalı olmalı');
  assert.ok(headerHtml.includes('class="q-features-drawer"'), 'Kapalı q-features-drawer sınıfı bulunmalı');
  assert.ok(headerHtml.includes('features-toggle-icon">›<'), 'Açma oku › olmalı');
  assert.ok(headerHtml.includes('btn-xray-syntax active'), 'ÖZ butonu aktif olmalı');
  assert.ok(headerHtml.includes('btn-xray-pos active'), 'SF butonu aktif olmalı');
  assert.ok(headerHtml.includes('btn-xray-sound active'), 'ÜN butonu aktif olmalı');
});

test('features-bar: toggleQuestionFeatures tek tıkla açar, ikinci tıkla kapatır', async () => {
  const { store, state } = await import('../src/app/state.ts');
  state.isFeaturesExpanded = false;
  state.expandedQuestionIds.clear();

  const isExpanded1 = store.toggleQuestionExpanded(77777);
  assert.strictEqual(isExpanded1, true, 'İlk tıklamada açık (true) dönmeli');
  assert.ok(state.expandedQuestionIds.has(77777), 'expandedQuestionIds içinde 77777 olmalı');

  const isExpanded2 = store.toggleQuestionExpanded(77777);
  assert.strictEqual(isExpanded2, false, 'İkinci tıklamada kapalı (false) dönmeli');
  assert.ok(!state.expandedQuestionIds.has(77777), 'expandedQuestionIds içinde 77777 olmamalı');
});

test('CSS sözleşmesi: kavram balonlarında alt çizgi yoktur ve ses olayları emoji/ikon rozetleri içerir', async () => {
  const fs = await import('node:fs');
  const { preprocessCSS, resolveConfig } = await import('vite');
  const cssConfig = await resolveConfig({ configFile: false, envDir: false }, 'build');
  const englishCss = fs.readFileSync('src/styles/english.css', 'utf-8');
  const { code: translationsCss } = await preprocessCSS(
    fs.readFileSync('src/styles/translations.css', 'utf-8'),
    'src/styles/translations.css',
    cssConfig,
  );

  // Kavram balonlarında alt çizgi kaldırılmış olmalı
  assert.ok(englishCss.includes('.vocab-word.concept-word'), 'concept-word sınıfı mevcut olmalı');
  assert.ok(englishCss.includes('text-decoration: none !important;'), 'text-decoration none olmalı');
  assert.ok(englishCss.includes('border-bottom: none !important;'), 'border-bottom none olmalı');

  // Ses olaylarında kırmızı dalgalı çizgi kaldırılmış olmalı
  assert.ok(!translationsCss.includes('border-bottom: 2px wavy'), 'Wavy border-bottom kalmamış olmalı');
  assert.ok(translationsCss.includes('border-bottom: none !important;'), 'border-bottom none olmalı');

  // Pedagojik ikonlar (🪨, ☁️, 🤰, 🤏, 🍂, 🪂, 👄) bulunmalı
  assert.ok(translationsCss.includes('content: "🪨";'), 'Benzeşme için taş emojisi olmalı');
  assert.ok(translationsCss.includes('content: "☁️";'), 'Yumuşama için pamuk emojisi olmalı');
  assert.ok(translationsCss.includes('content: "🤰";'), 'Türeme için hamile kadın emojisi olmalı');
  assert.ok(translationsCss.includes('content: "🤏";'), 'Daralma için kıskaç emojisi olmalı');
  assert.ok(translationsCss.includes('content: "🍂";'), 'Düşme için yaprak emojisi olmalı');
});

test('extractGrammarLabels: dil bilgisi tıklamalarında doğrudan kompakt etiketleri üretir', async () => {
  const { extractGrammarLabels, getGrammarColor } = await import('../src/features/english/grammar-bubble.ts');

  // 1. Salt Sıfat (pos-adj)
  const fakeAdj = {
    classList: { contains: (c: string) => c === 'pos-word' || c === 'pos-adj' }
  } as unknown as HTMLElement;
  const r1 = extractGrammarLabels(fakeAdj, '<b>Niteleme Sıfatı</b>: Detaylı açıklama...', 'Niteleme Sıfatı');
  assert.deepStrictEqual(r1, { posLabel: 'Niteleme Sıfatı', soundLabel: '' });
  assert.strictEqual(getGrammarColor(fakeAdj), 'var(--pos-adj)');

  // 2. Salt Ses Olayı (sound-word)
  const fakeSound = {
    classList: { contains: (c: string) => c === 'sound-word' }
  } as unknown as HTMLElement;
  const r2 = extractGrammarLabels(fakeSound, '🔊 <b>Ünlü Düşmesi</b>: Açıklama...', 'Ünlü Düşmesi');
  assert.deepStrictEqual(r2, { posLabel: '', soundLabel: '🍂 Ünlü Düşmesi' });
  assert.strictEqual(getGrammarColor(fakeSound), 'var(--pos-edat)');

  // 3. Hem Sıfat Tamlaması hem Ses Olayı (has-sound + pos-tamlama)
  const fakeBoth = {
    classList: { contains: (c: string) => c === 'pos-word' || c === 'has-sound' || c === 'pos-tamlama' }
  } as unknown as HTMLElement;
  const trTextBoth = '<b>Belgisiz Sıfat Tamlaması</b>: Açıklama\n💡 Şifre: ...\n🔊 <b>Ünlü Düşmesi (yanlışlık):</b> Detay...';
  const r3 = extractGrammarLabels(fakeBoth, trTextBoth, 'Belgisiz Sıfat Tamlaması');
  assert.deepStrictEqual(r3, { posLabel: 'Belgisiz Sıfat Tamlaması', soundLabel: '🍂 Ünlü Düşmesi' });
  assert.strictEqual(getGrammarColor(fakeBoth), 'var(--pos-tamlama)');

  // 4. Zarf-Fiil (pos-verbal) altı çizik rengi var(--pos-verbal) ile tam eşleşir
  const fakeVerbal = {
    classList: { contains: (c: string) => c === 'pos-word' || c === 'pos-verbal' }
  } as unknown as HTMLElement;
  const rVerbal = extractGrammarLabels(fakeVerbal, '<b>Zarf-Fiil</b>: Açıklama', 'Zarf-Fiil');
  assert.deepStrictEqual(rVerbal, { posLabel: 'Zarf-Fiil', soundLabel: '' });
  assert.strictEqual(getGrammarColor(fakeVerbal), 'var(--pos-verbal)');

  // 5. Dil bilgisi olmayan kavram kelimesinde null dönmeli
  const fakeConcept = {
    classList: { contains: (c: string) => c === 'vocab-word' || c === 'concept-word' }
  } as unknown as HTMLElement;
  const r4 = extractGrammarLabels(fakeConcept, 'Roman açıklaması', 'TDE 4 • Roman');
  assert.strictEqual(r4, null);
});



