# Brainstorm Project First draft

Projet «Librarian AI Desktop» — Document de cadrage initial

## 1) Pitch & Vision

**Une application desktop (Mac/Windows) qui indexe *tout* ce que contient ton ordinateur — photos, vidéos, documents, code, audio —, en extrait des métadonnées, tags visuels, résumés, embeddings, et te permet de *converser* avec ton contenu via une IA.**
Exemples : “Trouve-moi les photos avec du rouge, plutôt des paysages”, “Montre les factures 2023 > 500 \$”, “Résume ce dossier client et liste les TODO”, “Tous les fichiers où j’évoque *contrat X*”.

---

## 2) Objectifs & non‑objectifs

### Objectifs (V1 → V2)

* **Index global** : explorer des répertoires choisis, lire métadonnées, textes, images, audio.
* **Base locale** : stocker *chemin*, *type*, *hash*, *métadonnées*, *extraits textuels*, *embeddings*.
* **Recherche naturelle** : par mots-clés + recherche sémantique (vectorielle).
* **Chat IA** : poser des questions et obtenir des réponses avec références aux fichiers.
* **Tagging visuel** (IA) : “rouge”, “paysage”, “animal”, “vélo”, etc.
* **Résumé documents** (IA) : PDF, DOCX, TXT, Markdown, etc.
* **Respect de la vie privée** : tout local par défaut, envoi à une API IA *opt‑in*.
* **UX simple** : une *vue Recherche*, une *vue Chat*, une *vue Indexation*.

### Non‑objectifs (V1)

* Pas de synchronisation multi‑devices.
* Pas d’édition avancée (retouche photo, édition PDF complexe).
* Pas d’intégration OS profonde (Finder/Explorer extensions) au début.

---

## 3) Personae & cas d’usage

* **Créatif·ve/Photographe** : retrouver des images par couleur/objet/période.
* **Consultant·e/Dev** : retrouver specs, tickets, docs de projet par concept.
* **Parent** : *“Toutes les photos de Léo avec un vélo au coucher de soleil”.*

---

## 4) UX/UI — parcours clés

### Écrans

1. **Accueil / Indexation**

   * Bouton “+ Ajouter un dossier à indexer”
   * Progrès des jobs (fichiers traités, erreurs)
   * Paramètres d’IA (local / cloud, modèles)
2. **Recherche**

   * Barre de recherche naturelle (NLP), filtres rapides (type, date, taille, tags)
   * Résultats en grille (images) ou liste (docs) avec *highlights*
   * Panneau de prévisualisation (métadonnées, extrait, chemin, actions)
3. **Chat**

   * Thread de conversation
   * Réponses avec citations vers fichiers pertinents
   * Boutons “Ouvrir”, “Afficher dans le Finder/Explorer”
4. **Détail fichier**

   * Métadonnées, tags, résumé, versions, historique d’accès

### Principes UX

* **Toujours explicable** : montrer *pourquoi* un résultat est retourné.
* **Actions rapides** : “Ouvrir/Montrer le dossier/Copier le chemin”.
* **Sécurité claire** : badge “Local Only” / “Cloud IA activée”.

---

## 5) Fonctionnalités — matrice MVP → V2

| Domaine      | MVP (V1.0)                                 | V1.1                                 | V2                                                   |
| ------------ | ------------------------------------------ | ------------------------------------ | ---------------------------------------------------- |
| Indexation   | Scan dossiers choisis, watchers temps réel | Reprise sur crash, throttling        | Programmation/quotas par dossier                     |
| Parsers      | TXT/MD/PDF/DOCX, EXIF images               | XLSX/CSV/JSON, PPTX                  | Code (langages), audio (transcription locale ou API) |
| Vision       | Tags simples (couleur/objets courants)     | Détection scènes/personnes\*         | Reconnaissance visages **opt‑in**                    |
| Embeddings   | Texte via API ou local                     | Images via CLIP/vision               | Audio/vidéo                                          |
| Recherche    | Mot-clé + vectorielle                      | Filtres avancés (facettes)           | Requêtes combinées “type\:pdf AND sémantique”        |
| Chat IA      | Q/R avec citations                         | Actions (créer résumé, générer TODO) | Chaînes d’outils (workflows)                         |
| Sécurité     | Local par défaut                           | Chiffrement base optionnel           | Profils & RBAC                                       |
| Mises à jour | Auto‑update                                | Canaux bêta/stable                   | Diff incrémentielle                                  |

\* éviter la biométrie par défaut, mentionner les implications.

---

## 6) Architecture technique (Electron + TypeScript **recommandé**)

### Rationale stack (court)

* **Electron** : multi‑plateforme éprouvée, écosystème immense, accès Node.
* **TypeScript** : robustesse, maintenabilité, évolution long terme.
* **UI** : léger mais structuré. Deux voies viables :

  * **Svelte + Tailwind** (léger, simple à prendre en main, très fluide), ou
  * **React + Tailwind** (écosystème maximal).
    → **Reco par défaut** : *Svelte + Tailwind* pour l’UI (plus léger que React), tout en gardant TypeScript pour la sûreté.
* **DB** : **SQLite** (fichier local), ORM **Drizzle** (TS), extension vectorielle (**sqlite‑vec** / **sqlite‑vss**) pour la recherche sémantique.
  Alternative : **Qdrant** local ou **FAISS**, mais SQLite simplifie le déploiement.
* **Queue** : **BullMQ** (Redis) si besoin intensif… ou **p‑queue** (sans Redis) pour rester simple au début.
* **Parsers** : `pdf-parse`/`pdfjs`, `mammoth` (docx), `xlsx`, `exifr`, `sharp`.
* **Embeddings/IA** :

  * Cloud (OpenAI/Cohere/Anthropic/Voyage) pour démarrer,
  * Option **local** : sentence‑transformers via ONNX/wasm (plus lourd, mais privé).
* **Vision** : tags couleur/objet avec API vision (rapide) ou modèle local (CLIP/ONNX) plus tard.

### Schéma (logique)

* **Processus principal (Electron Main)**

  * Démarre l’app, gère fenêtres, auto‑update, menu, *secure IPC*.
  * Démarre **Scanner** (worker) et **Indexer** (worker).
* **Preload**

  * Pont sécurisé `ipcRenderer` ↔ `ipcMain` (API whitelisting).
* **Renderer (UI)**

  * Vues Svelte (Indexation, Recherche, Chat).
* **Services Node**

  * **Scanner** (walk dossiers, watch changes)
  * **Parsers** (extractions MIME‑spécifiques)
  * **Embedding** (texte, image)
  * **DB** (SQLite + vecteurs)
  * **AI Connector** (OpenAI/Anthropic abstrait)
  * **Search Engine** (BM25 + vecteurs + filtres)

### Flux d’indexation

1. **Découverte** : parcours initial + watchers (chokidar).
2. **Dédup** : hash (xxhash/blake3) → éviter re‑parse.
3. **Parsing** : texte/EXIF/métadonnées.
4. **Chunking** : découpage smart (PDF, DOCX).
5. **Embeddings** : stockage vecteurs.
6. **Commit** : transaction SQLite.
7. **Audit** : logs + erreurs réessayables.

---

## 7) Modèle de données (ébauche)

**tables**

* `files(id, path, dir, name, ext, size, mtime, ctime, hash, mime, kind, status)`
* `file_meta(file_id, key, value)`  (EXIF, custom tags)
* `file_text(file_id, chunk_id, text, token_count)`
* `file_vectors(file_id, chunk_id, embedding VECTOR)`
* `tags(file_id, tag, source, confidence)`
* `jobs(id, type, status, started_at, finished_at, error)`

**index**

* B‑Tree : `path`, `mtime`, `mime`, `tag`
* Vectoriel : `file_vectors.embedding` (cosine)

---

## 8) Sécurité, vie privée, conformité

* **Local first** : *aucun* contenu n’est envoyé par défaut.
* **Opt‑in clair** pour IA cloud, *data minimization* (envoi de *snippets* plutôt que fichiers entiers).
* **IPC sécurisé** : `contextIsolation: true`, `nodeIntegration: false` côté renderer, API whitelisting en preload.
* **Secrets** : stockés via keystore OS (Keychain macOS / DPAPI Windows).
* **Chiffrement (option)** : SQLite chiffré (SQLCipher) si besoin.
* **Biométrie** : reconnaissance visage *désactivée* par défaut; consentement explicite, information utilisateur.
* **Logs** : *redaction* des chemins sensibles sur demande.

---

## 9) Plateformes & packaging

* **Windows** : `.exe` via `electron-builder` (NSIS), auto‑update (nsis-web). Signature de code recommandée.
* **macOS** : `.app` + `.dmg`, signature + **notarisation** Apple pour éviter Gatekeeper.
* **Portable** (option) : build “portable” Windows; moins conseillé si DB locale lourde.
* **Mises à jour** : provider GitHub Releases/S3, delta updates.

---

## 10) Observabilité & perf

* **Logs** : `electron-log` + fichiers par service.
* **Metrics** : basiques en local (durée parse/embedding, queue depth).
* **Perf** : workers multi‑process, chunking, back‑pressure, throttling IO, exclusion dossiers système, *ignore globs*.
* **Cache** : thumbnails (sharp), embeddings (hash contenu).

---

## 11) Tests & qualité

* **Unit** : Vitest/Jest (services parsing, DB).
* **Intégration** : tests sur DB, embeddings simulés.
* **E2E** : Playwright (parcours UI).
* **Packaging smoke** : lancer l’app packagée dans CI.
* **Lint/format** : ESLint + Prettier.
* **Typed** : strict TS.

---

## 12) Alternatives de stack (panorama + verdict)

* **Electron + TypeScript + Svelte + Tailwind** ✅ **(Reco)**
  Léger côté UI, robuste, très bon compromis long terme.
* **Electron + TypeScript + React + Tailwind**
  Écosystème massif, un peu plus lourd. Bon si tu veux maximiser les libs UI.
* **Electron + Vanilla TS (+ jQuery au besoin)**
  Ultra léger au début, risque d’architecture spaghetti si l’UI grossit.
* **Tauri (Rust) + Svelte/React**
  Bundles minuscules, perf top, mais Rust côté backend (nouvelle stack). Option V2.

**Choix recommandé** : *Electron + TypeScript + Svelte + Tailwind + SQLite(+sqlite‑vec).*
Raisons : productivité, maintenance, recherche vectorielle locale simple, bundle raisonnable, UI fluide.

---

## 13) Plan de livraison (roadmap courte)

**Semaine 1–2 (MVP tech)**

* Squelette Electron (main/preload/renderer), TS, Vite.
* DB SQLite + Drizzle, tables de base.
* Scanner dossiers (walk + hash + watcher).
* Parsers TXT/MD/PDF/DOCX (extraits texte).
* Embeddings texte via API (clé .env, toggle local/offline).
* Recherche (mot‑clé + vecteur) + vue Résultats.

**Semaine 3–4 (UX & IA)**

* Vue Chat avec citations, actions “ouvrir/montrer”.
* Tagging visuel simple (API vision) + EXIF.
* Résumés documents (API).
* Paramètres (opt‑in cloud, quotas, dossiers exclus).
* Build `.exe`/`.dmg`, auto‑update basique.

**Semaine 5+ (hardening)**

* Robustesse indexation (reprise, throttling).
* Filtres avancés, facettes.
* Option embeddings locaux (ONNX) + vision locale.
* Chiffrement base (option).
* Tests E2E & canaux bêta.

---

## 14) Arborescence repo (proposée)

```
/app
  /main        # process principal (TS)
  /preload     # pont IPC sécurisé
  /renderer    # UI Svelte + Tailwind
  /services    # scanner, parsers, embeddings, db, search
  /workers     # worker_threads/child_procs intensifs
  /schemas     # Drizzle/SQL, migrations
  /config      # .env templates, defaults
  /assets      # icônes, logos
/tests
/scripts
```

---

## 15) Scripts NPM (exemple)

* `dev`: lancer Electron + Vite en dev
* `build`: build UI + pack Electron
* `lint`, `typecheck`, `test`, `e2e`
* `pack:win`, `pack:mac`, `release`

---

## 16) Exemples de snippets (ultra‑minimum)

### `main.ts` (création fenêtre + IPC minimal)

```ts
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';

let win: BrowserWindow;

async function createWindow() {
  win = new BrowserWindow({
    width: 1200, height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });
  await win.loadURL(process.env.VITE_DEV_SERVER_URL ?? `file://${path.join(__dirname, '../renderer/index.html')}`);
}

app.whenReady().then(createWindow);

// Exposition d’une API sécurisée côté main
ipcMain.handle('fs:listDir', async (_evt, dir: string) => {
  return await fs.readdir(dir, { withFileTypes: true }).then(entries =>
    entries.map(e => ({ name: e.name, dir: e.isDirectory() }))
  );
});
```

### `preload/index.ts` (pont sécurisé)

```ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  listDir: (dir: string) => ipcRenderer.invoke('fs:listDir', dir)
});
```

### `renderer/App.svelte` (appel API)

```svelte
<script lang="ts">
  let path = '';
  let items: Array<{name:string, dir:boolean}> = [];
  async function browse() {
    items = await (window as any).api.listDir(path);
  }
</script>

<input bind:value={path} placeholder="Chemin..." />
<button on:click={browse}>Lister</button>

<ul>
  {#each items as it}
    <li>{it.dir ? '📁' : '📄'} {it.name}</li>
  {/each}
</ul>
```

---

## 17) Choix IA & embeddings

* **Démarrage rapide** : Embeddings texte via API (OpenAI/Cohere/Voyage).

  * *Pro* : qualité, zéro infra. *Con* : coût, confidentialité (opt‑in).
* **Mode privé** : Embeddings locaux ONNX (ex. MiniLM).

  * *Pro* : données locales. *Con* : taille modèle, CPU/GPU requis, perf.

**Abstraction unique** : interface `EmbeddingProvider` avec drivers (cloud/local).

---

## 18) Gestion des images & médias

* **EXIF** : `exifr` (date, GPS, appareil).
* **Thumbnails** : `sharp` (cache).
* **Vision** : classes génériques (couleur dominante, scènes/objets fréquents).
* **Audio** : plus tard : transcription (local Whisper/ONNX ou API).

---

## 19) Stratégies de scan

* **Initial** : BFS limité (prioriser types “riches”).
* **Incrémental** : watchers + queue.
* **Évitement** : `.git`, `node_modules`, caches système.
* **Politesse** : limiter IO/CPU, pause/reprendre.

---

## 20) CI/CD & GitHub

* **Ne commite pas** les `.exe`/`.app`/artifacts ; publie en **Releases** via CI.
* **GitHub Actions** :

  * Lint + typecheck + tests
  * Build multi‑plateforme
  * Release draft avec notes changelog (Conventional Commits).
* **.gitignore** : `dist/`, `out/`, `node_modules/`, `*.log`, `*.sqlite`.

---

## 21) Paramétrage build (electron‑builder : aperçu)

* AppId, nom produit, icônes.
* **mac** : `hardenedRuntime`, `entitlements`, notarisation.
* **win** : NSIS, oneClick on/off, install dir par défaut (`Program Files`).
* Auto‑update : provider GitHub/S3.

---

## 22) Points d’attention & risques

* **Volume** : millions de fichiers → penser à la pagination, au *lazy embedding*.
* **Coût IA** : prévoir quotas, batchs, caches.
* **Confidentialité** : UX d’opt‑in claire, journaliser ce qui part au cloud.
* **Perf Windows HDD** : throttling, exclusions.
* **PDF complexes** : extraction fragile → fallback OCR (plus tard).

---

## 23) Plan « première ligne de code » (pas à pas)

1. **Pré‑requis** : Node ≥ 20, VS Code.
2. `mkdir librarian-ai && cd librarian-ai`
3. `npm init -y`
4. Ajouter TS, Vite, Svelte : `npm i -D typescript vite svelte @sveltejs/vite-plugin-svelte`
5. Electron : `npm i -D electron electron-builder concurrently cross-env`
6. Config TS (`tsconfig.json`), Vite (`vite.config.ts`), scripts npm :

   * `dev`: Vite (UI) + Electron main en watch
   * `build`: build UI + packager
7. Créer `app/main`, `app/preload`, `app/renderer`.
8. Implémenter **snippets** ci‑dessus (main/preload/renderer).
9. Lancer `npm run dev`, vérifier l’IPC `listDir`.
10. Ajouter **SQLite + Drizzle** : tables `files`, `file_text`, etc.
11. Implémenter un **Scanner** minimal (walk + insert DB).
12. Ajouter un **EmbeddingProvider** factice (retourne vecteurs aléatoires) → brancher la recherche.
13. Basculer vers embeddings réels (API), ajouter *toggle local/cloud*.
14. Packager (`npm run build`), tester `.exe`/`.dmg`.

---

## 24) Glossaire rapide

* **Embedding** : représentation vectorielle d’un contenu pour recherche sémantique.
* **Vector DB** : base optimisée pour rechercher par similarité de vecteurs.
* **IPC** : communication processus main ↔ renderer dans Electron.
* **Watcher** : écoute les changements de fichiers.
* **BM25** : algo de recherche plein texte classique (mot‑clé).

---

## 25) Prochaines étapes concrètes (ma reco)

1. Valider le **stack** : *Electron + TypeScript + Svelte + Tailwind + SQLite(+sqlite‑vec)*.
2. Démarrer le **squelette** (main/preload/renderer) + **IPC sécurisé**.
3. Brancher **SQLite + Drizzle** et créer les tables.
4. Livrer **MVP Scanner** (un dossier) + **Recherche mots‑clés**.
5. Ajouter **embeddings texte (API)** + **Recherche sémantique**.
6. Créer **Vue Chat** avec citations et actions.
7. Intégrer **tagging visuel** de base (API) + EXIF.
8. **Packager** et tester sur Win/macOS, puis itérer.

---

Si tu veux, je peux te générer un repo “starter” (scripts, config Vite/Electron, TS strict, Svelte/Tailwind, Drizzle/SQLite, IPC sécurisé) et t’accompagner étape par étape. Tu veux partir direct sur ce stack recommandé ou tu préfères une variante (React, Tauri, embeddings locaux dès J1) ?
