// Travi — cerca un posto per nome mentre lo scrivete (Nominatim/OpenStreetMap,
// lo stesso servizio già usato da coordinate.html e hotel.html per mettere le
// tappe sulla mappa). Serve a NON dover più scrivere a mano zona/città e
// posizione quando aggiungete una tappa o un preferito: si cerca il nome, si
// sceglie il risultato giusto, e titolo/zona/coordinate arrivano da lì.
//
// Niente chiave API, funziona dal telefono/browser esattamente come i tool di
// geocodifica già nel progetto (Nominatim blocca solo le richieste automatiche
// da server, non quelle da un browser vero).
(function () {
  "use strict";

  function cerca(query) {
    if (!query || query.trim().length < 3) return Promise.resolve([]);
    var url = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&accept-language=it&countrycodes=jp&q=" + encodeURIComponent(query);
    return fetch(url).then(function (r) { return r.json(); })
      .then(function (rows) {
        return (rows || []).map(function (r) {
          var parti = (r.display_name || "").split(",").map(function (p) { return p.trim(); });
          return {
            title: parti[0] || r.display_name,
            sub: parti.slice(1, 3).join(", "),
            full: r.display_name,
            lat: parseFloat(r.lat),
            lon: parseFloat(r.lon)
          };
        });
      })
      .catch(function () { return []; });
  }

  window.TraviCerca = { cerca: cerca };
})();
