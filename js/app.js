import { auth, db } from "./firebase-init.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

(function () {
  "use strict";

  /* ---------- categorie & trasporti (generici, non sensibili) ---------- */
  var CATS = [
    { id: "temple", label: "Tempio", icon: "ic-temple" },
    { id: "nature", label: "Natura", icon: "ic-leaf" },
    { id: "food", label: "Cibo", icon: "ic-bowl" },
    { id: "shopping", label: "Shopping", icon: "ic-bag" },
    { id: "view", label: "Panorama", icon: "ic-view" },
    { id: "experience", label: "Esperienza", icon: "ic-star" },
    { id: "transfer", label: "Trasferimento", icon: "ic-train" },
    { id: "hotel", label: "Hotel", icon: "ic-bed" },
  ];
  // Priorità: quanto ci tenete. Vedi js/giornata.js per come pesa nei consigli.
  var PRIORITA = [
    { id: "top",   label: "Imperdibile", icon: "ic-star" },
    { id: "norm",  label: "Normale",     icon: "ic-dot" },
    { id: "extra", label: "Se avanza",   icon: "ic-dash" },
  ];
  // Durata come scelta rapida invece di un numero da digitare: raramente si
  // sa in anticipo quanto ci si fermerà davvero da qualche parte.
  var DURATA_OPTS = [
    { id: "15", label: "15 min" }, { id: "30", label: "30" }, { id: "45", label: "45" },
    { id: "60", label: "1 h" }, { id: "90", label: "1½ h" }, { id: "120", label: "2 h+" }
  ];
  var TRANSPORTS = [
    { id: "walk", label: "A piedi", icon: "ic-walk" },
    { id: "metro", label: "Metro/Treno", icon: "ic-train" },
    { id: "bus", label: "Bus", icon: "ic-bus" },
    { id: "car", label: "Taxi/Auto", icon: "ic-car" },
  ];
  function cat(id) {
    return CATS.find(function (c) { return c.id === id; }) || CATS[5];
  }
  function transp(id) {
    return TRANSPORTS.find(function (t) { return t.id === id; }) || TRANSPORTS[0];
  }

  /* ---------- dati del viaggio: caricati da Firestore, non hardcoded ---------- */
  var TRIP = { start: "2027-05-05", end: "2027-05-18" };
  var DAYS = [];
  var SEED_STOPS = [];
  var dataLoaded = false;

  var state = { overrides: {}, custom: [], removed: [], budget: [], favorites: [] };
  var BUDGET_WHO = [
    { id: "sebastian", label: "Sebastian" },
    { id: "alessandra", label: "Alessandra" },
    { id: "insieme", label: "Insieme" },
  ];
  /* ---------- coordinate approssimative delle città in itinerario (per meteo live) ---------- */
  var CITY_COORDS = {
    "Tokyo": { lat: 35.6762, lon: 139.6503 },
    "Hakone": { lat: 35.2324, lon: 139.1069 },
    "Kanazawa": { lat: 36.5613, lon: 136.6562 },
    "Kyoto": { lat: 35.0116, lon: 135.7681 },
    "Hiroshima": { lat: 34.3853, lon: 132.4553 },
    "Miyajima": { lat: 34.2969, lon: 132.3196 },
    "Osaka": { lat: 34.6937, lon: 135.5023 },
  };
  function cityKeyFor(cityStr) {
    var keys = Object.keys(CITY_COORDS);
    for (var i = 0; i < keys.length; i++) {
      if (cityStr && cityStr.indexOf(keys[i]) !== -1) return keys[i];
    }
    return "Tokyo";
  }
  // Stessa idea di cityKeyFor, ma per raggruppare i Preferiti: qui un posto
  // che non nomina nessuna delle città del viaggio deve finire in "Altro",
  // non silenziosamente sotto Tokyo (che è il fallback giusto per il meteo,
  // ma sbagliato per un raggruppamento).
  function cityKeyForFav(text) {
    var keys = Object.keys(CITY_COORDS);
    for (var i = 0; i < keys.length; i++) {
      if (text && text.indexOf(keys[i]) !== -1) return keys[i];
    }
    return "Altro";
  }
  var selectedDay = { itinerario: null };
  var editingId = null;
  var unsubState = null;

  /* ---------- auth gate ---------- */
  var loginGate = document.getElementById("login-gate");
  var appRoot = document.getElementById("app-root");
  var loginForm = document.getElementById("login-form");
  var loginError = document.getElementById("login-error");
  var loginSubmit = document.getElementById("login-submit");
  // L'uscita dall'account non ha più un suo posto nella Home (lasciava un vuoto
  // in fondo alla pagina per un tasto che non si tocca mai). Ora è un gesto
  // nascosto ma non irreversibile: si tiene premuto il logo Travi in alto per
  // un secondo, e si conferma toccandolo di nuovo entro cinque secondi.
  var uscitaArmata = false, uscitaTimer = null, pressTimer = null;
  function armaUscita() {
    uscitaArmata = true;
    toast("Tocca ancora il logo per uscire da questo dispositivo");
    clearTimeout(uscitaTimer);
    uscitaTimer = setTimeout(function () { uscitaArmata = false; }, 5000);
  }
  function esciDavvero() {
    uscitaArmata = false;
    if (unsubState) { unsubState(); unsubState = null; }
    signOut(auth);
  }
  var brandHome = document.querySelector("#view-home .brand");
  if (brandHome) {
    brandHome.addEventListener("touchstart", function () {
      if (uscitaArmata) { esciDavvero(); return; }
      pressTimer = setTimeout(armaUscita, 900);
    }, { passive: true });
    ["touchend", "touchmove", "touchcancel"].forEach(function (ev) {
      brandHome.addEventListener(ev, function () { clearTimeout(pressTimer); }, { passive: true });
    });
    brandHome.addEventListener("click", function () {
      if (uscitaArmata) esciDavvero();
    });
  }

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    // trim/lowercase per evitare falsi "password sbagliata" causati da autofill/tastiera
    // del browser (spazi accidentali, maiuscola automatica a inizio email, ecc.):
    // Firebase confronta comunque l'email senza distinguere maiuscole/minuscole.
    var email = document.getElementById("login-email").value.trim().toLowerCase();
    var password = document.getElementById("login-password").value.trim();
    loginError.textContent = "";
    loginSubmit.disabled = true;
    loginSubmit.textContent = "Accesso in corso…";
    signInWithEmailAndPassword(auth, email, password).catch(function (err) {
      var code = err && err.code ? err.code : "";
      var msg;
      if (code === "auth/wrong-password" || code === "auth/user-not-found" || code === "auth/invalid-credential") {
        msg = "Email o password non corretti.";
      } else if (code === "auth/invalid-api-key" || code === "auth/api-key-not-valid" || code === "auth/invalid-api-key.-please-provide-a-valid-api-key") {
        msg = "Configurazione Firebase non valida: js/firebase-config.js ha ancora i valori segnaposto (o sbagliati). Non è un problema di password: ricontrollate i valori copiati da Firebase Console.";
      } else if (code === "auth/network-request-failed") {
        msg = "Impossibile contattare Firebase: controllate la connessione a internet.";
      } else if (code === "auth/too-many-requests") {
        msg = "Troppi tentativi ravvicinati: aspettate qualche minuto e riprovate.";
      } else {
        msg = "Errore di accesso (" + (code || "sconosciuto") + "): " + err.message;
      }
      loginError.textContent = msg;
      loginSubmit.disabled = false;
      loginSubmit.textContent = "Accedi";
    });
  });

  onAuthStateChanged(auth, function (user) {
    if (user) {
      loginGate.hidden = true;
      appRoot.hidden = false;
      bootApp();
    } else {
      appRoot.hidden = true;
      loginGate.hidden = false;
      loginSubmit.disabled = false;
      loginSubmit.textContent = "Accedi";
    }
  });

  /* ---------- avvio dell'app una volta autenticati ---------- */
  var appBooted = false;
  function bootApp() {
    if (appBooted) return; // evita doppie sottoscrizioni se onAuthStateChanged rifira
    appBooted = true;

    getDoc(doc(db, "travi", "itinerary")).then(function (snap) {
      if (snap.exists()) {
        var data = snap.data();
        TRIP = data.trip || TRIP;
        DAYS = data.days || [];
        SEED_STOPS = data.stops || [];
        innestaCoordinate();
      } else {
        DAYS = [];
        SEED_STOPS = [];
      }
      dataLoaded = true;
      selectedDay.itinerario = defaultDay();
      loadLocalFallback();
      subscribeState();
      renderAll();
      setInterval(renderHome, 60000);
    }).catch(function (err) {
      document.getElementById("view-home").innerHTML =
        '<div style="padding:40px 20px;text-align:center;color:var(--text-muted);">' +
        "Non riesco a leggere i dati del viaggio da Firestore.<br>Controllate le Firestore Rules e che l'itinerario sia stato caricato con admin-seed.html.</div>";
      console.error(err);
    });
  }

  // L'itinerario su Firestore è stato caricato prima che le coordinate
  // esistessero. Invece di riscriverlo (cancellando le vostre modifiche) le
  // innesto qui all'avvio, e SOLO dove mancano: se un giorno l'itinerario verrà
  // ricaricato con le coordinate dentro, questa funzione non farà più nulla.
  function innestaCoordinate() {
    var C = window.TRAVI_COORDS || {};
    SEED_STOPS.forEach(function (s) {
      if (s.lat == null && C[s.id]) { s.lat = C[s.id][0]; s.lon = C[s.id][1]; }
    });
  }

  function subscribeState() {
    unsubState = onSnapshot(
      doc(db, "travi", "state"),
      function (snap) {
        if (snap.exists()) {
          var data = snap.data();
          state.overrides = data.overrides || {};
          state.custom = data.custom || [];
          state.removed = data.removed || [];
          state.budget = data.budget || [];
          state.favorites = data.favorites || [];
          renderAll();
        }
      },
      function () { /* offline: resta il fallback locale */ }
    );
  }

  function loadLocalFallback() {
    try {
      var raw = localStorage.getItem("travi-state");
      if (raw) {
        var parsed = JSON.parse(raw);
        state.overrides = parsed.overrides || {};
        state.custom = parsed.custom || [];
        state.removed = parsed.removed || [];
        state.budget = parsed.budget || [];
        state.favorites = parsed.favorites || [];
      }
    } catch (e) {}
  }

  function persist() {
    renderAll();
    var payload = { overrides: state.overrides, custom: state.custom, removed: state.removed, budget: state.budget, favorites: state.favorites, savedAt: Date.now() };
    try { localStorage.setItem("travi-state", JSON.stringify(payload)); } catch (e) {}
    setDoc(doc(db, "travi", "state"), payload).catch(function () {});
  }

  /* ---------- helpers data/ore ---------- */
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function defaultDay() {
    if (!DAYS.length) return null;
    var t = todayISO();
    var d = DAYS.find(function (x) { return x.date === t; });
    if (d) return d.id;
    if (t < TRIP.start) return DAYS[0].id;
    if (t > TRIP.end) return DAYS[DAYS.length - 1].id;
    return DAYS[0].id;
  }

  function allStops() {
    var merged = SEED_STOPS.concat(state.custom).filter(function (s) { return state.removed.indexOf(s.id) === -1; });
    return merged.map(function (s) {
      var o = state.overrides[s.id];
      return o ? Object.assign({}, s, o) : s;
    });
  }
  function stopsForDay(dayId) {
    return allStops().filter(function (s) { return s.day === dayId; }).sort(function (a, b) { return a.time.localeCompare(b.time); });
  }
  function dayById(id) { return DAYS.find(function (d) { return d.id === id; }); }
  function weekdayShort(dateStr) {
    var wd = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
    var d = new Date(dateStr + "T00:00:00");
    return wd[d.getDay()];
  }
  function dayNum(dateStr) { return parseInt(dateStr.split("-")[2], 10); }
  function timeToMin(t) { var p = t.split(":"); return parseInt(p[0], 10) * 60 + parseInt(p[1], 10); }
  function minToTime(m) { m = ((m % 1440) + 1440) % 1440; var h = Math.floor(m / 60), mm = m % 60; return String(h).padStart(2, "0") + ":" + String(mm).padStart(2, "0"); }

  /* ---------- feedback aptico ----------
     iOS non espone nessuna API di vibrazione alle app web: navigator.vibrate
     esiste su Android, non su Safari. L'unica strada praticabile è l'inganno
     dell'interruttore nascosto (vedi index.html): da iOS 17.4 un
     <input type="checkbox" switch> fa un piccolo tocco aptico di sistema
     quando cambia stato. Qui si prova prima la via ufficiale e poi quella —
     se nessuna delle due è disponibile non succede niente e non si rompe nulla.
     Il colpo è volutamente cortissimo (7ms) e non può ripetersi più di ~18
     volte al secondo: deve essere un accenno, non una vibrazione. */
  var hapticLabel = document.getElementById("haptic-label");
  var ultimoTic = 0;
  function tic() {
    var ora = Date.now();
    if (ora - ultimoTic < 55) return;
    ultimoTic = ora;
    try { if (navigator.vibrate) navigator.vibrate(7); } catch (e) {}
    try { if (hapticLabel) hapticLabel.click(); } catch (e) {}
  }

  // Un tocco ogni volta che scorrendo si passa da un giorno al successivo:
  // il dito sente i giorni "scattare" invece di scivolare su niente.
  function agganciaTicGiorni(el) {
    if (!el) return;
    var ultimoIndice = null;
    el.addEventListener("scroll", function () {
      var pill = el.querySelector(".daypill");
      if (!pill) return;
      var passo = pill.offsetWidth + 8; // larghezza pillola + gap (vedi .dayrow)
      var i = Math.round(el.scrollLeft / passo);
      if (ultimoIndice === null) { ultimoIndice = i; return; }
      if (i !== ultimoIndice) { ultimoIndice = i; tic(); }
    }, { passive: true });
  }
  agganciaTicGiorni(document.getElementById("dayrow-itin"));

  /* ---------- rendering ---------- */
  function renderDayRow(containerId, view) {
    var el = document.getElementById(containerId);
    el.innerHTML = "";
    DAYS.forEach(function (d) {
      var pill = document.createElement("div");
      pill.className = "daypill" + (selectedDay[view] === d.id ? " active" : "");
      pill.innerHTML = '<div class="dw">' + weekdayShort(d.date) + '</div><div class="dn num">' + dayNum(d.date) + "</div>";
      pill.addEventListener("click", function () { tic(); selectedDay[view] = d.id; renderAll(); });
      el.appendChild(pill);
    });
  }

  function iconFor(c) { return '<svg><use href="#' + cat(c).icon + '"/></svg>'; }
  function tIconFor(m) { return '<svg><use href="#' + transp(m).icon + '"/></svg>'; }
  // Le 52 tappe originali hanno una foto vera scelta a mano (s.img). Una tappa
  // aggiunta da voi o messa nei Preferiti non ce l'ha: s.foto è quella trovata
  // in automatico su Wikimedia al salvataggio (vedi js/foto.js). Se anche
  // quella manca (posto non trovato, o ricerca ancora in corso), il segnaposto
  // generico è comunque una foto vera dell'app, non un div vuoto.
  function imgFor(s) {
    if (s && s.img) return "assets/img/" + s.img + ".jpg";
    if (s && s.foto) return s.foto;
    return "assets/img/luogo-generico.jpg";
  }

  /* ---------- stato della giornata ----------
     Il pannello compare SOLO nel giorno in cui vi trovate davvero: in un giorno
     futuro dire "sei in ritardo" non vuol dire niente, e in uno passato nemmeno.
     Tutto il calcolo sta in js/giornata.js, qui c'è solo il disegno. */
  var ETICHETTA = { chiusa: "NON CI ARRIVI", incompleta: "TROPPO POCO", stretta: "PER UN PELO" };

  // Simulazione: permette di guardare una giornata a un'ora diversa da adesso.
  // Non è uno strumento da sviluppatore, è una funzione vera — la sera prima
  // serve sapere che se domani si parte alle 10 invece che alle 9 salta l'ultima
  // tappa. Vive qui dentro e non in una pagina a parte perché i dati del viaggio
  // stanno dietro il login e non sono pubblicati (vedi .gitignore).
  var simula = { attiva: false, minuti: 9 * 60 };

  function oraDiAdesso() {
    var o = new Date();
    return o.getHours() * 60 + o.getMinutes();
  }

  function renderStatoGiornata(dayId, list) {
    var box = document.getElementById("stato-giornata");
    if (!box || !window.Giornata) return;
    var d = dayById(dayId);
    if (!d) { box.innerHTML = ""; return; }

    var oggi = d.date === todayISO();
    if (!oggi && !simula.attiva) {
      box.innerHTML = '<button class="prova-apri" id="prova-apri">Prova questa giornata a un altro orario</button>';
      document.getElementById("prova-apri").onclick = function () {
        simula.attiva = true;
        var prima = list.length ? window.Giornata.min(list[0].time) : 9 * 60;
        simula.minuti = prima != null ? prima : 9 * 60;
        renderStatoGiornata(dayId, list);
      };
      return;
    }

    var minuti = simula.attiva ? simula.minuti : oraDiAdesso();
    var e = window.Giornata.calcola(list, minuti, window.TRAVI_ORARI);

    var html = "";
    if (simula.attiva) {
      html += '<div class="prova-barra">' +
        '<b id="prova-ora">' + window.Giornata.hhmm(minuti) + "</b>" +
        '<input type="range" id="prova-slider" min="300" max="1380" step="5" value="' + minuti + '">' +
        '<button id="prova-chiudi">✕</button></div>';
    }

    if (e.stato === "finita") {
      html += '<div class="stato-g bene"><div class="cap"><div class="titolo">Giornata completata</div></div></div>';
      box.innerHTML = html;
      agganciaProva(dayId, list);
      return;
    }

    var inRitardo = e.ritardo > 15;
    var titolo;
    if (e.stato === "non-iniziata") titolo = "Non ancora cominciata";
    else if (inRitardo) titolo = "In ritardo di " + e.ritardo + " min";
    else if (e.ritardo < -15) titolo = "In anticipo di " + Math.abs(e.ritardo) + " min";
    else titolo = "In orario";

    html += '<div class="stato-g ' + (e.problemi.length ? "tardi" : (inRitardo ? "" : "bene")) + '">' +
      '<div class="cap"><div class="titolo">' + titolo + "</div>" +
      '<div class="fine">fine prevista ' + e.finePrevista + "</div></div>";

    // Solo le tappe che restano, e solo quelle che meritano una riga: le prime
    // due comunque, più tutte quelle con un problema. Un elenco lungo qui
    // diventerebbe una seconda lista sopra la lista.
    e.previsioni.forEach(function (p, i) {
      if (i > 1 && p.verdetto === "ok") return;
      var eti = ETICHETTA[p.verdetto]
        ? '<div class="esito e-' + p.verdetto + '">' + ETICHETTA[p.verdetto] + "</div>" : "";
      html += '<div class="riga"><div class="ora">' + p.arrivoOra + "</div>" +
              '<div class="che">' + escapeHtml(p.title) +
              (p.chiudeOra ? ' <span style="color:var(--text-muted)">· chiude ' + p.chiudeOra + "</span>" : "") +
              "</div>" + eti + "</div>";
    });

    var ETI_PRIO = { top: "imperdibile", norm: "normale", extra: "se avanza" };
    var sug = e.suggerimento;
    if (sug && sug.tipo === "sacrifica") {
      var salvate = sug.problemiRisolti.map(function (p) {
        return "<b>" + escapeHtml(p.title) + "</b>" +
               (p.prio === "top" ? " (imperdibile)" : "");
      }).join(", ");
      html += '<div class="consiglio">Rinunciando a <b>' + escapeHtml(sug.titolo) + "</b> (" +
              ETI_PRIO[sug.prio] + ", " + sug.durata + " min) arrivate ancora a " + salvate + ".</div>";
    } else if (sug && sug.tipo === "rinuncia") {
      var top = sug.imperdibiliPerse || [];
      html += '<div class="consiglio">' +
        (top.length
          ? "Non c'è più niente da tagliare, e fra quelle che saltano c'è <b>" +
            top.map(function (p) { return escapeHtml(p.title); }).join("</b> e <b>") + "</b>."
          : "Non c'è più niente da tagliare che basti: <b>" +
            sug.perse.map(function (p) { return escapeHtml(p.title); }).join("</b> e <b>") +
            "</b> non ci stanno più.") + "</div>";

      // Travi conosce tutti i giorni: invece di lasciare la decisione a voi in
      // mezzo alla strada, guarda se un altro giorno nella stessa città ha
      // spazio davvero — verificato, non ipotizzato.
      var daSpostare = (top.length ? top : sug.perse)[0];
      var alt = trovaGiorniAlternativi(daSpostare.id, dayId);
      if (alt && alt.length) {
        var a = alt[0];
        html += '<div class="consiglio">Il <b>' + a.date.slice(8) + "/" + a.date.slice(5, 7) +
          "</b> siete ancora a " + escapeHtml(a.city) + " e quel giorno finirebbe alle " +
          a.fineCon + ": c'è spazio per <b>" + escapeHtml(daSpostare.title) + "</b>." +
          '<button class="sposta" data-tappa="' + daSpostare.id + '" data-giorno="' + a.id +
          '" data-dopo="' + (a.dopoDi ? escapeHtml(a.dopoDi) : "") + '">Sposta lì</button></div>';
      }
    }

    if (!simula.attiva) {
      html += '<button class="prova-apri dentro" id="prova-apri">Prova a un altro orario</button>';
    }
    box.innerHTML = html + "</div>";
    agganciaProva(dayId, list);
  }

  // Prepara per il motore tutti i giorni del viaggio con le loro tappe, così
  // può cercare dove ricollocare una tappa che oggi non ci sta.
  function trovaGiorniAlternativi(stopId, dayId) {
    if (!window.Giornata || !window.Giornata.giorniAlternativi) return [];
    var tappa = allStops().find(function (x) { return x.id === stopId; });
    var oggi = dayById(dayId);
    if (!tappa || !oggi) return [];
    var giorni = DAYS.map(function (d) {
      return { id: d.id, date: d.date, city: d.city, tappe: stopsForDay(d.id) };
    });
    return window.Giornata.giorniAlternativi(tappa, giorni, dayId, window.TRAVI_ORARI, oggi.city);
  }

  // Sposta davvero la tappa: cambia il giorno e le dà un orario coerente con
  // la posizione trovata dal motore, così non finisce in fondo alla lista.
  function spostaTappa(stopId, versoGiorno, dopoTitolo) {
    var tappa = allStops().find(function (x) { return x.id === stopId; });
    if (!tappa) return;
    var dest = stopsForDay(versoGiorno);
    var nuovaOra = "09:00";
    if (dopoTitolo) {
      var rif = dest.find(function (x) { return x.title === dopoTitolo; });
      if (rif) {
        var m = window.Giornata.min(rif.time) + (rif.dur || 0) + 15;
        nuovaOra = window.Giornata.hhmm(m).replace("+1", "");
      }
    } else if (dest.length) {
      nuovaOra = window.Giornata.hhmm(Math.max(0, window.Giornata.min(dest[0].time) - 60));
    }
    var patch = { day: versoGiorno, time: nuovaOra };
    var isCustom = state.custom.some(function (c) { return c.id === stopId; });
    if (isCustom) {
      state.custom = state.custom.map(function (c) {
        return c.id === stopId ? Object.assign({}, c, patch) : c;
      });
    } else {
      state.overrides[stopId] = Object.assign({}, state.overrides[stopId] || {}, patch);
    }
    persist();
    toast("Spostata al " + (dayById(versoGiorno) || {}).date);
  }

  function agganciaProva(dayId, list) {
    var sp = document.querySelector(".consiglio .sposta");
    if (sp) sp.onclick = function () {
      spostaTappa(this.dataset.tappa, this.dataset.giorno, this.dataset.dopo || null);
    };
    var apri = document.getElementById("prova-apri");
    if (apri) apri.onclick = function () {
      simula.attiva = true; simula.minuti = oraDiAdesso();
      renderStatoGiornata(dayId, list);
    };
    var chiudi = document.getElementById("prova-chiudi");
    if (chiudi) chiudi.onclick = function () {
      simula.attiva = false; renderStatoGiornata(dayId, list);
    };
    var sl = document.getElementById("prova-slider");
    if (sl) sl.oninput = function () {
      simula.minuti = +this.value;
      renderStatoGiornata(dayId, list);
      var n = document.getElementById("prova-slider");
      if (n) { n.focus(); } // resta sotto il dito mentre si trascina
    };
  }

  // Segna/toglie "fatto" direttamente dalla lista, senza aprire il foglio:
  // è l'azione che serve più spesso durante il viaggio vero, quindi deve
  // costare un tocco solo.
  function toggleDone(id) {
    var cur = allStops().find(function (x) { return x.id === id; });
    if (!cur) return;
    var novo = !cur.done;
    var isCustom = state.custom.some(function (c) { return c.id === id; });
    if (isCustom) {
      state.custom = state.custom.map(function (c) { return c.id === id ? Object.assign({}, c, { done: novo }) : c; });
    } else {
      state.overrides[id] = Object.assign({}, state.overrides[id] || {}, { done: novo });
    }
    persist();
  }

  function renderItinerario() {
    if (!DAYS.length || !selectedDay.itinerario) return;
    document.getElementById("itin-city").textContent = dayById(selectedDay.itinerario).city;
    document.getElementById("itin-theme").textContent = dayById(selectedDay.itinerario).theme;
    var list = stopsForDay(selectedDay.itinerario);
    renderStatoGiornata(selectedDay.itinerario, list);
    var el = document.getElementById("stoplist");
    el.innerHTML = "";
    list.forEach(function (s) {
      var prio = window.Giornata ? window.Giornata.prioDi(s) : (s.prio || "norm");
      var card = document.createElement("div");
      card.className = "stopcard" + (s.done ? " done" : "");
      card.innerHTML =
        '<div class="thumb" style="background-image:url(\'' + imgFor(s) + '\')">' +
        (prio === "top" ? '<span class="prio-badge"><svg><use href="#ic-star"/></svg></span>' : "") +
        "</div>" +
        '<div class="content">' +
        '<div class="meta-top"><span class="time num">' + s.time + "</span>" +
        (s.locked ? '<span class="lockdot">🔒</span>' : "") + "</div>" +
        '<div class="title">' + escapeHtml(s.title) + "</div>" +
        '<div class="sub">' + escapeHtml(s.sub || "") + "</div>" +
        '<div class="tags">' +
        '<span class="chip">' + iconFor(s.cat) + cat(s.cat).label + "</span>" +
        (s.dur ? '<span class="chip">' + s.dur + " min</span>" : "") +
        (s.tmin ? '<span class="chip">' + tIconFor(s.tmode) + s.tmin + " min</span>" : "") +
        (s.locked ? '<span class="chip locked-chip">🔒 Confermato</span>' : "") +
        "</div>" +
        "</div>" +
        '<button class="quickdone' + (s.done ? " on" : "") + '" aria-label="Segna come completata"><svg><use href="#ic-check"/></svg></button>';
      card.addEventListener("click", function () { openSheet(s.id); });
      card.querySelector(".quickdone").addEventListener("click", function (e) {
        e.stopPropagation();
        toggleDone(s.id);
      });
      el.appendChild(card);
    });
    if (list.length === 0) {
      el.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:30px 10px;font-size:.85rem;">Nessuna tappa per questo giorno. Aggiungetene una qui sotto.</div>';
    }
  }

  // Mappa vera (Leaflet + Stadia Alidade Smooth), a schermo intero. Il giorno
  // mostrato è SEMPRE quello scelto in Itinerario — niente selettore proprio:
  // Itinerario resta l'unica fonte di verità su "che giorno stiamo guardando".
  // Il fondo mappa è autorizzato per dominio nel pannello Stadia, quindi qui
  // non c'è nessuna chiave: se un giorno le piastrelle sparissero, è là che va
  // aggiunto il dominio nuovo.
  var mappa = null, stratoTappe = null, markerRefs = [], mapSelIdx = 0, mapLastDay = null, mapPunti = [];

  function creaMappa() {
    if (mappa || typeof L === "undefined") return mappa;
    mappa = L.map("map", { zoomControl: true, attributionControl: true });
    L.tileLayer("https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; OpenStreetMap',
      maxZoom: 19
    }).addTo(mappa);
    stratoTappe = L.layerGroup().addTo(mappa);
    mappa.setView([35.68, 139.76], 11);
    return mappa;
  }

  function iconaPin(numero, selezionata) {
    return L.divIcon({
      className: "", html: '<div class="pin-num' + (selezionata ? " sel" : "") + '">' + numero + "</div>",
      iconSize: [26, 26], iconAnchor: [13, 13]
    });
  }

  function renderMappa() {
    if (!DAYS.length || !selectedDay.itinerario) return;
    var dayId = selectedDay.itinerario;
    var list = stopsForDay(dayId);
    var day = dayById(dayId);

    var pill = document.getElementById("map-daypill");
    if (pill && day) pill.textContent = day.city + " · " + weekdayShort(day.date) + " " + dayNum(day.date);

    // Quando si cambia giorno si riparte dalla prossima tappa non fatta;
    // dentro lo stesso giorno la selezione (tappa scelta col tocco o con le
    // frecce) resta dov'era.
    if (dayId !== mapLastDay) {
      mapLastDay = dayId;
      var primoNonFatto = list.findIndex(function (s) { return !s.done; });
      mapSelIdx = primoNonFatto === -1 ? 0 : primoNonFatto;
    }
    if (mapSelIdx >= list.length) mapSelIdx = Math.max(0, list.length - 1);

    // Pin numerati + percorso del giorno. I numeri corrispondono all'ordine
    // delle tappe, così mappa e card in basso si leggono insieme.
    var m = creaMappa();
    markerRefs = [];
    mapPunti = [];
    if (m) {
      stratoTappe.clearLayers();
      var punti = mapPunti;
      list.forEach(function (s, i) {
        if (s.lat == null || s.lon == null) return;
        var mk = L.marker([s.lat, s.lon], { icon: iconaPin(i + 1, i === mapSelIdx) }).addTo(stratoTappe);
        mk.on("click", (function (idx) { return function () { selezionaTappaMappa(idx); }; })(i));
        markerRefs[i] = mk;
        punti.push([s.lat, s.lon]);
      });
      if (punti.length > 1) {
        L.polyline(punti, { color: "#F5503C", weight: 3, opacity: .6, dashArray: "6 7" })
          .addTo(stratoTappe);
      }
      inquadraGiornata();
    }

    aggiornaMapCard(list);
  }

  // Inquadratura di partenza: TUTTE le tappe del giorno nello schermo, senza
  // doverle cercare a mano con zoom avanti e indietro. Va rifatta quando la
  // pagina Mappa torna visibile: se la mappa viene disegnata mentre la vista è
  // nascosta, Leaflet misura un contenitore alto zero e l'inquadratura esce
  // sbagliata (era questo il motivo per cui bisognava sempre rizoomare).
  function inquadraGiornata() {
    if (!mappa || !mapPunti.length) return;
    mappa.invalidateSize();
    if (mapPunti.length === 1) mappa.setView(mapPunti[0], 15);
    else mappa.fitBounds(mapPunti, { padding: [40, 70] });
  }

  // Tocco su un pin, o sulle frecce della card: cambia solo quale tappa è
  // "a fuoco" in basso, senza ridisegnare tutta la mappa.
  function selezionaTappaMappa(idx) {
    mapSelIdx = idx;
    markerRefs.forEach(function (mk, i) {
      if (mk) mk.setIcon(iconaPin(i + 1, i === idx));
    });
    var list = stopsForDay(selectedDay.itinerario);
    var s = list[idx];
    // Toccare un numero entra nel dettaglio di quella tappa: si vede la via,
    // non più la città intera. Il tasto in basso a destra rimette in quadro
    // tutta la giornata.
    if (s && s.lat != null && mappa) {
      mappa.setView([s.lat, s.lon], Math.max(mappa.getZoom(), 16), { animate: true });
    }
    aggiornaMapCard(list);
  }

  function aggiornaMapCard(list) {
    var body = document.getElementById("map-card-body");
    if (!body) return;
    var s = list[mapSelIdx];
    if (!s) {
      body.innerHTML = '<div class="empty">Nessuna tappa da mostrare per questo giorno.</div>';
      return;
    }
    var o = (window.TRAVI_ORARI || {})[s.id];
    var chiude = (o && o.tipo === "orari") ? ("chiude " + o.ch) : "";

    // Quanto ci vuole per arrivarci dalla tappa precedente: il tempo previsto
    // nei dati se c'è, altrimenti la stima a piedi dalle coordinate — lo
    // stesso numero che usa il motore della giornata (js/giornata.js).
    var tempo = "", prec = mapSelIdx > 0 ? list[mapSelIdx - 1] : null;
    if (s.tmin) {
      tempo = s.tmin + " min " + (s.tmode === "walk" ? "a piedi" : "di spostamento");
    } else if (prec && window.Giornata) {
      var km = window.Giornata.kmTra(prec, s);
      var piedi = window.Giornata.minutiAPiedi(prec, s);
      if (piedi != null && km != null && km <= 5) tempo = piedi + " min a piedi";
    }

    // Riga tempi: quanto ci vuole ad arrivarci e, se chiude, a che ora — sono
    // le due cose che servono guardando la mappa in mezzo alla strada.
    var riga2 = [tempo, chiude].filter(Boolean).join(" · ");
    body.innerHTML =
      '<div class="thumb" style="background-image:url(\'' + imgFor(s) + '\')"></div>' +
      '<div class="info">' +
      '<div class="title">' + escapeHtml(s.title) + "</div>" +
      '<div class="sub">' + s.time + (s.sub ? " · " + escapeHtml(s.sub) : "") + "</div>" +
      (riga2 ? '<div class="tempo"><svg><use href="#ic-walk"/></svg>' + riga2 + "</div>" : "") +
      "</div>" +
      '<svg class="chev"><use href="#ic-chev"/></svg>';
    body.onclick = function () { openSheet(s.id); };
  }

  function renderHome() {
    if (!DAYS.length) return;
    var now = new Date();
    var isTripLive = todayISO() >= TRIP.start && todayISO() <= TRIP.end;
    var refDayId = isTripLive ? defaultDay() : DAYS[0].id;
    var refDay = dayById(refDayId);
    if (!refDay) return;

    document.getElementById("hero-city").textContent = refDay.city;
    document.getElementById("hero-date").textContent = formatDateLong(refDay.date) + " · " + refDay.theme;
    var hr = now.getHours();
    var greet = hr < 12 ? "Buongiorno" : hr < 18 ? "Buon pomeriggio" : "Buonasera";
    document.getElementById("hero-phase").textContent = greet + ", Sebastian & Alessandra" + (isTripLive ? " — siete in viaggio" : "");
    updateWeather(refDay);

    var list = stopsForDay(refDayId);
    var done = list.filter(function (s) { return s.done; }).length;
    document.getElementById("home-count").innerHTML = list.length + " <small>luoghi in programma</small>";
    var pct = list.length ? Math.round((done / list.length) * 100) : 0;
    document.getElementById("home-pct").textContent = pct + "%";
    var ring = document.getElementById("ring-fg");
    if (ring) {
      var circ = 263.9; // 2·π·42 (raggio del cerchio in index.html)
      ring.style.strokeDashoffset = String(circ - (circ * pct / 100));
    }
    document.getElementById("home-done-lbl").textContent =
      done === 0 ? "Nessuna tappa completata ancora" :
      (done === list.length ? "Giornata completata" : done + " di " + list.length + " completate");
    document.getElementById("home-stops-total").textContent = allStops().length;

    var startDiff = Math.ceil((new Date(TRIP.start + "T09:00:00") - now) / 86400000);

    if (!isTripLive && startDiff > 0) {
      document.getElementById("hero-big").textContent = startDiff;
      document.getElementById("hero-lbl").textContent = "giorni al vostro primo passo in Giappone.";
    } else if (!isTripLive && startDiff <= 0) {
      document.getElementById("hero-big").textContent = "🎊";
      document.getElementById("hero-lbl").textContent = "Il viaggio è concluso: ogni tappa resta qui, pronta da rivivere.";
    } else {
      document.getElementById("hero-big").textContent = refDay.city;
      document.getElementById("hero-lbl").textContent = refDay.theme + " — oggi è il giorno " + (DAYS.findIndex(function (d) { return d.id === refDayId; }) + 1) + " di " + DAYS.length + ".";
    }

    var pending = list.filter(function (s) { return !s.done; });
    var next = pending[0];
    var glyph = document.getElementById("next-glyph");
    if (next) {
      document.getElementById("next-title").textContent = next.title;
      glyph.classList.add("has-img");
      glyph.style.backgroundImage = "url('" + imgFor(next) + "')";
      var mins = timeToMin(next.time) - (now.getHours() * 60 + now.getMinutes());
      var whenTxt = next.time + (next.sub ? " · " + next.sub : "");
      if (isTripLive && refDayId === defaultDay() && mins > 0 && mins < 600) {
        whenTxt = "tra " + mins + " min · " + next.sub;
      }
      document.getElementById("next-meta").textContent = whenTxt;
      document.getElementById("next-card").onclick = function () { switchView("itinerario"); selectedDay.itinerario = refDayId; renderAll(); };
    } else {
      document.getElementById("next-title").textContent = list.length ? "Giornata completata" : "Nessuna tappa";
      document.getElementById("next-meta").textContent = list.length ? "Bel lavoro — godetevi il resto della giornata." : "Aggiungete la prima tappa dall'Itinerario.";
      glyph.classList.remove("has-img");
      glyph.style.backgroundImage = "";
    }
  }

  /* ---------- meteo live (Open-Meteo: gratuito, senza chiave API) ----------
     Le previsioni reali coprono solo circa le prossime 2 settimane: finché il
     viaggio è più lontano di così, resta il testo statico "clima tipico" già
     nell'HTML. Quando ci si avvicina, questo lo sostituisce in automatico con
     una previsione vera per la città del giorno. */
  var weatherFetchedFor = null;
  // Codici WMO (li usa Open-Meteo) ridotti alle famiglie che contano per un
  // colpo d'occhio: icona + parola, non il bollettino completo.
  var WMO = {
    0: ["ic-sun", "Sereno"], 1: ["ic-sun", "Poco nuvoloso"], 2: ["ic-cloud", "Parzialmente nuvoloso"], 3: ["ic-cloud", "Nuvoloso"],
    45: ["ic-cloud", "Nebbia"], 48: ["ic-cloud", "Nebbia"],
    51: ["ic-rain", "Pioggerella"], 53: ["ic-rain", "Pioggerella"], 55: ["ic-rain", "Pioggerella"],
    61: ["ic-rain", "Pioggia debole"], 63: ["ic-rain", "Pioggia"], 65: ["ic-rain", "Pioggia forte"],
    71: ["ic-snow", "Neve debole"], 73: ["ic-snow", "Neve"], 75: ["ic-snow", "Neve forte"],
    80: ["ic-rain", "Rovesci"], 81: ["ic-rain", "Rovesci"], 82: ["ic-rain", "Rovesci forti"],
    95: ["ic-rain", "Temporale"], 96: ["ic-rain", "Temporale"], 99: ["ic-rain", "Temporale"]
  };
  function updateWeather(refDay) {
    if (!refDay) return;
    var today = new Date();
    var dayDate = new Date(refDay.date + "T00:00:00");
    var daysUntil = Math.round((dayDate - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000);
    if (daysUntil < 0 || daysUntil > 15) return; // fuori dalla finestra di previsione: resta il testo statico
    var cacheKey = refDay.date;
    if (weatherFetchedFor === cacheKey) return;
    var city = cityKeyFor(refDay.city);
    var coords = CITY_COORDS[city];
    if (!coords) return;
    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + coords.lat + "&longitude=" + coords.lon +
      "&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=Asia%2FTokyo&start_date=" + refDay.date + "&end_date=" + refDay.date;
    fetch(url).then(function (r) { return r.json(); }).then(function (data) {
      if (!data || !data.daily || !data.daily.temperature_2m_max || !data.daily.temperature_2m_max.length) return;
      weatherFetchedFor = cacheKey;
      var lo = Math.round(data.daily.temperature_2m_min[0]);
      var hi = Math.round(data.daily.temperature_2m_max[0]);
      var code = data.daily.weathercode ? data.daily.weathercode[0] : null;
      var info = WMO[code] || null;
      var tEl = document.getElementById("weather-t");
      var cEl = document.getElementById("weather-cond");
      var iEl = document.getElementById("weather-icon");
      if (tEl) tEl.textContent = lo + "–" + hi + "°";
      if (cEl) cEl.textContent = (info ? info[1] : "Previsione") + " per " + city;
      if (iEl && info) { var use = iEl.querySelector("use"); if (use) use.setAttribute("href", "#" + info[0]); }
    }).catch(function () { /* offline o API non raggiungibile: resta il testo statico */ });
  }

  function formatDateLong(dateStr) {
    var months = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
    var d = new Date(dateStr + "T00:00:00");
    return d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function renderAll() {
    if (!dataLoaded) return;
    renderDayRow("dayrow-itin", "itinerario");
    renderItinerario();
    renderMappa();
    renderHome();
    renderBudget();
    renderPreferiti();
  }

  // Frecce della card della Mappa: cambiano solo la tappa a fuoco, come
  // toccare un pin diverso. Collegate una volta sola, non ad ogni render.
  document.getElementById("map-prev").addEventListener("click", function () {
    var list = stopsForDay(selectedDay.itinerario);
    if (!list.length) return;
    selezionaTappaMappa((mapSelIdx - 1 + list.length) % list.length);
  });
  document.getElementById("map-next").addEventListener("click", function () {
    var list = stopsForDay(selectedDay.itinerario);
    if (!list.length) return;
    selezionaTappaMappa((mapSelIdx + 1) % list.length);
  });
  // La pillola in alto RIPORTA il giorno scelto in Itinerario, non lo sceglie:
  // toccarla porta all'Itinerario, dove il giorno si cambia davvero.
  document.getElementById("map-daypill").addEventListener("click", function () { switchView("itinerario"); });
  document.getElementById("map-fit").addEventListener("click", inquadraGiornata);

  /* ---------- budget extra ---------- */
  function fmtEuro(n) {
    return "€" + (Math.round(n * 100) / 100).toLocaleString("it-IT", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  }
  function whoLabel(id) {
    var w = BUDGET_WHO.find(function (x) { return x.id === id; });
    return w ? w.label : id;
  }
  function renderBudget() {
    var total = state.budget.reduce(function (sum, it) { return sum + (Number(it.amount) || 0); }, 0);
    document.getElementById("budget-total-home").textContent = fmtEuro(total);
    document.getElementById("budget-count-home").textContent = state.budget.length + (state.budget.length === 1 ? " spesa" : " spese");
    var totalEl = document.getElementById("budget-total");
    if (totalEl) totalEl.textContent = fmtEuro(total);
    var list = document.getElementById("budget-list");
    if (!list) return;
    list.innerHTML = "";
    if (!state.budget.length) {
      list.innerHTML = '<div class="budget-empty">Nessuna spesa extra registrata ancora.</div>';
      return;
    }
    state.budget.slice().sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); }).forEach(function (it) {
      var row = document.createElement("div");
      row.className = "budget-item";
      row.innerHTML =
        '<div class="bi-main"><div class="bi-title">' + escapeHtml(it.title) + '</div><div class="bi-who">' + whoLabel(it.who) + '</div></div>' +
        '<div class="bi-amount num">' + fmtEuro(Number(it.amount) || 0) + '</div>' +
        '<button class="bi-del" data-id="' + it.id + '">✕</button>';
      row.querySelector(".bi-del").addEventListener("click", function () {
        state.budget = state.budget.filter(function (x) { return x.id !== it.id; });
        persist();
      });
      list.appendChild(row);
    });
  }

  /* ---------- view switching ---------- */
  function switchView(name) {
    document.querySelectorAll(".view").forEach(function (v) { v.classList.remove("active"); });
    var view = document.getElementById("view-" + name);
    view.classList.add("active");
    document.querySelectorAll(".tab").forEach(function (t) { t.classList.toggle("active", t.dataset.view === name); });
    // Il "+" fluttuante serve sia in Itinerario (nuova tappa) sia in Preferiti
    // (nuovo preferito): cosa apre dipende da dove ci si trova.
    var fabAdd = document.getElementById("fab-add");
    fabAdd.style.display = (name === "itinerario" || name === "preferiti") ? "flex" : "none";
    fabAdd.onclick = (name === "preferiti") ? function () { openFavSheet(); } : function () { openSheet(null); };
    // ogni volta che si cambia pagina dal menu, si riparte sempre dall'inizio di quella pagina
    var sc = view.querySelector(".scroll");
    if (sc) sc.scrollTop = 0;
    // Leaflet misura il contenitore quando lo crea: se la vista era nascosta
    // trova altezza zero e disegna la mappa storta. Va rimisurata ogni volta
    // che la pagina Mappa torna visibile.
    if (name === "mappa" && mappa) { setTimeout(inquadraGiornata, 60); }
  }
  document.querySelectorAll(".tab").forEach(function (t) {
    t.addEventListener("click", function () { switchView(t.dataset.view); });
  });

  /* ---------- sheet (add/edit stop) ---------- */
  var backdrop = document.getElementById("backdrop");
  var sheet = document.getElementById("sheet");

  function buildPickrow(containerId, items) {
    var el = document.getElementById(containerId);
    el.innerHTML = "";
    items.forEach(function (it) {
      var p = document.createElement("div");
      p.className = "pick";
      p.dataset.id = it.id;
      p.innerHTML = (it.icon ? '<svg><use href="#' + it.icon + '"/></svg>' : "") + it.label;
      p.addEventListener("click", function () {
        el.querySelectorAll(".pick").forEach(function (x) { x.classList.remove("sel"); });
        p.classList.add("sel");
      });
      el.appendChild(p);
    });
  }
  buildPickrow("f-category", CATS);
  buildPickrow("f-transport", TRANSPORTS);
  buildPickrow("f-priorita", PRIORITA);
  buildPickrow("f-duration-chips", DURATA_OPTS);
  buildPickrow("fav-category", CATS);
  buildPickrow("fav-priorita", PRIORITA);

  // Sceglie il chip di durata più vicino a un valore qualunque (dati vecchi,
  // o una tappa senza durata mai compilata): il campo non è mai vuoto.
  function selectDurataVicina(dur) {
    var target = dur || 30;
    var migliore = DURATA_OPTS[0], diffMin = Infinity;
    DURATA_OPTS.forEach(function (o) {
      var diff = Math.abs(parseInt(o.id, 10) - target);
      if (diff < diffMin) { diffMin = diff; migliore = o; }
    });
    selectPick("f-duration-chips", migliore.id);
  }

  function selectPick(containerId, id) {
    document.getElementById(containerId).querySelectorAll(".pick").forEach(function (p) {
      p.classList.toggle("sel", p.dataset.id === id);
    });
  }
  function getPick(containerId) {
    var sel = document.getElementById(containerId).querySelector(".pick.sel");
    return sel ? sel.dataset.id : null;
  }

  // Con un foglio aperto, il dito che scorreva sopra il foglio faceva scorrere
  // la PAGINA SOTTO invece del foglio: iOS passa il gesto al contenitore
  // sottostante quando il contenuto del foglio non ha niente da scorrere.
  // Finché un foglio è aperto, la vista sotto resta ferma.
  function bloccaSfondo(bloccato) {
    document.querySelectorAll(".scroll").forEach(function (el) {
      el.style.overflowY = bloccato ? "hidden" : "auto";
    });
  }

  // Un posto senza coordinate non può avere un pin sulla mappa. Se è stato
  // scritto a mano invece che scelto dalla ricerca, le cerchiamo noi in
  // background: così qualunque tappa aggiunta — anche partendo dai Preferiti —
  // finisce da sola sulla mappa col suo numero, senza doverci pensare.
  function trovaCoordinate(titolo, zona) {
    if (!window.TraviCerca) return Promise.resolve(null);
    return window.TraviCerca.cerca((titolo + " " + (zona || "")).trim()).then(function (r) {
      return (r && r.length) ? { lat: r[0].lat, lon: r[0].lon } : null;
    }).catch(function () { return null; });
  }

  // Applica una modifica a una tappa, che sia una aggiunta da voi (custom) o
  // una del programma originale (dove le modifiche vivono negli overrides).
  function applicaPatchTappa(id, patch) {
    var isCustom = state.custom.some(function (c) { return c.id === id; });
    if (isCustom) {
      state.custom = state.custom.map(function (c) { return c.id === id ? Object.assign({}, c, patch) : c; });
    } else {
      state.overrides[id] = Object.assign({}, state.overrides[id] || {}, patch);
    }
    persist();
  }

  // Ricordano, per la tappa in modifica, ciò che non ha un campo di testo suo:
  // la posizione trovata cercando il posto, e una foto già presente da non
  // ricercare di nuovo se non cambia il posto.
  var sheetLatLon = null, sheetExistingFoto = null;

  function openSheet(stopId) {
    editingId = stopId || null;
    var s = editingId ? allStops().find(function (x) { return x.id === editingId; }) : null;
    var locked = !!(s && s.locked);
    sheetLatLon = (s && s.lat != null) ? { lat: s.lat, lon: s.lon } : null;
    sheetExistingFoto = (s && s.foto) ? s.foto : null;

    document.getElementById("sheet-title").textContent = s ? "Modifica tappa" : "Nuova tappa";
    document.getElementById("f-cerca").value = "";
    document.getElementById("cerca-risultati").hidden = true;
    document.getElementById("f-title").value = s ? s.title : "";
    document.getElementById("f-sub").value = s ? s.sub || "" : "";
    document.getElementById("f-time").value = s ? s.time : "09:00";
    selectDurataVicina(s ? s.dur : 30);
    document.getElementById("f-travel").value = s ? s.tmin || 0 : 0;
    document.getElementById("f-notes").value = s ? s.notes || "" : "";
    selectPick("f-category", s ? s.cat : "experience");
    selectPick("f-transport", s ? s.tmode : "walk");
    // Se la tappa non ha una priorità sua, si mostra quella dedotta dalla
    // categoria: così il campo non è mai vuoto e si capisce cosa farà il motore.
    selectPick("f-priorita", (s && window.Giornata) ? window.Giornata.prioDi(s)
               : (s && s.prio) || "norm");
    var done = !!(s && s.done);
    var fDone = document.getElementById("f-done");
    fDone.classList.toggle("on", done);
    etichettaFatto(fDone);
    document.getElementById("btn-delete").style.display = (s && !locked) ? "block" : "none";
    document.getElementById("lock-note").hidden = !locked;
    sheet.querySelector(".sheet-body").classList.toggle("locked", locked);
    ["f-title", "f-sub", "f-time", "f-travel", "f-notes"].forEach(function (id) {
      document.getElementById(id).disabled = locked;
    });

    // Link rapidi verso Google/Apple Maps: solo su una tappa che già esiste
    // (per una nuova non c'è ancora niente da aprire).
    var gmaps = document.getElementById("link-gmaps");
    if (s) {
      gmaps.hidden = false;
      var gq = encodeURIComponent(s.q || (s.title + " " + (s.sub || "")));
      gmaps.href = "https://www.google.com/maps/search/?api=1&query=" + gq;
      document.getElementById("link-amaps").href = "https://maps.apple.com/?q=" + gq;
    } else {
      gmaps.hidden = true;
    }

    // Testa illustrata: foto + nome + zona. Solo su una tappa che esiste già.
    // E se la tappa esiste già, i campi del nome partono chiusi (il nome è
    // scritto sulla foto): il foglio si apre corto, con davanti solo le cose
    // che si toccano davvero durante la giornata.
    document.getElementById("sez-posto").hidden = !!s;
    document.getElementById("posto-toggle").hidden = !s;
    document.getElementById("posto-toggle").classList.remove("open");

    var hero = document.getElementById("sheet-hero");
    if (s) {
      hero.hidden = false;
      document.getElementById("sheet-hero-img").style.backgroundImage = "url('" + imgFor(s) + "')";
      document.getElementById("sheet-hero-title").textContent = s.title;
      document.getElementById("sheet-hero-sub").textContent = s.time + (s.sub ? " · " + s.sub : "");
      var prioTop = window.Giornata ? window.Giornata.prioDi(s) === "top" : s.prio === "top";
      document.getElementById("sheet-hero-prio").hidden = !prioTop;
    } else {
      hero.hidden = true;
    }

    document.getElementById("altro-body").hidden = true;
    document.getElementById("altro-toggle").classList.remove("open");

    backdrop.classList.add("show");
    sheet.classList.add("show");
    bloccaSfondo(true);
  }
  function closeSheet() {
    backdrop.classList.remove("show");
    sheet.classList.remove("show");
    bloccaSfondo(false);
    editingId = null;
  }
  document.getElementById("sheet-close").addEventListener("click", closeSheet);
  backdrop.addEventListener("click", closeSheet);
  // Il tasto dice in che stato si è, non solo con il colore: da spento invita
  // a segnarla, da acceso conferma che è fatta (e si può ancora tornare indietro).
  function etichettaFatto(btn) {
    btn.querySelector("span").textContent = btn.classList.contains("on")
      ? "Completata" : "Segna come completata";
  }
  document.getElementById("f-done").addEventListener("click", function () {
    this.classList.toggle("on");
    etichettaFatto(this);
  });
  document.getElementById("altro-toggle").addEventListener("click", function () {
    var body = document.getElementById("altro-body");
    var apri = body.hidden;
    body.hidden = !apri;
    this.classList.toggle("open", apri);
  });
  document.getElementById("posto-toggle").addEventListener("click", function () {
    var body = document.getElementById("sez-posto");
    var apri = body.hidden;
    body.hidden = !apri;
    this.classList.toggle("open", apri);
  });

  // Cerca il posto (Nominatim, vedi js/cerca-luogo.js): riempie titolo, zona e
  // posizione da un risultato scelto, invece di doverli scrivere a mano.
  function agganciaRicerca(inputId, boxId, onScelta) {
    var timer = null;
    document.getElementById(inputId).addEventListener("input", function () {
      var q = this.value;
      clearTimeout(timer);
      timer = setTimeout(function () {
        var box = document.getElementById(boxId);
        if (!window.TraviCerca) return;
        window.TraviCerca.cerca(q).then(function (risultati) {
          if (!risultati.length) { box.hidden = true; box.innerHTML = ""; return; }
          box.innerHTML = "";
          risultati.forEach(function (r) {
            var row = document.createElement("div");
            row.className = "cerca-riga";
            row.innerHTML = '<div class="t">' + escapeHtml(r.title) + '</div><div class="s">' + escapeHtml(r.sub) + '</div>';
            row.addEventListener("click", function () {
              box.hidden = true;
              document.getElementById(inputId).value = "";
              onScelta(r);
            });
            box.appendChild(row);
          });
          box.hidden = false;
        });
      }, 400);
    });
  }
  agganciaRicerca("f-cerca", "cerca-risultati", function (r) {
    document.getElementById("f-title").value = r.title;
    document.getElementById("f-sub").value = r.sub;
    sheetLatLon = { lat: r.lat, lon: r.lon };
    sheetExistingFoto = null; // il posto è cambiato: la foto va ricercata di nuovo
  });

  /* ---------- Preferiti ---------- */
  // Lista dei desideri non ancora programmati: raggruppati per città, si
  // "pianificano" su un giorno preciso solo quando si vuole, verificati dallo
  // stesso motore dell'Itinerario (js/giornata.js) — mai a caso.
  function renderPreferiti() {
    var el = document.getElementById("fav-groups");
    if (!el) return;
    el.innerHTML = "";
    if (!state.favorites.length) {
      el.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:40px 20px;font-size:.85rem;">Nessun preferito ancora. Aggiungete un posto che volete vedere: potrete assegnarlo a un giorno quando volete, verificando prima se ci sta davvero.</div>';
      return;
    }
    var groups = {}, ordine = [];
    state.favorites.forEach(function (f) {
      var c = cityKeyForFav((f.sub || "") + " " + (f.title || ""));
      if (!groups[c]) { groups[c] = []; ordine.push(c); }
      groups[c].push(f);
    });
    ordine.sort(function (a, b) { return a === "Altro" ? 1 : (b === "Altro" ? -1 : a.localeCompare(b)); });
    ordine.forEach(function (city) {
      var h = document.createElement("div");
      h.className = "fav-city-heading";
      h.textContent = city;
      el.appendChild(h);
      groups[city].forEach(function (f) {
        var card = document.createElement("div");
        card.className = "fav-card";
        card.innerHTML =
          '<div class="thumb" style="background-image:url(\'' + imgFor(f) + '\')"></div>' +
          '<div class="content">' +
          '<div class="title">' + escapeHtml(f.title) + "</div>" +
          '<div class="sub">' + escapeHtml(f.sub || "") + "</div>" +
          (f.notes ? '<div class="fav-notes">' + escapeHtml(f.notes) + "</div>" : "") +
          // Dice a colpo d'occhio se il posto finirà sulla mappa quando lo
          // pianificate: la posizione ce l'ha, oppure la stiamo cercando.
          (f.lat != null
            ? '<div class="fav-pos ok"><svg><use href="#ic-pin"/></svg>posizione trovata</div>'
            : '<div class="fav-pos"><svg><use href="#ic-search"/></svg>posizione da trovare</div>') +
          "</div>" +
          '<div class="fav-actions">' +
          '<button class="fav-plan">Pianifica</button>' +
          '<button class="fav-del" aria-label="Rimuovi">✕</button>' +
          "</div>";
        card.querySelector(".fav-plan").addEventListener("click", function () { apriPreferenza(f.id); });
        card.querySelector(".fav-del").addEventListener("click", function () {
          state.favorites = state.favorites.filter(function (x) { return x.id !== f.id; });
          persist();
          toast("Rimosso dai preferiti");
        });
        el.appendChild(card);
      });
    });
  }

  /* ---------- foglio "nuovo preferito" ---------- */
  var favSheet = document.getElementById("fav-sheet");
  var favLatLon = null;

  function openFavSheet() {
    document.getElementById("fav-cerca").value = "";
    document.getElementById("fav-cerca-risultati").hidden = true;
    document.getElementById("fav-title").value = "";
    document.getElementById("fav-sub").value = "";
    document.getElementById("fav-notes").value = "";
    selectPick("fav-category", "experience");
    selectPick("fav-priorita", "norm");
    favLatLon = null;
    backdrop.classList.add("show");
    favSheet.classList.add("show");
    bloccaSfondo(true);
  }
  function closeFavSheet() {
    backdrop.classList.remove("show");
    favSheet.classList.remove("show");
    bloccaSfondo(false);
  }
  document.getElementById("fav-close").addEventListener("click", closeFavSheet);
  backdrop.addEventListener("click", closeFavSheet);
  document.getElementById("btn-add-fav").addEventListener("click", function () { openFavSheet(); });

  agganciaRicerca("fav-cerca", "fav-cerca-risultati", function (r) {
    document.getElementById("fav-title").value = r.title;
    document.getElementById("fav-sub").value = r.sub;
    favLatLon = { lat: r.lat, lon: r.lon };
  });

  document.getElementById("fav-save").addEventListener("click", function () {
    var title = document.getElementById("fav-title").value.trim();
    if (!title) { toast("Serve almeno un titolo"); return; }
    var newId = "fav-" + Date.now();
    var fav = {
      id: newId, title: title,
      sub: document.getElementById("fav-sub").value.trim(),
      cat: getPick("fav-category") || "experience",
      prio: getPick("fav-priorita") || "norm",
      notes: document.getElementById("fav-notes").value.trim(),
      createdAt: Date.now()
    };
    if (favLatLon) { fav.lat = favLatLon.lat; fav.lon = favLatLon.lon; }
    state.favorites.push(fav);
    closeFavSheet();
    persist();
    toast("Aggiunto ai preferiti");

    if (window.TraviFoto) {
      window.TraviFoto.cerca(fav.title + " " + fav.sub).then(function (url) {
        if (!url) return;
        state.favorites = state.favorites.map(function (f) { return f.id === newId ? Object.assign({}, f, { foto: url }) : f; });
        persist();
      });
    }
    // Scritto a mano senza scegliere dalla ricerca: cerchiamo noi la posizione,
    // altrimenti quando lo pianificate non avrebbe un pin sulla mappa.
    if (!favLatLon) {
      trovaCoordinate(fav.title, fav.sub).then(function (c) {
        if (!c) return;
        state.favorites = state.favorites.map(function (f) {
          return f.id === newId ? Object.assign({}, f, { lat: c.lat, lon: c.lon }) : f;
        });
        persist();
      });
    }
  });

  /* ---------- foglio "pianifica un preferito" ---------- */
  // Riusa lo stesso motore usato per lo spostamento fra giorni in Itinerario
  // (giorniAlternativi): prova ogni giorno e ogni posizione, e propone solo
  // quelli dove Travi ha VERIFICATO che c'è spazio — non un semplice elenco
  // di giorni a caso. Chi vuole decidere comunque diversamente può farlo,
  // scegliendo giorno e orario da sé più sotto.
  var assignSheet = document.getElementById("assign-sheet");

  function apriPreferenza(favId) {
    var fav = state.favorites.find(function (f) { return f.id === favId; });
    if (!fav) return;
    var tappaFinta = {
      id: fav.id, title: fav.title, sub: fav.sub, cat: fav.cat, prio: fav.prio,
      lat: fav.lat, lon: fav.lon, dur: fav.dur || 45, time: "12:00",
      done: false, locked: false
    };
    var giorni = DAYS.map(function (d) { return { id: d.id, date: d.date, city: d.city, tappe: stopsForDay(d.id) }; });
    var suggeriti = (window.Giornata && window.Giornata.giorniAlternativi)
      ? window.Giornata.giorniAlternativi(tappaFinta, giorni, "__nessuno__", window.TRAVI_ORARI, null)
      : [];
    renderAssignBody(fav, suggeriti);
    backdrop.classList.add("show");
    assignSheet.classList.add("show");
    bloccaSfondo(true);
  }
  function closeAssignSheet() {
    backdrop.classList.remove("show");
    assignSheet.classList.remove("show");
    bloccaSfondo(false);
  }
  document.getElementById("assign-close").addEventListener("click", closeAssignSheet);
  backdrop.addEventListener("click", closeAssignSheet);

  function renderAssignBody(fav, suggeriti) {
    var body = document.getElementById("assign-body");
    var html = '<div class="assign-fav-title">' + escapeHtml(fav.title) + "</div>" +
               '<div class="assign-fav-sub">' + escapeHtml(fav.sub || "") + "</div>";
    if (suggeriti.length) {
      html += '<div class="assign-lead">Giorni dove Travi ha verificato che c’è spazio, dal più comodo:</div>';
      suggeriti.slice(0, 4).forEach(function (a) {
        html += '<button class="assign-opt" data-day="' + a.id + '" data-dopo="' + (a.dopoDi ? escapeHtml(a.dopoDi) : "") + '">' +
                '<div class="d">' + a.date.slice(8) + "/" + a.date.slice(5, 7) + " · " + escapeHtml(a.city) + "</div>" +
                '<div class="c">' + a.tappeQuelGiorno + " tappe già in programma</div>" +
                '<div class="fine">finirebbe alle ' + a.fineCon + "</div>" +
                "</button>";
      });
    } else {
      html += '<div class="assign-lead">Nessun giorno ha spazio sicuro per starci: scegliete voi, tenendo d’occhio la giornata dopo averlo aggiunto.</div>';
    }
    html += '<div class="assign-manuale"><label>Oppure scegliete voi giorno e orario</label>' +
            '<div class="dayrow" id="assign-dayrow"></div>' +
            '<input type="time" id="assign-time" value="09:00">' +
            '<button class="btn primary" id="assign-manuale-conferma" style="width:100%;">Aggiungi comunque</button></div>';
    body.innerHTML = html;

    body.querySelectorAll(".assign-opt").forEach(function (btn) {
      btn.addEventListener("click", function () {
        pianificaPreferenza(fav, this.dataset.day, this.dataset.dopo || null);
      });
    });

    var dayrowEl = document.getElementById("assign-dayrow");
    var scelto = DAYS.length ? DAYS[0].id : null;
    DAYS.forEach(function (d) {
      var pill = document.createElement("div");
      pill.className = "daypill" + (d.id === scelto ? " active" : "");
      pill.innerHTML = '<div class="dw">' + weekdayShort(d.date) + '</div><div class="dn num">' + dayNum(d.date) + "</div>";
      pill.addEventListener("click", function () {
        scelto = d.id;
        dayrowEl.querySelectorAll(".daypill").forEach(function (p) { p.classList.remove("active"); });
        pill.classList.add("active");
      });
      dayrowEl.appendChild(pill);
    });
    document.getElementById("assign-manuale-conferma").addEventListener("click", function () {
      if (!scelto) { toast("Non ci sono giorni nel viaggio"); return; }
      var ora = document.getElementById("assign-time").value || "09:00";
      confermaPreferenza(fav, scelto, ora);
    });
  }

  // Posizione consigliata da giorniAlternativi: subito dopo "dopoDi", oppure
  // un'ora prima della prima tappa se va messa in testa al giorno.
  function pianificaPreferenza(fav, dayId, dopoTitolo) {
    var dest = stopsForDay(dayId);
    var nuovaOra = "09:00";
    if (dopoTitolo) {
      var rif = dest.find(function (x) { return x.title === dopoTitolo; });
      if (rif) {
        var m = window.Giornata.min(rif.time) + (rif.dur || 0) + 15;
        nuovaOra = window.Giornata.hhmm(m).replace("+1", "");
      }
    } else if (dest.length) {
      nuovaOra = window.Giornata.hhmm(Math.max(0, window.Giornata.min(dest[0].time) - 60));
    }
    confermaPreferenza(fav, dayId, nuovaOra);
  }

  function confermaPreferenza(fav, dayId, time) {
    var newId = "custom-" + Date.now();
    var nuovaTappa = {
      id: newId, title: fav.title, sub: fav.sub || "", cat: fav.cat || "experience",
      prio: fav.prio || "norm", notes: fav.notes || "", dur: fav.dur || 45, tmin: 0, tmode: "walk",
      day: dayId, time: time, done: false,
      q: fav.title + " " + (fav.sub || "")
    };
    // di nuovo: lat/lon/foto entrano nel payload solo se esistono davvero.
    if (fav.lat != null) { nuovaTappa.lat = fav.lat; nuovaTappa.lon = fav.lon; }
    if (fav.foto) nuovaTappa.foto = fav.foto;
    state.custom.push(nuovaTappa);
    state.favorites = state.favorites.filter(function (f) { return f.id !== fav.id; });
    closeAssignSheet();
    persist();
    toast("Aggiunto all'itinerario del " + ((dayById(dayId) || {}).date || ""));

    // Da qui in poi è una tappa come tutte le altre: entra nell'elenco del
    // giorno all'orario scelto, prende il suo numero e compare sulla mappa.
    // Se il preferito non aveva una posizione, la cerchiamo adesso — altrimenti
    // sarebbe l'unica tappa senza pin.
    if (nuovaTappa.lat == null) {
      trovaCoordinate(nuovaTappa.title, nuovaTappa.sub).then(function (c) {
        if (c) applicaPatchTappa(newId, { lat: c.lat, lon: c.lon });
      });
    }
  }

  /* ---------- foglio budget extra ---------- */
  var budgetSheet = document.getElementById("budget-sheet");
  var bgWhoEl = document.getElementById("bg-who");
  BUDGET_WHO.forEach(function (w, i) {
    var p = document.createElement("div");
    p.className = "pick" + (i === 2 ? " sel" : "");
    p.dataset.id = w.id;
    p.textContent = w.label;
    p.addEventListener("click", function () {
      bgWhoEl.querySelectorAll(".pick").forEach(function (x) { x.classList.remove("sel"); });
      p.classList.add("sel");
    });
    bgWhoEl.appendChild(p);
  });
  function openBudgetSheet() {
    backdrop.classList.add("show");
    budgetSheet.classList.add("show");
    bloccaSfondo(true);
  }
  function closeBudgetSheet() {
    backdrop.classList.remove("show");
    budgetSheet.classList.remove("show");
    bloccaSfondo(false);
  }
  document.getElementById("budget-summary-card").addEventListener("click", openBudgetSheet);
  document.getElementById("budget-close").addEventListener("click", closeBudgetSheet);
  backdrop.addEventListener("click", closeBudgetSheet);
  document.getElementById("btn-budget-add").addEventListener("click", function () {
    var title = document.getElementById("bg-title").value.trim();
    var amount = parseFloat(document.getElementById("bg-amount").value);
    if (!title) { toast("Serve una descrizione della spesa"); return; }
    if (!amount || amount <= 0) { toast("Inserite un importo valido"); return; }
    var who = bgWhoEl.querySelector(".pick.sel");
    state.budget.push({
      id: "b" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: title,
      amount: amount,
      who: who ? who.dataset.id : "insieme",
      createdAt: Date.now(),
    });
    document.getElementById("bg-title").value = "";
    document.getElementById("bg-amount").value = "";
    persist();
    toast("Spesa aggiunta");
  });

  document.getElementById("btn-save").addEventListener("click", function () {
    var title = document.getElementById("f-title").value.trim();
    if (!title) { toast("Serve almeno un titolo"); return; }
    var payload = {
      title: title,
      sub: document.getElementById("f-sub").value.trim(),
      time: document.getElementById("f-time").value || "09:00",
      dur: parseInt(getPick("f-duration-chips"), 10) || 30,
      tmin: parseInt(document.getElementById("f-travel").value, 10) || 0,
      notes: document.getElementById("f-notes").value.trim(),
      cat: getPick("f-category") || "experience",
      tmode: getPick("f-transport") || "walk",
      prio: getPick("f-priorita") || "norm",
      done: document.getElementById("f-done").classList.contains("on"),
    };
    // undefined non è un valore che Firestore accetta: questi due campi
    // esistono nel payload SOLO quando c'è davvero un valore da mettere.
    if (sheetLatLon) { payload.lat = sheetLatLon.lat; payload.lon = sheetLatLon.lon; }
    if (sheetExistingFoto) payload.foto = sheetExistingFoto;

    var idPerFoto;
    if (editingId) {
      idPerFoto = editingId;
      var isCustom = state.custom.some(function (c) { return c.id === editingId; });
      if (isCustom) {
        state.custom = state.custom.map(function (c) { return c.id === editingId ? Object.assign({}, c, payload) : c; });
      } else {
        state.overrides[editingId] = Object.assign({}, state.overrides[editingId] || {}, payload);
      }
      toast("Tappa aggiornata");
    } else {
      var newId = "custom-" + Date.now();
      payload.id = newId;
      payload.day = selectedDay.itinerario;
      payload.q = payload.title + " " + payload.sub;
      state.custom.push(payload);
      idPerFoto = newId;
      toast("Tappa aggiunta");
    }
    closeSheet();
    persist();

    // Nessuna foto già presente: la si cerca in background (vedi js/foto.js),
    // il salvataggio non aspetta la rete. Vale sia per una tappa scritta a
    // mano sia per una scelta dalla ricerca senza una foto trovata prima.
    if (!payload.foto && window.TraviFoto) {
      window.TraviFoto.cerca(payload.title + " " + payload.sub).then(function (url) {
        if (url) applicaPatchTappa(idPerFoto, { foto: url });
      });
    }

    // Senza coordinate non c'è nessun pin sulla mappa: se non sono arrivate
    // dalla ricerca del posto, le cerchiamo dal nome in background. È così che
    // una tappa scritta a mano prende comunque il suo numero sulla mappa.
    if (payload.lat == null) {
      trovaCoordinate(payload.title, payload.sub).then(function (c) {
        if (c) applicaPatchTappa(idPerFoto, { lat: c.lat, lon: c.lon });
      });
    }
  });

  document.getElementById("btn-delete").addEventListener("click", function () {
    if (!editingId) return;
    var current = allStops().find(function (x) { return x.id === editingId; });
    if (current && current.locked) { toast("Questa tappa è bloccata: non può essere eliminata in questa fase."); return; }
    var isCustom = state.custom.some(function (c) { return c.id === editingId; });
    if (isCustom) { state.custom = state.custom.filter(function (c) { return c.id !== editingId; }); }
    else { state.removed.push(editingId); }
    toast("Tappa eliminata");
    closeSheet();
    persist();
  });

  document.getElementById("btn-add-stop").addEventListener("click", function () { openSheet(null); });
  // fab-add: il suo click handler viene assegnato da switchView() (apre la
  // tappa o il preferito a seconda della vista attiva), non qui.

  /* ---------- recalc day ---------- */
  document.getElementById("btn-recalc").addEventListener("click", function () {
    var list = stopsForDay(selectedDay.itinerario);
    var firstPendingIdx = list.findIndex(function (s) { return !s.done; });
    if (firstPendingIdx === -1) { toast("Tutte le tappe di oggi sono completate"); return; }
    var isToday = todayISO() === dayById(selectedDay.itinerario).date;
    var now = new Date();
    var cursor = isToday ? now.getHours() * 60 + now.getMinutes() + 5 : timeToMin(list[firstPendingIdx].time);
    for (var i = firstPendingIdx; i < list.length; i++) {
      var s = list[i];
      var newTime = minToTime(cursor);
      var isCustom = state.custom.some(function (c) { return c.id === s.id; });
      if (isCustom) { state.custom = state.custom.map(function (c) { return c.id === s.id ? Object.assign({}, c, { time: newTime }) : c; }); }
      else { state.overrides[s.id] = Object.assign({}, state.overrides[s.id] || {}, { time: newTime }); }
      cursor += (s.dur || 30) + (s.tmin || 0);
    }
    toast("Giornata ricalcolata");
    persist();
  });

  /* ---------- toast ---------- */
  var toastTimer = null;
  function toast(msg) {
    var el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2200);
  }

  /* ---------- registrazione service worker (PWA installabile) ---------- */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }
})();
