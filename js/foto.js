// Travi — foto reali per le tappe che non ne hanno una scelta a mano.
//
// Le 52 tappe originali del viaggio hanno già foto vere, selezionate a mano
// (assets/img/*.jpg, riferite da s.img) — questo file non le tocca. Serve
// SOLO per le tappe che aggiungete voi (custom) o che mettete nei Preferiti:
// senza questo, sarebbero rimaste per sempre senza immagine.
//
// Cerca su Wikipedia (prima in italiano, poi in inglese: molti posti in
// Giappone hanno più copertura lì) una foto libera legata al nome del posto —
// lo stesso concetto dell'anteprima di un luogo su Google Maps, ma con una
// fonte gratuita, senza chiave API e senza problemi di licenza (i contenuti
// Wikimedia sono liberi). Se non si trova niente, chi chiama questa funzione
// userà il segnaposto generico (assets/img/luogo-generico.jpg) — vedi imgFor
// in js/app.js.
//
// Esce solo il nome del posto cercato: nessun dato del viaggio (date, nomi
// vostri, itinerario) lascia mai il telefono per questa ricerca.
(function () {
  "use strict";

  function cercaSuLingua(lingua, query) {
    var urlRicerca = "https://" + lingua + ".wikipedia.org/w/api.php?action=query&list=search&srlimit=1&format=json&origin=*&srsearch=" + encodeURIComponent(query);
    return fetch(urlRicerca).then(function (r) { return r.json(); }).then(function (data) {
      var hit = data && data.query && data.query.search && data.query.search[0];
      if (!hit) return null;
      var urlSunto = "https://" + lingua + ".wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(hit.title);
      return fetch(urlSunto).then(function (r) { return r.ok ? r.json() : null; }).then(function (sunto) {
        if (!sunto) return null;
        var img = sunto.originalimage || sunto.thumbnail;
        return (img && img.source) ? img.source : null;
      });
    }).catch(function () { return null; });
  }

  function cerca(query) {
    if (!query || !query.trim()) return Promise.resolve(null);
    return cercaSuLingua("it", query).then(function (url) {
      return url || cercaSuLingua("en", query);
    }).catch(function () { return null; });
  }

  window.TraviFoto = { cerca: cerca };
})();
