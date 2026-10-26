#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""MEB Kelam 1 Atomik, Sıfırdan Öğreten ve Sınav Şifreli Kavram Katalogu."""

from typing import Any, Dict, List

PRECISE_KLM1_CONCEPTS: List[Dict[str, Any]] = [
    {
        "id": "klm1_kelam_ve_fikh_i_ekber",
        "term": "Kelam İlmi ve Fıkh-ı Ekber",
        "sayfa": 12,
        "tanim": "İslam inanç esaslarını ayet ve hadislerden hareketle belirleyip **akli ve mantıki delillerle** savunan ilimdir. İmam-ı Azam Ebu Hanife, inanç esaslarını ibadetlerden daha temel gördüğü için bu ilme **'En Büyük Fıkıh' (el-Fıkhü'l-Ekber)** adını vermiştir.\n💡 Sınav Şifresi: Kelamın diğer adları: **İlm-i Tevhid, İlm-i Akaid, Usûlü'd-Din ve Fıkh-ı Ekber**'dir.",
        "pattern": r"kelam ilmi[a-zçğıöşü]*|fıkh-ı ekber|ilm-i kelam|ilm-i tevhid|usûlü'd-din",
    },
    {
        "id": "klm1_kelam_ekolleri_mutezile",
        "term": "Mutezile Ekolü ve Usûl-i Hamse",
        "sayfa": 24,
        "tanim": "Vâsıl b. Atâ tarafından kurulan, naklin yanında **akla çok geniş bir hakemlik alanı** tanıyan ilk rasyonel kelam ekolüdür.\n💡 Sınav Şifresi: Mutezile'nin $5$ temel ilkesi (**Usûl-i Hamse**): *Tevhid, Adalet, Va'd ve Va'îd, el-Menzile beyne'l-menzileteyn (büyük günah işleyen iman ile küfür arasındadır), Emr-i bi'l-ma'rûf*.",
        "pattern": r"mutezile|vasıl b\. ata|usûl-i hamse",
    },
    {
        "id": "klm1_ehl_i_sunnet_maturidi_esari",
        "term": "Ehl-i Sünnet Kelamı: Mâtürîdîlik ve Eş'arîlik",
        "sayfa": 28,
        "tanim": "Kur'an ve Sünneti merkeze alıp aklı vahyin ışığında kullanan ana omurgadır: Semerkant'ta **İmam Mâtürîdî** akla ve cüz'î iradeye geniş yer verirken, Bağdat'ta **İmam Eş'arî** nakli önceler.\n💡 Sınav Şifresi: Mâtürîdîlikte **Tekvin (Yaratma)** Allah'ın ezeli ve müstakil $8.$ sübûtî sıfatıdır!",
        "pattern": r"ehl-i sünnet|mâtürîdî|eş'arî|maturidi|eşari|tekvin",
    },
    {
        "id": "klm1_bilgi_kaynaklari_kelam",
        "term": "Kelamda Bilgi Vasıtaları (Akl-ı Selim, Havass-ı Selime, Haber-i Sadık)",
        "sayfa": 36,
        "tanim": "Kelama göre insanı kesin bilgiye ulaştıran $3$ sağlam kanal vardır: **Akl-ı Selîm** (sağlam akıl), **Havâss-ı Selîme** (beş duyu) ve **Haber-i Sâdık** (Vahiy ve Mütevatir haber).\n💡 Sınav Şifresi: Keşif, ilham ve rüya sübjektif olduğu için kelamda **bağlayıcı bilgi delili sayılmaz**!",
        "pattern": r"akl-ı selim|akl-ı selîm|havass-ı selime|havass-ı selîme|haber-i sadık|haber-i sâdık|mütevatir haber|selim akıl",
    },
    {
        "id": "klm1_zaruri_ve_nazari_bilgi",
        "term": "Zaruri (Bedihî) ve Nazarî (İktisabî) Bilgi",
        "sayfa": 35,
        "tanim": "Hiç düşünmeye gerek kalmadan zihnin anında kavradığı apaçık bilgiye **Zarurî (Bedihî) Bilgi** (*'Bütün parçadan büyüktür'*, acıkma, üşüme); araştırma ve akıl yürütmeyle kazanılan bilgiye **Nazarî (İstidlâlî / Kesbî) Bilgi** denir.\n💡 Sınav Şifresi: İspatsız kendiliğinden oluşan $\\to$ **Zarurî/Bedihî**; Çaba ve delille kazanılan $\\to$ **Nazarî/İktisabî**!",
        "pattern": r"zaruri \(bedihi\)|nazari \(istidlâlî\)|bedihi bilgi|zaruri bilgi|nazari bilgi|iktisabî",
    },
    {
        "id": "klm1_hudus_delili",
        "term": "Hudûs Delili (Sonradan Yaratılış Delili)",
        "sayfa": 42,
        "tanim": "Evrendeki her maddenin (**cevher ve arazın**) sürekli değişmesinden ve **sonradan var olmasından (hâdis)** yola çıkarak, onu yoktan var eden ezeli bir Yaratıcı'nın (**Muhdis / Allah**) varlığını kanıtlayan delildir.\n💡 Sınav Şifresi: Soruda **'sonradan var olma, hâdis, değişim, yokken var edilme'** geçiyorsa cevap kesinlikle **Hudûs Delili**'dir!",
        "pattern": r"hudûs delili|hudus delili|hâdis|hadis \(yaratılmış\)|cevher ve araz",
    },
    {
        "id": "klm1_imkan_delili",
        "term": "İmkân Delili (Zorunlu ve Mümkün Varlık)",
        "sayfa": 44,
        "tanim": "İbn Sina ve kelamcıların geliştirdiği delildir: Evrendeki varlıkların var olması ile yok olması eşittir (**Mümkün Varlık**); terazi kefesini 'varlık' tarafına ağırlaştıran, varlığı kendinden zorunlu bir **Vâcibü'l-Vücud (Allah)** olmak zorundadır.\n💡 Sınav Şifresi: Soruda **'mümkün varlık, zorunlu varlık, Vâcibü'l-Vücud'** geçiyorsa cevap **İmkân Delili**'dir!",
        "pattern": r"imkân delili|imkan delili|vâcibü'l-vücud|zorunlu varlık|mümkün varlık",
    },
    {
        "id": "klm1_gaye_ve_nizam_delili",
        "term": "Gaye ve Nizam (İnayet) Delili",
        "sayfa": 46,
        "tanim": "Atomdan galaksilere ve DNA şifresine kadar evrendeki **hassas ölçü, matematiksel düzen (ince ayar / Fine-Tuning) ve amacın** tesadüfen oluşamayacağını, sonsuz ilim sahibi Yaratıcı'yı kanıtladığını savunan delildir.\n💡 Sınav Şifresi: Soruda **'düzen, ahenk, ölçü, amaç, tasarım'** vurgusu varsa cevap **Gaye ve Nizam (İnayet) Delili**'dir!",
        "pattern": r"gaye ve nizam|inayet delili|düzen ve nizam",
    },
    {
        "id": "klm1_allahin_sifatlari",
        "term": "Allah'ın Zâtî ve Sübûtî Sıfatları",
        "sayfa": 54,
        "tanim": "Yalnız Allah'a has olan $6$ sıfat **Zâtî Sıfatlar** (*Vücud, Kıdem, Bekâ, Vahdaniyet, Muhalefetün li'l-havâdis, Kıyam bi-nefsihi*); kemâl bildiren $8$ sıfat **Sübûtî Sıfatlar**'dır (*Hayat, İlim, Semi, Basar, İrade, Kudret, Kelam, Tekvin*).\n💡 Sınav Şifresi: **Kıdem** = Başlangıcı olmamak (Ezelî); **Bekâ** = Sonu olmamak (Ebedî); **Muhalefetün li'l-havâdis** = Yaratılmış hiçbir şeye benzememek!",
        "pattern": r"zâtî sıfatlar|sübûtî sıfatlar|kıdem|bekâ|vahdaniyet|muhalefetün li'l-havâdis|kıyam bi-nefsihi",
    },
]
