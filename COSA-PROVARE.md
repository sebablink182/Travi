# Cosa provare — tutto quello fatto da venerdì sera

> Come si usa questa lista: **una riga = una prova**. Si legge cosa fare, si fa,
> e si segna. Se qualcosa non va, basta scrivermi il numero della riga (es.
> "la 3.4 non funziona") e so esattamente dove guardare.
>
> Prima di cominciare: **chiudere del tutto l'app dal telefono e riaprirla**
> (scorrere via dalla lista delle app aperte). Serve a prendere la versione
> nuova. Se qualcosa sembra vecchio, aspettare dieci secondi e riaprire ancora.
>
> Ultimo aggiornamento: 7 settembre 2026.

## 0. Accesso ⚠️ (era rotto, sistemato il 7/09)

- [ ] **0.1** Con email e password giuste **si entra**, senza che la pagina si
      ricarichi e riporti alla schermata di accesso.
- [ ] **0.2** Con la password sbagliata compare il messaggio **"Email o
      password non corretti"**, non un ricaricamento muto.
- [ ] **0.3** Chiudendo e riaprendo l'app **non richiede di nuovo l'accesso**.

Cos'era: il pezzo di codice che intercetta l'invio del modulo era sparito da
`app.js` insieme al vecchio gesto nascosto di uscita, quando quello è stato
sostituito dalla riga in Altro. Senza quel pezzo, premere Accedi fa un invio
normale del modulo: la pagina si ricarica e si ritorna al punto di partenza —
esattamente il loop che hai visto. La prova automatica non l'aveva preso perché
sostituiva Firebase con una finzione che risultava **già dentro**: la schermata
di accesso non veniva mai toccata. Ora la finzione parte **scollegata** e ci
sono sei verifiche apposta sul login, compresa una che si accorge se la pagina
si ricarica.

---

## 1. Home

- [ ] **1.1** La pillola del meteo e il conto alla rovescia **non si toccano più**:
      il meteo sta in alto, i giorni che mancano sono in basso sulla foto.
- [ ] **1.2** Scorrendo verso il basso la **foto scorre via** e non copre più le
      card: le card passano sopra la foto, non sotto.
- [ ] **1.3** La foto in cima è quella del **Fuji con la pagoda** che mi hai
      mandato.
- [ ] **1.4** Le card sotto (meteo, prossima tappa, budget) sono quelle
      ridisegnate, non più i riquadri piatti di prima.
- [ ] **1.5** In fondo alla Home **non c'è più** "Esci da questo dispositivo" né
      lo spazio bianco che lasciava. (Il tasto è in Altro, in fondo.)

## 2. La pillola in basso e i giorni

- [ ] **2.1** La pillola con le cinque pagine si vede **sempre**, anche sulla
      Mappa a schermo intero.
- [ ] **2.2** In Itinerario, ogni giorno è una **pillola separata**, ognuna con
      il suo vetro — lo stesso vetro della pillola grande in basso.
- [ ] **2.3** Il giorno attivo è **pieno arancione**, come la pagina attiva in
      basso.
- [ ] **2.4** Scorrendo la fila dei giorni **non si vede più l'ombra** che
      sbatteva sul riquadro bianco sotto.
- [ ] **2.5** Toccando un giorno si sente un **piccolo colpetto** (feedback
      aptico). Confermato già funzionante il 6/09, si ricontrolla che non si sia
      rotto.

## 3. Itinerario e foglio della tappa

- [ ] **3.1** Le card delle tappe sono quelle nuove (foto, numero, orario,
      durata), non più le righe piatte.
- [ ] **3.2** Toccando una tappa si apre il foglio. **Non si sposta a destra e
      sinistra** e nessun campo è tagliato — in particolare "Orario di arrivo".
- [ ] **3.3** **Elimina e Salva si vedono sempre**, in fondo al foglio, senza
      doverli andare a cercare scorrendo.
- [ ] **3.4** Tutto il contenuto del foglio ci sta **senza dover scorrere su e
      giù**.
- [ ] **3.5** Con il foglio aperto, provando a scorrere, **la pagina sotto sta
      ferma**. Niente si muove dietro.
- [ ] **3.6** **Trascinando il foglio verso il basso** con il dito, il foglio
      segue il dito e, superata una certa soglia, si chiude da solo. La X in
      alto a destra c'è ancora ma non serve più.
- [ ] **3.7** "Segna come fatta" è il tasto grosso e in evidenza, non nascosto
      in fondo.
- [ ] **3.8** Nel foglio c'è la **ricerca del posto** (si scrive il nome, si
      sceglie dalla lista, titolo/zona/posizione si riempiono da soli) invece di
      dover scrivere tutto a mano.

## 4. Mappa

- [ ] **4.1** La Mappa **non ha più un suo selettore di giorno**: mostra sempre
      il giorno scelto in Itinerario.
- [ ] **4.2** La pillola in alto **dice** che giorno si sta guardando, e
      toccandola si torna in Itinerario.
- [ ] **4.3** Aprendo la Mappa, lo zoom **inquadra da solo tutte le tappe del
      giorno**: niente più zoom a mano.
- [ ] **4.4** Cambiando giorno in Itinerario e tornando in Mappa, la mappa si
      **riquadra sul giorno nuovo**.
- [ ] **4.5** Toccando un numero sulla mappa compare la **card informativa sopra
      la pillola**, e la mappa si avvicina a quella tappa.
- [ ] **4.6** Le frecce ‹ › sulla card passano da una tappa all'altra.
- [ ] **4.7** Anche questa card si chiude **trascinandola giù**, e mentre è
      aperta non scorre niente sotto.

## 5. Preferiti (la risposta alla tua domanda)

Il giro completo, che era la cosa che non ti era chiara:

- [ ] **5.1** In Preferiti, il **+** apre il foglio: si scrive il nome, si tocca
      il risultato della ricerca → **posizione e foto arrivano da sole**
      (la foto la cerca su Wikipedia).
- [ ] **5.2** Il preferito salvato compare nella lista, **raggruppato per città**.
- [ ] **5.3** Toccando **"Pianifica"**, l'app propone **solo i giorni dove ci
      sta davvero** — li calcola con lo stesso motore che sposta le tappe, non
      è un elenco a caso. C'è comunque l'opzione manuale per decidere altrimenti.
- [ ] **5.4** Scelto il giorno, il preferito **diventa una tappa vera**: prende
      il suo numero in Itinerario e **compare come pin sulla Mappa**.
- [ ] **5.5** Una tappa aggiunta a mano che non ha foto mostra il segnaposto
      generico, mai un riquadro vuoto.

## 6. Icone

- [ ] **6.1** Tutte le icone dell'app sono della stessa famiglia (Lucide),
      stesso spessore di tratto: niente più icone scombinate fra loro.
- [ ] **6.2** Il **torii** (il portale) è l'icona su misura dell'app.

## 7. Senza rete — la prova importante

Da fare con calma, è quella che conta di più per il viaggio.

- [ ] **7.1** Con l'app aperta e la rete accesa, girare un po' fra le pagine.
- [ ] **7.2** Mettere il telefono in **modalità aereo**.
- [ ] **7.3** **Chiudere del tutto l'app** e riaprirla: deve aprirsi lo stesso,
      con i dati, non una pagina bianca o l'errore di Safari.
- [ ] **7.4** Compare in basso la pillola **"Senza rete — copia salvata"**.
- [ ] **7.5** Itinerario, Mappa (le tessere già viste), Preferiti, Prenotazioni,
      Frasi e Diario funzionano lo stesso.
- [ ] **7.6** Modificare qualcosa senza rete (spuntare una tappa, scrivere sul
      diario), poi **riaccendere la rete**: la modifica deve restare e
      risincronizzarsi da sola.

## 8. Dove sono adesso (GPS)

- [ ] **8.1** In Itinerario, nel pannello della giornata, c'è l'interruttore
      della posizione.
- [ ] **8.2** Accendendolo (e dando il permesso), compare la riga **"Siete a X
      da …, Y min a piedi"**.
- [ ] **8.3** Con la posizione accesa, il ritardo è calcolato **da dove siete
      davvero**, non da dove dice il piano.
- [ ] **8.4** Si può provare anche adesso, da casa, usando **"Prova questa
      giornata a un altro orario"**: non serve aspettare maggio 2027.
- [ ] **8.5** Spegnendolo, la riga sparisce e il telefono smette di seguire la
      posizione (è un interruttore apposta: consuma batteria).

## 9. Prenotazioni (tab Altro)

- [ ] **9.1** Il **+** in alto crea una prenotazione: tipo (volo, hotel, treno,
      attività, altro), cosa, codice, data, ora, dove, note.
- [ ] **9.2** Il **codice** si vede grande, in carattere a larghezza fissa, e si
      **copia con un tocco** (serve al banco del check-in, di fretta).
- [ ] **9.3** L'indirizzo si può scrivere anche in **giapponese**, da mostrare a
      un tassista.
- [ ] **9.4** La data si legge in italiano ("Mer 5 mag · 14:55").
- [ ] **9.5** Toccando una prenotazione si riapre per modificarla; si elimina dal
      foglio.

## 10. Cerca (nuovo)

- [ ] **10.1** La **lente** in alto (in Home e in Itinerario) adesso funziona:
      prima non faceva niente.
- [ ] **10.2** Scrivendo due lettere cerca **insieme** fra tappe, preferiti e
      prenotazioni, con i risultati raggruppati.
- [ ] **10.3** Toccando una tappa trovata, l'app **va al giorno giusto e apre
      quella tappa**. (Era il problema del "dove l'avevamo messo?" senza dover
      girare quattordici giorni.)
- [ ] **10.4** Cercando un **codice di prenotazione** lo trova.
- [ ] **10.5** Se non trova niente lo dice, non resta vuota.

## 11. Frasi in giapponese (nuovo — Altro › In viaggio)

- [ ] **11.1** Ci sono **66 frasi** divise per situazione: le sei essenziali,
      presentarsi, ristorante, allergie, muoversi, hotel e ryokan, comprare,
      emergenze, numeri.
- [ ] **11.2** Ogni frase ha tre righe: **giapponese grande** (da far leggere
      girando lo schermo), lettura in caratteri latini (da provare a dire),
      italiano.
- [ ] **11.3** La ricerca in cima filtra ("conto", "bagno", "allergia").
- [ ] **11.4** Funziona **in aereo**: sono dentro l'app, non su un traduttore.

## 12. Yen ed euro (nuovo — Altro › In viaggio)

- [ ] **12.1** Si scrive in yen → esce l'euro; si scrive in euro → escono gli yen.
- [ ] **12.2** Sotto c'è la tabella a colpo d'occhio (100, 500, 1.000, 3.000,
      5.000, 10.000 ¥).
- [ ] **12.3** C'è scritto **di quando è il cambio**: si aggiorna da solo quando
      c'è rete e si tiene da parte per quando non c'è.
- [ ] **12.4** In modalità aereo dà comunque un numero (l'ultimo cambio
      salvato), non un trattino.
- [ ] **12.5** La riga in Altro mostra il cambio del giorno senza dover aprire.

## 13. Diario (nuovo — Altro › In viaggio)

- [ ] **13.1** Una riga per ognuno dei **14 giorni**; si apre solo quella che si
      tocca.
- [ ] **13.2** Aprendo il diario, il **giorno di oggi si apre da solo**.
- [ ] **13.3** Si scrive nel riquadro e **si salva da solo**, senza tasto Salva.
- [ ] **13.4** Si può dare un voto alla giornata (Bella / Bellissima / Da
      ricordare) e si può togliere ritoccandolo.
- [ ] **13.5** Chiudendo e riaprendo l'app, quello che si è scritto **è ancora
      lì** (anche da un altro telefono: passa da Firestore).
- [ ] **13.6** La riga in Altro conta le giornate scritte.

## 14. Idee per città (nuovo — Preferiti › bussola in alto)

Questa è la risposta a "e nei pomeriggi liberi cosa facciamo?".

- [ ] **14.1** In Preferiti, in alto a sinistra del **+**, c'è la **bussola**:
      la apre.
- [ ] **14.2** Le pillole in cima sono le **città del viaggio, nell'ordine in
      cui le incontriamo**, e parte già da quella del giorno.
- [ ] **14.3** Ogni idea dice **perché** (in una riga, concreta), **quando**
      andarci e **quanto dura**; se c'è da prenotare o da pagare, lo dice.
- [ ] **14.4** Toccando il **cuore**, l'idea diventa un **preferito vero**, con
      posizione e foto: quindi è già pronta per la Mappa.
- [ ] **14.5** L'idea salvata resta **segnata con la spunta arancione**, così
      non si salva due volte.
- [ ] **14.6** Dal preferito, **"Pianifica"** funziona come sempre: propone i
      giorni dove ci sta davvero.
- [ ] **14.7** Su **Kanazawa** e **Osaka** c'è l'avviso che quei due giorni sono
      lunedì (musei chiusi); su **Miyajima** c'è la tassa d'ingresso da 100 ¥.

**Sono 40 idee, controllate una per una su fonti vere il 7 settembre 2026** —
orari, giorni di chiusura, prenotazioni, prezzi, e se il posto esiste ancora.
Due sono state scartate proprio per questo: la crociera GINGA di Hiroshima (sta
chiudendo) e lo spettacolo di kagura (va solo il mercoledì, e a Hiroshima ci
siamo di venerdì). Vanno **ricontrollate nei mesi prima di partire**: per il
2027 alcuni calendari non erano ancora usciti (le partite dei Carp, la stagione
del bar sul tetto della Orizuru Tower, le mostre del Nezu).

## 15. La striscia della giornata (nuovo — Itinerario)

- [ ] **15.1** In alto a destra, accanto al nome della città, ci sono **due
      tastini**: lista e striscia. Il secondo cambia vista.
- [ ] **15.2** Nella striscia i blocchi sono **alti in proporzione al tempo**:
      due ore di tempio sono alte il doppio di un'ora di pranzo. È tutto il
      punto — se non è così, dimmelo subito.
- [ ] **15.3** A sinistra c'è il **righello delle ore**, e le tappe stanno
      davvero all'altezza della loro ora.
- [ ] **15.4** Fra una tappa e l'altra si vedono gli **spostamenti**
      (tratteggiati, con l'icona del mezzo) e i **buchi liberi** ("1h 20min
      liberi").
- [ ] **15.5** Se una tappa **non ce la fa** prima della chiusura, il blocco è
      segnato in arancione/rosso con scritto perché.
- [ ] **15.6** Toccando un blocco si apre la tappa, come dalla lista.
- [ ] **15.7** La scelta lista/striscia **resta** anche chiudendo e riaprendo
      l'app.
- [ ] **15.8** Prova a guardare un giorno pieno (il 7, il 9, il 13): è lì che
      si capisce se serve davvero.

## 16. Modalità cammino (nuovo — Itinerario)

- [ ] **16.1** Sopra la lista c'è il tasto nero **"Modalità cammino"**.
- [ ] **16.2** Si apre a **schermo intero**: una tappa sola, grande, con la
      zona sotto.
- [ ] **16.3** Dice **a che ora ci arrivate** e se siete in orario, in ritardo
      o in anticipo. Se la tappa chiude prima che arriviate, lo dice chiaro.
- [ ] **16.4** Con la **posizione accesa** compare la distanza in grande e i
      minuti a piedi. Se è spenta, c'è il link per accenderla.
- [ ] **16.5** **"Portami lì"** apre le mappe del telefono con il percorso a
      piedi già impostato.
- [ ] **16.6** **"Fatta, avanti"** segna la tappa e passa subito alla
      successiva, senza uscire.
- [ ] **16.7** In fondo c'è **"poi: ..."** con la tappa dopo.
- [ ] **16.8** Si chiude **tirandola giù** con il dito, oltre che con la ✕.
- [ ] **16.9** Funziona **anche oggi**, su un giorno qualsiasi del viaggio: non
      serve aspettare maggio 2027. (Lezione già pagata col tasto della
      posizione.)
- [ ] **16.10** Quando tutte le tappe sono fatte dice **"Giornata finita"**.

---

## Cose che ho corretto perché si erano rotte (le stesse prove le fa già la macchina)

Le lascio qui scritte perché se una di queste ricompare vuol dire che ho rotto
qualcosa di nuovo:

- Il service worker **non si registrava** quando non c'era rete → l'app non si
  apriva in aereo. Trovato dalla prova automatica, non leggendo il codice.
- Il tasto della posizione era **irraggiungibile fino a maggio 2027** perché
  compariva solo "oggi". Ora si prova anche dal divano.
- La pillola delle pagine spariva sotto la mappa (Leaflet disegna a un livello
  altissimo).
- Il campo "Orario di arrivo" era tagliato: iOS dà una larghezza sua ai campi
  ora, che vinceva sul `width:100%`.
- Il colpetto aptico che non si sentiva: Apple ha **chiuso** in iOS 26.5 la
  strada che avevo usato; ora è un interruttore vero, invisibile.
- Il meteo e il cambio venivano serviti **dalla cache** invece che dalla rete
  (previsione di ieri data per oggi). Corretto il 7/09.

## La prova automatica

`node _tools/prova.js` — **84 verifiche**, tutte superate al momento della
consegna. Apre l'app vera in un browser e ci si comporta come un dito: cambia
le cinque pagine, apre e trascina i fogli, salva un preferito e una
prenotazione, salva un'idea e la pianifica, scrive sul diario, converte gli
yen, accende la posizione, spegne la rete. Si lancia prima di ogni pubblicazione.
