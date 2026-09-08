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
