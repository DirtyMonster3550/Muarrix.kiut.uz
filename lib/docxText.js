const fs = require('fs');
const zlib = require('zlib');

function extractDocxXml(filePath) {
  const buf = fs.readFileSync(filePath);
  let offset = 0;

  while (offset < buf.length - 30) {
    if (buf.readUInt32LE(offset) !== 0x04034b50) {
      offset += 1;
      continue;
    }

    const compMethod = buf.readUInt16LE(offset + 8);
    const compSize = buf.readUInt32LE(offset + 18);
    const nameLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);
    const name = buf.toString('utf8', offset + 30, offset + 30 + nameLen);
    const dataStart = offset + 30 + nameLen + extraLen;

    if (name === 'word/document.xml') {
      let data = buf.subarray(dataStart, dataStart + compSize);
      if (compMethod === 8) {
        data = zlib.inflateRawSync(data);
      }
      return data.toString('utf8');
    }

    offset = dataStart + compSize;
  }

  return '';
}

function xmlToPlainText(xml) {
  if (!xml) return '';
  return xml
    .replace(/<w:tab[^/]*\/>/g, '\t')
    .replace(/<w:br[^/]*\/>/g, '\n')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractDocxText(filePath) {
  const ext = require('path').extname(filePath).toLowerCase();
  if (ext === '.docx') {
    return xmlToPlainText(extractDocxXml(filePath));
  }
  if (ext === '.doc') {
    const buf = fs.readFileSync(filePath);
    const raw = buf.toString('latin1');
    const chunks = raw.match(/[\x20-\x7E\u0400-\u04FF]{4,}/g) || [];
    return chunks.join(' ').replace(/\s+/g, ' ').trim();
  }
  return '';
}

function countWords(text) {
  if (!text) return 0;
  return text
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}-]/gu, ''))
    .filter((w) => w.length > 1)
    .length;
}

module.exports = {
  extractDocxText,
  countWords,
};
