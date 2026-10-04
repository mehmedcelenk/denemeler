#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
process_kimya.py
KİMYA (Kimya 1 - 4) Zorunlu Ortak Dersleri Analiz ve Temizleme Scripti
- Kapsam: KİMYA – 1, KİMYA – 2, KİMYA – 3, KİMYA – 4 (328 soru)
- Seçmeli dersler dahil edilmez (yalnızca zorunlu ortak dersler).
- MEB Kimya Dersi Öğretim Programı ünite ve kazanım hiyerarşisi uygulanır.
- Kesişim kümeleri taranır ve raporlanır.
"""

import json
import re
from collections import defaultdict, Counter

# Tamir edilecek soru sözlüğü (OCR tablosundan / görselinden dolayı seçenekleri eksik kalmış sorular)
KIMYA_REPAIRS = {
    1299: {
        'soru_temiz': "Çamaşır suyu\nLimon suyu\nSirke\nSabun\n\nVerilen tabloda maddelerin başındaki kutucuklara asit ise “A”, baz ise “B” harfi yazıldığında sıralama aşağıdakilerden hangisi olur?",
        'secenekler_temiz': {
            'A': 'A - B - A - B',
            'B': 'B - A - A - B',
            'C': 'B - B - A - A',
            'D': 'A - A - B - B'
        }
    },
    1301: {
        'soru_temiz': "Aşağıdaki kaplarda bulunan bazik çözeltilere belirtilen metaller atıldığında hangisinde reaksiyon (H₂ gazı çıkışı) gerçekleşir?",
        'secenekler_temiz': {
            'A': 'Au metali + KOH çözeltisi',
            'B': 'Pt metali + NaOH çözeltisi',
            'C': 'Al metali + NaOH çözeltisi',
            'D': 'Ag metali + KOH çözeltisi'
        }
    },
    5136: {
        'soru_temiz': "Aşağıdaki Lewis gösterimlerinden hangisi yanlıştır? (₁H, ₆C, ₇N, ₈O, ₉F)",
        'secenekler_temiz': {
            'A': 'F : F (F₂ molekülü)',
            'B': 'CH₄ (Metan molekülü)',
            'C': 'H - N(H) - H (Azot üzerindeki ortaklanmamış elektron çifti eksik gösterilmiş)',
            'D': 'O = O (O₂ molekülü)'
        }
    },
    5998: {
        'soru_temiz': "Dipol momenti sıfır olan moleküller apolar, dipol momenti sıfırdan farklı olan moleküller ise polardır.\n\nBuna göre, aşağıdaki moleküllerden hangisi polardır?",
        'secenekler_temiz': {
            'A': 'H₂',
            'B': 'HF',
            'C': 'N₂',
            'D': 'F₂'
        }
    },
    6516: {
        'soru_temiz': "İki farklı elementten oluşan bir bileşikte, 8’i merkez atomun çevresinde olmak üzere toplam 16 değerlik elektronu bulunmaktadır.\n\nBu bileşiğin Lewis formülü aşağıdakilerden hangisi olabilir?",
        'secenekler_temiz': {
            'A': 'H₂O',
            'B': 'HCl',
            'C': 'CO₂',
            'D': 'BeF₂'
        }
    },
    7889: {
        'soru_temiz': "Bazı elementlerin temel hâl elektron dizilimi ve periyodik tablodaki yerleri aşağıda verilmiştir:\n• Li: [He] 2s¹ → 2. periyot 1A grubu\n• Be: [He] 2s² → 2. periyot 2A grubu\n• C: [He] 2s² 2p² → 2. periyot 4A grubu\n• Sc: [Ar] 4s² 3d¹\n\nBuna göre, Sc elementinin periyodik tablodaki yeri aşağıdakilerden hangisidir?",
        'secenekler_temiz': {
            'A': '3. periyot 2B grubu',
            'B': '4. periyot 1B grubu',
            'C': '4. periyot 2B grubu',
            'D': '4. periyot 3B grubu'
        }
    },
    9707: {
        'soru_temiz': "Oda koşullarında hazırlanan birer mollük He ve Ne gazları karışımı cam kaba konulmuştur. Bu cam kaplarla hazırlanan deney düzeneğinde 1 L'lik kapta gazlar, diğer 1 L'lik kap boştur.\n\nAynı koşullarda kaplar arasındaki musluk açılıp gazların yayılması tamamlandığında gazların son durumu aşağıdakilerden hangisinde doğru ifade edilmiştir?",
        'secenekler_temiz': {
            'A': 'Gazlar yalnızca sağdaki boş kaba toplanır.',
            'B': 'He ve Ne atomları her iki kaba homojen ve eşit olarak dağılır.',
            'C': 'He gazı birinci kapta, Ne gazı ikinci kapta ayrışır.',
            'D': 'Gazlar yayılmadan ilk kabın tabanına çöker.'
        }
    },
    10107: {
        'soru_temiz': "Lewis nokta yapısı verilen aşağıdaki bileşiklerden hangisi apolardır?",
        'secenekler_temiz': {
            'A': 'HF',
            'B': 'CH₄ (Metan)',
            'C': 'NH₃',
            'D': 'H₂O'
        }
    },
    10621: {
        'soru_temiz': "Periyodik tabloda, B grubu elementlerinin valans elektron sayılarının belirlenmesinde ns ve (n-1)d orbitallerindeki toplam elektron sayıları kullanılır.\n• 4s¹ 3d¹⁰ → 4. periyot 1B grubu\n• 4s² 3d¹⁰ → 4. periyot 2B grubu\n• 5s¹ 4d¹⁰ → 5. periyot 1B grubu\n• 5s² 4d¹⁰ → 5. periyot 2B grubu\n\nBuna göre valans elektron dizilimi 6s¹ 5d¹⁰ olan element periyodik tabloda nerede yer alır?",
        'secenekler_temiz': {
            'A': '5. periyot 1B grubu',
            'B': '6. periyot 2B grubu',
            'C': '6. periyot 1B grubu',
            'D': '6. periyot 3B grubu'
        }
    },
    11067: {
        'soru_temiz': "H₂ + F₂ → 2HF tepkimesine ait mikroskobik seviyedeki molekül modeli aşağıdakilerden hangisidir?",
        'secenekler_temiz': {
            'A': '1 adet H₂ + 1 adet F atomu → 1 adet HF',
            'B': '2 adet diatomik molekülün parçalanmadan karışması',
            'C': '1 adet diatomik H₂ + 1 adet diatomik F₂ → 2 adet HF molekülü',
            'D': '4 bağımsız atomun birleşmeden dağılması'
        }
    }
}

def clean_kimya_text(text):
    if not text:
        return ""
    t = text.strip()
    # Normalize excessive whitespaces
    t = re.sub(r'[ \t]+', ' ', t)
    # Fix broken newlines
    lines = [l.strip() for l in t.split('\n') if l.strip()]
    cleaned = '\n'.join(lines)
    return cleaned

def clean_kimya_options(secenekler):
    cleaned = {}
    for k in ['A', 'B', 'C', 'D']:
        val = secenekler.get(k, '')
        if isinstance(val, str):
            v = val.strip()
            v = re.sub(r'\s+', ' ', v)
            cleaned[k] = v
        else:
            cleaned[k] = str(val)
    return cleaned

def classify_kimya(soru_text, secenekler, ders):
    """
    MEB Kimya müfredatına göre ana_konu ve alt_konu atar.
    """
    full_text = soru_text + " " + " ".join(secenekler.values())
    t = full_text.lower()
    
    # -------------------------------------------------------------
    # 1. KİMYA BİLİMİ & SİMYA & LABORATUVAR
    # -------------------------------------------------------------
    if any(k in t for k in ['simya', 'simyacı', 'aristo', 'empedokles', 'cabir bin hayyan', 'ebû bekir er-râzî', 'lavoisier', 'robert boyle']):
        return ("Kimya Bilimi", "Simyadan Kimyaya ve Kimya Biliminin Gelişimi")

    if any(k in t for k in ['güvenlik uyar', 'piktogram', 'tahriş edici', 'korozif', 'toksik', 'zehirli', 'yanıcı', 'yakıcı', 'radyoaktif', 'çevreye zararlı', 'laboratuvar güvenlik']):
        return ("Kimya Bilimi", "Kimya Laboratuvarında Güvenlik ve Uyarı İşaretleri")

    if any(k in t for k in ['erlenmayer', 'beherglas', 'büret', 'pipet', 'dereceli silindir', 'mezür', 'balon joje', 'sacayağı', 'ispirto ocağı', 'kroze', 'ayırıcı huni']):
        if 'ayır' not in t or 'ayırma hunisi' not in t:
            return ("Kimya Bilimi", "Laboratuvar Malzemeleri ve Kullanım Amaçları")

    if any(k in t for k in ['alt disiplin', 'analitik kimya', 'biyokimya', 'organik kimya', 'anorganik kimya', 'fizikokimya', 'polimer kimyası', 'endüstriyel kimya']):
        return ("Kimya Bilimi", "Kimyanın Alt Disiplinleri ve Uğraş Alanları")

    if any(k in t for k in ['yaygın adı', 'geleneksel adı', 'tuz ruhu', 'zaç yağı', 'kezzap', 'kireç taşı', 'sönmüş kireç', 'sönmemiş kireç', 'sudkostik', 'potaskostik', 'yemek sodası', 'amonyak']):
        return ("Kimya Bilimi", "Maddelerin Sembolik Dili (Element ve Bileşiklerin Yaygın Adları)")

    if any(k in t for k in ['element sembol', 'sembolik dil', 'saf madde', 'tek cins atom', 'aynı tür atom', 'element ve bileşik']):
        return ("Kimya Bilimi", "Maddelerin Sembolik Dili (Element ve Bileşikler)")

    # -------------------------------------------------------------
    # 2. ATOM VE PERİYODİK SİSTEM
    # -------------------------------------------------------------
    if any(k in t for k in ['dalton', 'thomson', 'rutherford', 'bohr', 'üzümlü kek', 'altın levha', 'alfa ışını', 'yörünge', 'katman modeli', 'spektrum', 'absorbsiyon', 'emisyon']):
        return ("Atom ve Periyodik Sistem", "Atom Modelleri (Dalton, Thomson, Rutherford, Bohr)")

    if any(k in t for k in ['izotop', 'izoton', 'izobar', 'izo生ektronik', 'izoelektronik', 'proton sayısı', 'nötron sayısı', 'kütle numarası', 'çekirdek yükü', 'nükleon']):
        return ("Atom ve Periyodik Sistem", "Atomun Yapısı ve Temel Tanecikler (İzotop, İzoton, İzobar)")

    if any(k in t for k in ['elektron dizilimi', 'katman elektron', 'değerlik elektron', 'valans', 'grup ve periyot', 'periyodik tablodaki yeri', 'periyodunda']):
        return ("Atom ve Periyodik Sistem", "Periyodik Sistem ve Elementlerin Yerinin Belirlenmesi")

    if any(k in t for k in ['iyonlaşma enerjisi', 'elektronegatiflik', 'elektron ilgisi', 'atom yarıçapı', 'metalik aktiflik', 'ametalik aktiflik', 'metalik karakter', 'ametalik karakter']):
        return ("Atom ve Periyodik Sistem", "Periyodik Özelliklerin Değişimi (Yarıçap, İyonlaşma Enerjisi)")

    if any(k in t for k in ['alkali metal', 'toprak alkali', 'halojen', 'soygaz', 'asal gaz', 'kalkojen', 'geçiş metal', 'lantenit', 'aktinit']):
        return ("Atom ve Periyodik Sistem", "Elementlerin Sınıflandırılması ve Grup Özellikleri")

    # -------------------------------------------------------------
    # 3. KİMYASAL TÜRLER ARASI ETKİLEŞİMLER
    # -------------------------------------------------------------
    if any(k in t for k in ['lewis yapısı', 'lewis gösterimi', 'lewis formülü', 'nokta yapısı']):
        return ("Kimyasal Türler Arası Etkileşimler", "Kimyasal Türler ve Lewis Elektron Nokta Yapısı")

    if any(k in t for k in ['iyonik bağ', 'iyonik bileşik', 'elektron alışverişi', 'kristal örgü', 'iyonik katı', 'kalay (ii)', 'demir (iii)', 'bakır (ii)']):
        return ("Kimyasal Türler Arası Etkileşimler", "İyonik Bağ ve İyonik Bileşiklerin Adlandırılması")

    if any(k in t for k in ['kovalent bağ', 'apolar kovalent', 'polar kovalent', 'elektron ortaklaşması', 'molekülün polar', 'dipol moment', 'apolar molekül', 'polar molekül']):
        return ("Kimyasal Türler Arası Etkileşimler", "Kovalent Bağ ve Moleküllerin Polarlığı")

    if any(k in t for k in ['metalik bağ', 'elektron denizi', 'serbest değerlik elektron', 'metallerin iletkenliği', 'parlaklık']):
        return ("Kimyasal Türler Arası Etkileşimler", "Metalik Bağ ve Metallerin Fiziksel Özellikleri")

    if any(k in t for k in ['hidrojen bağı', 'van der waals', 'dipol-dipol', 'london kuvvetleri', 'indüklenmiş dipol', 'zayıf etkileşim', 'yoğun faz']):
        return ("Kimyasal Türler Arası Etkileşimler", "Zayıf Etkileşimler (Hidrojen Bağı ve Van der Waals)")

    if any(k in t for k in ['fiziksel değişim', 'kimyasal değişim', 'fiziksel ve kimyasal', 'bağ kırılması', 'bağ oluşumu']):
        return ("Kimyasal Türler Arası Etkileşimler", "Fiziksel ve Kimyasal Değişimler")

    # -------------------------------------------------------------
    # 4. MADDENİN HALLERİ & DOĞA VE KİMYA
    # -------------------------------------------------------------
    if any(k in t for k in ['katı türleri', 'amorf katı', 'kristal katı', 'iyonik kristal', 'moleküler kristal', 'kovalent kristal', 'metalik kristal', 'grafit', 'elmas', 'tereyağı', 'cam']):
        return ("Maddenin Halleri", "Katılar ve Katı Türleri (Amorf ve Kristal Katılar)")

    if any(k in t for k in ['viskozite', 'akıcılık', 'buharlaşma hızı', 'buhar basıncı', 'kaynama noktası', 'bağıl nem', 'hissedilen sıcaklık']):
        return ("Maddenin Halleri", "Sıvılar (Viskozite, Buharlaşma ve Kaynama Olayı)")

    if any(k in t for k in ['gaz hali', 'gazların yayılması', 'difüzyon', 'plazma', 'plazma hali', 'iyonize gaz', 'floresan lamba', 'şimşek', 'yıldırım', 'kuzey ışıkları']):
        return ("Maddenin Halleri", "Gazlar ve Plazma Hali")

    if any(k in t for k in ['sert su', 'yumuşak su', 'sertlik derecesi', 'su tasarrufu', 'kireçlenme', 'içme suyu', 'ca2+', 'mg2+']):
        return ("Doğa ve Kimya", "Su ve Hayat (Suyun Sertliği ve Arıtımı)")

    if any(k in t for k in ['sera etkisi', 'sera gazı', 'ozon tabakası', 'asit yağmuru', 'küresel ısınma', 'hava kirliliği', 'su kirliliği', 'toprak kirliliği', 'so2', 'no2', 'co2']):
        return ("Doğa ve Kimya", "Çevre Kimyası (Hava, Su ve Toprak Kirliliği, Sera Gazları)")

    # -------------------------------------------------------------
    # 5. KİMYANIN TEMEL KANUNLARI VE KİMYASAL HESAPLAMALAR
    # -------------------------------------------------------------
    if any(k in t for k in ['kütlenin korunumu', 'sabit oranlar', 'katlı oranlar', 'dalton atom teorisi', 'lavoisier', 'proust']):
        return ("Kimyanın Temel Kanunları ve Tepkimeler", "Kimyanın Temel Kanunları (Kütlenin Korunumu, Sabit ve Katlı Oranlar)")

    if any(k in t for k in ['mol', 'avogadro', 'n = m/ma', 'tane atom', 'tane molekül', 'akb', 'mol sayısı', 'bağıl atom kütlesi']):
        return ("Kimyanın Temel Kanunları ve Tepkimeler", "Mol Kavramı ve Avogadro Sayısı")

    if any(k in t for k in ['yanma tepkimesi', 'sentez tepkimesi', 'analiz tepkimesi', 'çökelme', 'çözünme-çökelme', 'net iyon denklemi', 'seyirci iyon', 'tepkime denkleştirme']):
        return ("Kimyanın Temel Kanunları ve Tepkimeler", "Kimyasal Tepkime Türleri ve Denklemler")

    if any(k in t for k in ['hesaplama', 'sınırlayıcı bileşen', 'artan madde', 'verim', 'tepkime denklemine göre']):
        return ("Kimyanın Temel Kanunları ve Tepkimeler", "Kimyasal Hesaplamalar ve Denklemli Miktar Geçişleri")

    # -------------------------------------------------------------
    # 6. KARIŞIMLAR
    # -------------------------------------------------------------
    if any(k in t for k in ['homojen karışım', 'heterojen karışım', 'süspansiyon', 'emülsiyon', 'kolloid', 'aerosol', 'çözelti']):
        if not any(x in t for x in ['yüzde', 'derişim', 'ppm', 'ayır']):
            return ("Karışımlar", "Homojen ve Heterojen Karışımlar (Süspansiyon, Emülsiyon, Kolloid)")

    if any(k in t for k in ['kütlece yüzde', 'hacimce yüzde', 'derişim', 'ppm', 'çözünme süreci', 'benzer benzeri çözer', 'hidratasyon', 'solvatasyon']):
        return ("Karışımlar", "Çözünme Süreci ve Çözeltilerde Derişim (Kütlece/Hacimce Yüzde)")

    if any(k in t for k in ['koligatif', 'kaynama noktası yükselmesi', 'donma noktası alçalması', 'ozmotik basınç', 'ozmoz', 'tuzlu suyun kaynama']):
        return ("Karışımlar", "Çözeltilerin Koligatif Özellikleri (Donma ve Kaynama Noktası)")

    if any(k in t for k in ['ayırma yöntemleri', 'damıtma', 'ayrımsal damıtma', 'süzme', 'ayırma hunisi', 'özütleme', 'ekstraksiyon', 'kristallendirme', 'ayrımsal kristallendirme', 'diyaliz', 'flotasyon']):
        return ("Karışımlar", "Karışımları Ayırma Teknikleri (Damıtma, Süzme, Ayırma Hunisi)")

    # -------------------------------------------------------------
    # 7. ASİTLER, BAZLAR VE TUZLAR
    # -------------------------------------------------------------
    if any(k in t for k in ['turnusol', 'indikatör', 'ph metre', 'ph değeri', 'poh', 'asit ise', 'baz ise', 'asidik', 'bazik', 'tadı ekşi', 'tadı acı', 'ele kayganlık']):
        return ("Asitler, Bazlar ve Tuzlar", "Asit ve Bazların Genel Özellikleri, İndikatörler ve pH Kavramı")

    if any(k in t for k in ['nötralleşme', 'titrasyon', 'asit-baz tepkimesi', 'asit baz tepkimesi', 'tuz ve su oluşur']):
        return ("Asitler, Bazlar ve Tuzlar", "Asit-Baz Tepkimeleri (Nötralleşme)")

    if any(k in t for k in ['amfoter metal', 'soy metal', 'yarı soy metal', 'h2 gazı açığa', 'no2 gazı', 'so2 gazı', 'zn, al, cr', 'metallerin asitlerle']):
        return ("Asitler, Bazlar ve Tuzlar", "Asit ve Bazların Metallerle Tepkimeleri (Gaz Çıkışları)")

    if any(k in t for k in ['tuzlar', 'sofra tuzu', 'yemek tuzu', 'nacl', 'sodyum klorür', 'caco3', 'kalsiyum karbonat', 'nahco3', 'sodyum bikarbonat', 'nh4cl', 'amonyum klorür', 'kireç taşı']):
        return ("Asitler, Bazlar ve Tuzlar", "Yaygın Tuzlar ve Kullanım Alanları (NaCl, CaCO₃, NaHCO₃, NH₄Cl)")

    if any(k in t for k in ['tuz ruhu ile çamaşır', 'asitlerin depolanması', 'asitlerin zararları', 'kostik']):
        return ("Asitler, Bazlar ve Tuzlar", "Hayatımızda Asitler ve Bazlar (Sağlık, Çevre ve Güvenlik)")

    # -------------------------------------------------------------
    # 8. KİMYA HER YERDE
    # -------------------------------------------------------------
    if any(k in t for k in ['sabun', 'deterjan', 'hidrofob', 'hidrofil', 'kuyruk kısmı', 'baş kısmı', 'çamaşır suyu', 'kireç kaymağı', 'hijyen', 'sert sularda temizleme']):
        return ("Kimya Her Yerde", "Temizlik Maddeleri (Sabun, Deterjan, Çamaşır Suyu)")

    if any(k in t for k in ['polimer', 'monomer', 'mer', 'pet', 'pvc', 'teflon', 'politetrafloroetilen', 'polietilen', 'kauçuk', 'kevlar']):
        return ("Kimya Her Yerde", "Yaygın Polimerler ve Kullanım Alanları (PET, PVC, Teflon, Kauçuk)")

    if any(k in t for k in ['kozmetik', 'ilaç', 'merhem', 'şurup', 'hap', 'iğne', 'ampul', 'güneş kremi', 'parfüm', 'saç boyası']):
        return ("Kimya Her Yerde", "Kozmetikler ve İlaç Formları (Hap, Şurup, Merhem)")

    if any(k in t for k in ['sızma yağ', 'rafine yağ', 'riviera', 'vinterize', 'margarin', 'doymuş yağ', 'doymamış yağ', 'trans yağ', 'gıda katkı']):
        return ("Kimya Her Yerde", "Gıdalar ve Yağ Türleri (Sızma, Rafine, Margarin)")

    # Fallbacks based on course levels
    if ders == 'KİMYA – 1':
        return ("Kimya Bilimi", "Maddelerin Sembolik Dili (Element ve Bileşikler)")
    elif ders == 'KİMYA – 2':
        return ("Kimyasal Türler Arası Etkileşimler", "Kimyasal Türler ve Lewis Elektron Nokta Yapısı")
    elif ders == 'KİMYA – 3':
        return ("Kimyanın Temel Kanunları ve Tepkimeler", "Kimyasal Tepkime Türleri ve Denklemler")
    else:
        return ("Asitler, Bazlar ve Tuzlar", "Asit ve Bazların Genel Özellikleri, İndikatörler ve pH Kavramı")


def main():
    print("=" * 60)
    print("🧪 KİMYA (Kimya 1 - 4) ÇIKMIŞ SORU VE KESİŞİM İŞLEME MOTORU")
    print("=" * 60)

    with open('scripts/ciktilar/tum_sorular.json', 'r', encoding='utf-8') as f:
        all_raw_questions = json.load(f)

    # Filtrele: Sadece zorunlu Kimya dersleri (KİMYA – 1, 2, 3, 4)
    kimya_raw = [
        q for q in all_raw_questions 
        if 'KİMYA' in q['ders'] and 'SEÇMELİ' not in q['ders']
    ]
    print(f"Toplam seçilen zorunlu Kimya sorusu: {len(kimya_raw)}")

    processed_questions = []
    course_counts = Counter()

    for q in kimya_raw:
        qid = q['id']
        ders = q['ders']
        yil = q['yil']
        donem = q['donem']
        soru_no = q['soru_no']
        dogru_cevap = q['dogru_cevap'].strip().upper()

        course_counts[ders] += 1

        # Tamir kontrolü
        if qid in KIMYA_REPAIRS:
            rep = KIMYA_REPAIRS[qid]
            soru_temiz = rep['soru_temiz']
            secenekler_temiz = rep['secenekler_temiz']
        else:
            soru_temiz = clean_kimya_text(q.get('soru', ''))
            secenekler_temiz = clean_kimya_options(q.get('secenekler', {}))

        # Sınıflandır
        ana_konu, alt_konu = classify_kimya(soru_temiz, secenekler_temiz, ders)

        processed_questions.append({
            'id': qid,
            'ders': ders,
            'ders_kodu': q.get('ders_kodu', ''),
            'yil': yil,
            'donem': str(donem),
            'soru_no': soru_no,
            'soru_temiz': soru_temiz,
            'secenekler_temiz': secenekler_temiz,
            'dogru_cevap': dogru_cevap,
            'ana_konu': ana_konu,
            'alt_konu': alt_konu
        })

    print(f"Kademe Dağılımı: {dict(course_counts)}")

    # Çıktıyı kaydet
    out_path = 'scripts/ciktilar/analiz/kimya_analizli_sorular_temiz.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(processed_questions, f, ensure_ascii=False, indent=2)
    print(f"✅ {out_path} dosyasına {len(processed_questions)} temiz soru yazıldı.")

    # Kesişim analizleri
    topic_map = {}
    for q in processed_questions:
        sub = q['alt_konu']
        ak = q['ana_konu']
        if sub not in topic_map:
            topic_map[sub] = {
                'ana_konu': ak,
                'count': 0,
                'courses': Counter()
            }
        topic_map[sub]['count'] += 1
        topic_map[sub]['courses'][q['ders']] += 1

    intersections = [t for t in topic_map.values() if len(t['courses']) > 1]
    intersections.sort(key=lambda x: x['count'], reverse=True)

    print("\n" + "=" * 60)
    print(f"🎯 KİMYA KADEMELERİ ARASI ORTAK KESİŞİM KÜMELERİ ({len(intersections)} Kesişen Alt Konu)")
    print("=" * 60)

    for idx, item in enumerate(intersections, 1):
        c_details = ", ".join([f"{c.replace('KİMYA – ', 'KİM-')}: {cnt}" for c, cnt in sorted(item['courses'].items())])
        # Find sub topic name
        sub_name = [k for k, v in topic_map.items() if v == item][0]
        print(f"{idx}. ÜNİTE: {item['ana_konu']}")
        print(f"   ► Alt Konu: {sub_name}")
        print(f"   ► Toplam: {item['count']} soru | Dağılım: [{c_details}]")
        print()

    # Şimdi tum_analizli_sorular_temiz.json ile birleştir
    with open('scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json', 'r', encoding='utf-8') as f:
        existing_tum = json.load(f)

    # Varsa eski Kimya sorularını temizle, yenilerini ekle
    existing_tum = [q for q in existing_tum if 'KİMYA' not in q['ders']]
    existing_tum.extend(processed_questions)

    # ID'ye göre sırala
    existing_tum.sort(key=lambda x: x['id'])

    with open('scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json', 'w', encoding='utf-8') as f:
        json.dump(existing_tum, f, ensure_ascii=False, indent=2)

    total_by_subject = Counter()
    for q in existing_tum:
        d = q['ders']
        if 'COĞRAFYA' in d: total_by_subject['Coğrafya'] += 1
        elif 'TÜRK DİLİ' in d: total_by_subject['Türk Dili ve Ed.'] += 1
        elif 'MATEMATİK' in d: total_by_subject['Matematik'] += 1
        elif 'TARİH' in d: total_by_subject['Tarih'] += 1
        elif 'KİMYA' in d: total_by_subject['Kimya'] += 1
        else: total_by_subject[d] += 1

    print("=" * 60)
    print(f"🚀 GÜNCEL GENEL SORU HAVUZU: Toplam {len(existing_tum)} Soru!")
    print(f"Dağılım: {dict(total_by_subject)}")
    print("=" * 60)

if __name__ == '__main__':
    main()
