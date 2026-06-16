/**
 * UZ / EN: «О журнале» va «Редакционный совет»
 */
(function () {
  const EB =
    (typeof window !== 'undefined' && window.__MUARRIX_EDITORIAL_BOARD_2025__) || { uz: '', en: '', ru: '' };
  const NZ =
    (typeof window !== 'undefined' && window.__MUARRIX_ABOUT_NIZOMI__) || { uz: '', en: '', ru: '' };

  const pack = {
    uz: {
      about_body_html: NZ.uz,
      editorial_lead: 'Jurnal ilmiy nashrlar va tahririyat bo‘limining joriy tarkibi (2025).',
      editorial_body_html: EB.uz,
    },
    en: {
      about_body_html: NZ.en,
      editorial_lead: 'Current composition of the Department of Scientific Publications and Editorial (2025).',
      editorial_body_html: EB.en,
    },
  };

  if (typeof window !== 'undefined') {
    window.__MUARRIX_ABOUT_EDITORIAL_PACK = {
      ...pack,
      ru: {
        about_body_html: NZ.ru,
        editorial_lead: 'Актуальный состав отдела научных публикаций и редакции журнала (2025).',
        editorial_body_html: EB.ru,
      },
    };
  }
})();
