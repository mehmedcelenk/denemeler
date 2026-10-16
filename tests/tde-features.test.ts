import test from 'node:test';
import assert from 'node:assert/strict';

import { MEB_ESER_DICT, MEB_YAZAR_DICT, MEB_DIVAN_GLOSAR } from '../src/features/tde/edebiyat-dict.ts';
import { enrichTdeContent, getEntityFacts } from '../src/features/tde/edebiyat-pusulasi.ts';
import { parseTurkishSentenceElements, enrichTurkishSentenceXray } from '../src/features/tde/cumle-xray.ts';

test.skip('MEB_ESER_DICT tüm eserlerde yazar, tür ve ayrıştırıcı özellik içerir (Sözlük JSON silindiği için atlandı)', () => {
  assert.ok(Object.keys(MEB_ESER_DICT).length >= 15, 'En az 15 başyapıt kayıtlı olmalı');
});

test.skip('MEB_YAZAR_DICT tüm yazarlarda dönem, unvan ve ayrıştırıcı özellik içerir (Sözlük JSON silindiği için atlandı)', () => {
  assert.ok(Object.keys(MEB_YAZAR_DICT).length >= 10, 'En az 10 yazar kayıtlı olmalı');
});

test.skip('MEB_DIVAN_GLOSAR tüm kelimelerde güncel anlam, köken ve osmanlıca imla içerir (Sözlük JSON silindiği için atlandı)', () => {
  assert.ok(Object.keys(MEB_DIVAN_GLOSAR).length >= 20, 'En az 20 arkaik kelime kayıtlı olmalı');
});

test.skip('enrichTdeContent eser, yazar ve divan kelimelerini doğru etiketler (Sözlük JSON silindiği için atlandı)', () => {
  const sample = "Halit Ziya Uşaklıgil'in Mai ve Siyah romanında giryan gözler anlatılır.";
  const enriched = enrichTdeContent(sample);
  assert.ok(enriched.includes('class="edeb-entity-badge is-yazar"'));
});

test.skip('getEntityFacts MEB müfredatına uygun tekil hap bilgileri döner (Sözlük JSON silindiği için atlandı)', () => {
  const yazarData = getEntityFacts('namık kemal');
  assert.ok(yazarData);
});

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

