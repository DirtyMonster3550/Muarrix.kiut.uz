const STOP_WORDS = new Set([
  'и', 'в', 'на', 'по', 'для', 'из', 'к', 'о', 'об', 'от', 'до', 'при', 'как', 'что', 'это',
  'the', 'a', 'an', 'of', 'in', 'on', 'for', 'to', 'and', 'or', 'with', 'from',
  'va', 'ham', 'uchun', 'bilim', 'fan',
]);

const TOPIC_HINTS = [
  { tag: 'экономика', re: /эконом|finance|moliya|iqtisod/i },
  { tag: 'образование', re: /образован|pedagog|ta'lim|o'qit/i },
  { tag: 'IT', re: /информат|digital|raqam|компьютер|software|texnolog/i },
  { tag: 'менеджмент', re: /менеджмент|management|boshqar/i },
  { tag: 'право', re: /право|legal|huquq/i },
  { tag: 'наука', re: /научн|research|ilmiy|исследован/i },
];

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

function extractTags(article) {
  const hay = [article.title, article.authorsText, article.file].join(' ');
  const tags = TOPIC_HINTS.filter((t) => t.re.test(hay)).map((t) => t.tag);
  if (!tags.length) {
    const tokens = tokenize(article.title).slice(0, 3);
    return tokens.map((t) => t.charAt(0).toUpperCase() + t.slice(1));
  }
  return tags;
}

function expandQueryTerms(q) {
  const terms = tokenize(q);
  const expanded = new Set(terms);
  for (const term of terms) {
    if (term.length > 5) expanded.add(term.slice(0, -1));
  }
  return [...expanded];
}

function scoreArticle(article, q) {
  if (!q) return 0;

  const terms = expandQueryTerms(q);
  const titleTokens = new Set(tokenize(article.title));
  const authorTokens = new Set(tokenize(article.authorsText));
  const fileTokens = new Set(tokenize(article.file));
  const allText = [article.title, article.authorsText, article.file, article.folder].join(' ').toLowerCase();

  let score = 0;
  for (const term of terms) {
    if (titleTokens.has(term)) score += 12;
    else if ([...titleTokens].some((t) => t.startsWith(term) || term.startsWith(t))) score += 8;
    if (authorTokens.has(term)) score += 6;
    if (fileTokens.has(term)) score += 2;
    if (allText.includes(term)) score += 3;
  }

  if (article.title.toLowerCase().includes(q.toLowerCase())) score += 15;
  return score;
}

function smartSearch(articles, options = {}) {
  const q = typeof options.q === 'string' ? options.q.trim() : '';
  const year = options.year ? Number(options.year) : null;
  const tom = options.tom ? Number(options.tom) : null;
  const num = options.num ? Number(options.num) : null;
  const limit = options.limit ? Number(options.limit) : null;

  let results = articles;

  if (year && !Number.isNaN(year)) results = results.filter((a) => a.year === year);
  if (tom && !Number.isNaN(tom)) results = results.filter((a) => a.tom === tom);
  if (num && !Number.isNaN(num)) results = results.filter((a) => a.num === num);

  if (q) {
    results = results
      .map((a) => ({
        ...a,
        relevance: scoreArticle(a, q),
        tags: extractTags(a),
      }))
      .filter((a) => a.relevance > 0)
      .sort((a, b) => {
        if (b.relevance !== a.relevance) return b.relevance - a.relevance;
        if (a.year !== b.year) return b.year - a.year;
        return a.title.localeCompare(b.title, 'ru', { sensitivity: 'base' });
      });
  } else {
    results = results.map((a) => ({ ...a, relevance: 0, tags: extractTags(a) }));
    results.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      if (a.tom !== b.tom) return a.tom - b.tom;
      if (a.num !== b.num) return a.num - b.num;
      return a.title.localeCompare(b.title, 'ru', { sensitivity: 'base' });
    });
  }

  if (limit && limit > 0) results = results.slice(0, limit);
  return results;
}

function jaccardSimilarity(a, b) {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (!setA.size || !setB.size) return 0;
  let inter = 0;
  for (const t of setA) if (setB.has(t)) inter += 1;
  return inter / (setA.size + setB.size - inter);
}

function findSimilarArticles(articles, target, limit = 5) {
  const hay = [target.title, target.authorsText].join(' ');
  return articles
    .filter((a) => !(a.folder === target.folder && a.file === target.file))
    .map((a) => ({
      ...a,
      similarity: Math.round(jaccardSimilarity(hay, [a.title, a.authorsText].join(' ')) * 100),
      tags: extractTags(a),
    }))
    .filter((a) => a.similarity >= 12)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

module.exports = {
  smartSearch,
  findSimilarArticles,
  extractTags,
  scoreArticle,
};
