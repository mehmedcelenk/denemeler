#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""MEB Felsefe 4 (11. Sınıf 2. Dönem / 12. Sınıf) Yüksek Hassasiyetli Kanonik Kavram ve Terim Sözlüğü."""

from typing import Any, Dict, List, Tuple

PRECISE_FEL4_CONCEPTS: List[Dict[str, Any]] = [
    {
        "id": "fel4_aydinlanma_ve_kant",
        "term": "Aydınlanma ve Kant (Sapere Aude ve Ödev Ahlakı)",
        "sayfa": 14,
        "tanim": "Kant'a göre Aydınlanma, insanın **kendi tembelliği yüzünden düştüğü vesayetten kurtulup aklını cesaretle kullanmasıdır** (Sapere Aude = 'Aklını kullanma cesaretini göster!'); ahlakta ise sonuç değil, **koşulsuz buyruğa uyan iyi niyet** belirleyicidir.\n💡 Sınav Şifresi: 'Sapere Aude' = cesaret + akıl; 'Ödev Ahlakı' = sonuç değil NİYET ve koşulsuz buyruk. Faydacılıkla (sonuç ahlakı) karıştırma!",
        "pattern": r"akla güven duyulmuş|aklın kullanılmasında cesaret|insanın aklını kendi başına|kant'ın “aydınlanma”|sapere aude|ödev ahlakı|koşulsuz buyruk",
    },
    {
        "id": "fel4_gucler_ayriligi_ve_siyaset",
        "term": "Montesquieu (Güçler Ayrılığı) ve Rousseau (Toplum Sözleşmesi)",
        "sayfa": 28,
        "tanim": "Montesquieu, özgürlüğün güvenceye alınması için devlet gücünün **yasama-yürütme-yargı** olarak ayrılmasını savunur; Rousseau ise halkın ortak iradesini temsil eden **'Genel İrade' ve 'Toplum Sözleşmesi'** fikrini geliştirir.\n💡 Sınav Şifresi: Montesquieu = GÜÇLER AYRILIĞI (üç erk); Rousseau = GENEL İRADE + TOPLUM SÖZLEŞMESİ. İkisini şaşırma, isim-kavram eşleştirmesi sorulur!",
        "pattern": r"yasama, yürütme ve yargı güçlerinin|güçler ayrılığı|toplumsal sözleşme|genel irade|montesquieu|rousseau",
    },
    {
        "id": "fel4_hegel_ve_marx_diyalektik",
        "term": "Hegel (Diyalektik İdealizm) ve Marx (Diyalektik Materyalizm)",
        "sayfa": 46,
        "tanim": "Hegel'e göre evren, **Mutlak Ruh'un (Geist) tez-antitez-sentez** diyalektiğiyle açılımıdır; Marx ise bu diyalektiği 'ayakları üzerine oturtarak' değişimin kaynağını fikirler değil **maddi ve ekonomik üretim ilişkileri** yapar.\n💡 Sınav Şifresi: Hegel = İDEALİZM (Ruh/Tin); Marx = MATERYALİZM (ekonomi/üretim). 'Baş aşağı diyalektik' ifadesi Marx'ı işaret eder!",
        "pattern": r"hegel'in, baş aşağı|diyalektik materyalizm|diyalektik düşüncesini ayakları üzerine|mutlak ruh|geist|\\\\btin\\\\b|engels, marx",
    },
    {
        "id": "fel4_pozitivizm_ve_comte",
        "term": "Pozitivizm (Olguculuk - Auguste Comte)",
        "sayfa": 58,
        "tanim": "Pozitivizm, yalnızca **gözlemlenebilir ve denenebilir olguların** gerçek olduğunu, metafiziğin anlamsız olduğunu savunur; Comte'a göre insanlık **Teolojik → Metafizik → Pozitif (bilimsel)** aşamalardan geçmiştir.\n💡 Sınav Şifresi: Comte = ÜÇ HAL YASASI (teolojik-metafizik-pozitif) + sadece OLGU. 'Metafizik anlamsız' cümlesi pozitivizmin imzasıdır!",
        "pattern": r"pozitivizm|olgunun dışında gerçek hiçbir şey|auguste comte|olguculuk",
    },
    {
        "id": "fel4_fenomenoloji_ve_husserl",
        "term": "Fenomenoloji ve Husserl (Paranteze Alma / Epokhe)",
        "sayfa": 74,
        "tanim": "Husserl'in fenomenolojisi, bir nesnenin **saf özüne (fenomen)** ulaşmak için ön yargıları, renk-şekil gibi özellikleri ve tarihsel kabulleri bir kenara bırakma yöntemidir; buna **'paranteze alma / Epokhe'** denir.\n💡 Sınav Şifresi: Husserl = FENOMENOLOJİ + EPOKHE (paranteze alma). 'Öze ulaşmak için askıya al' formülünü hatırla!",
        "pattern": r"paranteze alma|fenomenolojik yöntem|fenomenlerin özü[a-zçğıöşü]*|husserl|fenomenoloji|epokhe",
    },
    {
        "id": "fel4_hermeneutik_ve_gadamer",
        "term": "Hermeneutik (Yorum Sorunu: Dilthey ve Gadamer)",
        "sayfa": 88,
        "tanim": "Hermeneutik, insanın tarihsel-kültürel ürünlerini **anlama ve yorumlama** felsefesidir; Dilthey doğa bilimlerinin **'açıklama'**, insan/tin bilimlerinin **'anlama'** yaptığını, Gadamer ise anlamanın **tarihsel ufukların kaynaşmasıyla** oluştuğunu söyler.\n💡 Sınav Şifresi: Dilthey = AÇIKLAMA (doğa) vs ANLAMA (tin); Gadamer = UFUK KAYNAŞMASI. 'Yorum sanatı' = hermeneutik!",
        "pattern": r"hermeneutik - yorum sorunu|hermeneutik|metin yorumlama|ufukların kaynaşması|gadamer|dilthey",
    },
    {
        "id": "fel4_varolusculuk_egzistansiyalizm",
        "term": "Varoluşçuluk (Egzistansiyalizm: Kierkegaard ve Sartre)",
        "sayfa": 102,
        "tanim": "Varoluşçuluk, insanın somut varoluşunu soyut sistemlerin önüne koyar; Sartre'a göre **'varoluş özden önce gelir'** — insan önce var olur, sonra seçimleriyle özünü inşa eder ve bu özgürlüğün sorumluluğunu taşır.\n💡 Sınav Şifresi: Sartre = 'VAROLUŞ ÖZDEN ÖNCE GELİR' + özgürlük ve sorumluluk. Kierkegaard = varoluşçuluğun öncüsü. 'İnsan özünü kendi seçer' cümlesi Sartre'ı verir!",
        "pattern": r"varoluş özden önce gelir|varoluşçuluk|kierkegaard|jean-paul sartre|sartre|varoluş hiçbir zaman hazır",
    },
    {
        "id": "fel4_yeni_ontoloji_ve_hartmann",
        "term": "Yeni Ontoloji (Nicolai Hartmann)",
        "sayfa": 116,
        "tanim": "Hartmann'ın yeni ontolojisi, bilginin varlığa dayandığını savunur ve varlığı **inorganik (fizik) → organik (biyoloji) → ruhsal (psikoloji) → tinsel (felsefe, din, sanat, ahlak)** olmak üzere dört katmana ayırır.\n💡 Sınav Şifresi: Hartmann = YENİ ONTOLOJİ + 4 KATMAN (inorganik-organik-ruhsal-tinsel). Katman sırası sorulursa en üstte TİNSEL katman!",
        "pattern": r"yeni ontoloji|hartmann|nicolai hartmann|varlık katmanları",
    },
    {
        "id": "fel4_turkiye_felsefesi",
        "term": "Türkiye'de Çağdaş Felsefe Düşünürleri",
        "sayfa": 130,
        "tanim": "20. yüzyıl Türk düşüncesinin kurucu isimleri: **Hasan Âli Yücel** (dünya klasiklerinin çevirisi), **Aydın Sayılı** (İslam bilim tarihi), **Hilmi Ziya Ülken**, **Takiyettin Mengüşoğlu** ve **Nermi Uygur**'dur.\n💡 Sınav Şifresi: Yücel = KLASİKLERİN ÇEVİRİSİ; Sayılı = İSLAM BİLİM TARİHİ. İsim-katkı eşleştirmesinde bu iki anahtar en çok sorulur!",
        "pattern": r"hasan ali yücel|hasan âli yücel|aydın sayılı|nermi uygur|takiyettin mengüşoğlu|hilmi ziya ülken",
    },
]
