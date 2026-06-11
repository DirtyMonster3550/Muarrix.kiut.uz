(function () {
 const STORAGE_KEY = 'kiut_lang';
 const LEGAL_LANG = ['uz', 'ru', 'en'];

 const DOC_TITLE = {
 index: { ru: 'title_index', uz: 'title_index', en: 'title_index' },
 archives: { ru: 'title_archives', uz: 'title_archives', en: 'title_archives' },
 archive_issue: { ru: 'title_archive_issue', uz: 'title_archive_issue', en: 'title_archive_issue' },
 payment: { ru: 'title_payment', uz: 'title_payment', en: 'title_payment' },
 login: { ru: 'title_login', uz: 'title_login', en: 'title_login' },
 register: { ru: 'title_register', uz: 'title_register', en: 'title_register' },
 reset: { ru: 'title_reset', uz: 'title_reset', en: 'title_reset' },
 dashboard: { ru: 'title_dashboard', uz: 'title_dashboard', en: 'title_dashboard' },
 expert: { ru: 'title_expert', uz: 'title_expert', en: 'title_expert' },
 how: {
 ru: 'Как опубликовать статью — Muarrix.kiut.uz',
 uz: 'Maqola chop etish — Muarrix.kiut.uz',
 en: 'How to publish — Muarrix.kiut.uz',
 },
 rules: {
 ru: 'Правила для авторов — Muarrix.kiut.uz',
 uz: 'Mualliflar uchun qoidalar — Muarrix.kiut.uz',
 en: 'Author guidelines — Muarrix.kiut.uz',
 },
 faq: {
 ru: 'Вопрос — ответ — Muarrix.kiut.uz',
 uz: 'Savol-javob — Muarrix.kiut.uz',
 en: 'FAQ — Muarrix.kiut.uz',
 },
 about: {
 ru: 'О журнале — Muarrix.kiut.uz',
 uz: 'Jurnal haqida — Muarrix.kiut.uz',
 en: 'About the journal — Muarrix.kiut.uz',
 },
 editorial: {
 ru: 'Редакционный совет — Muarrix.kiut.uz',
 uz: 'Tahririy kengash — Muarrix.kiut.uz',
 en: 'Editorial board — Muarrix.kiut.uz',
 },
 };

 /** Base UI strings merged with optional official content pack (rules + FAQ). */
 const STRINGS_BASE = {
 ru: {
 breadcrumb_home: 'Главная',
 bc_parent: 'Muarrix.kiut.uz',
 brand_title_main: 'Muarrix.kiut.uz',
 journal_nav_label: 'Раздел:',
 uni_brand_line: 'Kimyo International University in Tashkent',
 hero_lead:
 'Переход на официальные сайты научных журналов, сборников конференций и смежных изданий KIUT',
 hub_nav_aria: 'Справочные разделы',
 hub_section_title: 'Научные журналы и конференции',
 hub_section_desc:
 'Выберите издание — откроется официальный сайт редакции, где размещены правила и приём материалов.',
 nav_publish: 'Как опубликовать статью',
 nav_rules: 'Правила для авторов',
 nav_faq: 'Вопрос — ответ',
 nav_current_issue: 'Текущий выпуск',
 nav_archive: 'Архив',
 nav_submit: 'Подать статью',
 nav_payment: 'Оплата и сроки',
 footer_kiut: 'www.kiut.uz',
 footer_copy_suffix: 'Kimyo International University in Tashkent · ул. Шота Руставели, 156, Ташкент',
 lang_switch_aria: 'Язык интерфейса',
 breadcrumb_hub_name: 'Muarrix.kiut.uz',
 breadcrumb_how: 'Как опубликовать статью',
 breadcrumb_rules: 'Правила для авторов',
 breadcrumb_faq: 'Вопрос — ответ',
 breadcrumb_about: 'О журнале',
 breadcrumb_editorial: 'Редакционный совет',
 card_cta_journal: 'Сайт журнала {j} →',
 card_cta_conf: 'Сайт конференций →',
 card_desc_finecs: 'Международный журнал финансов и экономической стабильности, включенный в список журналов, рекомендованных ВАК РУз',
 card_desc_stem: 'Центральноазиатский Muarrix.kiut.uz-журнал, включенный в список журналов, рекомендованных ВАК РУз',
 card_title_conf: 'Сборник конференции',
 card_desc_conf: 'KIUT Conferences — материалы и тезисы',
 card_desc_muarrix: 'Исторический научный журнал, включенный в перечень журналов, рекомендованных ВАК РУз',
 card_desc_ehl: 'Журнал гуманитарных наук и языка',
 card_desc_med: 'Медицинские публикации',
 card_cta_med: 'Сайт Journal of digital medicine →',
 how_h1: ' Как опубликовать статью',
 how_lead_start: 'Публикация в ',
 how_lead_strong: 'Muarrix.kiut.uz',
 how_lead_end:
 ' оформляется на этой платформе. Регистрация и подача рукописи — через личный кабинет автора на этом сайте.',
 how_steps_title: 'Пошаговая инструкция',
 how_s1t: 'Зарегистрируйтесь на платформе',
 how_s1p:
 'Создайте аккаунт автора: «Подать статью» или «Регистрация». Журнал — Muarrix.kiut.uz (ISSN 2181-2934).',
 how_s2t: 'Ознакомьтесь с правилами оформления',
 how_s2p_before: 'Подготовьте рукопись согласно ',
 how_s2p_link: 'правилам для авторов',
 how_s2p_after: ': структура IMRAD, объём, шрифты, список литературы.',
 how_s3t: 'Проверьте оригинальность',
 how_s3p:
 'Убедитесь, что уровень оригинальности текста не менее 75%. Рекомендуем использовать Antiplagiat.ru или iThenticate.',
 how_s4t: 'Подайте материал через личный кабинет',
 how_s4p:
 'Рукопись в форматах DOC или DOCX; PDF не принимается. В кабинете выберите актуальный выпуск Muarrix.kiut.uz и загрузите файл.',
 how_s5t: 'Ожидайте решения редакции',
 how_s5p:
 'Обычно рассмотрение занимает 7–14 рабочих дней. Уведомление придёт на email и в личный кабинет на этом сайте.',
 how_s6t: 'Внесите правки (если нужно)',
 how_s6p:
 'Если редакция запросила доработку — исправьте замечания в личном кабинете и отправьте обновлённую версию.',
 how_help_html:
 ' <strong>Нужна помощь?</strong> Напишите редакции Muarrix.kiut.uz: <a href="mailto:g.isamova@kiut.uz">g.isamova@kiut.uz</a> или позвоните <strong>+998 78 129 40 40 (121)</strong>',
 rules_h1: ' Правила для авторов',
 rules_lead_before: 'Статьи в ',
 rules_lead_strong: 'Muarrix.kiut.uz',
 rules_lead_after:
 ' оформляются по международному стандарту IMRAD и должны соответствовать техническим требованиям ниже.',
 faq_h1: ' Часто задаваемые вопросы',
 faq_lead:
 'Здесь собраны ответы на самые популярные вопросы авторов. Если вы не нашли ответ — напишите нам напрямую.',
 about_h1: 'О журнале',
 about_body_html:
 '<p>«Muarrix.kiut.uz» — полугодовое научное издание, выходящее в электронном виде на английском, узбекском и русском языках. «Muarrix.kiut.uz» ориентирован на преподавателей, исследователей и специалистов высших учебных заведений и является профессиональным научно-аналитическим изданием, ориентированным на широкий круг специалистов.</p>'
 + '<p>Научно-исследовательская работа быстро развивается во всех областях науки. Появляются новые решения, мнения и подходы к различным проблемам. Этот процесс характерен для научного сообщества. Необходимы публикации в научных журналах по результатам исследований.</p>'
 + '<p>В «Muarrix.kiut.uz» публикуются статьи как теоретического, так и эмпирического характера, которые могут представлять интерес для широкого круга специалистов во всех областях науки и техники. Журнал является средством выражения работ в области техники, науки и технологий и представляет в основном статьи о научных исследованиях и технологических разработках, статьи с оригинальными размышлениями о конкретной проблеме или теме, обзорные статьи, которые дают общее представление о состоянии конкретной области науки и техники. Приветствуются междисциплинарные выводы и экономические исследования с использованием методов других наук – физики, математики и т.д.</p>'
 + '<p>Особое внимание уделяется анализу процессов, происходящих в экономике Узбекистана. Этот тип публикаций является источником информации и средством взаимодействия для ученых всего мира.</p>'
 + '<h2>Разделы журнала</h2>'
 + '<ul class="about-sections">'
 + '<li>01.02.00 – Механика</li>'
 + '<li>05.00.00 – Технические науки'
 + '<ul>'
 + '<li>05.01.00 – Информационные технологии, управление и компьютерная графика</li>'
 + '<li>05.02.00 – Машиностроение и машиноведение. Обработка материалов в машиностроении. Металлургия. Авиационная техника</li>'
 + '<li>05.03.00 – Приборостроение, метрология и информационно-измерительные приборы и системы</li>'
 + '<li>05.04.00 – Радиотехника и связь</li>'
 + '<li>05.05.00 – Энергетика и электротехника. Технология электрификации сельскохозяйственного производства. Электроника</li>'
 + '<li>05.07.00 – Технология механизации сельскохозяйственного производства</li>'
 + '<li>05.08.00 – Транспорт</li>'
 + '<li>05.09.00 – Строительство</li>'
 + '</ul></li>'
 + '<li>18.00.00 – Архитектура</li>'
 + '</ul>'
 + '<p>Заявка на публикацию оставляется на странице посредством <a href="/register.html">специальной формы</a>, которая будет рассмотрена в кратчайшие сроки. Периодические издания оформляются в соответствии с требованиями редакционно-издательского процесса. Статьи рассматриваются рецензентами и решение о публикации принимается на заседании редколлегии перед выходом нового номера журнала.</p>',
 editorial_h1: 'Редакционный совет',
 editorial_lead: 'Редакция Muarrix.kiut.uz.',
 editorial_body_html:
 '<h2>Главный редактор</h2>'
 + '<p class="editorial-member"><strong>Конгратбай Шарипов</strong>, доктор технических наук, профессор, Ташкентский Международный Университет Кимё</p>'
 + '<h2>Заместитель редактора</h2>'
 + '<p class="editorial-member"><strong>Акмаль Рустамов</strong>, доктор философии по техническому направлению (PhD), доцент, Ташкентский Международный Университет Кимё</p>'
 + '<h2>Редакционная коллегия</h2>'
 + '<ul class="editorial-board-list">'
 + '<li><strong>Чикахиро Минова</strong>, доктор технических наук (DSc), профессор, Ташкентский Международный Университет Кимё</li>'
 + '<li><strong>Савет Худайкулов</strong>, доктор технических наук, профессор, Ташкентский Международный Университет Кимё</li>'
 + '<li><strong>Мохинисо Хидирова</strong>, доктор технических наук, доцент, Ташкентский Международный Университет Кимё</li>'
 + '<li><strong>Иброхим Рустамов</strong>, доктор технических наук (DSc), Ташкентский Международный Университет Кимё</li>'
 + '<li><strong>Джамбул Юсупов</strong>, доктор физико-математических наук (DSc), Ташкентский Международный Университет Кимё</li>'
 + '<li><strong>Санжар Рузимов</strong>, доктор технических наук (DSc), доцент, Туринский Политехнический Университет в городе Ташкенте</li>'
 + '<li><strong>Дильбар Мирзарахметова</strong>, доктор биотехнологий, Международный университет Кимё в Ташкенте, Узбекистан</li>'
 + '<li><strong>Ханс Окснер</strong>, доктор технических наук (DSc), директор Государственного института сельскохозяйственной инженерии и биоэнергетики, Германия</li>'
 + '<li><strong>Андреас Леммер</strong>, доктор технических наук (DSc), профессор Государственного института сельскохозяйственной инженерии и биоэнергетики, Германия</li>'
 + '<li><strong>Базаров Бахтиёр Имамович</strong>, доктор технических наук (DSc), профессор, Ташкентский Государственный Транспортный Университет</li>'
 + '<li><strong>Джамшид Каниев</strong>, доктор философии по техническому направлению (PhD), Ташкентский Международный Университет Кимё</li>'
 + '<li><strong>Отабек Мухитдинов</strong>, доктор философии по техническому направлению (PhD), доцент, Ташкентский Международный Университет Кимё</li>'
 + '<li><strong>Муроджон Шербаев</strong>, доктор философии по техническому направлению (PhD), доцент, Ташкентский Международный Университет Кимё</li>'
 + '<li><strong>Сарвар Юсупов</strong>, доктор философии по техническому направлению (PhD), Ташкентский Международный Университет Кимё</li>'
 + '<li><strong>Хаммид Юсупов</strong>, доктор философии по физике, Международный университет им. Кимё в Ташкенте, Узбекистан</li>'
 + '<li><strong>Игорь Симоне Стеевано</strong>, доктор философии по техническому направлению (PhD), Politecnico di Torino, Италия</li>'
 + '</ul>',
 },
 uz: {
 breadcrumb_home: 'Bosh sahifa',
 bc_parent: 'Muarrix.kiut.uz',
 brand_title_main: 'Muarrix.kiut.uz',
 journal_nav_label: 'Bo‘lim:',
 uni_brand_line: 'Kimyo International University in Tashkent',
 hero_lead:
 'KIUT ilmiy jurnallari, konferentsiya materiallari va boshqa nashrlarning rasmiy saytlariga o‘tish',
 hub_nav_aria: 'Qo‘llanma bo‘limlari',
 hub_section_title: 'Ilmiy jurnallar va konferentsiyalar',
 hub_section_desc:
 'Nashrni tanlang — tahririyatning rasmiy sayti ochiladi: qoidalar va material qabul qilish tartibi joylashgan.',
 nav_publish: 'Maqola qanday chop etish',
 nav_rules: 'Mualliflar uchun qoidalar',
 nav_faq: 'Savol-javob',
 nav_current_issue: 'Joriy son',
 nav_archive: 'Arxiv',
 nav_submit: 'Maqola topshirish',
 nav_payment: 'To‘lov va muddatlar',
 footer_kiut: 'www.kiut.uz',
 footer_copy_suffix:
 'Kimyo International University in Tashkent · Shota Rustaveli ko‘chasi, 156, Toshkent',
 lang_switch_aria: 'Interfeys tili',
 breadcrumb_hub_name: 'Muarrix.kiut.uz',
 breadcrumb_how: 'Maqola chop etish',
 breadcrumb_rules: 'Mualliflar uchun qoidalar',
 breadcrumb_faq: 'Savol-javob',
 card_cta_journal: '{j} jurnal sayti →',
 card_cta_conf: 'Ilmiy amaliy anjumanlar sayti →',
 card_desc_finecs: 'O‘zR OAK tavsiya etgan jurnal ro‘yhatiga kiritilgan Xalqaro moliya va iqtisodiy barqarorlik jurnali',
 card_desc_stem: 'O‘zR OAK tavsiya etgan jurnal ro‘yhatiga kiritilgan Muarrix.kiut.uz',
 card_title_conf: 'Ilmiy amaliy anjumanlar',
 card_desc_conf: 'Ilmiy amaliy anjumanlar malumotlari (to‘plamlar)',
 card_desc_muarrix: 'O‘zR OAK tavsiya etgan jurnal ro‘yhatiga kiritilgan Tarix ilmiy jurnali',
 card_desc_ehl: 'Gumanitar fanlar va til jurnali',
 card_desc_med: 'Tibbiyot jurnali',
 card_cta_med: 'Journal of digital medicine sayti →',
 how_h1: ' Maqola chop etish',
 how_lead_start: 'Chop etish ',
 how_lead_strong: 'Muarrix.kiut.uzda',
 how_lead_end:
 ' ushbu platformada rasmiylashtiriladi. Ro‘yxatdan o‘tish va topshirish — shu saytdagi shaxsiy kabinet orqali.',
 how_steps_title: 'Qadam-baqadam yo‘riqnoma',
 how_s1t: 'Platformada ro‘yxatdan o‘ting',
 how_s1p:
 'Muallif akkauntini yarating. Jurnal — Muarrix.kiut.uz (ISSN 2181-2934).',
 how_s2t: 'Rasmiylashtirish qoidalari bilan tanishing',
 how_s2p_before: 'Qo‘lyozmani ',
 how_s2p_link: 'mualliflar uchun qoidalar',
 how_s2p_after:
 ' bo‘yicha tayyorlang: tuzilma, hajm, shriftlar, adabiyotlar ro‘yxati.',
 how_s3t: 'Originallikni tekshiring',
 how_s3p:
 'Matn originalligi kamida 75% bo‘lishini tasdiqlang. Antiplagiat.ru yoki iThenticate dan foydalanishni tavsiya qilamiz.',
 how_s4t: 'Shaxsiy kabinet orqali topshiring',
 how_s4p:
 'Qo‘lyozma DOC yoki DOCX; PDF qabul qilinmaydi. Kabinetda joriy Muarrix.kiut.uz sonini tanlang va faylni yuklang.',
 how_s5t: 'Tahririyat qarorini kuting',
 how_s5p:
 'Odatda 7–14 ish kuni. Xabar email va ushbu saytdagi shaxsiy kabinetga keladi.',
 how_s6t: 'Tuzatishlar kiriting (agar kerak bo‘lsa)',
 how_s6p:
 'Tahririyat tuzatish so‘rasa — shaxsiy kabinetda tuzating va qayta yuboring.',
 how_help_html:
 ' <strong>Yordam kerakmi?</strong> <a href="mailto:g.isamova@kiut.uz">g.isamova@kiut.uz</a> yoki <strong>+998 78 129 40 40 (121)</strong>',
 rules_h1: ' Mualliflar uchun qoidalar',
 rules_lead_before: 'Maqolalar ',
 rules_lead_strong: 'Muarrix.kiut.uzda',
 rules_lead_after:
 ' xalqaro IMRAD standarti va quyidagi texnik talablarga muvofiq rasmiylashtiriladi.',
 faq_h1: ' Ko‘p beriladigan savollar',
 faq_lead:
 'Bu yerda mualliflar eng ko‘p beradigan savollarga javoblar joylangan. Javob topmasangiz — bevosita yozing.',
 breadcrumb_about: 'Jurnal haqida',
 breadcrumb_editorial: 'Tahririy kengash',
 about_h1: 'Jurnal haqida',
 editorial_h1: 'Tahririy kengash',
 },
 en: {
 breadcrumb_home: 'Home',
 bc_parent: 'Muarrix.kiut.uz',
 brand_title_main: 'Muarrix.kiut.uz',
 journal_nav_label: 'Section:',
 uni_brand_line: 'Kimyo International University in Tashkent',
 hero_lead:
 'Links to official sites of KIUT journals, conference proceedings, and related publications',
 hub_nav_aria: 'Reference sections',
 hub_section_title: 'Scientific journals and conferences',
 hub_section_desc:
 'Choose a publication — the official editorial site opens with submission rules and guidelines.',
 nav_publish: 'How to publish',
 nav_rules: 'Author guidelines',
 nav_faq: 'Q&A',
 nav_current_issue: 'Current issue',
 nav_archive: 'Archive',
 nav_submit: 'Submit article',
 nav_payment: 'Payment & deadlines',
 footer_kiut: 'www.kiut.uz',
 footer_copy_suffix:
 'Kimyo International University in Tashkent · 156 Shota Rustaveli Street, Tashkent',
 lang_switch_aria: 'Interface language',
 breadcrumb_hub_name: 'Muarrix.kiut.uz',
 breadcrumb_how: 'How to publish',
 breadcrumb_rules: 'Author guidelines',
 breadcrumb_faq: 'FAQ',
 card_cta_journal: '{j} — journal website →',
 card_cta_conf: 'Conference website →',
 card_desc_finecs: 'International Journal of Finance and Economic Stability, included in the list of journals recommended by the HAC of the Republic of Uzbekistan',
 card_desc_stem: 'Muarrix.kiut.uz journal included in the list of journals recommended by the HAC of the Republic of Uzbekistan',
 card_title_conf: 'Conference proceedings',
 card_desc_conf: 'KIUT Conferences — papers and abstracts',
 card_desc_muarrix: 'Historical scientific journal included in the list of journals recommended by the Higher Attestation Commission of the Republic of Uzbekistan',
 card_desc_ehl: 'Journal of Humanities and Language',
 card_desc_med: 'Medical and related publications',
 card_cta_med: 'Journal of digital medicine — website →',
 how_h1: ' How to publish',
 how_lead_start: 'Publishing in the ',
 how_lead_strong: 'Muarrix.kiut.uz',
 how_lead_end:
 ' is handled on this platform. Registration and submission are through your author account on this site.',
 how_steps_title: 'Step-by-step guide',
 how_s1t: 'Register on the platform',
 how_s1p:
 'Create an author account. The journal is the Muarrix.kiut.uz (ISSN 2181-2934).',
 how_s2t: 'Read the formatting rules',
 how_s2p_before: 'Prepare your manuscript according to the ',
 how_s2p_link: 'author guidelines',
 how_s2p_after: ': structure, length, fonts, reference list.',
 how_s3t: 'Check originality',
 how_s3p:
 'Ensure originality is at least 75%. We recommend Antiplagiat.ru or iThenticate.',
 how_s4t: 'Submit via your author account',
 how_s4p:
 'Manuscript in DOC or DOCX; PDF is not accepted. In your account, select the current Muarrix.kiut.uz issue and upload the file.',
 how_s5t: 'Await the editorial decision',
 how_s5p:
 'Review usually takes 7–14 business days. You will be notified by email and in your account on this site.',
 how_s6t: 'Apply revisions if requested',
 how_s6p:
 'If revisions are requested, update the manuscript in your author account and resubmit.',
 how_help_html:
 ' <strong>Need help?</strong> Email <a href="mailto:g.isamova@kiut.uz">g.isamova@kiut.uz</a> or call <strong>+998 78 129 40 40 (121)</strong>',
 rules_h1: ' Author guidelines',
 rules_lead_before: 'Articles in the ',
 rules_lead_strong: 'Muarrix.kiut.uz',
 rules_lead_after:
 ' must follow the international IMRAD standard and meet the technical requirements below.',
 faq_h1: ' Frequently asked questions',
 faq_lead:
 'Answers to common author questions. If you cannot find an answer — contact us directly.',
 breadcrumb_about: 'About the journal',
 breadcrumb_editorial: 'Editorial board',
 about_h1: 'About the journal',
 editorial_h1: 'Editorial board',
 },
 };

 const RF =
 typeof window!== 'undefined' && window.__KIUT_RULES_FAQ_PACK
? window.__KIUT_RULES_FAQ_PACK
: { ru: {}, uz: {}, en: {} };

 const SITE =
typeof window!== 'undefined' && window.__MUARRIX_SITE_PACK
? window.__MUARRIX_SITE_PACK
: { ru: {}, uz: {}, en: {} };

 const AE =
typeof window!== 'undefined' && window.__MUARRIX_ABOUT_EDITORIAL_PACK
? window.__MUARRIX_ABOUT_EDITORIAL_PACK
: { ru: {}, uz: {}, en: {} };

 const STRINGS = {
 ru: {...STRINGS_BASE.ru,...(SITE.ru || {}),...(RF.ru || {}),...(AE.ru || {}) },
 uz: {...STRINGS_BASE.uz,...(SITE.uz || {}),...(RF.uz || {}),...(AE.uz || {}) },
 en: {...STRINGS_BASE.en,...(SITE.en || {}),...(RF.en || {}),...(AE.en || {}) },
 };

 function normalizeLang(lang) {
 const l = (lang || '').toLowerCase();
 return LEGAL_LANG.includes(l)? l: 'ru';
 }

 function getLang() {
 try {
 const v = localStorage.getItem(STORAGE_KEY);
 return normalizeLang(v);
 } catch {
 return 'ru';
 }
 }

 function setLang(lang) {
 const l = normalizeLang(lang);
 try {
 localStorage.setItem(STORAGE_KEY, l);
 } catch {}
 applyLang(l);
 }

 function t(lang, key, vars) {
 const L = normalizeLang(lang);
 const pack = STRINGS[L] || STRINGS.ru;
 let text = pack[key]?? STRINGS.ru[key]?? key;
 if (vars && typeof vars === 'object') {
 Object.keys(vars).forEach((k) => {
 text = text.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
 });
 }
 return text;
 }

 function plural(lang, n, forms) {
 const L = normalizeLang(lang);
 const k = Math.abs(n) | 0;
 if (L === 'en') return k === 1? forms.one: forms.other;
 if (L === 'uz') return forms.one;
 const m10 = k % 10;
 const m100 = k % 100;
 if (m10 === 1 && m100!== 11) return forms.one;
 if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return forms.few;
 return forms.many;
 }

 function applyLang(lang) {
 const L = normalizeLang(lang);
 document.documentElement.lang = L === 'uz'? 'uz': L === 'en'? 'en': 'ru';

 document.querySelectorAll('[data-i18n]').forEach((el) => {
 const key = el.getAttribute('data-i18n');
 if (!key) return;
 const journal = el.getAttribute('data-i18n-journal');
 let text = t(L, key);
 if (journal && text.includes('{j}')) text = text.replace(/\{j\}/g, journal);
 el.textContent = text;
 });

 document.querySelectorAll('[data-i18n-html]').forEach((el) => {
 const key = el.getAttribute('data-i18n-html');
 if (!key) return;
 el.innerHTML = t(L, key);
 });

 document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
 const key = el.getAttribute('data-i18n-placeholder');
 if (!key) return;
 el.setAttribute('placeholder', t(L, key));
 });

 document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
 const key = el.getAttribute('data-i18n-aria');
 if (!key) return;
 el.setAttribute('aria-label', t(L, key));
 });

 document.querySelectorAll('[data-i18n-title]').forEach((el) => {
 const key = el.getAttribute('data-i18n-title');
 if (!key) return;
 el.setAttribute('title', t(L, key));
 });

 const ls = document.querySelector('[data-lang-switch]');
 if (ls) ls.setAttribute('aria-label', t(L, 'lang_switch_aria'));

 const heroNav = document.querySelector('[data-i18n-aria-nav]');
 if (heroNav) heroNav.setAttribute('aria-label', t(L, 'hub_nav_aria'));

 const doc = document.body.getAttribute('data-i18n-doc');
 if (doc && DOC_TITLE[doc]) {
 const entry = DOC_TITLE[doc][L] || DOC_TITLE[doc].ru;
 document.title = STRINGS[L]?.[entry]?? STRINGS.ru?.[entry]?? entry;
 }

 document.dispatchEvent(new CustomEvent('kiut:langchange', { detail: { lang: L } }));

 document.querySelectorAll('.lang-switch__btn').forEach((btn) => {
 const l = btn.getAttribute('data-set-lang');
 btn.classList.toggle('is-active', l === L);
 btn.setAttribute('aria-pressed', l === L? 'true': 'false');
 });
 }

 function bindLangSwitch() {
 document.querySelectorAll('[data-set-lang]').forEach((btn) => {
 btn.addEventListener('click', () => setLang(btn.getAttribute('data-set-lang')));
 });
 }

 document.addEventListener('DOMContentLoaded', () => {
 applyLang(getLang());
 bindLangSwitch();
 });

 window.KiutI18n = { getLang, setLang, applyLang, t, plural };
})();
