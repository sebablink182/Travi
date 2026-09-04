/* ===========================================================================
   IL MOTORE DELLA GIORNATA
   ===========================================================================
   È il pezzo per cui Travi esiste: durante la giornata dice se si sta
   rispettando il piano, a che ora si arriverà davvero alle tappe che restano,
   quali non si faranno più in tempo, e cosa conviene saltare per salvare
   il resto.

   Non chiede niente a nessun servizio: lavora sui vostri dati e sulle
   coordinate. Quindi funziona anche in metropolitana, senza segnale — che è
   esattamente il momento in cui serve.

   Qui dentro NON c'è interfaccia: solo calcolo. Così lo stesso motore gira
   nell'app e nella pagina di prova simula.html, e si può verificare con orari
   finti senza aspettare maggio 2027.
   =========================================================================== */
(function () {
  "use strict";

  var VEL_PIEDI = 4.5;   // km/h, andatura da turista con soste, non da marcia
  var GIRO = 1.35;       // le strade non sono in linea d'aria: +35% sulla distanza diretta
  var MARGINE_STRETTA = 20; // minuti: sotto questo margine dalla chiusura, "ce la fai per un pelo"

  function min(hhmm) {
    if (!hhmm) return null;
    var p = String(hhmm).split(":");
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  }
  function hhmm(m) {
    m = Math.round(m);
    // Una giornata in forte ritardo può sfondare la mezzanotte: senza questo
    // usciva "25:14", che non è un orario. Meglio dirlo esplicitamente.
    var oltre = m >= 1440;
    if (oltre) m = m % 1440;
    var h = Math.floor(m / 60), r = m % 60;
    return String(h).padStart(2, "0") + ":" + String(r).padStart(2, "0") + (oltre ? "+1" : "");
  }
  function kmTra(a, b) {
    if (a.lat == null || b.lat == null) return null;
    var dx = (a.lat - b.lat) * 111;
    var dy = (a.lon - b.lon) * 111 * Math.cos(a.lat * Math.PI / 180);
    return Math.sqrt(dx * dx + dy * dy) * GIRO;
  }
  // Minuti a piedi fra due tappe, dalle coordinate. Serve come rete di
  // sicurezza dove tmin non è stato compilato, e come confronto: se una tappa
  // dice "5 minuti" ma a piedi sono 40, quel numero è da rivedere.
  function minutiAPiedi(a, b) {
    var km = kmTra(a, b);
    if (km == null) return null;
    return Math.round((km / VEL_PIEDI) * 60) + 2; // +2 per uscire e orientarsi
  }

  /* -------------------------------------------------------------------------
     calcola(tappe, adesso, orari)

       tappe  = le tappe del giorno, IN ORDINE, come le usa l'app
                (id, time, dur, tmin, lat, lon, done, locked, title)
       adesso = minuti dalla mezzanotte (es. 16*60+20 per le 16:20)
       orari  = window.TRAVI_ORARI

     Restituisce lo stato della giornata. Vedi in fondo il formato.
     ------------------------------------------------------------------------- */
  // conSuggerimento=false nelle chiamate interne: senza questo, calcola()
  // chiama cercaSuggerimento() che richiama calcola()... all'infinito.
  function calcola(tappe, adesso, orari, conSuggerimento) {
    if (conSuggerimento === undefined) conSuggerimento = true;
    orari = orari || {};
    var fatte = tappe.filter(function (t) { return t.done; });
    var restanti = tappe.filter(function (t) { return !t.done; });

    var esito = {
      totali: tappe.length,
      fatte: fatte.length,
      restanti: restanti.length,
      ritardo: 0,
      previsioni: [],
      problemi: [],
      suggerimento: null,
      finePrevista: null
    };
    if (!restanti.length) { esito.stato = "finita"; return esito; }

    // Da dove riparte il conto: da adesso, oppure dall'orario della prima
    // tappa se la giornata non è ancora cominciata (non ha senso dire che si
    // è in anticipo di sei ore alle sette del mattino).
    var primaOra = min(restanti[0].time);
    var cursore = adesso;
    if (primaOra != null && adesso < primaOra - (restanti[0].tmin || 0)) {
      esito.stato = "non-iniziata";
      cursore = primaOra - (restanti[0].tmin || 0);
    } else {
      esito.stato = "in-corso";
    }

    var precedente = fatte.length ? fatte[fatte.length - 1] : null;

    restanti.forEach(function (t, i) {
      var rif = i === 0 ? precedente : restanti[i - 1];
      var piedi = rif ? minutiAPiedi(rif, t) : null;
      // Quanto ci si mette ad arrivare: il valore previsto nei dati se c'è,
      // altrimenti la stima a piedi dalle coordinate.
      var viaggio = (t.tmin != null && t.tmin > 0) ? t.tmin : (piedi != null ? piedi : 0);

      var arrivo = cursore + viaggio;

      // Una tappa "bloccata" (volo, treno prenotato, guida che aspetta) non si
      // anticipa: si arriva e si aspetta l'ora prevista.
      var pianificato = min(t.time);
      if (t.locked && pianificato != null && arrivo < pianificato) arrivo = pianificato;

      var o = orari[t.id] || {};
      var chiude = (o.tipo === "orari") ? min(o.ch) : null;
      var apre = (o.tipo === "orari") ? min(o.ap) : null;

      // Se si arriva prima dell'apertura, si aspetta: è tempo reale perso.
      var attesa = 0;
      if (apre != null && arrivo < apre) { attesa = apre - arrivo; arrivo = apre; }

      var durata = t.dur || 0;
      var fine = arrivo + durata;

      var verdetto = "ok", margine = null;
      if (chiude != null) {
        margine = chiude - arrivo;
        if (arrivo >= chiude) verdetto = "chiusa";
        else if (fine > chiude) verdetto = "incompleta";
        else if (margine < MARGINE_STRETTA) verdetto = "stretta";
      }

      var scarto = pianificato != null ? arrivo - pianificato : null;

      esito.previsioni.push({
        id: t.id, title: t.title,
        pianificato: pianificato, pianificatoOra: t.time,
        arrivo: arrivo, arrivoOra: hhmm(arrivo),
        fine: fine, fineOra: hhmm(fine),
        viaggio: viaggio, piedi: piedi, attesa: attesa,
        chiude: chiude, chiudeOra: chiude != null ? hhmm(chiude) : null,
        sempreAperta: o.tipo === "sempre",
        verdetto: verdetto, margine: margine, scarto: scarto,
        locked: !!t.locked, durata: durata
      });

      if (verdetto === "chiusa" || verdetto === "incompleta") {
        esito.problemi.push({ id: t.id, title: t.title, verdetto: verdetto,
                              arrivoOra: hhmm(arrivo), chiudeOra: hhmm(chiude) });
      }
      cursore = fine;
    });

    esito.finePrevista = hhmm(cursore);
    // Il ritardo è quello sulla prossima tappa: è il numero che conta davvero
    // mentre si cammina, non la media della giornata.
    if (esito.previsioni.length && esito.previsioni[0].scarto != null) {
      esito.ritardo = esito.previsioni[0].scarto;
    }
    if (conSuggerimento && esito.problemi.length) {
      esito.suggerimento = cercaSuggerimento(tappe, adesso, orari);
    }
    return esito;
  }

  /* -------------------------------------------------------------------------
     Cosa saltare per salvare il resto.
     Prova a togliere UNA tappa alla volta fra quelle che restano (mai quelle
     bloccate, mai l'ultima rimasta) e tiene la rinuncia che risolve più
     problemi. Se nessuna basta, lo dice invece di inventarsi una soluzione.
     ------------------------------------------------------------------------- */
  function cercaSuggerimento(tappe, adesso, orari) {
    var base = calcola(tappe, adesso, orari, false);
    var inGuaio = base.problemi.map(function (p) { return p.id; });

    // Rinunciare alla tappa che NON si fa in tempo non è un consiglio: è la
    // constatazione del problema. Il consiglio utile è cosa sacrificare PRIMA
    // per arrivare ancora in tempo a quella che si vuole salvare. Quindi le
    // tappe in difficoltà non entrano fra le candidate al taglio.
    var candidate = tappe.filter(function (t) {
      return !t.done && !t.locked && inGuaio.indexOf(t.id) === -1;
    });
    var migliore = null;

    candidate.forEach(function (c) {
      var senza = tappe.filter(function (t) { return t.id !== c.id; });
      if (!senza.filter(function (t) { return !t.done; }).length) return;
      var prova = calcola(senza, adesso, orari, false);
      var risolti = base.problemi.length - prova.problemi.length;
      if (risolti <= 0) return;
      // a parità di problemi risolti, si rinuncia alla tappa più corta
      if (!migliore || risolti > migliore.risolve ||
          (risolti === migliore.risolve && (c.dur || 0) < migliore.durata)) {
        migliore = {
          tipo: "sacrifica",
          salta: c.id, titolo: c.title, durata: c.dur || 0,
          risolve: risolti, restano: prova.problemi.length,
          problemiRisolti: base.problemi.filter(function (p) {
            return !prova.problemi.some(function (q) { return q.id === p.id; });
          }).map(function (p) { return p.title; })
        };
      }
    });

    // Nessun taglio a monte salva la situazione: allora il consiglio onesto è
    // rimandare o togliere le tappe che non si fanno più in tempo.
    if (!migliore) {
      migliore = {
        tipo: "rinuncia",
        perse: base.problemi.map(function (p) { return p.title; }),
        risolve: 0
      };
    }
    return migliore;
  }

  window.Giornata = {
    calcola: calcola,
    minutiAPiedi: minutiAPiedi,
    kmTra: kmTra,
    min: min,
    hhmm: hhmm
  };
})();
