#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Validation engine for MEB AÖL Tarih curriculum taxonomy and question classifications."""

import argparse
from collections import defaultdict
from dataclasses import dataclass, field
import json
from pathlib import Path
import re
import sys
from typing import Any, Dict, List, Optional, Set

VALID_COURSES: Dict[int, str] = {
    131: "TARİH – 1", 132: "TARİH – 2", 133: "TARİH – 3", 134: "TARİH – 4",
    137: "TARİH – 5", 138: "TARİH – 6",
    141: "T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – 1",
    142: "T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – 2",
}

FORBIDDEN_FALLBACK_TERMS: Set[str] = {
    "genel", "saptanamadı", "saptanamadi", "diğer", "diger", "fallback",
    "muhtelif", "çeşitli", "cesitli", "karma", "tanımsız", "tanimsiz",
}

UNIT_NAMES = [
    "1. Tarih Bilimi ve İlk Çağ Medeniyetleri", "2. Orta Çağ'da Dünya ve Türk Dünyası",
    "3. İslam Medeniyeti ve Türk-İslam Devletleri", "4. Türkiye Selçukluları ve Anadolu Beylikleri",
    "5. Beylikten Devlete Osmanlı Siyaseti ve Teşkilatı", "6. Dünya Gücü Osmanlı ve Osmanlı Medeniyeti",
    "7. Arayış Yılları ve Değişen Dünya Dengeleri (17-18. Yüzyıl)", "8. En Uzun Yüzyıl (19. ve 20. Yüzyıl Başı Osmanlı)",
    "9. Millî Mücadele ve T.C. İnkılap Tarihi", "10. Çağdaş Türk ve Dünya Tarihi",
]
COURSE_ALLOWED_UNIT_NUMS: Dict[int, Set[int]] = {
    131: {1, 2}, 132: {1, 2, 3}, 133: {3, 4, 5, 6}, 134: {5, 6, 7},
    137: {6, 7, 8}, 138: {7, 8}, 141: {8, 9, 10}, 142: {9, 10},
}
ALLOWED_COURSE_TOPICS: Dict[int, Set[str]] = {
    code: {UNIT_NAMES[u - 1] for u in units} for code, units in COURSE_ALLOWED_UNIT_NUMS.items()
}


class TaxonomyValidationError(Exception):
    """Raised when taxonomy map or question classification fails validation rules."""
    pass


@dataclass(frozen=True)
class HistoryClassificationResult:
    """Represents a validated or classified history question."""
    id: int
    ders: str
    ders_kodu: int
    ana_konu: str
    alt_konu: str
    gerekce: str = ""

@dataclass
class ValidationError:
    """Detailed error object recorded for any invalid question or mapping."""
    question_id: int
    error_type: str
    message: str
    details: Dict[str, Any] = field(default_factory=dict)

@dataclass
class ValidationSummary:
    """Aggregate statistics and audit report output."""
    total_questions: int = 0
    passed_questions: int = 0
    failed_questions: int = 0
    errors: List[ValidationError] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    topic_distribution: Dict[str, int] = field(default_factory=dict)
    subtopic_distribution: Dict[str, int] = field(default_factory=dict)
    course_distribution: Dict[str, int] = field(default_factory=dict)

    @property
    def is_valid(self) -> bool:
        return len(self.errors) == 0

def find_forbidden_term(text: str) -> Optional[str]:
    lower = text.lower()
    for term in FORBIDDEN_FALLBACK_TERMS:
        if term in ("diğer", "diger"):
            if "diğer boylar" in lower or "diger boylar" in lower:
                continue
            if re.search(r"\bdi[ğg]er\b", lower):
                return term
        elif term in lower:
            return term
    return None


class HistoryTaxonomyValidator:
    """Validator engine for MEB Tarih taxonomy map and question classifications."""

    def __init__(self, map_path: str = "scripts/tarih_taxonomy_map.json"):
        self.map_path = Path(map_path)
        self.map: Dict[str, List[str]] = {}
        self._load_error: Optional[str] = None
        if not self.map_path.exists():
            self._load_error = f"Taxonomy map file not found: {self.map_path}"
        else:
            try:
                with open(self.map_path, "r", encoding="utf-8") as f:
                    content = json.load(f)
                if not isinstance(content, dict):
                    self._load_error = f"Taxonomy map must be a JSON dictionary, got {type(content).__name__}"
                else:
                    self.map = content
            except Exception as e:
                self._load_error = f"Failed to load taxonomy map: {e}"

    def validate_taxonomy_map(self) -> List[str]:
        """Validates structure, types, formatting, sequential order, and zero fallback terms."""
        errors: List[str] = []
        if self._load_error:
            return [self._load_error]
        if len(self.map) != 10:
            errors.append(f"Taxonomy map must have exactly 10 units, found {len(self.map)}")

        all_subtopics: Set[str] = set()
        total_subtopics = 0
        for idx, (unit_key, subtopics) in enumerate(self.map.items(), start=1):
            unit_match = re.match(r"^(\d+)\.\s+(.+)$", unit_key)
            if not unit_match:
                errors.append(f"Unit key '{unit_key}' format invalid (expected '<num>. <title>')")
                continue
            unit_num = int(unit_match.group(1))
            if unit_num != idx:
                errors.append(f"Unit sequence mismatch: expected unit {idx}, got {unit_num} ('{unit_key}')")
            forbidden = find_forbidden_term(unit_key)
            if forbidden:
                errors.append(f"Forbidden term '{forbidden}' in unit title: '{unit_key}'")

            if not isinstance(subtopics, list) or len(subtopics) < 2:
                errors.append(f"Unit '{unit_key}' must have a list with at least 2 subtopics")
                continue

            for sub_idx, sub in enumerate(subtopics, start=1):
                total_subtopics += 1
                sub_match = re.match(r"^(\d+)\.(\d+)\s+(.+)$", sub)
                if not sub_match:
                    errors.append(f"Subtopic '{sub}' format invalid (expected '<unit>.<sub_num> <title>')")
                    continue
                s_unit, s_num = int(sub_match.group(1)), int(sub_match.group(2))
                if s_unit != unit_num:
                    errors.append(f"Subtopic '{sub}' unit prefix {s_unit} mismatches parent unit {unit_num}")
                if s_num != sub_idx:
                    errors.append(f"Subtopic '{sub}' numbering {s_num} mismatches sequential index {sub_idx}")
                forbidden_sub = find_forbidden_term(sub)
                if forbidden_sub:
                    errors.append(f"Forbidden term '{forbidden_sub}' in subtopic: '{sub}'")
                if sub in all_subtopics:
                    errors.append(f"Duplicate subtopic detected across taxonomy: '{sub}'")
                all_subtopics.add(sub)

        if total_subtopics != 45:
            errors.append(f"Expected exactly 45 subtopics across taxonomy, found {total_subtopics}")
        return errors

    def validate_classification(self, result: HistoryClassificationResult, strict_bounds: bool = True) -> List[str]:
        """Validates a single HistoryClassificationResult instance. Returns list of error messages."""
        errors: List[str] = []
        if self._load_error:
            return [self._load_error]
        if result.ders_kodu not in VALID_COURSES:
            errors.append(f"Question {result.id}: invalid history ders_kodu {result.ders_kodu}")

        if result.ana_konu not in self.map:
            errors.append(f"Question {result.id}: unknown ana_konu '{result.ana_konu}'")
        else:
            allowed_subs = self.map.get(result.ana_konu, [])
            if result.alt_konu not in allowed_subs:
                errors.append(f"Question {result.id}: alt_konu '{result.alt_konu}' does not belong to '{result.ana_konu}'")

        fb_ana = find_forbidden_term(result.ana_konu)
        if fb_ana:
            errors.append(f"Question {result.id}: forbidden fallback term '{fb_ana}' in ana_konu")
        fb_alt = find_forbidden_term(result.alt_konu)
        if fb_alt:
            errors.append(f"Question {result.id}: forbidden fallback term '{fb_alt}' in alt_konu")

        if strict_bounds and result.ders_kodu in ALLOWED_COURSE_TOPICS:
            allowed_topics = ALLOWED_COURSE_TOPICS[result.ders_kodu]
            if result.ana_konu not in allowed_topics:
                course_name = VALID_COURSES.get(result.ders_kodu, str(result.ders_kodu))
                errors.append(f"Question {result.id}: course bound violation: {course_name} cannot contain '{result.ana_konu}'")

        return errors

    def validate_question_dict(self, q: Dict[str, Any], strict_bounds: bool = True) -> List[str]:
        """Extracts fields and validates raw dictionary representation of a question."""
        try:
            qid_int = int(q.get("id"))
        except (ValueError, TypeError):
            return ["Question dictionary missing or invalid 'id' field"]

        try:
            ders_kodu_int = int(q.get("ders_kodu"))
        except (ValueError, TypeError):
            return [f"Question {qid_int}: missing or invalid 'ders_kodu'"]

        ana_konu, alt_konu = str(q.get("ana_konu", "")).strip(), str(q.get("alt_konu", "")).strip()
        if not ana_konu or not alt_konu:
            return [f"Question {qid_int}: missing or empty 'ana_konu' or 'alt_konu'"]

        result = HistoryClassificationResult(
            id=qid_int,
            ders=str(q.get("ders", VALID_COURSES.get(ders_kodu_int, ""))),
            ders_kodu=ders_kodu_int,
            ana_konu=ana_konu,
            alt_konu=alt_konu,
            gerekce=str(q.get("gerekce", "")),
        )
        return self.validate_classification(result, strict_bounds=strict_bounds)

    def validate_questions(self, questions: List[Dict[str, Any]], strict_bounds: bool = True) -> ValidationSummary:
        """Validates a list of questions, compiles errors, distributions, and entropy warnings."""
        summary = ValidationSummary(total_questions=len(questions))
        unit_sub_counts: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))

        for q in questions:
            qid = q.get("id", 0)
            q_errors = self.validate_question_dict(q, strict_bounds=strict_bounds)
            if q_errors:
                summary.failed_questions += 1
                for err_msg in q_errors:
                    err_type = "COURSE_BOUND_VIOLATION" if "course bound violation" in err_msg else (
                        "FORBIDDEN_FALLBACK" if "forbidden" in err_msg else "TAXONOMY_MISMATCH"
                    )
                    summary.errors.append(ValidationError(question_id=int(qid or 0), error_type=err_type, message=err_msg))
            else:
                summary.passed_questions += 1
                ana = str(q.get("ana_konu", ""))
                alt = str(q.get("alt_konu", ""))
                c_code = str(q.get("ders_kodu", ""))
                summary.topic_distribution[ana] = summary.topic_distribution.get(ana, 0) + 1
                summary.subtopic_distribution[alt] = summary.subtopic_distribution.get(alt, 0) + 1
                summary.course_distribution[c_code] = summary.course_distribution.get(c_code, 0) + 1
                unit_sub_counts[ana][alt] += 1

        for unit, sub_counts in unit_sub_counts.items():
            unit_total = sum(sub_counts.values())
            if unit_total >= 30:
                for sub, count in sub_counts.items():
                    pct = (count / unit_total) * 100
                    if pct > 35.0:
                        summary.warnings.append(
                            f"Entropy warning: '{sub}' contains {count}/{unit_total} ({pct:.1f}%) questions in '{unit}'"
                        )

        return summary

    def print_summary(self, summary: ValidationSummary, verbose: bool = False, quiet: bool = False) -> None:
        """Prints formatted console report with breakdown tables and error listings."""
        if quiet and summary.is_valid:
            print("Taxonomy validation: OK")
            return

        status = "PASSED" if summary.is_valid else "FAILED"
        print(f"\n================ Tarih Taxonomy Validation: {status} ================")
        print(f"Total: {summary.total_questions} | Passed: {summary.passed_questions} | Failed: {summary.failed_questions}")

        if summary.warnings:
            print(f"\nWarnings ({len(summary.warnings)}):")
            for w in summary.warnings:
                print(f"  [WARN] {w}")

        if not summary.is_valid:
            print(f"\nErrors ({len(summary.errors)}):")
            limit = len(summary.errors) if verbose else min(20, len(summary.errors))
            for err in summary.errors[:limit]:
                print(f"  [ERR] {err.message}")
            if not verbose and len(summary.errors) > 20:
                print(f"  ... and {len(summary.errors) - 20} more errors (run with --verbose to view all)")

        if verbose and summary.course_distribution:
            print("\nCourse Distribution:")
            for c, cnt in sorted(summary.course_distribution.items()):
                print(f"  Course {c}: {cnt}")


def validate_tarih_questions(
    questions: List[Dict[str, Any]], strict: bool = True, map_path: str = "scripts/tarih_taxonomy_map.json"
) -> ValidationSummary:
    """Helper function to validate question list."""
    validator = HistoryTaxonomyValidator(map_path)
    return validator.validate_questions(questions, strict_bounds=strict)


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate AÖL Tarih curriculum taxonomy map and questions.")
    parser.add_argument("--map-path", "-m", default="scripts/tarih_taxonomy_map.json", help="Path to taxonomy map JSON")
    parser.add_argument("--data-path", "-d", default=None, help="Path to questions master JSON")
    parser.add_argument("--batch-path", "-b", default=None, help="Path to batch JSON")
    parser.add_argument("--check-map-only", "--map-only", dest="map_only", action="store_true", help="Validate taxonomy map only")
    parser.add_argument("--lenient-bounds", action="store_true", help="Disable strict course boundary checks")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose details")
    parser.add_argument("--quiet", "-q", action="store_true", help="Minimal output")

    args = parser.parse_args()
    validator = HistoryTaxonomyValidator(args.map_path)

    if args.map_only or (not args.data_path and not args.batch_path):
        map_errors = validator.validate_taxonomy_map()
        if map_errors:
            print(f"Taxonomy map validation FAILED ({len(map_errors)} errors):", file=sys.stderr)
            for err in map_errors:
                print(f"  - {err}", file=sys.stderr)
            sys.exit(1)
        if not args.quiet:
            print(f"Taxonomy map '{args.map_path}' validation PASSED (10 units, 45 subtopics, 0 errors).")
        sys.exit(0)

    target_file = Path(args.batch_path or args.data_path)
    if not target_file.exists():
        print(f"Fatal: target file not found: {target_file}", file=sys.stderr)
        sys.exit(2)

    try:
        with open(target_file, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"Fatal: failed to read JSON from {target_file}: {e}", file=sys.stderr)
        sys.exit(2)

    if not isinstance(data, list):
        print(f"Fatal: expected list of question dictionaries, got {type(data).__name__}", file=sys.stderr)
        sys.exit(2)

    is_master = bool(args.data_path and not args.batch_path)
    questions_to_validate = [
        q for q in data if q.get("ders_kodu") in VALID_COURSES or str(q.get("ders", "")).strip() in VALID_COURSES.values()
    ] if is_master else data

    summary = validator.validate_questions(questions_to_validate, strict_bounds=not args.lenient_bounds)
    validator.print_summary(summary, verbose=args.verbose, quiet=args.quiet)
    sys.exit(0 if summary.is_valid else 1)


if __name__ == "__main__":
    main()
