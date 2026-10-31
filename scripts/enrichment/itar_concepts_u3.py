#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""AÖF İlk Dönem İslâm Tarihi 3. Ünite Kavramları."""

from typing import Any, Dict, List

UNIT3_CONCEPTS: List[Dict[str, Any]] = [
    {
        "id": "itar_ilk_vahiy",
        "term": "İlk Vahiy ve Alak Sûresi",
        "unite_no": 3,
        "tanim": "610 yılı Ramazan ayında Hira Mağarası'nda Cebrâil vasıtasıyla indirilen 'Yaratan Rabbinin adıyla oku!' nidasıyla başlayan Alak Sûresi'nin ilk 5 âyetidir. Vahyin bir süre kesilmesine **Fetret-i Vahy** denir.\n💡 Sınav Şifresi: 610 + Hira + Cebrâil + İkra' = **İlk Vahiy**; Kesintiye uğraması = **Fetret-i Vahy**.",
        "pattern": r"ilk vahiy[a-zçğıöşü]*|alak s[uû]resi[a-zçğıöşü]*|fetret-i vahy[a-zçğıöşü]*|fetret[üu][’'‘]l-vahy",
    },
    {
        "id": "itar_darul_erkam",
        "term": "Dârü'l-Erkam (İlk Karargâh ve Tebliğ Merkezi)",
        "unite_no": 3,
        "tanim": "Erkam b. Ebi'l-Erkam'ın Safâ Tepesi eteğindeki evi olup, gizli davet döneminde Müslümanların toplanıp ibadet ettikleri, Hz. Hamza ve Hz. Ömer'in Müslüman olduğu ilk eğitim merkezidir.\n💡 Sınav Şifresi: Safâ eteğindeki gizli tebliğ karargâhı / Dârü'l-İslâm = **Dârü'l-Erkam**.",
        "pattern": r"d[aâ]r[üu][’'‘\s-]?l-erkam[a-zçğıöşü]*|[dD]ârülerkam|[dD]arulerkam|erkam b\.\s*ebi[’'‘]l-erkam",
    },
    {
        "id": "itar_habesistan_hicreti",
        "term": "Habeşistan Hicretleri",
        "unite_no": 3,
        "tanim": "Müşriklerin işkencelerine karşı 615 ve 616 yıllarında adil Hristiyan hükümdar Necâşî Ashame'nin ülkesine yapılan iki kafilelik hicrettir. Câfer b. Ebî Tâlib Necâşî'ye Meryem Sûresi'ni okumuştur.\n💡 Sınav Şifresi: İlk hicret yurdu + adil hükümdar Necâşî Ashame = **Habeşistan Hicreti**.",
        "pattern": r"habeşistan[a-zçğıöşü]*|nec[aâ]ş[iî][a-zçğıöşü]*|necaşi[a-zçğıöşü]*",
    },
    {
        "id": "itar_kureys_ambargosu",
        "term": "Şi'b-i Ebî Tâlib (Boykot ve Ambargo)",
        "unite_no": 3,
        "tanim": "Kureyş müşriklerinin Hz. Peygamber'i kendilerine teslim etmeyen Hâşimoğulları ve Müslümanlara karşı 3 yıl boyunca (616-619) uyguladığı evlilik, ticaret ve görüşme yasağı içeren tecrittir.\n💡 Sınav Şifresi: 3 yıl süren tecrit ve açlık ablukası = **Şi'b-i Ebî Tâlib (Ambargo)**.",
        "pattern": r"şi[‘'`]b-i eb[iî] t[aâ]lib[a-zçğıöşü]*|ambargo[a-zçğıöşü]*|boykot[a-zçğıöşü]*",
    },
    {
        "id": "itar_huzun_yili",
        "term": "Hüzün Yılı (Senetü'l-Hüzn)",
        "unite_no": 3,
        "tanim": "Ambargonun kalkmasından kısa bir süre sonra (620 yılında) Hz. Peygamber'i müşriklere karşı koruyan amcası Ebû Tâlib ile en büyük destekçisi eşi Hz. Hatice'nin peş peşe vefat ettiği yıldır.\n💡 Sınav Şifresi: Ebû Tâlib + Hz. Hatice'nin vefatı = **Senetü'l-Hüzn (Hüzün Yılı)**.",
        "pattern": r"h[üu]z[üu]n y[ıi]l[ıi][a-zçğıöşü]*|senet[üu][’'‘]l-h[üu]zn[a-zçğıöşü]*",
    },
    {
        "id": "itar_taif_yolculugu",
        "term": "Tâif Yolculuğu ve Addâs",
        "unite_no": 3,
        "tanim": "Hz. Peygamber'in Zeyd b. Hârise ile destek aramak için gittiği Tâif'te Sakîflilerce taşlanması, Addâs'ın Müslüman olması ve Mut'im b. Adî himayesinde Mekke'ye dönebilmesidir.\n💡 Sınav Şifresi: Sakîf kabilesinin taşlaması + köle Addâs + Mut'im b. Adî güvencesi = **Tâif Yolculuğu**.",
        "pattern": r"t[aâ]if yolculu[gğ][uü][a-zçğıöşü]*|t[aâ]if seferi[a-zçğıöşü]*|add[aâ]s\b|mut[‘'`]im b\.\s*[‘'`]?ad[iî]",
    },
    {
        "id": "itar_isra_ve_mirac",
        "term": "İsrâ ve Mi'râc Mucizesi",
        "unite_no": 3,
        "tanim": "Hz. Peygamber'in Mescid-i Harâm'dan Kudüs'teki Mescid-i Aksâ'ya gece yürütülmesi (İsrâ) ve semaya yükseltilerek beş vakit namazın farz kılındığı ilahî tecellidir (Mi'râc).\n💡 Sınav Şifresi: Kudüs'e gece yürüyüşü = **İsrâ**; semaya yükseliş ve 5 vakit namaz = **Mi'râc**.",
        "pattern": r"isr[aâ] ve mi[‘'’]r[aâ]c|\bisr[aâ][a-zçğıöşü]*|\bmi[‘'’]r[aâ]c[a-zçğıöşü]*|mescid-i aks[aâ]|gece yolculu[gğ][uü]",
    },
    {
        "id": "itar_akabe_biatlari",
        "term": "Akabe Biatları (1. ve 2. Akabe)",
        "unite_no": 3,
        "tanim": "621'deki 1. Akabe'de 12 Medineli biat etmiş ('Kadınlar Biatı') ve Mus'ab b. Umeyr muallim gönderilmiştir. 622'deki 2. Akabe'de 75 Medineli Peygamber'i savunmaya ant içmiştir ('Savaş Biatı').\n💡 Sınav Şifresi: İlk Medineli öğretmen = **Mus'ab b. Umeyr**; Savunma ve hicret daveti = **2. Akabe Biatı**.",
        "pattern": r"akabe biat[a-zçğıöşü]*|birinci akabe|ikinci akabe",
    },
    {
        "id": "itar_hicret_sevr",
        "term": "Hicret ve Sevr Mağarası",
        "unite_no": 3,
        "tanim": "622'de Hz. Peygamber ve Hz. Ebû Bekir'in Medine'ye hicretidir. Sevr Mağarası'nda 3 gün gizlenmişler, Kubâ'da ilk mescidi inşa etmişler ve Ranûnâ'da ilk cuma namazını kılmışlardır.\n💡 Sınav Şifresi: Mağaradaki iki kişiden ikincisi = **Hz. Ebû Bekir (Sevr)**; İlk mescid = **Kubâ**.",
        "pattern": r"sevr ma[gğ]aras[ıi][a-zçğıöşü]*|\bhicret\b|hicret[a-zçğıöşü]*|göç etme[a-zçğıöşü]*",
    },
    {
        "id": "itar_musrikler_ve_sirk",
        "term": "Şirk ve Mekkeli Müşrikler",
        "unite_no": 3,
        "tanim": "Allah'ın varlığını kabul etmekle birlikte putları O'na ortak koşan ve şefaatçi edinen inançtır. Müşrikler kabilecilik taassubu, statü ve Kâbe gelirlerini kaybetme korkusuyla İslâm'a direnmiştir.\n💡 Sınav Şifresi: Allah'a ortak koşma = **Şirk / Müşrik**.",
        "pattern": r"müşrik[a-zçğıöşü]*|musrik[a-zçğıöşü]*|\bşirk\b",
    },
    {
        "id": "itar_acik_davet",
        "term": "Açık Davet ve Safâ Çağrısı",
        "unite_no": 3,
        "tanim": "'Sana emrolunanı açıkça bildir' (Hicr 94) ve 'En yakın akrabanı uyar' (Şuarâ 214) âyetlerinin ardından Hz. Peygamber'in Safâ Tepesi'ne çıkarak Kureyş'i alenen İslâm'a davet etmesidir.\n💡 Sınav Şifresi: Safâ Tepesi'nden aleni çağrı = **Açık Davet**.",
        "pattern": r"açık davet|aleni davet|safâ tepesi|safa tepesi|tebliğe kulak verme",
    },
    {
        "id": "itar_ebu_cehil",
        "term": "Ebû Cehil (Amr b. Hişâm)",
        "unite_no": 3,
        "tanim": "Mahzûmoğulları reisi, İslâm davetinin Mekke'deki baş düşmanı. Asıl adı Amr b. Hişâm iken düşmanlığı yüzünden Müslümanlarca 'Cehâletin Babası' (Ebû Cehil) denmiştir. Bedir Gazvesi'nde öldürülmüştür.\n💡 Sınav Şifresi: İslâm'ın baş düşmanı + Mahzûm reisi + Bedir'de öldürülen lider = **Ebû Cehil**.",
        "pattern": r"eb[uû] cehil[a-zçğıöşü]*|ebu cehil[a-zçğıöşü]*|amr b\.\s*hiş[aâ]m",
    },
    {
        "id": "itar_ebu_leheb",
        "term": "Ebû Leheb (Abdüluzzâ b. Abdülmuttalib)",
        "unite_no": 3,
        "tanim": "Hz. Peygamber'in öz amcası olmasına rağmen açık davetten itibaren en şiddetli muhalefeti yürüten ve Kur'an-ı Kerim'de Tebbet Sûresi ile elleri kurusun diye lânetlenen tek müşriktir.\n💡 Sınav Şifresi: Tebbet Sûresi ile kınanan öz amca = **Ebû Leheb**.",
        "pattern": r"eb[uû] leheb[a-zçğıöşü]*|ebu leheb[a-zçğıöşü]*",
    },
    {
        "id": "itar_musab_bin_umeyr",
        "term": "Mus'ab b. Umeyr (İslâm'ın İlk Muallimi)",
        "unite_no": 3,
        "tanim": "Kureyş'in zengin genciyken Müslüman olup her şeyden vazgeçen sahabi. 1. Akabe Biatı'ndan sonra Medine'ye ilk muallim olarak gönderilmiş, şehrin Müslüman olmasını sağlamış; Uhud'da sancaktarken şehit düşmüştür.\n💡 Sınav Şifresi: Medine'nin ilk muallimi + Uhud şehidi sancaktar = **Mus'ab b. Umeyr**.",
        "pattern": r"mus[‘'`]ab b\.\s*umeyr|musab bin umeyr",
    },
    {
        "id": "itar_bilal_i_habesi",
        "term": "Bilâl-i Habeşî (İslâm'ın İlk Müezzini)",
        "unite_no": 3,
        "tanim": "İslâm'ın ilk müezzini. Ümeyye b. Halef'in kızgın çöl taşları altında yaptığı işkencelere karşı 'Ehad! Ehad!' diyerek direnmiş, Hz. Ebû Bekir tarafından azat edilmiştir. Mekke fethinde Kâbe üstünde ilk ezanı okumuştur.\n💡 Sınav Şifresi: İlk müezzin + 'Ehad Ehad' direnişi + Kâbe'de ilk ezan = **Bilâl-i Habeşî**.",
        "pattern": r"bil[aâ]l-i habeş[iî][a-zçğıöşü]*|bilal[iî] habeşi[a-zçğıöşü]*|\bbil[aâ]l\b",
    },
    {
        "id": "itar_cafer_bin_ebi_talib",
        "term": "Câfer b. Ebî Tâlib (Zü'l-Cenâheyn)",
        "unite_no": 3,
        "tanim": "Hz. Ali'nin ağabeyi. Habeşistan hicretinde muhacirlerin sözcüsü olmuş, Kral Necâşî'nin huzurunda Meryem Sûresi'ni okumuştur. Mûte Savaşı'nda iki kolu kesilerek şehit düşmüş ('Zü'l-Cenâheyn') unvanını almıştır.\n💡 Sınav Şifresi: Habeşistan sözcüsü + Meryem Sûresi + Mûte kumandanı = **Câfer b. Ebî Tâlib**.",
        "pattern": r"c[aâ]fer b\.\s*eb[iî] t[aâ]lib|cafer bin ebi talib|c[aâ]fer b\.\s*eb[uû] talib|z[üu][’'‘]l-cen[aâ]heyn",
    },
    {
        "id": "itar_musrik_elebaslari",
        "term": "Müşrik Elebaşları (Ümeyye b. Halef, Utbe, Şeybe, Nadr b. Hâris)",
        "unite_no": 3,
        "tanim": "Mekke'de İslâm davetini bastırmak için çalışan müşrik liderleridir: Bilâl'in efendisi **Ümeyye b. Halef**, İran efsaneleri anlatıp Kur'an'ı karalayan **Nadr b. el-Hâris**, Kureyş hatibi **Utbe b. Rebîa** ve kardeşi **Şeybe**.\n💡 Sınav Şifresi: İran masallarıyla Kur'an'ı karalayan = **Nadr b. el-Hâris**; Bilâl'in işkencecisi = **Ümeyye b. Halef**.",
        "pattern": r"[üu]meyye b\.\s*halef|nadr b\.\s*el-h[aâ]ris|utbe b\.\s*reb[iî]a|utbe ve şeybe|as b\.\s*v[aâ]il|vel[iî]d b\.\s*mug[iî]re",
    },
    {
        "id": "itar_kuba_ve_ranuna",
        "term": "Kubâ Mescidi ve Ranûnâ (İlk Cuma)",
        "unite_no": 3,
        "tanim": "Hicret güzergâhında inşa edilen kutsal mekanlardır: İslâm tarihinde inşa edilen ilk mescid olan **Kubâ Mescidi** ve Hz. Peygamber'in Medine'ye girerken ilk Cuma namazını kıldırdığı **Ranûnâ Vadisi (Mescid-i Cuma)**.\n💡 Sınav Şifresi: İlk mescid = **Kubâ**; İlk Cuma namazı = **Ranûnâ (Mescid-i Cuma)**.",
        "pattern": r"mescid-i cuma|mescid-i cum[‘'’]a|ran[uû]n[aâ][a-zçğıöşü]*|kub[aâ] mescidi[a-zçğıöşü]*|\bkub[aâ]\b",
    },
    {
        "id": "itar_sureler",
        "term": "Önemli Sûreler (Kâfirûn, Mâûn, Kureyş, Fîl, İhlâs)",
        "unite_no": 3,
        "tanim": "İlk Dönem İslâm Tarihi olaylarıyla doğrudan irtibatlı Kur'an sûreleridir: Şirkten berî oluşu ilan eden **Kâfirûn**, yetim ve yoksulu doyurmayı emreden **Mâûn**, kervan güvenliğini anlatan **Kureyş**, Ebrehe ordusunu anlatan **Fîl** sûresidir.\n💡 Sınav Şifresi: Müşriklerin uzlaşma teklifine ret = **Kâfirûn**; Mekke kervanları = **Kureyş Sûresi**.",
        "pattern": r"k[aâ]fir[uû]n s[uû]resi|m[aâ]un s[uû]resi|kureyş s[uû]resi|kurayş s[uû]resi|f[iî]l s[uû]resi|fatiha s[uû]resi|ihlas s[uû]resi",
    },
]

