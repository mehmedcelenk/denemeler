#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""MEB Fizik (1–4) Dönem Bazlı Atomik, Sıfırdan Öğreten ve Sınav Şifreli Kavram Katalogu."""

from typing import Any, Dict, List

PRECISE_FIZ_CONCEPTS: List[Dict[str, Any]] = [
    # ==========================================
    # FİZ 1: FİZİK BİLİMİNE GİRİŞ (ATOMİK ALT DALLAR & BÜYÜKLÜKLER)
    # ==========================================
    {
        "id": "fiz_temel_buyuklukler",
        "term": "Temel Büyüklükler",
        "donemler": [1],
        "sayfa_by_donem": {1: 18},
        "tanim_by_donem": {
            1: (
                "Başka hiçbir büyüklüğe ihtiyaç duymadan tek başına ifade edilebilen, fiziğin **7 ana yapı taşı** büyüklüğüdür.\n"
                "💡 Sınav Şifresi: **KISA MUZ** $\\to$ **K**ütle ($\\text{kg}$), **I**şık şiddeti ($\\text{cd}$), **S**ıcaklık ($\\text{K}$), **A**kım şiddeti ($\\text{A}$), **M**adde miktarı ($\\text{mol}$), **U**zunluk ($\\text{m}$), **Z**aman ($\\text{s}$). Tamamı **skalerdir**!"
            ),
        },
        "pattern": r"temel büyüklü[kğ][a-zçğıöşü]*",
    },
    {
        "id": "fiz_turetilmis_buyuklukler",
        "term": "Türetilmiş Büyüklükler",
        "donemler": [1],
        "sayfa_by_donem": {1: 19},
        "tanim_by_donem": {
            1: (
                "Temel büyüklüklerin (KISA MUZ) çarpılması veya bölünmesiyle elde edilen büyüklüklerdir (Hız, Kuvvet, Enerji, Basınç, Özkütle gibi).\n"
                "💡 Sınav Şifresi: **KISA MUZ** dışındaki her şey (örneğin Kuvvet $\\text{N}$, Enerji $\\text{J}$, Sürat $\\text{m/s}$) kesinlikle **türetilmiş büyüklüktür**!"
            ),
        },
        "pattern": r"türetilmiş büyüklü[kğ][a-zçğıöşü]*",
    },
    {
        "id": "fiz_skaler_buyukluk",
        "term": "Skaler Büyüklük",
        "donemler": [1],
        "sayfa_by_donem": {1: 20},
        "tanim_by_donem": {
            1: (
                "Manavdan alınan '$3\\text{ kg}$ elma' veya saatin '$15$ dakika' göstermesi gibi yalnızca **sayı ve birimle** tam olarak anlaşılan, **yönü olmayan** büyüklüktür.\n"
                "💡 Sınav Şifresi: Kütle, zaman, sıcaklık, alınan yol, sürat, iş, enerji ve basınç **skalerdir** (yön sorulmaz)."
            ),
        },
        "pattern": r"skaler büyüklü[kğ][a-zçğıöşü]*|\bskaler[a-zçğıöşü]*",
    },
    {
        "id": "fiz_vektorel_buyukluk",
        "term": "Vektörel Büyüklük",
        "donemler": [1],
        "sayfa_by_donem": {1: 21},
        "tanim_by_donem": {
            1: (
                "Bir İHA/SİHA'nın veya uçağın rotası gibi tam anlaşılması için sayı ve birimin yanında **mutlaka yönünün de (Doğu, Batı, $+x$) bilinmesi gereken** büyüklüktür.\n"
                "💡 Sınav Şifresi: **Kuvvet ($\\vec{F}$), Ağırlık ($\\vec{G}$), Hız ($\\vec{v}$), İvme ($\\vec{a}$) ve Yer Değiştirme ($\\Delta \\vec{x}$)** vektöreldir!"
            ),
        },
        "pattern": r"vektörel büyüklü[kğ][a-zçğıöşü]*|\bvektörel[a-zçğıöşü]*|\bvektör[a-zçğıöşü]*",
    },
    {
        "id": "fiz_katihal_fizigi",
        "term": "Katıhâl Fiziği",
        "donemler": [1],
        "sayfa_by_donem": {1: 15},
        "tanim_by_donem": {
            1: (
                "Kristal yapılı sert maddelerin elektrik ve optik özelliklerini inceleyerek; **akıllı telefon mikroçiplerini (yarı iletkenler), güneş panellerini, LED ekranları ve hızlı trenleri (süper iletkenler)** geliştiren modern fizik dalıdır.\n"
                "💡 Sınav Şifresi: Soruda **kristal yapı, yarı iletken, nanoteknoloji, güneş pili veya leke tutmayan kumaş** görürsen cevap **Katıhâl Fiziği**'dir!"
            ),
        },
        "pattern": r"katı\s*hâl fizi[ğg][a-zçğıöşü]*|katıhal fizi[ğg][a-zçğıöşü]*|yarı iletken[a-zçğıöşü]*|süper iletken[a-zçğıöşü]*|nanoteknoloji",
    },
    {
        "id": "fiz_atom_ve_nukleer_fizik",
        "term": "Atom Fiziği ve Nükleer Fizik",
        "donemler": [1],
        "sayfa_by_donem": {1: 16},
        "tanim_by_donem": {
            1: (
                "**Atom Fiziği** atomun tamamını ve elektron kabuğunu (lazer, 3D yazıcılar, kuantum bilgisayarlar); **Nükleer (Çekirdek) Fiziği** ise sadece atomun merkezindeki çekirdeği, radyasyonu, fisyon ve füzyonu inceler.\n"
                "💡 Sınav Şifresi: **Atom/Elektron/Lazer $\\to$ Atom Fiziği**; **Çekirdek/Radyasyon/Fisyon-Füzyon $\\to$ Nükleer Fizik**!"
            ),
        },
        "pattern": r"atom fizi[ğg][a-zçğıöşü]*|nükleer fizi[kğ][a-zçğıöşü]*|çekirdek fizi[ğg][a-zçğıöşü]*|fisyon|füzyon",
    },
    {
        "id": "fiz_mekanik_termodinamik_elektromanyetizma",
        "term": "Mekanik, Termodinamik ve Elektromanyetizma",
        "donemler": [1],
        "sayfa_by_donem": {1: 14},
        "tanim_by_donem": {
            1: (
                "**Mekanik** kuvvet ve hareketi (köprüler, gezegenler, robotik); **Termodinamik** ısı, sıcaklık ve iklimlendirmeyi; **Elektromanyetizma** ise elektrik yükleri, mıknatıslar ve MR cihazlarını inceler.\n"
                "💡 Sınav Şifresi: Fiziğin 8 alt dalı şifresi: **KAMYONET** (Katıhâl, Atom, Mekanik, Yüksek Enerji ve Plazma, Optik, Nükleer, Elektromanyetizma, Termodinamik)."
            ),
        },
        "pattern": r"elektromanyetizma|termodinamik|yüksek enerji ve plazma|\bmekanik\b",
    },

    # ==========================================
    # FİZ 1: MADDE VE ÖZELLİKLERİ (ATOMİK)
    # ==========================================
    {
        "id": "fiz_kutle",
        "term": "Kütle (m)",
        "donemler": [1],
        "sayfa_by_donem": {1: 34},
        "tanim_by_donem": {
            1: (
                "Bir maddenin içerdiği **değişmeyen madde miktarıdır**; Dünya'dan Ay'a veya uzaya da gitsen kütlen asla değişmez.\n"
                "💡 Sınav Şifresi: **Eşit kollu terazi** ile ölçülür, SI birimi **kilogram ($\\text{kg}$)**'dır ($1\\text{ ton} = 1000\\text{ kg}$)."
            ),
        },
        "pattern": r"eşit kollu terazi|değişmeyen madde miktarı|\bkütle[a-zçğıöşü]*",
    },
    {
        "id": "fiz_hacim",
        "term": "Hacim (V)",
        "donemler": [1],
        "sayfa_by_donem": {1: 36},
        "tanim_by_donem": {
            1: (
                "Maddenin uzayda kapladığı yerdir; düzgün olmayan bir taşın hacmi **dereceli silindir (ölçekli kap)** veya taşırma kabındaki suyun yükselme miktarıyla bulunur.\n"
                "💡 Formül: Küp $V = a^3$, Dikdörtgenler Prizması $V = a \\cdot b \\cdot c$, Silindir $V = \\pi r^2 h$, Küre $V = \\frac{4}{3}\\pi r^3$ ($1\\text{ L} = 1\\text{ dm}^3 = 1000\\text{ cm}^3$)."
            ),
        },
        "pattern": r"dereceli silindir|taşırma kabı|taş bırakıldığında|\bhacmi\b|\bhacim[a-zçğıöşü]*",
    },
    {
        "id": "fiz_ozkutle",
        "term": "Özkütle (Yoğunluk - d)",
        "donemler": [1],
        "sayfa_by_donem": {1: 42},
        "tanim_by_donem": {
            1: (
                "Maddenin birim hacminin ne kadar 'تıkış tıkış' dolu olduğunu gösterir; aynı büyüklükteki demirin pamuktan ağır olması **özkütlesinin** büyüklüğündendir (zeytinyağının su üstünde yüzmesi gibi).\n"
                "💡 Formül: $d = \\frac{m}{V}$ (**Dede Muzunu Bölüp Verdi**) — Sabit sıcaklık ve basınçta maddeler için **ayırt edici** özelliktir."
            ),
        },
        "pattern": r"özkütle[a-zçğıöşü]*|yoğunlu[kğ][a-zçğıöşü]*",
    },
    {
        "id": "fiz_dayaniklilik",
        "term": "Dayanıklılık (D)",
        "donemler": [1],
        "sayfa_by_donem": {1: 50},
        "tanim_by_donem": {
            1: (
                "Katı bir cismin kendi ağırlığına veya dış kuvvetlere karşı kırılmadan direnme gücüdür; karıncanın kendi ağırlığının $50$ katını taşırken filin yüksekten düşünce kemiklerinin kırılması boyut-dayanıklılık ilişkisidir.\n"
                "💡 Formül: $D \\propto \\frac{\\text{Kesit Alanı}}{\\text{Hacim}} = \\frac{1}{h}$ (Cismin boyutu ve **yüksekliği $h$ arttıkça dayanıklılığı azalır**!)."
            ),
        },
        "pattern": r"dayanıklılı[kğ][a-zçğıöşü]*|kesit alanı\s*/\s*hacim",
    },
    {
        "id": "fiz_adezyon",
        "term": "Adezyon (Yapışma Kuvveti)",
        "donemler": [1],
        "sayfa_by_donem": {1: 54},
        "tanim_by_donem": {
            1: (
                "**Farklı cins** moleküllerin birbirine **misafir gibi yapışmasıdır**; çay bardağını kaldırınca çay tabağının bardağa yapışıp gelmesi veya yağmur damlasının cama tutunması adezyondur.\n"
                "💡 Sınav Şifresi: **A**dezyon = **A**rkadaşa (Farklı cinse) **yapışma**! Adezyon $>$ Kohezyon ise sıvı yüzeyi **ıslatır**."
            ),
        },
        "pattern": r"adezyon[a-zçğıöşü]*|yapışma kuvvet[a-zçğıöşü]*",
    },
    {
        "id": "fiz_kohezyon",
        "term": "Kohezyon (Tutunma Kuvveti)",
        "donemler": [1],
        "sayfa_by_donem": {1: 54},
        "tanim_by_donem": {
            1: (
                "**Aynı cins** sıvı moleküllerinin **kardeş gibi birbirine sıkıca kenetlenip** dağılmamasıdır; cıva damlasının veya yaprak üzerindeki su damlasının küre gibi toplu durmasını sağlar.\n"
                "💡 Sınav Şifresi: **K**ohezyon = **K**ardeşe (Aynı cinse) **tutunma**! Kohezyon $>$ Adezyon ise sıvı yüzeyi **ıslatmaz** (cıva gibi)."
            ),
        },
        "pattern": r"kohezyon[a-zçğıöşü]*|tutunma kuvvet[a-zçğıöşü]*",
    },
    {
        "id": "fiz_yuzey_gerilimi",
        "term": "Yüzey Gerilimi",
        "donemler": [1],
        "sayfa_by_donem": {1: 56},
        "tanim_by_donem": {
            1: (
                "Su yüzeyindeki moleküllerin kohezyon etkisiyle birbirini çekerek suyun üstünü **gergin bir trambolin zarı** gibi kaplamasıdır; böceklerin su üstünde batmadan yürümesini sağlar.\n"
                "💡 Sınav Şifresi: Suyu **ısıtmak** ve içine **deterjan/sabun** katmak yüzey gerilimini **azaltır** (kirler bu sayede çıkar); **tuz** katmak ise **artırır**!"
            ),
        },
        "pattern": r"yüzey gerilim[a-zçğıöşü]*",
    },
    {
        "id": "fiz_kilcallik",
        "term": "Kılcallık Olayı",
        "donemler": [1],
        "sayfa_by_donem": {1: 58},
        "tanim_by_donem": {
            1: (
                "Küp şekerin ucunu **ince belli çay bardağına** hafifçe değdirdiğinde çayın şekerin en tepesine kadar kendiliğinden tırmanması, peçetenin suyu emmesi ve ağaçların kökten yapraklara su çıkarması olayıdır.\n"
                "💡 Sınav Şifresi: Boru ne kadar **inceyse** sıvı o kadar yükseğe çıkar (Açık hava basıncıyla değil, **adezyon-kohezyon** farkıyla çalışır!)."
            ),
        },
        "pattern": r"kılcallı[kğ][a-zçğıöşü]*|kılcal boru[a-zçğıöşü]*",
    },

    # ==========================================
    # FİZ 1: HAREKET VE KUVVET (ATOMİK)
    # ==========================================
    {
        "id": "fiz_alinan_yol_ve_surat",
        "term": "Alınan Yol ve Sürat",
        "donemler": [1],
        "sayfa_by_donem": {1: 68},
        "tanim_by_donem": {
            1: (
                "**Alınan yol ($x$)** aracın kilometre sayacının gösterdiği kıvrımlı toplam mesafedir; birim zamanda alınan bu yola ise **Sürat ($v$)** denir.\n"
                "💡 Formül: $\\text{Sürat} = \\frac{\\text{Alınan Yol}}{\\text{Zaman}}$ ($v = \\frac{x}{t}$) — İkisi de yönsüzdür (**skalerdir**)."
            ),
        },
        "pattern": r"alınan yol[a-zçğıöşü]*|\bsürat[a-zçğıöşü]*",
    },
    {
        "id": "fiz_yer_degistirme_ve_hiz",
        "term": "Yer Değiştirme ve Hız",
        "donemler": [1],
        "sayfa_by_donem": {1: 70},
        "tanim_by_donem": {
            1: (
                "**Yer değiştirme ($\\Delta \\vec{x}$)** ilk konumdan son konuma kuş uçuşu çizilen en kısa yönlü ok; birim zamandaki yer değiştirmeye ise **Hız ($\\vec{v}$)** denir.\n"
                "💡 Sınav Şifresi: Tam bir tur atıp **başladığı noktaya geri dönen** koşucunun yer değiştirmesi ve ortalama hızı **$0$'dır**! ($\\vec{v} = \\frac{\\Delta \\vec{x}}{\\Delta t}$)"
            ),
        },
        "pattern": r"yer değiştirme[a-zçğıöşü]*|ortalama hız[a-zçğıöşü]*|\bhız[a-zçğıöşü]*",
    },
    {
        "id": "fiz_ivme",
        "term": "İvme (a)",
        "donemler": [1],
        "sayfa_by_donem": {1: 76},
        "tanim_by_donem": {
            1: (
                "Bir aracın gaza bastığında veya frene dokunduğunda **saniyede hızının kaçar kaçar değiştiğini** gösteren vektörel büyüklüktür (SI birimi $\\text{m/s}^2$).\n"
                "💡 Formül: $a = \\frac{\\Delta v}{\\Delta t}$ — Sabit hızla giden (hızı değişmeyen) bir aracın ivmesi **$0$'dır**!"
            ),
        },
        "pattern": r"\bivme[a-zçğıöşü]*",
    },
    {
        "id": "fiz_eylemsizlik",
        "term": "Eylemsizlik Yasası (Newton'ın 1. Yasası)",
        "donemler": [1],
        "sayfa_by_donem": {1: 86},
        "tanim_by_donem": {
            1: (
                "Cisimlerin mevcut durumunu koruma isteğidir: Otobüs aniden frene basınca yolcuların **öne savrulması**, gaza basınca **arkaya yaslanması** eylemsizliktir.\n"
                "💡 Sınav Şifresi: Net kuvvet sıfırsa ($F_{\\text{net}} = 0$ / dengelenmiş kuvvetler) duran cisim **durmaya**, hareketli cisim **sabit hızla gitmeye** devam eder!"
            ),
        },
        "pattern": r"eylemsizli[kğ][a-zçğıöşü]*|dengelenmiş kuvvet[a-zçğıöşü]*",
    },
    {
        "id": "fiz_newton_temel_yasa",
        "term": "Newton'ın Temel Yasası (F = m·a) ve Kuvvet",
        "donemler": [1],
        "sayfa_by_donem": {1: 88},
        "tanim_by_donem": {
            1: (
                "Durmakta olan cismi hareket ettiren, hareketliyi durduran veya şeklini değiştiren etkiye **kuvvet** denir (**dinamometre** ile ölçülür, birimi **Newton '$\\text{N}$'**).\n"
                "💡 Formül: $F_{\\text{net}} = m \\cdot a$ (Dengelenmemiş kuvvet varsa cisim mutlaka **ivmeli** hareket yapar; Etki-Tepki kuvvetleri ise farklı cisimler üzerindedir, birbirini sıfırlamaz!)."
            ),
        },
        "pattern": r"etki-tepki|dengelenmemiş kuvvet[a-zçğıöşü]*|net kuvvet[a-zçğıöşü]*|dinamometre[a-zçğıöşü]*|\bkuvvet[a-zçğıöşü]*",
    },
    {
        "id": "fiz_surtunme_kuvveti",
        "term": "Sürtünme Kuvveti",
        "donemler": [1],
        "sayfa_by_donem": {1: 92},
        "tanim_by_donem": {
            1: (
                "Temas halindeki yüzeylerin pürüzlerinden dolayı harekete veya kaymaya karşı koyan kuvvettir; buzda kaymamızı zorlaştıran ama yürüyebilmemizi ve arabaların fren tutmasını sağlayan kuvvettir.\n"
                "💡 Formül: $F_s = k \\cdot N$ (Yüzeyin genişliğine/alanına **bağlı değildir**; yalnızca yüzeyin cinsine '$k$' ve dik tepki kuvvetine '$N$' bağlıdır)."
            ),
        },
        "pattern": r"sürtünme kuvvet[a-zçğıöşü]*|statik sürtünme|kinetik sürtünme",
    },

    # ==========================================
    # FİZ 2: İŞ, GÜÇ VE ENERJİ (ATOMİK)
    # ==========================================
    {
        "id": "fiz_is_ve_guc",
        "term": "Fiziksel İş (W) ve Güç (P)",
        "donemler": [2],
        "sayfa_by_donem": {2: 112},
        "tanim_by_donem": {
            2: (
                "Fizikte **iş** yapabilmek için uygulanan kuvvetin cismi **kendi doğrultusunda hareket ettirmesi** şarttır (duvarı saatlerce itsen de duvar kıpırdamazsa yapılan iş $0$'dır!); işi birim zamanda yapma hızına ise **güç** denir.\n"
                "💡 Formül: $\\text{İş } (W) = F \\cdot \\Delta x$ (**Joule**), $\\text{Güç } (P) = \\frac{W}{t}$ (**Watt**). Sırtında çantayla düz yolda yürüyen öğrenci dik kuvvet uyguladığı için fiziksel iş **yapmaz**!"
            ),
        },
        "pattern": r"fiziksel anlamda iş|yapılan iş[a-zçğıöşü]*|\bjoule\b|\bwatt\b|elektriksel güç",
    },
    {
        "id": "fiz_kinetik_ve_potansiyel_enerji",
        "term": "Kinetik, Potansiyel ve Mekanik Enerji",
        "donemler": [2],
        "sayfa_by_donem": {2: 120},
        "tanim_by_donem": {
            2: (
                "Hareket eden her cismin hızından dolayı sahip olduğu enerjiye **Kinetik Enerji ($E_k$)**; yerden yüksekliğinden (veya sıkışmış yaydan) dolayı depoladığı enerjiye **Potansiyel Enerji ($E_p$)** denir.\n"
                "💡 Formül: $E_k = \\frac{1}{2} m v^2$ (Hız $2$ katına çıkarsa kinetik enerji **$4$ katına** çıkar!), $E_p = m \\cdot g \\cdot h$, $E_{\\text{mekanik}} = E_k + E_p$."
            ),
        },
        "pattern": r"kinetik enerji[a-zçğıöşü]*|potansiyel enerji[a-zçğıöşü]*|mekanik enerji[a-zçğıöşü]*",
    },
    {
        "id": "fiz_enerji_kaynaklari",
        "term": "Yenilenebilir ve Yenilenemez Enerji Kaynakları",
        "donemler": [2],
        "sayfa_by_donem": {2: 138},
        "tanim_by_donem": {
            2: (
                "Doğada kullandıkça tükenmeyen temiz kaynaklara **Yenilenebilir Enerji** (Güneş, rüzgâr, hidroelektrik/baraj, jeotermal, biyokütle, dalga); kullandıkça bitenlere **Yenilenemez Enerji** (Kömür, petrol, doğal gaz, nükleer) denir.\n"
                "💡 Sınav Şifresi: **Nükleer enerji** karbon salmasa bile ham maddesi (uranyum/toryum) bittiği için **yenilenemez** enerji kaynağıdır!"
            ),
        },
        "pattern": r"yenilenebilir enerji[a-zçğıöşü]*|yenilenemez enerji[a-zçğıöşü]*|fosil yakıt[a-zçğıöşü]*|nükleer enerji|jeotermal|biyokütle|hidroelektrik",
    },

    # ==========================================
    # FİZ 2: ISI VE SICAKLIK (ATOMİK)
    # ==========================================
    {
        "id": "fiz_sicaklik_ve_termometre",
        "term": "Sıcaklık (T) ve Termometreler",
        "donemler": [2],
        "sayfa_by_donem": {2: 152},
        "tanim_by_donem": {
            2: (
                "Madde taneciklerinin ortalama hareket (kinetik) enerjisinin bir göstergesidir; bir enerji türü **değildir**, **termometre** ile ölçülür ve SI birimi **Kelvin ($\\text{K}$)**'dir.\n"
                "💡 Formül: $\\text{K} = ^\\circ\\text{C} + 273$ ve $\\frac{\\text{C}}{100} = \\frac{\\text{F}-32}{180}$ (Mutlak sıfır noktası $0\\text{ K} = -273\\,^\\circ\\text{C}$'dir, bunun altında sıcaklık olamaz!)."
            ),
        },
        "pattern": r"sıcaklı[kğ][a-zçğıöşü]*|termometre[a-zçğıöşü]*|kelvin[a-zçğıöşü]*|celcius|fahrenhayt",
    },
    {
        "id": "fiz_isi_ve_ozisi",
        "term": "Isı (Q), Öz Isı (c) ve Hal Değişimi",
        "donemler": [2],
        "sayfa_by_donem": {2: 160},
        "tanim_by_donem": {
            2: (
                "Sıcaklığı yüksek olan bardaktaki çaydan elimize doğru **aktarılan enerjiye Isı ($Q$)** denir (**kalorimetre kabı** ile ölçülür, birimi **Joule** veya **Kalori**).\n"
                "💡 Formül: Sıcaklık değişiyorsa $Q = m \\cdot c \\cdot \\Delta T$ (**Kel Macit**); Hal değiştiriyorsa sıcaklık sabit kalır ve $Q = m \\cdot L$ (**Kel Meli**) kullanılır!"
            ),
        },
        "pattern": r"öz ısı[a-zçğıöşü]*|ısı sığası|ısıl denge|erime ısısı|buharlaşma ısısı|\bısı\b|ısıca yalıtılmış",
    },
    {
        "id": "fiz_isi_aktarim_ve_genlesme",
        "term": "Isı Aktarım Yolları ve Genleşme",
        "donemler": [2],
        "sayfa_by_donem": {2: 184},
        "tanim_by_donem": {
            2: (
                "Isı; metal kaşıkta taneciklerin çarpışmasıyla **İletim**, kaloriferin odadaki havayı veya çaydanlığın suyu ısıtmasıyla **Konveksiyon (Taşıma)**, Güneş'in uzay boşluğundan Dünya'yı ısıtmasıyla **Işıma (Radyasyon)** yoluyla yayılır.\n"
                "💡 Sınav Şifresi: **Katılarda İletim**, **Sıvı ve Gazlarda Konveksiyon**, **Boşlukta Işıma**! Isınan maddeler hacimce büyür (**Genleşme**)."
            ),
        },
        "pattern": r"ısı iletim[a-zçğıöşü]*|konveksiyon|ışıma|genleşme[a-zçğıöşü]*|büzülme",
    },

    # ==========================================
    # FİZ 2: ELEKTROSTATİK (ATOMİK)
    # ==========================================
    {
        "id": "fiz_atom_parcaciklari",
        "term": "Atom Çekirdeği, Proton, Nötron ve Elektron",
        "donemler": [1, 2],
        "sayfa_by_donem": {1: 16, 2: 214},
        "tanim_by_donem": {
            1: (
                "Atomun merkezindeki ağır **çekirdekte** artı ($+$) yüklü **proton** ve yüksüz **nötron** kilitli dururken; eksi ($-$) yüklü **elektronlar** çekirdek etrafında hızla döner.\n"
                "💡 Sınav Şifresi: Katı iletkenlerde protonlar asla hareket etmez; elektriklenmeyi **yalnızca alınıp verilen elektronlar ($e^-$)** sağlar!"
            ),
        },
        "pattern": r"atom çekirde[kğ][a-zçğıöşü]*|proton[a-zçğıöşü]*|nötron[a-zçğıöşü]*",
    },
    {
        "id": "fiz_elektriklenme_ve_elektroskop",
        "term": "Elektriklenme Türleri, Elektroskop ve Topraklama",
        "donemler": [2],
        "sayfa_by_donem": {2: 218},
        "tanim_by_donem": {
            2: (
                "**Sürtünme** ile elektriklenmede cisimler **zıt** işaretli (cam $+$, ebonit $-$); **Dokunma** ile elektriklenmede ise toplam yükü yarıçaplarıyla orantılı paylaşıp **aynı** işaretli yüklenirler.\n"
                "💡 Formül: Dokunmada $q_1' = \\frac{q_{\\text{top}}}{r_1+r_2} r_1$, Coulomb Kuvveti $F = k \\frac{|q_1 \\cdot q_2|}{d^2}$. **Topraklama** yüklü cismi nötrler; **Elektroskop** yükün cinsini bulur."
            ),
        },
        "pattern": r"elektrosko[pb][a-zçğıöşü]*|elektriklenme[a-zçğıöşü]*|elektrik yük[a-zçğıöşü]*|topraklama|faraday kafesi|ebonit|coulomb|elektrostati[kğ][a-zçğıöşü]*",
    },

    # ==========================================
    # FİZ 3: ELEKTRİK VE MANYETİZMA (ATOMİK)
    # ==========================================
    {
        "id": "fiz_ohm_ve_direnc",
        "term": "Elektrik Akımı, Direnç ve Ohm Yasası",
        "donemler": [3],
        "sayfa_by_donem": {3: 18},
        "tanim_by_donem": {
            3: (
                "Elektrik akımı ($I$) su borusundan akan su miktarıysa, gerilim ($V$) suyu iten pompa basıncı, **direnç ($R$)** ise borunun darlığıdır.\n"
                "💡 Formül: **Ohm Yasası** $V = I \\cdot R$ (**Vır**); İletken direnci $R = \\rho \\frac{L}{A}$ (Tel uzadıkça direnç artar, kalınlaştıkça azalır). Seri direnç: $R_{\\text{eş}} = R_1 + R_2$."
            ),
        },
        "pattern": r"diren[çc][a-zçğıöşü]*|ohm[a-zçğıöşü]*|\b\d+\s*Ω|elektrik devre[a-zçğıöşü]*|elektrik akım[a-zçğıöşü]*",
    },
    {
        "id": "fiz_ampermetre_voltmetre_uretec",
        "term": "Ampermetre, Voltmetre, Üreteçler ve Lambalar",
        "donemler": [3],
        "sayfa_by_donem": {3: 32},
        "tanim_by_donem": {
            3: (
                "Akımı ölçen **Ampermetre** iç direnci sıfır kabul edildiği için devreye **seri**; gerilimi ölçen **Voltmetre** ise iç direnci sonsuz kabul edildiği için **paralel** bağlanır.\n"
                "💡 Sınav Şifresi: Piller (üreteçler) **seri** bağlanırsa akım artar ama çabuk biter; **paralel** bağlanırsa pilin **tükenme süresi (ömrü) uzar**!"
            ),
        },
        "pattern": r"ampermetre[a-zçğıöşü]*|voltmetre[a-zçğıöşü]*|ürete[çc][a-zçğıöşü]*|ampul[a-zçğıöşü]*|lamba[a-zçğıöşü]*",
    },
    {
        "id": "fiz_miknatis_ve_manyetizma",
        "term": "Mıknatıslar ve Manyetik Alan",
        "donemler": [3],
        "sayfa_by_donem": {3: 64},
        "tanim_by_donem": {
            3: (
                "Mıknatıs yalnız **Demir ($\text{Fe}$), Nikel ($\text{Ni}$) ve Kobalt ($\text{Co}$)** maddelerini çeker; bir mıknatısı yüz parçaya da bölsen her parçada yine hem Kuzey ($N$) hem Güney ($S$) kutbu bulunur (tek kutuplu mıknatıs olmaz!).\n"
                "💡 Sınav Şifresi: Manyetik alan çizgileri mıknatısın dışında daima **$N$ kutbundan çıkıp $S$ kutbuna girecek** yöndedir."
            ),
        },
        "pattern": r"mıknatıs[a-zçğıöşü]*|manyetik alan[a-zçğıöşü]*|pusula[a-zçğıöşü]*|elektromıknatıs[a-zçğıöşü]*",
    },

    # ==========================================
    # FİZ 3: BASINÇ VE KALDIRMA KUVVETİ (ATOMİK)
    # ==========================================
    {
        "id": "fiz_basinc_kati_sivi_gaz",
        "term": "Katı, Sıvı ve Açık Hava Basıncı",
        "donemler": [3],
        "sayfa_by_donem": {3: 98},
        "tanim_by_donem": {
            3: (
                "Birim yüzeye dik etki eden kuvvete **basınç ($P$)** denir; karda batmamak için geniş tabanlı kar ayakkabısı giyilmesi yüzey alanını büyütüp **katı basıncını azaltmak** içindir.\n"
                "💡 Formül: Katı $P = \\frac{G}{S}$, Sıvı $P = h \\cdot d \\cdot g$ (Kabın şekline bağlı değildir!). **Pascal Prensibi:** Sıvılar basıncı her yöne aynen iletir (Hidrolik fren, su cenderesi)."
            ),
        },
        "pattern": r"basın[çc][a-zçğıöşü]*|pascal prensibi|su cenderesi|toriçelli",
    },
    {
        "id": "fiz_bernoulli_ve_olcum_aletleri",
        "term": "Bernoulli İlkesi ve Basınç Ölçerler",
        "donemler": [3],
        "sayfa_by_donem": {3: 118},
        "tanim_by_donem": {
            3: (
                "**Bernoulli İlkesi:** Akışkanların (hava ve suyun) **hızının arttığı yerde basıncı düşer**; uçak kanatlarının uçağı havaya kaldırması ve fırtınada çatıların uçması bu ilkeyle gerçekleşir.\n"
                "💡 Sınav Şifresi: **Barometre** açık hava basıncını, **Manometre** kapalı kap gaz basıncını, **Altimetre** rakımı (yüksekliği), **Batimetre** deniz derinliğini ölçer."
            ),
        },
        "pattern": r"bernoulli|akışkan[a-zçğıöşü]*|akışlarının özelliklerinden|barometre[a-zçğıöşü]*|manometre[a-zçğıöşü]*|altimetre[a-zçğıöşü]*|batimetre[a-zçğıöşü]*",
    },
    {
        "id": "fiz_kaldirma_kuvveti",
        "term": "Sıvıların Kaldırma Kuvveti (Arşimet İlkesi)",
        "donemler": [3],
        "sayfa_by_donem": {3: 132},
        "tanim_by_donem": {
            3: (
                "Suya bırakılan bir cisme sıvı tarafından yukarı doğru uygulanan kuvvettir; devasa çelik gemilerin denizde yüzmesini sağlar.\n"
                "💡 Formül: $F_K = V_{\\text{batan}} \\cdot d_{\\text{sıvı}} \\cdot g$ — Sıvıda **yüzen** ($d_c < d_s$) ve **askıda kalan** ($d_c = d_s$) cisimlerde kaldırma kuvveti cismin ağırlığına tam eşittir ($F_K = G$); dibe batan cisimde ise $F_K < G$'dir!"
            ),
        },
        "pattern": r"kaldırma kuvvet[a-zçğıöşü]*|arşimet",
    },

    # ==========================================
    # FİZ 4: DALGALAR VE OPTİK (ATOMİK)
    # ==========================================
    {
        "id": "fiz_dalgalar_periyot_frekans",
        "term": "Dalgalar: Periyot, Frekans, Hız ve Dalga Boyu",
        "donemler": [4],
        "sayfa_by_donem": {4: 198},
        "tanim_by_donem": {
            4: (
                "Bir tam dalganın oluşma süresine **Periyot ($T$)**, $1$ saniyede üretilen dalga sayısına **Frekans ($f$, $\\text{Hz}$)** denir.\n"
                "💡 Altın Kural: **Frekans yalnızca kaynağa bağlıdır**, ortam değişse de değişmez! **Dalganın yayılma hızı ($v$) ise yalnızca ortama bağlıdır** ($v = \\lambda \\cdot f$ ve $T \\cdot f = 1$). Su derinleştikçe dalga hızlanır!"
            ),
        },
        "pattern": r"frekans[a-zçğıöşü]*|periyo[td][a-zçğıöşü]*|genli[kğ][a-zçğıöşü]*|sarmal yay|esnek ortam[a-zçğıöşü]*|stroboskop|dalga boyu[a-zçğıöşü]*|\bdalga[a-zçğıöşü]*",
    },
    {
        "id": "fiz_ses_ve_deprem_dalgalari",
        "term": "Ses ve Deprem Dalgaları (Rezonans & Yankı)",
        "donemler": [4],
        "sayfa_by_donem": {4: 234},
        "tanim_by_donem": {
            4: (
                "Ses mekanik bir dalgadır, uzay boşluğunda yayılamaz; tanecikler sık olduğu için **en hızlı katılarda**, en yavaş gazlarda yayılır ($v_{\\text{katı}} > v_{\\text{sıvı}} > v_{\\text{gaz}}$).\n"
                "💡 Sınav Şifresi: Sesin incelik-kalınlığını (yüksekliğini) **Frekans ($\\text{Hz}$)**; gürlüğünü (şiddetini) ise **Genlik ($\\text{dB}$)** belirler!"
            ),
        },
        "pattern": r"rezonans|yankı|desibel|deprem[a-zçğıöşü]*|tsunami|ses dalga[a-zçğıöşü]*",
    },
    {
        "id": "fiz_aydinlanma_ve_isik_akisi",
        "term": "Işık Şiddeti (I), Işık Akısı (Φ) ve Aydınlanma (E)",
        "donemler": [4],
        "sayfa_by_donem": {4: 262},
        "tanim_by_donem": {
            4: (
                "Kaynağın birim zamanda yaydığı ışık enerjisi **Işık Şiddeti ($I$, Candela)**; bir yüzeye düşen toplam ışık miktarı **Işık Akısı ($\\Phi$, Lümen)**; birim yüzeye dik düşen ışık ise **Aydınlanma Şiddeti ($E$, Lüks)**'dir.\n"
                "💡 Formül: Kürede ışık akısı yarıçapa bağlı değildir ($\\Phi = 4\\pi I$); Aydınlanma ise uzaklığın karesiyle ters orantılıdır: $E = \\frac{I}{d^2}$."
            ),
        },
        "pattern": r"ışık şiddet[a-zçğıöşü]*|ışık akısı[a-zçğıöşü]*|aydınlanma[a-zçğıöşü]*|gölge[a-zçğıöşü]*",
    },
    {
        "id": "fiz_yansima_ve_aynalar",
        "term": "Yansıma Kuralları, Düzlem, Çukur ve Tümsek Ayna",
        "donemler": [4],
        "sayfa_by_donem": {4: 274},
        "tanim_by_donem": {
            4: (
                "Işığın aynadan sekmesine **yansıma** denir; dişçi aynası ve makyaj aynası dev görüntü veren **Çukur Ayna**, araç yan aynaları ve otopark güvenlik aynaları ise geniş alanı küçük gösteren **Tümsek Ayna**'dır.\n"
                "💡 Sınav Şifresi: Gelme açısı alltid yansıma açısına eşittir (Ayna yüzeyiyle $\\theta$ açısı yapan ışının gelme açısı **$90^\\circ - \\theta$**'dır!). Merkez $M = 2f$'dir."
            ),
        },
        "pattern": r"yansıma[a-zçğıöşü]*|yansıtıcı|çukur ayna[a-zçğıöşü]*|tümsek ayna[a-zçğıöşü]*|düzlem ayna[a-zçğıöşü]*|asal eksen|odak nokta[a-zçğıöşü]*|\boptik\b",
    },
    {
        "id": "fiz_kirilma_mercek_ve_renk",
        "term": "Kırılma, Tam Yansıma, Mercekler ve Renkler",
        "donemler": [4],
        "sayfa_by_donem": {4: 304},
        "tanim_by_donem": {
            4: (
                "Işığın saydam ortam değiştirirken yön değiştirmesine **kırılma**; çok yoğundan az yoğuna geçerken içeride hapsolmasına **tam yansıma** (fiber optik internet kabloları) denir.\n"
                "💡 Sınav Şifresi: **İnce kenarlı (yakınsak)** mercek yakını göremeyen **Hipermetropu**, **Kalın kenarlı (ıraksak)** mercek uzağı göremeyen **Miyopu** düzeltir (**K**alın-**K**usur **M**iyop / **İ**nce-**H**ipermetrop). Işıkta ana renkler: **Kırmızı, Yeşil, Mavi**."
            ),
        },
        "pattern": r"kırılma indisi|tam yansıma|sınır açısı|merce[kğ][a-zçğıöşü]*|yakınsak|ıraksak|miyop|hipermetrop|beyaz ışık|kırmızı ışık",
    },
]
