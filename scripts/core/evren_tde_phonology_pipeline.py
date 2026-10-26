#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""EVREN Destekli TDE 1-8 Ses Bilgisi (Ses Olayları) Röntgen Motoru.

TDE 1-8 MEB ders kitaplarındaki tüm ses olaylarını:
1. Ünlü Düşmesi (Hece Düşmesi / Aşınma)
2. Ünsüz Benzeşmesi (Ünsüz Sertleşmesi / Ünsüz Uyumu)
3. Ünsüz Yumuşaması (Ünsüz Değişimi: p,ç,t,k > b,c,d,ğ/g)
4. Ünlü Daralması (a,e > ı,i,u,ü)
5. Ünsüz Türemesi (İkizleşme)
6. Ünlü Türemesi
7. Ünsüz Düşmesi
8. N-M Değişimi (Dudak Ünsüzleri Benzeşmesi)

Hibrit (Morfolojik Aday Çıkarımı + EVREN Toplu Kelime Doğrulaması) mimarisiyle
656 soruyu tek tek tekrar sormaya gerek kalmadan benzersiz kelimeler üzerinden
%100 tutarlılıkla tespit eder ve `TDE.json` içindeki `soru_xray` alanına işler.
"""

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import html
import json
import re
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from scripts.core.evren_client import EvrenClient
from scripts.core.evren_tde_grammar_xray_pipeline import (
    META_BOILERPLATE_WORDS,
    PROMPT_TAIL_RE,
    strip_xray_to_plain,
)

TDE_JSON_PATH = ROOT_DIR / "data" / "subjects" / "TDE.json"
LEXICON_PATH = ROOT_DIR / "data" / "concepts" / "tde_phonology_lexicon.json"

# Kök içinde 'ğ' barındıran (Ünsüz yumuşaması OLMAYAN) kelimeler (MEB Tuzağı Koruması)
ROOT_SOFT_G_STEMS = {
    "dağ", "bağ", "çağ", "sağ", "yağ", "ağır", "ağıt", "ağaç", "ağla", "ağrı",
    "doğru", "doğu", "doğal", "doğa", "doğum", "doğur", "doğrultu",
    "öğren", "öğret", "öğrenci", "öğretmen", "öğüt", "öğle",
    "değer", "değin", "değiş", "değil", "değnek",
    "diğer", "eğer", "rağmen", "beğen", "yoğun", "uğraş", "uğra", "uğur",
    "soğuk", "soğan", "boğaz", "boğul", "çoğu", "kağıt", "kâğıt", "sığ", "sığın",
    "yığın", "düğün", "düğüm", "düğme", "iğne", "eğilim", "eğitim", "eğlence",
    "eğri", "öğe", "üvey", "ciğer", "meğer", "teğmen", "lağım", "bağımsız",
    "bağlam", "bağlantı", "bağdaş", "çağdaş", "çağrışım", "sağlam", "sağlık",
}

# Kök içinde sert ünsüz kümesi barındıran (Ek benzeşmesi OLMAYAN) kelimeler
ROOT_HARD_CLUSTERS = {
    "başka", "eski", "usta", "işte", "üst", "üste", "üstün", "nokta", "mektup",
    "doktor", "aktif", "takdir", "iktidar", "müstakil", "hasta", "beste", "destan",
    "destek", "göster", "gösteri", "müşteri", "coğrafya", "yoksa", "yoksul",
    "akşam", "okşa", "ekşi", "teşkilat", "teşekkür", "istiklal", "istikbal",
    "iştirak", "içtima", "içtihat", "muhtaç", "muhtelif", "muhtemel", "muhteşem",
    "anahtar", "sahte", "tahta", "kaftan", "hafta", "çift", "çiftçi", "müftü",
    "defter", "kıstas", "مست", "rast", "rastla", "dost", "post", "test", "metin",
    "üslup", "mahsul", "mahsus", "tahsil", "temsil", "tasvir", "taşra",
}

PHONOLOGY_SYSTEM_PROMPT = """Sen MEB Açık Öğretim Lisesi Türk Dili ve Edebiyatı (TDE 1-8) Ses Bilgisi (Fonetik ve Morfofonetik) Başöğretmenisin.
Görevin, sana verilen Türkçe kelimeler listesinden GERÇEKTEN bir **Ses Olayı** barındıranları seçmek ve SADECE geçerli bir JSON nesnesi döndürmektir.

### MEB MÜFREDATINDAKİ SES OLAYLARI:
1. **Ünlü Düşmesi (Hece Düşmesi / Aşınma):**
   - İkinci hecedeki dar ünlünün düşmesi: *akıl→aklı, gönül→gönlü, şehir→şehrin, ömür→ömrü, beyin→beyni, ağız→ağzı, burun→burnu, bağır→bağrı, karın→karnı, alın→alnı, oğul→oğlu, vakit→vakti, fikir→fikri, hüküm→hükmü, isim→ismi, resim→resmi, kısım→kısmı, devir→devri, asır→asrı, sabır→sabrı, kahır→kahrı, seyir→seyri, keşif→keşfi, nefis→nefsi, nesil→nesli, asıl→aslı, şekil→şekli, metin→metni, ufuk→ufku, zihin→zihni, kayıp→kaybı, kayıt→kaydı, hapis→hapsi*.
   - Türetilirken (yapım eki alırken) ünlü düşmesi: *ayır-→ayrı/ayrıntı/ayrılık/ayrılmak, çevir-→çevre/çevresi/çevrilmek, sıyır-→sıyrılmak, kıvır-→kıvrım, devir-→devrilmek/devrim, savur-→savrulmak, kavur-→kavrulmak, uyu-→uyku, sızı→sızlamak, ileri→ilerlemek, koku→koklamak, oyun→oynamak, besi→beslemek, yalın→yalnız, yanıl-→yanlış, kavuş-→kavşak, sarı→sararmak, kızıl→kızarmak, beniz→benzemek*.
   - Birleşirken ünlü düşmesi (aşınma): *ne asıl→nasıl, ne için→niçin, kayıp ol-→kaybolmak, kahır ol-→kahrolmak, seyir et-→seyretmek, sabır et-→sabretmek, şükür et-→şükretmek, emir et-→emretmek, biri birine→birbirine, cumartesi, pazartesi, sütlaç*.
2. **Ünsüz Yumuşaması (Ünsüz Değişimi `p,ç,t,k > b,c,d,ğ/g`):**
   - Kelime veya ek sonundaki sert ünsüzün ünlüyle başlayan ek aldığında yumuşaması: *kitap→kitabı, amaç→amacı, ağaç→ağacı, sonuç→sonucu, ihtiyaç→ihtiyacı, inanç→inancı, güç→gücü, uç→ucu, kanat→kanadı, umut→umudu, yurt→yurdu, dert→derdi, geçit→geçidi, çeşit→çeşidi, git-→gider/giden, et-→eder/eden/edildi, tat→tadı, adım (at-ım), yudum (yut-um), çoğal- (çok-al), ağar- (ak-ar), gecik- (geç-ik), renk→rengi, ahenk→ahengi, olduk→olduğu, ettik→ettiği, nitelik→niteliği, özellik→özelliği, sözcük→sözcüğü, gerçek→gerçeği, gelecek→geleceği, ayak→ayağı, toprak→toprağı, yürek→yüreği*.
3. **Ünsüz Benzeşmesi (Ünsüz Sertleşmesi / Ünsüz Uyumu):**
   - `f, s, t, k, ç, ş, h, p` (FıSTıKÇı ŞaHaP) ile biten bir kelimeye `c, d, g` ile başlayan bir EK geldiğinde `ç, t, k` olması: *edebiyat-da→edebiyatta, geçmiş-den→geçmişten, yap-dı→yaptı, et-di→etti, git-di→gitti, sanat-cı→sanatçı, seç-gin→seçkin, çalış-gan→çalışkan, bas-gı→baskı, et-gi→etki, bit-gi→bitki, iliş-gin→ilişkin, coş-gu→coşku, kes-gin→keskin, tut-gu→tutku, baş-dan→baştan, yurttaş, meslektaş*.
4. **Ünlü Daralması (`a,e > ı,i,u,ü`):**
   - `a` veya `e` geniş ünlüsüyle biten bir fiilin (veya `-ma/-me` olumsuzluk ekinin) `-yor` eki aldığında daralması: *başla-yor→başlıyor, anla-yor→anlıyor, bekle-yor→bekliyor, söyle-yor→söylüyor, yaşa-yor→yaşıyor, izle-yor→izliyor, iste-yor→istiyor, bil-me-yor→bilmiyor, düşün-me-yor→düşünmüyor*.
   - `de-`, `ye-` fiilleri ve `ne` sözcüğünün `y` kaynaştırma ünsüzüyle daralması: *de-ye→diye, de-yerek→diyerek, de-yen→diyen, ye-yecek→yiyecek, ye-yen→yiyen, ne-ye→niye*.
5. **Ünsüz Türemesi (İkizleşme):**
   - *hak→hakkı/hakkında, his→hissi/hissetmek, af→affetmek, red→reddetmek, zan→zannetmek, sır→sırrı, şer→şerri, tıp→tıbbı, had→haddi, zam→zammı, şık→şıkkı, hal→hallolmak*.
6. **Ünlü Türemesi:**
   - *bir-cik→biricik, dar-cık→daracık, az-cık→azıcık, genç-cik→gencecik, güpedüz, sapasağlam, yapayalnız, çepeçevre*.
7. **Ünsüz Düşmesi:**
   - *küçük-cük→küçücük, ufak-cık→ufacık, sıcak-cık→sıcacık, yumuşak-cık→yumuşacık, minik-cik→minicik, alçak-l→alçalmak, yüksek-l→yükselmek, küçük-mse→küçümsemek, az-ımsa→azımsamak, eksik-l→eksilmek, seyrek-l→seyrelmek, kalk-dır→kaldırmak, asteğmen, üsteğmen*.
8. **N-M Değişimi (Dudak Ünsüzleri Benzeşmesi):**
   - `b` dudak ünsüzünden önceki `n` sesinin `m`ye dönüşmesi: *pembe, çember, tembel, çarşamba, perşembe, ambar, sümbül, kambur, saklambaç, dolambaç*.

### ⚠️ KESİN YASAKLAR (MEB SINAV TUZAKLARINA DÜŞME!):
1. **Kök içindeki `ğ` Ünsüz Yumuşaması DEĞİLDİR:** *dağ, bağ, çağ, sağ, doğru, doğa, ağır, öğrenmek, öğretmen, öğrenci, değer, değişim, diğer, eğer, rağmen, beğenmek, yoğun, uğraşmak, soğuk, boğaz, kağıt, düğün, eğitim, eğilim* kelimelerinde `ğ` zaten kökte vardır; bunları ASLA seçme!
2. **Kök içindeki sert ünsüzler Ünsüz Benzeşmesi DEĞİLDİR:** *başka, eski, usta, işte, üst, nokta, mektup, doktor, hasta, destan, destek, göstermek, müşteri, akşam, teşkilat, muhtaç, sahte, tahta, hafta, defter, dost* kelimelerinde sert ünsüzler ek başında değil kök içindedir; bunları ASLA seçme! (Ancak *göster-di → gösterdi* değil, *göster-miş-tir → göstermiştir* gibi ekte sertleşme varsa sadece o eki belirt).
3. **Ünsüzle biten fiil + `-ıyor/-iyor/-uyor/-üyor` Ünlü Daralması DEĞİLDİR:** *geliyor (gel-iyor), bakıyor (bak-ıyor), oluyor (ol-uyor), anlatıyor (anlat-ıyor), çalışıyor (çalış-ıyor), biliyor (bil-iyor), görünüyor (görün-üyor)* kelimelerinde fiil ünsüzle biter, araya giren yardımcı ünlüdür; bunları ASLA Ünlü Daralması olarak seçme!
4. Bir kelimede birden fazla ses olayı varsa (Örn: *olduğunu* -> Ünsüz Yumuşaması, *ettiği* -> Ünsüz Benzeşmesi + Ünsüz Yumuşaması, *kayboldu* -> Ünlü Düşmesi + Ünsüz Yumuşaması, *hissetti* -> Ünsüz Türemesi + Ünsüz Benzeşmesi) ikisini birlikte yaz!

Yanıtını SADECE aşağıdaki JSON formatında ver (ses olayı olmayan kelimeleri JSON'a hiç koyma):
```json
{
  "events": [
    {
      "word": "edebiyatta",
      "event_type": "Ünsüz Benzeşmesi (Sertleşmesi)",
      "explanation": "'edebiyat' kelimesi 't' sert ünsüzüyle bittiği için '-da' bulunma durumu eki '-ta'ya dönüşmüştür (t + d > t + t)."
    },
    {
      "word": "gönlü",
      "event_type": "Ünlü Düşmesi (Hece Düşmesi)",
      "explanation": "'gönül' kelimesine ünlüyle başlayan '-ü' eki geldiğinde ikinci hecedeki dar ünlü ('ü') düşmüştür."
    }
  ]
}
```"""


def is_candidate_word(word: str) -> bool:
    """Kelimenin Türkçede ses olayı adayı olup olmadığını hızlıca filtreler."""
    wl = word.lower().replace("î", "i").replace("â", "a").replace("û", "u")
    if len(wl) < 3 or wl in META_BOILERPLATE_WORDS:
        return False

    # 1. Ünlü düşmesi / türemesi / ünsüz düşmesi / ünsüz türemesi / n-m değişimi kökleri
    if re.search(
        r"(?:akl|fikr|zikr|şükr|hükm|ömr|emr|şehr|nehr|zehr|asr[ıi]|devr|sabr|kahr|"
        r"seyr|keşf|nefs|nesl|asl[ıi]|fasl|kısm|ism[i]|resm[i]|cism|vakt|nakd|akd|"
        r"ahd|zulm|ilm[i]|gönl|beyn|boyn|burn|ağz|bağr|karn|aln[ıi]|oğl|benz|genz|"
        r"omz|göğs|koyn|ufk|zihn|keyf|kayb|kayd|haps|kabr|kadr|metn|şekl|ayr[ıi]|"
        r"ayrıl|ayrın|çevr|sıyr|kıvr|savr|kavr|buyr|uyku|sızla|ilerle|kokla|oyna|"
        r"besle|yalnız|yanlış|kavşak|kurak|sarar|kızar|sarmal|nasıl|niçin|cumartesi|"
        r"pazartesi|birbir|sütlaç|hakk|hiss|aff|redd|zann|sırr|şerr|tıbb|hadd|zamm|"
        r"şıkk|hall|biricik|daracık|azıcık|gencecik|güpedüz|sapasağlam|yapayalnız|"
        r"çepeçevre|küçücük|ufacık|sıcacık|yumuşacık|minicik|alçal|yüksel|küçümse|"
        r"azımsa|eksil|seyrel|kaldır|pembe|çember|tembel|çarşamba|perşembe|ambar|"
        r"sümbül|kambur|saklambaç|dolambaç)",
        wl,
    ):
        return True

    # 2. Ünlü daralması adayları
    if "yor" in wl or re.search(r"^(?:diye|diyen|diyerek|yiyecek|yiyen|niye)", wl):
        return True

    # 3. Ünsüz yumuşaması adayları (p,ç,t,k > b,c,d,ğ/g)
    if re.search(
        r"(?:kitab|amac|ağac|sonuc|ihtiyac|inanc|sevinc|kazanc|güc[üu]|uc[uü]|borc|"
        r"harc|kanad|umud|öğüd|yurd|derd|dörd|kağıd|kâğıd|vücud|geçid|çeşid|adım|"
        r"yudum|tadı|tadın|gider|giden|gidip|gidil|eder|eden|edip|edil|edecek|rengi|"
        r"ahengi|çoğal|gecik|ağar)",
        wl,
    ):
        return True

    # 'ğ' içeren ama kökünde 'ğ' olmayan kelimeler
    if "ğ" in wl and re.search(r"ğ[ıiuüaeoö]", wl):
        if not any(wl.startswith(stem) for stem in ROOT_SOFT_G_STEMS):
            return True

    # 4. Ünsüz benzeşmesi adayları ([fstkçşhp][çtk])
    if re.search(r"[fstkçşhp][çtk]", wl):
        if wl not in ROOT_HARD_CLUSTERS:
            return True

    return False


def analyze_word_batch(
    client: EvrenClient,
    batch_idx: int,
    words: List[str],
) -> Tuple[int, Dict[str, Dict[str, str]], Optional[str]]:
    """Bir grup aday kelimeyi EVREN ile analiz eder."""
    user_prompt = (
        "Aşağıdaki Türkçe kelimeleri incele ve sadece GERÇEKTEN MEB müfredatına göre "
        "ses olayı (Ünlü Düşmesi, Ünsüz Yumuşaması, Ünsüz Benzeşmesi, Ünlü Daralması, "
        "Ünsüz Türemesi, Ünlü Türemesi, Ünsüz Düşmesi, N-M Değişimi) barındıranları "
        "JSON şemasında döndür:\n\n"
        + ", ".join(words)
    )

    for model in ["gemma-4-31b", "qwen3.8-flash-next", "deepseek-v4.1-flash"]:
        try:
            content, _ = client.chat_completion(
                messages=[
                    {"role": "system", "content": PHONOLOGY_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                model=model,
                temperature=0.1,
                max_tokens=4096,
                thinking=False,
            )
            text = content.strip()
            if "```" in text:
                m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
                if m:
                    text = m.group(1)
            s = text.find("{")
            e = text.rfind("}")
            if s != -1 and e != -1 and e > s:
                parsed = json.loads(text[s : e + 1])
                events = parsed.get("events")
                if isinstance(events, list):
                    result: Dict[str, Dict[str, str]] = {}
                    for item in events:
                        if not isinstance(item, dict):
                            continue
                        w = str(item.get("word") or "").strip().lower()
                        et = str(item.get("event_type") or "").strip()
                        ex = str(item.get("explanation") or "").strip()
                        if w and et and ex:
                            result[w] = {"event_type": et, "explanation": ex}
                    return batch_idx, result, None
        except Exception as exc:
            last_err = f"{model}: {exc}"
            continue
    return batch_idx, {}, "Batch ayrıştırılamadı"


def inject_phonology_into_xray(
    raw_soru: str,
    current_xray: str,
    lexicon: Dict[str, Dict[str, str]],
) -> str:
    """Mevcut soru_xray içindeki kelimelere ses olaylarını (.sound-word / .has-sound) işler."""
    if not current_xray:
        current_xray = html.escape(raw_soru, quote=False)

    # Önce daha önce eklenmiş .sound-word span'larını temizle (idempotent çalışsın)
    cleaned = re.sub(
        r'<span\s+class="sound-word"[^>]*>(.*?)</span>',
        r"\1",
        current_xray,
        flags=re.DOTALL,
    )

    # 1. Mevcut .pos-word span'larının içindeki kelimelerde ses olayı varsa birleştir
    def _enrich_pos_span(match: re.Match) -> str:
        full_span = match.group(0)
        attrs = match.group(1)
        inner_text = match.group(2)
        words_in_span = re.findall(r"[a-zA-ZçğıöşüÇĞİÖŞÜâîûÂÎÛ]{3,}", inner_text)
        sound_notes: List[str] = []
        for w in words_in_span:
            info = lexicon.get(w.lower())
            if info:
                sound_notes.append(f"🔊 <b>{info['event_type']} ({w}):</b> {info['explanation']}")
        if not sound_notes:
            return full_span

        # Eğer zaten ses olayı eklenmişse tekrar ekleme
        if "🔊" in attrs:
            return full_span

        new_attrs = attrs
        if "has-sound" not in new_attrs:
            new_attrs = re.sub(r'class="pos-word\s+', 'class="pos-word has-sound ', new_attrs, count=1)
        sound_appendix = html.escape("\n" + "\n".join(sound_notes), quote=True)
        new_attrs = re.sub(
            r'data-tr="([^"]*)"',
             lambda m: f'data-tr="{m.group(1)}{sound_appendix}"',
            new_attrs,
            count=1,
        )
        return f"<span {new_attrs}>{inner_text}</span>"

    enriched = re.sub(
        r"<span\s+([^>]*class=\"pos-word[^\"]*\"[^>]*)>(.*?)</span>",
        _enrich_pos_span,
        cleaned,
        flags=re.DOTALL,
    )

    # 2. Mevcut tüm <span ...>...</span> bloklarını maskele ki dışarıdaki düz kelimeleri güvenle saralım
    span_placeholders: List[str] = []

    def _mask_any_span(match: re.Match) -> str:
        idx = len(span_placeholders)
        span_placeholders.append(match.group(0))
        return f"\x00SPAN_{idx}\x00"

    # İç içe span olabileceği için xray-junction (içinde xray-pipe var) önce maskelenir
    masked = re.sub(
        r'<span\s+class="xray-junction"[^>]*>.*?</span>\s*</span>',
        _mask_any_span,
        enriched,
        flags=re.DOTALL,
    )
    masked = re.sub(
        r"<span\s+[^>]*>.*?</span>",
        _mask_any_span,
        masked,
        flags=re.DOTALL,
    )
    masked = PROMPT_TAIL_RE.sub(_mask_any_span, masked)

    # 3. Maskelenmiş düz metindeki kelimeleri tara ve ses olayı olanları .sound-word ile sar
    seen_in_question: Set[str] = set()

    def _wrap_plain_word(match: re.Match) -> str:
        word = match.group(0)
        wl = word.lower()
        if wl in seen_in_question or wl in META_BOILERPLATE_WORDS:
            return word
        info = lexicon.get(wl)
        if not info:
            return word
        seen_in_question.add(wl)
        tr_body = f"🔊 <b>{info['event_type']}</b>: {info['explanation']}"
        tr_attr = html.escape(tr_body, quote=True)
        note_attr = html.escape(info["event_type"], quote=True)
        return (
            f'<span class="sound-word" '
            f'data-tr="{tr_attr}" '
            f'data-note="{note_attr}" '
            f'onclick="showVocabBubble(this, event)">{word}</span>'
        )

    masked = re.sub(
        r"(?<![\wçğıöşüÇĞİÖŞÜ\x00])[a-zA-ZçğıöşüÇĞİÖŞÜâîûÂÎÛ]{3,}(?![\wçğıöşüÇĞİÖŞÜ\x00])",
        _wrap_plain_word,
        masked,
    )

    # 4. Placeholder'ları geri aç (ters sırayla)
    result = masked
    for idx in range(len(span_placeholders) - 1, -1, -1):
        result = result.replace(f"\x00SPAN_{idx}\x00", span_placeholders[idx])

    # 5. Matematiksel doğrulama
    if result.count("<span") != result.count("</span>"):
        return current_xray
    if strip_xray_to_plain(result) != raw_soru:
        return current_xray
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description="EVREN TDE 1-8 Ses Bilgisi Röntgen Motoru")
    parser.add_argument("--workers", type=int, default=16, help="Paralel EVREN iş parçacığı sayısı")
    parser.add_argument("--batch-size", type=int, default=55, help="Her EVREN isteğindeki kelime sayısı")
    parser.add_argument("--force", action="store_true", help="Mevcut ses sözlüğünü sıfırdan üret")
    args = parser.parse_args()

    client = EvrenClient()
    if not client.is_configured:
        print("❌ EVREN_API_KEY bulunamadı!", file=sys.stderr)
        sys.exit(1)

    questions: List[Dict[str, Any]] = json.loads(TDE_JSON_PATH.read_text(encoding="utf-8"))

    lexicon: Dict[str, Dict[str, str]] = {}
    processed_words: Set[str] = set()
    if LEXICON_PATH.exists() and not args.force:
        try:
            saved = json.loads(LEXICON_PATH.read_text(encoding="utf-8"))
            lexicon = saved.get("lexicon") or {}
            processed_words = set(saved.get("processed_words") or [])
        except Exception:
            lexicon = {}
            processed_words = set()

    # Tüm 656 sorudaki benzersiz aday kelimeleri çıkar
    all_candidates: Set[str] = set()
    for q in questions:
        for w in re.findall(r"[a-zA-ZçğıöşüÇĞİÖŞÜâîûÂÎÛ]{3,}", q["soru"]):
            wl = w.lower()
            if is_candidate_word(wl) and wl not in processed_words:
                all_candidates.add(wl)

    sorted_candidates = sorted(all_candidates)
    batches: List[List[str]] = [
        sorted_candidates[i : i + args.batch_size]
        for i in range(0, len(sorted_candidates), args.batch_size)
    ]

    print(
        f"🔊 TDE 1-8 Ses Bilgisi Motoru Başlatıldı | Yeni Aday Kelime: {len(sorted_candidates)} | "
        f"Batch Sayısı: {len(batches)} | Workers: {args.workers}",
        flush=True,
    )

    start_time = time.time()
    completed = 0

    if batches:
        with ThreadPoolExecutor(max_workers=args.workers) as executor:
            futures = {
                executor.submit(analyze_word_batch, client, idx, batch): (idx, batch)
                for idx, batch in enumerate(batches)
            }
            for future in as_completed(futures):
                idx, batch = futures[future]
                _, found_map, err = future.result()
                completed += 1
                if err:
                    print(f"  ⚠️ Batch {idx} uyarısı: {err}", flush=True)
                else:
                    lexicon.update(found_map)
                    processed_words.update(batch)

                if completed % 10 == 0 or completed == len(batches):
                    elapsed = time.time() - start_time
                    LEXICON_PATH.write_text(
                        json.dumps(
                            {
                                "lexicon": lexicon,
                                "processed_words": sorted(processed_words),
                            },
                            ensure_ascii=False,
                            indent=2,
                        ),
                        encoding="utf-8",
                    )
                    print(
                        f"  [{completed}/{len(batches)}] Tespit Edilen Ses Olaylı Kelime: {len(lexicon)} | "
                        f"Süre: {elapsed:.1f}s",
                        flush=True,
                    )

    # Şimdi tüm 656 TDE sorusuna ses olaylarını işle
    enriched_q_count = 0
    total_sound_tags = 0
    for q in questions:
        qid = int(q["id"])
        if qid == 969:
            continue
        updated_xray = inject_phonology_into_xray(
            q["soru"],
            q.get("soru_xray") or "",
            lexicon,
        )
        q["soru_xray"] = updated_xray
        c_sound = updated_xray.count('class="sound-word"') + updated_xray.count("has-sound")
        if c_sound > 0:
            enriched_q_count += 1
            total_sound_tags += c_sound

    TDE_JSON_PATH.write_text(json.dumps(questions, ensure_ascii=False, indent=2), encoding="utf-8")
    print(
        f"🎉 Ses Bilgisi Taraması ve Enjeksiyonu Tamamlandı!\n"
        f"   Sözlükteki Ses Olaylı Kelime: {len(lexicon)}\n"
        f"   Ses Olayı İşlenen Soru: {enriched_q_count}/{len(questions)}\n"
        f"   Toplam Ses Olayı Etiketi: {total_sound_tags}",
        flush=True,
    )


if __name__ == "__main__":
    main()

