// Travi — service worker: cache dell'app shell per un avvio rapido e un minimo
// di funzionamento offline (i dati del viaggio restano su Firestore e
// richiedono comunque connessione per sincronizzarsi).
//
// Il numero nel nome della cache va alzato ogni volta che questo file cambia:
// è quello che fa sì che una PWA già installata sul telefono butti via la
// cache vecchia invece di restare bloccata su una copia obsoleta dei file.
const CACHE_NAME = "travi-shell-v9";
const SHELL_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.json",
  "./js/app.js",
  "./js/firebase-init.js",
  "./js/firebase-config.js",
  "./js/coords.js",
  "./js/orari.js",
  "./js/giornata.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./assets/img/hero.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Strategia:
// - Firebase/Firestore: sempre in rete, niente cache (i dati devono essere freschi).
// - Codice dell'app (html/js/css/json, incluso firebase-config.js): "network-first"
//   con { cache: "no-store" } — cruciale: un fetch() normale, anche dentro un
//   service worker "network-first", rispetta comunque la cache HTTP del browser
//   (GitHub Pages manda cache-control: max-age=600), quindi senza no-store un
//   aggiornamento pubblicato poteva restare invisibile fino a 10 minuti anche
//   con questa strategia — sembrava "non funzionare mai", ma stava solo
//   rispondendo dalla cache HTTP invece di andare davvero in rete.
//   Usa la cache della Cache Storage SOLO se il telefono è offline.
// - Immagini/icone: "cache-first" (cambiano raramente, meglio veloci).
self.addEventListener("fetch", (event) => {
  const url = event.request.url;
  if (url.includes("firestore.googleapis.com") || url.includes("googleapis.com") || url.includes("gstatic.com/firebasejs")) {
    return; // lascia passare direttamente in rete, niente cache
  }

  let isCode = event.request.mode === "navigate";
  try {
    isCode = isCode || /\.(html|js|css|json)$/.test(new URL(url).pathname);
  } catch (e) {}

  if (isCode) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then((resp) => {
          if (resp && resp.status === 200) {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return resp;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request)
          .then((resp) => {
            if (resp && resp.status === 200 && event.request.method === "GET") {
              const copy = resp.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            }
            return resp;
          })
          .catch(() => cached)
      );
    })
  );
});
