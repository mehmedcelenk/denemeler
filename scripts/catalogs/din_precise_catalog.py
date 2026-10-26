#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""MEB Din Kültürü ve Ahlak Bilgisi (1–8) Dönem Bazlı Atomik ve Sınav Şifreli Kavram Katalogu."""

from typing import Any, Dict, List

PRECISE_DIN_CONCEPTS: List[Dict[str, Any]] = [
    # ==========================================
    # DİN 1: BİLGİ, İNANÇ VE İBADET (ATOMİK)
    # ==========================================
    {
        "id": "din_bilgi_kaynaklari",
        "term": "İslam'da Doğru Bilgi Kaynakları (Selim Akıl, Sadık Haber, Salim Duyular)",
        "donemler": [1],
        "sayfa_by_donem": {1: 16},
        "tanim_by_donem": {
            1: (
                "İslam'da kesin bilgiye ulaştıran $3$ güvenilir kaynak vardır: **Selim Akıl** (ön yargısız sağlam akıl), **Salim Duyular** (sağlıklı beş duyu) ve **Sadık Haber** (Vahiy ile yalan üzere birleşmesi imkânsız topluluğun aktardığı **Mütevatir Haber**).\n"
                "💡 Sınav Şifresi: Rüya, ilham, sezgi ve fal kişiyi bağlar; İslam'da **bağlayıcı dinî bilgi kaynağı DEĞİLDİR**!"
            ),
        },
        "pattern": r"selim akıl|sadık haber|salim duyu[a-zçğıöşü]*|mütevatir|vahiy|bilgi ahlakı|taassup",
    },
    {
        "id": "din_iman_tasdik_ikrar",
        "term": "İman: Tasdik, İkrar, Tahkikî ve Taklidî İman",
        "donemler": [1],
        "sayfa_by_donem": {1: 24},
        "tanim_by_donem": {
            1: (
                "İmanın özü **kalp ile gönülden onaylamak (Tasdik)**, bunu dil ile söylemek ise **İkrar**'dır. Çevreden görerek araştırmadan inanmaya **Taklidî İman**, delilleriyle araştırıp bilinçli inanmaya **Tahkikî İman** denir.\n"
                "💡 Sınav Şifresi: İmanın vazgeçilmez şartı (rüknü) **Kalp ile Tasdik**'tir; Taklidî iman şüphelerle sarsılabilirken **Tahkikî iman** sarsılmaz!"
            ),
        },
        "pattern": r"tasdik[a-zçğıöşü]*|ikrar[a-zçğıöşü]*|taklidî iman|tahkikî iman|taklidi iman|tahkiki iman|hidayet",
    },
    {
        "id": "din_efali_mukellefin",
        "term": "Ef'âl-i Mükellefîn (Farz, Vacip, Sünnet, Mübah, Mekruh, Haram)",
        "donemler": [1],
        "sayfa_by_donem": {1: 42},
        "tanim_by_donem": {
            1: (
                "Akıllı ve ergenlik çağına ulaşmış (**Mükellef**) Müslüman'ın davranış hükümleridir:\n"
                "• **Farz:** Kesin delille emredilenler (Namaz, oruç, zekât — *Farz-ı Ayn*; Cenaze namazı — *Farz-ı Kifaye*).\n"
                "• **Vacip:** Farz kadar kesin olmayan delille emredilenler (**Kurban, Vitir ve Bayram namazı, Fıtır sadakası**).\n"
                "💡 Sınav Şifresi: Hoş görülmeyene **Mekruh**, serbest olana **Mübah (Câiz)**, yalnızca Allah rızası için samimiyetle yapmaya **İhlas** (gösterişe **Riya**) denir!"
            ),
        },
        "pattern": r"ef'âl-i mükellefîn|efal-i mükellefin|\bfarz[a-zçğıöşü]*|\bvacip[a-zçğıöşü]*|\bsünnet[a-zçğıöşü]*|\bmüstehap|\bmendup|\bmübah|\bmekruh|\bharam[a-zçğıöşü]*|mükellef[a-zçğıöşü]*|\bihlas\b|\briya\b|salih amel",
    },

    # ==========================================
    # DİN 2: DEĞERLER, MEDENİYET VE SANAT (ATOMİK)
    # ==========================================
    {
        "id": "din_dort_erdem",
        "term": "Dört Temel Ahlaki Erdem (Hikmet, İffet, Şecaat, Adalet)",
        "donemler": [2],
        "sayfa_by_donem": {2: 88},
        "tanim_by_donem": {
            2: (
                "İslam ahlakında insan ruhunun dengesini sağlayan $4$ ana sütundur: **Hikmet** (bilgelik, doğruyu yanlıştan ayırma), **İffet** (haramdan sakınma, namus ve ölçülülük), **Şecaat** (cesaret ve yiğitlik), **Adalet** (herkese hakkını verme).\n"
                "💡 Sınav Şifresi: Korkaklık ile saldırganlığın ortası **Şecaat**; hikmet, iffet ve şecaatin birleşiminden doğan en üst denge **Adalet**'tir!"
            ),
        },
        "pattern": r"\bhikmet\b|\badalet\b|\biffet\b|\bşecaat\b|tevhit|nübüvvet",
    },
    {
        "id": "din_cami_ve_islam_sanati",
        "term": "Cami Mimarisi, İslam Sanatları ve Klasik Eserler",
        "donemler": [2],
        "sayfa_by_donem": {2: 102},
        "tanim_by_donem": {
            2: (
                "Camide imamın namaz kıldırdığı kıble oyuğu **Mihrap**, Cuma/Bayram hutbesi okunan yüksek merdivenli yer **Minber**, sohbet edilen **Vaaz Kürsüsü**, avludaki abdest yeri **Şadırvan**'dır.\n"
                "💡 Sınav Şifresi: Güzel yazı sanatı **Hüsnühat**, altınlama süsleme **Tezhip**, su üstünde boya sanatı **Ebru**'dur. Hicaz (Mekke-Medine), Kudüs ve Endülüs (Kurtuba) İslam medeniyetinin kalbidir."
            ),
        },
        "pattern": r"medeniyet[a-zçğıöşü]*|mihrap|minber|şadırvan|şerefe|hüsnühat|tezhip|ebru|minyatür|kutadgu bilig|dîvân-ı hikmet|lugâti't-türk|ibn-i haldun|ezher camii|hicaz'a gitmek|\bhac\b|\bzekât\b",
    },

    # ==========================================
    # DİN 3: ALLAH-İNSAN İLİŞKİSİ VE GENÇ SAHABİLER (ATOMİK)
    # ==========================================
    {
        "id": "din_esmaul_husna_ve_sifatlar",
        "term": "Allah'ın Sıfatları (Zâtî & Sübûtî) ve Esmâü'l-Hüsnâ",
        "donemler": [3],
        "sayfa_by_donem": {3: 18},
        "tanim_by_donem": {
            3: (
                "Yalnız Allah'a ait olanlar **Zâtî Sıfatlar** (*Vücud, Kıdem, Beka, Vahdaniyet, Muhalefetün li'l-havâdis, Kıyam bi-nefsihî*); sınırlı bir payı insana da verilenler **Sübûtî Sıfatlar**'dır (*Hayat, İlim, Semi, Basar, İrade, Kudret, Kelam, Tekvin*).\n"
                "💡 Sınav Şifresi: **Muhyî** (Can/hayat veren), **Bârî / Hâlık** (Yoktan yaratan), **Kayyûm** (Kâinatı ayakta tutan ve yöneten), **Rezzâk** (Rızık veren), **Tekvin** (Yaratma sıfatı)."
            ),
        },
        "pattern": r"esmâü'l-hüsnâ|esmaül hüsna|zâtî sıfat[a-zçğıöşü]*|sübûtî sıfat[a-zçğıöşü]*|kayyûm|muhyî|bârî|rezzâk|kıdem|beka|kelam|vahdaniyet|tekvin|irtibat yolları[a-zçğıöşü]*|tövbe|istiğfar",
    },
    {
        "id": "din_genc_sahabiler",
        "term": "Asr-ı Saadet'in Örnek Genç Sahabileri",
        "donemler": [3],
        "sayfa_by_donem": {3: 48},
        "tanim_by_donem": {
            3: (
                "Hz. Peygamber'in gençlere verdiği değerin simgesi olan öncü sahabilerdir:\n"
                "• **Mus'ab bin Umeyr:** Medine'ye gönderilen **ilk öğretmen (muallim)**.\n"
                "• **Muaz bin Cebel:** Yemen'e gönderilen genç **vali ve kadı (hâkim)**.\n"
                "• **Üsame bin Zeyd:** $18$ yaşında Bizans seferine atanan **en genç ordu komutanı**.\n"
                "💡 Sınav Şifresi: **Erkam bin Ebi'l-Erkam** evini (*Dârü'l-Erkam*) ilk gizli İslam okuluna açan gençtir; **Cafer bin Ebi Talip** Habeşistan Kralı Necaşi huzurundaki sözcüdür!"
            ),
        },
        "pattern": r"mus'ab bin umeyr|musab bin umeyr|muaz bin cebel|üsame bin zeyd|hz\. fatma|erkam|hilfü'l-fudûl|hilfulfudul",
    },

    # ==========================================
    # DİN 4: MEZHEPLER, KADER VE SOSYAL HAYAT (ATOMİK)
    # ==========================================
    {
        "id": "din_kader_kaza_tevekkul",
        "term": "Kader, Kaza, İrade ve Tevekkül",
        "donemler": [3, 4],
        "sayfa_by_donem": {3: 32, 4: 22},
        "tanim_by_donem": {
            3: (
                "**Kader** Allah'ın evrendeki her şeyi bir ölçü ve planla bilmesi; **Kaza** bu planın zamanı gelince gerçekleşmesidir. **Tevekkül** ise tıpkı bir öğrencinin sınava tüm gücüyle çalıştıktan veya çiftçinin tohumu ektikten sonra sonucu gönül huzuruyla Allah'a bırakmasıdır.\n"
                "💡 Sınav Şifresi: İnsanın seçme özgürlüğüne **Cüz'î İrade** (sorumluluk kaynağı), Allah'ın sınırsız iradesine **Küllî İrade** denir!"
            ),
        },
        "pattern": r"\bkader\b|\bkaza\b|tevekkül|cüz'î irade|cüzi irade|küllî irade|ecel|rızık",
    },
    {
        "id": "din_mezhepler_itikadi_fikhi",
        "term": "İslam Düşüncesinde Yorumlar (İtikadi ve Fıkhi Mezhepler)",
        "donemler": [4],
        "sayfa_by_donem": {4: 84},
        "tanim_by_donem": {
            4: (
                "Mezhepler dinin kendisi değil, coğrafi ve kültürel farklılıklarla oluşan **dini anlama biçimleridir**.\n"
                "• **İnanç (İtikadi) Mezhepleri:** **Mâtürîdîlik** (Ebu Mansur el-Mâtürîdî), **Eş'arîlik** ve **Şia**.\n"
                "• **İbadet/Hukuk (Ameli-Fıkhi) Mezhepleri:** **Hanefilik** (İmam-ı Azam Ebu Hanife — *Fıkh-ı Ekber*), **Şafiilik** (İmam Şafii — *er-Risâle*), **Malikilik** (İmam Malik — *el-Muvatta*), **Hanbelilik** (Ahmed bin Hanbel — *el-Müsned*) ve **Caferilik**.\n"
                "💡 Sınav Şifresi: **Mâtürîdîlik ve Eş'arîlik İnanç (İtikat)**; **Hanefi, Şafii, Maliki, Hanbeli ise Ameli (Fıkıh)** mezhebidir!"
            ),
        },
        "pattern": r"itikadi|fıkhi|ameli|hanefilik|şafiilik|malikilik|hanbelilik|mâtürîdî|maturidi|eş'arî|eşari|caferilik|imam-ı azam|ebu hanife|imam şafii",
    },

    # ==========================================
    # DİN 5 & 6: AHİRET, HZ. MUHAMMED, BİLİM VE ANADOLU ERENLERİ (ATOMİK)
    # ==========================================
    {
        "id": "din_ahiret_ve_cenaze",
        "term": "Ahiret Hayatının Aşamaları (Berzah, Ba's, Haşr, Mizan) ve Cenaze",
        "donemler": [5],
        "sayfa_by_donem": {5: 16},
        "tanim_by_donem": {
            5: (
                "Ölümden yeniden dirilişe kadar geçen kabir hayatına **Berzah**; İsrafil'in Sûr'a ikinci üflemesiyle dirilişe **Ba's**; toplanma meydanına **Mahşer (Haşr)**; sevap-günah terazisine **Mizan** denir.\n"
                "💡 Sınav Şifresi: Vefat eden Müslüman'ın yıkanması (**Techiz/Gasil**), kefenlenmesi (**Tekfin**), **rükû ve secdesi olmayan** cenaze namazı (**Farz-ı Kifaye**) ve defnedilmesi (**Defin**)."
            ),
        },
        "pattern": r"ahiret[a-zçğıöşü]*|berzah|ba's|haşr|mahşer|mizan|kıyamet|sûr\b|israfil|cenaze namazı|farz-ı kifaye|teçhiz|tekfin|defin|taziye|vasiyet",
    },
    {
        "id": "din_hz_muhammed_ve_ehlibeyt",
        "term": "Hz. Muhammed'in Peygamberlik Yönü (Tebliğ, Tebyin, Teşri, Temsil)",
        "donemler": [5],
        "sayfa_by_donem": {5: 48},
        "tanim_by_donem": {
            5: (
                "Hz. Peygamber'in görevleri: Vahyi eksiksiz iletmesi **Tebliğ**, kapalı ayetleri açıklaması **Tebyin**, dinî hüküm koyması **Teşri**, yaşayarak örnek olması **Temsil (Üsve-i Hasene)** ve peygamberlerin sonuncusu olması **Hâtemü'l-Enbiyâ**'dır.\n"
                "💡 Sınav Şifresi: **Tebliğ** = İletmek, **Tebyin** = Açıklamak/Beyan etmek, **Teşri** = Hüküm koymak!"
            ),
        },
        "pattern": r"hâtemü'l-enbiyâ|hatemül enbiya|üsve-i hasene|tebliğ|tebyin|teşri|ehl-i beyt|kütüb-i sitte|muhadramûn",
    },
    {
        "id": "din_bilim_kurumlari_ve_tasavvuf",
        "term": "İslam Bilim Kurumları, Anadolu Erenleri ve Tasavvuf",
        "donemler": [6, 7],
        "sayfa_by_donem": {6: 18, 7: 42},
        "tanim_by_donem": {
            6: (
                "İslam medeniyetinde Harezmi, İbn Sina ve El-Cezeri gibi âlimlerin yetiştiği tercüme ve araştırma akademisine **Beytü'l-Hikme**, uzay gözlemevine **Rasathane**, hastanelere **Darüşşifa (Bimaristan)** denir.\n"
                "💡 Sınav Şifresi: Tasavvuf ve Alevilik-Bektaşilikte **Hoca Ahmet Yesevi** (*Dîvân-ı Hikmet*), **Hacı Bektaş Veli** (*Makâlât*), **Mevlânâ** (*Mesnevî*), **Yunus Emre** (*Risâletü'n-Nushiyye*); dede-talip ikrarına **Musahiplik (Yol Kardeşliği)**, zikir halkasına **Semah** denir."
            ),
        },
        "pattern": r"beytü'l-hikme|beytülhikme|rasathane|darüşşifa|bimaristan|medrese[a-zçğıöşü]*|icazet|harezmi|ibn-i sina|el-cezeri|biruni|ali kuşçu|ulug bey|ahmet yesevi|hacı bektaş|mevlânâ|yunus emre|ahi evran|sarıkamış|musahiplik|cem\b|cemevi|semah|gülbank|hızır orucu|muharrem|aşure|nakşibendilik|kadirilik|mevlevilik",
    },

    # ==========================================
    # DİN 8: GÜNCEL DİNÎ MESELELER VE YAŞAYAN DİNLER (ATOMİK)
    # ==========================================
    {
        "id": "din_guncel_meseleler_ve_dinler",
        "term": "Dinin 5 Temel Gayesi (Zarûrât-ı Dîniyye), Biyoetik ve Yaşayan Dinler",
        "donemler": [7, 8],
        "sayfa_by_donem": {7: 68, 8: 18},
        "tanim_by_donem": {
            7: (
                "İslam'ın korumayı emrettiği **$5$ Dokunulmaz Değer (Zarûrât-ı Hamse):** **Canın, Aklın, Dinin, Neslin ve Malın korunmasıdır** (Otonazi ve intihar haramdır; hayat kurtaran organ ve kan nakli câizdir).\n"
                "💡 Sınav Şifresi: **Hint Dinleri (Hinduizm & Budizm):** Reenkarnasyon (tenasüh/ruh göçü), Karma, Kast Sistemi ve Nirvana vardır. **Yahudilik:** Kutsal kitabı *Tanah (Tevrat)*, ibadethanesi *Sinagog (Havra)*. **Hristiyanlık:** *Teslis (Üçleme)*, *Vaftiz* ve *İncil*."
            ),
        },
        "pattern": r"zarûrât-ı dîniyye|zarurat-ı diniyye|beş temel gaye|neslin korunması|aklın korunması|canın korunması|malın korunması|ötenazi|otopsi|organ nakli|helal gıda|israf|mahremiyet|hinduizm|budizm|konfüçyanizm|taoizm|yahudilik|hristiyanlık|reenkarnasyon|tenasüh|karma|kast sistemi|nirvana|tripitaka|vedalar|sinagog|havra|vaftiz|teslis",
    },
]
