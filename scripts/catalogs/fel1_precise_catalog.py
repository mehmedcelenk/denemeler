#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""MEB Felsefe 1 (10. Sınıf 1. Dönem) Yüksek Hassasiyetli Kanonik Kavram ve Terim Sözlüğü."""

from typing import Any, Dict, List, Tuple

PRECISE_FEL1_CONCEPTS: List[Dict[str, Any]] = [
    {
        "id": "fel1_felsefe_ve_hikmet",
        "term": "Felsefe ve Hikmet (Philosophia)",
        "sayfa": 14,
        "tanim": "Felsefe, Yunanca **philia** (sevgi) + **sophia** (bilgelik) birleşimiyle 'bilgelik sevgisi'dir; tıpkı Yunus Emre'nin 'ilim ilim bilmektir, ilim kendin bilmektir' dizelerindeki hakikat arayışı gibi. Doğu-İslam dünyasında bu arayış **hikmet** kavramıyla karşılanır.\n💡 Sınav Şifresi: 'Sevgi' kelimesi geçiyorsa felsefe, 'künh/derinlik/hakikat' vurgusu varsa hikmet — ikisi aynı kapıya çıkar.",
        "pattern": r"philosophia|bilgelik sevgisi|hikmet|felsefe yapmak sürekli yolda|nerede bir insan varsa orada felsefe",
    },
    {
        "id": "fel1_refleksif_dusunme",
        "term": "Refleksif Olma (Düşünce Üzerine Düşünme)",
        "sayfa": 18,
        "tanim": "Zihnin kendi ürettiği düşünceye geri dönüp onu **eleştirel süzgeçten** geçirmesidir; sinemadaki **flashback** gibi düşüncenin kendi geçmişine bakıp 'ben bunu neden böyle düşündüm?' demesi.\n💡 Sınav Şifresi: 'Düşünce üzerine düşünme' veya 'kendine dönme' ifadesi = refleksif; başkasını değil kendini sorgular.",
        "pattern": r"refleksif olma|refleksifliği|refleksif|düşünceler hakkında düşünürler|düşünce üzerine düşün",
    },
    {
        "id": "fel1_rasyonel_ve_tutarlilik",
        "term": "Rasyonel Olma ve Mantıksal Tutarlılık",
        "sayfa": 20,
        "tanim": "Felsefi iddiaların **akıl yürütme kurallarına** uygun temellendirilmesi (rasyonellik) ve bir sistemin önermelerinin birbiriyle **çelişmemesi** (tutarlılık) demektir; tıpkı bir yapay zekâ algoritmasının kendi kodlarıyla çelişmemesi gibi.\n💡 Sınav Şifresi: 'Akla uygunluk' = rasyonellik, 'kendi içinde çelişmezlik' = tutarlılık; ikisini karıştırma, biri akıl diğeri ahenk.",
        "pattern": r"rasyonel olma|rasyonel|tutarlılık|mantıksal bir bütünün|çelişiklik",
    },
    {
        "id": "fel1_kumulatif_yigilimli",
        "term": "Yığılımlı (Kümülatif) İlerleme",
        "sayfa": 22,
        "tanim": "Felsefede yeni görüşler eskileri **çürütmez**, aksine üst üste yığılarak zenginleşir; tıpkı Orhun Yazıtları'ndan günümüze Türk düşüncesinin katman katman birikmesi gibi.\n💡 Sınav Şifresi: Bilimde 'eskiyi çürütme', felsefede 'yan yana birikme' — 'yığılımlı/kümülatif' kelimesi felsefenin anahtarıdır.",
        "pattern": r"yığılımlı ilerleme|yığılımlı|kümülatif",
    },
    {
        "id": "fel1_bilgi_ve_onerme",
        "term": "Bilgi, Önerme ve Doğruluk",
        "sayfa": 32,
        "tanim": "**Bilgi**, bilen özne (süje) ile bilinen nesne (obje) arasındaki bağdan doğar; **önerme** ise kesin yargı bildiren ve 'doğru/yanlış' değeri alabilen cümledir (soru, ünlem, istek cümleleri önerme değildir).\n💡 Sınav Şifresi: 'Doğru-yanlış değeri alabilen yargı cümlesi' = önerme; 'Hava nasıl?' önerme değil, 'Hava güzel.' önermedir.",
        "pattern": r"özne ile nesne arasındaki ilişki|en az iki terimden oluşan|doğruluk değeri taşıyan|önerme|önermeler",
    },
    {
        "id": "fel1_tumdengelim_deduksiyon",
        "term": "Tümdengelim (Dedüksiyon)",
        "sayfa": 42,
        "tanim": "**Genelden özele** inen, öncüller doğruysa sonucun **zorunlu** çıktığı akıl yürütmedir; Harezmi'nin cebirde genel kuraldan özel sayıya inmesi gibi.\n💡 Sınav Şifresi: 'Bütün insanlar ölümlü → Sokrates insan → Sokrates ölümlü' klasik tümdengelim; 'zorunlu sonuç' ve 'genelden özele' ifadeleri anahtar.",
        "pattern": r"tümdengelim|tümdengelimi|sonuç, öncüllerden zorunlu olarak",
    },
    {
        "id": "fel1_tumevarim_enduksiyon",
        "term": "Tümevarım (Endüksiyon)",
        "sayfa": 44,
        "tanim": "**Tek tek gözlemlerden genel yasaya** ulaşan, sonucu öncülleri aştığı için **olasılıklı** bilgi veren yöntemdir; tıpkı her gün güneşin doğmasını gözleyip 'güneş her gün doğar' yasasına varmak gibi.\n💡 Sınav Şifresi: 'Özelden genele' + 'olasılık' = tümevarım; kesinlik yoktur, deney ve gözlem vardır.",
        "pattern": r"tümevarım|tümevarımla|özel durumlardan genel ilkelere|tek tek durumlar gözlenerek",
    },
    {
        "id": "fel1_analoji_benzesim",
        "term": "Analoji (Benzeşim)",
        "sayfa": 46,
        "tanim": "İki farklı şey arasındaki **benzerlikten** yola çıkarak birindeki özelliği diğerine taşıma akıl yürütmesidir; tıpkı 'kalp pompa gibidir' derken organı makineye benzetmemiz gibi.\n💡 Sınav Şifresi: 'Benzeşim' kelimesi = analoji; kesinlik iddiası yoktur, benzerlikten hareket eder, olasılıklıdır.",
        "pattern": r"analoji|ortak olan özelliğe veya benzerliğe dayanarak",
    },
    {
        "id": "fel1_arguman_ve_gorus",
        "term": "Argüman ve Temellendirme",
        "sayfa": 48,
        "tanim": "Bir tezi desteklemek için öne sürülen **mantıksal öncüller bütünü** argümandır; bu iddiayı gerekçelerle ortaya koymaya ise **temellendirme** denir.\n💡 Sınav Şifresi: 'Öncüller + sonuç' = argüman; 'gerekçe/dayanak sunma' = temellendirme; ikisi bir arada sorulur.",
        "pattern": r"\\\\bargüman\\\\b|\\\\bargümanlar\\\\b|temellendirme",
    },
    {
        "id": "fel1_ontoloji_varlik",
        "term": "Ontoloji (Varlık Felsefesi)",
        "sayfa": 60,
        "tanim": "Varlığın **var olup olmadığını, özünü ve ilk nedenini** sorgulayan disiplindir; İbn Haldun'un 'varlık nedir?' sorusundan hareketle toplumu çözümlemesi gibi.\n💡 Sınav Şifresi: 'Varlık' kelimesi geçiyorsa ontoloji; 'töz, idea, fenomen, madde-ruh' kavramları bu disiplinin anahtarlarıdır.",
        "pattern": r"ontoloji|varlık felsefesi",
    },
    {
        "id": "fel1_epistemoloji_bilgi",
        "term": "Epistemoloji (Bilgi Felsefesi)",
        "sayfa": 74,
        "tanim": "Bilginin **kaynağını, sınırını ve doğruluk ölçütlerini** araştıran disiplindir; tıpkı bir siber güvenlik uzmanının 'bu bilgi gerçek mi, kaynağı ne?' diye sorması gibi.\n💡 Sınav Şifresi: 'Bilgi' kelimesi = epistemoloji; 'uygunluk, tutarlılık, apaçıklık, yarar, tümel uzlaşım' doğruluk ölçütleridir.",
        "pattern": r"epistemoloji|bilgi felsefesi",
    },
    {
        "id": "fel1_etik_ahlak_felsefesi",
        "term": "Etik (Ahlak Felsefesi)",
        "sayfa": 86,
        "tanim": "İnsan eylemlerinin **ahlaki temelini**, iyi-kötü doğasını, erdem, vicdan ve sorumluluğu inceleyen disiplindir; Ahilik teşkilatının 'eline, diline, beline sahip ol' ilkesi tam da bu felsefenin pratiğidir.\n💡 Sınav Şifresi: 'Ahlak felsefesi' = etik; 'iyi-kötü, erdem, vicdan, özgürlük, sorumluluk' kavramları bu disipline aittir.",
        "pattern": r"\\\\betik\\\\b|ahlak felsefesi|meslek etiği",
    },
]
