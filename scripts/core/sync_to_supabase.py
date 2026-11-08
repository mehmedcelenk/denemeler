#!/usr/bin/env python3
"""
AÖL Dijital Kitapçık — Supabase Toplu Senkronizasyon Betiği
Yereldeki JSON verilerini (sorular, kavramlar, dersler, AI açıklamaları) Supabase veritabanına aktarır.

Kullanım:
    python3 scripts/core/sync_to_supabase.py --dry-run
    python3 scripts/core/sync_to_supabase.py --table questions --subjects KLM,DIN
    python3 scripts/core/sync_to_supabase.py --table all --batch-size 200
"""

import argparse
import glob
import json
import os
import re
import sys
import time
from typing import Any, Dict, List, Optional, Tuple
import requests

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
DATA_DIR = os.path.join(ROOT_DIR, 'data')
SUBJECTS_DIR = os.path.join(DATA_DIR, 'subjects')
CONCEPTS_DIR = os.path.join(DATA_DIR, 'concepts')
AI_EXP_DIR = os.path.join(DATA_DIR, 'ai_explanations')


def load_env_vars() -> Dict[str, str]:
    """Ortam değişkenlerini ve .env dosyasını harici paket olmadan okur."""
    env_vars = dict(os.environ)
    for env_file in ['.env.local', '.env']:
        env_path = os.path.join(ROOT_DIR, env_file)
        if os.path.exists(env_path):
            with open(env_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        k, v = line.split('=', 1)
                        k, v = k.strip(), v.strip().strip('"\'')
                        if k and k not in env_vars:
                            env_vars[k] = v
    return env_vars


class SupabaseSyncer:
    def __init__(self, url: str, key: str, batch_size: int = 200, dry_run: bool = False):
        self.url = url.rstrip('/')
        self.key = key
        self.batch_size = max(1, min(batch_size, 1000))
        self.dry_run = dry_run
        self.session = requests.Session()
        self.headers = {
            'apikey': self.key,
            'Authorization': f'Bearer {self.key}',
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates,return=minimal'
        }

    def upsert_batch(self, table: str, rows: List[Dict[str, Any]]) -> bool:
        if not rows or self.dry_run:
            return True
        endpoint = f'{self.url}/rest/v1/{table}'
        try:
            resp = self.session.post(endpoint, json=rows, headers=self.headers, timeout=60)
            if resp.status_code in (200, 201, 204):
                return True
            print(f'❌ [{table}] HTTP {resp.status_code} Hatası: {resp.text[:300]}')
            return False
        except Exception as e:
            print(f'❌ [{table}] Bağlantı Hatası: {e}')
            return False

    def sync_table(self, table: str, rows: List[Dict[str, Any]]) -> Tuple[int, int]:
        total = len(rows)
        if total == 0:
            print(f'ℹ️ [{table}] Aktarılacak kayıt bulunamadı.')
            return (0, 0)

        batches = (total + self.batch_size - 1) // self.batch_size
        print(f'\n🚀 [{table}] Toplam {total} kayıt {batches} paketle aktarılıyor (Boyut: {self.batch_size})...')
        success, failed = 0, 0

        for i in range(0, total, self.batch_size):
            batch = rows[i:i + self.batch_size]
            b_num = (i // self.batch_size) + 1
            if self.dry_run:
                print(f'  [DRY-RUN] Paket {b_num}/{batches} ({len(batch)} kayıt) doğrulandı.')
                success += len(batch)
            else:
                ok = self.upsert_batch(table, batch)
                if ok:
                    success += len(batch)
                    print(f'  ✓ Paket {b_num}/{batches} ({len(batch)} kayıt) aktarıldı.')
                else:
                    failed += len(batch)
                    print(f'  ✗ Paket {b_num}/{batches} ({len(batch)} kayıt) BAŞARISIZ!')
                time.sleep(0.05)
        return (success, failed)


def prepare_subjects() -> List[Dict[str, Any]]:
    manifest_path = os.path.join(ROOT_DIR, 'src/data/generated/subjectManifest.json')
    if not os.path.exists(manifest_path):
        return []
    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest = json.load(f)

    subjects = []
    for sid, meta in sorted(manifest.items()):
        if sid.startswith('TYT_'): program = 'TYT'
        elif sid.startswith('AYT_'): program = 'AYT'
        elif sid == 'YDT_ING': program = 'YDT'
        elif sid.startswith('AOF_'): program = 'AOF'
        elif sid.startswith('ILM_'): program = 'ILMIHAL'
        elif sid.startswith('GIR_'): program = 'GIRISIMCILIK'
        else: program = 'AOIHL'

        if any(w in sid for w in ['MAT', 'FIZ', 'KIM', 'BIO']): cat = 'sayisal'
        elif any(w in sid for w in ['HADIS', 'ITAR', 'AHLAK', 'IBADET', 'INANC', 'ARAPCA', 'KLM', 'ILM']): cat = 'ilahiyat'
        elif any(w in sid for w in ['DIN', 'SAG', 'ING', 'GIR']): cat = 'kultur'
        else: cat = 'sozel'

        subjects.append({
            'id': sid,
            'name': sid,
            'short_name': sid,
            'program': program,
            'category': cat,
            'kredi': 1 if program in ('TYT', 'AYT', 'YDT') else 2,
            'question_count': meta.get('questionCount', 0),
            'course_count': meta.get('courseCount', 1)
        })
    return subjects


def prepare_questions(subjects: Optional[List[str]] = None) -> List[Dict[str, Any]]:
    questions: List[Dict[str, Any]] = []
    for filepath in sorted(glob.glob(os.path.join(SUBJECTS_DIR, '*.json'))):
        subj = os.path.basename(filepath).replace('.json', '')
        if subjects and subj not in subjects:
            continue
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            print(f'⚠️ {filepath} okunamadı: {e}')
            continue

        for q in data:
            if not q.get('id') or not q.get('ders') or not str(q.get('soru', '')).strip() or not isinstance(q.get('secenekler'), dict):
                continue
            questions.append({
                'id': int(q['id']),
                'subject': subj,
                'ders': str(q['ders']).strip(),
                'ders_kodu': int(q['ders_kodu']) if q.get('ders_kodu') is not None and str(q.get('ders_kodu')).isdigit() else None,
                'soru_no': int(q['soru_no']) if q.get('soru_no') is not None else None,
                'soru': str(q['soru']).strip(),
                'secenekler': q['secenekler'],
                'dogru_cevap': str(q['dogru_cevap']).strip(),
                'ana_konu': q.get('ana_konu'),
                'alt_konu': q.get('alt_konu'),
                'yil': str(q['yil']) if q.get('yil') is not None else None,
                'donem': str(q['donem']) if q.get('donem') is not None else None,
                'sinav_kodu': str(q['sinav_kodu']) if q.get('sinav_kodu') is not None else None,
                'sinav_adi': str(q['sinav_adi']) if q.get('sinav_adi') is not None else None,
                'puan': float(q['puan']) if q.get('puan') is not None else None,
                'kredi': int(q['kredi']) if q.get('kredi') is not None else None,
                'sinav_soru_sayisi': int(q['sinav_soru_sayisi']) if q.get('sinav_soru_sayisi') is not None else None,
                'ipucu': q.get('ipucu'),
                'sekilli': bool(q.get('sekilli', False)),
                'zorluk': q.get('zorluk'),
                'soru_tr': q.get('soru_tr'),
                'soru_ar': q.get('soru_ar'),
                'soru_xray': q.get('soru_xray'),
                'secenekler_xray': q.get('secenekler_xray'),
                'dogru_nedeni': q.get('dogru_nedeni')
            })
    return questions


def prepare_concepts() -> List[Dict[str, Any]]:
    concepts: List[Dict[str, Any]] = []
    seen_ids = set()
    for filepath in sorted(glob.glob(os.path.join(CONCEPTS_DIR, '*_concepts.json'))):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                items = json.load(f)
        except Exception as e:
            print(f'⚠️ {filepath} okunamadı: {e}')
            continue

        for item in items:
            cid = item.get('id')
            if not cid or cid in seen_ids:
                continue
            seen_ids.add(cid)
            concepts.append({
                'id': cid,
                'base_id': item.get('base_id', cid),
                'term': str(item.get('term', '')).strip(),
                'subject': item.get('subject', 'GENEL'),
                'ders': str(item.get('ders', '')).strip(),
                'ders_kodu': item.get('ders_kodu'),
                'donem': int(item.get('donem', 1)),
                'unite_no': item.get('unite_no'),
                'sayfa': item.get('sayfa'),
                'tanim': str(item.get('tanim', '')).strip(),
                'baglam_farki': item.get('baglam_farki'),
                'sinav_ipucu': item.get('sinav_ipucu'),
                'pattern': item.get('pattern'),
                'aliases': item.get('aliases', [])
            })
    return concepts


def prepare_ai_explanations() -> List[Dict[str, Any]]:
    explanations: List[Dict[str, Any]] = []
    for filepath in sorted(glob.glob(os.path.join(AI_EXP_DIR, '*.json'))):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            print(f'⚠️ {filepath} okunamadı: {e}')
            continue

        for qid_str, exp in data.items():
            if qid_str.isdigit() and isinstance(exp, dict) and exp.get('reply'):
                explanations.append({
                    'question_id': int(qid_str),
                    'query': exp.get('query', 'Bu soruyu adım adım açıklar mısın?'),
                    'reply': exp['reply'],
                    'model': exp.get('model', 'deepseek-v4.1-flash')
                })
    return explanations


def prepare_question_concepts(questions: List[Dict[str, Any]], concepts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    links: List[Dict[str, Any]] = []
    seen = set()
    patterns_by_subj: Dict[str, List[Tuple[str, str, re.Pattern]]] = {}
    for c in concepts:
        subj = c.get('subject', 'GENEL')
        pat = c.get('pattern')
        if pat:
            try:
                patterns_by_subj.setdefault(subj, []).append((c['id'], c['term'], re.compile(pat, re.IGNORECASE)))
            except re.error:
                continue

    for q in questions:
        qid = q['id']
        subj = q.get('subject')
        compiled = patterns_by_subj.get(subj, []) if subj else []
        if not compiled:
            continue
        xray, soru = q.get('soru_xray') or '', q.get('soru') or ''

        if 'concept-word' in xray:
            for cid, term, _ in compiled:
                if term in xray:
                    pair = (qid, cid)
                    if pair not in seen:
                        seen.add(pair)
                        links.append({'question_id': qid, 'concept_id': cid, 'match_type': 'xray'})

        for cid, _, regex in compiled:
            pair = (qid, cid)
            if pair not in seen and regex.search(soru):
                seen.add(pair)
                links.append({'question_id': qid, 'concept_id': cid, 'match_type': 'pattern'})
    return links


def main():
    parser = argparse.ArgumentParser(description='AÖL Kitapçık Supabase Toplu Veri Senkronizasyonu')
    parser.add_argument('--dry-run', action='store_true', help='Veritabanına yazmadan sadece kontrol yapar.')
    parser.add_argument('--table', default='all', choices=['all', 'subjects', 'questions', 'concepts', 'ai_explanations', 'question_concepts'],
                        help='Aktarılacak tabloyu seçin (varsayılan: all).')
    parser.add_argument('--subjects', default=None, help='Ders kodları filtresi (örn: KLM,DIN,MAT).')
    parser.add_argument('--batch-size', type=int, default=200, help='PostgREST paket boyutu (varsayılan: 200).')
    parser.add_argument('--url', default=None, help='Supabase REST URL adresi.')
    parser.add_argument('--key', default=None, help='Supabase API Key (service_role önerilir).')
    args = parser.parse_args()

    env_vars = load_env_vars()
    sb_url = args.url or env_vars.get('SUPABASE_URL') or env_vars.get('VITE_SUPABASE_URL')
    sb_key = args.key or env_vars.get('SUPABASE_SERVICE_ROLE_KEY') or env_vars.get('SUPABASE_ANON_KEY') or env_vars.get('VITE_SUPABASE_ANON_KEY')

    if not args.dry_run and (not sb_url or not sb_key):
        print('❌ HATA: Supabase URL ve Key bilgisi bulunamadı!')
        print('Lütfen .env dosyasında SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY tanımlayın.')
        sys.exit(1)

    subjects = [s.strip().upper() for s in args.subjects.split(',')] if args.subjects else None
    print('=' * 60)
    print(f'AÖL DİJİTAL KİTAPÇIK — SUPABASE VERİ AKTARIMI ({"🧪 DRY-RUN" if args.dry_run else "⚡ CANLI"})')
    print('=' * 60)

    syncer = SupabaseSyncer(url=sb_url or 'http://localhost', key=sb_key or 'dummy', batch_size=args.batch_size, dry_run=args.dry_run)

    if args.table in ('all', 'subjects'):
        subjects_data = prepare_subjects()
        print(f'📦 Ders Kataloğu: {len(subjects_data)} kayıt hazırlandı.')
        syncer.sync_table('subjects', subjects_data)

    concepts_data = []
    if args.table in ('all', 'concepts', 'question_concepts'):
        concepts_data = prepare_concepts()
        print(f'📦 Kavramlar: {len(concepts_data)} kayıt hazırlandı.')
        if args.table in ('all', 'concepts'):
            syncer.sync_table('concepts', concepts_data)

    questions_data = []
    if args.table in ('all', 'questions', 'question_concepts'):
        questions_data = prepare_questions(subjects=subjects)
        print(f'📦 Sorular: {len(questions_data)} kayıt hazırlandı.')
        if args.table in ('all', 'questions'):
            syncer.sync_table('questions', questions_data)

    if args.table in ('all', 'question_concepts'):
        if not questions_data: questions_data = prepare_questions(subjects=subjects)
        if not concepts_data: concepts_data = prepare_concepts()
        links_data = prepare_question_concepts(questions_data, concepts_data)
        print(f'📦 Soru-Kavram İlişkileri: {len(links_data)} eşleşme hazırlandı.')
        syncer.sync_table('question_concepts', links_data)

    if args.table in ('all', 'ai_explanations'):
        ai_data = prepare_ai_explanations()
        print(f'📦 AI Açıklamaları: {len(ai_data)} kayıt hazırlandı.')
        syncer.sync_table('ai_explanations', ai_data)

    print('\n✅ Senkronizasyon işlemi başarıyla tamamlandı!')


if __name__ == '__main__':
    main()
