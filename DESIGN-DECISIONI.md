# Travi — decisioni di design

> A cosa serve questo file: il design system originale del progetto (le immagini
> di partenza) **non è più la fonte di verità su tutto**. Alcune sue indicazioni
> sono state adottate, altre valutate e scartate guardandole sul telefono vero.
> Chi lavora su Travi — me compreso in una sessione futura, o ChatGPT e Gemini —
> deve leggere qui prima di "correggere" l'app per farla somigliare ai mockup.
> Uno scostamento elencato qui sotto è una scelta, non una svista.

---

## ADOTTATO — tipografia (3 settembre 2026)

Il design system dice **SF Pro Display**, e l'app ci è passata: prima usava
Fraunces, un serif, per titoli e numeri.

Scala in uso, presa dallo spec e disponibile come variabili `--t-*` in `style.css`:

| | dimensione | peso |
|---|---|---|
| Display Large | 34 / 40 | 600 |
| Headline | 28 / 34 | 600 |
| Title 1 | 22 / 28 | 600 |
| Title 2 | 17 / 22 | 500 |
| Body | 17 / 24 | 400 |
| Callout | 15 / 20 | 400 |
| Footnote | 13 / 18 | 400 |
| Caption | 11 / 16 | 400 |

Il corpo testo è passato da 15px a 17px: **l'app ha il testo più grande di
prima**, ed è voluto. Fraunces non viene più scaricata da Google Fonts — SF Pro
è già dentro l'iPhone, quindi l'app parte prima e non dipende dalla rete.

---

## SCARTATO — la palette del design system (3 settembre 2026)

Lo spec propone neutri caldi (`#F3F1EE`, `#E8E4E1`, `#D7D2CD`), accento corallo
`#E65D4A` e quattro pastello (salmone `#F4A896`, pesca `#F7D7B8`, menta
`#CDE7D6`, lavanda `#CBB7F6`).

**Non è stata adottata.** La palette è stata messa a confronto con quella attuale
su `palette.html` — stessa schermata, interruttore per passare dall'una all'altra
sul telefono vero — e la scelta, guardando, è stata di **tenere quella attuale**:

```
sfondo      #FAFAF9      bordi     #EAEAE8
secondario  #ECECEE      testo 2°  #8E8E93
accento     #F5503C      testo 3°  #C7C7CC
colori      #FF7A54 · #E7A94F · #E8A0A0 · #465267 · #8FA3AD · #4CAF6C
```

Quindi: l'app usa grigi freddi e accenti più saturi, e va bene così. Non è un
disallineamento da sistemare.

---

## ADOTTATO ma ricalibrato — il vetro

Lo spec indica sfocature di 10/20/40px. Il vetro dell'app usa **5px**, valore
calibrato sul telefono vero con `pillola.html`.

Il perché è spiegato per esteso in **[STILE-VETRO.md](STILE-VETRO.md)**, che è la
regola vincolante per qualsiasi elemento glass. In breve: sopra i 20px di
sfocatura ciò che sta sotto diventa una macchia uniforme e il vetro sembra una
superficie piatta.

---

## ADOTTATO — quattro tab, Itinerario fonte di verità per la Mappa (4 settembre 2026)

Tre cambi grossi in un colpo solo, tutti richiesti insieme il 4/09:

- **Preferiti** è un tab vero adesso (quarto, dopo Mappa): lista dei desideri
  non ancora programmati, raggruppata per città. "Pianifica" su un preferito
  riusa `Giornata.giorniAlternativi` (lo stesso motore usato per spostare una
  tappa da un giorno all'altro in Itinerario) per proporre solo i giorni dove
  c'è VERAMENTE spazio — non un elenco a caso — con un'opzione manuale sempre
  disponibile per chi vuole decidere comunque diversamente.
- **Mappa non ha più un suo selettore di giorno.** Itinerario è l'unica fonte
  di verità su "che giorno stiamo guardando": la Mappa (ora a schermo intero,
  non più una mappa piccola con una lista sotto) mostra sempre lo stesso
  giorno scelto in Itinerario, con una pillola in alto che lo RIPORTA (e ci
  riporta in Itinerario se la si tocca) invece di sceglierlo.
- **Foto reali per le tappe aggiunte a mano.** Le 52 tappe originali restano
  con le foto scelte a mano (`s.img`). Una tappa custom o un preferito, in
  automatico al salvataggio, cerca una foto libera su Wikipedia (prima
  italiana, poi inglese — `js/foto.js`, nessuna chiave, nessun costo) e la
  salva come `s.foto`; se non si trova niente resta il segnaposto generico
  (`assets/img/luogo-generico.jpg`), mai un riquadro vuoto. La ricerca del
  posto nel foglio (`js/cerca-luogo.js`, stesso Nominatim già usato da
  coordinate.html/hotel.html) riempie titolo, zona e posizione da un
  risultato scelto, per non dover più scrivere a mano dati che non si
  conoscono in anticipo.

## ADOTTATO — quinto tab, posizione reale, funzionamento senza rete (4 settembre 2026, sera)

- **Altro** è il quinto tab: dentro ci sono le **Prenotazioni** (codici, orari,
  indirizzi anche in giapponese da mostrare a un tassista), il Budget extra e
  l'uscita dall'account. Il codice di prenotazione è in carattere a larghezza
  fissa e si copia con un tocco: serve al banco del check-in, di fretta e
  spesso senza rete.
- **"Dove sono adesso"**: la posizione del telefono entra nel motore
  (`js/giornata.js`, parametro `daDove`). Il ritardo si calcola da dove siete
  davvero e non da dove dice il piano, e per la prossima tappa la stima a piedi
  dalla posizione reale ha la precedenza sul tempo previsto nei dati. È un
  interruttore, non automatico: consuma batteria e ha senso solo mentre si
  cammina. La posizione non lascia il telefono.
- **Senza rete**: vedi la nota lunga in `sw.js` e `js/firebase-init.js`. Erano
  tre buchi insieme — librerie esterne non messe in cache, Firestore senza
  copia locale, e il service worker registrato da un modulo che dipendeva
  dalla rete. Ora l'app si riapre e funziona in metropolitana.

## ADOTTATO — cerca, frasi, cambio, diario (7 settembre 2026)

Quattro aggiunte fatte di fila, tutte con la stessa logica: **roba che serve in
viaggio e che non deve dipendere dalla rete**.

- **Cerca** (la lente in Home e in Itinerario, che prima era decorativa): una
  sola ricerca su tappe, preferiti e prenotazioni insieme. Toccare un
  risultato porta al giorno giusto e apre la tappa. La domanda vera, con 52
  tappe su 14 giorni, è "dove l'avevamo messo?", e non deve costare quattordici
  tocchi sul calendario.
- **Frasi in giapponese** (`js/frasi.js`, 66 frasi): dentro l'app, non su un
  traduttore. Il gesto vero non è dire la frase, è **girare lo schermo verso
  l'altra persona** — per questo la riga in giapponese è a 1.18rem e le altre
  due (lettura latina, italiano) stanno sotto, piccole. La lettura latina è
  Hepburn scritta come si legge in italiano.
- **Yen ed euro**: il cambio si scarica quando c'è rete
  (`api.frankfurter.dev`, senza chiave) e si tiene in `localStorage`; c'è un
  valore di scorta nel codice così anche il primo avvio offline dà un numero.
  Sotto, la tabella a colpo d'occhio: davanti a un menù non si digita, si
  guarda.
- **Diario**: una riga per giorno, si apre solo quella toccata, si salva da
  solo dopo 700 ms. Niente tasto Salva: si scrive di sera, stanchi, con una
  mano. **Solo testo** — le foto stanno già nel rullino, e un documento
  Firestore ha un limite di 1 MB.

Nella stessa giornata è saltata fuori una cosa che non c'entrava con le
aggiunte: il service worker serviva **meteo, cambio, Nominatim e Wikipedia
dalla cache** perché quegli indirizzi non finiscono in `.json` e cadevano nel
ramo "prima la cache". Una previsione di ieri data per oggi è peggio di un
trattino. Ora c'è `eDatiVivi()` in `sw.js`: rete prima, cache solo se la rete
non c'è.

Sugli **orari di apertura**: sembrava mancassero per 30 tappe su 52. Non
mancano. Quelle 30 sono voli, trasferimenti, check-in, spedizioni bagagli e
pomeriggi liberi — cose che un orario di apertura non ce l'hanno. Le tappe che
sono davvero un posto hanno il loro orario. Non c'è niente da completare.

Restano da costruire: Esplora e il Budget come sezione a sé (oggi è un foglio
richiamato da Home e da Altro) — il documento di architettura originale resta
valido come piano per quelli.

## Lo strumento di prova

`_tools/prova.js` apre l'app vera in un browser e ci si comporta come un dito:
cambia le cinque pagine, apre e trascina i fogli, salva un preferito e una
prenotazione, accende la posizione, spegne la rete. Trenta verifiche, si lancia
con `node _tools/prova.js`.

Non è cerimonia: ha già trovato due cose che a leggere il codice non si vedevano
— il service worker che non si registrava senza rete, e il tasto della posizione
irraggiungibile finché il viaggio è lontano (cioè impossibile da provare prima
di partire). Prima di pubblicare qualcosa di grosso, si lancia.

---

## Gli strumenti di calibrazione

Restano nel progetto apposta, non sono file di scarto:

- **`pillola.html`** — banco di prova del vetro: 6 preset, cinque cursori, e sotto
  la pillola scorrono foto, card bianche, fasce scure e colorate
- **`palette.html`** — confronto fra palette attuale e design system, con
  interruttore
- **`test.html`** — misura le unità di altezza sul device (è lo strumento che ha
  trovato il problema dei 894 vs 956px; vedi la nota su `.stage` in `style.css`)

Il metodo che funziona su questo progetto è questo: **costruire uno strumento e
guardare**, invece di provare una variabile alla volta a distanza.
