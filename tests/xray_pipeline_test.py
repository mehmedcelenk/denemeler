#!/usr/bin/env python3
"""
scripts/cumle_xray_pipeline.py için birim test paketi.
Tüm MEB dilbilgisi kurallarını ve istisnaları uçtan uca doğrular.
"""

import sys
import unittest
from pathlib import Path

# Script modülünü import etmek için yolu ekle
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
from cumle_xray_pipeline import (
    is_poetry_or_verse,
    is_locative_word,
    is_ablative_word,
    is_dative_word,
    is_accusative_word,
    parse_question_stem_rule,
    validate_and_convert,
)


class TestCumleXrayPipeline(unittest.TestCase):

    def test_valid_sentence_conversion(self):
        """Kusursuz cümle etiketlemesi onaylanmalı ve HTML üretmelidir."""
        raw = "Yazar, Anadolu romanının özelliklerini bu makalesinde ortaya koydu."
        tagged = "<SUB>Yazar</SUB>, <OBJ>Anadolu romanının özelliklerini</OBJ> <ADV>bu makalesinde</ADV> <VERB>ortaya koydu</VERB>."
        
        ok, html, conf, reason = validate_and_convert(raw, tagged)
        self.assertTrue(ok, f"Doğrulama başarısız: {reason}")
        self.assertEqual(conf, 0.98)
        self.assertIn('class="xray-sub" title="Özne">Yazar</span>', html)
        self.assertIn('class="xray-obj" title="Nesne">Anadolu romanının özelliklerini</span>', html)
        self.assertIn('class="xray-adv" title="Tümleç / Zarf">bu makalesinde</span>', html)
        self.assertIn('class="xray-verb" title="Yüklem">ortaya koydu</span>.', html)

    def test_protect_nominative_roots_as_subject(self):
        """Kökü -ye, -tan, -da ile biten yalın isimlerin (hikâye, destan, vatan) özne olabilmesi."""
        # Hikâye (-ye ile biter ama yalındır)
        raw1 = "Hikâye, insanı derinden etkileyen bir türdür."
        tagged1 = "<SUB>Hikâye</SUB>, <OBJ>insanı derinden etkileyen bir türdür</OBJ>."  # İsim cümlesi obj içeremez
        # İsim cümlesi obj içeremez kuralını da doğrulamak için:
        tagged1_ok = "<SUB>Hikâye</SUB>, <ADV>insanı derinden etkileyen</ADV> <VERB>bir türdür</VERB>."
        ok1, _, _, reason1 = validate_and_convert(raw1, tagged1_ok)
        self.assertTrue(ok1, f"Hikâye yalın özne kabul edilmeliydi: {reason1}")

        # Destan (-tan ile biter ama yalındır)
        raw2 = "Destan milletlerin ortak hafızasıdır."
        tagged2 = "<SUB>Destan</SUB> <VERB>milletlerin ortak hafızasıdır</VERB>."
        ok2, _, _, reason2 = validate_and_convert(raw2, tagged2)
        self.assertTrue(ok2, f"Destan yalın özne kabul edilmeliydi: {reason2}")

        # Beyazıt Meydanı (-ı iyelik ekiyle özne olabilir)
        raw3 = "Beyazıt Meydanı yağmurun altında pırıl pırıl görünüyordu."
        tagged3 = "<SUB>Beyazıt Meydanı</SUB> <ADV>yağmurun altında</ADV> <ADV>pırıl pırıl</ADV> <VERB>görünüyordu</VERB>."
        ok3, _, _, reason3 = validate_and_convert(raw3, tagged3)
        self.assertTrue(ok3, f"Beyazıt Meydanı özne kabul edilmeliydi: {reason3}")

    def test_reject_altered_text(self):
        """Metin içindeki 1 harf veya kelime değiştiğinde anında reddedilmelidir."""
        raw = "Öğretmen bize bütün bildiklerini anlattı."
        tagged = "<SUB>Öğretmen</SUB> <ADV>bana</ADV> <OBJ>bütün bildiklerini</OBJ> <VERB>anlattı</VERB>."  # "bize" -> "bana"
        ok, _, _, reason = validate_and_convert(raw, tagged)
        self.assertFalse(ok)
        self.assertIn("Metin aslı bozuldu", reason)

    def test_reject_unclosed_or_nested_tags(self):
        """Kapanmamış veya iç içe girmiş tag'ler reddedilmelidir."""
        raw = "Ahmet kitabı okudu."
        tagged_nested = "<SUB>Ahmet <OBJ>kitabı</OBJ></SUB> <VERB>okudu</VERB>."
        ok, _, _, reason = validate_and_convert(raw, tagged_nested)
        self.assertFalse(ok)
        self.assertIn("İç içe veya geçersiz", reason)

    def test_reject_punctuation_inside_tags(self):
        """Noktalama işareti tag içine dahil edildiyse reddedilmelidir."""
        raw = "Yazar, geldi."
        tagged = "<SUB>Yazar,</SUB> <VERB>geldi.</VERB>"
        ok, _, _, reason = validate_and_convert(raw, tagged)
        self.assertFalse(ok)
        self.assertIn("Noktalama işareti tag içine dahil", reason)

    def test_reject_missing_verb(self):
        """Yüklem (<VERB>) içermeyen çıktı reddedilmelidir."""
        raw = "Meyve yüklü ağaç dalları."
        tagged = "<SUB>Meyve yüklü ağaç dalları</SUB>."
        ok, _, _, reason = validate_and_convert(raw, tagged)
        self.assertFalse(ok)
        self.assertIn("Cümlede yüklem (<VERB>) bulunamadı", reason)

    def test_reject_case_suffixes_as_subject(self):
        """Hal eki (-de, -den, -e, -i) almış sözcükler ASLA <SUB> olamaz."""
        # Bulunma eki (-de)
        raw1 = "Hikâyelerinde toplum sorunlarını ele alır."
        tagged1 = "<SUB>Hikâyelerinde</SUB> <OBJ>toplum sorunlarını</OBJ> <VERB>ele alır</VERB>."
        ok1, _, _, reason1 = validate_and_convert(raw1, tagged1)
        self.assertFalse(ok1)
        self.assertIn("Bulunma hali eki", reason1)

        # Ayrılma eki (-den)
        raw2 = "Gelenekten yararlanmıştır."
        tagged2 = "<SUB>Gelenekten</SUB> <VERB>yararlanmıştır</VERB>."
        ok2, _, _, reason2 = validate_and_convert(raw2, tagged2)
        self.assertFalse(ok2)
        self.assertIn("Ayrılma hali eki", reason2)

        # Yönelme eki (-e, -a, -ye, -ya, bize)
        raw3 = "Bize her şeyi anlattı."
        tagged3 = "<SUB>Bize</SUB> <OBJ>her şeyi</OBJ> <VERB>anlattı</VERB>."
        ok3, _, _, reason3 = validate_and_convert(raw3, tagged3)
        self.assertFalse(ok3)
        self.assertIn("Yönelme hali eki", reason3)

        # Belirtme eki (-ini, -ını, -i)
        raw4 = "Romanını büyük bir zevkle okudum."
        tagged4 = "<SUB>Romanını</SUB> <ADV>büyük bir zevkle</ADV> <VERB>okudum</VERB>."
        ok4, _, _, reason4 = validate_and_convert(raw4, tagged4)
        self.assertFalse(ok4)
        self.assertIn("Belirtme hali eki", reason4)

    def test_reject_nominal_sentence_with_object(self):
        """İsim cümlelerinde ('var', 'yok', 'değil') ASLA nesne bulunamaz."""
        raw = "Bunda bir yanlışlık vardır."
        tagged = "<ADV>Bunda</ADV> <OBJ>bir yanlışlık</OBJ> <VERB>vardır</VERB>."  # Hatalı: 'bir yanlışlık' nesne yapılmış
        ok, _, _, reason = validate_and_convert(raw, tagged)
        self.assertFalse(ok)
        self.assertIn("İsim cümlesinde", reason)

    def test_reject_postposition_as_subject_or_object(self):
        """Edat öbekleri ('için', 'gibi', 'göre') asla özne veya nesne olamaz."""
        raw = "Bizim için çok önemlidir."
        tagged = "<SUB>Bizim için</SUB> <ADV>çok</ADV> <VERB>önemlidir</VERB>."
        ok, _, _, reason = validate_and_convert(raw, tagged)
        self.assertFalse(ok)
        self.assertIn("Edat/zarf kalıbı", reason)

    def test_question_stem_rule_parsing_variations(self):
        """Tüm MEB soru kökü varyasyonlarının kural motoruyla doğru ayrılması."""
        # 1. hangisi / hangileri -> Özne
        stem1 = "Aşağıdakilerden hangisi yanlıştır?"
        html1 = parse_question_stem_rule(stem1)
        self.assertIsNotNone(html1)
        self.assertIn('class="xray-sub" title="Özne">Aşağıdakilerden hangisi</span>', html1)
        self.assertIn('class="xray-verb" title="Yüklem">yanlıştır?</span>', html1)

        stem1_pl = "Numaralanmış cümlelerden hangileri doğrudur?"
        html1_pl = parse_question_stem_rule(stem1_pl)
        self.assertIsNotNone(html1_pl)
        self.assertIn('class="xray-sub" title="Özne">Numaralanmış cümlelerden hangileri</span>', html1_pl)

        # 2. hangisinde / hangilerinde [öge] vardır? -> [öge]=Özne, vardır=Yüklem
        stem2 = "Aşağıdaki cümlelerin hangisinde yazım yanlışı vardır?"
        html2 = parse_question_stem_rule(stem2)
        self.assertIsNotNone(html2)
        self.assertIn('class="xray-adv" title="Tümleç / Zarf">Aşağıdaki cümlelerin hangisinde</span>', html2)
        self.assertIn('class="xray-sub" title="Özne">yazım yanlışı</span>', html2)
        self.assertIn('class="xray-verb" title="Yüklem">vardır?</span>', html2)

        # 3. hangisine -> Yer Tamlayıcısı
        stem3 = "Bu parçadan hareketle aşağıdakilerden hangisine ulaşılamaz?"
        html3 = parse_question_stem_rule(stem3)
        self.assertIsNotNone(html3)
        self.assertIn('class="xray-adv" title="Tümleç / Zarf">aşağıdakilerden hangisine</span>', html3)
        self.assertIn('class="xray-verb" title="Yüklem">ulaşılamaz?</span>', html3)

        # 4. hangisiyle -> Vasıta / Zarf Tümleci
        stem4 = "Bu parça edebiyatın aşağıdaki bilgi dallarından hangisiyle ilişkilendirilebilir?"
        html4 = parse_question_stem_rule(stem4)
        self.assertIsNotNone(html4)
        self.assertIn('class="xray-adv" title="Tümleç / Zarf">edebiyatın aşağıdaki bilgi dallarından hangisiyle</span>', html4)

        # 5. hangisini -> Belirtili Nesne
        stem5 = "Aşağıdakilerden hangisini amaçlamaktadır?"
        html5 = parse_question_stem_rule(stem5)
        self.assertIsNotNone(html5)
        self.assertIn('class="xray-obj" title="Nesne">Aşağıdakilerden hangisini</span>', html5)

    def test_poetry_detection(self):
        """Şiir ve dize formatındaki metinler otomatik tespit edilmelidir."""
        poem = (
            "Beni candan usandırdı cefâdan yâr uslanmaz\n"
            "Felekler yandı âhımdan murâdım şem'i yanmaz"
        )
        self.assertTrue(is_poetry_or_verse(poem))

        prose = "Yazar romanında toplumsal sorunları gerçekçi bir bakış açısıyla ele almıştır."
        self.assertFalse(is_poetry_or_verse(prose))


if __name__ == "__main__":
    unittest.main()
