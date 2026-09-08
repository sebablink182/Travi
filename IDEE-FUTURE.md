# Il cassetto — cose decise ma non ancora fatte

> Non è una lista dei desideri: è roba discussa, valutata e messa da parte
> apposta, con già dentro il come. Chi la ritira fuori (io in una sessione
> futura, o ChatGPT, o Gemini) non deve ricominciare dal ragionamento.

---

## 1. Claude dentro l'app — aiuto da remoto sulla giornata

**Deciso il 7 settembre 2026. Si farà, fino al livello 2.**

Il caso vero: siete in Giappone, piove, o un treno salta, o un posto è chiuso,
e la giornata va rifatta. Rifare a mano dieci tappe una per una, dal telefono,
sotto la pioggia, non è accettabile. Serve poter chiedere aiuto e ricevere una
giornata nuova.

### Il vincolo che decide tutto

La chiave dell'API **non può stare dentro l'app**. Travi è pubblica su GitHub
Pages: chiunque legga il sorgente la vede e la spende. Serve per forza un
pezzo di server in mezzo.

E poi: **questa è l'unica funzione di Travi che non può funzionare senza
rete.** Va costruita come un di più. Se manca il segnale, `js/giornata.js`
deve continuare a ricalcolare la giornata da solo, come fa oggi. Il giorno in
cui l'aiuto remoto diventa la strada principale, l'app è peggiorata.

### Livello 0 — appunti negli appunti (mezz'ora di lavoro, costo zero)

Un tasto nella giornata che **non chiama nessuna API**: raccoglie lo stato
reale — tappe fatte e non fatte, orari, posizione, esito del motore, meteo — e
lo impacchetta in un testo già scritto bene, da incollare nell'app Claude.

Sembra poco, ma **il pezzo difficile è proprio quello**: decidere cosa mettere
nel contesto perché la risposta sia utile. Quel codice si riusa identico ai
livelli 1 e 2. Da fare per primo, anche solo per capire se la funzione serve
davvero prima di costruire infrastruttura.

### Livello 1 — il tramite

Un **Cloudflare Worker** (piano gratuito, 100.000 richieste al giorno) che
tiene la chiave e gira la domanda all'API di Anthropic. Nell'app compare un
campo: *"è successo questo"*.

Serve:
- un account API Anthropic **con credito** — è separato dall'abbonamento
  Claude, l'abbonamento non dà accesso all'API. Pochi euro coprono il viaggio:
  una richiesta con dentro una giornata è piccola;
- un account Cloudflare (gratuito).

### Livello 2 — la divisione del lavoro (è questa la parte che conta)

La tentazione è chiedere al modello di rigenerare tutto il piano. **È l'idea
sbagliata**, e va scritto qui perché non venga rifatta:

- il **motore** è più bravo a fare i conti. Distanze, minuti, orari di
  chiusura, cosa ci sta e cosa no: li calcola esatti, offline, sempre uguali,
  e sono verificabili;
- il **modello** è più bravo nel giudizio. Sa che se il santuario chiude alle
  17 la via commerciale davanti resta aperta fino alle 20; sa che con quella
  pioggia conviene invertire mattina e pomeriggio.

Quindi: **il motore genera le opzioni possibili** (`giorniAlternativi` e
`cercaSuggerimento` fanno già esattamente questo), **il modello sceglie fra
quelle e spiega perché**. La risposta torna come proposta strutturata — le
stesse schede di "Pianifica" — che si applica con un tocco o si rifiuta. Mai
una chat libera che riscrive il piano: una proposta concreta, con la ragione
accanto.

### Da verificare prima

- **Avranno rete in Giappone?** Con una eSIM sì, e allora la funzione ha senso
  ovunque. Se contano sul wi-fi degli hotel, si userà la sera in camera e non
  in mezzo alla strada: in quel caso il livello 0 basta.
- I dati dell'itinerario passerebbero dall'API di Anthropic. Sono nomi di
  posti e orari, niente di sensibile, ma va detto.

### Perche' oggi si passa ancora dal PC di Seb (verificato l'8/09/2026)

Sarebbe molto meglio pubblicare direttamente dal contenitore di Claude: il PC
potrebbe stare spento, senza rete, o non esistere. **Non si puo', e non per
colpa di come e' fatto il progetto.**

Le sessioni Cowork nel cloud passano da un proxy git che accetta di firmare le
richieste solo verso i repository presenti in un "authorized repository set"
della sessione. Il messaggio di rifiuto dice di aggiungere il repository alle
"sources"... ma **quella voce non esiste da nessuna parte** nell'app: ne' nelle
impostazioni, ne' come comando. E' un problema noto e aperto:

- github.com/anthropics/claude-code/issues/76248 — "git proxy now blocks all
  pushes", aperto il 10 luglio 2026, tuttora aperto. Segnala anche che i token
  personali (PAT) non passano piu': il proxy li sostituisce con i propri.

Confermato dall'interno: in questo contenitore la variabile
`CCR_TEST_GITPROXY=1` e' effettivamente impostata, ed e' la stessa citata nel
ticket. Il push viene rifiutato; la lettura (clone) invece funziona.

Da NON fare: cercare scorciatoie per aggirare il proxy. E' un controllo di
sicurezza dell'ambiente, non un ostacolo tecnico da superare.

**Cosa si fa quindi.** Si tiene il pubblicatore sul PC (invisibile, vedi
`_tools/`), e a ogni nuova sessione si riprova il push in trenta secondi: il
giorno che passa, si passa. Tutto e' gia' pronto per quel momento — la copia
nel contenitore e' un clone vero del repository.

**La via d'emergenza senza nessun PC**, da ricordare per il viaggio: i file
arrivano comunque in chat, e su github.com si possono caricare da un browser
qualsiasi, anche dal telefono (Add file > Upload files sul repository). Lenta e
scomoda, ma se in Giappone si rompe qualcosa e il PC di casa e' spento, l'app
si aggiorna lo stesso.

---

## 2. Piano B pioggia

**Deciso il 7 settembre 2026: buona idea, da fare dopo le due viste nuove.**

Il meteo si scarica già. Se il giorno dà pioggia e in programma ci sono cose
all'aperto, l'app lo dice **il giorno prima** e propone lo scambio con le cose
al coperto della stessa zona, pescandole da `js/idee.js` e dai Preferiti.

Si aggancia a quello che c'è: le idee hanno già zona e coordinate, e
`giorniAlternativi` sa già dire dove una tappa ci sta. Manca solo la parte che
sa distinguere "al chiuso" da "all'aperto" — servirà un campo in più sulle
tappe e sulle idee.

Nota: a maggio in Giappone la stagione delle piogge non è ancora cominciata
(parte a giugno), ma piove lo stesso.

---

## 3. Altre cose valutate e messe da parte

Proposte il 7/09 e **scartate da Seb**, elencate perché non vengano riproposte
identiche fra un mese: lista della valigia, Budget come sezione a sé, ora
doppia Italia-Giappone con countdown eventi, scheda numeri utili/emergenza.

Non erano sbagliate: erano cassetti di utilità, cose che qualsiasi app di
viaggio ha. Quello che invece è piaciuto — e il criterio da tenere per le
proposte future — sono le cose che partono da **quello che Travi ha di
diverso**: il motore che sa se la giornata sta in piedi, e che finora
calcolava molto e mostrava poco.
