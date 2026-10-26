#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Tüm Derslerin Kavram Baloncuklarını Denetleme, Gürültü Temizleme ve Satır Başı (Newline) Yapılandırma Motoru.

İşlevler:
1. Gürültü Temizliği:
   - Soru kökündeki veya şıktaki tümce/yönerge niteliğindeki hatalı uzun span'ları (örn. 'sanayi ürünleri ihracatının yüksek olması',
     'kaç farklı şekilde', 'i̇stanbul’u fethetmesininin sebeplerinden değildir') tespit edip span'ı kaldırarak düz metne dönüştürür.
2. Anlamsal Satır Başı (Newline) Ayrıştırması:
   - Sınav Şifresi / Formül satırlarının kesinlikle ayrı satırda (\n💡 ...) olmasını garanti eder.
   - Tanım cümlesi ile analoji / kültürel dokunuş / günlük hayat örneği cümlelerinin arasına anlamsal satır başı (\n\n) ekler
     (Tıpkı..., Örneğin..., Günümüzde..., İbn Haldun..., El-Cezeri... vb.).
   - STEM derslerinde (Fizik, Kimya, Biyoloji, Matematik) alt türler, modeller, skaler/vektörel ayrımları veya
     formül bileşenleri arasına \n• madde imleri ve satır başları ekler.
   - HTML özniteliklerini (data-tr) güvenli ve hatasız biçimde yeniden yazar.
"""

import html
import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple

ROOT_DIR = Path(__file__).resolve().parents[2]
SUBJECTS_DIR = ROOT_DIR / "data" / "subjects"

NOISY_SPAN_KEYWORDS = [
    "hangisi", "hangisidir", "aşağıdaki", "yukarıdaki", "kaç farklı",
    "değildir", "söylenemez", "ulaşılamaz", "sebep olmuştur",
    "karşılanabilmesine yöneliktir", "yüksek olması", "yapılması",
    "yükseltmek", "etkilediği", "şartlarındandır", "ibadetlerden",
    "hâkim olandır", "sağlamak", "yönelik politikalar", "kullanılması",
    "ortalamalarının artması", "elverişli", "engebeli yerlerde",
    "mümkün müdür", "dayanarak", "öfkelendiği zaman", "bir kısmına inanıp",
    "sebeplerinden değildir", "zayıfladığının", "yaptıklarından",
    "ögelerine", "yapı bakımından", "yanlış anlamda", "yanlış yerde",
    "şekle bağlı", "üçer ilâve", "faaliyetlerinin kontrolünü",
]

LEGIT_TITLES = {
    "osmanlı devleti", "bizans imparatorluğu", "roma imparatorluğu",
    "türkiye büyük millet meclisi", "mondros ateşkes antlaşması",
    "sevr barış antlaşması", "lozan barış antlaşması", "ankara antlaşması",
    "mudanya ateşkes antlaşması", "amasya genelgesi", "erzurum kongresi",
    "sivas kongresi", "misakımilli", "teşkilat-ı esasiye",
}


def is_noisy_span(span_inner_text: str) -> bool:
    """Span metninin gerçek bir terim mi yoksa gürültülü bir soru cümlesi mi olduğunu belirler."""
    t = span_inner_text.strip().lower()
    if any(title in t for title in LEGIT_TITLES):
        return False
    if any(kw in t for kw in NOISY_SPAN_KEYWORDS):
        return True
    if len(t) > 38 and not any(k in t for k in ["antlaşma", "bildirge", "cumhuriyet", "imparatorluk"]):
        return True
    return False


def format_bubble_newlines(raw_desc: str) -> str:
    """Kavram balonu açıklamasını anlamsal paragraflara, maddelere ve sınav şifresi kutusuna böler."""
    if not raw_desc:
        return raw_desc

    desc = html.unescape(raw_desc).strip()

    # 1. 💡 Sınav Şifresi / Formül / İpucu kesinlikle yeni satırda başlasın
    desc = re.sub(r'([^\n])\s*(💡\s*(?:Sınav Şifresi|Formül|İpucu|Uyarı|Hafıza):?)', r'\1\n\2', desc)

    # 2. Tanım cümlesi ile analoji/örnek/kültürel bağ arasına satır başı (\n\n) ekle
    analogy_markers = (
        r'Tıpkı\s+|Örneğin\s+|İbn Haldun|El-Cezeri|Fârâbî|Farabi|Hârizmî|Harezmi|'
        r'Ali Kuşçu|Biruni|Mimar Sinan|Ahilik|Günümüzde\s+|Modern\s+|Tarihte\s+|'
        r'Bu durum\s+|Buna göre\s+|Özetle\s+|Kısacası\s+'
    )
    desc = re.sub(rf'([.!?])\s+({analogy_markers})', r'\1\n\n\2', desc)

    # 3. STEM (Fizik, Kimya, Biyo, Mat) alt tür ve modellerini yapılandır
    # Atom modelleri
    desc = re.sub(r';\s*(atom modelleri sırasıyla\s+)', r'.\n\n• **Gelişim:** \1', desc)
    # Kimyasal bağlar
    desc = re.sub(r';\s*(\*\*Kovalent Bağ\*\*)', r'.\n\n• \1', desc)
    desc = re.sub(r';\s*(\*\*Metalik Bağ\*\*)', r'\n• \1', desc)
    # Karbonhidratlar
    desc = re.sub(r'([.!?])\s+(Tek şekerliler\s+)', r'\1\n\n• \2', desc)
    desc = re.sub(r';\s*(İki şekerliler\s+)', r'\n• \1', desc)
    desc = re.sub(r';\s*(Çok şekerliler\s+)', r'\n• \1', desc)
    # Anabolizma / Katabolizma
    desc = re.sub(r';\s*(büyük besinleri parçalayıp yıkmaya ise\s+)', r'.\n\n• \1', desc)
    # Sayı kümeleri
    desc = re.sub(r';\s*(\*\*Tam sayılar\s*\([^\)]*\)\*\*)', r'.\n\n• \1', desc)
    # Skaler / Vektörel
    desc = re.sub(r';\s*(\*\*Vektörel\b|\bvektörel büyüklük)', r'.\n\n• \1', desc)
    # Kinetik / Potansiyel
    desc = re.sub(r';\s*(\*\*Kinetik Enerji\b)', r'.\n\n• \1', desc)

    # 4. Madde imleri (• veya -) kesinlikle yeni satırda başlasın
    desc = re.sub(r'([^\n])\s+([•\-*]\s+\*\*)', r'\1\n\2', desc)
    desc = re.sub(r'([^\n])\s+(•\s+)', r'\1\n\2', desc)

    # 5. Fazla boş satırları toparla (en fazla 2 satır başı)
    desc = re.sub(r'\n{3,}', '\n\n', desc)

    return html.escape(desc.strip(), quote=True)


def process_html_string(html_str: str) -> Tuple[str, int, int]:
    """Bir HTML metnindeki gürültülü span'ları söker, geçerli balonlara ise newline düzeni uygular."""
    if not html_str or "concept-word" not in html_str:
        return html_str, 0, 0

    stripped_noise = 0
    formatted_bubbles = 0

    span_pat = re.compile(
        r'<span\s+class="vocab-word\s+concept-word"\s+data-tr="([^"]*)"(?:\s+data-ar="[^"]*")?\s+data-note="([^"]*)"\s+onclick="showVocabBubble\(this,\s*event\)">(.*?)</span>',
        re.DOTALL
    )

    def span_replacer(match: re.Match) -> str:
        nonlocal stripped_noise, formatted_bubbles
        tr_val = match.group(1)
        note_val = match.group(2)
        inner_text = match.group(3)

        # 1. Gürültü kontrolü: Eğer bu bir tümce veya yönergeyse span'ı sök, düz metin bırak
        if is_noisy_span(inner_text):
            stripped_noise += 1
            return inner_text

        # 2. Geçerli kavram: Newline biçimlendirmesi uygula
        new_tr = format_bubble_newlines(tr_val)
        if new_tr != tr_val:
            formatted_bubbles += 1

        return (
            f'<span class="vocab-word concept-word" '
            f'data-tr="{new_tr}" data-note="{note_val}" '
            f'onclick="showVocabBubble(this, event)">{inner_text}</span>'
        )

    result_html = span_pat.sub(span_replacer, html_str)
    return result_html, stripped_noise, formatted_bubbles


def audit_and_format_course(json_path: Path) -> Dict[str, Any]:
    """Bir dersin JSON dosyasını okur, tüm soruları denetleyip günceller."""
    questions: List[Dict[str, Any]] = json.loads(json_path.read_text(encoding="utf-8"))
    course_code = json_path.stem

    total_noise_removed = 0
    total_bubbles_formatted = 0
    modified_qs = 0

    for q in questions:
        q_changed = False

        # Soru kökü
        stem = q.get("soru_xray") or ""
        new_stem, s_noise, s_fmt = process_html_string(stem)
        if s_noise > 0 or s_fmt > 0:
            q["soru_xray"] = new_stem
            total_noise_removed += s_noise
            total_bubbles_formatted += s_fmt
            q_changed = True

        # Şıklar
        sec_xray = q.get("secenekler_xray") or {}
        for opt_key, opt_html in list(sec_xray.items()):
            new_opt, o_noise, o_fmt = process_html_string(opt_html)
            if o_noise > 0 or o_fmt > 0:
                sec_xray[opt_key] = new_opt
                total_noise_removed += o_noise
                total_bubbles_formatted += o_fmt
                q_changed = True

        if q_changed:
            modified_qs += 1

    if modified_qs > 0:
        json_path.write_text(json.dumps(questions, indent=2, ensure_ascii=False), encoding="utf-8")

    return {
        "course": course_code,
        "total_questions": len(questions),
        "noise_removed": total_noise_removed,
        "bubbles_formatted": total_bubbles_formatted,
        "modified_questions": modified_qs,
    }


def main():
    print("=== TÜM DERSLER İÇİN KAVRAM DENETİMİ, GÜRÜLTÜ TEMİZLİĞİ VE NEWLINE DÜZENLEME MOTORU ===")
    json_files = sorted(SUBJECTS_DIR.glob("*.json"))

    total_noise = 0
    total_formatted = 0

    print(f"\n{'Ders Kodu':12} | {'Toplam Soru':12} | {'Temizlenen Gürültü':18} | {'Newline Eklenen Balon':22} |")
    print("-" * 72)

    for p in json_files:
        if p.stem == "ING":
            continue
        stats = audit_and_format_course(p)
        total_noise += stats["noise_removed"]
        total_formatted += stats["bubbles_formatted"]
        print(
            f"{stats['course']:12} | "
            f"{stats['total_questions']:12} | "
            f"{stats['noise_removed']:18} | "
            f"{stats['bubbles_formatted']:22} |"
        )

    print("-" * 72)
    print(f"[✓] TOPLAM TEMİZLENEN GÜRÜLTÜLÜ TÜMCE: {total_noise}")
    print(f"[✓] TOPLAM YAPILANDIRILAN & NEWLINE EKLENEN BALON: {total_formatted}\n")


if __name__ == "__main__":
    main()
