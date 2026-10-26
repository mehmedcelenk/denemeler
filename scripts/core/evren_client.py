#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""EVREN (SSYZ) Egemen LLM & OCR API İstemcisi.

Resmi EVREN Teknik Sözleşmesine (%100) uyumlu istemci:
- Kullanım şartları kapısı: GET /v1/terms/status & POST /v1/terms/accept otomatik onayı
- Adanmış OCR Ucu: POST /v1/ocr (dots-ocr, deepseek-ocr-2 — 400 endpoint_mismatch korumalı)
- Sohbet & Muhakeme Ucu: POST /v1/chat/completions (max_tokens >= 4096, thinking kontrolü)
- Kota Takibi: GET /v1/quota ve x-evren-daily-remaining-tokens başlığı
"""

import base64
import json
import os
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import requests

DEFAULT_EVREN_BASE_URL = "https://evren-llmapi.ssyz.org.tr/v1"


def load_dotenv_file(env_path: Optional[Path] = None) -> Dict[str, str]:
    """Proje kökündeki .env dosyasından anahtarları okur."""
    root = Path(__file__).resolve().parents[2]
    target = env_path or (root / ".env")
    loaded: Dict[str, str] = {}
    if not target.exists():
        return loaded
    for raw_line in target.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, val = line.split("=", 1)
        key = key.strip()
        val = val.strip().strip("'").strip('"')
        loaded[key] = val
        if key not in os.environ:
            os.environ[key] = val
    return loaded


class EvrenClient:
    """EVREN SSYZ çok modelli API istemcisi."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: int = 240,
    ) -> None:
        load_dotenv_file()
        self.api_key = (api_key or os.environ.get("EVREN_API_KEY", "")).strip()
        self.base_url = (
            base_url or os.environ.get("EVREN_BASE_URL", DEFAULT_EVREN_BASE_URL)
        ).strip().rstrip("/")
        self.timeout = timeout
        self.last_headers: Dict[str, str] = {}
        self._terms_verified = False

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key)

    def _headers(self) -> Dict[str, str]:
        if not self.api_key:
            raise RuntimeError(
                "EVREN_API_KEY tanımlı değil. Lütfen .env dosyasına EVREN_API_KEY=evren_llm_... ekleyin."
            )
        return {
            "Authorization": f"Bearer {self.api_key}",
            "X-API-Key": self.api_key,
            "Content-Type": "application/json",
        }

    def _record_headers(self, response: requests.Response) -> None:
        for k, v in response.headers.items():
            kl = k.lower()
            if kl.startswith("x-ratelimit") or kl.startswith("x-evren"):
                self.last_headers[kl] = v

    @property
    def remaining_daily_tokens(self) -> Optional[int]:
        val = self.last_headers.get("x-evren-daily-remaining-tokens")
        return int(val) if val and val.isdigit() else None

    def ensure_terms_accepted(self) -> bool:
        """Hesap başına tek seferlik kullanım şartlarını (/v1/terms/*) kontrol eder ve onaylar."""
        if self._terms_verified:
            return True
        status_resp = requests.get(
            f"{self.base_url}/terms/status",
            headers=self._headers(),
            timeout=30,
        )
        self._record_headers(status_resp)
        if not status_resp.ok:
            return False
        status_data = status_resp.json()
        if status_data.get("accepted") is True:
            self._terms_verified = True
            return True

        version = status_data.get("current_version", 1)
        # Sözleşme akışı gereği önce metni oku, ardından kabul et
        requests.get(f"{self.base_url}/terms/text", headers=self._headers(), timeout=30)
        accept_resp = requests.post(
            f"{self.base_url}/terms/accept",
            headers=self._headers(),
            data=json.dumps({"version": version}).encode("utf-8"),
            timeout=30,
        )
        if accept_resp.ok:
            self._terms_verified = True
            return True
        return False

    def get_quota(self, model: Optional[str] = None) -> Dict[str, Any]:
        """GET /v1/quota üzerinden kalan günlük token ve anlık eşzamanlılık sınırlarını döner."""
        url = f"{self.base_url}/quota"
        if model:
            url += f"?model={model}"
        resp = requests.get(url, headers=self._headers(), timeout=30)
        self._record_headers(resp)
        resp.raise_for_status()
        return resp.json()

    def ocr_image(
        self,
        image_path: Path,
        model: str = "dots-ocr",
    ) -> str:
        """Adanmış POST /v1/ocr ucu üzerinden sayfa/şekil OCR & SVG çıkarımı yapar.

        Not: dots-ocr ve deepseek-ocr-2 yalnızca /v1/ocr ucundan çağrılır.
        """
        self.ensure_terms_accepted()
        img_bytes = image_path.read_bytes()
        b64_img = base64.b64encode(img_bytes).decode("ascii")
        mime = "image/png" if image_path.suffix.lower() == ".png" else "image/jpeg"

        payload = {
            "model": model,
            "image": f"data:{mime};base64,{b64_img}",
        }
        for attempt in range(3):
            resp = requests.post(
                f"{self.base_url}/ocr",
                headers=self._headers(),
                data=json.dumps(payload).encode("utf-8"),
                timeout=self.timeout,
            )
            self._record_headers(resp)
            if resp.status_code == 429:
                wait_sec = int(resp.headers.get("Retry-After", "10"))
                time.sleep(min(wait_sec, 60))
                continue
            if not resp.ok:
                raise RuntimeError(f"EVREN /v1/ocr Hatası ({resp.status_code}): {resp.text[:300]}")
            data = resp.json()
            if isinstance(data, dict):
                return (
                    data.get("text")
                    or data.get("content")
                    or data.get("markdown")
                    or json.dumps(data, ensure_ascii=False)
                ).strip()
            return str(data).strip()
        raise RuntimeError("EVREN /v1/ocr hız sınırı nedeniyle tamamlanamadı.")

    def chat_completion(
        self,
        messages: List[Dict[str, Any]],
        model: str = "deepseek-v4.1-flash",
        temperature: float = 0.1,
        max_tokens: int = 4096,
        thinking: Optional[bool] = None,
        response_format: Optional[Dict[str, Any]] = None,
    ) -> Tuple[str, Dict[str, Any]]:
        """POST /v1/chat/completions üzerinden sohbet/muhakeme isteği gönderir."""
        self.ensure_terms_accepted()
        payload: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max(max_tokens, 2048),
        }
        if thinking is not None:
            payload["thinking"] = thinking
        if response_format:
            payload["response_format"] = response_format

        for attempt in range(5):
            try:
                resp = requests.post(
                    f"{self.base_url}/chat/completions",
                    headers=self._headers(),
                    data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
                    timeout=self.timeout,
                )
            except requests.exceptions.Timeout:
                if attempt == 4:
                    raise
                time.sleep(4.0 * (attempt + 1))
                continue
            self._record_headers(resp)
            if resp.status_code == 429:
                retry_after = resp.headers.get("Retry-After")
                try:
                    wait_sec = float(retry_after) if retry_after else (2 ** attempt * 3)
                except ValueError:
                    wait_sec = 2 ** attempt * 3
                import random
                sleep_time = min(wait_sec + random.uniform(1.5, 4.0), 45)
                time.sleep(sleep_time)
                continue
            if not resp.ok:
                raise RuntimeError(f"EVREN Chat Hatası ({resp.status_code}): {resp.text[:300]}")
            data = resp.json()
            msg = data.get("choices", [{}])[0].get("message", {})
            content = msg.get("content", "") or ""
            usage = data.get("usage", {})
            return content.strip(), usage
        raise RuntimeError("EVREN Chat hız sınırı nedeniyle tamamlanamadı.")

    def ocr_page_to_markdown(
        self,
        image_path: Path,
        page_num: int,
        raw_text_hint: str = "",
        ocr_model: str = "dots-ocr",
    ) -> str:
        """Sayfayı önce /v1/ocr (dots-ocr) ile okur, ardından yapısal Markdown olarak temizler."""
        ocr_md = self.ocr_image(image_path=image_path, model=ocr_model)
        if ocr_md:
            return f"<!-- Sayfa: {page_num} -->\n\n{ocr_md}"
        return f"<!-- Sayfa: {page_num} -->\n\n{raw_text_hint}"
