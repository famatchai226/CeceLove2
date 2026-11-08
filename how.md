# CeceLove 2 — Landing Page (Guide)

Landing page de vente du film **CeceLove 2** — édition **adulte (+18)**, **3 500 FCFA**
(prix barré 25 000 FCFA).

> ⚠️ **État actuel : aucun média livré.** Le carrousel du hero et la bande-annonce
> n'affichent que des **slots vides** propres (dégradé de secours + bloc
> « Bande-annonce — à venir »). Rien n'est cassé, rien ne renvoie de 404 : les `<img>`
> et le `<video>` sont volontairement **commentés** dans `index.html` en attendant les
> fichiers. Voir la checklist ci-dessous.

## Structure du projet

```
cecelove2-landing-page/
├── index.html      ← Page principale (thème sombre cinéma)
├── i18n.js         ← Script multilingue (FR / EN)
├── locales/
│   ├── fr.json     ← Traductions françaises (source de vérité)
│   └── en.json     ← Traductions anglaises
├── assets/
│   ├── hero caroussel/  ← VIDE : 0.png … 7.png à déposer
│   └── (trailer.mp4)    ← à déposer
├── _tools/         ← scripts de contrôle (dev)
├── .gitignore
├── README.md
└── how.md          ← Ce fichier
```

## ✅ À faire avant la mise en ligne

| # | Élément | Où | État |
|---|---|---|---|
| 1 | **Lien de checkout MyMaketou** de CeceLove 2 | 4 `href` d'`index.html` (`nav.cta`, `hero.cta`, `cta_section.btn`, `float_bar.btn`) + `CHECKOUT_URL` dans `_tools/check-links.js` et `prod-check.js` | ⏳ provisoire (`.../products/cecelove-2-a-definir/checkout`) |
| 2 | **8 visuels du hero** (`0.png` … `7.png`) | `assets/hero caroussel/` | ⏳ emplacement vide |
| 3 | **Bande-annonce** `trailer.mp4` (H.264, faststart) | `assets/trailer.mp4` | ⏳ emplacement vide |
| 4 | **Nom du dépôt GitHub** (pour le CDN jsDelivr) | `CeceLove2` (cible CDN déjà écrite dans les commentaires) | ⏳ à confirmer |

Une fois les fichiers reçus :

1. déposez-les dans `assets/` ;
2. décommentez le bloc `<img>` du carrousel (`<!-- SLOT VISUELS (1 à 8)`) et le bloc
   `<video>` (`<!-- SLOT BANDE-ANNONCE`) dans `index.html` ;
3. mettez l'URL CDN dans les **3** endroits qui doivent rester identiques :
   `<source>` d'`index.html`, `trailer.src` de `locales/fr.json` et `locales/en.json` ;
4. relancez `node _tools/check-links.js` — il doit passer de 6 WARN à 0 WARN.

## Structure de la page (dans l'ordre)

| # | Section | Clés i18n | Rôle |
|---|---|---|---|
| 1 | bandeau défilant `.marquee` | `marquee.text` | rappel « 18+ · explicite · aucune censure » |
| 2 | hero `#top` | `hero.*` | accroche, CTA, carrousel de visuels (slot vide) |
| 3 | bandeau chiffres `.stats` | `stats.*` | HD, accès à vie, privé, 3 500 FCFA |
| 4 | bande-annonce `.trailer` | `trailer.*` | lecteur (slot tant que le mp4 manque) |
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
- **Boutons d'achat** (nav, hero, `#acheter`, float-bar) → **checkout MyMaketou de CeceLove 2**.
  ⏳ Placeholder actuel, à remplacer sur les **4** boutons simultanément (ils doivent rester
  identiques). Un rappel `<!-- TODO-CHECKOUT -->` est déjà présent dans le nav.
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
- **Hero** : carrousel automatique des 8 visuels `assets/hero caroussel/0.png` … `7.png`
  (rotation toutes les 3,8 s, points de navigation cliquables, pause au survol).
  Tant que les images manquent, le dégradé `.poster-fallback` s'affiche et les points
  de navigation se masquent automatiquement (`slides.length < 2`).
- **Bande-annonce** : `assets/trailer.mp4` (MP4 / H.264, faststart), utilisée en FR **et** en EN.
  Tant qu'elle manque, le bloc `.video-slot` (« Bande-annonce — à venir ») la remplace et
  `trailer.src` reste **vide** dans les deux locales (sinon `i18n.js` pointerait le
  `<video>` vers la page elle-même).
- Détails, formats conseillés et emplacements : `assets/README.md`.

### Ajouter / retirer un visuel du carrousel
Dans `index.html`, section hero, bloc `<div class="poster carousel" id="heroCarousel">` :
dupliquez une ligne `<img class="slide" src="./assets/hero%20caroussel/N.png" ... />`
en incrémentant `N`. Les points de navigation sont générés automatiquement par le script.

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
