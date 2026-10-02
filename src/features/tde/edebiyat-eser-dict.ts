export interface EserInfo {
  type: 'eser';
  ad: string;
  yazar: string;
  donem: string;
  tur: string;
  ayristirici: string;
  karakterler?: string[];
}

export const MEB_ESER_DICT: Record<string, EserInfo> = {
  "mai ve siyah": {
    type: "eser",
    ad: "Mai ve Siyah",
    yazar: "Halit Ziya Uşaklıgil",
    donem: "Servet-i Fünun",
    tur: "Realist Roman",
    ayristirici: "Batılı tekniğe tam uygun ilk Türk romanı kabul edilir. Mavi hülyalar ile siyah gerçekler arasındaki çatışmayı anlatır.",
    karakterler: ["Ahmet Cemil", "Hüseyin Nazmi", "Lamia", "İkbal"]
  },
  "aşk-ı memnu": {
    type: "eser",
    ad: "Aşk-ı Memnu",
    yazar: "Halit Ziya Uşaklıgil",
    donem: "Servet-i Fünun",
    tur: "Realist Roman / Psikolojik Çözümleme",
    ayristirici: "Türk edebiyatının en yetkin yasak aşk ve yalılarda geçen konak hayatı tahlilidir.",
    karakterler: ["Bihter", "Behlül", "Adnan Bey", "Nihal", "Mademoiselle de Courton"]
  },
  "şair evlenmesi": {
    type: "eser",
    ad: "Şair Evlenmesi",
    yazar: "İbrahim Şinasi",
    donem: "Tanzimat I. Dönem",
    tur: "Töre Komedisi (Tiyatro)",
    ayristirici: "Batılı anlamda yazılan ilk yerli tiyatro eseridir. Görücü usulü evlilik geleneğini sert bir hicivle eleştirir.",
    karakterler: ["Müştak Bey", "Kumru Hanım", "Sakine Hanım", "Hikmet Efendi", "Ebubekir Eflâtun"]
  },
  "kutadgu bilig": {
    type: "eser",
    ad: "Kutadgu Bilig (Mutluluk Veren Bilgi)",
    yazar: "Yusuf Has Hacip",
    donem: "İslami Döneme Geçiş (11. yy)",
    tur: "Didaktik Mesnevi / Siyasetnâme",
    ayristirici: "İslamiyet etkisindeki ilk eser, ilk mesnevi, ilk aruz ölçüsü örneği ve ilk alegorik siyasetnâmedir.",
    karakterler: ["Kün Togdı (Adalet/Hükümdar)", "Ay Toldı (Saadet/Vezir)", "Ögdülmiş (Akıl)", "Odgurmış (Akıbet)"]
  },
  "divanü lugati't-türk": {
    type: "eser",
    ad: "Divanü Lugati't-Türk",
    yazar: "Kaşgarlı Mahmut",
    donem: "İslami Döneme Geçiş (11. yy)",
    tur: "Sözlük / Gramer / Antoloji",
    ayristirici: "İlk Türkçe sözlük, ilk dil bilgisi kitabı, ilk Türk dünyası haritası ve zengin bir koşuk/sagu antolojisidir."
  },
  "atabetü'l-hakayık": {
    type: "eser",
    ad: "Atabetü'l-Hakayık (Hakikatlerin Eşiği)",
    yazar: "Edip Ahmet Yükneki",
    donem: "İslami Döneme Geçiş (12. yy)",
    tur: "Dini-Tasavvufi Ahlak Kitabı",
    ayristirici: "Bilgi, cömertlik ve dilin muhafazası gibi İslami ahlak kurallarını dörtlük ve beyitlerle öğütler."
  },
  "divan-ı hikmet": {
    type: "eser",
    ad: "Divan-ı Hikmet",
    yazar: "Ahmet Yesevi",
    donem: "Tasavvuf Edebiyatı",
    tur: "Tasavvufi Şiir (Hikmet)",
    ayristirici: "Tasavvufi halk edebiyatının başlangıcı kabul edilir; hece ölçülü hikmetlerle İslamiyet'i halka sevdirmiştir."
  },
  "intibah": {
    type: "eser",
    ad: "İntibah (Son Pişmanlık)",
    yazar: "Namık Kemal",
    donem: "Tanzimat I. Dönem",
    tur: "İlk Edebi Roman",
    ayristirici: "Edebiyatımızdaki ilk edebi romandır; tecrübesiz bir gencin kötü bir kadının tuzağına düşüşünü anlatır.",
    karakterler: ["Ali Bey", "Mehpeyker", "Dilaşup", "Fatma Hanım"]
  },
  "cezmi": {
    type: "eser",
    ad: "Cezmi",
    yazar: "Namık Kemal",
    donem: "Tanzimat I. Dönem",
    tur: "İlk Tarihi Roman",
    ayristirici: "Türk edebiyatındaki ilk tarihi romandır; Osmanlı-İran savaşları ve Kırım şehzadesi Adil Giray'ı işler.",
    karakterler: ["Cezmi", "Adil Giray", "Perihan", "Şehriyar"]
  },
  "vatan yahut silistre": {
    type: "eser",
    ad: "Vatan yahut Silistre",
    yazar: "Namık Kemal",
    donem: "Tanzimat I. Dönem",
    tur: "Dram (Tiyatro)",
    ayristirici: "Türk edebiyatında sahnede oynanan İLK tiyatro eseridir; halkta büyük bir vatanseverlik coşkusu uyandırmıştır.",
    karakterler: ["İslam Bey", "Zekiye", "Sıtkı Bey", "Abdullah Çavuş"]
  },
  "karabibik": {
    type: "eser",
    ad: "Karabibik",
    yazar: "Nabizade Nazım",
    donem: "Tanzimat II. Dönem",
    tur: "İlk Köy Romanı / Uzun Hikaye",
    ayristirici: "Köy hayatını ve Antalya Kaş'ın Beymelek köyünü realist yöntemle anlatan ilk köy romanımızdır.",
    karakterler: ["Karabibik", "Huri", "Yosturoğlu", "Koca İmam"]
  },
  "zehra": {
    type: "eser",
    ad: "Zehra",
    yazar: "Nabizade Nazım",
    donem: "Tanzimat II. Dönem",
    tur: "İlk Tezli Roman / Psikolojik Deneme",
    ayristirici: "İlk tezli roman ve ilk kıskançlık temalı psikolojik tahlil denemesi kabul edilir.",
    karakterler: ["Zehra", "Suphi", "Sırrıcemal", "Şevket Efendi"]
  },
  "araba sevdası": {
    type: "eser",
    ad: "Araba Sevdası",
    yazar: "Recaizade Mahmut Ekrem",
    donem: "Tanzimat II. Dönem",
    tur: "İlk Realist Roman Denemesi",
    ayristirici: "Tanzimat'ın yanlış Batılılaşmış, züppe tipini (Bihruz Bey) karikatürize eden ilk realist roman örneğidir.",
    karakterler: ["Bihruz Bey", "Periveş Hanım", "Keşfi Bey", "Mösyö Piyer"]
  },
  "sergüzeşt": {
    type: "eser",
    ad: "Sergüzeşt (Macera)",
    yazar: "Samipaşazade Sezai",
    donem: "Tanzimat II. Dönem",
    tur: "Romantik-Realist Roman",
    ayristirici: "Kafkasya'dan esir getirilen Dilber üzerinden kölelik ve cariyelik kurumunu yıkan çığır açıcı eserdir.",
    karakterler: ["Dilber", "Celal Bey", "Asaf Paşa", "Cevher"]
  },
  "küçük şeyler": {
    type: "eser",
    ad: "Küçük Şeyler",
    yazar: "Samipaşazade Sezai",
    donem: "Tanzimat II. Dönem",
    tur: "İlk Modern Hikaye Kitabı",
    ayristirici: "Batılı standartlara uygun ilk modern kısa hikaye mecmuamızdır (Pandomima hikayesi meşhurdur)."
  },
  "eylül": {
    type: "eser",
    ad: "Eylül",
    yazar: "Mehmet Rauf",
    donem: "Servet-i Fünun",
    tur: "İlk Psikolojik Roman",
    ayristirici: "Edebiyatımızdaki İLK psikolojik romandır; Suat, Süreyya ve Necip arasındaki platonik aşkı tahlil eder.",
    karakterler: ["Suat", "Süreyya", "Necip", "Hacer"]
  },
  "taaşşuk-ı tal'at ve fitnat": {
    type: "eser",
    ad: "Taaşşuk-ı Tal'at ve Fitnat",
    yazar: "Şemsettin Sami",
    donem: "Tanzimat I. Dönem",
    tur: "İlk Yerli Roman",
    ayristirici: "Türk edebiyatında yazılan İLK yerli romandır; görmeden evlenmenin acı sonuçlarını dramatik işler.",
    karakterler: ["Tal'at", "Fitnat", "Rıfat Bey", "Ali Bey"]
  },
  "harname": {
    type: "eser",
    ad: "Harname (Eşekname)",
    yazar: "Şeyhî",
    donem: "Divan Edebiyatı (15. yy)",
    tur: "Hiciv Mesnevisi / İlk Fabl",
    ayristirici: "Edebiyatımızdaki ilk fabl ve alegorik hiciv örneğidir ('Boynuz umarken kulaktan kuyruktan oldu')."
  },
  "şikâyetnâme": {
    type: "eser",
    ad: "Şikâyetnâme",
    yazar: "Fuzûlî",
    donem: "Divan Edebiyatı (16. yy)",
    tur: "İlk Edebi Mektup / Hiciv",
    ayristirici: "İlk edebi mektup kabul edilir ('Selâm verdim rüşvet değildür deyu almadılar')."
  },
  "kiralık konak": {
    type: "eser",
    ad: "Kiralık Konak",
    yazar: "Yakup Kadri Karaosmanoğlu",
    donem: "Milli Edebiyat",
    tur: "Sosyal / Tezli Roman",
    ayristirici: "Tanzimat'tan I. Dünya Savaşı'na kadar yaşanan üç nesil (Dede, Damat, Torun) çatışmasını sembolize eder.",
    karakterler: ["Naim Efendi", "Seniha", "Hakkı Celis", "Faika", "Servet Bey"]
  },
  "yaban": {
    type: "eser",
    ad: "Yaban",
    yazar: "Yakup Kadri Karaosmanoğlu",
    donem: "Milli Edebiyat / Cumhuriyet",
    tur: "Tezli Roman",
    ayristirici: "Kurtuluş Savaşı döneminde Türk aydını ile köylüsü arasındaki derin uçurumu ilk kez tüm çıplaklığıyla yüzleştiren romandır.",
    karakterler: ["Ahmet Celal", "Mehmet Ali", "Emine", "Salih Ağa"]
  },
  "ateşten gömlek": {
    type: "eser",
    ad: "Ateşten Gömlek",
    yazar: "Halide Edip Adıvar",
    donem: "Milli Edebiyat",
    tur: "Milli Mücadele Romanı",
    ayristirici: "Kurtuluş Savaşı'nı sıcağı sıcağına, cepheden bizzat anlatan İLK romandır.",
    karakterler: ["Peyami", "Ayşe", "İhsan", "Cemal"]
  },
  "sinekli bakkal": {
    type: "eser",
    ad: "Sinekli Bakkal",
    yazar: "Halide Edip Adıvar",
    donem: "Cumhuriyet Dönemi",
    tur: "Töre Romanı",
    ayristirici: "II. Abdülhamit dönemi İstanbul mahalle hayatı, Doğu-Batı sentezi ve tasavvufi musikiyi işler (CHP Roman Ödülü).",
    karakterler: ["Rabia", "Kız Tevfik", "Peregrini", "Vehbi Dede", "Selim Paşa"]
  },
  "çalıkuşu": {
    type: "eser",
    ad: "Çalıkuşu",
    yazar: "Reşat Nuri Güntekin",
    donem: "Milli Edebiyat",
    tur: "Sosyal / Duygusal Roman",
    ayristirici: "Anadolu'ya öğretmen olarak giden idealist genç Türk kadınının (Feride) mücadelesini sevdirmiştir.",
    karakterler: ["Feride (Gülbeşeker)", "Kamran", "Munise", "Doktor Hayrullah Bey"]
  },
  "yaprak dökümü": {
    type: "eser",
    ad: "Yaprak Dökümü",
    yazar: "Reşat Nuri Güntekin",
    donem: "Cumhuriyet Dönemi",
    tur: "Toplumsal Çözülme Romanı",
    ayristirici: "Geleneksel ahlak değerleriyle modern hayatın lüks tüketimi arasında kalan Ali Rıza Bey ailesinin çöküşünü anlatır.",
    karakterler: ["Ali Rıza Bey", "Hayriye Hanım", "Fikret", "Leyla", "Necla", "Şevket", "Ferhunde"]
  },
  "felâtun bey ile râkım efendi": {
    type: "eser",
    ad: "Felâtun Bey ile Râkım Efendi",
    yazar: "Ahmet Mithat Efendi",
    donem: "Tanzimat I. Dönem",
    tur: "Sosyal Tezli Roman",
    ayristirici: "Yanlış Batılılaşmış alafranga tip (Felâtun) ile Doğu-Batı dengesini kurmuş çalışkan tipin (Râkım) zıtlığını işler.",
    karakterler: ["Felâtun Bey", "Râkım Efendi", "Canan", "Ziklas Ailesi"]
  },
  "huzur": {
    type: "eser",
    ad: "Huzur",
    yazar: "Ahmet Hamdi Tanpınar",
    donem: "Cumhuriyet Dönemi",
    tur: "Bireyin İç Dünyasını Esas Alan Roman",
    ayristirici: "İstanbul, Türk musikisi, Doğu-Batı bocalaması ve Mümtaz'ın Nuran'a olan aşkında 'huzur' arayışını işler.",
    karakterler: ["Mümtaz", "Nuran", "İhsan", "Suat"]
  },
  "saatleri ayarlama enstitüsü": {
    type: "eser",
    ad: "Saatleri Ayarlama Enstitüsü",
    yazar: "Ahmet Hamdi Tanpınar",
    donem: "Cumhuriyet Dönemi",
    tur: "Hiciv / İronik Roman",
    ayristirici: "Gülünçleşen bürokrasiyi ve iki uygarlık arasında bocalayan insanımızı derin bir ironiyle eleştirir.",
    karakterler: ["Hayri İrdal", "Halit Ayarcı", "Nuri Efendi", "Pakize"]
  },
  "ince memed": {
    type: "eser",
    ad: "İnce Memed",
    yazar: "Yaşar Kemal",
    donem: "Cumhuriyet Dönemi",
    tur: "Toplumcu Gerçekçi Roman",
    ayristirici: "Çukurova köylüsünün zalim Abdi Ağa'ya karşı başkaldırısını ve eşkıyalık destanını epik bir dille anlatır.",
    karakterler: ["İnce Memed", "Abdi Ağa", "Hatçe", "Döne", "Iraz"]
  },
  "küçük ağa": {
    type: "eser",
    ad: "Küçük Ağa",
    yazar: "Tarık Buğra",
    donem: "Cumhuriyet Dönemi",
    tur: "Milli Mücadele Romanı",
    ayristirici: "Milli Mücadele'ye başta karşı olan İstanbullu Hoca'nın zamanla bilinçlenip Kuva-yı Milliye önderi Küçük Ağa'ya dönüşümüdür.",
    karakterler: ["İstanbullu Hoca (Küçük Ağa)", "Çolak Salih", "Ali Emmi", "Reis Bey"]
  }
};
