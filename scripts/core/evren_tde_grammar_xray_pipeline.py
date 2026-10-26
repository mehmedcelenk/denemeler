#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""EVREN Destekli TDE 1-8 Tam Müfredat Dil Bilgisi (Cümle Ögeleri & Sözcük Türleri) Röntgen Motoru.

Her TDE sorusunu (TDE 1..8) EVREN LLM ile analiz ederek:
1. Cümlenin Ögeleri Sınırlarını (`|` kavşaklarını: Özne, Yüklem, Nesne, Dolaylı Tümleç, Zarf Tümleci, Edat Tümleci)
2. TDE 1-8 MEB PDF Müfredatındaki Tüm Sözcük Türleri ve Yapılarını:
   - Sıfatlar (Niteleme, İşaret, Sayı, Belgisiz, Soru, Adlaşmış, Unvan, Pekiştirme, Küçültme, Birleşik Sıfat)
   - Zamirler (Kişi, Dönüşlülük, İşaret, Belgisiz, Soru, İlgi Zamiri -ki)
   - Zarflar (Durum, Zaman, Miktar/Derecelendirme, Yer-Yön, Soru Zarfı)
   - Edat (İlgeç), Bağlaç, Ünlem
   - Fiilimsiler (İsim-Fiil, Sıfat-Fiil, Zarf-Fiil) ve Fiil Yapısı/Çatısı/Ek-Fiil
   - İsim Tamlamaları (Belirtili, Belirtisiz, Zincirleme)
tespit eder ve metin bütünlüğünü %100 koruyarak `soru_xray` içine işler.
"""

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import html
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

TDE_JSON_PATH = ROOT_DIR / "data" / "subjects" / "TDE.json"
CACHE_PATH = ROOT_DIR / "data" / "evren_cache" / "tde_grammar_xray_cache.json"

SYSTEM_PROMPT = """Sen MEB Açık Öğretim Lisesi Türk Dili ve Edebiyatı (TDE 1-8) Başöğretmeni ve Dilbilim Uzmanısın.
Görevin, verilen soru metnindeki cümleleri MEB müfredatına %100 sadık kalarak tahlil etmek ve SADECE geçerli bir JSON nesnesi döndürmektir.

### 1. CÜMLENİN ÖGELERİ (`junctions` - Öge Kavşakları `|`)
- Soru metnindeki cümleleri ögelerine ayır:
  * **Temel Ögeler:** Yüklem, Özne (Açık Özne, Gizli Özne, Sözde Özne)
  * **Yardımcı Ögeler:** Belirtili Nesne (neyi/kimi?), Belirtisiz Nesne (ne?), Dolaylı Tümleç / Yer Tamlayıcısı (kime/kimde/kimden/nereye/nerede/nereden?), Zarf Tümleci (nasıl/ne zaman/ne kadar/niçin/neyle?), Edat Tümleci
  * **Cümle Dışı Unsur:** Bağlaçlar, ünlemler, ara sözler
- İki ögenin birleştiği her sınır noktası için `junctions` listesine bir kayıt ekle:
  * `after_phrase`: Sol taraftaki ögenin son 1-3 kelimesi (metinde birebir geçtiği şekliyle, noktalama varsa dahil).
  * `left_role`: Sol taraftaki ögenin tam adı (Örn: "Zarf Tümleci", "Özne", "Belirtili Nesne", "Dolaylı Tümleç (Yer Tamlayıcısı)").
  * `right_role`: Sağ taraftaki ögenin tam adı (Örn: "Özne", "Yüklem", "Zarf Tümleci", "Belirtisiz Nesne").
  * `explanation`: Yükleme hangi soru sorularak bu ögenin bulunduğunu ve iki öge arasındaki sınırı açıklayan 1 cümlelik net sınav ipucu.
- Not: En sondaki soru yönergesi cümlesini ("Bu parçadan hareketle aşağıdakilerden hangisine..." vb.) ögelere ayırmana gerek yoktur; yalnızca asıl metin/paragraf/dize/örnek cümleleri ayır (ancak soru doğrudan tek cümlelik bir dil bilgisi sorusuysa onu da ayır).

### 2. SÖZCÜK TÜRLERİ VE DİL BİLGİSİ YAPILARI (`pos_annotations` - Altı Çizilecek Öğeler)
TDE 1-8 ders kitaplarında yer alan aşağıdaki müfredat konularından metinde bulunan ÖNEMLİ ve ÖĞRETİCİ örnekleri eksiksiz çıkar:
- **`adj` (Sıfatlar / Ön Adlar):**
  * Niteleme Sıfatı (nasıl?), İşaret Sıfatı (bu/şu/o + isim), Sayı Sıfatı (asıl, sıra, üleştirme, kesir), Belgisiz Sıfat (bir, birkaç, birçok, bazı, her, hiçbir, bütün, kimi, çoğu + isim), Soru Sıfatı (hangi, kaç, nasıl + isim), Adlaşmış Sıfat (gençler, iyiler vb.), Unvan Sıfatı, Pekiştirme Sıfatı (masmavi, tertemiz), Küçültme Sıfatı (-cik, -ce, -ımsı), Kurallı veya Anlamca Kaynaşmış Birleşik Sıfat.
- **`pron` (Zamirler / Adıllar):**
  * Kişi (Şahıs) Zamiri (ben, sen, o, biz, siz, onlar), Dönüşlülük Zamiri (kendi), İşaret Zamiri (bu, şu, o, bunlar, burası, öteki vb. - tek başına ismin yerini tutan), Belgisiz Zamir (biri, hepsi, herkes, kimse, çoğu, bazısı, şey, kimi), Soru Zamiri (kim, ne, hangisi, nereye, nerede), İlgi Zamiri (-ki).
- **`adv` (Zarflar / Belirteçler):**
  * Durum Zarfı (fiile/fiilimsiye sorulan nasıl?, kesinlik, olasılık, yineleme), Zaman Zarfı (ne zaman?), Miktar / Derecelendirme Zarfı (ne kadar?: daha, en, pek, çok, az, biraz, oldukça, fazla), Yer-Yön Zarfı (eksiz: içeri, dışarı, ileri, geri, aşağı, yukarı, öte, beri), Soru Zarfı (nasıl, neden, niçin, ne zaman, ne kadar).
- **`edat` (Edat, Bağlaç, Ünlem):**
  * Edat (İlgeç): için, gibi, kadar, göre, doğru, karşı, rağmen, dolayı, ötürü, beri, dek, değin, üzere, ile (-le/-la), yalnız/ancak (=sadece), mi.
  * Bağlaç: ve, veya, ya da, ama, fakat, lakin, ancak (=ama), yalnız (=ama), çünkü, zira, ki, de/da, ise, hem...hem, ne...ne, ya...ya, hâlbuki, oysa, üstelik, hatta, bile.
  * Ünlem: ey, hey, ah, vah, eyvah, of, hişt, sakın, haydi.
- **`verbal` (Fiilimsiler, Fiil Yapısı, Ek-Fiil, Çatı):**
  * İsim-Fiil (Mastar: -ma/-me, -ış/-iş, -mak/-mek)
  * Sıfat-Fiil (Ortaç: -an, -ası, -mez, -ar, -dik, -ecek, -miş) ve Adlaşmış Sıfat-Fiil
  * Zarf-Fiil (Bağ-Fiil / Ulaç: -ıp, -arak, -madan, -maksızın, -dıkça, -ınca, -alı, -ken, -a...-a, -r...-maz, -diğinde, -casına, -esiye)
  * Kurallı Birleşik Fiil (Yeterlilik -ebil, Tezlik -iver, Süerlik -edur/-ekal/-egel, Yaklaşma -eyaz), Yardımcı Eylemle Kurulan Birleşik Fiil (et-, ol-, kıl-), Anlamca Kaynaşmış Birleşik Fiil
  * Ek-Fiil (idi, imiş, ise, -dır)
  * Fiilde Çatı (Edilgen -l/-n, Dönüşlü -l/-n, İşteş -ş, Ettirgen/Oldurgan -r/-t/-tır)
- **`tamlama` (İsim Tamlamaları):**
  * Belirtili İsim Tamlaması, Belirtisiz İsim Tamlaması, Zincirleme İsim Tamlaması.

### ALTIN DİLBİLİM KURALLARI (MEB MÜFREDAT HASSASİYETİ):
1. **Kavşak (`after_phrase`) Kuralı:** `after_phrase` SADECE sol taraftaki ögenin (`left_role`) BİTTİĞİ son 1-3 kelimedir! Sağdaki ögenin kelimelerini ASLA `after_phrase` içine katma!
   - Örnek: *"zaman zaman terini siler"* cümlesinde:
     * 1. Kavşak: `after_phrase: "zaman zaman"`, `left_role: "Zarf Tümleci"`, `right_role: "Belirtili Nesne"`
     * 2. Kavşak: `after_phrase: "terini"`, `left_role: "Belirtili Nesne"`, `right_role: "Yüklem"`
     *(Dikkat: "terini siler" diye birleştirme; yüklemden hemen önce `terini` bitiminde ayır!)*
2. **İsim Tamlaması vs Sıfat Tamlaması Ayrımı:**
   - İkinci kelime `-ı/-i/-u/-ü / -sı/-si` iyelik eki almışsa ve birinci kelime isimse (*roman türü, devlet kapısı, ses taklitleri, yazma imkânı*), bu bir **Belirtisiz İsim Tamlaması**dır (`category: "tamlama"`). Birinci kelimeye asla sıfat deme; tamlamayı iki kelime birlikte (`"Roman türü"`, `"ses taklitlerini"`) tek bir `surface_form` olarak al!
   - Tamlayan da `-ın/-in/-un/-ün` ilgi eki almışsa (*kurmacanın dünyası, hayatın sorunları*), **Belirtili İsim Tamlaması**dır (`category: "tamlama"`).
3. **`-ki` Eki Ayrımı:**
   - `-de/-da` hal ekinden sonra veya zaman kelimesinden sonra gelen `-ki` (*masadaki, aşağıdaki, dünkü*) **Sıfat yapan `-ki`**dir; önündeki isim düşmüşse (*aşağıdakilerden*) **Adlaşmış Sıfat**tır (`category: "adj"`).
   - `-ın/-in/-im` tamlayan ekinden sonra gelen `-ki` (*benimki, seninki*) **İlgi Zamiri**dir (`category: "pron"`).
   - Ayrı yazılan `ki` ise **Bağlaç**tır (`category: "edat"`).
4. **Ek-Fiil vs Çekimli Fiil Ayrımı:**
   - Tek kip eki almış fiillere (*taşır, gelir, siler, baktı*) ASLA Ek-Fiil deme! Ek-fiil yalnızca isim soylu sözcüklere gelerek onları yüklem yapar (*güzeldi, öğrencidir, varmış*) veya çekimli fiillere gelerek **Birleşik Zamanlı Fiil** kurar (*geliyordu, taşırlar-mış, bakacak-sa*).
5. **Dolaylı Tümleç (Yer Tamlayıcısı) Kesin Kuralı:**
   - İsmin `-e, -de, -den` hal eklerini almış ve yükleme sorulan *kime/kimde/kimden/nereye/nerede/nereden* sorularına cevap veren unsurlar (*masanın üstüne, soylulardan, halktan, evden, şehre*) İSTİSNASIZ **Dolaylı Tümleç (Yer Tamlayıcısı)**tir. Bunlara ASLA Zarf Tümleci veya Belirtili Nesne deme!
6. **Adlaşmış Sıfat vs Çoğul İsim Ayrımı:**
   - Sadece kökü Niteleme Sıfatı olan ve ismi düşerek çoğul eki alan sözcükler Adlaşmış Sıfattır (*gençler, yaşlılar, yoksullar, zenginler*).
   - Kökü zaten isim olan sözcüklere (*kahramanlar, askerler, öğrenciler, insanlar*) ASLA Adlaşmış Sıfat deme; bunlar sıfat değil sadece **Çoğul İsim**dir.
7. **Sözcük Türü vs Ek Ayrımı:**
   - `sub_type` alanına asla sadece ek adı (*"İyelik Eki"*) yazma; ana sözcük türüyle birlikte ver (*"İsim: İyelik Eki Almış"*).
   - İsimlere bitişen `-le/-la` (*düşüncelerle, sözcüklerle*) tek başına bağımsız edat değil, **İsim + Vasıta Eki (İle Edatının Ekleşmiş Hali)**dir.
8. `surface_form` metinde geçen BİREBİR kelime (veya 2 kelimelik tamlama/birleşik fiil) olmalıdır. Asla kök haline çevirme, metindeki çekimli halini olduğu gibi yaz!
9. Klişe soru yönergesi kelimelerini ("aşağıdakilerden", "hangisi", "bu parçada", "buna göre", "söylenemez", "ulaşılamaz", "doğrudur", "yanlıştır", "getirilmelidir", "örnektir") `pos_annotations` içine EKLEME.
10. Her soru için en öğretici **8 ila 18 arası** `pos_annotations` ve **3 ila 12 arası** `junctions` seç.
11. Yanıtını SADECE aşağıdaki JSON şemasında ver, başka hiçbir açıklama yazma:

```json
{
  "junctions": [
    {
      "after_phrase": "dünyasına girdiğimde",
      "left_role": "Zarf Tümleci",
      "right_role": "Özne",
      "explanation": "'Ne zaman fark etmiyor?' sorusunun yanıtı olan zarf tümleci ile özne arasındaki sınır."
    }
  ],
  "pos_annotations": [
    {
      "surface_form": "girdiğimde",
      "category": "verbal",
      "sub_type": "Fiilimsi: Zarf-Fiil (Ulaç)",
      "explanation": "'-diğinde' ekiyle fiilden türeyip cümleye zaman anlamı katmıştır.",
      "exam_tip": "Fiilimsi ekleri fiil kök/gövdelerine gelir ve yan cümlecik kurar."
    }
  ]
}
```"""

VALID_CATEGORIES = {"adj", "pron", "adv", "verbal", "edat", "conj", "noun", "tamlama"}

PURE_CONJUNCTIONS = {
    "ve", "veya", "ya da", "ama", "fakat", "lakin", "çünkü", "zira", "ki",
    "de", "da", "oysa", "oysaki", "hâlbuki", "halbuki", "hatta", "üstelik",
    "hem", "ne", "ya", "ise", "bile", "dahî", "dahi",
}

PROMPT_TAIL_RE = re.compile(
    r"(\n\s*(?:Bu parça|Bu dizeler|Bu dörtlük|Bu beyit|Bu metin|Bu şiir|Buna göre|Numaralanmış|Yukarıda|Aşağıdakilerden)[^\n]*)$",
    re.IGNORECASE,
)

META_BOILERPLATE_WORDS = {
    "aşağıdakilerden",
    "aşağıdakilerin",
    "aşağıdaki",
    "yukarıdakilerden",
    "yukarıdaki",
    "hangisi",
    "hangisidir",
    "hangisine",
    "hangisinde",
    "hangisinden",
    "hangileri",
    "hangileridir",
    "söylenemez",
    "söylenebilir",
    "ulaşılamaz",
    "ulaşılabilir",
    "çıkarılamaz",
    "çıkarılabilir",
    "doğrudur",
    "yanlıştır",
    "getirilmelidir",
    "getirilebilir",
    "bırakılan",
    "boşluğa",
    "boşluklara",
    "parçadan",
    "parçada",
    "parçaya",
    "numaralanmış",
    "altı çizili",
}

EXISTING_SPAN_RE = re.compile(
    r'(<span\s+class="vocab-word\s+concept-word"[^>]*>.*?</span>)',
    re.DOTALL,
)


def extract_json_object(raw_text: str) -> Optional[Dict[str, Any]]:
    """LLM çıktısından JSON nesnesini güvenle ayıklar."""
    text = raw_text.strip()
    if "```" in text:
        match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
        if match:
            text = match.group(1)
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    candidate = text[start : end + 1]
    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        # Kontrol karakterlerini temizleyip tekrar dene
        cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", " ", candidate)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            return None


def strip_xray_to_plain(xray_html: str) -> str:
    """Üretilen xray HTML'inden kavşakları ve etiketleri soyarak saf metni döner."""
    # Önce junction spanlarını tamamen kaldır
    no_junc = re.sub(
        r'<span\s+class="xray-junction"[^>]*>.*?</span>\s*</span>',
        "",
        xray_html,
        flags=re.DOTALL,
    )
    # Kalan tüm HTML etiketlerini kaldır
    no_tags = re.sub(r"<[^>]+>", "", no_junc)
    return html.unescape(no_tags)


def compile_question_xray(
    raw_soru: str,
    existing_xray: Optional[str],
    analysis: Dict[str, Any],
) -> Optional[str]:
    """EVREN analiz çıktısını, mevcut kavram balonlarını koruyarak güvenli HTML'e derler."""
    # 1. Mevcut edebî kavram balonlarını (.vocab-word.concept-word) koru
    base_html = html.escape(raw_soru, quote=False)
    if existing_xray and "concept-word" in existing_xray:
        cleaned_existing = re.sub(
            r'<span\s+class="xray-junction"[^>]*>.*?</span>\s*</span>',
            "",
            existing_xray,
            flags=re.DOTALL,
        )
        cleaned_existing = re.sub(
            r'<span\s+class="(?:pos-word|sound-word)[^"]*"[^>]*>(.*?)</span>',
            r"\1",
            cleaned_existing,
            flags=re.DOTALL,
        )
        plain_check = html.unescape(re.sub(r"<[^>]+>", "", cleaned_existing))
        if plain_check == raw_soru:
            base_html = cleaned_existing

    # Mevcut concept-word span'larını ve en sondaki soru yönergesini placeholder ile maskele
    placeholders: List[str] = []

    def _mask_span(match: re.Match) -> str:
        idx = len(placeholders)
        placeholders.append(match.group(0))
        return f"\x00CONCEPT_{idx}\x00"

    masked_text = EXISTING_SPAN_RE.sub(_mask_span, base_html)
    masked_text = PROMPT_TAIL_RE.sub(_mask_span, masked_text)

    # 2. POS Annotations (Sözcük Türleri) uygula
    pos_list = analysis.get("pos_annotations") or []
    # Uzun ifadeleri önce eşleştir (tamlama / birleşik fiil önceliği), ancak çok uzun olanları (>35 karakter) ele
    valid_pos: List[Dict[str, Any]] = []
    seen_forms = set()
    for item in pos_list:
        if not isinstance(item, dict):
            continue
        sf = str(item.get("surface_form") or "").strip()
        cat = str(item.get("category") or "adj").strip().lower()
        sub_type = str(item.get("sub_type") or "Dil Bilgisi").strip()
        expl = str(item.get("explanation") or "").strip()
        tip = str(item.get("exam_tip") or "").strip()
        if not sf or len(sf) < 2 or len(sf) > 40 or not expl:
            continue
        key = sf.lower()
        sub_lower = sub_type.lower()
        if "bağlaç" in sub_lower or key in PURE_CONJUNCTIONS:
            cat = "conj"
            if "edat" in sub_lower and "bağlaç" not in sub_lower:
                sub_type = "Bağlaç"
        elif "tamlama" in sub_lower and "sıfat" not in sub_lower:
            cat = "tamlama"
        elif sub_lower.startswith("isim") and "fiil" not in sub_lower and "tamlama" not in sub_lower:
            cat = "noun"
        if cat not in VALID_CATEGORIES:
            cat = "adj"
        if key in META_BOILERPLATE_WORDS or key in seen_forms:
            continue
        seen_forms.add(key)
        valid_pos.append({
            "surface_form": sf,
            "category": cat,
            "sub_type": sub_type,
            "explanation": expl,
            "exam_tip": tip,
        })

    # Uzunluğa göre azalan sırala
    valid_pos.sort(key=lambda x: len(x["surface_form"]), reverse=True)

    pos_placeholders: List[str] = []

    for p in valid_pos:
        sf_escaped = html.escape(p["surface_form"], quote=False)
        # Kelime sınırlarında yalnızca ilk eşleşmeyi sar (tekrarı önle)
        pattern = re.compile(
            rf"(?<![\wçğıöşüÇĞİÖŞÜ\x00])({re.escape(sf_escaped)})(?![\wçğıöşüÇĞİÖŞÜ\x00])"
        )
        match = pattern.search(masked_text)
        if not match:
            continue

        tr_body = f"<b>{p['sub_type']}</b>: {p['explanation']}"
        if p["exam_tip"]:
            tr_body += f"\n💡 <b>Sınav Şifresi:</b> {p['exam_tip']}"
        tr_attr = html.escape(tr_body, quote=True)
        note_attr = html.escape(p["sub_type"], quote=True)
        cat_cls = f"pos-{p['category']}"

        span_html = (
            f'<span class="pos-word {cat_cls}" '
            f'data-tr="{tr_attr}" '
            f'data-note="{note_attr}" '
            f'onclick="showVocabBubble(this, event)">{match.group(1)}</span>'
        )
        p_idx = len(pos_placeholders)
        pos_placeholders.append(span_html)
        masked_text = (
            masked_text[: match.start()]
            + f"\x00POS_{p_idx}\x00"
            + masked_text[match.end() :]
        )

    # POS placeholder'larını geri aç (böylece junction araması metni bulabilir veya plain üzerinden eşleşir)
    # Ancak junction'ları yerleştirmek için önce placeholder'ları açalım, fakat HTML tag'lerinin içine girmemesini sağlayalım.
    unmasked_html = masked_text
    for idx in range(len(pos_placeholders) - 1, -1, -1):
        unmasked_html = unmasked_html.replace(f"\x00POS_{idx}\x00", pos_placeholders[idx])
    for idx in range(len(placeholders) - 1, -1, -1):
        unmasked_html = unmasked_html.replace(f"\x00CONCEPT_{idx}\x00", placeholders[idx])

    # 3. Junctions (Cümle Ögeleri `|` Ayraçları) uygula
    # HTML etiketlerinin dışındaki görünür metin indeks haritasını çıkar
    junctions = analysis.get("junctions") or []
    if junctions:
        unmasked_html = _inject_junctions_safely(unmasked_html, junctions)

    # 4. Matematiksel Doğrulama (Metin Bütünlüğü ve Tag Dengesi)
    if unmasked_html.count("<span") != unmasked_html.count("</span>"):
        return None
    recovered_plain = strip_xray_to_plain(unmasked_html)
    if recovered_plain != raw_soru:
        return None

    return unmasked_html


def _inject_junctions_safely(html_str: str, junctions: List[Dict[str, Any]]) -> str:
    """HTML etiketlerini bozmadan, yalnızca görünür metin sınırlarına `|` kavşaklarını ekler."""
    # Görünür karakterlerin html_str içindeki indekslerini çıkar
    vis_chars: List[str] = []
    vis_to_html_end: List[int] = []
    i = 0
    n = len(html_str)
    open_spans = 0

    # Hangi pozisyonlarda tüm iç span'ların (pos-word / concept-word) dışında olduğumuzu takip et
    span_depth_after: List[int] = []

    while i < n:
        if html_str[i] == "<":
            close_idx = html_str.find(">", i)
            if close_idx == -1:
                break
            tag_content = html_str[i : close_idx + 1]
            if tag_content.startswith("<span"):
                open_spans += 1
            elif tag_content.startswith("</span"):
                open_spans = max(0, open_spans - 1)
            # Eğer kapanan bir </span> ise ve son görünür karakterin hemen ardındaysa,
            # o görünür karakterin bitiş indeksini `close_idx + 1` olarak güncelle ki `|` span dışına konsun!
            if tag_content.startswith("</span") and vis_to_html_end:
                vis_to_html_end[-1] = close_idx + 1
                span_depth_after[-1] = open_spans
            i = close_idx + 1
        elif html_str[i] == "&":
            semi_idx = html_str.find(";", i, i + 10)
            if semi_idx != -1:
                entity = html_str[i : semi_idx + 1]
                decoded = html.unescape(entity)
                for ch in decoded:
                    vis_chars.append(ch)
                    vis_to_html_end.append(semi_idx + 1)
                    span_depth_after.append(open_spans)
                i = semi_idx + 1
                continue
            vis_chars.append(html_str[i])
            vis_to_html_end.append(i + 1)
            span_depth_after.append(open_spans)
            i += 1
        else:
            vis_chars.append(html_str[i])
            vis_to_html_end.append(i + 1)
            span_depth_after.append(open_spans)
            i += 1

    plain_text = "".join(vis_chars)
    insertions: Dict[int, str] = {}
    used_vis_positions: List[int] = []

    for j in junctions:
        if not isinstance(j, dict):
            continue
        after_phrase = str(j.get("after_phrase") or "").strip()
        left_role = str(j.get("left_role") or "").strip()
        right_role = str(j.get("right_role") or "").strip()
        expl = str(j.get("explanation") or "").strip()
        if not after_phrase or len(after_phrase) < 2 or not left_role or not right_role:
            continue

        pos = plain_text.find(after_phrase)
        if pos == -1:
            continue
        end_vis_idx = pos + len(after_phrase) - 1
        if end_vis_idx >= len(vis_to_html_end):
            continue

        # Eğer hemen sonrasında noktalama işareti (, ; :) varsa onu da içine al
        while (
            end_vis_idx + 1 < len(plain_text)
            and plain_text[end_vis_idx + 1] in ",;:"
        ):
            end_vis_idx += 1

        # Cümle sonuna (. ? !) denk geliyorsa ve sağda yeni cümle yoksa atla
        if plain_text[end_vis_idx] in ".?!" and "Cümle" not in left_role and "Cümle" not in right_role:
            continue

        # Çok yakın kavşak çakışmasını önle
        if any(abs(end_vis_idx - prev) < 4 for prev in used_vis_positions):
            continue

        # Span içinde kalıyorsa (ör. 2 kelimelik bir tamlamanın tam ortasıysa) atla
        if span_depth_after[end_vis_idx] > 0:
            continue

        html_insert_pos = vis_to_html_end[end_vis_idx]
        if html_insert_pos in insertions:
            continue

        tr_body = f"⬅ <b>Önceki:</b> {left_role}<br>➡ <b>Sonraki:</b> {right_role}"
        if expl:
            tr_body += f"<br><br>💡 {expl}"
        tr_attr = html.escape(tr_body, quote=True)
        title_attr = html.escape(f"Öge Sınırı: {left_role} | {right_role}", quote=True)

        junction_span = (
            f'<span class="xray-junction" '
            f'data-tr="{tr_attr}" '
            f'data-note="Cümle Ögesi Sınırı" '
            f'onclick="showVocabBubble(this, event)" '
            f'title="{title_attr}">'
            f'<span class="xray-pipe">|</span></span>'
        )
        insertions[html_insert_pos] = junction_span
        used_vis_positions.append(end_vis_idx)

    if not insertions:
        return html_str

    # Sondan başa doğru ekle
    result = html_str
    for insert_pos in sorted(insertions.keys(), reverse=True):
        result = result[:insert_pos] + insertions[insert_pos] + result[insert_pos:]
    return result


def analyze_single_question(
    client: EvrenClient,
    q: Dict[str, Any],
    model: str = "gemma-4-31b",
) -> Tuple[int, Optional[Dict[str, Any]], Optional[str]]:
    """Tek bir TDE sorusunu EVREN ile analiz eder (gerekirse yedek modele geçer)."""
    qid = int(q["id"])
    ders = q.get("ders", "TÜRK DİLİ VE EDEBİYATI")
    konu = q.get("alt_konu") or q.get("konu") or ""
    soru_text = q["soru"]

    user_prompt = (
        f"Ders: {ders}\n"
        f"Konu: {konu}\n"
        f"Soru ID: {qid}\n\n"
        f"Soru Metni:\n\"\"\"\n{soru_text}\n\"\"\"\n\n"
        f"Lütfen bu soru metnindeki cümle ögesi sınırlarını (`junctions`) ve MEB müfredatındaki sözcük türlerini/dil bilgisi yapılarını (`pos_annotations`) JSON formatında çıkar."
    )

    candidate_models = [model, "qwen3.8-flash-next", "deepseek-v4.1-flash"]
    last_err = "Bilinmeyen hata"
    for candidate_model in candidate_models:
        try:
            content, _usage = client.chat_completion(
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                model=candidate_model,
                temperature=0.1,
                max_tokens=4096,
                thinking=False,
            )
            parsed = extract_json_object(content)
            if parsed and ("pos_annotations" in parsed or "junctions" in parsed):
                return qid, parsed, None
            last_err = f"JSON ayrıştırılamadı ({candidate_model})"
        except Exception as exc:
            last_err = f"{candidate_model}: {exc}"
    return qid, None, last_err


def main() -> None:
    parser = argparse.ArgumentParser(description="EVREN TDE 1-8 Dil Bilgisi Röntgen Motoru")
    parser.add_argument("--limit", type=int, default=0, help="İşlenecek maksimum soru sayısı (0 = tümü)")
    parser.add_argument("--workers", type=int, default=12, help="Paralel EVREN iş parçacığı sayısı")
    parser.add_argument("--force", action="store_true", help="Önbellekte olanları da yeniden analiz et")
    parser.add_argument("--donem", type=int, default=0, help="Sadece belirli bir TDE dönemini işle (1..8)")
    args = parser.parse_args()

    client = EvrenClient()
    if not client.is_configured:
        print("❌ EVREN_API_KEY bulunamadı!", file=sys.stderr)
        sys.exit(1)

    questions: List[Dict[str, Any]] = json.loads(TDE_JSON_PATH.read_text(encoding="utf-8"))
    cache: Dict[str, Any] = {}
    if CACHE_PATH.exists():
        try:
            cache = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
        except Exception:
            cache = {}

    # Önce önbellekteki mevcut analizleri derle
    compiled_from_cache = 0
    for q in questions:
        qid = int(q["id"])
        if qid == 969:
            # 969 numaralı örnek test sorusunu olduğu gibi koru
            continue
        cached_analysis = cache.get(str(qid))
        if cached_analysis and not args.force:
            compiled = compile_question_xray(q["soru"], q.get("soru_xray"), cached_analysis)
            if compiled:
                q["soru_xray"] = compiled
                compiled_from_cache += 1

    # Analiz edilecek soruları filtrele
    targets: List[Dict[str, Any]] = []
    for q in questions:
        qid = int(q["id"])
        if qid == 969:
            continue
        if args.donem > 0:
            ders_str = q.get("ders", "")
            if f"– {args.donem}" not in ders_str and f"- {args.donem}" not in ders_str:
                continue
        if not args.force and str(qid) in cache:
            continue
        targets.append(q)

    if args.limit > 0:
        targets = targets[: args.limit]

    print(
        f"🚀 TDE Dil Bilgisi Röntgen Motoru Başlatıldı | Toplam: {len(questions)} | "
        f"Önbellekten Derlenen: {compiled_from_cache} | Yeni İşlenecek: {len(targets)} | Workers: {args.workers}",
        flush=True,
    )

    if not targets:
        TDE_JSON_PATH.write_text(json.dumps(questions, ensure_ascii=False, indent=2), encoding="utf-8")
        print("✅ İşlenecek yeni soru yok, mevcut önbellek TDE.json'a yazıldı.")
        return

    q_by_id = {int(q["id"]): q for q in questions}
    completed = 0
    succeeded = 0
    failed = 0
    start_time = time.time()

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {
            executor.submit(analyze_single_question, client, q): int(q["id"])
            for q in targets
        }
        for future in as_completed(futures):
            qid, analysis, err = future.result()
            completed += 1
            if analysis:
                q_obj = q_by_id[qid]
                compiled = compile_question_xray(q_obj["soru"], q_obj.get("soru_xray"), analysis)
                if compiled:
                    cache[str(qid)] = analysis
                    q_obj["soru_xray"] = compiled
                    succeeded += 1
                else:
                    failed += 1
                    print(f"  ⚠️ QID {qid}: Derleme doğrulaması başarısız oldu.", flush=True)
            else:
                failed += 1
                print(f"  ❌ QID {qid} Hata: {err}", flush=True)

            if completed % 16 == 0 or completed == len(targets):
                elapsed = time.time() - start_time
                CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
                TDE_JSON_PATH.write_text(json.dumps(questions, ensure_ascii=False, indent=2), encoding="utf-8")
                rem_tokens = client.remaining_daily_tokens
                print(
                    f"  [{completed}/{len(targets)}] Başarılı: {succeeded} | Hata: {failed} | "
                    f"Süre: {elapsed:.1f}s | Kalan Günlük Token: {rem_tokens}",
                    flush=True,
                )

    print(
        f"🎉 Tamamlandı! Başarılı: {succeeded}/{len(targets)} | "
        f"Toplam Röntgenli TDE Sorusu: {compiled_from_cache + succeeded + 1}",
        flush=True,
    )


if __name__ == "__main__":
    main()

