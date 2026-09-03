// ⚠ LES DEUX PWA PARTAGENT UNE ORIGINE (16 aout 2026).
// walterbturgeon.github.io/BPS_GPS/ (production) et .../BPS_GPS_DEV/ (cette
// version de travail) sont des pages de PROJET : meme schema, meme hote,
// meme port = MEME ORIGINE. Or `caches.keys()` liste les caches de toute
// l'origine, pas ceux du dossier.
//
// L'ancien nettoyage supprimait TOUT cache dont le nom differait du sien.
// Resultat : chaque PWA effacait le cache de l'autre a chaque activation,
// et le mode hors ligne devenait imprevisible -- precisement ce qui sert en
// piste quand le reseau est mauvais.
//
// Correction : un PREFIXE par PWA, et on ne nettoie que ses propres versions.
// ⚠ La PWA de production (DRAGLOG_v7/webapp, cache `draglog-v96`) porte
// ENCORE l'ancien filtre : tant qu'elle n'aura pas la meme correction, elle
// continuera d'effacer ce cache-ci. Les deux doivent etre corrigees.
const PREFIX = 'draglog-dev-';
const CACHE = PREFIX + 'v110';   // v110 : choix des valeurs d'ecran par menu deroulant, 38 canaux du Link G4+
const ASSETS = ['./', './index.html', './manifest.json', './logo.svg', './icon-192.webp', './icon-512.webp'];

self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Reseau d'abord, cache en secours (hors-ligne seulement) : les mises a jour
// publiees sur GitHub Pages sont visibles au prochain chargement, sans purge
// manuelle du cache. L'ancienne strategie cache-d'abord servait l'index.html
// perime indefiniment sur Android (Chrome), pendant que Bluefy/iOS, qui ne
// persiste pas le service worker pareil, rechargeait la page fraiche.
self.addEventListener('fetch', (ev) => {
  ev.respondWith(
    fetch(ev.request)
      .then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then((c) => c.put(ev.request, copy)).catch(() => {});
        return resp;
      })
      .catch(() => caches.match(ev.request))
  );
});
