export interface YazarInfo {
  type: 'yazar';
  ad: string;
  donem: string;
  akim?: string;
  unvan: string;
  kilitEserler: string[];
  ayristirici: string;
}

export const MEB_YAZAR_DICT: Record<string, YazarInfo> = {
  "şinasi": {
    type: "yazar",
    ad: "İbrahim Şinasi",
    donem: "Tanzimat I. Dönem",
    akim: "Klasisizm",
    unvan: "Yeniliğin ve İlklerin Öncüsü",
    kilitEserler: ["Şair Evlenmesi", "Müntehabât-ı Eş'âr", "Tercüme-i Manzume", "Durûb-ı Emsâl-i Osmaniyye"],
    ayristirici: "İlk yerli tiyatro, ilk özel gazete (Tercüman-ı Ahvâl), ilk noktalama işaretleri ve ilk atasözleri derlemesini yapmıştır."
  },
  "namık kemal": {
    type: "yazar",
    ad: "Namık Kemal",
    donem: "Tanzimat I. Dönem",
    akim: "Romantizm",
    unvan: "Vatan ve Hürriyet Şairi",
    kilitEserler: ["İntibah", "Cezmi", "Vatan yahut Silistre", "Hürriyet Kasidesi", "Tahrib-i Harabat"],
    ayristirici: "Vatan, millet, hürriyet ve hak kavramlarını edebiyatımıza yerleştiren; ilk edebi, ilk tarihi romanı ve ilk sahnelenen oyunu yazan şahsiyettir."
  },
  "ahmet mithat efendi": {
    type: "yazar",
    ad: "Ahmet Mithat Efendi",
    donem: "Tanzimat I. Dönem",
    unvan: "Yazı Makinesi • Hâce-i Evvel (İlk Öğretmen)",
    kilitEserler: ["Felâtun Bey ile Râkım Efendi", "Letaif-i Rivayat", "Hasan Mellah", "Hüseyin Fellah"],
    ayristirici: "Halka okuma alışkanlığı kazandırmak için 200'den fazla eser veren, olay akışını kesip ansiklopedik bilgiler veren popüler yazardır."
  },
  "recaizade mahmut ekrem": {
    type: "yazar",
    ad: "Recaizade Mahmut Ekrem",
    donem: "Tanzimat II. Dönem",
    akim: "Realizm",
    unvan: "Üstat Ekrem • Servet-i Fünun'un Fikir Babası",
    kilitEserler: ["Araba Sevdası", "Zemzeme", "Talim-i Edebiyat", "Çok Bilen Çok Yanılır"],
    ayristirici: "'Güzel olan her şey şiirin konusudur' anlayışıyla Servet-i Fünun gençlerini bir araya getirmiş, ilk realist roman denemesini yazmıştır."
  },
  "abdülhak hâmit tarhan": {
    type: "yazar",
    ad: "Abdülhak Hâmit Tarhan",
    donem: "Tanzimat II. Dönem",
    akim: "Romantizm",
    unvan: "Şair-i Âzam (Büyük Şair)",
    kilitEserler: ["Makber", "Sahra", "Eşber", "Finten", "Târık"],
    ayristirici: "Türk şiirinde batılılaşmayı metafizik boyuta taşımış, ilk pastoral şiiri (Sahra) ve eşinin ölümü üzerine Makber'i yazmıştır."
  },
  "halit ziya uşaklıgil": {
    type: "yazar",
    ad: "Halit Ziya Uşaklıgil",
    donem: "Servet-i Fünun",
    akim: "Realizm",
    unvan: "Türk Romanının Gerçek Mimarı",
    kilitEserler: ["Mai ve Siyah", "Aşk-ı Memnu", "Kırık Hayatlar", "Mensur Şiirler", "Saray ve Ötesi"],
    ayristirici: "Türk romanını teknik, üslup ve ruh çözümlemesi bakımından Batı seviyesine ulaştıran en büyük realist üstattır."
  },
  "tevfik fikret": {
    type: "yazar",
    ad: "Tevfik Fikret",
    donem: "Servet-i Fünun",
    akim: "Parnasizm",
    unvan: "Fikri Hür, Vicdanı Hür Şair",
    kilitEserler: ["Rübab-ı Şikeste", "Haluk'un Defteri", "Şermin", "Sis", "Tarih-i Kadim"],
    ayristirici: "Beyit hakimiyetini kırıp anjambmanı (cümlenin dizeye sığmaması) edebiyatımıza sokmuş, çocuklar için heceyle Şermin'i yazmıştır."
  },
  "ahmet haşim": {
    type: "yazar",
    ad: "Ahmet Haşim",
    donem: "Fecr-i Âti",
    akim: "Sembolizm / Empresyonizm",
    unvan: "Akşam Şairi",
    kilitEserler: ["Göl Saatleri", "Piyale", "Bize Göre", "Gurabahane-i Laklakan", "Frankfurt Seyahatnamesi"],
    ayristirici: "'Şiirde musiki anlamdan önce gelir' ilkesini savunmuş, saf şiirin (öz şiir) edebiyatımızdaki en parlak temsilcisi olmuştur."
  },
  "ömer seyfettin": {
    type: "yazar",
    ad: "Ömer Seyfettin",
    donem: "Milli Edebiyat",
    akim: "Realizm",
    unvan: "Türk Kısa Hikayeciliğinin Kurucusu",
    kilitEserler: ["Kaşağı", "Diyet", "Falaka", "Bomba", "Beyaz Lale", "İlk Namaz"],
    ayristirici: "'Yeni Lisan' makalesiyle dilde sadeleşme devrimini başlatmış, Maupassant tarzı (olay) hikayeciliğini milli temalarla harmanlamıştır."
  },
  "yakup kadri karaosmanoğlu": {
    type: "yazar",
    ad: "Yakup Kadri Karaosmanoğlu",
    donem: "Milli Edebiyat / Cumhuriyet",
    akim: "Realizm",
    unvan: "Tanzimat'tan Cumhuriyet'e Nehir Romancı",
    kilitEserler: ["Kiralık Konak", "Yaban", "Sodom ve Gomore", "Panorama", "Ankara"],
    ayristirici: "Eserlerinde Tanzimat'tan çok partili hayata kadar Türk toplumunun geçirdiği tüm siyasi ve ahlaki dönüşümleri panoramik aktarmıştır."
  },
  "fuzûlî": {
    type: "yazar",
    ad: "Fuzûlî",
    donem: "Divan Edebiyatı (16. yy)",
    unvan: "Aşk ve Izdırap Şairi",
    kilitEserler: ["Leyla vü Mecnun", "Su Kasidesi", "Şikâyetnâme", "Beng ü Bade", "Rind ü Zâhid"],
    ayristirici: "Azeri Türkçesini en zarif şekilde kullanan, tasavvufi aşkı ve kavuşmanın değil hasretin yüceliğini savunan divan dehasıdır."
  },
  "bâkî": {
    type: "yazar",
    ad: "Bâkî",
    donem: "Divan Edebiyatı (16. yy)",
    unvan: "Sultânü'ş-Şuarâ (Şairler Sultanı)",
    kilitEserler: ["Kanuni Mersiyesi", "Bâkî Divanı", "Fezâil-i Cihad"],
    ayristirici: "Tasavvuftan uzak, rindâne ve dünyevi zevkleri terennüm eden; Türkçeyi aruz veznine pürüzsüz uygulayan Osmanlı klasik dönem şairidir."
  },
  "yunus emre": {
    type: "yazar",
    ad: "Yunus Emre",
    donem: "Tasavvuf Edebiyatı (13-14. yy)",
    unvan: "Gönüller Sultanı",
    kilitEserler: ["Risaletü'n-Nushiyye (Öğütler Kitabı)", "Yunus Emre Divanı"],
    ayristirici: "İlahi aşkı, insan sevgisini ve 'Yaratılanı severiz Yaradan'dan ötürü' felsefesini duru Anadolu Türkçesiyle evrenselleştirmiştir."
  },
  "orhan veli kanık": {
    type: "yazar",
    ad: "Orhan Veli Kanık",
    donem: "Cumhuriyet Dönemi (I. Yeni)",
    unvan: "Garip Akımının Öncüsü",
    kilitEserler: ["Garip", "Vazgeçemediğim", "Destan Gibi", "Yenisi", "Karşı"],
    ayristirici: "Ölçüye, uyağa, şairaneliğe başkaldırmış; sıradan sokaktaki insanı (Süleyman Efendi) ve günlük dili şiirin merkezine yerleştirmiştir."
  }
};
