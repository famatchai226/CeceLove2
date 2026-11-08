/* Vérifie les liens de la page (upsell -> landing pages sœurs, boutons d'achat -> checkout),
   la cohérence des fichiers de langue (fr/en), la couverture des clés i18n, le prix affiché
   et l'état des médias (visuels + bande-annonce, éventuellement « en attente »).
   Usage: node _tools/check-links.js
   PASS = conforme · WARN = élément encore en attente (non bloquant) · FAIL = à corriger. */
const fs = require('fs');
const path = require('path');

const SLUG = 'cecelove2-landing-page';

/* locate the landing page root, whether this script sits inside it (…/_tools/) or next to it */
function findRoot(start) {
  let dir = start;
  for (let i = 0; i < 4; i++) {
    if (fs.existsSync(path.join(dir, 'index.html')) && fs.existsSync(path.join(dir, 'locales'))) return dir;
    const candidate = path.join(dir, SLUG);
    if (fs.existsSync(path.join(candidate, 'index.html'))) return candidate;
    dir = path.dirname(dir);
  }
  throw new Error(SLUG + ' folder not found near ' + start);
}
const ROOT = findRoot(__dirname);
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
/* les médias laissés en commentaire (slots vides) ne sont pas des références actives */
const htmlLive = html.replace(/<!--[\s\S]*?-->/g, '');
const locales = {};
for (const lang of ['fr', 'en']) {
  locales[lang] = JSON.parse(fs.readFileSync(path.join(ROOT, 'locales', lang + '.json'), 'utf8'));
}

/* La bande-annonce doit être servie par un host qui gère les requêtes HTTP Range : sans Range,
   `video.seekable` reste [[0, 0]] et avancer/reculer devient impossible sur mobile
   (les Workers Cloudflare répondent 200 au lieu de 206 sur un Range).
   Source principale retenue : raw.githubusercontent.com (206 + Accept-Ranges, fichiers <= 100 Mo).
   jsDelivr plafonne à 20 Mo par fichier : il refuse le trailer livré (22 Mo), il ne pourra être
   réutilisé que si le mp4 repasse sous cette limite (son mime video/mp4 est plus propre).
   Le fichier local reste en 2e <source>, en secours. */
const TRAILER_CDN = 'https://raw.githubusercontent.com/famatchai226/CeceLove2/main/assets/trailer.mp4';
const TRAILER_LOCAL = './assets/trailer.mp4';
const TRAILER_CDN_MAX = 100 * 1024 * 1024; /* limite GitHub par fichier (jsDelivr : 20 Mo) */
const MP4_PATH = path.join(ROOT, 'assets', 'trailer.mp4');
const HAS_MEDIA = fs.existsSync(MP4_PATH);

const anchors = [...html.matchAll(/<a href="(https?:\/\/[^"]+)"[\s\S]{0,260}?data-i18n="([^"]+)"/g)];
console.log('page : ' + path.join(ROOT, 'index.html'));
console.log('--- tous les CTA externes de la page (clé i18n -> URL) ---');
anchors.forEach(a => console.log('  ' + a[2].padEnd(18) + ' ' + a[1]));

/* Les boutons « upsell » renvoient vers la landing page dédiée du produit
   (même convention que kera- / gotelegram- / boutique-landing-page).
   Règle produit : EXACTEMENT 3 cartes -> la boutique complète, CeceLove (l'autre volet), Baltazar. */
const LANDING = {
  'upsell.shop_btn': 'https://boutique-landing-page.famatchai226.workers.dev/',
  'upsell.cece_btn': 'https://cecelove.famatchai226.workers.dev/',
  'upsell.balta_btn': 'https://balta.famatchai226.workers.dev/'
};
/* Lien de checkout MyMaketou réel de CeceLove 2 (fourni) : les 4 boutons d'achat doivent pointer
   exactement dessus. En cas de changement de produit : mettre à jour CHECKOUT_URL ici + les 4 href
   de index.html (nav.cta, hero.cta, cta_section.btn, float_bar.btn). */
const CHECKOUT_PENDING = false;
const CHECKOUT_URL = 'https://baltazar.mymaketou.shop/products/meilleur-film-mature/checkout';
const CHECKOUT = ['nav.cta', 'hero.cta', 'cta_section.btn', 'float_bar.btn'];
const PRICE_FR = '3 500 FCFA';
const PRICE_EN = '3,500 FCFA';

let problems = 0;
let warnings = 0;
const ck = (ok, msg) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + msg); if (!ok) problems++; };
const warn = msg => { console.log('WARN  ' + msg); warnings++; };
const has = (key, url) => { const f = anchors.find(a => a[2] === key); return !!f && f[1] === url; };
const show = key => { const f = anchors.find(a => a[2] === key); return f ? f[1] : 'INTROUVABLE'; };
const get = (obj, key) => key.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), obj);

console.log('');
console.log('--- upsell : landing pages des produits sœurs ---');
for (const [key, url] of Object.entries(LANDING)) {
  ck(has(key, url), key + ' -> ' + show(key) + (has(key, url) ? '' : '  (attendu : ' + url + ')'));
}
/* règle produit : 3 cartes, pas une de plus, pas une de moins */
const upsellCards = [...html.matchAll(/<div class="upsell-card">([\s\S]*?)<\/div>/g)];
ck(upsellCards.length === 3, 'index.html : ' + upsellCards.length + ' carte(s) d\'upsell (exactement 3 attendues)');
ck(!/upsell\.bd_/.test(html), 'index.html : plus aucune carte BD dans l\'upsell');

console.log('');
console.log('--- boutons d\'achat : checkout CeceLove 2 ---');
for (const key of CHECKOUT) {
  if (has(key, CHECKOUT_URL)) {
    if (CHECKOUT_PENDING) warn(key + ' -> ' + CHECKOUT_URL + '  (provisoire : lien réel à fournir)');
    else ck(true, key + ' -> ' + CHECKOUT_URL);
  } else {
    ck(false, key + ' -> ' + show(key) + '  (attendu : ' + CHECKOUT_URL + ')');
  }
}
ck(!html.includes('TODO-CHECKOUT'), 'index.html : plus aucun rappel TODO-CHECKOUT (lien réel branché)');
ck(!html.includes('cecelove-2-a-definir'), 'index.html : plus aucune URL de checkout provisoire');

console.log('');
console.log('--- source de vérité : boutique-landing-page/how.md ---');
const doc = path.resolve(ROOT, '..', 'boutique-landing-page', 'how.md');
/* le how.md de la boutique documente les URLs des produits du catalogue + sa propre URL ;
   la landing CeceLove n'est pas un produit du catalogue, elle n'y figure donc pas. */
const DOCUMENTED = ['upsell.shop_btn', 'upsell.balta_btn'];
if (fs.existsSync(doc)) {
  const txt = fs.readFileSync(doc, 'utf8');
  for (const key of DOCUMENTED) {
    const url = LANDING[key];
    ck(txt.includes(url), key + ' documenté dans how.md (' + url + ')');
  }
} else {
  console.log('  (non trouvé : ' + doc + ' — vérification ignorée)');
}

console.log('');
console.log('--- prix : 3 500 FCFA (et plus jamais l\'ancien tarif) ---');
for (const lang of ['fr', 'en']) {
  const money = lang === 'fr' ? PRICE_FR : PRICE_EN;
  const json = locales[lang];
  const raw = fs.readFileSync(path.join(ROOT, 'locales', lang + '.json'), 'utf8');
  ck(json.nav.cta.includes(money), lang + '.json nav.cta = ' + json.nav.cta);
  ck(json.hero.cta.includes(money), lang + '.json hero.cta = ' + json.hero.cta);
  ck(json.cta_section.btn.includes(money), lang + '.json cta_section.btn = ' + json.cta_section.btn);
  ck(/3[ ,]500/.test(json.float_bar.text), lang + '.json float_bar.text = ' + json.float_bar.text);
  ck(json.offer.total_value === (lang === 'fr' ? '25 000 FCFA' : '25,000 FCFA'),
    lang + '.json offer.total_value (prix barré) = ' + json.offer.total_value);
  ck(!/1[ ,]500 FCFA/.test(raw), lang + '.json : aucun reste de l\'ancien tarif 1 500 FCFA');
  /* la carte « CeceLove 1 » de l'upsell cite forcément l'autre volet : le contrôle de marque
     porte donc sur tout le reste de la page (bloc upsell exclu). */
  /* les URLs ne sont pas de la copie : trailer.src pointe sur …/CeceLove2/… (dépôt GitHub),
     on l'écarte du balayage en même temps que le bloc upsell. */
  const rawNoUpsell = JSON.stringify({ ...json, upsell: undefined, trailer: { ...json.trailer, src: undefined } });
  ck(/CeceLove 2/.test(rawNoUpsell) && !/CeceLove(?! 2)/.test(rawNoUpsell),
    lang + '.json : la marque est bien « CeceLove 2 » partout (hors upsell)');
  ck(!!(json.upsell && json.upsell.shop_btn && json.upsell.cece_btn && json.upsell.balta_btn),
    lang + '.json upsell : 3 cartes = boutique complète / CeceLove 1 / Baltazar');
}

console.log('');
console.log('--- couverture des clés i18n (index.html -> fr.json & en.json) ---');
const usedKeys = [...new Set([...html.matchAll(/data-i18n(?:-html|-video)?="([^"]+)"/g)].map(m => m[1]))];
const missing = { fr: [], en: [] };
for (const key of usedKeys) {
  for (const lang of ['fr', 'en']) if (typeof get(locales[lang], key) !== 'string') missing[lang].push(key);
}
ck(usedKeys.length >= 40, usedKeys.length + ' clés data-i18n utilisées dans index.html');
ck(!missing.fr.length, 'fr.json : clés manquantes -> ' + (missing.fr.join(', ') || 'aucune'));
ck(!missing.en.length, 'en.json : clés manquantes -> ' + (missing.en.join(', ') || 'aucune'));

/* parité structurelle fr/en : les deux fichiers doivent décrire exactement les mêmes feuilles */
const leaves = (o, p = '') => Object.entries(o).flatMap(([k, v]) =>
  (v && typeof v === 'object') ? leaves(v, p + k + '.') : [p + k]);
const leavesFr = leaves(locales.fr);
const leavesEn = leaves(locales.en);
const onlyFr = leavesFr.filter(k => !leavesEn.includes(k));
const onlyEn = leavesEn.filter(k => !leavesFr.includes(k));
ck(!onlyFr.length && !onlyEn.length, 'parité fr/en : ' + leavesFr.length + ' clés'
  + (onlyFr.length ? ' — fr seul : ' + onlyFr.join(', ') : '')
  + (onlyEn.length ? ' — en seul : ' + onlyEn.join(', ') : ''));

console.log('');
console.log('--- visuels référencés dans index.html ---');
const refs = [...new Set([...htmlLive.matchAll(/(?:src|poster)="\.\/(assets\/[^"]+)"/g)].map(m => decodeURIComponent(m[1])))];
if (!refs.length) {
  warn('aucun visuel référencé : le dégradé de marque s\'affiche à la place du carrousel');
} else {
  for (const ref of refs) {
    if (fs.existsSync(path.join(ROOT, ref))) ck(true, ref + ' présent');
    else warn(ref + ' absent (slot média en attente)');
  }
}

console.log('');
console.log('--- bande-annonce ---');
if (HAS_MEDIA) {
  const mp4 = fs.readFileSync(MP4_PATH);
  const secondBox = mp4.toString('ascii', mp4.readUInt32BE(0) + 4, mp4.readUInt32BE(0) + 8);
  ck(secondBox === 'moov', 'trailer.mp4 : second atome = ' + secondBox + ' (faststart)');
  ck(html.includes('src="' + TRAILER_CDN + '"'), 'index.html : 1er <source> = CDN qui gère Range');
  ck(html.includes('src="' + TRAILER_LOCAL + '"'), 'index.html : 2e <source> = secours ' + TRAILER_LOCAL);
  ck(mp4.length <= TRAILER_CDN_MAX, 'trailer.mp4 = ' + (mp4.length / 1048576).toFixed(1)
    + ' Mo (<= 100 Mo, limite GitHub par fichier)');
  for (const lang of ['fr', 'en']) {
    ck(locales[lang].trailer.src === TRAILER_CDN, lang + '.json trailer.src = ' + locales[lang].trailer.src);
  }
} else {
  warn('assets/trailer.mp4 absent — le slot « bande-annonce à venir » est actif');
  ck(/video-slot/.test(html), 'index.html : placeholder vidéo (video-slot) affiché');
  for (const lang of ['fr', 'en']) {
    ck(locales[lang].trailer.src === '', lang + '.json trailer.src vide (aucun <video> pointant dans le vide)');
    ck(!!locales[lang].trailer.slot_title && !!locales[lang].trailer.slot_desc,
      lang + '.json : textes du slot vidéo présents');
  }
  console.log('  (rappel : le futur mp4 devra être servi par ' + TRAILER_CDN + ')');
}

console.log('');
console.log(problems ? 'RESULT: ' + problems + ' PROBLEM(S)'
  : 'RESULT: ALL CHECKS PASSED' + (warnings ? ' (' + warnings + ' WARN — éléments en attente)' : ''));
process.exit(problems ? 1 : 0);
