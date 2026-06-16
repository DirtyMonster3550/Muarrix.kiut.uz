/**
 * Требования к научным статьям для журнала Muarrix — UZ / RU / EN.
 */
(function () {
  const REQUIREMENTS = {
    uz: {
      title: 'Maqola talablari',
      intro: 'Muarrix jurnalida ilmiy maqola nashr etish uchun maqola quyidagi tartibda tuzilishi kerak.',
      sections: [
        {
          title: '1) Muallif haqida ma’lumot',
          body: 'Bu qismda muallifning ismi va familiyasi, ish joyi va lavozimi, ilmiy darajasi va unvoni, elektron pochta manzili va aloqa telefonlari ko‘rsatiladi.',
        },
        {
          title: '2) Maqola mavzusi (sarlavha)',
          body: 'Maqolaning mavzusi iloji boricha qisqa va ixcham tarzda tuzilgan bo‘lib, u maqolaning tadqiqot yo‘nalishini aniq ifodalashi kerak.',
        },
        {
          title: '3) Maqolaning qisqacha mazmuni (annotatsiya)',
          body: 'Maqolalarning qisqacha tezislari o‘zbek, rus va ingliz tillarida 8–10 satrdan ko‘p bo‘lmagan holda beriladi. Unda tadqiqot muammosi, uning dolzarbligi, tadqiqot muammosini hal qilishda qo‘llanilgan metodologiya, tadqiqot natijalari, maqolaning to‘liq mazmuni asosida muallifning ilmiy-amaliy hissalarining qisqacha tavsifi yoritiladi.',
        },
        {
          title: '4) Kalit so‘zlar (o‘zbek, rus va ingliz tillarida)',
          body: 'Kalit so‘zlar — maqolaning mazmuni va maqsadini maksimal darajada ochib beradigan so‘zlar (15 ta) bo‘lishi kerak. Maqola alohida scholar.google.com yoki google.com qidiruv tizimida va birinchi sahifalarda oson topilishi uchun asosiy matndagi kalit so‘zlarning har birini maqolaning asosiy matni va xulosada 5–10 martadan takrorlash tavsiya etiladi.',
        },
        {
          title: '5) Kirish',
          body: 'Kirishda asosan tadqiqot muammosi, uning maqsad va vazifalari yoritiladi. Bu qismda tadqiqot mavzusini tanlash sabablari, uning dolzarbligi va ilmiy ahamiyati tushuntiriladi.',
        },
        {
          title: '6) Mavzuga oid adabiyotlar tahlili',
          body: 'Adabiyot sharhi — bu o‘rganilayotgan muammo bo‘yicha muallifning bilimi va tasavvurini ko‘rsatadigan qism. Adabiyot tahlili deganda mavjud intellektual hududning qamrovini baholash va shu asosda aniq xarita tuzish tushuniladi. Tanqidiy adabiyotlarni tahlil qilishga urinishlar mavzu bo‘yicha bilimlarni oshiradi va tadqiqot savollariga aniqlik kiritishga yordam beradi. Har qanday tadqiqot ushbu sohada yaratilgan oldingi bilimlar asosida quriladi. Adabiyotlarni ko‘rib chiqish asosan ushbu sohadagi so‘nggi jurnal maqolalari va boshqa ma’lumot manbalariga asoslanadi (mavzuga oid maqolalarni www.scholar.google.com qidiruv tizimidagi kalit so‘zlar yordamida topish mumkin).',
        },
        {
          title: '7) Tadqiqot metodologiyasi',
          body: 'Tadqiqot metodologiyasi tadqiqotning eng muhim qismlaridan biri bo‘lib, olib borilayotgan tadqiqotning umumiy xaritasini, tadqiqot yo‘lini va maqsadga (natijaga) olib boradigan xarita chiziqlarini ifodalaydi. Tadqiqot metodologiyasi — tadqiqotning falsafasi va yo‘nalishi (deduksiya yoki induksiya), tadqiqot dizayni, tadqiqot ob’ekti (namuna olish), tadqiqot strategiyasini (kuzatish, eksperiment) aniqlash uchun oqilona qarorlar qabul qilish asosida asosiy yoki ikkilamchi ma’lumot manbalaridan foydalanish bo‘yicha qarorlar, ish bosqichlari, anketalar, arxeologik, etnografik, arxiv tadqiqotlari va boshqalarni o‘z ichiga oladi. Aniq yechimga olib boruvchi yo‘lni belgilashni bildiradi. Uslubiy qismning mukammalligi tadqiqot usulining ishonchliligi va aniqligini asoslash bilan ko‘rsatiladi.',
        },
        {
          title: '8) Tahlil va natijalar',
          body: 'Ushbu qismda maqolaning asosiy mazmuni va yangiliklari beriladi. Tadqiqotning analitik qismida to‘plangan ma’lumotlar tadqiqot metodologiyasida oldindan belgilangan tahlil usullari yordamida tahlil qilinadi. Bu yerda faqat tahlil usulining natijalari ifodalanadi va natijalari muhokama bayoni beriladi.',
        },
        {
          title: '9) Xulosa va tavsiyalar',
          body: 'Tadqiqotning maqsadlari, vazifalari va tadqiqot savollariga javob topish, tadqiqotning asosiy natijalari va tadqiqotning umumiy jarayoni haqida umumiy xulosalar, shuningdek, ushbu tadqiqotdan kelib chiqadigan bo‘lajak tadqiqot ishlari bo‘yicha takliflar va yo‘nalishlar maqolaning xulosa va takliflar qismining asosini tashkil qiladi.',
        },
        {
          title: '10) Maqolada iqtibos (snoska) va izohlarni berilish tartibi',
          body: 'Barcha iqtiboslar kvadrat qavsda berilib, avval tartib raqam (ya’ni manba va adabiyotlar ro‘yxatidagi tartibga mos ravishda) va sahifasi (qaysi bet(lar)dan olinganligi) ko‘rsatiladi. Masalan: [1, 65-b.].',
        },
        {
          title: '11) Foydalanilgan manba va adabiyotlar ro‘yxati',
          body: 'Ushbu bo‘limda [1], [2] yoki [3] ketma-ketlikda tadqiqotda foydalanilgan barcha adabiyotlar ro‘yxati iqtiboslar bilan mos ravishda keltiriladi:',
          list: [
            'mualliflarning familiyasi, kitob nomi, nashr manzili, nashriyot nomi, yili, sahifalari;',
            'mualliflarning familiyasi, maqola nomi, jurnal nomi, nashri, yili, sahifa raqami.',
          ],
        },
      ],
      notesTitle: 'Eslatma',
      notes: [
        'Maqola matni Times New Roman shriftida, 14 pt, satrlar orasida 1,5 interval bilan terilishi kerak. Maqola matnining barcha tomonlarida (o‘ng, chap, yuqori va pastki) 2 santimetr masofa qoldiriladi. Maqolaning maksimal hajmi 16 betdan, eng kami esa 8 betdan, foydalanilgan adabiyotlar hajmi esa kamida 8–12 manbadan iborat bo‘lishi kerak.',
        'Maqolada jadvallar, rasmlar yoki grafiklar bo‘lishi kerak. Jadvallarning sarlavhalari tepada, raqamlar yoki grafiklarning sarlavhalari pastda yozilishi va ularning manbasi aniq ko‘rsatilishi kerak. Maqolada jadvallar, rasmlar va rasmlarni taqdim etish maqola sifatini oshiradigan manba bo‘lib xizmat qiladi.',
        'Maqolalar o‘zbek, rus yoki ingliz tillarida taqdim etilishi mumkin.',
        'Maqola tegishli fan bo‘yicha fan doktori yoki PhD tomonidan ko‘rilgan bo‘lishi va maqolada uning ism-familiyasi berilishi lozim.',
        'Maqolalar elektron shaklda Muarrix jurnalining <a href="https://muarrix.kiut.uz">https://muarrix.kiut.uz</a> saytida nashr etiladi.',
        'Jurnalda e’lon qilingan har bir maqolaga DOI (Crossref) raqami beriladi va u sertifikatda aks etadi. Nashr etilgan maqolalar quyidagi bazalarda indekslanadi: Google Scholar, DOI, ISSN, Open Air, Universal Impact Factor.',
      ],
    },
    ru: {
      title: 'Требования к статье',
      intro: 'Для публикации научной статьи в журнале Muarrix рукопись должна быть оформлена в следующем порядке.',
      sections: [
        {
          title: '1) Сведения об авторе',
          body: 'Указываются имя и фамилия автора, место работы и должность, учёная степень и звание, адрес электронной почты и контактные телефоны.',
        },
        {
          title: '2) Тема статьи (заголовок)',
          body: 'Тема статьи должна быть по возможности краткой и ёмкой и чётко отражать направление исследования.',
        },
        {
          title: '3) Краткое содержание (аннотация)',
          body: 'Краткие тезисы статьи на узбекском, русском и английском языках — не более 8–10 строк. В аннотации отражаются проблема исследования, её актуальность, методология решения, результаты и краткое описание научно-практического вклада автора на основе полного содержания статьи.',
        },
        {
          title: '4) Ключевые слова (на узбекском, русском и английском)',
          body: 'Ключевые слова (15 штук) должны максимально раскрывать содержание и цель статьи. Для удобного поиска в scholar.google.com и google.com рекомендуется повторять каждое ключевое слово в основном тексте и заключении 5–10 раз.',
        },
        {
          title: '5) Введение',
          body: 'Во введении излагаются проблема исследования, его цели и задачи, обоснование выбора темы, её актуальность и научное значение.',
        },
        {
          title: '6) Анализ литературы по теме',
          body: 'Обзор литературы показывает знания и представления автора по изучаемой проблеме. Анализ литературы означает оценку охвата существующей интеллектуальной области и построение на этой основе чёткой карты предмета. Критический разбор публикаций повышает уровень знаний по теме и уточняет исследовательские вопросы. Любое исследование опирается на ранее накопленные знания в данной области. Обзор литературы основывается прежде всего на последних журнальных статьях и других источниках (статьи по теме можно найти через ключевые слова на www.scholar.google.com).',
        },
        {
          title: '7) Методология исследования',
          body: 'Методология — одна из важнейших частей работы: она отражает общую карту исследования, путь к цели и результату. Включает философию и направление исследования (дедукция или индукция), дизайн, объект (выборку), стратегию (наблюдение, эксперимент), решения об использовании первичных и вторичных источников, этапы работы, анкеты, археологические, этнографические и архивные исследования и др. Качество методологической части подтверждается обоснованием надёжности и точности метода.',
        },
        {
          title: '8) Анализ и результаты',
          body: 'В этом разделе излагается основное содержание и новизна статьи. Собранные данные анализируются заранее определёнными в методологии способами. Излагаются только результаты анализа и их обсуждение.',
        },
        {
          title: '9) Заключение и рекомендации',
          body: 'Подводятся итоги по целям, задачам и исследовательским вопросам, основным результатам и общему ходу работы, а также формулируются предложения и направления будущих исследований на основе данной работы.',
        },
        {
          title: '10) Порядок оформления ссылок и примечаний',
          body: 'Все ссылки даются в квадратных скобках: сначала порядковый номер (в соответствии со списком литературы), затем страница (страницы), откуда взята цитата. Например: [1, 65].',
        },
        {
          title: '11) Список использованных источников и литературы',
          body: 'В этом разделе в порядке [1], [2], [3] приводятся все использованные в исследовании источники в соответствии со ссылками в тексте:',
          list: [
            'фамилия авторов, название книги, место издания, издательство, год, страницы;',
            'фамилия авторов, название статьи, название журнала, номер выпуска, год, страницы.',
          ],
        },
      ],
      notesTitle: 'Примечание',
      notes: [
        'Текст статьи набирается шрифтом Times New Roman, 14 pt, межстрочный интервал 1,5. Поля со всех сторон — 2 см. Объём статьи: от 8 до 16 страниц; список литературы — не менее 8–12 источников.',
        'В статье должны быть таблицы, рисунки или графики. Заголовки таблиц — сверху, подписи к рисункам и графикам — снизу, с указанием источника. Таблицы и иллюстрации повышают качество статьи.',
        'Статьи могут представляться на узбекском, русском или английском языке.',
        'Статья должна быть рецензирована доктором наук или PhD по соответствующей области, с указанием его фамилии и имени в статье.',
        'Статьи публикуются в электронном виде на сайте журнала Muarrix: <a href="https://muarrix.kiut.uz">https://muarrix.kiut.uz</a>.',
        'Каждой опубликованной статье присваивается DOI (Crossref), который указывается в сертификате. Статьи индексируются в базах: Google Scholar, DOI, ISSN, Open Air, Universal Impact Factor.',
      ],
    },
    en: {
      title: 'Article requirements',
      intro: 'To publish a scientific article in the Muarrix journal, the manuscript must follow the structure below.',
      sections: [
        {
          title: '1) Author information',
          body: 'Include the author’s full name, workplace and position, academic degree and title, email address, and contact phone numbers.',
        },
        {
          title: '2) Article topic (title)',
          body: 'The title should be as concise as possible and clearly reflect the research focus of the article.',
        },
        {
          title: '3) Abstract',
          body: 'Brief abstracts in Uzbek, Russian, and English — no more than 8–10 lines each. They should cover the research problem, its relevance, the methodology used, the results, and a short description of the author’s scientific and practical contribution based on the full content of the article.',
        },
        {
          title: '4) Keywords (in Uzbek, Russian, and English)',
          body: 'Provide 15 keywords that best reflect the content and purpose of the article. To improve discoverability in scholar.google.com and google.com, each keyword should be repeated 5–10 times in the main text and conclusion.',
        },
        {
          title: '5) Introduction',
          body: 'The introduction presents the research problem, aims and objectives, reasons for choosing the topic, and its relevance and scientific significance.',
        },
        {
          title: '6) Literature review',
          body: 'The literature review demonstrates the author’s knowledge and understanding of the problem studied. It assesses the scope of existing scholarship and builds a clear map of the field. Critical analysis of publications deepens topic knowledge and clarifies research questions. Every study builds on prior knowledge in the field. The review should rely mainly on recent journal articles and other sources (articles can be found via keywords on www.scholar.google.com).',
        },
        {
          title: '7) Research methodology',
          body: 'Methodology is a core part of the paper: it outlines the overall research map, path, and route to the goal and findings. It covers the philosophy and approach (deduction or induction), research design, object (sampling), strategy (observation, experiment), decisions on primary and secondary data, work stages, surveys, archaeological, ethnographic, and archival research, etc. The quality of this section is shown by justification of the reliability and accuracy of the method.',
        },
        {
          title: '8) Analysis and results',
          body: 'This section presents the main content and novelty of the article. Collected data are analysed using methods defined in the methodology. Only analysis results and their discussion are presented here.',
        },
        {
          title: '9) Conclusion and recommendations',
          body: 'Summarise how the aims, tasks, and research questions were addressed, the main findings, and the overall research process, and propose directions for future research arising from this study.',
        },
        {
          title: '10) Citation and footnote format',
          body: 'All citations are given in square brackets: first the serial number (matching the reference list), then the page(s) cited. Example: [1, 65].',
        },
        {
          title: '11) References',
          body: 'List all sources used in the study in order [1], [2], [3], consistent with in-text citations:',
          list: [
            'authors’ surnames, book title, place of publication, publisher, year, pages;',
            'authors’ surnames, article title, journal name, issue, year, page numbers.',
          ],
        },
      ],
      notesTitle: 'Note',
      notes: [
        'The text should be set in Times New Roman, 14 pt, 1.5 line spacing, with 2 cm margins on all sides. Article length: 8–16 pages; references: at least 8–12 sources.',
        'Articles should include tables, figures, or charts. Table titles go above; figure and chart captions below, with sources indicated. Tables and illustrations improve article quality.',
        'Articles may be submitted in Uzbek, Russian, or English.',
        'The article must be reviewed by a Doctor of Sciences or PhD in the relevant field, with the reviewer’s name stated in the article.',
        'Articles are published electronically on the Muarrix journal website: <a href="https://muarrix.kiut.uz">https://muarrix.kiut.uz</a>.',
        'Each published article receives a DOI (Crossref), shown on the certificate. Articles are indexed in: Google Scholar, DOI, ISSN, Open Air, Universal Impact Factor.',
      ],
    },
  };

  function sectionHtml(section) {
    let html = '<section class="about-req-section">'
      + '<h3>' + section.title + '</h3>'
      + '<p>' + section.body + '</p>';
    if (section.list && section.list.length) {
      html += '<ul>' + section.list.map((item) => '<li>' + item + '</li>').join('') + '</ul>';
    }
    html += '</section>';
    return html;
  }

  function renderRequirements(lang) {
    const R = REQUIREMENTS[lang];
    return '<div class="about-requirements">'
      + '<h2 class="about-section-title">' + R.title + '</h2>'
      + '<p class="about-req-intro">' + R.intro + '</p>'
      + R.sections.map(sectionHtml).join('')
      + '<div class="about-req-notes">'
      + '<h3>' + R.notesTitle + '</h3>'
      + '<ul>' + R.notes.map((n) => '<li>' + n + '</li>').join('') + '</ul>'
      + '</div>'
      + '</div>';
  }

  if (typeof window !== 'undefined') {
    window.__MUARRIX_ABOUT_REQUIREMENTS__ = {
      uz: renderRequirements('uz'),
      ru: renderRequirements('ru'),
      en: renderRequirements('en'),
    };
  }
})();
