# `assets/` — emplacements médias (V1 : volontairement vides)

La page **CeceLove 2** a été livrée **sans aucun média** : les emplacements existent,
les fichiers non. La page s'affiche correctement dans cet état (dégradé de secours +
bloc « Bande-annonce — à venir »), aucun 404 n'est généré.

## Ce qu'il faut déposer

| Fichier | Emplacement exact | Format conseillé | Contrainte |
|---|---|---|---|
| `0.png` … `7.png` | `assets/hero caroussel/` | PNG (ou JPG), **1200 × 1500 px**, portrait 4:5 | 8 visuels, poids < 400 Ko chacun |
| `trailer.mp4` | `assets/trailer.mp4` | MP4 **H.264 / AAC**, **faststart** (`moov` avant `mdat`) | < 20 Mo (limite CDN jsDelivr), 10–30 s |

> ⚠️ Le dossier s'écrit `hero caroussel` (un seul `r`, deux `s`) et l'espace est encodé
> `%20` dans `index.html` (`./assets/hero%20caroussel/0.png`) — c'est volontaire, ça reste
> valable sur tous les serveurs. Ne renommez pas le dossier.

## Activer les emplacements après dépôt

1. **Carrousel** — dans `index.html`, section hero, cherchez le bloc commenté
   `<!-- SLOT VISUELS (1 à 8)` et retirez les marqueurs `<!--` / `-->` autour des
   8 lignes `<img class="slide" ...>`. Le dégradé de secours disparaît automatiquement dès
   qu'une image se charge.
2. **Bande-annonce** — cherchez `<!-- SLOT BANDE-ANNONCE`, décommentez le bloc
   `<div class="video-wrap"> … </div>` puis supprimez le bloc `.video-slot`, et mettez
   **la même URL CDN** aux 3 endroits :
   - `<source src="...">` (1er, CDN) et `poster` dans `index.html` ;
   - `trailer.src` dans `locales/fr.json` ;
   - `trailer.src` dans `locales/en.json`.

   Le `<source>` local `./assets/trailer.mp4` reste en **secours** (2e `<source>`).
3. Relancez `node _tools/check-links.js` : la section « bande-annonce » doit passer de
   `WARN` à `PASS` (faststart + taille vérifiés) et la section « visuels » ne doit plus
   signaler d'absence.

## Pourquoi un CDN pour la vidéo (et pas le Worker Cloudflare)

Les Workers Cloudflare **ignorent les requêtes HTTP `Range`** : ils répondent `200` au lieu
de `206`. Sans `Range`, le navigateur considère la vidéo comme non déplaçable
(`video.seekable` = `[[0, 0]]`) : sur mobile, impossible d'avancer ou de reculer, même quand
le fichier est entièrement téléchargé.

→ Le mp4 doit être servi par un hébergeur qui répond `206`. Cible retenue :
`https://cdn.jsdelivr.net/gh/famatchai226/CeceLove2@main/assets/trailer.mp4`
(dépôt GitHub public `CeceLove2`, tag/branche `main`). Le fichier local reste le repli.

Contrôles : `node _tools/mp4-verify.js assets/trailer.mp4` (structure) puis
`node _tools/prod-check.js` (Range réellement servi en production).

## `/!\` Contenu adulte

Les visuels et la bande-annonce sont **explicites** : ils doivent rester cohérents avec la
copy de la page (18+, paiement discret, aucune trace publique). Évitez tout élément
identifiable (visage, tatouage, décor reconnaissable) si les personnes ne sont pas
clairement documentées.
