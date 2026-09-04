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

Restano da costruire, invariato dal 3/09: Esplora, Prenotazioni, Budget come
sezione propria, Diario, e il tab "Altro" che li raccoglierebbe — il
documento di architettura originale resta valido come piano per quelli.

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
