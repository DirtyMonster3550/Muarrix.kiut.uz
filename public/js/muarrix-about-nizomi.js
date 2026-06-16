/**

 * «О журнале» — требования, специальности и официальные документы.

 */

(function () {

  const NIZOMI = '/docs/muarrix-jurnali-nizomi.pdf';

  const ISSN = '/docs/muarrix-jurnali-issn.pdf';



  const REQ =

    (typeof window !== 'undefined' && window.__MUARRIX_ABOUT_REQUIREMENTS__) || { uz: '', ru: '', en: '' };



  const FIELDS = [

    { code: '07.00.01', uz: 'O‘zbekiston tarixi', ru: 'История Узбекистана', en: 'History of Uzbekistan' },

    { code: '07.00.02', uz: 'Fan va texnologiyalar tarixi', ru: 'История науки и технологий', en: 'History of science and technology' },

    { code: '07.00.03', uz: 'Jahon tarixi', ru: 'Всемирная история', en: 'World history' },

    { code: '07.00.04', uz: 'Dinshunoslik', ru: 'Религиоведение', en: 'Religious studies' },

    { code: '07.00.05', uz: 'Xalqaro munosabatlar va tashqi siyosat tarixi', ru: 'История международных отношений и внешней политики', en: 'History of international relations and foreign policy' },

    { code: '07.00.06', uz: 'Arxeologiya', ru: 'Археология', en: 'Archaeology' },

    { code: '07.00.07', uz: 'Etnografiya, etnologiya va antropologiya', ru: 'Этнография, этнология и антропология', en: 'Ethnography, ethnology and anthropology' },

    { code: '07.00.08', uz: 'Tarixshunoslik, manbashunoslik va tarixiy tadqiqot usullari', ru: 'Историография, источниковедение и методы исторического исследования', en: 'Historiography, source studies and historical research methods' },

    { code: '07.00.09', uz: 'Davlat siyosati va boshqaruvi tarixi', ru: 'История государственной политики и управления', en: 'History of state policy and governance' },

  ];



  const LABELS = {

    uz: {

      lead: '«Muarrix» ilmiy jurnali haqida ma’lumot va rasmiy hujjatlar.',

      fieldsTitle: 'Fan tarmog‘i, ixtisosliklar guruhi shifri va nomi',

      nizomi: 'Muarrix jurnali nizomi (PDF)',

      issn: 'ISSN guvohnomasi (PDF)',

    },

    ru: {

      lead: 'Сведения о научном журнале «Muarrix» и официальные документы.',

      fieldsTitle: 'Отрасль науки, код и наименование группы специальностей',

      nizomi: 'Устав журнала Muarrix (PDF)',

      issn: 'Свидетельство ISSN (PDF)',

    },

    en: {

      lead: 'Information about the Muarrix scientific journal and official documents.',

      fieldsTitle: 'Field of science, specialty group code and name',

      nizomi: 'Muarrix journal charter (PDF)',

      issn: 'ISSN certificate (PDF)',

    },

  };



  function fieldsHtml(lang) {

    return '<ul class="about-fields">'

      + FIELDS.map((f) => '<li><strong>' + f.code + '</strong> ' + f[lang] + '</li>').join('')

      + '</ul>';

  }



  function render(lang) {

    const L = LABELS[lang];

    return '<p class="about-lead">' + L.lead + '</p>'

      + REQ[lang]

      + '<h2 class="about-section-title about-fields-title">' + L.fieldsTitle + '</h2>'

      + fieldsHtml(lang)

      + '<div class="about-doc-buttons">'

      + '<a class="btn btn-primary" href="' + NIZOMI + '" download>' + L.nizomi + '</a>'

      + '<a class="btn btn-secondary" href="' + ISSN + '" download>' + L.issn + '</a>'

      + '</div>';

  }



  if (typeof window !== 'undefined') {

    window.__MUARRIX_ABOUT_NIZOMI__ = {

      uz: render('uz'),

      ru: render('ru'),

      en: render('en'),

    };

  }

})();


