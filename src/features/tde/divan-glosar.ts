export interface DivanWordEntry {
  anlam: string;
  koken: string;
  osmanlica: string;
  mazmun?: string;
}

export const MEB_DIVAN_GLOSAR: Record<string, DivanWordEntry> = {
  "giryan": {
    anlam: "Ağlayan, gözyaşı döken",
    koken: "Farsça",
    osmanlica: "گریان",
    mazmun: "Divan şiirinde sevgilisinin ayrılığıyla gece gündüz kanlı gözyaşları döken biçare âşığı sembolize eder."
  },
  "tahassür": {
    anlam: "Hasret çekme, kavuşmayı çok arzulama, kederlenme",
    koken: "Arapça",
    osmanlica: "تحسر",
    mazmun: "Sevgiliye veya vatana duyulan dinmez özlemi anlatır."
  },
  "handan": {
    anlam: "Gülen, sevinçli, neşeli",
    koken: "Farsça",
    osmanlica: "خندان",
    mazmun: "Gül-i handan mazmununda; tebessüm eden nazlı sevgiliyi temsil eder."
  },
  "bî-vefa": {
    anlam: "Vefasız, sözünde durmayan, sadakatsiz",
    koken: "Farsça / Arapça",
    osmanlica: "بی‌وفا",
    mazmun: "Divan edebiyatında sevgili daima bî-vefadır; âşığa cefayı reva görür fakat âşık bundan şikayetçi değildir."
  },
  "müntazır": {
    anlam: "Gözleyen, bekleyen, intizar eden",
    koken: "Arapça",
    osmanlica: "منتظر",
    mazmun: "Yol gözleyen âşık durumunu ifade eder."
  },
  "füyuzat": {
    anlam: "Feyizler, manevi bolluklar, bereketler",
    koken: "Arapça",
    osmanlica: "فیوضات",
    mazmun: "İlahi ilham ve kalbe doğan manevi lütuflardır."
  },
  "dide": {
    anlam: "Göz, göz pınarı",
    koken: "Farsça",
    osmanlica: "دیده",
    mazmun: "Ağlamaktan kan çanağına dönmüş âşığın gözüdür (Dîde-i giryân)."
  },
  "hüsn": {
    anlam: "Güzellik, cemal, iyilik",
    koken: "Arapça",
    osmanlica: "حسن",
    mazmun: "Tasavvufta Allah'ın ezeli ve mutlak güzelliğinin dünyadaki tecellisidir."
  },
  "çâk-i girîbân": {
    anlam: "Yaka yırtma, yakası yırtılmış olma",
    koken: "Farsça",
    osmanlica: "چاک گریبان",
    mazmun: "Büyük aşk acısından, vecd halinden veya çaresizlikten ötürü gömleğinin yakasını parçalayan dertli âşık."
  },
  "leb": {
    anlam: "Dudak",
    koken: "Farsça",
    osmanlica: "لب",
    mazmun: "Kırmızı yakuta (lâl) benzetilir; sevgilinin can bağışlayan tatlı sözlerini simgeler."
  },
  "zülf": {
    anlam: "Sevgilinin saçı, zülüf, kâkül",
    koken: "Farsça",
    osmanlica: "زلف",
    mazmun: "Âşığın kalbini tuzağa düşüren kıvrım kıvrım kemende veya kara yılana benzetilir."
  },
  "rind": {
    anlam: "Dünya gösterişine aldırış etmeyen, kalbi temiz, aşk ehli derviş meşrepli insan",
    koken: "Farsça",
    osmanlica: "رند",
    mazmun: "Şekilci softanın (zâhidin) zıddıdır; şekle değil öze ve hakiki sevgiye bakar."
  },
  "sâkî": {
    anlam: "Kadehle içki sunan güzel; tasavvufta ilahi feyiz ve aşk aşılayan mürşit",
    koken: "Arapça",
    osmanlica: "ساقی",
    mazmun: "Âşıkları kendinden geçiren ilahi hakikatleri sunan rehberdir."
  },
  "zâhit": {
    anlam: "Kaba sofu, dindarlığı sırf dış şekilden ibaret sanan kişi",
    koken: "Arapça",
    osmanlica: "زاهد",
    mazmun: "Divan şiirinde aşkın sırrını anlamayan, şekle takılan tip olarak sürekli hicvedilir."
  },
  "hicran": {
    anlam: "Ayrılık, ayrılık acısı, hasret",
    koken: "Arapça",
    osmanlica: "هجران",
    mazmun: "Âşığın olgunlaşması için çekmesi gereken kutsal acıdır."
  },
  "visal": {
    anlam: "Kavuşma, sevgilinin cemaline erişme",
    koken: "Arapça",
    osmanlica: "وصال",
    mazmun: "Tasavvufta kulun fenafillah olup Hakk'a ermesidir."
  },
  "şem": {
    anlam: "Mum, çerağ, ışık kaynağı",
    koken: "Arapça",
    osmanlica: "شمع",
    mazmun: "Etrafına nur saçan sevgilidir."
  },
  "pervane": {
    anlam: "Işık etrafında dönen küçük kelebek",
    koken: "Farsça",
    osmanlica: "پروانه",
    mazmun: "Mumun (sevgilinin) ateşinde yanıp yok olmayı (fenâ) göze alan sadık âşıktır."
  },
  "pend": {
    anlam: "Nasihat, öğüt",
    koken: "Farsça",
    osmanlica: "پند",
    mazmun: "Aşk ehline nasihat kâr etmez; âşık öğüt dinlemez."
  },
  "fakr": {
    anlam: "Yoksulluk; tasavvufta dünyalıktan vazgeçip yalnızca Allah'a muhtaç olduğunu bilme",
    koken: "Arapça",
    osmanlica: "فقر",
    mazmun: "Dervişliğin en yüksek mertebesidir ('Fakr ile fahrettim')."
  },
  "meyhane": {
    anlam: "Mey içilen yer; tasavvufta aşk ve feyiz meclisi, dergâh",
    koken: "Farsça",
    osmanlica: "میخانه",
    mazmun: "Kalıplardan arınmış samimi ariflerin toplandığı manevi mekandır."
  },
  "hezar": {
    anlam: "Bülbül (bin nağmeli kuş) veya bin sayısı",
    koken: "Farsça",
    osmanlica: "هزار",
    mazmun: "Gülden ayrı düşüp sabaha kadar inleyen dertli âşığı temsil eder."
  },
  "ağyar": {
    anlam: "Yabancılar, rakipler; âşık ile sevgili arasına giren nifakçılar",
    koken: "Arapça",
    osmanlica: "اغیار",
    mazmun: "Sevgiliye yaklaşmak isteyen kötü niyetli rakiptir."
  },
  "müştak": {
    anlam: "Çok arzulayan, can ü gönülden isteyen, tutkun",
    koken: "Arapça",
    osmanlica: "مشتاق",
    mazmun: "Şinasi'nin Şair Evlenmesi'ndeki başkarakterin adı da bu kökten gelir."
  },
  "canan": {
    anlam: "Gönülden sevilen kadın, sevgili; tasavvufta Allah",
    koken: "Farsça",
    osmanlica: "جانان",
    mazmun: "Canın gerçek sahibi olan sevgili."
  },
  "felek": {
    anlam: "Gökyüzü, kader, talih; şikayet edilen felek çarkı",
    koken: "Arapça",
    osmanlica: "فلک",
    mazmun: "Âşığın yüzünü güldürmeyen, dert üstüne dert veren zalim talih çarkı."
  },
  "gonca": {
    anlam: "Açılmamış gül; sevgilinin küçük ve zarif ağzı",
    koken: "Farsça",
    osmanlica: "غنچه",
    mazmun: "Ağız mazmunu olarak sevgilinin tebessüm etmesi goncanın açılmasıdır."
  }
};
