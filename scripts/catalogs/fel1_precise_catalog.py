#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""MEB FEL_1 Yüksek Hassasiyetli Kanonik Kavram ve Terim Sözlüğü."""

from typing import Any, Dict, List

PRECISE_FEL1_CONCEPTS: List[Dict[str, Any]] = [
    {
        "id": 'fel1_felsefe_ve_hikmet',
        "term": 'Felsefe ve Hikmet (Philosophia)',
        "sayfa": 14,
        "tanim": "Felsefe, Yunanca **philia** (sevgi) + **sophia** (bilgelik) birleşimiyle 'bilgelik sevgisi'dir; tıpkı Yunus Emre'nin 'ilim ilim bilmektir, ilim kendin bilmektir' dizelerindeki hakikat arayışı gibi. Doğu-İslam dünyasında bu arayış **hikmet** kavramıyla karşılanır.\n💡 Hile: 'Sevgi' kelimesi geçiyorsa felsefe, 'künh/derinlik/hakikat' vurgusu varsa hikmet — ikisi aynı kapıya çıkar.",
        "pattern": '\\bphilosophia\\b|\\bbilgelik sevgisi\\b|\\bhikmet\\b|\\bfelsefe yapmak sürekli yolda\\b|\\bnerede bir insan varsa orada felsefe\\b',
    },
    {
        "id": 'fel1_refleksif_dusunme',
        "term": 'Refleksif Olma (Düşünce Üzerine Düşünme)',
        "sayfa": 18,
        "tanim": "Zihnin kendi ürettiği düşünceye geri dönüp onu **eleştirel süzgeçten** geçirmesidir; sinemadaki **flashback** gibi düşüncenin kendi geçmişine bakıp 'ben bunu neden böyle düşündüm?' demesi.\n💡 Hile: 'Düşünce üzerine düşünme' veya 'kendine dönme' ifadesi = refleksif; başkasını değil kendini sorgular.",
        "pattern": '\\brefleksif olma\\b|\\brefleksifliği\\b|\\brefleksif\\b|\\bdüşünceler hakkında düşünürler\\b|\\bdüşünce üzerine düşün\\b',
    },
    {
        "id": 'fel1_rasyonel_ve_tutarlilik',
        "term": 'Rasyonel Olma ve Mantıksal Tutarlılık',
        "sayfa": 20,
        "tanim": "Felsefi iddiaların **akıl yürütme kurallarına** uygun temellendirilmesi (rasyonellik) ve bir sistemin önermelerinin birbiriyle **çelişmemesi** (tutarlılık) demektir; tıpkı bir yapay zekâ algoritmasının kendi kodlarıyla çelişmemesi gibi.\n💡 Hile: 'Akla uygunluk' = rasyonellik, 'kendi içinde çelişmezlik' = tutarlılık; ikisini karıştırma, biri akıl diğeri ahenk.",
        "pattern": '\\brasyonel olma\\b|\\brasyonel\\b|\\btutarlılık\\b|\\bmantıksal bir bütünün\\b|\\bçelişiklik\\b',
    },
    {
        "id": 'fel1_kumulatif_yigilimli',
        "term": 'Yığılımlı (Kümülatif) İlerleme',
        "sayfa": 22,
        "tanim": "Felsefede yeni görüşler eskileri **çürütmez**, aksine üst üste yığılarak zenginleşir; tıpkı Orhun Yazıtları'ndan günümüze Türk düşüncesinin katman katman birikmesi gibi.\n💡 Hile: Bilimde 'eskiyi çürütme', felsefede 'yan yana birikme' — 'yığılımlı/kümülatif' kelimesi felsefenin anahtarıdır.",
        "pattern": '\\byığılımlı ilerleme\\b|\\byığılımlı\\b|\\bkümülatif\\b',
    },
    {
        "id": 'fel1_bilgi_ve_onerme',
        "term": 'Bilgi, Önerme ve Doğruluk',
        "sayfa": 32,
        "tanim": "**Bilgi**, bilen özne (süje) ile bilinen nesne (obje) arasındaki bağdan doğar; **önerme** ise kesin yargı bildiren ve 'doğru/yanlış' değeri alabilen cümledir (soru, ünlem, istek cümleleri önerme değildir).\n💡 Hile: 'Doğru-yanlış değeri alabilen yargı cümlesi' = önerme; 'Hava nasıl?' önerme değil, 'Hava güzel.' önermedir.",
        "pattern": '\\bözne ile nesne arasındaki ilişki\\b|\\ben az iki terimden oluşan\\b|\\bdoğruluk değeri taşıyan\\b|\\bönerme\\b|\\bönermeler\\b',
    },
    {
        "id": 'fel1_tumdengelim_deduksiyon',
        "term": 'Tümdengelim (Dedüksiyon)',
        "sayfa": 42,
        "tanim": "**Genelden özele** inen, öncüller doğruysa sonucun **zorunlu** çıktığı akıl yürütmedir; Harezmi'nin cebirde genel kuraldan özel sayıya inmesi gibi.\n💡 Hile: 'Bütün insanlar ölümlü → Sokrates insan → Sokrates ölümlü' klasik tümdengelim; 'zorunlu sonuç' ve 'genelden özele' ifadeleri anahtar.",
        "pattern": '\\btümdengelim\\b|\\btümdengelimi\\b|\\bsonuç, öncüllerden zorunlu olarak\\b',
    },
    {
        "id": 'fel1_tumevarim_enduksiyon',
        "term": 'Tümevarım (Endüksiyon)',
        "sayfa": 44,
        "tanim": "**Tek tek gözlemlerden genel yasaya** ulaşan, sonucu öncülleri aştığı için **olasılıklı** bilgi veren yöntemdir; tıpkı her gün güneşin doğmasını gözleyip 'güneş her gün doğar' yasasına varmak gibi.\n💡 Hile: 'Özelden genele' + 'olasılık' = tümevarım; kesinlik yoktur, deney ve gözlem vardır.",
        "pattern": '\\btümevarım\\b|\\btümevarımla\\b|\\bözel durumlardan genel ilkelere\\b|\\btek tek durumlar gözlenerek\\b',
    },
    {
        "id": 'fel1_analoji_benzesim',
        "term": 'Analoji (Benzeşim)',
        "sayfa": 46,
        "tanim": "İki farklı şey arasındaki **benzerlikten** yola çıkarak birindeki özelliği diğerine taşıma akıl yürütmesidir; tıpkı 'kalp pompa gibidir' derken organı makineye benzetmemiz gibi.\n💡 Hile: 'Benzeşim' kelimesi = analoji; kesinlik iddiası yoktur, benzerlikten hareket eder, olasılıklıdır.",
        "pattern": '\\banaloji\\b|\\bortak olan özelliğe veya benzerliğe dayanarak\\b',
    },
    {
        "id": 'fel1_arguman_ve_gorus',
        "term": 'Argüman ve Temellendirme',
        "sayfa": 48,
        "tanim": "Bir tezi desteklemek için öne sürülen **mantıksal öncüller bütünü** argümandır; bu iddiayı gerekçelerle ortaya koymaya ise **temellendirme** denir.\n💡 Hile: 'Öncüller + sonuç' = argüman; 'gerekçe/dayanak sunma' = temellendirme; ikisi bir arada sorulur.",
        "pattern": '\\bargüman\\b|\\bargümanlar\\b|\\btemellendirme\\b',
    },
    {
        "id": 'fel1_ontoloji_varlik',
        "term": 'Ontoloji (Varlık Felsefesi)',
        "sayfa": 60,
        "tanim": "Varlığın **var olup olmadığını, özünü ve ilk nedenini** sorgulayan disiplindir; İbn Haldun'un 'varlık nedir?' sorusundan hareketle toplumu çözümlemesi gibi.\n💡 Hile: 'Varlık' kelimesi geçiyorsa ontoloji; 'töz, idea, fenomen, madde-ruh' kavramları bu disiplinin anahtarlarıdır.",
        "pattern": '\\bontoloji\\b|\\bvarlık felsefesi\\b',
    },
    {
        "id": 'fel1_epistemoloji_bilgi',
        "term": 'Epistemoloji (Bilgi Felsefesi)',
        "sayfa": 74,
        "tanim": "Bilginin **kaynağını, sınırını ve doğruluk ölçütlerini** araştıran disiplindir; tıpkı bir siber güvenlik uzmanının 'bu bilgi gerçek mi, kaynağı ne?' diye sorması gibi.\n💡 Hile: 'Bilgi' kelimesi = epistemoloji; 'uygunluk, tutarlılık, apaçıklık, yarar, tümel uzlaşım' doğruluk ölçütleridir.",
        "pattern": '\\bepistemoloji\\b|\\bbilgi felsefesi\\b',
    },
    {
        "id": 'fel1_etik_ahlak_felsefesi',
        "term": 'Etik (Ahlak Felsefesi)',
        "sayfa": 86,
        "tanim": "İnsan eylemlerinin **ahlaki temelini**, iyi-kötü doğasını, erdem, vicdan ve sorumluluğu inceleyen disiplindir; Ahilik teşkilatının 'eline, diline, beline sahip ol' ilkesi tam da bu felsefenin pratiğidir.\n💡 Hile: 'Ahlak felsefesi' = etik; 'iyi-kötü, erdem, vicdan, özgürlük, sorumluluk' kavramları bu disipline aittir.",
        "pattern": '\\betik\\b|\\bahlak felsefesi\\b|\\bmeslek etiği\\b',
    },
    {
        "id": 'fel_antik_yunan_filozoflari',
        "term": 'İlk Çağ Filozofları (Thales, Sokrates, Platon, Aristoteles)',
        "sayfa": 30,
        "tanim": "Thales arkhe'yi su sayar; Sokrates sorgulama ustasıdır; Platon İdealar dünyasını; Aristoteles Madde-Form ve Altın Orta'yı savunur.\n💡 Hile: Arkhe = Su diyen ilk filozof = **Thales**. 'Bildiğim tek şey hiçbir şey bilmediğimdir' = **Sokrates**. İdealar Mağarası = **Platon**. Mantığın kurucusu ve Altın Orta = **Aristoteles**.",
        "pattern": '\\bthales\\b|\\bsokrates[a-zçğıöşü]*\\b|\\bplaton[a-zçğıöşü]*\\b|\\baristoteles[a-zçğıöşü]*\\b|\\bherakleitos\\b|\\bThales\\b|\\bSokrates\\b|\\bPlaton\\b|\\bAristoteles\\b|\\bHerakleitos\\b',
        "option_only_pattern": '^Thales$|^Sokrates$|^Platon$|^Aristoteles$|^Herakleitos$',
    },
    {
        "id": 'fel_epistemoloji_akimlari',
        "term": 'Bilgi Felsefesi Akımları (Rasyonalizm, Empirizm, Kritisizm)',
        "sayfa": 65,
        "tanim": "Bilginin kaynağı akıldır diyen Rasyonalizm; deneydir diyen Empirizm (Locke: Tabula rasa); akıl ile deneyi birleştiren Kritisizmdir (Kant).\n💡 Hile: Akıl = **Rasyonalizm**. Zihin boş levhadır (Tabula rasa) = **Empirizm**. İkisini birleştiren ('Kavramsız görüler kördür') = **Kant (Kritisizm)**.",
        "pattern": '\\brasyonalizm[a-zçğıöşü]*\\b|\\bempirizm[a-zçğıöşü]*\\b|\\bkritisizm[a-zçğıöşü]*\\b|\\bpozitivizm[a-zçğıöşü]*\\b|\\bRasyonalizm\\b|\\bEmpirizm\\b|\\bKritisizm\\b|\\bPozitivizm\\b|\\bKant\\b',
        "option_only_pattern": '^Rasyonalizm$|^Empirizm$|^Kritisizm$|^Pozitivizm$|^Kant$',
    },
]
