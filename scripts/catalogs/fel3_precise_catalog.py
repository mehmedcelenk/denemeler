#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""MEB Felsefe 3 (11. Sınıf 1. Dönem) Yüksek Hassasiyetli Kanonik Kavram ve Terim Sözlüğü."""

from typing import Any, Dict, List, Tuple

PRECISE_FEL3_CONCEPTS: List[Dict[str, Any]] = [
    {
        "id": "fel3_arkhe_ve_doga_filozoflari",
        "term": "Arkhe ve İlk Neden (Thales, Herakleitos, Parmenides)",
        "sayfa": 18,
        "tanim": "**Arkhe**, evrenin kendisinden türediği ilk maddedir: Thales için **su**, Anaksimandros için **apeiron (sınırsız)**, Empedokles için **4 unsur + Sevgi/Nefret**, Herakleitos için **ateş ve oluş**, Parmenides için ise **değişmez tek varlık** (değişim yanılsamadır).\n💡 Sınav Şifresi: 'Su-Thales, Ateş-Oluş-Herakleitos, Değişim yok-Parmenides' üçlüsünü kodla; Parmenides'te 'yokluk yoktur' cümlesi ayırt edici anahtardır.",
        "pattern": r"filozof - arkhe|thales - su|\\\\barkhe\\\\b|empedokles'e göre arkhe|her şey karşıtıyla vardır|aynı ırmakta iki kez|parmenides|varlık vardır, yokluk yoktur",
    },
    {
        "id": "fel3_sofistler_ve_sokrates",
        "term": "Sofistler (Rölativizm) ve Sokrates",
        "sayfa": 28,
        "tanim": "Sofistler bilgiyi kişiye göre değişen **göreli (rölativist)** bir şey sayar ('İnsan her şeyin ölçüsüdür' - Protagoras); Sokrates ise bilginin **doğuştan** geldiğini ve erdemin kaynağı olduğunu savunur.\n💡 Sınav Şifresi: 'Ölçü insan' = Sofist/Protagoras, 'Bilerek kötülük yapılmaz' = Sokrates. Bu iki cümle şıkları ayırır.",
        "pattern": r"insan her şeyin ölçüsüdür|protagoras|sofistler|kimse bilerek kötülük yapmaz|sokrates'in ahlak anlayışı|sokratik",
    },
    {
        "id": "fel3_platon_idealar_ve_magara",
        "term": "Platon: İdealar Kuramı ve Mağara Alegorisi",
        "sayfa": 36,
        "tanim": "Platon evreni ikiye böler: değişken ve yanıltıcı **Duyulur Dünya (sanı/doksa)** ile ebedî ve gerçek **İdealar Dünyası (episteme)**; bunu **Mağara Alegorisi** ile anlatır (mağaradaki gölgeler = duyulur dünya).\n💡 Sınav Şifresi: 'Gölge = sanı, Güneş/idealar = gerçek bilgi'. Mağara benzetmesi görürsen cevap Platon'dur.",
        "pattern": r"ideanın bilgisiyle|mağara benzetmesi|idealar|episteme|doksa|fenomenlerin bilgisi gerçek",
    },
    {
        "id": "fel3_aristoteles_dort_neden_altin_orta",
        "term": "Aristoteles: Dört Neden ve Altın Orta (İtidallik)",
        "sayfa": 44,
        "tanim": "Aristoteles bir şeyi açıklamak için **4 neden** ister: **Maddi** (neyden), **Formel** (biçim), **Fail** (yapan), **Ereksel** (amaç); erdem ise iki uç arasındaki **Altın Orta (itidal)** yolunu bulmaktır.\n💡 Sınav Şifresi: 'Heykel örneği' klasiktir: mermer=maddi, şekil=formel, heykeltıraş=fail, güzellik/ibadet=ereksel. 'Aşırılık ve eksiklik arası orta' = Altın Orta.",
        "pattern": r"dört neden|dört neden görüşü|maddi neden|formel neden|fail neden|ereksel neden|orta yolu bulma|orta yolu bulmaktır|altın orta|itidallik",
    },
    {
        "id": "fel3_orta_cag_skolastik_ve_tumeller",
        "term": "Skolastik Felsefe ve Tümeller Problemi",
        "sayfa": 68,
        "tanim": "**Skolastik felsefe**, inancı akılla temellendirmeye çalışan din merkezli okul felsefesidir; **Tümeller Problemi** ise 'kavramlar gerçek mi?' sorusudur: **Kavram Realizmi** (tümeller Tanrı'nın zihninde gerçektir - Anselmus) ile **Nominalizm** (tümeller sadece isimdir - Ockhamlı William) karşı karşıyadır.\n💡 Sınav Şifresi: 'Sadece isim' = Nominalizm/Ockhamlı, 'gerçek varlık' = Realizm/Anselmus. Skolastik = 'inanç + akıl' formülü.",
        "pattern": r"skolastik felsefe|skolastik|tümeller problemi|tümeller|kavram realizmi|nominalizm",
    },
    {
        "id": "fel3_islam_felsefesi_messaiye",
        "term": "İslam Felsefesi ve Meşşâiye Ekolü",
        "sayfa": 82,
        "tanim": "**Meşşâiye**, Beytü'l-Hikme çevirileriyle Antik felsefeyi akılcı yorumlayan İslam okuludur (El-Kindi, Farabi, İbn Sina, İbn Rüşd); İbn Sina varlığı **Zorunlu Varlık (Tanrı)** ve **Mümkün Varlık (yaratılanlar)** olarak ayırır.\n💡 Sınav Şifresi: 'Vacibü'l-Vücud = Tanrı, Mümkün = evren'. Meşşâiye = 'Aristoteles'i Arapça okuyan akılcı ekol'.",
        "pattern": r"meşşâiye|fârâbî|ibn sina|ibn rüşd|el kindi|zorunlu varlık|beytülhikme",
    },
    {
        "id": "fel3_hümanizm_ve_bacon_descartes",
        "term": "Rönesans, Hümanizm, Bacon ve Descartes",
        "sayfa": 104,
        "tanim": "**Hümanizm** insanı ve aklı merkeze alır; **Bacon** 'bilgi güçtür' diyerek tümevarımla doğayı denetlemeyi, **Descartes** ise her şeyden şüphe ederek 'Düşünüyorum öyleyse varım' (Cogito) ile kesin bilgiye ulaşmayı ve ruh-madde düalizmini savunur.\n💡 Sınav Şifresi: 'Bilgi güçtür + tümevarım' = Bacon, 'Cogito + şüphe yöntemi' = Descartes. İkisini karıştırma!",
        "pattern": r"hümanizm|düşünüyorum öyleyse varım|bacon|descartes|kartezyen|bilgi güçtür",
    },
    {
        "id": "fel3_utopyalar_istenen_ve_korku",
        "term": "İstenen ve İstenmeyen (Korku / Distopya) Ütopyalar",
        "sayfa": 118,
        "tanim": "**İstenen ütopyalar** ideal toplum tasarılarıdır (Platon'un Devleti, Farabi'nin El-Medinetü'l-Fazıla'sı, More'un Ütopya'sı, Campanella'nın Güneş Ülkesi); **distopyalar** ise totaliter geleceğe karşı uyarıdır (Huxley'in Cesur Yeni Dünyası, Orwell'in 1984'ü).\n💡 Sınav Şifresi: '1984 ve Cesur Yeni Dünya' görürsen = distopya (korku ütopyası). 'El-Medinetü'l-Fazıla' = Farabi'nin ideal devleti.",
        "pattern": r"ütopya|ütopyalar|korku ütopyası|ters ütopya|cesur yeni dünya|\\\\b1984\\\\b",
    },
]
