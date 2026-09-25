#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_webapp.py
AÖL "Dijital Beyinli Gerçek Sınav Kitapçığı" (Sürüm 3.2)
- Yeni ders sembolleri: İngilizce (🌐), İnkılap (📜), Din Kültürü (🧎), Tarih (🏺), Coğrafya (🗺️)
- Ezana kalan vakit hesaplama motoru (Güneş açısı ve Diyanet / Türkiye vakitleri ile senkron)
- Üstte ortalanmış ikili hap grubu (Ders & Konu Rozeti + Ezana Kalan Vakit)
- Floating menü butonu: 3 çizgili (hamburger SVG)
- Tam Ekran / Odak Modu: Floating menü içine taşındı; tam ekranda diğer UI öğeleri gizlenir fakat 3 çizgili buton daima ekranda kalır
"""

import json
import re

def main():
    print("=" * 60)
    print("💎 AÖL DİJİTAL SINAV KİTAPÇIĞI DERLEYİCİSİ (SÜRÜM 3.4 - KREDİ & PUAN MOTORU)")
    print("=" * 60)

    with open('ciktilar/analiz/tum_analizli_sorular_temiz.json', 'r', encoding='utf-8') as f:
        questions = json.load(f)

    # Resmî MEB AÖL Ders Kredileri Tablosu
    COURSE_CREDITS = {
        'MATEMATİK': 6,
        'TÜRK DİLİ': 5,
        'EDEBİYAT': 5,
        'İNGİLİZCE': 4,
        'SAĞLIK': 1,
        'TARİH': 2,
        'İNKILAP': 2,
        'COĞRAFYA': 2,
        'FELSEFE': 2,
        'FİZİK': 2,
        'KİMYA': 2,
        'BİYOLOJİ': 2,
        'DİN KÜLTÜRÜ': 2
    }

    def get_course_credit(course_name):
        for key, cred in COURSE_CREDITS.items():
            if key in course_name:
                return cred
        return 2

    def is_visual_question(q):
        stem = q.get('soru_temiz', '') or q.get('soru', '')
        
        visual_patterns = [
            r'\bşekildeki\b',
            r'\bşekle\s+göre\b',
            r'\bşekil\s+(?:I|II|III|IV|1|2|3|4)\b',
            r'\b(?:verilen|yukarıdaki|aşağıdaki|yandaki)\s+şek(?:il|le|ilde)\b',
            r'\bşekil(?:de)?\s+(?:verilen|gösterilen|belirtilen|numaralan|yer\s+alan|gibi)\b',
            r'\bharitada\s+(?:verilen|gösterilen|numaralan|belirtilen|koyu|taran|işaret|renk)',
            r'\bharitadaki\b',
            r'\bharitaya\s+göre\b',
            r'\bgrafik(?:te|teki)\s+(?:verilen|gösterilen|belirtilen|gibi|hareketle)',
            r'\bgrafikteki\b',
            r'\bgrafiğe\s+göre\b',
            r'\b(?:verilen|yukarıdaki|aşağıdaki|yandaki)\s+grafi(?:k|ğe|kte)\b',
            r'\bgörsel(?:de|deki)\b',
            r'\bgörsele\s+göre\b',
            r'\bgörselde\s+(?:verilen|gösterilen|numaralan|belirtilen|gibi)\b',
            r'\b(?:verilen|yukarıdaki|aşağıdaki|yandaki)\s+görsel\b',
            r'\bkroki(?:de|deki|ye)\b',
            r'\bkrokiye\s+göre\b',
            r'\btaran(?:arak|mış)\s+(?:alan|bölge|yer)\b',
            r'\bboyalı\s+(?:alan|bölge)\b',
            r'\bdevre\s+şeması\b',
        ]

        exclude_patterns = [
            r'\bgeometrik\s+şekle\b',
            r'\bne\s+şekilde\b',
            r'\b(?:bu|o|şu|iyi|doğru|sağlıklı|hızlı|bilinçli|olacak|düzenli|farklı|aynı|belirli\s+bir|bir)\s+şekilde\b',
            r'Vinland\s+Haritası',
        ]

        cleaned_stem = stem
        for exp in exclude_patterns:
            cleaned_stem = re.sub(exp, '', cleaned_stem, flags=re.IGNORECASE)

        for pat in visual_patterns:
            if re.search(pat, cleaned_stem, re.IGNORECASE):
                return True
        return False

    try:
        from scripts.topic_hints_data import get_hint_for_question
    except ModuleNotFoundError:
        from topic_hints_data import get_hint_for_question

    # Bir sınav oturumundaki soru sayısını dinamik tespit et: (yil, donem, ders) -> soru adedi
    exam_counts = {}
    for q in questions:
        key = (q['yil'], str(q['donem']), q['ders'])
        exam_counts[key] = exam_counts.get(key, 0) + 1

    cleaned_list = []
    for q in questions:
        key = (q['yil'], str(q['donem']), q['ders'])
        sinav_soru_sayisi = exam_counts.get(key, 10)
        kredi = get_course_credit(q['ders'])
        # Formül: kendi dersinin kredisi / o dersten bir sınavda çıkan toplam soru adedi
        puan = round(kredi / sinav_soru_sayisi, 2)
        ipucu = get_hint_for_question(q)
        sekilli = is_visual_question(q)

        cleaned_list.append({
            'id': q['id'],
            'ders': q['ders'],
            'ders_kodu': q.get('ders_kodu', ''),
            'yil': q['yil'],
            'donem': str(q['donem']),
            'soru_no': q['soru_no'],
            'soru': q['soru_temiz'],
            'secenekler': q['secenekler_temiz'],
            'dogru_cevap': q['dogru_cevap'],
            'ana_konu': q.get('ana_konu', 'Genel'),
            'alt_konu': q.get('alt_konu', 'Genel'),
            'kredi': kredi,
            'sinav_soru_sayisi': sinav_soru_sayisi,
            'puan': puan,
            'ipucu': ipucu,
            'sekilli': sekilli
        })

    json_data = json.dumps(cleaned_list, ensure_ascii=False)

    html_content = f"""<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover">
  <title>AÖL Dijital Sınav Kitapçığı</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap" rel="stylesheet">
  <style>
    /* ========================================================= */
    /* 1. DİJİTAL KAĞIT & AMBİYANS SİSTEMİ (DESIGN TOKENS)      */
    /* ========================================================= */
    :root {{
      --safe-top: env(safe-area-inset-top, 0px);
      --safe-bottom: env(safe-area-inset-bottom, 0px);

      --ambient-bg: #eceff3;
      --paper-bg: #ffffff;
      --paper-text: #0f172a;
      --paper-text-muted: #64748b;
      --paper-border: #cbd5e1;
      --paper-rule: #cbd5e1;
      --paper-shadow: 0 10px 35px -5px rgba(15, 23, 42, 0.12), 0 0 1px rgba(0,0,0,0.06);

      --badge-bg: rgba(255, 255, 255, 0.92);
      --badge-border: #cbd5e1;
      --hud-bg: rgba(255, 255, 255, 0.94);
      --hud-border: #cbd5e1;
      --hud-text: #0f172a;

      --user-accent: #0284c7;
      --user-accent-dark: #38bdf8;

      --bubble-border: #334155;
      --bubble-text: #0f172a;
      --bubble-fill: var(--user-accent);
      --bubble-fill-text: #ffffff;

      --brand-accent: var(--user-accent);
      --success-accent: #10b981;
      --danger-accent: #ef4444;

      --booklet-font-size: 13.5px;
    }}

    body.dark-mode {{
      --ambient-bg: #151618;
      --paper-bg: #1e1f23;
      --paper-text: #e3e5ea;
      --paper-text-muted: #8e94a0;
      --paper-border: #2d2f36;
      --paper-rule: #2d2f36;
      --paper-shadow: 0 14px 45px -5px rgba(0, 0, 0, 0.6);

      --badge-bg: rgba(30, 31, 35, 0.94);
      --badge-border: #2d2f36;
      --hud-bg: rgba(28, 29, 33, 0.96);
      --hud-border: #353840;
      --hud-text: #f0f2f5;

      --bubble-border: #8e94a0;
      --bubble-text: #f0f2f5;
      --bubble-fill: var(--user-accent-dark);
      --bubble-fill-text: #ffffff;

      --brand-accent: var(--user-accent-dark);
      --success-accent: #34d399;
      --danger-accent: #f87171;
    }}

    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      -webkit-tap-highlight-color: transparent;
    }}

    body {{
      background: var(--ambient-bg);
      color: var(--paper-text);
      line-height: 1.6;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: background 0.2s, color 0.2s;
    }}

    /* ========================================================= */
    /* 2. NAVBARSIZ ÜST ORTA BAŞLIK & EZAN VAKTİ HAPLARI         */
    /* ========================================================= */
    .top-center-badge-container {{
      position: fixed;
      top: calc(14px + var(--safe-top));
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 8px;
      pointer-events: none;
      transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease;
    }}

    body.fullscreen-focus-mode .top-center-badge-container {{
      transform: translateX(-50%) translateY(-130%);
      opacity: 0;
      pointer-events: none;
    }}

    .top-center-pill {{
      pointer-events: auto;
      background: var(--badge-bg);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid var(--badge-border);
      color: var(--paper-text);
      padding: 8px 18px;
      border-radius: 9999px;
      display: inline-flex;
      align-items: center;
      gap: 9px;
      font-size: 13.5px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      user-select: none;
      white-space: nowrap;
    }}

    .top-center-pill:hover {{
      transform: scale(1.03);
      border-color: var(--brand-accent);
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.14);
    }}

    .top-center-pill:active {{
      transform: scale(0.98);
    }}

    .badge-icon {{
      font-size: 16px;
      line-height: 1;
    }}

    .badge-text {{
      letter-spacing: 0.2px;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }}

    .badge-caret {{
      font-size: 10px;
      opacity: 0.55;
      margin-left: 1px;
      transition: transform 0.2s;
    }}

    .top-center-pill:hover .badge-caret {{
      opacity: 0.9;
      transform: translateY(1px);
    }}

    /* Ezan Vakti Rozeti */
    .top-prayer-pill {{
      pointer-events: auto;
      background: var(--badge-bg);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid var(--badge-border);
      color: var(--paper-text);
      padding: 8px 14px;
      border-radius: 9999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      user-select: none;
      white-space: nowrap;
      transition: all 0.2s ease;
    }}

    .prayer-text {{
      font-family: 'JetBrains Mono', monospace;
      font-size: 12.5px;
      letter-spacing: 0.5px;
      font-weight: 700;
    }}

    /* ========================================================= */
    /* 3. GERÇEK SINAV KİTAPÇIĞI (THE PAPER CANVAS)             */
    /* ========================================================= */
    .booklet-stream-container {{
      width: 100%;
      max-width: 960px;
      padding: calc(64px + var(--safe-top)) 16px calc(110px + var(--safe-bottom)) 16px;
      display: flex;
      flex-direction: column;
      gap: 28px;
      transition: padding 0.25s ease, max-width 0.25s ease;
    }}

    .booklet-stream-container.wide-3 {{
      max-width: 1120px;
    }}

    .booklet-stream-container.wide-4 {{
      max-width: 1280px;
    }}

    body.fullscreen-focus-mode .booklet-stream-container {{
      padding-top: calc(20px + var(--safe-top));
    }}

    .booklet-page {{
      background: var(--paper-bg);
      border: 1px solid var(--paper-border);
      border-radius: 4px;
      box-shadow: var(--paper-shadow);
      padding: 30px 34px 22px 34px;
      min-height: 980px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      font-size: var(--booklet-font-size);
    }}

    .page-header-band {{
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: 2px solid var(--paper-text);
      padding-bottom: 8px;
      margin-bottom: 20px;
    }}

    .page-header-left {{
      display: flex;
      flex-direction: column;
      gap: 2px;
    }}

    .institution-name {{
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1.5px;
      color: var(--paper-text-muted);
      text-transform: uppercase;
    }}

    .exam-name-title {{
      font-size: 14.5px;
      font-weight: 800;
      letter-spacing: -0.3px;
      color: var(--paper-text);
    }}

    .page-header-right {{
      text-align: right;
    }}

    .page-badge-code {{
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      background: rgba(125, 125, 125, 0.1);
      padding: 3px 8px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }}

    .page-columns-body {{
      column-gap: 32px;
      column-rule: 1px solid var(--paper-rule);
      flex-grow: 1;
    }}

    .page-columns-body.cols-1 {{
      column-count: 1 !important;
      column-rule: none !important;
      max-width: 680px;
      margin: 0 auto;
    }}

    .page-columns-body.cols-2 {{
      column-count: 2 !important;
      column-gap: 32px !important;
      column-rule: 1px solid var(--paper-rule) !important;
    }}

    .page-columns-body.cols-3 {{
      column-count: 3 !important;
      column-gap: 22px !important;
      column-rule: 1px solid var(--paper-rule) !important;
    }}

    .page-columns-body.cols-4 {{
      column-count: 4 !important;
      column-gap: 16px !important;
      column-rule: 1px solid var(--paper-rule) !important;
    }}

    /* Soru Bloğu */
    .booklet-question {{
      break-inside: avoid;
      page-break-inside: avoid;
      margin-bottom: 26px;
      position: relative;
    }}

    .q-top-row {{
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 7px;
    }}

    .q-number {{
      font-size: 1.15em;
      font-weight: 800;
      color: var(--paper-text);
      letter-spacing: -0.3px;
    }}

    /* Soru Puanı / Kredi Rozeti */
    .q-point-pill {{
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 700;
      color: var(--brand-accent);
      background: rgba(2, 132, 199, 0.08);
      border: 1px solid rgba(2, 132, 199, 0.22);
      padding: 1px 6px;
      border-radius: 6px;
      letter-spacing: 0.2px;
      user-select: none;
      display: inline-flex;
      align-items: center;
      line-height: 1.3;
    }}

    body.dark-mode .q-point-pill {{
      background: rgba(96, 165, 250, 0.12);
      border-color: rgba(96, 165, 250, 0.28);
      color: #60a5fa;
    }}

    /* Şekilli Sorular - Pasif ve Yakında Durumu */
    .booklet-question.is-passive-question {{
      opacity: 0.62;
      background: rgba(245, 158, 11, 0.025);
      border: 1.5px dashed rgba(245, 158, 11, 0.35);
      padding: 12px 14px;
      border-radius: 10px;
    }}

    body.dark-mode .booklet-question.is-passive-question {{
      background: rgba(245, 158, 11, 0.04);
      border-color: rgba(245, 158, 11, 0.28);
    }}

    .booklet-question.is-passive-question .q-optical-options,
    .booklet-question.is-passive-question .optical-choice-row {{
      pointer-events: none !important;
      cursor: not-allowed !important;
    }}

    .booklet-question.is-passive-question .optical-bubble {{
      opacity: 0.45;
      background: rgba(0, 0, 0, 0.04);
      border-color: rgba(125, 125, 125, 0.3);
    }}

    .q-soon-badge {{
      font-size: 10px;
      font-weight: 800;
      color: #b45309;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.4);
      padding: 1px 7px;
      border-radius: 999px;
      letter-spacing: 0.3px;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      user-select: none;
    }}

    body.dark-mode .q-soon-badge {{
      color: #fcd34d;
      background: rgba(245, 158, 11, 0.22);
      border-color: rgba(245, 158, 11, 0.45);
    }}

    .q-soon-banner {{
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      background: rgba(245, 158, 11, 0.08);
      border-left: 3px solid #f59e0b;
      border-radius: 0 6px 6px 0;
      margin-bottom: 8px;
      font-size: 11px;
      color: #b45309;
      font-weight: 600;
      line-height: 1.35;
      user-select: none;
    }}

    body.dark-mode .q-soon-banner {{
      background: rgba(245, 158, 11, 0.12);
      border-left-color: #fbbf24;
      color: #fcd34d;
    }}

    /* Tekil Cevap Gösterici (Lucide Eye) */
    .btn-companion-icon {{
      background: none;
      border: none;
      color: var(--paper-text-muted);
      opacity: 0.38;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 3px 5px;
      border-radius: 5px;
      transition: all 0.15s;
    }}

    .btn-companion-icon:hover {{
      opacity: 1;
      background: rgba(125, 125, 125, 0.12);
      color: var(--paper-text);
    }}

    .btn-companion-icon.revealed {{
      opacity: 1;
      color: var(--success-accent);
      background: rgba(16, 185, 129, 0.12);
    }}

    .q-source-tag {{
      margin-left: auto;
      font-family: 'JetBrains Mono', monospace;
      font-size: 9.5px;
      color: var(--paper-text-muted);
      letter-spacing: 0.2px;
    }}

    .q-stem-text {{
      font-size: 1em;
      line-height: 1.6;
      color: var(--paper-text);
      margin-bottom: 12px;
      text-align: justify;
      word-break: break-word;
      white-space: pre-line;
    }}

    .q-optical-options {{
      display: flex;
      flex-direction: column;
      gap: 4px;
    }}

    /* Gerçek Optik İşaretleme Satırı */
    .optical-choice-row {{
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 4px 6px;
      border-radius: 6px;
      cursor: pointer;
      user-select: none;
      transition: background 0.12s;
    }}

    .optical-choice-row:hover {{
      background: rgba(125, 125, 125, 0.08);
    }}

    .optical-bubble {{
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 1.5px solid var(--bubble-border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 800;
      color: var(--bubble-text);
      flex-shrink: 0;
      transition: all 0.12s cubic-bezier(0.4, 0, 0.2, 1);
    }}

    .optical-choice-row.marked .optical-bubble {{
      background: var(--bubble-fill);
      border-color: var(--bubble-fill);
      color: var(--bubble-fill-text);
      box-shadow: 0 0 0 2px var(--paper-bg), 0 0 0 4px var(--bubble-fill);
    }}

    .optical-choice-row.revealed-correct .optical-bubble {{
      background: var(--success-accent) !important;
      border-color: var(--success-accent) !important;
      color: #ffffff !important;
      box-shadow: 0 0 0 2px var(--paper-bg), 0 0 0 4px var(--success-accent);
    }}

    .choice-text-content {{
      font-size: 0.96em;
      line-height: 1.45;
      color: var(--paper-text);
      word-break: break-word;
    }}

    .single-answer-banner {{
      margin-top: 10px;
      padding: 6px 10px;
      border-radius: 6px;
      background: rgba(16, 185, 129, 0.08);
      border-left: 3px solid var(--success-accent);
      font-size: 11.5px;
      display: none;
      justify-content: space-between;
      align-items: center;
    }}

    /* Sayfa Alt Bandı & Lucide Göz Butonu */
    .page-footer-band {{
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid var(--paper-rule);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: var(--paper-text-muted);
      font-weight: 600;
    }}

    .btn-page-key-toggle {{
      background: none;
      border: 1px solid var(--paper-border);
      color: var(--paper-text-muted);
      padding: 4px 9px;
      border-radius: 6px;
      font-size: 10.5px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: all 0.15s;
    }}

    .btn-page-key-toggle:hover {{
      background: rgba(125, 125, 125, 0.1);
      color: var(--paper-text);
      border-color: var(--brand-accent);
    }}

    .page-num-pill {{
      font-family: 'JetBrains Mono', monospace;
      font-weight: 800;
      color: var(--paper-text);
      letter-spacing: 0.8px;
    }}

    .page-bottom-answer-strip {{
      margin-top: 10px;
      padding: 8px 10px;
      border-top: 1px dashed var(--paper-rule);
      display: none;
      flex-wrap: wrap;
      gap: 10px;
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
      background: rgba(125, 125, 125, 0.04);
      border-radius: 4px;
    }}

    .mini-key-cell {{
      display: inline-flex;
      gap: 4px;
      align-items: center;
    }}

    /* ========================================================= */
    /* 4. SAĞ ALT KONSOL & 3 ÇİZGİLİ MENÜ BUTONU                */
    /* ========================================================= */
    .floating-console-container {{
      position: fixed;
      bottom: calc(24px + var(--safe-bottom));
      right: 24px;
      z-index: 1500;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 10px;
    }}

    .btn-square-console {{
      width: 48px;
      height: 48px;
      background: #0f172a;
      color: #ffffff;
      border: 2px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 6px 22px rgba(0, 0, 0, 0.35);
      transition: all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
    }}

    body.dark-mode .btn-square-console {{
      background: #25272d;
      color: #f0f2f5;
      border-color: #383a42;
    }}

    .btn-square-console:hover {{
      transform: scale(1.06);
    }}

    .console-menu-popup {{
      background: var(--hud-bg);
      border: 1px solid var(--hud-border);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-radius: 14px;
      padding: 10px;
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.28);
      display: none;
      flex-direction: column;
      gap: 8px;
      width: 236px;
      animation: popUp 0.16s ease-out;
    }}

    .console-menu-popup.open {{
      display: flex;
    }}

    @keyframes popUp {{
      from {{ opacity: 0; transform: translateY(8px) scale(0.97); }}
      to {{ opacity: 1; transform: translateY(0) scale(1); }}
    }}

    /* "EL ALİM" Modern Kufi Hat Başlığı */
    .console-al-alim {{
      font-family: 'Noto Kufi Arabic', sans-serif;
      font-size: 22px;
      font-weight: 700;
      text-align: center;
      color: var(--brand-accent);
      padding: 4px 0 6px 0;
      letter-spacing: 2px;
      border-bottom: 1px solid var(--hud-border);
      margin-bottom: 2px;
      user-select: none;
    }}

    /* Hızlı Araçlar Çubuğu (Geri Al, Sıfırla, Zoom, Tam Ekran Yan Yana) */
    .console-tools-bar {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 4px;
      background: rgba(125, 125, 125, 0.08);
      padding: 4px;
      border-radius: 10px;
      border: 1px solid var(--hud-border);
    }}

    .btn-tool-icon {{
      flex: 1;
      height: 34px;
      border-radius: 7px;
      border: none;
      background: transparent;
      color: var(--hud-text);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s;
      padding: 0;
    }}

    .btn-tool-icon:hover {{
      background: rgba(125, 125, 125, 0.16);
      color: var(--brand-accent);
    }}

    .btn-tool-icon:active {{
      transform: scale(0.95);
    }}

    /* Konsol Kontrol Grupları (Segmented Toggle) */
    .console-control-group {{
      display: flex;
      flex-direction: column;
      gap: 5px;
      padding: 2px 0;
    }}

    .console-label-row {{
      display: flex;
      justify-content: space-between;
      align-items: center;
    }}

    .console-group-label {{
      font-size: 11px;
      font-weight: 700;
      color: var(--paper-text-muted);
      letter-spacing: 0.3px;
      text-transform: uppercase;
    }}

    .console-segmented-pill {{
      display: flex;
      background: rgba(125, 125, 125, 0.08);
      padding: 3px;
      border-radius: 9px;
      gap: 3px;
      border: 1px solid var(--hud-border);
    }}

    .btn-segmented-pill {{
      flex: 1;
      padding: 6px 8px;
      font-size: 12px;
      font-weight: 700;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: var(--paper-text-muted);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      transition: all 0.15s ease;
      user-select: none;
    }}

    .btn-segmented-pill:hover {{
      color: var(--hud-text);
      background: rgba(125, 125, 125, 0.12);
    }}

    .btn-segmented-pill.active {{
      background: var(--paper-bg);
      color: var(--brand-accent);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
      font-weight: 800;
    }}

    body.dark-mode .btn-segmented-pill.active {{
      background: #2a2c33;
      color: var(--brand-accent);
      box-shadow: 0 1px 6px rgba(0, 0, 0, 0.3);
    }}

    /* Vurgu Rengi Seçici (Accent Swatches) */
    .console-color-swatches {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 5px;
      background: rgba(125, 125, 125, 0.08);
      padding: 5px 8px;
      border-radius: 9px;
      border: 1px solid var(--hud-border);
    }}

    .btn-color-swatch {{
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid transparent;
      background: var(--swatch-color);
      cursor: pointer;
      transition: all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
      padding: 0;
      position: relative;
    }}

    .btn-color-swatch:hover {{
      transform: scale(1.18);
    }}

    .btn-color-swatch.active {{
      transform: scale(1.15);
      box-shadow: 0 0 0 2px var(--hud-bg), 0 0 0 4px var(--swatch-color);
    }}

    .console-action-row {{
      background: none;
      border: none;
      padding: 8px 10px;
      border-radius: 8px;
      font-size: 12.5px;
      font-weight: 700;
      color: var(--hud-text);
      display: flex;
      align-items: center;
      gap: 9px;
      cursor: pointer;
      transition: background 0.12s;
      text-align: left;
      width: 100%;
    }}

    .console-action-row:hover {{
      background: rgba(125, 125, 125, 0.12);
    }}

    .console-divider {{
      height: 1px;
      background: var(--hud-border);
      margin: 2px 0;
    }}

    /* ========================================================= */
    /* 5. DERS & KONU ÇEKMECESİ (DRAWER MODAL)                   */
    /* ========================================================= */
    .drawer-overlay {{
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(6px);
      z-index: 2000;
      display: none;
      align-items: flex-start;
      justify-content: center;
      padding: calc(20px + var(--safe-top)) 16px 20px 16px;
    }}

    .drawer-overlay.open {{
      display: flex;
    }}

    .drawer-card {{
      background: var(--paper-bg);
      border: 1px solid var(--paper-border);
      border-radius: 16px;
      max-width: 640px;
      width: 100%;
      max-height: 88vh;
      overflow-y: auto;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.35);
      padding: 20px 22px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }}

    .drawer-header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--paper-border);
      padding-bottom: 12px;
    }}

    .drawer-header h3 {{
      font-size: 17px;
      font-weight: 800;
      letter-spacing: -0.3px;
    }}

    .btn-close-drawer {{
      background: rgba(125, 125, 125, 0.1);
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
      color: var(--paper-text);
      display: flex;
      align-items: center;
      justify-content: center;
    }}

    /* 12 Subject Grid */
    .drawer-subject-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 8px;
    }}

    .drawer-subj-card {{
      background: rgba(125, 125, 125, 0.05);
      border: 1.5px solid var(--paper-border);
      border-radius: 10px;
      padding: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: all 0.15s;
    }}

    .drawer-subj-card:hover {{
      border-color: var(--brand-accent);
      transform: translateY(-1px);
    }}

    .drawer-subj-card.active {{
      background: rgba(2, 132, 199, 0.12);
      border-color: var(--brand-accent);
    }}

    .drawer-subj-icon {{
      font-size: 20px;
    }}

    .drawer-subj-name {{
      font-size: 12.5px;
      font-weight: 800;
      line-height: 1.2;
    }}

    .drawer-subj-count {{
      font-size: 10.5px;
      color: var(--paper-text-muted);
    }}

    /* Kademeler Flow */
    .drawer-courses-flow {{
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 6px;
    }}

    .btn-course-toggle {{
      background: rgba(125, 125, 125, 0.08);
      border: 1px solid var(--paper-border);
      color: var(--paper-text);
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12.5px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s;
    }}

    .btn-course-toggle.selected {{
      background: var(--paper-text);
      color: var(--paper-bg);
      border-color: var(--paper-text);
    }}

    /* Kesişim / Birleşim Mod Düğmeleri */
    .btn-mode-toggle {{
      background: rgba(125, 125, 125, 0.08);
      border: 1px solid var(--paper-border);
      color: var(--paper-text-muted);
      padding: 3px 9px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s;
      user-select: none;
    }}

    .btn-mode-toggle:hover {{
      color: var(--paper-text);
      border-color: var(--brand-accent);
    }}

    .btn-mode-toggle.active {{
      background: var(--brand-accent);
      color: #ffffff;
      border-color: var(--brand-accent);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
    }}

    /* Çekmece Külli & Bağımlı Arama Bölümü */
    .drawer-search-section {{
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 4px;
    }}

    .drawer-search-bar {{
      display: flex;
      align-items: center;
      background: rgba(125, 125, 125, 0.07);
      border: 1.5px solid var(--paper-border);
      border-radius: 10px;
      padding: 0 12px;
      transition: all 0.18s ease;
    }}

    .drawer-search-bar:focus-within {{
      border-color: var(--brand-accent);
      background: var(--paper-bg);
      box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
    }}

    .drawer-search-icon {{
      font-size: 14px;
      margin-right: 8px;
      opacity: 0.6;
    }}

    .drawer-search-input {{
      flex: 1;
      border: none;
      background: transparent;
      padding: 9px 0;
      font-size: 13px;
      font-weight: 600;
      color: var(--paper-text);
      outline: none;
      font-family: inherit;
    }}

    .drawer-search-input::placeholder {{
      color: var(--paper-text-muted);
      font-weight: 500;
      opacity: 0.8;
    }}

    .drawer-search-clear {{
      background: rgba(125, 125, 125, 0.15);
      border: none;
      color: var(--paper-text-muted);
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: none;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      cursor: pointer;
      margin-left: 6px;
      transition: all 0.15s;
    }}

    .drawer-search-clear:hover {{
      background: rgba(225, 29, 72, 0.18);
      color: #e11d48;
    }}

    /* Arama Sonuçları Kartları */
    .drawer-search-results-list {{
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 420px;
      overflow-y: auto;
      padding-right: 4px;
    }}

    .drawer-search-result-card {{
      background: rgba(125, 125, 125, 0.04);
      border: 1.5px solid var(--paper-border);
      border-radius: 10px;
      padding: 10px 12px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 6px;
      transition: all 0.15s ease;
    }}

    .drawer-search-result-card:hover {{
      border-color: var(--brand-accent);
      background: rgba(2, 132, 199, 0.06);
      transform: translateY(-1px);
    }}

    .result-card-header {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      flex-wrap: wrap;
    }}

    .result-badge-course {{
      font-size: 11px;
      font-weight: 800;
      color: var(--brand-accent);
      background: rgba(2, 132, 199, 0.12);
      padding: 2px 7px;
      border-radius: 4px;
    }}

    .result-badge-topic {{
      font-size: 10.5px;
      color: var(--paper-text-muted);
      font-weight: 600;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }}

    .result-badge-point {{
      font-size: 10.5px;
      font-weight: 800;
      color: #059669;
      background: rgba(5, 150, 105, 0.1);
      padding: 1px 6px;
      border-radius: 4px;
    }}

    .result-card-stem {{
      font-size: 12px;
      line-height: 1.45;
      color: var(--paper-text);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }}

    .result-matched-choice {{
      font-size: 11px;
      background: rgba(217, 119, 6, 0.1);
      color: #b45309;
      border-left: 3px solid #d97706;
      padding: 4px 8px;
      border-radius: 0 4px 4px 0;
      line-height: 1.35;
    }}

    body.dark-mode .result-matched-choice {{
      background: rgba(217, 119, 6, 0.18);
      color: #fbbf24;
      border-left-color: #f59e0b;
    }}

    mark.search-highlight {{
      background: rgba(254, 240, 138, 0.85);
      color: #713f12;
      padding: 0 3px;
      border-radius: 2px;
      font-weight: 700;
    }}

    body.dark-mode mark.search-highlight {{
      background: rgba(234, 179, 8, 0.35);
      color: #fef08a;
    }}

    /* ========================================================= */
    /* SÜRÜKLENEBİLİR MİNNACIK NAKİT NUMPAD (MICRO CALCULATOR)   */
    /* ========================================================= */
    .mini-calc-widget {{
      position: fixed;
      bottom: 85px;
      right: 25px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 5px;
      user-select: none;
      animation: calcPopIn 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }}

    @keyframes calcPopIn {{
      0% {{ opacity: 0; transform: scale(0.92) translateY(8px); }}
      100% {{ opacity: 1; transform: scale(1) translateY(0); }}
    }}

    /* Sayı sadece kendi boyutu kadar bir pill (bg) içinde */
    .mini-calc-display-pill {{
      display: inline-flex;
      align-items: center;
      justify-content: flex-end;
      background: var(--paper-bg);
      border: 1.5px solid var(--paper-border);
      border-radius: 12px;
      padding: 4px 10px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
      cursor: grab;
      min-width: 44px;
      max-width: 140px;
      gap: 5px;
      overflow: hidden;
      transition: all 0.15s ease;
    }}

    .mini-calc-display-pill:active {{
      cursor: grabbing;
    }}

    .mini-calc-display-sub {{
      font-size: 10px;
      color: var(--brand-accent);
      font-weight: 800;
      font-family: monospace;
    }}

    .mini-calc-display-main {{
      font-size: 15px;
      font-weight: 800;
      color: var(--paper-text);
      font-family: monospace;
      letter-spacing: -0.5px;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }}

    /* 3x4 Ultra Kompakt Grid */
    .mini-calc-numpad-body {{
      background: var(--paper-bg);
      border: 1.5px solid var(--paper-border);
      border-radius: 12px;
      padding: 5px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
      display: grid;
      grid-template-columns: repeat(3, 38px);
      grid-template-rows: repeat(4, 32px);
      gap: 4px;
    }}

    .micro-calc-btn {{
      background: rgba(125, 125, 125, 0.08);
      border: 1px solid var(--paper-border);
      border-radius: 7px;
      color: var(--paper-text);
      font-size: 13px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.1s ease;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }}

    .micro-calc-btn:hover {{
      background: rgba(125, 125, 125, 0.18);
      transform: translateY(-1px);
    }}

    .micro-calc-btn:active {{
      transform: scale(0.92);
    }}

    /* Change (⇄) Tuşu */
    .micro-btn-change {{
      background: rgba(2, 132, 199, 0.12);
      color: var(--brand-accent);
      border-color: var(--brand-accent);
      font-weight: 800;
      font-size: 14px;
    }}

    .micro-btn-change:hover {{
      background: var(--brand-accent);
      color: #ffffff;
    }}

    /* İşlem Tuşları */
    .micro-btn-op {{
      color: var(--brand-accent);
      font-weight: 800;
      background: rgba(2, 132, 199, 0.08);
      border-color: rgba(2, 132, 199, 0.2);
    }}

    /* Eşittir (=) */
    .micro-btn-equals {{
      background: var(--brand-accent);
      color: #ffffff;
      font-weight: 800;
      border-color: var(--brand-accent);
    }}

    /* Kırmızı Kapatma (✕) */
    .micro-btn-close {{
      background: rgba(225, 29, 72, 0.12);
      color: #e11d48;
      border-color: rgba(225, 29, 72, 0.3);
      font-weight: 800;
    }}

    .micro-btn-close:hover {{
      background: #e11d48;
      color: #ffffff;
    }}

    /* Topic List */
    .drawer-topic-list {{
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 280px;
      overflow-y: auto;
      padding-right: 4px;
    }}

    .drawer-topic-item {{
      background: rgba(125, 125, 125, 0.04);
      border: 1px solid var(--paper-border);
      border-radius: 8px;
      padding: 8px 12px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.12s;
    }}

    .drawer-topic-item:hover {{
      border-color: var(--brand-accent);
      background: rgba(2, 132, 199, 0.08);
    }}

    .drawer-topic-item.selected {{
      border-color: var(--brand-accent);
      background: rgba(2, 132, 199, 0.14);
      font-weight: 800;
    }}

    .drawer-topic-name {{
      font-size: 12.5px;
      font-weight: 700;
      color: var(--paper-text);
      line-height: 1.4;
    }}

    .topic-ak {{
      font-weight: 600;
      color: var(--paper-text-muted);
    }}

    .topic-slash {{
      color: var(--brand-accent);
      font-weight: 800;
      margin: 0 4px;
    }}

    .topic-sub {{
      font-weight: 750;
      color: var(--paper-text);
    }}

    .drawer-topic-badge {{
      background: var(--brand-accent);
      color: #ffffff;
      padding: 2px 7px;
      border-radius: 5px;
      font-size: 10.5px;
      font-weight: 800;
      flex-shrink: 0;
    }}

    /* ========================================================= */
    /* PUSULA İPUCU VE HİNT BANNER STİLLERİ                      */
    /* ========================================================= */
    .btn-companion-icon.hint-revealed {{
      background: rgba(2, 132, 199, 0.14) !important;
      border-color: var(--brand-accent) !important;
      color: var(--brand-accent) !important;
    }}

    .single-hint-banner {{
      margin-top: 8px;
      padding: 8px 12px;
      background: rgba(2, 132, 199, 0.06);
      border-left: 3px solid var(--brand-accent);
      border-radius: 0 8px 8px 0;
      display: flex;
      flex-direction: column;
      gap: 3px;
      font-size: 11.5px;
      line-height: 1.45;
      animation: hintPopIn 0.15s ease;
    }}

    body.dark-mode .single-hint-banner {{
      background: rgba(56, 189, 248, 0.08);
      border-left-color: #38bdf8;
    }}

    @keyframes hintPopIn {{
      0% {{ opacity: 0; transform: translateY(-4px); }}
      100% {{ opacity: 1; transform: translateY(0); }}
    }}

    .hint-header {{
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.4px;
      color: var(--brand-accent);
      text-transform: uppercase;
    }}

    body.dark-mode .hint-header {{
      color: #38bdf8;
    }}

    .hint-content {{
      color: var(--paper-text);
      font-weight: 550;
    }}

    /* ========================================================= */
    /* 6. AKILLI PDF İNDİRME SEÇİM DİYALOĞU                     */
    /* ========================================================= */
    .pdf-dialog-overlay {{
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(6px);
      z-index: 2500;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }}

    .pdf-dialog-overlay.open {{
      display: flex;
    }}

    .pdf-dialog-card {{
      background: var(--paper-bg);
      border: 1px solid var(--paper-border);
      border-radius: 14px;
      max-width: 440px;
      width: 100%;
      padding: 22px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.35);
    }}

    .pdf-dialog-title {{
      font-size: 16px;
      font-weight: 800;
    }}

    .pdf-opt-group {{
      display: flex;
      flex-direction: column;
      gap: 8px;
    }}

    .pdf-radio-label {{
      background: rgba(125, 125, 125, 0.05);
      border: 1px solid var(--paper-border);
      padding: 10px 14px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 700;
      transition: all 0.12s;
    }}

    .pdf-radio-label:hover {{
      border-color: var(--brand-accent);
    }}

    .pdf-dialog-footer {{
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      border-top: 1px solid var(--paper-border);
      padding-top: 14px;
    }}

    .cat-pill-btn {{
      background: rgba(125, 125, 125, 0.08);
      border: 1px solid var(--paper-border);
      color: var(--paper-text-muted);
      padding: 6px 14px;
      border-radius: 18px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s;
    }}

    .cat-pill-btn:hover {{
      background: rgba(125, 125, 125, 0.15);
      color: var(--paper-text);
    }}

    .btn-pdf-confirm {{
      background: var(--brand-accent);
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }}

    /* ========================================================= */
    /* 7. BASKI & PDF STİLLERİ (@media print)                    */
    /* ========================================================= */
    @media print {{
      @page {{
        size: A4;
        margin: 8mm 10mm;
      }}

      body {{
        background: #ffffff !important;
        color: #000000 !important;
      }}

      .top-center-badge-container,
      .floating-console-container,
      .drawer-overlay,
      .pdf-dialog-overlay,
      .btn-companion-icon,
      .btn-page-key-toggle {{
        display: none !important;
      }}

      .booklet-stream-container {{
        max-width: 100% !important;
        padding: 0 !important;
        gap: 0 !important;
      }}

      .booklet-page {{
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        min-height: 280mm !important;
        page-break-after: always !important;
        break-after: page !important;
      }}

      .page-columns-body {{
        column-count: 2 !important;
        column-gap: 28px !important;
        column-rule: 1px solid #cbd5e1 !important;
      }}

      .booklet-question {{
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }}

      .single-answer-banner {{
        display: none !important;
      }}
    }}

    @media (max-width: 900px) {{
      .page-columns-body.cols-3,
      .page-columns-body.cols-4 {{
        column-count: 2 !important;
        column-gap: 24px !important;
      }}
    }}

    /* Mobile Responsive */
    @media (max-width: 640px) {{
      .top-center-badge-container {{ gap: 6px; }}
      .top-center-pill {{ font-size: 11.5px; padding: 6px 12px; }}
      .top-prayer-pill {{ font-size: 11px; padding: 6px 10px; }}
      .prayer-text {{ font-size: 11px; }}
      .booklet-stream-container {{ padding: calc(52px + var(--safe-top)) 6px calc(90px + var(--safe-bottom)) 6px; }}
      .booklet-page {{ padding: 20px 14px 16px 14px; min-height: auto; }}
      .page-columns-body.cols-1,
      .page-columns-body.cols-2,
      .page-columns-body.cols-3,
      .page-columns-body.cols-4 {{
        column-count: 1 !important;
        column-rule: none !important;
      }}
      .optical-choice-row {{ min-height: 44px; padding: 6px 6px; }}
      .optical-bubble {{ width: 26px; height: 26px; font-size: 12px; }}
      .choice-text-content {{ font-size: 13.5px; }}

      /* Mobil Çekmece X-Ekseni Ferahlatma */
      .drawer-overlay {{
        padding: calc(6px + var(--safe-top)) 6px calc(10px + var(--safe-bottom)) 6px !important;
        align-items: center !important;
      }}
      .drawer-card {{
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
        padding: 14px 10px !important;
        gap: 10px !important;
        border-radius: 14px !important;
        max-height: 95vh !important;
      }}
      .drawer-header {{
        padding-bottom: 6px !important;
      }}
      .drawer-header h3 {{
        font-size: 15px !important;
      }}
      .drawer-search-bar {{
        width: 100% !important;
        box-sizing: border-box !important;
      }}
      .drawer-search-input {{
        font-size: 12.5px !important;
        padding: 8px 30px 8px 32px !important;
      }}
      .drawer-subject-grid {{
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 6px !important;
        box-sizing: border-box !important;
      }}
      .drawer-subj-card {{
        padding: 7px 8px !important;
        gap: 7px !important;
        min-width: 0 !important;
        border-radius: 8px !important;
        box-sizing: border-box !important;
      }}
      .drawer-subj-card > div {{
        min-width: 0 !important;
        flex: 1 !important;
        overflow: hidden !important;
      }}
      .drawer-subj-icon {{
        font-size: 18px !important;
        flex-shrink: 0 !important;
      }}
      .drawer-subj-name {{
        font-size: 11.5px !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        line-height: 1.25 !important;
      }}
      .drawer-subj-count {{
        font-size: 9.5px !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }}
      .drawer-courses-flow {{
        gap: 5px !important;
      }}
      .btn-course-toggle {{
        padding: 5px 8px !important;
        font-size: 11.5px !important;
        border-radius: 6px !important;
        gap: 4px !important;
      }}
      .drawer-topic-item {{
        padding: 7px 9px !important;
        gap: 6px !important;
      }}
      .drawer-topic-name {{
        font-size: 11.5px !important;
        line-height: 1.35 !important;
        word-break: break-word !important;
        flex: 1 !important;
        min-width: 0 !important;
      }}
      .drawer-topic-badge {{
        font-size: 9.5px !important;
        padding: 2px 5px !important;
        flex-shrink: 0 !important;
      }}
    }}
  </style>
</head>
<body>

  <!-- ========================================================= -->
  <!-- 1. ÜST ORTA BAŞLIK HAPI & EZAN VAKTİ (MERKEZİ GRUP)       -->
  <!-- ========================================================= -->
  <div class="top-center-badge-container">
    <button class="top-center-pill" id="topCenterBadge" onclick="openSubjectDrawer()" title="Ders ve Konu Değiştir">
      <span class="badge-icon" id="badgeEmoji">📖</span>
      <span class="badge-text" id="badgeMainText">TDE12 / Tüm Konular / 164s</span>
      <span class="badge-caret">▾</span>
    </button>
    <div class="top-prayer-pill" id="topPrayerPill" title="Sonraki Ezana Kalan Süre">
      <span class="prayer-text" id="prayerDisplayText">00:00:00</span>
    </div>
  </div>

  <!-- ========================================================= -->
  <!-- 2. ANA SAHNE: DİJİTAL SINAV KİTAPÇIĞI (VERTICAL STREAM)  -->
  <!-- ========================================================= -->
  <main class="booklet-stream-container" id="bookletPagesContainer"></main>

  <!-- ========================================================= -->
  <!-- 3. SAĞ ALTTAN AÇILAN 3 ÇİZGİLİ MENÜ BUTONU (☰)           -->
  <!-- ========================================================= -->
  <div class="floating-console-container">
    <!-- Konsol Menüsü -->
    <div class="console-menu-popup" id="consoleMenuPopup">
      <div class="console-al-alim" title="El-Alim (Her Şeyi Bilen)">العليم</div>

      <!-- Hızlı Araçlar: Geri Al, Sıfırla, Zoom-, Zoom+, Tam Ekran (Yan Yana, Yazısız) -->
      <div class="console-tools-bar">
        <button class="btn-tool-icon" onclick="clearAllMarks()" title="Şıkları Sıfırla">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>
        </button>
        <button class="btn-tool-icon" onclick="undoClearMarks()" id="btnUndoClear" title="Geri Al (Undo)" style="opacity:0.35;">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>
        </button>
        <button class="btn-tool-icon" onclick="zoomOut()" title="Yazıyı Küçült (-)">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </button>
        <button class="btn-tool-icon" onclick="zoomIn()" title="Yazıyı Büyüt (+)">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </button>
        <button class="btn-tool-icon" onclick="toggleFullscreenFocusMode()" id="btnFullscreenTool" title="Tam Ekran / Odak Modu">
          <svg id="iconFullscreenSvg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
        </button>
      </div>

      <!-- Sütun Düzeni Segmented Toggle -->
      <div class="console-control-group">
        <div class="console-label-row">
          <span class="console-group-label">Sütun Düzeni</span>
        </div>
        <div class="console-segmented-pill" id="columnTogglePill">
          <button class="btn-segmented-pill" data-cols="1" onclick="setColumnCount(1)">1</button>
          <button class="btn-segmented-pill active" data-cols="2" onclick="setColumnCount(2)">2</button>
          <button class="btn-segmented-pill" data-cols="3" onclick="setColumnCount(3)">3</button>
          <button class="btn-segmented-pill" data-cols="4" onclick="setColumnCount(4)">4</button>
        </div>
      </div>

      <!-- Tema Segmented Toggle -->
      <div class="console-control-group">
        <div class="console-label-row">
          <span class="console-group-label">Tema</span>
        </div>
        <div class="console-segmented-pill" id="themeTogglePill">
          <button class="btn-segmented-pill active" data-theme="light" onclick="setThemeMode('light')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            <span>Açık</span>
          </button>
          <button class="btn-segmented-pill" data-theme="dark" onclick="setThemeMode('dark')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            <span>Koyu</span>
          </button>
        </div>
      </div>

      <!-- Vurgu Rengi Seçici (Accent Swatches) -->
      <div class="console-control-group">
        <div class="console-label-row">
          <span class="console-group-label">Vurgu Rengi</span>
        </div>
        <div class="console-color-swatches" id="colorSwatchesGroup">
          <button class="btn-color-swatch active" data-color="blue" style="--swatch-color:#0284c7;" onclick="setAccentColor('blue')" title="Okyanus Mavisi"></button>
          <button class="btn-color-swatch" data-color="emerald" style="--swatch-color:#059669;" onclick="setAccentColor('emerald')" title="Zümrüt Yeşili"></button>
          <button class="btn-color-swatch" data-color="indigo" style="--swatch-color:#6366f1;" onclick="setAccentColor('indigo')" title="İndigo Moru"></button>
          <button class="btn-color-swatch" data-color="amber" style="--swatch-color:#d97706;" onclick="setAccentColor('amber')" title="Kehribar Sarısı"></button>
          <button class="btn-color-swatch" data-color="rose" style="--swatch-color:#e11d48;" onclick="setAccentColor('rose')" title="Gül Kızılı"></button>
          <button class="btn-color-swatch" data-color="slate" style="--swatch-color:#475569;" onclick="setAccentColor('slate')" title="Grafit Nötr"></button>
        </div>
      </div>

      <div class="console-divider"></div>

      <!-- Hesap Makinesi Butonu -->
      <button class="console-action-row" onclick="toggleMiniCalculator()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>
        <span>Hesap Makinesi</span>
      </button>

      <!-- PDF / Yazdır Butonu (Lucide Printer SVG) -->
      <button class="console-action-row" onclick="openPdfDialog()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
        <span>PDF / Yazdır...</span>
      </button>
    </div>

    <!-- 3 Çizgili Ana Menü Butonu (Hamburger) -->
    <button class="btn-square-console" id="btnMasterConsole" onclick="toggleConsoleMenu()" title="Menü">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="4" y1="6" x2="20" y2="6"/>
        <line x1="4" y1="12" x2="20" y2="12"/>
        <line x1="4" y1="18" x2="20" y2="18"/>
      </svg>
    </button>
  </div>

  <!-- ========================================================= -->
  <!-- SÜRÜKLENEBİLİR MİNNACIK NAKİT NUMPAD (MICRO CALCULATOR)   -->
  <!-- ========================================================= -->
  <div class="mini-calc-widget" id="miniCalcWidget" style="display:none;">
    <div class="mini-calc-display-pill" id="miniCalcDisplayPill" title="Sürüklemek için basılı tutun">
      <span class="mini-calc-display-sub" id="calcSubDisplay"></span>
      <span class="mini-calc-display-main" id="calcMainDisplay">0</span>
    </div>
    <div class="mini-calc-numpad-body" id="miniCalcGrid"></div>
  </div>

  <!-- ========================================================= -->
  <!-- 4. DERS & KESİŞİM ÇEKMECESİ                              -->
  <!-- ========================================================= -->
  <div class="drawer-overlay" id="drawerOverlay" onclick="handleDrawerOverlayClick(event)">
    <div class="drawer-card" onclick="event.stopPropagation()">
      <div class="drawer-header">
        <h3>🎯 Ders & Soru Seçici</h3>
        <button class="btn-close-drawer" onclick="closeSubjectDrawer()">✕</button>
      </div>

      <!-- KÜLLİ ARAMA ALANI (Alan Seçiminden Hemen Sonra) -->
      <div class="drawer-search-section">
        <div class="drawer-search-bar">
          <span class="drawer-search-icon">🔍</span>
          <input type="text" id="drawerSearchInput" class="drawer-search-input" placeholder="Soru kökü veya şıklarda ara... (örn: üçgen, tanzimat, hücresel)" oninput="handleDrawerSearch(this.value)" autocomplete="off">
          <button id="drawerSearchClearBtn" class="drawer-search-clear" onclick="clearDrawerSearch()" title="Aramayı Temizle">✕</button>
        </div>
      </div>

      <!-- ARAMA SONUÇLARI GÖRÜNÜMÜ (Arama yapılırken açılır) -->
      <div id="drawerSearchResultsContainer" style="display:none; border-top:1px solid var(--paper-border); padding-top:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <div style="font-size:12px; font-weight:700; color:var(--paper-text-muted);" id="lblSearchResultsHeader">
            Arama Sonuçları:
          </div>
          <button class="cat-pill-btn" style="padding:4px 10px; font-size:11px;" id="btnLoadAllSearchResults" onclick="loadAllSearchResultsToBooklet()">
            Arama Testini Başlat →
          </button>
        </div>
        <div class="drawer-search-results-list" id="drawerSearchResultsList"></div>
      </div>

      <!-- NORMAL SEÇİM GÖRÜNÜMÜ (Arama yokken görünür) -->
      <div id="drawerNormalSelectorContainer">
        <!-- Branş Kartları -->
        <div class="drawer-subject-grid" id="drawerSubjectGrid"></div>

        <!-- Kademeler (Örn: MAT-1, MAT-2) -->
        <div style="border-top:1px solid var(--paper-border); padding-top:12px; margin-top:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="font-size:12px; font-weight:700; color:var(--paper-text-muted);">
              Ders Kademeleri (Çoklu Seçim):
            </div>
            <div id="courseModeToggleContainer" style="display:none; gap:4px; align-items:center;">
              <button class="btn-mode-toggle active" id="btnModeIntersection" onclick="setCourseFilterMode('AND')" title="Yalnızca seçili tüm derslerde ortak olan konular">
                ∩ Kesişim
              </button>
              <button class="btn-mode-toggle" id="btnModeUnion" onclick="setCourseFilterMode('OR')" title="Seçili derslerin tüm soruları ve konuları">
                ∪ Birleşim
              </button>
            </div>
          </div>
          <div class="drawer-courses-flow" id="drawerCoursesFlow"></div>
        </div>

        <!-- Konu Listesi -->
        <div style="border-top:1px solid var(--paper-border); padding-top:12px; margin-top:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div style="font-size:12px; font-weight:700; color:var(--paper-text-muted);" id="lblDrawerTopicHeader">
              Konu Başlıkları:
            </div>
            <button class="cat-pill-btn" style="padding:4px 10px; font-size:11px;" id="btnLoadAllTopics" onclick="loadAllTopicsToBooklet()">
              Tüm Soruları Yükle →
            </button>
          </div>
          <div class="drawer-topic-list" id="drawerTopicList"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================================= -->
  <!-- 5. AKILLI PDF İNDİRME SEÇİM DİYALOĞU                     -->
  <!-- ========================================================= -->
  <div class="pdf-dialog-overlay" id="pdfDialogOverlay" onclick="closePdfDialog()">
    <div class="pdf-dialog-card" onclick="event.stopPropagation()">
      <div class="pdf-dialog-title">🖨️ PDF & Yazdırma Seçenekleri</div>

      <div class="pdf-opt-group">
        <div style="font-size:12px; font-weight:800; color:var(--paper-text-muted);">Cevap Anahtarı Konumu:</div>
        
        <label class="pdf-radio-label">
          <input type="radio" name="pdfKeyLocation" value="bottom" checked>
          <span>Her sayfanın sonuna (Alt dipnot şeklinde)</span>
        </label>
        
        <label class="pdf-radio-label">
          <input type="radio" name="pdfKeyLocation" value="separate">
          <span>Ayrı tek bir sayfa olarak (Kitapçığın en sonuna)</span>
        </label>
        
        <label class="pdf-radio-label">
          <input type="radio" name="pdfKeyLocation" value="none">
          <span>Cevap anahtarı ekleme (Öğrenci sınav modu)</span>
        </label>
      </div>

      <div class="pdf-dialog-footer">
        <button class="cat-pill-btn" onclick="closePdfDialog()">İptal</button>
        <button class="btn-pdf-confirm" onclick="executePdfPrint()">
          Yazdır / PDF Al →
        </button>
      </div>
    </div>
  </div>

  <!-- ========================================================= -->
  <!-- 6. UYGULAMA MANTIĞI & MOTOR (HEDEFLİ VANILLA JAVASCRIPT)  -->
  <!-- ========================================================= -->
  <script>
    const allData = {json_data};

    // State
    let currentSubject = 'TDE';
    let selectedCourses = new Set();
    let courseFilterMode = 'AND';
    let selectedTopicKey = null;
    let bookletQuestions = [];
    let drawerSearchTerm = '';
    let activeSearchFilter = '';

    // Optical Bubble State & Undo Stack (Targeted DOM)
    let userMarkedChoices = {{}};     // qid -> 'A' | 'B' | 'C' | 'D'
    let undoHistoryStack = [];        // Undo snapshots
    let revealedAnswers = new Set();  // qids where eye is toggled
    let revealedHints = new Set();    // qids where pusula/hint is toggled

    // Layout & Zoom State
    let currentColumnCount = 2; // 1, 2, 3, 4
    let zoomLevelIndex = 1; // 0: 12px, 1: 13.5px, 2: 15px, 3: 16.5px
    const zoomScales = ['12px', '13.5px', '15px', '16.5px'];

    // 12 Subjects Registry (Kullanıcı İkonları ve Resmî MEB Kredileri)
    const SUBJECTS = [
      {{ id: 'COG', name: 'Coğrafya', icon: '🗺️', cat: 'sozel', kredi: 2 }},
      {{ id: 'TDE', name: 'Türk Dili ve Ed.', icon: '📚', cat: 'sozel', kredi: 5 }},
      {{ id: 'MAT', name: 'Matematik', icon: '📐', cat: 'sayisal', kredi: 6 }},
      {{ id: 'TAR', name: 'Tarih', icon: '🏺', cat: 'sozel', kredi: 2 }},
      {{ id: 'INK', name: 'T.C. İnkılap Tar.', icon: '📜', cat: 'sozel', kredi: 2 }},
      {{ id: 'KIM', name: 'Kimya', icon: '🧪', cat: 'sayisal', kredi: 2 }},
      {{ id: 'FIZ', name: 'Fizik', icon: '⚡', cat: 'sayisal', kredi: 2 }},
      {{ id: 'BIO', name: 'Biyoloji', icon: '🧬', cat: 'sayisal', kredi: 2 }},
      {{ id: 'FEL', name: 'Felsefe', icon: '🦉', cat: 'sozel', kredi: 2 }},
      {{ id: 'DIN', name: 'Din Kültürü', icon: '🧎', cat: 'kultur', kredi: 2 }},
      {{ id: 'SAG', name: 'Sağlık & Trafik', icon: '🚑', cat: 'kultur', kredi: 1 }},
      {{ id: 'ING', name: 'İngilizce', icon: '🌐', cat: 'kultur', kredi: 4 }}
    ];

    window.onload = function() {{
      loadSavedChoices();
      initTheme();
      initAccentColor();
      initApp();
      initDraggableCalculator();
      updatePrayerCountdown();
      setInterval(updatePrayerCountdown, 1000);
    }};

    function initApp() {{
      try {{
        const savedCols = localStorage.getItem('aol_column_count');
        if (savedCols) {{
          currentColumnCount = parseInt(savedCols, 10) || 2;
        }}
      }} catch (e) {{}}
      setColumnCount(currentColumnCount);

      renderDrawerSubjects();
      setSubject('TDE');
    }}

    function matchesSubject(q, subj) {{
      if (subj === 'COG') return q.ders.includes('COĞRAFYA');
      if (subj === 'TDE') return q.ders.includes('TÜRK DİLİ') || q.ders.includes('EDEBİYAT');
      if (subj === 'MAT') return q.ders.includes('MATEMATİK');
      if (subj === 'TAR') return q.ders.includes('TARİH') && !q.ders.includes('İNKILAP');
      if (subj === 'INK') return q.ders.includes('İNKILAP');
      if (subj === 'KIM') return q.ders.includes('KİMYA');
      if (subj === 'FIZ') return q.ders.includes('FİZİK');
      if (subj === 'BIO') return q.ders.includes('BİYOLOJİ');
      if (subj === 'FEL') return q.ders.includes('FELSEFE');
      if (subj === 'DIN') return q.ders.includes('DİN KÜLTÜRÜ');
      if (subj === 'SAG') return q.ders.includes('SAĞLIK');
      if (subj === 'ING') return q.ders.includes('İNGİLİZCE');
      return true;
    }}

    function getShortCourseName(c) {{
      return c.replace('TÜRK DİLİ VE EDEBİYATI', 'TDE')
              .replace('TÜRK DİLİ VE ED.', 'TDE')
              .replace('T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK', 'İNK')
              .replace('SAĞLIK BİLGİSİ VE TRAFİK KÜLTÜRÜ', 'SAĞ')
              .replace('DİN KÜLTÜRÜ VE AHLAK BİLGİSİ', 'DİN')
              .replace('İNGİLİZCE', 'İNG')
              .replace('COĞRAFYA', 'COĞ')
              .replace('MATEMATİK', 'MAT')
              .replace('TARİH', 'TAR')
              .replace('KİMYA', 'KİM')
              .replace('FİZİK', 'FİZ')
              .replace('BİYOLOJİ', 'BİY')
              .replace('FELSEFE', 'FEL')
              .replace(/\\s*[–-]\\s*/g, '-')
              .trim();
    }}

    /* Kompakt Kod Üretici (Örn: MAT-1, MAT-2, MAT-3 -> MAT123 | MAT-4 -> MAT4) */
    function getCondensedCourseCode(coursesSet, subjId) {{
      const list = Array.from(coursesSet);
      if (list.length === 0) return subjId;

      const prefixMap = {{
        'MAT': 'MAT',
        'TDE': 'TDE',
        'TAR': 'TAR',
        'COG': 'COĞ',
        'FIZ': 'FİZ',
        'KIM': 'KİM',
        'BIO': 'BİY',
        'FEL': 'FEL',
        'DIN': 'DİN',
        'ING': 'İNG',
        'INK': 'İNK',
        'SAG': 'SAĞ'
      }};

      const prefix = prefixMap[subjId] || subjId;
      
      const digits = list.map(c => {{
        const m = c.match(/\\d+$/);
        return m ? parseInt(m[0], 10) : 0;
      }}).filter(n => n > 0).sort((a, b) => a - b);

      if (digits.length > 0) {{
        return prefix + digits.join('');
      }}
      return prefix;
    }}

    /* Türkçe Küçük Harf ve Arama Normalizasyonu */
    function trNormalize(text) {{
      if (!text) return '';
      return text
        .toString()
        .replace(/İ/g, 'i')
        .replace(/I/g, 'ı')
        .replace(/Ğ/g, 'ğ')
        .replace(/Ü/g, 'ü')
        .replace(/Ş/g, 'ş')
        .replace(/Ö/g, 'ö')
        .replace(/Ç/g, 'ç')
        .toLowerCase()
        .trim();
    }}

    function questionMatchesSearch(q, term) {{
      if (!term) return true;
      const nTerm = trNormalize(term);
      if (!nTerm) return true;

      if (trNormalize(q.alt_konu || '').includes(nTerm)) return true;
      if (trNormalize(q.ana_konu || '').includes(nTerm)) return true;
      if (trNormalize(q.soru || '').includes(nTerm)) return true;
      if (q.secenekler) {{
        for (let opt in q.secenekler) {{
          if (trNormalize(q.secenekler[opt] || '').includes(nTerm)) return true;
        }}
      }}
      return false;
    }}

    function setCourseFilterMode(mode) {{
      courseFilterMode = mode;
      const btnInter = document.getElementById('btnModeIntersection');
      const btnUnion = document.getElementById('btnModeUnion');
      if (btnInter && btnUnion) {{
        if (mode === 'AND') {{
          btnInter.classList.add('active');
          btnUnion.classList.remove('active');
        }} else {{
          btnInter.classList.remove('active');
          btnUnion.classList.add('active');
        }}
      }}
      renderDrawerTopics();
    }}

    function updateCourseModeToggleVisibility() {{
      const container = document.getElementById('courseModeToggleContainer');
      if (container) {{
        container.style.display = (selectedCourses.size >= 2) ? 'flex' : 'none';
      }}
    }}

    let currentSearchResults = [];

    function highlightKeyword(text, term) {{
      if (!text || !term) return escapeHtml(text || '');
      const str = String(text);
      const nText = trNormalize(str);
      const nTerm = trNormalize(term);
      const idx = nText.indexOf(nTerm);
      if (idx === -1) return escapeHtml(str);
      const before = str.substring(0, idx);
      const match = str.substring(idx, idx + term.length);
      const after = str.substring(idx + term.length);
      return escapeHtml(before) + '<mark class="search-highlight">' + escapeHtml(match) + '</mark>' + escapeHtml(after);
    }}

    function handleDrawerSearch(val) {{
      drawerSearchTerm = val.trim();
      const clearBtn = document.getElementById('drawerSearchClearBtn');
      if (clearBtn) clearBtn.style.display = drawerSearchTerm ? 'flex' : 'none';

      const resultsContainer = document.getElementById('drawerSearchResultsContainer');
      const normalContainer = document.getElementById('drawerNormalSelectorContainer');

      if (drawerSearchTerm) {{
        if (resultsContainer) resultsContainer.style.display = 'block';
        if (normalContainer) normalContainer.style.display = 'none';
        renderSearchResults();
      }} else {{
        if (resultsContainer) resultsContainer.style.display = 'none';
        if (normalContainer) normalContainer.style.display = 'block';
        renderDrawerTopics();
      }}
    }}

    function clearDrawerSearch() {{
      drawerSearchTerm = '';
      const input = document.getElementById('drawerSearchInput');
      if (input) {{
        input.value = '';
        input.focus();
      }}
      const clearBtn = document.getElementById('drawerSearchClearBtn');
      if (clearBtn) clearBtn.style.display = 'none';

      const resultsContainer = document.getElementById('drawerSearchResultsContainer');
      const normalContainer = document.getElementById('drawerNormalSelectorContainer');
      if (resultsContainer) resultsContainer.style.display = 'none';
      if (normalContainer) normalContainer.style.display = 'block';

      renderDrawerTopics();
    }}

    function renderSearchResults() {{
      const listEl = document.getElementById('drawerSearchResultsList');
      const headerEl = document.getElementById('lblSearchResultsHeader');
      const btnAll = document.getElementById('btnLoadAllSearchResults');
      if (!listEl) return;

      const nTerm = trNormalize(drawerSearchTerm);
      const matched = [];

      allData.forEach(q => {{
        // Kişi bir ders seçmişse sadece o derste ve seçili kademelerde ara, seçmemişse külli ara
        if (currentSubject) {{
          if (!matchesSubject(q, currentSubject)) return;
          if (selectedCourses.size > 0 && !selectedCourses.has(q.ders)) return;
        }}

        const stemNorm = trNormalize(q.soru || '');
        const topicNorm = trNormalize(q.alt_konu || '');
        let matchedInStem = stemNorm.includes(nTerm) || topicNorm.includes(nTerm);
        let matchedOption = null;

        if (q.secenekler) {{
          for (let optKey in q.secenekler) {{
            const optVal = q.secenekler[optKey] || '';
            if (trNormalize(optVal).includes(nTerm)) {{
              matchedOption = {{ key: optKey, text: optVal }};
              break;
            }}
          }}
        }}

        if (matchedInStem || matchedOption) {{
          matched.push({{ q: q, matchedOption: matchedOption }});
        }}
      }});

      currentSearchResults = matched;

      let scopeDesc = 'Tüm Branşlar';
      if (currentSubject) {{
        const sObj = SUBJECTS.find(s => s.id === currentSubject);
        scopeDesc = sObj ? sObj.name : currentSubject;
      }}

      if (headerEl) {{
        headerEl.innerHTML = `Arama: <strong>"${{escapeHtml(drawerSearchTerm)}}"</strong> <span style="font-size:11px; opacity:0.8; font-weight:normal;">[${{scopeDesc}}]</span> (${{matched.length}} Soru)`;
      }}
      if (btnAll) {{
        btnAll.textContent = `Arama Testini Başlat (${{matched.length}} Soru) →`;
      }}

      if (matched.length === 0) {{
        listEl.innerHTML = `
          <div style="padding:22px; text-align:center; color:var(--paper-text-muted); font-size:12.5px;">
            <strong>"${{escapeHtml(drawerSearchTerm)}}"</strong> ile eşleşen soru veya şık bulunamadı.<br>
            <span style="font-size:11px; opacity:0.8;">Farklı bir arama terimi deneyebilir veya ders seçimini değiştirebilirsiniz.</span>
          </div>
        `;
        return;
      }}

      let html = '';
      const displaySlice = matched.slice(0, 50);
      displaySlice.forEach(({{ q, matchedOption }}) => {{
        const snippet = (q.soru || '').replace(/\\s+/g, ' ').trim();
        const shortSnippet = snippet.length > 130 ? snippet.substring(0, 128) + '...' : snippet;
        
        let optHtml = '';
        if (matchedOption) {{
          optHtml = `
            <div class="result-matched-choice">
              💡 Şıkta Geçiyor: <strong>${{matchedOption.key}})</strong> ${{highlightKeyword(matchedOption.text, drawerSearchTerm)}}
            </div>
          `;
        }}

        const ak = q.ana_konu || '';
        const sub = q.alt_konu || '';
        const topicLabel = (ak && sub && ak !== sub)
          ? `<span class="topic-ak">${{escapeHtml(ak)}}</span> <span class="topic-slash">/</span> <span class="topic-sub">${{escapeHtml(sub)}}</span>`
          : `<span class="topic-sub">${{escapeHtml(sub || ak || 'Genel')}}</span>`;

        const soonPill = q.sekilli ? '<span class="q-soon-badge" style="font-size:9.5px; padding:1px 6px; margin-left:2px;">🔒 Yakında</span>' : '';

        html += `
          <div class="drawer-search-result-card" onclick="loadSingleSearchQuestion(${{q.id}})">
            <div class="result-card-header">
              <span class="result-badge-course">${{escapeHtml(getShortCourseName(q.ders))}}</span>
              ${{soonPill}}
              <span class="result-badge-topic">${{topicLabel}}</span>
              <span class="result-badge-point">+${{q.puan || 0}} Puan</span>
            </div>
            <div class="result-card-stem">
              ${{highlightKeyword(shortSnippet, drawerSearchTerm)}}
            </div>
            ${{optHtml}}
          </div>
        `;
      }});

      if (matched.length > 50) {{
        html += `<div style="text-align:center; padding:10px; font-size:11.5px; color:var(--paper-text-muted); font-weight:600;">... ve ${{matched.length - 50}} soru daha. Tümünü kitapçığa aktarmak için "Arama Testini Başlat" butonuna tıklayınız.</div>`;
      }}

      listEl.innerHTML = html;
    }}

    function loadAllSearchResultsToBooklet() {{
      if (currentSearchResults.length === 0) return;
      bookletQuestions = currentSearchResults.map(m => m.q);
      activeSearchFilter = drawerSearchTerm;
      closeSubjectDrawer();
      updateTopBadge();
      renderBookletPages();
    }}

    function loadSingleSearchQuestion(qid) {{
      const targetQ = allData.find(q => q.id === qid);
      if (!targetQ) return;
      
      bookletQuestions = currentSearchResults.map(m => m.q);
      if (bookletQuestions.length === 0) {{
        bookletQuestions = [targetQ];
      }}
      activeSearchFilter = drawerSearchTerm;
      closeSubjectDrawer();
      updateTopBadge();
      renderBookletPages();

      setTimeout(() => {{
        const card = document.getElementById(`qCard_${{qid}}`);
        if (card) {{
          card.scrollIntoView({{ behavior: 'smooth', block: 'center' }});
          card.style.outline = '3px solid var(--brand-accent)';
          setTimeout(() => {{ card.style.outline = 'none'; }}, 2500);
        }}
      }}, 180);
    }}

    function setSubject(subj) {{
      currentSubject = subj;
      selectedTopicKey = null;
      activeSearchFilter = '';
      drawerSearchTerm = '';
      const input = document.getElementById('drawerSearchInput');
      if (input) input.value = '';
      const clearBtn = document.getElementById('drawerSearchClearBtn');
      if (clearBtn) clearBtn.style.display = 'none';

      const resultsContainer = document.getElementById('drawerSearchResultsContainer');
      const normalContainer = document.getElementById('drawerNormalSelectorContainer');
      if (resultsContainer) resultsContainer.style.display = 'none';
      if (normalContainer) normalContainer.style.display = 'block';

      selectedCourses.clear();

      const courses = Array.from(new Set(allData.filter(q => matchesSubject(q, subj)).map(q => q.ders)));
      courses.sort((a, b) => {{
        const numA = parseInt((a.match(/\\d+$/) || [0])[0], 10);
        const numB = parseInt((b.match(/\\d+$/) || [0])[0], 10);
        return numA - numB;
      }});
      if (courses.length >= 2) {{
        selectedCourses.add(courses[0]);
        selectedCourses.add(courses[1]);
      }} else {{
        courses.forEach(c => selectedCourses.add(c));
      }}

      updateCourseModeToggleVisibility();
      renderDrawerCourses();
      renderDrawerTopics();
      updateBookletQuestions();
    }}

    function renderDrawerSubjects() {{
      const grid = document.getElementById('drawerSubjectGrid');
      let html = '';
      SUBJECTS.forEach(s => {{
        const count = allData.filter(q => matchesSubject(q, s.id)).length;
        html += `
          <div class="drawer-subj-card ${{s.id === currentSubject ? 'active' : ''}}" onclick="switchSubjectFromDrawer('${{s.id}}')">
            <span class="drawer-subj-icon">${{s.icon}}</span>
            <div>
              <div class="drawer-subj-name">${{s.name}}</div>
              <div class="drawer-subj-count">${{count}} Soru • <strong style="color:var(--brand-accent);">${{s.kredi}} Kredi</strong></div>
            </div>
          </div>
        `;
      }});
      grid.innerHTML = html;
    }}

    function switchSubjectFromDrawer(subj) {{
      if (currentSubject === subj) {{
        currentSubject = null;
        selectedCourses.clear();
        selectedTopicKey = null;
      }} else {{
        setSubject(subj);
      }}
      renderDrawerSubjects();
      renderDrawerCourses();
      renderDrawerTopics();
      if (drawerSearchTerm) {{
        renderSearchResults();
      }}
    }}

    function renderDrawerCourses() {{
      const container = document.getElementById('drawerCoursesFlow');
      if (!currentSubject) {{
        container.innerHTML = '<div style="padding:8px 0; font-size:11.5px; color:var(--paper-text-muted);">Ders seçilmedi (Arama tüm branşlarda külli geçerli).</div>';
        updateCourseModeToggleVisibility();
        return;
      }}
      const courses = Array.from(new Set(allData.filter(q => matchesSubject(q, currentSubject)).map(q => q.ders)));
      courses.sort((a, b) => {{
        const numA = parseInt((a.match(/\\d+$/) || [0])[0], 10);
        const numB = parseInt((b.match(/\\d+$/) || [0])[0], 10);
        return numA - numB;
      }});

      let html = '';
      courses.forEach(c => {{
        const isSel = selectedCourses.has(c);
        const short = getShortCourseName(c);
        html += `
          <button class="btn-course-toggle ${{isSel ? 'selected' : ''}}" onclick="toggleCourseInDrawer('${{escapeJs(c)}}')">
            <span>${{isSel ? '✓' : ''}}</span>
            <span>${{escapeHtml(short)}}</span>
          </button>
        `;
      }});
      container.innerHTML = html;
      updateCourseModeToggleVisibility();
    }}

    function toggleCourseInDrawer(c) {{
      if (selectedCourses.has(c)) {{
        if (selectedCourses.size === 1) return; // En az 1 ders daima seçili kalmalı
        selectedCourses.delete(c);
      }} else {{
        selectedCourses.add(c);
      }}
      selectedTopicKey = null; // Kademe değiştiğinde alt konu filtresi sıfırlanır
      updateCourseModeToggleVisibility();
      renderDrawerCourses();
      renderDrawerTopics();
      updateBookletQuestions();
    }}

    function getAggregatedTopics() {{
      if (!currentSubject) return [];
      const map = {{}};
      allData.forEach(q => {{
        if (!matchesSubject(q, currentSubject)) return;
        if (!selectedCourses.has(q.ders)) return;

        const sub = q.alt_konu || 'Genel';
        const ak = q.ana_konu || 'Genel';
        const key = (ak && sub && ak !== 'Genel' && sub !== 'Genel') ? `${{ak}} / ${{sub}}` : (sub !== 'Genel' ? sub : ak);
        if (!map[key]) {{
          map[key] = {{ key: key, alt_konu: sub, ana_konu: ak, count: 0, courses: {{}} }};
        }}
        map[key].count++;
        map[key].courses[q.ders] = (map[key].courses[q.ders] || 0) + 1;
      }});

      let topics = Object.values(map);

      // Çoklu ders seçilmişse ve AND (kesişim) modu aktifse kesişim uygula
      if (courseFilterMode === 'AND' && selectedCourses.size > 1) {{
        const strictTopics = topics.filter(t => {{
          const setC = new Set(Object.keys(t.courses));
          for (let req of selectedCourses) {{
            if (!setC.has(req)) return false;
          }}
          return true;
        }});

        if (strictTopics.length > 0) {{
          topics = strictTopics;
        }} else {{
          topics = topics.filter(t => Object.keys(t.courses).length >= 2);
        }}
      }}

      topics.sort((a, b) => b.count - a.count);
      return topics;
    }}

    function renderDrawerTopics() {{
      const container = document.getElementById('drawerTopicList');
      const headerLbl = document.getElementById('lblDrawerTopicHeader');
      const allBtn = document.getElementById('btnLoadAllTopics');

      if (!currentSubject) {{
        if (headerLbl) headerLbl.textContent = 'Konular:';
        if (allBtn) {{
          allBtn.textContent = 'Bir Branş Seçin →';
          allBtn.onclick = null;
          allBtn.style.opacity = '0.5';
        }}
        container.innerHTML = '<div style="padding:14px; text-align:center; color:var(--paper-text-muted); font-size:12px;">Ders seçilmedi. Tüm branşlarda arama yapabilir veya yukarıdaki branş kartlarından birini seçebilirsiniz.</div>';
        return;
      }}
      if (allBtn) allBtn.style.opacity = '1';

      const topics = getAggregatedTopics();
      const totalCount = topics.reduce((acc, t) => acc + t.count, 0);

      const isSingleCourse = (selectedCourses.size === 1);
      const courseCode = getCondensedCourseCode(selectedCourses, currentSubject);
      const modeStr = (courseFilterMode === 'AND' && !isSingleCourse) ? ' (Ortak ∩)' : '';

      if (headerLbl) {{
        headerLbl.textContent = isSingleCourse 
          ? `${{courseCode}} Konu Başlıkları:` 
          : `Konular (${{courseCode}}${{modeStr}}):`;
      }}

      if (allBtn) {{
        allBtn.textContent = isSingleCourse 
          ? `Tüm ${{courseCode}} Soruları (${{totalCount}}s) →` 
          : `Tüm ${{courseCode}} Sorularını Yükle (${{totalCount}}s) →`;
        allBtn.onclick = function() {{ loadAllTopicsToBooklet(); }};
      }}

      if (topics.length === 0) {{
        container.innerHTML = '<div style="padding:14px; text-align:center; color:var(--paper-text-muted); font-size:12px;">Seçili kriterde konu bulunamadı.</div>';
        return;
      }}

      let html = '';
      topics.forEach((t) => {{
        const isFull = (selectedCourses.size > 1 && Object.keys(t.courses).length === selectedCourses.size);
        const star = (isFull && !isSingleCourse) ? '⭐ ' : '';
        const isSelected = (selectedTopicKey === t.key);
        
        let courseBreakdown = '';
        if (selectedCourses.size > 1 && Object.keys(t.courses).length > 0) {{
          const bParts = Object.entries(t.courses).map(([c, cnt]) => `${{getShortCourseName(c)}}: ${{cnt}}`);
          courseBreakdown = ` <span style="font-size:10px; opacity:0.75; font-weight:normal;">(${{bParts.join(', ')}})</span>`;
        }}

        let topicLabelHtml = '';
        if (t.ana_konu && t.alt_konu && t.ana_konu !== t.alt_konu) {{
          topicLabelHtml = `<span class="topic-ak">${{escapeHtml(t.ana_konu)}}</span> <span class="topic-slash">/</span> <span class="topic-sub">${{escapeHtml(t.alt_konu)}}</span>`;
        }} else {{
          topicLabelHtml = `<span class="topic-sub">${{escapeHtml(t.alt_konu || t.ana_konu)}}</span>`;
        }}

        html += `
          <div class="drawer-topic-item ${{isSelected ? 'selected' : ''}}" onclick="selectTopicFromDrawer('${{escapeJs(t.key)}}')">
            <span class="drawer-topic-name">${{star}}${{topicLabelHtml}}${{courseBreakdown}}</span>
            <span class="drawer-topic-badge">${{t.count}} Soru</span>
          </div>
        `;
      }});
      container.innerHTML = html;
    }}

    function selectTopicFromDrawer(topicKey) {{
      selectedTopicKey = topicKey;
      activeSearchFilter = '';
      closeSubjectDrawer();
      updateBookletQuestions();
    }}

    function loadAllTopicsToBooklet() {{
      selectedTopicKey = null;
      activeSearchFilter = '';
      drawerSearchTerm = '';
      const input = document.getElementById('drawerSearchInput');
      if (input) input.value = '';
      const clearBtn = document.getElementById('drawerSearchClearBtn');
      if (clearBtn) clearBtn.style.display = 'none';

      const resultsContainer = document.getElementById('drawerSearchResultsContainer');
      const normalContainer = document.getElementById('drawerNormalSelectorContainer');
      if (resultsContainer) resultsContainer.style.display = 'none';
      if (normalContainer) normalContainer.style.display = 'block';

      closeSubjectDrawer();
      updateBookletQuestions();
    }}

    function updateBookletQuestions() {{
      if (!currentSubject) {{
        if (activeSearchFilter) {{
          bookletQuestions = allData.filter(q => questionMatchesSearch(q, activeSearchFilter));
        }}
        updateTopBadge();
        renderBookletPages();
        return;
      }}

      const validTopicKeys = new Set(getAggregatedTopics().map(t => t.key));

      bookletQuestions = allData.filter(q => {{
        if (!matchesSubject(q, currentSubject)) return false;
        if (!selectedCourses.has(q.ders)) return false;
        const qKey = (q.ana_konu && q.alt_konu && q.ana_konu !== 'Genel' && q.alt_konu !== 'Genel')
          ? `${{q.ana_konu}} / ${{q.alt_konu}}`
          : (q.alt_konu || q.ana_konu || 'Genel');
        if (!validTopicKeys.has(qKey)) return false;
        if (selectedTopicKey && qKey !== selectedTopicKey) return false;
        if (activeSearchFilter && !questionMatchesSearch(q, activeSearchFilter)) return false;
        return true;
      }});

      updateTopBadge();
      renderBookletPages();
    }}

    /* Üst-Orta Başlık Hapı Güncellemesi (Örn: MAT123 / Mutlak Değer / 48s) */
    function updateTopBadge() {{
      let badgeEmoji = '📚';
      let codeStr = 'TÜM';

      if (currentSubject) {{
        const subjDef = SUBJECTS.find(s => s.id === currentSubject) || SUBJECTS[1];
        badgeEmoji = subjDef.icon;
        codeStr = getCondensedCourseCode(selectedCourses, currentSubject);
      }} else {{
        badgeEmoji = '🌐';
        codeStr = 'TÜM BRANŞLAR';
      }}

      document.getElementById('badgeEmoji').textContent = badgeEmoji;
      
      let topicStr = 'Tüm Konular';
      if (activeSearchFilter && selectedTopicKey) {{
        const sSub = selectedTopicKey.length > 20 ? `${{selectedTopicKey.substring(0, 18)}}...` : selectedTopicKey;
        topicStr = `${{sSub}} ("${{activeSearchFilter}}")`;
      }} else if (activeSearchFilter) {{
        topicStr = `🔍 "${{activeSearchFilter}}"`;
      }} else if (selectedTopicKey) {{
        topicStr = selectedTopicKey.length > 28 
          ? `${{selectedTopicKey.substring(0, 26)}}...` 
          : selectedTopicKey;
      }}

      const countStr = `${{bookletQuestions.length}}s`;
      const totalPoints = bookletQuestions.reduce((sum, q) => sum + (q.puan || 0), 0);
      const pointsFormatted = Number(totalPoints.toFixed(1));

      const badgeBtn = document.getElementById('topCenterBadge');
      if (badgeBtn) {{
        badgeBtn.title = `Ders ve Konu Değiştir • Toplam ${{bookletQuestions.length}} Soru (${{pointsFormatted}} Puan)`;
      }}

      document.getElementById('badgeMainText').textContent = `${{codeStr}} / ${{topicStr}} / ${{countStr}}`;
    }}

    /* ========================================================= */
    /* EZAN VAKTİ HESAPLAMA MOTORU (DİYANET & TÜRKİYE İLE EŞGÜDÜMLÜ) */
    /* ========================================================= */
    function getPrayerTimes(date) {{
      const lat = 41.0082 * Math.PI / 180; // Türkiye referans enlemi
      const lon = 28.9784;                 // Türkiye referans boylamı
      const now = date || new Date();
      const start = new Date(now.getFullYear(), 0, 0);
      const diff = now - start;
      const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
      const B = 2 * Math.PI * (dayOfYear - 81) / 365;
      const EoT = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
      const decl = 23.45 * Math.sin(B) * Math.PI / 180;
      const timeZone = 3; // Türkiye UTC+3
      const noon = 12 + timeZone - (lon / 15) - (EoT / 60);

      function hourAngle(alt) {{
        const cosHA = (Math.sin(alt * Math.PI / 180) - Math.sin(lat) * Math.sin(decl)) / (Math.cos(lat) * Math.cos(decl));
        if (cosHA > 1) return 0;
        if (cosHA < -1) return Math.PI;
        return Math.acos(cosHA) * 180 / Math.PI / 15;
      }}

      const imsakHA = hourAngle(-18);
      const sunriseHA = hourAngle(-0.833);
      const noonAlt = (Math.PI / 2) - Math.abs(lat - decl);
      const asrAlt = Math.atan(1 / (1 + Math.tan(Math.PI / 2 - noonAlt))) * 180 / Math.PI;
      const asrHA = hourAngle(asrAlt);
      const ishaHA = hourAngle(-17);

      return {{
        'İmsak': noon - imsakHA,
        'Güneş': noon - sunriseHA,
        'Öğle': noon,
        'İkindi': noon + asrHA,
        'Akşam': noon + sunriseHA,
        'Yatsı': noon + ishaHA
      }};
    }}

    function updatePrayerCountdown() {{
      const now = new Date();
      const currentHours = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
      const times = getPrayerTimes(now);
      const prayers = [
        {{ name: 'İmsak', time: times['İmsak'] }},
        {{ name: 'Güneş', time: times['Güneş'] }},
        {{ name: 'Öğle', time: times['Öğle'] }},
        {{ name: 'İkindi', time: times['İkindi'] }},
        {{ name: 'Akşam', time: times['Akşam'] }},
        {{ name: 'Yatsı', time: times['Yatsı'] }}
      ];

      let next = prayers.find(p => p.time > currentHours);
      let diffHours = 0;
      if (next) {{
        diffHours = next.time - currentHours;
      }} else {{
        next = prayers[0];
        diffHours = (24 - currentHours) + next.time;
      }}

      const totalSecs = Math.floor(diffHours * 3600);
      const h = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
      const m = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
      const s = String(totalSecs % 60).padStart(2, '0');

      const textEl = document.getElementById('prayerDisplayText');
      if (textEl) {{
        textEl.textContent = `${{h}}:${{m}}:${{s}}`;
      }}
    }}

    /* ========================================================= */
    /* SAYFALANDIRILMIŞ KİTAPÇIK OLUŞTURUCU (PAGINATION)         */
    /* ========================================================= */
    function renderBookletPages() {{
      const container = document.getElementById('bookletPagesContainer');
      if (bookletQuestions.length === 0) {{
        container.innerHTML = `
          <div style="background:var(--paper-bg); border:1px dashed var(--paper-border); padding:60px 20px; text-align:center; border-radius:12px; color:var(--paper-text-muted);">
            Seçilen kriterlere uygun soru bulunamadı. Lütfen üstteki başlığa tıklayarak başka kademe veya konu seçin.
          </div>
        `;
        return;
      }}

      const QUESTIONS_PER_PAGE = 5;
      const totalPages = Math.ceil(bookletQuestions.length / QUESTIONS_PER_PAGE);
      const columnClass = `cols-${{currentColumnCount}}`;
      const badgeCode = getCondensedCourseCode(selectedCourses, currentSubject);

      let fullHtml = '';

      for (let p = 0; p < totalPages; p++) {{
        const pageNum = p + 1;
        const pageSlice = bookletQuestions.slice(p * QUESTIONS_PER_PAGE, (p + 1) * QUESTIONS_PER_PAGE);

        let questionsHtml = '';
        let miniKeyHtml = '';

        pageSlice.forEach((q, idxInPage) => {{
          const globalIdx = (p * QUESTIONS_PER_PAGE) + idxInPage + 1;
          const userMark = userMarkedChoices[q.id];
          const isRevealed = revealedAnswers.has(q.id);

          const shortCourse = getShortCourseName(q.ders);
          const isPassive = !!q.sekilli;
          const questionClass = isPassive ? 'booklet-question is-passive-question' : 'booklet-question';
          const soonBadge = isPassive ? '<span class="q-soon-badge">🔒 Yakında</span>' : '';
          const soonBanner = isPassive ? `
            <div class="q-soon-banner">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>Bu soru şekil / görsel içerdiğinden geçici olarak çözüme kapatılmıştır (Yakında).</span>
            </div>
          ` : '';

          // Monokrom Lucide SVG Göz İkonu
          const lucideEyeSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>`;
          // Monokrom Lucide SVG Pusula (İpucu) İkonu
          const lucideCompassSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`;

          // Seçenekler
          let optHtml = '';
          ['A', 'B', 'C', 'D'].forEach(letter => {{
            const optText = q.secenekler[letter] || '';
            const isMarked = (userMark === letter);
            const isCorrect = (q.dogru_cevap === letter);
            
            let rowClass = 'optical-choice-row';
            if (isMarked) rowClass += ' marked';
            if (isRevealed && isCorrect) rowClass += ' revealed-correct';
            
            const clickHandler = isPassive ? '' : `onclick="handleSelectOpticalBubble(${{q.id}}, '${{letter}}')"`;

            optHtml += `
              <div class="${{rowClass}}" id="opt_${{q.id}}_${{letter}}" ${{clickHandler}}>
                <div class="optical-bubble">${{letter}}</div>
                <div class="choice-text-content">${{escapeHtml(optText)}}</div>
              </div>
            `;
          }});

          const eyeClass = isRevealed ? 'revealed' : '';
          const bannerDisplay = isRevealed ? 'flex' : 'none';

          const eyeBtnHtml = isPassive ? '' : `
            <button class="btn-companion-icon ${{eyeClass}}" id="btnEye_${{q.id}}" title="Cevabı Göster / Gizle" onclick="toggleSingleAnswerReveal(${{q.id}})">
              ${{lucideEyeSvg}}
            </button>
          `;

          const isHintRevealed = revealedHints.has(q.id);
          const compassClass = isHintRevealed ? 'hint-revealed' : '';
          const hintDisplay = isHintRevealed ? 'flex' : 'none';

          const topicLabel = (q.ana_konu && q.alt_konu && q.ana_konu !== q.alt_konu)
            ? `${{escapeHtml(q.ana_konu)}} <span class="topic-slash">/</span> ${{escapeHtml(q.alt_konu)}}`
            : escapeHtml(q.alt_konu || q.ana_konu || '');

          const hintHtml = (q.ipucu && !isPassive) ? `
            <div class="single-hint-banner" id="hint_${{q.id}}" style="display:${{hintDisplay}};">
              <div class="hint-header">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
                <span>PUSULA • İPUCU</span>
              </div>
              <div class="hint-content">${{escapeHtml(q.ipucu)}}</div>
            </div>
          ` : '';

          questionsHtml += `
            <div class="${{questionClass}}" id="bq_${{q.id}}">
              <div class="q-top-row">
                <span class="q-number">${{globalIdx}}.</span>
                ${{soonBadge}}
                <span class="q-point-pill" title="Ders Kredisi: ${{q.kredi}} | Bir Sınavdaki Soru: ${{q.sinav_soru_sayisi}}">${{q.puan.toFixed(2)}} Puan</span>
                ${{eyeBtnHtml}}
                <!-- Pusula ikonu geçici olarak gizlendi -->
                <button class="btn-companion-icon ${{compassClass}}" id="btnCompass_${{q.id}}" title="Pusula / İpucu Göster" onclick="toggleSingleHint(${{q.id}})" style="display:none;">
                  ${{lucideCompassSvg}}
                </button>
                <span class="q-source-tag">${{escapeHtml(shortCourse)}} • ${{q.yil.substring(2,4)}}-D${{q.donem}}</span>
              </div>

              ${{soonBanner}}

              <div class="q-stem-text">
                ${{escapeHtml(q.soru)}}
              </div>

              <div class="q-optical-options">
                ${{optHtml}}
              </div>

              ${{hintHtml}}

              <div class="single-answer-banner" id="banner_${{q.id}}" style="display:${{bannerDisplay}};">
                <span>Doğru Cevap: <strong style="color:var(--success-accent); font-size:13px;">${{q.dogru_cevap}}</strong> <span style="margin-left:6px; font-weight:700; color:var(--brand-accent); font-size:11px;">(+${{q.puan.toFixed(2)}} Puan)</span></span>
                <span style="opacity:0.85; font-size:10.5px;">${{topicLabel}}</span>
              </div>
            </div>
          `;

          if (isPassive) {{
            miniKeyHtml += `
              <div class="mini-key-cell" style="opacity:0.55;" title="Şekilli Soru - Yakında">
                <span>${{globalIdx}}.</span> <strong style="font-size:9.5px; color:#b45309;">YAKINDA</strong>
              </div>
            `;
          }} else {{
            miniKeyHtml += `
              <div class="mini-key-cell">
                <span>${{globalIdx}}.</span> <strong>${{q.dogru_cevap}}</strong>
              </div>
            `;
          }}
        }});

        // Sayfa Altı Lucide Göz Butonu (Monokrom)
        const lucidePageEyeSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>`;

        fullHtml += `
          <div class="booklet-page" id="page_${{pageNum}}">
            <div class="page-header-band">
              <div class="page-header-left">
                <span class="institution-name">T.C. MİLLÎ EĞİTİM BAKANLIĞI • AÇIK ÖĞRETİM LİSESİ</span>
                <span class="exam-name-title">${{escapeHtml(selectedTopicKey || (selectedCourses.size > 1 ? 'ORTAK KAZANIMLAR KESİŞİM TESTİ' : 'DÖNEM ÇIKMIŞ SINAV SORULARI'))}}</span>
              </div>
              <div class="page-header-right">
                <span class="page-badge-code">${{badgeCode}} • SAYFA ${{pageNum}}</span>
              </div>
            </div>

            <div class="page-columns-body ${{columnClass}}">
              ${{questionsHtml}}
            </div>

            <div>
              <div class="page-bottom-answer-strip" id="pageBottomKey_${{pageNum}}">
                <span style="font-weight:800; font-size:10px; margin-right:4px;">🔑 SAYFA ${{pageNum}} CEVAPLARI:</span>
                ${{miniKeyHtml}}
              </div>
              <div class="page-footer-band">
                <button class="btn-page-key-toggle" onclick="togglePageKey(${{pageNum}})" title="Sayfa Cevaplarını Göster / Gizle">
                  ${{lucidePageEyeSvg}}
                  <span id="lblPageKey_${{pageNum}}">Cevaplar</span>
                </button>
                <span class="page-num-pill">— SAYFA ${{pageNum}} / ${{totalPages}} —</span>
                <span>AÖL KESİŞİM REHBERİ</span>
              </div>
            </div>
          </div>
        `;
      }}

      container.innerHTML = fullHtml;
    }}

    /* ========================================================= */
    /* HEDEFLİ DOM GÜNCELLEMESİ (SIFIR GECİKME, 0MS RE-RENDER)  */
    /* ========================================================= */
    function handleSelectOpticalBubble(qid, letter) {{
      const targetQ = allData.find(x => x.id === qid);
      if (targetQ && targetQ.sekilli) return; // Görselli/şekilli soru pasif, tıklanamaz

      const current = userMarkedChoices[qid];

      undoHistoryStack.push({{ ...userMarkedChoices }});
      if (undoHistoryStack.length > 20) undoHistoryStack.shift();
      document.getElementById('btnUndoClear').style.opacity = '1';

      if (current === letter) {{
        delete userMarkedChoices[qid];
      }} else {{
        userMarkedChoices[qid] = letter;
      }}

      saveChoicesToStorage();

      ['A', 'B', 'C', 'D'].forEach(l => {{
        const row = document.getElementById(`opt_${{qid}}_${{l}}`);
        if (row) {{
          row.classList.toggle('marked', userMarkedChoices[qid] === l);
        }}
      }});
    }}

    function clearAllMarks() {{
      if (Object.keys(userMarkedChoices).length === 0) return;

      undoHistoryStack.push({{ ...userMarkedChoices }});
      userMarkedChoices = {{}};
      saveChoicesToStorage();

      document.querySelectorAll('.optical-choice-row.marked').forEach(el => {{
        el.classList.remove('marked');
      }});

      const undoBtn = document.getElementById('btnUndoClear');
      if (undoBtn) undoBtn.style.opacity = '1';
    }}

    function undoClearMarks() {{
      if (undoHistoryStack.length === 0) return;
      userMarkedChoices = undoHistoryStack.pop();
      saveChoicesToStorage();

      document.querySelectorAll('.optical-choice-row').forEach(row => {{
        const parts = row.id.split('_');
        if (parts.length === 3) {{
          const qid = parseInt(parts[1], 10);
          const letter = parts[2];
          row.classList.toggle('marked', userMarkedChoices[qid] === letter);
        }}
      }});

      const undoBtn = document.getElementById('btnUndoClear');
      if (undoBtn && undoHistoryStack.length === 0) {{
        undoBtn.style.opacity = '0.35';
      }}
    }}

    /* ========================================================= */
    /* TEKİL SORU CEVAP AÇMA/KAPAMA (LUCIDE GÖZ)                */
    /* ========================================================= */
    function toggleSingleAnswerReveal(qid) {{
      const q = allData.find(item => item.id === qid);
      if (q && q.sekilli) return; // Görselli soru pasif

      const isRevealed = revealedAnswers.has(qid);
      if (isRevealed) {{
        revealedAnswers.delete(qid);
      }} else {{
        revealedAnswers.add(qid);
      }}

      const eyeBtn = document.getElementById(`btnEye_${{qid}}`);
      const bannerEl = document.getElementById(`banner_${{qid}}`);
      const q = allData.find(item => item.id === qid);
      const correctLetter = q ? q.dogru_cevap : null;

      if (eyeBtn) eyeBtn.classList.toggle('revealed', !isRevealed);
      if (bannerEl) bannerEl.style.display = !isRevealed ? 'flex' : 'none';

      if (correctLetter) {{
        const correctRow = document.getElementById(`opt_${{qid}}_${{correctLetter}}`);
        if (correctRow) {{
          correctRow.classList.toggle('revealed-correct', !isRevealed);
        }}
      }}
    }}

    /* ========================================================= */
    /* TEKİL SORU PUSULA / İPUCU AÇMA/KAPAMA (LUCIDE PUSULA)     */
    /* ========================================================= */
    function toggleSingleHint(qid) {{
      const isRevealed = revealedHints.has(qid);
      if (isRevealed) {{
        revealedHints.delete(qid);
      }} else {{
        revealedHints.add(qid);
      }}

      const compassBtn = document.getElementById(`btnCompass_${{qid}}`);
      const hintEl = document.getElementById(`hint_${{qid}}`);

      if (compassBtn) compassBtn.classList.toggle('hint-revealed', !isRevealed);
      if (hintEl) hintEl.style.display = !isRevealed ? 'flex' : 'none';
    }}

    /* ========================================================= */
    /* SAYFA ALTI CEVAP ANAHTARI (LUCIDE GÖZ BUTONU)             */
    /* ========================================================= */
    function togglePageKey(pageNum) {{
      const strip = document.getElementById(`pageBottomKey_${{pageNum}}`);
      const lbl = document.getElementById(`lblPageKey_${{pageNum}}`);
      if (!strip) return;

      const isHidden = (strip.style.display === 'none' || !strip.style.display);
      strip.style.display = isHidden ? 'flex' : 'none';
      if (lbl) lbl.textContent = isHidden ? 'Gizle' : 'Cevaplar';
    }}

    /* ========================================================= */
    /* TAM EKRAN / ODAK MODU (KONSOLDAN ÇAĞRILIR, BUTON KALIR)   */
    /* ========================================================= */
    function toggleFullscreenFocusMode() {{
      const isFull = document.body.classList.toggle('fullscreen-focus-mode');
      const iconSvg = document.getElementById('iconFullscreenSvg');
      if (iconSvg) {{
        if (isFull) {{
          iconSvg.innerHTML = `<path d="M4 14h6m0 0v6m0-6-7 7"/><path d="M20 10h-6m0 0V4m0 6 7-7"/><path d="M14 20v-6m0 0h6m-6 0 7 7"/><path d="M10 4v6m0 0H4m0 0 7-7"/>`;
        }} else {{
          iconSvg.innerHTML = `<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>`;
        }}
      }}

      // Tarayıcı native fullscreen desteği
      if (isFull) {{
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {{
          document.documentElement.requestFullscreen().catch(() => {{}});
        }}
      }} else {{
        if (document.exitFullscreen && document.fullscreenElement) {{
          document.exitFullscreen().catch(() => {{}});
        }}
      }}
    }}

    document.addEventListener('fullscreenchange', () => {{
      if (!document.fullscreenElement && document.body.classList.contains('fullscreen-focus-mode')) {{
        document.body.classList.remove('fullscreen-focus-mode');
        const iconSvg = document.getElementById('iconFullscreenSvg');
        if (iconSvg) {{
          iconSvg.innerHTML = `<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>`;
        }}
      }}
    }});

    /* ========================================================= */
    /* KONSOL, ZOOM & SÜTUN GEÇİŞİ                               */
    /* ========================================================= */
    function toggleConsoleMenu() {{
      const popup = document.getElementById('consoleMenuPopup');
      popup.classList.toggle('open');
    }}

    function setColumnCount(n) {{
      currentColumnCount = n;
      try {{
        localStorage.setItem('aol_column_count', n);
      }} catch (e) {{}}

      document.querySelectorAll('#columnTogglePill .btn-segmented-pill').forEach(btn => {{
        btn.classList.toggle('active', parseInt(btn.dataset.cols, 10) === n);
      }});

      const container = document.getElementById('bookletPagesContainer');
      if (container) {{
        container.classList.remove('wide-3', 'wide-4');
        if (n === 3) container.classList.add('wide-3');
        if (n === 4) container.classList.add('wide-4');
      }}

      document.querySelectorAll('.page-columns-body').forEach(el => {{
        el.classList.remove('cols-1', 'cols-2', 'cols-3', 'cols-4');
        el.classList.add(`cols-${{n}}`);
      }});
    }}

    function zoomIn() {{
      if (zoomLevelIndex < zoomScales.length - 1) {{
        zoomLevelIndex++;
        document.documentElement.style.setProperty('--booklet-font-size', zoomScales[zoomLevelIndex]);
      }}
    }}

    function zoomOut() {{
      if (zoomLevelIndex > 0) {{
        zoomLevelIndex--;
        document.documentElement.style.setProperty('--booklet-font-size', zoomScales[zoomLevelIndex]);
      }}
    }}

    /* ========================================================= */
    /* AKILLI PDF DİYALOĞU & YAZDIRMA                            */
    /* ========================================================= */
    function openPdfDialog() {{
      toggleConsoleMenu();
      document.getElementById('pdfDialogOverlay').classList.add('open');
    }}

    function closePdfDialog() {{
      document.getElementById('pdfDialogOverlay').classList.remove('open');
    }}

    function executePdfPrint() {{
      const loc = document.querySelector('input[name="pdfKeyLocation"]:checked').value;
      closePdfDialog();

      const strips = document.querySelectorAll('.page-bottom-answer-strip');
      if (loc === 'bottom') {{
        strips.forEach(s => s.style.display = 'flex');
      }} else {{
        strips.forEach(s => s.style.display = 'none');
      }}

      const existingSeparate = document.getElementById('separateAnswerPage');
      if (existingSeparate) existingSeparate.remove();

      if (loc === 'separate') {{
        const container = document.getElementById('bookletPagesContainer');
        const ansPage = document.createElement('div');
        ansPage.className = 'booklet-page';
        ansPage.id = 'separateAnswerPage';

        let gridCells = '';
        bookletQuestions.forEach((q, idx) => {{
          gridCells += `
            <div class="mini-key-cell" style="padding:6px 10px; font-size:13px;">
              <span>${{idx + 1}}.</span> <strong style="color:var(--brand-accent);">${{q.dogru_cevap}}</strong>
            </div>
          `;
        }});

        ansPage.innerHTML = `
          <div class="page-header-band">
            <span class="institution-name">T.C. MİLLÎ EĞİTİM BAKANLIĞI • AÖL KESİŞİM TESTİ</span>
            <span class="exam-name-title">🔑 CEVAP ANAHTARI SAYFASI</span>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(70px, 1fr)); gap:8px; padding:20px 0;">
            ${{gridCells}}
          </div>
          <div class="page-footer-band">
            <span>RESMÎ CEVAP ANAHTARI</span>
            <span class="page-num-pill">— SON SAYFA —</span>
            <span>AÖL KESİŞİM REHBERİ</span>
          </div>
        `;
        container.appendChild(ansPage);
      }}

      window.print();

      setTimeout(() => {{
        const sep = document.getElementById('separateAnswerPage');
        if (sep) sep.remove();
      }}, 1000);
    }}

    /* ========================================================= */
    /* ÇEKMECE ETKİLEŞİMİ                                        */
    /* ========================================================= */
    function openSubjectDrawer() {{
      document.getElementById('drawerOverlay').classList.add('open');
      updateCourseModeToggleVisibility();

      const input = document.getElementById('drawerSearchInput');
      const clearBtn = document.getElementById('drawerSearchClearBtn');
      if (input) {{
        input.value = activeSearchFilter || '';
        drawerSearchTerm = activeSearchFilter || '';
      }}
      if (clearBtn) {{
        clearBtn.style.display = drawerSearchTerm ? 'flex' : 'none';
      }}

      const resultsContainer = document.getElementById('drawerSearchResultsContainer');
      const normalContainer = document.getElementById('drawerNormalSelectorContainer');

      if (drawerSearchTerm) {{
        if (resultsContainer) resultsContainer.style.display = 'block';
        if (normalContainer) normalContainer.style.display = 'none';
        renderSearchResults();
      }} else {{
        if (resultsContainer) resultsContainer.style.display = 'none';
        if (normalContainer) normalContainer.style.display = 'block';
        renderDrawerCourses();
        renderDrawerTopics();
      }}
    }}

    function closeSubjectDrawer() {{
      document.getElementById('drawerOverlay').classList.remove('open');
    }}

    function handleDrawerOverlayClick(e) {{
      if (e.target.id === 'drawerOverlay') closeSubjectDrawer();
    }}

    /* ========================================================= */
    /* SÜRÜKLENEBİLİR MİNNACIK NAKİT NUMPAD (MICRO CALCULATOR)   */
    /* ========================================================= */
    let isCalcOpen = false;
    let calcMode = 'num'; // 'num' | 'ops'
    let calcCurrent = '0';
    let calcPrevious = null;
    let calcOp = null;
    let calcResetOnNext = false;

    function toggleMiniCalculator() {{
      const calc = document.getElementById('miniCalcWidget');
      if (!calc) return;
      isCalcOpen = !isCalcOpen;
      calc.style.display = isCalcOpen ? 'flex' : 'none';
      if (isCalcOpen) {{
        calcMode = 'num';
        renderCalcKeypad();
        updateCalcDisplay();
        const popup = document.getElementById('consoleMenuPopup');
        if (popup) popup.classList.remove('open');
      }}
    }}

    function toggleCalcMode() {{
      calcMode = (calcMode === 'num') ? 'ops' : 'num';
      renderCalcKeypad();
    }}

    function renderCalcKeypad() {{
      const grid = document.getElementById('miniCalcGrid');
      if (!grid) return;

      if (calcMode === 'num') {{
        grid.innerHTML = `
          <button class="micro-calc-btn" onclick="calcAction('num', '7')">7</button>
          <button class="micro-calc-btn" onclick="calcAction('num', '8')">8</button>
          <button class="micro-calc-btn" onclick="calcAction('num', '9')">9</button>
          
          <button class="micro-calc-btn" onclick="calcAction('num', '4')">4</button>
          <button class="micro-calc-btn" onclick="calcAction('num', '5')">5</button>
          <button class="micro-calc-btn" onclick="calcAction('num', '6')">6</button>
          
          <button class="micro-calc-btn" onclick="calcAction('num', '1')">1</button>
          <button class="micro-calc-btn" onclick="calcAction('num', '2')">2</button>
          <button class="micro-calc-btn" onclick="calcAction('num', '3')">3</button>
          
          <button class="micro-calc-btn" onclick="calcAction('num', '0')">0</button>
          <button class="micro-calc-btn" onclick="calcAction('dot')">,</button>
          <button class="micro-calc-btn micro-btn-change" onclick="toggleCalcMode()" title="İşlemler">⇄</button>
        `;
      }} else {{
        grid.innerHTML = `
          <button class="micro-calc-btn micro-btn-op" onclick="calcAction('op', '+')">+</button>
          <button class="micro-calc-btn micro-btn-op" onclick="calcAction('op', '-')">−</button>
          <button class="micro-calc-btn micro-btn-op" onclick="calcAction('op', '*')">×</button>
          
          <button class="micro-calc-btn micro-btn-op" onclick="calcAction('op', '/')">÷</button>
          <button class="micro-calc-btn micro-btn-op" onclick="calcAction('sqrt')" title="Karekök">√</button>
          <button class="micro-calc-btn micro-btn-op" onclick="calcAction('percent')" title="Yüzde">%</button>
          
          <button class="micro-calc-btn" onclick="calcAction('negate')" title="Artı/Eksi">±</button>
          <button class="micro-calc-btn" onclick="calcAction('backspace')" title="Geri Sil">⌫</button>
          <button class="micro-calc-btn" onclick="calcAction('clear')" title="Temizle">C</button>
          
          <button class="micro-calc-btn micro-btn-equals" onclick="calcAction('equals')" title="Eşittir">=</button>
          <button class="micro-calc-btn micro-btn-close" onclick="toggleMiniCalculator()" title="Kapat">✕</button>
          <button class="micro-calc-btn micro-btn-change" onclick="toggleCalcMode()" title="Rakamlara Dön">⇄</button>
        `;
      }}
    }}

    function updateCalcDisplay() {{
      const main = document.getElementById('calcMainDisplay');
      const sub = document.getElementById('calcSubDisplay');
      if (main) main.textContent = calcCurrent;
      if (sub) {{
        if (calcPrevious !== null && calcOp) {{
          const opSym = {{ '+': '+', '-': '−', '*': '×', '/': '÷' }}[calcOp] || calcOp;
          sub.textContent = `${{calcPrevious}} ${{opSym}}`;
        }} else {{
          sub.textContent = '';
        }}
      }}
    }}

    function calcAction(type, val) {{
      if (type === 'num') {{
        if (calcResetOnNext || calcCurrent === '0' || calcCurrent === 'Hata') {{
          calcCurrent = val;
          calcResetOnNext = false;
        }} else {{
          if (calcCurrent.length < 12) calcCurrent += val;
        }}
      }} else if (type === 'dot') {{
        if (calcResetOnNext || calcCurrent === 'Hata') {{
          calcCurrent = '0.';
          calcResetOnNext = false;
        }} else if (!calcCurrent.includes('.')) {{
          calcCurrent += '.';
        }}
      }} else if (type === 'clear') {{
        calcCurrent = '0';
        calcPrevious = null;
        calcOp = null;
        calcResetOnNext = false;
        calcMode = 'num';
        renderCalcKeypad();
      }} else if (type === 'backspace') {{
        if (!calcResetOnNext && calcCurrent.length > 1 && calcCurrent !== 'Hata') {{
          calcCurrent = calcCurrent.slice(0, -1);
        }} else {{
          calcCurrent = '0';
        }}
      }} else if (type === 'negate') {{
        if (calcCurrent !== '0' && calcCurrent !== 'Hata') {{
          calcCurrent = calcCurrent.startsWith('-') ? calcCurrent.slice(1) : '-' + calcCurrent;
        }}
      }} else if (type === 'percent') {{
        const n = parseFloat(calcCurrent);
        if (!isNaN(n)) {{
          calcCurrent = String(Number((n / 100).toFixed(6)));
        }}
        calcResetOnNext = true;
      }} else if (type === 'sqrt') {{
        const n = parseFloat(calcCurrent);
        if (isNaN(n) || n < 0) {{
          calcCurrent = 'Hata';
        }} else {{
          calcCurrent = String(Number(Math.sqrt(n).toFixed(6)));
        }}
        calcResetOnNext = true;
        calcMode = 'num';
        renderCalcKeypad();
      }} else if (type === 'op') {{
        if (calcOp && calcPrevious !== null && !calcResetOnNext) {{
          calcExecute();
        }}
        calcPrevious = calcCurrent;
        calcOp = val;
        calcResetOnNext = true;
        calcMode = 'num';
        renderCalcKeypad();
      }} else if (type === 'equals') {{
        if (calcOp && calcPrevious !== null) {{
          calcExecute();
          calcOp = null;
          calcPrevious = null;
          calcResetOnNext = true;
        }}
        calcMode = 'num';
        renderCalcKeypad();
      }}
      updateCalcDisplay();
    }}

    function calcExecute() {{
      const a = parseFloat(calcPrevious);
      const b = parseFloat(calcCurrent);
      if (isNaN(a) || isNaN(b)) return;
      let res = 0;
      if (calcOp === '+') res = a + b;
      else if (calcOp === '-') res = a - b;
      else if (calcOp === '*') res = a * b;
      else if (calcOp === '/') {{
        if (b === 0) {{
          calcCurrent = 'Hata';
          return;
        }}
        res = a / b;
      }}
      res = Math.round(res * 1000000) / 1000000;
      calcCurrent = String(res);
    }}

    function initDraggableCalculator() {{
      const calc = document.getElementById('miniCalcWidget');
      const pill = document.getElementById('miniCalcDisplayPill');
      if (!calc || !pill) return;

      renderCalcKeypad();

      let isDragging = false;
      let startX = 0, startY = 0;
      let initialLeft = 0, initialTop = 0;

      function onDragStart(e) {{
        if (e.target.closest('.micro-calc-btn')) return;
        isDragging = true;
        const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
        startX = clientX;
        startY = clientY;

        const rect = calc.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        calc.style.right = 'auto';
        calc.style.bottom = 'auto';
        calc.style.left = `${{initialLeft}}px`;
        calc.style.top = `${{initialTop}}px`;

        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('mouseup', onDragEnd);
        document.addEventListener('touchmove', onDragMove, {{ passive: false }});
        document.addEventListener('touchend', onDragEnd);
      }}

      function onDragMove(e) {{
        if (!isDragging) return;
        if (e.cancelable) e.preventDefault();
        const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

        const dx = clientX - startX;
        const dy = clientY - startY;

        let newLeft = initialLeft + dx;
        let newTop = initialTop + dy;

        const maxLeft = window.innerWidth - calc.offsetWidth - 10;
        const maxTop = window.innerHeight - calc.offsetHeight - 10;
        newLeft = Math.max(10, Math.min(newLeft, maxLeft));
        newTop = Math.max(10, Math.min(newTop, maxTop));

        calc.style.left = `${{newLeft}}px`;
        calc.style.top = `${{newTop}}px`;
      }}

      function onDragEnd() {{
        isDragging = false;
        document.removeEventListener('mousemove', onDragMove);
        document.removeEventListener('mouseup', onDragEnd);
        document.removeEventListener('touchmove', onDragMove);
        document.removeEventListener('touchend', onDragEnd);
      }}

      pill.addEventListener('mousedown', onDragStart);
      pill.addEventListener('touchstart', onDragStart, {{ passive: false }});

      document.addEventListener('keydown', (e) => {{
        if (!isCalcOpen) return;
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

        if (e.key >= '0' && e.key <= '9') {{
          calcAction('num', e.key);
        }} else if (e.key === '.' || e.key === ',') {{
          calcAction('dot');
        }} else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {{
          calcAction('op', e.key);
        }} else if (e.key === 'Enter' || e.key === '=') {{
          e.preventDefault();
          calcAction('equals');
        }} else if (e.key === 'Backspace') {{
          calcAction('backspace');
        }} else if (e.key === 'Escape') {{
          toggleMiniCalculator();
        }} else if (e.key === 'Tab') {{
          e.preventDefault();
          toggleCalcMode();
        }}
      }});
    }}

    /* ========================================================= */
    /* LOCALSTORAGE HAFIZA & TEMA                                */
    /* ========================================================= */
    function saveChoicesToStorage() {{
      try {{
        localStorage.setItem('aol_user_choices', JSON.stringify(userMarkedChoices));
      }} catch (e) {{}}
    }}

    function loadSavedChoices() {{
      try {{
        const saved = localStorage.getItem('aol_user_choices');
        if (saved) {{
          userMarkedChoices = JSON.parse(saved);
        }}
      }} catch (e) {{}}
    }}

    function setThemeMode(mode) {{
      const isDark = (mode === 'dark');
      if (isDark) {{
        document.body.classList.add('dark-mode');
      }} else {{
        document.body.classList.remove('dark-mode');
      }}
      try {{
        localStorage.setItem('aol_theme', isDark ? 'dark' : 'light');
      }} catch (e) {{}}

      document.querySelectorAll('#themeTogglePill .btn-segmented-pill').forEach(btn => {{
        btn.classList.toggle('active', btn.dataset.theme === mode);
      }});
    }}

    function initTheme() {{
      let theme = 'light';
      try {{
        const saved = localStorage.getItem('aol_theme');
        if (saved === 'dark') theme = 'dark';
      }} catch (e) {{}}
      setThemeMode(theme);
    }}

    function toggleTheme() {{
      const isDark = document.body.classList.contains('dark-mode');
      setThemeMode(isDark ? 'light' : 'dark');
    }}

    /* ========================================================= */
    /* VURGU RENGİ (ACCENT COLOR) MOTORU                         */
    /* ========================================================= */
    const ACCENT_COLORS = {{
      'blue':    {{ light: '#0284c7', dark: '#38bdf8' }},
      'emerald': {{ light: '#059669', dark: '#34d399' }},
      'indigo':  {{ light: '#6366f1', dark: '#818cf8' }},
      'amber':   {{ light: '#d97706', dark: '#fbbf24' }},
      'rose':    {{ light: '#e11d48', dark: '#fb7185' }},
      'slate':   {{ light: '#475569', dark: '#94a3b8' }}
    }};

    let currentAccent = 'blue';

    function setAccentColor(colorKey) {{
      if (!ACCENT_COLORS[colorKey]) colorKey = 'blue';
      currentAccent = colorKey;
      try {{
        localStorage.setItem('aol_accent_color', colorKey);
      }} catch (e) {{}}

      const cfg = ACCENT_COLORS[colorKey];
      document.documentElement.style.setProperty('--user-accent', cfg.light);
      document.documentElement.style.setProperty('--user-accent-dark', cfg.dark);

      document.querySelectorAll('#colorSwatchesGroup .btn-color-swatch').forEach(btn => {{
        btn.classList.toggle('active', btn.dataset.color === colorKey);
      }});
    }}

    function initAccentColor() {{
      let color = 'blue';
      try {{
        const saved = localStorage.getItem('aol_accent_color');
        if (saved && ACCENT_COLORS[saved]) color = saved;
      }} catch (e) {{}}
      setAccentColor(color);
    }}

    document.addEventListener('click', (e) => {{
      const popup = document.getElementById('consoleMenuPopup');
      const masterBtn = document.getElementById('btnMasterConsole');
      if (popup && popup.classList.contains('open')) {{
        if (!popup.contains(e.target) && !masterBtn.contains(e.target)) {{
          popup.classList.remove('open');
        }}
      }}
    }});

    function escapeHtml(str) {{
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }}

    function escapeJs(str) {{
      if (!str) return '';
      return String(str).replace(/\\\\/g, '\\\\\\\\').replace(/'/g, "\\\\'");
    }}
  </script>
</body>
</html>
"""

    with open('/home/mehmedbaykan/codes/ortaklar/index.html', 'w', encoding='utf-8') as f:
        f.write(html_content)

    print(f"✅ index.html (Sürüm 3.2 - Ezan Sayacı, 3 Çizgili Menü & Yeni İkonlar) başarıyla üretildi! Boyut: {len(html_content):,} bayt")

if __name__ == '__main__':
    main()
