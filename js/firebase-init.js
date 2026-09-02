// Inizializzazione condivisa di Firebase (Auth + Firestore).
// Usata sia dall'app principale (js/app.js) sia dallo strumento di
// caricamento dati una tantum (admin-seed.html).
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// browserLocalPersistence è già il default degli SDK moderni, ma lo
// impostiamo esplicitamente: è questo che fa sì che il dispositivo resti
// "riconosciuto" indefinitamente, finché non si fa logout esplicito o non
// si cancellano i dati del browser.
setPersistence(auth, browserLocalPersistence).catch(() => {});
