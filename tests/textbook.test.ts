import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { parseDigitalTextbook, parseScopedConcepts } from '../src/data/textbook.ts';

test('parseScopedConcepts: döneme özel ıstılah kayıtlarını doğrular ve aynı dönemde tekrarı reddeder', () => {
  const validConcepts = [
    {
      id: 'kelam',
      term: 'Kelam',
      subject: 'KLM',
      ders: 'KELAM – 1',
      ders_kodu: 819,
      donem: 1,
      unite_no: 1,
      sayfa: 12,
      tanim: 'İslam dininin inanca ve davranışlara dair ilkelerini naslardan hareketle belirleyen ve akli yöntemlerle temellendiren ilim.',
      baglam_farki: '1. dönemde kelamın tanımı, konusu (usûl-i selâse) ve amacı üzerinde durulur.',
    },
    {
      id: 'kelam',
      term: 'Kelam',
      subject: 'KLM',
      ders: 'KELAM – 2',
      ders_kodu: 820,
      donem: 2,
      unite_no: 4,
      sayfa: 64,
      tanim: 'Yeni ilm-i kelam döneminde pozitivizm ve materyalizme karşı İslam akaidini savunan çağdaş kelam yaklaşımı.',
      baglam_farki: '2. dönemde kelamî ekoller ve çağdaş inanç problemleri bağlamında ele alınır.',
    },
  ];

  const parsed = parseScopedConcepts(validConcepts);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].donem, 1);
  assert.equal(parsed[1].donem, 2);

  // Aynı ders ve dönemde aynı ıstılah kimliği tekrarlanırsa hata fırlatmalı
  assert.throws(() => parseScopedConcepts([validConcepts[0], validConcepts[0]]));
  // Eksik veya hatalı alan reddedilmeli
  assert.throws(() => parseScopedConcepts([{ id: '', term: 'Test' }]));
});

test('parseDigitalTextbook: yapısal dijital ders kitabı şemasını doğrular', () => {
  const sampleBook = {
    kitap_kodu: 'KLM_1_2',
    kitap_adi: 'AÖİHL Kelam',
    subject: 'KLM',
    donemler: [1, 2],
    toplam_sayfa: 106,
    uniteler: [
      {
        unite_no: 1,
        unite_adi: 'Kelam İlmine Giriş',
        donem: 1,
        ders: 'KELAM – 1',
        sayfa_araligi: [10, 32],
        bolumler: [
          {
            baslik: '1. Kelam İlminin Tanımı, Konusu ve Amacı',
            seviye: 2,
            sayfa_baslangic: 12,
            sayfa_bitis: 14,
            paragraflar: ['Kelam; sözlükte söz, lafız, ibare anlamına gelir.'],
            kutular: [
              {
                tip: 'bilgi_kutusu',
                baslik: 'BİLGİ KUTUSU',
                icerik: 'Kelam, İslam dininin inanca dair ilkelerini belirleyen ilimdir.',
                sayfa: 12,
              },
            ],
          },
        ],
      },
    ],
    istilahlar: [],
  };

  const parsed = parseDigitalTextbook(sampleBook);
  assert.equal(parsed.kitap_kodu, 'KLM_1_2');
  assert.equal(parsed.uniteler[0].bolumler[0].kutular[0].tip, 'bilgi_kutusu');

  if (existsSync('docs/kitaplar/json/KLM_1_2.json')) {
    const rawRealBook = JSON.parse(readFileSync('docs/kitaplar/json/KLM_1_2.json', 'utf8'));
    const realBook = parseDigitalTextbook(rawRealBook);
    assert.equal(realBook.toplam_sayfa, 106);
    assert.ok(realBook.uniteler[0].bolumler.length > 10);
  }
});
