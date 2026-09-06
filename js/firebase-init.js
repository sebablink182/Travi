// Inizializzazione condivisa di Firebase (Auth + Firestore).
// Usata sia dall'app principale (js/app.js) sia dallo strumento di
// caricamento dati una tantum (admin-seed.html).
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

/* ---------------------------------------------------------------------------
   FIRESTORE CON COPIA LOCALE — la riga che fa funzionare Travi senza rete.

   Prima qui c'era un semplice getFirestore(app): senza copia locale, la
   lettura dell'itinerario all'avvio (getDoc) fallisce appena manca il segnale,
   e l'app si apriva sulla schermata d'errore. Cioè: proprio in metropolitana a
   Tokyo, che è il momento per cui questa app esiste.

   Con persistentLocalCache i dati del viaggio restano su questo telefono
   (IndexedDB): getDoc offline risponde dalla copia locale, onSnapshot parte
   subito dalla copia e si aggiorna quando torna la rete, e le modifiche fatte
   senza campo (una tappa segnata come fatta) restano in coda e si sincronizzano
   da sole appena il telefono ritrova il segnale.

   persistentMultipleTabManager: se l'app è aperta sia come PWA sia in una
   scheda Safari, la copia locale resta una sola e condivisa invece di dare
   errore.

   Il fallback non è teorico: in navigazione privata IndexedDB può non essere
   disponibile, e lì Firestore deve comunque partire, solo senza copia locale.
--------------------------------------------------------------------------- */
let firestore;
try {
  firestore = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
} catch (e) {
  firestore = getFirestore(app);
}
export const db = firestore;

// browserLocalPersistence è già il default degli SDK moderni, ma lo
// impostiamo esplicitamente: è questo che fa sì che il dispositivo resti
// "riconosciuto" indefinitamente, finché non si fa logout esplicito o non
// si cancellano i dati del browser. Vale anche offline: la sessione viene
// riletta da IndexedDB senza bisogno di rete.
setPersistence(auth, browserLocalPersistence).catch(() => {});
