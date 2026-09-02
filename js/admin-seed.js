import { auth, db } from "./firebase-init.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

var loginBlock = document.getElementById("login-block");
var seedBlock = document.getElementById("seed-block");
var statusEl = document.getElementById("status");

document.getElementById("btn-login").addEventListener("click", function () {
  var email = document.getElementById("email").value.trim();
  var password = document.getElementById("password").value;
  signInWithEmailAndPassword(auth, email, password).catch(function (err) {
    statusEl.textContent = "Errore di accesso: " + err.message;
  });
});

onAuthStateChanged(auth, function (user) {
  if (user) {
    loginBlock.hidden = true;
    seedBlock.hidden = false;
    document.getElementById("restore-card").hidden = false;
    document.getElementById("whoami").textContent = user.email;
  } else {
    loginBlock.hidden = false;
    seedBlock.hidden = true;
    document.getElementById("restore-card").hidden = true;
  }
});

document.getElementById("btn-check").addEventListener("click", function () {
  getDoc(doc(db, "travi", "itinerary")).then(function (snap) {
    if (snap.exists()) {
      var data = snap.data();
      statusEl.textContent =
        "Trovato un itinerario già caricato: " + (data.days || []).length + " giorni, " + (data.stops || []).length + " tappe.\n" +
        "Premendo di nuovo il pulsante 2 lo sovrascriverete con il contenuto di seed-data.local.js.";
    } else {
      statusEl.textContent = "Nessun itinerario trovato su Firestore. Premete il pulsante 2 per caricarlo.";
    }
  }).catch(function (err) {
    statusEl.textContent = "Errore leggendo Firestore: " + err.message + "\n(controllate le Firestore Rules)";
  });
});

function titleForRemovedId(id) {
  var found = (window.SEED_TRIP && window.SEED_TRIP.stops || []).find(function (s) { return s.id === id; });
  return found ? found.title : id;
}

document.getElementById("btn-list-removed").addEventListener("click", function () {
  var box = document.getElementById("removed-list");
  box.innerHTML = "Controllo…";
  getDoc(doc(db, "travi", "state")).then(function (snap) {
    var removed = (snap.exists() && snap.data().removed) || [];
    if (!removed.length) {
      box.innerHTML = '<p style="margin:8px 0 0;">Nessuna tappa attualmente rimossa. 👍</p>';
      return;
    }
    box.innerHTML = "";
    removed.forEach(function (id) {
      var row = document.createElement("div");
      row.className = "removed-row";
      row.innerHTML = '<span>' + titleForRemovedId(id) + '</span>';
      var btn = document.createElement("button");
      btn.textContent = "Ripristina";
      btn.addEventListener("click", function () {
        row.querySelector("span").textContent = "Ripristino…";
        getDoc(doc(db, "travi", "state")).then(function (freshSnap) {
          var data = freshSnap.data() || {};
          var newRemoved = (data.removed || []).filter(function (rid) { return rid !== id; });
          return setDoc(doc(db, "travi", "state"), Object.assign({}, data, { removed: newRemoved, savedAt: Date.now() }));
        }).then(function () {
          row.remove();
        }).catch(function (err) {
          row.querySelector("span").textContent = "Errore: " + err.message;
        });
      });
      row.appendChild(btn);
      box.appendChild(row);
    });
  }).catch(function (err) {
    box.innerHTML = "Errore: " + err.message;
  });
});

document.getElementById("btn-seed").addEventListener("click", function () {
  if (typeof window.SEED_TRIP === "undefined") {
    statusEl.textContent = "Non trovo seed-data.local.js accanto a questa pagina: aggiungetelo prima di continuare.";
    return;
  }
  statusEl.textContent = "Carico su Firestore…";
  var seed = window.SEED_TRIP;
  Promise.all([
    setDoc(doc(db, "travi", "itinerary"), { trip: seed.trip, days: seed.days, stops: seed.stops }),
    getDoc(doc(db, "travi", "state")).then(function (snap) {
      if (!snap.exists()) {
        return setDoc(doc(db, "travi", "state"), { overrides: {}, custom: [], removed: [], savedAt: Date.now() });
      }
    }),
  ]).then(function () {
    statusEl.textContent = "Fatto! " + seed.days.length + " giorni e " + seed.stops.length + " tappe caricate. Ora potete aprire index.html.";
  }).catch(function (err) {
    statusEl.textContent = "Errore scrivendo su Firestore: " + err.message;
  });
});
