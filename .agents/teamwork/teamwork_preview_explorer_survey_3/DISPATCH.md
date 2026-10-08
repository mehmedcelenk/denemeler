## 2026-10-06T21:53:49Z
You are Explorer 3 (teamwork_preview_explorer_survey_3).
Your working directory is: /home/mehmedbaykan/Homepage/codes/ortaklar/.agents/teamwork/teamwork_preview_explorer_survey_3/
You must read the user request at: /home/mehmedbaykan/Homepage/codes/ortaklar/.agents/teamwork/ORIGINAL_REQUEST.md

Task:
Investigate the MEB AÖL Tarih curriculum and any existing classification tools, taxonomies, or mapping scripts in the repository.
Specifically explore:
1. What existing classification, taxonomy, or NLP/LLM scripts exist in `scripts/` (e.g., look in `scripts/`, `scripts/analiz/`, `scripts/core/`, prompt files, taxonomy JSONs/pythons)? How did previous classification runs operate?
2. What is the official MEB AÖL course structure for History:
   - Tarih 1, Tarih 2, Tarih 3, Tarih 4, Tarih 5, Tarih 6, Tarih 7, Tarih 8
   - T.C. İnkılap Tarihi ve Atatürkçülük 1, T.C. İnkılap Tarihi ve Atatürkçülük 2
   - What are the corresponding MEB course codes (e.g., 131, 132, 133, 134, etc. or similar AÖL codes in the data)?
3. What is the canonical topic and subtopic taxonomy covering all periods:
   - İlk ve Orta Çağlarda Türk Dünyası, İslam Medeniyeti, Türk-İslam Devletleri, Osmanlı Tarihi (Kuruluş, Yükselme, Duraklama, Gerileme, Dağılma), 20. Yüzyıl Başlarında Osmanlı, Milli Mücadele / Kurtuluş Savaşı, Atatürkçülük ve Türk İnkılabı, İki Savaş Arası Dönem, II. Dünya Savaşı, Soğuk Savaş, Çağdaş Türk ve Dünya Tarihi, vb.
4. How should the MEB taxonomy be formally structured (e.g. JSON schema / Python dataclass) so that batch reclassification scripts can strictly validate against it without fallback catches?

Output:
Write your comprehensive findings to `/home/mehmedbaykan/Homepage/codes/ortaklar/.agents/teamwork/teamwork_preview_explorer_survey_3/report.md` and create `handoff.md` in your directory.
Send a message to caller when done.
