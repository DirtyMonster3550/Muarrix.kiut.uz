/**
 * Сортировка подпапок архива Muarrix.kiut.uz.
 * Поддерживает: «Том X № Y (YYYY) …», «2021 Том 1 № 2», вложенные пути.
 */

function parseMuarrixFolderMeta(name) {
  if (typeof name !== 'string') {
    return { tom: -1, num: -1, year: -1 };
  }
  const tomMatch = name.match(/Том\s*(\d+)/i);
  const nomMatch = name.match(/№\s*(\d+)/i);
  let year = -1;
  const parenYear = name.match(/\((\d{4})\)/);
  if (parenYear) year = Number(parenYear[1]);
  else {
    const plainYear = name.match(/\b(20\d{2})\b/);
    if (plainYear) year = Number(plainYear[1]);
  }
  return {
    tom: tomMatch ? Number(tomMatch[1]) : -1,
    num: nomMatch ? Number(nomMatch[1]) : -1,
    year,
  };
}

function sortArchiveFoldersNewestFirst(folderNames) {
  return [...folderNames].sort((a, b) => {
    const ma = parseMuarrixFolderMeta(a);
    const mb = parseMuarrixFolderMeta(b);
    if (ma.year !== mb.year) return mb.year - ma.year;
    if (ma.tom !== mb.tom) return ma.tom - mb.tom;
    if (ma.num !== mb.num) return ma.num - mb.num;
    return a.localeCompare(b, 'ru', { numeric: true });
  });
}

module.exports = { sortArchiveFoldersNewestFirst, parseMuarrixFolderMeta };
