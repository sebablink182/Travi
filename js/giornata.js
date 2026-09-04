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

  /* PRIORITÀ — quanto tenete a una tappa. Decide cosa il motore è disposto a
     sacrificare quando la giornata non ci sta.
       top   imperdibile   non viene MAI proposta come rinuncia
       norm  normale       il piano: sacrificabile se serve
       extra se avanza     la prima a cadere, sempre
     Se una tappa non ha priorità sua, si deduce dalla categoria: così non
     bisogna compilarne 52 a mano, se ne toccano una dozzina. */
  var PRIO_DA_CATEGORIA = {
    shopping: "extra", food: "norm", temple: "norm", nature: "norm",
    view: "norm", experience: "norm", transfer: "norm", hotel: "norm"
  };
  var PESO = { top: 0, norm: 1, extra: 2 }; // ordine in cui si è disposti a tagliare

  function prioDi(t) {
    if (t.prio && PESO[t.prio] !== undefined) return t.prio;
    return PRIO_DA_CATEGORIA[t.cat] || "norm";
  }

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
      var km = rif ? kmTra(rif, t) : null;
      // La stima a piedi vale solo per distanze davvero percorribili a piedi.
      // Senza questo controllo, una tappa di trasferimento senza tempo
      // compilato faceva calcolare la camminata Kanazawa→Kyoto: 230 km,
      // cinquanta ore, e l'intera giornata andava a farsi benedire.
      var piedi = (km != null && km <= MAX_A_PIEDI_KM) ? minutiAPiedi(rif, t) : null;

      // Quanto ci si mette ad arrivare, in ordine di attendibilità:
      //   1. il tempo previsto nei dati, se c'è
      //   2. la stima a piedi, se la distanza è pedonale
      //   3. altrimenti ci si fida del piano: lo scarto fra l'orario previsto
      //      di questa tappa e la fine di quella prima. È il caso dei treni
      //      fra città, dove il piano sa qualcosa che le coordinate non sanno.
      var viaggio, stimaDa;
      if (t.tmin != null && t.tmin > 0) { viaggio = t.tmin; stimaDa = "dati"; }
      else if (piedi != null) { viaggio = piedi; stimaDa = "piedi"; }
      else {
        var oraQui = min(t.time), oraPrima = rif ? min(rif.time) : null;
        var durPrima = rif ? (rif.dur || 0) : 0;
        viaggio = (oraQui != null && oraPrima != null)
          ? Math.max(0, oraQui - (oraPrima + durPrima)) : 0;
        stimaDa = "piano";
      }

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
        viaggio: viaggio, piedi: piedi, stimaDa: stimaDa, km: km, attesa: attesa,
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
    // tappe in difficoltà non entrano fra le candidate al taglio — e nemmeno
    // le imperdibili, che è il senso stesso di averle segnate così.
    var candidate = tappe.filter(function (t) {
      return !t.done && !t.locked && inGuaio.indexOf(t.id) === -1 && prioDi(t) !== "top";
    });
    var migliore = null;

    candidate.forEach(function (c) {
      var senza = tappe.filter(function (t) { return t.id !== c.id; });
      if (!senza.filter(function (t) { return !t.done; }).length) return;
      var prova = calcola(senza, adesso, orari, false);
      var risolti = base.problemi.length - prova.problemi.length;
      if (risolti <= 0) return;

      var cand = {
        tipo: "sacrifica",
        salta: c.id, titolo: c.title, durata: c.dur || 0, prio: prioDi(c),
        risolve: risolti, restano: prova.problemi.length,
        problemiRisolti: base.problemi.filter(function (p) {
          return !prova.problemi.some(function (q) { return q.id === p.id; });
        }).map(function (p) {
          var t = tappe.find(function (x) { return x.id === p.id; });
          return { title: p.title, prio: t ? prioDi(t) : "norm" };
        })
      };
      // Si sceglie: prima chi risolve di più; a pari merito si sacrifica la
      // tappa a cui si tiene di meno; a pari priorità, la più corta.
      if (!migliore ||
          cand.risolve > migliore.risolve ||
          (cand.risolve === migliore.risolve && PESO[cand.prio] > PESO[migliore.prio]) ||
          (cand.risolve === migliore.risolve && cand.prio === migliore.prio &&
           cand.durata < migliore.durata)) {
        migliore = cand;
      }
    });

    if (migliore) return migliore;

    // Nessun taglio a monte basta: allora si dice quali tappe non si fanno più,
    // segnalando se fra queste ce n'è una imperdibile — è un'informazione
    // diversa da "salta un mercato".
    var perse = base.problemi.map(function (p) {
      var t = tappe.find(function (x) { return x.id === p.id; });
      return { id: p.id, title: p.title, prio: t ? prioDi(t) : "norm" };
    });
    return {
      tipo: "rinuncia",
      perse: perse,
      imperdibiliPerse: perse.filter(function (p) { return p.prio === "top"; }),
      risolve: 0
    };
  }

  /* -------------------------------------------------------------------------
     DOVE SPOSTARLA
     Quando una tappa non ci sta più oggi, Travi conosce tutti i giorni del
     viaggio: può guardare se ce n'è un altro nella stessa città con spazio
     sufficiente, invece di lasciarvi decidere al volo in mezzo alla strada.

       tappa   = quella da ricollocare
       giorni  = [{ id, date, city, tappe: [...] }] tutti i giorni del viaggio
       oggiId  = il giorno da cui la si toglie
     Restituisce i giorni possibili, dal più comodo in poi, o [] se nessuno.
     ------------------------------------------------------------------------- */
  var MAX_A_PIEDI_KM = 5;  // oltre questa distanza "a piedi" non è più una stima, è una fantasia
  var ORA_DECENTE = 21 * 60; // oltre le 21 una giornata non "ha spazio": è solo lunga

  function giorniAlternativi(tappa, giorni, oggiId, orari, cittaOggi) {
    var esiti = [];
    giorni.forEach(function (g) {
      if (g.id === oggiId) return;
      if (cittaOggi && g.city !== cittaOggi) return;  // in un'altra città non ha senso
      if (g.date && g.date < oggiISO()) return;        // i giorni passati non servono
      if (!g.tappe.length) return;

      var prima = calcola(g.tappe, 0, orari, false);
      var meglio = null;

      // Si prova a infilarla in OGNI posizione, non solo in coda: un mercato
      // che chiude alle 18 sta bene al mattino e non la sera, e cercando solo
      // in fondo lo si scartava per niente.
      for (var i = 0; i <= g.tappe.length; i++) {
        var con = g.tappe.slice();
        con.splice(i, 0, Object.assign({}, tappa, { done: false }));
        var dopo = calcola(con, 0, orari, false);
        if (dopo.problemi.length > prima.problemi.length) continue;
        if (min(dopo.finePrevista) > ORA_DECENTE || dopo.finePrevista.indexOf("+1") > -1) continue;
        if (!meglio || min(dopo.finePrevista) < min(meglio.fineCon)) {
          meglio = { posizione: i, fineCon: dopo.finePrevista };
        }
      }
      if (!meglio) return;

      esiti.push({
        id: g.id, date: g.date, city: g.city,
        posizione: meglio.posizione,
        dopoDi: meglio.posizione > 0 ? g.tappe[meglio.posizione - 1].title : null,
        fineSenza: prima.finePrevista, fineCon: meglio.fineCon,
        tappeQuelGiorno: g.tappe.length
      });
    });
    esiti.sort(function (a, b) { return min(a.fineCon) - min(b.fineCon); });
    return esiti;
  }

  function oggiISO() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") +
           "-" + String(d.getDate()).padStart(2, "0");
  }

  window.Giornata = {
    calcola: calcola,
    prioDi: prioDi,
    giorniAlternativi: giorniAlternativi,
    PRIO_DA_CATEGORIA: PRIO_DA_CATEGORIA,
    minutiAPiedi: minutiAPiedi,
    kmTra: kmTra,
    min: min,
    hhmm: hhmm
  };
})();
