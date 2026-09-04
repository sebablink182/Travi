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

  var state = { overrides: {}, custom: [], removed: [], budget: [] };
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
  var selectedDay = { itinerario: null, mappa: null };
  var editingId = null;
  var unsubState = null;

  /* ---------- auth gate ---------- */
  var loginGate = document.getElementById("login-gate");
  var appRoot = document.getElementById("app-root");
  var loginForm = document.getElementById("login-form");
  var loginError = document.getElementById("login-error");
  var loginSubmit = document.getElementById("login-submit");
  var signoutLink = document.getElementById("signout-link");

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

  signoutLink.addEventListener("click", function () {
    if (unsubState) { unsubState(); unsubState = null; }
    signOut(auth);
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
      selectedDay.mappa = defaultDay();
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
      }
    } catch (e) {}
  }

  function persist() {
    renderAll();
    var payload = { overrides: state.overrides, custom: state.custom, removed: state.removed, budget: state.budget, savedAt: Date.now() };
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

  /* ---------- rendering ---------- */
  function renderDayRow(containerId, view) {
    var el = document.getElementById(containerId);
    el.innerHTML = "";
    DAYS.forEach(function (d) {
      var pill = document.createElement("div");
      pill.className = "daypill" + (selectedDay[view] === d.id ? " active" : "");
      pill.innerHTML = '<div class="dw">' + weekdayShort(d.date) + '</div><div class="dn num">' + dayNum(d.date) + "</div>";
      pill.addEventListener("click", function () { selectedDay[view] = d.id; renderAll(); });
      el.appendChild(pill);
    });
  }

  function iconFor(c) { return '<svg><use href="#' + cat(c).icon + '"/></svg>'; }
  function tIconFor(m) { return '<svg><use href="#' + transp(m).icon + '"/></svg>'; }
  function imgFor(s) { return (s && s.img) ? "assets/img/" + s.img + ".jpg" : ""; }

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

    var sug = e.suggerimento;
    if (sug && sug.tipo === "sacrifica") {
      html += '<div class="consiglio">Se rinunciate a <b>' + escapeHtml(sug.titolo) + "</b> (" +
              sug.durata + " min) riuscite ancora a fare <b>" +
              sug.problemiRisolti.map(escapeHtml).join("</b>, <b>") + "</b>.</div>";
    } else if (sug && sug.tipo === "rinuncia") {
      html += '<div class="consiglio">Non c\'è più niente da tagliare che basti: <b>' +
              sug.perse.map(escapeHtml).join("</b> e <b>") +
              "</b> conviene spostarli a un altro giorno.</div>";
    }
    if (!simula.attiva) {
      html += '<button class="prova-apri dentro" id="prova-apri">Prova a un altro orario</button>';
    }
    box.innerHTML = html + "</div>";
    agganciaProva(dayId, list);
  }

  function agganciaProva(dayId, list) {
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

  function renderItinerario() {
    if (!DAYS.length || !selectedDay.itinerario) return;
    document.getElementById("itin-city").textContent = dayById(selectedDay.itinerario).city;
    document.getElementById("itin-theme").textContent = dayById(selectedDay.itinerario).theme;
    var list = stopsForDay(selectedDay.itinerario);
    renderStatoGiornata(selectedDay.itinerario, list);
    var el = document.getElementById("stoplist");
    el.innerHTML = "";
    list.forEach(function (s) {
      var card = document.createElement("div");
      card.className = "stopcard" + (s.done ? " done" : "");
      card.innerHTML =
        '<div class="time num">' + s.time + "</div>" +
        '<div class="thumb" style="background-image:url(\'' + imgFor(s) + '\')"><div class="dot"></div></div>' +
        '<div class="content">' +
        '<div class="title">' + escapeHtml(s.title) + "</div>" +
        '<div class="sub">' + escapeHtml(s.sub || "") + "</div>" +
        '<div class="tags">' +
        '<span class="chip">' + iconFor(s.cat) + cat(s.cat).label + "</span>" +
        (s.dur ? '<span class="chip">' + s.dur + " min</span>" : "") +
        (s.tmin ? '<span class="chip">' + tIconFor(s.tmode) + s.tmin + " min</span>" : "") +
        (s.locked ? '<span class="chip locked-chip">🔒 Confermato</span>' : "") +
        "</div>" +
        "</div>";
      card.addEventListener("click", function () { openSheet(s.id); });
      el.appendChild(card);
    });
    if (list.length === 0) {
      el.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:30px 10px;font-size:.85rem;">Nessuna tappa per questo giorno. Aggiungetene una qui sotto.</div>';
    }
  }

  // Mappa vera (Leaflet + Stadia Alidade Smooth). Il fondo mappa è autorizzato
  // per dominio nel pannello Stadia, quindi qui non c'è nessuna chiave: se un
  // giorno le piastrelle sparissero, è là che va aggiunto il dominio nuovo.
  var mappa = null, stratoTappe = null;

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
  function renderMappa() {
    if (!DAYS.length || !selectedDay.mappa) return;
    var list = stopsForDay(selectedDay.mappa);
    var day = dayById(selectedDay.mappa);
    // Pin numerati + percorso del giorno. I numeri corrispondono all'ordine
    // delle tappe nell'elenco qui sotto, così mappa ed elenco si leggono insieme.
    var m = creaMappa();
    if (m) {
      stratoTappe.clearLayers();
      var punti = [];
      list.forEach(function (s, i) {
        if (s.lat == null || s.lon == null) return;
        var icona = L.divIcon({
          className: "", html: '<div class="pin-num">' + (i + 1) + "</div>",
          iconSize: [26, 26], iconAnchor: [13, 13]
        });
        L.marker([s.lat, s.lon], { icon: icona })
          .bindPopup("<b>" + escapeHtml(s.title) + "</b><br>" + s.time +
                     (s.sub ? " · " + escapeHtml(s.sub) : ""))
          .addTo(stratoTappe);
        punti.push([s.lat, s.lon]);
      });
      if (punti.length > 1) {
        L.polyline(punti, { color: "#F5503C", weight: 3, opacity: .6, dashArray: "6 7" })
          .addTo(stratoTappe);
      }
      if (punti.length) {
        m.invalidateSize();
        if (punti.length === 1) m.setView(punti[0], 15);
        else m.fitBounds(punti, { padding: [34, 34] });
      }
    }

    var ml = document.getElementById("maplist");
    ml.innerHTML = "";
    list.forEach(function (s, i) {
      var row = document.createElement("div");
      row.className = "mapstop";
      var gq = encodeURIComponent(s.q || s.title);
      row.innerHTML =
        '<div class="top">' +
        '<div class="thumb small" style="background-image:url(\'' + imgFor(s) + '\')"><div class="badge">' + (i + 1) + "</div></div>" +
        '<div style="flex:1;min-width:0;">' +
        '<div class="title">' + escapeHtml(s.title) + "</div>" +
        '<div class="sub">' + s.time + " · " + escapeHtml(s.sub || "") + "</div>" +
        "</div>" +
        "</div>" +
        '<div class="links">' +
        '<a class="linkbtn" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=' + gq + '"><svg><use href="#ic-pin"/></svg>Google Maps</a>' +
        '<a class="linkbtn" target="_blank" rel="noopener" href="https://maps.apple.com/?q=' + gq + '"><svg><use href="#ic-pin"/></svg>Apple Maps</a>' +
        "</div>";
      ml.appendChild(row);
    });
    if (list.length === 0) {
      ml.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:20px 10px;font-size:.85rem;">Nessuna tappa da mostrare per questo giorno.</div>';
    }
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
    document.getElementById("home-count").innerHTML = list.length + ' <small>luoghi' + (done ? " · " + done + " completati" : "") + "</small>";
    var pct = list.length ? Math.round((done / list.length) * 100) : 0;
    document.getElementById("home-pct").textContent = pct + "%";
    document.getElementById("home-bar").style.width = pct + "%";
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
      var nextImg = imgFor(next);
      if (nextImg) {
        glyph.classList.add("has-img");
        glyph.style.backgroundImage = "url('" + nextImg + "')";
      } else {
        glyph.classList.remove("has-img");
        glyph.style.backgroundImage = "";
      }
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
      "&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FTokyo&start_date=" + refDay.date + "&end_date=" + refDay.date;
    fetch(url).then(function (r) { return r.json(); }).then(function (data) {
      if (!data || !data.daily || !data.daily.temperature_2m_max || !data.daily.temperature_2m_max.length) return;
      weatherFetchedFor = cacheKey;
      var lo = Math.round(data.daily.temperature_2m_min[0]);
      var hi = Math.round(data.daily.temperature_2m_max[0]);
      var pill = document.querySelector(".weather-pill");
      if (!pill) return;
      pill.querySelector(".t").textContent = lo + "–" + hi + "°";
      pill.querySelector(".cap").textContent = "previsione per " + city;
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
    renderDayRow("dayrow-map", "mappa");
    renderItinerario();
    renderMappa();
    renderHome();
    renderBudget();
  }

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
    document.getElementById("fab-add").style.display = name === "itinerario" ? "flex" : "none";
    // ogni volta che si cambia pagina dal menu, si riparte sempre dall'inizio di quella pagina
    var sc = view.querySelector(".scroll");
    if (sc) sc.scrollTop = 0;
    // Leaflet misura il contenitore quando lo crea: se la vista era nascosta
    // trova altezza zero e disegna la mappa storta. Va rimisurata ogni volta
    // che la pagina Mappa torna visibile.
    if (name === "mappa" && mappa) { setTimeout(function () { mappa.invalidateSize(); }, 60); }
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
      p.innerHTML = '<svg><use href="#' + it.icon + '"/></svg>' + it.label;
      p.addEventListener("click", function () {
        el.querySelectorAll(".pick").forEach(function (x) { x.classList.remove("sel"); });
        p.classList.add("sel");
      });
      el.appendChild(p);
    });
  }
  buildPickrow("f-category", CATS);
  buildPickrow("f-transport", TRANSPORTS);

  function selectPick(containerId, id) {
    document.getElementById(containerId).querySelectorAll(".pick").forEach(function (p) {
      p.classList.toggle("sel", p.dataset.id === id);
    });
  }
  function getPick(containerId) {
    var sel = document.getElementById(containerId).querySelector(".pick.sel");
    return sel ? sel.dataset.id : null;
  }

  function openSheet(stopId) {
    editingId = stopId || null;
    var s = editingId ? allStops().find(function (x) { return x.id === editingId; }) : null;
    var locked = !!(s && s.locked);
    document.getElementById("sheet-title").textContent = s ? "Modifica tappa" : "Nuova tappa";
    document.getElementById("f-title").value = s ? s.title : "";
    document.getElementById("f-sub").value = s ? s.sub || "" : "";
    document.getElementById("f-time").value = s ? s.time : "09:00";
    document.getElementById("f-duration").value = s ? s.dur || 30 : 30;
    document.getElementById("f-travel").value = s ? s.tmin || 0 : 0;
    document.getElementById("f-notes").value = s ? s.notes || "" : "";
    selectPick("f-category", s ? s.cat : "experience");
    selectPick("f-transport", s ? s.tmode : "walk");
    var done = !!(s && s.done);
    document.getElementById("f-done").classList.toggle("on", done);
    document.getElementById("btn-delete").style.display = (s && !locked) ? "block" : "none";
    document.getElementById("lock-note").hidden = !locked;
    sheet.querySelector(".sheet-body").classList.toggle("locked", locked);
    ["f-title", "f-sub", "f-time", "f-duration", "f-travel", "f-notes"].forEach(function (id) {
      document.getElementById(id).disabled = locked;
    });
    backdrop.classList.add("show");
    sheet.classList.add("show");
  }
  function closeSheet() {
    backdrop.classList.remove("show");
    sheet.classList.remove("show");
    editingId = null;
  }
  document.getElementById("sheet-close").addEventListener("click", closeSheet);
  backdrop.addEventListener("click", closeSheet);
  document.getElementById("f-done").addEventListener("click", function () { this.classList.toggle("on"); });

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
  }
  function closeBudgetSheet() {
    backdrop.classList.remove("show");
    budgetSheet.classList.remove("show");
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
      dur: parseInt(document.getElementById("f-duration").value, 10) || 0,
      tmin: parseInt(document.getElementById("f-travel").value, 10) || 0,
      notes: document.getElementById("f-notes").value.trim(),
      cat: getPick("f-category") || "experience",
      tmode: getPick("f-transport") || "walk",
      done: document.getElementById("f-done").classList.contains("on"),
    };
    if (editingId) {
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
      toast("Tappa aggiunta");
    }
    closeSheet();
    persist();
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
  document.getElementById("fab-add").addEventListener("click", function () { openSheet(null); });

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
