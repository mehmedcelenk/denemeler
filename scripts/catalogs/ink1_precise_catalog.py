#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""MEB T.C. İnkılap Tarihi ve Atatürkçülük 1 (12. Sınıf 1. Dönem) Yüksek Hassasiyetli Kanonik Kavram ve Terim Sözlüğü."""

from typing import Any, Dict, List, Tuple

PRECISE_INK1_CONCEPTS: List[Dict[str, Any]] = [
    {
        "id": "ink1_birinci_dunya_savasi_bloklar",
        "term": "I. Dünya Savaşı Blokları ve İtalya",
        "sayfa": 14,
        "tanim": "Savaş öncesi **İttifak** (Almanya, Avusturya-Macaristan, İtalya) ve **İtilaf** (İngiltere, Fransa, Rusya) blokları kuruldu; İtalya, kendisine Batı Anadolu vadedilince **1915 Londra Gizli Antlaşması** ile saf değiştirip İtilaf'a geçti — tıpkı bir maçta kazanan tarafa geçen oyuncu gibi.\n💡 Sınav Şifresi: İtalya'nın taraf değiştirmesi = **Londra Gizli Antlaşması (1915)** + **Batı Anadolu vaadi**; İttifak'tan İtilaf'a geçen tek devlet.",
        "pattern": r"birinci dünya savaşı’nda taraf de- ğiştirerek|birinci dünya savaşı'nda taraf değiştirerek|itilaf devletleri grubuna katılan",
    },
    {
        "id": "ink1_mustafa_kemal_sehirler",
        "term": "Mustafa Kemal'in Fikir Hayatını Etkileyen Şehirler",
        "sayfa": 18,
        "tanim": "Mustafa Kemal'in eğitim şehirleri sırasıyla **Selanik** (Askerî Rüştiye), **Manastır** (Askerî İdadi) ve **İstanbul** (Harp Okulu ve Harp Akademisi); **Sofya** ise eğitim değil, 1913'te **Askerî Ataşemiliter** olarak görev yaptığı şehirdir.\n💡 Sınav Şifresi: **Sofya = görev yeri, eğitim yeri DEĞİL**; eğitim zinciri: Selanik → Manastır → İstanbul.",
        "pattern": r"mustafa kemal’in eğitim almak amacıyla|mustafa kemal'in eğitim almak amacıyla",
    },
    {
        "id": "ink1_kadin_kahramanlar",
        "term": "Millî Mücadele'nin Kadın Kahramanları",
        "sayfa": 32,
        "tanim": "İstiklal Harbi'nin kahraman kadınları: **Şerife Bacı** (İnebolu'dan Kastamonu'ya cephane taşırken kışlada donarak şehit oldu), **Gördesli Makbule**, **Kara Fatma (Fatma Seher)** ve **Tayyar Rahmiye** — her biri cephede ve cephe gerisinde destan yazdı.\n💡 Sınav Şifresi: **Cephane taşırken donarak şehit olan = Şerife Bacı**; İnebolu-Kastamonu hattı bu isimle kodlanır.",
        "pattern": r"^Şerife Bacı$|^Gördesli Makbule$|^Kara Fatma$|^Tayyar Rahmiye$|\\\\bşerife bacı\\\\b|\\\\bgördesli makbule\\\\b|\\\\bkara fatma\\\\b|\\\\btayyar rahmiye\\\\b",
    },
    {
        "id": "ink1_amasya_genelgesi",
        "term": "Amasya Genelgesi (22 Haziran 1919)",
        "sayfa": 38,
        "tanim": "Millî Mücadele'nin **gerekçesi** (vatanın bütünlüğü tehlikededir), **amacı** ve **yöntemi** (milletin bağımsızlığını yine milletin azim ve kararı kurtaracaktır) ilk kez burada açıklandı; ilk kez **millî egemenlikten** söz edildi ve **Sivas'ta millî bir kongre** toplanması kararlaştırıldı.\n💡 Sınav Şifresi: **'Gerekçe + amaç + yöntem' üçlüsü ilk kez = Amasya Genelgesi**; 'milletin azim ve kararı' cümlesi bu belgenin imzasıdır.",
        "pattern": r"amasya genelgesi|amasya tamimi",
    },
    {
        "id": "ink1_erzurum_kongresi",
        "term": "Erzurum Kongresi (23 Temmuz - 7 Ağustos 1919)",
        "sayfa": 42,
        "tanim": "**Toplanış bakımından bölgesel, kararları bakımından ulusal** kongre; **manda ve himaye ilk kez reddedildi**, ilk kez **Misak-ı Millî sınırlarından** bahsedildi, **Temsil Heyeti** kuruldu ve Mebusan Meclisi'nin derhâl toplanması istendi.\n💡 Sınav Şifresi: **'İlk kez manda-himaye reddi' + 'ilk kez Misak-ı Millî' = Erzurum**; 'bölgesel toplanış, ulusal karar' ikilemi Erzurum'un parmak izidir.",
        "pattern": r"erzurum kongresi[a-zçğıöşü]*|erzurum kongresi",
    },
    {
        "id": "ink1_sivas_kongresi",
        "term": "Sivas Kongresi (4-11 Eylül 1919)",
        "sayfa": 46,
        "tanim": "**Her bakımdan ulusal** kongre; tüm millî cemiyetler **'Anadolu ve Rumeli Müdafaa-i Hukuk Cemiyeti'** çatısı altında birleştirildi, manda ve himaye **kesin olarak** reddedildi, **'İrade-i Millîye'** gazetesi çıkarıldı ve Temsil Heyeti **tüm yurdu** temsil eder hâle geldi.\n💡 Sınav Şifresi: **'Kesin red' + 'tüm cemiyetlerin birleşmesi' + 'İrade-i Millîye' = Sivas**; Temsil Heyeti'nin ulusallaşması Sivas'ın anahtarıdır.",
        "pattern": r"sivas kongresi|anadolu ve rumeli müdafaa-i hukuk",
    },
    {
        "id": "ink1_misaki_milli",
        "term": "Misak-ı Millî (Millî Ant - 28 Ocak 1920)",
        "sayfa": 50,
        "tanim": "Son Osmanlı Mebusan Meclisi'nin kabul ettiği, **Türk vatanının parçalanmaz sınırlarını** çizen, **kapitülasyonların ve azınlık ayrıcalıklarının kaldırılmasını** şart koşan bağımsızlık manifestosu — adeta milletin 'tapusu'.\n💡 Sınav Şifresi: **28 Ocak 1920 + Mebusan Meclisi + kapitülasyonların reddi = Misak-ı Millî**; 'Millî Ant' diye de geçer, İstanbul'un işgaline gerekçe olmuştur.",
        "pattern": r"misak-ı millî|misak-ı milli|misakı milli",
    },
    {
        "id": "ink1_kutahya_eskisehir",
        "term": "Kütahya-Eskişehir Muharebeleri (1921)",
        "sayfa": 60,
        "tanim": "Batı Cephesi'ndeki **tek yenilgi**; Türk ordusu **Sakarya Nehri'nin doğusuna** çekildi, ardından Mustafa Kemal'e **Başkomutanlık yetkisi** verildi ve **Tekâlif-i Milliye Emirleri** yayımlandı.\n💡 Sınav Şifresi: **'Tek yenilgi' + 'Sakarya'nın doğusuna çekilme' + 'Tekâlif-i Milliye' = Kütahya-Eskişehir**; Başkomutanlık yetkisinin verilmesi bu yenilginin doğrudan sonucudur.",
        "pattern": r"kütahya-eskişehir muharebeleri|kütahya-eskişehir|sakarya nehri’nin doğusuna|sakarya nehrinin doğusuna",
    },
    {
        "id": "ink1_sakarya_meydan_muharebesi",
        "term": "Sakarya Meydan Muharebesi (1921)",
        "sayfa": 64,
        "tanim": "**22 gün 22 gece** süren, **1683 Viyana Kuşatması'ndan beri süren geri çekilişi** sona erdiren büyük savunma zaferi; **'Hattı müdafaa yoktur, sathı müdafaa vardır'** sözü buradan çıktı, Mustafa Kemal'e **Mareşal** rütbesi ve **Gazi** unvanı verildi.\n💡 Sınav Şifresi: **'22 gün 22 gece' + 'sathı müdafaa' + 'Mareşal-Gazi' = Sakarya**; 1683 Viyana dönüm noktası bu zaferle kapanır.",
        "pattern": r"sakarya meydan muharebesi|sakarya savaşı|hattı müdafaa yoktur",
    },
    {
        "id": "ink1_baskomutanlik_meydan_muharebesi",
        "term": "Büyük Taarruz ve Başkomutanlık Meydan Muharebesi (1922)",
        "sayfa": 68,
        "tanim": "**Afyon Dumlupınar'da** Yunan ordusunun kesin hezimete uğratıldığı, Batı Anadolu'nun işgalden kurtarıldığı ve **Mudanya Ateşkesi → Lozan** yolunu açan taarruz zaferi; Mustafa Kemal'in **'Ordular, ilk hedefiniz Akdeniz'dir, ileri!'** emri bu harekâtın simgesidir.\n💡 Sınav Şifresi: **'Dumlupınar' + 'Başkomutanlık' + 'Akdeniz'e ileri emri' = Büyük Taarruz (1922)**; Mudanya ve Lozan'ın kapısını açan zaferdir.",
        "pattern": r"başkomutanlık meydan muharebesi|büyük taarruz|dumlupınar meydan",
    },
    {
        "id": "ink1_cumhuriyetcilik",
        "term": "Cumhuriyetçilik İlkesi",
        "sayfa": 74,
        "tanim": "Devlet yönetiminde **millî egemenliği**, halkın yöneticilerini **serbest seçimle** belirlemesini ve **meclis üstünlüğünü** esas alan ilke — yani 'kralın değil, milletin sözü'.\n💡 Sınav Şifresi: **TBMM'nin açılması + saltanatın kaldırılması + cumhuriyetin ilanı + çok partili rejim = Cumhuriyetçilik**; 'seçim' ve 'millî egemenlik' kelimeleri bu ilkeyi işaret eder.",
        "pattern": r"^Cumhuriyetçilik$|\\\\bcumhuriyetçilik ilkesi\\\\b|\\\\bcumhuriyetçilik\\\\b",
    },
    {
        "id": "ink1_milliyetcilik",
        "term": "Milliyetçilik İlkesi",
        "sayfa": 76,
        "tanim": "Türk milletinin **bağımsızlığını, birliğini ve millî benliğini** yüceltmeyi amaçlayan, **ırkçılığı reddeden barışçı** ilke — Yunus Emre'nin 'sevelim, sevilelim' anlayışıyla örtüşen bir birlik ruhu.\n💡 Sınav Şifresi: **Türk Tarih Kurumu + Türk Dil Kurumu + Kabotaj Kanunu + kapitülasyonların kaldırılması = Milliyetçilik**; 'ırkçılığı reddeden' vurgusu bu ilkeyi diğerlerinden ayırır.",
        "pattern": r"^Milliyetçilik$|\\\\bmilliyetçilik ilkesi\\\\b|\\\\bmilliyetçilik\\\\b",
    },
    {
        "id": "ink1_halkcilik",
        "term": "Halkçılık İlkesi",
        "sayfa": 78,
        "tanim": "Toplumda **hiçbir zümreye, aileye veya sınıfa ayrıcalık tanımayan**; kanun önünde tam eşitlik ve sosyal adaleti savunan ilkedir. Tıpkı **Ahilik** geleneğindeki 'kapıya gelen herkes eşittir' anlayışı gibi, aşar vergisinin kaldırılmasından kadınlara seçme hakkına kadar herkesi kucaklar.\n💡 Sınav Şifresi: 'Ayrıcalık yok, kanun önünde eşitlik' → Aşar, Medeni Kanun, Soyadı Kanunu, kadınlara seçme-seçilme hakkı. 'Sınıf farkı yok' vurgusu bu ilkeyi diğerlerinden ayırır.",
        "pattern": r"^Halkçılık$|\\\\bhalkçılık ilkesi\\\\b|\\\\bhalkçılık\\\\b",
    },
    {
        "id": "ink1_devletcilik",
        "term": "Devletçilik İlkesi",
        "sayfa": 80,
        "tanim": "Özel teşebbüsün gücünün yetmediği **büyük sanayi, fabrika, demir yolu ve maden** yatırımlarını devletin bizzat yaptığı **karma ekonomik model**dir. Tıpkı bir **navigasyon uygulamasının** yol bulamadığı yerde devreye girmesi gibi, özel sektörün çekindiği yerde devlet motoru çalıştırır.\n💡 Sınav Şifresi: 'Özel yetmezse devlet yapar' → Sümerbank, Etibank, I. Beş Yıllık Sanayi Planı. 'Karma ekonomi' ve 'büyük yatırım' anahtar kelimeleri bu ilkeyi işaret eder.",
        "pattern": r"^Devletçilik$|\\\\bdevletçilik ilkesi\\\\b|\\\\bdevletçilik\\\\b",
    },
    {
        "id": "ink1_laiklik",
        "term": "Laiklik İlkesi",
        "sayfa": 82,
        "tanim": "**Din ve devlet işlerinin ayrılmasını**, vicdan ve ibadet özgürlüğünü, aklın ve bilimin rehberliğini savunan ilkedir. Tıpkı bir **mikroçipte** her devrenin kendi işini yapıp diğerine karışmaması gibi, din ve devlet de kendi alanında özgürce işler.\n💡 Sınav Şifresi: 'Din devlet işi ayrı' → Halifeliğin kaldırılması, Tevhid-i Tedrisat, tekke-zaviyelerin kapatılması, Medeni Kanun. 'Vicdan özgürlüğü' ve 'akıl-bilim rehberliği' bu ilkenin imzasıdır.",
        "pattern": r"^Laiklik$|\\\\blaiklik ilkesi\\\\b|\\\\blaiklik\\\\b",
    },
    {
        "id": "ink1_inkilapcilik",
        "term": "İnkılapçılık İlkesi",
        "sayfa": 84,
        "tanim": "Zamanla **eskiyen ve işlevini yitiren kurumların yerine çağdaş, dinamik ve ileri kurumların** getirilmesini ilke edinen anlayıştır. Tıpkı bir **yazılım güncellemesi** gibi, toplumun da çağın gerisinde kalan kurumlarını yenileyip modernleşmesini savunur.\n💡 Sınav Şifresi: 'Eskiyeniyle değiştir' → Köklü yenilik, modernleşme, çağdaş kurum. 'Devrimcilik' ile eş anlamlı; 'eski kurumların kaldırılması' ifadesi bu ilkeyi ele verir.",
        "pattern": r"^İnkılapçılık$|^İnkılâpçılık$|\\\\binkılapçılık ilkesi\\\\b|\\\\binkılapçılık\\\\b",
    },
    {
        "id": "ink1_1929_buhrani_ve_yerli_mali",
        "term": "1929 Dünya Ekonomik Bunalımı (Büyük Buhran)",
        "sayfa": 90,
        "tanim": "**ABD New York borsasının çökmesiyle** başlayan küresel krizdir; Türkiye'de **devletçilik ilkesini zorunlu kılmış**, 'Tasarruf ve Yerli Malı Haftası' ilan edilmiştir. Tıpkı bir **siber saldırının** tüm sistemleri çökertip yerli güvenlik yazılımına yöneltmesi gibi, dünya krizi de Türkiye'yi kendi kaynaklarına döndürmüştür.\n💡 Sınav Şifresi: '1929 New York çöküşü' → Devletçiliğin zorunlu hale gelmesi, Millî İktisat ve Tasarruf Cemiyeti, Yerli Malı Haftası. 'Kara Perşembe' ve 'Büyük Buhran' bu kavramın kod adıdır.",
        "pattern": r"1929 dünya ekonomik bunalımı|tasarruf ve yerli malı haftası|büyük buhran",
    },
    {
        "id": "ink1_fasizm_nazizm",
        "term": "Faşizm ve Nazizm (Totaliter Rejimler)",
        "sayfa": 94,
        "tanim": "İki savaş arası dönemde ortaya çıkan **baskıcı rejimlerdir**: İtalya'da Mussolini'nin otoriter rejimi **Faşizm**, Almanya'da Hitler'in ırkçı ve yayılmacı rejimi **Nazizm**'dir. Tıpkı bir **distopya filmindeki** tek liderin her şeyi kontrol ettiği karanlık düzen gibi, bireysel özgürlükleri yok sayarlar.\n💡 Sınav Şifresi: 'Mussolini=Faşizm (İtalya), Hitler=Nazizm (Almanya)' → Otoriter, ırkçı, yayılmacı. 'Tek lider, tek parti, baskı' üçlüsü bu rejimlerin ortak imzasıdır.",
        "pattern": r"^Faşizm$|^Nazizm$|\\\\bfaşizm\\\\b|\\\\bnazizm\\\\b|\\\\bmussolini tarafından oluşturulan\\\\b",
    },
]
