/**
 * Official RU / UZ / EN copy for Author guidelines (rules) + FAQ pages.
 * Loaded before i18n.js; merged via window.__KIUT_RULES_FAQ_PACK.
 */
(function () {
 const L = {
 ru: {},
 uz: {},
 en: {},
 };

 /* ----- Rules: shared structure (languages filled below) ----- */
 function rulesPack(lang, o) {
 L[lang] = Object.assign(L[lang] || {}, o);
 }

 // --- RUSSIAN ---
 rulesPack('ru', {
 rules_imrad_banner_p_html:
 'Международный стандарт структуры научной статьи.<br><a href="https://en.wikipedia.org/wiki/IMRAD" target="_blank" rel="noopener noreferrer">Подробнее на Wikipedia →</a>',
 rules_imrad_words_html:
 '<div>Introduction</div><div>Methods</div><div>Results</div><div>And</div><div>Discussion</div>',
 rules_structure_h2: 'Структура статьи по стандарту IMRAD',
 rules_structure_intro: 'Раскройте каждый раздел, чтобы увидеть требования:',
 rules_sum_i: 'Introduction — Введение',
 rules_body_i_html:
 '<p>Отвечает на вопрос: <em>«Зачем проводилось исследование?»</em></p><ul><li>Актуальность темы и обоснование исследования</li><li>Краткий обзор существующей литературы (что уже известно)</li><li>Описание проблемы или пробела в знаниях</li><li>Чётко сформулированная цель и задачи работы</li></ul>',
 rules_sum_m: 'Methods — Материалы и методы',
 rules_body_m_html:
 '<p>Отвечает на вопрос: <em>«Как проводилось исследование?»</em></p><ul><li>Описание объекта/предмета исследования</li><li>Применённые методы, инструменты, оборудование</li><li>Порядок проведения эксперимента или анализа</li><li>Достаточно подробно, чтобы другие могли воспроизвести исследование</li></ul>',
 rules_sum_r: 'Results — Результаты',
 rules_body_r_html:
 '<p>Отвечает на вопрос: <em>«Что было обнаружено?»</em></p><ul><li>Изложение полученных данных без интерпретации</li><li>Таблицы, рисунки, графики — с подписями и ссылками в тексте</li><li>Статистические показатели (при необходимости)</li><li>Только факты — без выводов и обсуждения</li></ul>',
 rules_sum_a: 'And — связующее слово',
 rules_body_a_html:
 '<p>«And» — не отдельный раздел, а связь между Results и Discussion. В некоторых журналах разделы Results и Discussion объединяются в один: <strong>«Results and Discussion»</strong>.</p>',
 rules_sum_d: 'Discussion — Обсуждение и выводы',
 rules_body_d_html:
 '<p>Отвечает на вопрос: <em>«Что означают полученные результаты?»</em></p><ul><li>Интерпретация результатов в контексте литературы</li><li>Сравнение с данными других исследований</li><li>Объяснение неожиданных или противоречивых результатов</li><li>Ограничения исследования</li><li>Практическая значимость и направления будущих работ</li><li><strong>Заключение</strong> — краткие итоговые выводы (часто выносится отдельным разделом)</li></ul>',
 rules_extra_imrad_html:
 ' Помимо IMRAD-разделов статья должна содержать: <strong>Аннотацию</strong> (150–250 слов на языке статьи + на английском), <strong>Ключевые слова</strong> (5–10) и <strong>Список литературы</strong>.',
 rules_tech_h2: 'Технические требования к оформлению',
 rules_req_grid_html:
 '<div class="req-item"><strong>Формат файла</strong><span>DOCX / DOC</span></div><div class="req-item"><strong>Формат листа</strong><span>A4</span></div><div class="req-item"><strong>Поля</strong><span>2 см со всех сторон</span></div><div class="req-item"><strong>Шрифт</strong><span>Times New Roman, 14 пт</span></div><div class="req-item"><strong>Межстрочный интервал</strong><span>Полуторный (1,5)</span></div><div class="req-item"><strong>Выравнивание</strong><span>По ширине</span></div><div class="req-item"><strong>Абзацный отступ</strong><span>1,25 см</span></div><div class="req-item"><strong>Объём</strong><span>4–20 страниц</span></div><div class="req-item"><strong>Размер файла</strong><span>До 20 МБ</span></div><div class="req-item"><strong>Оригинальность</strong><span>Не менее 75%</span></div><div class="req-item"><strong>Соавторов</strong><span>Не более 5</span></div><div class="req-item"><strong>Источников</strong><span>Не менее 8 (стиль APA 7)</span></div>',
 rules_pdf_notice_html:
 '<strong>PDF не принимается.</strong> Рукописи принимаются только в форматах <strong>DOC</strong> или <strong>DOCX</strong>. Подача в PDF не допускается.',
 rules_freq_h2: 'Периодичность выхода',
 rules_freq_p_html:
 'Muarrix.kiut.uz выходит <strong>4 раза в год</strong> (ISSN 3060-4591). Актуальные сроки приёма и выхода номеров смотрите на главной странице и в разделе «Оплата и сроки».',
 rules_lit_h2: 'Список литературы',
 rules_lit_p_html:
 'Оформляется по стилю <strong>APA 7-го издания</strong> в алфавитном порядке. Ссылки в тексте — в квадратных скобках [1], [2, с. 15].',
 rules_lit_example_html:
 '<strong>Пример (журнальная статья):</strong><br>Иванов, И. И., &amp; Петров, П. П. (2024). Название статьи. <em>Название журнала, 5</em>(2), 45–58. https://doi.org/xxxxx',
 rules_lit_ul_html:
 '<ul><li>Не менее 8 источников, из них не менее 5 — за последние 5 лет</li><li>Не менее 30% источников — иностранные (англоязычные)</li><li>Самоцитирование — не более 20%</li></ul>',
 rules_ethics_h2: 'Этика публикации',
 rules_ethics_warn_html:
 ' Статьи с плагиатом, дублирующие уже опубликованные работы или поданные одновременно в несколько журналов — отклоняются автоматически.',
 rules_editor_box_title: 'Вопросы в отдел научных публикаций и редакции',
 rules_editor_box_sub: 'Контакты отдела научных публикаций и редакции Muarrix.kiut.uz и порядок подачи — на этой платформе',

 faq_cat_submission_h2: 'Подача статьи',
 faq_review_h2: 'Рецензирование и решение',
 faq_publication_h2: 'Публикация',
 faq_q1_q: 'Могу ли я подать статью, если я не из KIUT?',
 faq_q1_a_html:
 'Да. Muarrix.kiut.uz принимает статьи от авторов из любых организаций и университетов Узбекистана и других стран. Принадлежность к KIUT не является обязательным условием.',
 faq_q2_q: 'Сколько авторов может быть у одной статьи?',
 faq_q2_a_html:
 'Не более <strong>пяти соавторов</strong>. Все авторы (первый автор и соавторы) должны быть указаны в форме подачи и в тексте статьи с указанием организаций и email-адресов.',
 faq_q3_q: 'В каком формате нужно отправлять статью?',
 faq_q3_a_html:
 'Рукопись подаётся в форматах <strong>DOC</strong> или <strong>DOCX</strong>. Файлы <strong>PDF не принимаются</strong>. Размер файла — не более 20 МБ. Предпочтительно — DOCX, чтобы удобнее были правки и вёрстка.',
 faq_q4_q: 'Можно ли подать статью сразу в несколько журналов?',
 faq_q4_a_html:
 'Нет. Одновременная подача одной и той же статьи в несколько журналов запрещена. Это нарушает публикационную этику и приводит к отклонению материала.',
 faq_q5_q: 'На каких языках принимаются статьи?',
 faq_q5_a_html:
 'Принимаются статьи на узбекском, русском и английском языках. Аннотация и ключевые слова в любом случае дублируются на английском языке.',
 faq_q6_q: 'Сколько времени занимает рассмотрение статьи?',
 faq_q6_a_html:
 'Срок рецензирования — от 7 до 14 рабочих дней. О решении отдела научных публикаций и редакции вы получите уведомление по email и <strong>в личном кабинете на этом сайте</strong>.',
 faq_q7_q: 'Что значит «возвращено на доработку»?',
 faq_q7_a_html:
 'Это значит, что рецензенты выявили замечания, которые необходимо устранить. В письме и <strong>в личном кабинете на этом сайте</strong> будет примечание редактора. После внесения правок можно подать статью повторно.',
 faq_q8_q: 'Как я узнаю, что статья одобрена?',
 faq_q8_a_html:
 'При положительном решении отдела научных публикаций и редакции вам придёт письмо на email с официальным уведомлением. Также статус изменится <strong>в личном кабинете на этом сайте</strong> на «Одобрено».',
 faq_q9_q: 'Могу ли я узнать, кто рецензировал мою статью?',
 faq_q9_a_html:
 'Нет. Рецензирование проводится экспертами журнала; имена рецензентов автору не сообщаются.',
 faq_q10_q: 'Когда выйдет журнал с моей статьёй?',
 faq_q10_a_html:
 'Статья включается в ближайший выпуск после окончательного одобрения отделом научных публикаций и редакции. Журнал Muarrix.kiut.uz выходит <strong>4 раза в год</strong>. Конкретные даты выпусков уточняйте в отделе научных публикаций и редакции или в разделе «Оплата и сроки».',
 faq_contact_h: 'Не нашли ответ?',
 faq_contact_p: 'Напишите нам напрямую — мы ответим в течение рабочего дня.',
 });

 // --- ENGLISH ---
 rulesPack('en', {
 rules_imrad_banner_p_html:
 'International standard structure of a scholarly article.<br><a href="https://en.wikipedia.org/wiki/IMRAD" target="_blank" rel="noopener noreferrer">Read more on Wikipedia →</a>',
 rules_imrad_words_html:
 '<div>Introduction</div><div>Methods</div><div>Results</div><div>And</div><div>Discussion</div>',
 rules_structure_h2: 'Article structure according to IMRAD',
 rules_structure_intro: 'Open each section to see the requirements:',
 rules_sum_i: 'Introduction',
 rules_body_i_html:
 '<p>Answers the question: <em>Why was the study conducted?</em></p><ul><li>Relevance of the topic and rationale for the study</li><li>Brief overview of existing literature</li><li>Description of the problem or gap in knowledge</li><li>A clearly stated objective and aims</li></ul>',
 rules_sum_m: 'Materials and methods',
 rules_body_m_html:
 '<p>Answers the question: <em>How was the study conducted?</em></p><ul><li>Description of the subject/object of research</li><li>Methods, instruments and equipment used</li><li>Procedure of the experiment or analysis</li><li>Sufficient detail for others to reproduce the study</li></ul>',
 rules_sum_r: 'Results',
 rules_body_r_html:
 '<p>Answers the question: <em>What was found?</em></p><ul><li>Presentation of data without interpretation</li><li>Tables and figures — with captions and references in text</li><li>Statistics where applicable</li><li>Facts only — no discussion or conclusions</li></ul>',
 rules_sum_a: '‘And’ (link)',
 rules_body_a_html:
 '<p>“And” is not a separate section but links Results and Discussion. Some journals combine them into one <strong>‘Results and Discussion’</strong> section.</p>',
 rules_sum_d: 'Discussion / conclusions',
 rules_body_d_html:
 '<p>Answers the question: <em>What do the results mean?</em></p><ul><li>Interpretation in relation to literature</li><li>Comparison with other studies</li><li>Explanation of unexpected findings</li><li>Limitations</li><li>Practical implications and further research directions</li><li><strong>Conclusion</strong> — concise overall findings (often a separate section)</li></ul>',
 rules_extra_imrad_html:
 ' In addition to IMRAD sections, manuscripts must include: an <strong>abstract</strong> (150–250 words in the language of the article plus English), <strong>keywords</strong> (5–10), and <strong>a reference list</strong>.',
 rules_tech_h2: 'Technical formatting requirements',
 rules_req_grid_html:
 '<div class="req-item"><strong>File format</strong><span>DOCX / DOC</span></div><div class="req-item"><strong>Page size</strong><span>A4</span></div><div class="req-item"><strong>Margins</strong><span>2 cm on all sides</span></div><div class="req-item"><strong>Font</strong><span>Times New Roman, 14 pt</span></div><div class="req-item"><strong>Line spacing</strong><span>1.5</span></div><div class="req-item"><strong>Alignment</strong><span>Justified</span></div><div class="req-item"><strong>First-line indent</strong><span>1.25 cm</span></div><div class="req-item"><strong>Length</strong><span>4–20 pages</span></div><div class="req-item"><strong>File size</strong><span>Up to 20 MB</span></div><div class="req-item"><strong>Originality</strong><span>At least 75%</span></div><div class="req-item"><strong>Co-authors</strong><span>No more than 5</span></div><div class="req-item"><strong>References</strong><span>At least 8 (APA 7)</span></div>',
 rules_pdf_notice_html:
 '<strong>PDF is not accepted.</strong> Submissions are accepted only as <strong>DOC</strong> or <strong>DOCX</strong>.',
 rules_freq_h2: 'Publication frequency',
 rules_freq_p_html:
 'The Muarrix.kiut.uz is published <strong>four times a year</strong> (ISSN 3060-4591). See the home page and “Payment & deadlines” for current submission and issue dates.',
 rules_lit_h2: 'Reference list',
 rules_lit_p_html:
 'Use <strong>APA 7th edition</strong> in alphabetical order. In-text citations in square brackets [1], [2, p. 15].',
 rules_lit_example_html:
 '<strong>Example (journal article):</strong><br>Ivanov, I. I., &amp; Petrov, P. P. (2024). Article title. <em>Journal title, 5</em>(2), 45–58. https://doi.org/xxxxx',
 rules_lit_ul_html:
 '<ul><li>At least 8 sources; at least 5 from the past 5 years</li><li>At least 30% foreign (English-language) sources</li><li>Self-citation — no more than 20%</li></ul>',
 rules_ethics_h2: 'Publication ethics',
 rules_ethics_warn_html:
 ' Articles with plagiarism, duplication of published work or simultaneous submission to several journals will be rejected automatically.',
 rules_editor_box_title: 'Questions for the Department of Scientific Publications and Editorial',
 rules_editor_box_sub: 'Muarrix.kiut.uz Department of Scientific Publications and Editorial contacts and submission workflow — on this platform',

 faq_cat_submission_h2: 'Submitting a manuscript',
 faq_review_h2: 'Peer review and decision',
 faq_publication_h2: 'Publication',
 faq_q1_q: 'Can I submit if I am not affiliated with KIUT?',
 faq_q1_a_html:
 'Yes. The Muarrix.kiut.uz accepts authors from Uzbekistan and other countries. Being affiliated with KIUT is not required.',
 faq_q2_q: 'How many authors can a manuscript have?',
 faq_q2_a_html:
 'No more than <strong>five co-authors</strong>. Everyone must be listed in the submission form and in the manuscript with affiliation and email addresses.',
 faq_q3_q: 'Which file format should I use?',
 faq_q3_a_html:
 'Use <strong>DOC</strong> or <strong>DOCX</strong>. <strong>PDF is not accepted.</strong> Maximum file size is 20 MB. DOCX is preferred for corrections and layout.',
 faq_q4_q: 'May I submit the same manuscript to several journals at once?',
 faq_q4_a_html:
 'No. Simultaneous submission of the same work to multiple journals violates publication ethics and will lead to rejection.',
 faq_q5_q: 'In which languages are manuscripts accepted?',
 faq_q5_a_html:
 'Manuscripts may be in Uzbek, Russian or English. The abstract and keywords must always appear in English as well.',
 faq_q6_q: 'How long does peer review take?',
 faq_q6_a_html:
 'Peer review usually takes <strong>7–14 business days</strong>. You will be notified by email and <strong>in your author account on this site</strong>.',
 faq_q7_q: 'What does “revise and resubmit” mean?',
 faq_q7_a_html:
 'Reviewers asked for changes. You will see comments in the email and <strong>in your account on this site</strong>. After revisions you may resubmit.',
 faq_q8_q: 'How will I know my article was accepted?',
 faq_q8_a_html:
 'You will receive an official email. The status in <strong>your author account on this site</strong> will also change to “Accepted”.',
 faq_q9_q: 'Can I find out who reviewed my paper?',
 faq_q9_a_html:
 'No. We use double-blind peer review: authors and reviewers do not know each other’s identities.',
 faq_q10_q: 'When will the issue with my article appear?',
 faq_q10_a_html:
 'Your article is scheduled for the next issue after final acceptance by the Department of Scientific Publications and Editorial. The Muarrix.kiut.uz journal is published <strong>four times a year</strong>. See “Payment & deadlines” or contact the Department of Scientific Publications and Editorial for exact dates.',
 faq_contact_h: 'Still have a question?',
 faq_contact_p: 'Write to us — we usually reply within one business day.',
 });

 // --- UZBEK (Latin) ---
 rulesPack('uz', {
 rules_imrad_banner_p_html:
 'Ilmiy maqola tuzilmasining xalqaro standarti.<br><a href="https://en.wikipedia.org/wiki/IMRAD" target="_blank" rel="noopener noreferrer">Wikipediyada batafsil →</a>',
 rules_imrad_words_html:
 '<div>Kirish (Introduction)</div><div>Metodlar (Methods)</div><div>Natijalar (Results)</div><div>And</div><div>Muhokama (Discussion)</div>',
 rules_structure_h2: 'IMRAD standartiga asoslangan maqola tuzilishi',
 rules_structure_intro: 'Talablarni bilish uchun har bir bobni oching:',
 rules_sum_i: 'Introduction — Kirish',
 rules_body_i_html:
 '<p>Savolga javob: <em>Nima uchun tadqiqat o‘tkazildi?</em></p><ul><li>Mavzuning dolzarbligi va tadqiqat asoslanganligi</li><li>Rivojlangan adabiyotlar qisqacha sharhi</li><li>Muammo yoki bilim boʻshligʻini tavsifi</li><li>Aniq maqsad va vazifalar</li></ul>',
 rules_sum_m: 'Methods — Materiallar va metodlar',
 rules_body_m_html:
 '<p>Savolga javob: <em>Tadqiqat qanday o‘tkazildi?</em></p><ul><li>Tadqiqat obʼyekti/subʼyektining tavsifi</li><li>Qo‘llanilgan metodlar, vositalar, jihozlar</li><li>Tajriba yoki tahlil tartibi</li><li>Boshqalar tadqiqatni takrorlashi uchun yetarlicha batafsil</li></ul>',
 rules_sum_r: 'Results — Natijalar',
 rules_body_r_html:
 '<p>Savolga javob: <em>Nima aniqlandi?</em></p><ul><li>Interpretatsiyasiz maʼlumotlarning bayoni</li><li>Jadval, rasmlar, grafiklar — sarlavha va matndagi havolalar bilan</li><li>Kerak bo‘lsa statistik ko‘rsatkichlar</li><li>Faqat faktlar — muhokama va xulosalar yo‘q</li></ul>',
 rules_sum_a: 'And — bog‘lovchi so‘z',
 rules_body_a_html:
 '<p>“And” — alohida bo‘lim emas, Results va Discussion oʻrtasidagi bog‘langanlik. Baʼzi jurnallarda ikkalasini bitta bob — <strong>«Results and Discussion»</strong> — qilib birlashtiriladi.</p>',
 rules_sum_d: 'Discussion — Muhokama va xulosalar',
 rules_body_d_html:
 '<p>Savolga javob: <em>Natijalar nimani anglatadi?</em></p><ul><li>Adabiyot fonida talqin</li><li>Boshqa tadqiqatlar bilan solishtirish</li><li>Kutilmagan natijalar tushuntirilishi</li><li>Tadqiqot cheklovlari</li><li>Amaliy ahamiyat va keyingi tadqiqot yoʻnalishlari</li><li><strong>Xulosa</strong> — qisqa yakuniy xulosalar (ko‘pincha alohida bob)</li></ul>',
 rules_extra_imrad_html:
 ' IMRAD bo‘limlaridan tashqari maqola: <strong>annotatsiya</strong> (maqola tilida 150–250 so‘z + inglizchada), <strong>kalit so‘zlar</strong> (5–10) va <strong>adabiyotlar ro‘yxati</strong>ni o‘z ichiga olishi kerak.',
 rules_tech_h2: 'Texnik rasmiylashtirish talablari',
 rules_req_grid_html:
 '<div class="req-item"><strong>Fayl formati</strong><span>DOCX / DOC</span></div><div class="req-item"><strong>Sahifa hajmi</strong><span>A4</span></div><div class="req-item"><strong>Chekka marginlar</strong><span>Har tomondan 2 sm</span></div><div class="req-item"><strong>Shrift</strong><span>Times New Roman, 14 pt</span></div><div class="req-item"><strong>Qatorlar oralig‘i</strong><span>Bir yarim (1,5)</span></div><div class="req-item"><strong>Xizalanish</strong><span>Bo‘yinchoq (justified)</span></div><div class="req-item"><strong>Paragraf boshi indenti</strong><span>1,25 sm</span></div><div class="req-item"><strong>Uslubiy hajm</strong><span>4–20 sahifa</span></div><div class="req-item"><strong>Fayl hajmi</strong><span>20 MB gacha</span></div><div class="req-item"><strong>Original matn ulushi</strong><span>Kamida 75%</span></div><div class="req-item"><strong>Mualliflar soni</strong><span>Odatda 5 tadan ortiq emas</span></div><div class="req-item"><strong>Foydalanilgan adabiyot</strong><span>Kamida 8 (APA 7 uslubi)</span></div>',
 rules_pdf_notice_html:
 '<strong>PDF qabul qilinmaydi.</strong> Faqat <strong>DOC</strong> yoki <strong>DOCX</strong> formatida topshiriladi.',
 rules_freq_h2: 'Chiqish davriyligi',
 rules_freq_p_html:
 'Muarrix.kiut.uz <strong>yiliga to‘rt marta</strong> chiqadi (ISSN 3060-4591). Joriy qabul va chiqish muddatlari — bosh sahifada va «To‘lov va muddatlar» bo‘limida.',
 rules_lit_h2: 'Adabiyotlar roʻyxati',
 rules_lit_p_html:
 'Alifbo tartibida <strong>APA 7-nashr</strong> boʻyicha rasmiylashtiriladi. Matndagi havolalar — kvadrat qavslarda [1], [2, b. 15].',
 rules_lit_example_html:
 '<strong>Namuna (jurnal maqolasi):</strong><br>Ivanov, I. I., va Petrov, P. P. (2024). Maqola nomi. <em>Jurnal nomi, 5</em>(2), 45–58. https://doi.org/xxxxx',
 rules_lit_ul_html:
 '<ul><li>Kamida 8 manba; undan kamida 5 tasi oxirgi besh yildan</li><li>Manbalarning kamida 30% qismi ingliz tilidagi xorijiy adabiyot boʻlishi boʻyicha tavsiya etiladi</li><li>Oʻz oʻziga iqtibos — 20% dan oshmagan maqullaniladi</li></ul>',
 rules_ethics_h2: 'Nashr etikasi',
 rules_ethics_warn_html:
 ' Plagiatlangan, boshqa joyda chiqgan yoki bir vaqtning oʻzida bir necha jurnalga yuborilgan maqolar avtomatik rad etiladi.',
 rules_editor_box_title: 'Ilmiy nashrlar va tahririyat bo‘limiga savollar',
 rules_editor_box_sub: 'Muarrix.kiut.uz ilmiy nashrlar va tahririyat bo‘limi aloqasi va topshirish tartibi — ushbu platformada',

 faq_cat_submission_h2: 'Maqola topshirish',
 faq_review_h2: 'Tavsiya va qaror',
 faq_publication_h2: 'Chop etish',
 faq_q1_q: 'KIUT dan bo‘lmasam ham maqola topshira olamanmi?',
 faq_q1_a_html:
 'Ha. Muarrix.kiut.uz O‘zbekiston va boshqa mamlakatlar mualliflarini qabul qiladi. KIUT da ishlash shart emas.',
 faq_q2_q: 'Bitta maqolada nechta muallif bo‘lishi mumkin?',
 faq_q2_a_html:
 'Ko‘pchilik talablarida <strong>beshta muallifgacha</strong> (asosiy muallif + ham mualliflar). Barcha mualliflar topshiruv shaklida va maqola matnida — tashkilot hamda elektron pochta bilan ko‘rsatiladi.',
 faq_q3_q: 'Maqolani qanday formatda yuborish kerak?',
 faq_q3_a_html:
 'Qo‘lyozmani <strong>DOC</strong> yoki <strong>DOCX</strong> formatida yuboring; <strong>PDF qabul qilinmaydi</strong>. Fayl hajmi 20 MB dan oshmagan boʻlishi kerak. Tuzatishlar qulay boʻlishi uchun DOCX ustuvor.',
 faq_q4_q: 'Xuddi shu maqolani bir nechta jurnallarga parallel topshirish mumkinmi?',
 faq_q4_a_html:
 'Yo‘q. Bir xil qoʻlyozmani bir vaqtning oʻzida bir nechta jurnallarga topshirish nashr axloqiga zid boʻlib, material rad etilishiga sabab boʻladi.',
 faq_q5_q: 'Qanday til(lar)da maqolar qabul qilinadi?',
 faq_q5_a_html:
 'O‘zbekcha, rus va ingliz tillaridagi maqolar qabul qilinadi. Annotatsiya va kalit so‘zlar esa har doim ingliz tilida takrorlanishi lozim.',
 faq_q6_q: 'Maqolaning ko‘rib chiqilishi taxminan qancha vaqt oladi?',
 faq_q6_a_html:
 'Ko‘pchilik hollarda taqriz muddati <strong>7–14 ish kuni</strong>. Ilmiy nashrlar va tahririyat bo‘limi qarori haqida email va <strong>ushbu saytdagi shaxsiy kabinet</strong> orqali bildirasiz.',
 faq_q7_q: '«Qayta ishlash uchun qaytarilgan» degani nima?',
 faq_q7_a_html:
 'Bu shuni anglatadiki, tavsiya qiluvchilar tuzatish talab qilgan. Email va <strong>ushbu saytdagi shaxsiy kabinet</strong>da tahrirchi izohlari chiqadi; tuzatishlardan so\'ng yangilangan maqolangizni qayta topshirishingiz mumkin.',
 faq_q8_q: 'Maqola qabul qilinganini qanday bilaman?',
 faq_q8_a_html:
 'Rasmiy email keladi hamda <strong>ushbu saytdagi shaxsiy kabinet</strong>da status, masalan, «Qabul qilindi» (Accepted) deb yangilanadi.',
 faq_q9_q: 'Maqolamni kim taqrizlaganini bilishim mumkinmi?',
 faq_q9_a_html:
 'Yo‘q. Ikki tomonlama koʻr-koʻrsatmas (double-blind) taqriz qo‘llaniladi: mualliflar va tavsiya qiluvchilar bir-birini bilmasligi kerak.',
 faq_q10_q: 'Maqolam chiqqan jurnal qachon chiqadi?',
 faq_q10_a_html:
 'Ilmiy nashrlar va tahririyat bo‘limi yakuniy qabul qilgach, maqola navbatdagi son qatoriga qo‘yiladi. Muarrix.kiut.uz jurnali <strong>yiliga to‘rt marta</strong> chiqadi. Aniq sanalar — «To‘lov va muddatlar» bo‘limida yoki ilmiy nashrlar va tahririyat bo‘limida.',
 faq_contact_h: 'Javob topilmadimi?',
 faq_contact_p: 'To‘g‘ridan-to‘g‘ri yozing — odatda bir ish kuni ichida javob beramiz.',
 });

 window.__KIUT_RULES_FAQ_PACK = L;
})();
