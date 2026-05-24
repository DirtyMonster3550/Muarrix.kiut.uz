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
      ru: 'Как опубликовать статью — Центрально-азиатский журнал STEM',
      uz: 'Maqola chop etish — Markaziy Osiyo STEM jurnali',
      en: 'How to publish — Central Asian Journal of STEM',
    },
    rules: {
      ru: 'Правила для авторов — Центрально-азиатский журнал STEM',
      uz: 'Mualliflar uchun qoidalar — Markaziy Osiyo STEM jurnali',
      en: 'Author guidelines — Central Asian Journal of STEM',
    },
    faq: {
      ru: 'Вопрос — ответ — Центрально-азиатский журнал STEM',
      uz: 'Savol-javob — Markaziy Osiyo STEM jurnali',
      en: 'FAQ — Central Asian Journal of STEM',
    },
  };

  /** Base UI strings merged with optional official content pack (rules + FAQ). */
  const STRINGS_BASE = {
    ru: {
      breadcrumb_home: 'Главная',
      bc_parent: 'Центрально-азиатский журнал STEM',
      brand_title_main: 'Центрально-азиатский журнал STEM',
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
      breadcrumb_hub_name: 'KIUT ilmiy nashrlari',
      breadcrumb_how: 'Как опубликовать статью',
      breadcrumb_rules: 'Правила для авторов',
      breadcrumb_faq: 'Вопрос — ответ',
      card_cta_journal: 'Сайт журнала {j} →',
      card_cta_conf: 'Сайт конференций →',
      card_desc_finecs: 'Международный журнал финансов и экономической стабильности, включенный в список журналов, рекомендованных ВАК РУз',
      card_desc_stem: 'Центральноазиатский STEM-журнал, включенный в список журналов, рекомендованных ВАК РУз',
      card_title_conf: 'Сборник конференции',
      card_desc_conf: 'KIUT Conferences — материалы и тезисы',
      card_desc_muarrix: 'Исторический научный журнал, включенный в перечень журналов, рекомендованных ВАК РУз',
      card_desc_ehl: 'Журнал гуманитарных наук и языка',
      card_desc_med: 'Медицинские публикации',
      card_cta_med: 'Сайт Journal of digital medicine →',
      how_h1: '📝 Как опубликовать статью',
      how_lead_start: 'Публикация в ',
      how_lead_strong: 'Центрально-азиатском журнале STEM',
      how_lead_end:
        ' оформляется на этой платформе. Регистрация и подача рукописи — через личный кабинет автора на этом сайте.',
      how_steps_title: 'Пошаговая инструкция',
      how_s1t: 'Зарегистрируйтесь на платформе',
      how_s1p:
        'Создайте аккаунт автора: «Подать статью» или «Регистрация». Журнал — Центрально-азиатский журнал STEM (ISSN 2181-2934).',
      how_s2t: 'Ознакомьтесь с правилами оформления',
      how_s2p_before: 'Подготовьте рукопись согласно ',
      how_s2p_link: 'правилам для авторов',
      how_s2p_after: ': структура IMRAD, объём, шрифты, список литературы.',
      how_s3t: 'Проверьте оригинальность',
      how_s3p:
        'Убедитесь, что уровень оригинальности текста не менее 75%. Рекомендуем использовать Antiplagiat.ru или iThenticate.',
      how_s4t: 'Подайте материал через личный кабинет',
      how_s4p:
        'Рукопись в форматах DOC или DOCX; PDF не принимается. В кабинете выберите актуальный выпуск STEM и загрузите файл.',
      how_s5t: 'Ожидайте решения редакции',
      how_s5p:
        'Обычно рассмотрение занимает 7–14 рабочих дней. Уведомление придёт на email и в личный кабинет на этом сайте.',
      how_s6t: 'Внесите правки (если нужно)',
      how_s6p:
        'Если редакция запросила доработку — исправьте замечания в личном кабинете и отправьте обновлённую версию.',
      how_help_html:
        '📬 <strong>Нужна помощь?</strong> Напишите редакции STEM: <a href="mailto:g.isamova@gmail.com">g.isamova@gmail.com</a> или позвоните <strong>+998 78 129 40 40</strong>',
      rules_h1: '📋 Правила для авторов',
      rules_lead_before: 'Статьи в ',
      rules_lead_strong: 'Центрально-азиатском журнале STEM',
      rules_lead_after:
        ' оформляются по международному стандарту IMRAD и должны соответствовать техническим требованиям ниже.',
      faq_h1: '❓ Часто задаваемые вопросы',
      faq_lead:
        'Здесь собраны ответы на самые популярные вопросы авторов. Если вы не нашли ответ — напишите нам напрямую.',
    },
    uz: {
      breadcrumb_home: 'Bosh sahifa',
      bc_parent: 'Markaziy Osiyo STEM jurnali',
      brand_title_main: 'Markaziy Osiyo STEM jurnali',
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
      breadcrumb_hub_name: 'KIUT ilmiy nashrlari',
      breadcrumb_how: 'Maqola chop etish',
      breadcrumb_rules: 'Mualliflar uchun qoidalar',
      breadcrumb_faq: 'Savol-javob',
      card_cta_journal: '{j} jurnal sayti →',
      card_cta_conf: 'Ilmiy amaliy anjumanlar sayti →',
      card_desc_finecs: 'O‘zR OAK tavsiya etgan jurnal ro‘yhatiga kiritilgan Xalqaro moliya va iqtisodiy barqarorlik jurnali',
      card_desc_stem: 'O‘zR OAK tavsiya etgan jurnal ro‘yhatiga kiritilgan Markaziy Osiyo STEM jurnali',
      card_title_conf: 'Ilmiy amaliy anjumanlar',
      card_desc_conf: 'Ilmiy amaliy anjumanlar malumotlari (to‘plamlar)',
      card_desc_muarrix: 'O‘zR OAK tavsiya etgan jurnal ro‘yhatiga kiritilgan Tarix ilmiy jurnali',
      card_desc_ehl: 'Gumanitar fanlar va til jurnali',
      card_desc_med: 'Tibbiyot jurnali',
      card_cta_med: 'Journal of digital medicine sayti →',
      how_h1: '📝 Maqola chop etish',
      how_lead_start: 'Chop etish ',
      how_lead_strong: 'Markaziy Osiyo STEM jurnalida',
      how_lead_end:
        ' ushbu platformada rasmiylashtiriladi. Ro‘yxatdan o‘tish va topshirish — shu saytdagi shaxsiy kabinet orqali.',
      how_steps_title: 'Qadam-baqadam yo‘riqnoma',
      how_s1t: 'Platformada ro‘yxatdan o‘ting',
      how_s1p:
        'Muallif akkauntini yarating. Jurnal — Markaziy Osiyo STEM jurnali (ISSN 2181-2934).',
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
        'Qo‘lyozma DOC yoki DOCX; PDF qabul qilinmaydi. Kabinetda joriy STEM sonini tanlang va faylni yuklang.',
      how_s5t: 'Tahririyat qarorini kuting',
      how_s5p:
        'Odatda 7–14 ish kuni. Xabar email va ushbu saytdagi shaxsiy kabinetga keladi.',
      how_s6t: 'Tuzatishlar kiriting (agar kerak bo‘lsa)',
      how_s6p:
        'Tahririyat tuzatish so‘rasa — shaxsiy kabinetda tuzating va qayta yuboring.',
      how_help_html:
        '📬 <strong>Yordam kerakmi?</strong> <a href="mailto:g.isamova@gmail.com">g.isamova@gmail.com</a> yoki <strong>+998 78 129 40 40</strong>',
      rules_h1: '📋 Mualliflar uchun qoidalar',
      rules_lead_before: 'Maqolalar ',
      rules_lead_strong: 'Markaziy Osiyo STEM jurnalida',
      rules_lead_after:
        ' xalqaro IMRAD standarti va quyidagi texnik talablarga muvofiq rasmiylashtiriladi.',
      faq_h1: '❓ Ko‘p beriladigan savollar',
      faq_lead:
        'Bu yerda mualliflar eng ko‘p beradigan savollarga javoblar joylangan. Javob topmasangiz — bevosita yozing.',
    },
    en: {
      breadcrumb_home: 'Home',
      bc_parent: 'Central Asian Journal of STEM',
      brand_title_main: 'Central Asian Journal of STEM',
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
      breadcrumb_hub_name: 'KIUT ilmiy nashrlari',
      breadcrumb_how: 'How to publish',
      breadcrumb_rules: 'Author guidelines',
      breadcrumb_faq: 'FAQ',
      card_cta_journal: '{j} — journal website →',
      card_cta_conf: 'Conference website →',
      card_desc_finecs: 'International Journal of Finance and Economic Stability, included in the list of journals recommended by the HAC of the Republic of Uzbekistan',
      card_desc_stem: 'Central Asian STEM journal included in the list of journals recommended by the HAC of the Republic of Uzbekistan',
      card_title_conf: 'Conference proceedings',
      card_desc_conf: 'KIUT Conferences — papers and abstracts',
      card_desc_muarrix: 'Historical scientific journal included in the list of journals recommended by the Higher Attestation Commission of the Republic of Uzbekistan',
      card_desc_ehl: 'Journal of Humanities and Language',
      card_desc_med: 'Medical and related publications',
      card_cta_med: 'Journal of digital medicine — website →',
      how_h1: '📝 How to publish',
      how_lead_start: 'Publishing in the ',
      how_lead_strong: 'Central Asian Journal of STEM',
      how_lead_end:
        ' is handled on this platform. Registration and submission are through your author account on this site.',
      how_steps_title: 'Step-by-step guide',
      how_s1t: 'Register on the platform',
      how_s1p:
        'Create an author account. The journal is the Central Asian Journal of STEM (ISSN 2181-2934).',
      how_s2t: 'Read the formatting rules',
      how_s2p_before: 'Prepare your manuscript according to the ',
      how_s2p_link: 'author guidelines',
      how_s2p_after: ': structure, length, fonts, reference list.',
      how_s3t: 'Check originality',
      how_s3p:
        'Ensure originality is at least 75%. We recommend Antiplagiat.ru or iThenticate.',
      how_s4t: 'Submit via your author account',
      how_s4p:
        'Manuscript in DOC or DOCX; PDF is not accepted. In your account, select the current STEM issue and upload the file.',
      how_s5t: 'Await the editorial decision',
      how_s5p:
        'Review usually takes 7–14 business days. You will be notified by email and in your account on this site.',
      how_s6t: 'Apply revisions if requested',
      how_s6p:
        'If revisions are requested, update the manuscript in your author account and resubmit.',
      how_help_html:
        '📬 <strong>Need help?</strong> Email <a href="mailto:g.isamova@gmail.com">g.isamova@gmail.com</a> or call <strong>+998 78 129 40 40</strong>',
      rules_h1: '📋 Author guidelines',
      rules_lead_before: 'Articles in the ',
      rules_lead_strong: 'Central Asian Journal of STEM',
      rules_lead_after:
        ' must follow the international IMRAD standard and meet the technical requirements below.',
      faq_h1: '❓ Frequently asked questions',
      faq_lead:
        'Answers to common author questions. If you cannot find an answer — contact us directly.',
    },
  };

  const RF =
    typeof window !== 'undefined' && window.__KIUT_RULES_FAQ_PACK
      ? window.__KIUT_RULES_FAQ_PACK
      : { ru: {}, uz: {}, en: {} };

  const SITE =
    typeof window !== 'undefined' && window.__STEM_SITE_PACK
      ? window.__STEM_SITE_PACK
      : { ru: {}, uz: {}, en: {} };

  const STRINGS = {
    ru: { ...STRINGS_BASE.ru, ...(SITE.ru || {}), ...(RF.ru || {}) },
    uz: { ...STRINGS_BASE.uz, ...(SITE.uz || {}), ...(RF.uz || {}) },
    en: { ...STRINGS_BASE.en, ...(SITE.en || {}), ...(RF.en || {}) },
  };

  function normalizeLang(lang) {
    const l = (lang || '').toLowerCase();
    return LEGAL_LANG.includes(l) ? l : 'ru';
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
    let text = pack[key] ?? STRINGS.ru[key] ?? key;
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
    if (L === 'en') return k === 1 ? forms.one : forms.other;
    if (L === 'uz') return forms.one;
    const m10 = k % 10;
    const m100 = k % 100;
    if (m10 === 1 && m100 !== 11) return forms.one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return forms.few;
    return forms.many;
  }

  function applyLang(lang) {
    const L = normalizeLang(lang);
    document.documentElement.lang = L === 'uz' ? 'uz' : L === 'en' ? 'en' : 'ru';

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
      document.title = STRINGS[L]?.[entry] ?? STRINGS.ru?.[entry] ?? entry;
    }

    document.dispatchEvent(new CustomEvent('kiut:langchange', { detail: { lang: L } }));

    document.querySelectorAll('.lang-switch__btn').forEach((btn) => {
      const l = btn.getAttribute('data-set-lang');
      btn.classList.toggle('is-active', l === L);
      btn.setAttribute('aria-pressed', l === L ? 'true' : 'false');
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
