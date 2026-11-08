/* Contrôle de la page EN LIGNE (production) :
   1. la page répond 200 ;
   2. les 7 CTA ont les bonnes cibles (upsell -> landing pages, achat -> checkout) ;
   3. chaque balise <source> de la bande-annonce est testée : type MIME, faststart, et
      surtout support HTTP `Range` (`206` + `Accept-Ranges: bytes`). Sans Range le navigateur
      interdit tout déplacement dans la vidéo (`video.seekable` = [[0, 0]]) même si le fichier
      est entièrement téléchargé — c'est ce qui bloquait le seek sur mobile.

   Usage:
     node _tools/prod-check.js
     node _tools/prod-check.js https://cecelove2.famatchai226.workers.dev/
*/
const BASE = (process.argv[2] || 'https://cecelove2.famatchai226.workers.dev/').replace(/\/?$/, '/');

/* Liens sortants attendus en ligne : landing pages soeurs + checkout MyMaketou reel de
   CeceLove 2 (fourni). CHECKOUT_PENDING reste a false : un ecart est desormais bloquant. */
const CHECKOUT_PENDING = false;
const CHECKOUT = 'https://baltazar.mymaketou.shop/products/meilleur-film-mature/checkout';
const LANDING = {
  'upsell.shop_btn': 'https://boutique-landing-page.famatchai226.workers.dev/',
  'upsell.cece_btn': 'https://cecelove.famatchai226.workers.dev/',
  'upsell.balta_btn': 'https://balta.famatchai226.workers.dev/'
};

let fail = 0;
let warn = 0;
const pass = msg => console.log('PASS  ' + msg);
const ko = msg => { fail++; console.log('FAIL  ' + msg); };
const ww = msg => { warn++; console.log('WARN  ' + msg); };

(async () => {
  console.log('Cible : ' + BASE);

  console.log('');
  console.log('--- 1. la page repond ---');
  const page = await fetch(BASE, { redirect: 'follow' });
  const html = await page.text();
  if (page.ok) pass('index.html -> HTTP ' + page.status + ' (' + html.length + ' caracteres)');
  else ko('index.html -> HTTP ' + page.status);

  console.log('');
  console.log('--- 2. liens sortants ---');
  const href = key => {
    const m = html.match(new RegExp('<a href="([^"]+)"[\\s\\S]{0,200}?data-i18n="' + key.replace('.', '\\.') + '"'));
    return m ? m[1] : null;
  };
  for (const [key, url] of Object.entries(LANDING)) {
    const got = href(key);
    if (got === url) pass(key + ' -> ' + got);
    else ko(key + ' -> ' + got + '  (attendu : ' + url + ')');
  }
  for (const key of ['nav.cta', 'hero.cta', 'cta_section.btn', 'float_bar.btn']) {
    const got = href(key);
    if (got !== CHECKOUT) ko(key + ' -> ' + got + '  (attendu : ' + CHECKOUT + ')');
    else if (CHECKOUT_PENDING) ww(key + ' -> checkout provisoire (lien reel a fournir)');
    else pass(key + ' -> checkout');
  }

  console.log('');
  console.log('--- 3. bande-annonce : source principale (CDN) + secours ---');
  const sources = [...html.matchAll(/<source src="([^"]+)"\s+type="video\/mp4"/g)].map(m => m[1]);
  if (!sources.length) {
    if (/video-slot/.test(html)) ww('slot video actif : aucun <source> (bande-annonce pas encore livree)');
    else ko('aucune balise <source type="video/mp4"> dans index.html en ligne');
  }
  const abs = u => /^https?:/i.test(u) ? u : BASE + u.replace(/^\.\//, '');

  const checkSource = async (url, critical) => {
    const res = await fetch(url, { headers: { Range: 'bytes=0-1023' } });
    const rangeOk = res.status === 206;
    const acceptRanges = res.headers.get('accept-ranges');
    const contentRange = res.headers.get('content-range');
    const type = res.headers.get('content-type');
    const reader = res.body.getReader();
    const first = await reader.read();
    await reader.cancel().catch(() => {});
    const buf = Buffer.from((first.value || []).slice(0, 1024));
    const firstSize = buf.readUInt32BE(0);
    const atom1 = buf.toString('ascii', 4, 8);
    const atom2 = buf.toString('ascii', firstSize + 4, firstSize + 8);
    /* raw.githubusercontent.com repond application/octet-stream : le type est alors impose par
       l'attribut type="video/mp4" de la balise <source>, la lecture n'est pas affectee. */
    if (type && type.includes('video/mp4')) pass('  content-type = ' + type);
    else if (critical && type && type.includes('octet-stream'))
      pass('  content-type = ' + type + ' (type force par <source type="video/mp4">)');
    else if (critical) ko('  content-type = ' + type + ' (attendu video/mp4 ou octet-stream)');
    else ww('  content-type = ' + type + ' (attendu video/mp4)');
    if (atom2 === 'moov') pass('  atomes : ' + atom1 + ' puis ' + atom2 + ' -> faststart OK');
    else (critical ? ko : ww)('  atomes : ' + atom1 + ' puis ' + atom2 + ' -> PAS faststart');
    if (rangeOk && acceptRanges && acceptRanges.includes('bytes')) {
      pass('  Range supporte : HTTP 206' + (contentRange ? ' (' + contentRange + ')' : ''));
    } else if (critical) {
      ko('  Range NON supporte : HTTP ' + res.status + ' | accept-ranges=' + acceptRanges +
        ' | content-range=' + contentRange);
      console.log('      -> le navigateur interdit alors tout deplacement dans la video');
      console.log('         (video.seekable = [[0,0]]), meme fichier entierement telecharge :');
      console.log('         sur mobile, impossible d\'avancer ou de reculer.');
      console.log('         -> servir le mp4 depuis un host qui renvoie 206 (CDN/R2) et mettre a');
      console.log('            jour la balise <source> + trailer.src des locales/*.json.');
    } else {
      ww('  Range NON supporte (secours) : HTTP ' + res.status + ' -> ce repli ne permet pas');
      console.log('      le deplacement dans la video (utilise uniquement si le CDN est injoignable).');
    }
  };

  for (let i = 0; i < sources.length; i++) {
    const url = abs(sources[i]);
    console.log('  [' + (i === 0 ? 'source principale' : 'secours local') + '] ' + url);
    await checkSource(url, i === 0);
  }

  console.log('');
  console.log(fail || warn
    ? 'RESULT: ' + fail + ' FAIL / ' + warn + ' WARN'
    : 'RESULT: ALL CHECKS PASSED');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('ERREUR : ' + e.message); process.exit(1); });
