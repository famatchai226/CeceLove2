/* =========================================================================
   i18n-audit.js — garde-fou HTML / i18n de la landing page CeceLove 2
   -------------------------------------------------------------------------
   Vérifie trois choses qu'aucun `check-links.js` ne couvre :

   1. HTML dans les textes : un élément `data-i18n="cle"` reçoit son contenu via
      `textContent` (voir i18n.js). Si la valeur de la clé contient du HTML
      (`<strong>`, `<br />`…), les balises s'affichent EN TEXTE BRUT après un
      changement de langue. Ces clés doivent utiliser `data-i18n-html`.
   2. Équilibre des balises de structure (div, section, article, table, p…).
   3. Unicité des attributs `id` (les `getElementById` du script en dépendent).

   Usage (depuis le dossier cecelove2-landing-page) :
     node _tools/i18n-audit.js
   Code de sortie 0 = tout est vert.
   ========================================================================= */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dicts = {
  fr: JSON.parse(fs.readFileSync(path.join(ROOT, 'locales', 'fr.json'), 'utf8')),
  en: JSON.parse(fs.readFileSync(path.join(ROOT, 'locales', 'en.json'), 'utf8'))
};

const get = (obj, key) => key.split('.').reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : null), obj);

let failures = 0;
const fail = (msg) => { failures++; console.log('FAIL  ' + msg); };
const pass = (msg) => console.log('PASS  ' + msg);

/* ---------- 1. clés utilisées avec data-i18n mais contenant du HTML ---------- */
const rawHtmlKeys = [];
const tagRe = /<[a-zA-Z0-9]+\b[^>]*>/g;
let tagMatch;
while ((tagMatch = tagRe.exec(html))) {
  const tag = tagMatch[0];
  const keyMatch = /\sdata-i18n="([^"]+)"/.exec(tag);
  if (!keyMatch) continue;
  if (/data-i18n-(html|attr|video)/.test(tag)) continue;
  for (const lang of Object.keys(dicts)) {
    const value = get(dicts[lang], keyMatch[1]);
    if (typeof value === 'string' && /<[a-zA-Z/]/.test(value)) {
      rawHtmlKeys.push(lang + '  ' + keyMatch[1]);
    }
  }
}

if (rawHtmlKeys.length) {
  fail('clés avec du HTML sur un élément data-i18n (=> passer en data-i18n-html) :');
  [...new Set(rawHtmlKeys)].forEach((k) => console.log('        ' + k));
} else {
  pass('aucune clé HTML utilisée en data-i18n (textContent)');
}

/* ---------- 2. équilibre des balises de structure ---------- */
const TAGS = ['div', 'section', 'article', 'table', 'thead', 'tbody', 'tr', 'p', 'span', 'span', 'ul', 'li', 'svg', 'button', 'header', 'footer', 'nav', 'video', 'h1', 'h2', 'h3', 'th', 'td'];
const unbalanced = [];
[...new Set(TAGS)].forEach((name) => {
  const open = (html.match(new RegExp('<' + name + '\\b', 'g')) || []).length;
  const close = (html.match(new RegExp('</' + name + '>', 'g')) || []).length;
  if (open !== close) unbalanced.push(name + ' : ' + open + ' ouvertes / ' + close + ' fermées');
});

if (unbalanced.length) {
  fail('balises déséquilibrées :');
  unbalanced.forEach((u) => console.log('        ' + u));
} else {
  pass('balises HTML équilibrées (div, section, article, table, p, span…)');
}

/* ---------- 3. unicité des id ---------- */
const ids = [];
const idRe = /\sid="([^"]+)"/g;
let idMatch;
while ((idMatch = idRe.exec(html))) ids.push(idMatch[1]);
const dupes = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];

if (dupes.length) {
  fail('attributs id dupliqués : ' + dupes.join(', '));
} else {
  pass(ids.length + ' attributs id, tous uniques');
}

/* ---------- 4. les id utilisés par le JS existent bien ---------- */
const wanted = ['floatBar', 'scrollTopBtn', 'heroCarousel', 'slideDots', 'cdH', 'cdM', 'cdS', 'ageGate'];
const missing = wanted.filter((id) => !ids.includes(id));
if (missing.length) {
  fail('id attendus par le script mais absents : ' + missing.join(', '));
} else {
  pass('id attendus par le script présents (' + wanted.length + ')');
}

console.log(failures ? '\nRESULT: ' + failures + ' PROBLEM(S)' : '\nRESULT: ALL CHECKS PASSED');
process.exitCode = failures ? 1 : 0;
