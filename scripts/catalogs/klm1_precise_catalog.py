#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""MEB KLM_1 Yüksek Hassasiyetli Kanonik Kavram ve Terim Sözlüğü."""

from typing import Any, Dict, List

PRECISE_KLM1_CONCEPTS: List[Dict[str, Any]] = [
    {
        "id": 'klm1_kelam_ve_fikh_i_ekber',
        "term": 'Kelam İlmi ve Fıkh-ı Ekber',
        "sayfa": 12,
        "tanim": "İslam inanç esaslarını ayet ve hadislerden hareketle belirleyip **akli ve mantıki delillerle** savunan ilimdir. İmam-ı Azam Ebu Hanife, inanç esaslarını ibadetlerden daha temel gördüğü için bu ilme **'En Büyük Fıkıh' (el-Fıkhü'l-Ekber)** adını vermiştir.\n💡 Hile: Kelamın diğer adları: **İlm-i Tevhid, İlm-i Akaid, Usûlü'd-Din ve Fıkh-ı Ekber**'dir.",
        "pattern": "\\bkelam ilmi[a-zçğıöşü]*|\\bfıkh-ı ekber\\b|\\bilm-i kelam\\b|\\bilm-i tevhid\\b|\\busûlü'd-din\\b",
    },
    {
        "id": 'klm1_kelam_ekolleri_mutezile',
        "term": 'Mutezile Ekolü ve Usûl-i Hamse',
        "sayfa": 24,
        "tanim": "Vâsıl b. Atâ tarafından kurulan, naklin yanında **akla çok geniş bir hakemlik alanı** tanıyan ilk rasyonel kelam ekolüdür.\n💡 Hile: Mutezile'nin $5$ temel ilkesi (**Usûl-i Hamse**): *Tevhid, Adalet, Va'd ve Va'îd, el-Menzile beyne'l-menzileteyn (büyük günah işleyen iman ile küfür arasındadır), Emr-i bi'l-ma'rûf*.",
        "pattern": '\\bmutezile\\b|\\bvasıl b\\. ata\\b|\\busûl-i hamse\\b',
    },
    {
        "id": 'klm1_ehl_i_sunnet_maturidi_esari',
        "term": "Ehl-i Sünnet Kelamı: Mâtürîdîlik ve Eş'arîlik",
        "sayfa": 28,
        "tanim": "Kur'an ve Sünneti merkeze alıp aklı vahyin ışığında kullanan ana omurgadır: Semerkant'ta **İmam Mâtürîdî** akla ve cüz'î iradeye geniş yer verirken, Bağdat'ta **İmam Eş'arî** nakli önceler.\n💡 Hile: Mâtürîdîlikte **Tekvin (Yaratma)** Allah'ın ezeli ve müstakil $8.$ sübûtî sıfatıdır!",
        "pattern": "\\behl-i sünnet\\b|\\bmâtürîdî\\b|\\beş'arî\\b|\\bmaturidi\\b|\\beşari\\b|\\btekvin\\b",
    },
    {
        "id": 'klm1_bilgi_kaynaklari_kelam',
        "term": 'Kelamda Bilgi Vasıtaları (Akl-ı Selim, Havass-ı Selime, Haber-i Sadık)',
        "sayfa": 36,
        "tanim": 'Kelama göre insanı kesin bilgiye ulaştıran $3$ sağlam kanal vardır: **Akl-ı Selîm** (sağlam akıl), **Havâss-ı Selîme** (beş duyu) ve **Haber-i Sâdık** (Vahiy ve Mütevatir haber).\n💡 Hile: Keşif, ilham ve rüya sübjektif olduğu için kelamda **bağlayıcı bilgi delili sayılmaz**!',
        "pattern": '\\bakl-ı selim\\b|\\bakl-ı selîm\\b|\\bhavass-ı selime\\b|\\bhavass-ı selîme\\b|\\bhaber-i sadık\\b|\\bhaber-i sâdık\\b|\\bmütevatir haber\\b|\\bselim akıl\\b',
    },
    {
        "id": 'klm1_zaruri_ve_nazari_bilgi',
        "term": 'Zaruri (Bedihî) ve Nazarî (İktisabî) Bilgi',
        "sayfa": 35,
        "tanim": "Hiç düşünmeye gerek kalmadan zihnin anında kavradığı apaçık bilgiye **Zarurî (Bedihî) Bilgi** (*'Bütün parçadan büyüktür'*, acıkma, üşüme); araştırma ve akıl yürütmeyle kazanılan bilgiye **Nazarî (İstidlâlî / Kesbî) Bilgi** denir.\n💡 Hile: İspatsız kendiliğinden oluşan $\\to$ **Zarurî/Bedihî**; Çaba ve delille kazanılan $\\to$ **Nazarî/İktisabî**!",
        "pattern": '\\bzaruri \\(bedihi\\)|\\bnazari \\(istidlâlî\\)|\\bbedihi bilgi\\b|\\bzaruri bilgi\\b|\\bnazari bilgi\\b|\\biktisabî\\b',
    },
    {
        "id": 'klm1_hudus_delili',
        "term": 'Hudûs Delili (Sonradan Yaratılış Delili)',
        "sayfa": 42,
        "tanim": "Evrendeki her maddenin (**cevher ve arazın**) sürekli değişmesinden ve **sonradan var olmasından (hâdis)** yola çıkarak, onu yoktan var eden ezeli bir Yaratıcı'nın (**Muhdis / Allah**) varlığını kanıtlayan delildir.\n💡 Hile: Soruda **'sonradan var olma, hâdis, değişim, yokken var edilme'** geçiyorsa cevap kesinlikle **Hudûs Delili**'dir!",
        "pattern": '\\bhudûs delili\\b|\\bhudus delili\\b|\\bhâdis\\b|\\bhadis \\(yaratılmış\\)|\\bcevher ve araz\\b',
    },
    {
        "id": 'klm1_imkan_delili',
        "term": 'İmkân Delili (Zorunlu ve Mümkün Varlık)',
        "sayfa": 44,
        "tanim": "İbn Sina ve kelamcıların geliştirdiği delildir: Evrendeki varlıkların var olması ile yok olması eşittir (**Mümkün Varlık**); terazi kefesini 'varlık' tarafına ağırlaştıran, varlığı kendinden zorunlu bir **Vâcibü'l-Vücud (Allah)** olmak zorundadır.\n💡 Hile: Soruda **'mümkün varlık, zorunlu varlık, Vâcibü'l-Vücud'** geçiyorsa cevap **İmkân Delili**'dir!",
        "pattern": "\\bimkân delili\\b|\\bimkan delili\\b|\\bvâcibü'l-vücud\\b|\\bzorunlu varlık\\b|\\bmümkün varlık\\b",
    },
    {
        "id": 'klm1_gaye_ve_nizam_delili',
        "term": 'Gaye ve Nizam (İnayet) Delili',
        "sayfa": 46,
        "tanim": "Atomdan galaksilere ve DNA şifresine kadar evrendeki **hassas ölçü, matematiksel düzen (ince ayar / Fine-Tuning) ve amacın** tesadüfen oluşamayacağını, sonsuz ilim sahibi Yaratıcı'yı kanıtladığını savunan delildir.\n💡 Hile: Soruda **'düzen, ahenk, ölçü, amaç, tasarım'** vurgusu varsa cevap **Gaye ve Nizam (İnayet) Delili**'dir!",
        "pattern": '\\bgaye ve nizam\\b|\\binayet delili\\b|\\bdüzen ve nizam\\b',
    },
    {
        "id": 'klm1_allahin_sifatlari',
        "term": "Allah'ın Zâtî ve Sübûtî Sıfatları",
        "sayfa": 54,
        "tanim": "Yalnız Allah'a has olan $6$ sıfat **Zâtî Sıfatlar** (*Vücud, Kıdem, Bekâ, Vahdaniyet, Muhalefetün li'l-havâdis, Kıyam bi-nefsihi*); kemâl bildiren $8$ sıfat **Sübûtî Sıfatlar**'dır (*Hayat, İlim, Semi, Basar, İrade, Kudret, Kelam, Tekvin*).\n💡 Hile: **Kıdem** = Başlangıcı olmamak (Ezelî); **Bekâ** = Sonu olmamak (Ebedî); **Muhalefetün li'l-havâdis** = Yaratılmış hiçbir şeye benzememek!",
        "pattern": "\\bzâtî sıfatlar\\b|\\bsübûtî sıfatlar\\b|\\bkıdem\\b|\\bbekâ\\b|\\bvahdaniyet\\b|\\bmuhalefetün li'l-havâdis\\b|\\bkıyam bi-nefsihi\\b",
    },
    {
        "id": 'klm_itikadi_firkalar',
        "term": "İtikadî Fırkalar (Mutezile, Cebriyye, Eş'arilik, Matüridilik)",
        "sayfa": 85,
        "tanim": "Cebriyye insanın iradesizliğini; Mutezile aklı ve insanın fiilini yarattığını; Ehl-i Sünnet kulun seçip Allah'ın yarattığını savunur.\n💡 Hile: İnsan tamamen çaresiz rüzgarda yaprak = **Cebriyye**. İnsan kendi fiilini kendi yaratır (akılcı) = **Mutezile**. Ehl-i Sünnet: Kul seçer (irade), Allah yaratır.",
        "pattern": "\\bmutezile[a-zçğıöşü]*\\b|\\bcebriyye[a-zçğıöşü]*\\b|\\beş'arilik[a-zçğıöşü]*\\b|\\bmatüridilik[a-zçğıöşü]*\\b|\\bmürcie\\b|\\bMutezile\\b|\\bCebriyye\\b|\\bMürcie\\b",
        "option_only_pattern": '^Mutezile$|^Cebriyye$|^Mürcie$',
    },
]
