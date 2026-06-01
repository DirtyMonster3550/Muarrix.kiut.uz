const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const emojiRe = /(?:[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]|[\uD83C-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF\u2700-\u27BF\uFE0F\u200D])+/gu;
const extraRe = /[✅❌✖✍ℹ⚠📤🔔🚪🔧📬🌐📭🔑✉📰🗂👁✏🖨📩🚧💳❓📢📍📞📄🔗📊👤📋📝📌📚🔬⭐🚀💡🎯💻✨📅💰🌍🔍📧🏆]+/g;

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(html|js)$/.test(name)) out.push(p);
  }
  return out;
}

for (const file of walk(publicDir)) {
  const src = fs.readFileSync(file, 'utf8');
  let next = src
    .replace(/<span class="j-icon">[^<]*<\/span>\s*/g, '')
    .replace(/<span class="nav-icon">[^<]*<\/span>\s*/g, '')
    .replace(emojiRe, '')
    .replace(extraRe, '');
  next = next.replace(/  +/g, ' ').replace(/ ([,.!?;:])/g, '$1');
  if (next !== src) {
    fs.writeFileSync(file, next, 'utf8');
    console.log('updated:', path.relative(publicDir, file));
  }
}
