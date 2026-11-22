#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""MEB FEL_2 Yüksek Hassasiyetli Kanonik Kavram ve Terim Sözlüğü."""

from typing import Any, Dict, List

PRECISE_FEL2_CONCEPTS: List[Dict[str, Any]] = [
    {
        "id": 'fel2_varlik_anlayislari',
        "term": 'Varlık Anlayışları (İdealizm, Materyalizm, Düalizm, Oluş)',
        "sayfa": 98,
        "tanim": "Varlığın özü nedir sorusuna dört farklı cevap: **İdealizm** 'her şey ruhtur' der (Platon'un mağara alegorisi gibi), **Materyalizm** 'her şey maddedir' der (Demokritos'un atomları gibi), **Düalizm** 'ikisi de var' der (Descartes'in zihin-beden ayrımı), **Oluş** ise 'hiçbir şey sabit değil' der (Herakleitos'un nehri gibi).\n💡 Hile: Platon/Hegel→İdea, Demokritos/Marx→Madde, Descartes→İkisi, Herakleitos→Değişim, Gorgias→Yokluk (Nihilizm). 'Aynı ırmakta iki kez yıkanılmaz' = Oluş'un kesin işareti.",
        "pattern": '\\bidealizm\\b|\\bmateryalizm\\b|\\bdüalizm\\b|\\boluş felsefesi\\b|\\baynı ırmakta iki kez yıkanılmaz\\b|\\bnihilizm\\b|\\bhiçbir şey yoktur, var olsa da\\b',
    },
    {
        "id": 'fel2_bilgi_ogretileri',
        "term": 'Bilgi Kuramları (Empirizm, Kritisizm, Pragmatizm, Rasyonalizm)',
        "sayfa": 114,
        "tanim": "Bilgi nereden gelir? **Rasyonalizm** 'akıldan' der (doğuştan fikirler), **Empirizm** 'deneyden' der (Locke'un boş levha/tabula rasa'sı), **Kritisizm** 'ikisinin birleşiminden' der (Kant: algı+kavram), **Pragmatizm** ise 'işe yarayan doğrudur' der (James, Dewey).\n💡 Hile: 'Tabula rasa' → Empirizm (Locke). 'Algısız kavramlar boş, kavramsız algılar kördür' → Kant/Kritisizm. 'Fayda/yarar' kelimesi geçiyorsa → Pragmatizm.",
        "pattern": '\\bpragmatizm\\b|\\bempirizm\\b|\\bkritisizm\\b|\\bdeneyim ve aklın birleşimidir\\b|\\balgısız kavramlar boş\\b|\\btabula rasa\\b|\\bdoğru bilgiye ulaşmak mümkün müdür\\b',
    },
    {
        "id": 'fel2_dogruluk_olcutleri',
        "term": 'Doğruluk Ölçütleri ve Apaçıklık',
        "sayfa": 122,
        "tanim": "Bir bilginin doğru olup olmadığını nasıl anlarız? **Uygunluk** (nesnesine uyuyor mu), **Tutarlılık** (kendi içinde çelişkisiz mi), **Tümel Uzlaşım** (herkes onaylıyor mu), **Yarar** (işe yarıyor mu) ve **Apaçıklık** (kuşku duyulamayacak kadar net mi) ölçütleriyle test ederiz.\n💡 Hile: 'Çelişkisizlik' → Tutarlılık. 'Çoğunluk onayı' → Tümel Uzlaşım. 'Kuşku duyulmaz/net' → Apaçıklık (Descartes'ın 'açık ve seçik' kavramı).",
        "pattern": '\\bapaçıklık\\b|\\btümel uzlaşım\\b|\\bbilginin güvenilirliği\\b|\\bdoğruluk ölçütleri\\b',
    },
    {
        "id": 'fel2_paradigma_ve_bilim',
        "term": 'Paradigma (Thomas Kuhn) ve Sözde Bilim',
        "sayfa": 134,
        "tanim": "**Paradigma** (Kuhn), bir dönemin bilim insanlarının ortak kabul ettiği düşünce çerçevesidir — tıpkı bir işletim sisteminin tüm uygulamaları şekillendirmesi gibi; **sözde bilim** ise test edilemeyen, yanlışlanamayan iddialardır (astroloji, numeroloji).\n💡 Hile: Kuhn + 'ortak inanç/yöntem çerçevesi' → Paradigma. 'Yanlışlanamaz/test edilemez' → Sözde Bilim. Astroloji ve numeroloji sınavda sözde bilim örneğidir.",
        "pattern": '\\bparadigma\\b|\\bsözde bilim\\b|\\bnumeroloji\\b|\\bthomas kuhn\\b|\\betkinlik olarak bilim\\b',
    },
    {
        "id": 'fel2_ahlaki_ozgurluk_ve_akımlar',
        "term": 'Ahlaki Özgürlük (Determinizm, Fatalizm, Otodeterminizm)',
        "sayfa": 146,
        "tanim": "İnsan özgür mü? **Determinizm** 'hayır, nedenler zinciri var' der, **Fatalizm** 'hayır, kader önceden yazıldı' der, **İndeterminizm** 'evet, tamamen özgür' der, **Otodeterminizm** ise 'kendini eğittikçe özgürleşir' der.\n💡 Hile: 'Kaderci' → Fatalizm. 'Neden-sonuç zorunluluğu' → Determinizm. 'Kendini geliştirdikçe özgürleşme' → Otodeterminizm (ahlaki olgunlaşma vurgusu).",
        "pattern": '\\bdeterminizm\\b|\\bfatalizm\\b|\\bindeterminizm\\b|\\botodeterminizm\\b|\\bbelirlenimcilik\\b',
    },
    {
        "id": 'fel2_hedonizm_ve_odev_ahlaki',
        "term": "Hedonizm, Utilitarizm ve Kant'ın Ödev Ahlakı",
        "sayfa": 152,
        "tanim": "Ahlakın ölçüsü ne? **Hedonizm** 'haz' der (Epiküros), **Utilitarizm** 'en çok kişiye en çok fayda' der (Bentham, Mill), **Kant'ın Ödev Ahlakı** ise 'sonuca bakma, sadece ödeve uy ve iyi niyetle yap' der (Kategorik Buyruk).\n💡 Hile: 'Haz' → Hedonizm. 'En yüksek fayda/çoğunluk mutluluğu' → Utilitarizm. 'Koşulsuz buyruk/sonuç değil niyet' → Kant. Kant'ta 'ödev' ve 'iyi irade' anahtar kelimelerdir.",
        "pattern": "\\bhedonizm\\b|\\butilitarizm\\b|\\bödev ahlakı\\b|\\bödeve uygun\\b|\\bkategorik buyruk\\b|\\bkant'ın\\b",
    },
    {
        "id": 'fel2_tanri_anlayislari',
        "term": 'Tanrı Anlayışları (Teizm, Deizm, Panteizm, Panenteizm)',
        "sayfa": 168,
        "tanim": "Tanrı-evren ilişkisi: **Teizm** 'yarattı ve müdahale eder' der, **Deizm** 'yarattı ama karışmaz, doğa kanunlarına bıraktı' der (kurulmuş saat gibi), **Panteizm** 'Tanrı=evren' der (Spinoza), **Panenteizm** 'evren Tanrı'da ama Tanrı evreni aşar' der.\n💡 Hile: 'Vahiy/mucize yok, akıl yeter' → Deizm. 'Tanrı ile evren aynı' → Panteizm (Spinoza). 'Her şey Tanrı'da ama Tanrı aşkın' → Panenteizm. Teizm'de müdahale vardır.",
        "pattern": '\\bpanteizm\\b|\\bpanenteizm\\b|\\bmonoteizm\\b|\\bteizm\\b|\\bdeizm\\b|\\bagnostisizm\\b|\\bateizm\\b|\\bkötülük argümanı\\b',
    },
    {
        "id": 'fel2_toplum_sozlesmesi_siyaset',
        "term": 'Toplum Sözleşmesi ve Siyaset Felsefesi',
        "sayfa": 182,
        "tanim": "İnsanlar doğa durumundan nasıl topluma geçti? **Hobbes** 'insan insanın kurdudur, güçlü devlet şart' der, **Locke** 'mülkiyet ve özgürlük korunmalı' der, **Rousseau** 'genel irade egemen olmalı' der; yönetim biçimleri ise monarşi, teokrasi, aristokrasi ve demokrasidir.\n💡 Hile: 'İnsan insanın kurdudur' → Hobbes. 'Mülkiyet/yaşam/özgürlük' → Locke. 'Genel irade/halk egemenliği' → Rousseau. Tek kişi→Monarşi, din→Teokrasi, soylular→Aristokrasi, halk→Demokrasi.",
        "pattern": '\\btoplum sözleşmesi\\b|\\bdoğa hâlinde\\b|\\bteokrasi\\b|\\baristokrasi\\b|\\bmeşruiyet\\b|\\bsiyaset felsefesi\\b',
    },
    {
        "id": 'fel2_sanat_kuramlari',
        "term": 'Sanat Kuramları (Taklit, Yaratma, Oyun Olarak Sanat)',
        "sayfa": 194,
        "tanim": "Sanat nedir? **Taklit (Mimesis)** 'doğanın yansımasıdır' der (Platon, Aristoteles), **Yaratma** 'sanatçının özgün hayal gücüdür' der (Croce), **Oyun** ise 'insanı kaygılardan arındıran özgür etkinliktir' der (Schiller).\n💡 Hile: 'Mimesis/doğanın yansıması' → Taklit kuramı. 'Özgün hayal gücü/sezgi' → Yaratma (Croce). 'Günlük kaygılardan arınma/özgür oyun' → Schiller.",
        "pattern": '\\bsanat bir yansıma\\b|\\bsanat bir oyun\\b|\\bmimesis\\b|\\bestetik değer\\b|\\bsanat felsefesi\\b',
    },
    {
        "id": 'fel_varlik_ve_ahlak',
        "term": 'Ontoloji ve Etik Akımları (Nihilizm, Pragmatizm, Egzistansiyalizm)',
        "sayfa": 95,
        "tanim": "Hiççilik Nihilizm; faydacılık Pragmatizm; varoluş özden önce gelir diyen Varoluşçuluk; öze dönüş Fenomenolojidir.\n💡 Hile: 'Hiçbir şey var olamaz' = **Nihilizm**. 'İşe yarayan ve pratik fayda sağlayan doğrudur' = **Pragmatizm**. 'Varoluş özden önce gelir' = **Varoluşçuluk (Sartre)**. Paranteze alma = **Fenomenoloji**.",
        "pattern": '\\bnihilizm[a-zçğıöşü]*\\b|\\bpragmatizm[a-zçğıöşü]*\\b|\\begzistansiyalizm[a-zçğıöşü]*\\b|\\bfenomenoloji[a-zçğıöşü]*\\b|\\bNihilizm\\b|\\bPragmatizm\\b|\\bFenomenoloji\\b',
        "option_only_pattern": '^Nihilizm$|^Pragmatizm$|^Fenomenoloji$',
    },
]
