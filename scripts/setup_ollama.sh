#!/usr/bin/env bash
# ==============================================================================
# AÖL Cümle Röntgeni - Ollama & Model Hazırlık ve Başlatma Betiği
# AMD RX 6600M (RDNA2) GPU Hızlandırması Destekli
# ==============================================================================

set -e

echo "🚀 [1/4] Ollama Kurulumu Denetleniyor..."
if ! command -v ollama &> /dev/null; then
    echo "⚠️  Ollama bulunamadı. Kurulum başlatılıyor..."
    curl -fsSL https://ollama.com/install.sh | sh
    echo "✓ Ollama başarıyla kuruldu."
else
    echo "✓ Ollama zaten kurulu: $(command -v ollama)"
fi

echo ""
echo "⚙️  [2/4] AMD RX 6600M GPU Hızlandırma Ortamı Ayarlanıyor..."
# RX 6600M (Navi 23 / gfx1032) için ROCm uyumluluk bayrağı
export HSA_OVERRIDE_GFX_VERSION=10.3.0

echo ""
echo "🔌 [3/4] Ollama Servisi Kontrol Ediliyor..."
if ! curl -s http://localhost:11434/api/tags &> /dev/null; then
    echo "Ollama servisi arka planda başlatılıyor..."
    ollama serve > /dev/null 2>&1 &
    sleep 3
fi
echo "✓ Ollama servisi aktif (http://localhost:11434)."

echo ""
echo "📥 [4/4] Model İndiriliyor / Kontrol Ediliyor..."
MODEL_14B="qwen2.5:14b-instruct-q4_K_M"

echo "Hedef Model: ${MODEL_14B}"
ollama pull "${MODEL_14B}"

echo ""
echo "=============================================================================="
echo "🎉 TEBRİKLER! Sistem Cümle Röntgeni üretimi için %100 hazır."
echo "=============================================================================="
echo "Şimdi sırasıyla şu adımları uygulayabilirsiniz:"
echo ""
echo "1) Güvenli Test (Dry-run, sadece 5 soru, veri bozulmaz):"
echo "   python3 scripts/cumle_xray_pipeline.py --limit 5"
echo ""
echo "2) Üretilen HTML Denetim Raporunu Açıp İnceleyin:"
echo "   xdg-open scripts/ciktilar/xray_denetim_raporu.html"
echo ""
echo "3) İncelemeniz bittikten sonra CANLI ÜRETİMİ Başlatın:"
echo "   python3 scripts/cumle_xray_pipeline.py --live"
echo "=============================================================================="
