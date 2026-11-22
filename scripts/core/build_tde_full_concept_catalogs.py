#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""TDE 1-8 Tam Kapsamlı Kavram, Eser, Yazar ve Dil Bilgisi Katalog Üretici + EVREN '💡 Hile:' Motoru.

1. `data/concepts/TDE_1..8_concepts.json` içindeki mevcut 469 kavramın:
   - Çoklu kaçışlı (`\\\\\\\\b`, `\\\\b`) regex örüntülerini tek kaçışlı `\b` sınırına dönüştürür.
   - Morfolojik sahte pozitifleri (`masal` vs `masalar`, `roman` vs `Romanya`, `makta` vs `-makta`, `tarihsel` vs `tarihsel eleştiri`)
     negative lookahead ile korur.
   - Tek kelimelik çapalı (`^...$`) şık örüntülerini `option_only_pattern` ve `stem_context_pattern` alanlarına ayırır.
   - Dar kalmış edebî sanat, akım ve tür örüntülerini hem soru köklerinde hem şıklarda yakalayacak şekilde genişletir.
2. `TDE.json` içindeki 656 soru ve 2.624 şıkta geçen ancak kataloglarda eksik olan ~150+ kavram, yazar, eser, edebî dönem,
   anlatım bozukluğu, anlam değişmesi, fiil çatısı/yapısı ve noktalama terimini `docs/dersler/tde/tde_1..8/tde_1..8.md`
   sayfa numaralarıyla ilgili dönem kataloglarına ekler.
3. Tüm tanımlardaki `💡 Sınav Şifresi:` etiketini `💡 Hile:` olarak günceller ve EVREN (`deepseek-v4.1-flash`) ile
   "normalde çok zor veya karıştırılan bir şeyi deha bir akılla saniyeler içinde kolaycık çözdüren" gerçek hilelere dönüştürür.
4. `scripts/catalogs/tde1..8_precise_catalog.py` dosyalarını da güncel kataloglarla senkronize eder.
"""

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
import re
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from scripts.core.evren_client import EvrenClient
from scripts.core.evren_tde_grammar_xray_pipeline import extract_json_object

CONCEPTS_DIR = ROOT_DIR / "data" / "concepts"
CATALOGS_DIR = ROOT_DIR / "scripts" / "catalogs"
DOCS_TDE_DIR = ROOT_DIR / "docs" / "dersler" / "tde"
HILE_STATE_PATH = CONCEPTS_DIR / "tde_hile_refinement_state.json"

DERS_NAMES = {
    1: "TÜRK DİLİ VE EDEBİYATI – 1",
    2: "TÜRK DİLİ VE EDEBİYATI – 2",
    3: "TÜRK DİLİ VE EDEBİYATI – 3",
    4: "TÜRK DİLİ VE EDEBİYATI – 4",
    5: "TÜRK DİLİ VE EDEBİYATI – 5",
    6: "TÜRK DİLİ VE EDEBİYATI – 6",
    7: "TÜRK DİLİ VE EDEBİYATI – 7",
    8: "TÜRK DİLİ VE EDEBİYATI – 8",
}

# Bağlama bağımlı tek kelimelik şıkların soru kökünde arayacağı üst kategori örüntüleri
STEM_CONTEXT_BY_ANCHOR: Dict[str, str] = {
    "^Özel$": r"isim|ad\b",
    "^Cins$": r"isim|ad\b",
    "^Serim$": r"bölüm|hikâye|öykü|roman|masal|fabl|olay",
    "^Düğüm$": r"bölüm|hikâye|öykü|roman|masal|fabl|olay",
    "^Çözüm$": r"bölüm|hikâye|öykü|roman|masal|fabl|olay",
    "^Döşeme$": r"bölüm|masal|tekerleme",
    "^Dilek$": r"bölüm|masal|kip",
    "^Öğüt$": r"bölüm|fabl|masal",
    "^Asıl Masal$": r"bölüm|masal",
    "^Tam$": r"kafiye|uyak",
    "^Yarım$": r"kafiye|uyak",
    "^Zengin$": r"kafiye|uyak",
    "^Cinaslı$": r"kafiye|uyak",
    "^Cinasli$": r"kafiye|uyak",
    "^Tunç$": r"kafiye|uyak",
    "^Niteleme$": r"sıfat|ön ad",
    "^Belgisiz$": r"sıfat|ön ad|zamir|adıl",
    "^İşaret$": r"sıfat|ön ad|zamir|adıl",
    "^Soru$": r"sıfat|ön ad|zamir|adıl|zarf|belirteç",
    "^Sayı$": r"sıfat|ön ad",
    "^İş$": r"fiil|eylem",
    "^Durum$": r"fiil|eylem|zarf|belirteç|hikâye|öykü",
    "^Yer-yön$": r"zarf|belirteç",
    "^Miktar$": r"zarf|belirteç",
    "^Işık$": r"motif|destan|efsane",
    "^Ağaç$": r"motif|destan|efsane",
    "^Mağara$": r"motif|destan|efsane",
    "^Coğrafya$": r"bilim|ilişki|yararlan|disiplin",
    "^Felsefe$": r"bilim|ilişki|yararlan|disiplin|düşünce",
    "^Sosyoloji$": r"bilim|ilişki|yararlan|disiplin|toplum",
    "^Psikoloji$": r"bilim|ilişki|yararlan|disiplin|ruh",
    "^Tarih$": r"bilim|ilişki|yararlan|disiplin|tarih",
    "^Mukaddime$": r"karagöz|orta oyunu|bölüm|gölge",
    "^Muhavere$": r"karagöz|orta oyunu|bölüm|gölge|söyleşme",
    "^Fasıl$": r"karagöz|orta oyunu|bölüm|gölge",
    "^Bitiş$": r"karagöz|orta oyunu|bölüm|gölge",
    "^Ne\\?$": r"5n1k|haber|soru",
    "^Kim\\?$": r"5n1k|haber|soru",
    "^Nerede\\?$": r"5n1k|haber|soru",
    "^Ne zaman\\?$": r"5n1k|haber|soru",
    "^Nasıl\\?$": r"5n1k|haber|soru",
    "^Neden\\?$": r"5n1k|haber|soru",
    "^Kişisel$": r"blog|günlük",
    "^Temasal$": r"blog",
    "^Topluluk$": r"blog|isim|ad\b",
    "^Şirket$": r"blog",
    "^Kurumsal$": r"blog",
    "^Edebî$": r"mektup|metin",
    "^Resmî$": r"mektup|yazı",
    "^Tarihsel$": r"eleştiri|tenkit",
    "^İzlenimsel$": r"eleştiri|tenkit",
    "^Olay$": r"unsur|hikâye|öykü|roman|masal|fabl|tiyatro|anlatı",
    "^Kişi$": r"unsur|hikâye|öykü|roman|masal|fabl|tiyatro|anlatı|zamir",
    "^Kişiler$": r"unsur|hikâye|öykü|roman|masal|fabl|tiyatro|anlatı",
    "^Zaman$": r"unsur|hikâye|öykü|roman|masal|fabl|tiyatro|anlatı|zarf",
    "^Mekân$": r"unsur|hikâye|öykü|roman|masal|fabl|tiyatro|anlatı",
    "^Mekan$": r"unsur|hikâye|öykü|roman|masal|fabl|tiyatro|anlatı",
}

# Özel pattern genişletmeleri ve morfolojik korumalar (id -> yeni pattern)
PATTERN_OVERRIDES: Dict[str, Dict[str, str]] = {
    "tde1_zamir": {
        "pattern": r"\bzamir[a-zçğıöşü]*\b|\badıl[a-zçğıöşü]*\b",
    },
    "tde1_hikaye": {
        "pattern": r"\bhikâye[a-zçğıöşü]*\b|\bhikaye[a-zçğıöşü]*\b|\böykü(?!n)[a-zçğıöşü]*\b",
    },
    "tde7_hikaye": {
        "pattern": r"\bhikâye[a-zçğıöşü]*\b|\bhikaye[a-zçğıöşü]*\b|\böykü(?!n)[a-zçğıöşü]*\b",
    },
    "tde1_deneme": {
        "pattern": r"\bdeneme(?!k\b|z|y[eaıi]|di|miş|se|m\b|mde\b|mden\b|miz\b|n\b|nde\b|si\b|sinde\b)[a-zçğıöşü]*\b",
        "option_only_pattern": r"^Deneme$",
    },
    "tde8_deneme": {
        "pattern": r"\bdeneme(?!k\b|z|y[eaıi]|di|miş|se|m\b|mde\b|mden\b|miz\b|n\b|nde\b|si\b|sinde\b)[a-zçğıöşü]*\b",
        "option_only_pattern": r"^Deneme$",
    },
    "tde1_ani": {
        "pattern": r"\bhatıra[a-zçğıöşü]*\b|\banı\s+türü\b|\banılar(?:ı|ım|ımız|ın|ınız|ını|ınızı|ından|ıyla|la|da|dan|a)?\b",
        "option_only_pattern": r"^Anı$|^Hatıra$",
    },
    "tde2_sohbet": {
        "pattern": r"\bsohbet\s+türü[a-zçğıöşü]*\b|\bsöyleşi[a-zçğıöşü]*\b",
        "option_only_pattern": r"^Sohbet$|^Söyleşi$",
    },
    "tde3_sohbet_soylesi": {
        "pattern": r"\bsohbet\s+türü[a-zçğıöşü]*\b|\bsöyleşi[a-zçğıöşü]*\b",
        "option_only_pattern": r"^Sohbet$|^Söyleşi$",
    },
    "tde5_sohbet": {
        "pattern": r"\bsohbet\s+türü[a-zçğıöşü]*\b|\bsöyleşi[a-zçğıöşü]*\b",
        "option_only_pattern": r"^Sohbet$|^Söyleşi$",
    },
    "tde3_masal_bolumleri": {
        "pattern": r"\b(?:döşeme|serim|düğüm|çözüm|dilek)(?:-(?:döşeme|serim|düğüm|çözüm|dilek)){3,4}\b|\bmasalın\s+bölümleri\b|\bdöşeme,\s*serim\b",
    },
    "tde1_elestiri": {
        "pattern": r"\beleştiri(?!l|r)[a-zçğıöşü]*\b|\btenkit[a-zçğıöşü]*\b",
    },
    "tde6_elestiri": {
        "pattern": r"\beleştiri(?!l|r)[a-zçğıöşü]*\b|\btenkit[a-zçğıöşü]*\b",
    },
    "tde2_dekor": {
        "pattern": r"\bdekor(?!asyon|lan)[a-zçğıöşü]*\b",
    },
    "tde6_dekor": {
        "pattern": r"\bdekor(?!asyon|lan)[a-zçğıöşü]*\b",
    },
    "tde2_gunluk": {
        "pattern": r"\bgünce(?!l)[a-zçğıöşü]*\b|\bgünlük\s+türü\b",
        "option_only_pattern": r"^Günlük$|^Gunluk$",
    },
    "tde3_kosma": {
        "pattern": r"\bkoşma(?!k|l[ıi]|m[aı]|z|y[aı])[a-zçğıöşü]*\b",
    },
    "tde1_masal": {
        "pattern": r"\bmasal(?!ar\b|ar[aıi]|ara\b|arda\b|ardan\b|arın\b)[a-zçğıöşü]*\b",
    },
    "tde1_roman": {
        "pattern": r"\broman(?!ya|larca)[a-zçğıöşü]*\b",
    },
    "tde4_roman": {
        "pattern": r"\broman(?!ya|larca)[a-zçğıöşü]*\b",
    },
    "tde6_roman": {
        "pattern": r"\broman(?!ya|larca)[a-zçğıöşü]*\b",
    },
    "tde8_roman": {
        "pattern": r"\broman(?!ya|larca)[a-zçğıöşü]*\b",
    },
    "tde3_makta": {
        "pattern": r"\bmakta\s+bey[a-zçğıöşü]*\b|\bmakta(?:sı|da|dan|yı|ya|dır)?\b",
        "option_only_pattern": r"^Makta$",
    },
    "tde3_matla": {
        "pattern": r"\bmatla\s+bey[a-zçğıöşü]*\b|\bmatla\s+bölüm[a-zçğıöşü]*\b|\bmatla(?:sı|da|dan|yı|ya|dır)?\b",
        "option_only_pattern": r"^Matla$",
    },
    "tde6_tarihsel_elestiri": {
        "pattern": r"\btarihsel\s+eleştiri[a-zçğıöşü]*\b",
        "option_only_pattern": r"^Tarihsel$",
        "stem_context_pattern": r"eleştiri|tenkit",
    },
    "tde6_okura_donuk_elestiri": {
        "pattern": r"\bokura\s+dönük\b|\bokura\s+yönelik\b|\bizlenimci\s+eleştiri\b|\bizlenimsel\s+eleştiri\b",
        "option_only_pattern": r"^Okura dönük$|^İzlenimsel$",
        "stem_context_pattern": r"eleştiri|tenkit",
    },
    "tde1_lirik_siir": {
        "pattern": r"\blirik\s+şiir[a-zçğıöşü]*\b|\blirik\s+bir\s+söyleyiş\b|\blirik\s*\(coşkulu\)|\btürü\s+liriktir\b|\blirik\b",
        "option_only_pattern": r"^Lirik$",
    },
    "tde1_epik_siir": {
        "pattern": r"\bepik\s+şiir[a-zçğıöşü]*\b|\bepik\s*\(destansı\)|\bepik\b",
        "option_only_pattern": r"^Epik$",
    },
    "tde1_pastoral_siir": {
        "pattern": r"\bpastoral\s+şiir[a-zçğıöşü]*\b|\bpastoral\s*\(doğa\)|\bpastoral\b",
        "option_only_pattern": r"^Pastoral$",
    },
    "tde1_didaktik_siir": {
        "pattern": r"\bdidaktik\s+şiir[a-zçğıöşü]*\b|\bdidaktik\s+türde\b|\bdidaktik\b",
        "option_only_pattern": r"^Didaktik$",
    },
    "tde1_satirik_siir": {
        "pattern": r"\bsatirik\s+şiir[a-zçğıöşü]*\b|\bsatirik\s*\(yergici\)|\bsatirik\b",
        "option_only_pattern": r"^Satirik$",
    },
    "tde1_oykuleyici_anlatim": {
        "pattern": r"\böyküleyici\s+anlatım[a-zçğıöşü]*\b|\böyküleme(?:den|ye|dir)?\b",
        "option_only_pattern": r"^Öyküleyici$|^Öyküleme$|\bÖyküleyici\b",
        "stem_context_pattern": r"anlatım|biçim|düşünceyi|parça",
    },
    "tde1_betimleyici_anlatim": {
        "pattern": r"\bbetimleyici\s+anlatım[a-zçğıöşü]*\b|\bbetimleyici\s+ögeler[a-zçğıöşü]*\b|\bbetimleme(?:den|ye|dir|\s+yapılmıştır)?\b|\bmekân\s+betimlenerek\b",
        "option_only_pattern": r"^Betimleyici$|^Betimleme$|\bBetimleyici\b",
        "stem_context_pattern": r"anlatım|biçim|düşünceyi|parça",
    },
    "tde1_aciklayici_anlatim": {
        "pattern": r"\baçıklayıcı\s+anlatım[a-zçğıöşü]*\b|\baçıklama\s+yapılmıştır\b",
        "option_only_pattern": r"^Açıklayıcı$|^Açıklama$|\bAçıklayıcı\b",
        "stem_context_pattern": r"anlatım|biçim|düşünceyi|parça",
    },
    "tde1_tartismaci_anlatim": {
        "pattern": r"\btartışmacı\s+anlatım[a-zçğıöşü]*\b",
        "option_only_pattern": r"^Tartışmacı$|^Tartışma$|\bTartışmacı\b",
        "stem_context_pattern": r"anlatım|biçim|düşünceyi|parça",
    },
    "tde1_tanimlama": {
        "pattern": r"\btanımlama\s+yapılmıştır\b|\btanımlamadan\s+yararlanılmıştır\b",
        "option_only_pattern": r"^Tanımlama$",
    },
    "tde1_ornekleme": {
        "pattern": r"\börneklemeye\s+yer\s+verilmiştir\b|\börneklendirmeden\s+yararlanılmıştır\b|\börneklendirme\b",
        "option_only_pattern": r"^Örneklendirme$|^Örnekleme$",
    },
    "tde1_tanik_gosterme": {
        "pattern": r"\btanık\s+gösterme[a-zçğıöşü]*\b",
        "option_only_pattern": r"^Tanık gösterme$",
    },
    "tde1_karsilastirma": {
        "pattern": r"\bkarşılaştırma(?:ya\s+yer\s+verilmiştir|\s+yapılmıştır|dan\s+yararlanılmıştır)\b",
        "option_only_pattern": r"^Karşılaştırma$",
    },
    "tde1_teshis": {
        "pattern": r"\bteşhis[a-zçğıöşü]*\b|\bkişileştirme[a-zçğıöşü]*\b",
    },
    "tde1_intak": {
        "pattern": r"\bintak[a-zçğıöşü]*\b|\bkonuşturma\s+sanatı[a-zçğıöşü]*\b",
    },
    "tde1_tesbih": {
        "pattern": r"\bteşbih[a-zçğıöşü]*\b|\bbenzetme\s+sanatı[a-zçğıöşü]*\b|\bbenzetmeye\s+(?:yer\s+verilmiştir|başvurulmuştur)\b|\bbenzetmeden\s+yararlanılmıştır\b|\bbenzetme\s+yapılmıştır\b",
        "option_only_pattern": r"^Benzetme$",
    },
    "tde1_tezat": {
        "pattern": r"\btezat[a-zçğıöşü]*\b|\bkarşıtlık\s+sanatı[a-zçğıöşü]*\b",
    },
    "tde1_husnutalil": {
        "pattern": r"\bhüsnütalil[a-zçğıöşü]*\b|\bhüsn-i\s*talil[a-zçğıöşü]*\b|\bgüzel\s+nedene\s+bağlama\b",
    },
    "tde1_mubalaga": {
        "pattern": r"\bmübalağa[a-zçğıöşü]*\b|\babartma\s+sanatı[a-zçğıöşü]*\b|\babartma\s*\(mübalağa\)",
    },
    "tde2_tecahuluarif": {
        "pattern": r"\btecahülüarif[a-zçğıöşü]*\b|\btecâhül-i\s*ârif[a-zçğıöşü]*\b|\bbilmezden\s+gelme\b",
    },
    "tde2_telmih": {
        "pattern": r"\btelmih[a-zçğıöşü]*\b|\bhatırlatma\s+sanatı[a-zçğıöşü]*\b|\bhatırlatma\s*\(telmih\)",
    },
    "tde5_telmih": {
        "pattern": r"\btelmih[a-zçğıöşü]*\b|\bhatırlatma\s+sanatı[a-zçğıöşü]*\b|\bhatırlatma\s*\(telmih\)",
    },
    "tde2_tenasup": {
        "pattern": r"\btenasüp[a-zçğıöşü]*\b|\btenâsüp[a-zçğıöşü]*\b|\buygunluk\s+sanatı[a-zçğıöşü]*\b",
    },
    "tde3_istifham": {
        "pattern": r"\bistifham[a-zçğıöşü]*\b|\bsoru\s+sorma\s+sanatı\b",
    },
    "tde3_nida": {
        "pattern": r"\bnida\s+sanatı\b|\bnida\s*-\s*istifham\b",
        "option_only_pattern": r"^Nida$",
    },
    "tde5_tariz": {
        "pattern": r"\btariz[a-zçğıöşü]*\b|\biğneleme\s+sanatı\b",
    },
    "tde5_tevriye": {
        "pattern": r"\btevriye[a-zçğıöşü]*\b",
    },
    "tde5_realizm": {
        "pattern": r"\brealizm[a-zçğıöşü]*\b|\brealist\b",
    },
    "tde5_romantizm": {
        "pattern": r"\bromantizm[a-zçğıöşü]*\b|\bromantik\b",
    },
    "tde5_klasisizm": {
        "pattern": r"\bklasisizm[a-zçğıöşü]*\b|\bklasik\s+akım\b",
    },
    "tde5_naturalizm": {
        "pattern": r"\bnatüralizm[a-zçğıöşü]*\b|\bnaturalizm[a-zçğıöşü]*\b|\bnatüralist\b",
    },
    "tde5_surrealizm": {
        "pattern": r"\bsürrealizm[a-zçğıöşü]*\b|\bsurrealizm[a-zçğıöşü]*\b|\bsürrealist\b",
    },
    "tde5_dadaizm": {
        "pattern": r"\bdadaizm[a-zçğıöşü]*\b|\bdadaist\b",
    },
    "tde5_sembolizm": {
        "pattern": r"\bsembolizm[a-zçğıöşü]*\b|\bsembolist\b",
    },
    "tde5_parnasizm": {
        "pattern": r"\bparnasizm[a-zçğıöşü]*\b|\bparnasyen\b",
    },
    "tde2_ozetleme": {
        "pattern": r"\bözetleme\s+tekniği[a-zçğıöşü]*\b",
        "option_only_pattern": r"^Özetleme$",
    },
    "tde6_ozetleme": {
        "pattern": r"\bözetleme\s+tekniği[a-zçğıöşü]*\b",
        "option_only_pattern": r"^Özetleme$",
    },
    "tde2_parodi": {
        "pattern": r"\bparodi[a-zçğıöşü]*\b",
    },
    "tde8_parodi": {
        "pattern": r"\bparodi[a-zçğıöşü]*\b",
    },
    "tde2_pastis": {
        "pattern": r"\bpastiş[a-zçğıöşü]*\b|\bpastis[a-zçğıöşü]*\b",
    },
    "tde8_pastis": {
        "pattern": r"\bpastiş[a-zçğıöşü]*\b|\bpastis[a-zçğıöşü]*\b",
    },
    "tde4_kavuklu": {
        "pattern": r"\bkavuklu[a-zçğıöşü]*\b",
    },
    "tde4_zenne": {
        "pattern": r"\bzenne[a-zçğıöşü]*\b",
    },
    "tde4_mukaddime": {
        "pattern": r"\bmukaddime[a-zçğıöşü]*\b",
    },
    "tde4_muhavere": {
        "pattern": r"\bmuhavere[a-zçğıöşü]*\b",
    },
    "tde4_fasil": {
        "pattern": r"\bfasıl\s+bölümü[a-zçğıöşü]*\b",
        "option_only_pattern": r"^Fasıl$",
    },
    "tde4_bitis": {
        "pattern": r"\bbitiş\s+bölümü[a-zçğıöşü]*\b",
        "option_only_pattern": r"^Bitiş$",
    },
    "tde6_kelimenin_yanlis_yerde": {
        "pattern": r"\b(?:kelimenin|sözcüğün)\s+yanlış\s+yerde\s+kullanılması\b",
    },
    "tde6_kelimenin_yanlis_anlamda": {
        "pattern": r"\b(?:kelimenin|sözcüğün)\s+yanlış\s+anlamda\s+kullanılması\b",
    },
    "tde6_gereksiz_sozcuk": {
        "pattern": r"\bgereksiz\s+sözcük\s+kullanı(?:mı|lması)\b|\bcümleden\s+atılarak\b",
    },
    "tde6_celisen_sozcukler": {
        "pattern": r"\banlamca\s+çelişen\s+sözcüklerin\b|\bçelişen\s+söz(?:cük)?lerin\b",
    },
    "tde6_ozne_yuklem_uyusmazligi": {
        "pattern": r"\bözne[-\s]yüklem\s+uyuş?(?:mazlığı|umsuzluğu)\b",
    },
    "tde4_devrik_cumle": {
        "pattern": r"\bdevrik\s+cümle[a-zçğıöşü]*\b|\bdevrik\s+bir\b|\böge\s+dizilişine\s+göre\s+devriktir\b",
    },
    "tde4_birlesik_cumle": {
        "pattern": r"\bbirleşik\s+cümle[a-zçğıöşü]*\b|\byapısına\s+göre\s+birleşiktir\b",
    },
    "tde4_sirali_cumle": {
        "pattern": r"\bsıralı\s+cümle[a-zçğıöşü]*\b|\byapısına\s+göre\s+sıralıdır\b",
    },
    "tde4_olumlu_cumle": {
        "pattern": r"\bolumlu\s+cümle[a-zçğıöşü]*\b|\banlamına\s+göre\s+olumludur\b",
    },
    "tde1_yazim_kurallari": {
        "pattern": r"^__DISABLED_META_DIRECTIVE__$",
    },
    "tde1_noktalama": {
        "pattern": r"^__DISABLED_META_DIRECTIVE__$",
    },
    "tde3_yazim_kurallari": {
        "pattern": r"^__DISABLED_META_DIRECTIVE__$",
    },
    "tde3_noktalama": {
        "pattern": r"^__DISABLED_META_DIRECTIVE__$",
    },
    "tde4_cumlede_yapi": {
        "pattern": r"^__DISABLED_META_DIRECTIVE__$",
    },
    "tde5_ogelerine_ayirma": {
        "pattern": r"^__DISABLED_META_DIRECTIVE__$",
    },
    "tde6_anlatim_bozuklugu": {
        "pattern": r"^__DISABLED_META_DIRECTIVE__$",
    },
}


# ---------------------------------------------------------------------------
# Eksik ~115 Yeni Kavram, Yazar, Eser, Dönem ve Dil Bilgisi Terimi (Dönem 1..8)
# ---------------------------------------------------------------------------
NEW_CONCEPTS_BY_SEMESTER: Dict[int, List[Dict[str, Any]]] = {
    1: [
        {
            "id": "tde1_olay_orgusu",
            "term": "Olay Örgüsü (Olay)",
            "sayfa": 46,
            "tanim": "Anlatmaya bağlı edebî metinlerde (hikâye, roman, masal, fabl) kahramanların başından geçen olayların **neden-sonuç zinciri** ve kurgusal bir düzen içinde birbirine bağlanmasıdır; tıpkı bir trenin vagonlarını birbirine kenetleyen kancalar gibi tek bir vagon çıksa kurgu kopar.\n💡 Hile: Günlük hayattaki rastgele vakaya **olay**, yazarın bunu merak uyandıracak şekilde neden-sonuçla dizmesine **olay örgüsü** denir; soru kökünde **'yapı unsurlarından hangisi'** diyorsa **Olay, Kişi, Zaman, Mekân** dörtlüsünü ara.",
            "pattern": r"\bolay\s+örgüsü[a-zçğıöşü]*\b",
            "option_only_pattern": r"^Olay$",
            "stem_context_pattern": r"unsur|hikâye|öykü|roman|masal|fabl|anlatı",
        },
        {
            "id": "tde1_kisi_kadrosu",
            "term": "Kişi (Şahıs Kadrosu)",
            "sayfa": 46,
            "tanim": "Hikâye, roman, masal ve tiyatroda olayları yaşayan, yönlendiren veya olaylardan etkilenen **kurmaca varlıklar (karakter ve tipler)** topluluğudur.\n💡 Hile: Kısa bir özet/parça verip **'Hangi yapı unsuru?'** diye soruyorsa: isim, unvan veya karakter özelliği varsa **Kişi**; saat/mevsim varsa **Zaman**; ev/sokak/şehir tasviri varsa **Mekân**; hareket ve eylem akışı varsa **Olay**dır.",
            "pattern": r"\bşahıs\s+kadrosu[a-zçğıöşü]*\b|\bkişi\s+kadrosu[a-zçğıöşü]*\b",
            "option_only_pattern": r"^Kişi$|^Kişiler$",
            "stem_context_pattern": r"unsur|hikâye|öykü|roman|masal|fabl|anlatı",
        },
        {
            "id": "tde1_zaman_unsuru",
            "term": "Zaman (Yapı Unsuru)",
            "sayfa": 47,
            "tanim": "Anlatmaya bağlı metinlerde olayın başlangıcı ile bitişi arasında geçen kurgusal süredir (kronolojik zaman, geriye dönüş zamanı veya kozmik/mevsimsel zaman).\n💡 Hile: Masallarda zaman **belirsizdir** ('Evvel zaman içinde, öğrenilmiş geçmiş zaman -miş'), hikâye ve romanda ise **belirgindir**. Yapı unsuru sorularında 'sabah, kış, yıllar önce, o gün' gibi tek bir vakit ipucu bile doğrudan **Zaman** şıkkını çözdürür.",
            "pattern": r"\bzaman\s+unsuru[a-zçğıöşü]*\b|\bzaman\s+belirsizdir\b|\bolayın\s+geçtiği\s+zaman\b",
            "option_only_pattern": r"^Zaman$",
            "stem_context_pattern": r"unsur|hikâye|öykü|roman|masal|fabl|anlatı|zarf",
        },
        {
            "id": "tde1_mekan_unsuru",
            "term": "Mekân (Yer Unsuru)",
            "sayfa": 47,
            "tanim": "Edebî eserde olayların geçtiği, kahramanların içinde hareket ettiği ve ruh hâllerini yansıtan **fiziksel veya kurgusal çevre/ortam**dır.\n💡 Hile: Parçada oda, sokak, kasaba, doğa veya bina betimlemesi yapılıp yapı unsuru soruluyorsa cevap **Mekân**dır; masallarda mekân **Kafdağı** gibi hayalî, realist romanlarda ise kahramanın psikolojisini ele veren gerçekçi bir aynadır.",
            "pattern": r"\bmekân\s+unsuru[a-zçğıöşü]*\b|\bzaman\s+ve\s+mekân\b|\bmekân,?\s+tasvir\b|\bmekân,?\s+ayrıntı[a-zçğıöşü]*\b",
            "option_only_pattern": r"^Mekân$|^Mekan$",
            "stem_context_pattern": r"unsur|hikâye|öykü|roman|masal|fabl|anlatı",
        },
        {
            "id": "tde1_tema",
            "term": "Tema ve Konu",
            "sayfa": 45,
            "tanim": "Bir edebî eserin merkezinde yer alan **soyut ve genel temel duygu/düşünceye tema** (aşk, yalnızlık, kahramanlık, özlem); bu soyut temanın kişi, zaman ve mekânla **somutlaştırılmış hâline ise konu** denir.\n💡 Hile: Tek kelimelik soyut kavramsa **Tema** ('kahramanlık, ayrılık'); 'kimin, nerede, ne yaşadığı' sınırlandırılmışsa **Konu**dur ('Kurtuluş Savaşı'nda bir askerin cephedeki kahramanlığı').",
            "pattern": r"\bteması\s+kahramanlıktır\b|\bbireysel\s+bir\s+tema\b|\btema\s+ve\s+konu\b",
            "option_only_pattern": r"^Tema$|^Konu$",
        },
        {
            "id": "tde1_olay_durum_hikayesi",
            "term": "Olay Hikâyesi (Maupassant) ve Durum Hikâyesi (Çehov)",
            "sayfa": 48,
            "tanim": "**Olay hikâyesi (Maupassant tarzı)** serim-düğüm-çözüm planıyla merak ve heyecana odaklanırken (Ömer Seyfettin); **Durum hikâyesi (Çehov tarzı)** serim-düğüm-çözüm kurmadan günlük yaşamdan bir **kesiti/anı** ve psikolojik atmosferi anlatır (Sait Faik Abasıyanık, Memduh Şevket Esendal).\n💡 Hile: Metni okurken **'Sonunda ne oldu?'** sorusunun cevabı varsa **Olay (Maupassant – Ömer Seyfettin)**; kamera odaya/sokağa çevrilmiş, hiçbir düğüm çözülmeden bir fotoğraf karesi gibi aniden bitiyorsa **Durum (Çehov – Sait Faik / Memduh Şevket)** hikâyesidir.",
            "pattern": r"\bolay\s+hikâye[a-zçğıöşü]*\b|\bdurum\s+hikâye[a-zçğıöşü]*\b|\bkesit\s+hikâye[a-zçğıöşü]*\b|\byalnızca\s+bir\s+anın\s+saptaması\b",
        },
        {
            "id": "tde1_istiare",
            "term": "İstiare (Eğretileme)",
            "sayfa": 89,
            "tanim": "Benzetmenin iki ana direğinden (**benzeyen** veya **kendisine benzetilen**) yalnızca **birinin** söylenip diğerinin zihinde tamamlandığı söz sanatıdır.\n💡 Hile: İki unsur da meydandaysa ('Aslan asker') **Teşbih**; sadece benzetilen varsa ('Kükreyen **aslanlar** cepheye koştu') **Açık İstiare**; sadece benzeyen var ve başka varlığın özelliği ödünç alınmışsa ('Can **kafeste** durmaz **uçar**' → kuş söylenmemiş) **Kapalı İstiare**dir.",
            "pattern": r"\bistiare[a-zçğıöşü]*\b|\beğretileme[a-zçğıöşü]*\b",
        },
        {
            "id": "tde1_mecazimursel",
            "term": "Mecazımürsel (Ad Aktarması)",
            "sayfa": 95,
            "tanim": "Benzetme amacı **güdülmeksizin** bir sözcüğün; parça-bütün, iç-dış, yazar-eser, yer-insan veya neden-sonuç ilgisiyle başka bir sözcük yerine kullanılmasıdır.\n💡 Hile: Ortada **'gibi' diyebileceğin bir benzerlik yoksa** ama biri diğerini çağrıştırıyorsa kesin **Mecazımürsel**dir ('Yahya Kemal'i okudum' = şiirini, 'Sobayı yaktım' = içindeki odunu, 'Ankara tepki gösterdi' = hükümet).",
            "pattern": r"\bmecazımürsel[a-zçğıöşü]*\b|\bad\s+aktarması[a-zçğıöşü]*\b",
        },
        {
            "id": "tde1_alegori_imge",
            "term": "Alegori ve İmgesel Dil",
            "sayfa": 76,
            "tanim": "**Alegori**, soyut bir fikrin veya ahlaki ilkenin eserin tamamında sembolik kahramanlarla somutlaştırılmasıdır (örn. *Kutadgu Bilig*, *Mantıku't-Tayr*, *Hüsn ü Aşk*); **İmge** ise şairin dış dünyayı zihninde yeniden kurgulayarak alışılmamış bağdaştırmalarla ('kederli su', 'uykusu gelen çiçek') aktarmasıdır.\n💡 Hile: Eserin tamamı baştan sona bir **semboller tiyatrosuysa** (*Kutadgu Bilig*'de Kün Togdı = Adalet) **Alegorik**; sözlükteki gerçek anlamıyla açıklanamayan şiirsel hayal kırılması varsa **İmgesel Dil**dir.",
            "pattern": r"\balegorik\s+bir\s+eserdir\b|\balegori[a-zçğıöşü]*\b|\bimgesel\s+bir\s+dil\b|\bimgesel\b",
        },
        {
            "id": "tde1_manzum_mensur",
            "term": "Manzum (Nazım) ve Mensur (Nesir / Düzyazı)",
            "sayfa": 68,
            "tanim": "Ölçülü, uyaklı ve dizeler hâlinde yazılan metinlere **manzum (nazım)**; ölçü ve kafiyeye bağlanmadan normal cümle ve paragraflarla yazılan metinlere **mensur (nesir / düzyazı)** denir.\n💡 Hile: Alt alta **dizelerle** yazılmışsa **Manzum** ('nizam/düzen' kökünden gelir); satır sonuna kadar düz cümlelerle akıyorsa **Mensur (Düzyazı)**dır.",
            "pattern": r"\bmanzum\s+olarak\b|\bmensur\s+olarak\b|\bnazım\s+ve\s+nesir\b|\bdüzyazı\s+biçiminde\b|\bnazım\s+birimi\b",
        },
        {
            "id": "tde1_kurgusallik_gerceklik",
            "term": "Kurgusallık (Kurmaca) ve Öğretici Metin Nitelikleri",
            "sayfa": 22,
            "tanim": "Edebî (sanatsal) metinler dış dünyadaki gerçekliği yazarın hayal gücüyle yeniden şekillendirdiği için **kurgusal (kurmaca)** ve çok anlamlıdır; öğretici (bilimsel) metinler ise **bilimsellik, nesnellik, eğiticilik ve tek anlamlılık** taşır.\n💡 Hile: Şıklarda **'Kurgusallık / Kurmaca'** görürsen doğrudan **Edebî (Sanatsal) Metin**; **'Bilimsellik / Nesnellik / Bilgi verme amacı'** görürsen doğrudan **Öğretici Metin** kutusuna at.",
            "pattern": r"\bkurmaca[a-zçğıöşü]*\b|\bkurgusal\s+bir\s+metindir\b|\bkurgusal\s+yazılardır\b|\bkurgusallık\b",
            "option_only_pattern": r"^Kurgusallık$|^Bilimsellik$|^Evrensellik$|^Eğiticilik$",
        },
        {
            "id": "tde1_dilin_islevleri",
            "term": "Dilin İşlevleri (Göndergesel, Heyecana Bağlı, Sanatsal/Şiirsel, Alıcıyı Harekete Geçirme)",
            "sayfa": 18,
            "tanim": "Dilin iletişimdeki amacına göre üstlendiği 6 temel görevdir: bilgi veriyorsa **Göndergesel**, duygu/coşku/üzüntü patlaması varsa **Heyecana Bağlı (Heyecan Bildirme)**, emir/istekle yönlendiriyorsa **Alıcıyı Harekete Geçirme**, edebî/çağrışımsal zevk üretiyorsa **Sanatsal (Şiirsel)**, dil bilgisini açıklıyorsa **Dil Ötesi**, iletişimi test ediyorsa **Kanalı Kontrol** işlevidir.\n💡 Hile: Ders kitabı/haber/makale = **Göndergesel**; şiir/roman = **Sanatsal (Şiirsel)**; ünlem ve duygusal coşku = **Heyecana Bağlı**; reklam/emir/çağrı = **Alıcıyı Harekete Geçirme**; dil bilgisi kuralı = **Dil Ötesi**.",
            "pattern": r"\bdilin\s+(?:göndergesel|sanatsal|şiirsel|heyecana\s+bağlı|dil\s+ötesi|alıcıyı\s+harekete\s+geçirme)\s+işlev[a-zçğıöşü]*\b|\bheyecan\s+bildirme\s+işlev[a-zçğıöşü]*\b",
        },
        {
            "id": "tde1_agiz_sive_lehce_standart",
            "term": "Standart Dil, Ağız, Şive ve Lehçe",
            "sayfa": 16,
            "tanim": "Bir ülkede eğitim ve resmî yazışmada kullanılan ortak dile **Standart (Ölçünlü) Dil**; aynı ülke içindeki bölgesel söyleyiş farklarına **Ağız (Yöresel Söyleyiş)**; yazılı dönemde ayrılmış yakın kollarına **Şive** (Azerbaycan, Özbek Türkçesi); bilinmeyen karanlık dönemlerde kopmuş uzak kollarına **Lehçe** (Çuvaşça, Yakutça) denir.\n💡 Hile: Mesafe büyüdükçe terim değişir: **Mahalle/Şehir** farkı = **Ağız** ('geliyom/gelirem'); **Yakın Türk devletleri** = **Şive**; **Çok eski ve anlaşılmaz kopuş (Çuvaş/Yakut)** = **Lehçe**.",
            "pattern": r"\byöresel\s+ağza\b|\byöresel\s+söyleyiş[a-zçğıöşü]*\b|\bstandart\s+dil[a-zçğıöşü]*\b|\bölçünlü\s+dil[a-zçğıöşü]*\b",
        },
        {
            "id": "tde1_kafiye_duzeni",
            "term": "Kafiye (Uyak) Düzeni (Düz, Çapraz, Sarmal, Mani Tipi)",
            "sayfa": 79,
            "tanim": "Dörtlük veya bentlerdeki dizelerin son seslerine göre harflendirilerek oluşturduğu simetri şemasıdır: **Düz** (`aaaa` / `aaab` / `aabb`), **Çapraz** (`abab`), **Sarmal** (`abba`), **Mani Tipi** (`aaxa`).\n💡 Hile: Dize sonlarına harf ver: **1 ve 3, 2 ve 4** aynıysa (`abab`) makas gibi kesişir = **Çapraz**; **1 ve 4** dıştan **2 ve 3**'ü kucaklıyorsa (`abba`) = **Sarmal**; peş peşe gidiyorsa (`aaaa` / `aaab`) = **Düz**; sadece **3. dize serbestse** (`aaxa`) = **Mani Tipi**.",
            "pattern": r"\buyak\s+düzeni[a-zçğıöşü\s“”\"]*\b|\bkafiye\s+düzeni[a-zçğıöşü\s]*\b|\bdüz\s+kafiye\s+düzeni[a-zçğıöşü]*\b|\bçapraz\s+kafiye[a-zçğıöşü]*\b|\bsarmal\s+uyak[a-zçğıöşü]*\b",
        },
        {
            "id": "tde1_ruhun_malzemeleri_ansizin",
            "term": "Ruhun Malzemeleri ve Ansızın Yola Çıkmak (Rasim Özdenören)",
            "sayfa": 52,
            "tanim": "Cumhuriyet Dönemi İslami-mistik duyarlılığın usta öykü ve deneme yazarı **Rasim Özdenören**'in; insanın iç dünyasını, değerler çatışmasını ve medeniyet krizini işlediği eserleridir (*Gül Yetiştiren Adam*, *Çözülme*, *Çok Sesli Bir Ölüm*, *Denize Açılan Kapı*, *Ruhun Malzemeleri*, *Ansızın Yola Çıkmak*).\n💡 Hile: **'Gül Yetiştiren Adam + Çözülme + Çok Sesli Bir Ölüm + Denize Açılan Kapı + Ruhun Malzemeleri + Ansızın Yola Çıkmak'** zincirinden birini gördüğün an doğrudan **Rasim Özdenören**'e kilitle.",
            "pattern": r"\bruhun\s+malzemeleri\b|\bansızın\s+yola\s+çıkmak\b",
        },
        {
            "id": "tde1_masal_fabl_klasikleri",
            "term": "Dünya ve Türk Masal/Fabl Kaynakları (Keloğlan, Pançatantra, Binbir Gece, La Fontaine, Ezop, Beydeba)",
            "sayfa": 106,
            "tanim": "Masal ve fabl türünün kültürlere göre başyapıtlarıdır: **Türk** edebiyatında *Keloğlan* ve *Billur Köşk*; **Hint** edebiyatında Beydeba'nın *Kelile ve Dimne* (*Pançatantra*) eseri; **Arap/Doğu** edebiyatında *Binbir Gece Masalları*; **Yunan** edebiyatında *Ezop Masalları*; **Fransız** edebiyatında *La Fontaine* ve **Alman** edebiyatında *Grimm Kardeşler*.\n💡 Hile: Kültür-eser eşleştirmesinde şaşmaz anahtar: **Türk → Keloğlan / Billur Köşk**, **Hint → Beydeba (Kelile ve Dimne / Pançatantra)**, **Arap → Binbir Gece Masalları**, **Yunan → Ezop**, **Fransız → La Fontaine**.",
            "pattern": r"\bkeloğlan\b|\bkarga\s+ile\s+tilki\b|\bperili\s+köşk\b|\bmontaigne\b",
        },
        {
            "id": "tde1_oznel_nesnel_anlatim",
            "term": "Öznel ve Nesnel Anlatım",
            "sayfa": 24,
            "tanim": "Kanıtlanabilen, kişiden kişiye değişmeyen, gözlem ve veriye dayalı yargılara **Nesnel Anlatım**; söyleyenin kişisel beğenisini, duygusunu ve yorumunu içeren, kanıtlanamayan yargılara **Öznel Anlatım** denir.\n💡 Hile: Cümlenin başına **'Bence'** kelimesini koy; cümle sırıtmadan kabul ediyorsa **Öznel** ('Bence çok güzel bir roman'), saçma duruyor ve metreyle/belgeyle ölçülüyorsa **Nesnel**dir ('Roman 320 sayfadır').",
            "pattern": r"\böznel\s+(?:bir\s+tutumla|ifadeye)\b|\bnesnel\s+bir\s+(?:anlatım|yargı)\b",
        },
        {
            "id": "tde1_sanat_ve_kultur",
            "term": "Güzel Sanatlar ve Kültür",
            "sayfa": 14,
            "tanim": "İnsanın duygu, düşünce ve hayallerini estetik bir biçimde (ses, söz, renk, taş) ifade etmesine **Sanat**; bir toplumun tarih boyunca ürettiği maddi ve manevi değerlerin (dil, gelenek, sanat, inanç) bütününe ise **Kültür** denir. Edebiyat, malzemesi **dil (söz)** olan fonetik (işitsel) bir güzel sanattır.\n💡 Hile: **Estetik + güzellik + tekillik/özgünlük** vurgusu varsa **Sanat**; **toplumun ortak hafızası + kuşaktan kuşağa aktarılan yaşam birikimi** vurgusu varsa **Kültür**dür.",
            "pattern": r"\bgüzel\s+sanatlar[a-zçğıöşü]*\b|\bfonetik\s+sanat[a-zçğıöşü]*\b",
            "option_only_pattern": r"^Sanat$|^Kültür$",
            "stem_context_pattern": r"edebiyat|sanat|toplum|estetik|kültür",
        },
    ],
    2: [
        {
            "id": "tde2_zarf_turleri",
            "term": "Zarf (Belirteç) Türleri (Durum, Zaman, Miktar, Yer-Yön ve Soru Zarfı)",
            "sayfa": 134,
            "tanim": "Fiili, fiilimsiyi, sıfatı veya başka bir zarfı farklı yönlerden belirten 5 zarf türüdür: fiile sorulan **'Nasıl?' → Durum Zarfı**, **'Ne zaman?' → Zaman Zarfı**, **'Ne kadar?' → Miktar (Azlık-Çokluk) Zarfı**, yalın hâldeki **'Nereye?' (içeri, dışarı, ileri, geri, aşağı, yukarı, öte, beri) → Yer-Yön Zarfı**, eylemi soru yoluyla belirten **'Nasıl, ne zaman, niçin, ne diye, ne kadar?' → Soru Zarfı**.\n💡 Hile: Soru kelimesi **ismin** önündeyse **Soru Sıfatı** (*'Nasıl bir kitap?'*), **fiilin** önündeyse **Soru Zarfı** (*'Yüzüme nasıl baktı?'*), ismin yerini tutuyorsa **Soru Zamiri**dir (*'Hangisini aldın?'*). **'Niçin / Neden / Ne diye'** kelimeleri ise her zaman %100 **Soru Zarfı**dır!",
            "pattern": r"\bdurum\s+zarfı\b|\bzaman\s+zarfı\b|\bmiktar\s+zarfı\b|\bsoru\s+zarfı\b",
            "option_only_pattern": r"^Durum$|^Zaman$|^Miktar$|^Yer-yön$|^Soru$",
            "stem_context_pattern": r"zarf|belirteç",
        },
        {
            "id": "tde2_mektup_turleri",
            "term": "Mektup Türleri (Özel, Edebî, Resmî ve İş Mektubu)",
            "sayfa": 238,
            "tanim": "Yazılış amacına ve muhatabına göre mektuplar dörde ayrılır: akraba/dost arasındaki samimi mektuplara **Özel Mektup**, sanatçıların sanat/edebiyat tartışmaları içeren mektuplarına **Edebî Mektup**, devlet kurumları arasındaki yazışmalara **Resmî Mektup**, ticari kurum yazışmalarına **İş Mektubu** denir.\n💡 Hile: Muhataba ve üsluba bak: **'Sevgili kardeşim / anneciğim'** = **Özel**; **sanatçıdan sanatçıya estetik/şiir sohbeti** = **Edebî**; **kamu kurumu / müdürlük** = **Resmî**; **sipariş / fatura / şirket** = **İş mektubu**.",
            "pattern": r"\bözel\s+mektup[a-zçğıöşü]*\b|\bedebî\s+mektup[a-zçğıöşü]*\b|\bresmî\s+mektup[a-zçğıöşü]*\b|\biş\s+mektu(?:bu|pları)\b",
            "option_only_pattern": r"^Özel$|^Edebî$|^Resmî$|^İş$",
            "stem_context_pattern": r"mektup",
        },
        {
            "id": "tde2_blog_turleri",
            "term": "Blog Türleri (Kişisel, Temasal, Topluluk ve Kurumsal Blog)",
            "sayfa": 254,
            "tanim": "İnternet ortamında güncelden geçmişe doğru sıralanan web günlüklerinin (blog) odak noktasına göre türleridir: bireyin günlük deneyimlerini paylaştığı **Kişisel Blog**, belirli bir uzmanlık alanına (yemek, gezi, moda, teknoloji) odaklanan **Temasal Blog**, birden çok yazarın ortaklaşa yazdığı **Topluluk Bloğu** ve şirketlerin kurumsal duyuru yaptığı **Kurumsal (Şirket) Blog**.\n💡 Hile: **Tek kişinin hayatı/günlüğü** = **Kişisel**; **sadece tek bir konu/uzmanlık (gezi, teknoloji, yemek)** = **Temasal**; **birden fazla yazarın ortak katkısı** = **Topluluk**; **marka/firma tanıtımı** = **Kurumsal (Şirket)** blog.",
            "pattern": r"\bkişisel\s+blog\b|\btemasal\s+blog\b|\btopluluk\s+blo[ğg]u\b|\bkurumsal\s+blog\b",
            "option_only_pattern": r"^Kişisel$|^Temasal$|^Topluluk$|^Şirket$|^Kurumsal$",
            "stem_context_pattern": r"blog|web\s+günlüğü",
        },
        {
            "id": "tde2_hac_yolunda_dussem_yollara",
            "term": "Hac Yolunda (Cenap Şahabettin) ve Düşsem Yollara Yollara (Haldun Taner)",
            "sayfa": 272,
            "tanim": "Türk edebiyatının önemli **gezi yazısı (seyahatname)** eserleridir: Servetifünun şairi **Cenap Şahabettin**'in *Hac Yolunda*, *Avrupa Mektupları*, *Suriye Mektupları*; Cumhuriyet Dönemi yazarı **Haldun Taner**'in *Düşsem Yollara Yollara*; **Reşat Nuri Güntekin**'in *Anadolu Notları*; **Falih Rıfkı Atay**'ın *Denizaşırı* ve *Tuna Kıyıları*.\n💡 Hile: Gezi yazısı eşleştirmelerinde: **Hac Yolunda → Cenap Şahabettin**, **Anadolu Notları → Reşat Nuri Güntekin**, **Düşsem Yollara Yollara → Haldun Taner**, **Mir'atü'l-Memâlik → Seydi Ali Reis** (ilk gezi yazısı), **Seyahatnâme → Evliya Çelebi**.",
            "pattern": r"\bhac\s+yolunda\b|\bcenap\s+şahabettin\b|\bdüşsem\s+yollara\s+yollara\b",
        },
        {
            "id": "tde2_basit_birlesik_zamanli_fiil",
            "term": "Basit Zamanlı ve Birleşik Zamanlı (Çekimli) Fiil",
            "sayfa": 195,
            "tanim": "Tek bir kip eki alan fiillere **Basit Zamanlı Fiil** (*gel-di-m*, *oku-yor*); kip ekinden sonra **ek fiilin (-idi / -imiş / -ise)** gelmesiyle iki zaman/kip bildiren fiillere **Birleşik Zamanlı (Birleşik Çekimli) Fiil** (*gel-iyor-du* = şimdiki zamanın hikâyesi, *oku-muş-sa* = öğrenilen geçmiş zamanın şartı) denir.\n💡 Hile: Fiildeki **kip eklerini say**: **1 kip eki varsa = Basit zamanlı** (*ver-miş-tim* değil *ver-di-m*); **2 kip eki üst üste binmişse** (`kip + idi/imiş/ise`, örn. *ver-miş-ti-m*, *uğra-sa-ymış*) = **Birleşik zamanlı**! Sakın 'birleşik yapılı fiil' (*yardım etmek, yapabilmek*) ile 'birleşik zamanlı fiil'i karıştırma!",
            "pattern": r"\bbasit\s+zamanlı[a-zçğıöşü]*\b|\bbirleşik\s+zamanlı[a-zçğıöşü]*\b|\bbirleşik\s+çekimli[a-zçğıöşü]*\b",
        },
        {
            "id": "tde2_yapilarina_gore_fiiller",
            "term": "Yapılarına Göre Fiiller (Basit, Türemiş ve Birleşik Fiil)",
            "sayfa": 198,
            "tanim": "Hiç yapım eki almamış fiillere **Basit Fiil** (*geldi, okuyor*); yapım ekiyle türetilmiş fiillere **Türemiş Fiil** (*göz-le-di, baş-la-mış*); en az iki sözcüğün kaynaştığı fiillere **Birleşik Fiil** denir. Birleşik fiiller üçe ayrılır: **Kurallı Birleşik** (*-ebilmek* yeterlilik, *-ivermek* tezlik, *-ekalmak/-edurmak* sürerlik, *-eyazmak* yaklaşma), **Yardımcı Eylemle Kurulan** (*yardım etmek, memnun olmak*) ve **Anlamca Kaynaşmış / Deyimleşmiş** (*göze almak, kulak asmak*).\n💡 Hile: Kelimenin içinde **'-ebil / -ama / -iver / -ekal / -edur / -eyaz'** görürsen tek kelime yazıldığına aldanma, anında **Kurallı Birleşik Fiil** de! Özellikle olumsuz yeterlilik (**'yap-a-ma-dı' → yapabildi'nin olumsuzu**) sınavdaki en büyük gizli birleşik fiil tuzağıdır.",
            "pattern": r"\bkurallı\s+birleşik\s+fiil[a-zçğıöşü]*\b|\btüremiş\s+fiil[a-zçğıöşü]*\b|\bbasit\s+fiil[a-zçğıöşü]*\b|\bbirleşik\s+fiil[a-zçğıöşü]*\b",
        },
        {
            "id": "tde2_fiilde_cati",
            "term": "Fiilde Çatı (Etken, Edilgen, Dönüşlü, İşteş / Geçişli, Geçişsiz)",
            "sayfa": 285,
            "tanim": "Yüklem olan fiilin **özne** ve **nesne** ile kurduğu ilişkidir. Öznesine göre: işi yapan belliyse **Etken**, fiilde **'-l/-n'** eki var ve işi başkası yapıyorsa (sözde özne) **Edilgen** (*'çalışılmıştı, kırıldı'*), işi yapan da etkilenen de aynıysa **Dönüşlü** (*'세vindi, yıkandı'*), karşılıklı/birlikte yapılıyorsa **İşteş** (*'-ş-'*). Nesnesine göre: önüne **'onu'** alabiliyorsa **Geçişli**, alamıyorsa **Geçişsiz**dir.\n💡 Hile: **1) Nesne hilesi:** Fiilin başına **'Onu'** koy; mantıklıysa **Geçişli** (*onu okudu*), saçmaysa **Geçişsiz** (*onu uyudu* olmaz). **2) Özne hilesi:** Fiilde **'-l/-n'** eki yoksa doğrudan **Etken**; varsa ve cümleye **'başkası tarafından'** anlamı katabiliyorsan **Edilgen**dir! **Not:** İsim cümlelerinde çatı özelliği **aranmaz**.",
            "pattern": r"\bedilgen\s+çatılı[a-zçğıöşü]*\b|\betken\s+çatılı[a-zçğıöşü]*\b|\bdönüşlü\s+çatılı[a-zçğıöşü]*\b|\bişteş\s+çatılı[a-zçğıöşü]*\b|\bgeçişli\s+fiil[a-zçğıöşü]*\b|\bgeçişsiz\s+fiil[a-zçğıöşü]*\b|\bfiilde\s+çatı\b",
        },
        {
            "id": "tde2_uc_birlik_kurali",
            "term": "Üç Birlik Kuralı (Olay, Zaman ve Yer Birliği)",
            "sayfa": 182,
            "tanim": "Klasik tiyatroda (trajedi ve komedide) eserin **tek bir ana olayı**, **en fazla 24 saatlik bir zaman dilimi** içinde ve **değişmeyen tek bir mekânda** sahnelemesi zorunluluğudur.\n💡 Hile: **Trajedi ve Komedi = Üç birlik kuralına uyar** (Klasisizm); **Dram = Üç birlik kuralını yıkar** (Romantizm – Victor Hugo).",
            "pattern": r"\büç\s+birlik\s+kuralı[a-zçğıöşü]*\b",
        },
        {
            "id": "tde2_sozcuk_turu_dizilimi",
            "term": "Sözcük Türü Ayrımı (İsim - Sıfat - Zamir)",
            "sayfa": 155,
            "tanim": "Cümledeki altı çizili sözcüklerin görevine göre sınıflandırılmasıdır: varlığı karşılıyorsa **İsim**, ismin önünde onu niteliyor veya belirtiyorsa **Sıfat**, ismin yerini tutuyor ve çekim eki alabiliyorsa **Zamir**dir.\n💡 Hile: Şıklarda **'İsim - Sıfat - Zamir'** sıralaması sorulduğunda her altı çizili kelimenin **hemen sağındaki kelimeye** bak: sağında isim varsa ve ona 'Nasıl/Hangi/Kaç?' sorulabiliyorsa **Sıfat**; ismin yerine geçmişse ('bunu, kimse, herkes, o') **Zamir**; kendisi varlık adıysa **İsim**dir.",
            "pattern": r"(?:İsim|Sıfat|Zamir)\s*-\s*(?:İsim|Sıfat|Zamir)\s*-\s*(?:İsim|Sıfat|Zamir)",
        },
    ],
    3: [
        {
            "id": "tde3_ilk_turkce_donemleri",
            "term": "Türkçenin Tarihî Dönemleri (İlk Türkçe, Eski Türkçe, Orta Türkçe)",
            "sayfa": 24,
            "tanim": "Türk dilinin karanlık çağlardan günümüze uzanan gelişim evreleridir: Altay dilleriyle ortak kök dönemi **İlk Türkçe**; Köktürk, Uygur ve Karahanlı metinlerini kapsayan ilk yazılı dönem (6-13. yy.) **Eski Türkçe**; Harezm, Kıpçak ve Çağatay Türkçesi evresi **Orta Türkçe**dir.\n💡 Hile: **Yazıdan önceki en eski kök** = **İlk/Ana Türkçe**; **Orhun Abideleri + Uygur + Kutadgu Bilig** = **Eski Türkçe**; **13-15. yüzyıl geçiş ve Doğu-Batı ayrımı** = **Orta Türkçe**.",
            "pattern": r"\bilk\s+türkçe\b|\beski\s+türkçe\b",
            "option_only_pattern": r"^İlk Türkçe$",
        },
        {
            "id": "tde3_sozlu_yazili_edebiyat",
            "term": "Sözlü Edebiyat ve Yazılı Edebiyat Dönemi",
            "sayfa": 18,
            "tanim": "İslamiyet Öncesi Türk Edebiyatı ikiye ayrılır: yazının henüz kullanılmadığı, şaman/kam/ozanların kopuzla *sığır, şölen, yuğ* törenlerinde söylediği *koşuk, sagu, sav, destan* dönemi **Sözlü Edebiyat** (bilinmeyen dönemler – 8. yy.); **Köktürk (Orhun) Yazıtları** ve **Uygur metinleri** (*Altun Yaruk, Sekiz Yükmek, Irk Bitig*) ile başlayan dönem ise **Yazılı Edebiyat**tır (8. yy. – 11. yy.).\n💡 Hile: **Kopuz + Kam/Ozan + Koşuk/Sagu/Sav + Yabancı etkiden uzak saf Türkçe** = **Sözlü Dönem**; **8. yüzyıl + Orhun (Kültigin, Bilge Kağan, Tonyukuk) + Uygur (Budizm/Maniheizm)** = **Yazılı Dönem**.",
            "pattern": r"\bsözlü\s+edebiyat[a-zçğıöşü]*\b|\byazılı\s+edebiyat[a-zçğıöşü]*\b",
        },
        {
            "id": "tde3_divan_edebiyati",
            "term": "Divan Edebiyatı (Klasik Türk Edebiyatı)",
            "sayfa": 68,
            "tanim": "13. yüzyıldan (Hoca Dehhânî) 19. yüzyıl ortalarına (Şeyh Galip) kadar süren; Arap ve Fars edebiyatı kaynaklı, **aruz ölçüsü, beyit nazım birimi, tam/zengin kafiye ve mazmunlarla (kalıplaşmış imgeler)** yüksek/saray zümresi etrafında gelişen klasik edebiyat geleneğidir.\n💡 Hile: **'Aruz ölçüsü + beyit + Arapça/Farsça tamlamalar + göz için kafiye + parça güzelliği (konu bütünlüğü değil beyit güzelliği) + soyut/idealize aşk'** gördüğün an **Divan Edebiyatı**dır.",
            "pattern": r"\bdivan\s+edebiyatı[a-zçğıöşü]*\b|\bdivan\s+şiiri[a-zçğıöşü]*\b",
        },
        {
            "id": "tde3_tanzimat_edebiyati",
            "term": "Tanzimat Dönemi Türk Edebiyatı",
            "sayfa": 136,
            "tanim": "1860'ta Şinasi ile Agâh Efendi'nin **Tercüman-ı Ahval** gazetesini çıkarmasıyla başlayan, Türk edebiyatının **Batı (özellikle Fransız) edebiyatına** yöneldiği yenileşme dönemidir; roman, modern hikâye, batılı tiyatro, makale ve eleştiri ilk kez bu dönemde edebiyatımıza girmiştir.\n💡 Hile: **1. Dönem (Şinasi, Namık Kemal, Ziya Paşa, Ahmet Mithat)** = **'Sanat toplum içindir' + vatan, hürriyet, hak, adalet + Klasisizm/Romantizm**; **2. Dönem (Recaizade, Abdülhak Hamit, Samipaşazade Sezai)** = **'Sanat sanat içindir' + bireysel konular + Realizm/Romantizm**.",
            "pattern": r"\btanzimat\s+edebiyatı[a-zçğıöşü]*\b|\btanzimat\s+dönemi[a-zçğıöşü]*\b|\btanzimat\s+fermanı[’']nın\s+ilanı\b",
            "option_only_pattern": r"^Tanzimat$",
            "stem_context_pattern": r"dönem|edebiyat|gelenek|şiir|roman|hikâye|tiyatro",
        },
        {
            "id": "tde3_ilahi_agit",
            "term": "İlahi ve Ağıt",
            "sayfa": 92,
            "tanim": "**İlahi**, Tekke-Tasavvuf halk şiirinde Allah aşkını, tevhidi ve tasavvufi coşkuyu anlatan, özel bir ezgiyle söylenen nazım türüdür (en büyük ustası **Yunus Emre**; Alevî-Bektaşîlerde *Nefes*, Mevlevîlerde *Âyin*, Gülşenîlerde *Tapuğ* adını alır). **Ağıt** ise ölen bir kişinin gençliğini, iyiliklerini ve ölümünden duyulan acıyı anlatan halk şiiri türüdür.\n💡 Hile: Şiirde **'Allah, Hak, derviş, aşk-ı ilahi, Yunus'** geçiyorsa **İlahi**; **ölüm, gözyaşı, yas** varsa Halk edebiyatında **Ağıt**, İslamiyet öncesinde **Sagu**, Divan edebiyatında **Mersiye**dir (**Sagu → Ağıt → Mersiye** üçlüsünü ezberle!).",
            "pattern": r"\bbir\s+ilahiden\s+alınmıştır\b|\bilahi\s+nazım\b|\bağıt\b",
            "option_only_pattern": r"^İlahi$|^Ağıt$",
        },
        {
            "id": "tde3_ibrahim_sinasi",
            "term": "İbrahim Şinasi (İlklerin Sanatçısı)",
            "sayfa": 138,
            "tanim": "Tanzimat edebiyatının kurucusu ve **ilklerin öncüsü**dür: ilk özel gazete (*Tercüman-ı Ahval*), ilk yerli tiyatro (*Şair Evlenmesi* - töre komedisi, görücü usulü evlilik eleştirisi), ilk makale (*Tercüman-ı Ahval Mukaddimesi*), ilk şiir çevirileri (*Tercüme-i Manzume*), ilk atasözleri derlemesi (*Durub-ı Emsal-i Osmaniye*) ve noktalama işaretlerinin ilk kullanımı ona aittir.\n💡 Hile: Soruda **'Batılı anlamda ilk tiyatro (Şair Evlenmesi) / ilk özel gazete / ilk makale / ilk noktalama / Klasisizm'** geçiyorsa hiç tereddüt etme **İbrahim Şinasi** işaretle.",
            "pattern": r"\bibrahim\s+şinasi[a-zçğıöşü'’]*\b",
        },
        {
            "id": "tde3_namik_kemal",
            "term": "Namık Kemal (Vatan Şairi)",
            "sayfa": 140,
            "tanim": "Tanzimat 1. Dönem'in **'Vatan Şairi'**dir; 'Sanat toplum içindir' anlayışıyla vatan, hürriyet, millet kavramlarını ilk kez şiire sokmuştur (*Hürriyet Kasidesi*). İlk edebî roman (*İntibah*), ilk tarihî roman (*Cezmi*), sahnelenen ilk tiyatro (*Vatan yahut Silistre* - ayrıca *Zavallı Çocuk, Akif Bey, Gülnihal, جلالeddin Harzemşah*) ve ilk edebî eleştiri (*Tahrib-i Harabat*, *Takip*) yazarıdır.\n💡 Hile: **'Vatan Şairi + İntibah (ilk edebî roman) + Cezmi (ilk tarihî roman) + Vatan yahut Silistre / Zavallı Çocuk + Tahrib-i Harabat / Takip'** gördüğün an cevap **Namık Kemal**dir.",
            "pattern": r"\bnamık\s+kemal[a-zçğıöşü'’]*\b",
        },
        {
            "id": "tde3_recaizade_mahmut_ekrem",
            "term": "Recaizade Mahmut Ekrem (Üstat)",
            "sayfa": 142,
            "tanim": "Tanzimat 2. Dönem'in **'Üstat'** lakaplı lideridir; **'Güzel olan her şey şiirin konusu olabilir'** ve **'Kulak için kafiye'** anlayışını savunarak Servetifünun edebiyatının doğuşuna zemin hazırlamıştır. İlk realist romanımız **Araba Sevdası** (Bihruz Bey'in yanlış Batılılaşması), *Zemzeme*, *Takdir-i Elhan* (eleştiri), *Çok Bilen Çok Yanılır* ve *Vuslat* (tiyatro) eserlerinin yazarıdır.\n💡 Hile: **'Araba Sevdası (ilk realist roman – Bihruz Bey) + Kulak için kafiye (Muallim Naci ile Zemzeme-Demdeme kavgası) + Takdir-i Elhan + Vuslat'** = **Recaizade Mahmut Ekrem**.",
            "pattern": r"\brecaiz[aâ]de\s+mahmut\s+ekrem[a-zçğıöşü'’]*\b",
        },
        {
            "id": "tde3_eflatun_cem_guney",
            "term": "Eflatun Cem Güney (Masalcı Baba)",
            "sayfa": 58,
            "tanim": "Türk halk masallarını ve hikâyelerini derleyip edebî bir dille yeniden yazarak dünya çapında Andersen Masal Ödülü kazanan, edebiyatımızda **'Masalcı Baba'** unvanıyla tanınan folklor araştırmacısı ve yazardır (*Evvel Zaman İçinde, Açıl Sofram Açıl, Dede Korkut Masalları*).\n💡 Hile: Soruda **'Masal derlemecisi / Masalcı Baba / Andersen Masal Ödülü / Evvel Zaman İçinde'** ipuçlarından biri varsa cevap kesinlikle **Eflatun Cem Güney**dir.",
            "pattern": r"\beflatun\s+cem\s+güney[a-zçğıöşü'’]*\b",
        },
        {
            "id": "tde3_belirtme_sifatlari",
            "term": "Belirtme Sıfatları (İşaret, Sayı, Belgisiz ve Soru Sıfatı)",
            "sayfa": 42,
            "tanim": "Varlıkları nitelik (renk/durum) yönünden değil; **işaret** (*bu ev, öteki yol*), **sayı** (*üç gün, ikinci kat, yarım ekmek*), **belirsizlik** (*birkaç kişi, her insan, bazı günler*) ve **soru** (*hangi kitap, kaç para, nasıl bir iş*) yoluyla belirten sıfatlardır.\n💡 Hile: Kelimenin hemen sağında **isim** olmak şartıyla: parmakla gösteriyorsa **İşaret** (*şu mahalle*), net miktar vermiyorsa **Belgisiz** (*biraz su, çok fazla tehlike*), soru soruyorsa **Soru**, 'Nasıl?' sorusuna renk/durum cevabı veriyorsa **Niteleme** sıfatıdır.",
            "pattern": r"\bişaret\s+sıfatı[a-zçğıöşü]*\b|\bsoru\s+sıfatı[a-zçğıöşü]*\b|\bsayı\s+sıfatı[a-zçğıöşü]*\b",
            "option_only_pattern": r"^İşaret$|^Soru$|^Sayı$",
            "stem_context_pattern": r"sıfat|ön\s+ad",
        },
    ],
    4: [
        {
            "id": "tde4_ahmet_hasim",
            "term": "Ahmet Haşim (Akşam Şairi)",
            "sayfa": 286,
            "tanim": "Fecriati topluluğunun ve Türk edebiyatında **Saf (Öz) Şiir** ile **Sembolizm / Empresyonizm** akımının en büyük şairidir; tüm şiirlerini **aruz ölçüsüyle** yazmış, hece ölçüsünü 'köylü vezni' sayarak hiç kullanmamıştır. Şiir kitapları *Göl Saatleri* ve *Piyale* ('Şiir Hakkında Bazı Mülahazalar' önsözü); düzyazıları **Frankfurt Seyahatnamesi** (gezi), *Bize Göre* ve *Gurebahane-i Laklakan*dır.\n💡 Hile: **'Fecriati + Saf Şiir + Sembolizm + tamamı aruz ölçüsü + Piyale / Göl Saatleri + Frankfurt Seyahatnamesi / Bize Göre'** gördüğün an **Ahmet Haşim** işaretle.",
            "pattern": r"\bahmet\s+haşim[a-zçğıöşü'’]*\b",
        },
        {
            "id": "tde4_resat_nuri_guntekin",
            "term": "Reşat Nuri Güntekin",
            "sayfa": 208,
            "tanim": "Millî Edebiyat ve Cumhuriyet Dönemi'nin Anadolu'yu ve Anadolu insanını yalın, iyimser ve gözlemci bir dille anlatan usta romancısıdır. Başlıca eserleri: *Çalıkuşu* (Feride'nin Anadolu öğretmenliği), *Yaprak Dökümü* (Ali Rıza Bey), *Yeşil Gece*, *Acımak*, *Miskinler Tekkesi* (roman); **Anadolu Notları** (gezi yazısı); **Tanrı Misafiri**, *Sönmüş Yıldızlar* değil *Leyla ile Mecnun* (hikâye); *Hançer, Balıkesir Muhasebecisi* (tiyatro).\n💡 Hile: **'Çalıkuşu + Yaprak Dökümü + Yeşil Gece + Anadolu Notları (gezi) + Tanrı Misafiri (hikâye)'** beşlisinden hangisi çıkarsa çıksın cevap **Reşat Nuri Güntekin**dir.",
            "pattern": r"\breşat\s+nuri\s+güntekin[a-zçğıöşü'’]*\b|\breşat\s+nuri\b",
        },
        {
            "id": "tde4_abdulhak_hamit_tarhan",
            "term": "Abdülhak Hamit Tarhan (Şair-i Âzam)",
            "sayfa": 244,
            "tanim": "Tanzimat 2. Dönem'in **'Şair-i Âzam (Büyük Şair)'** unvanlı şair ve oyun yazarıdır; Divan şiiri kurallarını yıkmış, ilk pastoral şiir (*Sahra*), ilk uyaksız şiir (*Validem*) ve Türk edebiyatının en ünlü metafizik/ölüm şiiri **Makber**'i yazmıştır. Tiyatrolarını sahnelenmek için değil **okunmak için** (aruz/hece veya mensur) kaleme almıştır (*İçli Kız, Macera-yı Aşk, Sabr ü Sebat, Finten, Eşber, Nesteren*).\n💡 Hile: **'Şair-i Âzam + Makber (ölüm/metafizik) + Sahra (ilk pastoral şiir) + oynanmak için değil okunmak için yazılan tiyatrolar (İçli Kız, Eşber, Finten)'** = **Abdülhak Hamit Tarhan**.",
            "pattern": r"\babdülhak\s+hamit\s+tarhan[a-zçğıöşü'’]*\b|\biçli\s+kız\b",
        },
        {
            "id": "tde4_mevlana_eserleri",
            "term": "Mevlânâ Celâleddîn-i Rûmî ve Eserleri (Mesnevi, Dîvân-ı Kebîr, Fîhi Mâfîh, Mecâlis-i Seb'a, Mektûbât)",
            "sayfa": 176,
            "tanim": "13. yüzyıl Anadolu tasavvuf edebiyatının evrensel mutasavvıfı ve şairidir. Eserlerini Farsça kaleme almıştır: 25.700 beyitlik didaktik-tasavvufi başyapıtı **Mesnevi**, lirik gazel ve rubailerini topladığı **Dîvân-ı Kebîr**, sohbetlerinden oluşan **Fîhi Mâfîh**, yedi vaazını içeren **Mecâlis-i Seb'a** ve devlet büyüklerine yazdığı 147 mektuptan oluşan **Mektûbât**.\n💡 Hile: **'Mesnevi + Dîvân-ı Kebîr + Fîhi Mâfîh + Mecâlis-i Seb'a + Mektûbât'** beşlisi **Mevlânâ**'nın 5 külliyatıdır; mektup türünde sorulursa **Mektûbât** doğrudan cevaptır.",
            "pattern": r"\bdîvân-ı\s+kebîr\b|\bfîhi\s+mâfîh\b|\bmecâlis-i\s+seb[’']a\b|\bmektûbât\b",
        },
        {
            "id": "tde4_dunya_ve_tanzimat_eserleri",
            "term": "Tanzimat ve Dünya Edebiyatı Klasikleri (Monte Cristo Kontu, Robenson Cruze, Zavallı Çocuk, Tahrib-i Harabat, Takip, Vuslat)",
            "sayfa": 192,
            "tanim": "Tanzimat Dönemi'nde Batı'dan yapılan ilk roman çevirileri (Yusuf Kâmil Paşa → Fénelon'dan *Telemak*; Victor Hugo'dan *Sefiller*; Daniel Defoe'dan **Robenson Cruze**; Alexandre Dumas'dan **Monte Cristo Kontu**) ile yerli tiyatro ve eleştiri klasikleridir (Namık Kemal → **Zavallı Çocuk**, **Tahrib-i Harabat**, **Takip**; Recaizade Mahmut Ekrem → **Vuslat**, **Takdir-i Elhan**).\n💡 Hile: **Telemak (ilk çeviri roman) / Monte Cristo Kontu / Robenson Cruze** = Tanzimat çevirileri; **Zavallı Çocuk / Tahrib-i Harabat (ilk eleştiri) / Takip** = **Namık Kemal**; **Vuslat / Takdir-i Elhan** = **Recaizade Mahmut Ekrem**.",
            "pattern": r"\bmonte\s+cristo\s+kontu\b|\brobenson\s+cruze\b|\bzavallı\s+çocuk\b|\btahrib-i\s+harabat\b|\bvuslat\s*-\s*recaiz[aâ]de\b",
            "option_only_pattern": r"^Takip$",
            "stem_context_pattern": r"eleştiri|tenkit|namık\s+kemal",
        },
        {
            "id": "tde4_halide_edip_eserleri",
            "term": "Halide Edip Adıvar Eserleri (Ateşten Gömlek, Vurun Kahpeye, Sinekli Bakkal, Akile Hanım Sokağı, Son Emel, Dağa Çıkan Kurt)",
            "sayfa": 206,
            "tanim": "Millî Edebiyat ve Cumhuriyet Dönemi romancısı **Halide Edip Adıvar**'ın; Kurtuluş Savaşı'nı (*Ateşten Gömlek, Vurun Kahpeye, Dağa Çıkan Kurt*), kadın psikolojisini (*Handan, Kalp Ağrısı*) ve Doğu-Batı sentezini (*Sinekli Bakkal, Tatarcık, Akile Hanım Sokağı, Son Emel*) işlediği eserleridir (Not: *Yılanlı Kuyudan* ise Fakir Baykurt'un eseridir).\n💡 Hile: **'Ateşten Gömlek + Vurun Kahpeye + Sinekli Bakkal + Handan + Akile Hanım Sokağı + Son Emel + Türk'ün Ateşle İmtihanı (anı) + Mor Salkımlı Ev (anı)'** = **Halide Edip Adıvar**; şıklara sıkıştırılan **Yılanlı Kuyudan** ise **Fakir Baykurt**'a aittir!",
            "pattern": r"\bakile\s+hanım\s+sokağı\b|\bson\s+emel\b|\byılanlı\s+kuyudan\b",
        },
    ],
    5: [
        {
            "id": "tde5_yahya_kemal_beyatli",
            "term": "Yahya Kemal Beyatlı (Kendi Gök Kubbemiz, Eski Şiirin Rüzgârıyle, Aziz İstanbul)",
            "sayfa": 78,
            "tanim": "Cumhuriyet ve Millî Edebiyat Dönemi'nde **Saf (Öz) Şiir** ve **Yeni Lisan / Neo-Klasisizm** anlayışının en büyük şairidir; **'Türkçe ağzımda annemin ak sütü gibidir'** diyerek konuşulan duru Türkçeyle ve (**Ok** şiiri hariç) **aruz ölçüsüyle** Osmanlı tarihini, İstanbul sevgisini ve sonsuzluk özlemini işlemiştir (*Kendi Gök Kubbemiz, Eski Şiirin Rüzgârıyle, Rubailer, Aziz İstanbul, Eğil Dağlar*).\n💡 Hile: **'Ok şiiri hariç tamamı aruz + duru İstanbul Türkçesi + Parnasizm/Saf Şiir + Kendi Gök Kubbemiz + Eski Şiirin Rüzgârıyle + Sessiz Gemi'** = **Yahya Kemal Beyatlı**.",
            "pattern": r"\byahya\s+kemal\s+beyatlı\b|\byahya\s+kemal\b|\bkendi\s+gök\s+kubbemiz\b|\beski\s+şiirin\s+rüzgârıyle\b",
        },
        {
            "id": "tde5_tevfik_fikret",
            "term": "Tevfik Fikret (Rübâb-ı Şikeste, Halûk'un Defteri, Şermin)",
            "sayfa": 68,
            "tanim": "Servetifünun (Edebiyat-ı Cedide) şiirinin öncüsüdür; **Parnasizm** akımının etkisiyle **nazmı nesre (şiiri düzyazıya) yaklaştırmış**, **müstezatı serbest müstezata** dönüştürmüş ve beyit bütünlüğünü kırarak anlamı birkaç dizeye yaymıştır (**anjambman**). Başlıca eserleri: *Rübâb-ı Şikeste*, oğlu için yazdığı didaktik şiirler **Halûk'un Defteri**, *Rübâbın Cevabı*, *Tarih-i Kadim*, *Sis* ve çocuklar için **hece ölçüsüyle** yazdığı tek kitabı **Şermin**.\n💡 Hile: **'Servetifünun + Parnasizm + nazmı nesre yaklaştırma + Rübâb-ı Şikeste + Halûk'un Defteri + Şermin (heceyle çocuk şiirleri)'** = **Tevfik Fikret**.",
            "pattern": r"\btevfik\s+fikret\b|\bhalûk[’']un\s+defteri\b|\brübâb-ı\s+şikeste\b",
        },
        {
            "id": "tde5_nabizade_nazim",
            "term": "Nâbizâde Nâzım (Karabibik, Zehra)",
            "sayfa": 42,
            "tanim": "Tanzimat 2. Dönem'de **Realizm ve Natüralizm** akımlarının öncüsü olan hikâye ve roman yazarıdır; Türk edebiyatının **ilk köy romanı/uzun hikâyesi** olan **Karabibik**'i (Antalya/Kaş Beymelik köyü) ve **ilk psikolojik roman denemesi / ilk natüralist-tezli roman** sayılan **Zehra**'yı (kıskançlık teması) kaleme almıştır.\n💡 Hile: **'İlk köy romanı (Karabibik) + İlk psikolojik roman denemesi (Zehra) + Natüralizm'** üçlüsü doğrudan **Nâbizâde Nâzım**'ın parmak izidir.",
            "pattern": r"\bn[aâ]biz[aâ]de\s+n[aâ]zım\b",
        },
        {
            "id": "tde5_kemalettin_kamu_bahtiyar",
            "term": "Kemalettin Kamu (Gurbet Şairi) ve Bahtiyar Vahabzade",
            "sayfa": 88,
            "tanim": "**Kemalettin Kamu**, Millî Mücadele ve Cumhuriyet Dönemi'nde memleket, vatan ve gurbet temalarını hece ölçüsüyle işleyen **'Gurbet Şairi'**dir (*Bingöl Çobanları* pastoral şiiri ve *Gurbet*). **Bahtiyar Vahabzade** ise Çağdaş Azerbaycan Türk edebiyatının en büyük **'Ana Dili ve Özgürlük Şairi'**dir (*Gülüstan* poeması).\n💡 Hile: **'Gurbet Şairi + Bingöl Çobanları'** = **Kemalettin Kamu**; **'Azerbaycan Türk edebiyatı + vatan/ana dili sevgisi'** = **Bahtiyar Vahabzade**.",
            "pattern": r"\bkemalettin\s+kamu\b|\bbahtiyar\s+vahabzade\b",
        },
        {
            "id": "tde5_tanri_misafiri_sonmus_yildizlar_gonulden",
            "term": "Cumhuriyet Dönemi Hikâye ve Şiir Eserleri (Tanrı Misafiri, Sönmüş Yıldızlar, Gönülden Gönüle)",
            "sayfa": 50,
            "tanim": "Millî Edebiyat ve Cumhuriyet'in ilk yıllarında Anadolu insanını ve bireysel duyguları işleyen tanınmış eserlerdir: **Reşat Nuri Güntekin**'in *Tanrı Misafiri* ve *Sönmüş Yıldızlar* hikâye kitapları ile Beş Hececilerin lideri **Faruk Nafiz Çamlıbel**'in *Gönülden Gönüle*, *Dinle Neyden*, *Çoban Çeşmesi* ve *Han Duvarları* şiir kitapları.\n💡 Hile: **Tanrı Misafiri / Sönmüş Yıldızlar** = **Reşat Nuri Güntekin** (hikâye); **Gönülden Gönüle / Han Duvarları / Çoban Çeşmesi / Sanat** = **Faruk Nafiz Çamlıbel** (Beş Hececiler).",
            "pattern": r"\btanrı\s+misafiri\b|\bsönmüş\s+yıldızlar\b|\bgönülden\s+gönüle\b",
        },
        {
            "id": "tde5_cumle_ogeleri_dizilimi",
            "term": "Cümlenin Ögeleri Dizilimi (Özne / Nesne / Dolaylı Tümleç / Zarf Tümleci / Yüklem)",
            "sayfa": 135,
            "tanim": "Cümleyi ögelerine ayırırken izlenen altın sıra (**YÖN-T** kuralı): önce yargıyı bildiren **Yüklem** bulunur; yükleme **'Kim / Ne?'** sorularak **Özne**; özheden sonra **'Neyi / Kimi / Ne?'** sorularak **Nesne**; **'-e / -de / -den'** ekli **'Nereye / Nerede / Nereden / Kime?'** sorularak **Dolaylı Tümleç (Yer Tamlayıcısı)**; **'Nasıl / Ne zaman / Niçin / Ne kadar?'** sorularak **Zarf Tümleci** bulunur.\n💡 Hile: **YÖN** sırasını (**1. Yüklem → 2. Özne → 3. Nesne**) asla bozma! Önce özneyi bulmadan 'Ne?' sorarsan özne ile belirtisiz nesneyi karıştırırsın; ayrıca **isim ve sıfat tamlamaları ile deyimleri asla ortadan bölme**!",
            "pattern": r"(?:Özne|Nesne|Belirtili nesne|Belirtisiz nesne|Dolaylı tümleç|Zarf tümleci|Yüklem)\s*/\s*(?:Özne|Nesne|Belirtili nesne|Belirtisiz nesne|Dolaylı tümleç|Zarf tümleci|Yüklem)(?:\s*/\s*(?:Özne|Nesne|Belirtili nesne|Belirtisiz nesne|Dolaylı tümleç|Zarf tümleci|Yüklem))+",
        },
    ],
    6: [
        {
            "id": "tde6_yakup_kadri",
            "term": "Yakup Kadri Karaosmanoğlu (Yaban, Kiralık Konak, Sodom ve Gomore)",
            "sayfa": 172,
            "tanim": "Millî Edebiyat ve Cumhuriyet Dönemi'nde Tanzimat'tan Cumhuriyet'e Türk toplumunun geçirdiği tarihsel dönüşümü **'nehir roman'** dizisiyle anlatan usta yazardır: **Kiralık Konak** (Naim Efendi – Seniha; üç kuşak çatışması ve Batılılaşma), *Nur Baba* (tekke yozlaşması), *Hüküm Gecesi* (İttihat ve Terakki), **Sodom ve Gomore** (işgal İstanbul'undaki ahlaki çöküş), **Yaban** (Ahmet Celal; aydın-köylü çatışması, tezli roman), *Ankara* ve *Panorama*.\n💡 Hile: **'Kiralık Konak (kuşak çatışması) + Sodom ve Gomore (işgal İstanbul'u) + Yaban (Ahmet Celal / aydın-köylü çatışması)'** üçlüsünden biri geçtiği an **Yakup Kadri Karaosmanoğlu** işaretle.",
            "pattern": r"\byakup\s+kadri\s+karaosmanoğlu\b|\byakup\s+kadri\b|\bkiralık\s+konak\b|\bsodom\s+ve\s+gomore\b|\byaban\b",
        },
        {
            "id": "tde6_mehmet_rauf",
            "term": "Mehmet Rauf (Eylül - İlk Psikolojik Roman)",
            "sayfa": 168,
            "tanim": "Servetifünun (Edebiyat-ı Cedide) döneminin Halit Ziya'dan sonraki en önemli romancısıdır; Türk edebiyatının **ilk psikolojik romanı** olan **Eylül**'de (Suat, Süreyya ve Necip arasındaki yasak aşk ve ruhsal bunalım) dış olaylardan çok kahramanların iç dünyasını ve psikolojik tahlillerini işlemiştir (*Ferda-yı Garam, Genç Kız Kalbi, Siyah İnciler* - mensur şiir).\n💡 Hile: **'İlk psikolojik roman = Eylül (Suat, Süreyya, Necip) = Mehmet Rauf'** denklemi sınavın şaşmaz altın anahtarıdır.",
            "pattern": r"\bmehmet\s+rauf\b",
        },
        {
            "id": "tde6_adalet_agaoglu",
            "term": "Adalet Ağaoğlu (Ölmeye Yatmak, Fikrimin İnce Gülü)",
            "sayfa": 196,
            "tanim": "Cumhuriyet Dönemi **modernist ve postmodernist** Türk romanının öncü kadın yazarıdır; *Dar Zamanlar* üçlemesinin ilk kitabı olan **Ölmeye Yatmak** (Cumhuriyet ideolojisiyle yetişen Aysel'in bir otel odasında iç hesaplaşması - bilinç akışı ve geriye dönüş), *Bir Düğün Gecesi*, *Hayır* ve Almanya'daki gurbetçi Bayram'ın sarı Mercedes'iyle köye dönüş yolculuğunu anlattığı **Fikrimin İnce Gülü** romanlarıyla tanınır.\n💡 Hile: **'Ölmeye Yatmak (Aysel / Dar Zamanlar) + Bir Düğün Gecesi + Fikrimin İnce Gülü (gurbetçi Bayram ve otomobili)'** = **Adalet Ağaoğlu**.",
            "pattern": r"\badalet\s+ağaoğlu\b|\bölmeye\s+yatmak\b|\bfikrimin\s+ince\s+gülü\b",
        },
        {
            "id": "tde6_abbas_sayar_yasar_kemal_eserleri",
            "term": "Toplumcu Gerçekçi Anadolu Romanları (Yılkı Atı, Tarlabaşı Salkım Saçak - Abbas Sayar; Yer Demir Gök Bakır - Yaşar Kemal)",
            "sayfa": 184,
            "tanim": "1950-1980 arası Anadolu köy ve kasaba gerçeğini şiirsel ve yerel bir dille anlatan romanlardır: **Abbas Sayar**'ın yaşlandığı için doğaya terk edilen Dorukısrak'ın yaşam mücadelesini anlattığı **Yılkı Atı** ile *Çelo, Can Şenliği* ve **Tarlabaşı Salkım Saçak** romanları; **Yaşar Kemal**'in Çukurova üçlemesi *Dağın Öte Yüzü* (*Ortadirek*, **Yer Demir Gök Bakır**, *Ölmez Otu*) ve *İnce Memed*.\n💡 Hile: **'Yılkı Atı (Dorukısrak) + Çelo + Tarlabaşı Salkım Saçak'** = **Abbas Sayar**; **'İnce Memed + Yer Demir Gök Bakır + Çukurova'** = **Yaşar Kemal**.",
            "pattern": r"\babbas\s+sayar\b|\byılkı\s+atı\b|\btarlabaşı\s+salkım\s+saçak\b|\byer\s+demir\s+gök\s+bakır\b",
        },
        {
            "id": "tde6_cumhuriyet_tiyatro_eserleri",
            "term": "Cumhuriyet Dönemi Tiyatro Eserleri (Paydos, Köşebaşı, Nalınlar, Gölgeler, Reis Bey, Esirler, İşsizler)",
            "sayfa": 225,
            "tanim": "Cumhuriyet Dönemi Türk tiyatrosunun simge oyunlarıdır: **Cevat Fehmi Başkut**'un yurt dışında sahnelenen ilk Türk oyunu **Paydos** ve *Buzlar Çözülmeden*; **Ahmet Kutsi Tecer**'in geleneksel orta oyununu modern tiyatroyla birleştirdiği **Köşebaşı** ve *Koçyiğit Köroğlu*; **Necati Cumalı**'nın **Nalınlar** ve *Boş Beşik*; **Ahmet Muhip Dıranas**'ın **Gölgeler**; **Necip Fazıl Kısakürek**'in **Reis Bey**, *Tohum, Bir Adam Yaratmak* (ve şiir kitapları **Örümcek Ağı**, *Çile, Kaldırımlar*); **Sabahattin Ali**'nin tek oyunu **Esirler**; **Vedat Nedim Tör**'ün **İşsizler**.\n💡 Hile: Tiyatro-yazar şifresi: **Paydos → Cevat Fehmi Başkut**, **Köşebaşı → Ahmet Kutsi Tecer**, **Nalınlar → Necati Cumalı**, **Gölgeler → Ahmet Muhip Dıranas**, **Reis Bey / Tohum / Bir Adam Yaratmak → Necip Fazıl**, **Esirler → Sabahattin Ali**, **İşsizler → Vedat Nedim Tör**.",
            "pattern": r"\bpaydos\b|\bköşebaşı\b|\bnalınlar\b|\bgölgeler\b|\breis\s+bey\b|\börümcek\s+ağı\b|\bsonsuzluk\s+kervanı\b|\besirler\b|\bişsizler\b",
        },
        {
            "id": "tde6_elestiri_ve_roportaj_klasikleri",
            "term": "Eleştiri ve Röportaj Eserleri (Destursuz Bağa Girenler, Takdir-i Elhan, Zafername, Hikmet Feridun Es, Fikret Otyam)",
            "sayfa": 258,
            "tanim": "Türk edebiyatında eleştiri ve röportaj türünün önemli temsilcileri ve eserleridir: **Orhan Şaik Gökyay**'ın sert ve bilimsel eleştirilerini topladığı **Destursuz Bağa Girenler**; **Recaizade Mahmut Ekrem**'in **Takdir-i Elhan**; **Ziya Paşa**'nın Sadrazam Ali Paşa'yı ironi/tariz yoluyla hicvettiği **Zafername**; gazetecilik ve röportaj türünün ustaları **Hikmet Feridun Es** ile **Fikret Otyam** (*Ha Bu Diyar*).\n💡 Hile: **Destursuz Bağa Girenler → Orhan Şaik Gökyay** (eleştiri), **Zafername → Ziya Paşa** (satirik hiciv), **Hikmet Feridun Es & Fikret Otyam → Cumhuriyet Dönemi Röportaj ustaları**.",
            "pattern": r"\bdestursuz\s+bağa\s+girenler\b|\btakdir-i\s+elhan\b|\bzafername\b|\bhikmet\s+feridun\s+es\b|\bfikret\s+otyam\b",
        },
        {
            "id": "tde6_bati_tiyatrosu_ustalari",
            "term": "Dünya Tiyatrosu Ustaları (William Shakespeare, Victor Hugo, Bernard Shaw, Alfred de Musset)",
            "sayfa": 216,
            "tanim": "Batı tiyatrosunda **Dram** türünün ve modern tiyatronun öncüleridir: İngiliz tiyatrosunun dehası **William Shakespeare** (*Hamlet, Romeo ve Juliet, Othello*), Fransız Romantizminin ve **Dram** türünün kurucusu **Victor Hugo** (*Cromwell* önsözü, *Hernani*), Fransız romantik oyun yazarı **Alfred de Musset** ve İrlandalı modern hiciv/tiyatro ustası **Bernard Shaw** (*Pygmalion*).\n💡 Hile: **Victor Hugo (*Cromwell*) + William Shakespeare + Alfred de Musset** = Klasik üç birlik kuralını yıkan **Dram (Romantizm)** türünün büyük ustalarıdır.",
            "pattern": r"\bwilliam\s+shakespeare\b|\bvictor\s+hugo\b|\bbernard\s+shaw\b|\balfred\s+de\s+musset\b",
        },
        {
            "id": "tde6_ironi",
            "term": "İroni",
            "sayfa": 194,
            "tanim": "Söylenen sözün veya kurgulanan durumun, kastedilenin **tam tersini** ima edecek şekilde ince bir alay, zekâ ve eleştirel mesafeyle ifade edilmesidir (Divan şiirindeki karşılığı **Tariz**dir; modern/postmodern romanda **Oğuz Atay**'ın en temel anlatım silahıdır).\n💡 Hile: Yazar görünürde övüyor veya ciddi konuşuyor gibi yapıp alttan alta **tam zıddını kastederek ince bir tokat** atıyorsa buna edebiyatta **İroni**, söz sanatlarında **Tariz (İğneleme)** denir.",
            "pattern": r"\bironi[a-zçğıöşü]*\b",
        },
        {
            "id": "tde6_anlatim_bozuklugu_turleri",
            "term": "Anlatım Bozukluğu Türleri (Anlam Belirsizliği, Öge Eksikliği, Tamlayan Eksikliği)",
            "sayfa": 288,
            "tanim": "Cümlenin açık, duru ve dil bilgisine uygun olmamasıdır: 2. ve 3. tekil iyelik eklerinin karışması ('Kardeşini dün okulda gördüm' → senin kardeşini mi, onun kardeşini mi?) veya virgül eksikliği **Anlam Belirsizliği**; sıralı/bağlı cümlelerde ortak kullanılamayan tümleç/nesne/tamlayanın yazılmaması ise **Öge / Tamlayan Eksikliği**dir.\n💡 Hile: **1) Anlam belirsizliği hilesi:** Cümlenin başına hem **'Senin'** hem **'Onun'** koy; ikisi de uyuyorsa kesin **Anlam Belirsizliği (Zamir eksikliği)** vardır! **2) Öge eksikliği hilesi:** Virgül veya 've/ama' ile ayrılan iki yüklemi tek tek oku ('İnsanlara yardım eder, [onları] severdi' → nesne eksikliği).",
            "pattern": r"\banlam\s+belirsizliği[a-zçğıöşü]*\b|\böge\s+eksikliği\b|\btamlayan\s+eksikliği\b",
        },
    ],
    7: [
        {
            "id": "tde7_nazim_hikmet_toplumcu",
            "term": "Nâzım Hikmet Ran ve Toplumcu Gerçekçi Şairler (Ahmed Arif, Arif Damar)",
            "sayfa": 64,
            "tanim": "**Nâzım Hikmet Ran**, Rus şair Mayakovski ve **Fütürizm (Gelecekçilik)** etkisinde Türk şiirine **serbest nazmı**, basamaklı dize yapısını ve makine/hız ritmini getiren **Toplumcu Gerçekçi Şiir**in kurucusudur (*835 Satır, Şeyh Bedrettin Destanı, Kuvâyi Milliye Destanı*, **Memleketimden İnsan Manzaraları**). **Ahmed Arif** (*Hasretinden Prangalar Eskittim*) ve **Arif Damar** (*Günden Güne*) aynı çizginin usta şairleridir.\n💡 Hile: **'Serbest nazım + basamaklı dizeler + Fütürizm (Mayakovski) + 835 Satır + Memleketimden İnsan Manzaraları'** = **Nâzım Hikmet Ran**; **'Hasretinden Prangalar Eskittim + Anadolu lirizmi'** = **Ahmed Arif**.",
            "pattern": r"\bn[aâ]zım\s+hikmet(?:\s+ran)?\b|\bmemleketimden\s+insan\s+manzaraları\b|\bahmed\s+arif\b|\barif\s+damar\b",
        },
        {
            "id": "tde7_milli_siir_ve_halk_sairleri",
            "term": "Millî Duyarlılık ve Cumhuriyet Halk Şairleri (Arif Nihat Asya, Orhan Seyfi Orhon, Âşık Veysel, Abdurrahim Karakoç, Murat Çobanoğlu)",
            "sayfa": 78,
            "tanim": "Cumhuriyet Dönemi'nde millî-manevi değerleri ve âşıklık geleneğini sürdüren şairlerdir: **'Bayrak Şairi' Arif Nihat Asya** (*Bir Bayrak Rüzgâr Bekliyor, Dua, Fetih Marşı, Rubaiyyat-ı Arif*); Beş Hececilerden **Orhan Seyfi Orhon** (*Fırtına ve Kar, Peri Kızı ile Çoban Hikâyesi*); saz ve söz ustası **Âşık Veysel Şatıroğlu** (*Uzun İnce Bir Yol, Kara Toprak, Dostlar Beni Hatırlasın*); **Abdurrahim Karakoç** (*Mihriban, Hasan'a Mektuplar*) ve Kars âşıklık geleneği ustası **Murat Çobanoğlu** (*Kiziroğlu Mustafa Bey*).\n💡 Hile: **Bayrak Şairi → Arif Nihat Asya**, **Peri Kızı ile Çoban Hikâyesi (Beş Hececiler) → Orhan Seyfi Orhon**, **Kara Toprak / Dostlar Beni Hatırlasın → Âşık Veysel**, **Mihriban → Abdurrahim Karakoç**, **Kiziroğlu Mustafa Bey → Murat Çobanoğlu**.",
            "pattern": r"\barif\s+nihat\s+asya\b|\borhan\s+seyfi\s+orhon\b|\bâşık\s+veysel\b|\babdurrahim\s+karakoç\b|\bmurat\s+çobanoğlu\b",
        },
        {
            "id": "tde7_emine_isinsu_gulten_dayioglu_eserler",
            "term": "Cumhuriyet Dönemi Hikâye ve Şiir Eserleri (Emine Işınsu, Gülten Dayıoğlu, Yokuşa Akan Sular, Düşten Güzel)",
            "sayfa": 28,
            "tanim": "Cumhuriyet Dönemi'nde millî-dini duyarlılığı ve dış Türklerin (Kerkük, Bulgaristan, Batı Trakya) acılarını işleyen **Emine Işınsu** (*Küçük Dünya, Azap Toprakları, Çiçekler Büyür*), çocuk ve gençlik edebiyatının usta hikâyecisi **Gülten Dayıoğlu** (*Fadiş, Döl*), **Mustafa Kutlu**'nun modern uzun hikâyesi **Yokuşa Akan Sular** (*Ortadaki Adam, Uzun Hikâye*) ve **Cahit Sıtkı Tarancı**'nın şiir kitabı **Düşten Güzel** (*Otuz Beş Yaş, Ömrümde Sükût*).\n💡 Hile: **Yokuşa Akan Sular / Uzun Hikâye → Mustafa Kutlu**, **Düşten Güzel / Otuz Beş Yaş → Cahit Sıtkı Tarancı**, **Dış Türkler / Azap Toprakları → Emine Işınsu**.",
            "pattern": r"\bemine\s+ışınsu\b|\bgülten\s+dayıoğlu\b|\byokuşa\s+akan\s+sular\b|\bdüşten\s+güzel\b",
        },
        {
            "id": "tde7_anlam_degismeleri",
            "term": "Kelimede Anlam Değişmeleri (Anlam Daralması, Anlam Genişlemesi, Anlam Kayması, Anlam İyileşmesi ve Kötüleşmesi)",
            "sayfa": 106,
            "tanim": "Sözcüklerin tarihî süreçte geçirdiği anlamsal dönüşümlerdir: eskiden genel bir kümenin tamamını karşılarken bugün sadece bir alt türüne inmesi **Anlam Daralması** (*'oğul'* eskiden kız+erkek evlat → bugün sadece erkek; *'yemiş'* eskiden tüm meyveler → bugün incir; *'davet/erik'*); özelden genele yayılması **Anlam Genişlemesi** (*'ödül'* eskiden sadece güreş mükafatı → bugün her türlü mükafat; *'alan'*); olumsuzdan olumluya geçmesi **Anlam İyileşmesi** (*'yavuz'* eskiden kötü/fena → bugün yiğit; *'emek'* eskiden eziyet → bugün alın teri); olumludan olumsuza düşmesi **Anlam Kötüleşmesi** (*'canavar'* eskiden canlı varlık → bugün yırtıcı yaratık; *'ucuz'*); bambaşka bir kavrama geçmesi ise **Anlam Kayması (Başka Anlama Geçiş)**tir (*'savak'* eskiden akılsız → bugün su bendi).\n💡 Hile: **Büyük kümeden küçük kümeye (tüm meyveler → incir; tüm çocuklar → erkek çocuk)** = **Anlam Daralması**; **küçükten büyüğe (güreş ödülü → tüm ödüller)** = **Anlam Genişlemesi**; **Kötü → İyi ('yavuz: fena → yiğit')** = **Anlam İyileşmesi**; **İyi → Kötü ('canavar: canlı → korkunç yaratık')** = **Anlam Kötüleşmesi**; **hiç bağ kalmadan başka şeye sıçrama** = **Anlam Kayması**.",
            "pattern": r"\banlam\s+daralması[a-zçğıöşü]*\b|\banlam\s+genişlemesi[a-zçğıöşü]*\b|\banlam\s+kayması[a-zçğıöşü]*\b|\banlam\s+kötüleşmesi[a-zçğıöşü]*\b|\banlam\s+iyileşmesi[a-zçğıöşü]*\b",
        },
        {
            "id": "tde7_noktalama_isaretleri_tekil",
            "term": "Noktalama İşaretleri (Nokta, Virgül, Soru İşareti, Üç Nokta, Kesme İşareti, Kısa Çizgi, Yay Ayraç)",
            "sayfa": 118,
            "tanim": "Yazıda anlam karışıklığını önleyen, durakları ve tonlamayı belirleyen işaretlerdir: tamamlanmış cümlenin ve sıra sayıların sonuna **Nokta (.)**; eş görevli sözcüklerin, sıralı cümlelerin, ara sözlerin ve yüklemden uzak düşmüş öznenin yanına **Virgül (,)**; tamamlanmamış (eksiltili) cümlelerin sonuna **Üç Nokta (…)**; özel adlara gelen çekim eklerini ayırmaya **Kesme İşareti (’)**; satır sonu bölmesi, ara söz ve ek/kök ayrımına **Kısa Çizgi (-)**; ek açıklama, okunuş ve tiyatroda hareket/jest açıklamalarına **Yay Ayraç ()** konur.\n💡 Hile: **'Sıralı cümleleri ayırmak / uzak düşmüş özne / tırnak içinde olmayan alıntı / ret-kabul kelimesi (Evet, Peki,)'** = **Virgül (,)**; **'Yüklemi olmayan eksiltili cümle'** = **Üç Nokta (…)**; **'Tiyatroda konuşanın hareket ve jest açıklaması'** = **Yay Ayraç ()**.",
            "pattern": r"\bNokta\s*\(\.\)|\bVirgül\s*\(,\)|\bSoru\s+işareti\s*\(\?\)|\bÜç\s+nokta\s*\([.…]{1,3}\)|\bKesme\s+işareti\s*\([’']\)|\bKısa\s+çizgi\s*\(-\)|\byay\s+ayraç\b",
        },
    ],
    8: [
        {
            "id": "tde8_peyami_safa",
            "term": "Peyami Safa (Dokuzuncu Hariciye Koğuşu, Fatih-Harbiye)",
            "sayfa": 46,
            "tanim": "Cumhuriyet Dönemi'nde **bireyin iç dünyasını esas alan (psikolojik) roman** anlayışının en büyük ustasıdır; madde-ruh, Doğu-Batı, akıl-sezgi çatışmasını ve hastalık psikolojisini derin ruh çözümlemeleriyle işlemiştir. Başyapıtı, kemik veremi hastası 15 yaşındaki bir gencin (kendi çocukluğunun) acılarını anlattığı **otobiyografik ve psikolojik romanı Dokuzuncu Hariciye Koğuşu**'dur (*Fatih-Harbiye, Matmazel Noraliya'nın Koltuğu, Yalnızız, Sözde Kızlar* - geçim için yazdığı polisiye *Cingöz Recai* dizisinde **Server Bedi** takma adını kullanmıştır).\n💡 Hile: **'Otobiyografik + psikolojik roman + hasta gencin hastane koridorlarındaki ruhsal/bedensel acısı = Dokuzuncu Hariciye Koğuşu = Peyami Safa (Server Bedi)'**.",
            "pattern": r"\bpeyami\s+safa\b|\bdokuzuncu\s+hariciye\s+koğuşu\b",
        },
        {
            "id": "tde8_tarik_bugra_sevinc_munevver",
            "term": "Bireyin İç Dünyası ve Millî-Tarihî Roman Ustaları (Tarık Buğra, Sevinç Çokum, Münevver Ayaşlı, Memduh Şevket - Ayaşlı ve Kiracıları)",
            "sayfa": 50,
            "tanim": "Cumhuriyet Dönemi romanında bireyin psikolojisini ve tarihî-toplumsal değerleri işleyen yazarlardır: **Tarık Buğra** (*Küçük Ağa* - Kurtuluş Savaşı'nda İstanbullu Hoca'nın Çolak Salih ile Kuvayımilliye'ye geçişi; *Osmancık* - Osmanlı'nın kuruluşu; *Siyah Kehribar, İbiş'in Rüyası*); **Sevinç Çokum** (*Zor, Hilal Görününce, Ağustos Başağı*); **Münevver Ayaşlı** (*Pertev Bey'in Üç Kızı*) ve **Memduh Şevket Esendal**'ın Cumhuriyet'in ilk yıllarındaki Ankara apartman hayatını anlattığı **Ayaşlı ve Kiracıları** romanı.\n💡 Hile: **Küçük Ağa + Osmancık → Tarık Buğra**; **Ayaşlı ve Kiracıları → Memduh Şevket Esendal** (Sakın *Ayaşlı ve Kiracıları* romanını yazar *Münevver Ayaşlı* ile karıştırma!).",
            "pattern": r"\btarık\s+buğra\b|\bsevinç\s+çokum\b|\bmünevver\s+ayaşlı\b|\bayaşlı\s+ve\s+kiracıları\b",
        },
        {
            "id": "tde8_oguz_atay_eserleri",
            "term": "Oğuz Atay Eserleri (Tutunamayanlar, Tehlikeli Oyunlar, Korkuyu Beklerken, Bir Bilim Adamının Romanı)",
            "sayfa": 66,
            "tanim": "Türk edebiyatında **postmodern romanın kurucusu Oğuz Atay**'ın dört temel eseridir: Türk edebiyatında ilk postmodern roman sayılan **Tutunamayanlar** (Selim Işık ve Turgut Özben; küçük burjuva aydın eleştirisi, ironi, bilinç akışı), **Tehlikeli Oyunlar** (Hikmet Benol), üniversite hocası Prof. Mustafa İnan'ın hayatını anlattığı **biyografik romanı Bir Bilim Adamının Romanı** ve tek hikâye kitabı **Korkuyu Beklerken** (*Oyunlarla Yaşayanlar* ise tiyatrosudur).\n💡 Hile: Oğuz Atay'ın eserlerini türüne göre ayır: **Tutunamayanlar & Tehlikeli Oyunlar = Postmodern Roman**; **Bir Bilim Adamının Romanı (Mustafa İnan) = Biyografik Roman**; **Korkuyu Beklerken = Hikâye (Öykü)**!",
            "pattern": r"\btutunamayanlar\b|\btehlikeli\s+oyunlar\b|\bkorkuyu\s+beklerken\b|\bbir\s+bilim\s+adamının\s+romanı\b",
        },
        {
            "id": "tde8_cengiz_aytmatov_ve_turk_dunyasi",
            "term": "Cengiz Aytmatov ve Türk Dünyası Romanları (Toprak Ana, Elveda Gülsarı, Beyaz Gemi, Gün Olur Asra Bedel, Ayaz İshaki, Ziya Samedi)",
            "sayfa": 88,
            "tanim": "**Cengiz Aytmatov**, Kırgız bozkır kültürünü, efsaneleri ve 2. Dünya Savaşı/Sovyet rejimi acılarını evrensel boyuta taşıyan **'Bozkırın Bilgesi'**dir: **Gün Olur Asra Bedel** (*Mankurt* efsanesi ve Nayman Ana), **Beyaz Gemi** (Maral Ana efsanesi), **Toprak Ana** (Tolgonay'ın savaşta eşini ve üç oğlunu kaybedip toprakla dertleşmesi), **Elveda Gülsarı** (Tanabay ve atı Gülsarı) ve *Cemile*. Ayrıca Kazan Tatar edebiyatından **Ayaz İshaki** (*Üyge Taba / Eve Doğru*) ve Uygur Türk edebiyatından **Ziya Samedi** (*Yılların Sırrı*) Türk Dünyası edebiyatının temsilcileridir.\n💡 Hile: **Toprak Ana + Elveda Gülsarı + Beyaz Gemi + Gün Olur Asra Bedel (Mankurt) + Cemile = Cengiz Aytmatov (Kırgız)**; **Ayaz İshaki - Üyge Taba = Tatar**; **Ziya Samedi - Yılların Sırrı = Uygur**.",
            "pattern": r"\btoprak\s+ana\b|\belveda\s+gülsarı\b|\bbeyaz\s+gemi\b|\bgün\s+olur\s+asra\s+bedel\b|\bayaz\s+ishaki\b|\büyge\s+taba\b|\bziya\s+samedi\b|\byılların\s+sırrı\b",
        },
        {
            "id": "tde8_huzur_sis_ve_gece_biyografik",
            "term": "Cumhuriyet Dönemi Romanları (Huzur - Ahmet Hamdi Tanpınar; Sis ve Gece - Ahmet Ümit; Hava Kurşun Gibi Ağır - Hıfzı Topuz)",
            "sayfa": 54,
            "tanim": "Cumhuriyet Dönemi Türk romanının farklı yönelimlerdeki başyapıtlarıdır: **Ahmet Hamdi Tanpınar**'ın İstanbul, musiki, tarih ve Doğu-Batı bunalımını Mümtaz ile Nuran'ın aşkı etrafında işlediği **Huzur** (*Saatleri Ayarlama Enstitüsü, Sahnenin Dışındakiler, Mahur Beste*); çağdaş polisiye roman ustası **Ahmet Ümit**'in **Sis ve Gece** (*İstanbul Hatırası, Beyoğlu Rapsodisi*); **Hıfzı Topuz**'un Nâzım Hikmet'in hayatını anlattığı **biyografik romanı Hava Kurşun Gibi Ağır** (ve *Goethe - Bir Dehanın Romanı*).\n💡 Hile: **Huzur (Mümtaz & Nuran / İstanbul & musiki) → Ahmet Hamdi Tanpınar**; **Sis ve Gece (polisiye) → Ahmet Ümit**; **Hava Kurşun Gibi Ağır (Nâzım Hikmet'in hayatı) → Biyografik Roman**.",
            "pattern": r"\bdokuzuncu\s+hariciye\s+koğuşu\b|\bsis\s+ve\s+gece\b|\bhava\s+kurşun\s+gibi\s+ağır\b|\bgoethe\s*-\s*bir\s+dehanın\s+romanı\b",
            "option_only_pattern": r"^Huzur$",
        },
        {
            "id": "tde8_turan_oflazoglu_tiyatrolari",
            "term": "Turan Oflazoğlu Tiyatroları (Keziban, Elif Ana, Kösem Sultan, Genç Osman, Deli İbrahim, IV. Murat)",
            "sayfa": 112,
            "tanim": "Cumhuriyet Dönemi tiyatro yazarı **Turan Oflazoğlu**'nun, önce köy/töre trajedisi olarak yazdığı **Keziban** ve *Allah'ın Dediği Olur* (*Elif Ana*) oyunları ile ardından Osmanlı tarihindeki iktidar ve insan trajedisini şiirsel bir dille sahneye taşıdığı **Kösem Sultan, Genç Osman, Deli İbrahim, IV. Murat, Cem Sultan** ve *Yine Bir Gülnihal* eserleridir.\n💡 Hile: **'Kösem Sultan + Genç Osman + Deli İbrahim + IV. Murat + Keziban + Elif Ana'** oyunlarından herhangi ikisini yan yana görürsen yazar kesinlikle **Turan Oflazoğlu**dur.",
            "pattern": r"\bkeziban\b|\belif\s+ana\b|\bkösem\s+sultan\b|\bgenç\s+osman\b|\bdeli\s+ibrahim\b",
        },
        {
            "id": "tde8_dunya_ve_turk_soylev_tiyatro_tarihi",
            "term": "Türk ve Dünya Söylev / Tiyatro Tarihi (Bilge Kağan, Kültigin, Tonyukuk, Çiçero, Bossuet, Seneca, Dionysos)",
            "sayfa": 156,
            "tanim": "Söylev (hitabet) ve tiyatro türünün tarihsel kökleridir: Türk edebiyatında ilk söylev örneği **Orhun Yazıtları**'nda **Bilge Kağan**'ın (**Kültigin** ve **Tonyukuk** anıtlarıyla birlikte) Türk milletine seslenişidir. Dünya edebiyatında söylev türünün kurucuları Yunan'da **Demosthenes**, Roma/Latin'de **Çiçero (Cicero)** ve Fransız'da **Bossuet**; Antik Yunan tiyatrosunun doğuş kaynağı bağ bozumu tanrısı **Dionysos** törenleri, Roma trajedisinin ustası ise **Seneca**'dır.\n💡 Hile: **Türklerde ilk söylev → Bilge Kağan (Orhun Yazıtları)**; **Dünya söylev (hitabet) ustaları → Demosthenes (Yunan), Çiçero (Latin), Bossuet (Fransız)**; **Tiyatronun doğuşu → Antik Yunan Dionysos törenleri**.",
            "pattern": r"\bbilge\s+kağan\b|\bkültigin\b|\btonyukuk\b|\bçiçero\b|\bbossuet\b|\bseneca\b|\bdionysos\b",
        },
        {
            "id": "tde8_milli_edebiyat_zevk_modernizm",
            "term": "Cumhuriyet Dönemi Roman Yönelimleri (Millî Edebiyat Zevk ve Anlayışı, Toplumcu Gerçekçi, Bireyin İç Dünyası, Modernist/Postmodernist)",
            "sayfa": 24,
            "tanim": "Cumhuriyet Dönemi Türk romanındaki 4 ana damardır: Kurtuluş Savaşı, Anadolu ve yanlış Batılılaşmayı realist gözlemle anlatan **Millî Edebiyat Zevk ve Anlayışını Sürdüren Roman** (Yakup Kadri, Reşat Nuri, Halide Edip); ağa-köylü, işçi-patron ve göç sorunlarını işleyen **Toplumcu Gerçekçi Roman** (Yaşar Kemal, Orhan Kemal, Kemal Tahir); psikolojik tahlil ve yalnızlığa odaklanan **Bireyin İç Dünyasını Esas Alan Roman** (Peyami Safa, Tarık Buğra, Tanpınar); geleneksel kurguyu kırıp üstkurmaca, bilinç akışı ve ironi kullanan **Modernizmi / Postmodernizmi Esas Alan Roman** (Oğuz Atay, Orhan Pamuk, Adalet Ağaoğlu).\n💡 Hile: Parçada **Anadolu/Kurtuluş Savaşı** varsa **Millî Edebiyat zevk ve anlayışı**; **köylü-ağa/geçim kavgası** varsa **Toplumcu gerçekçi**; **ruhsal bunalım/psikoloji** varsa **Bireyin iç dünyası**; **bilinç akışı/üstkurmaca/ironi** varsa **Modernizm / Postmodernizm**dir.",
            "pattern": r"\bmillî\s+edebiyat\s+zevk\s+ve\s+anlayışını\s+sürdüren\b|\bmodernizmi\s+esas\s+alan\b|\bpostmodernizmi\s+esas\s+alan\b",
        },
        {
            "id": "tde8_sahne_tiyatro",
            "term": "Sahne (Tiyatro Terimi)",
            "sayfa": 104,
            "tanim": "Tiyatro yapısında oyuncuların oyunu sergiledikleri, seyircilerin rahatça görebilmesi için yerden yükseltilmiş özel alan; aynı zamanda bir perdenin kişilerin girip çıkmasıyla oluşan alt bölümüdür.\n💡 Hile: **Oyunun oynandığı yükseltilmiş platform = Sahne**; **sahnenin arkasındaki hazırlık bölümü = Kulis**; **oyuncuya replik fısıldayan görevli = Suflör**.",
            "pattern": r"\bsahne\s+sanatları\b",
            "option_only_pattern": r"^sahne$",
            "stem_context_pattern": r"tiyatro|oyun|seyirci|dekor",
        },
    ],
}

HILE_REFINEMENT_SYSTEM_PROMPT = """Sen MEB Açık Öğretim Lisesi Başmüfettişi ve dahi bir Edebiyat/Dil Bilgisi Hilesi Tasarımcısısın.
Sana TDE (Türk Dili ve Edebiyatı) dersinden kavram tanımları verilecek.
Her tanımda açıklama metni ve en altta `💡 Hile:` satırı bulunuyor.

GÖREVİN:
1. Tanımın gövde kısmındaki akademik doğruluğu, `**kalın**` vurguları, analojileri ve varsa `---` ile ayrılmış sınıflar arası gelişim katmanlarını AYNEN KORU.
2. En alttaki `💡 Hile:` satırını kontrol et:
   - Etiket kesinlikle `💡 Hile:` olmalı (`💡 Sınav Şifresi:` veya `💡 İpucu:` OLMAMALI).
   - İçeriği sıkıcı bir ders kitabı özeti DEĞİL, gerçekten **"normalde çok zor veya çok karıştırılan bir şeyi deha bir akılla saniyeler içinde kolaycık çözdüren"** zekice bir zihinsel kısayol / X-ray hilesi olmalı!
   - Öğrenci bu `💡 Hile:` satırını okuduğunda "Vay be, bu hileyle bu kavramı bir daha hayatta karıştırmam!" demeli.

SADECE aşağıdaki JSON formatında yanıt ver:
```json
{
  "results": [
    {
      "id": "kavram_id",
      "tanim": "Gövde metni...\n💡 Hile: Deha zihinsel kısayol..."
    }
  ]
}
```"""


def load_textbook_pages(sem: int) -> Tuple[int, List[str]]:
    meta = json.loads((DOCS_TDE_DIR / f"tde_{sem}" / f"tde_{sem}.json").read_text(encoding="utf-8"))
    md = (DOCS_TDE_DIR / f"tde_{sem}" / f"tde_{sem}.md").read_text(encoding="utf-8")
    start_page = int(meta["sorumlu_sayfa_araligi"][0])
    pages = md.split("\f")
    return start_page, pages


def find_page_in_textbook(sem: int, regex_str: str, fallback_page: int) -> int:
    try:
        start_page, pages = load_textbook_pages(sem)
        rx = re.compile(regex_str, re.IGNORECASE)
        for idx, page_text in enumerate(pages):
            if rx.search(page_text):
                return start_page + idx
    except Exception:
        pass
    return fallback_page


def clean_regex_escaping(pat: str) -> str:
    if not pat:
        return ""
    out = re.sub(r"\\+b", r"\\b", pat)
    out = re.sub(r"\\+s", r"\\s", out)
    out = re.sub(r"\\+\(", r"\\(", out)
    out = re.sub(r"\\+\)", r"\\)", out)
    out = re.sub(r"\\+\.", r"\\.", out)
    out = re.sub(r"\\+\?", r"\\?", out)
    return out


def split_anchored_pattern(
    pat: str,
    cid: str,
    existing_opt: Optional[str] = None,
    existing_ctx: Optional[str] = None,
) -> Tuple[str, Optional[str], Optional[str]]:
    """`pattern` içindeki `^...$` çapalı parçaları `option_only_pattern` ve `stem_context_pattern` olarak ayırır.
    İkinci ve sonraki çalıştırmalarda mevcut `option_only_pattern` ve `stem_context_pattern` değerlerini de korur (idempotent).
    """
    if cid in PATTERN_OVERRIDES:
        ov = PATTERN_OVERRIDES[cid]
        return (
            ov["pattern"],
            ov.get("option_only_pattern"),
            ov.get("stem_context_pattern"),
        )

    parts = [p.strip() for p in pat.split("|") if p.strip()]
    if existing_opt:
        for p in existing_opt.split("|"):
            p = p.strip()
            if p and p not in parts:
                parts.append(p)

    general_parts: List[str] = []
    option_parts: List[str] = []
    stem_contexts: List[str] = []
    if existing_ctx:
        for c in existing_ctx.split("|"):
            c = c.strip()
            if c and c not in stem_contexts:
                stem_contexts.append(c)

    for p in parts:
        if p.startswith("^") and p.endswith("$"):
            option_parts.append(p)
            if p in STEM_CONTEXT_BY_ANCHOR:
                stem_contexts.append(STEM_CONTEXT_BY_ANCHOR[p])
            else:
                # Eğer özel bağlam gerektirmeyen net bir edebiyat terimiyse (örn. ^Gazel$, ^Koşma$, ^yuğ$),
                # hem şıkta hem genel metinde kelime sınırıyla eşleşebilsin
                inner = p[1:-1]
                if len(inner) >= 3 and r"\?" not in inner:
                    general_parts.append(rf"\b{inner}\b")
        else:
            if not (p.startswith(r"\b") or p.startswith("^") or p.startswith("(")):
                p = rf"\b{p}"
            if not (p.endswith(r"\b") or p.endswith("$") or p.endswith(")") or p.endswith("*")):
                p = rf"{p}\b"
            general_parts.append(p)

    gen_str = "|".join(dict.fromkeys(general_parts))
    opt_str = "|".join(dict.fromkeys(option_parts)) if option_parts else None
    ctx_str = "|".join(dict.fromkeys(stem_contexts)) if stem_contexts else None
    return gen_str, opt_str, ctx_str


def convert_sifre_to_hile(tanim: str) -> str:
    if not tanim:
        return tanim
    out = re.sub(
        r"💡\s*(?:Sınav\s+Şifresi|Şifre|İpucu|Formül\s*/\s*Şifre|Formül)\s*:",
        "💡 Hile:",
        tanim,
        flags=re.IGNORECASE,
    )
    if "💡" in out and "💡 Hile:" not in out:
        out = re.sub(r"💡\s*", "💡 Hile: ", out)
    return out


def normalize_and_extend_semester_catalog(sem: int) -> List[Dict[str, Any]]:
    path = CONCEPTS_DIR / f"TDE_{sem}_concepts.json"
    existing: List[Dict[str, Any]] = json.loads(path.read_text(encoding="utf-8"))
    new_by_id = {c["id"]: c for c in NEW_CONCEPTS_BY_SEMESTER.get(sem, [])}

    # Eğer git HEAD'de orijinal ^...$ çapalı pattern varsa ve önceki çalıştırmada silinmişse geri kazan
    head_pat_by_id: Dict[str, str] = {}
    try:
        import subprocess
        head_raw = subprocess.check_output(
            ["git", "show", f"HEAD:data/concepts/TDE_{sem}_concepts.json"],
            cwd=str(ROOT_DIR),
            stderr=subprocess.DEVNULL,
        ).decode("utf-8")
        for hc in json.loads(head_raw):
            if isinstance(hc, dict) and hc.get("id") and hc.get("pattern"):
                head_pat_by_id[hc["id"]] = hc["pattern"]
    except Exception:
        pass

    seen_ids = set()
    normalized: List[Dict[str, Any]] = []

    for item in existing:
        cid = item["id"]
        if cid in seen_ids:
            # Aynı dönem içindeki mükerrer id'yi atla
            continue
        seen_ids.add(cid)

        if cid in new_by_id:
            nc = new_by_id[cid]
            gen_pat = nc["pattern"]
            opt_pat = nc.get("option_only_pattern")
            ctx_pat = nc.get("stem_context_pattern")
        else:
            source_pat = head_pat_by_id.get(cid, item.get("pattern", ""))
            raw_pat = clean_regex_escaping(source_pat)
            gen_pat, opt_pat, ctx_pat = split_anchored_pattern(
                raw_pat,
                cid,
                existing_opt=item.get("option_only_pattern"),
                existing_ctx=item.get("stem_context_pattern"),
            )

        item["subject"] = "TDE"
        item["ders"] = DERS_NAMES[sem]
        item["donem"] = sem
        item["tanim"] = convert_sifre_to_hile(item.get("tanim", ""))
        item["pattern"] = gen_pat
        if opt_pat:
            item["option_only_pattern"] = opt_pat
        else:
            item.pop("option_only_pattern", None)
        if ctx_pat:
            item["stem_context_pattern"] = ctx_pat
        else:
            item.pop("stem_context_pattern", None)

        normalized.append(item)

    # Yeni kavramları ekle
    for new_c in NEW_CONCEPTS_BY_SEMESTER.get(sem, []):
        cid = new_c["id"]
        if cid in seen_ids:
            continue
        seen_ids.add(cid)

        page_no = find_page_in_textbook(sem, new_c["pattern"], new_c["sayfa"])
        entry: Dict[str, Any] = {
            "id": cid,
            "base_id": cid,
            "term": new_c["term"],
            "subject": "TDE",
            "ders": DERS_NAMES[sem],
            "ders_kodu": None,
            "donem": sem,
            "unite_no": None,
            "sayfa": page_no,
            "tanim": convert_sifre_to_hile(new_c["tanim"]),
            "baglam_farki": None,
            "sinav_ipucu": None,
            "pattern": new_c["pattern"],
            "aliases": [],
        }
        if new_c.get("option_only_pattern"):
            entry["option_only_pattern"] = new_c["option_only_pattern"]
        if new_c.get("stem_context_pattern"):
            entry["stem_context_pattern"] = new_c["stem_context_pattern"]
        normalized.append(entry)

    return normalized


def write_python_catalog(sem: int, concepts: List[Dict[str, Any]]) -> None:
    py_path = CATALOGS_DIR / f"tde{sem}_precise_catalog.py"
    var_name = f"PRECISE_TDE{sem}_CONCEPTS"
    lines = [
        "#!/usr/bin/env python3",
        "# -*- coding: utf-8 -*-",
        f'"""MEB TDE {sem} Yüksek Hassasiyetli Kanonik Kavram, Eser ve Yazar Sözlüğü."""',
        "",
        "from typing import Any, Dict, List",
        "",
        f"{var_name}: List[Dict[str, Any]] = [",
    ]
    for c in concepts:
        lines.append("    {")
        lines.append(f'        "id": {json.dumps(c["id"], ensure_ascii=False)},')
        lines.append(f'        "term": {json.dumps(c["term"], ensure_ascii=False)},')
        lines.append(f'        "sayfa": {json.dumps(c.get("sayfa", 14), ensure_ascii=False)},')
        lines.append(f'        "tanim": {json.dumps(c["tanim"], ensure_ascii=False)},')
        lines.append(f'        "pattern": {json.dumps(c.get("pattern", ""), ensure_ascii=False)},')
        if c.get("option_only_pattern"):
            lines.append(f'        "option_only_pattern": {json.dumps(c["option_only_pattern"], ensure_ascii=False)},')
        if c.get("stem_context_pattern"):
            lines.append(f'        "stem_context_pattern": {json.dumps(c["stem_context_pattern"], ensure_ascii=False)},')
        lines.append("    },")
    lines.append("]")
    lines.append("")
    py_path.write_text("\n".join(lines), encoding="utf-8")


def refine_hiles_with_evren(
    all_by_sem: Dict[int, List[Dict[str, Any]]],
    workers: int = 10,
) -> None:
    client = EvrenClient()
    if not client.is_configured:
        print("⚠️ EVREN_API_KEY yapılandırılmamış, yerel 💡 Hile metinleri korunuyor.")
        return

    state: Dict[str, Any] = {"completed_ids": {}}
    if HILE_STATE_PATH.exists():
        try:
            state = json.loads(HILE_STATE_PATH.read_text(encoding="utf-8"))
        except Exception:
            pass

    completed_ids: Dict[str, str] = state.get("completed_ids", {})

    pending_items: List[Tuple[int, Dict[str, Any]]] = []
    for sem, items in all_by_sem.items():
        for item in items:
            cid = item["id"]
            if cid in completed_ids:
                item["tanim"] = convert_sifre_to_hile(completed_ids[cid])
            else:
                pending_items.append((sem, item))

    if not pending_items:
        print(f"✅ Tüm {len(completed_ids)} TDE kavramının '💡 Hile:' içeriği EVREN ile doğrulanmış.")
        return

    batch_size = 12
    batches: List[List[Tuple[int, Dict[str, Any]]]] = [
        pending_items[i : i + batch_size] for i in range(0, len(pending_items), batch_size)
    ]
    print(f"🚀 EVREN (deepseek-v4.1-flash) '💡 Hile:' Deha Kısayol Motoru: {len(pending_items)} kavram ({len(batches)} paket)...")

    def _process_batch(batch: List[Tuple[int, Dict[str, Any]]]) -> Dict[str, str]:
        payload = [
            {
                "id": it["id"],
                "term": it["term"],
                "ders": f"TDE {sem}",
                "tanim": it["tanim"],
            }
            for sem, it in batch
        ]
        user_prompt = (
            f"Aşağıdaki {len(payload)} adet TDE kavramının gövde tanımını koruyarak en alttaki `💡 Hile:` "
            f"kısmını normalde zor veya karıştırılan bir noktayı deha bir akılla saniyeler içinde kolaycık "
            f"çözdüren gerçek bir hileye dönüştür:\n"
            f"{json.dumps(payload, ensure_ascii=False, indent=2)}"
        )
        for model in ["deepseek-v4.1-flash", "qwen3.8-flash-next"]:
            try:
                content, _ = client.chat_completion(
                    messages=[
                        {"role": "system", "content": HILE_REFINEMENT_SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt},
                    ],
                    model=model,
                    temperature=0.15,
                    max_tokens=4096,
                    thinking=False,
                )
                parsed = extract_json_object(content)
                if parsed and isinstance(parsed.get("results"), list):
                    out_map: Dict[str, str] = {}
                    for r in parsed["results"]:
                        if isinstance(r, dict) and r.get("id") and r.get("tanim"):
                            t_val = convert_sifre_to_hile(str(r["tanim"]).strip())
                            if "💡 Hile:" in t_val and len(t_val) >= 40:
                                out_map[str(r["id"])] = t_val
                    if out_map:
                        return out_map
            except Exception:
                time.sleep(1.0)
        return {}

    done = 0
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(_process_batch, b): b for b in batches}
        for fut in as_completed(futures):
            batch = futures[fut]
            res_map = fut.result()
            done += 1
            for _sem, item in batch:
                cid = item["id"]
                if cid in res_map:
                    item["tanim"] = res_map[cid]
                    completed_ids[cid] = res_map[cid]
                else:
                    completed_ids[cid] = item["tanim"]
            state["completed_ids"] = completed_ids
            HILE_STATE_PATH.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")
            print(f"  [{done}/{len(batches)}] Paket tamamlandı ({len(res_map)} hile rafine edildi) | {time.time() - t0:.1f}s", flush=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="TDE 1-8 Kavram Kataloglarını Normalize Et ve EVREN Hileleriyle Zenginleştir")
    parser.add_argument("--skip-evren", action="store_true", help="EVREN çağrısını atla (yalnızca katalog ve yerel 💡 Hile üret)")
    parser.add_argument("--workers", type=int, default=10, help="EVREN paralel iş parçacığı sayısı")
    args = parser.parse_args()

    all_by_sem: Dict[int, List[Dict[str, Any]]] = {}
    total_count = 0
    for sem in range(1, 9):
        concepts = normalize_and_extend_semester_catalog(sem)
        all_by_sem[sem] = concepts
        total_count += len(concepts)
        print(f"📘 TDE {sem}: {len(concepts)} kavram hazırlandı.")

    print(f"📊 Toplam TDE 1-8 Kavram Sayısı: {total_count}")

    if not args.skip_evren:
        refine_hiles_with_evren(all_by_sem, workers=args.workers)

    for sem, concepts in all_by_sem.items():
        json_path = CONCEPTS_DIR / f"TDE_{sem}_concepts.json"
        json_path.write_text(json.dumps(concepts, ensure_ascii=False, indent=2), encoding="utf-8")
        write_python_catalog(sem, concepts)

    print("✅ Tüm TDE_1..8_concepts.json ve tde1..8_precise_catalog.py dosyaları kaydedildi!")


if __name__ == "__main__":
    main()
