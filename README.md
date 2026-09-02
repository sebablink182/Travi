# Travi — guida al setup (una tantum)

Questa è l'app vera, ospitata su un dominio reale invece che sull'Artifact di Claude. Il repository che pubblicherete su GitHub è generico: non contiene nessun dato personale del viaggio (nomi, hotel, orari). Quei dati vivono solo su Firestore, protetti dal login.

Ci sono 5 passaggi. I primi 3 richiedono i vostri account personali (Google/Firebase e GitHub) quindi dovete farli voi — non potevo farli al posto vostro. Vi ho lasciato tutto il codice già pronto.

## 1. Creare il progetto Firebase (gratuito)

1. Andate su [console.firebase.google.com](https://console.firebase.google.com) e create un nuovo progetto (es. "travi-honeymoon"). Il piano gratuito **Spark** basta ampiamente.
2. Nel menu a sinistra: **Build → Authentication → Get started**. Attivate il provider **Email/Password**.
3. Sempre in Authentication → tab **Users → Add user**: create un unico account condiviso (l'email e la password che userete entrambi per accedere all'app). Questa è la password che vi chiederà l'app al primo accesso su ogni telefono.
4. Menu a sinistra: **Build → Firestore Database → Create database**. Scegliete una location vicina (es. `eur3 (Europe)`), modalità **production**.
5. Tab **Rules** di Firestore: incollate il contenuto del file `firestore.rules` di questo progetto e pubblicate.
6. ⚙️ **Impostazioni progetto** (in alto a sinistra) → scorrete fino a "Le tue app" → cliccate l'icona **</>** (web) → registrate un'app (basta un nickname, non serve Hosting) → copiate l'oggetto `firebaseConfig` che vi mostra.
7. Incollate quei valori dentro `js/firebase-config.js` al posto dei segnaposto `INSERISCI_QUI...`.

Questi valori (apiKey ecc.) non sono un segreto da nascondere: è normale che siano visibili nel codice di un'app web Firebase. Chi protegge davvero i vostri dati sono le Firestore Rules + il login, non la segretezza di questi valori.

## 2. Caricare l'itinerario reale su Firestore

Vi ho inviato **separatamente** (non è dentro questo pacchetto/repository) un file chiamato `seed-data.local.js`, che contiene l'itinerario vero — date, hotel, note, tutto quello che oggi vedete nell'Artifact.

1. Mettete `seed-data.local.js` nella cartella principale di questo progetto, accanto a `admin-seed.html` (è già escluso dal `.gitignore`, quindi anche se lo mettete lì non finirà mai su GitHub).
2. Aprite `admin-seed.html` in locale (o dopo averlo pubblicato — vedi passo 4) con un doppio click o un piccolo server locale.
3. Accedete con l'account creato al passo 1.3, premete prima "Controlla cosa c'è già", poi "Carica/aggiorna l'itinerario".

Se in futuro modificate manualmente `seed-data.local.js` (es. per confermare lo spostamento di Fushimi Inari, o aggiornare lo stato del ryokan Iwaso), basta ripetere questo passaggio per aggiornare Firestore.

## 3. Creare il repository GitHub e pubblicare con GitHub Pages

1. Su [github.com](https://github.com), create un nuovo repository pubblico (es. `travi`).
2. Caricate tutti i file di questa cartella **tranne** `seed-data.local.js` (che comunque non c'è, visto che ve l'ho mandato a parte) — il `.gitignore` ve lo ricorda in ogni caso.
3. **Settings → Pages** del repository → Source: "Deploy from a branch" → branch `main`, cartella `/ (root)` → Save.
4. Dopo un paio di minuti il sito sarà live su `https://<vostro-username>.github.io/travi/`.

## 4. Provare l'app

Aprite l'URL da entrambi i telefoni, aggiungete l'icona alla Home ("Condividi → Aggiungi alla schermata Home" su iPhone), accedete una volta con email e password: da lì in poi il dispositivo resterà riconosciuto automaticamente.

## 5. (Facoltativo, più avanti) Dominio personalizzato, notifiche push, mappe live

Il repository e Firebase Auth/Firestore sono già pronti per questo. Quando vorrete fare il passo successivo, ne parliamo — nessuna fretta.

---

### Struttura del progetto

- `index.html`, `style.css` — l'app vera e propria (shell UI).
- `js/app.js` — logica dell'app: login, lettura/scrittura su Firestore, tutte le schermate.
- `js/firebase-init.js`, `js/firebase-config.js` — inizializzazione Firebase (da compilare al passo 1.7).
- `manifest.json`, `sw.js`, `icons/` — cosa rende l'app installabile come PWA.
- `assets/img/` — le fotografie generate (generiche, nessun dato personale: possono restare pubbliche senza problemi).
- `admin-seed.html`, `js/admin-seed.js` — strumento di caricamento dati una tantum (passo 2).
- `firestore.rules` — regole di sicurezza da incollare in Firebase Console (passo 1.5).
- `.gitignore` — esclude `seed-data.local.js` dal repository pubblico.
