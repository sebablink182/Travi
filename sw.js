// Travi — service worker: cache dell'app shell per un avvio rapido e un minimo
// di funzionamento offline (i dati del viaggio restano su Firestore e
// richiedono comunque connessione per sincronizzarsi).
//
// Il numero nel nome della cache va alzato ogni volta che questo file cambia:
// è quello che fa sì che una PWA già installata sul telefono butti via la
// cache vecchia invece di restare bloccata su una copia obsoleta dei file.
const CACHE_NAME = "travi-shell-v3";
const SHELL_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.json",
  "./js/app.js",
  "./js/firebase-init.js",
  "./js/firebase-config.js",
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
// - Codice dell'app (html/js/css/json, incluso firebase-config.js): "network-first".
//   Se c'è connessione, prende sempre l'ultima versione pubblicata e aggiorna la
//   cache di riserva; usa la cache SOLO se il telefono è offline. Questo è ciò che
//   garantisce che un aggiornamento pubblicato su GitHub Pages arrivi anche a chi
//   ha già installato l'app in home screen, senza bisogno di reinstallarla.
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
      fetch(event.request)
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
