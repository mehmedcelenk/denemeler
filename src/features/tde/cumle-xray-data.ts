/**
 * MEB AÖL Türk Dili ve Edebiyatı - Doğrulanmış Cümle Röntgeni Verileri
 * Soru bazlı tam ve hatasız cümle ögesi ayrıştırmaları.
 * Standart X-Ray sınıflarını (.xray-sub, .xray-verb, .xray-obj, .xray-adv) kullanır.
 */

export interface GoldenCumleXray {
  questionId: number;
  highlighted_html: string;
}

export const MEB_CUMLE_XRAY_MAP: Record<number, string> = {
  // Soru 1462 (TDE 5 - Bu cümlede aşağıdaki ögelerden hangisi yoktur?)
  1462: '<span class="xray-sub" title="Özne">Yazar</span>, <span class="xray-obj" title="Belirtili Nesne">Anadolu romanının özelliklerini nasıl belirlediğini</span> <span class="xray-adv" title="Dolaylı Tümleç">bu makalesinde</span> <span class="xray-verb" title="Yüklem">ortaya koydu</span>.',

  // Soru 1461 (TDE 5 - Aşağıdaki cümlelerden hangisi ögelerine yanlış ayrılmıştır?)
  1461: 'Aşağıdaki cümlelerden hangisi ögelerine yanlış ayrılmıştır?<br><br><strong>A)</strong> <span class="xray-adv" title="Dolaylı Tümleç">Ayağını toprağa basmaktan</span> / <span class="xray-verb" title="Yüklem">korkuyordu</span>.<br><strong>B)</strong> <span class="xray-sub" title="Özne">Meyve yüklü ağaç dalları</span> / <span class="xray-verb" title="Yüklem">eğiliyordu</span>.<br><strong>C)</strong> <span class="xray-sub" title="Özne">Öğretmen</span> / <span class="xray-adv" title="Dolaylı Tümleç">bize</span> / <span class="xray-obj" title="Belirtili Nesne">bütün bildiklerini</span> / <span class="xray-verb" title="Yüklem">anlatmıştı</span>.',

  // Soru 2980 (TDE 5 - Aşağıdaki cümlelerin hangisinde nesne yoktur?)
  2980: 'Aşağıdaki cümlelerin hangisinde nesne yoktur?<br><br><span class="xray-sub" title="Özne">Ahmet’in bostandan bozma güzel bir bahçesi</span> <span class="xray-verb" title="Yüklem">varmış</span>.',

  // Soru 385 (TDE 4 - Yüklemi isim olan cümleler)
  385: '(II) <span class="xray-verb" title="Yüklem">Otuz iki, otuz üç yaşlarında bir adamdı</span> <span class="xray-sub" title="Özne">bu</span>. (III) <span class="xray-verb" title="Yüklem">Orta boylu, düzgün yapılı, hoş görünüşlü, koyu gri gözlü idi</span>.'
};
