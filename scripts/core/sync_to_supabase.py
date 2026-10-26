#!/usr/bin/env python3
"""
AÖL Dijital Kitapçık — Supabase Toplu Senkronizasyon Betiği
Yereldeki JSON verilerini (sorular, kavramlar, AI açıklamaları) Supabase veritabanına aktarır.

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

SUBJECT_KEYWORDS = [
    ('COĞRAFYA', 'COG'), ('TÜRK DİLİ', 'TDE'), ('EDEBİYAT', 'TDE'),
    ('MATEMATİK', 'MAT'), ('İNKILAP', 'INK'), ('TARİH', 'TAR'),
    ('KİMYA', 'KIM'), ('FİZİK', 'FIZ'), ('BİYOLOJİ', 'BIO'),
    ('FELSEFE', 'FEL'), ('DİN KÜLTÜRÜ', 'DIN'), ('SAĞLIK', 'SAG'),
    ('İNGİLİZCE', 'ING'), ('KELAM', 'KLM'), ('HADİS', 'AOF_HADIS'),
    ('İSLAM TARİHİ', 'AOF_ITAR'), ('AHLAK', 'AOF_AHLAK'),
    ('İBADET', 'AOF_IBADET'), ('İNANÇ', 'AOF_INANC')
]


def get_subject_code_from_ders(ders: str) -> Optional[str]:
    d = ders.upper()
    for kw, code in SUBJECT_KEYWORDS:
        if kw in d:
            return code
    return None


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
            if not q.get('id') or not q.get('ders') or not q.get('soru') or not isinstance(q.get('secenekler'), dict):
                continue
            questions.append({
                'id': int(q['id']),
                'subject': subj,
                'ders': str(q['ders']).strip(),
                'ders_kodu': int(q['ders_kodu']) if q.get('ders_kodu') is not None else None,
                'soru_no': int(q['soru_no']) if q.get('soru_no') is not None else None,
                'soru': str(q['soru']),
                'secenekler': q['secenekler'],
                'dogru_cevap': str(q['dogru_cevap']).strip(),
                'ana_konu': q.get('ana_konu'),
                'alt_konu': q.get('alt_konu'),
                'yil': str(q['yil']) if q.get('yil') is not None else None,
                'donem': str(q['donem']) if q.get('donem') is not None else None,
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
        base = os.path.basename(filepath).replace('_concepts.json', '')
        parts = base.split('_')
        subject = parts[0]
        donem_hint = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 1
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                items = json.load(f)
        except Exception as e:
            print(f'⚠️ {filepath} okunamadı: {e}')
            continue

        for item in items:
            raw_id, term = item.get('id'), item.get('term')
            if not raw_id or not term:
                continue
            donemler = item.get('donemler', [donem_hint])
            sayfa_by_donem = item.get('sayfa_by_donem', {})
            tanim_by_donem = item.get('tanim_by_donem', {})

            for d in donemler:
                d_int = int(d)
                scoped_id = raw_id if len(donemler) == 1 else f'{raw_id}_d{d_int}'
                if scoped_id in seen_ids:
                    for ex in concepts:
                        if ex['id'] == scoped_id:
                            ex['tanim'] = tanim_by_donem.get(str(d), item.get('tanim', ex['tanim']))
                            ex['sayfa'] = sayfa_by_donem.get(str(d), item.get('sayfa', ex['sayfa']))
                    continue

                seen_ids.add(scoped_id)
                tanim = tanim_by_donem.get(str(d), item.get('tanim', ''))
                sayfa = sayfa_by_donem.get(str(d), item.get('sayfa'))
                concepts.append({
                    'id': scoped_id,
                    'base_id': raw_id,
                    'term': str(term).strip(),
                    'subject': subject,
                    'ders': f'{subject} – {d_int}',
                    'ders_kodu': item.get('ders_kodu'),
                    'donem': d_int,
                    'unite_no': item.get('unite_no'),
                    'sayfa': int(sayfa) if sayfa is not None else None,
                    'tanim': str(tanim),
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
        subj = get_subject_code_from_ders(q.get('ders', ''))
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
    parser.add_argument('--table', default='all', choices=['all', 'questions', 'concepts', 'ai_explanations', 'question_concepts'],
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
