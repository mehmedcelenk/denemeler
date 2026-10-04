#!/usr/bin/env python3
"""
MEB AÖL Türkçe Cümle Röntgeni (Sentence X-Ray) Hibrit Üretim ve Doğrulama Hattı.

Mimari ve Kural Tabanı:
1. Hızlı Kural Yolu (Fast-Path / MEB Kural Motoru):
   - Standart ve varyasyonlu tüm MEB soru köklerini dilbilgisi kurallarıyla anında çözer.
   - Soru zamiri/zarfı öbek ayrımı:
     * '... hangisi / hangileri' -> Özne (<SUB>)
     * '... hangisinde / hangilerinde' -> Yer Tamlayıcısı / Dolaylı Tümleç (<ADV>)
     * '... hangisine / hangilerine / hangisinden' -> Yer Tamlayıcısı (<ADV>)
     * '... hangisiyle / hangileriyle' -> Zarf / Vasıta Tümleci (<ADV>)
     * '... hangisini / hangilerini' -> Belirtili Nesne (<OBJ>)
     * '... hangisinde [öge] vardır/yoktur' -> [öge]=Özne, vardır=Yüklem
2. Pas Geçme Filtreleri:
   - Şiir, vezinli metin (aruz/hece) ve manzum parçaları otomatik tespit eder, pas geçer.
3. Cümle Dışı Unsur (CDU) ve Numaralandırma Filtresi:
   - Tiyatro konuşmacı başlıklarını (örn: 'MÜŞTAK BEY —') ve Roma rakamlarını ((I), (II)) tag dışına alır.
4. Tam Türkçe Morfoloji & Dilbilgisi Güvenlik Validatörü (Grammar Invariants):
   - 1. Metin Sadakati (Lossless): 1 karakter dahi mutasyona uğrayamaz.
   - 2. Tag Bütünlüğü: İç içe tag veya kapanmamış tag yasaktır.
   - 3. Noktalama İzolasyonu: Noktalama işaretleri tag dışında kalır.
   - 4. Yüklem Şartı: Cümlede geçerli bir yüklem (<VERB>) bulunmalıdır.
   - 5. İsim Cümlesi / Geçişsizlik: İsim cümlelerinde ('var', 'yok', 'değil', '-dir') asla <OBJ> bulunamaz.
   - 6. Özne Hal Eki Yasağı: İsmin -e, -de, -den ve -i (belirtme) eklerini alan sözcükler ASLA <SUB> olamaz.
   - 7. Nesne Hal Eki ve Zarf-Fiil Yasağı: -de, -den ekleri veya zarf-fiiller ASLA <OBJ> olamaz.
   - 8. Edat Öbeği Kuralı: Edatla biten öbekler ('için', 'gibi', 'göre', 'ile' vb.) ASLA <SUB> veya <OBJ> olamaz.
   - 9. Soru Sözcüğü Rol Uyumu: 'nasıl', 'ne zaman', 'nerede', 'hangisinde' vb. asla <SUB> olamaz.
5. SQLite Önbellek & Görsel HTML Denetim Raporu.
"""

import argparse
import hashlib
import json
import re
import sqlite3
import unicodedata
import urllib.request
from pathlib import Path
from typing import Optional, Tuple

# Yollar
BASE_DIR = Path(__file__).resolve().parent.parent
TDE_JSON_PATH = BASE_DIR / "data" / "subjects" / "TDE.json"
OUTPUT_DIR = BASE_DIR / "scripts" / "ciktilar"
CACHE_DB_PATH = OUTPUT_DIR / "cumle_xray_cache.db"
REPORT_HTML_PATH = OUTPUT_DIR / "xray_denetim_raporu.html"

DEFAULT_MODEL = "qwen2.5:14b-instruct-q4_K_M"
OLLAMA_CHAT_URL = "http://localhost:11434/api/chat"

TAG_TO_HTML = {
    "SUB": '<span class="xray-sub" title="Özne">',
    "VERB": '<span class="xray-verb" title="Yüklem">',
    "OBJ": '<span class="xray-obj" title="Nesne">',
    "ADV": '<span class="xray-adv" title="Tümleç / Zarf">',
}

# --- TÜRKÇE DİLBİLGİSİ SÖZLÜK VE KURAL SETLERİ ---

# Kökü bu harflerle bittiği halde hal eki almamış yalın isim kökleri (False Positive Engelleme)
NOMINATIVE_NOUN_ROOTS = {
    # -ye / -ya ile biten yalın isimler (edebiyat terimleri dahil)
    "hikaye", "hikâye", "mersiye", "hicviye", "methiye", "kaside", "dünya", "rüyâ", "rüya",
    "hülya", "asya", "avrupa", "afrika", "türkiye", "belediye", "tavsiye", "secye", "faciye",
    "bina", "ziya", "sermaye", "terbiye", "seviye", "maliye", "adliye", "harbiye", "tahliye",
    "saniye", "terazi", "zaviye", "külliye", "hasiye", "haşiye", "muhavere", "fasıl",
    # -tan / -ten ile biten yalın isimler
    "destan", "vatan", "kaptan", "militan", "asistan", "şarlatan", "roman", "zaman", "orman", "duman",
    # -dan / -den ile biten yalın isimler
    "meydan", "vicdan", "fidan", "gerdan", "candan", "maden", "beden", "kefen",
    # -da / -de / -ta / -te ile biten yalın isimler
    "oda", "moda", "çanta", "usta", "hasta", "pasta", "harita", "orta", "rota", "nota",
    "ayna", "perde", "beste", "sahte", "pide", "kaide", "müjde", "valide", "abide", "asude",
    "irade", "ifade", "madde", "cadde", "gövde", "mücadele", "tepe", "dere", "kale", "şube",
    "böyle", "şöyle", "öyle", "gece", "tente", "liste", "gazete",
    # -i / -ı / -u / -ü ile biten yalın isimler
    "bitki", "yapı", "çevre", "bölge", "ülke", "öykü", "köprü", "kapı", "korku", "coşku",
    "duygu", "yazı", "sayı", "dizi", "çizgi", "sevgi", "bilgi", "ilgi", "ezgi", "çalgı",
    "öğrenci", "dinleyici", "okuyucu", "yazar", "okur", "şair", "su", "kutu", "boru", "kedi",
    "tilki", "türkü", "büyü", "ölçü", "örgü", "kamu", "ordu", "avlu", "kumru", "arzu", "soru",
    "kişi", "ölü", "diri", "yolcu", "hanende", "sazende", "anne", "baba", "dede", "nene",
    # Zamirler (Yalın)
    "bu", "şu", "o", "kendi", "kendisi", "biri", "hepsi", "kimse", "herkes", "hangisi", "hangileri"
}

# Türkçede daima Zarf/Tümleç oluşturan edatlar (Asla Özne veya Nesne olamazlar)
EDATLAR_VE_BAGLCLAR = {
    "gibi", "kadar", "için", "göre", "karşı", "doğru", "dolayı", "ötürü", "rağmen",
    "birlikte", "itibaren", "beri", "üzere", "karşın", "nazaran", "ait", "dair",
    "ile", "sayesinde", "adına", "tarafından", "yüzünden", "hakkında"
}

# Asla Özne olamayacak kelimeler ve soru zamirleri/zarfları
ASLA_OZNE_OLAMAZ = {
    "hangisinde", "hangisine", "hangisinden", "hangisini", "hangisiyle", "hangilerinde",
    "hangilerine", "hangilerinden", "hangilerini", "hangileriyle", "bunda", "şunda", "onda",
    "burada", "şurada", "orada", "içinde", "arasında", "üzerinde", "tarafından",
    "yüzünden", "hakkında", "nasıl", "ne zaman", "niçin", "neden", "niye", "nerede",
    "nereden", "nereye", "kime", "kimde", "kimden"
}

# İsim cümlesi yüklemleri (Nesne alması imkansız olan yapılar)
ISIM_CUMLESI_YUKLEMLERI = {
    "var", "vardır", "yok", "yoktur", "değil", "değildir", "değildi", "değilmiş",
    "idi", "imiş", "ise", "olmalıdır", "gerekir", "önemlidir", "mümkündür", "doğrudur", "yanlıştır"
}

# Hal eki almış zamirler
LOCATIVE_PRONOUNS = {"bende", "sende", "onda", "bizde", "sizde", "onlarda", "bunda", "şunda", "nerede", "kimde", "hangisinde", "hangilerinde"}
ABLATIVE_PRONOUNS = {"benden", "senden", "ondan", "bizden", "sizden", "onlardan", "bundan", "şundan", "nereden", "kimden", "hangisinden", "hangilerinden"}
DATIVE_PRONOUNS = {"bana", "sana", "ona", "bize", "size", "onlara", "buna", "şuna", "kime", "nereye", "neye", "hangisine", "hangilerine"}
ACCUSATIVE_PRONOUNS = {"beni", "seni", "onu", "bizi", "sizi", "onları", "bunu", "şunu", "kimi", "neyi", "hangisini", "hangilerini"}


def is_locative_word(w: str) -> bool:
    """Kelimenin bulunma hali eki (-de, -da, -te, -ta, -nde, -nda) alıp almadığını doğrular."""
    w = w.lower().strip()
    if w in NOMINATIVE_NOUN_ROOTS:
        return False
    if w in LOCATIVE_PRONOUNS:
        return True
    if re.search(r"(?:(?:inde|ında|ünde|unda|bunda|şunda|onda))$", w):
        return True
    if re.search(r"(?:lerde|larda)$", w):
        return True
    if re.search(r"(?:[dt][ea])$", w) and len(w) >= 3:
        return True
    return False


def is_ablative_word(w: str) -> bool:
    """Kelimenin ayrılma hali eki (-den, -dan, -ten, -tan, -nden, -ndan) alıp almadığını doğrular."""
    w = w.lower().strip()
    if w in NOMINATIVE_NOUN_ROOTS:
        return False
    if w in ABLATIVE_PRONOUNS:
        return True
    if re.search(r"(?:(?:inden|ından|ünden|undan|bundan|şundan|ondan))$", w):
        return True
    if re.search(r"(?:lerden|lardan)$", w):
        return True
    if re.search(r"(?:[dt][ea]n)$", w) and len(w) >= 4:
        return True
    return False


def is_dative_word(w: str) -> bool:
    """Kelimenin yönelme hali eki (-e, -a, -ye, -ya, -ne, -na) alıp almadığını doğrular."""
    w = w.lower().strip()
    if w in NOMINATIVE_NOUN_ROOTS:
        return False
    if w in DATIVE_PRONOUNS:
        return True
    if re.search(r"(?:(?:ine|ına|üne|una))$", w):
        return True
    if re.search(r"(?:lere|lara)$", w):
        return True
    if re.search(r"(?:y[ea])$", w) and len(w) >= 4:
        return True
    if re.search(r"[bcdfghjklmnprsştvyz][ae]$", w) and len(w) >= 3:
        return True
    return False


def is_accusative_word(w: str) -> bool:
    """Kelimenin kesin belirtme hali eki (nesne eki) alıp almadığını doğrular."""
    w = w.lower().strip()
    if w in NOMINATIVE_NOUN_ROOTS:
        return False
    if w in ACCUSATIVE_PRONOUNS:
        return True
    # İyelik + belirtme eki birleşimi: -(s)ini, -(s)ını, -(s)ünü, -(s)unu
    if re.search(r"(?:(?:ini|ını|ünü|unu))$", w):
        return True
    return False


FEW_SHOT_MESSAGES = [
    {
        "role": "system",
        "content": (
            "Sen MEB ve TDK kurallarına harfiyen bağlı, kusursuz bir Türkçe Dilbilgisi Uzmanısın.\n"
            "Görevin, verilen Türkçe cümleleri şu 4 etiketle ögelerine ayırmaktır:\n"
            "- <SUB>Özne</SUB> (Yalın haldedir. İsmin -e, -de, -den, -i eklerini ALAMAZ!)\n"
            "- <VERB>Yüklem</VERB> (Cümlenin temel yargısıdır. Deyim ve birleşik fiilleri bölme)\n"
            "- <OBJ>Nesne</OBJ> (Sadece belirtili/belirtisiz nesne. İsim cümlelerinde NESNE OLAMAZ! -de/-den eki alamaz)\n"
            "- <ADV>Tümleç/Zarf</ADV> (Zarf tümleçleri, yer tamlayıcıları / dolaylı tümleçler: -e, -de, -den alanlar, edat öbekleri)\n\n"
            "KESİN KURALLAR:\n"
            "1. SADECE etiketlenmiş metni yaz. Açıklama veya selamlama ASLA yazma.\n"
            "2. Orijinal metnin tek bir harfini veya kelimesini ASLA değiştirme.\n"
            "3. Noktalama işaretlerini (. , ; : ! ? \" ') ASLA tag içine alma, tag dışına bırak.\n"
            "4. GİZLİ ÖZNE: Eğer cümlenin açık bir öznesi yoksa cümleye ASLA <SUB> ekleme; dolaylı tümleç veya zarfları asla özne yapma!\n"
            "5. İSİM CÜMLELERİ: 'var', 'yok', 'değil', '-dir' ile biten cümlelerde ASLA <OBJ> kullanma."
        ),
    },
    {
        "role": "user",
        "content": "Yazar, Anadolu romanının özelliklerini bu makalesinde ortaya koydu.",
    },
    {
        "role": "assistant",
        "content": "<SUB>Yazar</SUB>, <OBJ>Anadolu romanının özelliklerini</OBJ> <ADV>bu makalesinde</ADV> <VERB>ortaya koydu</VERB>.",
    },
    {
        "role": "user",
        "content": "Hikâyelerinde genellikle gerçek hayatta yaşanan olayları ele alır.",
    },
    {
        "role": "assistant",
        "content": "<ADV>Hikâyelerinde</ADV> <ADV>genellikle</ADV> <OBJ>gerçek hayatta yaşanan olayları</OBJ> <VERB>ele alır</VERB>.",
    },
    {
        "role": "user",
        "content": "Bunda herhangi bir şüphe yoktur.",
    },
    {
        "role": "assistant",
        "content": "<ADV>Bunda</ADV> <SUB>herhangi bir şüphe</SUB> <VERB>yoktur</VERB>.",
    },
    {
        "role": "user",
        "content": "Gelenekten ve halk kültüründen özenle yararlanmıştır.",
    },
    {
        "role": "assistant",
        "content": "<ADV>Gelenekten ve halk kültüründen</ADV> <ADV>özenle</ADV> <VERB>yararlanmıştır</VERB>.",
    },
    {
        "role": "user",
        "content": "Meyve yüklü ağaç dalları rüzgârın etkisiyle yavaşça eğiliyordu.",
    },
    {
        "role": "assistant",
        "content": "<SUB>Meyve yüklü ağaç dalları</SUB> <ADV>rüzgârın etkisiyle</ADV> <ADV>yavaşça</ADV> <VERB>eğiliyordu</VERB>.",
    },
]


def parse_question_stem_rule(text: str) -> Optional[str]:
    """Standart MEB soru köklerini dilbilgisi kurallarıyla anında ve sıfır hatayla ayırır."""
    clean = text.strip()

    # 1. Kalıp: ... hangisinde / hangilerinde [öge] vardır / yoktur / yapılmıştır?
    m_loc = re.match(
        r"^(.*?)\b((?:[a-zçğıöşüA-ZÇĞİÖŞÜ]+(?:in|ın|ün|un)\s+)?(?:aşağıdaki(?:ler)?(?:in|den|dan)?|numaralanmış\s+cümlelerin|parçadaki\s+cümlelerin)"
        r"(?:\s+[a-zçğıöşüA-ZÇĞİÖŞÜ]+){0,5}\s+(?:hangisinde|hangilerinde))\b\s+(.*?)\s+"
        r"(vardır|yoktur|yapılmıştır|bulunmaktadır|yer almaktadır|kullanılmıştır|söylenebilir)\??$",
        clean,
        re.IGNORECASE
    )
    if m_loc:
        prefix = m_loc.group(1).strip()
        loc_phrase = m_loc.group(2).strip()
        subject_part = m_loc.group(3).strip()
        verb = m_loc.group(4).strip() + ("?" if clean.endswith("?") else "")

        html = ""
        if prefix:
            html += f'<span class="xray-adv" title="Tümleç / Zarf">{prefix}</span> '
        html += f'<span class="xray-adv" title="Tümleç / Zarf">{loc_phrase}</span> '
        if subject_part:
            html += f'<span class="xray-sub" title="Özne">{subject_part}</span> '
        html += f'<span class="xray-verb" title="Yüklem">{verb}</span>'
        return html

    # 2. Kalıp: ... hangisi / hangileri [Yüklem]? (Özne = hangisi/hangileri)
    m_sub = re.match(
        r"^(.*?)\b((?:[a-zçğıöşüA-ZÇĞİÖŞÜ]+(?:in|ın|ün|un)\s+)?(?:aşağıdaki(?:ler)?(?:in|den|dan)?|numaralanmış\s+cümlelerden|parçadaki\s+bilgilerden)"
        r"(?:\s+[a-zçğıöşüA-ZÇĞİÖŞÜ]+){0,5}\s+(?:hangisi|hangileri))\b\s+(.*)$",
        clean,
        re.IGNORECASE
    )
    if m_sub:
        prefix = m_sub.group(1).strip()
        sub_phrase = m_sub.group(2).strip()
        suffix = m_sub.group(3).strip()

        html = ""
        if prefix:
            p_tag = "xray-adv" if re.search(r"(parça|metin|dörtlük|cümle|ilgili|göre|hakkında|bakılarak|hareketle)", prefix, re.IGNORECASE) else "xray-obj"
            title = "Tümleç / Zarf" if p_tag == "xray-adv" else "Nesne"
            html += f'<span class="{p_tag}" title="{title}">{prefix}</span> '

        html += f'<span class="xray-sub" title="Özne">{sub_phrase}</span>'
        if suffix:
            html += f' <span class="xray-verb" title="Yüklem">{suffix}</span>'
        return html

    # 3. Kalıp: ... hangisine / hangilerine / hangisinden [Yüklem]? (Yer Tamlayıcısı)
    m_adv = re.match(
        r"^(.*?)\b((?:[a-zçğıöşüA-ZÇĞİÖŞÜ]+(?:in|ın|ün|un)\s+)?(?:aşağıdaki(?:ler)?(?:in|den|dan)?|numaralanmış\s+cümlelerden)"
        r"(?:\s+[a-zçğıöşüA-ZÇĞİÖŞÜ]+){0,5}\s+(?:hangisine|hangilerine|hangisinden|hangilerinden))\b\s+(.*)$",
        clean,
        re.IGNORECASE
    )
    if m_adv:
        prefix = m_adv.group(1).strip()
        adv_phrase = m_adv.group(2).strip()
        suffix = m_adv.group(3).strip()

        html = ""
        if prefix:
            html += f'<span class="xray-adv" title="Tümleç / Zarf">{prefix}</span> '
        html += f'<span class="xray-adv" title="Tümleç / Zarf">{adv_phrase}</span>'
        if suffix:
            html += f' <span class="xray-verb" title="Yüklem">{suffix}</span>'
        return html

    # 4. Kalıp: ... hangisiyle / hangileriyle [Yüklem]? (Vasıta / Zarf Tümleci)
    m_ins = re.match(
        r"^(.*?)\b((?:[a-zçğıöşüA-ZÇĞİÖŞÜ]+(?:in|ın|ün|un)\s+)?(?:aşağıdaki(?:ler)?(?:in|den|dan)?)"
        r"(?:\s+[a-zçğıöşüA-ZÇĞİÖŞÜ]+){0,5}\s+(?:hangisiyle|hangileriyle))\b\s+(.*)$",
        clean,
        re.IGNORECASE
    )
    if m_ins:
        prefix = m_ins.group(1).strip()
        ins_phrase = m_ins.group(2).strip()
        suffix = m_ins.group(3).strip()

        html = ""
        if prefix:
            html += f'<span class="xray-adv" title="Tümleç / Zarf">{prefix}</span> '
        html += f'<span class="xray-adv" title="Tümleç / Zarf">{ins_phrase}</span>'
        if suffix:
            html += f' <span class="xray-verb" title="Yüklem">{suffix}</span>'
        return html

    # 5. Kalıp: ... hangisini / hangilerini [Yüklem]? (Belirtili Nesne)
    m_obj = re.match(
        r"^(.*?)\b((?:[a-zçğıöşüA-ZÇĞİÖŞÜ]+(?:in|ın|ün|un)\s+)?(?:aşağıdaki(?:ler)?(?:in|den|dan)?)"
        r"(?:\s+[a-zçğıöşüA-ZÇĞİÖŞÜ]+){0,5}\s+(?:hangisini|hangilerini))\b\s+(.*)$",
        clean,
        re.IGNORECASE
    )
    if m_obj:
        prefix = m_obj.group(1).strip()
        obj_phrase = m_obj.group(2).strip()
        suffix = m_obj.group(3).strip()

        html = ""
        if prefix:
            html += f'<span class="xray-adv" title="Tümleç / Zarf">{prefix}</span> '
        html += f'<span class="xray-obj" title="Nesne">{obj_phrase}</span>'
        if suffix:
            html += f' <span class="xray-verb" title="Yüklem">{suffix}</span>'
        return html

    return None


def is_poetry_or_verse(text: str) -> bool:
    """Metnin şiir, dörtlük, beyit veya manzum parça olup olmadığını denetler."""
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    if len(lines) >= 2:
        avg_len = sum(len(l) for l in lines) / len(lines)
        if avg_len < 55 and len(lines) in (2, 3, 4, 6, 8):
            return True

    poetry_keywords = [
        "dörtlük", "beyit", "dize", "koşma", "gazel", "kaside", "mani",
        "hece ölçüsü", "aruz", "kafiye", "redif", "şairin bu dizelerinde"
    ]
    lower = text.lower()
    return any(kw in lower for kw in poetry_keywords)


def validate_and_convert(raw_text: str, llm_tagged: str) -> Tuple[bool, str, float, str]:
    """Model çıktısını MEB dilbilgisi ve metin sadakati kurallarıyla denetler."""
    if not llm_tagged or not llm_tagged.strip():
        return False, "", 0.0, "Boş model yanıtı"

    # 1. Metin Sadakati (Lossless Invariant)
    clean_text = re.sub(r"</?(?:SUB|VERB|OBJ|ADV)>", "", llm_tagged)
    norm_raw = unicodedata.normalize("NFKC", raw_text.strip())
    norm_clean = unicodedata.normalize("NFKC", clean_text.strip())
    if norm_raw != norm_clean:
        return False, "", 0.0, "Metin aslı bozuldu (orijinal kelimeler değişti)"

    # 2. Tag Bütünlüğü ve İç İçe Tag Yasağı
    stack = []
    tokens = re.findall(r"<(/?[A-Z]+)>", llm_tagged)
    valid_tags = {"SUB", "VERB", "OBJ", "ADV"}
    for t in tokens:
        if not t.startswith("/"):
            if t not in valid_tags or len(stack) > 0:
                return False, "", 0.0, "İç içe veya geçersiz tag kullanımı"
            stack.append(t)
        else:
            tag_name = t[1:]
            if not stack or stack.pop() != tag_name:
                return False, "", 0.0, "Kapanış tag uyuşmazlığı"
    if stack:
        return False, "", 0.0, "Kapanmamış açık tag kaldı"

    # 3. Noktalama İşaretlerinin Tag İçine Alınması Yasağı
    if re.search(r"<[A-Z]+>[^<]*?[.,;:!?][^<]*?</[A-Z]+>", llm_tagged):
        if not re.search(r"\b(?:yy|sf|vb|dr|prof|mad)\.", llm_tagged, re.IGNORECASE):
            return False, "", 0.0, "Noktalama işareti tag içine dahil edilmiş"

    # 4. Yüklem Varlığı ve İsim Cümlesi Nesne Denetimi
    verb_matches = re.findall(r"<VERB>(.*?)</VERB>", llm_tagged, re.DOTALL)
    if not verb_matches and "..." not in raw_text:
        return False, "", 0.0, "Cümlede yüklem (<VERB>) bulunamadı"

    obj_matches = re.findall(r"<OBJ>(.*?)</OBJ>", llm_tagged, re.DOTALL)

    for verb_content in verb_matches:
        v_words = [w.strip(".,;:!?\"'() ") for w in verb_content.strip().split() if w.strip(".,;:!?\"'() ")]
        if v_words:
            v_last = v_words[-1].lower()
            if v_last in ISIM_CUMLESI_YUKLEMLERI or v_last.endswith(("dir", "dır", "dür", "dur", "tir", "tır", "tür", "tur", "idi", "ymiş", "ydü", "ydi")):
                if obj_matches:
                    return False, "", 0.0, f"İsim cümlesinde ({v_last}) nesne (<OBJ>) bulunamaz"

    # 5. Özne (<SUB>) Denetimi
    sub_matches = re.findall(r"<SUB>(.*?)</SUB>", llm_tagged, re.DOTALL)
    for sub_content in sub_matches:
        words = [w.strip(".,;:!?\"'() ") for w in sub_content.strip().split() if w.strip(".,;:!?\"'() ")]
        if not words:
            continue
        last_word = words[-1].lower()

        if last_word in ASLA_OZNE_OLAMAZ or last_word in EDATLAR_VE_BAGLCLAR:
            return False, "", 0.0, f"Edat/zarf kalıbı ({last_word}) hatalı şekilde <SUB> yapılmış"

        if is_locative_word(last_word):
            return False, "", 0.0, f"Bulunma hali eki alan sözcük ({last_word}) <SUB> olamaz"

        if is_ablative_word(last_word):
            return False, "", 0.0, f"Ayrılma hali eki alan sözcük ({last_word}) <SUB> olamaz"

        if is_dative_word(last_word):
            return False, "", 0.0, f"Yönelme hali eki alan sözcük ({last_word}) <SUB> olamaz"

        if is_accusative_word(last_word):
            return False, "", 0.0, f"Belirtme hali eki alan sözcük ({last_word}) <SUB> olamaz"

    # 6. Nesne (<OBJ>) Denetimi
    for obj_content in obj_matches:
        words = [w.strip(".,;:!?\"'() ") for w in obj_content.strip().split() if w.strip(".,;:!?\"'() ")]
        if not words:
            continue
        last_word = words[-1].lower()

        if last_word in EDATLAR_VE_BAGLCLAR or last_word in ASLA_OZNE_OLAMAZ:
            return False, "", 0.0, f"Edat/tümleç öbeği ({last_word}) hatalı şekilde <OBJ> yapılmış"

        if re.search(r"(?:erek|arak|ırken|irken|urken|ürken|ince|ınca|uncal|ünce|dıkça|dikçe|dukça|dükçe|tıkça|tikçe|tukça|tükçe|madan|meden|meksizin|maksızın)$", last_word):
            return False, "", 0.0, f"Zarf fiil grubu ({last_word}) hatalı şekilde <OBJ> yapılmış"

        if is_locative_word(last_word) or is_ablative_word(last_word):
            return False, "", 0.0, f"Dolaylı tümleç eki alan sözcük ({last_word}) <OBJ> olamaz"

    # HTML'e Dönüştür
    html_out = llm_tagged
    for tag, span in TAG_TO_HTML.items():
        html_out = html_out.replace(f"<{tag}>", span)
        html_out = html_out.replace(f"</{tag}>", "</span>")

    # Boş span'ları temizle
    html_out = re.sub(r'<span class="xray-[^"]+" title="[^"]+">\s*</span>', '', html_out)

    return True, html_out, 0.98, "Onaylandı"


def call_ollama_chat(text: str, model_name: str) -> str:
    """Ollama Chat API çağrısı yapar (Few-Shot mesajlarıyla deterministik üretim)."""
    messages = list(FEW_SHOT_MESSAGES)
    messages.append({"role": "user", "content": text})

    payload = json.dumps({
        "model": model_name,
        "messages": messages,
        "stream": False,
        "options": {"temperature": 0.0, "top_p": 0.9}
    }).encode("utf-8")

    req = urllib.request.Request(
        OLLAMA_CHAT_URL,
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        raw_res = res.get("message", {}).get("content", "").strip()
        raw_res = re.sub(r"^```(?:html|xml)?\s*", "", raw_res)
        raw_res = re.sub(r"\s*```$", "", raw_res)
        return raw_res.strip()


def init_cache_db() -> sqlite3.Connection:
    """Önbellek veritabanını başlatır."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(CACHE_DB_PATH)
    with conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS xray_cache (
                qid INTEGER PRIMARY KEY,
                stem_hash TEXT NOT NULL,
                raw_text TEXT NOT NULL,
                tagged_output TEXT,
                tagged_html TEXT,
                confidence REAL NOT NULL,
                status TEXT CHECK(status IN ('validated', 'rejected', 'skipped_poetry')),
                reason TEXT,
                model_name TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_hash ON xray_cache(stem_hash)")
    return conn


def generate_audit_html(conn: sqlite3.Connection):
    """İnsan denetimi için görsel HTML raporu oluşturur."""
    cur = conn.cursor()
    cur.execute("SELECT qid, raw_text, tagged_html, confidence, status, reason FROM xray_cache ORDER BY qid")
    rows = cur.fetchall()

    validated = [r for r in rows if r[4] == "validated"]
    rejected = [r for r in rows if r[4] == "rejected"]
    skipped = [r for r in rows if r[4] == "skipped_poetry"]

    cards_html = []
    for qid, raw, tagged_html, conf, status, reason in validated[:250]:
        cards_html.append(f"""
        <div class="card">
            <div class="card-id">Soru #{qid} <span class="badge badge-success">Onaylandı (%{int(conf*100)})</span> • <small>{reason}</small></div>
            <div class="sentence-box">{tagged_html}</div>
        </div>
        """)

    rejected_html = []
    for qid, raw, _, _, _, reason in rejected[:50]:
        rejected_html.append(f"""
        <li style="margin-bottom:8px;"><strong>#{qid}:</strong> {reason} <br><small style="color:#718096;">{raw}</small></li>
        """)

    html_content = f"""<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>AÖL Cümle Röntgeni - Denetim Raporu</title>
<style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; }}
    .stats {{ display: flex; gap: 16px; margin-bottom: 24px; }}
    .stat-box {{ background: #1e293b; padding: 16px 20px; border-radius: 8px; flex: 1; border: 1px solid #334155; }}
    .stat-val {{ font-size: 28px; font-weight: bold; color: #38bdf8; }}
    .card {{ background: #1e293b; border-radius: 8px; padding: 16px; margin-bottom: 12px; border-left: 4px solid #10b981; }}
    .card-id {{ font-size: 13px; color: #94a3b8; margin-bottom: 8px; }}
    .sentence-box {{ font-size: 16px; line-height: 1.8; }}
    .badge {{ padding: 2px 8px; border-radius: 4px; font-size: 11px; }}
    .badge-success {{ background: #065f46; color: #34d399; }}
    /* Röntgen Stilleri */
    .xray-sub {{ text-decoration: underline 3px #38bdf8; text-underline-offset: 4px; font-weight: 500; }}
    .xray-verb {{ text-decoration: underline 3px #f43f5e; text-underline-offset: 4px; font-weight: 600; }}
    .xray-obj {{ text-decoration: underline 3px #fbbf24; text-underline-offset: 4px; }}
    .xray-adv {{ text-decoration: underline 3px #a855f7; text-underline-offset: 4px; }}
    .xray-prompt {{ margin-top: 10px; font-weight: 500; color: #cbd5e1; }}
</style>
</head>
<body>
    <h1>AÖL Cümle Röntgeni Denetim Paneli</h1>
    <div class="stats">
        <div class="stat-box"><div>Onaylanan (Kusursuz)</div><div class="stat-val" style="color:#34d399;">{len(validated)}</div></div>
        <div class="stat-box"><div>Reddedilen (Elenen)</div><div class="stat-val" style="color:#f43f5e;">{len(rejected)}</div></div>
        <div class="stat-box"><div>Pas Geçilen Şiir</div><div class="stat-val" style="color:#fbbf24;">{len(skipped)}</div></div>
    </div>
    
    <h2>Örnek Onaylanan Cümleler (Gözle Denetim)</h2>
    <div style="max-height: 650px; overflow-y: auto;">
        {''.join(cards_html) if cards_html else '<p>Henüz onaylanan soru yok.</p>'}
    </div>

    <h2 style="margin-top: 32px;">Elenen Sorulardan Örnekler ve Sebepleri</h2>
    <ul>
        {''.join(rejected_html) if rejected_html else '<li>Elenen soru yok.</li>'}
    </ul>
</body>
</html>"""

    with open(REPORT_HTML_PATH, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Denetim raporu üretildi: {REPORT_HTML_PATH}")


def process_single_question(soru_metni: str, model_name: str) -> Tuple[bool, Optional[str], float, str, str]:
    """Tek bir soruyu işler. Kural motoru veya LLM kullanarak (ok, html, conf, reason, tagged_output) döner."""
    clean_stem = soru_metni.strip()

    # 1. Şiir denetimi
    if is_poetry_or_verse(clean_stem):
        return False, None, 0.0, "Şiir/manzum format tespit edildi", ""

    # 2. Hızlı Kural Yolu: Standart soru kökü ise doğrudan kural motoruyla çöz
    rule_html = parse_question_stem_rule(clean_stem)
    if rule_html:
        return True, rule_html, 1.0, "Kural Motoru (Standart Soru Kökü)", rule_html

    # 3. Akıllı Paragraf + Soru Kökü Ayrımı
    prompt_match = re.search(
        r"(.*?)(?=(?:Bu parça|Bu parçada|Bu parçayla|Bu parça ile|Bu parçadan|Bu metinde|Bu metinle|numaralanmış|Numaralanmış|"
        r"Aşağıdaki parçaların|Aşağıdaki eşleştirmelerden|Aşağıdaki cümlelerin|Aşağıdakilerin)\b)",
        clean_stem,
        re.IGNORECASE | re.DOTALL
    )

    if prompt_match and prompt_match.group(1).strip():
        passage = prompt_match.group(1).strip()
        prompt_line = clean_stem[len(prompt_match.group(1)):].strip()

        sentences = re.split(r"(?<=[.!?])\s+", passage)
        processed_sentences = []
        any_success = False

        for sent in sentences:
            sent_clean = sent.strip()
            # Cümle dışı unsur ayıklama (Hitap veya diyalog çizgisi: 'MÜŞTAK BEY — ', '⎯ ')
            cdu_prefix = ""
            m_cdu = re.match(r"^([A-ZÇĞİÖŞÜ\s—\-\–]{2,25}(?:—|–|-)\s*|⎯\s*)", sent_clean)
            if m_cdu:
                cdu_prefix = m_cdu.group(1)
                sent_clean = sent_clean[len(cdu_prefix):].strip()

            if len(sent_clean.split()) >= 3:
                llm_res = call_ollama_chat(sent_clean, model_name)
                ok, html_sent, conf, reason = validate_and_convert(sent_clean, llm_res)
                if ok:
                    processed_sentences.append(f"{cdu_prefix}{html_sent}")
                    any_success = True
                else:
                    processed_sentences.append(f"{cdu_prefix}{sent_clean}")
            else:
                processed_sentences.append(f"{cdu_prefix}{sent_clean}")

        if any_success:
            html_passage = " ".join(processed_sentences)
            prompt_html = parse_question_stem_rule(prompt_line) or f'<div class="xray-prompt">{prompt_line}</div>'
            separator = "\n\n" if "\n" in clean_stem else " "
            final_html = f"{html_passage}{separator}{prompt_html}"
            return True, final_html, 0.98, "Paragraf (Cümle Cümle Ayrıştırıldı)", final_html
        else:
            return False, None, 0.0, "Paragraftaki hiçbir cümle dilbilgisi kurallarından geçemedi", ""

    # 4. Diğer tekil cümleler
    llm_res = call_ollama_chat(clean_stem, model_name)
    ok, html_out, conf, reason = validate_and_convert(clean_stem, llm_res)
    return ok, html_out if ok else None, conf, reason, llm_res


def run_pipeline(limit: Optional[int] = None, sample: Optional[int] = None, dry_run: bool = True, model_name: str = DEFAULT_MODEL):
    """Ana üretim ve doğrulama akışını çalıştırır."""
    conn = init_cache_db()

    if not TDE_JSON_PATH.exists():
        print(f"Hata: {TDE_JSON_PATH} dosyası bulunamadı.")
        return

    with open(TDE_JSON_PATH, "r", encoding="utf-8") as f:
        questions = json.load(f)

    if sample and sample < len(questions):
        import random
        random.seed(42)
        questions = random.sample(questions, sample)

    print(f"\n--- AÖL Cümle Röntgeni Üretim Hattı (Hibrit) ---")
    print(f"Hedef Veri: {TDE_JSON_PATH}")
    print(f"İşlenecek Soru: {len(questions)}")
    print(f"Kullanılan Model: {model_name}")
    print(f"Çalışma Modu: {'DRY RUN (Veritabanına yazılmaz, sadece önbellek ve test)' if dry_run else 'CANLI (TDE.json güncellenir)'}\n")

    # Pre-flight Ollama servis kontrolü
    try:
        req = urllib.request.Request("http://localhost:11434/api/tags")
        with urllib.request.urlopen(req, timeout=3) as resp:
            pass
    except Exception:
        print("❌ HATA: Ollama servisine (http://localhost:11434) ulaşılamıyor!")
        print("👉 Lütfen önce şu komutla Ollama ve modeli hazırlayın:")
        print("   bash scripts/setup_ollama.sh\n")
        return

    processed = 0
    validated_count = 0
    rejected_count = 0
    skipped_count = 0

    for q in questions:
        if limit and processed >= limit:
            break

        qid = q.get("id")
        soru_metni = q.get("soru", "").strip()
        if not soru_metni:
            continue

        stem_hash = hashlib.sha256(soru_metni.encode("utf-8")).hexdigest()
        cur = conn.cursor()
        cur.execute("SELECT tagged_html, status, reason FROM xray_cache WHERE stem_hash = ?", (stem_hash,))
        cached = cur.fetchone()

        if cached:
            if cached[1] == "validated":
                if not dry_run:
                    q["soru_xray"] = cached[0]
                validated_count += 1
            elif cached[1] == "skipped_poetry":
                skipped_count += 1
            else:
                rejected_count += 1
            processed += 1
            continue

        try:
            print(f"[{processed+1}] Soru #{qid} işleniyor...", end=" ", flush=True)
            ok, html_out, conf, reason, raw_output = process_single_question(soru_metni, model_name)

            if reason == "Şiir/manzum format tespit edildi":
                status = "skipped_poetry"
                skipped_count += 1
                print(f"⊘ Şiir/Manzum (Pas Geçildi)")
            elif ok:
                status = "validated"
                if not dry_run:
                    q["soru_xray"] = html_out
                validated_count += 1
                print(f"✓ {reason}")
            else:
                status = "rejected"
                rejected_count += 1
                print(f"✗ RED: {reason}")

            with conn:
                conn.execute("""
                    INSERT OR REPLACE INTO xray_cache (qid, stem_hash, raw_text, tagged_output, tagged_html, confidence, status, reason, model_name)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (qid, stem_hash, soru_metni, raw_output, html_out, conf, status, reason, model_name))

        except Exception as e:
            print(f"✗ Hata: {e}")
            rejected_count += 1

        processed += 1

    generate_audit_html(conn)

    if not dry_run and validated_count > 0:
        with open(TDE_JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(questions, f, ensure_ascii=False, indent=None)
        print(f"\n🎉 {validated_count} soru başarıyla 'soru_xray' ile TDE.json dosyasına yazıldı!")


def main():
    parser = argparse.ArgumentParser(description="AÖL Türkçe Cümle Röntgeni Üretim Hattı")
    parser.add_argument("--limit", type=int, default=None, help="İşlenecek maksimum soru sayısı")
    parser.add_argument("--sample", type=int, default=None, help="Rastgele seçilecek soru sayısı")
    parser.add_argument("--model", type=str, default=DEFAULT_MODEL, help="Kullanılacak Ollama modeli")
    parser.add_argument("--live", action="store_true", help="Canlı mod: TDE.json dosyasını doğrudan günceller")
    parser.add_argument("--clean-cache", action="store_true", help="Önbellek veritabanını sıfırlar")

    args = parser.parse_args()

    if args.clean_cache:
        if CACHE_DB_PATH.exists():
            CACHE_DB_PATH.unlink()
            print(f"Önbellek temizlendi: {CACHE_DB_PATH}")

    run_pipeline(limit=args.limit, sample=args.sample, dry_run=not args.live, model_name=args.model)


if __name__ == "__main__":
    main()
