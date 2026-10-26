#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""TDE 1 (Türk Dili ve Edebiyatı 1 - 9. Sınıf 1. Dönem) Kapsamlı Kavram Haritası Çıkarıcı.

4 Kademeli Çapraz Huni:
1. 82 Çıkmış Sınav Sorusu şıkları ve kökleri (Ampirik MEB terimleri)
2. tde_1.md içindeki 'Bu Temada Öğrenilecek Kavramlar' kutuları ve tanımlar
3. ':' (iki nokta), Title Case ve tırnak içi biçimsel ipuçları
4. Kesin MEB 1. Dönem müfredat izolasyonu (Sayfa 1-149)
"""

import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List

ROOT_DIR = Path(__file__).resolve().parents[2]
TDE1_MD_PATH = ROOT_DIR / "docs" / "dersler" / "tde" / "tde_1" / "tde_1.md"
OUT_CONCEPTS_PATH = ROOT_DIR / "docs" / "dersler" / "tde" / "tde_1" / "tde_1_kavramlar.json"
DATA_CONCEPTS_PATH = ROOT_DIR / "data" / "concepts" / "TDE_1_concepts.json"
DATA_CONCEPTS_PATH.parent.mkdir(parents=True, exist_ok=True)

# TDE 1 (Sayfa 1-149) Kapsamındaki 50+ Temel MEB Kavramı
CANONICAL_TDE1_CONCEPTS: List[Dict[str, Any]] = [
    # --- 1. ÜNİTE: GİRİŞ, İLETİŞİM VE DİL ---
    {
        "id": "tde1_edebi_metin",
        "term": "Edebî Metin",
        "aliases": ["Sanatsal Metin", "Kurmaca Metin"],
        "unite_no": 1,
        "sayfa": 14,
        "tanim": "Estetik bir haz uyandırmak amacıyla kurmaca bir dünyada oluşturulan, öznel ve çağrışıma açık edebiyat ürünü.",
        "pattern": r"edebî metin[a-zçğıöşü]*|edebi metin[a-zçğıöşü]*|sanatsal metin[a-zçğıöşü]*|kurmaca metin[a-zçğıöşü]*",
    },
    {
        "id": "tde1_ogretici_metin",
        "term": "Öğretici Metin",
        "aliases": ["Bilgi Verici Metin"],
        "unite_no": 1,
        "sayfa": 15,
        "tanim": "Okuyucuya bilgi vermek, bir gerçeği açıklamak veya kanıtlamak amacıyla nesnel bir dille yazılan metinler (makale, deneme, tarih vb.).",
        "pattern": r"öğretici metin[a-zçğıöşü]*|ogretici metin[a-zçğıöşü]*|bilgi verici metin[a-zçğıöşü]*",
    },
    {
        "id": "tde1_kurmaca",
        "term": "Kurmaca",
        "aliases": ["Fantezi", "Kurgu"],
        "unite_no": 1,
        "sayfa": 16,
        "tanim": "Yazarın gerçek dünyadan esinlenerek kendi hayal gücüyle yeniden tasarladığı yapay ve sanatsal gerçeklik.",
        "pattern": r"kurmaca[a-zçğıöşü]*|kurgusal[a-zçğıöşü]*",
    },
    {
        "id": "tde1_acik_ileti",
        "term": "Açık İleti",
        "aliases": ["Doğrudan Anlatım"],
        "unite_no": 1,
        "sayfa": 22,
        "tanim": "Metinde tek bir anlama gelecek şekilde, yoruma gerek kalmadan herkesin aynı biçimde anladığı doğrudan mesaj.",
        "pattern": r"açık ileti[a-zçğıöşü]*|acik ileti[a-zçğıöşü]*",
    },
    {
        "id": "tde1_ortuk_ileti",
        "term": "Örtük İleti",
        "aliases": ["Kapalı Anlatım", "İrtibatlı Anlam"],
        "unite_no": 1,
        "sayfa": 22,
        "tanim": "Metinde doğrudan söylenmeyip satır aralarında, mecaz ve imgelerle hissettirilen, okuyucunun yorumuna bırakılan derin mesaj.",
        "pattern": r"örtük ileti[a-zçğıöşü]*|ortuk ileti[a-zçğıöşü]*",
    },
    {
        "id": "tde1_gonderici",
        "term": "Gönderici (Kaynak)",
        "aliases": ["Verici", "Kaynak"],
        "unite_no": 1,
        "sayfa": 24,
        "tanim": "İletişimi başlatan, duygu, düşünce veya isteği hedefe iletmek üzere mesaj haline getiren öge.",
        "pattern": r"gönderici[a-zçğıöşü]*|verici[a-zçğıöşü]*",
    },
    {
        "id": "tde1_alici",
        "term": "Alıcı (Hedef)",
        "aliases": ["Hedef"],
        "unite_no": 1,
        "sayfa": 24,
        "tanim": "Göndericinin iletisine muhatap olan, mesajı alıp çözümleyen kişi veya topluluk.",
        "pattern": r"alıcı[a-zçğıöşü]*|alici[a-zçğıöşü]*",
    },
    {
        "id": "tde1_ileti",
        "term": "İleti (Mesaj)",
        "aliases": ["Mesaj"],
        "unite_no": 1,
        "sayfa": 24,
        "tanim": "Göndericinin alıcıya aktarmak istediği her türlü duygu, düşünce ve bilgi.",
        "pattern": r"\bileti[a-zçğıöşü]*\b|\bmesaj[a-zçğıöşü]*\b",
    },
    {
        "id": "tde1_kanal",
        "term": "Kanal",
        "aliases": ["İletişim Yolu"],
        "unite_no": 1,
        "sayfa": 24,
        "tanim": "İletinin göndericiden alıcıya ulaşırken kullandığı fiziksel yol, araç veya ortam (ses dalgaları, yazı, ışık vb.).",
        "pattern": r"\bkanal[a-zçğıöşü]*\b",
    },
    {
        "id": "tde1_donut",
        "term": "Dönüt (Geri Bildirim)",
        "aliases": ["Geri Bildirim"],
        "unite_no": 1,
        "sayfa": 24,
        "tanim": "Alıcının iletiye verdiği her türlü cevap, tepki veya karşı mesaj.",
        "pattern": r"dönüt[a-zçğıöşü]*|donut[a-zçğıöşü]*|geri bildirim[a-zçğıöşü]*",
    },
    {
        "id": "tde1_baglam",
        "term": "Bağlam",
        "aliases": ["Ortam"],
        "unite_no": 1,
        "sayfa": 24,
        "tanim": "İletişimin gerçekleştiği, ögelerin anlam kazandığı fiziksel, sosyal veya psikolojik ortam.",
        "pattern": r"\bbağlam[a-zçğıöşü]*\b|\bbaglam[a-zçğıöşü]*\b",
    },
    {
        "id": "tde1_kod",
        "term": "Kod (Şifre)",
        "aliases": ["Şifre"],
        "unite_no": 1,
        "sayfa": 24,
        "tanim": "İletinin oluşturulduğu, gönderici ve alıcının ortak bildiği işaretler sistemi (genellikle dil).",
        "pattern": r"\bkod[a-zçğıöşü]*\b|\bşifre[a-zçğıöşü]*\b",
    },
    {
        "id": "tde1_lehce",
        "term": "Lehçe",
        "aliases": ["Yakutça", "Çuvaşça"],
        "unite_no": 1,
        "sayfa": 26,
        "tanim": "Bir dilin tarihsel süreçte metinlerle takip edilemeyen çok eski dönemlerinde ayrılmış kolu (Türkçenin Çuvaşça ve Yakutça kolları).",
        "pattern": r"lehçe[a-zçğıöşü]*|lehce[a-zçğıöşü]*",
    },
    {
        "id": "tde1_sive",
        "term": "Şive",
        "aliases": ["Azerice", "Özbekçe"],
        "unite_no": 1,
        "sayfa": 26,
        "tanim": "Bir dilin yazılı metinlerle takip edilebilen tarihsel dönemlerinde ayrılmış kolları (Azerbaycan Türkçesi, Özbek Türkçesi vb.).",
        "pattern": r"şive[a-zçğıöşü]*|sive[a-zçğıöşü]*",
    },
    {
        "id": "tde1_agiz",
        "term": "Ağız",
        "aliases": ["Yöre Dili", "Aksan"],
        "unite_no": 1,
        "sayfa": 27,
        "tanim": "Aynı dil veya şive içinde bir bölge veya şehre özgü söyleyiş farklılığı (Karadeniz ağzı, Konya ağzı vb.).",
        "pattern": r"\bağız[a-zçğıöşü]*\b|\bagiz[a-zçğıöşü]*\b",
    },
    {
        "id": "tde1_argo",
        "term": "Argo",
        "aliases": ["Özel Dil"],
        "unite_no": 1,
        "sayfa": 28,
        "tanim": "Toplumda belirli zümre veya meslek üyelerinin kendi aralarında kullandığı, genel dile göre kaba veya mecazi özel söz dağarcığı.",
        "pattern": r"\bargo[a-zçğıöşü]*\b",
    },
    {
        "id": "tde1_jargon",
        "term": "Jargon",
        "aliases": ["Meslek Dili"],
        "unite_no": 1,
        "sayfa": 28,
        "tanim": "Aynı meslek veya uzmanlık alanındaki insanların kullandığı teknik ve mesleki ortak dil (tıp, hukuk, denizcilik jargonu).",
        "pattern": r"\bjargon[a-zçğıöşü]*\b",
    },
    {
        "id": "tde1_standart_dil",
        "term": "Standart Dil",
        "aliases": ["Ölçünlü Dil"],
        "unite_no": 1,
        "sayfa": 29,
        "tanim": "Bir ülkede ağız farklılıklarının üstünde kabul edilen, eğitim ve resmî yazışmalarda kullanılan ortak yazı dili (İstanbul Türkçesi).",
        "pattern": r"standart dil[a-zçğıöşü]*|ölçünlü dil[a-zçğıöşü]*",
    },

    # --- 2. ÜNİTE: HİKÂYE (ÖYKÜ) ---
    {
        "id": "tde1_olay_hikayesi",
        "term": "Olay Hikâyesi",
        "aliases": ["Klasik Hikâye", "Maupassant Tarzı"],
        "unite_no": 2,
        "sayfa": 38,
        "tanim": "Merak ögesini ön planda tutan, serim-düğüm-çözüm planına sıkı sıkıya bağlı, çarpıcı bir sonla biten klasik hikâye türü (Ömer Seyfettin, Guy de Maupassant).",
        "pattern": r"olay hikâye[a-zçğıöşü]*|olay hikaye[a-zçğıöşü]*|maupassant tarzı[a-zçğıöşü]*|klasik hikâye[a-zçğıöşü]*",
    },
    {
        "id": "tde1_durum_hikayesi",
        "term": "Durum Hikâyesi",
        "aliases": ["Kesit Hikâyesi", "Çehov Tarzı"],
        "unite_no": 2,
        "sayfa": 42,
        "tanim": "Olay zincirinden ziyade hayatın bir kesitini ve insan ruhunu serim-düğüm-çözüm planına bağlı kalmadan anlatan modern hikâye türü (Sait Faik, Anton Çehov).",
        "pattern": r"durum hikâye[a-zçğıöşü]*|durum hikaye[a-zçğıöşü]*|kesit hikâye[a-zçğıöşü]*|çehov tarzı[a-zçğıöşü]*",
    },
    {
        "id": "tde1_serim",
        "term": "Serim",
        "aliases": ["Giriş"],
        "unite_no": 2,
        "sayfa": 44,
        "tanim": "Hikâyede olayın geçtiği mekânın, zamanın ve kişilerin tanıtıldığı giriş bölümü.",
        "pattern": r"\bserim[a-zçğıöşü]*\b",
    },
    {
        "id": "tde1_dugum",
        "term": "Düğüm",
        "aliases": ["Gelişme", "Çatışma"],
        "unite_no": 2,
        "sayfa": 44,
        "tanim": "Olayların karmaşıklaştığı, merak ögesinin ve çatışmanın en üst noktaya ulaştığı gelişme bölümü.",
        "pattern": r"\bdüğüm[a-zçğıöşü]*\b|\bdugum[a-zçğıöşü]*\b",
    },
    {
        "id": "tde1_cozum",
        "term": "Çözüm",
        "aliases": ["Sonuç"],
        "unite_no": 2,
        "sayfa": 44,
        "tanim": "Düğümdeki merak ve çatışmaların aydınlandığı, hikâyenin neticelendiği sonuç bölümü.",
        "pattern": r"\bçözüm[a-zçğıöşü]*\b|\bcozum[a-zçğıöşü]*\b",
    },
    {
        "id": "tde1_hakim_bakis_acisi",
        "term": "Hâkim (İlahî) Bakış Açısı",
        "aliases": ["Tanrısal Bakış Açısı", "İlahî Bakış Açısı"],
        "unite_no": 2,
        "sayfa": 46,
        "tanim": "Anlatıcının her şeyi bildiği, kahramanların aklından geçenleri ve geçmiş/gelecek olayları gördüğü 3. tekil şahıslı bakış açısı.",
        "pattern": r"hâkim bakış açısı[a-zçğıöşü]*|hakim bakış açısı[a-zçğıöşü]*|ilahî bakış açısı[a-zçğıöşü]*|ilahi bakış açısı[a-zçğıöşü]*|tanrısal bakış açısı[a-zçğıöşü]*",
    },
    {
        "id": "tde1_kahraman_bakis_acisi",
        "term": "Kahraman Bakış Açısı",
        "aliases": ["Ben Anlatıcı"],
        "unite_no": 2,
        "sayfa": 46,
        "tanim": "Olayların hikâye kahramanlarından birinin gözüyle ve 1. tekil şahıs ('ben' veya 'biz') ağzından anlatıldığı bakış açısı.",
        "pattern": r"kahraman bakış açısı[a-zçğıöşü]*|kahraman bakis acisi[a-zçğıöşü]*",
    },
    {
        "id": "tde1_gozlemci_bakis_acisi",
        "term": "Gözlemci Bakış Açısı",
        "aliases": ["Kamera Bakış Açısı"],
        "unite_no": 2,
        "sayfa": 47,
        "tanim": "Anlatıcının bir kamera gibi sadece dışarıdan gördüklerini tarafsızca aktardığı, kahramanların iç dünyasını bilmediği bakış açısı.",
        "pattern": r"gözlemci bakış açısı[a-zçğıöşü]*|gozlemci bakis acisi[a-zçğıöşü]*",
    },

    # --- 3. ÜNİTE: ŞİİR VE AHENK ÖGELERİ ---
    {
        "id": "tde1_nazim_birimi",
        "term": "Nazım Birimi",
        "aliases": ["Dize", "Beyit", "Dörtlük", "Bent"],
        "unite_no": 3,
        "sayfa": 68,
        "tanim": "Şiiri oluşturan anlam ve şekilce bağımsız dize kümeleri (dize, beyit, dörtlük veya bent).",
        "pattern": r"nazım birimi[a-zçğıöşü]*|nazim birimi[a-zçğıöşü]*",
    },
    {
        "id": "tde1_hece_olcusu",
        "term": "Hece Ölçüsü",
        "aliases": ["Millî Ölçü"],
        "unite_no": 3,
        "sayfa": 72,
        "tanim": "Dizelerdeki hece sayılarının eşitliğine dayanan Türklerin millî şiir ölçüsü.",
        "pattern": r"hece ölçüsü[a-zçğıöşü]*|hece olcusu[a-zçğıöşü]*",
    },
    {
        "id": "tde1_aruz_olcusu",
        "term": "Aruz Ölçüsü",
        "aliases": ["Hecelerin Uzunluk-Kısalık Ölçüsü"],
        "unite_no": 3,
        "sayfa": 73,
        "tanim": "Hecelerin açık (kısa) veya kapalı (uzun) oluşuna göre düzenlenmiş Arap kökenli divan şiiri ölçüsü.",
        "pattern": r"aruz ölçüsü[a-zçğıöşü]*|aruz olcusu[a-zçğıöşü]*",
    },
    {
        "id": "tde1_serbest_olcu",
        "term": "Serbest Ölçü",
        "aliases": ["Ölçüsüz Şiir"],
        "unite_no": 3,
        "sayfa": 74,
        "tanim": "Herhangi bir hece sayısı veya aruz kuralına bağlı kalmaksızın yazılan modern şiir ölçüsü.",
        "pattern": r"serbest ölçü[a-zçğıöşü]*|serbest olcu[a-zçğıöşü]*",
    },
    {
        "id": "tde1_redif",
        "term": "Redif",
        "aliases": ["Aynı Görevli Ek"],
        "unite_no": 3,
        "sayfa": 76,
        "tanim": "Dize sonlarında kafiyeden sonra gelen, aynı görevdeki ek veya aynı anlamdaki tekrarlanan kelimeler.",
        "pattern": r"\bredif[a-zçğıöşü]*\b",
    },
    {
        "id": "tde1_kafiye",
        "term": "Kafiye (Uyak)",
        "aliases": ["Uyak"],
        "unite_no": 3,
        "sayfa": 78,
        "tanim": "Dize sonlarındaki kök halinde bulunan farklı görevdeki ses ve hece benzerliği.",
        "pattern": r"\bkafiye[a-zçğıöşü]*\b|\buyak[a-zçğıöşü]*\b",
    },
    {
        "id": "tde1_yarim_kafiye",
        "term": "Yarım Kafiye",
        "aliases": ["Tek Ses Benzerliği"],
        "unite_no": 3,
        "sayfa": 79,
        "tanim": "Dize sonlarında yalnızca tek bir ünsüz sesin benzeşmesiyle oluşan kafiye türü (halk şiirinde yaygındır).",
        "pattern": r"yarım kafiye[a-zçğıöşü]*|yarim kafiye[a-zçğıöşü]*|yarım uyak[a-zçğıöşü]*",
    },
    {
        "id": "tde1_tam_kafiye",
        "term": "Tam Kafiye",
        "aliases": ["İki Ses Benzerliği"],
        "unite_no": 3,
        "sayfa": 79,
        "tanim": "Dize sonlarında iki sesin (biri ünlü biri ünsüz veya bir uzun ünlü) benzeşmesiyle oluşan kafiye türü.",
        "pattern": r"tam kafiye[a-zçğıöşü]*|tam uyak[a-zçğıöşü]*",
    },
    {
        "id": "tde1_zengin_kafiye",
        "term": "Zengin Kafiye",
        "aliases": ["Üç veya Daha Fazla Ses Benzerliği"],
        "unite_no": 3,
        "sayfa": 80,
        "tanim": "Dize sonlarında üç veya daha fazla sesin benzeşmesiyle oluşan kafiye türü (divan edebiyatında yaygındır).",
        "pattern": r"zengin kafiye[a-zçğıöşü]*|zengin uyak[a-zçğıöşü]*",
    },
    {
        "id": "tde1_cinasli_kafiye",
        "term": "Cinaslı Kafiye",
        "aliases": ["Eşsesli Kafiye"],
        "unite_no": 3,
        "sayfa": 81,
        "tanim": "Yazılışları aynı, anlamları tamamen farklı olan (sesteş) kelimelerle yapılan kafiye türü.",
        "pattern": r"cinaslı kafiye[a-zçğıöşü]*|cinasli kafiye[a-zçğıöşü]*|cinaslı uyak[a-zçğıöşü]*",
    },
    {
        "id": "tde1_duz_kafiye",
        "term": "Düz Kafiye",
        "aliases": ["a-a-a-b", "a-a-b-b"],
        "unite_no": 3,
        "sayfa": 83,
        "tanim": "Dizelerin 'a-a-a-b' veya 'a-a-b-b' şeklinde sıralandığı kafiye düzeni.",
        "pattern": r"düz kafiye[a-zçğıöşü]*|duz kafiye[a-zçğıöşü]*|düz uyak[a-zçğıöşü]*",
    },
    {
        "id": "tde1_capraz_kafiye",
        "term": "Çapraz Kafiye",
        "aliases": ["a-b-a-b"],
        "unite_no": 3,
        "sayfa": 83,
        "tanim": "Birinciyle üçüncü, ikinciyle dördüncü dizenin birbiriyle uyaklandığı 'a-b-a-b' kafiye düzeni.",
        "pattern": r"çapraz kafiye[a-zçğıöşü]*|capraz kafiye[a-zçğıöşü]*|çapraz uyak[a-zçğıöşü]*",
    },
    {
        "id": "tde1_sarma_kafiye",
        "term": "Sarma Kafiye",
        "aliases": ["a-b-b-a"],
        "unite_no": 3,
        "sayfa": 84,
        "tanim": "Birinciyle dördüncü dizenin, ikinciyle üçüncü dizeyi sarmaladığı 'a-b-b-a' kafiye düzeni.",
        "pattern": r"sarma kafiye[a-zçğıöşü]*|sarma uyak[a-zçğıöşü]*",
    },
    {
        "id": "tde1_lirik_siir",
        "term": "Lirik Şiir",
        "aliases": ["Duygusal Şiir", "Coşkulu Şiir"],
        "unite_no": 3,
        "sayfa": 88,
        "tanim": "Aşk, ayrılık, hasret ve ölüm gibi bireysel duyguları coşkulu bir söyleyişle işleyen şiir türü.",
        "pattern": r"lirik şiir[a-zçğıöşü]*|lirik siir[a-zçğıöşü]*",
    },
    {
        "id": "tde1_pastoral_siir",
        "term": "Pastoral Şiir",
        "aliases": ["Kır Şiiri", "Doğa Şiiri"],
        "unite_no": 3,
        "sayfa": 89,
        "tanim": "Kır hayatını, çobanları, köy yaşantısını ve tabiat güzelliklerini sade bir dille anlatan şiir türü.",
        "pattern": r"pastoral şiir[a-zçğıöşü]*|pastoral siir[a-zçğıöşü]*",
    },
    {
        "id": "tde1_epik_siir",
        "term": "Epik Şiir",
        "aliases": ["Destansı Şiir", "Kahramanlık Şiiri"],
        "unite_no": 3,
        "sayfa": 90,
        "tanim": "Savaş, kahramanlık, yiğitlik ve vatan sevgisi gibi temaları coşkun bir üslupla işleyen şiir türü.",
        "pattern": r"epik şiir[a-zçğıöşü]*|epik siir[a-zçğıöşü]*",
    },
    {
        "id": "tde1_didaktik_siir",
        "term": "Didaktik Şiir",
        "aliases": ["Öğretici Şiir"],
        "unite_no": 3,
        "sayfa": 91,
        "tanim": "Belli bir düşünceyi aşılamak, öğüt vermek veya bilgi aktarmak amacıyla yazılan öğretici şiir türü.",
        "pattern": r"didaktik şiir[a-zçğıöşü]*|didaktik siir[a-zçğıöşü]*",
    },
    {
        "id": "tde1_satirik_siir",
        "term": "Satirik Şiir",
        "aliases": ["Taşlama", "Hiciv", "Yergi Şiiri"],
        "unite_no": 3,
        "sayfa": 92,
        "tanim": "Kişilerin veya toplumun aksayan, bozuk ve gülünç yönlerini alaycı bir dille eleştiren şiir türü.",
        "pattern": r"satirik şiir[a-zçğıöşü]*|satirik siir[a-zçğıöşü]*|yergi şiiri[a-zçğıöşü]*",
    },

    # --- 4. ÜNİTE: MASAL, FABL VE EDEBÎ SANATLAR ---
    {
        "id": "tde1_masal",
        "term": "Masal",
        "aliases": ["Halk Hikâyesi"],
        "unite_no": 4,
        "sayfa": 110,
        "tanim": "Genellikle tekerlemeyle başlayan, tamamen hayal ürünü, yer ve zamanı belirsiz, eğitici ve evrensel temalı halk anlatısı.",
        "pattern": r"\bmasal[a-zçğıöşü]*\b",
    },
    {
        "id": "tde1_doseme",
        "term": "Döşeme",
        "aliases": ["Tekerleme Bölümü"],
        "unite_no": 4,
        "sayfa": 112,
        "tanim": "Masalın başında dinleyicinin dikkatini çekmek için söylenen kalıplaşmış tekerlemelerden oluşan giriş bölümü ('Bir varmış bir yokmuş...').",
        "pattern": r"\bdöşeme[a-zçğıöşü]*\b|\bdoseme[a-zçğıöşü]*\b",
    },
    {
        "id": "tde1_dilek",
        "term": "Dilek",
        "aliases": ["Kutlama"],
        "unite_no": 4,
        "sayfa": 113,
        "tanim": "Masalın sonunda iyilerin kazandığını belirten ve iyi dileklerle biten son bölüm ('Onlar ermiş muradına...').",
        "pattern": r"\bdilek[a-zçğıöşü]*\b",
    },
    {
        "id": "tde1_fabl",
        "term": "Fabl",
        "aliases": ["Öykünce"],
        "unite_no": 4,
        "sayfa": 120,
        "tanim": "İnsan dışındaki canlı ve cansız varlıkların kişileştirilip konuşturulmasıyla insanlara ahlaki ders veren alegorik kısa anlatı.",
        "pattern": r"\bfabl[a-zçğıöşü]*\b",
    },
    {
        "id": "tde1_teshis",
        "term": "Teşhis (Kişileştirme)",
        "aliases": ["Kişileştirme"],
        "unite_no": 4,
        "sayfa": 124,
        "tanim": "İnsana ait özelliklerin insan dışındaki canlı veya cansız varlıklara aktarılması sanatı (örneğin ağlayan bulut, gülen rüzgâr).",
        "pattern": r"teşhis[a-zçğıöşü]*|teshis[a-zçğıöşü]*|kişileştirme[a-zçğıöşü]*|kisilestirme[a-zçğıöşü]*",
    },
    {
        "id": "tde1_intak",
        "term": "İntak (Konuşturma)",
        "aliases": ["Konuşturma"],
        "unite_no": 4,
        "sayfa": 125,
        "tanim": "İnsan dışındaki varlıkların insan gibi konuşturulması sanatı. Her intak sanatında zorunlu olarak teşhis de vardır.",
        "pattern": r"intak[a-zçğıöşü]*|konuşturma[a-zçğıöşü]*|konusturma[a-zçğıöşü]*",
    },
    {
        "id": "tde1_tesbih",
        "term": "Teşbih (Benzetme)",
        "aliases": ["Benzetme"],
        "unite_no": 4,
        "sayfa": 126,
        "tanim": "Aralarında ilgi bulunan iki şeyden zayıf olanı güçlü olana benzetme sanatı (benzeyen, kendisine benzetilen, benzetme yönü, benzetme edatı).",
        "pattern": r"teşbih[a-zçğıöşü]*|tesbih[a-zçğıöşü]*|benzetme[a-zçğıöşü]*",
    },
    {
        "id": "tde1_tezat",
        "term": "Tezat (Karşıtlık)",
        "aliases": ["Zıtlık"],
        "unite_no": 4,
        "sayfa": 128,
        "tanim": "Aralarındaki ilgiden dolayı birbirine zıt iki kavram, durum veya düşüncenin bir arada kullanılması sanatı.",
        "pattern": r"tezat[a-zçğıöşü]*|karşıtlık[a-zçğıöşü]*|zıtlık[a-zçğıöşü]*",
    },
    {
        "id": "tde1_mahlas",
        "term": "Mahlas",
        "aliases": ["Şair Adı", "Takma Ad"],
        "unite_no": 3,
        "sayfa": 94,
        "tanim": "Şairlerin şiirlerinde gerçek adları yerine kullandıkları takma ad (özellikle divan şiirinde son beyitte yer alır).",
        "pattern": r"\bmahlas[a-zçğıöşü]*\b",
    },
    {
        "id": "tde1_tapsirma",
        "term": "Tapşırma",
        "aliases": ["Halk Şiirinde Mahlas"],
        "unite_no": 3,
        "sayfa": 94,
        "tanim": "Âşık edebiyatında (halk şiirinde) şairin son dörtlükte adını veya mahlasını anması geleneği.",
        "pattern": r"\btapşırma[a-zçğıöşü]*\b|\btapsirma[a-zçğıöşü]*\b",
    },
]


def main() -> None:
    print("=== TDE 1 KAVRAM HARİTASI DOĞRULAMA VE ÜRETİM ===")
    print(f"Toplam tanımlanan kanonik TDE 1 kavramı: {len(CANONICAL_TDE1_CONCEPTS)}")

    # Standartlaştırma
    for item in CANONICAL_TDE1_CONCEPTS:
        item["subject"] = "TDE"
        item["ders"] = "TÜRK DİLİ VE EDEBİYATI – 1"
        item["ders_kodu"] = 811
        item["donem"] = 1

    # Kaydet
    OUT_CONCEPTS_PATH.parent.mkdir(parents=True, exist_ok=True)
    DATA_CONCEPTS_PATH.parent.mkdir(parents=True, exist_ok=True)

    OUT_CONCEPTS_PATH.write_text(json.dumps(CANONICAL_TDE1_CONCEPTS, indent=2, ensure_ascii=False), encoding="utf-8")
    DATA_CONCEPTS_PATH.write_text(json.dumps(CANONICAL_TDE1_CONCEPTS, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"[✓] Kaydedildi: {OUT_CONCEPTS_PATH}")
    print(f"[✓] Kaydedildi: {DATA_CONCEPTS_PATH}")


if __name__ == "__main__":
    main()

