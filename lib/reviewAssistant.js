const { countWords } = require('./docxText');

function shortSummary(submission) {
  const abstract = String(submission.abstract || '').trim();
  if (abstract.length > 40) {
    const words = abstract.split(/\s+/).slice(0, 45).join(' ');
    return words + (abstract.split(/\s+/).length > 45 ? '…' : '');
  }
  return `Статья «${submission.title}» от ${submission.authors}. Тематика требует внимательной экспертной оценки.`;
}

function techChecklist(submission) {
  const items = [
    { id: 'format', text: 'Соответствие требованиям оформления (шрифт, поля, нумерация)' },
    { id: 'structure', text: 'Наличие обязательных разделов: аннотация, ключевые слова, введение, выводы, литература' },
    { id: 'metadata', text: 'Корректность названия, списка авторов и аннотации' },
    { id: 'language', text: 'Грамотность языка и единообразие терминов' },
    { id: 'file', text: 'Файл читается, не повреждён, формат DOC/DOCX' },
  ];

  const hints = [];
  if (!submission.abstract || countWords(submission.abstract) < 80) {
    hints.push('Аннотация отсутствует или слишком короткая — уточните у автора.');
  }
  if (String(submission.authors || '').split(/[,;]/).filter(Boolean).length > 5) {
    hints.push('Более 5 авторов — проверьте соответствие правилам журнала.');
  }
  if (!submission.file_path) {
    hints.push('Файл рукописи не прикреплён.');
  }

  return { items, hints };
}

function editorialChecklist(submission) {
  const items = [
    { id: 'novelty', text: 'Научная новизна и актуальность темы' },
    { id: 'methods', text: 'Корректность методологии и обоснованность выводов' },
    { id: 'sources', text: 'Качество и актуальность списка литературы' },
    { id: 'logic', text: 'Логика изложения и связность разделов' },
    { id: 'scope', text: 'Соответствие тематике журнала Muarrix.kiut.uz' },
  ];

  const hints = [];
  if (submission.admin_note) {
    hints.push(`Заметка тех. эксперта: ${submission.admin_note}`);
  }
  if (submission.tech_reviewer_name) {
    hints.push(`Тех. эксперт: ${submission.tech_reviewer_name}`);
  }

  return { items, hints };
}

function buildDraftNotes(submission, role) {
  const journal = submission.journal || 'muarrix';
  const issue = submission.issue_title ? ` (${submission.issue_title})` : '';

  if (role === 'tech_expert') {
    return [
      `Уважаемый(ая) автор!`,
      ``,
      `Благодарим за подачу статьи «${submission.title}» в журнал ${journal}${issue}.`,
      `По результатам технической экспертизы просим доработать рукопись:`,
      `1. …`,
      `2. …`,
      ``,
      `После исправлений загрузите обновлённый файл в личном кабинете.`,
    ].join('\n');
  }

  return [
    `Уважаемый(ая) автор!`,
    ``,
    `По результатам редакционной экспертизы статьи «${submission.title}» просим учесть следующие замечания:`,
    `1. Уточните научную новизну и практическую значимость.`,
    `2. Дополните список литературы актуальными источниками.`,
    `3. …`,
    ``,
    `Просим внести правки и повторно направить рукопись.`,
  ].join('\n');
}

function buildReviewAssist(submission, role) {
  const isTech = role === 'tech_expert';
  const checklist = isTech ? techChecklist(submission) : editorialChecklist(submission);

  return {
    summary: shortSummary(submission),
    role,
    checklist: checklist.items,
    hints: checklist.hints,
    draftNote: buildDraftNotes(submission, role),
    focus: isTech
      ? 'Техническая экспертиза: оформление, структура, метаданные'
      : 'Редакционная экспертиза: содержание, методология, научная ценность',
  };
}

module.exports = {
  buildReviewAssist,
};
