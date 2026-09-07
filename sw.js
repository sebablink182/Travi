// Travi — service worker: è quello che permette all'app di funzionare anche
// senza rete. Non è un dettaglio di velocità: il senso di Travi è dire "ce la
// facciamo?" mentre siete in metropolitana a Tokyo, ed è esattamente lì che il
// telefono non ha campo.
//
// Il numero nel nome della cache va alzato ogni volta che questo file cambia:
// è quello che fa sì che una PWA già installata sul telefono butti via la
// cache vecchia invece di restare bloccata su una copia obsoleta dei file.
const CACHE_NAME = "travi-shell-v18";

// Il guscio dell'app: tutto ciò che sta su GitHub Pages insieme a noi.
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
  "./js/frasi.js",
  "./js/giornata.js",
  "./js/cerca-luogo.js",
  "./js/foto.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./assets/img/akihabara.jpg",
  "./assets/img/arashiyama-bamboo.jpg",
  "./assets/img/dotonbori.jpg",
  "./assets/img/flight-generic.jpg",
  "./assets/img/food-generic.jpg",
  "./assets/img/fushimi-inari.jpg",
  "./assets/img/ginza.jpg",
  "./assets/img/gion.jpg",
  "./assets/img/hakone-shrine.jpg",
  "./assets/img/hero.jpg",
  "./assets/img/higashi-chaya.jpg",
  "./assets/img/higashiyama-sannenzaka.jpg",
  "./assets/img/hotel-generic.jpg",
  "./assets/img/itsukushima.jpg",
  "./assets/img/kasuga-taisha.jpg",
  "./assets/img/kenrokuen.jpg",
  "./assets/img/kinkaku-ji.jpg",
  "./assets/img/kiyomizu-dera.jpg",
  "./assets/img/lake-ashi.jpg",
  "./assets/img/luogo-generico.jpg",
  "./assets/img/meiji-jingu.jpg",
  "./assets/img/miyajima-nature.jpg",
  "./assets/img/nakamise-dori.jpg",
  "./assets/img/nara-park.jpg",
  "./assets/img/nishiki-market.jpg",
  "./assets/img/odaiba.jpg",
  "./assets/img/osaka-castle.jpg",
  "./assets/img/owakudani.jpg",
  "./assets/img/peace-memorial.jpg",
  "./assets/img/senso-ji.jpg",
  "./assets/img/shibuya-crossing.jpg",
  "./assets/img/shibuya-sky.jpg",
  "./assets/img/shinsaibashi.jpg",
  "./assets/img/shinsekai.jpg",
  "./assets/img/takeshita-dori.jpg",
  "./assets/img/teamlab-planets.jpg",
  "./assets/img/todai-ji.jpg",
  "./assets/img/tokyo-skytree.jpg",
  "./assets/img/transfer-generic.jpg",
  "./assets/img/ueno-park.jpg",
];

// Librerie esterne, indispensabili all'avvio: l'SDK di Firebase e Leaflet.
// PRIMA erano escluse dalla cache "perché sono esterne" — ed era il buco più
// grosso di tutti: senza rete l'SDK non si scaricava, js/app.js (che lo
// importa) non partiva, e l'app non si apriva nemmeno. Sono file con la
// versione nell'indirizzo, quindi non cambiano mai sotto i piedi: si possono
// tenere in cache senza rischio.
const VENDOR = [
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css",
  "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js",
  "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js",
  "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js"
];

// Un file che manca non deve far fallire tutto il resto: si mette in cache
// quello che c'è, uno per uno (addAll invece fallisce in blocco al primo 404).
function precache(cache, elenco) {
  return Promise.all(elenco.map((u) => cache.add(u).catch(() => {})));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => precache(cache, SHELL_FILES).then(() => precache(cache, VENDOR)))
      .catch(() => {})
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

// Le chiamate ai SERVIZI Firebase (non alle librerie): devono andare sempre in
// rete e non vanno mai messe in cache. Quando manca la rete ci pensa Firestore
// stesso, che tiene una copia locale dei dati (vedi js/firebase-init.js).
function eServizioFirebase(url) {
  return url.includes("firestore.googleapis.com") ||
         url.includes("identitytoolkit.googleapis.com") ||
         url.includes("securetoken.googleapis.com") ||
         url.includes("firebaseinstallations.googleapis.com");
}

// Le LIBRERIE esterne, riconosciute dall'indirizzo.
function eLibreriaEsterna(url) {
  return url.includes("gstatic.com/firebasejs") || url.includes("cdnjs.cloudflare.com");
}

// I DATI VIVI: meteo, cambio euro/yen, ricerca di un posto, foto da Wikipedia.
// Non sono file dell'app e non vanno serviti dalla cache per primi — una
// previsione o un cambio di ieri, dati come se fossero di oggi, sono peggio di
// un trattino. Vanno chiesti alla rete e usati dalla cache SOLO se la rete non
// c'è: è la stessa regola del codice dell'app, ma qui va detta a parte perché
// questi indirizzi non finiscono in .json e non verrebbero riconosciuti.
function eDatiVivi(url) {
  return url.includes("open-meteo.com") ||
         url.includes("frankfurter.dev") ||
         url.includes("frankfurter.app") ||
         url.includes("open.er-api.com") ||
         url.includes("nominatim.openstreetmap.org") ||
         url.includes("wikipedia.org/api/");
}

// Strategia, in tre famiglie:
// - servizi Firebase: solo rete, mai cache.
// - librerie esterne: prima la cache (sono immutabili, hanno la versione
//   nell'indirizzo), e intanto si aggiornano in silenzio.
// - codice dell'app: "network-first" con { cache: "no-store" } — cruciale: un
//   fetch() normale, anche dentro un service worker "network-first", rispetta
//   comunque la cache HTTP del browser (GitHub Pages manda
//   cache-control: max-age=600), quindi senza no-store un aggiornamento
//   pubblicato poteva restare invisibile fino a 10 minuti. Usa la Cache
//   Storage SOLO se il telefono è offline.
// - immagini e tutto il resto: prima la cache (cambiano di rado).
self.addEventListener("fetch", (event) => {
  const url = event.request.url;
  if (event.request.method !== "GET") return;
  if (eServizioFirebase(url)) return;

  if (eLibreriaEsterna(url)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const dallaRete = fetch(event.request)
          .then((resp) => {
            if (resp && resp.status === 200 && resp.type !== "opaque") {
              const copia = resp.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
            }
            return resp;
          })
          .catch(() => cached);
        return cached || dallaRete;
      })
    );
    return;
  }

  let isCode = event.request.mode === "navigate";
  try {
    isCode = isCode || /\.(html|js|css|json)$/.test(new URL(url).pathname);
  } catch (e) {}
  isCode = isCode || eDatiVivi(url);

  if (isCode) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then((resp) => {
          if (resp && resp.status === 200) {
            const copia = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
          }
          return resp;
        })
        // Senza rete si ripiega sulla copia salvata. La pagina intera
        // (index.html) è un ripiego valido solo per una NAVIGAZIONE: darla in
        // risposta a una richiesta di meteo significherebbe consegnare
        // dell'HTML a chi si aspetta dei numeri.
        .catch(() =>
          caches.match(event.request).then((c) => {
            if (c) return c;
            if (event.request.mode === "navigate") return caches.match("./index.html");
            return Response.error();
          })
        )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request)
          .then((resp) => {
            if (resp && resp.status === 200) {
              const copia = resp.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
            }
            return resp;
          })
          .catch(() => cached)
      );
    })
  );
});
