import test from 'node:test';
import assert from 'node:assert/strict';

import { MEB_ESER_DICT } from '../src/features/tde/edebiyat-eser-dict.ts';
import { MEB_YAZAR_DICT } from '../src/features/tde/edebiyat-yazar-dict.ts';
import { MEB_DIVAN_GLOSAR } from '../src/features/tde/divan-glosar.ts';
import { enrichTdeContent, getEntityFacts } from '../src/features/tde/edebiyat-pusulasi.ts';
import { parseTurkishSentenceElements, enrichTurkishSentenceXray } from '../src/features/tde/cumle-xray.ts';

test('MEB_ESER_DICT tüm eserlerde yazar, tür ve ayrıştırıcı özellik içerir', () => {
  assert.ok(Object.keys(MEB_ESER_DICT).length >= 15, 'En az 15 başyapıt kayıtlı olmalı');
  for (const [key, item] of Object.entries(MEB_ESER_DICT)) {
    assert.ok(item.ad, `${key} ad içermeli`);
    assert.ok(item.yazar, `${key} yazar içermeli`);
    assert.ok(item.tur, `${key} tür içermeli`);
    assert.ok(item.donem, `${key} dönem içermeli`);
    assert.ok(item.ayristirici, `${key} ayrıştırıcı özellik içermeli`);
  }
});

test('MEB_YAZAR_DICT tüm yazarlarda dönem, unvan ve ayrıştırıcı özellik içerir', () => {
  assert.ok(Object.keys(MEB_YAZAR_DICT).length >= 10, 'En az 10 yazar kayıtlı olmalı');
  for (const [key, item] of Object.entries(MEB_YAZAR_DICT)) {
    assert.ok(item.ad, `${key} ad içermeli`);
    assert.ok(item.donem, `${key} dönem içermeli`);
    assert.ok(item.unvan, `${key} unvan içermeli`);
    assert.ok(item.ayristirici, `${key} ayrıştırıcı özellik içermeli`);
  }
});

test('MEB_DIVAN_GLOSAR tüm kelimelerde güncel anlam, köken ve osmanlıca imla içerir', () => {
  assert.ok(Object.keys(MEB_DIVAN_GLOSAR).length >= 20, 'En az 20 arkaik kelime kayıtlı olmalı');
  for (const [key, item] of Object.entries(MEB_DIVAN_GLOSAR)) {
    assert.ok(item.anlam, `${key} güncel anlam içermeli`);
    assert.ok(item.koken, `${key} köken içermeli`);
    assert.ok(item.osmanlica, `${key} osmanlıca imla içermeli`);
  }
});

test('enrichTdeContent eser, yazar ve divan kelimelerini doğru etiketler', () => {
  const sample = "Halit Ziya Uşaklıgil'in Mai ve Siyah romanında giryan gözler anlatılır.";
  const enriched = enrichTdeContent(sample);

  assert.ok(enriched.includes('class="edeb-entity-badge is-yazar"'), 'Yazar etiketi eklenmeli');
  assert.ok(enriched.includes('data-key="halit ziya uşaklıgil"'), 'Doğru yazar anahtarı bağlanmalı');
  assert.ok(enriched.includes('class="edeb-entity-badge is-eser"'), 'Eser etiketi eklenmeli');
  assert.ok(enriched.includes('data-key="mai ve siyah"'), 'Doğru eser anahtarı bağlanmalı');
  assert.ok(enriched.includes('class="divan-vocab-badge"'), 'Divan kelime etiketi eklenmeli');
  assert.ok(enriched.includes('data-divan-key="giryan"'), 'Doğru divan anahtarı bağlanmalı');
});

test('getEntityFacts MEB müfredatına uygun tekil hap bilgileri (unvan, kilit eser, ayrıştırıcı özellik) döner', () => {
  // Yazar testi
  const yazarData = getEntityFacts('namık kemal');
  assert.ok(yazarData, 'Namık Kemal için hap bilgi verisi dönmeli');
  assert.equal(yazarData.title, 'Namık Kemal');
  assert.equal(yazarData.type, 'yazar');
  assert.ok(yazarData.facts.length >= 3, 'En az 3 hap bilgi içermeli');
  assert.ok(yazarData.facts.some(f => f.label.includes('Unvan') && f.detail.includes('Vatan')));

  // Eser testi
  const eserData = getEntityFacts('mai ve siyah');
  assert.ok(eserData, 'Mai ve Siyah için hap bilgi verisi dönmeli');
  assert.equal(eserData.title, 'Mai ve Siyah');
  assert.equal(eserData.type, 'eser');
  assert.ok(eserData.facts.some(f => f.label.includes('Yazar') && f.detail.includes('Halit Ziya')));
  assert.ok(eserData.facts.some(f => f.label.includes('Karakterler') && f.detail.includes('Ahmet Cemil')));
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
