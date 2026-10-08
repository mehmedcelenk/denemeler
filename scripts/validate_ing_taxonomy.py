#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Validation engine for MEB AÖL English curriculum taxonomy and question classifications."""

import argparse
import json
from pathlib import Path
import sys
from typing import Dict, List, Set

VALID_ING_COURSES: Dict[int, str] = {
    181: "İNGİLİZCE – 1",
    182: "İNGİLİZCE – 2",
    243: "İNGİLİZCE – 3",
    244: "İNGİLİZCE – 4",
    501: "İNGİLİZCE – 5",
    502: "İNGİLİZCE – 6",
    503: "İNGİLİZCE – 7",
    504: "İNGİLİZCE – 8"
}

import re

FORBIDDEN_FALLBACK_TERMS: Set[str] = {
    "genel", "saptanamadı", "saptanamadi", "fallback",
    "muhtelif", "çeşitli", "cesitli", "karma", "tanımsız", "tanimsiz"
}

def is_forbidden_term(text: str) -> bool:
    lower = text.lower()
    for term in FORBIDDEN_FALLBACK_TERMS:
        if re.search(r'\b' + re.escape(term) + r'\b', lower):
            return True
    return False

class EnglishTaxonomyValidator:
    """Validator engine for MEB English taxonomy map and question classifications."""

    def __init__(self, map_path: str = "scripts/ing_taxonomy_map.json"):
        self.map_path = Path(map_path)
        self.map: Dict[str, List[str]] = {}
        self._load_error = None
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
        """Validates structure, formatting, unit numbers, and forbidden terms."""
        errors: List[str] = []
        if self._load_error:
            return [self._load_error]
        if len(self.map) != 8:
            errors.append(f"English taxonomy map must have exactly 8 units/semesters, found {len(self.map)}")

        for unit_key, subtopics in self.map.items():
            if is_forbidden_term(unit_key):
                errors.append(f"Forbidden term in unit title: '{unit_key}'")

            if not isinstance(subtopics, list) or len(subtopics) < 2:
                errors.append(f"Unit '{unit_key}' must have a list with at least 2 subtopics")
                continue

            for sub in subtopics:
                if is_forbidden_term(sub):
                    errors.append(f"Forbidden term in subtopic: '{sub}'")

        return errors

    def validate_questions(self, questions_path: str = "data/subjects/ING.json") -> List[str]:
        """Validates all English questions against the taxonomy rules."""
        errors: List[str] = []
        q_path = Path(questions_path)
        if not q_path.exists():
            return [f"Questions file not found: {q_path}"]

        with open(q_path, "r", encoding="utf-8") as f:
            questions = json.load(f)

        for i, q in enumerate(questions):
            q_id = q.get("id", f"idx_{i}")
            ana = q.get("ana_konu", "").strip()
            alt = q.get("alt_konu", "").strip()

            if not ana:
                errors.append(f"Question ID {q_id} missing 'ana_konu'")
            if not alt:
                errors.append(f"Question ID {q_id} missing 'alt_konu'")

            if is_forbidden_term(ana) or is_forbidden_term(alt):
                errors.append(f"Question ID {q_id} has forbidden fallback term: {ana} / {alt}")

        return errors

def main():
    parser = argparse.ArgumentParser(description="Validate MEB English taxonomy and questions.")
    parser.add_argument("--map-path", "-m", default="scripts/ing_taxonomy_map.json", help="Path to ing_taxonomy_map.json")
    parser.add_argument("--questions-path", "-q", default="data/subjects/ING.json", help="Path to ING.json")
    parser.add_argument("--check-map-only", action="store_true", help="Only validate taxonomy map structure")

    args = parser.parse_args()
    validator = EnglishTaxonomyValidator(args.map_path)
    map_errors = validator.validate_taxonomy_map()

    if map_errors:
        print("❌ English Taxonomy Map Validation FAILED:")
        for err in map_errors:
            print(f"  - {err}")
        sys.exit(1)

    print("✅ English Taxonomy Map validation PASSED")

    if not args.check_map_only:
        q_errors = validator.validate_questions(args.questions_path)
        if q_errors:
            print(f"❌ English Questions Validation FAILED ({len(q_errors)} errors):")
            for err in q_errors[:10]:
                print(f"  - {err}")
            sys.exit(1)
        print("✅ All English questions validation PASSED")

    sys.exit(0)

if __name__ == "__main__":
    main()
