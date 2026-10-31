import type { Question } from '../../src/data/question.ts';

export const sampleQuestion: Question = {
  id: 88801,
  ders: 'TÜRK DİLİ VE EDEBİYATI 1',
  yil: '2024',
  donem: 1,
  soru_no: 1,
  soru: 'Aşağıdakilerden hangisi Tanzimat Dönemi edebiyatının özelliklerinden biridir?',
  secenekler: {
    A: 'Divan edebiyatı nazım biçimlerinin tamamen terk edilmesi',
    B: 'Roman, hikâye ve tiyatro gibi Batılı türlerin ilk örneklerinin verilmesi',
    C: 'Sadece bireysel konuların işlenmesi',
    D: 'Aruz ölçüsünün tamamen bırakılıp yalnızca hece ölçüsü kullanılması',
  },
  dogru_cevap: 'B',
  dogru_nedeni: 'Tanzimat edebiyatında Batılı anlamda ilk roman, hikâye ve tiyatro örnekleri verilmiştir.',
  ana_konu: 'Tanzimat Edebiyatı',
  alt_konu: 'Tanzimat Dönemi Özellikleri',
};
