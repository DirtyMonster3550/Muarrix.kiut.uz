const { extractDocxText, countWords } = require('./docxText');

const SECTION_PATTERNS = [
  { key: 'abstract', label: 'Аннотация', re: /аннотац|abstract|annotatsiya|реферат/i },
  { key: 'keywords', label: 'Ключевые слова', re: /ключев(ые|ых)\s+слов|keywords|kalit\s+so['']z/i },
  { key: 'introduction', label: 'Введение', re: /введени|introduction|kirish/i },
  { key: 'references', label: 'Список литературы', re: /литератур|references|bibliograph|манба|источник/i },
  { key: 'conclusion', label: 'Заключение', re: /заключени|вывод|conclusion|xulosa/i },
];

function push(checks, level, message, hint) {
  checks.push({ level, message, hint: hint || null });
}

function splitAuthorNames(authors) {
  return String(authors || '')
    .split(/[,;]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function checkAuthors(authors, checks) {
  const names = splitAuthorNames(authors);
  if (!names.length) {
    push(checks, 'error', 'Укажите авторов через запятую');
    return;
  }
  if (names.length > 5) {
    push(checks, 'error', `Слишком много авторов (${names.length}). Максимум 5.`);
  } else {
    push(checks, 'ok', `Авторы: ${names.length} чел.`);
  }

  const dup = names.filter((n, i) => names.findIndex((x) => x.toLowerCase() === n.toLowerCase()) !== i);
  if (dup.length) {
    push(checks, 'error', 'В списке авторов есть дубликаты');
  }

  const badFormat = names.filter((n) => !/[А-ЯA-ZЁӘҒҚҢӨҰҮҺІЎҲ][а-яa-zёәғқңөұүһіўҳ'-]+/.test(n));
  if (badFormat.length) {
    push(checks, 'warn', 'Проверьте формат ФИО авторов (рекомендуется: Иванов И.И.)');
  }
}

function checkAbstract(abstract, checks) {
  const text = String(abstract || '').trim();
  if (!text) {
    push(checks, 'warn', 'Аннотация не заполнена', 'Рекомендуется 150–250 слов');
    return;
  }

  const words = countWords(text);
  if (words < 80) {
    push(checks, 'warn', `Аннотация короткая (${words} слов)`, 'Обычно 150–250 слов');
  } else if (words > 350) {
    push(checks, 'warn', `Аннотация длинная (${words} слов)`, 'Обычно 150–250 слов');
  } else {
    push(checks, 'ok', `Аннотация: ${words} слов`);
  }
}

function checkTitle(title, checks) {
  const text = String(title || '').trim();
  if (!text) {
    push(checks, 'error', 'Укажите название статьи');
    return;
  }
  if (text.length < 12) {
    push(checks, 'warn', 'Название очень короткое');
  } else if (text.length > 300) {
    push(checks, 'warn', 'Название слишком длинное');
  } else {
    push(checks, 'ok', 'Название заполнено');
  }

  if (text === text.toUpperCase() && text.length > 20) {
    push(checks, 'warn', 'Название набрано капсом', 'Используйте обычный регистр');
  }
}

function checkManuscriptText(text, checks) {
  if (!text) {
    push(checks, 'warn', 'Не удалось прочитать текст из файла', 'Сохраните документ в DOCX и попробуйте снова');
    return;
  }

  const words = countWords(text);
  if (words < 1500) {
    push(checks, 'warn', `Текст рукописи короткий (~${words} слов)`, 'Для научной статьи обычно от 3000 слов');
  } else if (words < 3000) {
    push(checks, 'warn', `Объём рукописи: ~${words} слов`, 'Проверьте, достаточно ли материала');
  } else {
    push(checks, 'ok', `Объём рукописи: ~${words} слов`);
  }

  for (const section of SECTION_PATTERNS) {
    if (section.re.test(text)) {
      push(checks, 'ok', `В рукописи найден раздел: ${section.label}`);
    } else {
      push(checks, 'warn', `Не найден раздел: ${section.label}`, 'Проверьте структуру по правилам журнала');
    }
  }
}

function checkSubmission(input) {
  const checks = [];
  const { title, authors, abstract, author_date, filePath, fileSize } = input;

  checkTitle(title, checks);
  checkAuthors(authors, checks);
  checkAbstract(abstract, checks);

  if (!author_date || !/^\d{4}-\d{2}-\d{2}$/.test(String(author_date).trim())) {
    push(checks, 'error', 'Укажите дату в формате ГГГГ-ММ-ДД');
  } else {
    push(checks, 'ok', 'Дата указана');
  }

  if (!filePath) {
    push(checks, 'error', 'Прикрепите файл рукописи (DOC или DOCX)');
  } else if (fileSize === 0) {
    push(checks, 'error', 'Файл пустой');
  } else {
    const mb = (fileSize / (1024 * 1024)).toFixed(1);
    push(checks, 'ok', `Файл прикреплён (${mb} МБ)`);
    try {
      const text = extractDocxText(filePath);
      checkManuscriptText(text, checks);
    } catch {
      push(checks, 'warn', 'Не удалось проанализировать содержимое файла');
    }
  }

  const errors = checks.filter((c) => c.level === 'error').length;
  const warnings = checks.filter((c) => c.level === 'warn').length;
  const ok = checks.filter((c) => c.level === 'ok').length;
  const score = Math.max(0, Math.min(100, Math.round((ok * 10 - warnings * 4 - errors * 20))));

  return {
    score,
    ready: errors === 0,
    summary: errors
      ? 'Есть критические замечания — исправьте перед отправкой'
      : warnings
        ? 'Можно отправить, но лучше учесть рекомендации'
        : 'Рукопись выглядит готовой к подаче',
    counts: { ok, warnings, errors },
    checks,
  };
}

module.exports = {
  checkSubmission,
  splitAuthorNames,
};
