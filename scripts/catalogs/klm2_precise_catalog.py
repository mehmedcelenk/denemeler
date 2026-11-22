#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""MEB KLM_2 Yüksek Hassasiyetli Kanonik Kavram ve Terim Sözlüğü."""

from typing import Any, Dict, List

PRECISE_KLM2_CONCEPTS: List[Dict[str, Any]] = [
    {
        "id": 'klm2_itikadi_mezhepler',
        "term": 'İtikadî Mezhepler (Ehl-i Sünnet, Şia, Haricilik, Mürcie)',
        "sayfa": 14,
        "tanim": "Siyasi ve fikrî tartışmalardan doğan inanç ekolleridir: **Hariciler** büyük günah işleyeni tekfir eden (kâfir sayan) katı uç; **Mürcie** ise 'İmanla beraber hiçbir günah zarar vermez' diyerek ameli tamamen erteleyen gevşek uçtur.\n💡 Hile: **Ehl-i Sünnet** orta yolu (itidali) temsil eder: *Büyük günah işleyen dinden çıkmaz, günahkâr mümin (fâsık) olur*!",
        "pattern": '\\bdinî yorum[a-zçğıöşü]*|\\bitikadî mezhepler\\b|\\bharicilik\\b|\\bmürcie\\b|\\bzeydiyye\\b|\\bimamiyye\\b|\\bselefiyye\\b|\\bselef\\b|\\biman-amel ilişkisi\\b|\\bbüyük günah\\b|\\bkebîre\\b|\\bmürtekib-i kebire\\b',
    },
    {
        "id": 'klm2_deizm_ve_agnostisizm',
        "term": 'Deizm ve Agnostisizm (Güncel İnanç Problemleri)',
        "sayfa": 68,
        "tanim": "**Deizm** Allah'ın evreni tıpkı kurulu bir saat gibi yaratıp sonra kenara çekildiğini (vahiy, peygamber ve mucize göndermediğini) iddia eder; **Agnostisizm (Bilinemezcilik)** ise Tanrı'nın varlığının veya yokluğunun bilinemeyeceğini savunur.\n💡 Hile: **Tanrı var ama din/peygamber yok $\\to$ Deizm**; **Bilemeyiz/Şüphe $\\to$ Agnostisizm**; **Hiçbir değer ve anlam yok $\\to$ Nihilizm**; **Yalnız madde ve deney var $\\to$ Pozitivizm/Materyalizm**!",
        "pattern": '\\bdeizm\\b|\\bagnostisizm\\b|\\bsekülerizm\\b|\\bpozitivizm\\b|\\bnihilizm\\b|\\bkötülük problemi\\b|\\breenkarnasyon\\b',
    },
    {
        "id": 'klm2_berzah_ve_bas',
        "term": "Berzah (Kabir Hayatı) ve Ba's (Yeniden Diriliş)",
        "sayfa": 104,
        "tanim": "İnsanın vefatından kıyametin kopup yeniden diriltileceği güne kadar geçirdiği ara âleme **Berzah (Kabir Hayatı)**; İsrafil meleğin Sûr'a ikinci kez üflemesiyle bedenlerin yeniden diriltilmesine **Ba's** denir.\n💡 Hile: **Berzah** = Dünya ile ahiret arasındaki bekleme koridoru; **Ba's** = Ölümden sonra diriliş (*Ba'sü ba'de'l-mevt*).",
        "pattern": "\\bberzah\\b|\\bba's\\b",
    },
    {
        "id": 'klm2_hasr_mizan_sirat',
        "term": 'Haşr, Mahşer, Mizan, Sırat ve Şefaat',
        "sayfa": 108,
        "tanim": "Diriltilen insanların hesap vermek üzere toplanmasına **Haşr** (toplanılan büyük meydana **Mahşer**); amellerin tartıldığı ilahi adalet terazisine **Mizan**; cehennem üzerindeki köprüye **Sırat**; Hz. Peygamber'in müminlerin bağışlanması için Allah'tan izinle aracılık etmesine **Şefaat** denir.\n💡 Hile: **Haşr** = Toplanma, **Mahşer** = Meydan, **Mizan** = Terazi!",
        "pattern": '\\bhaşr\\b|\\bmahşer\\b|\\bmizan\\b|\\bsırat\\b|\\bşefaat\\b',
    },
    {
        "id": 'klm_cagdas_inanclar',
        "term": 'Çağdaş İnanç Akımları (Deizm, Ateizm, Agnostisizm, Politeizm)',
        "sayfa": 60,
        "tanim": "Deizm Tanrı'yı kabul edip dini reddeder; Ateizm Tanrı'yı inkar eder; Agnostisizm bilinemezcilik; Politeizm çoktanrıcılıktır.\n💡 Hile: 'Tanrı var ama peygamber/din yok' = **Deizm**. 'Tanrı kesinlikle yok' = **Ateizm**. 'Bilinemez, şüphedeyiz' = **Agnostisizm**. 'Çok ilah var' = **Politeizm**.",
        "pattern": '\\bdeizm[a-zçğıöşü]*\\b|\\bateizm[a-zçğıöşü]*\\b|\\bagnostisizm[a-zçğıöşü]*\\b|\\bpoliteizm[a-zçğıöşü]*\\b|\\bteizm[a-zçğıöşü]*\\b|\\bDeizm\\b|\\bAteizm\\b|\\bAgnostisizm\\b|\\bPoliteizm\\b|\\bTeizm\\b',
        "option_only_pattern": '^Deizm$|^Ateizm$|^Agnostisizm$|^Politeizm$|^Teizm$',
    },
]
