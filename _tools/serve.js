/* Petit serveur statique pour prévisualiser la page en local (les textes sont chargés par
   fetch des locales/*.json : ouvrir index.html en file:// ne suffit pas).

   Usage:
     node _tools/serve.js                    -> http://localhost:8081
     node _tools/serve.js 3000               -> autre port
     node _tools/serve.js --check            -> démarre, teste les fichiers critiques, s'arrête

   `--check` sort en code 1 si la page ou un fichier indispensable ne répond pas 200
   (utile en pré-déploiement : aucun média n'est requis, la page doit rester servie). */
const http = require('http');
const fs = require('fs');
const path = require('path');

const SLUG = 'cecelove2-landing-page';
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

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.woff2': 'font/woff2'
};

const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const PORT = parseInt(args.find(a => /^\d+$/.test(a)) || '8081', 10);

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('404 ' + urlPath);
  }
  const st = fs.statSync(file);
  const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
  /* Range supporté : indispensable pour tester la bande-annonce quand elle arrivera */
  const range = req.headers.range;
  let start = 0, end = st.size - 1, status = 200;
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    start = m && m[1] ? parseInt(m[1], 10) : 0;
    end = m && m[2] ? parseInt(m[2], 10) : st.size - 1;
    if (end >= st.size) end = st.size - 1;
    status = 206;
  }
  const headers = {
    'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1
  };
  if (status === 206) headers['Content-Range'] = 'bytes ' + start + '-' + end + '/' + st.size;
  res.writeHead(status, headers);
  fs.createReadStream(file, { start, end }).pipe(res);
});

const CRITICAL = ['/', '/index.html', '/i18n.js', '/locales/fr.json', '/locales/en.json'];

server.listen(PORT, '127.0.0.1', async () => {
  const base = 'http://127.0.0.1:' + PORT;
  console.log('root : ' + ROOT);
  console.log('url  : ' + base);
  if (!CHECK) {
    console.log('Ctrl+C pour arreter.');
    return;
  }
  let bad = 0;
  for (const p of CRITICAL) {
    const res = await fetch(base + p);
    const ok = res.ok;
    if (!ok) bad++;
    console.log((ok ? 'PASS  ' : 'FAIL  ') + p + ' -> HTTP ' + res.status
      + ' (' + (await res.text()).length + ' octets)');
  }
  process.exitCode = bad ? 1 : 0;
  console.log(bad ? 'RESULT: ' + bad + ' PROBLEME(S)' : 'RESULT: page et fichiers critiques OK');
  /* pas de process.exit() ici : laisser libuv fermer proprement le serveur et les sockets */
  if (server.closeAllConnections) server.closeAllConnections();
  server.close();
});
