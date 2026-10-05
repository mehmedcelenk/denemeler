import { renderCardHeader, renderCardSourceTag } from './card-header.ts';
import { renderCardStem, renderSoonBanner } from './card-body.ts';
import { renderCardOptions } from './card-options.ts';
import { renderCardBanners } from './card-banners.ts';

/**
 * Tek bir sorunun tam kitapçık kartı HTML'ini alt modülleri birleştirerek üretir.
 * Parçalar:
 * - card-header: Rozetler, ders/yıl etiketi, zorluk ve eşlikçi butonlar
 * - card-body: Soru metni (İngilizce/TDE/Matematik zenginleştirmesi) ve pasif afişi
 * - card-options: A, B, C, D optik şıkları ve işaretleme sınıfları
 * - card-banners: İpucu, formül pusulası, tuzak uyarısı ve cevap anahtarı
 */
export function renderQuestionCardHtml(q, globalIdx) {
  const isPassive = !!q.sekilli;
  const questionClass = isPassive ? 'booklet-question is-passive-question' : 'booklet-question';

  return `
    <div class="${questionClass}" id="bq_${q.id}">
      ${renderCardHeader(q, globalIdx, isPassive)}
      ${renderSoonBanner(isPassive)}
      <div class="q-stem-text" id="stem_${q.id}">${renderCardStem(q)}</div>
      <div class="q-optical-options">
        ${renderCardOptions(q, isPassive)}
      </div>
      ${renderCardSourceTag(q)}
      ${renderCardBanners(q, isPassive)}
    </div>
  `;
}
