#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""MEB Biyoloji (1–4) Dönem Bazlı Atomik, Sıfırdan Öğreten ve Sınav Şifreli Kavram Katalogu."""

from typing import Any, Dict, List

PRECISE_BIO_CONCEPTS: List[Dict[str, Any]] = [
    # ==========================================
    # BİYO 1: YAŞAM BİLİMİ BİYOLOJİ (ATOMİK)
    # ==========================================
    {
        "id": "bio_homeostazi_ve_adaptasyon",
        "term": "Homeostazi (İç Denge) ve Adaptasyon",
        "donemler": [1],
        "sayfa_by_donem": {1: 18},
        "tanim_by_donem": {
            1: (
                "Dış hava çok sıcak veya çok soğuk olsa da vücudumuzun tıpkı **akıllı bir klima (termostat)** gibi iç sıcaklığını $36,5\\,^\\circ\\text{C}$'de sabit tutmasına **Homeostazi**; devenin hörgücünde yağ depolaması gibi kalıtsal uyumlara ise **Adaptasyon** denir.\n"
                "💡 Sınav Şifresi: Terleme, titreme ve boşaltım doğrudan **homeostaziyi (kararlı iç dengeyi)** korumak içindir; tüm canlılarda ortaktır!"
            ),
        },
        "pattern": r"homeostazi[a-zçğıöşü]*|adaptasyon[a-zçğıöşü]*|kararlı iç denge",
    },
    {
        "id": "bio_metabolizma_anabolizma_katabolizma",
        "term": "Metabolizma: Anabolizma (Yapım) ve Katabolizma (Yıkım)",
        "donemler": [1],
        "sayfa_by_donem": {1: 20},
        "tanim_by_donem": {
            1: (
                "Küçük Lego parçalarını birleştirip büyük bina inşa etmeye **Anabolizma (Özümleme / Dehidrasyon)**; büyük besinleri parçalayıp yıkmaya ise **Katabolizma (Yadımlama / Hidroliz)** denir.\n"
                "💡 Sınav Şifresi: **A**nabolizma = **A**nne yapar (Fotosentez, protein sentezi; gençlerde $A > K$); **K**atabolizma = **K**ırar/Yıkar (Solunum, sindirim; yaşlılarda $K > A$)."
            ),
        },
        "pattern": r"tüm canlılarda ortaktır|canlıların ortak|anabolizma|katabolizma|metabolizma[a-zçğıöşü]*|bazal metabolizma|dehidrasyon|hidroliz|inorganik[a-zçğıöşü]*",
    },
    {
        "id": "bio_karbonhidratlar",
        "term": "Karbonhidratlar (Glikoz, Nişasta, Glikojen, Selüloz, Kitin)",
        "donemler": [1],
        "sayfa_by_donem": {1: 28},
        "tanim_by_donem": {
            1: (
                "Vücudun **ilk sırada kullandığı acil yakıttır** (Glikozit bağı taşırlar). Tek şekerliler **Monosakkarit** (Glikoz, Fruktoz, Galaktoz, $5\\text{C}$ Riboz/Deoksiriboz); çok şekerliler **Polisakkarit**'tir.\n"
                "💡 Sınav Şifresi: Bitkisel depo **Nişasta**; Hayvan, mantar ve bakteri deposu **Glikojen**; Bitki duvarı **Selüloz**; Böcek iskeleti ve mantar duvarı ise yapısında **Azot ($\\text{N}$)** bulunduran **Kitin**'dir!"
            ),
        },
        "pattern": r"monosakkarit[a-zçğıöşü]*|disakkarit[a-zçğıöşü]*|polisakkarit[a-zçğıöşü]*|glikoz[a-zçğıöşü]*|fruktoz|galaktoz|maltoz|sükroz|sakkaroz|laktoz|nişasta[a-zçğıöşü]*|glikojen[a-zçğıöşü]*|selüloz[a-zçğıöşü]*|\bkitin[a-zçğıöşü]*|karbonhidrat[a-zçğıöşü]*",
    },
    {
        "id": "bio_lipitler_ve_proteinler",
        "term": "Lipitler (Yağlar) ve Proteinler",
        "donemler": [1],
        "sayfa_by_donem": {1: 34},
        "tanim_by_donem": {
            1: (
                "**Lipitler** (Ester bağı: Trigliserit, hücre zarındaki çift katlı **Fosfolipit**, hormon yapan **Steroit**) en çok enerji veren yedek depodur; **Proteinler** ise **Amino asitlerin** **Peptit bağı** ile dizilmesiyle oluşan vücudun ana inşaat malzemesidir.\n"
                "💡 Sınav Şifresi: Açlıkta kullanım sırası **Karbonhidrat $\\to$ Yağ $\\to$ Protein (KAP)**; $1$ gramının verdiği enerji sırası ise **Yağ $>$ Protein $>$ Karbonhidrat**'tır!"
            ),
        },
        "pattern": r"fosfolipit[a-zçğıöşü]*|trigliserit|steroit[a-zçğıöşü]*|kolesterol|peptit bağ[a-zçğıöşü]*|amino asit[a-zçğıöşü]*|protein[a-zçğıöşü]*|hemoglobin|fibrinojen|antikor|lipi[td][a-zçğıöşü]*",
    },
    {
        "id": "bio_vitaminler",
        "term": "Vitaminler (Suda ve Yağda Çözünenler)",
        "donemler": [1],
        "sayfa_by_donem": {1: 42},
        "tanim_by_donem": {
            1: (
                "Sindirilmeden hücre zarından doğrudan geçen, **asla enerji vermeyen** ama vücut çarklarının (enzimlerin **koenzim** kısmının) dönmesini sağlayan düzenleyicilerdir.\n"
                "💡 Sınav Şifresi: **A, D, E, K** yağda çözünür ve karaciğerde depolanır; **B ve C** suda çözünür, fazlası idrarla atılır (**A** eksikliği Gece Körlüğü, **D** Raşitizm, **C** Skorbüt, **K** Kanın pıhtılaşmaması)."
            ),
        },
        "pattern": r"vitamin[a-zçğıöşü]*|skorbüt|raşitizm|gece körlüğü|obezite|insülin direnci",
    },
    {
        "id": "bio_enzimler",
        "term": "Enzimler (Biyolojik Katalizörler)",
        "donemler": [1],
        "sayfa_by_donem": {1: 46},
        "tanim_by_donem": {
            1: (
                "Normalde yıllar sürecek biyokimyasal tepkimeleri **aktivasyon enerjisini düşürerek** saniyeler içinde gerçekleştiren ve tepkimeden hiç harcanmadan çıkan **uzman çilingirlerdir** (Substrata **anahtar-kilit** uyumuyla bağlanır).\n"
                "💡 Sınav Şifresi: Bileşik enzim = **Apoenzim (Protein kısım)** + **Koenzim (Vitamin)** veya **Kofaktör (Mineral)**. Su oranı $\\%15$'in altına düşerse enzimler **çalışamaz** (reçel ve kurutulmuş gıdaların bozulmama sırrı!)."
            ),
        },
        "pattern": r"enzim[a-zçğıöşü]*|aktivasyon enerjisi|substrat[a-zçğıöşü]*|apoenzim|koenzim|kofaktör",
    },
    {
        "id": "bio_dna_rna_atp",
        "term": "DNA, RNA ve ATP (Nükleik Asitler ve Enerji)",
        "donemler": [1],
        "sayfa_by_donem": {1: 52},
        "tanim_by_donem": {
            1: (
                "**DNA** hücrenin çift iplikli **ana veri merkezi (Hard Disk)** (Aziz Sancar DNA onarımını çözmüştür); **RNA** protein üretimindeki tek iplikli **kurye** ($\\text{mRNA}$ şifre taşır, $\\text{tRNA}$ amino asit taşır, $\\text{rRNA}$ ribozomdadır); **ATP** ise hücrenin anlık nakit parasıdır.\n"
                "💡 Sınav Şifresi: **DNA'nın özel bazı Timin ($\\text{T}$)**, **RNA'nın özel bazı Urasil ($\\text{U}$)**'dir! **ATP depolanamaz** ve bir hücreden diğerine **aktarılamaz**."
            ),
        },
        "pattern": r"nükleik asit[a-zçğıöşü]*|nükleotit[a-zçğıöşü]*|deoksiriboz|\bdna\b|\brna\b|mrna|trna|rrna|timin|urasil|\batp\b|fosforilasyon",
    },

    # ==========================================
    # BİYO 1: HÜCRE VE ORGANELLER (ATOMİK: RİBOZOM != MİTOKONDRİ != LİZOZOM)
    # ==========================================
    {
        "id": "bio_ribozom_ve_sentrozom",
        "term": "Ribozom ve Sentrozom (Zarsız Organeller)",
        "donemler": [1],
        "sayfa_by_donem": {1: 66},
        "tanim_by_donem": {
            1: (
                "**Ribozom** en basit bakteriden insana kadar **tüm canlılarda ortak bulunan**, amino asitleri dikip **protein üreten** zarsız dokuma tezgahıdır; **Sentrozom** ise hayvan hücrelerinde bölünme sırasında iğ ipliklerini oluşturur.\n"
                "💡 Sınav Şifresi: **Ribozom** ve **Sentrozom** **zarsızdır**! Ribozom çalışırken amino asitleri birleştirip su çıkardığı için hücrenin turgor basıncını artırır."
            ),
        },
        "pattern": r"ribozom[a-zçğıöşü]*|sentrozom[a-zçğıöşü]*|prokaryot[a-zçğıöşü]*|ökaryot[a-zçğıöşü]*",
    },
    {
        "id": "bio_mitokondri_ve_kloroplast",
        "term": "Mitokondri ve Kloroplast (Çift Zarlı Enerji Organelleri)",
        "donemler": [1],
        "sayfa_by_donem": {1: 70},
        "tanim_by_donem": {
            1: (
                "**Mitokondri** besinleri oksijenle yakıp $\\text{ATP}$ üreten hücrenin **enerji santrali**; **Kloroplast** ise Güneş ışığıyla su ve $\\text{CO}_2$'den besin üreten bitkilerin **yeşil güneş panelidir** (Domatese kırmızı rengi **Kromoplast**, patateste nişasta depolamayı renksiz **Lökoplast** yapar).\n"
                "💡 Sınav Şifresi: **Mitokondri** ve **Plastitler (Kloroplast)** **çift zarlıdır**; kendilerine ait özel **DNA, RNA ve Ribozomları** vardır!"
            ),
        },
        "pattern": r"mitokondri[a-zçğıöşü]*|kloroplast[a-zçğıöşü]*|kromoplast[a-zçğıöşü]*|lökoplast[a-zçğıöşü]*|plasti[dt][a-zçğıöşü]*",
    },
    {
        "id": "bio_golgi_lizozom_koful",
        "term": "Golgi, Lizozom, Endoplazmik Retikulum ve Koful (Tek Zarlılar)",
        "donemler": [1],
        "sayfa_by_donem": {1: 68},
        "tanim_by_donem": {
            1: (
                "**Endoplazmik Retikulum** hücre içi kargo yolları; **Golgi** ter, süt, tükürük paketleyen **kargo paketleme merkezi**; **Lizozom** ise mikropları ve yaşlı organelleri parçalayan **geri dönüşüm/sindirim ekibidir**.\n"
                "💡 Sınav Şifresi: Lizozom patlarsa hücre kendi kendini sindirir (**Otoliz**); gelişmiş bitki hücrelerinde lizozom **yoktur**! Tatlı su amipinde fazla suyu dışarı pompalayan koful **Kontraktil Koful**'dur."
            ),
        },
        "pattern": r"golgi[a-zçğıöşü]*|lizozom[a-zçğıöşü]*|koful[a-zçğıöşü]*|endoplazmik|otoliz",
    },
    {
        "id": "bio_madde_gecisleri_ozmoz",
        "term": "Hücre Zarından Madde Geçişleri (Difüzyon, Ozmoz, Plazmoliz, Aktif Taşıma)",
        "donemler": [1],
        "sayfa_by_donem": {1: 78},
        "tanim_by_donem": {
            1: (
                "Suyun yarı geçirgen zardan geçişine **Ozmoz** denir ($\text{ATP}$ harcanmaz). Salatalığa tuz döküldüğünde yani **Hipertonik (çok yoğun)** ortama konduğunda su kaybedip büzülmesine **Plazmoliz**; saf suya (**Hipotonik** ortama) konduğunda su alıp şişmesine **Deplazmoliz / Turgor** denir.\n"
                "💡 Sınav Şifresi: **Pasif Taşıma (Difüzyon & Ozmoz)** canlı ve cansız ortamda $\\text{ATP}$ harcanmadan olur; **Aktif Taşıma, Endositoz (Fagositoz/Pinositoz) ve Ekzositoz** ise **yalnız canlı hücrelerde $\\text{ATP}$ harcanarak** gerçekleşir!"
            ),
        },
        "pattern": r"hücre zar[a-zçğıöşü]*|difüzyon[a-zçğıöşü]*|ozmoz[a-zçğıöşü]*|hipertonik[a-zçğıöşü]*|hipotonik[a-zçğıöşü]*|izotonik[a-zçğıöşü]*|plazmoliz[a-zçğıöşü]*|deplazmoliz|turgor[a-zçğıöşü]*|osmotik basınç|aktif taşıma|endositoz|fagositoz|pinositoz|ekzositoz|su kaybederek küçül",
    },

    # ==========================================
    # BİYO 2: SINIFLANDIRMA VE CANLI ÂLEMLERİ (ATOMİK)
    # ==========================================
    {
        "id": "bio_siniflandirma_ve_ikili_ad",
        "term": "Sınıflandırma (Taksonomi) ve İkili Adlandırma",
        "donemler": [2],
        "sayfa_by_donem": {2: 88},
        "tanim_by_donem": {
            2: (
                "Dış görünüşe ve **analog** (görevdaş: sinek kanadı - kuş kanadı) organa bakan **Ampirik (Yapay)**; köken, $\\text{DNA}$ ve **homolog** (kökteş: insan kolu - balina yüzgeci) organa bakan **Filogenetik (Doğal)** sınıflandırmadır.\n"
                "💡 Sınav Şifresi: Küçükten büyüğe: **Tür $\\to$ Cins $\\to$ Familya $\\to$ Takım $\\to$ Sınıf $\\to$ Şube $\\to$ Âlem** (*Türkiye Cumhuriyeti Futbol Takımı Sahada Şut Attı*). İkili adlandırmada (*Pinus nigra*) akrabalığı **1. kelime (Cins adı)** belirler!"
            ),
        },
        "pattern": r"sınıflandırma[a-zçğıöşü]*|ampirik|filogenetik|homolog organ|analog organ|ikili adlandırma[a-zçğıöşü]*|\btür[a-zçğıöşü]*|\bcins\b|familya|\btakım[a-zçğıöşü]*|\bşube\b",
    },
    {
        "id": "bio_alemler_ve_virusler",
        "term": "Canlı Âlemleri (Bakteri, Arke, Protista, Mantar, Hayvan) ve Virüsler",
        "donemler": [2],
        "sayfa_by_donem": {2: 102},
        "tanim_by_donem": {
            2: (
                "**Bakteriler ve Arkeler** çekirdeksizdir (**Prokaryot**); **Mantarlar** bitki değildir (fotosentez yapmaz, hücre duvarı **kitin**, deposu **glikojendir**). **Omurgalılar** içinde yalnız **Kuşlar ve Memeliler** sıcakkanlıdır (sabit vücut sıcaklıklı).\n"
                "💡 Sınav Şifresi: **Virüsler** hücresel değildir, antibiyotikten etkilenmez, **DNA ve RNA'yı asla bir arada bulundurmaz**, yalnız canlı hücre içinde çoğalan zorunlu parazittir!"
            ),
        },
        "pattern": r"bakteri[a-zçğıöşü]*|arke[a-zçğıöşü]*|protist[a-zçğıöşü]*|amip|öglena|paramesyum|mantar[a-zçğıöşü]*|omurgasız[a-zçğıöşü]*|omurgalı[a-zçğıöşü]*|sölenter[a-zçğıöşü]*|sünger[a-zçğıöşü]*|eklem\s*bacaklı[a-zçğıöşü]*|memeli[a-zçğıöşü]*|sürüngen[a-zçğıöşü]*|kuşlar\b|virüs[a-zçğıöşü]*|bakteriyofaj",
    },

    # ==========================================
    # BİYO 3: HÜCRE BÖLÜNMELERİ VE KALITIM (ATOMİK)
    # ==========================================
    {
        "id": "bio_mitoz_ve_eseysiz_ureme",
        "term": "Mitoz Bölünme ve Eşeysiz Üreme Türleri",
        "donemler": [3],
        "sayfa_by_donem": {3: 16},
        "tanim_by_donem": {
            3: (
                "**Mitoz** tıpkı **fotokopi makinesi** gibi ana hücrenin genetik kopyası olan $2$ yeni hücre üretir (kromozom sayısı değişmez!). Evreleri: **İP-MAT** (*İnterfaz $\\to$ Profaz, Metafaz, Anafaz, Telofaz*).\n"
                "💡 Sınav Şifresi: Eşeysiz üreme türleri: Bakteride **Bölünme**, Bira mayası ve hidrada **Tomurcuklanma**, Denizyıldızı ve planaryada **Rejenerasyon**, Bal arısında döllenmeden erkek arı oluşumu **Partenogenez**, Çilek ve söğüt dalından üretim **Vejetatif** üremedir!"
            ),
        },
        "pattern": r"mitoz[a-zçğıöşü]*|interfaz|profaz|metafaz|anafaz|telofaz|sitokinez|kardeş kromatit|eşeysiz üreme|tomurcuklanma|rejenerasyon|partenogenez|vejetatif|sporla üreme|doku kültürü",
    },
    {
        "id": "bio_mayoz_ve_eseyli_ureme",
        "term": "Mayoz Bölünme, Krossing-Over ve Eşeyli Üreme",
        "donemler": [3],
        "sayfa_by_donem": {3: 38},
        "tanim_by_donem": {
            3: (
                "Yalnız $2n$ kromozomlu üreme ana hücrelerinde gerçekleşip kromozom sayısını yarıya ($n$) indiren ve birbirinden farklı **$4$ yeni hücre (gamet)** oluşturan bölünmedir.\n"
                "💡 Sınav Şifresi: Kardeşlerin birbirine benzememesini sağlayan parça değişimi (**Krossing-Over ve Tetrat**) **Mayoz I - Profaz I** evresinde; homolog kromozomların ayrılması ise **Anafaz I**'de gerçekleşir!"
            ),
        },
        "pattern": r"mayoz[a-zçğıöşü]*|krossing\s*over|tetrat|sinapsis|homolog kromozom|eşeyli üreme|döllenme|zigot",
    },
    {
        "id": "bio_kalitim_ve_kan_gruplari",
        "term": "Kalıtım İlkeleri, Kan Grupları ve Eşeye Bağlı Kalıtım",
        "donemler": [3],
        "sayfa_by_donem": {3: 64},
        "tanim_by_donem": {
            3: (
                "Aleller aynıysa **Homozigot (Arı döl: $AA, aa$)**, farklıysa **Heterozigot (Melez: $Aa$)** denir; $n$ heterozigot karakter için **$2^n$ çeşit gamet** oluşur.\n"
                "💡 Sınav Şifresi: **AB kan grubu Eş Baskınlığın** en ünlü örneğidir! Renk körlüğü ve hemofili **$X$ kromozomunda çekinik ($X^r$)** taşınır; **$Y$ kromozomundaki** özellik ise yalnız **babadan oğula** geçer!"
            ),
        },
        "pattern": r"mendel|homozigot|heterozigot|alel[a-zçğıöşü]*|genotip|fenotip|monohibrit|dihibrit|kontrol çaprazlama[a-zçğıöşü]*|eş baskınlı[kğ][a-zçğıöşü]*|çok alellili[kğ][a-zçğıöşü]*|kan grubu|kan grupları|rh faktörü|renk körlü[ğg]ü|hemofili|eşeye bağlı|soy ağac[a-zçğıöşü]*|gonozom|otozom",
    },

    # ==========================================
    # BİYO 4: EKOLOJİ VE ÇEVRE SORUNLARI (ATOMİK)
    # ==========================================
    {
        "id": "bio_ekosistem_ve_besin_piramidi",
        "term": "Ekosistem, Besin Piramidi ve Biyolojik Birikim",
        "donemler": [4],
        "sayfa_by_donem": {4: 138},
        "tanim_by_donem": {
            4: (
                "Belirli bir bölgedeki **tek bir türe Popülasyon** (Toroslardaki kızılçamlar), birden çok türe **Komünite**, canlı ve cansız çevrenin tamamına **Ekosistem** denir.\n"
                "💡 Sınav Şifresi: Besin piramidinde **aşağıdan yukarıya (Üreticiden $\\to$ Son Tüketiciye)** çıkıldıkça aktarılan enerji her basamakta $\\%10$'a düşer (azalır), birey sayısı ve toplam biyokütle **azalır**; ancak **zehirli madde (biyolojik birikim) ARTAR**!"
            ),
        },
        "pattern": r"popülasyon[a-zçğıöşü]*|komünite[a-zçğıöşü]*|ekosistem[a-zçğıöşü]*|biyotik|abiyotik|ototrof|heterotrof|holozoik|ayrıştırıcı[a-zçğıöşü]*|saprofit[a-zçğıöşü]*|besin zinciri|besin piramidi|trofik düzey|biyokütle|biyolojik birikim",
    },
    {
        "id": "bio_madde_donguleri_ve_cevre",
        "term": "Azot Döngüsü, Ötrofikasyon ve Ayak İzleri",
        "donemler": [4],
        "sayfa_by_donem": {4: 168},
        "tanim_by_donem": {
            4: (
                "**Azot döngüsünde** amonyağı ($\text{NH}_3$) bitkilerin kullanabileceği nitrata ($\text{NO}_3^-$) dönüştüren kemosentetik bakterilerin yaptığı olaya **Nitrifikasyon**; azotu tekrar havaya geri verene **Denitrifikasyon** denir.\n"
                "💡 Sınav Şifresi: Göllere karışan atıklarla alglerin (yosunların) aşırı patlayıp gölü kurutmasına **Ötrofikasyon**; $\\text{SO}_2$ ve $\\text{NO}_2$ gazlarının yağmurla inmesine **Asit Yağmuru** denir."
            ),
        },
        "pattern": r"azot döngüsü|karbon döngüsü|su döngüsü|nitrifikasyon|denitrifikasyon|baklagil|rhizobium|ötrofikasyon|asit yağmur[a-zçğıöşü]*|ekolojik ayak izi|karbon ayak izi|su ayak izi|biyoçeşitlili[kğ][a-zçğıöşü]*|endemik",
    },
]
