#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""AÖF İlk Dönem İslâm Tarihi 2. Ünite Kavramları."""

from typing import Any, Dict, List

UNIT2_CONCEPTS: List[Dict[str, Any]] = [
    {
        "id": "itar_fil_vakasi",
        "term": "Fil Vak'ası (Âmü'l-Fîl)",
        "unite_no": 2,
        "tanim": "Yemen Valisi Ebrehe'nin Kâbe'yi yıkmak amacıyla fillerle Mekke'ye saldırması ve Yüce Allah'ın Ebâbil kuşlarıyla orduyu helak etmesi olayıdır. Araplar bu yılı takvim başlangıcı saymıştır.\n💡 Sınav Şifresi: Hicret öncesi tarih belirlemede referans alınan olay = **Fil Vak'ası (Fîl Sûresi)**.",
        "pattern": r"fil vak[‘'’]as[ıi][a-zçğıöşü]*|[aâ]m[üu][’'‘]l-f[iî]l|ebrehe[a-zçğıöşü]*|fil s[uû]resi[a-zçğıöşü]*|hicri takvimden önce tarih belirleme",
    },
    {
        "id": "itar_hilful_fudul",
        "term": "Hilfü'l-Fudûl (Erdemliler İttifakı)",
        "unite_no": 2,
        "tanim": "Âs b. Vâil'in Yemenli tüccarın hakkını gasbetmesi üzerine, Abdullah b. Cüd'ân'ın evinde toplanıp zulme uğrayan herkesin hakkını savunmaya ant içen cemiyettir. Hz. Peygamber 20 yaşında katılmıştır.\n💡 Sınav Şifresi: Abdullah b. Cüd'ân'ın evi + haksızlığa uğrayanı koruma yemini = **Hilfü'l-Fudûl**.",
        "pattern": r"hilf[üu][’'‘\s-]?l-fud[uû]l[a-zçğıöşü]*|erdemliler ittifak[ıi][a-zçğıöşü]*|erdemli insanların yemini|haksızlıklara son vermek|zulme uğrayan",
    },
    {
        "id": "itar_rahip_bahira",
        "term": "Râhip Bahîrâ ve Busrâ Seyahati",
        "unite_no": 2,
        "tanim": "Hz. Peygamber 12 yaşındayken amcası Ebû Tâlib ile gittiği Şam kervanında, Busrâ manastırındaki Hristiyan rahip Bahîrâ onun sırtındaki peygamberlik mührünü ve alâmetlerini teşhis etmiştir.\n💡 Sınav Şifresi: Busrâ + 12 yaş ticaret seyahati + peygamberlik mührü = **Râhip Bahîrâ**.",
        "pattern": r"r[aâ]hip bah[iî]r[aâ][a-zçğıöşü]*|bah[iî]r[aâ][a-zçğıöşü]*",
    },
    {
        "id": "itar_kabe_hakemligi",
        "term": "Kâbe Hakemliği ve Hacerülesved",
        "unite_no": 2,
        "tanim": "35 yaşında Kâbe tamirinde Hacerülesved'i yerine koyma şerefi yüzünden kabileler arasındaki savaşı, taşı cübbesine koyup kabile reisleriyle birlikte taşıtarak adaletle çözen hakemliktir.\n💡 Sınav Şifresi: 35 yaş + Kâbe tamiri + Hacerülesved'in yerleştirilmesi = **Kâbe Hakemliği**.",
        "pattern": r"k[aâ]be hakemli[gğ]i[a-zçğıöşü]*|hacer[üu]lesved[a-zçğıöşü]*|hacer-i esved[a-zçğıöşü]*",
    },
    {
        "id": "itar_tahannus_hira",
        "term": "Tahannüs İbadeti ve Hira Mağarası",
        "unite_no": 2,
        "tanim": "Hz. Peygamber'in ilk vahiyden önce Ramazan aylarında Hira Mağarası'na çekilerek günahlardan arınma, tefekkür ve Hz. İbrahim'in tevhid inancı doğrultusunda yaptığı ibadettir.\n💡 Sınav Şifresi: Hira'da tefekkür ve uzlet ibadeti = **Tahannüs**.",
        "pattern": r"tahann[üu]s[a-zçğıöşü]*|hira ma[gğ]aras[ıi][a-zçğıöşü]*",
    },
    {
        "id": "itar_sutanne_halime",
        "term": "Sütanne Halîme ve Benî Sa'd",
        "unite_no": 2,
        "tanim": "Sağlıklı büyümesi ve fasih Arapça öğrenmesi amacıyla Hz. Peygamber'in Hevâzin kabilesinin Benî Sa'd b. Bekir koluna mensup Halîme bint Ebû Züeyb'e emanet edilmesidir.\n💡 Sınav Şifresi: Fasih Arapça + Sa'd b. Bekir kabilesi = **Sütanne Halîme**.",
        "pattern": r"hal[iî]me bint[a-zçğıöşü]*|hal[iî]me[a-zçğıöşü]*|ben[iî] sa[‘'’]d b\.\s*bekir|sütanne[a-zçğıöşü]*|süt anne[a-zçğıöşü]*",
    },
    {
        "id": "itar_ebva_vefati",
        "term": "Ebvâ ve Hz. Âmine'nin Vefatı",
        "unite_no": 2,
        "tanim": "Hz. Peygamber 6 yaşındayken Medine'deki akraba ziyaretinden dönerken annesi Âmine'nin hastalanıp vefat ettiği ve defnedildiği Mekke-Medine arasındaki menzildir.\n💡 Sınav Şifresi: 6 yaş + Âmine'nin vefat ettiği yer = **Ebvâ**.",
        "pattern": r"ebv[aâ]\b|ebva[a-zçğıöşü]*|annesi nerede hastalan[a-zçğıöşü]*",
    },
    {
        "id": "itar_hz_hatice",
        "term": "Hz. Hatice (Tâhire)",
        "unite_no": 2,
        "tanim": "Hz. Peygamber'in ilk eşi, ilk Müslüman ve müminlerin annesidir. İffet ve dürüstlüğünden dolayı Câhiliyede 'Tâhire' lakabıyla anılmıştır. Ticaret kervanlarını Hz. Peygamber'e emanet etmiş, 25 yıl evli kalmışlardır.\n💡 Sınav Şifresi: Tâhire lakaplı ilk mümin ve en büyük destekçi = **Hz. Hatice**.",
        "pattern": r"hz\.\s*hatice|\bhatice[a-zçğıöşü]*|\bt[aâ]hire\b|\btacire\b",
    },
    {
        "id": "itar_hicr_hatim",
        "term": "Hicr (Hatîm / Kâbe Taşması)",
        "unite_no": 2,
        "tanim": "Kâbe'nin kuzeybatı duvarı önündeki yarım daire şeklindeki duvardır. 605 yılındaki tamirde helal malzeme yetmediği için Kâbe binasına dahil edilemeyip dışarıda bırakılmıştır.\n💡 Sınav Şifresi: Malzeme yetersizliğinden Kâbe dışında kalan kutsal alan = **Hicr (Hatîm)**.",
        "pattern": r"\bhicr\b|hat[iî]m\b",
    },
    {
        "id": "itar_peygamberin_cocukluk_ve_gencligi",
        "term": "Hz. Peygamber'in Çocukluk ve Gençliği",
        "unite_no": 2,
        "tanim": "Hz. Peygamber Fil Yılı'nda Mekke'de doğmuş, 4 yaşına kadar sütanne yanında, 6 yaşına kadar annesi Âmine ile, 8 yaşına kadar dedesi Abdülmuttalib ile, ardından amcası Ebû Tâlib himayesinde büyümüştür.\n💡 Sınav Şifresi: Anne Âmine (6 yaş) $\\to$ Dede Abdülmuttalib (8 yaş) $\\to$ Amca Ebû Tâlib = **Himaye Sıralaması**.",
        "pattern": r"çocukluk dönemi|gençlik yıllar[ıi]|nerede doğmuştur|doğum tarihi|kutlu doğum",
    },
    {
        "id": "itar_abdulmuttalib",
        "term": "Abdülmuttalib (Şeybe b. Hâşim)",
        "unite_no": 2,
        "tanim": "Hz. Peygamber'in dedesi ve Kureyş reisi. Zemzem kuyusunu yeniden kazmış, Fil Vak'ası'nda Ebrehe'ye karşı Kâbe'yi savunmuştur. Doğumundan 8 yaşına kadar Peygamberimizi himaye etmiştir.\n💡 Sınav Şifresi: Zemzem'i çıkaran + 8 yaşına kadar Peygamber'i büyüten dede = **Abdülmuttalib**.",
        "pattern": r"abd[üu]lmuttalib[a-zçğıöşü]*|abdulmuttalip[a-zçğıöşü]*",
    },
    {
        "id": "itar_ebu_talib",
        "term": "Ebû Tâlib (Abdümenâf b. Abdülmuttalib)",
        "unite_no": 2,
        "tanim": "Hz. Peygamber'in amcası, Hz. Ali'nin babası. 8 yaşından itibaren vefatına kadar yeğenini canı pahasına himaye etmiş; Şam ticaret seyahatinde yanında götürmüş, Kureyş boykotunda Hâşimoğullarının başında direnmiştir.\n💡 Sınav Şifresi: 8 yaşından peygamberlik sonrasına dek en sadık hâmisi olan amca = **Ebû Tâlib**.",
        "pattern": r"eb[uû] t[aâ]lib[a-zçğıöşü]*|ebu talip[a-zçğıöşü]*",
    },
    {
        "id": "itar_fatima_bint_esed",
        "term": "Fâtıma bint Esed",
        "unite_no": 2,
        "tanim": "Ebû Tâlib'in eşi ve Hz. Ali'nin annesidir. Hz. Peygamber'e çocukluğunda öz annesi gibi şefkat göstermiş; Peygamberimiz onun hakkında 'Annemden sonraki annemdi' buyurarak Medine'de vefat ettiğinde kendi gömleğini ona kefen yapmıştır.\n💡 Sınav Şifresi: Peygamber'in 'Annemden sonraki annem' dediği amcasının eşi = **Fâtıma bint Esed**.",
        "pattern": r"f[aâ]t[ıi]ma bint esed",
    },
    {
        "id": "itar_zeyd_bin_harise",
        "term": "Zeyd b. Hârise",
        "unite_no": 2,
        "tanim": "Hz. Hatice'nin Peygamberimize hediye ettiği, Peygamberimizin azat edip evlat edindiği (Zeyd b. Muhammed) ilk Müslüman köledir. Kur'an'da adı açıkça geçen tek sahâbîdir (Ahzâb 37). Tâif'te siper olmuş, Mûte Savaşı'nın ilk şehit kumandanıdır.\n💡 Sınav Şifresi: Kur'an'da adı geçen tek sahabi + Mûte kumandanı = **Zeyd b. Hârise**.",
        "pattern": r"zeyd b\.\s*h[aâ]rise|zeyd bin h[aâ]rise",
    },
    {
        "id": "itar_varaka_bin_nevfel",
        "term": "Varaka b. Nevfel",
        "unite_no": 2,
        "tanim": "Hz. Hatice'nin amcasının oğlu olup putperestliği reddeden Hanîflerden ve kutsal metinleri bilen Hristiyan bilgindir. İlk vahiy sonrası Hz. Peygamber'i dinleyip ona gelenin 'Nâmûs-ı Ekber' (Cebrâil) olduğunu müjdelemiştir.\n💡 Sınav Şifresi: İlk vahyi tasdik eden Hristiyan Hanîf bilgin = **Varaka b. Nevfel**.",
        "pattern": r"varaka b\.\s*nevfel|varaka bin nevfel|\bvaraka\b",
    },
    {
        "id": "itar_usame_bin_zeyd",
        "term": "Üsâme b. Zeyd",
        "unite_no": 2,
        "tanim": "Zeyd b. Hârise'nin oğlu olup 'Hıbbü Resûlillâh' (Resûlullah'ın sevgilisi) unvanıyla tanınan genç sahâbîdir. Hz. Peygamber vefatından önce hazırladığı Bizans ordusuna henüz 18 yaşındayken başkumandan tayin etmiştir.\n💡 Sınav Şifresi: Peygamber'in vefat döşeğinde ordu komutanı tayin ettiği genç = **Üsâme b. Zeyd**.",
        "pattern": r"[üu]s[aâ]me bin zeyd|[üu]s[aâ]me b\.\s*zeyd",
    },
]

