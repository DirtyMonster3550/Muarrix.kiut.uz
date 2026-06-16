/**
 * Состав редакционной коллегии Muarrix — 2025 (из официального документа).
 */
(function () {
  const DOC = '/docs/muarrix-jurnali-tahririyati-2025.docx';

  const LABELS = {
    uz: {
      chief: 'Bosh muharrir',
      deputy: 'Bosh muharrir o‘rinbosari va mas’ul kotib',
      board: 'Tahrir hay’ati',
      doc: 'Rasmiy hujjat (DOCX)',
    },
    ru: {
      chief: 'Главный редактор',
      deputy: 'Заместитель главного редактора и ответственный секретарь',
      board: 'Редакционная коллегия',
      doc: 'Официальный документ (DOCX)',
    },
    en: {
      chief: 'Editor-in-Chief',
      deputy: 'Deputy Editor-in-Chief and Executive Secretary',
      board: 'Editorial Board',
      doc: 'Official document (DOCX)',
    },
  };

  const PEOPLE = [
    {
      role: 'chief',
      uz: ['Zamonov Akbar Turg‘unovich', 'Toshkent Kimyo xalqaro universiteti', 'T.f.d., professor'],
      ru: ['Замонов Акбар Тургунович', 'Ташкентский химический международный университет', 'д.т.н., профессор'],
      en: ['Zamonov Akbar Turgunovich', 'Tashkent International University of Chemistry', 'DSc in Technical Sciences, Professor'],
    },
    {
      role: 'deputy',
      uz: ['Narziyev Nabijon Normurodovich', 'Toshkent Kimyo xalqaro universiteti', 'PhD., dotsent'],
      ru: ['Нарзиев Набижон Нормуродович', 'Ташкентский химический международный университет', 'к.т.н. (PhD), доцент'],
      en: ['Narziyev Nabijon Normurodovich', 'Tashkent International University of Chemistry', 'PhD, Associate Professor'],
    },
    { uz: ['Sagdullayev Annatoliy Sagdullayevich', 'O‘zbekiston milliy universiteti', 'T.f.d., professor, akademik'], ru: ['Сагдуллаев Анатолий Сагдуллаевич', 'Национальный университет Узбекистана', 'д.т.н., профессор, академик'], en: ['Sagdullayev Annatoliy Sagdullayevich', 'National University of Uzbekistan', 'DSc in Technical Sciences, Professor, Academician'] },
    { uz: ['Ishanxodjayeva Zamira Raimovna', 'O‘zbekiston milliy universiteti', 'T.f.d., professor'], ru: ['Ишанходжаева Замира Раимовна', 'Национальный университет Узбекистана', 'д.т.н., профессор'], en: ['Ishanxodjayeva Zamira Raimovna', 'National University of Uzbekistan', 'DSc in Technical Sciences, Professor'] },
    { uz: ['Mavlonov O‘ktam Maxmasobirovich', 'O‘zbekiston milliy universiteti', 'T.f.d., professor'], ru: ['Мавлонов Октам Махмасобирович', 'Национальный университет Узбекистана', 'д.т.н., профессор'], en: ['Mavlonov Oktam Makhmasobirovich', 'National University of Uzbekistan', 'DSc in Technical Sciences, Professor'] },
    { uz: ['Vohidov Shodmon Xusaynovich', 'Buxoro davlat universiteti', 'T.f.d., professor'], ru: ['Вохидов Шодмон Хусайнович', 'Бухарский государственный университет', 'д.т.н., профессор'], en: ['Vohidov Shodmon Khusaynovich', 'Bukhara State University', 'DSc in Technical Sciences, Professor'] },
    { uz: ['Ashirov Adham Azimboyevich', 'O‘zR FA Tarix instituti', 'T.f.d., professor'], ru: ['Аширов Адхам Азимбоевич', 'Институт истории АН РУз', 'д.т.н., профессор'], en: ['Ashirov Adham Azimboyevich', 'Institute of History, Academy of Sciences of Uzbekistan', 'DSc in Technical Sciences, Professor'] },
    { uz: ['Agzamova Gulchehra Azizovna', 'O‘zR FA Tarix instituti', 'T.f.d., professor'], ru: ['Агзамова Гульчехра Азизовна', 'Институт истории АН РУз', 'д.т.н., профессор'], en: ['Agzamova Gulchehra Azizovna', 'Institute of History, Academy of Sciences of Uzbekistan', 'DSc in Technical Sciences, Professor'] },
    { uz: ['Xaliyarov Alisher Xasanovich', 'Sharja Amerika universiteti (AQSh)', 'T.f.d., assistent professor'], ru: ['Халияров Алишер Хасанович', 'Американский университет Шарджи (ОАЭ)', 'д.т.н., ассистент-профессор'], en: ['Khaliyarov Alisher Khasanovich', 'American University of Sharjah (UAE)', 'DSc in Technical Sciences, Assistant Professor'] },
    { uz: ['Boboyorov G‘aybulla Boliyevich', 'O‘zR FA Milliy arxeologiya markazi', 'T.f.d., professor'], ru: ['Бобоёров Гайбулла Болиевич', 'Национальный археологический центр АН РУз', 'д.т.н., профессор'], en: ['Boboyorov Gaybulla Boliyevich', 'National Archaeological Centre, Academy of Sciences of Uzbekistan', 'DSc in Technical Sciences, Professor'] },
    { uz: ['Odilova Gulnoza Komiljonovna', 'Toshkent Kimyo xalqaro universiteti', 'F.f.d., professor'], ru: ['Одилова Гульноза Комилжоновна', 'Ташкентский химический международный университет', 'д.ф.н., профессор'], en: ['Odilova Gulnoza Komiljonovna', 'Tashkent International University of Chemistry', 'DSc in Philosophy, Professor'] },
    { uz: ['Seyka Vazaki', 'CHUBU universiteti (Yaponiya)', 'T.f.d., assistent professor'], ru: ['Сейка Вазаки', 'Университет CHUBU (Япония)', 'д.т.н., ассистент-профессор'], en: ['Seyka Vazaki', 'CHUBU University (Japan)', 'DSc in Technical Sciences, Assistant Professor'] },
    { uz: ['Ataxodjayev Azimxo‘ja Muzaffarovich', 'Toshkent Kimyo xalqaro universiteti', 'T.f.d., professor'], ru: ['Атаходжаев Азимхужа Музаффарович', 'Ташкентский химический международный университет', 'д.т.н., профессор'], en: ['Atakhodzhayev Azimkhoja Muzaffarovich', 'Tashkent International University of Chemistry', 'DSc in Technical Sciences, Professor'] },
    { uz: ['Tursunov Bo‘ston', 'Xo‘jand davlat universiteti (Tojikiston)', 'T.f.d., professor'], ru: ['Турсунов Бостон', 'Худжандский государственный университет (Таджикистан)', 'д.т.н., профессор'], en: ['Tursunov Boston', 'Khujand State University (Tajikistan)', 'DSc in Technical Sciences, Professor'] },
    { uz: ['Aminov Bobir Bomuradovich', 'Toshkent Kimyo xalqaro universiteti', 'T.f.d., professor'], ru: ['Аминов Бобир Бомурадович', 'Ташкентский химический международный университет', 'д.т.н., профессор'], en: ['Aminov Bobir Bomuradovich', 'Tashkent International University of Chemistry', 'DSc in Technical Sciences, Professor'] },
    { uz: ['Davlatova Saodat Tilovberdievna', 'O‘zbekiston Respublikasi Millatlararo munosabatlar va xorijdagi vatandoshlar masalalari bo‘yicha qo‘mitasi bo‘lim boshlig‘i', 'T.f.d., professor'], ru: ['Давлатова Саодат Тиловбердиевна', 'Комитет по межнациональным отношениям и дружбе с зарубежными соотечественниками при Кабинете Министров РУз, начальник отдела', 'д.т.н., профессор'], en: ['Davlatova Saodat Tilovberdievna', 'Committee on Interethnic Relations and Compatriots Abroad, Republic of Uzbekistan, Head of Department', 'DSc in Technical Sciences, Professor'] },
    { uz: ['Dilnoza Jamolova Muyidinovna', 'O‘zR FA Tarix instituti', 'T.f.d., katta ilmiy xodim'], ru: ['Джамолова Дилноза Муйидиновна', 'Институт истории АН РУз', 'д.т.н., старший научный сотрудник'], en: ['Jamolova Dilnoza Muyidinovna', 'Institute of History, Academy of Sciences of Uzbekistan', 'DSc in Technical Sciences, Senior Researcher'] },
    { uz: ['Egamberdiyeva Nigora Asadovna', 'Aniq fanlar universiteti', 'T.f.d., professor'], ru: ['Эгамбердиева Нигора Асадовна', 'Университет точных наук', 'д.т.н., профессор'], en: ['Egamberdiyeva Nigora Asadovna', 'University of Exact Sciences', 'DSc in Technical Sciences, Professor'] },
    { uz: ['Baliyeva Roza', 'Berdaq nomidagi Qoraqalpoq davlat universiteti', 'T.f.d., professor'], ru: ['Балиева Роза', 'Каракалпакский государственный университет имени Бердаха', 'д.т.н., профессор'], en: ['Baliyeva Roza', 'Karakalpak State University named after Berdakh', 'DSc in Technical Sciences, Professor'] },
    { uz: ['Mahkamova Nodira Mustafayevna', 'Toshkent axborot texnologiyalari universiteti', 'T.f.d., professor'], ru: ['Махкамова Нодира Мустафаевна', 'Ташкентский университет информационных технологий', 'д.т.н., профессор'], en: ['Makhkamova Nodira Mustafayevna', 'Tashkent University of Information Technologies', 'DSc in Technical Sciences, Professor'] },
    { uz: ['Ernazarov Fayzulla Narzullayevich', 'Nizomiy nomidagi O‘zbekiston milliy pedagogika universiteti', 'T.f.d., professor'], ru: ['Эрназаров Файзулла Нарзуллаевич', 'Национальный педагогический университет Узбекистана имени Аль-Фараби (Низамий)', 'д.т.н., профессор'], en: ['Ernazarov Fayzulla Narzullayevich', 'National University of Uzbekistan named after Al-Farabi (Nizami)', 'DSc in Technical Sciences, Professor'] },
    { uz: ['Mahmudov Sherzodxon Yunusovich', 'O‘zR FA Tarix instituti', 'T.f.d., dotsent'], ru: ['Махмудов Шерзодхон Юнусович', 'Институт истории АН РУз', 'д.т.н., доцент'], en: ['Makhmudov Sherzodkhon Yunusovich', 'Institute of History, Academy of Sciences of Uzbekistan', 'DSc in Technical Sciences, Associate Professor'] },
    { uz: ['Boboyev Feruz Sayillayevich', 'O‘zR FA Tarix instituti', 'T.f.d., katta ilmiy xodim'], ru: ['Бобоев Феруз Сайиллаевич', 'Институт истории АН РУз', 'д.т.н., старший научный сотрудник'], en: ['Boboyev Feruz Sayillayevich', 'Institute of History, Academy of Sciences of Uzbekistan', 'DSc in Technical Sciences, Senior Researcher'] },
    { uz: ['Klichev Oybek Abdurasulovich', 'Buxoro davlat universiteti', 'T.f.d., dotsent'], ru: ['Кличев Ойбек Абдурасулович', 'Бухарский государственный университет', 'д.т.н., доцент'], en: ['Klichev Oybek Abdurasulovich', 'Bukhara State University', 'DSc in Technical Sciences, Associate Professor'] },
    { uz: ['Taniyeva Guldona Mamanovna', 'Nizomiy nomidagi O‘zbekiston milliy pedagogika universiteti', 'T.f.d., dotsent'], ru: ['Таниева Гулдона Мамановна', 'Национальный педагогический университет Узбекистана имени Аль-Фараби (Низамий)', 'д.т.н., доцент'], en: ['Taniyeva Guldona Mamanovna', 'National University of Uzbekistan named after Al-Farabi (Nizami)', 'DSc in Technical Sciences, Associate Professor'] },
    { uz: ['Nigora Allayeva Ashirovna', 'Toshkent davlat sharqshunoslik instituti', 'T.f.d., katta ilmiy xodim'], ru: ['Аллаева Нигора Ашировна', 'Ташкентский государственный институт востоковедения', 'д.т.н., старший научный сотрудник'], en: ['Allayeva Nigora Ashirovna', 'Tashkent State Institute of Oriental Studies', 'DSc in Technical Sciences, Senior Researcher'] },
    { uz: ['Mamadaliyev Husniddin Muydinovich', 'Toshkent Kimyo xalqaro universiteti', 'T.f.n., dotsent'], ru: ['Мамадалиев Хусниддин Муйдинович', 'Ташкентский химический международный университет', 'к.т.н., доцент'], en: ['Mamadaliyev Husniddin Muydinovich', 'Tashkent International University of Chemistry', 'PhD in Technical Sciences, Associate Professor'] },
    { uz: ['Xalmuminov Ulug‘bek Rahmatullayevich', 'Toshkent Kimyo xalqaro universiteti', 'PhD, dotsent'], ru: ['Халмуминов Улугбек Рахматуллаевич', 'Ташкентский химический международный университет', 'к.т.н. (PhD), доцент'], en: ['Khalmuminov Ulugbek Rahmatullayevich', 'Tashkent International University of Chemistry', 'PhD, Associate Professor'] },
    { uz: ['Muxammadiyev Raxmon Rashidovich', 'Toshkent davlat sharqshunoslik universiteti', 'PhD'], ru: ['Мухаммадиев Рахмон Рашидович', 'Ташкентский государственный университет востоковедения', 'к.т.н. (PhD)'], en: ['Mukhammadiyev Rakhmon Rashidovich', 'Tashkent State University of Oriental Studies', 'PhD'] },
    { uz: ['Primov Muxiddin Omonovich', 'Toshkent Kimyo xalqaro universiteti', 'PhD, dotsent'], ru: ['Примов Мухиддин Омонович', 'Ташкентский химический международный университет', 'к.т.н. (PhD), доцент'], en: ['Primov Mukhiddin Omonovich', 'Tashkent International University of Chemistry', 'PhD, Associate Professor'] },
  ];

  function personLine(lang, person) {
    const [name, org, degree] = person[lang];
    return `<li><strong>${name}</strong>, ${degree}, ${org}</li>`;
  }

  function roleBlock(lang, person, heading) {
    const [name, org, degree] = person[lang];
    return `<h2>${heading}</h2>`
      + `<p class="editorial-member"><strong>${name}</strong>, ${degree}, ${org}</p>`;
  }

  function render(lang) {
    const L = LABELS[lang];
    const chief = PEOPLE.find((p) => p.role === 'chief');
    const deputy = PEOPLE.find((p) => p.role === 'deputy');
    const members = PEOPLE.filter((p) => !p.role);

    return roleBlock(lang, chief, L.chief)
      + roleBlock(lang, deputy, L.deputy)
      + `<h2>${L.board}</h2>`
      + '<ul class="editorial-board-list">'
      + members.map((p) => personLine(lang, p)).join('')
      + '</ul>'
      + `<p class="editorial-download"><a class="btn btn-primary" href="${DOC}" download>Muarrix jurnali tahririyati 2025 — ${L.doc}</a></p>`;
  }

  if (typeof window !== 'undefined') {
    window.__MUARRIX_EDITORIAL_BOARD_2025__ = {
      uz: render('uz'),
      ru: render('ru'),
      en: render('en'),
    };
  }
})();
