# `_tools` — scripts de vérification (dev)

Outils maison pour valider la page **CeceLove 2**. Aucun n'est nécessaire au fonctionnement
du site : ils servent à contrôler les liens, les textes et le comportement du lecteur vidéo
avant mise en ligne.

> Les commandes ci-dessous se lancent **depuis le dossier `cecelove2-landing-page`** :
> `cd "c:\Users\hp\Antigravity& Stitch\cecelove2-landing-page"`

## Résultats attendus aujourd'hui (page livrée sans média)

| Script | Résultat attendu |
|---|---|
| `serve.js --check` | `RESULT: page et fichiers critiques OK` |
| `check-links.js` | `RESULT: ALL CHECKS PASSED (6 WARN — éléments en attente)` |
| `i18n-audit.js` | `RESULT: ALL CHECKS PASSED` |
| `prod-check.js` | page `200` ; 4 WARN « checkout provisoire » ; 1 WARN « slot vidéo » |
| `seek-test-cecelove2.js` | `assets/trailer.mp4 absent : slot video actif` (code 0, rien à tester) |
| `mobile-seek-live.js` | signale « bande-annonce absente (HTTP 404) » tant que le mp4 n'est pas livré |

Les WARN disparaissent d'eux-mêmes dès que le checkout réel + les médias sont en place.

## 1. `serve.js` — prévisualisation locale (et test de fumée)
Serveur statique minimal (support `Range`) : indispensable car les textes sont chargés par
`fetch('./locales/fr.json')`, ce qui échoue en `file://`.

```powershell
node _tools/serve.js            # http://localhost:8081
node _tools/serve.js 3000       # autre port
node _tools/serve.js --check    # démarre, teste /, index.html, i18n.js, locales/*.json, s'arrête
```

## 2. `check-links.js` — liens, prix, clés i18n, médias
Liste tous les CTA externes d'`index.html` (clé i18n → URL) et vérifie :
- les **boutons d'upsell** → landing pages des produits sœurs — **3 cartes exactement** :
  la boutique complète (`boutique-landing-page.famatchai226.workers.dev`), CeceLove 1
  (`cecelove.famatchai226.workers.dev`) et Baltazar (`balta.famatchai226.workers.dev`) —
  croisées avec la source de vérité `../boutique-landing-page/how.md` ;
- les **4 boutons d'achat** → checkout MyMaketou (`CHECKOUT_PENDING = true` : WARN, pas FAIL,
  tant que le lien réel de CeceLove 2 n'est pas fourni) + présence du rappel `TODO-CHECKOUT` ;
- le **prix** : `3 500 FCFA` (EN : `3,500 FCFA`) dans `nav.cta`, `hero.cta`,
  `cta_section.btn`, `float_bar.text` ; `25 000 FCFA` conservé comme prix barré ;
  aucun reste de l'ancien tarif ;
- la **couverture i18n** : chaque `data-i18n*` d'`index.html` existe dans `fr.json` **et**
  `en.json`, et les deux fichiers ont exactement la même structure (parité des clés) ;
- les **médias** : visuels réellement référencés présents (les blocs commentés ne comptent
  pas) ou WARN « slot en attente » ; si `assets/trailer.mp4` existe, contrôle faststart +
  taille < 20 Mo + `trailer.src` identique dans les deux locales ; sinon vérifie que
  `trailer.src` reste vide et que le placeholder `.video-slot` est affiché.

```powershell
node _tools/check-links.js      # code 1 s'il reste au moins un FAIL
```

## 3. `prod-check.js` — contrôle de la page EN LIGNE
Interroge l'URL déployée (par défaut `https://cecelove2.famatchai226.workers.dev/`) et vérifie :
1. la page répond `200` ;
2. les 7 CTA de la version en ligne pointent sur les bonnes cibles
   (upsell → landing pages sœurs, achat → checkout ; WARN si `CHECKOUT_PENDING`) ;
3. chaque balise `<source>` de la bande-annonce (CDN principal + secours local) est testée :
   type MIME, **faststart**, et support des requêtes **`Range`** (`206` + `Accept-Ranges: bytes`),
   condition indispensable pour se déplacer dans la vidéo pendant la lecture. Tant que le
   bloc vidéo est un simple slot, la section sort en WARN (pas en FAIL).

```powershell
node _tools/prod-check.js
node _tools/prod-check.js https://autre-domaine.example/
```

## 4. `mobile-seek-live.js` — seek réel sur la page EN LIGNE (mobile émulé)
Chrome headless avec viewport + User-Agent Pixel 7 (390 × 844, tactile), fermeture de l'age
gate au doigt, vidéo ramenée dans le viewport (Chrome **ne bufferise pas** un média hors
écran) puis lecture silencieuse. Trois états mesurés : page telle que livrée, `preload="auto"`
+ `load()`, et `--alt=<url>` (même vidéo servie par un autre hébergeur).

```powershell
node _tools/mobile-seek-live.js
node _tools/mobile-seek-live.js --url=https://cecelove2.famatchai226.workers.dev/
node _tools/mobile-seek-live.js --alt=https://cdn.jsdelivr.net/gh/famatchai226/CeceLove2@main/assets/trailer.mp4
```

> 📌 Mesure historique (autre page, avant correctif) : `seekable = [[0, 0]]` et tous les
> seeks retombaient à 0,11 s, même avec `buffered = [[0, 98.84]]` → `preload="auto"` ne
> répare rien : seul un hébergeur qui répond `206` débloque le seek. C'est pourquoi le mp4
> devra être servi par le CDN jsDelivr et non par le Worker Cloudflare (cf. `assets/README.md`).

## 5. `seek-test-cecelove2.js` — test navigateur réel (bout en bout)
Monte un serveur statique local (avec support `Range` et **débit limité**), pilote Chrome
headless via le DevTools Protocol, ouvre la vraie page `index.html` et : ferme l'age gate,
teste 5 seeks en pause + 1 seek pendant la lecture, vérifie via `elementFromPoint` que rien
ne recouvre le lecteur, clique **réellement** sur la barre de progression, puis mesure les
octets servis. Si `assets/trailer.mp4` est absent, le script s'arrête proprement (code 0).

```powershell
node _tools/seek-test-cecelove2.js                  # 1200 Ko/s par défaut
node _tools/seek-test-cecelove2.js --throttle=600   # réseau plus lent
node _tools/seek-test-cecelove2.js "C:\chemin\chrome.exe"
```

`seek-probe.js` et `scrub-probe.js` sont les scripts injectés dans la page
(`Runtime.evaluate`) ; ils ne s'exécutent pas seuls.

## 6. `mp4-faststart.js` — rendre une vidéo lisible en streaming
Déplace l'atome `moov` **avant** `mdat` (l'équivalent de `ffmpeg -movflags +faststart`,
implémenté en Node : pas besoin de ffmpeg) et corrige toutes les tables d'offsets
(`stco` / `co64`) du décalage correspondant.

```powershell
node _tools/mp4-faststart.js assets/trailer-brute.mp4 assets/trailer.mp4
```

> ⚠️ Un MP4 avec `moov` à la fin ne peut pas être « scrubé » proprement : Safari/iOS doit
> télécharger **tout** le fichier avant de pouvoir se déplacer dans la timeline.

## 7. `mp4-verify.js` — contrôle structurel
Vérifie l'ordre des atomes (faststart) et, pour chaque piste : nombre de chunks, offsets
strictement croissants, plage d'octets de chaque chunk à l'intérieur du `mdat`, cohérence
`stsc` + `stsz` + `stco`, durée.

```powershell
node _tools/mp4-verify.js assets/trailer.mp4
```

Code de sortie `0` = tout est vert.

## 8. `i18n-audit.js` — garde-fou HTML / i18n
`i18n.js` injecte les textes `data-i18n` via **`textContent`** : une valeur contenant
`<strong>` ou `<br />` s'afficherait donc en texte brut dès qu'on change de langue.
Ce script attrape le piège avant la mise en ligne, et contrôle la structure du document :

1. **clés avec du HTML** utilisées sur un élément `data-i18n` (à passer en `data-i18n-html`) ;
2. **équilibre des balises** de structure (`div`, `section`, `article`, `table`, `p`, `span`…) ;
3. **unicité des `id`** (les `getElementById` du script en dépendent) ;
4. **présence des id attendus** (`heroCarousel`, `cdH/cdM/cdS` du compte à rebours, age gate…).

```powershell
node _tools/i18n-audit.js      # code 1 si un problème est détecté
```

> À lancer après **toute** édition de `locales/*.json` ou de `index.html`.

