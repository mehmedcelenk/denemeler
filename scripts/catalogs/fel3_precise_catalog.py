#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""MEB FEL_3 Yüksek Hassasiyetli Kanonik Kavram ve Terim Sözlüğü."""

from typing import Any, Dict, List

PRECISE_FEL3_CONCEPTS: List[Dict[str, Any]] = [
    {
        "id": 'fel3_arkhe_ve_doga_filozoflari',
        "term": 'Arkhe ve İlk Neden (Thales, Herakleitos, Parmenides)',
        "sayfa": 18,
        "tanim": "**Arkhe**, evrenin kendisinden türediği ilk maddedir: Thales için **su**, Anaksimandros için **apeiron (sınırsız)**, Empedokles için **4 unsur + Sevgi/Nefret**, Herakleitos için **ateş ve oluş**, Parmenides için ise **değişmez tek varlık** (değişim yanılsamadır).\n💡 Hile: 'Su-Thales, Ateş-Oluş-Herakleitos, Değişim yok-Parmenides' üçlüsünü kodla; Parmenides'te 'yokluk yoktur' cümlesi ayırt edici anahtardır.",
        "pattern": "\\bfilozof - arkhe\\b|\\bthales - su\\b|\\barkhe\\b|\\bempedokles'e göre arkhe\\b|\\bher şey karşıtıyla vardır\\b|\\baynı ırmakta iki kez\\b|\\bparmenides\\b|\\bvarlık vardır, yokluk yoktur\\b",
    },
    {
        "id": 'fel3_sofistler_ve_sokrates',
        "term": 'Sofistler (Rölativizm) ve Sokrates',
        "sayfa": 28,
        "tanim": "Sofistler bilgiyi kişiye göre değişen **göreli (rölativist)** bir şey sayar ('İnsan her şeyin ölçüsüdür' - Protagoras); Sokrates ise bilginin **doğuştan** geldiğini ve erdemin kaynağı olduğunu savunur.\n💡 Hile: 'Ölçü insan' = Sofist/Protagoras, 'Bilerek kötülük yapılmaz' = Sokrates. Bu iki cümle şıkları ayırır.",
        "pattern": "\\binsan her şeyin ölçüsüdür\\b|\\bprotagoras\\b|\\bsofistler\\b|\\bkimse bilerek kötülük yapmaz\\b|\\bsokrates'in ahlak anlayışı\\b|\\bsokratik\\b",
    },
    {
        "id": 'fel3_platon_idealar_ve_magara',
        "term": 'Platon: İdealar Kuramı ve Mağara Alegorisi',
        "sayfa": 36,
        "tanim": "Platon evreni ikiye böler: değişken ve yanıltıcı **Duyulur Dünya (sanı/doksa)** ile ebedî ve gerçek **İdealar Dünyası (episteme)**; bunu **Mağara Alegorisi** ile anlatır (mağaradaki gölgeler = duyulur dünya).\n💡 Hile: 'Gölge = sanı, Güneş/idealar = gerçek bilgi'. Mağara benzetmesi görürsen cevap Platon'dur.",
        "pattern": '\\bideanın bilgisiyle\\b|\\bmağara benzetmesi\\b|\\bidealar\\b|\\bepisteme\\b|\\bdoksa\\b|\\bfenomenlerin bilgisi gerçek\\b',
    },
    {
        "id": 'fel3_aristoteles_dort_neden_altin_orta',
        "term": 'Aristoteles: Dört Neden ve Altın Orta (İtidallik)',
        "sayfa": 44,
        "tanim": "Aristoteles bir şeyi açıklamak için **4 neden** ister: **Maddi** (neyden), **Formel** (biçim), **Fail** (yapan), **Ereksel** (amaç); erdem ise iki uç arasındaki **Altın Orta (itidal)** yolunu bulmaktır.\n💡 Hile: 'Heykel örneği' klasiktir: mermer=maddi, şekil=formel, heykeltıraş=fail, güzellik/ibadet=ereksel. 'Aşırılık ve eksiklik arası orta' = Altın Orta.",
        "pattern": '\\bdört neden\\b|\\bdört neden görüşü\\b|\\bmaddi neden\\b|\\bformel neden\\b|\\bfail neden\\b|\\bereksel neden\\b|\\borta yolu bulma\\b|\\borta yolu bulmaktır\\b|\\baltın orta\\b|\\bitidallik\\b',
    },
    {
        "id": 'fel3_orta_cag_skolastik_ve_tumeller',
        "term": 'Skolastik Felsefe ve Tümeller Problemi',
        "sayfa": 68,
        "tanim": "**Skolastik felsefe**, inancı akılla temellendirmeye çalışan din merkezli okul felsefesidir; **Tümeller Problemi** ise 'kavramlar gerçek mi?' sorusudur: **Kavram Realizmi** (tümeller Tanrı'nın zihninde gerçektir - Anselmus) ile **Nominalizm** (tümeller sadece isimdir - Ockhamlı William) karşı karşıyadır.\n💡 Hile: 'Sadece isim' = Nominalizm/Ockhamlı, 'gerçek varlık' = Realizm/Anselmus. Skolastik = 'inanç + akıl' formülü.",
        "pattern": '\\bskolastik felsefe\\b|\\bskolastik\\b|\\btümeller problemi\\b|\\btümeller\\b|\\bkavram realizmi\\b|\\bnominalizm\\b',
    },
    {
        "id": 'fel3_islam_felsefesi_messaiye',
        "term": 'İslam Felsefesi ve Meşşâiye Ekolü',
        "sayfa": 82,
        "tanim": "**Meşşâiye**, Beytü'l-Hikme çevirileriyle Antik felsefeyi akılcı yorumlayan İslam okuludur (El-Kindi, Farabi, İbn Sina, İbn Rüşd); İbn Sina varlığı **Zorunlu Varlık (Tanrı)** ve **Mümkün Varlık (yaratılanlar)** olarak ayırır.\n💡 Hile: 'Vacibü'l-Vücud = Tanrı, Mümkün = evren'. Meşşâiye = 'Aristoteles'i Arapça okuyan akılcı ekol'.",
        "pattern": '\\bmeşşâiye\\b|\\bfârâbî\\b|\\bibn sina\\b|\\bibn rüşd\\b|\\bel kindi\\b|\\bzorunlu varlık\\b|\\bbeytülhikme\\b',
    },
    {
        "id": 'fel3_hümanizm_ve_bacon_descartes',
        "term": 'Rönesans, Hümanizm, Bacon ve Descartes',
        "sayfa": 104,
        "tanim": "**Hümanizm** insanı ve aklı merkeze alır; **Bacon** 'bilgi güçtür' diyerek tümevarımla doğayı denetlemeyi, **Descartes** ise her şeyden şüphe ederek 'Düşünüyorum öyleyse varım' (Cogito) ile kesin bilgiye ulaşmayı ve ruh-madde düalizmini savunur.\n💡 Hile: 'Bilgi güçtür + tümevarım' = Bacon, 'Cogito + şüphe yöntemi' = Descartes. İkisini karıştırma!",
        "pattern": '\\bhümanizm\\b|\\bdüşünüyorum öyleyse varım\\b|\\bbacon\\b|\\bdescartes\\b|\\bkartezyen\\b|\\bbilgi güçtür\\b',
    },
    {
        "id": 'fel3_utopyalar_istenen_ve_korku',
        "term": 'İstenen ve İstenmeyen (Korku / Distopya) Ütopyalar',
        "sayfa": 118,
        "tanim": "**İstenen ütopyalar** ideal toplum tasarılarıdır (Platon'un Devleti, Farabi'nin El-Medinetü'l-Fazıla'sı, More'un Ütopya'sı, Campanella'nın Güneş Ülkesi); **distopyalar** ise totaliter geleceğe karşı uyarıdır (Huxley'in Cesur Yeni Dünyası, Orwell'in 1984'ü).\n💡 Hile: '1984 ve Cesur Yeni Dünya' görürsen = distopya (korku ütopyası). 'El-Medinetü'l-Fazıla' = Farabi'nin ideal devleti.",
        "pattern": '\\bütopya\\b|\\bütopyalar\\b|\\bkorku ütopyası\\b|\\bters ütopya\\b|\\bcesur yeni dünya\\b|\\b1984\\b',
    },
]
