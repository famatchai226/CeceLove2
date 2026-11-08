# `assets/` — médias de la page CeceLove 2

Les médias sont **livrés et branchés** : 7 visuels de hero + la bande-annonce.
Le tableau ci-dessous rappelle les contraintes à respecter pour tout remplacement.

## Ce qu'il faut déposer

| Fichier | Emplacement exact | Format | Contrainte |
|---|---|---|---|
| `0.png`, `1.jpg` … `5.jpg`, `6.png` | `assets/hero caroussel/` | PNG / JPG, portrait 4:5 | 7 visuels livrés, < 400 Ko chacun |
| `trailer.mp4` | `assets/trailer.mp4` | MP4 **H.264 / AAC**, **faststart** (`moov` avant `mdat`) | 143 s, 1280 × 720, **22 Mo** (≤ 100 Mo = limite GitHub) |

> ⚠️ Le dossier s'écrit `hero caroussel` (un seul `r`, deux `s`) et l'espace est encodé
> `%20` dans `index.html` (`./assets/hero%20caroussel/0.png`) — c'est volontaire, ça reste
> valable sur tous les serveurs. Ne renommez pas le dossier.

## Comment c'est branché (déjà en place)

1. **Carrousel** — `index.html`, hero : 7 lignes `<img class="slide" ...>` actives
   (`0.png`, `1.jpg` … `5.jpg`, `6.png`). Le dégradé `.poster-fallback` ne s'affiche que si
   aucune image ne se charge.
2. **Bande-annonce** — l'URL du CDN est écrite aux **3** endroits qui doivent rester
   identiques :
   - 1er `<source src="...">` dans `index.html` ;
   - `trailer.src` dans `locales/fr.json` ;
   - `trailer.src` dans `locales/en.json`.

   Le `<source>` local `./assets/trailer.mp4` reste en **secours** (2e `<source>`).
   `i18n.js` réécrit le `src` du 1er `<source>` avec `trailer.src` : toute modification doit
   donc être faite dans les deux locales **et** dans `index.html`.
3. Contrôle : `node _tools/check-links.js` — sections « visuels » et « bande-annonce »
   entièrement en `PASS` (faststart + taille + cohérence des sources).

## Pourquoi un CDN pour la vidéo (et pas le Worker Cloudflare)

Les Workers Cloudflare **ignorent les requêtes HTTP `Range`** : ils répondent `200` au lieu
de `206`. Sans `Range`, le navigateur considère la vidéo comme non déplaçable
(`video.seekable` = `[[0, 0]]`) : sur mobile, impossible d'avancer ou de reculer, même quand
le fichier est entièrement téléchargé.

→ Le mp4 doit être servi par un hébergeur qui répond `206`. Source retenue :
`https://raw.githubusercontent.com/famatchai226/CeceLove2/main/assets/trailer.mp4`
(dépôt GitHub public `CeceLove2`, branche `main`) — vérifié : `206` + `Accept-Ranges: bytes`.
Le fichier local reste le repli.

> jsDelivr (`https://cdn.jsdelivr.net/gh/famatchai226/CeceLove2@main/assets/trailer.mp4`)
> répond aussi `206` avec un mime `video/mp4` plus propre, mais il **plafonne à 20 Mo par
> fichier** : le trailer actuel (22 Mo) y est refusé. Il redeviendrait la meilleure cible si
> le mp4 était ré-encodé sous 20 Mo.

Contrôles : `node _tools/mp4-verify.js assets/trailer.mp4` (structure) puis
`node _tools/prod-check.js` (Range réellement servi en production).

## `/!\` Contenu adulte

Les visuels et la bande-annonce sont **explicites** : ils doivent rester cohérents avec la
copy de la page (18+, paiement discret, aucune trace publique). Évitez tout élément
identifiable (visage, tatouage, décor reconnaissable) si les personnes ne sont pas
clairement documentées.
