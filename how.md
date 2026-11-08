# CeceLove 2 — Landing Page (Guide)

Landing page de vente du film **CeceLove 2** — édition **adulte (+18)**, **3 500 FCFA**
(prix barré 25 000 FCFA).

> ✅ **Médias livrés et branchés.** 7 visuels dans `assets/hero caroussel/` (carrousel
> actif) et la bande-annonce `assets/trailer.mp4` (143 s, 1280 × 720, faststart, 22 Mo)
> servie par `raw.githubusercontent.com`, avec le fichier local en secours. Les 4 boutons
> d'achat pointent sur le **checkout MyMaketou réel** de CeceLove 2.

## Structure du projet

```
cecelove2-landing-page/
├── index.html      ← Page principale (thème sombre cinéma)
├── i18n.js         ← Script multilingue (FR / EN)
├── locales/
│   ├── fr.json     ← Traductions françaises (source de vérité)
│   └── en.json     ← Traductions anglaises
├── assets/
│   ├── hero caroussel/  ← 7 visuels : 0.png, 1.jpg, 2.jpg, 3.jpg, 4.jpg, 5.jpg, 6.png
│   ├── trailer.mp4      ← bande-annonce (143 s, 1280 × 720, faststart, 22 Mo)
│   └── README.md        ← spécifications des médias
├── _tools/         ← scripts de contrôle (dev)
├── .gitignore
├── README.md
└── how.md          ← Ce fichier
```

## ✅ État de la livraison

| # | Élément | Où | État |
|---|---|---|---|
| 1 | **Lien de checkout MyMaketou** de CeceLove 2 | 4 `href` d'`index.html` (`nav.cta`, `hero.cta`, `cta_section.btn`, `float_bar.btn`) + `CHECKOUT_URL` dans `_tools/check-links.js` et `prod-check.js` | ✅ `https://baltazar.mymaketou.shop/products/meilleur-film-mature/checkout` |
| 2 | **Visuels du hero** (7 fichiers) | `assets/hero caroussel/` | ✅ `0.png`, `1.jpg` … `5.jpg`, `6.png` |
| 3 | **Bande-annonce** `trailer.mp4` | `assets/trailer.mp4` | ✅ 143 s, 1280 × 720, faststart, 22 Mo |
| 4 | **Dépôt GitHub public** qui sert le mp4 (source du CDN) | `famatchai226/CeceLove2` | ⏳ à créer puis pousser (le 1er `<source>` est déjà écrit) |

Il ne reste donc que des étapes de **déploiement** :

1. créez le dépôt public `famatchai226/CeceLove2` et poussez-y `assets/trailer.mp4` — sans lui,
   le 1er `<source>` répond 404 et le navigateur bascule sur le fichier local (plus de `Range`,
   donc plus de déplacement dans la vidéo) ;
2. déployez la page sur Cloudflare Pages (`cecelove2.famatchai226.workers.dev`) ;
3. relancez les contrôles : `check-links.js` (0 FAIL / 0 WARN attendu), `i18n-audit.js`,
   puis `prod-check.js` une fois l'URL en ligne.

## Structure de la page (dans l'ordre)

| # | Section | Clés i18n | Rôle |
|---|---|---|---|
| 1 | bandeau défilant `.marquee` | `marquee.text` | rappel « 18+ · explicite · aucune censure » |
| 2 | hero `#top` | `hero.*` | accroche, CTA, carrousel de 7 visuels |
| 3 | bandeau chiffres `.stats` | `stats.*` | HD, accès à vie, privé, 3 500 FCFA |
| 4 | bande-annonce `.trailer` | `trailer.*` | lecteur du trailer (CDN + secours local) |
| 5 | synopsis | `synopsis.*` | l'histoire + citation |
| 6 | scènes `#scenes` | `scenes.*`, `heat.*` | 6 scènes décrites + jauge d'intensité |
| 7 | offre `#offre` | `offer.*` | contenu de l'achat + prix barré 25 000 |
| 8 | comparatif | `compare.*` | tableau V1 / V2 (6 critères) |
| 9 | accès en 3 étapes `#comment-ca-marche` | `steps.*` | paiement → email → visionnage |
| 10 | avis spectateurs | `testimonials.*` | 6 témoignages |
| 11 | profils | `profiles.*` | « c'est pour qui » |
| 12 | discrétion | `discretion.*` | 6 garanties de confidentialité |
| 13 | FAQ | `faq.*` | 10 questions |
| 14 | CTA `#acheter` | `cta_section.*` | achat + compte à rebours jusqu'à minuit |
| 15 | upsell | `upsell.*` | landing pages des produits sœurs |
| 16 | footer | `footer.*` | contact + mention +18 |

> Le compte à rebours est une **horloge réelle** (minuit, heure locale du visiteur) : pas de
> faux compteur de places ni de stock inventé. Si l'offre de lancement s'arrête, retirez le
> bloc `<div class="urgency">` de la section CTA (et les clés `cta_section.urgency_*`).

## Modifier les textes
- Éditez `locales/fr.json` pour le français (fichier de référence), puis `locales/en.json`.
- Les éléments d'`index.html` portent un attribut `data-i18n="section.cle"` (texte),
  `data-i18n-html` (HTML autorisé) ou `data-i18n-video` (source vidéo).
- `node _tools/check-links.js` vérifie que **toutes** les clés utilisées existent dans les
  deux fichiers, que les deux fichiers ont exactement la même structure, et que le prix
  affiché est bien **3 500 FCFA** partout.
- `node _tools/i18n-audit.js` vérifie qu'aucune clé contenant du HTML n'est posée sur un
  élément `data-i18n` (sinon les balises s'affichent en texte brut), que les balises du
  document sont équilibrées et que les `id` sont uniques.

## Liens sortants
- **Boutons d'achat** (nav, hero, `#acheter`, float-bar) → **checkout MyMaketou de CeceLove 2** :
  ✅ `https://baltazar.mymaketou.shop/products/meilleur-film-mature/checkout` — les **4** boutons
  doivent rester identiques (`check-links.js` et `prod-check.js` échouent sinon).
- **Boutons d'upsell** (bas de page) → **landing pages** des produits sœurs (même convention
  que `kera-`, `gotelegram-` et `boutique-landing-page`) :

  | Bouton (`data-i18n`) | Destination |
  |---|---|
  | `upsell.shop_btn` — Voir la boutique complète → | `https://boutique-landing-page.famatchai226.workers.dev/` |
  | `upsell.cece_btn` — Voir le volet 1 → | `https://cecelove.famatchai226.workers.dev/` |
  | `upsell.balta_btn` — Voir l'offre Baltazar → | `https://balta.famatchai226.workers.dev/` |

  > 📌 **Règle produit : exactement 3 cartes d'upsell** — la boutique complète, CeceLove
  > (l'autre volet) et Baltazar. Les autres pages produits ne sont plus proposées ici.
  > `check-links.js` compte les cartes et échoue s'il y en a plus ou moins.

  Contrôle automatique des deux familles de liens + cohérence FR/EN :
  `node _tools/check-links.js` (doit finir par `RESULT: ALL CHECKS PASSED`).

## Médias
- **Hero** : carrousel automatique des **7 visuels** de `assets/hero caroussel/` — `0.png`,
  `1.jpg`, `2.jpg`, `3.jpg`, `4.jpg`, `5.jpg`, `6.png` (rotation toutes les 3,8 s, points de
  navigation cliquables, pause au survol). Le dégradé `.poster-fallback` ne sert plus que de
  secours si aucune image ne se charge.
- **Bande-annonce** : `assets/trailer.mp4` — 143 s, 1280 × 720, H.264 / AAC, **faststart**
  (`moov` avant `mdat`, obtenu avec `_tools/mp4-faststart.js`), **22 Mo**. Deux `<source>` :
  1. `https://raw.githubusercontent.com/famatchai226/CeceLove2/main/assets/trailer.mp4`
     → `206` + `Accept-Ranges: bytes` : le déplacement dans la vidéo fonctionne sur mobile ;
  2. `./assets/trailer.mp4` en secours (le Worker Cloudflare, lui, ignore `Range`).
  `trailer.src` des deux locales doit rester **égal au 1er `<source>`** : `i18n.js` réécrit
  le `src` de la première balise `<source>` du `<video>`.
- Détails, formats conseillés et emplacements : `assets/README.md`.

### Ajouter / retirer un visuel du carrousel
Dans `index.html`, section hero, bloc `<div class="poster carousel" id="heroCarousel">` :
dupliquez une ligne `<img class="slide" src="./assets/hero%20caroussel/N.png" ... />`
en incrémentant `N` (gardez l'extension réelle du fichier, `.png` ou `.jpg`). Les points de
navigation sont générés automatiquement par le script, dans l'ordre des `<img>`.
Pour retirer un visuel : supprimez simplement sa ligne `<img>`.

> ⚠️ Le dossier s'écrit `hero caroussel` (un seul `r`, deux `s`) et l'espace est encodé `%20`
> dans les URL (`hero%20caroussel`) pour rester valable sur tous les serveurs.

## Tester en local
Un serveur est nécessaire pour que `fetch` des `locales/*.json` fonctionne :

```powershell
cd "c:\Users\hp\Antigravity& Stitch\cecelove2-landing-page"
python -m http.server 8081
# puis ouvrez http://localhost:8081
```

Sans Python, un petit serveur équivalent est fourni (avec support `Range`) :

```powershell
node _tools/serve.js            # http://localhost:8081
node _tools/serve.js --check    # test de fumée : page + locales + i18n.js
```

## Déploiement (GitHub + Cloudflare Pages)

1. Ouvrez votre terminal dans le dossier :
   `c:\Users\hp\Antigravity& Stitch\cecelove2-landing-page`
2. **Préparer les fichiers** : `git add .`
3. **Enregistrer les changements** : `git commit -m "Landing page CeceLove 2 (edition adulte)"`
4. **Envoyer sur GitHub** : `git push origin main`

*Le déploiement sur Cloudflare Pages se lancera automatiquement après le push.*

## Notes
- La page inclut une **barrière 18+** (age gate) bilingue ; la copy insiste sur le caractère
  explicite du contenu et sur la confidentialité (paiement neutre, pseudonyme accepté).
- Métadonnées : `robots` = `noindex, nofollow, noimageindex` et `rating` = `adult`.
- Le contenu est 100% statique : aucun build nécessaire.
